/**
 * ASSISTA CORP — Motion Graphics & Video Controller
 * Graceful video fallbacks, viewport-aware playback, and micro-interaction orchestration.
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initVideoOrchestration();
    initWorkflowInteractions();
    initProcessLineAnimation();
  });

  /**
   * 1. Resilient Video Playback & Fallback Controller
   */
  function initVideoOrchestration() {
    const videos = document.querySelectorAll('video');
    if (videos.length === 0) return;

    if (prefersReducedMotion) {
      videos.forEach(v => {
        try {
          v.pause();
        } catch (_) {}
      });
      return;
    }

    // Viewport-aware playback observer
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          // In viewport -> play if ready
          if (video.paused && !prefersReducedMotion) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay was prevented by browser policy (e.g. low battery); poster image displays cleanly
              });
            }
          }
        } else {
          // Out of viewport -> pause to conserve CPU/battery
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, {
      threshold: 0.15
    });

    videos.forEach(video => {
      // Error safeguard: if video fails to load, gracefully fall back to poster image
      video.addEventListener('error', () => {
        const poster = video.getAttribute('poster');
        if (poster) {
          const fallbackImg = document.createElement('img');
          fallbackImg.src = poster;
          fallbackImg.alt = video.getAttribute('aria-label') || 'Assista Operations';
          fallbackImg.className = video.className;
          fallbackImg.style.width = '100%';
          fallbackImg.style.height = '100%';
          fallbackImg.style.objectFit = 'cover';
          if (video.parentNode) {
            video.parentNode.replaceChild(fallbackImg, video);
          }
        }
      });

      videoObserver.observe(video);
    });
  }

  /**
   * 2. Interactive Service Workflow Hover Highlights
   */
  function initWorkflowInteractions() {
    const serviceCards = document.querySelectorAll('.visual-service-card');
    serviceCards.forEach(card => {
      const flowingPath = card.querySelector('.path-flowing, .path-flowing-lime');
      if (!flowingPath) return;

      card.addEventListener('mouseenter', () => {
        if (!prefersReducedMotion) {
          flowingPath.style.animationDuration = '1.8s';
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!prefersReducedMotion) {
          flowingPath.style.animationDuration = '3.5s';
        }
      });
    });
  }

  /**
   * 3. How We Work — Connected Process Line & Step Sequence
   */
  function initProcessLineAnimation() {
    const track = document.querySelector('.connected-process-track');
    const progressBar = document.getElementById('process-progress-line');
    const steps = document.querySelectorAll('.process-step-node');
    if (!track || !progressBar || steps.length === 0) return;

    if (prefersReducedMotion) {
      progressBar.style.width = '100%';
      steps.forEach(s => s.classList.add('step-active'));
      return;
    }

    let animated = false;
    const processObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          // Step 1 lights up immediately
          if (steps[0]) steps[0].classList.add('step-active');
          progressBar.style.width = '10%';

          // Step 2 at 350ms
          setTimeout(() => {
            progressBar.style.width = '38%';
            if (steps[1]) steps[1].classList.add('step-active');
          }, 350);

          // Step 3 at 700ms
          setTimeout(() => {
            progressBar.style.width = '70%';
            if (steps[2]) steps[2].classList.add('step-active');
          }, 700);

          // Step 4 at 1050ms
          setTimeout(() => {
            progressBar.style.width = '100%';
            if (steps[3]) steps[3].classList.add('step-active');
          }, 1050);

          processObserver.unobserve(track);
        }
      });
    }, {
      threshold: 0.25
    });

    processObserver.observe(track);
  }

})();
