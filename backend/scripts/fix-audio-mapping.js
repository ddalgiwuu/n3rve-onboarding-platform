/**
 * Fix audio file mapping in DB.
 *
 * For each submission:
 * 1. List Dropbox Music folder files
 * 2. Match files to FUGA assets by sequence order
 * 3. Create shared links
 * 4. Update DB audioFiles (ordered by FUGA sequence)
 *
 * For albums where Dropbox has no files, download from FUGA first.
 */
const { Dropbox } = require('dropbox');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { getAppDropbox } = require('./dropbox-auth');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_MISSING = process.argv.includes('--only-missing');
const TEMP_DIR = '/tmp/n3rve-fuga-audio';
const CHUNK_SIZE = 100 * 1024 * 1024;

let dbxApp;
let sid; // FUGA session

async function loginFuga() {
  const loginRes = await fetch('https://next.fugamusic.com/api/v2/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: process.env.FUGA_USERNAME || 'ryansong', password: process.env.FUGA_PASSWORD }),
  });
  sid = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  const loginData = await loginRes.json().catch(() => ({}));

  if (loginData?.user?.is_two_factor_authentication_enabled) {
    const totpSecret = process.env.FUGA_TOTP_SECRET;
    if (!totpSecret) throw new Error('FUGA 2FA enabled but FUGA_TOTP_SECRET not set');
    const { TOTP } = require('totp-generator');
    const { otp } = await TOTP.generate(totpSecret);
    console.log('🔐 Submitting 2FA code...');
    const tfaRes = await fetch('https://next.fugamusic.com/api/v2/login/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sid },
      body: JSON.stringify({ totp: otp }),
    });
    if (tfaRes.status !== 200) throw new Error('FUGA 2FA failed: ' + await tfaRes.text());
    const tfaCookies = tfaRes.headers.get('set-cookie');
    if (tfaCookies) sid = tfaCookies.split(';')[0];
  }
  console.log('✅ FUGA login OK\n');
}

