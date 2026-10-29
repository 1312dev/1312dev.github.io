(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');

  /* ---------- Language ---------- */
  const I18N = window.I18N || { en: {}, uk: {} };
  const LANGS = ['en', 'uk'];
  let lang = 'en';
  const t = key => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || '';

  const store = {
    get() { try { return localStorage.getItem('lang'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('lang', v); } catch (e) { /* private mode */ } }
  };

  const applyLang = next => {
    lang = LANGS.includes(next) ? next : 'en';
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = I18N[lang][el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':');
        const value = I18N[lang][key];
        if (value !== undefined) el.setAttribute(attr, value);
      });
    });
    document.title = t('meta.title');
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.desc'));
    document.querySelectorAll('.lang-btn').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    menuBtn.setAttribute('aria-label', t(header.classList.contains('menu-open') ? 'menu.close' : 'menu.open'));
    const url = new URL(window.location.href);
    if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  };

  document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => {
    store.set(b.dataset.lang);
    applyLang(b.dataset.lang);
  }));
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  const initial = fromUrl || store.get() || 'en';
  if (initial !== 'en') applyLang(initial);

  /* ---------- Mobile menu ---------- */
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', t(open ? 'menu.close' : 'menu.open'));
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', e => { if (!header.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Current section in the nav + reveal on scroll ---------- */
  const links = [...nav.querySelectorAll('a')];
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => navObserver.observe(s));

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); revealObserver.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Section titles docked under the header ---------- */
  const titles = [...document.querySelectorAll('.sticky-title')];
  let stickTops = [];
  const measure = () => { stickTops = titles.map(el => parseFloat(getComputedStyle(el).top) || 0); };
  let ticking = false;
  const updateStuck = () => {
    ticking = false;
    titles.forEach((el, i) => el.classList.toggle('is-stuck', el.getBoundingClientRect().top <= stickTops[i] + 0.5));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateStuck); } };
  measure(); updateStuck();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });

  /* ---------- Before / after slider ---------- */
  const compare = document.querySelector('.compare');
  if (compare) {
    const stage = compare.querySelector('.compare-stage');
    const handle = compare.querySelector('.compare-line');
    let pos = 50;
    let touched = false;
    let drag = null;

    const setPos = p => {
      pos = Math.min(100, Math.max(0, p));
      stage.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    };
    const fromEvent = e => {
      const r = stage.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };
    const touch = () => { if (!touched) { touched = true; compare.classList.add('is-touched'); } };

    stage.addEventListener('pointerdown', e => {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: e.pointerType === 'mouse' };
      if (drag.active) { touch(); stage.setPointerCapture(e.pointerId); setPos(fromEvent(e)); e.preventDefault(); }
    });
    stage.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.active) {
        // On touch screens start dragging only after a clearly horizontal move, so the page still scrolls
        const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
        if (dx > 6 && dx > dy) { drag.active = true; touch(); stage.setPointerCapture(e.pointerId); } else return;
      }
      setPos(fromEvent(e));
    });
    const end = () => { drag = null; };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);

    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 10 : 5;
      const keys = { ArrowLeft: pos - step, ArrowDown: pos - step, ArrowRight: pos + step, ArrowUp: pos + step, Home: 0, End: 100 };
      if (e.key in keys) { e.preventDefault(); touch(); setPos(keys[e.key]); }
    });

    // "Swipe me": rock the handle a little until the visitor touches it
    if (!reduceMotion) {
      let visible = false;
      let start = null;
      const loop = now => {
        if (touched || !visible) { start = null; return; }
        if (start === null) start = now;
        const cycle = 3800, move = 2200;
        const tt = (now - start) % cycle;
        setPos(tt < move ? 50 + 12 * Math.sin((tt / move) * Math.PI * 2) : 50);
        requestAnimationFrame(loop);
      };
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible && !touched) requestAnimationFrame(loop);
      }, { threshold: 0.4 }).observe(stage);
    }
  }

  /* ---------- Lightbox for project examples ---------- */
  const lb = document.querySelector('.lightbox');
  const lbImg = lb.querySelector('.lb-img');
  const lbCaption = lb.querySelector('.lb-caption');
  const items = [...document.querySelectorAll('[data-lb]')];
  let index = 0;

  const show = i => {
    index = (i + items.length) % items.length;
    const el = items[index];
    lbImg.src = el.dataset.src;
    lbImg.alt = el.dataset.caption;
    lbCaption.textContent = el.dataset.caption;
    const next = items[(index + 1) % items.length];
    if (next) { const pre = new Image(); pre.src = next.dataset.src; }
  };
  const open = i => {
    show(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  };
  const close = () => { lb.close ? lb.close() : lb.removeAttribute('open'); };
  lb.addEventListener('close', () => { document.body.style.overflow = ''; });

  items.forEach((el, i) => el.addEventListener('click', () => open(i)));
  lb.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
