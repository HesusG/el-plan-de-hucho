/*
 * El Plan de Hucho — Novela Gráfica
 * Step-based navigation: click/tap/keyboard to advance
 * No free scroll — the story controls the pace
 * Vanilla JS, no dependencies
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // 1. ELEMENTS
  // ═══════════════════════════════════════════
  var progressBar = document.querySelector('.progress-bar');
  var advanceBtn = document.getElementById('advance-arrow');
  var backBtn = document.getElementById('back-arrow');
  var introOverlay = document.getElementById('intro-overlay');
  var startBtn = document.getElementById('start-btn');
  var flashOverlay = document.querySelector('.flash-overlay');

  // ═══════════════════════════════════════════
  // 2. BUILD STEP SEQUENCE
  // ═══════════════════════════════════════════
  // Every [data-reveal] element is a step, except scroll indicators
  var allSteps = Array.from(
    document.querySelectorAll('[data-reveal]:not(.scroll-indicator)')
  );

  var currentStep = -1;
  var isAnimating = false;
  var started = false;

  // Store typewriter original texts and clear them
  var typewriterTexts = new Map();
  allSteps.forEach(function (el) {
    if (el.getAttribute('data-reveal') === 'typewriter') {
      typewriterTexts.set(el, el.textContent.trim());
      el.textContent = '';
      el.style.opacity = '1';
    }
  });

  // ═══════════════════════════════════════════
  // 3. BLOCK MANUAL SCROLL
  // ═══════════════════════════════════════════
  window.addEventListener('wheel', function (e) {
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });

  // ═══════════════════════════════════════════
  // 4. INPUT HANDLERS
  // ═══════════════════════════════════════════

  // Touch swipe detection
  var touchStartY = 0;

  window.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    var delta = touchStartY - e.changedTouches[0].clientY;
    if (delta > 30) advance();   // swipe up → advance
    if (delta < -30) goBack();   // swipe down → go back
  });

  // Keyboard
  window.addEventListener('keydown', function (e) {
    var forwardKeys = ['Space', 'ArrowDown', 'ArrowRight', 'PageDown', 'Enter'];
    var backKeys = ['ArrowUp', 'ArrowLeft', 'PageUp', 'Backspace'];
    if (forwardKeys.indexOf(e.code) !== -1) {
      e.preventDefault();
      advance();
    }
    if (backKeys.indexOf(e.code) !== -1) {
      e.preventDefault();
      goBack();
    }
    if (['Home', 'End'].indexOf(e.code) !== -1) {
      e.preventDefault();
    }
  });

  // Advance button
  if (advanceBtn) {
    advanceBtn.addEventListener('click', function (e) {
      e.preventDefault();
      advance();
    });
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      goBack();
    });
  }

  // Start button
  if (startBtn) {
    startBtn.addEventListener('click', function (e) {
      e.preventDefault();
      startStory();
    });
  }

  // ═══════════════════════════════════════════
  // 5. START STORY
  // ═══════════════════════════════════════════
  function startStory() {
    if (started) return;
    started = true;

    // Hide intro overlay
    if (introOverlay) {
      introOverlay.classList.add('hidden');
      setTimeout(function () {
        introOverlay.style.display = 'none';
      }, 1000);
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Mark first panel as active
    var firstPanel = document.querySelector('.panel');
    if (firstPanel) firstPanel.classList.add('panel--active');

    // Reveal first step after a beat
    setTimeout(function () {
      advance();
    }, 300);
  }

  // ═══════════════════════════════════════════
  // 6. ADVANCE — Core navigation
  // ═══════════════════════════════════════════
  function advance() {
    if (!started) {
      startStory();
      return;
    }

    if (isAnimating) return;

    currentStep++;
    if (currentStep >= allSteps.length) {
      currentStep = allSteps.length - 1;
      // Hide arrow at end
      if (advanceBtn) advanceBtn.classList.add('hidden');
      return;
    }

    isAnimating = true;

    var el = allSteps[currentStep];
    var revealType = el.getAttribute('data-reveal');

    // Mark parent panel as active
    var panel = el.closest('.panel');
    if (panel) {
      panel.classList.add('panel--active');
    }

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Reveal after scroll settles
    setTimeout(function () {
      if (revealType === 'typewriter') {
        var text = typewriterTexts.get(el);
        if (text) {
          typewrite(el, text, 35);
        }
      } else {
        el.classList.add('revealed');
      }

      // Check for special effects
      checkSpecialEffects(el);

      // Update UI
      updateProgress();
      updateChapterNav();
      updateBackButton();

      // Allow next advance
      setTimeout(function () {
        isAnimating = false;
      }, 350);
    }, 400);
  }

  // ═══════════════════════════════════════════
  // 6b. GO BACK — Reverse navigation
  // ═══════════════════════════════════════════
  function goBack() {
    if (!started || isAnimating) return;
    if (currentStep <= 0) return;

    // Un-reveal current step
    var el = allSteps[currentStep];
    el.classList.remove('revealed');

    // If typewriter, clear text
    if (el.getAttribute('data-reveal') === 'typewriter') {
      el.textContent = '';
    }

    currentStep--;

    // Scroll to the now-current step
    var prevEl = allSteps[currentStep];
    prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show advance arrow again if it was hidden
    if (advanceBtn) advanceBtn.classList.remove('hidden');

    updateProgress();
    updateChapterNav();
    updateBackButton();
  }

  function updateBackButton() {
    if (!backBtn) return;
    if (currentStep > 0) {
      backBtn.classList.add('active');
    } else {
      backBtn.classList.remove('active');
    }
  }

  // ═══════════════════════════════════════════
  // 7. TYPEWRITER
  // ═══════════════════════════════════════════
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

  // ═══════════════════════════════════════════
  // 8. SPECIAL EFFECTS
  // ═══════════════════════════════════════════
  var shakeTriggered = false;
  var waterTriggered = false;

  function checkSpecialEffects(el) {
    // BOOM SFX → shake + flash
    if (!shakeTriggered && el.classList.contains('sfx--boom')) {
      shakeTriggered = true;
      if (flashOverlay) {
        flashOverlay.classList.add('active');
        setTimeout(function () {
          flashOverlay.classList.remove('active');
        }, 150);
      }
      document.body.classList.add('shaking');
      setTimeout(function () {
        document.body.classList.remove('shaking');
      }, 500);
    }

    // Water rise — trigger when entering the water panel
    if (!waterTriggered) {
      var waterPanel = el.closest('[data-water-rise]');
      if (waterPanel) {
        var waterOverlay = waterPanel.querySelector('.water-overlay');
        if (waterOverlay) {
          waterTriggered = true;
          setTimeout(function () {
            waterOverlay.classList.add('risen');
          }, 2000);
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // 9. CHAPTER NAV DOTS
  // ═══════════════════════════════════════════
  var navDots = document.querySelectorAll('.chapter-nav__dot');
  var navSections = [];

  navDots.forEach(function (dot) {
    var targetId = dot.getAttribute('data-target');
    var section = document.getElementById(targetId);
    if (section) {
      navSections.push({ dot: dot, section: section });
    }

    dot.addEventListener('click', function () {
      if (section) {
        jumpToPanel(section);
      }
    });
  });

  function jumpToPanel(targetSection) {
    if (!started) startStory();

    // Find the first step inside or after this section
    var targetFirstStep = -1;
    for (var i = 0; i < allSteps.length; i++) {
      if (targetSection.contains(allSteps[i])) {
        targetFirstStep = i;
        break;
      }
    }

    if (targetFirstStep === -1) return;

    // Reveal all steps before this point (instantly)
    for (var j = 0; j <= targetFirstStep; j++) {
      var el = allSteps[j];
      var revealType = el.getAttribute('data-reveal');

      if (revealType === 'typewriter') {
        var text = typewriterTexts.get(el);
        if (text) el.textContent = text;
      }
      el.classList.add('revealed');

      var panel = el.closest('.panel');
      if (panel) panel.classList.add('panel--active');
    }

    currentStep = targetFirstStep;

    // Scroll to the section
    targetSection.scrollIntoView({ behavior: 'smooth' });

    // Update UI
    updateProgress();
    updateChapterNav();
  }

  function updateChapterNav() {
    if (currentStep < 0) return;
    var currentEl = allSteps[Math.min(currentStep, allSteps.length - 1)];
    var activeIndex = 0;

    navSections.forEach(function (item, index) {
      var rect = item.section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) {
        activeIndex = index;
      }
    });

    navDots.forEach(function (dot, index) {
      if (index === activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // ═══════════════════════════════════════════
  // 10. PROGRESS BAR
  // ═══════════════════════════════════════════
  function updateProgress() {
    var percent = allSteps.length > 0
      ? ((currentStep + 1) / allSteps.length) * 100
      : 0;
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
  }

  // ═══════════════════════════════════════════
  // 11. INITIAL STATE
  // ═══════════════════════════════════════════
  updateProgress();

  // Reduced motion — reveal everything, skip intro
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (prefersReducedMotion.matches) {
    started = true;
    if (introOverlay) {
      introOverlay.style.display = 'none';
    }
    allSteps.forEach(function (el) {
      el.classList.add('revealed');
      var text = typewriterTexts.get(el);
      if (text) el.textContent = text;
    });
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.add('panel--active');
    });
    currentStep = allSteps.length - 1;
    // Re-enable scroll for reduced motion users
    window.addEventListener('wheel', function () {}, { passive: true });
  }
})();
