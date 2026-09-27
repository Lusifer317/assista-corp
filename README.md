# ASSISTA CORP — Global Business Services Platform

> **"The People Behind Business."**  
> Operational infrastructure powered by dedicated human cells for executive support, financial reconciliation, customer care, and recruitment operations.

---

## Overview

**Assista Corp** is an enterprise-grade global business services platform engineered with an editorial aesthetic, multi-page information architecture, and purposeful motion design. 

Unlike generic SaaS landing pages, Assista provides dedicated human operational pods directly embedded within client workspaces (Slack, Notion, ERP/CRM, and cloud environments) backed by verified standard operating procedures (SOPs) and institutional governance.

---

## Key Features

- **Multi-Page Semantic Architecture**: Structured dedicated routing across `/services`, `/industries`, `/how-we-work`, `/about`, and `/contact` with canonical SEO metadata and breadcrumbs.
- **Purposeful Motion & Cinemagraph Layer**:
  - Resilient cinematic loop in the Hero section with Ken Burns ambient drift and fail-safe high-resolution poster fallback.
  - Interactive SVG workflow loops for all 4 core disciplines (*Request &rarr; Coordination &rarr; Execution*, *Documents &rarr; Verification &rarr; Reconciliation &rarr; Completed*, *Inquiry &rarr; Support &rarr; Resolution*, *Role &rarr; Sourcing &rarr; Screening &rarr; Pipeline*).
  - Connected process progression line that sequentially illuminates stages (*01 Understand*, *02 Build*, *03 Integrate*, *04 Operate*) as the user scrolls into view.
  - Full `@media (prefers-reduced-motion: reduce)` compliance.
- **Enterprise Operations & Admin Suite**:
  - **Intent-Based Lead Scoring**: Dynamic heuristic scoring engine categorizing leads into Warm, Hot, and Priority tiers.
  - **First-Party Anonymous Analytics**: Privacy-conscious session tracking without external third-party cookies or PII leaks.
  - **Administrative Command Center**: Multi-factor authentication (TOTP RFC 6238), real-time session monitor, tamper-evident audit logs, and lead dossier CRM.
- **Strict Brand Integrity**:
  - Approved official brand logo with responsive desktop (250px), tablet (210px), mobile (175px), and footer (195px) display hierarchy.
  - Cohesive institutional color palette: Light Canvas (`#F7F8F3`), Deep Navy (`#172554`), and Lime Accent (`#B8F000`).

---

## Directory Structure

```
assista-corp/
├── data/
│   ├── assista.db           # SQLite database
│   └── seed.js              # Initial seed script & sample operational data
├── lib/
│   ├── analytics.js         # First-party visitor tracking & session analytics
│   ├── audit.js             # Tamper-evident admin audit logger
│   ├── auth.js              # PBKDF2 password hashing & RFC 6238 TOTP MFA
│   ├── build_pages.js       # Static multi-page generator & pre-renderer
│   ├── db.js                # SQLite connection & schema migrations
│   ├── layout.js            # Shared HTML layout, header, footer & nav drawer
│   ├── mailer.js            # Transactional lead notification dispatcher
│   ├── pages.js             # Multi-page templates & route content definitions
│   └── scoring.js           # Intent-based lead scoring engine
├── public/
│   ├── css/
│   │   ├── motion-graphics.css # Cinemagraph drifts & SVG workflow animations
│   │   └── styles.css          # Primary responsive design system
│   ├── images/              # High-resolution local brand photography & SVGs
│   ├── js/
│   │   ├── app.js              # Client-side routing, modals & tracking
│   │   └── motion-graphics.js  # Resilient video controller & scroll observers
│   └── *.html               # Pre-rendered static pages
├── server.js                # Production HTTP server & API endpoints
└── tests/
    ├── in_process_verify.js # In-process end-to-end integration tests
    ├── run_tests.js         # Unified test runner
    ├── test_logo_and_layout.js # Official logo sizing & layout safeguards
    ├── test_responsive.js   # 7-breakpoint multi-device responsive test suite
    └── test_routes.js       # Semantic route and SEO verification suite
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/assista-corp.git
   cd assista-corp
   ```

2. **Initialize Database**:
   ```bash
   npm run seed
   ```

3. **Start the Production Server**:
   ```bash
   npm start
   ```
   The portal will be accessible at:
   - **Public Portal**: `http://localhost:3000`
   - **Admin Command Center**: `http://localhost:3000/admin`

4. **Run Verification Test Suites**:
   ```bash
   npm test
   ```
   To run in-process system integration checks:
   ```bash
   node tests/in_process_verify.js
   ```

---

## License

UNLICENSED &bull; Proprietary to ASSISTA CORP.
