/**
 * SSG Prerender Script
 *
 * Runs after `vite build` to pre-render public routes as static HTML.
 * Uses Playwright (already installed) to render each route in a headless browser,
 * then saves the fully-rendered HTML so users get instant content on first load.
 *
 * Usage: node scripts/prerender.mjs
 */

import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '../dist');
const PORT = 4173;

// Public routes to pre-render (no auth required)
const ROUTES = [
  '/',
  '/Resources',
  '/Events',
  '/WhyChicago',
  '/Funding',
  '/Workspaces',
  '/AcceleratorsIncubators',
  '/Stories',
  '/Community',
  '/About',
  '/SubmitResource',
  '/Contact',
  '/before-you-start',
  '/business-type-explorer',
  '/Directory',
  '/service-resources',
  '/small-business-resources',
  '/assessment',
  '/terms',
  '/Investors',
];

// Simple static file server for the dist folder
function createStaticServer() {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

      // SPA fallback — serve index.html for routes without file extensions
      if (!filePath.includes('.') || !existsSync(filePath)) {
        filePath = join(DIST_DIR, 'index.html');
      }

      try {
        const content = readFileSync(filePath);
        const ext = filePath.split('.').pop();
        const mimeTypes = {
          html: 'text/html',
          js: 'application/javascript',
          css: 'text/css',
          json: 'application/json',
          png: 'image/png',
          jpg: 'image/jpeg',
          svg: 'image/svg+xml',
          ico: 'image/x-icon',
          woff2: 'font/woff2',
          woff: 'font/woff',
          webmanifest: 'application/manifest+json',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log(`Static server running on http://localhost:${PORT}`);
      resolvePromise(server);
    });
  });
}

async function prerender() {
  console.log('\n--- SSG Pre-rendering ---\n');

  if (!existsSync(DIST_DIR)) {
    console.error('dist/ folder not found. Run `npm run build` first.');
    process.exit(1);
  }

  // Read the original index.html as the template
  const templateHtml = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8');

  const server = await createStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Simulate a desktop viewport for pre-rendering
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (compatible; ChiStartupHub-Prerender/1.0)',
  });

  let successCount = 0;
  let failCount = 0;

  for (const route of ROUTES) {
    const page = await context.newPage();
    const url = `http://localhost:${PORT}${route}`;

    try {
      console.log(`  Rendering: ${route}`);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Wait for React to finish rendering — look for actual content in #root
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          return root && root.children.length > 0 && !root.querySelector('[data-loading-screen]');
        },
        { timeout: 15000 }
      );

      // Wait for async data fetching and animations to settle
      await page.waitForTimeout(2000);

      // Extract the rendered HTML from #root
      const renderedContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML : '';
      });

      if (!renderedContent || renderedContent.length < 100) {
        console.warn(`  WARNING: ${route} rendered with very little content (${renderedContent.length} chars), skipping`);
        failCount++;
        await page.close();
        continue;
      }

      // Inject rendered content into the template HTML
      // Replace the empty <div id="root"></div> with pre-rendered content
      const prerenderedHtml = templateHtml.replace(
        '<div id="root"></div>',
        `<div id="root" data-prerendered="true">${renderedContent}</div>`
      );

      // Write to the appropriate file path
      const outputDir = route === '/'
        ? DIST_DIR
        : join(DIST_DIR, route.slice(1));

      if (route !== '/') {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = join(outputDir, 'index.html');
      writeFileSync(outputFile, prerenderedHtml, 'utf-8');

      const sizeKB = (Buffer.byteLength(prerenderedHtml, 'utf-8') / 1024).toFixed(1);
      console.log(`  OK: ${route} (${sizeKB} KB)`);
      successCount++;
    } catch (err) {
      console.error(`  FAIL: ${route} — ${err.message}`);
      failCount++;
    }

    await page.close();
  }

  await browser.close();
  server.close();

  console.log(`\n--- Done: ${successCount} rendered, ${failCount} failed ---\n`);

  if (failCount > 0) {
    console.log('Failed routes will fall back to client-side rendering (no SEO penalty, just slower FCP).');
  }
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
