/**
 * ASSISTA CORP — Page Generator & Static Builder
 * Pre-renders all multi-page HTML documents to disk in the public directory.
 */

const fs = require('node:fs');
const path = require('node:path');
const { PAGES, getRenderedPage } = require('./pages');

const PUBLIC_DIR = path.join(__dirname, '../public');

const ROUTE_FILE_MAP = {
  home: path.join(PUBLIC_DIR, 'index.html'),
  services: path.join(PUBLIC_DIR, 'services', 'index.html'),
  executiveSupport: path.join(PUBLIC_DIR, 'services', 'executive-support.html'),
  financeReconciliation: path.join(PUBLIC_DIR, 'services', 'finance-reconciliation.html'),
  customerCare: path.join(PUBLIC_DIR, 'services', 'customer-care.html'),
  recruitmentTalent: path.join(PUBLIC_DIR, 'services', 'recruitment-talent.html'),
  industries: path.join(PUBLIC_DIR, 'industries.html'),
  howWeWork: path.join(PUBLIC_DIR, 'how-we-work.html'),
  about: path.join(PUBLIC_DIR, 'about.html'),
  contact: path.join(PUBLIC_DIR, 'contact.html'),
  notFound: path.join(PUBLIC_DIR, '404.html')
};

function buildAllPages() {
  console.log('[BUILD] Generating all multi-page HTML documents...');
  
  // Ensure public/services directory exists
  const servicesDir = path.join(PUBLIC_DIR, 'services');
  if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir, { recursive: true });
  }

  for (const [key, filePath] of Object.entries(ROUTE_FILE_MAP)) {
    const html = getRenderedPage(key);
    if (!html) {
      console.warn(`[BUILD] Missing page for key: ${key}`);
      continue;
    }
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`[BUILD] ✓ Generated: ${path.relative(PUBLIC_DIR, filePath)} (${html.length} bytes)`);
  }

  console.log('[BUILD] All multi-page documents generated successfully.');
}

if (require.main === module) {
  buildAllPages();
}

module.exports = {
  buildAllPages,
  ROUTE_FILE_MAP
};
