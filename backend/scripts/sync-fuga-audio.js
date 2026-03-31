/**
 * Sync audio files from FUGA → Dropbox n3rve-submissions.
 * For albums that don't exist in B2B.
 * Uses chunked upload for large files (>150MB).
 * B2B files are NEVER touched.
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
const TEMP_DIR = '/tmp/n3rve-fuga-audio';
const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks

let dbxApp;

async function main() {
  console.log(`\n🚀 FUGA Audio Sync (dryRun=${DRY_RUN})\n`);
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  dbxApp = await getAppDropbox();
  console.log('✅ Dropbox token refreshed');

  // Login to FUGA (with 2FA TOTP support)
  const loginRes = await fetch('https://next.fugamusic.com/api/v2/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: process.env.FUGA_USERNAME || 'ryansong', password: process.env.FUGA_PASSWORD }),
  });
  let sid = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
  const loginData = await loginRes.json().catch(() => ({}));

  // Handle 2FA if enabled
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

  // Get submissions
  const submissions = await prisma.submission.findMany({
    select: { id: true, albumTitle: true, labelName: true, release: true, files: true },
  });

  // Get catalog for FUGA IDs
  const catalog = await prisma.catalogProduct.findMany({
    select: { fugaId: true, upc: true },
  });
  const upcToFuga = {};
  for (const c of catalog) upcToFuga[c.upc] = c.fugaId.toString();

  const results = { synced: 0, tracksUploaded: 0, skipped: 0, errors: [] };

  for (const sub of submissions) {
    const release = sub.release || {};
    const upc = release.upc || '';
    const fugaId = upcToFuga[upc];
    if (!fugaId) continue;

    // Check if already has music
    const dateStr = formatDate(release.releaseDate || release.consumerReleaseDate || '');
    const safeName = (sub.albumTitle || '').replace(/[/\\:*?"<>|]/g, '_');
    const releasePath = `/n3rve-submissions/${sub.labelName}/Releases/${dateStr}_${safeName}_${upc}`;

    let existingMusicCount = 0;
    try {
      const mf = await dbxApp.filesListFolder({ path: `${releasePath}/Music`, recursive: false });
      existingMusicCount = mf.result.entries.filter(e => e['.tag'] === 'file' && /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i.test(e.name)).length;
    } catch {}

    // Get expected asset count from FUGA catalog
    const catalogProduct = await prisma.catalogProduct.findFirst({
      where: { upc },
      select: { id: true },
    });
    const expectedAssetCount = catalogProduct
      ? await prisma.catalogAsset.count({ where: { productId: catalogProduct.id } })
      : 0;

    // Skip if already has correct number of audio files AND DB audioFiles is populated
    const currentAudioFiles = sub.files?.audioFiles || [];
    if (existingMusicCount > 0 && existingMusicCount >= expectedAssetCount && currentAudioFiles.length >= expectedAssetCount) {
      results.skipped++;
      continue;
    }

    // If mismatch, we'll re-sync (download missing/correct files)
    if (existingMusicCount > 0 && existingMusicCount !== expectedAssetCount) {
      console.log(`  ⚠️  Mismatch: ${existingMusicCount} files in Dropbox vs ${expectedAssetCount} FUGA assets — re-syncing`);
    }

    // Get tracks from FUGA
    let assets;
    try {
      const res = await fetch(`https://next.fugamusic.com/api/v2/products/${fugaId}/assets`, {
        headers: { Cookie: sid },
      });
      const raw = await res.json();
      assets = Array.isArray(raw) ? raw : (raw.asset || raw.assets || []);
      if (!Array.isArray(assets) || assets.length === 0) continue;
    } catch { continue; }

    if (assets.length === 0) continue;

    console.log(`\n📁 ${sub.albumTitle} (${sub.labelName}) — ${assets.length} tracks`);

    if (DRY_RUN) {
      for (const a of assets) {
        const audio = a.audio || {};
        console.log(`  🎵 ${a.name} — ${audio.original_filename} (${(audio.file_size / 1024 / 1024).toFixed(1)}MB)`);
      }
      results.synced++;
      continue;
    }

    // Ensure Music folder
    try { await dbxApp.filesCreateFolderV2({ path: `${releasePath}/Music`, autorename: false }); } catch {}

    // Download and upload each track
    for (const asset of assets) {
      const audio = asset.audio || {};
      if (!audio.id) continue;

      const fileName = audio.original_filename || `${asset.name}.wav`;
      const safeFileName = fileName.replace(/[/\\]/g, '_');
      const targetPath = `${releasePath}/Music/${safeFileName}`;

      // Check if already exists
      try {
        await dbxApp.filesGetMetadata({ path: targetPath });
        continue;
      } catch {}

      console.log(`  ⬇️  ${safeFileName} (${(audio.file_size / 1024 / 1024).toFixed(1)}MB)`);

      const localPath = path.join(TEMP_DIR, safeFileName);
      try {
        // Download from FUGA
        const dlRes = await fetch(`https://next.fugamusic.com/ui-only/v2/assets/${asset.id}/audio`, {
          headers: { Cookie: sid },
        });

        if (dlRes.status !== 200) {
          results.errors.push(`${safeFileName}: FUGA HTTP ${dlRes.status}`);
          continue;
        }

        const buf = Buffer.from(await dlRes.arrayBuffer());
        fs.writeFileSync(localPath, buf);

        // Upload to Dropbox (chunked if > 150MB)
        if (buf.length > CHUNK_SIZE) {
          await chunkedUpload(localPath, targetPath, buf.length);
        } else {
          await dbxApp.filesUpload({ path: targetPath, contents: buf, mode: { '.tag': 'add' }, autorename: false, mute: true });
        }

        results.tracksUploaded++;
        console.log(`  ✅ ${safeFileName}`);
      } catch (e) {
        results.errors.push(`${safeFileName}: ${e.message}`);
        console.error(`  ❌ ${safeFileName}: ${e.message}`);
      } finally {
        try { if (fs.existsSync(localPath)) fs.unlinkSync(localPath); } catch {}
      }
    }

    // Also update audioFiles in DB with Dropbox URLs
    try {
      const musicFiles = await dbxApp.filesListFolder({ path: `${releasePath}/Music`, recursive: false });
      const audioFileEntries = [];
      for (const f of musicFiles.result.entries.filter(e => e['.tag'] === 'file')) {
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
      }
    } catch (e) {
      results.errors.push(`DB update ${sub.albumTitle}: ${e.message}`);
    }

    results.synced++;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Albums synced: ${results.synced}`);
  console.log(`🎵 Tracks uploaded: ${results.tracksUploaded}`);
  console.log(`⏭️  Already has music: ${results.skipped}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.slice(0, 15).forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

async function chunkedUpload(localPath, targetPath, fileSize) {
  const file = fs.readFileSync(localPath);
  let offset = 0;

  // Start session
  const startRes = await dbxApp.filesUploadSessionStart({
    close: false,
    contents: file.slice(0, CHUNK_SIZE),
  });
  const sessionId = startRes.result.session_id;
  offset = CHUNK_SIZE;

  // Append chunks
  while (offset < fileSize - CHUNK_SIZE) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    await dbxApp.filesUploadSessionAppendV2({
      cursor: { session_id: sessionId, offset },
      close: false,
      contents: chunk,
    });
    offset += chunk.length;
  }

  // Finish
  const lastChunk = file.slice(offset);
  await dbxApp.filesUploadSessionFinish({
    cursor: { session_id: sessionId, offset },
    commit: { path: targetPath, mode: { '.tag': 'add' }, autorename: false, mute: true },
    contents: lastChunk,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return 'unknown';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'unknown';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch { return 'unknown'; }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
