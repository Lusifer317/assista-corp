const { db } = require('../lib/db');
const { hashPassword, generateBase32Secret } = require('../lib/auth');

function seedDatabase() {
  console.log('Seeding Assista Corp database...');

  // 1. Seed Users
  db.exec('DELETE FROM users');
  const adminSecret = generateBase32Secret();
  const { hash: adminHash, salt: adminSalt } = hashPassword('Assista2026!Secured');
  const { hash: editorHash, salt: editorSalt } = hashPassword('Assista2026!Editor');
  const { hash: salesHash, salt: salesSalt } = hashPassword('Assista2026!Sales');

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, salt, name, role, mfa_secret, mfa_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin@assistacorp.com', adminHash, adminSalt, 'Elena Rostova', 'admin', adminSecret, 1);
  insertUser.run('editor@assistacorp.com', editorHash, editorSalt, 'Marcus Sterling', 'editor', null, 0);
  insertUser.run('sales@assistacorp.com', salesHash, salesSalt, 'Sarah Chen', 'sales', null, 0);

  // 2. Seed CMS Content
  db.exec('DELETE FROM cms_content');
  const insertCMS = db.prepare(`
    INSERT INTO cms_content (section_key, title, subtitle, content_json)
    VALUES (?, ?, ?, ?)
  `);

  insertCMS.run(
    'hero',
    'THE PEOPLE BEHIND BUSINESS.',
    'From everyday operations to specialized support, Assista gives businesses the people they need to move forward.',
    JSON.stringify({
      eyebrow: 'Global Business Services',
      cta_primary: 'Meet Assista →',
      cta_secondary: 'Explore What We Do',
      workflows: [
        { name: 'Executive Support', detail: 'High-leverage calendar, travel & briefing orchestration' },
        { name: 'Customer Care', detail: 'Empathic, human resolution across multi-channel client touchpoints' },
        { name: 'Finance & Accounting', detail: 'Reconciliation, billing, payroll support & ledger hygiene' },
        { name: 'Recruitment & Talent', detail: 'Global sourcing, pipeline vetting & interview coordination' },
        { name: 'Operations & Back Office', detail: 'Process governance, cross-functional documentation & compliance' },
        { name: 'Research & Intelligence', detail: 'Bespoke market syntheses, vendor diligence & competitor briefs' }
      ]
    })
  );

  insertCMS.run(
    'behind_business',
    'THE PEOPLE BEHIND BUSINESS.',
    'Different businesses. Different needs. One reliable partner.',
    JSON.stringify({
      narrative: 'On the surface, every great business is known for its signature client experience. But behind the curtain, an intricate symphony of operations keeps the engine running.',
      scenarios: [
        {
          id: 'medical',
          label: 'Medical Practice',
          surface_title: 'Clinical Excellence & Patient Care',
          surface_desc: 'Physicians focusing 100% of their energy on diagnostic precision, patient comfort, and surgical care without administrative distraction.',
          behind_title: 'The Assista Clinical Ops Squad Behind Them',
          behind_tasks: [
            'HIPAA-compliant intake & patient scheduling',
            'Insurance pre-authorization & billing inquiries',
            'Referral tracking & specialist record transfers',
            'Post-consultation follow-up & prescription confirmations',
            'Daily calendar de-confliction for senior clinicians'
          ]
        },
        {
          id: 'finance',
          label: 'Financial Advisory',
          surface_title: 'Fiduciary Strategy & Client Wealth Advisory',
          surface_desc: 'Partners conducting discreet portfolio reviews, private wealth consultations, and long-term capital allocation strategies.',
          behind_title: 'The Assista Financial Ops Squad Behind Them',
          behind_tasks: [
            'Client KYC and regulatory documentation audits',
            'Quarterly performance report compilation & formatting',
            'Trade reconciliation & custodial statement tracking',
            'High-net-worth client calendar & meeting preparation',
            'Due diligence briefings on prospective investment vehicles'
          ]
        },
        {
          id: 'legal',
          label: 'Corporate Law Firm',
          surface_title: 'Courtroom Advocacy & High-Stakes Counsel',
          surface_desc: 'Attorneys delivering nuanced commercial counsel, negotiating cross-border mergers, and leading trial defense.',
          behind_title: 'The Assista Legal Ops Squad Behind Them',
          behind_tasks: [
            'Case docket tracking & court filing deadline management',
            'Deposition transcript indexing & Bates stamping prep',
            'Time-tracking reconciliation & client billing breakdowns',
            'Discovery document collation & confidential review logs',
            'Direct coordination with expert witnesses and judicial clerks'
          ]
        },
        {
          id: 'ecommerce',
          label: 'Global E-Commerce Brand',
          surface_title: 'Inspiring Brand Identity & Product Excellence',
          surface_desc: 'Founders creating beloved consumer products, managing creative campaigns, and driving international brand growth.',
          behind_title: 'The Assista Commercial Ops Squad Behind Them',
          behind_tasks: [
            'Omnichannel tier-1 customer resolutions (email, chat, VIP)',
            'Vendor communication & freight shipment tracking',
            'Inventory level reconciliations across 4 fulfillment hubs',
            'Chargeback dispute resolution & payment reviews',
            'Catalog taxonomy updates & product data hygiene'
          ]
        }
      ]
    })
  );

  insertCMS.run(
    'difference',
    'YOU FOCUS ON THE BUSINESS. WE HELP HANDLE THE REST.',
    'A growing business demands exceptional leadership, strategic clarity, and client intimacy. But underneath every breakthrough is an ocean of vital operational momentum that cannot be neglected.',
    JSON.stringify({
      point_1: 'No Staffing Middlemen: Dedicated professionals who integrate directly into your communications, tools, and company culture.',
      point_2: 'Operational Rigor: Managed continuity with dedicated squad leads and proactive redundancy so your workflows never stall.',
      point_3: 'Ownership Mindset: Team members selected for contextual intelligence, discretion, and quiet pride in execution.'
    })
  );

  insertCMS.run(
    'trust',
    'PEOPLE YOU CAN TRUST. WORK YOU CAN RELY ON.',
    'Trust is not an award badge; it is the discipline of showing up with uncompromising security, total confidentiality, and institutional accountability every single business day.',
    JSON.stringify({
      pillars: [
        { title: 'Confidentiality', desc: 'Rigorous bilateral NDAs, clean-desk policies, and compartmentalized access controls safeguarding your sensitive proprietary data.' },
        { title: 'Accountability', desc: 'Dedicated client success leads, daily transparent activity logs, and documented SOPs tailored to your unique internal standards.' },
        { title: 'Consistency', desc: 'Synchronized workflows that eliminate variability. Same standards on Monday morning as Friday afternoon.' },
        { title: 'Quality', desc: 'Rigorous vetting that accepts fewer than 3% of global applicants, evaluating contextual acumen, discretion, and professional polish.' },
        { title: 'Security', desc: 'Enterprise-grade zero-trust posture, encrypted credential vaults, SOC2-aligned protocols, and continuous data hygiene training.' },
        { title: 'Scalability', desc: 'Seamlessly transition from a single executive right-hand to an orchestrated 20-person multi-disciplinary operational squad as your firm scales.' }
      ]
    })
  );

  insertCMS.run(
    'global',
    'GOOD PEOPLE SHOULD NOT HAVE BORDERS.',
    'Assista unites top-tier operational professionals across major financial and commercial capitals into one seamless extension of your enterprise.',
    JSON.stringify({
      stats: [
        { label: 'Time Zones Synchronized', value: '24 / 7' },
        { label: 'Client Retention Rate', value: '98.4%' },
        { label: 'Average Talent Tenure', value: '3.8 yrs' },
        { label: 'Operational Uptime SLA', value: '99.9%' }
      ],
      hubs: [
        { city: 'London', role: 'European Advisory & Legal Support Hub', tz: 'GMT / BST' },
        { city: 'New York', role: 'Capital Markets & Executive Ops Hub', tz: 'EST / EDT' },
        { city: 'Singapore', role: 'Asia-Pacific Operations & Trade Desk', tz: 'SGT' },
        { city: 'Sydney', role: 'Australasia Support & Logistics Ops', tz: 'AEST' },
        { city: 'Zurich', role: 'Private Banking & Compliance Support', tz: 'CET' },
        { city: 'Toronto', role: 'North American Growth & Clinical Ops', tz: 'EST / EDT' }
      ]
    })
  );

  // 3. Seed Services (Capability Universe)
  db.exec('DELETE FROM services');
  const insertService = db.prepare(`
    INSERT INTO services (category, slug, name, tagline, description, deliverables, team_roles, typical_sla, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Category: PEOPLE
  insertService.run(
    'People',
    'executive-support',
    'Executive Support',
    'High-leverage operational leverage for founders, partners, and C-suite leaders.',
    'A dedicated executive right-hand who manages complex multi-time-zone travel, dynamic calendar triage, high-priority correspondence drafting, and executive briefing synthesis.',
    JSON.stringify(['Dynamic calendar & inbox gatekeeping', 'Multi-leg international itinerary & logistics', 'Executive briefing packs & agenda synthesis', 'Board & investor correspondence drafting', 'Personal confidential errands & family office coordination']),
    JSON.stringify(['Senior Executive Assistant', 'Chief of Staff Associate', 'Travel Concierge Specialist']),
    '< 15 min response time during active business hours',
    1
  );

  insertService.run(
    'People',
    'virtual-assistance',
    'Virtual Assistance',
    'Seamless daily execution of complex administrative and operational workflows.',
    'Professional, dependable operational support embedded into your existing Slack, Notion, Google Workspace, or Microsoft 365 environments.',
    JSON.stringify(['Process documentation & standard operating procedures', 'Meeting minutes & action-item tracking', 'Vendor coordination & service renewals', 'Expense reporting & credit card reconciliation', 'Digital asset management & file taxonomy']),
    JSON.stringify(['Dedicated Operations Assistant', 'Administrative Lead', 'Documentation Specialist']),
    'Same-day execution for all scheduled workflows',
    2
  );

  insertService.run(
    'People',
    'customer-support',
    'Customer Support',
    'Empathic, brand-aligned human customer care across global channels.',
    'Thoughtful, brand-trained customer success specialists who represent your company with warmth, clarity, and rapid problem resolution.',
    JSON.stringify(['Omnichannel tier 1 & 2 support (Email, Live Chat, Phone)', 'VIP client triage & escalation management', 'Knowledge base creation & FAQ refinement', 'Customer feedback tagging & product intelligence reports', 'SLA adherence & CSAT tracking']),
    JSON.stringify(['Customer Experience Specialist', 'Escalations Manager', 'QA & Feedback Analyst']),
    '< 8 min average response time on live channels',
    3
  );

  insertService.run(
    'People',
    'recruitment-talent',
    'Recruitment & Talent',
    'Full-cycle candidate sourcing, pipeline screening, and interview coordination.',
    'Expand your internal organization with dedicated talent researchers and coordinators who build active candidate pipelines and manage interview logistics seamlessly.',
    JSON.stringify(['Active talent sourcing & LinkedIn Recruiter outreach', 'Resume screening against custom rubrics', 'Interview scheduling across global interview panels', 'Candidate experience communication & updates', 'Background checks & reference collation']),
    JSON.stringify(['Talent Acquisition Specialist', 'Sourcing Researcher', 'Recruiting Coordinator']),
    '48-hour pipeline candidate submissions',
    4
  );

  // Category: OPERATIONS
  insertService.run(
    'Operations',
    'administration',
    'Administration & Governance',
    'Precision calendar, documentation, procurement, and process coordination.',
    'Systematic back-office administrative management that prevents organizational drag and keeps corporate functions compliant and orderly.',
    JSON.stringify(['Document drafting, formatting, and template governance', 'Corporate filings tracking & deadline reminders', 'Vendor contract repository management', 'Office management & supply chain coordination', 'Internal team announcement distribution']),
    JSON.stringify(['Senior Administrative Officer', 'Process Coordinator', 'Governance Specialist']),
    '100% adherence to documented governance timetables',
    5
  );

  insertService.run(
    'Operations',
    'research-intel',
    'Research & Market Intelligence',
    'Actionable executive briefs, vendor due diligence, and industry intelligence.',
    'Rigorous secondary research, competitor benchmarking, and market opportunity analyses synthesized into concise, decision-ready executive memorandums.',
    JSON.stringify(['Competitor pricing & feature matrix analyses', 'Vendor diligence & RFP comparison tables', 'Industry trend digests & regulatory watches', 'Prospect company executive profiles', 'Conference & event intelligence prep']),
    JSON.stringify(['Senior Research Analyst', 'Industry Intelligence Specialist', 'Information Synthesizer']),
    '24 to 48-hour turnaround on bespoke research briefs',
    6
  );

  insertService.run(
    'Operations',
    'data-support',
    'Data Support & CRM Hygiene',
    'Meticulous record audits, CRM hygiene, data enrichment, and catalog maintenance.',
    'Clean, dependable data is the lifeblood of high-performing teams. We systematically deduplicate, verify, and enrich your CRM, ERP, and operational databases.',
    JSON.stringify(['Salesforce / HubSpot / Pipedrive deduplication & enrichment', 'Product catalog updates & attribute taxonomy', 'Data extraction from unstructured documents', 'Data audit logs & periodic integrity verifications', 'ERP transaction entry & reconciliation']),
    JSON.stringify(['Data Operations Lead', 'Database Hygiene Specialist', 'Quality Assurance Analyst']),
    '99.8% record accuracy verified by secondary QA audit',
    7
  );

  insertService.run(
    'Operations',
    'back-office',
    'Back Office Operations',
    'Resilient operational coordination keeping daily machinery running without friction.',
    'End-to-end back-office orchestration that handles repetitive but critical transactions, fulfillment verification, and operational reporting.',
    JSON.stringify(['Order processing & shipping verification', 'Customs documentation collation', 'Vendor onboarding & compliance checks', 'Daily operational KPI scorecard compilation', 'Cross-departmental ticketing triage']),
    JSON.stringify(['Back Office Supervisor', 'Operations Coordinator', 'Fulfillment Auditor']),
    'Real-time SLA monitoring with continuous handover',
    8
  );

  // Category: GROWTH
  insertService.run(
    'Growth',
    'lead-generation',
    'Lead Generation & ICP Mapping',
    'Highly targeted prospect research, ICP mapping, and outbound qualification.',
    'Bespoke, human-verified account research that uncovers high-value prospective buyers, verifies direct contact details, and maps buying committees.',
    JSON.stringify(['Ideal Customer Profile (ICP) criteria matching', 'Verified contact discovery & phone/email validation', 'Buying committee org-chart mapping', 'Trigger-event monitoring (funding, leadership hires, expansion)', 'CRM prospect import & segmentation']),
    JSON.stringify(['Lead Generation Strategist', 'Account Researcher', 'Data Verification Specialist']),
    'Zero bounce-rate guarantee on verified lead lists',
    9
  );

  insertService.run(
    'Growth',
    'sales-support',
    'Sales Support & Deal Operations',
    'Proposal preparation, quote generation, CRM pipeline upkeep, and deal follow-ups.',
    'Enable your account executives to spend all their time in front of clients while Assista constructs proposals, updates deal stages, and chases contract signatures.',
    JSON.stringify(['Bespoke sales deck & proposal preparation', 'Price quotation drafting from standard pricing books', 'Contract signature chasing & follow-up sequencing', 'Post-meeting debrief extraction & CRM updates', 'Weekly sales pipeline hygiene and forecast packs']),
    JSON.stringify(['Sales Operations Specialist', 'Proposal Writer', 'Deal Desk Coordinator']),
    '< 2 hour turnaround on customized proposal drafts',
    10
  );

  insertService.run(
    'Growth',
    'marketing-support',
    'Marketing Support & Orchestration',
    'Campaign orchestration, collateral management, newsletter distribution, and social publishing.',
    'Reliable marketing operations support to keep your brand publishing schedule consistent, error-free, and distributed across all intended channels.',
    JSON.stringify(['Email newsletter formatting & QA across email clients', 'Social media calendar scheduling & asset distribution', 'Digital asset library maintenance & tagging', 'Webinar & virtual event attendee coordination', 'Campaign performance data aggregation']),
    JSON.stringify(['Marketing Operations Coordinator', 'Content Producer', 'Campaign Distribution Specialist']),
    'Strict zero-defect review before every campaign broadcast',
    11
  );

  // Category: SPECIALIZED SUPPORT
  insertService.run(
    'Specialized Support',
    'finance-accounting',
    'Finance & Administrative Support',
    'Invoicing, bookkeeping prep, AP/AR reconciliation, and financial schedule tracking.',
    'Discreet, precise financial administration that maintains order across your accounts payable, accounts receivable, and month-end reconciliation preparations.',
    JSON.stringify(['Accounts payable processing & invoice 3-way matching', 'Accounts receivable chasing & payment reconciliations', 'Credit card and receipt tracking in QuickBooks / Xero', 'Monthly financial packet preparation for CPAs', 'Billing dispute resolution & vendor statement review']),
    JSON.stringify(['Senior Financial Administrator', 'Bookkeeping Specialist', 'Accounts Reconciliation Lead']),
    'Audit-ready record keeping with dual-authorization checks',
    12
  );

  insertService.run(
    'Specialized Support',
    'healthcare-operations',
    'Healthcare & Medical Operations',
    'HIPAA-aware patient scheduling, intake coordination, clinical documentation, and billing follow-up.',
    'Trained medical operations personnel who interface gracefully with patients and clinicians, upholding strict HIPAA guidelines and clinical confidentiality.',
    JSON.stringify(['HIPAA-compliant patient appointment scheduling & reminders', 'Insurance verification & pre-authorization requests', 'Patient intake form completion verification', 'Medical record requests & secure provider-to-provider routing', 'Medical billing follow-ups & patient balance queries']),
    JSON.stringify(['Medical Practice Coordinator', 'Patient Intake Specialist', 'Healthcare Billing Liaison']),
    '100% HIPAA-compliant infrastructure and verified training',
    13
  );

  insertService.run(
    'Specialized Support',
    'it-support',
    'IT & Systems Support',
    'Tier-1 helpdesk, software license provisioning, user onboarding, and access management.',
    'Systematic IT operations to manage SaaS license inventories, provision new team member accounts, and handle everyday workplace technology requests.',
    JSON.stringify(['New hire Google Workspace / Microsoft 365 provisioning', 'SaaS seat audit & inactive license de-provisioning', 'Password resets & SSO access assistance', 'Hardware procurement tracking & asset registry', 'Software vendor support ticket management']),
    JSON.stringify(['IT Support Specialist', 'SaaS Administrator', 'Access & Identity Coordinator']),
    '< 10 min first-response on critical access roadblocks',
    14
  );

  insertService.run(
    'Specialized Support',
    'cybersecurity-support',
    'Cybersecurity Operations & Hygiene',
    'Vigilant security awareness protocols, credential policy audits, and data protection hygiene.',
    'Dedicated support to maintain institutional security hygiene across all team member endpoints, MFA policies, and confidential data storage protocols.',
    JSON.stringify(['1Password / Bitwarden enterprise vault administration', 'Multi-factor authentication (MFA) enforcement audits', 'Phishing awareness campaign coordination', 'Device compliance verification checks', 'Third-party vendor security questionnaire coordination']),
    JSON.stringify(['Security Operations Coordinator', 'Compliance Hygiene Auditor', 'Access Governance Lead']),
    'Continuous compliance monitoring with weekly security briefings',
    15
  );

  // 4. Seed Industries
  db.exec('DELETE FROM industries');
  const insertIndustry = db.prepare(`
    INSERT INTO industries (slug, name, headline, subheadline, off_their_plate, case_snapshot, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertIndustry.run(
    'healthcare',
    'Healthcare & Practices',
    'PROTECTING CLINICAL FOCUS WHERE EVERY MINUTE MATTERS.',
    'Physicians and clinical directors should spend their time treating patients, not battling appointment scheduling or chasing insurance claims.',
    JSON.stringify([
      'Patient intake verification & insurance eligibility confirmation',
      'Appointment calendar de-confliction & automated patient reminders',
      'Medical record transfers & referral provider coordination',
      'Billing inquiry triage & patient balance follow-ups',
      'HIPAA-compliant document archiving & clinical note formatting'
    ]),
    'Assista supported a 6-partner orthopedic surgery practice, absorbing 45 weekly hours of scheduling and intake management, driving a 28% drop in patient cancellations.',
    1
  );

  insertIndustry.run(
    'finance',
    'Financial Companies',
    'CONFIDENTIAL FIDUCIARY SUPPORT FOR WEALTH ARCHITECTS.',
    'Advisors and fund managers must preserve their focus on market dynamics, fiduciary responsibilities, and client trust.',
    JSON.stringify([
      'KYC/AML compliance documentation collation & renewal checks',
      'Quarterly performance report compilation & client delivery',
      'Custodial statement tracking & transaction reconciliation',
      'High-net-worth client meeting preparation & briefing folders',
      'Due diligence document room management for alternative investments'
    ]),
    'Partnered with a boutique Zurich/New York wealth advisory firm ($820M AUM) to manage client reporting and calendar coordination for 3 senior partners.',
    2
  );

  insertIndustry.run(
    'accounting',
    'Accounting Firms',
    'FLAWLESS LEDGER HYGIENE AND TAX SEASON EQUILIBRIUM.',
    'Tax partners and CPAs drown during peak deadlines. Assista establishes quiet, systematic support that keeps reconciliations flowing year-round.',
    JSON.stringify([
      'Client document chasing & missing tax schedule reminders',
      'Receipt and bank statement collation in cloud accounting software',
      'AP/AR transaction matching and variance flagging',
      'Client onboarding packet completion & engagement letters',
      'Pre-audit document compilation and file indexing'
    ]),
    'Eliminated seasonal burnout for a 25-person accounting practice by deploying a 4-person continuous document collation squad during Q1 and Q4.',
    3
  );

  insertIndustry.run(
    'legal',
    'Law Firms',
    'RIGOROUS CASE PREPARATION BEHIND SENIOR ADVOCATES.',
    'Litigators and corporate attorneys need absolute confidence that court deadlines, exhibits, and client billing are managed with flawless precision.',
    JSON.stringify([
      'Court filing deadline calendaring & judicial rule compliance checks',
      'Deposition transcript indexing & exhibit binder collation',
      'Client billing time-entry reconciliation & invoice generation',
      'Discovery document review logging & Bates numbering prep',
      'Conflict-of-interest check coordination & intake logging'
    ]),
    'Provided dedicated legal operations support to a boutique commercial litigation practice in London and New York, ensuring zero missed court deadlines across 80+ active cases.',
    4
  );

  insertIndustry.run(
    'real-estate',
    'Real Estate & Property',
    'HIGH-VELOCITY DEAL COORDINATION ACROSS MULTI-ASSET PORTFOLIOS.',
    'Brokers and property developers move at breakneck speed. Assista handles the transaction paperwork, listing coordination, and tenant communications.',
    JSON.stringify([
      'Transaction coordination from offer acceptance to closing',
      'Listing asset coordination (photography, floorplans, MLS entries)',
      'Tenant lease renewal notices & maintenance ticket dispatch',
      'Vendor quotes comparison for property renovations',
      'Investor quarterly distribution statements & property performance summaries'
    ]),
    'Assisted a commercial real estate brokerage with 14 partners, managing 400+ annual leasing transactions without adding internal administrative headcount.',
    5
  );

  insertIndustry.run(
    'ecommerce',
    'E-Commerce & Brands',
    'ROUND-THE-CLOCK HUMAN CARE FOR GLOBAL DIGITAL COMMERCE.',
    'Consumer brands require 24/7 customer empathy, rapid fulfillment coordination, and relentless catalog accuracy.',
    JSON.stringify([
      'Omnichannel tier 1/2 customer support via Gorgias, Zendesk, and email',
      'Fulfillment tracking & courier exception investigations',
      'Catalog data entry, SKU creation, and inventory audits',
      'Chargeback evidence submission & fraud mitigation logs',
      'Influencer outreach coordination & sample shipment tracking'
    ]),
    'Managed customer resolutions and fulfillment tracking for an apparel brand scaling from $8M to $25M in annual GMV with 99.2% positive CSAT.',
    6
  );

  insertIndustry.run(
    'saas',
    'SaaS & Software',
    'RETENTION AND CUSTOMER SUCCESS WITHOUT HEADCOUNT BLOAT.',
    'Product and engineering teams should build software. Assista manages user onboarding, tier-1 technical triage, and pipeline research.',
    JSON.stringify([
      'User onboarding guide assistance & account setup walkthroughs',
      'Tier-1 helpdesk bug triage & documentation for engineering',
      'CRM pipeline maintenance & lead enrichment from sign-ups',
      'Knowledge base and help center article updates',
      'Subscription renewal reminders & churn feedback collection'
    ]),
    'Embedded a specialized 5-person technical operations squad inside a Series B B2B software company, reducing first-response time from 4 hours to 7 minutes.',
    7
  );

  insertIndustry.run(
    'professional-services',
    'Professional Services',
    'STRATEGIC CALENDAR AND PROJECT MOMENTUM FOR CONSULTANTS.',
    'Management consultants and advisory directors sell their intellectual capital. Assista handles proposal creation, client scheduling, and research briefs.',
    JSON.stringify([
      'Client workshop scheduling across multiple time zones and stakeholders',
      'Proposal deck formatting and branded collateral QA',
      'Market research and data synthesis for client deliverables',
      'Project milestone tracking and consultant billing summaries',
      'Travel coordination and expense report finalization'
    ]),
    'Freed up an average of 14 billable hours per partner each month across a strategy consulting boutique with 18 managing directors.',
    8
  );

  insertIndustry.run(
    'startups',
    'Startups & Founders',
    'UNFAIR OPERATIONAL ADVANTAGE FOR EARLY-STAGE FOUNDERS.',
    'Founders need to talk to customers and build product. Assista steps in as an instant ops team handling everything from scheduling to initial candidate screening.',
    JSON.stringify([
      'Founder calendar protection and investor update coordination',
      'Customer interview scheduling & transcription notes',
      'Candidate sourcing and screening for first 15 critical hires',
      'Expense tracking, SaaS bill audits, and bookkeeping prep',
      'Vendor comparisons for initial tools, payroll, and insurance'
    ]),
    'Supported 12 Y Combinator and Seed-stage founders across their pivotal first 18 months, enabling them to double output without administrative fatigue.',
    9
  );

  insertIndustry.run(
    'enterprise',
    'Established Enterprise',
    'GOVERNED OPERATIONAL EXTENSIONS ACROSS GLOBAL DIVISIONS.',
    'Multi-national enterprises need vetted, continuous operational teams that integrate with strict compliance and IT policies.',
    JSON.stringify([
      'Cross-departmental vendor procurement and invoice approvals',
      'Global calendar and executive committee meeting logistics',
      'Enterprise data migration audits and catalog reconciliations',
      'Internal compliance training completion tracking',
      'Multi-regional reporting dashboards and executive briefings'
    ]),
    'Deployed 3 orchestrated support pods across European and North American divisions of a Fortune 500 industrial group with full ISO27001-aligned controls.',
    10
  );

  // 5. Seed Testimonials
  db.exec('DELETE FROM testimonials');
  const insertTestimonial = db.prepare(`
    INSERT INTO testimonials (quote, author_name, author_title, company, industry, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTestimonial.run(
    'Assista is not an agency we hire; they are the people who keep our clinical practice calm, orderly, and patient-focused every day. They treat our patients with genuine grace.',
    'Dr. Julian Vance, MD',
    'Managing Partner',
    'Kensington Medical Specialists',
    'Healthcare',
    1
  );

  insertTestimonial.run(
    'In private wealth, discretion is everything. The team Assista embedded with us handles confidential family office filings and portfolio packs with institutional precision.',
    'Claire DeWitt',
    'Chief Investment Officer',
    'Aethelgard Capital Partners',
    'Financial Advisory',
    2
  );

  insertTestimonial.run(
    'Our litigators have gained back at least 15 hours a week previously lost to administrative drag. Assista understands courtroom urgency and delivers without needing handholding.',
    'Arthur Pendelton, KC',
    'Senior Litigation Partner',
    'Pendelton & Sterling LLP',
    'Law Firm',
    3
  );

  insertTestimonial.run(
    'We scaled our direct-to-consumer brand from three fulfillment centers to ten internationally. Assista quietly managed all vendor communications and customer care without a hitch.',
    'Maya Lin-Sorenson',
    'Co-Founder & CEO',
    'Vespera Goods Group',
    'E-commerce',
    4
  );

  insertTestimonial.run(
    'The caliber of talent Assista matches you with is extraordinary. They think like senior business operators. You immediately forget they are not physically in your office.',
    'Henrik Lindqvist',
    'Managing Director',
    'Nordic Venture Partners',
    'Startups & Venture',
    5
  );

  // 6. Seed Case Stories
  db.exec('DELETE FROM stories');
  const insertStory = db.prepare(`
    INSERT INTO stories (title, client_type, industry, challenge, solution, outcome, metrics, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStory.run(
    'Restoring 1,800 Clinical Hours to a Multi-Specialty Surgical Group',
    '6-Partner Surgical Clinic',
    'Healthcare',
    'Surgeons and nurses were spending over 3 hours each evening on intake documentation, prior authorizations, and patient follow-up calls, causing physician burnout and mounting delays.',
    'Assista deployed a dedicated 4-person Medical Operations Squad trained in their EHR software and HIPAA protocols to absorb patient scheduling, insurance verification, and pre-consultation intake.',
    'Physicians reclaimed an average of 14 hours per week for direct patient care, while patient no-show rates dropped from 16% to under 4%.',
    JSON.stringify(['1,800+ Clinical Hours Reclaimed Annually', '75% Reduction in Patient No-Shows', '100% HIPAA Compliance Adherence']),
    1
  );

  insertStory.run(
    'Scaling High-Net-Worth Advisory Operations across London and Zurich',
    'Private Wealth Practice ($820M AUM)',
    'Financial Advisory',
    'As assets under management doubled, senior wealth advisors were swamped with quarterly report generation, custodial reconciliations, and compliance audits for ultra-high-net-worth families.',
    'Assista provided a dedicated 3-person Financial Operations Cell to manage custodial trade reconciliation, KYC documentation audits, and executive briefing preparation.',
    'Advisors increased their face-to-face client consultation capacity by 40% with zero increase in internal full-time back-office overhead.',
    JSON.stringify(['40% Increase in Client Meeting Capacity', '$0 Internal Back-Office Recruiter Fees', '4-Hour Turnaround on Quarterly Client Packs']),
    2
  );

  // 7. Seed Team
  db.exec('DELETE FROM team');
  const insertTeam = db.prepare(`
    INSERT INTO team (name, role, location, bio, avatar, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTeam.run(
    'Elena Rostova',
    'Managing Director, Global Operations',
    'London / Zurich',
    'Former operations executive at top-tier European advisory firms. Over 16 years architecting high-leverage support systems for global enterprises.',
    '/images/team-1.jpg',
    1
  );

  insertTeam.run(
    'David Thorne',
    'Head of Client Integration & Standards',
    'New York',
    'Specializes in organizational design, operational governance, and seamless talent integration across financial and legal institutions.',
    '/images/team-2.jpg',
    2
  );

  insertTeam.run(
    'Soraya Al-Mansoor',
    'Director of Specialized Capabilities',
    'Singapore',
    'Leads Assista clinical and financial operations cells with a relentless focus on compliance, privacy architecture, and zero-defect execution.',
    '/images/team-3.jpg',
    3
  );

  insertTeam.run(
    'Mateo Silva',
    'Head of People & Global Talent Vetting',
    'Toronto',
    'Oversees Assista rigorous global vetting process, ensuring that only the top 3% of operational professionals become Assista squad members.',
    '/images/team-4.jpg',
    4
  );

  // 8. Seed Insights
  db.exec('DELETE FROM insights');
  const insertInsight = db.prepare(`
    INSERT INTO insights (slug, title, category, read_time, excerpt, content, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertInsight.run(
    'the-leverage-paradox',
    'The Leverage Paradox: Why Modern Executives Spend 40% of Their Day on the Wrong Tasks',
    'Executive Effectiveness',
    '5 min read',
    'High-impact leaders rarely suffer from a lack of vision; they suffer from operational friction that slowly dilutes their strategic focus.',
    'Every hour a partner or CEO spends de-conflicting calendars, updating spreadsheets, or chasing vendor quotes is an hour stolen from enterprise value creation...',
    '2026-09-15 10:00:00'
  );

  insertInsight.run(
    'building-resilient-support-infrastructure',
    'Beyond the Assistant: Designing a Dedicated Operational Squad',
    'Organizational Design',
    '7 min read',
    'Why high-growth firms are replacing single-point-of-failure assistants with cross-functional support units that offer institutional continuity.',
    'A single assistant is vulnerable to illness, turnover, and vacation periods. A structured squad maintains shared SOPs, dual-person familiarity, and zero downtime...',
    '2026-09-20 14:30:00'
  );

  // 9. Seed Settings
  db.exec('DELETE FROM settings');
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('company_name', 'ASSISTA CORP');
  insertSetting.run('brand_tagline', 'The People Behind Business.');
  insertSetting.run('sales_email', 'sales@assistacorp.com');
  insertSetting.run('phone', '+1 (800) 492-7718');
  insertSetting.run('headquarters', '350 Fifth Avenue, 54th Floor, New York, NY 10118');
  insertSetting.run('european_office', '100 Bishopsgate, London EC2N 4AG, United Kingdom');
  insertSetting.run('turnstile_site_key', '1x00000000000000000000AA'); // Cloudflare test pass key
  insertSetting.run('turnstile_secret_key', '1x0000000000000000000000000000000AA'); // Cloudflare test pass secret

  // 10. Seed SEO
  db.exec('DELETE FROM seo_metadata');
  const insertSEO = db.prepare(`
    INSERT INTO seo_metadata (route, meta_title, meta_description, og_image, canonical_url, keywords)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertSEO.run(
    '/',
    'ASSISTA CORP | The People Behind Business | Global Business Services',
    'Assista provides dedicated operational, executive, customer, and specialized support teams that become seamless extensions of leading healthcare, financial, legal, and enterprise businesses.',
    '/images/og-assista.jpg',
    'https://assistacorp.com/',
    'global business services, executive support, operations, healthcare operations, legal support, financial administrative support, assista corp'
  );

  insertSEO.run(
    '/admin',
    'ASSISTA Operations Portal | Executive Dashboard & CRM',
    'Secure operations and intelligence portal for Assista Corp leadership, sales, and editors.',
    '/images/og-admin.jpg',
    'https://assistacorp.com/admin',
    'assista admin, crm, intelligence'
  );

  // 11. Seed Realistic CRM Leads with Attribution History
  db.exec('DELETE FROM leads');
  db.exec('DELETE FROM visitor_sessions');
  db.exec('DELETE FROM analytics_events');

  const insertLead = db.prepare(`
    INSERT INTO leads (name, business_email, company, industry, requirements, team_configuration, message, status, intent_score, session_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSession = db.prepare(`
    INSERT INTO visitor_sessions (session_id, first_seen, last_seen, referrer, device_category, browser, region, consent_status, path_history, lead_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO analytics_events (session_id, event_type, event_data, created_at)
    VALUES (?, ?, ?, ?)
  `);

  // Lead 1: High Intent / Hot Lead
  const ses1 = 'ses_' + Math.random().toString(36).substring(2, 10);
  insertSession.run(
    ses1,
    '2026-09-26 14:10:00',
    '2026-09-26 14:38:00',
    'https://www.ft.com/private-wealth',
    'Desktop',
    'Chrome',
    'London, UK',
    'granted',
    JSON.stringify(['/', '#behind-business', '#capabilities', '#industries', '#team-builder', '#contact']),
    1
  );

  insertEvent.run(ses1, 'page_view', JSON.stringify({ path: '/', title: 'Home' }), '2026-09-26 14:10:00');
  insertEvent.run(ses1, 'behind_business_toggle', JSON.stringify({ industry: 'Financial Advisory', label: 'Financial Practice' }), '2026-09-26 14:14:00');
  insertEvent.run(ses1, 'service_view', JSON.stringify({ category: 'Specialized Support', service: 'finance-accounting' }), '2026-09-26 14:20:00');
  insertEvent.run(ses1, 'industry_view', JSON.stringify({ industry: 'Finance', slug: 'finance' }), '2026-09-26 14:25:00');
  insertEvent.run(ses1, 'team_builder_interaction', JSON.stringify({ disciplines: ['Finance', 'Executive Support', 'Administration'], hours: 45 }), '2026-09-26 14:32:00');
  insertEvent.run(ses1, 'contact_opened', JSON.stringify({ source: 'team-builder' }), '2026-09-26 14:35:00');
  insertEvent.run(ses1, 'form_submitted', JSON.stringify({ company: 'Vanguard Sterling Advisory' }), '2026-09-26 14:38:00');

  insertLead.run(
    'Julianna Vance-Montgomery',
    'j.vance@vanguardsterling.co.uk',
    'Vanguard Sterling Advisory',
    'Finance',
    JSON.stringify(['Finance & Administrative Support', 'Executive Support', 'Administration']),
    JSON.stringify({ disciplines: ['Finance', 'Executive Support', 'Administration'], squadLead: 'Senior Operations Lead', estimatedHours: 45, coverage: 'Dedicated Squad' }),
    'We manage $650M in private client assets. Need a discreet 2-person executive and financial reconciliation squad to support our 4 managing partners in Mayfair.',
    'Qualified',
    95,
    ses1,
    JSON.stringify([
      { date: '2026-09-26 15:00:00', author: 'Sarah Chen', note: 'Held initial discovery call. Very impressed by the Behind the Business presentation. Scheduling deep-dive scoping for Thursday.' }
    ]),
    '2026-09-26 14:38:00'
  );

  // Lead 2: Healthcare Practice Lead
  const ses2 = 'ses_' + Math.random().toString(36).substring(2, 10);
  insertSession.run(
    ses2,
    '2026-09-26 18:22:00',
    '2026-09-26 18:41:00',
    'Direct / Organic',
    'Desktop',
    'Safari',
    'New York, USA',
    'granted',
    JSON.stringify(['/', '#industries', '#capabilities', '#contact']),
    2
  );
  insertEvent.run(ses2, 'page_view', JSON.stringify({ path: '/', title: 'Home' }), '2026-09-26 18:22:00');
  insertEvent.run(ses2, 'industry_view', JSON.stringify({ industry: 'Healthcare', slug: 'healthcare' }), '2026-09-26 18:28:00');
  insertEvent.run(ses2, 'service_view', JSON.stringify({ category: 'Specialized Support', service: 'healthcare-operations' }), '2026-09-26 18:34:00');
  insertEvent.run(ses2, 'form_submitted', JSON.stringify({ company: 'Madison Avenue Orthopedic Group' }), '2026-09-26 18:41:00');

  insertLead.run(
    'Dr. Harrison Cole, MD',
    'hcole@madisonortho.com',
    'Madison Avenue Orthopedic Group',
    'Healthcare',
    JSON.stringify(['Healthcare Operations', 'Administration']),
    JSON.stringify({ disciplines: ['Healthcare Operations', 'Administration'], squadLead: 'Clinical Operations Lead', estimatedHours: 35 }),
    'Looking to outsource non-clinical patient scheduling, pre-authorization, and referral file processing for 5 physicians.',
    'Contacted',
    82,
    ses2,
    JSON.stringify([
      { date: '2026-09-26 19:15:00', author: 'Elena Rostova', note: 'Dispatched HIPAA compliance credentials and case study. Awaiting response.' }
    ]),
    '2026-09-26 18:41:00'
  );

  // Lead 3: New Inquiry
  const ses3 = 'ses_' + Math.random().toString(36).substring(2, 10);
  insertSession.run(
    ses3,
    '2026-09-27 02:15:00',
    '2026-09-27 02:30:00',
    'https://www.linkedin.com/',
    'Tablet',
    'Safari',
    'Toronto, Canada',
    'granted',
    JSON.stringify(['/', '#team-builder', '#contact']),
    3
  );
  insertEvent.run(ses3, 'page_view', JSON.stringify({ path: '/', title: 'Home' }), '2026-09-27 02:15:00');
  insertEvent.run(ses3, 'team_builder_interaction', JSON.stringify({ disciplines: ['Customer Support', 'Operations'], hours: 30 }), '2026-09-27 02:24:00');
  insertEvent.run(ses3, 'form_submitted', JSON.stringify({ company: 'Lumina Digital Goods' }), '2026-09-27 02:30:00');

  insertLead.run(
    'Rachel Zhang',
    'rachel@luminagoods.co',
    'Lumina Digital Goods',
    'E-commerce',
    JSON.stringify(['Customer Support', 'Operations', 'Research']),
    JSON.stringify({ disciplines: ['Customer Support', 'Operations', 'Research'], squadLead: 'Commerce Ops Lead', estimatedHours: 30 }),
    'We are scaling across North America and Europe. Need support across Gorgias and Shopify inventory management.',
    'New',
    78,
    ses3,
    JSON.stringify([]),
    '2026-09-27 02:30:00'
  );

  // Add a few active live anonymous sessions for the Live Activity view
  const active1 = 'ses_live_1';
  const now = new Date();
  insertSession.run(
    active1,
    new Date(now.getTime() - 8 * 60000).toISOString(),
    new Date(now.getTime() - 1 * 60000).toISOString(),
    'https://techcrunch.com/business-scaling',
    'Desktop',
    'Chrome',
    'San Francisco, USA',
    'granted',
    JSON.stringify(['/', '#behind-business', '#capabilities']),
    null
  );
  insertEvent.run(active1, 'page_view', JSON.stringify({ path: '/' }), new Date(now.getTime() - 8 * 60000).toISOString());
  insertEvent.run(active1, 'behind_business_toggle', JSON.stringify({ industry: 'Corporate Law Firm' }), new Date(now.getTime() - 4 * 60000).toISOString());
  insertEvent.run(active1, 'service_view', JSON.stringify({ category: 'Operations', service: 'research-intel' }), new Date(now.getTime() - 1 * 60000).toISOString());

  const active2 = 'ses_live_2';
  insertSession.run(
    active2,
    new Date(now.getTime() - 15 * 60000).toISOString(),
    new Date(now.getTime() - 3 * 60000).toISOString(),
    'Direct / Organic',
    'Mobile',
    'Safari',
    'Sydney, Australia',
    'granted',
    JSON.stringify(['/', '#industries', '#team-builder']),
    null
  );
  insertEvent.run(active2, 'page_view', JSON.stringify({ path: '/' }), new Date(now.getTime() - 15 * 60000).toISOString());
  insertEvent.run(active2, 'industry_view', JSON.stringify({ industry: 'Real Estate' }), new Date(now.getTime() - 7 * 60000).toISOString());
  insertEvent.run(active2, 'team_builder_interaction', JSON.stringify({ disciplines: ['Administration', 'Marketing'] }), new Date(now.getTime() - 3 * 60000).toISOString());

  console.log('Assista Corp database seeded successfully.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
