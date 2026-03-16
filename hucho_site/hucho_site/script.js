/*
 * El Plan de Hucho — Novela Gráfica
 * Scroll libre + IntersectionObserver reveal
 * El usuario scrollea normalmente; elementos aparecen al entrar en viewport
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
  var allSteps = Array.from(
    document.querySelectorAll('[data-reveal]:not(.scroll-indicator)')
  );

  var revealedCount = 0;
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
  // 3. INTERSECTION OBSERVER
  // ═══════════════════════════════════════════
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.classList.contains('revealed')) {
        revealElement(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function revealElement(el) {
    // Mark parent panel as active
    var panel = el.closest('.panel');
    if (panel) {
      panel.classList.add('panel--active');
    }

    // Reveal: typewriter or instant
    var revealType = el.getAttribute('data-reveal');
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

    // Stop observing — once revealed, stays revealed
    revealObserver.unobserve(el);

    // Update UI
    revealedCount++;
    updateProgress();
    updateChapterNav();
    updateBackButton();

    // Hide advance arrow at end
    if (revealedCount >= allSteps.length && advanceBtn) {
      advanceBtn.classList.add('hidden');
    }
  }

  // ═══════════════════════════════════════════
  // 4. INPUT HANDLERS
  // ═══════════════════════════════════════════

  // Keyboard shortcuts (optional — browser handles native scroll)
  window.addEventListener('keydown', function (e) {
    if (!started) return;
    if (e.code === 'Space' || e.code === 'ArrowDown') {
      e.preventDefault();
      advance();
    }
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      goBack();
    }
  });

  // Advance button
  if (advanceBtn) {
    advanceBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!started) {
        startStory();
        return;
      }
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

    // Start observing all steps
    allSteps.forEach(function (el) {
      if (!el.classList.contains('revealed')) {
        revealObserver.observe(el);
      }
    });
  }

  // ═══════════════════════════════════════════
  // 6. ADVANCE — scroll to next unrevealed
  // ═══════════════════════════════════════════
  function advance() {
    if (!started) {
      startStory();
      return;
    }

    // Find first unrevealed step
    for (var i = 0; i < allSteps.length; i++) {
      var el = allSteps[i];
      if (!el.classList.contains('revealed') && el.getAttribute('data-reveal') !== 'typewriter') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      // For typewriter, check if it has text (already revealed)
      if (el.getAttribute('data-reveal') === 'typewriter' && el.textContent.trim() === '') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }

  // ═══════════════════════════════════════════
  // 6b. GO BACK — scroll up
  // ═══════════════════════════════════════════
  function goBack() {
    if (!started) return;
    window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
  }

  function updateBackButton() {
    if (!backBtn) return;
    if (revealedCount > 0) {
      backBtn.classList.add('active');
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

    // Reveal all steps up to and including this section (instantly)
    var found = false;
    for (var i = 0; i < allSteps.length; i++) {
      var el = allSteps[i];

      if (!el.classList.contains('revealed')) {
        var revealType = el.getAttribute('data-reveal');
        if (revealType === 'typewriter') {
          var text = typewriterTexts.get(el);
          if (text) el.textContent = text;
        }
        el.classList.add('revealed');
        revealObserver.unobserve(el);
        revealedCount++;

        var panel = el.closest('.panel');
        if (panel) panel.classList.add('panel--active');
      }

      if (targetSection.contains(el)) {
        found = true;
      }

      // Stop after we've passed the target section
      if (found && !targetSection.contains(el)) {
        break;
      }
    }

    // Scroll to the section
    targetSection.scrollIntoView({ behavior: 'smooth' });

    // Update UI
    updateProgress();
    updateChapterNav();
  }

  function updateChapterNav() {
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
      ? (revealedCount / allSteps.length) * 100
      : 0;
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
  }

  // ═══════════════════════════════════════════
  // 11. INITIAL STATE
  // ═══════════════════════════════════════════
  updateProgress();

  // Update chapter nav on scroll
  window.addEventListener('scroll', function () {
    if (started) updateChapterNav();
  }, { passive: true });

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
    revealedCount = allSteps.length;
    updateProgress();
  }
})();
