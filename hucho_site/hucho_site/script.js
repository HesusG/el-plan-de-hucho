/*
 * El Plan de Hucho — Novela Gráfica
 * Scroll-driven animations, typewriter, parallax, shake, water rise, chapter nav
 * Vanilla JS, no dependencies
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // 1. PROGRESS BAR
  // ═══════════════════════════════════════════
  var progressBar = document.querySelector('.progress-bar');

  function updateProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = percent + '%';
  }

  // ═══════════════════════════════════════════
  // 2. REVEAL SYSTEM (IntersectionObserver)
  // ═══════════════════════════════════════════
  var revealElements = document.querySelectorAll('[data-reveal]');

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        var revealType = el.getAttribute('data-reveal');

        // Typewriter is handled separately
        if (revealType === 'typewriter') return;

        setTimeout(function () {
          el.classList.add('revealed');
        }, delay);

        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.25 }
  );

  revealElements.forEach(function (el) {
    if (el.getAttribute('data-reveal') !== 'typewriter') {
      revealObserver.observe(el);
    }
  });

  // ═══════════════════════════════════════════
  // 3. TYPEWRITER EFFECT
  // ═══════════════════════════════════════════
  var typewriterElements = document.querySelectorAll('[data-reveal="typewriter"]');
  var typewriterTexts = new Map();

  // Store original text and clear it
  typewriterElements.forEach(function (el) {
    typewriterTexts.set(el, el.textContent.trim());
    el.textContent = '';
    el.style.opacity = '1';
  });

  function typewrite(el, text, speed) {
    speed = speed || 40;
    var i = 0;
    el.classList.add('typing');

    function tick() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed);
      } else {
        el.classList.remove('typing');
      }
    }

    tick();
  }

  // Observer for typewriter — needs higher threshold
  var typewriterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        var text = typewriterTexts.get(el);

        if (text) {
          setTimeout(function () {
            typewrite(el, text, 40);
          }, delay);
        }

        typewriterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  typewriterElements.forEach(function (el) {
    typewriterObserver.observe(el);
  });

  // ═══════════════════════════════════════════
  // 4. PARALLAX (transform-based, mobile-safe)
  // ═══════════════════════════════════════════
  var panelBgs = document.querySelectorAll('.panel__bg');
  var ticking = false;

  function updateParallax() {
    var windowHeight = window.innerHeight;

    panelBgs.forEach(function (bg) {
      var panel = bg.parentElement;
      var rect = panel.getBoundingClientRect();

      // Only update if panel is in or near viewport
      if (rect.bottom < -windowHeight || rect.top > windowHeight * 2) return;

      var panelCenter = rect.top + rect.height / 2;
      var viewportCenter = windowHeight / 2;
      var offset = (panelCenter - viewportCenter) * 0.15;

      bg.style.transform = 'scale(1.15) translateY(' + offset + 'px)';
    });

    ticking = false;
  }

  function onScroll() {
    updateProgress();
    updateChapterNav();

    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ═══════════════════════════════════════════
  // 5. SCREEN SHAKE + FLASH (Panel Misil)
  // ═══════════════════════════════════════════
  var shakeTriggered = false;
  var shakePanel = document.querySelector('[data-shake]');
  var flashOverlay = document.querySelector('.flash-overlay');

  if (shakePanel) {
    var shakeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || shakeTriggered) return;
          shakeTriggered = true;

          // Delay for dramatic buildup (synced with BOOM SFX delay)
          setTimeout(function () {
            // Flash
            flashOverlay.classList.add('active');
            setTimeout(function () {
              flashOverlay.classList.remove('active');
            }, 150);

            // Shake
            document.body.classList.add('shaking');
            setTimeout(function () {
              document.body.classList.remove('shaking');
            }, 500);
          }, 8200); // Synced with BOOM SFX delay (8500) - small lead

          shakeObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    shakeObserver.observe(shakePanel);
  }

  // ═══════════════════════════════════════════
  // 6. WATER RISE (Panel Caída)
  // ═══════════════════════════════════════════
  var waterPanel = document.querySelector('[data-water-rise]');
  var waterOverlay = waterPanel ? waterPanel.querySelector('.water-overlay') : null;
  var waterTriggered = false;

  if (waterPanel && waterOverlay) {
    var waterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || waterTriggered) return;
          waterTriggered = true;

          // Delay to let content appear first
          setTimeout(function () {
            waterOverlay.classList.add('risen');
          }, 2000);

          waterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.3 }
    );

    waterObserver.observe(waterPanel);
  }

  // ═══════════════════════════════════════════
  // 7. PANEL BUILD SEQUENCE
  // ═══════════════════════════════════════════
  var panels = document.querySelectorAll('.panel');

  var panelObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('panel--active');
        }
      });
    },
    { threshold: 0.25 }
  );

  panels.forEach(function (panel) {
    panelObserver.observe(panel);
  });

  // ═══════════════════════════════════════════
  // 8. CHAPTER NAVIGATION DOTS
  // ═══════════════════════════════════════════
  var navDots = document.querySelectorAll('.chapter-nav__dot');
  var navSections = [];

  navDots.forEach(function (dot) {
    var targetId = dot.getAttribute('data-target');
    var section = document.getElementById(targetId);
    if (section) {
      navSections.push({ dot: dot, section: section });
    }

    // Click to scroll
    dot.addEventListener('click', function () {
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  function updateChapterNav() {
    var scrollTop = window.scrollY;
    var windowHeight = window.innerHeight;
    var currentIndex = 0;

    navSections.forEach(function (item, index) {
      var rect = item.section.getBoundingClientRect();
      // Section is considered active when its top half is in the viewport
      if (rect.top < windowHeight * 0.5) {
        currentIndex = index;
      }
    });

    navDots.forEach(function (dot, index) {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // ═══════════════════════════════════════════
  // 9. INITIAL STATE
  // ═══════════════════════════════════════════
  updateProgress();
  updateParallax();
  updateChapterNav();

  // Check for reduced motion preference
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (prefersReducedMotion.matches) {
    // Reveal everything immediately
    revealElements.forEach(function (el) {
      el.classList.add('revealed');
    });
    typewriterElements.forEach(function (el) {
      var text = typewriterTexts.get(el);
      if (text) el.textContent = text;
    });
    panels.forEach(function (panel) {
      panel.classList.add('panel--active');
    });
  }
})();
