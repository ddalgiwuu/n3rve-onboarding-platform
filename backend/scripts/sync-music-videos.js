/**
 * Sync music video assets from FUGA into CatalogAsset.
 * FUGA has assets with type "MUSIC_VIDEO" that may be missing from our DB.
 * This script finds all FUGA products with MV assets and adds them.
 */
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n🎬 Music Video Sync (dryRun=${DRY_RUN})\n`);

  const loginRes = await fetch('https://login.n3rvemusic.com/api/v2/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: process.env.FUGA_USERNAME || 'ryansong', password: process.env.FUGA_PASSWORD }),
  });
  const sid = loginRes.headers.get('set-cookie').split(';')[0];
  console.log('✅ FUGA login OK\n');

  const products = await prisma.catalogProduct.findMany({
    select: { id: true, fugaId: true, name: true },
  });
  console.log(`📊 ${products.length} products\n`);

  const results = { mvFound: 0, mvAdded: 0, tracksAdded: 0, errors: [] };

  for (const product of products) {
    const fugaId = product.fugaId?.toString();
    if (!fugaId) continue;

    try {
      const res = await fetch(`https://login.n3rvemusic.com/api/v2/products/${fugaId}/assets`, {
        headers: { Cookie: sid },
      });
      if (res.status !== 200) continue;
      const raw = await res.json();
      const fugaAssets = raw.asset || raw;
      if (!Array.isArray(fugaAssets)) continue;

      // Get existing DB assets for this product
      const dbAssets = await prisma.catalogAsset.findMany({
        where: { productId: product.id },
        select: { isrc: true, fugaId: true },
      });
      const existingIsrcs = new Set(dbAssets.map(a => a.isrc));
      const existingFugaIds = new Set(dbAssets.map(a => a.fugaId?.toString()));

      for (const fa of fugaAssets) {
        // Skip if this exact fugaId already exists for this product
        if (existingFugaIds.has(String(fa.id))) continue;

        // For TRACK type: also skip if ISRC already exists (same track)
        // For MUSIC_VIDEO type: always add (MV can share ISRC with track)
        const isMV = fa.type === 'MUSIC_VIDEO';
        if (!isMV && existingIsrcs.has(fa.isrc)) continue;
        if (isMV) results.mvFound++;

        console.log(`  ${isMV ? '🎬' : '🎵'} ${product.name} → ${fa.name} (${fa.type}) isrc=${fa.isrc}`);

        if (DRY_RUN) continue;

        // Build asset data
        const audioData = fa.audio || {};
        const videoData = fa.video || {};
        const assetData = {
          fugaId: BigInt(fa.id),
          isrc: fa.isrc || null,
          name: fa.name,
          displayArtist: fa.display_artist || null,
          version: fa.asset_version || null,
          duration: fa.duration || null,
          sequence: fa.sequence || 0,
          language: fa.language || null,
          audioLocale: fa.audio_locale || null,
          hasLyrics: !!fa.has_lyrics,
          lyrics: fa.lyrics || null,
          parentalAdvisory: fa.parental_advisory || false,
          previewLength: fa.preview_length || null,
          recordingYear: fa.p_line_year ? String(fa.p_line_year) : null,
          pLineYear: fa.p_line_year ? String(fa.p_line_year) : null,
          pLineText: fa.p_line_text || null,
          availableSeparately: fa.available_separately ?? true,
          allowPreorder: fa.allow_preorder ?? false,
          allowPreorderPreview: fa.allow_preorder_preview ?? false,
          youtubeShortPreview: false,
          productId: product.id,
          audio: audioData.has_uploaded ? {
            sampleRate: audioData.sampling_rate,
            bitDepth: audioData.bit_depth,
            format: audioData.mime_type,
            fileSize: audioData.file_size,
            channels: audioData.number_of_channels,
          } : null,
          extraFields: {
            assetType: fa.type,
            discNumber: fa.disc_number || 1,
            volume: fa.volume || 1,
            previewStart: fa.preview_start,
            ...(videoData.has_uploaded ? {
              video: {
                bitrate: videoData.video_bitrate,
                mimeType: videoData.mime_type,
                filename: videoData.original_filename,
                width: videoData.resolution_width,
                height: videoData.resolution_height,
                vaultHook: videoData.vault_hook,
              }
            } : {}),
          },
          artists: (fa.artists || []).map((a) => ({
            fugaId: BigInt(a.id || Date.now()),
            name: a.name || '',
            primary: a.primary ?? false,
          })),
          contributors: (fa.contributors || []).filter(c => c.person?.name || c.name).map((c) => ({
            personId: BigInt(c.person?.id || Date.now()),
            name: c.person?.name || c.name || 'Unknown',
            roleId: typeof c.role === 'object' ? (c.role?.id || 'UNKNOWN') : (c.role || 'UNKNOWN'),
            role: typeof c.role === 'object' ? (c.role?.name || c.role?.id || 'Unknown') : (c.role || 'Unknown'),
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          await prisma.catalogAsset.create({ data: assetData });
          if (isMV) results.mvAdded++;
          else results.tracksAdded++;
        } catch (e) {
          const errMsg = e?.message || e?.meta?.cause || JSON.stringify(e?.meta) || String(e);
          console.log('    ERR:', errMsg.substring(0, 200));
          results.errors.push(`${fa.name}: ${errMsg.substring(0, 200)}`);
        }
      }
    } catch (e) {
      results.errors.push(`${product.name}: ${e.message.substring(0, 100)}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎬 MVs found: ${results.mvFound}`);
  console.log(`🎬 MVs added: ${results.mvAdded}`);
  console.log(`🎵 Tracks added: ${results.tracksAdded}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
