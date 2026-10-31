/**
 * ASSISTA CORP — Admin Operations Center Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  // HTML escaping does not make values safe for inline CSS.
  const safeTierColor = (value) => {
    const allowed = new Set(['#D97753', '#B36D38', '#667085', '#98A2B3', '#C86A4B', '#22C55E', '#F59E0B', '#64748B', '#8B5CF6']);
    return allowed.has(String(value || '')) ? value : '#C86A4B';
  };
  // Prevent spreadsheet formula execution from user-controlled lead fields.
  const csvCell = (value) => {
    let text = String(value ?? '');
    if (/^[\\s\\u0000-\\u001f]*[=+@\\-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };

  let currentUser = null;
  let currentActiveLeadId = null;

  // 1. Authenticate & initialize user
  try {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) {
      window.location.href = '/login';
      return;
    }
    const meData = await meRes.json();
    currentUser = meData.user;

    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-role').textContent = currentUser.role.toUpperCase();
    document.getElementById('user-initial').textContent = currentUser.name.charAt(0).toUpperCase();

    if (!currentUser.mfa_enabled) {
      document.getElementById('mfa-status-box').innerHTML = `
        <span style="font-size:0.85rem; color:#F59E0B;">⚠ MFA Optional for this account</span>
      `;
    }
  } catch (err) {
    window.location.href = '/login';
    return;
  }

  // 2. Sign Out
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  });

  // 3. Tab Switching
  const navItems = document.querySelectorAll('.admin-nav-item');
  const tabViews = document.querySelectorAll('.admin-tab-view');
  const tabTitle = document.getElementById('tab-title');
  const tabSubtitle = document.getElementById('tab-subtitle');
  if (currentUser.role === 'sales') {
    navItems.forEach(item => {
      if (['cms', 'seo', 'audit'].includes(item.dataset.tab)) item.hidden = true;
    });
  }
  if (currentUser.role === 'editor') {
    const settingsForm = document.getElementById('settings-form');
    settingsForm?.closest('.cms-editor-panel')?.setAttribute('hidden', '');
  }

  const TAB_META = {
    live: { title: 'Live Visitor Activity', subtitle: 'Real-time opted-in first-party visitor sessions and touchpoint telemetry' },
    crm: { title: 'CRM Pipeline & Lead Intelligence', subtitle: 'Track prospective partnerships from anonymous exploration to dedicated squad deployment' },
    analytics: { title: 'Visitor Intelligence & Analytics', subtitle: 'Aggregate insight into high-intent actions, top capabilities, and industry demand' },
    cms: { title: 'CMS Content Studio', subtitle: 'Modify brand narrative, hero manifesto, and capability universe specifications' },
    seo: { title: 'SEO Metadata & Corporate Settings', subtitle: 'Manage page titles, search descriptions, canonical URLs, and corporate settings' },
    audit: { title: 'Security & Audit Logs', subtitle: 'Tamper-evident logs of administrative actions, authentication, and data changes' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      navItems.forEach(i => i.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add('active');

      if (TAB_META[tabId]) {
        tabTitle.textContent = TAB_META[tabId].title;
        tabSubtitle.textContent = TAB_META[tabId].subtitle;
      }

      // Trigger data loads
      if (tabId === 'live') loadLiveActivity();
      if (tabId === 'crm') loadCRMLeads();
      if (tabId === 'analytics') loadAnalytics();
      if (tabId === 'cms') loadCMS();
      if (tabId === 'seo') { if (currentUser.role === 'admin') loadSettings(); loadCMS(); }
      if (tabId === 'audit') loadAuditLogs();
    });
  });

  // Manual Refresh
  document.getElementById('refresh-data-btn').addEventListener('click', () => {
    const activeTab = document.querySelector('.admin-nav-item.active')?.dataset.tab || 'live';
    if (activeTab === 'live') loadLiveActivity();
    if (activeTab === 'crm') loadCRMLeads();
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'audit') loadAuditLogs();
    if (activeTab === 'cms') loadCMS();
    if (activeTab === 'seo') { if (currentUser.role === 'admin') loadSettings(); loadCMS(); }
  });

  // -----------------------------------------------------------
  // 4. Live Activity Monitor
  // -----------------------------------------------------------
  async function loadLiveActivity() {
    try {
      const [liveRes, overviewRes] = await Promise.all([
        fetch('/api/admin/analytics/live').then(r => r.json()),
        fetch('/api/admin/analytics/overview').then(r => r.json())
      ]);

      const sessions = liveRes.liveSessions || [];
      const overview = overviewRes.overview || {};

      document.getElementById('live-session-count').textContent = sessions.length;
      document.getElementById('kpi-total-events').textContent = overview.totalEvents || 0;
      const averageDwellSeconds = sessions.length
        ? sessions.reduce((sum, session) => sum + (Number(session.dwell_seconds) || 0), 0) / sessions.length
        : 0;
      const averageDwell = document.getElementById('kpi-avg-dwell');
      if (averageDwell) averageDwell.textContent = averageDwellSeconds >= 60
        ? (averageDwellSeconds / 60).toFixed(1) + 'm'
        : Math.round(averageDwellSeconds) + 's';

      const tbody = document.getElementById('live-sessions-tbody');
      tbody.innerHTML = '';

      if (sessions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#8E8E98; padding:2rem;">No active visitor sessions in the last 30 minutes.</td></tr>`;
        return;
      }

      sessions.forEach(s => {
        const tr = document.createElement('tr');
        const lastDataStr = s.last_event_data?.service || s.last_event_data?.industry || s.last_event_data?.label || '';
        const dwellMins = (s.dwell_seconds / 60).toFixed(1);

        tr.innerHTML = `
          <td><strong>${escapeHTML(s.display_id)}</strong></td>
          <td><span class="path-badge">${escapeHTML(s.current_page)}</span></td>
          <td>${escapeHTML(s.region)}</td>
          <td>${escapeHTML(s.device_category)} (${escapeHTML(s.browser)})</td>
          <td>${dwellMins} min</td>
          <td>${s.event_count}</td>
          <td><span style="color:var(--admin-accent); font-weight:600;">${escapeHTML(s.last_event || 'page_view')}</span> ${lastDataStr ? `• ${escapeHTML(lastDataStr)}` : ''}</td>
          <td>${s.is_converted_lead ? '<span style="color:#22C55E; font-weight:700;">★ Converted Lead</span>' : '<span style="color:#9E9EA8;">Anonymous</span>'}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error('Failed to load live sessions', e);
    }
  }

  // Periodic poll every 15s when live tab is active
  setInterval(() => {
    const activeTab = document.querySelector('.admin-nav-item.active')?.dataset.tab;
    if (activeTab === 'live') {
      loadLiveActivity();
    }
  }, 15000);

  // -----------------------------------------------------------
  // 5. CRM Pipeline & Kanban Board
  // -----------------------------------------------------------
  let cachedCRMLeads = [];

  function renderCRMLeads(leads) {
    document.getElementById('crm-total-badge').textContent = cachedCRMLeads.length;
    const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
    stages.forEach(stage => {
      const container = document.getElementById('cards-' + stage);
      const countBadge = document.getElementById('count-' + stage);
      if (container) container.replaceChildren();
      if (countBadge) countBadge.textContent = '0';
    });

    const counts = { New: 0, Contacted: 0, Qualified: 0, Proposal: 0, Won: 0, Lost: 0 };
    leads.forEach(lead => {
      const stage = stages.includes(lead.status) ? lead.status : 'New';
      counts[stage] += 1;
      const container = document.getElementById('cards-' + stage);
      if (!container) return;

      const card = document.createElement('div');
      card.className = 'lead-card';
      const disciplines = Array.isArray(lead.team_configuration?.disciplines)
        ? lead.team_configuration.disciplines
        : Array.isArray(lead.requirements) ? lead.requirements : [];
      const tagsHtml = disciplines.slice(0, 3).map(item => '<span class="lead-mini-tag">' + escapeHTML(item) + '</span>').join('');
      card.innerHTML = \`
        <div class="lead-card-header">
          <span class="lead-score-pill" style="background:\${safeTierColor(lead.tier?.color)}; color:#FFF;">
            \${escapeHTML(lead.tier?.tier || 'Lead')} • \${Number(lead.intent_score) || 0} pts
          </span>
          <span style="font-size:0.7rem; color:var(--admin-text-muted);">#\${escapeHTML(lead.id)}</span>
        </div>
        <div class="lead-company-title">\${escapeHTML(lead.company)}</div>
        <div class="lead-name-sub">\${escapeHTML(lead.name)} (\${escapeHTML(lead.industry)})</div>
        <div class="lead-disciplines-tags">\${tagsHtml}</div>
      \`;
      card.addEventListener('click', () => openLeadDossier(lead.id));
      container.appendChild(card);
    });

    stages.forEach(stage => {
      const countBadge = document.getElementById('count-' + stage);
      if (countBadge) countBadge.textContent = counts[stage] || 0;
    });
    const summary = document.getElementById('crm-filter-summary');
    if (summary) summary.textContent = 'Showing ' + leads.length + ' of ' + cachedCRMLeads.length + ' leads';
  }

  async function loadCRMLeads() {
    try {
      const res = await fetch('/api/admin/leads');
      if (!res.ok) throw new Error('Unable to load leads.');
      const data = await res.json();
      cachedCRMLeads = data.leads || [];
      applyCRMFilters();
    } catch (error) {
      console.error('Failed to load CRM leads', error);
    }
  }

  function applyCRMFilters() {
    const search = (document.getElementById('crm-search')?.value || '').trim().toLowerCase();
    const stage = document.getElementById('crm-status-filter')?.value || 'all';
    const filtered = cachedCRMLeads.filter(lead => {
      const haystack = [lead.name, lead.company, lead.business_email, lead.industry, lead.status]
        .map(value => String(value || '').toLowerCase()).join(' ');
      return (!search || haystack.includes(search)) && (stage === 'all' || lead.status === stage);
    });
    renderCRMLeads(filtered);
  }

  document.getElementById('crm-search')?.addEventListener('input', applyCRMFilters);
  document.getElementById('crm-status-filter')?.addEventListener('change', applyCRMFilters);

  // Lead Dossier Modal
  async function openLeadDossier(leadId) {
    currentActiveLeadId = leadId;
    const modal = document.getElementById('lead-dossier-modal');
    modal.classList.add('open');

    try {
      const res = await fetch(`/api/admin/leads/${leadId}`);
      const data = await res.json();
      const lead = data.lead;
      const attribution = data.attribution;

      document.getElementById('dossier-company').textContent = lead.company;
      document.getElementById('dossier-contact').textContent = `${escapeHTML(lead.name)} • ${escapeHTML(lead.business_email)}`;
      document.getElementById('dossier-tier').textContent = `${lead.tier.tier} (${lead.intent_score} Intent Score)`;
      document.getElementById('dossier-tier').style.background = lead.tier.color;
      document.getElementById('dossier-status-select').value = lead.status;

      // Squad details
      const config = lead.team_configuration || {};
      const disciplinesText = (config.disciplines || []).join(', ') || 'General Business Support';
      document.getElementById('dossier-squad-details').innerHTML = `
        <div><strong>Disciplines Requested:</strong> ${escapeHTML(disciplinesText)}</div>
        <div><strong>Estimated Coverage:</strong> ${escapeHTML(config.coverage || 'Dedicated Squad')} (${escapeHTML(config.estimatedHours || '35 hrs')}/week)</div>
      `;
      document.getElementById('dossier-message-box').innerHTML = `
        <strong>Message from Prospect:</strong><br>
        ${lead.message ? `<em>“${escapeHTML(lead.message)}”</em>` : '<span style="color:#646470;">No additional message submitted.</span>'}
      `;

      // Attribution Timeline
      const timelineFeed = document.getElementById('dossier-timeline-feed');
      timelineFeed.innerHTML = '';

      if (!attribution?.events || attribution.events.length === 0) {
        timelineFeed.innerHTML = `<div style="font-size:0.8rem; color:#8E8E98;">No prior digital touchpoints recorded for this session.</div>`;
      } else {
        attribution.events.forEach(ev => {
          const item = document.createElement('div');
          item.className = 'timeline-event-item';
          const timeFormatted = new Date(ev.timestamp).toLocaleTimeString();
          const detail = ev.data.service || ev.data.industry || ev.data.scenario || ev.data.title || JSON.stringify(ev.data);

          item.innerHTML = `
            <span style="font-family:monospace; color:var(--admin-text-muted); font-size:0.75rem;">${timeFormatted}</span>
            <div>
              <strong style="color:#FFF;">${escapeHTML(String(ev.type || 'event').replace(/_/g, ' ').toUpperCase())}</strong>: 
              <span style="color:#D2D0C8;">${escapeHTML(detail)}</span>
            </div>
          `;
          timelineFeed.appendChild(item);
        });
      }

      // Internal Notes
      renderNotes(lead.notes || []);
    } catch (e) {
      console.error('Failed to load lead details', e);
    }
  }

  function renderNotes(notes) {
    const list = document.getElementById('dossier-notes-list');
    list.innerHTML = '';
    if (notes.length === 0) {
      list.innerHTML = `<span style="font-size:0.8rem; color:#646470;">No internal notes logged yet.</span>`;
      return;
    }
    notes.forEach(n => {
      const div = document.createElement('div');
      div.style.background = 'rgba(255,255,255,0.03)';
      div.style.padding = '0.75rem';
      div.style.borderRadius = '4px';
      div.style.fontSize = '0.82rem';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <strong style="color:var(--admin-accent);">${escapeHTML(n.author)}</strong>
          <span style="font-size:0.7rem; color:var(--admin-text-muted);">${new Date(n.date).toLocaleString()}</span>
        </div>
        <div style="color:#F4F3EF;">${escapeHTML(n.note)}</div>
      `;
      list.appendChild(div);
    });
  }

  document.getElementById('dossier-close-btn').addEventListener('click', () => {
    document.getElementById('lead-dossier-modal').classList.remove('open');
  });

  // Update Status
  document.getElementById('dossier-status-select').addEventListener('change', async (e) => {
    if (!currentActiveLeadId) return;
    const newStatus = e.target.value;
    try {
      await fetch(`/api/admin/leads/${currentActiveLeadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      loadCRMLeads();
    } catch (err) {
      alert('Failed to update status.');
    }
  });

  // Save Note
  document.getElementById('save-note-btn').addEventListener('click', async () => {
    const input = document.getElementById('new-note-input');
    const note = input.value.trim();
    if (!note || !currentActiveLeadId) return;

    try {
      const res = await fetch(`/api/admin/leads/${currentActiveLeadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      if (res.ok) {
        input.value = '';
        renderNotes(data.notes || []);
      }
    } catch (err) {
      alert('Failed to save note.');
    }
  });

  // Export CSV
  document.getElementById('export-leads-btn').addEventListener('click', async () => {
    const res = await fetch('/api/admin/leads');
    const data = await res.json();
    const leads = data.leads || [];

    const headers = ['ID', 'Name', 'Email', 'Company', 'Industry', 'Status', 'Intent Score', 'Created At'];
    const rows = leads.map(l => [
      csvCell(l.id), csvCell(l.name), csvCell(l.business_email), csvCell(l.company),
      csvCell(l.industry), csvCell(l.status), csvCell(l.intent_score), csvCell(l.created_at)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assista_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // -----------------------------------------------------------
  // 6. Visitor Intelligence
  // -----------------------------------------------------------
  async function loadAnalytics() {
    try {
      const res = await fetch('/api/admin/analytics/overview');
      const data = await res.json();
      const overview = data.overview || {};

      document.getElementById('intel-total-sessions').textContent = overview.totalSessions || 0;
      document.getElementById('intel-24h-sessions').textContent = overview.sessions24h || 0;
      document.getElementById('intel-total-leads').textContent = overview.totalLeads || 0;
      document.getElementById('intel-conv-rate').textContent = `${overview.conversionRate || 0}%`;
      const attributed = document.getElementById('intel-attributed-leads');
      if (attributed) attributed.textContent = `Attributed leads: ${overview.attributedLeads || 0} (consented sessions only)`;

      const indContainer = document.getElementById('intel-top-industries');
      indContainer.innerHTML = '';
      (overview.industryEvents || []).forEach(item => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '0.5rem 0.75rem';
        row.style.background = 'rgba(255,255,255,0.02)';
        row.style.borderRadius = '4px';
        row.style.fontSize = '0.85rem';
        row.innerHTML = `<span>${escapeHTML(item.industry)}</span> <strong>${item.count} views</strong>`;
        indContainer.appendChild(row);
      });

      const capContainer = document.getElementById('intel-top-capabilities');
      capContainer.innerHTML = '';
      (overview.capabilityEvents || []).forEach(item => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '0.5rem 0.75rem';
        row.style.background = 'rgba(255,255,255,0.02)';
        row.style.borderRadius = '4px';
        row.style.fontSize = '0.85rem';
        row.innerHTML = `<span>${escapeHTML(item.category)}</span> <strong>${item.count} views</strong>`;
        capContainer.appendChild(row);
      });
      const renderMetricRows = (containerId, rows, labelKey, suffix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.replaceChildren();
        (rows || []).forEach(item => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.padding = '0.5rem 0.75rem';
          row.style.background = 'rgba(255,255,255,0.02)';
          row.style.borderRadius = '4px';
          row.style.fontSize = '0.85rem';
          const label = document.createElement('span');
          label.textContent = String(item[labelKey] || 'Other');
          const count = document.createElement('strong');
          count.textContent = String(Number(item.count) || 0) + suffix;
          row.append(label, count);
          container.appendChild(row);
        });
        if (!container.childElementCount) {
          const empty = document.createElement('p');
          empty.textContent = 'No opted-in activity recorded yet.';
          empty.style.color = 'var(--admin-text-muted)';
          empty.style.fontSize = '0.8rem';
          container.appendChild(empty);
        }
      };
      renderMetricRows('intel-device-mix', overview.devices, 'device_category', ' sessions');
      renderMetricRows('intel-high-intent', overview.highIntentActions, 'event_type', ' actions');
    } catch (e) {
      console.error('Failed to load analytics', e);
    }
  }

  // -----------------------------------------------------------
  // 7. CMS Studio
  // -----------------------------------------------------------
  let cmsHeroData = {};

  function makeCMSField(labelText, initialValue, multiline = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = labelText;
    const control = document.createElement(multiline ? 'textarea' : 'input');
    control.className = multiline ? 'form-textarea' : 'form-input';
    if (multiline) control.rows = 3;
    control.value = initialValue == null ? '' : String(initialValue);
    wrapper.append(label, control);
    return { wrapper, control };
  }

  function parseStoredList(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    }
    return [];
  }

  function renderRecordEditors(container, records, definitions) {
    container.replaceChildren();
    if (!Array.isArray(records) || records.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'form-help';
      empty.textContent = 'No records are available for editing.';
      container.appendChild(empty);
      return;
    }

    records.forEach(record => {
      const panel = document.createElement('div');
      panel.className = 'cms-editor-panel';
      panel.style.marginBottom = '1rem';
      const heading = document.createElement('h4');
      heading.textContent = record.name || record.route || ('Record #' + record.id);
      panel.appendChild(heading);
      const form = document.createElement('form');
      form.className = 'form-grid';
      const controls = {};

      definitions.forEach(def => {
        let initial = record[def.key];
        if (def.list) initial = parseStoredList(initial).join('\n');
        const field = makeCMSField(def.label, initial, Boolean(def.multiline || def.list));
        controls[def.key] = field.control;
        field.wrapper.classList.add('form-group-full');
        form.appendChild(field.wrapper);
      });

      const actions = document.createElement('div');
      actions.className = 'form-group-full';
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'btn btn-secondary';
      button.textContent = 'Save changes';
      const status = document.createElement('span');
      status.setAttribute('aria-live', 'polite');
      status.style.marginLeft = '0.75rem';
      status.style.fontSize = '0.8rem';
      actions.append(button, status);
      form.appendChild(actions);

      form.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = {};
        definitions.forEach(def => {
          const value = controls[def.key].value.trim();
          payload[def.key] = def.list
            ? value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
            : value;
        });
        button.disabled = true;
        status.textContent = 'Saving...';
        try {
          const response = await fetch(definitions.endpoint(record), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || 'Save failed. Check your permissions and input.');
          }
          status.textContent = 'Saved';
          status.style.color = '#22C55E';
          if (typeof definitions.afterSave === 'function') definitions.afterSave(record, payload);
        } catch (error) {
          status.textContent = error.message || 'Save failed';
          status.style.color = '#F59E0B';
        } finally {
          button.disabled = false;
        }
      });

      panel.appendChild(form);
      container.appendChild(panel);
    });
  }

  async function loadCMS() {
    try {
      const responses = await Promise.all([
        fetch('/api/admin/cms'),
        fetch('/api/admin/services'),
        fetch('/api/admin/industries'),
        fetch('/api/admin/seo')
      ]);
      if (responses.some(response => !response.ok)) {
        throw new Error('CMS data could not be loaded. Confirm the account has CMS, services, industries, and SEO editor permissions.');
      }
      const [cmsData, servicesData, industriesData, seoData] = await Promise.all(responses.map(response => response.json()));
      const sections = cmsData.sections || [];
      const hero = sections.find(section => section.section_key === 'hero');
      if (hero) {
        cmsHeroData = hero.data || {};
        document.getElementById('cms-hero-title').value = hero.title || '';
        document.getElementById('cms-hero-subtitle').value = hero.subtitle || '';
        document.getElementById('cms-hero-eyebrow').value = cmsHeroData.eyebrow || '';
        document.getElementById('cms-hero-primary-cta').value = cmsHeroData.cta_primary || '';
        document.getElementById('cms-hero-secondary-cta').value = cmsHeroData.cta_secondary || '';
      }
      const behindBusiness = sections.find(section => section.section_key === 'behind_business');
      const behindBusinessEditor = document.getElementById('cms-behind-business-json');
      if (behindBusinessEditor) behindBusinessEditor.value = JSON.stringify(behindBusiness ? behindBusiness.data || {} : {}, null, 2);

      const serviceDefinitions = [
        { key: 'name', label: 'Service name' },
        { key: 'tagline', label: 'Tagline' },
        { key: 'description', label: 'Description', multiline: true },
        { key: 'deliverables', label: 'Deliverables (one per line)', list: true },
        { key: 'team_roles', label: 'Team roles (one per line)', list: true },
        { key: 'typical_sla', label: 'Typical service coverage / SLA' }
      ];
      serviceDefinitions.endpoint = record => '/api/admin/services/' + encodeURIComponent(record.id);
      renderRecordEditors(document.getElementById('cms-services-list'), servicesData.services || [], serviceDefinitions);

      const industryDefinitions = [
        { key: 'headline', label: 'Headline' },
        { key: 'subheadline', label: 'Subheadline', multiline: true },
        { key: 'off_their_plate', label: 'Workflows we can take on (one per line)', list: true },
        { key: 'case_snapshot', label: 'Industry snapshot', multiline: true }
      ];
      industryDefinitions.endpoint = record => '/api/admin/industries/' + encodeURIComponent(record.id);
      renderRecordEditors(document.getElementById('cms-industries-list'), industriesData.industries || [], industryDefinitions);

      const seoDefinitions = [
        { key: 'meta_title', label: 'Meta title' },
        { key: 'meta_description', label: 'Meta description', multiline: true },
        { key: 'og_image', label: 'Open Graph image URL' },
        { key: 'canonical_url', label: 'Canonical URL' },
        { key: 'keywords', label: 'Keywords (comma separated)' }
      ];
      seoDefinitions.endpoint = record => '/api/admin/seo/' + encodeURIComponent(record.id);
      renderRecordEditors(document.getElementById('seo-metadata-list'), seoData.seoList || [], seoDefinitions);
    } catch (error) {
      console.error('Failed to load CMS', error);
      const message = document.getElementById('cms-load-status');
      if (message) message.textContent = error.message || 'Failed to load CMS content.';
    }
  }

  document.getElementById('cms-behind-business-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('cms-behind-business-status');
    const editor = document.getElementById('cms-behind-business-json');
    let data;
    try {
      data = JSON.parse(editor.value);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('The content must be a JSON object.');
    } catch (error) {
      status.textContent = error.message || 'Invalid JSON.';
      status.style.color = '#F59E0B';
      return;
    }
    try {
      const response = await fetch('/api/admin/cms/behind_business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'THE PEOPLE BEHIND BUSINESS.', subtitle: 'Different businesses. Different needs. One reliable partner.', data })
      });
      if (!response.ok) throw new Error('Could not save Behind the Business content.');
      status.textContent = 'Saved';
      status.style.color = '#22C55E';
    } catch (error) {
      status.textContent = error.message;
      status.style.color = '#F59E0B';
    }
  });

  document.getElementById('cms-hero-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('cms-hero-title').value;
    const subtitle = document.getElementById('cms-hero-subtitle').value;

    try {
      const res = await fetch('/api/admin/cms/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          data: {
            ...cmsHeroData,
            eyebrow: document.getElementById('cms-hero-eyebrow').value.trim(),
            cta_primary: document.getElementById('cms-hero-primary-cta').value.trim(),
            cta_secondary: document.getElementById('cms-hero-secondary-cta').value.trim()
          }
        })
      });

      if (res.ok) {
        alert('Homepage Hero successfully updated.');
      } else {
        alert('Failed to update Hero content.');
      }
    } catch (err) {
      alert('Error updating Hero content.');
    }
  });

  // -----------------------------------------------------------
  // 8. Corporate Settings
  // -----------------------------------------------------------
  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      const settings = data.settings || {};

      if (settings.sales_email) document.getElementById('set-sales-email').value = settings.sales_email;
      if (settings.phone) document.getElementById('set-phone').value = settings.phone;
      if (settings.headquarters) document.getElementById('set-hq').value = settings.headquarters;
      if (settings.turnstile_site_key) document.getElementById('set-turnstile-key').value = settings.turnstile_site_key;
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      sales_email: document.getElementById('set-sales-email').value,
      phone: document.getElementById('set-phone').value,
      headquarters: document.getElementById('set-hq').value,
      turnstile_site_key: document.getElementById('set-turnstile-key').value
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) alert('Corporate settings saved successfully.');
      else alert('Failed to save settings.');
    } catch (err) {
      alert('Error saving settings.');
    }
  });

  // -----------------------------------------------------------
  // 9. Security & Audit Logs
  // -----------------------------------------------------------
  async function loadAuditLogs() {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      const logs = data.logs || [];

      const tbody = document.getElementById('audit-logs-tbody');
      tbody.innerHTML = '';

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#8E8E98; padding:2rem;">No audit logs recorded.</td></tr>`;
        return;
      }

      logs.forEach(log => {
        const tr = document.createElement('tr');
        const timeFormatted = new Date(log.created_at).toLocaleString();
        tr.innerHTML = `
          <td>${timeFormatted}</td>
          <td>${escapeHTML(log.user_email || 'System')}</td>
          <td><span style="font-weight:700; color:var(--admin-accent);">${escapeHTML(log.action)}</span></td>
          <td>${escapeHTML(log.entity_type)} #${escapeHTML(log.entity_id || '-')}</td>
          <td>${escapeHTML(log.ip_address)}</td>
          <td style="font-family:monospace; font-size:0.75rem; color:#A0A0AA;">${escapeHTML(log.details ? log.details.slice(0, 50) : '-')}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (e) {
      console.error('Failed to load audit logs', e);
    }
  }

  // Initial tab load
  loadLiveActivity();
});
