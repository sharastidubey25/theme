/* FixPapa · Set 5 · Book a Repair page — header, theme, reveal, lazy video, booking modal */
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
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }));

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

  /* booking modal · step 1 (category) */
  const modal = $('#bookModal'), next = $('#rpmNext'), cats = $$('.rpm-cat', modal);
  let lastFocus;
  const open = () => { lastFocus = document.activeElement; modal.hidden = false; document.body.style.overflow = 'hidden'; (cats.find(c => c.getAttribute('aria-checked') === 'true') || cats[0]).focus(); };
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  $$('[data-open-booking]').forEach(b => b.addEventListener('click', open));
  $$('[data-close]', modal).forEach(b => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  cats.forEach(c => c.addEventListener('click', () => { cats.forEach(x => x.setAttribute('aria-checked', x === c)); next.disabled = false; }));
  next.addEventListener('click', () => { /* step 2 (brand) comes next */ });
  // ?device=Laptop%20Repair (from the home page device tiles) pre-selects that category
  const want = new URLSearchParams(location.search).get('device');
  const pre = want && cats.find(c => c.textContent.trim() === want);
  if (pre) { pre.setAttribute('aria-checked', 'true'); next.disabled = false; }
  if (location.hash === '#book-now') open();
})();
