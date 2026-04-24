/* ═══════════════════════════════════════════════════════════════
   SMARTTRADEHQ — app.js
   Canvas frame playback · GSAP ScrollTrigger · Lenis smooth scroll
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── CONFIG ───────────────────────────────────────────────── */
  const FRAME_COUNT  = 151;
  const FRAME_SPEED  = 2.0;   // product animation finishes at ~50% scroll
  const FRAME_PATH   = 'public/assets/frame_';
  const FRAME_EXT    = '.jpg';
  const FRAME_DIGITS = 4;     // zero-padded e.g. 0001
  const IS_MOBILE    = window.innerWidth < 768;

  /* ─── DOM REFS ──────────────────────────────────────────────── */
  const loader        = document.getElementById('loader');
  const loaderBar     = document.getElementById('loader-bar');
  const loaderPct     = document.getElementById('loader-percent');
  const canvasWrap    = document.getElementById('canvas-wrap');
  const canvas        = document.getElementById('canvas');
  const ctx           = canvas ? canvas.getContext('2d') : null;
  const darkOverlay   = document.getElementById('dark-overlay');
  const heroSection   = document.getElementById('hero');
  const scrollContainer = document.getElementById('scroll-container');
  const header        = document.getElementById('site-header');
  const progressLine  = document.getElementById('scroll-progress-line');
  const progressDot   = document.getElementById('scroll-progress-dot');
  const marqueeEl     = document.getElementById('marquee-main');

  /* ─── FRAME STORE ───────────────────────────────────────────── */
  const frames = new Array(FRAME_COUNT);
  let loadedCount   = 0;
  let currentFrame  = 0;
  let bgColor       = '#000000';

  function padNum(n, digits) {
    return String(n).padStart(digits, '0');
  }

  function frameSrc(i) {
    return FRAME_PATH + padNum(i + 1, FRAME_DIGITS) + FRAME_EXT;
  }

  /* ─── CANVAS SETUP ──────────────────────────────────────────── */
  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    drawFrame(currentFrame);
  }

  function sampleBgColor(img) {
    if (!img || !ctx) return;
    try {
      const offCtx = document.createElement('canvas').getContext('2d');
      offCtx.canvas.width  = 4;
      offCtx.canvas.height = 4;
      offCtx.drawImage(img, 0, 0, 4, 4);
      const d = offCtx.getImageData(0, 0, 1, 1).data;
      bgColor = `rgb(${d[0]},${d[1]},${d[2]})`;
    } catch (_) { bgColor = '#000'; }
  }

  function drawFrame(index) {
    if (!ctx || IS_MOBILE) return;
    const img = frames[index];
    if (!img) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth  || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const scale = Math.max(cw / iw, ch / ih) * 0.88;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ─── PRELOADER ──────────────────────────────────────────────── */
  function loadFrame(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        frames[index] = img;
        loadedCount++;
        const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
        loaderBar.style.width = pct + '%';
        loaderPct.textContent = pct + '%';
        if (index % 20 === 0) sampleBgColor(img);
        resolve();
      };
      img.onerror = () => { loadedCount++; resolve(); };
      img.src = frameSrc(index);
    });
  }

  async function preloadFrames() {
    // Phase 1: load first 10 frames fast (show first frame immediately)
    const firstBatch = [];
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) {
      firstBatch.push(loadFrame(i));
    }
    await Promise.all(firstBatch);

    // Draw first frame and reveal
    if (!IS_MOBILE) {
      resizeCanvas();
      drawFrame(0);
    }

    // Phase 2: load remaining frames in background
    const remaining = [];
    for (let i = 10; i < FRAME_COUNT; i++) {
      remaining.push(loadFrame(i));
    }
    await Promise.all(remaining);

    // All loaded — hide loader
    loader.classList.add('hidden');

    // Init everything after frames ready
    initScrollEngine();
  }

  /* ─── LENIS SMOOTH SCROLL ────────────────────────────────────── */
  let lenis;
  function initLenis() {
    if (IS_MOBILE) return;
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ─── SCROLL PROGRESS BAR ────────────────────────────────────── */
  function initScrollProgress() {
    if (IS_MOBILE) return;
    window.addEventListener('scroll', updateProgress, { passive: true });
    function updateProgress() {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
      progressLine.style.height = pct + '%';
      progressDot.style.top = pct + '%';
    }
  }

  /* ─── HEADER SCROLL EFFECT ───────────────────────────────────── */
  function initHeader() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
      });
      // Close on link click
      mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => mobileNav.classList.remove('open'));
      });
    }
  }

  /* ─── HERO TRANSITION (circle-wipe) ─────────────────────────── */
  function initHeroTransition() {
    if (IS_MOBILE || !scrollContainer) return;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Hero fades as scroll begins
        if (heroSection) {
          heroSection.style.opacity = Math.max(0, 1 - p * 18);
        }

        // Canvas circle-wipe reveal
        const wipeStart = 0.005;
        const wipeEnd   = 0.07;
        const wp = Math.min(1, Math.max(0, (p - wipeStart) / (wipeEnd - wipeStart)));
        const radius = wp * 80;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
      }
    });
  }

  /* ─── FRAME PLAYBACK ─────────────────────────────────────────── */
  function initFramePlayback() {
    if (IS_MOBILE || !scrollContainer) return;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
      }
    });
  }

  /* ─── DARK OVERLAY ───────────────────────────────────────────── */
  function initDarkOverlay() {
    if (IS_MOBILE || !scrollContainer || !darkOverlay) return;
    const enter = 0.10;
    const leave = 0.95;
    const fade  = 0.04;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;
        if (p >= enter - fade && p < enter) {
          opacity = (p - (enter - fade)) / fade;
        } else if (p >= enter && p <= leave) {
          opacity = 1;
        } else if (p > leave && p <= leave + fade) {
          opacity = 1 - (p - leave) / fade;
        }
        darkOverlay.style.opacity = Math.max(0, Math.min(1, opacity));
      }
    });
  }

  /* ─── POSITION SECTIONS ──────────────────────────────────────── */
  function positionSections() {
    if (IS_MOBILE || !scrollContainer) return;
    const containerH = scrollContainer.offsetHeight;

    document.querySelectorAll('.scroll-section').forEach((section) => {
      const enter = parseFloat(section.dataset.enter) / 100;
      const leave = parseFloat(section.dataset.leave) / 100;
      const mid = (enter + leave) / 2;
      const topPx = mid * containerH;
      section.style.top = topPx + 'px';
      section.style.transform = 'translateY(-50%)';
    });

    // Position marquee
    if (marqueeEl) {
      const marqueeAt = 0.565;
      marqueeEl.style.top = (marqueeAt * containerH) + 'px';
      marqueeEl.style.transform = 'translateY(-50%)';
    }
  }

  /* ─── SECTION ANIMATIONS ─────────────────────────────────────── */
  function setupSectionAnimations() {
    if (IS_MOBILE) return;

    document.querySelectorAll('.scroll-section').forEach((section) => {
      const type    = section.dataset.animation || 'fade-up';
      const persist = section.dataset.persist === 'true';
      const enter   = parseFloat(section.dataset.enter) / 100;
      const leave   = parseFloat(section.dataset.leave) / 100;

      // Collect animatable children
      const children = [
        ...section.querySelectorAll('.section-label'),
        ...section.querySelectorAll('.section-heading'),
        ...section.querySelectorAll('.problem-item'),
        ...section.querySelectorAll('.dsp-row'),
        ...section.querySelectorAll('.system-step'),
        ...section.querySelectorAll('.tier-card'),
        ...section.querySelectorAll('.testimonial-card'),
        ...section.querySelectorAll('.founder-line'),
        ...section.querySelectorAll('.faq-item'),
        ...section.querySelectorAll('.manifesto-line'),
        ...section.querySelectorAll('.brand-mark'),
        ...section.querySelectorAll('.close-subtext'),
        ...section.querySelectorAll('.close-cta'),
        ...section.querySelectorAll('.section-body'),
        ...section.querySelectorAll('.section-note'),
      ];
      if (!children.length) return;

      // Build entrance timeline
      const tl = gsap.timeline({ paused: true });
      const ease3 = 'power3.out';
      const ease4 = 'power4.inOut';
      const ease2 = 'power2.out';

      switch (type) {
        case 'fade-up':
          gsap.set(children, { y: 50, opacity: 0, transformOrigin: 'center bottom' });
          tl.to(children, { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: ease3 });
          break;
        case 'slide-left':
          gsap.set(children, { x: -80, opacity: 0 });
          tl.to(children, { x: 0, opacity: 1, stagger: 0.14, duration: 0.9, ease: ease3 });
          break;
        case 'slide-right':
          gsap.set(children, { x: 80, opacity: 0 });
          tl.to(children, { x: 0, opacity: 1, stagger: 0.14, duration: 0.9, ease: ease3 });
          break;
        case 'scale-up':
          gsap.set(children, { scale: 0.82, opacity: 0, transformOrigin: 'center center' });
          tl.to(children, { scale: 1, opacity: 1, stagger: 0.12, duration: 1.0, ease: ease2 });
          break;
        case 'rotate-in':
          gsap.set(children, { y: 40, rotation: 4, opacity: 0, transformOrigin: 'left center' });
          tl.to(children, { y: 0, rotation: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease: ease3 });
          break;
        case 'stagger-up':
          gsap.set(children, { y: 60, opacity: 0, transformOrigin: 'center bottom' });
          tl.to(children, { y: 0, opacity: 1, stagger: 0.15, duration: 0.85, ease: ease3 });
          break;
        case 'clip-reveal':
          gsap.set(children, { clipPath: 'inset(100% 0 0 0)', opacity: 0 });
          tl.to(children, { clipPath: 'inset(0% 0 0 0)', opacity: 1, stagger: 0.15, duration: 1.2, ease: ease4 });
          break;
        default:
          gsap.set(children, { opacity: 0, y: 30 });
          tl.to(children, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: ease3 });
      }

      // 3D depth tweak on DSP letters
      if (section.dataset.scene === '2-right') {
        section.querySelectorAll('.dsp-row').forEach((row, i) => {
          tl.from(row, { translateZ: -80, duration: 0.6, ease: ease3 }, i * 0.3);
        });
      }

      let played = false;
      let reversed = false;

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: false,
        onUpdate: (self) => {
          const p = self.progress;
          const inRange = p >= enter && (persist || p <= leave);

          if (inRange && !played) {
            played = true;
            reversed = false;
            section.classList.add('visible');
            section.style.opacity = '1';
            tl.play();
          } else if (!inRange && !persist && played && !reversed) {
            reversed = true;
            played = false;
            tl.reverse();
            // Hide after reverse
            tl.eventCallback('onReverseComplete', () => {
              section.style.opacity = '0';
              section.classList.remove('visible');
            });
          }
        }
      });
    });
  }

  /* ─── MARQUEE ────────────────────────────────────────────────── */
  function initMarquee() {
    if (IS_MOBILE || !marqueeEl || !scrollContainer) return;
    const marqueeText = marqueeEl.querySelector('.marquee-text');
    if (!marqueeText) return;

    const enter = 0.53;
    const leave = 0.62;

    gsap.to(marqueeText, {
      xPercent: -18,
      ease: 'none',
      scrollTrigger: {
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      }
    });

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;
        if (p >= enter && p <= leave) {
          marqueeEl.classList.add('visible');
        } else {
          marqueeEl.classList.remove('visible');
        }
      }
    });
  }

  /* ─── FAQ ACCORDION ──────────────────────────────────────────── */
  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach((btn) => {
      btn.addEventListener('click', () => {
        const answer  = btn.nextElementSibling;
        const isOpen  = btn.getAttribute('aria-expanded') === 'true';
        const allAnswers = document.querySelectorAll('.faq-answer');
        const allBtns    = document.querySelectorAll('.faq-question');

        // Close all
        allAnswers.forEach((a) => a.classList.remove('open'));
        allBtns.forEach((b) => b.setAttribute('aria-expanded', 'false'));

        if (!isOpen) {
          answer.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ─── SMOOTH SCROLL CTAs ─────────────────────────────────────── */
  function initSmoothCTAs() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { duration: 1.5, offset: -80 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Hero CTA scrolls to scroll container
    document.querySelectorAll('.scroll-to-scene2').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(scrollContainer, { duration: 1.8 });
        } else {
          scrollContainer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ─── CARD 3D TILT (mouse) ───────────────────────────────────── */
  function initCardTilt() {
    if (IS_MOBILE) return;
    document.querySelectorAll('.tier-card, .testimonial-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const rotY =  dx * 6;
        const rotX = -dy * 4;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ─── MOBILE STATIC SETUP ────────────────────────────────────── */
  function initMobile() {
    if (!IS_MOBILE) return;
    // Loader hides immediately on mobile (no canvas to wait for)
    loader.classList.add('hidden');
  }

  /* ─── WINDOW RESIZE ──────────────────────────────────────────── */
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!IS_MOBILE) {
        resizeCanvas();
        positionSections();
        ScrollTrigger.refresh();
      }
    }, 200);
  });

  /* ─── MAIN INIT ──────────────────────────────────────────────── */
  function initScrollEngine() {
    gsap.registerPlugin(ScrollTrigger);

    initLenis();
    initScrollProgress();
    initHeroTransition();
    initFramePlayback();
    initDarkOverlay();
    positionSections();
    setupSectionAnimations();
    initMarquee();

    // Small delay for layout settle
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }

  function init() {
    initHeader();
    initFAQ();
    initSmoothCTAs();
    initCardTilt();

    if (IS_MOBILE) {
      initMobile();
    } else {
      // Desktop: preload frames then init scroll engine
      resizeCanvas();
      preloadFrames();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
