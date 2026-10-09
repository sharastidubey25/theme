/* =========================================================
   FixPapa — Premium UI interactions
   GSAP + ScrollTrigger (+ optional Lenis smooth scroll)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const svgNS = 'http://www.w3.org/2000/svg';

  /* ---------------- Data (existing site content) ---------------- */
  const refurbished = [
    { name: '(Refurbished )Tiny HP Core i5-10500T 10th Gen ,8 GB DDR4 .256 GB SSD.400 G6 Tiny Desktop', off: 86, mrp: '₹1,88,000.00', price: '₹27,055.00', art: 'p-mini' },
    { name: '(Refurbished) Tiny Lenovo Think centre M720q Tiny - Core i7 9th Gen 8 GB DDR4 256 GB SSD', off: 55, mrp: '₹70,000.00', price: '₹31,720.00', art: 'p-mini' },
    { name: '(Refurbished) Tiny Lenovo Think…', off: 75, mrp: '₹1,00,000.00', price: '₹24,909.00', art: 'p-mini' },
    { name: 'Refurbished Lenovo Thinkcentre M700 Tiny- Core i5 6th Gen ,8 GB DDR4 .256 GB SSD', off: 76, mrp: '₹48,000.00', price: '₹11,724.00', art: 'p-mini' },
  ];
  const newProducts = [
    { name: 'EXIDE UPS Battery 12v/9AH', off: 33, mrp: '₹2,500.00', price: '₹1,681.00', art: 'p-batt' },
    { name: 'Intex UPS 600VA PROTECTOR 725', off: 29, mrp: '₹3,499.00', price: '₹2,470.00', art: 'p-ups' },
    { name: 'Intex UPS 1000VA Gamma 1000', off: 2, mrp: '₹6,999.00', price: '₹6,872.00', art: 'p-ups' },
    { name: 'HIKVISION UPS 600VA (DS-UPS600)', off: 0, mrp: '', price: '₹2,798.00', art: 'p-ups' },
    { name: 'Microtek 650VA LEGEND 750M UPS (2+2 Warranty)', off: 21, mrp: '₹2,999.00', price: '₹2,365.00', art: 'p-ups' },
    { name: 'Microtek 650VA LEGEND 650 UPS', off: 23, mrp: '₹3,090.00', price: '₹2,381.00', art: 'p-ups' },
    { name: 'Microtek 1600VA LEGEND 1600 …', off: 5, mrp: '₹9,490.00', price: '₹8,993.00', art: 'p-ups' },
    { name: 'Microtek 1000VA LEGEND 1000 UPS', off: 2, mrp: '₹5,790.00', price: '₹5,677.00', art: 'p-ups' },
  ];
  const brands = ['HP', 'Dell', 'Brother', 'TP-Link', 'CP Plus', 'Microtek', 'Geonix', 'HCL', 'Luminous', 'Zebronics', 'Otek'];
  const brandStyle = {
    HP: 'color:#0096D6;font-style:italic;font-size:1.25em', Dell: 'color:#007DB8;letter-spacing:.06em',
    Brother: 'color:#0D2D8A', 'TP-Link': 'color:#4ACBD6', 'CP Plus': 'color:#E11D2A', Microtek: 'color:#C8102E;font-style:italic',
    Geonix: 'color:#1E3A8A', HCL: 'color:#0B1220;font-style:italic;letter-spacing:.12em', Luminous: 'color:#1E40AF',
    Zebronics: 'color:#111827;font-family:Georgia,serif;font-weight:600', Otek: 'color:#111827'
  };
  const heroSlides = ['AMC & Inventory Management', 'Book a Repair', 'Technical Support · Starting at ₹5/min', 'Why to Buy when you can have easy Rental?', 'Refurbished · New Products'];

  /* ---------------- Render: products ---------------- */
  const productCard = (p) => `
    <article class="card product">
      <div class="media">
        ${p.off ? `<span class="off">${p.off}% Off</span>` : ''}
        <button class="wish" aria-label="Add to wishlist"><svg width="16" height="16"><use href="#i-heart"/></svg></button>
        <svg viewBox="0 0 120 120"><use href="#${p.art}"/></svg>
      </div>
      <div class="body">
        <h3 title="${p.name}">${p.name}</h3>
        <div class="price-row">
          <div>${p.mrp ? `<div class="mrp">${p.mrp}</div>` : ''}<div class="price">${p.price}</div></div>
          <div class="rating"><svg width="15" height="15"><use href="#i-star"/></svg>4.00</div>
        </div>
        <button class="add"><svg width="16" height="16"><use href="#i-cart"/></svg>Add to Cart</button>
      </div>
    </article>`;
  $('#refurbGrid').innerHTML = refurbished.map(productCard).join('');
  $('#newGrid').innerHTML = newProducts.map(productCard).join('');
  $$('.wish').forEach(b => b.addEventListener('click', () => { b.style.color = b.style.color ? '' : '#E11D48'; }));

  /* ---------------- Render: brands ---------------- */
  const chip = (b) => `<a href="#" class="brand-chip"><span style="${brandStyle[b] || ''}">${b}</span></a>`;
  $('#warrantyGrid').innerHTML = brands.map(chip).join('') + '<a href="#" class="brand-chip more">View More</a>';

  /* ---------------- India dot-matrix map ---------------- */
  (function buildMap() {
    const svg = $('#indiaMap'); if (!svg) return;
    const poly = [[68.2,23.7],[68.8,22.3],[70.0,20.8],[72.6,21.1],[72.8,19.0],[73.7,15.7],[74.8,12.9],[76.3,9.9],[77.5,8.1],[78.2,8.9],[79.3,10.3],[79.9,12.0],[80.3,13.1],[80.1,15.5],[82.3,16.6],[83.3,17.7],[85.1,19.3],[86.7,20.3],[87.5,21.6],[88.9,21.6],[88.8,22.9],[88.6,24.2],[88.1,24.8],[88.4,26.3],[89.8,26.3],[89.9,25.3],[92.2,25.0],[92.3,24.0],[91.4,24.1],[91.2,23.2],[92.0,23.6],[92.6,21.9],[93.3,22.8],[94.2,23.9],[94.7,25.5],[95.3,26.7],[96.7,27.3],[97.3,28.2],[96.2,29.3],[94.6,29.3],[92.5,27.8],[91.9,26.9],[89.8,26.8],[89.0,27.2],[88.9,27.9],[88.1,27.9],[88.0,26.6],[86.0,26.5],[84.1,27.4],[83.3,27.3],[81.6,28.0],[80.1,28.8],[80.2,29.9],[79.0,31.0],[78.5,32.5],[79.5,32.7],[79.3,34.0],[78.0,35.5],[77.0,35.6],[74.5,35.0],[73.8,34.5],[74.2,33.0],[74.5,32.0],[74.6,31.0],[73.9,30.0],[73.3,29.0],[72.0,28.0],[70.4,27.8],[69.5,26.7],[70.3,25.7],[70.9,24.3],[69.0,24.2]];
    const X = lon => (lon - 68) * 13 + 8, Y = lat => (37.5 - lat) * 13;
    const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
    let dots = '';
    for (let lat = 37; lat > 6; lat -= .5) for (let lon = 68; lon < 98; lon += .5) if (inside(lon, lat)) dots += `<circle class="md" cx="${X(lon).toFixed(1)}" cy="${Y(lat).toFixed(1)}" r="2.3"/>`;
    const cities = [[75.8,26.9,1],[77.2,28.6],[72.9,19.1],[77.6,13.0],[80.3,13.1],[88.4,22.6],[78.5,17.4],[72.6,23.0],[73.9,18.5],[80.9,26.8],[91.7,26.1],[77.4,23.3],[76.8,30.7],[76.3,10.0],[85.3,23.4],[81.6,21.3]];
    const [hx, hy] = [X(75.8), Y(26.9)];
    let links = '', pins = '';
    cities.forEach(([lon, lat, hq], i) => {
      const x = X(lon), y = Y(lat);
      if (!hq) { const mx = (hx + x) / 2, my = (hy + y) / 2 - 30; links += `<path class="link" d="M${hx} ${hy} Q${mx} ${my} ${x} ${y}"/>`; }
      pins += `<circle class="pin-ring${hq ? ' o' : ''}" cx="${x}" cy="${y}" r="5" style="animation-delay:${(i * .35).toFixed(2)}s"/><circle class="pin${hq ? ' o' : ''}" cx="${x}" cy="${y}" r="${hq ? 5.5 : 4}"/>`;
    });
    svg.innerHTML = `<g>${dots}</g><g>${links}</g><g>${pins}</g>`;
  })();

  /* ---------------- Hero binary dots ---------------- */
  const bin = $('#h3Binary');
  if (bin && !reduce) for (let i = 0; i < 34; i++) {
    const s = document.createElement('span'); s.textContent = Math.random() < .5 ? '0' : '1';
    if (Math.random() < .25) s.className = 'o';
    s.style.left = (Math.random() * 100) + '%'; s.style.top = (10 + Math.random() * 85) + '%';
    s.style.animationDuration = (5 + Math.random() * 6) + 's'; s.style.animationDelay = (-Math.random() * 10) + 's';
    bin.appendChild(s);
  }
  /* mouse parallax on hero background lights */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const lights = $$('.h3-light, .h3-board');
    $('#hero').addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      lights.forEach((l, i) => l.style.transform = `translate(${nx * (i + 1) * 18}px, ${ny * (i + 1) * 14}px)`);
    });
  }

  /* ---------------- Voice wave ---------------- */
  const wave = $('#wave');
  if (wave) for (let i = 0; i < 36; i++) { const b = document.createElement('i'); b.style.animationDelay = (-Math.random() * 1.2) + 's'; b.style.animationDuration = (.8 + Math.random() * .8) + 's'; wave.appendChild(b); }
  const timer = $('#callTimer');
  if (timer) { let t = 0; setInterval(() => { t++; timer.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }, 1000); }

  /* ---------------- Header, menu, to-top ---------------- */
  const topbar = $('#topbar'), toTop = $('#toTop');
  const onScroll = () => { const y = scrollY; topbar.classList.toggle('scrolled', y > 40); toTop.classList.toggle('show', y > 900); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menu = $('#mobileNav'), mt = $('#menuToggle');
  mt.addEventListener('click', () => menu.classList.toggle('open'));
  $$('a', menu).forEach((a, i) => { a.style.transitionDelay = (i * 40) + 'ms'; a.addEventListener('click', () => menu.classList.remove('open')); });

  /* ---------------- Button ripple ---------------- */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-ripple]'); if (!b) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });

  /* ---------------- Hero slide ticker ---------------- */
  const sTxt = $('#slideTxt'), sBar = $('#slideBar');
  let si = 0;
  const tick = () => {
    if (!hasGsap) return;
    gsap.fromTo(sBar, { width: '0%' }, { width: '100%', duration: 3.6, ease: 'none', onComplete: () => {
      si = (si + 1) % heroSlides.length;
      gsap.to(sTxt, { y: -8, opacity: 0, duration: .25, onComplete: () => { sTxt.textContent = heroSlides[si]; gsap.fromTo(sTxt, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .35 }); tick(); } });
    } });
  };

  /* ================= GSAP ================= */
  if (!hasGsap) { $$('[data-reveal]').forEach(el => el.style.opacity = 1); return; }
  gsap.registerPlugin(ScrollTrigger);

  // Optional Lenis smooth scrolling (loaded lazily, fails silently)
  if (!reduce) {
    const ls = document.createElement('script');
    ls.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
    ls.onload = () => {
      const lenis = new window.Lenis({ lerp: .1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; } const t = $(h); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -90 }); } }));
      toTop.onclick = () => lenis.scrollTo(0);
    };
    document.head.appendChild(ls);
  }
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Hero intro (3D laptop lives in hero3d.js) ---------- */
  const typed = $('#typed');
  const chars = typed.textContent.split('');
  typed.innerHTML = chars.map(c => `<span style="opacity:0">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('[data-hero-in]', { yPercent: 40, y: 20, opacity: 0, duration: 1, stagger: .09 })
    .to($$('span', typed), { opacity: 1, duration: .01, stagger: .055 }, .5)
    .from('#h3Stage', { opacity: 0, duration: 1.6 }, .1)
    .add(tick, 1.2);

  /* ---------- Hero scroll: content fades, background shifts ---------- */
  const heroST = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('#h3Copy', { opacity: 0, y: -80, ease: 'none', scrollTrigger: { ...heroST, end: '70% top' } });
  gsap.to('#h3Bg', { yPercent: 18, ease: 'none', scrollTrigger: heroST });
  gsap.to('.h3-caption', { opacity: 0, ease: 'none', scrollTrigger: { ...heroST, end: '20% top' } });

  /* ---------- Generic reveals ---------- */
  $$('[data-reveal]').forEach(el => {
    const type = el.dataset.reveal;
    const st = { trigger: el, start: 'top 85%', once: true };
    if (type === 'stagger') {
      gsap.set(el, { opacity: 1 });
      gsap.fromTo(el.children, { y: 50, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .9, ease: 'power3.out', stagger: .09, scrollTrigger: st, clearProps: 'transform,opacity' });
    } else {
      const from = type === 'left' ? { x: -60 } : type === 'right' ? { x: 60 } : type === 'scale' ? { scale: .94, y: 40 } : { y: 40 };
      gsap.fromTo(el, { ...from, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: st });
    }
  });

  /* ---------- Parallax elements ---------- */
  $$('[data-parallax]').forEach(el => gsap.to(el, { y: +el.dataset.parallax, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.fromTo('.footer-giant', { yPercent: 25 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- Count-up ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: end, duration: end > 50 ? 2 : 1.4, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') });
  };
  $$('.stats [data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* ---------- AMC dashboard ---------- */
  const line = $('#chartLine'), area = $('#chartArea'), dot = $('#chartDot');
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(area, { opacity: 0 });
  ScrollTrigger.create({
    trigger: '#dash', start: 'top 75%', once: true, onEnter: () => {
      $$('#dash [data-count]').forEach(countUp);
      gsap.to(line, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' });
      gsap.to(area, { opacity: 1, duration: 1.4, delay: .8 });
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: 2, ease: 'power2.inOut', onUpdate: () => { const pt = line.getPointAtLength(o.p * len); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); } });
      $$('#bars i').forEach((b, i) => setTimeout(() => b.style.height = b.dataset.h + '%', i * 90));
      $$('.prog i').forEach((b, i) => setTimeout(() => b.style.width = b.dataset.w + '%', 300 + i * 200));
      const toasts = $$('.toast');
      gsap.to(toasts, { opacity: 1, x: 0, scale: 1, duration: .7, ease: 'back.out(1.6)', stagger: .6, delay: .8 });
      // live-feel: cycle toast highlight + bars jitter
      setInterval(() => {
        $$('#bars i').forEach(b => b.style.height = Math.max(30, Math.min(98, +b.dataset.h + (Math.random() * 24 - 12))) + '%');
        const t = toasts[Math.floor(Math.random() * toasts.length)];
        gsap.fromTo(t, { x: -6 }, { x: 0, duration: .6, ease: 'elastic.out(1,.4)' });
      }, 2600);
    }
  });

  /* ---------- Card tilt (fine pointers) ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    $$('.why, .cat, .promo').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(c, { y: -8, rotateY: x * 6, rotateX: -y * 6, transformPerspective: 900, duration: .5, ease: 'power2.out' });
      });
      c.addEventListener('mouseleave', () => gsap.to(c, { y: 0, rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
