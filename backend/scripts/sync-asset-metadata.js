/**
 * Sync audio metadata from FUGA for all catalog assets.
 * Updates: sampleRate, bitDepth, audioFormat, fileSize, channels,
 *          previewStart, previewLength, discNumber, volume, parentalAdvisory
 */
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n🚀 Asset Metadata Sync (dryRun=${DRY_RUN})\n`);

  // Login FUGA
  const loginRes = await fetch('https://login.n3rvemusic.com/api/v2/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'ryansong', password: '***REDACTED***' }),
  });
  const sid = loginRes.headers.get('set-cookie').split(';')[0];
  console.log('✅ FUGA login OK\n');

  // Get all catalog products with their FUGA IDs
  const products = await prisma.catalogProduct.findMany({
    select: { id: true, fugaId: true, name: true },
  });
  console.log(`📊 ${products.length} products\n`);

  const results = { updated: 0, assetsUpdated: 0, errors: [] };

  for (const product of products) {
    const fugaId = product.fugaId?.toString();
    if (!fugaId) continue;

    try {
      const res = await fetch(`https://login.n3rvemusic.com/api/v2/products/${fugaId}/assets`, {
        headers: { Cookie: sid },
      });
      if (res.status !== 200) continue;
      const raw = await res.json();
      const fugaAssets = raw.asset || raw.assets || raw;
      if (!Array.isArray(fugaAssets)) continue;

      // Get our DB assets for this product
      const dbAssets = await prisma.catalogAsset.findMany({
        where: { productId: product.id },
        select: { id: true, isrc: true, sequence: true, name: true },
      });

      for (const fa of fugaAssets) {
        // Match by ISRC or sequence
        const dbAsset = dbAssets.find(d => d.isrc === fa.isrc) ||
                        dbAssets.find(d => d.sequence === fa.sequence);
        if (!dbAsset) continue;

        const audioData = fa.audio || {};
        const updates = {};

        // Audio metadata → stored in `audio` Json field
        const audioJson = {
          sampleRate: audioData.sampling_rate || null,
          bitDepth: audioData.bit_depth || null,
          format: audioData.mime_type || null,
          fileSize: audioData.file_size || null,
          channels: audioData.number_of_channels || null,
          stereo: (audioData.number_of_channels || 0) >= 2,
          originalFilename: audioData.original_filename || null,
        };
        updates.audio = audioJson;

        // Preview length
        if (fa.preview_length != null) updates.previewLength = fa.preview_length;

        // Sequence (disc_number not in schema, use sequence; volume via extraFields)
        if (fa.volume) updates.extraFields = { ...(updates.extraFields || {}), volume: fa.volume, discNumber: fa.disc_number || 1, previewStart: fa.preview_start };

        // Parental advisory
        if (fa.parental_advisory != null) updates.parentalAdvisory = fa.parental_advisory;

        if (Object.keys(updates).length > 0 && !DRY_RUN) {
          try {
            await prisma.catalogAsset.update({
              where: { id: dbAsset.id },
              data: updates,
            });
            results.assetsUpdated++;
          } catch (ue) {
            console.log('  ❌ Update failed:', dbAsset.name || dbAsset.isrc, ue.message.substring(0, 150));
            results.errors.push(`${dbAsset.isrc}: ${ue.message.substring(0, 100)}`);
          }
        }

        if (DRY_RUN && Object.keys(updates).length > 0) {
          results.assetsUpdated++;
        }
      }

      results.updated++;
      if (results.updated % 20 === 0) {
        console.log(`  📦 ${results.updated} products, ${results.assetsUpdated} assets updated...`);
      }
    } catch (e) {
      results.errors.push(`${product.name}: ${e.message}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Products processed: ${results.updated}`);
  console.log(`🎵 Assets updated: ${results.assetsUpdated}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
