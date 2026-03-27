/**
 * Sync release time + missing cover art from FUGA for all catalog products.
 * Updates: consumerReleaseTime, coverImageUrl (for catalog-only products)
 */
const { Dropbox } = require('dropbox');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const fs = require('fs');
const { getAppDropbox } = require('./dropbox-auth');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const TEMP_DIR = '/tmp/n3rve-fuga-meta';

async function main() {
  console.log(`\n🚀 FUGA Metadata Sync (dryRun=${DRY_RUN})\n`);
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const dbxApp = await getAppDropbox();
  console.log('✅ Dropbox token refreshed');

  // Login to FUGA
  const loginRes = await fetch('https://login.n3rvemusic.com/api/v2/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'ryansong', password: '***REDACTED***' }),
  });
  const sid = loginRes.headers.get('set-cookie').split(';')[0];
  console.log('✅ FUGA login OK\n');

  // Get all catalog products
  const products = await prisma.catalogProduct.findMany({
    select: { id: true, fugaId: true, name: true, upc: true, consumerReleaseDate: true, consumerReleaseTime: true, submissionId: true },
  });
  console.log(`📊 ${products.length} catalog products\n`);

  // Also get submissions for cover art linking
  const submissions = await prisma.submission.findMany({
    select: { id: true, release: true, files: true, albumTitle: true, labelName: true },
  });
  const subByUpc = {};
  for (const s of submissions) {
    const upc = (s.release || {}).upc;
    if (upc) subByUpc[upc] = s;
  }

  const results = { timeUpdated: 0, coverFixed: 0, errors: [] };

  for (const product of products) {
    const fugaId = product.fugaId?.toString();
    if (!fugaId) continue;

    try {
      const res = await fetch(`https://login.n3rvemusic.com/api/v2/products/${fugaId}`, {
        headers: { Cookie: sid },
      });
      if (res.status !== 200) continue;
      const data = await res.json();

      const updates = {};

      // 1. Sync release time
      if (data.consumer_release_time && !product.consumerReleaseTime) {
        updates.consumerReleaseTime = data.consumer_release_time;
      }

      // 2. Fix missing cover art for catalog-only products (no submission link)
      if (!product.submissionId && data.cover_image?.has_uploaded) {
        const sub = subByUpc[product.upc];
        const hasCover = sub && (sub.files || {}).coverImageUrl;

        if (!hasCover) {
          // Download cover from FUGA and upload to Dropbox
          console.log(`  🖼️  ${product.name} — downloading cover from FUGA`);

          if (!DRY_RUN) {
            try {
              const imgRes = await fetch(`https://login.n3rvemusic.com/ui-only/v2/products/${fugaId}/image/full`, {
                headers: { Cookie: sid },
              });
              if (imgRes.status === 200) {
                const buf = Buffer.from(await imgRes.arrayBuffer());
                if (buf.length > 10000) {
                  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
                  const ext = isPng ? 'png' : 'jpg';
                  const fileName = `cover.${ext}`;
                  const localPath = `${TEMP_DIR}/${fugaId}.${ext}`;
                  fs.writeFileSync(localPath, buf);

                  const label = data.label?.name || 'Unknown';
                  const dateStr = data.consumer_release_date ? data.consumer_release_date.split('T')[0] : 'unknown';
                  const safeName = product.name.replace(/[/\\:*?"<>|]/g, '_');
                  const targetPath = `/n3rve-submissions/${label}/Releases/${dateStr}_${safeName}_${product.upc}/Cover Art/${fileName}`;

                  // Upload
                  const parts = targetPath.split('/');
                  for (let i = 2; i < parts.length - 1; i++) {
                    try { await dbxApp.filesCreateFolderV2({ path: parts.slice(0, i + 1).join('/'), autorename: false }); } catch {}
                  }
                  await dbxApp.filesUpload({ path: targetPath, contents: fs.readFileSync(localPath), mode: {'.tag':'overwrite'}, autorename: false, mute: true });

                  // Create shared link
                  let sharedUrl;
                  try {
                    const linkRes = await dbxApp.sharingCreateSharedLinkWithSettings({ path: targetPath });
                    sharedUrl = linkRes.result.url;
                  } catch (e) {
                    if (e?.error?.error?.['.tag'] === 'shared_link_already_exists') {
                      const existing = await dbxApp.sharingListSharedLinks({ path: targetPath });
                      sharedUrl = existing.result.links[0]?.url;
                    }
                  }

                  // Update submission if exists, or create one
                  if (sub && sharedUrl) {
                    await prisma.submission.update({
                      where: { id: sub.id },
                      data: { files: { ...(sub.files || {}), coverImageUrl: sharedUrl } },
                    });
                  }

                  fs.unlinkSync(localPath);
                  results.coverFixed++;
                  console.log(`    ✅ Cover art uploaded for: ${product.name}`);
                }
              }
            } catch (e) {
              results.errors.push(`Cover ${product.name}: ${e.message}`);
            }
          }
        }
      }

      // Apply updates
      if (Object.keys(updates).length > 0 && !DRY_RUN) {
        await prisma.catalogProduct.update({
          where: { id: product.id },
          data: updates,
        });
        if (updates.consumerReleaseTime) {
          results.timeUpdated++;
          console.log(`  ⏰ ${product.name} — time: ${updates.consumerReleaseTime}`);
        }
      } else if (updates.consumerReleaseTime) {
        console.log(`  ⏰ ${product.name} — time: ${updates.consumerReleaseTime} (dry-run)`);
        results.timeUpdated++;
      }
    } catch (e) {
      results.errors.push(`${product.name}: ${e.message}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`⏰ Release times updated: ${results.timeUpdated}`);
  console.log(`🖼️  Cover art fixed: ${results.coverFixed}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
