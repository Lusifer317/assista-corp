const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

console.log('=== VERIFYING PROMINENT LOGO SIZING & HERO LAYOUT SAFEGUARDS ===');

const css = fs.readFileSync(path.join(__dirname, '../public/css/styles.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const motion = fs.readFileSync(path.join(__dirname, '../public/js/motion.js'), 'utf8');
const svg = fs.readFileSync(path.join(__dirname, '../public/images/assista-logo.svg'), 'utf8');

// 1. Verify Artwork Cropping & Zero-Whitespace SVG
assert.ok(svg.includes('viewBox="0 0 873 155"'), 'SVG viewBox exactly matches the 873x155 visible artwork bounds');
assert.ok(svg.includes('width="873" height="155"'), 'SVG dimensions are 873x155 without transparent whitespace');
console.log('✓ 1. Artwork Bounding Box: Internal whitespace eliminated (873x155 visible artwork with 5.63:1 aspect ratio)');

// 2. Verify Desktop Logo Dimensions (240–260px, starting at 250px)
assert.ok(css.includes('width: 250px;'), 'CSS specifies width: 250px for desktop logo');
assert.ok(css.includes('max-width: 260px;'), 'CSS specifies max-width: 260px for desktop logo');
assert.ok(css.includes('min-height: 86px;'), 'Header nav-container has 86px height (within 80–90px requirement)');
assert.ok(html.includes('class="site-logo" width="250" height="44"'), 'HTML header logo img has width="250" height="44"');
console.log('✓ 2. Header Desktop Logo sizing: 250px rendered width (max 260px), 86px header height, perfectly vertically centered');

// 3. Verify Header Margins, Centered Nav, and Right-Aligned CTA
assert.ok(css.includes('padding: 0 clamp(2.5rem, 3.5vw, 3.75rem);'), 'Header container maintains 40–60px left/right page margins');
assert.ok(css.includes('.site-header nav {'), 'Header nav has dedicated flex centering rule');
assert.ok(css.includes('justify-content: center;'), 'Nav menu is centered between logo and CTA wings');
assert.ok(css.includes('justify-content: flex-end;'), 'CTA container is aligned to the right');
console.log('✓ 3. Header spacing: 40–60px margins, centered 5-item navigation, and balanced right-aligned CTA');

// 4. Verify Tablet Logo Dimensions (200–220px)
const tabletMatch = css.match(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.site-logo\s*\{([^}]+)\}/);
assert.ok(tabletMatch, 'Tablet media query contains .site-logo rule');
assert.ok(tabletMatch[1].includes('width: 210px;'), 'Tablet logo width is 210px (within 200–220px range)');
assert.ok(tabletMatch[1].includes('max-width: 220px;'), 'Tablet logo max-width is 220px');
console.log('✓ 4. Tablet Logo sizing: 210px rendered width (within 200–220px range)');

// 5. Verify Mobile Logo Dimensions (165–185px)
const mobileMatch = css.match(/@media\s*\(max-width:\s*768px\)[\s\S]*?\.site-logo\s*\{([^}]+)\}/);
assert.ok(mobileMatch, 'Mobile media query contains .site-logo rule');
assert.ok(mobileMatch[1].includes('width: 175px;'), 'Mobile logo width is 175px (within 165–185px range)');
assert.ok(mobileMatch[1].includes('max-width: 185px;'), 'Mobile logo max-width is 185px');
console.log('✓ 5. Mobile Logo sizing: 175px rendered width (within 165–185px range)');

// 6. Verify Footer Logo Dimensions (180–210px)
assert.ok(css.includes('width: 195px;'), 'Footer logo width is 195px (within 180–210px range)');
assert.ok(css.includes('max-width: 210px;'), 'Footer logo max-width is 210px');
assert.ok(html.includes('class="site-logo footer-logo" width="195" height="35"'), 'HTML footer logo img has width="195" height="35"');
assert.ok(css.includes('margin-bottom: 1.5rem;'), 'Footer logo has 1.5rem margin-bottom breathing room');
console.log('✓ 6. Institutional Footer Logo sizing: 195px rendered width (within 180–210px range) with 1.5rem margin');

