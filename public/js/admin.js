/**
 * ASSISTA CORP — Admin Operations Center Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
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

  const TAB_META = {
    live: { title: 'Live Anonymous Activity', subtitle: 'Real-time first-party visitor sessions and touchpoint telemetry (Zero PII)' },
    crm: { title: 'CRM Pipeline & Lead Intelligence', subtitle: 'Track prospective partnerships from anonymous exploration to dedicated squad deployment' },
    analytics: { title: 'Visitor Intelligence & Analytics', subtitle: 'Aggregate insight into high-intent actions, top capabilities, and industry demand' },
    cms: { title: 'CMS Content Studio', subtitle: 'Modify brand narrative, hero manifesto, and capability universe specifications' },
    seo: { title: 'SEO Metadata & Corporate Settings', subtitle: 'Manage search metadata, global headquarters, and sales notification mailboxes' },
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
      if (tabId === 'seo') loadSettings();
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
          <td><strong>${s.display_id}</strong></td>
          <td><span class="path-badge">${s.current_page}</span></td>
          <td>${s.region}</td>
          <td>${s.device_category} (${s.browser})</td>
          <td>${dwellMins} min</td>
          <td>${s.event_count}</td>
          <td><span style="color:var(--admin-accent); font-weight:600;">${s.last_event || 'page_view'}</span> ${lastDataStr ? `• ${lastDataStr}` : ''}</td>
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
  async function loadCRMLeads() {
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      const leads = data.leads || [];

      document.getElementById('crm-total-badge').textContent = leads.length;

      const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'];
      stages.forEach(stage => {
        const container = document.getElementById(`cards-${stage}`);
        const countBadge = document.getElementById(`count-${stage}`);
        if (container) container.innerHTML = '';
        if (countBadge) countBadge.textContent = '0';
      });

      const counts = { New: 0, Contacted: 0, Qualified: 0, Proposal: 0, Won: 0 };

      leads.forEach(lead => {
        const stage = lead.status || 'New';
        if (counts[stage] !== undefined) counts[stage]++;

        const container = document.getElementById(`cards-${stage}`) || document.getElementById('cards-New');
        if (!container) return;

        const card = document.createElement('div');
        card.className = 'lead-card';

        let disciplines = [];
        try {
          disciplines = lead.team_configuration?.disciplines || lead.requirements || [];
        } catch (e) {}

        const tagsHtml = disciplines.slice(0, 3).map(d => `<span class="lead-mini-tag">${d}</span>`).join('');

        card.innerHTML = `
          <div class="lead-card-header">
            <span class="lead-score-pill" style="background:${lead.tier?.color || '#C86A4B'}; color:#FFF;">
              ${lead.tier?.tier || 'Lead'} • ${lead.intent_score} pts
            </span>
            <span style="font-size:0.7rem; color:var(--admin-text-muted);">#${lead.id}</span>
          </div>
          <div class="lead-company-title">${lead.company}</div>
          <div class="lead-name-sub">${lead.name} (${lead.industry})</div>
          <div class="lead-disciplines-tags">${tagsHtml}</div>
        `;

        card.addEventListener('click', () => openLeadDossier(lead.id));
        container.appendChild(card);
      });

      stages.forEach(stage => {
        const countBadge = document.getElementById(`count-${stage}`);
        if (countBadge) countBadge.textContent = counts[stage] || 0;
      });
    } catch (e) {
      console.error('Failed to load CRM leads', e);
    }
  }

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
      document.getElementById('dossier-contact').textContent = `${lead.name} • ${lead.business_email}`;
      document.getElementById('dossier-tier').textContent = `${lead.tier.tier} (${lead.intent_score} Intent Score)`;
      document.getElementById('dossier-tier').style.background = lead.tier.color;
      document.getElementById('dossier-status-select').value = lead.status;

      // Squad details
      const config = lead.team_configuration || {};
      const disciplinesText = (config.disciplines || []).join(', ') || 'General Business Support';
      document.getElementById('dossier-squad-details').innerHTML = `
        <div><strong>Disciplines Requested:</strong> ${disciplinesText}</div>
        <div><strong>Estimated Coverage:</strong> ${config.coverage || 'Dedicated Squad'} (${config.estimatedHours || '35 hrs'}/week)</div>
      `;
      document.getElementById('dossier-message-box').innerHTML = `
        <strong>Message from Prospect:</strong><br>
        ${lead.message ? `<em>“${lead.message}”</em>` : '<span style="color:#646470;">No additional message submitted.</span>'}
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
              <strong style="color:#FFF;">${ev.type.replace(/_/g, ' ').toUpperCase()}</strong>: 
              <span style="color:#D2D0C8;">${detail}</span>
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
          <strong style="color:var(--admin-accent);">${n.author}</strong>
          <span style="font-size:0.7rem; color:var(--admin-text-muted);">${new Date(n.date).toLocaleString()}</span>
        </div>
        <div style="color:#F4F3EF;">${n.note}</div>
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
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.business_email}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      `"${l.industry}"`,
      `"${l.status}"`,
      l.intent_score,
      `"${l.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
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
        row.innerHTML = `<span>${item.industry}</span> <strong>${item.count} views</strong>`;
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
        row.innerHTML = `<span>${item.category}</span> <strong>${item.count} views</strong>`;
        capContainer.appendChild(row);
      });
    } catch (e) {
      console.error('Failed to load analytics', e);
    }
  }

  // -----------------------------------------------------------
  // 7. CMS Studio
  // -----------------------------------------------------------
  async function loadCMS() {
    try {
      const [cntRes, svcRes] = await Promise.all([
        fetch('/api/content').then(r => r.json()),
        fetch('/api/services').then(r => r.json())
      ]);

      const hero = cntRes.content?.hero;
      if (hero) {
        document.getElementById('cms-hero-title').value = hero.title || '';
        document.getElementById('cms-hero-subtitle').value = hero.subtitle || '';
      }

      const servicesList = document.getElementById('cms-services-list');
      servicesList.innerHTML = '';
      (svcRes.services || []).forEach(svc => {
        const div = document.createElement('div');
        div.style.padding = '1rem';
        div.style.background = 'rgba(255,255,255,0.02)';
        div.style.border = '1px solid var(--admin-border)';
        div.style.borderRadius = '6px';
        div.style.marginBottom = '0.75rem';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        div.innerHTML = `
          <div>
            <span style="font-size:0.7rem; color:var(--admin-accent); font-weight:700;">${svc.category}</span>
            <div style="font-weight:600; color:#FFF; font-size:0.95rem;">${svc.name}</div>
            <div style="font-size:0.78rem; color:var(--admin-text-sub);">${svc.tagline}</div>
          </div>
          <span style="font-size:0.75rem; color:var(--admin-text-muted);">${svc.typical_sla}</span>
        `;
        servicesList.appendChild(div);
      });
    } catch (e) {
      console.error('Failed to load CMS', e);
    }
  }

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
            eyebrow: 'Global Business Services',
            cta_primary: 'Meet Assista →',
            cta_secondary: 'Explore What We Do'
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
          <td>${log.user_email || 'System'}</td>
          <td><span style="font-weight:700; color:var(--admin-accent);">${log.action}</span></td>
          <td>${log.entity_type} #${log.entity_id || '-'}</td>
          <td>${log.ip_address}</td>
          <td style="font-family:monospace; font-size:0.75rem; color:#A0A0AA;">${log.details ? log.details.slice(0, 50) : '-'}</td>
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
