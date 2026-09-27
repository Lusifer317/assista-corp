/**
 * ASSISTA CORP — Editorial B2B Client Experience Orchestrator
 * "Business operations, handled by people."
 */

document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------------------------------------
  // 1. Data Stores & State
  // -----------------------------------------------------------
  let behindScenarios = [];

  try {
    const cntRes = await fetch('/api/content').then(r => r.json());
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
        row.innerHTML = `<span class="task-bullet-dot"></span><span>${task}</span>`;
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

  function openModal(source = 'general') {
    if (modalOverlay) {
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';

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
        session_id: window.AssistaAnalytics ? window.AssistaAnalytics.sessionId : null,
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
          inquiryForm.style.display = 'none';
          if (formSuccessBox) {
            formSuccessBox.style.display = 'block';
            if (formStatusMsg) {
              formStatusMsg.innerHTML = `
                <p style="margin-bottom: 0.75rem; color: #111827;">Thank you, <strong>${payload.name}</strong>. Your consultation inquiry for <strong>${payload.company}</strong> has been received.</p>
                <p style="color: #5B6472; font-size: 0.88rem;">Reference: <strong>#LEAD-${resData.leadId}</strong>. A client director will review your operational requirements and follow up directly.</p>
              `;
            }
          }
        } else {
          alert(resData.error || 'Failed to submit inquiry. Please verify information.');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        alert('A network error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Dedicated Contact Page Form
  const contactPageForm = document.getElementById('contact-page-form');
  const contactPageSuccess = document.getElementById('contact-page-success');
  if (contactPageForm) {
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
        session_id: window.AssistaAnalytics ? window.AssistaAnalytics.sessionId : null,
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
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        alert('A network error occurred. Please try again.');
        submitBtn.disabled = false;
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
    if (current === 'granted' || current === 'rejected') {
      consentBanner.style.display = 'none';
    }

    if (btnAcceptConsent) {
      btnAcceptConsent.addEventListener('click', () => {
        window.AssistaAnalytics.setConsent('granted');
        consentBanner.style.display = 'none';
      });
    }

    if (btnRejectConsent) {
      btnRejectConsent.addEventListener('click', () => {
        window.AssistaAnalytics.setConsent('rejected');
        consentBanner.style.display = 'none';
      });
    }
  }
});
