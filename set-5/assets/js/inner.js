/* FixPapa · Set 5 · shared inner-page script — header, theme, reveal, lazy video, filters, rental plans, warranty checker */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* header height → page offset, scrolled state, to-top */
  const topbar = $('#topbar'), toTop = $('#toTop');
  const setH = () => root.style.setProperty('--hdr-h', (topbar.offsetHeight + 20) + 'px');
  setH(); addEventListener('resize', setH);
  const onScroll = () => { topbar.classList.toggle('scrolled', scrollY > 40); toTop.classList.toggle('show', scrollY > 700); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* mobile menu */
  const menu = $('#mobileNav');
  $('#menuToggle').addEventListener('click', () => menu.classList.toggle('open'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

  /* theme toggle (same storage key as the homepage) */
  const tt = $('#themeToggle');
  const apply = (dark) => { if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme; tt.setAttribute('aria-pressed', dark); tt.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); };
  apply(root.dataset.theme === 'dark');
  tt.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 600);
    apply(dark); try { localStorage.setItem('fp-theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  /* ripple */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-ripple]'); if (!b) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });

  /* reveal on scroll + lazy videos */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rv = $$('[data-reveal]');
  const from = { left: 'translateX(-40px)', right: 'translateX(40px)', scale: 'scale(.96)' };
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(el => el.style.opacity = 1);
  else {
    rv.forEach(el => { el.style.opacity = 0; el.style.transform = from[el.dataset.reveal] || 'translateY(40px)'; el.style.transition = 'opacity .9s var(--ease), transform .9s var(--ease)'; });
    const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.style.opacity = 1; en.target.style.transform = 'none'; io.unobserve(en.target); } }), { threshold: .12 });
    rv.forEach(el => io.observe(el));
  }
  const vio = new IntersectionObserver((es) => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduce) v.play().catch(() => {}); } else v.pause();
  }), { threshold: .2 });
  $$('video[data-src]').forEach(v => vio.observe(v));

  /* wishlist hearts */
  $$('.wish').forEach(b => b.addEventListener('click', () => { b.style.color = b.style.color ? '' : '#E11D48'; }));

  /* filter chips: <div data-filter="#grid"> buttons with data-f; items carry data-cat="a b" */
  $$('[data-filter]').forEach(group => {
    const grid = $(group.dataset.filter), items = $$('[data-cat]', grid), empty = $('.ip-empty', grid);
    const btns = $$('button', group);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      const f = b.dataset.f; let shown = 0;
      items.forEach(it => { const on = f === 'all' || it.dataset.cat.split(' ').includes(f); it.hidden = !on; shown += on; });
      if (empty) empty.hidden = shown > 0;
    }));
  });

  /* text search over a grid: <input data-search="#grid">, items carry data-name */
  $$('[data-search]').forEach(inp => {
    const grid = $(inp.dataset.search), items = $$('[data-name]', grid), empty = $('.ip-empty', grid);
    inp.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase(); let shown = 0;
      items.forEach(it => { const on = it.dataset.name.toLowerCase().includes(q); it.hidden = !on; shown += on; });
      if (empty) empty.hidden = shown > 0;
    });
  });

  /* Rental: plan length switches the monthly price shown on each card */
  const plans = $('#rtPlans');
  if (plans) {
    const btns = $$('button', plans), prices = $$('[data-m1]');
    const fmt = (n) => '₹' + n.toLocaleString('en-IN');
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      const k = 'm' + b.dataset.months;
      prices.forEach(p => { p.textContent = fmt(+p.dataset[k]); });
    }));
  }

  /* Open Box: countdown to midnight */
  const cd = $('[data-countdown]');
  if (cd) {
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
      const s = Math.floor((end - now) / 1000);
      cd.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    };
    tick(); setInterval(tick, 1000);
  }

  /* Device Health: brand picker + simulated warranty lookup */
  const dh = $('#dhForm');
  if (dh) {
    const brands = $$('.dh-brand'), name = $('#dhBrandName'), serial = $('#dhSerial'), out = $('#dhResult');
    brands.forEach(b => b.addEventListener('click', () => {
      brands.forEach(x => x.setAttribute('aria-pressed', x === b));
      name.textContent = b.dataset.brand; out.hidden = true;
    }));
    dh.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = serial.value.trim();
      out.hidden = false;
      if (v.length < 6) { out.className = 'dh-result bad'; out.innerHTML = '<b>Check the serial number</b>It should be at least 6 characters — look for “S/N” on the sticker.'; return; }
      out.className = 'dh-result ok';
      out.innerHTML = `<b>${name.textContent} · ${v.toUpperCase()}</b>Warranty lookup sent. A FixPapa expert will confirm your coverage by SMS within a few minutes.`;
    });
  }
})();
