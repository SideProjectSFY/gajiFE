import { expect, test } from '@playwright/test';

test.use({
  launchOptions: {
    args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-gl=angle']
  }
});

declare global {
  interface Window {
    __authCssFallbackSeen?: boolean;
  }
}

test('login and register do not flash the CSS fallback model during WebGL startup', async ({ page }) => {
  await page.addInitScript(() => {
    window.__authCssFallbackSeen = false;

    const markIfFallbackAppears = () => {
      if (document.querySelector('.auth-css-model')) {
        window.__authCssFallbackSeen = true;
      }
    };

    markIfFallbackAppears();
    new MutationObserver(markIfFallbackAppears).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.auth-live-canvas canvas')).toHaveCount(4, { timeout: 10000 });
  await page.waitForTimeout(300);
  await expect(page.locator('.auth-css-model')).toHaveCount(0);
  expect(await page.evaluate(() => window.__authCssFallbackSeen)).toBe(false);

  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.auth-live-canvas canvas')).toHaveCount(4, { timeout: 10000 });
  await page.waitForTimeout(300);
  await expect(page.locator('.auth-css-model')).toHaveCount(0);
  expect(await page.evaluate(() => window.__authCssFallbackSeen)).toBe(false);
});
