/**
 * ASSISTA CORP — Premium Editorial Motion & Interaction Orchestrator
 * Subtle, intelligent motion for an enterprise global business services partner.
 */

(function () {
  'use strict';

  // Check user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ensure fresh loads and refreshes start cleanly at scroll position 0
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash || window.location.hash === '#contact') {
      if (window.location.hash === '#contact') {
        history.replaceState(null, null, window.location.pathname);
      }
      window.scrollTo(0, 0);
    }
    initScrollProgress();
    initScrollReveals();
    initMetricCounters();
    initProcessProgress();
    initHeaderElevation();
  });

  /**
   * 1. Minimal Scroll Progress Indicator
   */
  function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress-fill');
    if (!progressBar || prefersReducedMotion) return;

    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const percent = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        progressBar.style.width = percent + '%';
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }

  /**
   * 2. IntersectionObserver-based Scroll Reveals
   */
  function initScrollReveals() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll, .section-reveal-line, .image-editorial-reveal');
    if (revealElements.length === 0) return;

    if (prefersReducedMotion) {
      revealElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px 40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  /**
   * 3. Verified Factual Metric Count-Up Animation
   * Animates only verified existing metrics (e.g. 98.4%, 1,800+, 80+, 15).
   */
  function initMetricCounters() {
    const counterElements = document.querySelectorAll('[data-counter]');
    if (counterElements.length === 0) return;

    if (prefersReducedMotion) {
      counterElements.forEach(el => {
        const target = el.getAttribute('data-counter');
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        el.textContent = prefix + target + suffix;
      });
      return;
    }

    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    counterElements.forEach(el => counterObserver.observe(el));

    function animateCounter(el) {
      const rawTarget = parseFloat(el.getAttribute('data-counter'));
      const prefix = el.getAttribute('data-prefix') || '';
      const suffix = el.getAttribute('data-suffix') || '';
      const isDecimal = String(el.getAttribute('data-counter')).includes('.');
      const duration = 1400; // ms
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Smooth cubic ease out
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentVal = rawTarget * ease;

        let displayVal;
        if (isDecimal) {
          displayVal = currentVal.toFixed(1);
        } else if (rawTarget >= 1000) {
          displayVal = Math.round(currentVal).toLocaleString();
        } else {
          displayVal = Math.round(currentVal);
        }

        el.textContent = prefix + displayVal + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = prefix + (isDecimal ? rawTarget.toFixed(1) : (rawTarget >= 1000 ? rawTarget.toLocaleString() : rawTarget)) + suffix;
        }
      }

      requestAnimationFrame(update);
    }
  }

  /**
   * 4. "How We Work" Connecting Process Line
   */
  function initProcessProgress() {
    const processSection = document.getElementById('how-we-work');
    const progressLine = document.getElementById('process-progress-line');
    const pillarItems = document.querySelectorAll('.pillar-item');

    if (!processSection || !progressLine || pillarItems.length === 0) return;

    if (prefersReducedMotion) {
      progressLine.style.width = '100%';
      pillarItems.forEach(item => item.classList.add('step-active'));
      return;
    }

    const processObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Progressively activate steps
          pillarItems.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add('step-active');
              const targetPercent = ((index + 1) / pillarItems.length) * 100;
              progressLine.style.width = targetPercent + '%';
            }, index * 240);
          });
        }
      });
    }, {
      threshold: 0.2
    });

    processObserver.observe(processSection);
  }

  /**
   * 5. Header Subtle Elevation on Scroll
   */
  function initHeaderElevation() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }

})();
