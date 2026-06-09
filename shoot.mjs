import { chromium } from 'playwright-core';
import fs from 'fs';

const BASE = process.env.BASE || 'http://localhost:8080';
const OUT = '/mnt/documents/screens';
fs.mkdirSync(OUT, { recursive: true });

const routes = [
  ['splash', '/'],
  ['welcome', '/welcome'],
  ['role-select', '/role-select'],
  ['signup-investor', '/signup/investor'],
  ['signup-broker', '/signup/broker'],
  ['signup-vendor', '/signup/vendor'],
  ['login', '/login'],
  ['forgot', '/forgot'],
  ['kyc', '/kyc'],
  ['home', '/home'],
  ['notifications', '/notifications'],
  ['explore', '/explore'],
  ['invest', '/invest'],
  ['invest-farmvest', '/invest/farmvest'],
  ['invest-farmvest-detail', '/invest/farmvest/fv-palm-01'],
  ['invest-property', '/invest/property'],
  ['invest-property-detail', '/invest/property/p1'],
  ['invest-checkout', '/invest/checkout/fv-palm-01'],
  ['invest-success', '/invest/success/fv-palm-01'],
  ['vault', '/vault'],
  ['wallet-intro', '/wallet/intro'],
  ['wallet-create', '/wallet/create'],
  ['wallet-confirm', '/wallet/confirm'],
  ['wallet-security', '/wallet/security'],
  ['wallet-import', '/wallet/import'],
  ['wallet-swap', '/wallet/swap'],
  ['wallet-history', '/wallet/history'],
  ['services', '/services'],
  ['services-mp', '/services/mp'],
  ['services-mp-detail', '/services/mp/c1'],
  ['prichat', '/prichat'],
  ['prichat-detail', '/prichat/t1'],
  ['profile', '/profile'],
  ['settings', '/settings'],
  ['security', '/security'],
  ['documents', '/documents'],
  ['legal', '/legal'],
  ['support', '/support'],
  ['support-dispute', '/support/dispute'],
  ['vendor', '/vendor'],
  ['vendor-apply', '/vendor/apply'],
  ['vendor-listings', '/vendor/listings'],
  ['vendor-orders', '/vendor/orders'],
  ['vendor-disputes', '/vendor/disputes'],
  ['broker', '/broker'],
  ['broker-rewards', '/broker/rewards'],
  ['partner', '/partner'],
  ['admin', '/admin'],
  ['admin-kyc', '/admin/kyc'],
  ['admin-vendors', '/admin/vendors'],
  ['admin-consultants', '/admin/consultants'],
  ['admin-disputes', '/admin/disputes'],
  ['admin-rewards', '/admin/rewards'],
  ['admin-partners', '/admin/partners'],
  ['admin-audit', '/admin/audit'],
];

const themes = (process.env.THEMES || 'light,dark').split(',');

const browser = await chromium.launch({ executablePath: '/bin/chromium', args: ['--no-sandbox'] });
for (const theme of themes) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { localStorage.setItem('agrovest:theme', t); }, theme);

  for (const [name, path] of routes) {
    const url = BASE + path;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(400);
      const file = `${OUT}/${String(routes.indexOf(routes.find(r=>r[0]===name))+1).padStart(2,'0')}-${name}-${theme}.png`;
      await page.screenshot({ path: file, fullPage: false });
      console.log('✓', theme, name);
    } catch (e) {
      console.log('✗', theme, name, e.message);
    }
  }
  await ctx.close();
}
await browser.close();
console.log('done');
