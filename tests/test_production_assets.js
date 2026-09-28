const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const publicDir = path.join(__dirname, '..', 'public');
const robots = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');

assert.match(robots, /^User-agent: \*/m);
assert.match(robots, /^Disallow: \/admin$/m);
assert.match(robots, /^Disallow: \/login$/m);
assert.match(robots, /^Disallow: \/api\/$/m);
assert.match(robots, /Sitemap: https:\/\/assistacorp\.com\/sitemap\.xml/);

assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
for (const route of ['/', '/services', '/industries', '/how-we-work', '/about', '/contact']) {
  assert.match(sitemap, new RegExp(`<loc>https://assistacorp\\.com${route === '/' ? '' : route}</loc>`));
}
assert.match(sitemap, /<\/urlset>$/);

console.log('✓ Production robots.txt and sitemap.xml assets');
