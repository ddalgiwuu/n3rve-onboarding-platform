/**
 * Sync marketing data from FUGA Score (Softr/Airtable) → N3RVE submissions.
 * Uses Softr internal API with session cookie for authentication.
 * Maps by UPC (Digital Products) to find matching submissions.
 */
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

const SOFTR_APP_ID = 'bf622201-d159-45f9-ad28-b9b2e157ec1a';
const SOFTR_PAGE_ID = '3ddf04c0-43c2-47f0-970f-ccc76734789f';
const PROJECTS_BLOCK = 'a579465c-6667-4896-a127-92fa9b242e72';
const PROJECTS_DS = 'd292b4ec-6904-4110-984f-e49e240bf748';

async function loginToSoftr() {
  // Softr uses email/password login
  const res = await fetch('https://fugascore.softr.app/v1/auth/email-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.FUGA_SCORE_EMAIL || 'ryan@n3rve.com',
      password: process.env.FUGA_SCORE_PASSWORD,
    }),
  });

  // Get session cookie from response
  const cookies = res.headers.raw()['set-cookie'] || [];
  const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');

  if (!sessionCookie) {
    // Try alternate login method
    const res2 = await fetch('https://fugascore.softr.app/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.FUGA_SCORE_EMAIL || 'ryan@n3rve.com',
        password: process.env.FUGA_SCORE_PASSWORD,
      }),
    });
    const cookies2 = res2.headers.raw()['set-cookie'] || [];
    return cookies2.map(c => c.split(';')[0]).join('; ');
  }

  return sessionCookie;
}

async function fetchProjects(cookie) {
  const url = `https://fugascore.softr.app/v1/datasource/applications/${SOFTR_APP_ID}/pages/${SOFTR_PAGE_ID}/blocks/${PROJECTS_BLOCK}/datasources/${PROJECTS_DS}/records`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({}),
  });

  const data = await res.json();
  return data.items || [];
}

async function main() {
  console.log(`\n📊 FUGA Score Marketing Sync (dryRun=${DRY_RUN})\n`);

  // Try login or use provided cookie
  let cookie = process.env.FUGA_SCORE_COOKIE || '';
  if (!cookie) {
    try {
      cookie = await loginToSoftr();
      console.log('✅ Softr login OK');
    } catch (e) {
      console.log('⚠️  Softr login failed, trying without cookie...');
    }
  }

  // Fetch all release projects
  const projects = await fetchProjects(cookie);
  console.log(`📦 ${projects.length} release projects found\n`);

  if (projects.length === 0) {
    console.log('No projects found. You may need to provide FUGA_SCORE_COOKIE env var.');
    console.log('Get it from browser: document.cookie on fugascore.softr.app');
    return;
  }

  // Get all submissions for UPC matching
  const submissions = await prisma.submission.findMany({
    select: { id: true, albumTitle: true, labelName: true, release: true, marketing: true },
  });

  const results = { matched: 0, updated: 0, noMatch: 0, errors: [] };

  for (const project of projects) {
    const f = project.fields || {};
    const projectName = f['Project Name'] || '';
    const artistName = f['Artist Name'] || '';
    const label = f['Label'] || '';
    const upcs = f['Product UPCs - Unique'] || f['Digital Products'] || '';

    // Find matching submission by UPC or by name+label
    const upcList = typeof upcs === 'string' ? upcs.split(',').map(u => u.trim()) :
                    Array.isArray(upcs) ? upcs : [];

    let matchedSub = null;

    // Try UPC match first
    for (const upc of upcList) {
      if (!upc) continue;
      matchedSub = submissions.find(s => {
        const subUpc = (s.release || {}).upc;
        return subUpc === upc;
      });
      if (matchedSub) break;
    }

    // Fallback: name + label match
    if (!matchedSub) {
      matchedSub = submissions.find(s => {
        const nameMatch = s.albumTitle?.toLowerCase() === projectName.toLowerCase();
        const labelMatch = s.labelName?.toLowerCase().includes(label.toLowerCase()) ||
                          label.toLowerCase().includes(s.labelName?.toLowerCase() || '');
        return nameMatch && labelMatch;
      });
    }

    if (!matchedSub) {
      results.noMatch++;
      console.log(`  ⚠️  No match: ${artistName} - ${projectName} (${label})`);
      continue;
    }

    results.matched++;

    // Build marketing data from FUGA Score
    const marketingUpdate = {};

    if (f['Elevator Pitch']) marketingUpdate.mainPitch = f['Elevator Pitch'];
    if (f['Social Media Rollout Plan']) marketingUpdate.socialMediaPlan = f['Social Media Rollout Plan'];
    if (f['Marketing Spend']) marketingUpdate.marketingSpend = f['Marketing Spend'];
    if (f['Priority Level']) marketingUpdate.priorityLevel = f['Priority Level'];
    if (f['Main Genre']) marketingUpdate.genre = f['Main Genre'];
    if (f['Subgenre(s)']) marketingUpdate.subgenres = f['Subgenre(s)'];
    if (f['Mood(s)']) {
      marketingUpdate.moods = Array.isArray(f['Mood(s)']) ? f['Mood(s)'] :
                              typeof f['Mood(s)'] === 'string' ? f['Mood(s)'].split(',').map(m => m.trim()) : [];
    }
    if (f['Instruments']) {
      marketingUpdate.instruments = typeof f['Instruments'] === 'string' ? f['Instruments'].split(',').map(i => i.trim()) :
                                   Array.isArray(f['Instruments']) ? f['Instruments'] : [];
    }
    if (f['Listening Link']) marketingUpdate.listeningLink = f['Listening Link'];
    if (f['Client Project Code']) marketingUpdate.projectCode = f['Client Project Code'];
    if (f['Frontline / Catalog']) marketingUpdate.frontlineCatalog = f['Frontline / Catalog'];
    if (f['Label Notes']) marketingUpdate.labelNotes = f['Label Notes'];
    if (f['Project Start Date']) marketingUpdate.projectStartDate = f['Project Start Date'];
    if (f['Project ID']) marketingUpdate.fugaProjectId = f['Project ID'];
    if (f['Fact Sheets / Project Deck (URL)']) marketingUpdate.factSheetUrl = f['Fact Sheets / Project Deck (URL)'];

    // FUGA Score specific fields
    marketingUpdate.fugaScoreRecordId = project.id;
    marketingUpdate.fugaScoreSyncedAt = new Date().toISOString();

    if (Object.keys(marketingUpdate).length === 0) continue;

    console.log(`  ✅ ${artistName} - ${projectName} → ${matchedSub.albumTitle} (${Object.keys(marketingUpdate).length} fields)`);

    if (!DRY_RUN) {
      try {
        const currentMarketing = (matchedSub.marketing || {});
        await prisma.submission.update({
          where: { id: matchedSub.id },
          data: {
            marketing: { ...currentMarketing, ...marketingUpdate },
          },
        });
        results.updated++;
      } catch (e) {
        results.errors.push(`${projectName}: ${e.message.substring(0, 100)}`);
      }
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
