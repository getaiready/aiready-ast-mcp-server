import { test, expect } from '@playwright/test';

test.describe('Platform SEO Metadata', () => {
  test('homepage has correct SEO tags', async ({ page }) => {
    await page.goto('/');

    // Title
    await expect(page).toHaveTitle(/AIReady Platform/);

    // Meta Description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toContain('AI collaboration');

    // JSON-LD scripts
    await expect(
      page.locator('script[id="organization-schema-platform"]')
    ).toBeAttached();
    await expect(
      page.locator('script[id="software-schema-platform"]')
    ).toBeAttached();
    await expect(
      page.locator('script[id="website-schema-platform"]')
    ).toBeAttached();
  });

  test('homepage has correct AI meta tags and icons', async ({ page }) => {
    await page.goto('/');

    // AEO Tags
    await expect(
      page.locator('meta[name="chatgpt:description"]')
    ).toBeAttached();
    await expect(
      page.locator('meta[name="perplexity:summary"]')
    ).toBeAttached();
    await expect(page.locator('meta[name="ai:summary"]')).toBeAttached();
    await expect(page.locator('meta[name="ai:category"]')).toHaveAttribute(
      'content',
      /AI Infrastructure/
    );

    // Icons
    await expect(
      page.locator('link[rel="icon"][href*="logo-transparent-bg.png"]')
    ).toBeAttached();
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /\/logo-transparent-bg\.png/
    );
  });

  test('metrics page has correct specific SEO tags', async ({ page }) => {
    await page.goto('/metrics');

    await expect(page).toHaveTitle(/AI Readiness Metrics & Methodology/);

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toContain('9 core metrics');

    // TechArticle schema
    await expect(
      page.locator('script[id="tech-article-schema-metrics"]')
    ).toBeAttached();
    const schema = await page
      .locator('script[id="tech-article-schema-metrics"]')
      .innerHTML();
    const schemaObj = JSON.parse(schema);
    expect(schemaObj['@type']).toBe('TechArticle');
  });

  test('robots and sitemap files are accessible', async ({ page }) => {
    const robots = await page.goto('/robots.txt');
    expect(robots?.status()).toBe(200);

    const sitemap = await page.goto('/sitemap.xml');
    expect(sitemap?.status()).toBe(200);
  });
});
