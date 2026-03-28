/**
 * Sync artist metadata from FUGA: DSP links, biography, genres, labels, etc.
 */
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n🎤 Artist Metadata Sync (dryRun=${DRY_RUN})\n`);

  const loginRes = await fetch('https://login.n3rvemusic.com/api/v2/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'ryansong', password: '***REDACTED***' }),
  });
  const sid = loginRes.headers.get('set-cookie').split(';')[0];
  console.log('✅ FUGA login OK\n');

  const artists = await prisma.catalogArtist.findMany({
    select: { id: true, fugaId: true, name: true, spotifyUrl: true, appleMusicUrl: true, biography: true, labels: true, genres: true },
  });
  console.log(`📊 ${artists.length} artists\n`);

  const results = { updated: 0, dspAdded: 0, errors: [] };

  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    const fugaId = artist.fugaId?.toString();
    if (!fugaId) continue;

    try {
      const res = await fetch(`https://login.n3rvemusic.com/api/v2/artists/${fugaId}`, { headers: { Cookie: sid } });
      if (res.status !== 200) continue;
      const data = await res.json();

      const updates = {};

      // DSP profiles from /identifier endpoint (try both artists and people)
      try {
        let idRes = await fetch(`https://login.n3rvemusic.com/api/v2/artists/${fugaId}/identifier`, { headers: { Cookie: sid } });
        if (idRes.status !== 200) {
          idRes = await fetch(`https://login.n3rvemusic.com/api/v2/people/${fugaId}/identifier`, { headers: { Cookie: sid } });
        }
        if (idRes.status === 200) {
          const identifiers = await idRes.json();
          for (const ident of (Array.isArray(identifiers) ? identifiers : [])) {
            const org = ident.issuingOrganization?.name?.toLowerCase() || '';
            if (org.includes('spotify') && !org.includes('dj') && ident.identifier) {
              const spotId = ident.identifier.replace('spotify:artist:', '');
              updates.spotifyId = spotId;
              updates.spotifyUrl = `https://open.spotify.com/artist/${spotId}`;
              results.dspAdded++;
            }
            if (org.includes('apple') && ident.identifier) {
              updates.appleMusicId = ident.identifier;
              updates.appleMusicUrl = `https://music.apple.com/artist/${ident.identifier}`;
              results.dspAdded++;
            }
          }
        }
      } catch {}

      // Fallback: DSP from artist body
      if (data.spotify_id && !updates.spotifyId) {
        updates.spotifyId = data.spotify_id;
        updates.spotifyUrl = data.spotify_url || `https://open.spotify.com/artist/${data.spotify_id}`;
        results.dspAdded++;
      }
      if (data.apple_music_id && !updates.appleMusicId) {
        updates.appleMusicId = data.apple_music_id;
        updates.appleMusicUrl = data.apple_music_url || `https://music.apple.com/artist/${data.apple_music_id}`;
        results.dspAdded++;
      }

      // Biography
      if (data.biography && !artist.biography) updates.biography = data.biography;

      // Country
      if (data.country_of_origin) updates.countryOfOrigin = data.country_of_origin;

      // Labels
      if (data.labels?.length && (!artist.labels || artist.labels.length === 0)) {
        updates.labels = data.labels.map(l => l.name);
      }

      // Genres
      if (data.genres?.length && (!artist.genres || artist.genres.length === 0)) {
        updates.genres = data.genres.map(g => g.name);
      }
      if (data.subgenres?.length) {
        updates.subgenres = data.subgenres.map(g => g.name);
      }

      // Contact / Booking
      if (data.contact_details) updates.contactDetails = data.contact_details;
      if (data.booking_agent) updates.bookingAgent = data.booking_agent;

      // ISNI / IPN / IPI — also check /people endpoint for contributors
      if (data.isni_code) updates.isni = data.isni_code;
      if (data.ipn) updates.ipn = data.ipn;
      if (data.ipi) updates.ipi = data.ipi;
      if (!data.isni_code && !data.ipn) {
        try {
          const pRes = await fetch(`https://login.n3rvemusic.com/api/v2/people/${fugaId}`, { headers: { Cookie: sid } });
          if (pRes.status === 200) {
            const pData = await pRes.json();
            if (pData.isni_code) updates.isni = pData.isni_code;
            if (pData.ipn) updates.ipn = pData.ipn;
            if (pData.ipi) updates.ipi = pData.ipi;
          }
        } catch {}
      }

      // Translations — fetched from /api/v2/translations?owner_id={fugaId}
      try {
        const trRes = await fetch(`https://login.n3rvemusic.com/api/v2/translations?owner_id=${fugaId}`, { headers: { Cookie: sid } });
        if (trRes.status === 200) {
          const trData = await trRes.json();
          if (Array.isArray(trData) && trData.length > 0) {
            const translations = {};
            for (const tr of trData) {
              if (tr.field === 'name' && tr.language && tr.value) {
                translations[tr.language.toLowerCase()] = tr.value;
              }
            }
            if (Object.keys(translations).length > 0) {
              updates.translations = translations;
            }
          }
        }
      } catch {}

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await prisma.catalogArtist.update({ where: { id: artist.id }, data: updates });
        }
        results.updated++;
      }

      if ((i + 1) % 50 === 0) console.log(`  📦 ${i + 1}/${artists.length} processed...`);
    } catch (e) {
      results.errors.push(`${artist.name}: ${e.message?.substring(0, 100)}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Artists updated: ${results.updated}`);
  console.log(`🔗 DSP links added: ${results.dspAdded}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
