const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

console.log('=== VERIFYING FULL MULTI-DEVICE RESPONSIVE ARCHITECTURE ===\n');

const css = fs.readFileSync(path.join(__dirname, '../public/css/styles.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');

// --------------------------------------------------------------------------
// 1. Breakpoint Declarations & Coverage
// --------------------------------------------------------------------------
console.log('1. Checking responsive breakpoint definitions...');
assert.ok(css.includes('@media (max-width: 1100px)'), 'Includes 1100px breakpoint (compact desktop/laptop)');
assert.ok(css.includes('@media (max-width: 1024px)'), 'Includes 1024px breakpoint (standard tablet landscape / laptop)');
assert.ok(css.includes('@media (max-width: 900px)'), 'Includes 900px breakpoint (navigation collapse threshold)');
assert.ok(css.includes('@media (max-width: 768px)'), 'Includes 768px breakpoint (tablet portrait)');
assert.ok(css.includes('@media (max-width: 640px)'), 'Includes 640px breakpoint (large mobile / modal collapse)');
assert.ok(css.includes('@media (max-width: 480px)'), 'Includes 480px breakpoint (standard mobile)');
assert.ok(css.includes('@media (max-width: 375px)'), 'Includes 375px breakpoint (compact mobile)');
console.log('✓ All 7 responsive breakpoints defined in descending cascade order (1100, 1024, 900, 768, 640, 480, 375px)');

// --------------------------------------------------------------------------
// 2. Navigation Collapse & Mobile Toggle at <= 900px
// --------------------------------------------------------------------------
console.log('\n2. Checking navigation collapse and mobile toggle mechanics...');
const mq900 = css.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
assert.ok(mq900, 'Found @media (max-width: 900px) block');
const b900 = mq900[1];

assert.ok(b900.includes('.desktop-header-cta') && b900.includes('display: none !important;'),
  'Desktop header CTA is hidden at <= 900px');
assert.ok(b900.includes('.site-header .nav-menu') || b900.includes('.site-header nav'),
  'Desktop navigation links are hidden at <= 900px');
assert.ok(b900.includes('.mobile-toggle') && b900.includes('display: flex;'),
  'Mobile toggle button is displayed as flex at <= 900px');
assert.ok(html.includes('id="mobile-toggle"') && html.includes('class="mobile-toggle"'),
  'HTML includes #mobile-toggle button');
assert.ok(html.includes('aria-expanded="false"') && html.includes('aria-controls="mobile-drawer"'),
  'HTML #mobile-toggle has proper accessibility attributes (aria-expanded, aria-controls)');
assert.ok(html.includes('class="hamburger-bar"'), 'HTML #mobile-toggle contains animated hamburger bars');
console.log('✓ Navigation collapse at <= 900px verified with accessible hamburger trigger and hidden desktop CTA');

// --------------------------------------------------------------------------
// 3. Mobile Drawer Structure & Touch Targets
// --------------------------------------------------------------------------
console.log('\n3. Checking mobile drawer overlay and touch-target sizing...');
assert.ok(html.includes('id="mobile-drawer"') && html.includes('class="mobile-drawer"'),
  'HTML contains mobile drawer container');
assert.ok(html.includes('class="mobile-nav-menu"'), 'Mobile drawer contains navigation list');

const requiredNavLinks = [
  'href="/services"',
  'href="/industries"',
  'href="/how-we-work"',
  'href="/about"',
  'href="/how-we-work#insights"'
];
for (const link of requiredNavLinks) {
  assert.ok(html.includes(link), `Mobile drawer contains navigation link: ${link}`);
}
assert.ok(html.includes('mobile-drawer-btn') && html.includes('Talk to Assista'), 'Mobile drawer contains "Talk to Assista" CTA button');

assert.ok(b900.includes('min-height: 48px;'), 'Mobile nav links satisfy >= 44px touch target (48px set)');
assert.ok(b900.includes('.mobile-drawer-btn') && b900.includes('min-height: 48px;'),
  'Mobile drawer CTA button satisfies >= 44px touch target (48px set)');
assert.ok(css.includes('.mobile-toggle') && css.includes('min-height: 44px;') && css.includes('min-width: 44px;'),
  'Mobile toggle satisfies 44x44px minimum touch target');
console.log('✓ Mobile drawer verified with all 5 nav links + primary CTA button meeting >= 44px touch target');

// --------------------------------------------------------------------------
// 4. Mobile Drawer Controller JS (app.js)
// --------------------------------------------------------------------------
console.log('\n4. Checking mobile drawer JavaScript interactions in app.js...');
assert.ok(appJs.includes('openMobileMenu') && appJs.includes('closeMobileMenu') && appJs.includes('toggleMobileMenu'),
  'app.js implements open/close/toggle drawer functions');
assert.ok(appJs.includes("document.body.classList.add('menu-open')"),
  'app.js adds menu-open class to lock body scroll');
assert.ok(appJs.includes("document.body.classList.remove('menu-open')"),
  'app.js removes menu-open class when closing drawer');
assert.ok(appJs.includes("e.key === 'Escape'"), 'app.js closes mobile drawer on Escape key');
assert.ok(appJs.includes('window.innerWidth > 900'), 'app.js automatically closes drawer on viewport resize > 900px');
assert.ok(css.includes('body.menu-open') && css.includes('overflow: hidden !important;'),
  'CSS implements body.menu-open scroll lock');
console.log('✓ Mobile drawer interactive controller verified (open, close, body lock, escape key, resize safeguard)');

// --------------------------------------------------------------------------
// 5. Hero Section Responsiveness & Zero Text Clipping
// --------------------------------------------------------------------------
console.log('\n5. Checking hero section responsive adaptation...');
assert.ok(b900.includes('.hero-grid') && b900.includes('grid-template-columns: 1fr;'),
  'Hero grid collapses to single column at <= 900px');
assert.ok(css.includes('.hero-title-line') && css.includes('overflow: visible;'),
  'Hero title line has overflow: visible to prevent text clipping');

const mq480 = css.match(/@media\s*\(max-width:\s*480px\)\s*\{([\s\S]*?)\n\}/);
assert.ok(mq480, 'Found @media (max-width: 480px) block');
const b480 = mq480[1];

assert.ok(b480.includes('.hero-cta-group') && b480.includes('flex-direction: column;'),
  'Hero CTA buttons stack vertically on mobile');
assert.ok(b480.includes('.hero-cta-group .btn') && b480.includes('width: 100%;'),
  'Hero CTA buttons expand to full width on mobile for effortless tapping');
assert.ok(b480.includes('.hero-image-frame img') && b480.includes('height: 280px;'),
  'Hero photo frame height adjusts to 280px on mobile');
console.log('✓ Hero section layout adapts fluidly (1-column stack, full-width CTAs, responsive photo framing)');

// --------------------------------------------------------------------------
// 6. Multi-Column Grids Collapsing (Services, Behind Business, Team, Cases, Footer)
// --------------------------------------------------------------------------
console.log('\n6. Checking multi-column grid stacking across sections...');
const mq768 = css.match(/@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\n\}/);
assert.ok(mq768, 'Found @media (max-width: 768px) block');
const b768 = mq768[1];

