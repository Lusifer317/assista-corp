/**
 * ASSISTA CORP — Unified Reusable Layout & Component Engine
 * "Business operations, handled by people."
 * 
 * Provides single source of truth for:
 * - HTML Shell & SEO Meta tags
 * - Official Header, Logo, Dropdown Navigation & Mobile Drawer
 * - Breadcrumbs & Page Heroes
 * - Reusable Conversion Banner
 * - Institutional Footer
 * - Consultation Modal & Consent Banner
 * - Script orchestration
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBreadcrumb(items) {
  if (!items || items.length === 0) return '';
  const listItems = items.map((item, idx) => {
    const isLast = idx === items.length - 1;
    if (isLast) {
      return `<li class="breadcrumb-item active" aria-current="page">${escapeHtml(item.label)}</li>`;
    }
    return `<li class="breadcrumb-item"><a href="${item.url}" class="breadcrumb-link">${escapeHtml(item.label)}</a></li>`;
  }).join('<li class="breadcrumb-separator" aria-hidden="true">/</li>');

  return `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <div class="container">
        <ol class="breadcrumb-list">
          ${listItems}
        </ol>
      </div>
    </nav>
  `;
}

function renderPageHero({ eyebrow, title, lead, actionsHtml = '' }) {
  return `
    <header class="page-hero">
      <div class="container">
        ${eyebrow ? `<span class="section-tag">${escapeHtml(eyebrow)}</span>` : ''}
        <h1 class="page-hero-title">${escapeHtml(title)}</h1>
        ${lead ? `<p class="page-hero-lead">${escapeHtml(lead)}</p>` : ''}
        ${actionsHtml ? `<div class="page-hero-actions">${actionsHtml}</div>` : ''}
      </div>
    </header>
  `;
}

function renderHeader(currentRoute = '/') {
  const isServices = currentRoute.startsWith('/services');
  const isIndustries = currentRoute.startsWith('/industries');
  const isHowWeWork = currentRoute.startsWith('/how-we-work');
  const isAbout = currentRoute.startsWith('/about');
  const isContact = currentRoute.startsWith('/contact');

  return `
  <!-- Minimal Scroll Progress Indicator -->
  <div class="scroll-progress-track" aria-hidden="true">
    <div class="scroll-progress-fill" id="scroll-progress-fill"></div>
  </div>

  <!-- SITE HEADER & NAVIGATION -->
  <header class="site-header">
    <div class="container nav-container">
      <a href="/" class="brand-link" aria-label="Assista Corp Homepage">
        <picture>
          <source srcset="/images/assista-logo.svg" type="image/svg+xml">
          <img src="/images/assista-logo.png" alt="Assista Corp — People | Operations | Progress" class="site-logo" width="250" height="44">
        </picture>
      </a>

      <!-- 5-Item Navigation with Accessible Services Dropdown -->
      <nav class="header-nav" aria-label="Main Navigation">
        <ul class="nav-menu">
          <li class="nav-item-dropdown">
            <a href="/services" class="nav-link ${isServices ? 'active' : ''}" id="services-menu-link" aria-haspopup="true" aria-expanded="false">
              <span>Services</span>
              <span class="dropdown-chevron" aria-hidden="true">▾</span>
            </a>
            <div class="nav-dropdown" aria-label="Services Submenu">
              <a href="/services/executive-support" class="nav-dropdown-item ${currentRoute === '/services/executive-support' ? 'active' : ''}">
                <span class="dropdown-item-title">Executive Support</span>
                <span class="dropdown-item-desc">Workflow gatekeeping &amp; C-suite leverage</span>
              </a>
              <a href="/services/finance-reconciliation" class="nav-dropdown-item ${currentRoute === '/services/finance-reconciliation' ? 'active' : ''}">
                <span class="dropdown-item-title">Finance &amp; Reconciliation</span>
                <span class="dropdown-item-desc">AP/AR, billing breakdowns &amp; statement matching</span>
              </a>
              <a href="/services/customer-care" class="nav-dropdown-item ${currentRoute === '/services/customer-care' ? 'active' : ''}">
                <span class="dropdown-item-title">Customer Care &amp; CX</span>
                <span class="dropdown-item-desc">High-touch human care &amp; VIP escalation</span>
              </a>
              <a href="/services/recruitment-talent" class="nav-dropdown-item ${currentRoute === '/services/recruitment-talent' ? 'active' : ''}">
                <span class="dropdown-item-title">Recruitment &amp; Talent</span>
                <span class="dropdown-item-desc">Active sourcing, screening &amp; scheduling</span>
              </a>
              <div class="dropdown-footer">
                <a href="/services" class="dropdown-all-link">Explore all services &rarr;</a>
              </div>
            </div>
          </li>
          <li><a href="/industries" class="nav-link ${isIndustries ? 'active' : ''}">Industries</a></li>
          <li><a href="/how-we-work" class="nav-link ${isHowWeWork ? 'active' : ''}">How We Work</a></li>
          <li><a href="/about" class="nav-link ${isAbout ? 'active' : ''}">About</a></li>
          <li><a href="/how-we-work#insights" class="nav-link">Insights</a></li>
        </ul>
      </nav>

      <div class="nav-actions">
        <a href="/contact" class="btn btn-primary desktop-header-cta">
          <span>Talk to Assista</span>
          <span class="btn-arrow" aria-hidden="true">&rarr;</span>
        </a>
        <button class="mobile-toggle" id="mobile-toggle" aria-expanded="false" aria-controls="mobile-drawer" aria-label="Toggle navigation menu">
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
        </button>
      </div>
    </div>

    <!-- Accessible Mobile Navigation Drawer (<= 900px) -->
    <div class="mobile-drawer" id="mobile-drawer" aria-hidden="true">
      <div class="mobile-drawer-content">
        <ul class="mobile-nav-menu">
          <li><a href="/services" class="mobile-nav-link ${isServices ? 'active' : ''}">Services</a></li>
          <li><a href="/industries" class="mobile-nav-link ${isIndustries ? 'active' : ''}">Industries</a></li>
          <li><a href="/how-we-work" class="mobile-nav-link ${isHowWeWork ? 'active' : ''}">How We Work</a></li>
          <li><a href="/about" class="mobile-nav-link ${isAbout ? 'active' : ''}">About</a></li>
          <li><a href="/how-we-work#insights" class="mobile-nav-link">Insights</a></li>
        </ul>
        <div class="mobile-drawer-actions">
          <a href="/contact" class="btn btn-primary mobile-drawer-btn">
            <span>Talk to Assista</span>
            <span class="btn-arrow" aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  </header>
  `;
}

function renderConversionBanner() {
  return `
    <section class="editorial-cta-section">
      <div class="container cta-editorial-inner reveal-on-scroll">
        <div>
          <h2 class="cta-editorial-title">Ready to give your business dedicated operational momentum?</h2>
          <p class="cta-editorial-desc">
            Connect directly with an Assista client director to evaluate your workflow bottlenecks and assemble your dedicated operational cell.
          </p>
        </div>
        <div>
          <a href="/contact" class="btn btn-primary" style="padding: 1rem 2rem; font-size: 1rem;">
            <span>Talk to Assista</span>
            <span class="btn-arrow" aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderFooter() {
  return `
  <!-- INSTITUTIONAL FOOTER -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-top-grid reveal-on-scroll">
        <div class="footer-brand-col">
          <a href="/" class="brand-link" aria-label="Assista Corp Homepage">
            <picture>
              <source srcset="/images/assista-logo.svg" type="image/svg+xml">
              <img src="/images/assista-logo.png" alt="Assista Corp — People | Operations | Progress" class="site-logo footer-logo" width="195" height="35">
            </picture>
          </a>
          <p>
            Dedicated operational teams and specialist business support. Empowering high-stakes enterprises to execute with consistency, discretion, and accountability.
          </p>
        </div>

        <div>
          <div class="footer-col-title">Services</div>
          <ul class="footer-links-list">
            <li><a href="/services/executive-support" class="footer-link">Executive Support</a></li>
            <li><a href="/services/finance-reconciliation" class="footer-link">Finance &amp; Reconciliation</a></li>
            <li><a href="/services/customer-care" class="footer-link">Customer Care &amp; CX</a></li>
            <li><a href="/services/recruitment-talent" class="footer-link">Recruitment &amp; Talent</a></li>
          </ul>
        </div>

        <div>
          <div class="footer-col-title">Industries</div>
          <ul class="footer-links-list">
            <li><a href="/industries#healthcare" class="footer-link">Healthcare &amp; Clinical</a></li>
            <li><a href="/industries#wealth" class="footer-link">Private Wealth Offices</a></li>
            <li><a href="/industries#legal" class="footer-link">Corporate Law Firms</a></li>
            <li><a href="/industries#ecommerce" class="footer-link">E-Commerce &amp; Brands</a></li>
          </ul>
        </div>

        <div>
          <div class="footer-col-title">Company</div>
          <ul class="footer-links-list">
            <li><a href="/how-we-work" class="footer-link">How We Work</a></li>
            <li><a href="/about" class="footer-link">About Assista</a></li>
            <li><a href="/how-we-work#insights" class="footer-link">Insights</a></li>
            <li><a href="/contact" class="footer-link">Contact Assista</a></li>
            <li><a href="/admin" class="footer-link" style="color:var(--brand-navy); font-weight:600;">Operations Portal (Staff)</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-row">
        <div>
          &copy; 2026 Assista Corp. All rights reserved. Global Business Services.
        </div>
        <div class="footer-bottom-links">
          <a href="/about#confidentiality">Confidentiality Standards</a>
          <a href="/about#governance">Operating Governance</a>
          <a href="/login">Portal Access</a>
        </div>
      </div>
    </div>
  </footer>
  `;
}

function renderModal() {
  return `
  <!-- CONSULTATION MODAL (TALK TO ASSISTA) -->
  <div class="modal-overlay" id="inquiry-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
    <div class="modal-card">
      <button class="modal-close-btn" id="modal-close-btn" aria-label="Close dialog">&times;</button>
      
      <div style="margin-bottom: 2rem;">
        <span class="section-tag" style="margin-bottom: 0.5rem;">Direct Partner Consultation</span>
        <h3 id="modal-heading" style="font-size: 1.6rem; font-weight: 800; color: var(--brand-navy); margin-bottom: 0.5rem;">
          Talk to Assista
        </h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">
          Connect with an onboarding director to discuss your operational requirements, team structure, and timeline. All inquiries are protected under strict confidentiality.
        </p>
      </div>

      <form id="inquiry-form">
        <input type="hidden" name="turnstile_token" value="cf_turnstile_pass_token_demo">
        <input type="hidden" id="lead-squad-field" name="lead_squad" value="General Inquiry">

        <div class="form-row-2col">
          <div class="form-group">
            <label class="form-label" for="inq-name">Your Full Name *</label>
            <input type="text" id="inq-name" name="name" class="form-input" required placeholder="e.g. Eleanor Vance">
          </div>
          <div class="form-group">
            <label class="form-label" for="inq-email">Business Email *</label>
            <input type="email" id="inq-email" name="email" class="form-input" required placeholder="e.g. e.vance@firm.com">
          </div>
        </div>

        <div class="form-row-2col">
          <div class="form-group">
            <label class="form-label" for="inq-company">Company / Organization *</label>
            <input type="text" id="inq-company" name="company" class="form-input" required placeholder="e.g. Kensington Advisory">
          </div>
          <div class="form-group">
            <label class="form-label" for="inq-industry">Industry Sector</label>
            <select id="inq-industry" name="industry" class="form-select">
              <option value="Healthcare">Healthcare &amp; Clinical</option>
              <option value="Wealth">Private Wealth &amp; Family Office</option>
              <option value="Legal">Corporate Law Practice</option>
              <option value="E-Commerce">E-Commerce &amp; Brands</option>
              <option value="Financial">Financial Services</option>
              <option value="Professional Services" selected>Professional Services</option>
              <option value="Other">Other Sector</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="inq-message">Operational Requirements &amp; Scope</label>
          <textarea id="inq-message" name="message" class="form-textarea" rows="3" placeholder="Briefly describe the workflows, team functions, or bottlenecks you want Assista to support..."></textarea>
        </div>

        <div style="margin-top: 1.5rem;">
          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.9rem;">
            <span>Submit Consultation Request</span>
            <span class="btn-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </form>

      <div id="form-success-box" style="display: none; padding: 1.75rem; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
        <div style="font-size: 2rem; color: var(--brand-navy); margin-bottom: 0.5rem;" aria-hidden="true">✓</div>
        <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--brand-navy); margin-bottom: 0.5rem;">Inquiry Dispatched</h4>
        <div id="form-status-msg"></div>
      </div>
    </div>
  </div>
  `;
}

function renderConsentBanner() {
  return `
  <!-- PRIVACY CONSENT BANNER -->
  <aside class="consent-banner" id="consent-banner" role="region" aria-label="Privacy Consent">
    <p>
      We use strictly first-party, non-PII telemetry to optimize your experience. No third-party ad networks or data brokering.
    </p>
    <div class="consent-actions">
      <button class="btn btn-outline" id="consent-reject-btn" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Essential Only</button>
      <button class="btn btn-primary" id="consent-accept-btn" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Accept All</button>
    </div>
  </aside>
  `;
}

function renderPage({
  title,
  description,
  canonicalUrl,
  currentRoute = '/',
  breadcrumbItems = [],
  heroHtml = '',
  contentHtml = '',
  showConversionBanner = true,
  extraHead = ''
}) {
  const fullTitle = /assista corp/i.test(title) ? title : `${title} | Assista Corp`;
  const canonical = canonicalUrl || `https://assistacorp.com${currentRoute === '/' ? '' : currentRoute}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  
  <!-- Open Graph Metadata -->
  <meta property="og:site_name" content="Assista Corp">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://assistacorp.com/images/assista-logo.png">

  <!-- Favicons -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#F7F8F3">

  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Core Stylesheet -->
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/motion-graphics.css">
  ${extraHead}
</head>
<body>
  ${renderHeader(currentRoute)}

  <main id="main-content">
    ${breadcrumbItems && breadcrumbItems.length > 0 ? renderBreadcrumb(breadcrumbItems) : ''}
    ${heroHtml}
    ${contentHtml}
    ${showConversionBanner ? renderConversionBanner() : ''}
  </main>

  ${renderFooter()}
  ${renderModal()}
  ${renderConsentBanner()}

  <!-- Core Scripts -->
  <script src="/js/tracker.js" defer></script>
  <script src="/js/motion.js" defer></script>
  <script src="/js/motion-graphics.js" defer></script>
  <script src="/js/app.js" defer></script>
</body>
</html>`;
}

module.exports = {
  renderPage,
  renderBreadcrumb,
  renderPageHero,
  renderHeader,
  renderFooter,
  renderConversionBanner,
  renderModal,
  renderConsentBanner
};