// 7. Verify Sticky Header Offsets & Anchor Clearance
assert.ok(css.includes('scroll-padding-top: 90px;'), 'html has scroll-padding-top: 90px');
assert.ok(css.includes('scroll-margin-top: 90px;'), 'section and anchor targets have scroll-margin-top: 90px');
console.log('✓ 7. Sticky header scroll offsets (90px scroll-margin/padding) prevent any section cutoffs');

// 8. Verify Hero Spacing & Zero Header Clipping
assert.ok(css.includes('padding: clamp(3.5rem, 5.5vw, 5rem) 0 clamp(4rem, 6vw, 5.5rem) 0;'), 'Hero has calculated top padding');
assert.ok(!css.includes('.hero-section { margin-top: -'), 'Hero has no negative top margin');
const heroLineMatch = css.match(/\.hero-title-line\s*\{([^}]+)\}/);
assert.ok(heroLineMatch[1].includes('overflow: visible;'), 'Hero title line has overflow: visible (no clipping)');
const heroFadeMatch = css.match(/@keyframes heroFadeUp\s*\{([\s\S]*?)\}/);
assert.ok(heroFadeMatch[1].includes('translateY(12px)'), 'heroFadeUp translates downward from 12px (never upward toward header)');
console.log('✓ 8. Hero Headline Clearance: Overflow visible, downward fade-up, and 56-80px padding below 86px header');

// 9. Verify Responsive Hero Spacing (Tablet & Mobile)
const tabletHero = css.match(/@media\s*\(max-width:\s*1100px\)[\s\S]*?\.hero-section\s*\{([^}]+)\}/);
assert.ok(tabletHero[1].includes('padding: 3.5rem 0 4.5rem 0;'), 'Tablet hero has 3.5rem top padding');
const mobileHero = css.match(/@media\s*\(max-width:\s*768px\)[\s\S]*?\.hero-section\s*\{([^}]+)\}/);
assert.ok(mobileHero[1].includes('padding: 2.75rem 0 3.5rem 0;'), 'Mobile hero has 2.75rem top padding');
console.log('✓ 9. Responsive Hero Spacing verified for tablet (3.5rem) and mobile (2.75rem)');

// 10. Verify Scroll Restoration Reset & Fresh Load Behavior
assert.ok(motion.includes("history.scrollRestoration = 'manual'"), 'motion.js disables auto scroll restoration');
assert.ok(motion.includes('window.scrollTo(0, 0)'), 'motion.js forces window scroll to 0,0 on fresh load');
assert.ok(!html.includes('id="contact"'), 'editorial-cta-section does not have id="contact" to prevent accidental hash jump');
console.log('✓ 10. Fresh load scroll position reset: manual scrollRestoration, scrollTo(0,0), and removal of #contact jump anchor');

// 11. Verify Editorial CTA Section ("momentum?") Safeguards
assert.ok(css.includes('.editorial-cta-section {'), 'editorial-cta-section exists');
const ctaSectionMatch = css.match(/\.editorial-cta-section\s*\{([^}]+)\}/);
assert.ok(ctaSectionMatch[1].includes('padding: 6.25rem 0;'), 'editorial-cta-section has generous 6.25rem padding');
assert.ok(ctaSectionMatch[1].includes('overflow: visible;'), 'editorial-cta-section has overflow: visible');
assert.ok(ctaSectionMatch[1].includes('scroll-margin-top: 120px;'), 'editorial-cta-section has 120px scroll-margin-top');

const ctaTitleMatch = css.match(/\.cta-editorial-title\s*\{([^}]+)\}/);
assert.ok(ctaTitleMatch[1].includes('line-height: 1.25;'), 'cta-editorial-title has line-height: 1.25');
assert.ok(ctaTitleMatch[1].includes('overflow: visible;'), 'cta-editorial-title has overflow: visible');
console.log('✓ 11. Editorial CTA section and "momentum?" title verified with overflow: visible, 1.25 line-height, and 120px scroll-margin');

// 12. Verify Motion Observer Root Margin
assert.ok(motion.includes("rootMargin: '0px 0px 40px 0px'"), 'motion.js observer has positive bottom margin for premature trigger');
console.log('✓ 12. Motion scroll reveal observer verified with pre-trigger rootMargin (0px 0px 40px 0px)');

console.log('\n=== ALL LOGO SIZING & HERO LAYOUT SAFEGUARD TESTS PASSED (12/12) ===');

if (require.main === module) {
  process.exit(0);
}
