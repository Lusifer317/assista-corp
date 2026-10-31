/**
 * ASSISTA CORP — Editorial B2B Client Experience Orchestrator
 * "Business operations, handled by people."
 */

document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------------------------------------
  // 1. Data Stores & State
  // -----------------------------------------------------------
  let behindScenarios = [];
  let cmsContent = {};

  try {
    const cntRes = await fetch('/api/content').then(r => r.json());
    cmsContent = cntRes.content || {};
    if (cntRes.content?.behind_business?.data?.scenarios) {
      behindScenarios = cntRes.content.behind_business.data.scenarios;
    }
  } catch (err) {
    console.warn('Using standard fallback content:', err);
  }

  // Fallback scenarios if API is unreachable
  if (behindScenarios.length === 0) {
    behindScenarios = [
      {
        id: 'medical',
        label: 'Medical Practice',
        surface_title: 'Clinical Excellence & Patient Care',
        surface_desc: 'Physicians focusing 100% of their energy on diagnostic precision, patient comfort, and surgical care without administrative distraction.',
        behind_title: 'Clinical Operations Squad Behind Them',
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
        behind_title: 'Financial Operations Squad Behind Them',
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
        behind_title: 'Legal Operations Squad Behind Them',
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
        label: 'Global E-Commerce',
        surface_title: 'Inspiring Brand Identity & Product Excellence',
        surface_desc: 'Founders creating beloved consumer products, managing creative campaigns, and driving international brand growth.',
        behind_title: 'Commercial Operations Squad Behind Them',
        behind_tasks: [
          'Omnichannel tier-1 customer resolutions (email, chat, VIP)',
          'Vendor communication & freight shipment tracking',
          'Inventory level reconciliations across 4 fulfillment hubs',
          'Chargeback dispute resolution & payment reviews',
          'Catalog taxonomy updates & product data hygiene'
        ]
      }
    ];
  }

  function hydrateHomepageHero() {
    const hero = cmsContent.hero;
    if (!hero) return;
    const data = hero.data || {};
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow && data.eyebrow) eyebrow.textContent = data.eyebrow;

    const titleLines = document.querySelectorAll('.hero-title-text');
    if (titleLines.length && hero.title) {
      titleLines[0].textContent = hero.title;
      titleLines.forEach((line, index) => {
        if (index > 0) line.closest('.hero-title-line')?.setAttribute('hidden', '');
      });
    }
    const subtitle = document.querySelector('.hero-lead');
    if (subtitle && hero.subtitle) subtitle.textContent = hero.subtitle;

    const primary = document.querySelector('.hero-cta-group .btn-primary span:not(.btn-arrow)');
    const secondary = document.querySelector('.hero-cta-group .btn-link span:not(.btn-arrow)');
    if (primary && data.cta_primary) primary.textContent = data.cta_primary.replace(/\s*→\s*$/, '');
    if (secondary && data.cta_secondary) secondary.textContent = data.cta_secondary;
  }

  async function hydrateSeoMetadata() {
    try {
      const response = await fetch('/api/seo?route=' + encodeURIComponent(window.location.pathname));
      if (!response.ok) return;
      const { seo } = await response.json();
      if (!seo) return;
      if (seo.meta_title) document.title = seo.meta_title;

      const setMeta = (selector, attribute, value) => {
        if (!value) return;
        let element = document.head.querySelector(selector);
        if (!element) {
          element = document.createElement('meta');
          const [key, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
          if (key) element.setAttribute(selector.includes('[property=') ? 'property' : 'name', name);
          document.head.appendChild(element);
        }
        element.setAttribute(attribute, value);
      };
      setMeta('meta[name="description"]', 'content', seo.meta_description);
      setMeta('meta[name="keywords"]', 'content', seo.keywords);
      setMeta('meta[property="og:title"]', 'content', seo.meta_title);
      setMeta('meta[property="og:description"]', 'content', seo.meta_description);

      if (seo.og_image) {
        try {
          const image = new URL(seo.og_image);
          if (image.protocol === 'https:' && !image.username && !image.password) setMeta('meta[property="og:image"]', 'content', image.href);
        } catch {}
      }
      if (seo.canonical_url) {
        try {
          const canonical = new URL(seo.canonical_url);
          if (canonical.protocol === 'https:' && !canonical.username && !canonical.password) {
            let link = document.head.querySelector('link[rel="canonical"]');
            if (!link) {
              link = document.createElement('link');
              link.rel = 'canonical';
              document.head.appendChild(link);
            }
            link.href = canonical.href;
          }
        } catch {}
      }
    } catch (error) {
      console.warn('SEO metadata could not be loaded; using page defaults.', error);
    }
  }

  async function hydrateServicesPage() {
    if (window.location.pathname.replace(/\/$/, '') !== '/services') return;
    try {
      const response = await fetch('/api/services');
      if (!response.ok) return;
      const { services } = await response.json();
      const bySlug = new Map((services || []).map(service => [service.slug, service]));
      const slugs = ['executive-support', 'finance-accounting', 'customer-support', 'recruitment-talent'];
      document.querySelectorAll('.service-card').forEach((card, index) => {
        const service = bySlug.get(slugs[index]);
        if (!service) return;
        const title = card.querySelector('.service-title');
        const summary = card.querySelector('.service-summary');
        const list = card.querySelector('.service-deliverables-list');
        const roles = card.querySelector('.service-roles-pill');
        if (title) title.textContent = service.name;
        if (summary) summary.textContent = service.tagline;
        if (list) {
          list.replaceChildren();
          (service.deliverables || []).slice(0, 4).forEach(item => {
            const li = document.createElement('li');
            li.className = 'deliverable-item';
            const tick = document.createElement('span');
            tick.className = 'deliverable-tick';
            tick.textContent = '✓';
            const text = document.createElement('span');
            text.textContent = String(item);
            li.append(tick, text);
            list.appendChild(li);
          });
        }
        if (roles) roles.textContent = (service.team_roles || []).slice(0, 3).join(' · ');
        card.addEventListener('click', () => {
          window.AssistaAnalytics?.recordEvent('service_view', { category: service.category, service: service.slug });
        }, { once: true });
      });
    } catch (error) {
      console.warn('Services content could not be loaded; using page defaults.', error);
    }
  }

  async function hydrateServiceDetailPage() {
    const routes = {
      '/services/executive-support': 'executive-support',
      '/services/finance-reconciliation': 'finance-accounting',
      '/services/customer-care': 'customer-support',
      '/services/recruitment-talent': 'recruitment-talent'
    };
    const slug = routes[window.location.pathname.replace(/\/$/, '')];
    if (!slug) return;
    try {
      const response = await fetch('/api/services/' + encodeURIComponent(slug));
      if (!response.ok) return;
      const { service } = await response.json();
      if (!service) return;
      const title = document.querySelector('.page-hero-title');
      const lead = document.querySelector('.page-hero-lead');
      const summary = document.querySelector('.section-desc');
      if (title) title.textContent = service.name;
      if (lead) lead.textContent = service.tagline;
      if (summary && service.description) summary.textContent = service.description;
      const grid = document.querySelector('.who-for-grid');
      if (grid) {
        grid.replaceChildren();
        (service.deliverables || []).forEach(deliverable => {
          const card = document.createElement('div');
          card.className = 'who-for-card';
          const heading = document.createElement('h3');
          heading.className = 'who-for-title';
          heading.textContent = String(deliverable);
          card.appendChild(heading);
          grid.appendChild(card);
        });
      }
      const crumb = document.querySelector('.breadcrumb-item.active');
      if (crumb) crumb.textContent = service.name;
      window.AssistaAnalytics?.recordEvent('service_view', { category: service.category, service: service.slug });
    } catch (error) {
      console.warn('Service details could not be loaded; using page defaults.', error);
    }
  }

  function renderIndustryWorkflows(grid, workflows) {
    if (!grid) return;
    grid.replaceChildren();
    (workflows || []).forEach(workflow => {
      const card = document.createElement('div');
      card.className = 'who-for-card';
      const heading = document.createElement('h4');
      heading.className = 'who-for-title';
      heading.textContent = String(workflow);
      card.appendChild(heading);
      grid.appendChild(card);
    });
  }

  async function hydrateIndustryPage() {
    if (window.location.pathname !== '/industries' && window.location.pathname !== '/industries.html') return;
    try {
      const response = await fetch('/api/industries');
      if (!response.ok) return;
      const { industries } = await response.json();
      const aliases = { finance: 'wealth' };
      const main = document.querySelector('main');
      (industries || []).forEach(industry => {
        if (!/^[a-z0-9-]+$/.test(industry.slug || '')) return;
        const sectionId = aliases[industry.slug] || industry.slug;
        let section = document.getElementById(sectionId);
        if (!section && main) {
          section = document.createElement('section');
          section.id = sectionId;
          section.className = 'section section-subtle';
          const container = document.createElement('div');
          container.className = 'container';
          const intro = document.createElement('div');
          intro.style.maxWidth = '820px';
          intro.style.marginBottom = '2.5rem';
          const strapline = document.createElement('span');
          strapline.className = 'section-tag';
          const title = document.createElement('h2');
          title.className = 'section-title';
          const summary = document.createElement('p');
          summary.className = 'section-desc';
          intro.append(strapline, title, summary);
          const workflowLabel = document.createElement('h3');
          workflowLabel.textContent = 'Typical workflows we can support:';
          workflowLabel.style.cssText = 'font-size:1.15rem;font-weight:700;color:var(--brand-navy);margin-bottom:1rem;';
          const grid = document.createElement('div');
          grid.className = 'who-for-grid';
          grid.style.marginTop = '0';
          container.append(intro, workflowLabel, grid);
          section.appendChild(container);
          main.appendChild(section);
        }
        if (!section) return;
        const strapline = section.querySelector('.section-tag');
        const title = section.querySelector('.section-title');
        const summary = section.querySelector('.section-desc');
        const grid = section.querySelector('.who-for-grid');
        if (strapline && industry.headline) strapline.textContent = industry.headline;
        if (title && industry.name) title.textContent = industry.name;
        if (summary && industry.subheadline) summary.textContent = industry.subheadline;
        renderIndustryWorkflows(grid, industry.off_their_plate || []);
      });

      if ('IntersectionObserver' in window && window.AssistaAnalytics) {
        const observed = new Set();
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const name = entry.target.dataset.analyticsIndustry;
            if (!name || observed.has(name)) return;
            observed.add(name);
            window.AssistaAnalytics.recordEvent('industry_view', { industry: name });
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.35 });
        (industries || []).forEach(industry => {
          const section = document.getElementById(({ finance: 'wealth' }[industry.slug]) || industry.slug);
          if (section && !section.dataset.analyticsIndustry) {
            section.dataset.analyticsIndustry = industry.name || industry.slug;
            observer.observe(section);
          }
        });
      }
    } catch (error) {
      console.warn('Industry content could not be loaded; using page defaults.', error);
    }
  }

  hydrateHomepageHero();
  hydrateSeoMetadata();
  hydrateServicesPage();
  hydrateServiceDetailPage();
  hydrateIndustryPage();

  // -----------------------------------------------------------
  // 2. Responsive Mobile Navigation Drawer (<= 900px)
  // -----------------------------------------------------------
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  function openMobileMenu() {
    if (!mobileDrawer || !mobileToggle) return;
    mobileDrawer.classList.add('is-open');
    mobileToggle.classList.add('is-active');
    mobileToggle.setAttribute('aria-expanded', 'true');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  }

  function closeMobileMenu() {
    if (!mobileDrawer || !mobileToggle) return;
    mobileDrawer.classList.remove('is-open');
    mobileToggle.classList.remove('is-active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }

  function toggleMobileMenu() {
    const isOpen = mobileDrawer?.classList.contains('is-open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    // Close menu when tapping any nav link in drawer
    mobileDrawer.querySelectorAll('.mobile-nav-link, .mobile-drawer-btn').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileMenu();
      });
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('is-open')) {
        closeMobileMenu();
        mobileToggle.focus();
      }
    });

    // Auto-close drawer if viewport resized above 900px
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && mobileDrawer.classList.contains('is-open')) {
        closeMobileMenu();
      }
    });
  }

  // -----------------------------------------------------------
  // 3. Editorial Scenario Switcher ("Behind the Business")
  // -----------------------------------------------------------
  const scenarioTabsContainer = document.getElementById('scenario-tabs');
  const surfaceTitle = document.getElementById('surface-title');
  const surfaceDesc = document.getElementById('surface-desc');
  const behindTitle = document.getElementById('behind-title');
  const behindTasks = document.getElementById('behind-tasks');

  function renderScenario(scenario) {
    if (!scenario) return;
    if (surfaceTitle) surfaceTitle.textContent = scenario.surface_title;
    if (surfaceDesc) surfaceDesc.textContent = scenario.surface_desc;
    if (behindTitle) behindTitle.textContent = scenario.behind_title;

    if (behindTasks) {
      behindTasks.innerHTML = '';
      (scenario.behind_tasks || []).forEach(task => {
        const row = document.createElement('div');
        row.className = 'behind-task-row';
        const bullet = document.createElement('span');
        bullet.className = 'task-bullet-dot';
        const taskText = document.createElement('span');
        taskText.textContent = String(task ?? '');
        row.append(bullet, taskText);
        behindTasks.appendChild(row);
      });
    }

    if (window.AssistaAnalytics) {
      window.AssistaAnalytics.recordEvent('behind_business_toggle', {
        scenario_id: scenario.id,
        label: scenario.label
      });
    }
  }

  if (scenarioTabsContainer && behindScenarios.length > 0) {
    scenarioTabsContainer.innerHTML = '';
    behindScenarios.forEach((sc, idx) => {
      const btn = document.createElement('button');
      btn.className = `scenario-tab-btn ${idx === 0 ? 'active' : ''}`;
      btn.textContent = sc.label;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.scenario-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderScenario(sc);
      });
      scenarioTabsContainer.appendChild(btn);
    });

    renderScenario(behindScenarios[0]);
  }

  // -----------------------------------------------------------
  // 4. Consultation Modal & Form Handling
  // -----------------------------------------------------------
  const modalOverlay = document.getElementById('inquiry-modal-overlay');
  const openModalButtons = document.querySelectorAll('.trigger-consultation-modal');
  const closeModalBtn = document.getElementById('modal-close-btn');
  const inquiryForm = document.getElementById('inquiry-form');
  const formSuccessBox = document.getElementById('form-success-box');
  const formStatusMsg = document.getElementById('form-status-msg');

  const turnstileWidgetIds = new WeakMap();
  let turnstileSiteKeyPromise = null;
  let turnstileScriptPromise = null;

  function setTurnstileStatus(form, message, isError = false) {
    const status = form?.querySelector('[data-turnstile-status]');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#B91C1C' : 'var(--text-secondary, #5B6472)';
  }

  async function getTurnstileSiteKey() {
    if (!turnstileSiteKeyPromise) {
      turnstileSiteKeyPromise = fetch('/api/settings/public', { cache: 'no-store' })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || 'Could not load form security configuration.');
          const key = String(data.settings?.turnstile_site_key || '').trim();
          if (!key || key === '1x00000000000000000000AA') {
            throw new Error('Online inquiries are temporarily unavailable. The site administrator must configure a live Cloudflare Turnstile site key.');
          }
          return key;
        });
    }
    return turnstileSiteKeyPromise;
  }

  async function loadTurnstileScript() {
    if (window.turnstile) return window.turnstile;
    if (!turnstileScriptPromise) {
      turnstileScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-turnstile-api]');
        const script = existing || document.createElement('script');
        const timeout = window.setTimeout(() => reject(new Error('Cloudflare verification script timed out. Please retry.')), 12000);
        const finish = (error) => {
          window.clearTimeout(timeout);
          if (error) reject(error);
          else if (window.turnstile) resolve(window.turnstile);
          else reject(new Error('Cloudflare verification could not initialize.'));
        };
        script.addEventListener('load', () => finish(), { once: true });
        script.addEventListener('error', () => finish(new Error('Cloudflare verification could not load. Check CSP and network access.')), { once: true });
        if (!existing) {
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          script.dataset.turnstileApi = 'true';
          document.head.appendChild(script);
        } else if (window.turnstile) {
          finish();
        }
      });
    }
    return turnstileScriptPromise;
  }

  async function mountTurnstile(form) {
    if (!form || turnstileWidgetIds.has(form)) return;
    const submitButton = form.querySelector('button[type="submit"]');
    const tokenInput = form.querySelector('input[name="turnstile_token"]');
    const container = form.querySelector('[data-turnstile-widget]');
    if (!submitButton || !tokenInput || !container) return;

    submitButton.disabled = true;
    setTurnstileStatus(form, 'Loading security verification…');
    try {
      const sitekey = await getTurnstileSiteKey();
      await loadTurnstileScript();
      const widgetId = window.turnstile.render(container, {
        sitekey,
        action: 'contact',
        callback(token) {
          tokenInput.value = token;
          submitButton.disabled = false;
          setTurnstileStatus(form, 'Security verification complete.');
        },
        'error-callback'() {
          tokenInput.value = '';
          submitButton.disabled = true;
          setTurnstileStatus(form, 'Security verification failed to load. Retry the challenge or refresh the page.', true);
        },
        'expired-callback'() {
          tokenInput.value = '';
          submitButton.disabled = true;
          setTurnstileStatus(form, 'Verification expired. Complete the challenge again.');
        },
        'timeout-callback'() {
          tokenInput.value = '';
          submitButton.disabled = true;
          setTurnstileStatus(form, 'Verification timed out. Complete the challenge again.');
        }
      });
      turnstileWidgetIds.set(form, widgetId);
    } catch (error) {
      submitButton.disabled = true;
      setTurnstileStatus(form, error.message || 'Security verification is unavailable.', true);
    }
  }

  function resetTurnstile(form) {
    const tokenInput = form?.querySelector('input[name="turnstile_token"]');
    const widgetId = form && turnstileWidgetIds.get(form);
    if (tokenInput) tokenInput.value = '';
    if (form && widgetId && window.turnstile) {
      try { window.turnstile.reset(widgetId); } catch {}
    }
    const submitButton = form?.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    if (form) setTurnstileStatus(form, 'Complete the security challenge to submit.');
  }

  function openModal(source = 'general') {
    if (modalOverlay) {
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      mountTurnstile(inquiryForm);

      if (window.AssistaAnalytics) {
        window.AssistaAnalytics.recordEvent('contact_opened', {
          source: source
        });
      }
    }
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      document.body.style.overflow = 'auto';
    }
  }

  openModalButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.source || 'cta_button');
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('open')) {
      closeModal();
    }
  });

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = inquiryForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting to Partner Desk...';

      const formData = new FormData(inquiryForm);
      const payload = {
        name: formData.get('name'),
        business_email: formData.get('email'),
        company: formData.get('company'),
        industry: formData.get('industry'),
        requirements: ['Executive Support', 'Operations'],
        team_configuration: {
          disciplines: ['Dedicated Client Cell'],
          estimatedHours: '40 hrs/wk',
          coverage: 'Dedicated Squad'
        },
        message: formData.get('message'),
        session_id: window.AssistaAnalytics ? window.AssistaAnalytics.getSessionId() : null,
        turnstile_token: formData.get('turnstile_token') || ''
      };

      if (!payload.turnstile_token) {
        alert('Complete the security verification before submitting your inquiry.');
        submitBtn.disabled = true;
        submitBtn.textContent = originalText;
        return;
      }

      if (!payload.turnstile_token) {
        alert('Complete the security verification before submitting your inquiry.');
        submitBtn.disabled = true;
        submitBtn.textContent = originalText;
        return;
      }

      try {
        const response = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok) {
          inquiryForm.style.display = 'none';
          if (formSuccessBox) {
            formSuccessBox.style.display = 'block';
            if (formStatusMsg) {
              formStatusMsg.replaceChildren();
            const thankYou = document.createElement('p');
            thankYou.style.cssText = 'margin-bottom: 0.75rem; color: #111827;';
            thankYou.append(document.createTextNode('Thank you, '));
            const contactName = document.createElement('strong');
            contactName.textContent = String(payload.name || '');
            const companyName = document.createElement('strong');
            companyName.textContent = String(payload.company || '');
            thankYou.append(contactName, document.createTextNode('. Your consultation inquiry for '), companyName, document.createTextNode(' has been received.'));
            const reference = document.createElement('p');
            reference.style.cssText = 'color: #5B6472; font-size: 0.88rem;';
            reference.append(document.createTextNode('Reference: '));
            const referenceId = document.createElement('strong');
            referenceId.textContent = '#LEAD-' + String(resData.leadId);
            reference.append(referenceId, document.createTextNode('. A client director will review your operational requirements and follow up directly.'));
            formStatusMsg.append(thankYou, reference);
            }
          }
        } else {
          alert(resData.error || 'Failed to submit inquiry. Please verify information.');
          resetTurnstile(inquiryForm);
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        alert(err.message || 'A network error occurred. Please try again.');
        resetTurnstile(inquiryForm);
        submitBtn.textContent = originalText;
      }
    });
  }

  // Dedicated Contact Page Form
  const contactPageForm = document.getElementById('contact-page-form');
  const contactPageSuccess = document.getElementById('contact-page-success');
  if (contactPageForm) {
    mountTurnstile(contactPageForm);
    contactPageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactPageForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Request...';

      const formData = new FormData(contactPageForm);
      const payload = {
        name: formData.get('name'),
        business_email: formData.get('email'),
        company: formData.get('company'),
        industry: formData.get('service') || 'General Inquiries',
        requirements: [formData.get('service') || 'Operational Infrastructure'],
        team_configuration: {
          role: formData.get('role'),
          website: formData.get('website')
        },
        message: formData.get('message'),
        session_id: window.AssistaAnalytics ? window.AssistaAnalytics.getSessionId() : null,
        turnstile_token: formData.get('turnstile_token') || 'cf_turnstile_pass_token_demo'
      };

      try {
        const response = await fetch('/api/leads/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resData = await response.json();
        if (response.ok) {
          contactPageForm.style.display = 'none';
          if (contactPageSuccess) contactPageSuccess.style.display = 'block';
        } else {
          alert(resData.error || 'Failed to submit inquiry. Please verify information.');
          resetTurnstile(contactPageForm);
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        alert(err.message || 'A network error occurred. Please try again.');
        resetTurnstile(contactPageForm);
        submitBtn.textContent = originalText;
      }
    });
  }

  // -----------------------------------------------------------
  // 5. Privacy Consent Banner Handling
  // -----------------------------------------------------------
  const consentBanner = document.getElementById('consent-banner');
  const btnAcceptConsent = document.getElementById('consent-accept-btn');
  const btnRejectConsent = document.getElementById('consent-reject-btn');

  if (consentBanner && window.AssistaAnalytics) {
    const current = window.AssistaAnalytics.getConsent();
    if (current === 'granted' || current === 'rejected') consentBanner.style.display = 'none';

    // Keep privacy controls reachable after the visitor makes an initial choice.
    const privacyLauncher = document.createElement('button');
    privacyLauncher.type = 'button';
    privacyLauncher.className = 'privacy-settings-launcher';
    privacyLauncher.textContent = 'Privacy settings';
    privacyLauncher.setAttribute('aria-controls', 'consent-banner');
    privacyLauncher.setAttribute('aria-expanded', 'false');
    privacyLauncher.style.cssText = 'position:fixed;left:1rem;bottom:1rem;z-index:900;min-height:40px;padding:0.55rem 0.85rem;border:1px solid #D7D9D2;border-radius:999px;background:#FFFFFF;color:#26332F;font:600 0.75rem/1.2 system-ui,sans-serif;box-shadow:0 4px 18px rgba(20,32,28,0.12);cursor:pointer;';
    document.body.appendChild(privacyLauncher);
    privacyLauncher.addEventListener('click', () => {
      consentBanner.style.display = 'block';
      privacyLauncher.setAttribute('aria-expanded', 'true');
      (btnRejectConsent || btnAcceptConsent)?.focus();
    });

    const closeConsentPanel = () => {
      consentBanner.style.display = 'none';
      privacyLauncher.setAttribute('aria-expanded', 'false');
    };
    if (btnAcceptConsent) {
      btnAcceptConsent.addEventListener('click', () => {
        window.AssistaAnalytics.setConsent('granted');
        closeConsentPanel();
      });
    }
    if (btnRejectConsent) {
      btnRejectConsent.addEventListener('click', () => {
        window.AssistaAnalytics.setConsent('rejected');
        closeConsentPanel();
      });
    }
  }
});
