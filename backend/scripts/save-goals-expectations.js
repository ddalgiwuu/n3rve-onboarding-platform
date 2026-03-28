/**
 * Save Goals & Expectations data from FUGA Score to matching submissions.
 * Data was manually collected from fugascore.softr.app for Priority 5 projects.
 * Maps by FUGA Project ID → CatalogProduct → Submission.
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

const goalsData = [
  {
    projectName: 'MINE (SWEET REVENGE)',
    fugaProjectId: '1007574827114',
    upc: '8721465716344',
    goals: [
      {
        goalType: 'Increase monthly listeners by X%',
        goalDetails: '500%',
        strategy: 'Push marketing on TikTok and Instagram to increase visibility and drive streams.',
        howWeCanHelp: 'Playlist placement and editorial support on Spotify and Apple Music.',
        confidence: '10%',
      },
      {
        goalType: 'Target a DSP specific marketing opportunity',
        goalDetails: 'TikTok',
        strategy: 'Create viral short-form content around the track to drive discovery.',
        howWeCanHelp: 'Feature support and promotional tools on TikTok.',
        confidence: '10%',
      },
      {
        goalType: 'Target a DSP specific marketing opportunity',
        goalDetails: 'Spotify',
        strategy: 'Drive playlist adds and algorithmic discovery through pre-save campaigns.',
        howWeCanHelp: 'Editorial playlist consideration and Release Radar boost.',
        confidence: '10%',
      },
    ],
  },
  {
    projectName: 'Warheart (Lineage2M Original Soundtrack)',
    fugaProjectId: '1007292906882',
    upc: '194491952105',
    goals: [
      {
        goalType: 'Increase monthly listeners by X%',
        goalDetails: '5000%',
        strategy: 'Push Tiktok viralness to increase views.',
        howWeCanHelp: 'tailored made planned',
        confidence: '10%',
      },
      {
        goalType: 'Target a DSP specific marketing opportunity',
        goalDetails: 'TikTok',
        strategy: 'Song is viral. 5 Million views in the past 7 days, 28 Million views in the past month.',
        howWeCanHelp: 'We need marketing and tailored support for this release.',
        confidence: '10%',
      },
      {
        goalType: 'Target a DSP specific marketing opportunity',
        goalDetails: 'Spotify',
        strategy: 'song is going viral on Tiktok. We want to position it to lead to Spotify.',
        howWeCanHelp: 'Please help us on TikTok promotion and link to Spotify.',
        confidence: '10%',
      },
    ],
  },
  {
    projectName: 'The Echoes of Eternity (AION2 Original Soundtrack)',
    fugaProjectId: '1006293129542',
    upc: '8721416715709',
    goals: [
      {
        goalType: 'Target a DSP specific marketing opportunity',
        goalDetails: 'Securing editorial placement and front-page exposure on major cinematic and game soundtrack playlists across Spotify, Apple Music, and Amazon Music during the AION2 global launch window. Particular focus on Epic Orchestral Scores, Cinematic Soundscapes, and New Game Music playlists to align with the game\'s worldwide release campaign.',
        strategy: 'The album features a collaboration between Grammy Award-winning film composer Simon Franglen (Avatar) and Ryo Kunihiko, the iconic composer of the original AION series. This union bridges global film and game audiences, delivering cinematic orchestral production recorded at AIR Studios London — a perfect fit for high-impact, story-driven playlists that celebrate epic soundtracks and immersive game worlds.',
        howWeCanHelp: 'Support with editorial pitching, homepage visibility, and algorithmic promotion through playlist inclusion and banner highlights. Cross-promotional coordination with NCSoft\'s AION2 game launch campaign, including trailer tie-ins and social media synchronization, would amplify both engagement and streams globally.',
        confidence: '10%',
      },
      {
        goalType: 'Target specific playlist(s)',
        goalDetails: 'Secure placements on editorial + high-follower user-curated playlists: Epic Classical, Modern Classical Soundtracks (3,200 followers), Cinematic Music (1,100 followers), Neoclassical Beauty (3,000 followers), Trailer Music / Cinematic Songs / Orchestral / Electronic / Dark / Epic Music (1,900 followers), Dungeon Synth & Dark Ambient (18,900 followers), Gaming Playlist 2025 (68,000 followers), Gamer Playlist (30,000 followers). Also targeting official editorial playlists such as Epic Orchestral Scores, New Game Music, and Cinematic Soundscapes on Spotify, Apple Music, and other DSPs.',
        strategy: 'Previous features on this playlist? Yes. Leverage the global launch of AION2, cinematic trailer tie-ins, and the composers\' global recognition to boost editorial relevance and algorithmic visibility.',
        howWeCanHelp: '',
        confidence: '10%',
      },
    ],
  },
  {
    projectName: '私の夫と結婚して OST',
    fugaProjectId: '1005182545193',
    upc: '8800304243590',
    goals: [
      {
        goalType: 'Target a DSP specific marketing opportunity',
        goalDetails: 'Aiming for inclusion in prominent J-Pop, K-Drama, and Soundtrack-themed playlists across Japanese DSPs such as AWA, LINE MUSIC, and Re, as well as global editorial opportunities for drama OSTs. This includes New Music Friday equivalents, Anime/Drama highlights, and fan-favorite playlist placements.',
        strategy: 'The project features top-tier artists such as JIHYO (TWICE), WENDY (Red Velvet), and INI (JO1\'s sibling group), who already have a strong fanbase and streaming presence in Japan. The drama itself ranked #1 on Amazon Prime Video Japan, driving strong cross-platform interest. Combined with a rich storyline and local adaptation, the soundtrack has broad cultural and emotional appeal to the target audience.',
        howWeCanHelp: 'Help by flagging the album to regional editorial teams, prioritizing playlist submissions in relevant genres and territory-specific categories. Also, ensuring timely encoding and delivery to maximize pre-release marketing alignment and release-day visibility would be key. Supporting amplification via DSP social promotion or inclusion in email/editorial campaigns would be highly appreciated.',
        confidence: '10%',
      },
      {
        goalType: 'Increase awareness in key markets/territories',
        goalDetails: 'Japan is the primary focus for this release, as the drama Marry My Husband is distributed by Prime Video Japan and features Japanese artists such as INI, who have strong local fanbases. We aim to maximize visibility within Japanese DSPs and among J-Drama and J-Pop fans.',
        strategy: 'We are running a localized social media campaign that includes teaser videos, drama clips, and influencer amplification. In addition, we are actively engaging fan communities and leveraging artist presence (e.g. INI, JIHYO) to build momentum prior to release.',
        howWeCanHelp: 'Playlist consideration on Japan-focused editorial lists, visibility on the front page or recommendation banners, and localization of metadata and artist pages. Support with timely ingestion and fast encoding will also be helpful.',
        confidence: '10%',
      },
    ],
  },
];

async function main() {
  console.log(`\n🎯 Saving Goals & Expectations to DB (dryRun=${DRY_RUN})\n`);

  const results = { matched: 0, updated: 0, noMatch: 0, errors: [] };

  for (const project of goalsData) {
    console.log(`\n📦 ${project.projectName} (FUGA ID: ${project.fugaProjectId})`);

    // Try via CatalogProduct → submissionId first
    let matchedSub = null;
    const catalogProduct = await prisma.catalogProduct.findFirst({
      where: { upc: project.upc },
      select: { submissionId: true },
    });

    if (catalogProduct?.submissionId) {
      matchedSub = await prisma.submission.findUnique({
        where: { id: catalogProduct.submissionId },
        select: { id: true, albumTitle: true, marketing: true },
      });
    }

    // Fallback: search all submissions for UPC match
    if (!matchedSub) {
      const allSubs = await prisma.submission.findMany({
        select: { id: true, albumTitle: true, marketing: true, release: true },
      });
      matchedSub = allSubs.find(s => s.release?.upc === project.upc) || null;
    }

    if (!matchedSub) {
      console.log(`  ⚠️  No match found for UPC ${project.upc}`);
      results.noMatch++;
      continue;
    }

    results.matched++;
    console.log(`  ✅ Matched → ${matchedSub.albumTitle} (${matchedSub.id})`);

    if (!DRY_RUN) {
      try {
        const currentMarketing = matchedSub.marketing || {};
        await prisma.submission.update({
          where: { id: matchedSub.id },
          data: {
            marketing: {
              ...currentMarketing,
              goalsAndExpectations: project.goals,
              goalsAndExpectationsSyncedAt: new Date().toISOString(),
            },
          },
        });
        results.updated++;
        console.log(`  📝 Saved ${project.goals.length} goals`);
      } catch (e) {
        results.errors.push(`${project.projectName}: ${e.message.substring(0, 100)}`);
        console.log(`  ❌ Error: ${e.message.substring(0, 100)}`);
      }
    } else {
      console.log(`  🔍 Would save ${project.goals.length} goals (dry run)`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Matched: ${results.matched}`);
  console.log(`📝 Updated: ${results.updated}`);
  console.log(`⚠️  No match: ${results.noMatch}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  if (results.errors.length) results.errors.forEach(e => console.log(`  - ${e}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
