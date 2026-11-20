#!/usr/bin/env node
// HTTP verification script for deployed endpoints

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

async function checkEndpoint(path, expectedStatus = 200, description = '') {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: { 'Accept': 'text/html,application/json' },
    });

    const status = response.status;
    const ok = status === expectedStatus;

    console.log(`${ok ? '✅' : '❌'} ${path} - ${status} ${ok ? 'OK' : 'FAIL'} ${description}`);
    return ok;
  } catch (error) {
    console.log(`❌ ${path} - ERROR: ${error.message} ${description}`);
    return false;
  }
}

async function main() {
  console.log(`🔍 Verifying endpoints at ${BASE_URL}\n`);

  const checks = [
    // Public pages
    ['/en/', 200, '(Landing/Redirect)'],
    ['/en/dashboard', 200, '(Dashboard)'],
    ['/en/dashboard/profiles', 200, '(Profiles)'],
    ['/en/dashboard/assistant', 200, '(Assistant)'],
    ['/en/dashboard/planner', 200, '(Planner)'],
    ['/en/dashboard/impact', 200, '(Impact)'],
    ['/en/dashboard/challenges', 200, '(Challenges)'],
    ['/en/dashboard/settings', 200, '(Settings)'],

    // Hindi locale
    ['/hi/dashboard', 200, '(Hindi Dashboard)'],

    // API endpoints (may return 401/400 without auth, but should not 500)
    ['/api/aqi/delhi-in', 200, '(AQI API)'],
    ['/api/recommendations', 400, '(Recommendations API - expects POST)'],

    // Static assets
    ['/favicon.ico', 200, '(Favicon)'],
  ];

  let passed = 0;
  let failed = 0;

  for (const [path, expectedStatus, description] of checks) {
    const ok = await checkEndpoint(path, expectedStatus, description);
    if (ok) passed++;
    else failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);