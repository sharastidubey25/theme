/* =========================================================
   FixPapa · header mega menu (Services · Shop · For Business), shared by every page
   Hover (mouse) or click a .nav-dd trigger to open its .mm panel; the categories on the
   left switch which cards show on the right. Esc, outside click or scrolling closes it.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const dds = $$('.nav-dd'), scrim = $('#mmScrim');
  if (!dds.length) return;

  let openDd = null, closeT = 0;
  const panelOf = (b) => document.getElementById(b.getAttribute('aria-controls'));
  const close = () => {
    if (!openDd) return;
    openDd.setAttribute('aria-expanded', 'false'); panelOf(openDd).classList.remove('open');
    scrim && scrim.classList.remove('show'); openDd = null;
  };
  const open = (b) => {
    clearTimeout(closeT);
    if (openDd === b) return;
    close(); openDd = b;
    b.setAttribute('aria-expanded', 'true'); panelOf(b).classList.add('open');
    scrim && scrim.classList.add('show');
  };
  const later = () => { clearTimeout(closeT); closeT = setTimeout(close, 180); };
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  dds.forEach((b) => {
    const p = panelOf(b);
    b.addEventListener('click', () => (openDd === b ? close() : open(b)));
    b.addEventListener('mouseenter', () => { if (fine.matches) { clearTimeout(closeT); closeT = setTimeout(() => open(b), openDd ? 0 : 90); } });
    b.addEventListener('mouseleave', () => { if (fine.matches) later(); });
    p.addEventListener('mouseenter', () => clearTimeout(closeT));
    p.addEventListener('mouseleave', () => { if (fine.matches) later(); });
    // categories: hover, focus or click shows that category's cards; arrow keys move between them
    const tabs = $$('.mm-cat', p);
    const pick = (t) => tabs.forEach((x) => {
      const on = x === t, pane = document.getElementById(x.getAttribute('aria-controls'));
      x.classList.toggle('on', on); x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      pane.classList.toggle('on', on); pane.hidden = !on;
    });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('focus', () => pick(t));
      t.addEventListener('mouseenter', () => { if (fine.matches) pick(t); });
      t.addEventListener('keydown', (e) => {
        const d = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (!d) return;
        e.preventDefault(); tabs[(i + d + tabs.length) % tabs.length].focus();
      });
    });
    $$('a', p).forEach((a) => a.addEventListener('click', close));
  });
  scrim && scrim.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openDd) { const b = openDd; close(); b.focus(); } });
  document.addEventListener('click', (e) => { if (openDd && !e.target.closest('.nav-dd,.mm')) close(); });
  addEventListener('scroll', () => { if (openDd && scrollY > 40) close(); }, { passive: true });
})();
