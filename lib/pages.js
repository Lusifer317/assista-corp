/**
 * ASSISTA CORP — Multi-Page Content Definitions & Page Generator
 * 
 * Strict Content Integrity:
 * - NO invented leadership names, biographies, clients, testimonials, case studies, or SLAs.
 * - Neutral response wording.
 * - Positive positioning (human-led execution, continuity, accountability, confidentiality).
 * - "Typical workflows we can support" for industries.
 */

const { renderPage, renderPageHero } = require('./layout');

// --------------------------------------------------------------------------
// 1. Page Content Definitions
// --------------------------------------------------------------------------

const PAGES = {
  // ------------------------------------------------------------------------
  // HOME PAGE (Concise Overview)
  // ------------------------------------------------------------------------
  home: {
    route: '/',
    title: 'ASSISTA CORP | The People Behind Business.',
    description: 'Assista Corp provides dedicated human operational infrastructure for executive support, finance, customer care, and specialized business operations.',
    canonicalUrl: 'https://assistacorp.com',
    heroHtml: `
    <!-- HERO SECTION (STAGGERED ENTRANCE & FULL HERO CLEARANCE) -->
    <section class="hero-section" id="hero">
      <div class="container hero-grid">
        <div class="hero-text-col">
          <span class="hero-eyebrow hero-stagger-1">Dedicated Human Operational Infrastructure</span>
          <h1 class="hero-title hero-stagger-2">
            <span class="hero-title-line"><span class="hero-title-text">Business operations,</span></span>
            <span class="hero-title-line"><span class="hero-title-text navy">handled by people.</span></span>
          </h1>
          <p class="hero-lead hero-stagger-3">
            Assista provides dedicated teams and specialist support that help businesses execute critical work with greater speed, consistency and reliability.
          </p>

          <div class="hero-cta-group hero-stagger-4">
            <a href="/contact" class="btn btn-primary">
              <span>Talk to Assista</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a href="/services" class="btn-link">
              <span>Explore our services</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div class="hero-trust-metrics hero-stagger-5">
            <div>
              <div class="trust-item-value">Dedicated Teams</div>
              <div class="trust-item-label">Direct Human Accountability</div>
            </div>
            <div>
              <div class="trust-item-value">Structured Cells</div>
              <div class="trust-item-label">Verified Operational Governance</div>
            </div>
            <div>
              <div class="trust-item-value">Enterprise Continuity</div>
              <div class="trust-item-label">Long-Term Knowledge Retention</div>
            </div>
          </div>
        </div>

        <div class="hero-visual-col hero-stagger-visual">
          <div class="hero-editorial-frame">
            <div class="hero-status-chip">
              <span class="status-pulse-dot" aria-hidden="true"></span>
              <span>OPERATIONS ACTIVE &bull; DEDICATED CELL</span>
            </div>
            <div class="hero-image-wrapper">
              <video class="hero-cinematic-video ambient-cinematic" autoplay muted loop playsinline poster="/images/hero-operations-collab.jpg" aria-label="Assista Executive Operational Team in Command Center">
                <source src="/videos/hero-operations.mp4" type="video/mp4">
                <img src="/images/hero-operations-collab.jpg" alt="Assista Executive Operational Team Collaborating in Command Room" width="1024" height="768" loading="eager" class="hero-main-img">
              </video>
            </div>
            <div class="hero-caption-bar">
              <span class="hero-caption-badge">GLOBAL DELIVERY</span>
              <span class="hero-caption-text">London &bull; Zurich &bull; Cross-Functional Coordination</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    `,
    contentHtml: `
    <!-- SECTION 2: WHAT ASSISTA DOES -->
    <section class="section section-subtle" id="about-overview">
      <div class="container reveal-on-scroll">
        <div class="editorial-split-grid">
          <div class="editorial-split-text">
            <span class="section-tag">The Operational Model &bull; THE PEOPLE BEHIND BUSINESS.</span>
            <h2 class="section-title">Operational infrastructure, powered by dedicated human cells.</h2>
            <p class="section-desc">
              We do not sell software subscriptions or impersonal ticket queues. Assista assembles and embeds dedicated operational cells into your business to handle critical workflows with precision, continuity, and accountability.
            </p>

            <div class="editorial-features-list">
              <div class="editorial-feature-item">
                <div class="feature-icon-badge" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feature-icon-svg">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <circle cx="20" cy="4" r="2.2" fill="#B8F000" stroke="#172554" stroke-width="1.2" class="icon-accent-lime" />
                  </svg>
                </div>
                <div>
                  <h3 class="feature-item-title">Dedicated Talent</h3>
                  <p class="feature-item-desc">Assigned specialists who know your business, your team's preferences, and your operating rhythm inside out.</p>
                </div>
              </div>
              <div class="editorial-feature-item">
                <div class="feature-icon-badge" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feature-icon-svg">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 12 12 17 22 12" />
                    <polyline points="2 17 12 22 22 17" />
                    <circle cx="12" cy="7" r="2.2" fill="#B8F000" stroke="#172554" stroke-width="1.2" class="icon-accent-lime" />
                  </svg>
                </div>
                <div>
                  <h3 class="feature-item-title">Embedded Execution</h3>
                  <p class="feature-item-desc">Operating directly within your existing communication and software stack—Slack, Notion, CRM, and cloud workspaces.</p>
                </div>
              </div>
              <div class="editorial-feature-item">
                <div class="feature-icon-badge" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feature-icon-svg">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                    <circle cx="12" cy="6" r="2.2" fill="#B8F000" stroke="#172554" stroke-width="1.2" class="icon-accent-lime" />
                  </svg>
                </div>
                <div>
                  <h3 class="feature-item-title">Structured Governance</h3>
                  <p class="feature-item-desc">Documented standard operating procedures (SOPs) and client director oversight ensuring seamless operational continuity.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="editorial-split-visual">
            <div class="editorial-photo-card">
              <div class="photo-card-img-wrapper">
                <img src="/images/ops-candid-collab.jpg" alt="Assista Operational Specialists Collaborating on Workflow Architecture" width="800" height="600" loading="lazy" class="editorial-img">
              </div>
              <div class="photo-card-caption">
                <span class="caption-tag">EMBEDDED CELL CADENCE</span>
                <span class="caption-text">Specialists reviewing process documentation and live systems.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: SERVICES OVERVIEW -->
    <section class="section section-white" id="services">
      <div class="container reveal-on-scroll">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 3.5rem;">
          <div style="max-width: 680px;">
            <span class="section-tag">Core Capabilities &bull; WHATEVER MOVES YOUR BUSINESS FORWARD</span>
            <h2 class="section-title">Specialized operational disciplines.</h2>
            <p class="section-desc">
              From executive workflows to financial administration and customer care, Assista provides dedicated specialists across high-leverage business functions.
            </p>
          </div>
          <div>
            <a href="/services" class="btn btn-navy">
              <span>Explore all services</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <div class="services-editorial-grid" style="margin-top: 0;">
          <div class="service-card visual-service-card">
            <div class="service-thumb-frame">
              <img src="/images/service-exec.jpg" alt="Executive Support &amp; Operational Briefings" width="480" height="270" loading="lazy" class="service-thumb-img">
              <span class="service-discipline-pill">Discipline 01</span>
            </div>
            <div class="service-card-body">
              <div class="service-number">01 / CAPABILITY</div>
              <h3 class="service-title">Executive Support</h3>
              <p class="service-summary">
                Dedicated support for executive workflows, dynamic calendar gatekeeping, complex travel coordination, and C-suite operational tasks.
              </p>

              <!-- Custom SVG Workflow Motion: Request → Coordination → Execution -->
              <div class="service-workflow-viz">
                <div class="workflow-viz-header">
                  <span class="workflow-viz-label">Workflow: Request &rarr; Execution</span>
                  <span class="workflow-status-indicator"><span class="workflow-pulse-dot"></span> Active Loop</span>
                </div>
                <svg class="workflow-track-svg" viewBox="0 0 340 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Request to Coordination to Execution workflow">
                  <path d="M 45 22 L 170 22 L 295 22" class="path-track" />
                  <path d="M 45 22 L 170 22 L 295 22" class="path-flowing" />
                  <g class="anim-step-1">
                    <circle cx="45" cy="22" r="12" class="node-circle node-circle-active" />
                    <path d="M 40 22 L 44 26 L 50 18" stroke="#B8F000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <text x="45" y="44" text-anchor="middle" class="node-text">Request</text>
                  </g>
                  <g class="anim-step-2">
                    <circle cx="170" cy="22" r="12" class="node-circle" />
                    <circle cx="170" cy="22" r="3.5" fill="#172554" />
                    <text x="170" y="44" text-anchor="middle" class="node-text">Coordination</text>
                  </g>
                  <g class="anim-step-3">
                    <circle cx="295" cy="22" r="12" class="node-circle node-circle-active" />
                    <path d="M 291 22 L 299 22 M 295 18 L 299 22 L 295 26" stroke="#B8F000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <text x="295" y="44" text-anchor="middle" class="node-text">Execution</text>
                  </g>
                </svg>
              </div>

              <div class="service-card-action">
                <span class="service-roles-pill">Senior Executive Assistants &bull; Chiefs of Staff</span>
                <a href="/services/executive-support" class="btn-link">
                  <span>Explore Executive Support</span>
                  <span class="btn-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          <div class="service-card visual-service-card">
            <div class="service-thumb-frame">
              <img src="/images/service-finance.jpg" alt="Finance &amp; Transactional Reconciliation Support" width="480" height="270" loading="lazy" class="service-thumb-img">
              <span class="service-discipline-pill">Discipline 02</span>
            </div>
            <div class="service-card-body">
              <div class="service-number">02 / CAPABILITY</div>
              <h3 class="service-title">Finance &amp; Reconciliation</h3>
              <p class="service-summary">
                Rigorous financial hygiene, billing breakdowns, AP/AR oversight, and transactional tracking managed under strict confidentiality.
              </p>

              <!-- Custom SVG Workflow Motion: Documents → Verification → Reconciliation → Completed -->
              <div class="service-workflow-viz">
                <div class="workflow-viz-header">
                  <span class="workflow-viz-label">Workflow: Audit &rarr; Completed</span>
                  <span class="workflow-status-indicator"><span class="workflow-pulse-dot"></span> Verified</span>
                </div>
                <svg class="workflow-track-svg" viewBox="0 0 340 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Documents to Verification to Reconciliation to Completed workflow">
                  <path d="M 35 22 L 120 22 L 210 22 L 305 22" class="path-track" />
                  <path d="M 35 22 L 120 22 L 210 22 L 305 22" class="path-flowing-lime" />
                  <g class="anim-step-1">
                    <circle cx="35" cy="22" r="10" class="node-circle node-circle-active" />
                    <text x="35" y="44" text-anchor="middle" class="node-text">Documents</text>
                  </g>
                  <g class="anim-step-2">
                    <circle cx="120" cy="22" r="10" class="node-circle" />
                    <circle cx="120" cy="22" r="3" fill="#172554" />
                    <text x="120" y="44" text-anchor="middle" class="node-text">Verification</text>
                  </g>
                  <g class="anim-step-3">
                    <circle cx="210" cy="22" r="10" class="node-circle" />
                    <circle cx="210" cy="22" r="3" fill="#172554" />
                    <text x="210" y="44" text-anchor="middle" class="node-text">Reconciliation</text>
                  </g>
                  <g class="anim-step-4">
                    <circle cx="305" cy="22" r="10" class="node-circle node-circle-active" />
                    <path d="M 301 22 L 304 25 L 309 19" stroke="#B8F000" stroke-width="1.8" stroke-linecap="round" />
                    <text x="305" y="44" text-anchor="middle" class="node-text">Completed</text>
                  </g>
                </svg>
              </div>

              <div class="service-card-action">
                <span class="service-roles-pill">Financial Administrators &bull; Reconciliation Leads</span>
                <a href="/services/finance-reconciliation" class="btn-link">
                  <span>Explore Finance &amp; Reconciliation</span>
                  <span class="btn-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          <div class="service-card visual-service-card">
            <div class="service-thumb-frame">
              <img src="/images/service-care.jpg" alt="Customer Care &amp; Human CX Operations" width="480" height="270" loading="lazy" class="service-thumb-img">
              <span class="service-discipline-pill">Discipline 03</span>
            </div>
            <div class="service-card-body">
              <div class="service-number">03 / CAPABILITY</div>
              <h3 class="service-title">Customer Care &amp; CX</h3>
              <p class="service-summary">
                Empathic, brand-aligned human customer support and VIP escalation management delivered across global omnichannel touchpoints.
              </p>

              <!-- Custom SVG Workflow Motion: Customer Request → Support → Resolution -->
              <div class="service-workflow-viz">
                <div class="workflow-viz-header">
                  <span class="workflow-viz-label">Workflow: Triage &rarr; Resolution</span>
                  <span class="workflow-status-indicator"><span class="workflow-pulse-dot"></span> CSAT Verified</span>
                </div>
                <svg class="workflow-track-svg" viewBox="0 0 340 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Customer Request to Support to Resolution workflow">
                  <path d="M 45 22 L 170 22 L 295 22" class="path-track" />
                  <path d="M 45 22 L 170 22 L 295 22" class="path-flowing" />
                  <g class="anim-step-1">
                    <circle cx="45" cy="22" r="12" class="node-circle node-circle-active" />
                    <text x="45" y="44" text-anchor="middle" class="node-text">Inquiry</text>
                  </g>
                  <g class="anim-step-2">
                    <circle cx="170" cy="22" r="12" class="node-circle" />
                    <circle cx="170" cy="22" r="3.5" fill="#172554" />
                    <text x="170" y="44" text-anchor="middle" class="node-text">Support</text>
                  </g>
                  <g class="anim-step-3">
                    <circle cx="295" cy="22" r="12" class="node-circle node-circle-active" />
                    <path d="M 290 22 L 294 26 L 300 18" stroke="#B8F000" stroke-width="1.8" stroke-linecap="round" />
                    <text x="295" y="44" text-anchor="middle" class="node-text">Resolution</text>
                  </g>
                </svg>
              </div>

              <div class="service-card-action">
                <span class="service-roles-pill">CX Specialists &bull; Escalation Managers</span>
                <a href="/services/customer-care" class="btn-link">
                  <span>Explore Customer Care</span>
                  <span class="btn-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>

          <div class="service-card visual-service-card">
            <div class="service-thumb-frame">
              <img src="/images/service-talent.jpg" alt="Recruitment Operations &amp; Talent Coordination" width="480" height="270" loading="lazy" class="service-thumb-img">
              <span class="service-discipline-pill">Discipline 04</span>
            </div>
            <div class="service-card-body">
              <div class="service-number">04 / CAPABILITY</div>
              <h3 class="service-title">Recruitment &amp; Talent</h3>
              <p class="service-summary">
                Full-cycle candidate sourcing, rubric-based screening, and interview coordination embedded directly inside your applicant tracking system.
              </p>

              <!-- Custom SVG Workflow Motion: Role → Sourcing → Screening → Candidate Pipeline -->
              <div class="service-workflow-viz">
                <div class="workflow-viz-header">
                  <span class="workflow-viz-label">Workflow: Sourcing &rarr; Pipeline</span>
                  <span class="workflow-status-indicator"><span class="workflow-pulse-dot"></span> Calibrated</span>
                </div>
                <svg class="workflow-track-svg" viewBox="0 0 340 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Role to Sourcing to Screening to Candidate Pipeline workflow">
                  <path d="M 35 22 L 120 22 L 210 22 L 305 22" class="path-track" />
                  <path d="M 35 22 L 120 22 L 210 22 L 305 22" class="path-flowing-lime" />
                  <g class="anim-step-1">
                    <circle cx="35" cy="22" r="10" class="node-circle node-circle-active" />
                    <text x="35" y="44" text-anchor="middle" class="node-text">Role</text>
                  </g>
                  <g class="anim-step-2">
                    <circle cx="120" cy="22" r="10" class="node-circle" />
                    <circle cx="120" cy="22" r="3" fill="#172554" />
                    <text x="120" y="44" text-anchor="middle" class="node-text">Sourcing</text>
                  </g>
                  <g class="anim-step-3">
                    <circle cx="210" cy="22" r="10" class="node-circle" />
                    <circle cx="210" cy="22" r="3" fill="#172554" />
                    <text x="210" y="44" text-anchor="middle" class="node-text">Screening</text>
                  </g>
                  <g class="anim-step-4">
                    <circle cx="305" cy="22" r="10" class="node-circle node-circle-active" />
                    <path d="M 301 22 L 304 25 L 309 19" stroke="#B8F000" stroke-width="1.8" stroke-linecap="round" />
                    <text x="305" y="44" text-anchor="middle" class="node-text">Pipeline</text>
                  </g>
                </svg>
              </div>

              <div class="service-card-action">
                <span class="service-roles-pill">Talent Coordinators &bull; Sourcing Researchers</span>
                <a href="/services/recruitment-talent" class="btn-link">
                  <span>Explore Recruitment &amp; Talent</span>
                  <span class="btn-arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 4: INDUSTRIES OVERVIEW -->
    <section class="section section-subtle" id="industries">
      <div class="container reveal-on-scroll">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 3.5rem;">
          <div style="max-width: 680px;">
            <span class="section-tag">Sectors &amp; Practice Areas</span>
            <h2 class="section-title">Engineered for operationally demanding sectors.</h2>
            <p class="section-desc">
              We design industry-specific squads trained on the compliance, specialized software, and operating terminology unique to your sector.
            </p>
          </div>
          <div>
            <a href="/industries" class="btn btn-navy">
              <span>Explore all industries</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <div class="industries-visual-grid">
          <a href="/industries#healthcare" class="industry-visual-card">
            <div class="industry-card-visual">
              <img src="/images/case-medical.jpg" alt="Healthcare &amp; Clinical Operations" width="600" height="450" loading="lazy" class="industry-card-img">
              <div class="industry-card-overlay"></div>
              <span class="industry-card-tag">SECTOR 01</span>
            </div>
            <div class="industry-card-content">
              <h3 class="industry-card-title">Healthcare &amp; Clinical</h3>
              <p class="industry-card-desc">Patient intake verification, appointment de-confliction, records transfer, and clinical document hygiene.</p>
              <span class="industry-card-link">
                <span>Explore practice</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>

          <a href="/industries#wealth" class="industry-visual-card">
            <div class="industry-card-visual">
              <img src="/images/case-wealth.jpg" alt="Private Wealth &amp; Family Offices" width="600" height="450" loading="lazy" class="industry-card-img">
              <div class="industry-card-overlay"></div>
              <span class="industry-card-tag">SECTOR 02</span>
            </div>
            <div class="industry-card-content">
              <h3 class="industry-card-title">Private Wealth Offices</h3>
              <p class="industry-card-desc">Confidential fiduciary support, KYC/AML collation, custodial statement tracking, and partner briefing folders.</p>
              <span class="industry-card-link">
                <span>Explore practice</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>

          <a href="/industries#legal" class="industry-visual-card">
            <div class="industry-card-visual">
              <img src="/images/case-legal.jpg" alt="Corporate Law Practices" width="600" height="450" loading="lazy" class="industry-card-img">
              <div class="industry-card-overlay"></div>
              <span class="industry-card-tag">SECTOR 03</span>
            </div>
            <div class="industry-card-content">
              <h3 class="industry-card-title">Corporate Law Firms</h3>
              <p class="industry-card-desc">Court filing deadline calendaring, deposition transcript indexing, discovery logging, and billing reconciliations.</p>
              <span class="industry-card-link">
                <span>Explore practice</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>

          <a href="/industries#ecommerce" class="industry-visual-card">
            <div class="industry-card-visual">
              <img src="/images/case-commerce.jpg" alt="E-Commerce &amp; Global Brands" width="600" height="450" loading="lazy" class="industry-card-img">
              <div class="industry-card-overlay"></div>
              <span class="industry-card-tag">SECTOR 04</span>
            </div>
            <div class="industry-card-content">
              <h3 class="industry-card-title">E-Commerce &amp; Brands</h3>
              <p class="industry-card-desc">Round-the-clock human customer support, courier exception tracking, return authorizations, and catalog hygiene.</p>
              <span class="industry-card-link">
                <span>Explore practice</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- SECTION 5: HOW WE WORK OVERVIEW -->
    <section class="section section-white" id="how-we-work">
      <div class="container reveal-on-scroll">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 3.5rem;">
          <div style="max-width: 680px;">
            <span class="section-tag">The Assista Engagement Framework</span>
            <h2 class="section-title">A structured path to operational continuity.</h2>
            <p class="section-desc">
              Every Assista partnership follows a clear, tested methodology designed to absorb workflow friction with zero operational disruption.
            </p>
          </div>
          <div>
            <a href="/how-we-work" class="btn btn-navy">
              <span>Learn how we work</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <div class="connected-process-track">
          <div class="process-track-line-wrapper" aria-hidden="true">
            <div class="process-track-line">
              <div class="process-track-progress" id="process-progress-line"></div>
            </div>
          </div>

          <div class="process-steps-grid">
            <div class="process-step-node pillar-item">
              <div class="process-node-indicator">
                <span class="process-node-num">01</span>
              </div>
              <div class="process-node-content">
                <div class="process-node-tag">STAGE 01 / AUDIT</div>
                <h3 class="process-node-title">Understand</h3>
                <p class="process-node-desc">Comprehensive workflow audit, bottleneck analysis, and software access mapping to identify priority operational leverage areas.</p>
              </div>
            </div>

            <div class="process-step-node pillar-item">
              <div class="process-node-indicator">
                <span class="process-node-num">02</span>
              </div>
              <div class="process-node-content">
                <div class="process-node-tag">STAGE 02 / SQUAD</div>
                <h3 class="process-node-title">Build</h3>
                <p class="process-node-desc">Assembling your dedicated, hand-picked operational squad and authoring customized Standard Operating Procedures (SOPs).</p>
              </div>
            </div>

            <div class="process-step-node pillar-item">
              <div class="process-node-indicator">
                <span class="process-node-num">03</span>
              </div>
              <div class="process-node-content">
                <div class="process-node-tag">STAGE 03 / ONBOARD</div>
                <h3 class="process-node-title">Integrate</h3>
                <p class="process-node-desc">Seamless onboarding into your existing communication and software stack with calibrated shadow execution and quality checks.</p>
              </div>
            </div>

            <div class="process-step-node pillar-item">
              <div class="process-node-indicator">
                <span class="process-node-num">04</span>
              </div>
              <div class="process-node-content">
                <div class="process-node-tag">STAGE 04 / RUN</div>
                <h3 class="process-node-title">Operate</h3>
                <p class="process-node-desc">Continuous daily execution, proactive escalation triage, and regular operational reviews with your assigned Client Director.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6: WHY ASSISTA (POSITIVE POSITIONING) -->
    <section class="section section-subtle" id="why-assista">
      <div class="container reveal-on-scroll">
        <div class="editorial-split-grid" style="align-items: center;">
          <div class="editorial-split-visual">
            <div class="editorial-photo-card">
              <div class="photo-card-img-wrapper">
                <video class="why-assista-video ambient-cinematic" autoplay muted loop playsinline poster="/images/hero-candid-team.jpg" aria-label="Assista Dedicated Operational Specialists Collaborating">
                  <source src="/videos/team-operations.mp4" type="video/mp4">
                  <img src="/images/hero-candid-team.jpg" alt="Assista Dedicated Operational Specialists Collaborating" width="800" height="600" loading="lazy" class="editorial-img">
                </video>
              </div>
              <div class="photo-card-chip">
                <span class="status-pulse-dot" aria-hidden="true"></span>
                <span>DIRECT HUMAN ACCOUNTABILITY</span>
              </div>
              <div class="photo-card-caption">
                <span class="caption-tag">SPECIALIST SQUAD</span>
                <span class="caption-text">Dedicated professionals embedded directly into client operations.</span>
              </div>
            </div>
          </div>

          <div class="editorial-split-text">
            <span class="section-tag">Operational Distinction</span>
            <h2 class="section-title">Built for reliability, accountability, and continuity.</h2>
            <p class="section-desc">
              Modern enterprises succeed when critical workflows are anchored by accountable people who understand nuance and take pride in operational rigor.
            </p>

            <div class="editorial-features-list">
              <div class="editorial-feature-item">
                <div class="feature-icon-badge" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <h3 class="feature-item-title">Human-Led Execution</h3>
                  <p class="feature-item-desc">Nuanced judgment, contextual discernment, and personal care applied to your most sensitive correspondence and critical operational tasks.</p>
                </div>
              </div>

              <div class="editorial-feature-item">
                <div class="feature-icon-badge" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                </div>
                <div>
                  <h3 class="feature-item-title">Operational Continuity</h3>
                  <p class="feature-item-desc">Dedicated squad architecture backed by living standard operating procedures eliminates single-person dependencies and vacation disruption.</p>
                </div>
              </div>

              <div class="editorial-feature-item">
                <div class="feature-icon-badge" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <h3 class="feature-item-title">Strict Confidentiality</h3>
                  <p class="feature-item-desc">Role-based access permissions, credential sandboxing, and bilateral confidentiality agreements ensuring complete protection of proprietary data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // SERVICES HUB (/services)
  // ------------------------------------------------------------------------
  services: {
    route: '/services',
    title: 'Services & Disciplines | Assista Corp',
    description: 'Explore Assista Corp dedicated operational disciplines: Executive Support, Finance & Reconciliation, Customer Care & CX, and Recruitment & Talent.',
    canonicalUrl: 'https://assistacorp.com/services',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Services', url: '/services' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Assista Capabilities & Disciplines',
      title: 'Dedicated operational infrastructure across critical functions.',
      lead: 'Assista provides dedicated operational teams embedded into your business. Rather than dealing with fragmented contractors or impersonal ticketing queues, you receive assigned operational specialists trained on your workflows.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">The Dedicated Operational Cell Model</span>
          <h2 class="section-title">How our service architecture works.</h2>
          <p class="section-desc">
            Every engagement is structured around an assigned operational squad. We manage the training, SOP documentation, and daily oversight so your internal leadership can focus entirely on high-impact strategic priorities.
          </p>
        </div>

        <div class="services-editorial-grid" style="margin-top: 0;">
          <div class="service-card">
            <div>
              <div class="service-number">01 / DISCIPLINE</div>
              <h3 class="service-title">Executive Support</h3>
              <p class="service-summary">
                High-leverage operational leverage for managing directors, partners, and C-suite leadership navigating complex calendar demands, international travel, and confidential correspondence.
              </p>
              <div class="service-deliverables-header">Core Deliverables</div>
              <ul class="service-deliverables-list">
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Dynamic calendar gatekeeping &amp; meeting triage</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Multi-leg travel itinerary coordination</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Executive briefing packs &amp; agenda synthesis</li>
              </ul>
            </div>
            <div class="service-card-action">
              <span class="service-roles-pill">Senior Executive Assistants</span>
              <a href="/services/executive-support" class="btn btn-navy">
                <span>View Practice Details</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          <div class="service-card">
            <div>
              <div class="service-number">02 / DISCIPLINE</div>
              <h3 class="service-title">Finance &amp; Reconciliation</h3>
              <p class="service-summary">
                Rigorous financial hygiene, billing breakdowns, and transactional tracking managed under strict confidentiality, dual-authorization checks, and separation of duties.
              </p>
              <div class="service-deliverables-header">Core Deliverables</div>
              <ul class="service-deliverables-list">
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Custodial statement tracking &amp; trade reconciliation</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Accounts payable/receivable &amp; vendor 3-way matching</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Monthly CPA handoff packet preparation</li>
              </ul>
            </div>
            <div class="service-card-action">
              <span class="service-roles-pill">Financial Administrators</span>
              <a href="/services/finance-reconciliation" class="btn btn-navy">
                <span>View Practice Details</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          <div class="service-card">
            <div>
              <div class="service-number">03 / DISCIPLINE</div>
              <h3 class="service-title">Customer Care &amp; CX</h3>
              <p class="service-summary">
                Empathic, brand-aligned human customer support and VIP escalation management across global channels, delivering warmth, clarity, and rapid issue resolution.
              </p>
              <div class="service-deliverables-header">Core Deliverables</div>
              <ul class="service-deliverables-list">
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Omnichannel customer care (Email, Chat, Helpdesk)</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> VIP customer triage &amp; escalation routing</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Knowledge base creation &amp; FAQ refinement</li>
              </ul>
            </div>
            <div class="service-card-action">
              <span class="service-roles-pill">Customer Experience Specialists</span>
              <a href="/services/customer-care" class="btn btn-navy">
                <span>View Practice Details</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>

          <div class="service-card">
            <div>
              <div class="service-number">04 / DISCIPLINE</div>
              <h3 class="service-title">Recruitment &amp; Talent</h3>
              <p class="service-summary">
                Full-cycle candidate sourcing, resume screening against custom rubrics, and interview coordination embedded directly inside your applicant tracking system.
              </p>
              <div class="service-deliverables-header">Core Deliverables</div>
              <ul class="service-deliverables-list">
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Active candidate sourcing on specialized networks</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Resume screening against custom rubrics</li>
                <li class="deliverable-item"><span class="deliverable-tick">✓</span> Frictionless multi-stakeholder interview scheduling</li>
              </ul>
            </div>
            <div class="service-card-action">
              <span class="service-roles-pill">Talent Coordinators</span>
              <a href="/services/recruitment-talent" class="btn btn-navy">
                <span>View Practice Details</span>
                <span class="btn-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // EXECUTIVE SUPPORT (/services/executive-support)
  // ------------------------------------------------------------------------
  executiveSupport: {
    route: '/services/executive-support',
    title: 'Executive Support | Assista Corp',
    description: 'High-leverage executive support and operational gatekeeping for managing directors, founders, and C-suite leadership.',
    canonicalUrl: 'https://assistacorp.com/services/executive-support',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Services', url: '/services' },
      { label: 'Executive Support', url: '/services/executive-support' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Core Discipline 01',
      title: 'Executive Support & Operational Gatekeeping',
      lead: 'High-leverage operational leverage for managing directors, founders, and C-suite leadership navigating complex demands.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">Operational Scope</span>
          <h2 class="section-title">What we handle for leadership.</h2>
          <p class="section-desc">
            Senior executives spend substantial working hours on scheduling conflicts, travel logistics, and inbox triage. Assista provides dedicated executive assistants who absorb administrative drag and protect leadership focus.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h3 class="who-for-title">Calendar &amp; Meeting Triage</h3>
            <p class="who-for-desc">
              Dynamic calendar gatekeeping, de-confliction across global time zones, meeting objective verification, and agenda circulation.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Complex Travel Itineraries</h3>
            <p class="who-for-desc">
              Multi-leg international flight coordination, visa document preparation, ground transit booking, and real-time travel contingency management.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Briefings &amp; Correspondence</h3>
            <p class="who-for-desc">
              Executive briefing packs, board meeting synthesis, priority stakeholder correspondence drafting, and meeting minute distillation.
            </p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Engagement Flow</span>
          <h2 class="section-title">How engagement works.</h2>
        </div>

        <div class="workflow-grid">
          <div class="workflow-step-card">
            <div class="workflow-step-num">01 / AUDIT</div>
            <h3 class="workflow-step-title">Preferences</h3>
            <p class="workflow-step-desc">We audit your communication style, meeting rules, travel preferences, and current calendar bottlenecks.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">02 / MATCH</div>
            <h3 class="workflow-step-title">Assignment</h3>
            <p class="workflow-step-desc">A dedicated Senior Executive Assistant with relevant industry familiarity is assigned directly to you.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">03 / ACCESS</div>
            <h3 class="workflow-step-title">Integration</h3>
            <p class="workflow-step-desc">Secure access setup across Google Workspace, Microsoft 365, Slack, and your travel management profiles.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">04 / EXECUTE</div>
            <h3 class="workflow-step-title">Rhythm</h3>
            <p class="workflow-step-desc">Daily morning schedule briefings, midday priority alignment, and continuous proactive gatekeeping.</p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Frequently Asked Questions</span>
          <h2 class="section-title">Common operational questions.</h2>
        </div>

        <div class="faq-list">
          <div class="faq-card">
            <h4 class="faq-q">How do you ensure confidentiality with sensitive correspondence?</h4>
            <p class="faq-a">Every Assista specialist works under strict bilateral non-disclosure agreements, credential isolation protocols, and encrypted device policies. No client correspondence is ever shared or stored on unapproved personal devices.</p>
          </div>
          <div class="faq-card">
            <h4 class="faq-q">What happens when my assigned assistant takes leave?</h4>
            <p class="faq-a">Assista maintains living Standard Operating Procedures for your preferences. A calibrated secondary specialist provides seamless coverage without any interruption to your daily calendar.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // FINANCE & RECONCILIATION (/services/finance-reconciliation)
  // ------------------------------------------------------------------------
  financeReconciliation: {
    route: '/services/finance-reconciliation',
    title: 'Finance & Reconciliation | Assista Corp',
    description: 'Precise financial administration, billing breakdowns, AP/AR oversight, and statement reconciliation under strict confidentiality.',
    canonicalUrl: 'https://assistacorp.com/services/finance-reconciliation',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Services', url: '/services' },
      { label: 'Finance & Reconciliation', url: '/services/finance-reconciliation' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Core Discipline 02',
      title: 'Finance & Transactional Reconciliation Support',
      lead: 'Rigorous financial hygiene, billing breakdowns, and transactional tracking managed under strict confidentiality.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">Scope of Financial Hygiene</span>
          <h2 class="section-title">What we manage for finance teams.</h2>
          <p class="section-desc">
            Assista establishes quiet, systematic support that keeps ledgers clean, statements matched, and audit trails orderly throughout the business cycle.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h3 class="who-for-title">Statement Reconciliation</h3>
            <p class="who-for-desc">
              Custodial trade reconciliation, monthly bank statement matching, credit card receipt audits, and ledger variance identification.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">AP &amp; AR Hygiene</h3>
            <p class="who-for-desc">
              Vendor invoice 3-way matching, purchase order verification, client billing breakdown compilation, and structured receivables follow-ups.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Audit &amp; CPA Packets</h3>
            <p class="who-for-desc">
              Month-end financial workpaper preparation, organized digital receipt archives, and pre-audit collation for your CPA or audit partners.
            </p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Safety Boundaries</span>
          <h2 class="section-title">Security &amp; dual-authorization controls.</h2>
          <p class="section-desc">
            Assista operates strictly under separation-of-duties principles. We provide preparation, tracking, and reconciliation support without holding authorization to release or disburse client funds.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 2rem;">
          <div class="who-for-card">
            <h3 class="who-for-title">Zero Fund Disbursement</h3>
            <p class="who-for-desc">Specialists prepare schedules and verify invoices; all payment releases remain strictly with your internal authorized signatories.</p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Software Sandboxing</h3>
            <p class="who-for-desc">Read/write permissions in QuickBooks, Xero, NetSuite, or Sage configured strictly to required ledger modules.</p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Audit Trail Logging</h3>
            <p class="who-for-desc">Every ledger adjustment and reconciliation entry is timestamped and documented for secondary review.</p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Frequently Asked Questions</span>
          <h2 class="section-title">Common operational questions.</h2>
        </div>

        <div class="faq-list">
          <div class="faq-card">
            <h4 class="faq-q">Does Assista have permission to disburse funds or sign checks?</h4>
            <p class="faq-a">Never. Assista operates exclusively in a supportive and reconciliation capacity. We prepare schedules and match invoices; all fund movements require your internal authorization.</p>
          </div>
          <div class="faq-card">
            <h4 class="faq-q">Which accounting and ERP packages do your specialists support?</h4>
            <p class="faq-a">Our teams work fluently across QuickBooks Online, Xero, NetSuite, Sage Intacct, Bill.com, Expensify, and major custodial platforms.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // CUSTOMER CARE & CX (/services/customer-care)
  // ------------------------------------------------------------------------
  customerCare: {
    route: '/services/customer-care',
    title: 'Customer Care & CX | Assista Corp',
    description: 'High-touch human customer care, VIP client triage, and escalation management delivered across global channels.',
    canonicalUrl: 'https://assistacorp.com/services/customer-care',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Services', url: '/services' },
      { label: 'Customer Care & CX', url: '/services/customer-care' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Core Discipline 03',
      title: 'Customer Care & Human CX Operations',
      lead: 'Empathic, brand-aligned human customer care across global channels.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">Human Support Model</span>
          <h2 class="section-title">Thoughtful customer care by brand-trained specialists.</h2>
          <p class="section-desc">
            Customers value warmth, clear communication, and rapid resolution. Assista provides dedicated customer support teams trained on your brand guidelines to represent your company with care.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h3 class="who-for-title">Omnichannel Support</h3>
            <p class="who-for-desc">
              Responsive Tier 1 and Tier 2 resolution across email, helpdesk tickets, live chat, and voice channels within agreed service windows.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">VIP &amp; Escalation Care</h3>
            <p class="who-for-desc">
              Priority triage for enterprise clients and high-value accounts, with documented escalation trees directly to your internal teams.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Knowledge &amp; Feedback</h3>
            <p class="who-for-desc">
              Continuous FAQ authoring, macro refinement, ticket sentiment tagging, and periodic customer insight reports for product teams.
            </p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Operational Framework</span>
          <h2 class="section-title">Quality rubrics and tone calibration.</h2>
        </div>

        <div class="workflow-grid">
          <div class="workflow-step-card">
            <div class="workflow-step-num">01 / CALIBRATE</div>
            <h3 class="workflow-step-title">Brand Voice</h3>
            <p class="workflow-step-desc">We codify your tone of voice, terminology, refund policies, and communication style into living guides.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">02 / INTEGRATE</div>
            <h3 class="workflow-step-title">Helpdesk Setup</h3>
            <p class="workflow-step-desc">Embedded setup in Zendesk, Gorgias, Intercom, or Freshdesk with customized tag hierarchies and views.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">03 / TRAIN</div>
            <h3 class="workflow-step-title">Scenario Drills</h3>
            <p class="workflow-step-desc">Specialists complete simulated ticket triage and escalation drills before handling live customer interactions.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">04 / DELIVER</div>
            <h3 class="workflow-step-title">Continuous Care</h3>
            <p class="workflow-step-desc">Consistent queue coverage, daily status summaries, and weekly quality assurance audits.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // RECRUITMENT & TALENT (/services/recruitment-talent)
  // ------------------------------------------------------------------------
  recruitmentTalent: {
    route: '/services/recruitment-talent',
    title: 'Recruitment & Talent | Assista Corp',
    description: 'Full-cycle candidate sourcing, rubric-based screening, and interview coordination embedded inside your ATS.',
    canonicalUrl: 'https://assistacorp.com/services/recruitment-talent',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Services', url: '/services' },
      { label: 'Recruitment & Talent', url: '/services/recruitment-talent' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Core Discipline 04',
      title: 'Recruitment Operations & Talent Coordination',
      lead: 'Full-cycle candidate sourcing, pipeline screening against custom rubrics, and interview coordination.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">Talent Operations Scope</span>
          <h2 class="section-title">What we manage for hiring teams.</h2>
          <p class="section-desc">
            Recruiting success depends on sourcing consistency and seamless interview coordination. Assista provides dedicated coordinators who keep your candidate pipeline moving forward without expensive agency placement fees.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h3 class="who-for-title">Active Sourcing</h3>
            <p class="who-for-desc">
              Targeted prospect discovery on LinkedIn Recruiter and specialized industry networks based on your specific role criteria.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Rubric Screening</h3>
            <p class="who-for-desc">
              Systematic resume evaluation against customized scoring rubrics, filtering incoming applicant volume to present top contenders.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Interview Coordination</h3>
            <p class="who-for-desc">
              Frictionless scheduling across complex multi-interviewer panels, candidate prep communications, and calendar management.
            </p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Transparent Model</span>
          <h2 class="section-title">Dedicated support without placement markup.</h2>
          <p class="section-desc">
            Unlike traditional recruitment agencies that charge contingent placement fees per hire, Assista provides dedicated talent coordinators as part of your ongoing operational infrastructure.
          </p>
        </div>

        <div class="workflow-grid" style="margin-top: 2rem;">
          <div class="workflow-step-card">
            <div class="workflow-step-num">01 / INTAKE</div>
            <h3 class="workflow-step-title">Role Alignment</h3>
            <p class="workflow-step-desc">We align on must-have competencies, scoring criteria, and ideal candidate background profiles.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">02 / INTEGRATE</div>
            <h3 class="workflow-step-title">ATS Access</h3>
            <p class="workflow-step-desc">Coordinators embed directly inside Greenhouse, Lever, Ashby, or Workable to manage stages natively.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">03 / SOURCE</div>
            <h3 class="workflow-step-title">Pipeline Delivery</h3>
            <p class="workflow-step-desc">Batches of verified candidates reviewed and presented according to agreed weekly cadence.</p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">04 / SCHEDULE</div>
            <h3 class="workflow-step-title">Care &amp; Logistics</h3>
            <p class="workflow-step-desc">Timely interview logistics, candidate follow-ups, and reference gathering conducted with professionalism.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // INDUSTRIES HUB (/industries)
  // ------------------------------------------------------------------------
  industries: {
    route: '/industries',
    title: 'Industries & Sectors | Assista Corp',
    description: 'Specialized operational infrastructure tailored for Healthcare, Private Wealth Offices, Corporate Law Firms, and E-Commerce Brands.',
    canonicalUrl: 'https://assistacorp.com/industries',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Industries', url: '/industries' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Specialized Practice Areas',
      title: 'Operational infrastructure tailored to demanding sectors.',
      lead: 'Operational workflows vary significantly across industries. Assista deploys dedicated squads with sector-specific familiarity—understanding regulatory boundaries, specialized software, and operating terminology.'
    }),
    contentHtml: `
    <section class="section section-white" id="healthcare">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 2.5rem;">
          <span class="section-tag">Practice Area 01</span>
          <h2 class="section-title">Healthcare &amp; Clinical Practices</h2>
          <p class="section-desc">
            Protecting clinical focus where patient care and regulatory compliance matter most.
          </p>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--brand-navy); margin-bottom: 1rem;">Typical workflows we can support:</h3>
        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h4 class="who-for-title">Patient Intake &amp; Eligibility</h4>
            <p class="who-for-desc">Patient intake document verification, insurance coverage pre-authorization checks, and record creation in EMR/EHR systems.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Calendar &amp; Appointment Care</h4>
            <p class="who-for-desc">De-confliction for senior clinicians, cancellation backfills, automated appointment reminders, and follow-up scheduling.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Medical Record Transfers</h4>
            <p class="who-for-desc">Coordination of diagnostic reports and specialist referral transfers in full compliance with HIPAA privacy standards.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-subtle" id="wealth">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 2.5rem;">
          <span class="section-tag">Practice Area 02</span>
          <h2 class="section-title">Private Wealth &amp; Family Offices</h2>
          <p class="section-desc">
            Confidential fiduciary support for wealth managers, fund partners, and family office principals.
          </p>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--brand-navy); margin-bottom: 1rem;">Typical workflows we can support:</h3>
        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h4 class="who-for-title">KYC &amp; AML Document Collation</h4>
            <p class="who-for-desc">Client onboarding file completeness verification, annual identity refreshes, and compliance filing reminders.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Quarterly Reporting Packets</h4>
            <p class="who-for-desc">Performance summary collation across multiple custodians, presentation formatting, and secure delivery to clients.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Custodial Reconciliation</h4>
            <p class="who-for-desc">Monthly custodial statement tracking, fee reconciliation, and portfolio management data verification.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-white" id="legal">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 2.5rem;">
          <span class="section-tag">Practice Area 03</span>
          <h2 class="section-title">Corporate Law Firms</h2>
          <p class="section-desc">
            Rigorous case preparation and administrative continuity behind practicing attorneys and advocates.
          </p>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--brand-navy); margin-bottom: 1rem;">Typical workflows we can support:</h3>
        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h4 class="who-for-title">Docket Calendaring</h4>
            <p class="who-for-desc">Judicial rule compliance checks, court filing deadline tracking, and hearing date de-confliction.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Discovery Document Indexing</h4>
            <p class="who-for-desc">Deposition transcript indexing, Bates numbering preparation, exhibit binder organization, and document logging.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Time-Billing Reconciliation</h4>
            <p class="who-for-desc">Fee sheet compilation, client matter time-entry review, and monthly billing statement preparation.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-subtle" id="ecommerce">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 2.5rem;">
          <span class="section-tag">Practice Area 04</span>
          <h2 class="section-title">E-Commerce &amp; Brands</h2>
          <p class="section-desc">
            Responsive human care and operational support for growing consumer brands and digital commerce.
          </p>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--brand-navy); margin-bottom: 1rem;">Typical workflows we can support:</h3>
        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h4 class="who-for-title">Customer Experience Care</h4>
            <p class="who-for-desc">Tier 1 &amp; 2 resolutions across Gorgias, Zendesk, and live chat with thoughtful brand tone adherence.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Fulfillment Tracking</h4>
            <p class="who-for-desc">Courier exception investigations, return merchandise authorizations (RMAs), and damaged shipment processing.</p>
          </div>
          <div class="who-for-card">
            <h4 class="who-for-title">Catalog Data Hygiene</h4>
            <p class="who-for-desc">SKU attribute updates, product description taxonomy, digital asset tagging, and inventory reconciliations.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // HOW WE WORK (/how-we-work)
  // ------------------------------------------------------------------------
  howWeWork: {
    route: '/how-we-work',
    title: 'How We Work | Assista Corp',
    description: 'Learn the Assista operational methodology: Understand, Build, Integrate, and Operate.',
    canonicalUrl: 'https://assistacorp.com/how-we-work',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'How We Work', url: '/how-we-work' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'The Assista Operating Methodology',
      title: 'How dedicated operational cells integrate and deliver.',
      lead: 'Assista builds permanent, dedicated operational squads that learn your workflows, adopt your software environments, and execute daily with meticulous consistency.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">Engagement Lifecycle</span>
          <h2 class="section-title">The 4-stage operational framework.</h2>
          <p class="section-desc">
            We reject the one-size-fits-all model of call centers and gig marketplaces. Assista implements a disciplined 4-stage path that ensures smooth integration without disrupting your ongoing business.
          </p>
        </div>

        <div class="workflow-grid" style="margin-top: 0;">
          <div class="workflow-step-card">
            <div class="workflow-step-num">STAGE 01</div>
            <h3 class="workflow-step-title">Understand</h3>
            <p class="workflow-step-desc">
              Comprehensive workflow audit, bottleneck diagnosis, and mapping of required software permissions and communication cadences.
            </p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">STAGE 02</div>
            <h3 class="workflow-step-title">Build</h3>
            <p class="workflow-step-desc">
              Selecting assigned specialists with relevant sector familiarity, establishing living SOPs, and authoring quality rubrics.
            </p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">STAGE 03</div>
            <h3 class="workflow-step-title">Integrate</h3>
            <p class="workflow-step-desc">
              Embedded onboarding into Slack, Teams, Notion, and CRM. Supervised shadow execution during ramp to ensure defect-free handover.
            </p>
          </div>
          <div class="workflow-step-card">
            <div class="workflow-step-num">STAGE 04</div>
            <h3 class="workflow-step-title">Operate</h3>
            <p class="workflow-step-desc">
              Continuous daily execution, proactive issue resolution, daily standup notes, and monthly reviews with your Client Director.
            </p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;">
          <span class="section-tag">Core Tenets</span>
          <h2 class="section-title">Operating principles we adhere to.</h2>
        </div>

        <div class="who-for-grid" style="margin-top: 2rem;">
          <div class="who-for-card">
            <h3 class="who-for-title">Accountability Over Automation</h3>
            <p class="who-for-desc">You know the names and roles of the specialists executing your work. Real people taking pride in output quality.</p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Living Documentation</h3>
            <p class="who-for-desc">Every workflow is codified into standard operating procedures so your business preserves continuity through any transition.</p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Enterprise Confidentiality</h3>
            <p class="who-for-desc">Bilateral NDAs, isolated user permissions, and strict data governance protect your proprietary information at every step.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // ABOUT (/about)
  // ------------------------------------------------------------------------
  about: {
    route: '/about',
    title: 'About Assista Corp | The People Behind Business.',
    description: 'Learn about Assista Corp, our operating philosophy, dedication to human operational infrastructure, and governance standards.',
    canonicalUrl: 'https://assistacorp.com/about',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'About Assista Corp',
      title: 'The People Behind Business.',
      lead: 'Assista Corp was founded on a simple conviction: modern businesses do not need another software subscription to solve operational friction. They need capable, accountable people.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div style="max-width: 820px; margin-bottom: 3.5rem;">
          <span class="section-tag">Company Purpose</span>
          <h2 class="section-title">Why human operational infrastructure matters.</h2>
          <p class="section-desc">
            In an era where companies are told to automate everything, leaders frequently discover that rigid tools and automated bots break down when faced with complex, nuanced business challenges.
          </p>
          <p class="section-desc" style="margin-top: 1rem;">
            High-stakes business requires context, discretion, and ownership. Assista builds and manages the human operational layer that keeps companies moving forward smoothly, predictably, and securely.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 0;">
          <div class="who-for-card">
            <h3 class="who-for-title">Context &amp; Judgment</h3>
            <p class="who-for-desc">
              Understanding which meeting takes precedence, how to phrase delicate correspondence, and when an issue demands immediate leadership escalation.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Operational Hygiene</h3>
            <p class="who-for-desc">
              Maintaining spotless calendars, reconciled accounts, and organized archives without leadership having to micromanage daily execution.
            </p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Permanent Continuity</h3>
            <p class="who-for-desc">
              Building institutional knowledge within documented operating procedures so your business remains resilient through growth and change.
            </p>
          </div>
        </div>

        <div style="margin-top: 4.5rem; max-width: 820px;" id="governance">
          <span class="section-tag">Institutional Governance</span>
          <h2 class="section-title">Operating standards &amp; client protection.</h2>
          <p class="section-desc">
            We treat client data, workflows, and communications with enterprise-grade seriousness.
          </p>
        </div>

        <div class="who-for-grid" style="margin-top: 2rem;" id="confidentiality">
          <div class="who-for-card">
            <h3 class="who-for-title">Confidentiality Standards</h3>
            <p class="who-for-desc">Every specialist is legally bound by comprehensive non-disclosure agreements before onboarding onto client accounts.</p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Access Sandboxing</h3>
            <p class="who-for-desc">Least-privilege permission models ensure specialists only have access to the specific systems required for their workflows.</p>
          </div>
          <div class="who-for-card">
            <h3 class="who-for-title">Quality Assurance</h3>
            <p class="who-for-desc">Designated Client Directors conduct periodic operational audits to ensure ongoing adherence to documented procedures.</p>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: true
  },

  // ------------------------------------------------------------------------
  // CONTACT (/contact)
  // ------------------------------------------------------------------------
  contact: {
    route: '/contact',
    title: 'Contact Assista Corp | Operational Consultation',
    description: 'Schedule an operational consultation with an Assista Corp client director to evaluate your workflow bottlenecks and squad requirements.',
    canonicalUrl: 'https://assistacorp.com/contact',
    breadcrumbItems: [
      { label: 'Home', url: '/' },
      { label: 'Contact', url: '/contact' }
    ],
    heroHtml: renderPageHero({
      eyebrow: 'Client Operations Desk',
      title: 'Schedule an operational consultation.',
      lead: 'Connect directly with an Assista client director. We will review your current workflow bottlenecks, discuss operational coverage models, and assemble a tailored operational squad proposal.'
    }),
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div class="contact-page-grid">
          <!-- Contact Form Card -->
          <div class="contact-form-card">
            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--brand-navy); margin-bottom: 0.5rem;">
              Direct Business Inquiry
            </h2>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem;">
              All inquiries are treated with strict confidentiality. A client director will review your inquiry and follow up directly.
            </p>

            <form id="contact-page-form">
              <input type="hidden" name="turnstile_token" value="cf_turnstile_pass_token_demo">

              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="contact-name">Full Name *</label>
                  <input type="text" id="contact-name" name="name" class="form-input" required placeholder="e.g. Eleanor Vance">
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-email">Work Email *</label>
                  <input type="email" id="contact-email" name="email" class="form-input" required placeholder="e.g. e.vance@firm.com">
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="contact-company">Company Name *</label>
                  <input type="text" id="contact-company" name="company" class="form-input" required placeholder="e.g. Kensington Capital">
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-role">Role / Title *</label>
                  <input type="text" id="contact-role" name="role" class="form-input" required placeholder="e.g. Managing Partner">
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="contact-website">Company Website</label>
                  <input type="url" id="contact-website" name="website" class="form-input" placeholder="e.g. https://firm.com">
                </div>
                <div class="form-group">
                  <label class="form-label" for="contact-service">Service of Interest *</label>
                  <select id="contact-service" name="service" class="form-select" required>
                    <option value="Executive Support">Executive Support</option>
                    <option value="Finance & Reconciliation">Finance &amp; Reconciliation</option>
                    <option value="Customer Care & CX">Customer Care &amp; CX</option>
                    <option value="Recruitment & Talent">Recruitment &amp; Talent</option>
                    <option value="Multiple Disciplines" selected>Multiple Disciplines / Tailored Squad</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="contact-message">Operational Requirements &amp; Scope *</label>
                <textarea id="contact-message" name="message" class="form-textarea" rows="4" required placeholder="Please describe the primary workflows, team friction, or operational areas you need Assista to support..."></textarea>
              </div>

              <div style="margin-top: 1.5rem;">
                <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 1rem; font-size: 1rem;">
                  <span>Submit Consultation Request</span>
                  <span class="btn-arrow" aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </form>

            <div id="contact-page-success" style="display: none; padding: 2rem; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-align: center;">
              <div style="font-size: 2.5rem; color: var(--brand-navy); margin-bottom: 0.75rem;" aria-hidden="true">✓</div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--brand-navy); margin-bottom: 0.5rem;">Inquiry Received</h3>
              <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem;">
                Thank you for contacting Assista Corp. A client director will review your operational requirements and follow up directly via email.
              </p>
            </div>
          </div>

          <!-- Direct Operations Desk Info -->
          <div class="contact-info-panel">
            <div class="contact-info-block">
              <div class="contact-info-label">Operations Desk</div>
              <div class="contact-info-val">Client Partnerships</div>
              <p class="contact-info-desc">
                Email: <a href="mailto:operations@assistacorp.com" style="color:var(--brand-navy); font-weight:600;">operations@assistacorp.com</a>
              </p>
            </div>

            <div class="contact-info-block">
              <div class="contact-info-label">General Inquiries</div>
              <div class="contact-info-val">Assista Corporate</div>
              <p class="contact-info-desc">
                Email: <a href="mailto:inquiries@assistacorp.com" style="color:var(--brand-navy); font-weight:600;">inquiries@assistacorp.com</a>
              </p>
            </div>

            <div class="contact-info-block">
              <div class="contact-info-label">Operating Schedule</div>
              <div class="contact-info-val">Global Coverage</div>
              <p class="contact-info-desc">
                Active Client Cell Coverage: Mon–Fri, 8:00 AM – 6:00 PM (GMT &amp; EST business time zones).
              </p>
            </div>

            <div class="contact-info-block">
              <div class="contact-info-label">Confidentiality Notice</div>
              <div class="contact-info-val">Protected Communications</div>
              <p class="contact-info-desc">
                All inquiries and preliminary workflow audits are protected under strict corporate non-disclosure protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: false
  },

  // ------------------------------------------------------------------------
  // 404 NOT FOUND
  // ------------------------------------------------------------------------
  notFound: {
    route: '/404',
    title: 'Page Not Found | Assista Corp',
    description: 'The requested page could not be found. Explore Assista Corp services or return to the homepage.',
    canonicalUrl: 'https://assistacorp.com/404',
    heroHtml: '',
    contentHtml: `
    <section class="section section-white">
      <div class="container">
        <div class="error-404-box">
          <div class="error-404-num">404</div>
          <h1 class="error-404-title">Page not found.</h1>
          <p class="error-404-desc">
            The page you are looking for may have been moved, renamed, or does not exist. Please use the navigation links below to explore Assista Corp.
          </p>
          <div class="error-404-actions">
            <a href="/" class="btn btn-primary">
              <span>Back to Assista</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a href="/services" class="btn btn-navy">
              <span>Explore Services</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
            <a href="/contact" class="btn btn-outline">
              <span>Contact Assista</span>
              <span class="btn-arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
    `,
    showConversionBanner: false
  }
};

/**
 * Render a complete HTML string for any registered page key.
 */
function getRenderedPage(pageKey) {
  const page = PAGES[pageKey];
  if (!page) return null;

  return renderPage({
    title: page.title,
    description: page.description,
    canonicalUrl: page.canonicalUrl,
    currentRoute: page.route,
    breadcrumbItems: page.breadcrumbItems,
    heroHtml: page.heroHtml,
    contentHtml: page.contentHtml,
    showConversionBanner: page.showConversionBanner
  });
}

module.exports = {
  PAGES,
  getRenderedPage
};
