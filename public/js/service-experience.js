/* Assista service page interactions. No dependency and no tracking before consent. */
(function () {
  'use strict';

  document.querySelectorAll('[data-service-filter-group]').forEach((group) => {
    const buttons = [...group.querySelectorAll('[data-service-filter]')];
    const cards = [...document.querySelectorAll('[data-service-card]')];
    buttons.forEach((button) => button.addEventListener('click', () => {
      const selected = button.dataset.serviceFilter || 'all';
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach((card) => {
        card.hidden = selected !== 'all' && card.dataset.serviceCard !== selected;
      });
    }));
  });

  document.querySelectorAll('[data-service-scope]').forEach((builder) => {
    const service = builder.dataset.serviceName || '';
    const taskButtons = [...builder.querySelectorAll('[data-service-task]')];
    const count = builder.querySelector('[data-selected-count]');
    const list = builder.querySelector('[data-selected-list]');
    const status = builder.querySelector('[data-scope-status]');
    const continueButton = builder.querySelector('[data-build-brief]');
    const selected = new Set();

    function renderSelection() {
      if (count) count.textContent = String(selected.size);
      if (list) {
        list.replaceChildren();
        if (selected.size) {
          selected.forEach((task) => {
            const item = document.createElement('li');
            item.textContent = task;
            list.appendChild(item);
          });
        } else {
          const item = document.createElement('li');
          item.textContent = 'Choose one or more tasks to create a starting brief.';
          list.appendChild(item);
        }
      }
      if (continueButton) continueButton.disabled = selected.size === 0;
      if (status) status.textContent = selected.size
        ? selected.size + ' task' + (selected.size === 1 ? '' : 's') + ' selected. You can edit the brief on the next step.'
        : 'Your selections will be carried into the inquiry form.';
    }

    taskButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const task = button.dataset.serviceTask || '';
        if (!task) return;
        if (selected.has(task)) selected.delete(task);
        else selected.add(task);
        button.setAttribute('aria-pressed', String(selected.has(task)));
        renderSelection();
        if (window.AssistaAnalytics?.recordEvent) {
          window.AssistaAnalytics.recordEvent('service_scope_selected', { service, task });
        }
      });
    });

    if (continueButton) {
      continueButton.addEventListener('click', () => {
        if (!selected.size) return;
        const params = new URLSearchParams();
        params.set('service', service);
        selected.forEach((task) => params.append('task', task));
        if (window.AssistaAnalytics?.recordEvent) {
          window.AssistaAnalytics.recordEvent('service_scope_handoff', {
            service,
            task_count: selected.size
          });
        }
        window.location.assign('/contact?' + params.toString() + '#contact-page-form');
      });
    }
    renderSelection();
  });

  document.querySelectorAll('[data-process-tabs]').forEach((process) => {
    const tabs = [...process.querySelectorAll('[data-process-tab]')];
    const panels = [...process.querySelectorAll('[data-process-panel]')];
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      const selected = tab.dataset.processTab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.processPanel !== selected;
      });
    }));
  });
})();