async function main() {
  console.log(`\n🔧 Audio Mapping Fix (dryRun=${DRY_RUN}, onlyMissing=${ONLY_MISSING})\n`);
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  dbxApp = await getAppDropbox();
  console.log('✅ Dropbox token refreshed');

  await loginFuga();

  // Get all submissions with catalog data
  const submissions = await prisma.submission.findMany({
    select: { id: true, albumTitle: true, labelName: true, release: true, files: true },
  });

  const catalog = await prisma.catalogProduct.findMany({
    select: { id: true, fugaId: true, upc: true },
  });
  const upcToProduct = {};
  for (const c of catalog) upcToProduct[c.upc] = c;

  const results = { fixed: 0, downloaded: 0, skipped: 0, errors: [] };

  for (const sub of submissions) {
    const upc = sub.release?.upc || '';
    const product = upcToProduct[upc];
    if (!product) continue;

    const assetCount = await prisma.catalogAsset.count({ where: { productId: product.id } });
    const currentAudioFiles = sub.files?.audioFiles || [];

    // Skip if already perfectly matched
    if (currentAudioFiles.length === assetCount && assetCount > 0) {
      results.skipped++;
      continue;
    }

    // Skip non-missing if --only-missing
    if (ONLY_MISSING && currentAudioFiles.length > 0) {
      results.skipped++;
      continue;
    }

    const dateStr = formatDate(sub.release?.releaseDate || sub.release?.consumerReleaseDate || '');
    const safeName = (sub.albumTitle || '').replace(/[/\\:*?"<>|]/g, '_');
    const releasePath = `/n3rve-submissions/${sub.labelName}/Releases/${dateStr}_${safeName}_${upc}`;

    console.log(`\n📁 ${sub.albumTitle} (audio:${currentAudioFiles.length} assets:${assetCount})`);

    // Get FUGA assets for sequence ordering
    let fugaAssets = [];
    try {
      const res = await fetch(`https://next.fugamusic.com/api/v2/products/${product.fugaId}/assets`, {
        headers: { Cookie: sid },
      });
      const raw = await res.json();
      fugaAssets = Array.isArray(raw) ? raw : (raw.asset || raw.assets || []);
    } catch (e) {
      console.log(`  ⚠️  Could not fetch FUGA assets: ${e.message}`);
    }

    // Check Dropbox Music folder
    let dropboxFiles = [];
    try {
      const mf = await dbxApp.filesListFolder({ path: `${releasePath}/Music`, recursive: false });
      dropboxFiles = mf.result.entries.filter(e => e['.tag'] === 'file' && /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i.test(e.name));
    } catch {}

    const audioFileCount = dropboxFiles.length;
    console.log(`  Dropbox: ${audioFileCount} files, FUGA: ${fugaAssets.length} assets`);

    // If no Dropbox files, download from FUGA
    if (audioFileCount === 0 && fugaAssets.length > 0) {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would download ${fugaAssets.length} tracks from FUGA`);
        results.fixed++;
        continue;
      }

      console.log(`  ⬇️  Downloading ${fugaAssets.length} tracks from FUGA...`);
      try { await dbxApp.filesCreateFolderV2({ path: `${releasePath}/Music`, autorename: false }); } catch {}

      for (const asset of fugaAssets) {
        const audio = asset.audio || {};
        if (!audio.id) continue;
        const fileName = audio.original_filename || `${asset.name}.wav`;
        const safeFileName = fileName.replace(/[/\\]/g, '_');
        const targetPath = `${releasePath}/Music/${safeFileName}`;

        // Check if exists
        try { await dbxApp.filesGetMetadata({ path: targetPath }); continue; } catch {}

        const localPath = path.join(TEMP_DIR, safeFileName);
        try {
          const dlRes = await fetch(`https://next.fugamusic.com/ui-only/v2/assets/${asset.id}/audio`, {
            headers: { Cookie: sid },
          });
          if (dlRes.status !== 200) {
            results.errors.push(`${safeFileName}: FUGA HTTP ${dlRes.status}`);
            continue;
          }
          const buf = Buffer.from(await dlRes.arrayBuffer());
          fs.writeFileSync(localPath, buf);

          if (buf.length > CHUNK_SIZE) {
            await chunkedUpload(localPath, targetPath, buf.length);
          } else {
            await dbxApp.filesUpload({ path: targetPath, contents: buf, mode: { '.tag': 'add' }, autorename: false, mute: true });
          }
          console.log(`    ✅ ${safeFileName}`);
          results.downloaded++;
        } catch (e) {
          results.errors.push(`${safeFileName}: ${e.message}`);
          console.error(`    ❌ ${safeFileName}: ${e.message}`);
        } finally {
          try { if (fs.existsSync(localPath)) fs.unlinkSync(localPath); } catch {}
        }
      }

      // Re-list after download
      try {
        const mf = await dbxApp.filesListFolder({ path: `${releasePath}/Music`, recursive: false });
        dropboxFiles = mf.result.entries.filter(e => e['.tag'] === 'file' && /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i.test(e.name));
      } catch {}
    }

    // Now update DB audioFiles from Dropbox
    if (dropboxFiles.length === 0) {
      console.log(`  ⚠️  No Dropbox files to map`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would update DB with ${dropboxFiles.length} audio files`);
      results.fixed++;
      continue;
    }

    // Sort files to match FUGA sequence order
    const orderedFiles = orderByFugaSequence(dropboxFiles, fugaAssets);

    // Create shared links and build audioFiles array
    const audioFileEntries = [];
    for (const f of orderedFiles) {
      let url;
      try {
        const res = await dbxApp.sharingCreateSharedLinkWithSettings({ path: f.path_display });
        url = res.result.url;
      } catch (e) {
        if (e?.error?.error?.['.tag'] === 'shared_link_already_exists') {
          const existing = await dbxApp.sharingListSharedLinks({ path: f.path_display });
          url = existing.result.links[0]?.url;
        }
      }
      if (url) {
        audioFileEntries.push({ dropboxUrl: url, fileName: f.name, fileSize: f.size });
      }
    }

    if (audioFileEntries.length > 0) {
      const currentFiles = sub.files || {};
      await prisma.submission.update({
        where: { id: sub.id },
        data: { files: { ...currentFiles, audioFiles: audioFileEntries } },
      });
      console.log(`  ✅ DB updated: ${audioFileEntries.length} audio files (ordered by FUGA sequence)`);
      results.fixed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Fixed: ${results.fixed}`);
  console.log(`⬇️  Downloaded: ${results.downloaded}`);
  console.log(`⏭️  Skipped (already correct): ${results.skipped}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.slice(0, 15).forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

/**
 * Order Dropbox files to match FUGA asset sequence.
 * Matches by: track number prefix, filename similarity, or fallback to alphabetical.
 */
function orderByFugaSequence(dropboxFiles, fugaAssets) {
  if (!fugaAssets || fugaAssets.length === 0) {
    // No FUGA data, sort alphabetically
    return [...dropboxFiles].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Sort FUGA assets by sequence
  const sortedAssets = [...fugaAssets].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const matched = [];
  const unmatched = [...dropboxFiles];

  for (const asset of sortedAssets) {
    const assetName = normalizeForMatch(asset.name || '');
    const audioFilename = normalizeForMatch(asset.audio?.original_filename || '');
    const seq = asset.sequence || 0;

    let bestIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < unmatched.length; i++) {
      const dbxName = normalizeForMatch(unmatched[i].name);
      let score = 0;

      // Exact filename match
      if (audioFilename && dbxName === audioFilename) { score = 100; }
      // Track number prefix match (e.g., "01_" or "01 ")
      else if (seq > 0) {
        const seqStr = String(seq).padStart(2, '0');
        if (dbxName.startsWith(seqStr + '_') || dbxName.startsWith(seqStr + ' ') || dbxName.startsWith(seqStr + '-')) {
          score = 80;
        }
      }
      // Name similarity
      if (score < 80 && assetName && dbxName.includes(assetName)) { score = Math.max(score, 60); }
      if (score < 60 && audioFilename && dbxName.includes(audioFilename.substring(0, 10))) { score = Math.max(score, 40); }

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0 && bestScore > 0) {
      matched.push(unmatched.splice(bestIdx, 1)[0]);
    }
  }

  // Append any unmatched files at the end (sorted)
  unmatched.sort((a, b) => a.name.localeCompare(b.name));
  return [...matched, ...unmatched];
}

function normalizeForMatch(name) {
  return name.toLowerCase()
    .replace(/\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i, '')
    .replace(/[_\-\s]+/g, ' ')
    .trim();
}

function formatDate(dateStr) {
  if (!dateStr) return 'unknown';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'unknown';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch { return 'unknown'; }
}

async function chunkedUpload(localPath, targetPath, fileSize) {
  const file = fs.readFileSync(localPath);
  let offset = 0;
  const startRes = await dbxApp.filesUploadSessionStart({ close: false, contents: file.slice(0, CHUNK_SIZE) });
  const sessionId = startRes.result.session_id;
  offset = CHUNK_SIZE;
  while (offset < fileSize - CHUNK_SIZE) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    await dbxApp.filesUploadSessionAppendV2({ cursor: { session_id: sessionId, offset }, close: false, contents: chunk });
    offset += chunk.length;
  }
  const lastChunk = file.slice(offset);
  await dbxApp.filesUploadSessionFinish({
    cursor: { session_id: sessionId, offset },
    commit: { path: targetPath, mode: { '.tag': 'add' }, autorename: false, mute: true },
    contents: lastChunk,
  });
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
