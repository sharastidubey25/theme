/* =========================================================
   FixPapa · Set 3 — Editorial dark · interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap;

  /* ---------------- Header + search ---------------- */
  const hd = $('#hd');
  const onScroll = () => hd.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const ov = $('#searchOv');
  const openS = () => { ov.classList.add('open'); setTimeout(() => $('input', ov).focus(), 150); };
  const closeS = () => ov.classList.remove('open');
  $('#openSearch').onclick = openS; $('#closeSearch').onclick = closeS;
  ov.addEventListener('click', (e) => { if (e.target === ov) closeS(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeS(); if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openS(); } });

  /* ---------------- Services: sticky list ---------------- */
  const items = $$('#svList li'), descs = $$('#svDesc > div'), figs = $$('#svMedia figure');
  let active = 0;
  function setActive(i) {
    if (i === active) return;
    figs.forEach(f => f.classList.remove('was'));
    figs[active].classList.add('was');
    [items, descs, figs].forEach(list => list.forEach((el, k) => el.classList.toggle('on', k === i)));
    active = i;
  }
  const sticky = () => innerWidth > 1024;
  items.forEach((li, i) => li.addEventListener('click', () => {
    if (sticky()) {
      const sec = $('#services'), top = sec.getBoundingClientRect().top + scrollY;
      const span = sec.offsetHeight - innerHeight;
      scrollTo({ top: top + span * ((i + .5) / items.length), behavior: 'smooth' });
    } else setActive(i);
  }));
  // on small screens the list rotates on its own
  setInterval(() => { if (!sticky() && !reduce) setActive((active + 1) % items.length); }, 4000);

  /* ---------------- Rental carousel ---------------- */
  const track = $('#crTrack'), bar = $('#crBar');
  const cardW = () => track.firstElementChild.getBoundingClientRect().width + 14;
  $('#crNext').onclick = () => track.scrollBy({ left: cardW(), behavior: 'smooth' });
  $('#crPrev').onclick = () => track.scrollBy({ left: -cardW(), behavior: 'smooth' });
  const syncBar = () => {
    const max = track.scrollWidth - track.clientWidth, ratio = track.clientWidth / track.scrollWidth;
    bar.style.width = (ratio * 100) + '%';
    bar.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * ((1 - ratio) / ratio) * 100 : 0}%)`;
  };
  track.addEventListener('scroll', syncBar, { passive: true }); addEventListener('resize', syncBar); syncBar();
  let down = false, sx = 0, sl = 0, moved = false;
  track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('drag'); });
  addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; track.classList.remove('drag'); });
  track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);

  /* ---------------- Brands + map ---------------- */
  $('#brandGrid').innerHTML = ['HP', 'Dell', 'Brother', 'TP-Link', 'CP Plus', 'Microtek', 'Geonix', 'HCL', 'Luminous', 'Zebronics', 'Otek'].map(b => `<a href="#" class="brand">${b}</a>`).join('') + '<a href="#" class="brand">+ More</a>';
  (function map() {
    const svg = $('#indiaMap'); if (!svg) return;
    const poly = [[68.2,23.7],[68.8,22.3],[70.0,20.8],[72.6,21.1],[72.8,19.0],[73.7,15.7],[74.8,12.9],[76.3,9.9],[77.5,8.1],[78.2,8.9],[79.3,10.3],[79.9,12.0],[80.3,13.1],[80.1,15.5],[82.3,16.6],[83.3,17.7],[85.1,19.3],[86.7,20.3],[87.5,21.6],[88.9,21.6],[88.8,22.9],[88.6,24.2],[88.1,24.8],[88.4,26.3],[89.8,26.3],[89.9,25.3],[92.2,25.0],[92.3,24.0],[91.4,24.1],[91.2,23.2],[92.0,23.6],[92.6,21.9],[93.3,22.8],[94.2,23.9],[94.7,25.5],[95.3,26.7],[96.7,27.3],[97.3,28.2],[96.2,29.3],[94.6,29.3],[92.5,27.8],[91.9,26.9],[89.8,26.8],[89.0,27.2],[88.9,27.9],[88.1,27.9],[88.0,26.6],[86.0,26.5],[84.1,27.4],[83.3,27.3],[81.6,28.0],[80.1,28.8],[80.2,29.9],[79.0,31.0],[78.5,32.5],[79.5,32.7],[79.3,34.0],[78.0,35.5],[77.0,35.6],[74.5,35.0],[73.8,34.5],[74.2,33.0],[74.5,32.0],[74.6,31.0],[73.9,30.0],[73.3,29.0],[72.0,28.0],[70.4,27.8],[69.5,26.7],[70.3,25.7],[70.9,24.3],[69.0,24.2]];
    const X = lon => (lon - 68) * 13 + 8, Y = lat => (37.5 - lat) * 13;
    const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
    let dots = '';
    for (let lat = 37; lat > 6; lat -= .9) for (let lon = 68; lon < 98; lon += .9) if (inside(lon, lat)) dots += `<circle class="md" cx="${X(lon).toFixed(1)}" cy="${Y(lat).toFixed(1)}" r="4"/>`;
    const cities = [[75.8, 26.9, 1], [77.2, 28.6], [72.9, 19.1], [77.6, 13.0], [88.4, 22.6], [78.5, 17.4], [91.7, 26.1]];
    const pins = cities.map(([lo, la, hq], i) => `${hq ? `<circle class="ring" cx="${X(lo)}" cy="${Y(la)}" r="8"/>` : ''}<circle class="pin${hq ? ' o' : ''}" cx="${X(lo)}" cy="${Y(la)}" r="${hq ? 10 : 7}"/>`).join('');
    svg.innerHTML = `<g>${dots}</g><g>${pins}</g>`;
  })();

  /* ---------------- Refurbished products ---------------- */
  const MINI = `<svg viewBox="0 0 120 120"><path d="M30 26l46-12 16 8v76l-46 12-16-8z" fill="#1B1C22"/><path d="M30 26l16 8v76l-16-8z" fill="#3B3D45"/><path d="M46 34l46-12" stroke="#52545E"/><g fill="#6B6D77"><circle cx="35" cy="42" r="1.5"/><circle cx="40" cy="45" r="1.5"/><circle cx="35" cy="49" r="1.5"/><circle cx="40" cy="52" r="1.5"/><circle cx="35" cy="56" r="1.5"/><circle cx="40" cy="59" r="1.5"/></g><path d="M33 80l8 4v4l-8-4z" fill="#FF5A1F"/><circle cx="38" cy="32" r="2.4" fill="#19C39C"/></svg>`;
  const PRODUCTS = [
    ['(Refurbished )Tiny HP Core i5-10500T 10th Gen ,8 GB DDR4 .256 GB SSD.400 G6 Tiny Desktop', 86, '₹1,88,000.00', '₹27,055.00'],
    ['(Refurbished) Tiny Lenovo Think centre M720q Tiny - Core i7 9th Gen 8 GB DDR4 256 GB SSD', 55, '₹70,000.00', '₹31,720.00'],
    ['(Refurbished) Tiny Lenovo Think…', 75, '₹1,00,000.00', '₹24,909.00'],
    ['Refurbished Lenovo Thinkcentre M700 Tiny- Core i5 6th Gen ,8 GB DDR4 .256 GB SSD', 76, '₹48,000.00', '₹11,724.00'],
  ];
  $('#shGrid').innerHTML = PRODUCTS.map(([n, off, mrp, price]) => `
    <article class="pr">
      <div class="pr-media"><span class="pr-off">${off}% Off</span>${MINI}<button class="pr-add">Add to Cart</button></div>
      <h3 title="${n}">${n}</h3>
      <div class="pr-row"><b>${price}</b><s>${mrp}</s></div>
    </article>`).join('');
  $('#shGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.pr-add'); if (!b) return;
    b.classList.add('added'); b.textContent = 'Added ✓';
    setTimeout(() => { b.classList.remove('added'); b.textContent = 'Add to Cart'; }, 1500);
  });

  /* ---------------- FAQ: one open at a time ---------------- */
  $$('#fqList details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('#fqList details').forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------------- Footer (kept from previous Set 3) ---------------- */
  const fw = $('#ftrWord'); if (fw) fw.innerHTML = fw.textContent.split('').map(c => `<span>${c}</span>`).join('');
  const tabLinks = $$('.tabbar a'), secMap = { top: 0, services: 1, shop: 3 };
  const io = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) tabLinks.forEach((l, i) => l.classList.toggle('on', i === secMap[en.target.id])); }), { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(secMap).forEach(id => $('#' + id) && io.observe($('#' + id)));

  /* ================= GSAP ================= */
  if (!G) { $$('[data-rv]').forEach(el => el.style.opacity = 1); return; }
  G.registerPlugin(ScrollTrigger);


  /* ---------- Preloader: a FixPapa technician pushes the page open,
     photo cards cascade in and the last one becomes the hero ---------- */
  function runPreloader(done) {
    const pl = $('#pl');
    const finish = () => { document.body.classList.remove('is-loading'); if (pl) pl.remove(); ScrollTrigger.refresh(); done(); };
    if (!pl || reduce) return finish();
    const white = $('#plWhite'), guy = $('#plGuy'), curtain = $('#plCurtain'), pct = $('#plPct');
    const cards = $$('#plCards figure'), heroCard = cards[cards.length - 1], others = cards.slice(0, -1);
    const vw = innerWidth, vh = innerHeight, n = cards.length;
    cards.forEach((c, i) => {
      const k = i - (n - 1) / 2;
      G.set(c, { xPercent: -50, yPercent: -50, x: -k * vw * (vw < 700 ? .035 : .075), y: k * vh * (vw < 700 ? .075 : .1), rotationY: -28, rotationX: 18, rotationZ: -6, zIndex: i });
    });
    const push = { p: 0 }, exit = { p: 0 };
    const placeGuy = (x) => { guy.style.transform = `translate(calc(${x.toFixed(1)}px - 96%), -40%)`; };
    const tl = G.timeline({ onComplete: () => G.to(pl, { opacity: 0, duration: .35, onComplete: finish }) });
    tl.to(push, { p: 1, duration: 2.6, ease: 'power1.inOut', delay: .4, onUpdate: () => {
        white.style.clipPath = `inset(0 ${(100 - push.p * 100).toFixed(2)}% 0 0)`;
        placeGuy(push.p * vw); pct.textContent = Math.round(push.p * 100) + '%';
      } })
      .to(exit, { p: 1, duration: .7, ease: 'power1.in', onUpdate: () => placeGuy(vw + exit.p * 320) })
      .to({}, { duration: .35 })
      // page curtain drops from the top while the cards fall in on a diagonal
      .fromTo(curtain, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut' }, 'drop')
      .fromTo(cards, { opacity: 1, y: (i) => (i - (n - 1) / 2) * vh * (vw < 700 ? .075 : .1) - vh * 1.3 },
        { y: (i) => (i - (n - 1) / 2) * vh * (vw < 700 ? .075 : .1), duration: 1.2, ease: 'expo.out', stagger: .07 }, 'drop+=.15')
      .to({}, { duration: .25 })
      // stack collapses to the centre…
      .to(cards, { x: 0, y: 0, rotationX: 0, rotationY: 0, rotationZ: 0, duration: .9, ease: 'expo.inOut', stagger: .03 }, 'merge')
      // …and the team photo grows into the full-bleed hero
      .to(others, { opacity: 0, duration: .3 }, 'grow')
      .to(heroCard, { scale: () => Math.max(vw / heroCard.offsetWidth, vh / heroCard.offsetHeight) * 1.02, borderRadius: 0, duration: 1, ease: 'expo.inOut' }, 'grow')
      .to(heroCard, { '--v': 1, duration: .8 }, 'grow+=.2')
      .to('.pl-meta', { opacity: 0, duration: .3 }, 'grow');
    pl.addEventListener('click', () => tl.timeScale(6));
    addEventListener('keydown', () => tl.timeScale(6), { once: true });
  }

  /* ---------- Hero: full-bleed photo zooms out into a mosaic ---------- */
  const grid = $('#moGrid'), center = $('.t-c'), copy = $('#moCopy');
  const coverScale = () => { const r = center.getBoundingClientRect(), s = G.getProperty(grid, 'scale') || 1; return Math.max(innerWidth / (r.width / s), innerHeight / (r.height / s)) * 1.01; };
  G.set(grid, { xPercent: -50, yPercent: -50, scale: coverScale() });
  if (!reduce) {
    G.set(copy.children, { y: 30, opacity: 0 });
    runPreloader(() => G.to(copy.children, { y: 0, opacity: 1, duration: 1.2, stagger: .12, ease: 'expo.out' }));
    G.timeline({ scrollTrigger: { trigger: '#top', start: 'top top', end: '+=130%', scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true } })
      .fromTo(grid, { scale: coverScale }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .to(copy, { opacity: 0, y: -40, ease: 'power1.in', duration: .45 }, 0)
      .to(center, { '--veil': 0, duration: .6 }, .2)
      .fromTo('.t:not(.t-c) img', { scale: 1.3 }, { scale: 1, ease: 'power2.out', duration: 1 }, 0);
  } else { G.set(grid, { scale: 1 }); runPreloader(() => {}); }

  /* ---------- Services: progress drives the active item ---------- */
  ScrollTrigger.matchMedia({
    '(min-width: 1025px)': () => {
      ScrollTrigger.create({ trigger: '#services', start: 'top top', end: 'bottom bottom', onUpdate: (st) => setActive(Math.min(items.length - 1, Math.floor(st.progress * items.length))) });
    }
  });

  /* ---------- Reveals ---------- */
  $$('[data-rv]').forEach(el => G.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  $$('[data-rv-stagger]').forEach(el => G.fromTo(el.querySelectorAll(':scope > .wrap > *, :scope > *:not(.wrap)'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .1, clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  $$('.cr-card').forEach((c, i) => G.from(c, { x: 80, opacity: 0, duration: 1.2, ease: 'expo.out', delay: i * .08, scrollTrigger: { trigger: '#crTrack', start: 'top 85%', once: true } }));
  $$('.ol-card > img').forEach(img => G.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.ol-card .ui').forEach(u => G.from(u, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: u, start: 'top 90%', once: true } }));

  /* ---------- Count-ups ---------- */
  $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => { const end = +el.dataset.count, o = { v: 0 }; G.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v) }); } }));

  /* ---------- Footer word rises in ---------- */
  G.fromTo('.ftr-word', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