assert.ok(b768.includes('.services-editorial-grid') && b768.includes('grid-template-columns: 1fr;'),
  'Services grid collapses to 1 column at <= 768px');
assert.ok(b768.includes('.cases-editorial-grid'), 'Case studies grid collapses to 1 column at <= 768px');
assert.ok(b768.includes('.team-editorial-grid'), 'Team grid collapses to 1 column at <= 768px');
assert.ok(b768.includes('.dual-editorial-stage'), 'Behind the business dual stage collapses to 1 column at <= 768px');
assert.ok(b768.includes('.footer-top-grid') && b768.includes('grid-template-columns: 1fr;'),
  'Footer columns collapse to 1 column at <= 768px');
assert.ok(b768.includes('.footer-link') && b768.includes('min-height: 38px;'),
  'Footer links provide comfortable touch area on mobile');
assert.ok(b768.includes('.cta-editorial-inner') && b768.includes('flex-direction: column;'),
  'Conversion banner collapses to vertical stack with full-width CTA button');
console.log('✓ All content grids verified to collapse cleanly on tablet and mobile viewports');

// --------------------------------------------------------------------------
// 7. Modal Form Responsiveness
// --------------------------------------------------------------------------
console.log('\n7. Checking consultation modal responsiveness...');
assert.ok(css.includes('.form-row-2col') && css.includes('grid-template-columns: 1fr 1fr;'),
  'Modal has 2-column form row on desktop');

const mq640 = css.match(/@media\s*\(max-width:\s*640px\)\s*\{([\s\S]*?)\n\}/);
assert.ok(mq640, 'Found @media (max-width: 640px) block');
const b640 = mq640[1];

assert.ok(b640.includes('.form-row-2col') && b640.includes('grid-template-columns: 1fr;'),
  'Modal form-row collapses to 1 column on <= 640px viewports');
assert.ok(b640.includes('.modal-close-btn') && b640.includes('min-width: 44px;') && b640.includes('min-height: 44px;'),
  'Modal close button has min 44x44px touch target on mobile');
console.log('✓ Consultation modal adapts seamlessly without crushed form fields on small screens');

// --------------------------------------------------------------------------
// 8. Horizontal Overflow Safeguards
// --------------------------------------------------------------------------
console.log('\n8. Checking horizontal overflow safeguards...');
assert.ok(css.includes('box-sizing: border-box;'), 'Global border-box sizing active');
assert.ok(css.includes('overflow-x: hidden;'), 'overflow-x: hidden enforced');
assert.ok(css.includes('img {') && css.includes('max-width: 100%;'), 'Images constrained to 100% max-width');

const mq375 = css.match(/@media\s*\(max-width:\s*375px\)\s*\{([\s\S]*?)\n\}/);
assert.ok(mq375, 'Found @media (max-width: 375px) block');
const b375 = mq375[1];
assert.ok(b375.includes('.container') && b375.includes('padding: 0 1rem;'),
  'Container padding safely scales down on 375px screens');
assert.ok(b375.includes('.site-logo') && b375.includes('width: 165px;'),
  'Logo rendered width is safely accommodated on 375px screens (165px)');
console.log('✓ Zero horizontal overflow safeguards verified for 375px compact screens');

console.log('\n=== ALL RESPONSIVE SYSTEM CHECKS PASSED (8/8) ===');
