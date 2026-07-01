/* קיסר דיגום - prototype interactions (static hero) */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width:860px)').matches;

  const header = document.getElementById('header');
  const nav = document.getElementById('mainNav');
  const toggle = document.getElementById('navToggle');
  const closeBtn = document.getElementById('navClose');
  const overlay = document.getElementById('navOverlay');

  /* --- Header background on scroll --- */
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Mobile nav open/close --- */
  const openNav = () => {
    nav.classList.add('open');
    overlay.classList.add('show');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeNav = () => {
    nav.classList.remove('open');
    overlay.classList.remove('show');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', openNav);
  closeBtn.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);

  /* --- Mobile dropdown accordion (mega menu) — robust for iOS touch ---
     Bind touchend AND click: on iOS Safari, touchend's preventDefault often
     swallows the paired click, so a plain "suppress the next click" flag can get
     stuck armed and then eat a later *legitimate* tap (dropdown appears dead).
     Fix: reset the flag on every touchstart, so it can never carry over between
     taps — touchend handles iOS, click handles mouse/Android, exactly one toggle. */
  document.querySelectorAll('.has-mega > .dd-toggle').forEach((link) => {
    const li = link.parentElement;
    let touchHandled = false;
    const toggleSub = (e) => {
      if (e && e.cancelable) e.preventDefault();
      e.stopPropagation();
      li.classList.toggle('expanded');
    };
    // a fresh tap always starts clean, so the flag can never stay stuck
    link.addEventListener('touchstart', () => { touchHandled = false; }, { passive: true });
    link.addEventListener('touchend', (e) => {
      if (!isMobile()) return;                 // desktop keeps hover + normal link behaviour
      touchHandled = true;                     // remember this tap so we swallow its ghost click
      toggleSub(e);
    });
    link.addEventListener('click', (e) => {
      if (!isMobile()) return;                 // desktop: let the link navigate
      if (touchHandled) { touchHandled = false; if (e.cancelable) e.preventDefault(); return; }
      toggleSub(e);                            // mouse / Android click that had no touchend
    });
  });

  /* --- Close mobile nav when a link is tapped --- */
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      if (isMobile() && !a.classList.contains('dd-toggle')) closeNav();
    });
  });

  /* --- Service rail: auto-cycle the active domain top→bottom (every 1s,
         looping back to the first after the last), + click to jump manually --- */
  const railItems = Array.from(document.querySelectorAll('.hero-rail li'));
  if (railItems.length) {
    let railIdx = railItems.findIndex((li) => li.classList.contains('active'));
    if (railIdx < 0) railIdx = 0;

    const setRail = (i) => {
      railIdx = (i + railItems.length) % railItems.length;
      railItems.forEach((x, n) => x.classList.toggle('active', n === railIdx));
    };

    let railTimer = null;
    const startRail = () => {
      if (reduceMotion || railTimer) return;
      railTimer = setInterval(() => setRail(railIdx + 1), 1000);
    };
    const stopRail = () => { clearInterval(railTimer); railTimer = null; };

    // click jumps to a domain, then the cycle resumes from there
    railItems.forEach((li, i) => {
      li.addEventListener('click', () => { stopRail(); setRail(i); startRail(); });
    });

    // pause while the tab is hidden so we don't jump several steps on return
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopRail(); else startRail();
    });

    setRail(railIdx);
    startRail();
  }

  /* --- Scroll reveal --- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* --- Animated stat counters --- */
  const stats = document.querySelectorAll('.num[data-target]');
  const animateCount = (el) => {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString('he-IL') + suffix; return; }
    const dur = 2800;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString('he-IL') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (stats.length && 'IntersectionObserver' in window) {
    const statIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    stats.forEach((s) => statIO.observe(s));
  } else {
    stats.forEach((s) => (s.textContent = (+s.dataset.target).toLocaleString('he-IL') + (s.dataset.suffix || '')));
  }

  /* --- Lead form (prototype: no backend) --- */
  const form = document.getElementById('leadForm');
  const msg = document.getElementById('formMsg');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      if (!name || !phone) {
        msg.style.color = '#ff7a7a';
        msg.textContent = 'נא למלא שם וטלפון.';
        return;
      }
      const consent = form.consent;
      if (consent && !consent.checked) {
        msg.style.color = '#ff7a7a';
        msg.textContent = 'יש לאשר את מדיניות הפרטיות כדי לשלוח.';
        return;
      }
      msg.style.color = '';
      msg.textContent = 'תודה ' + name + '! קיבלנו את הפנייה ונחזור אליכם בהקדם.';
      form.reset();
    });
  }

  /* --- Contact page: show chosen file name + clear it on form reset --- */
  const fileInput = document.getElementById('attachment');
  const fileNameEl = document.getElementById('fileName');
  if (fileInput && fileNameEl) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length) {
        fileNameEl.textContent = 'נבחר קובץ: ' + fileInput.files[0].name;
        fileNameEl.classList.add('has');
      } else {
        fileNameEl.textContent = '';
        fileNameEl.classList.remove('has');
      }
    });
    const ownerForm = fileInput.closest('form');
    if (ownerForm) {
      ownerForm.addEventListener('reset', () => {
        fileNameEl.textContent = '';
        fileNameEl.classList.remove('has');
      });
    }
  }

  /* --- Hero video: honour reduced-motion (show the poster frame, don't autoplay) --- */
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo && reduceMotion) {
    try { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); } catch (e) {}
  }

  /* --- Clients logo slider: continuous auto-scroll marquee + arrow nudge ---
         (track is forced dir="ltr" internally so offsetLeft / transforms are
         direction-agnostic; the set is cloned once for a seamless loop) --- */
  const slider = document.querySelector('[data-clients]');
  if (slider) {
    const track = slider.querySelector('.cs-track');
    const prevBtn = slider.querySelector('.cs-prev');
    const nextBtn = slider.querySelector('.cs-next');
    const originals = Array.from(track.children);

    if (originals.length) {
      originals.forEach((el) => track.appendChild(el.cloneNode(true)));

      const SPEED = 32; // px / second
      let pos = 0, setWidth = 0, step = 0, paused = false, tween = null;

      const measure = () => {
        const items = track.children;
        const base = items[0].offsetLeft;
        setWidth = items[originals.length].offsetLeft - base;
        step = items.length > 1 ? items[1].offsetLeft - base : 200;
      };
      measure();
      window.addEventListener('resize', measure);

      const norm = (x) => {
        if (!setWidth) return 0;
        x %= setWidth;
        return x < 0 ? x + setWidth : x;
      };

      let last = performance.now();
      const frame = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (tween) {
          const t = Math.min((now - tween.start) / tween.dur, 1);
          const e = 1 - Math.pow(1 - t, 3);
          pos = tween.from + (tween.to - tween.from) * e;
          if (t >= 1) tween = null;
        } else if (!paused && !reduceMotion) {
          pos += SPEED * dt;
        }
        pos = norm(pos);
        track.style.transform = 'translateX(' + (-pos) + 'px)';
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);

      const nudge = (dir) => {
        const d = (step || 200) * dir;
        if (reduceMotion) { pos = norm(pos + d); track.style.transform = 'translateX(' + (-pos) + 'px)'; return; }
        tween = { from: pos, to: pos + d, start: performance.now(), dur: 520 };
      };
      // RTL: the right arrow (prev) steps back, the left arrow (next) advances
      if (nextBtn) nextBtn.addEventListener('click', () => nudge(1));
      if (prevBtn) prevBtn.addEventListener('click', () => nudge(-1));

      const pause = () => { paused = true; };
      const resume = () => { paused = false; last = performance.now(); };
      slider.addEventListener('mouseenter', pause);
      slider.addEventListener('mouseleave', resume);
      slider.addEventListener('focusin', pause);
      slider.addEventListener('focusout', resume);
      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); });
    }
  }

  /* --- "מידע מקצועי" posts (homepage) + "מאמרים נוספים" related posts (article pages):
         mobile slider — 1 card at a time, side arrows, auto-advances.
         Interval is per-slider via data-slider-interval (homepage=2000, article pages=1500). --- */
  document.querySelectorAll('[data-posts-slider]').forEach((postsSlider) => {
    const pcards = Array.from(postsSlider.querySelectorAll('.post-card'));
    if (pcards.length < 2) return;
    const pPrev = postsSlider.querySelector('.ps-prev');
    const pNext = postsSlider.querySelector('.ps-next');
    const interval = parseInt(postsSlider.getAttribute('data-slider-interval'), 10) || 2000;
    let pIdx = 0, pTimer = null;
    const pShow = (i) => {
      pIdx = (i + pcards.length) % pcards.length;
      pcards.forEach((c, n) => c.classList.toggle('is-active', n === pIdx));
    };
    const pStart = () => { if (reduceMotion || pTimer || !isMobile()) return; pTimer = setInterval(() => pShow(pIdx + 1), interval); };
    const pStop = () => { clearInterval(pTimer); pTimer = null; };
    if (pNext) pNext.addEventListener('click', () => { pStop(); pShow(pIdx + 1); pStart(); });
    if (pPrev) pPrev.addEventListener('click', () => { pStop(); pShow(pIdx - 1); pStart(); });
    // only behave as a slider on mobile; on desktop the 3-up grid shows untouched
    const pSync = () => {
      if (isMobile()) { postsSlider.classList.add('is-slider'); pShow(pIdx); pStart(); }
      else { postsSlider.classList.remove('is-slider'); pStop(); pcards.forEach((c) => c.classList.remove('is-active')); }
    };
    pSync();
    window.addEventListener('resize', pSync);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pStop(); else pStart(); });
  });

  /* --- Generic mobile card slider: 1 card at a time, auto-advances every 1.5s.
         Applies to the services / "why us" grids on the homepage and the
         "what's included" / "when" grids on every service page. Mobile-only;
         on desktop the original multi-column grid is shown untouched. --- */
  document.querySelectorAll('.services-grid, .features-grid, .topic-grid, .reg-list').forEach((grid) => {
    const cards = Array.from(grid.children).filter((el) => el.nodeType === 1);
    if (cards.length < 2) return;

    const dots = document.createElement('div');
    dots.className = 'ms-dots';
    let idx = 0, timer = null;
    const show = (i) => {
      idx = (i + cards.length) % cards.length;
      cards.forEach((c, n) => c.classList.toggle('ms-active', n === idx));
      Array.from(dots.children).forEach((d, n) => d.classList.toggle('on', n === idx));
    };
    const start = () => { if (reduceMotion || timer || !isMobile()) return; timer = setInterval(() => show(idx + 1), 1500); };
    const stop = () => { clearInterval(timer); timer = null; };

    cards.forEach((c, i) => {
      c.classList.add('in');                         // ensure revealed so it shows when active
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'מעבר לכרטיס ' + (i + 1));
      b.addEventListener('click', () => { stop(); show(i); start(); });
      dots.appendChild(b);
    });
    grid.insertAdjacentElement('afterend', dots);

    const sync = () => {
      if (isMobile()) { grid.classList.add('ms-slider'); show(idx); start(); }
      else { grid.classList.remove('ms-slider'); stop(); cards.forEach((c) => c.classList.remove('ms-active')); }
    };
    sync();
    window.addEventListener('resize', sync);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  });

  /* --- Footer year --- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- Accessibility widget (fixed bottom-left, persists across pages) --- */
  (function a11yWidget() {
    const KEY = 'kdigum_a11y_v1';
    const TOGGLES = ['contrast', 'grayscale', 'invert', 'links', 'readable', 'bigcursor', 'stopmotion'];
    const state = { font: 0 };
    TOGGLES.forEach((t) => (state[t] = false));
    try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

    const ICON = {
      fab: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>',
      contrast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
      grayscale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10z"/></svg>',
      invert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/></svg>',
      links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9.5 14.5l5-5"/><path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1 1"/><path d="M13 17l-1 1a3.5 3.5 0 0 1-5-5l1-1"/></svg>',
      readable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/></svg>',
      bigcursor: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3l13 6-5.5 1.7L15 18l-2.5 1-2.4-7L5 16z"/></svg>',
      stopmotion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none"/></svg>'
    };

    const opt = (k, label) =>
      '<button type="button" class="a11y-opt" data-a11y="' + k + '" aria-pressed="false">' + ICON[k] + '<span>' + label + '</span></button>';

    const widget = document.createElement('div');
    widget.className = 'a11y-widget';
    widget.dir = 'rtl';
    widget.innerHTML =
      '<button type="button" class="a11y-fab" aria-haspopup="dialog" aria-expanded="false" aria-controls="a11yPanel" aria-label="פתיחת תפריט נגישות">' + ICON.fab + '</button>' +
      '<div class="a11y-panel" id="a11yPanel" role="dialog" aria-label="אפשרויות נגישות" hidden>' +
        '<div class="a11y-head"><h2>' + ICON.fab + 'נגישות</h2><button type="button" class="a11y-close" aria-label="סגירת תפריט נגישות">&times;</button></div>' +
        '<div class="a11y-body">' +
          '<div class="a11y-fontrow"><button type="button" class="a11y-step" data-font="-1" aria-label="הקטנת טקסט">א-</button><span class="lbl">גודל טקסט</span><button type="button" class="a11y-step" data-font="1" aria-label="הגדלת טקסט">א+</button></div>' +
          opt('contrast', 'ניגודיות גבוהה') +
          opt('grayscale', 'גווני אפור') +
          opt('invert', 'היפוך צבעים') +
          opt('links', 'הדגשת קישורים') +
          opt('readable', 'גופן קריא') +
          opt('bigcursor', 'סמן גדול') +
          opt('stopmotion', 'עצירת אנימציות') +
        '</div>' +
        '<div class="a11y-foot"><button type="button" class="a11y-reset">איפוס הגדרות</button><a href="accessibility.html">להצהרת הנגישות</a></div>' +
      '</div>';
    document.documentElement.appendChild(widget);

    const fab = widget.querySelector('.a11y-fab');
    const panel = widget.querySelector('.a11y-panel');
    const closeBtn = widget.querySelector('.a11y-close');

    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

    const apply = () => {
      const html = document.documentElement;
      const body = document.body;
      html.classList.toggle('a11y-links', state.links);
      html.classList.toggle('a11y-readable', state.readable);
      html.classList.toggle('a11y-bigcursor', state.bigcursor);
      html.classList.toggle('a11y-stopmotion', state.stopmotion);

      const f = [];
      if (state.contrast) f.push('contrast(1.35)');
      if (state.grayscale) f.push('grayscale(1)');
      if (state.invert) f.push('invert(1) hue-rotate(180deg)');
      body.style.filter = f.join(' ');

      body.style.zoom = state.font ? (1 + state.font * 0.1).toFixed(2) : '';
      body.style.overflowX = state.font > 0 ? 'auto' : '';

      if (state.stopmotion) document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (e) {} });

      TOGGLES.forEach((t) => {
        const b = widget.querySelector('[data-a11y="' + t + '"]');
        if (b) { b.classList.toggle('active', state[t]); b.setAttribute('aria-pressed', String(state[t])); }
      });
      save();
    };

    const open = () => { panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); };
    const close = () => { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); };

    fab.addEventListener('click', () => { if (panel.hidden) open(); else close(); });
    closeBtn.addEventListener('click', close);

    widget.querySelectorAll('[data-a11y]').forEach((b) => {
      b.addEventListener('click', () => { const k = b.dataset.a11y; state[k] = !state[k]; apply(); });
    });
    widget.querySelectorAll('[data-font]').forEach((b) => {
      b.addEventListener('click', () => {
        state.font = Math.max(-2, Math.min(4, state.font + Number(b.dataset.font)));
        apply();
      });
    });
    widget.querySelector('.a11y-reset').addEventListener('click', () => {
      state.font = 0; TOGGLES.forEach((t) => (state[t] = false)); apply();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); fab.focus(); } });
    document.addEventListener('click', (e) => { if (!panel.hidden && !widget.contains(e.target)) close(); });

    apply();
  })();

  /* --- Knowledge page: filter posts by topic (chips above the grid) --- */
  (function topicFilter() {
    const bar = document.getElementById('topicFilter');
    const grid = document.getElementById('postsGrid');
    if (!bar || !grid) return;

    const chips = Array.from(bar.querySelectorAll('.topic-chip'));
    const cards = Array.from(grid.querySelectorAll('.post-card'));
    const empty = document.getElementById('filterEmpty');
    const topicsOf = (card) => (card.dataset.topics || '').split(/\s+/).filter(Boolean);

    // show a live count on each chip; dim any topic that has no posts yet
    chips.forEach((chip) => {
      const f = chip.dataset.filter;
      const n = f === 'all' ? cards.length : cards.filter((c) => topicsOf(c).includes(f)).length;
      const count = document.createElement('span');
      count.className = 'tc-count';
      count.textContent = '(' + n + ')';
      chip.appendChild(count);
      if (n === 0 && f !== 'all') chip.classList.add('is-empty');
    });

    const apply = (filter) => {
      let shown = 0;
      cards.forEach((card) => {
        const match = filter === 'all' || topicsOf(card).includes(filter);
        card.classList.toggle('is-hidden', !match);
        if (match) { card.classList.add('in'); shown++; } // force-reveal matches below the fold
      });
      chips.forEach((chip) => {
        const on = chip.dataset.filter === filter;
        chip.classList.toggle('active', on);
        chip.setAttribute('aria-pressed', String(on));
      });
      if (empty) empty.classList.toggle('show', shown === 0);
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        if (chip.classList.contains('is-empty')) return;
        const f = chip.dataset.filter;
        apply(f);
        history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      });
    });

    // honour a #topic in the URL on load (e.g. knowledge.html#water)
    const initial = (location.hash || '').replace('#', '');
    const startChip = chips.find((c) => c.dataset.filter === initial && !c.classList.contains('is-empty'));
    if (startChip) apply(initial);
  })();

  /* Process-flow connectors are now plain CSS chevron arrows (one identical arrow
     between every step, including the two decision lanes) - no JS drawing needed. */
})();
