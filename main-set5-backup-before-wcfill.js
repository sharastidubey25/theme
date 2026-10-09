/* =========================================================
   FixPapa — Premium UI interactions
   GSAP + ScrollTrigger (native scrolling)
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
    Geonix: 'color:#9A3412', HCL: 'color:#0B1220;font-style:italic;letter-spacing:.12em', Luminous: 'color:#9A3412',
    Zebronics: 'color:#111827;font-family:Georgia,serif;font-weight:600', Otek: 'color:#111827'
  };
  const brandLogo = { HP: 'hp.svg', Dell: 'dell.svg', Brother: 'brother.svg', 'TP-Link': 'tp-link.svg', 'CP Plus': 'cp-plus.png', Microtek: 'microtek.svg', Geonix: 'geonix.png', HCL: 'hcl.svg', Luminous: 'luminous.png', Zebronics: 'zebronics.png' };
  const logoSrc = (b) => brandLogo[b] ? 'assets/img/brands/' + brandLogo[b] : '';
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
  /* Set 5: each product row is an endless right → left loop (set repeated to fill wide screens, then doubled for a seamless wrap) */
  const productLoop = (el, list) => {
    if (!el) return;
    let set = list; while (set.length < 8) set = set.concat(list);
    const html = set.map(productCard).join('');
    el.innerHTML = `<div class="prod-track" style="--dur:${set.length * 4.5}s">${html}${html.replace(/<article class="card product"/g, '<article class="card product" aria-hidden="true"')}</div>`;
  };
  productLoop($('#refurbGrid'), refurbished);
  productLoop($('#newGrid'), newProducts);
  $$('.wish').forEach(b => b.addEventListener('click', () => { b.style.color = b.style.color ? '' : '#E11D48'; }));

  /* ---------------- Render: brands ---------------- */
  const chip = (b) => `<a href="#" class="brand-chip"><span style="${brandStyle[b] || ''}">${b}</span></a>`;
  /* Warranty checker: brand list on the side, selected brand drives the panel */
  (() => {
    const list = $('#wcList'); if (!list) return;
    const color = (b) => { const c = ((brandStyle[b] || '').match(/color:(#[0-9A-Fa-f]{3,6})/) || [, ''])[1]; return !c || /^#(0B1220|111827)$/i.test(c) ? '#FF8A1F' : c; };
    list.innerHTML = brands.map((b, i) => `<li><button role="tab" aria-selected="${!i}" class="${i ? '' : 'on'}" data-b="${b}">${logoSrc(b) ? `<i class="wc-logo"><img src="${logoSrc(b)}" alt="" loading="lazy"></i>` : `<i style="background:${color(b)}">${b[0]}</i>`}${b}<svg width="14" height="14"><use href="#i-arrow"/></svg></button></li>`).join('');
    const nameEl = $('#wcBrandName'), forEl = $('#wcFor'), state = $('#wcState'), serial = $('#wcSerial');
    const select = (btn) => {
      $$('button', list).forEach(x => { x.classList.toggle('on', x === btn); x.setAttribute('aria-selected', x === btn); });
      const b = btn.dataset.b;
      const src = logoSrc(b), card = $('#wcBrand');
      card.classList.toggle('has-logo', !!src);
      card.querySelector('.wc-brand-img')?.remove();
      if (src) card.insertAdjacentHTML('afterbegin', `<img class="wc-brand-img" src="${src}" alt="${b} logo">`);
      nameEl.textContent = b; nameEl.setAttribute('style', src ? '' : (brandStyle[b] || ''));
      forEl.textContent = 'for ' + b; state.hidden = true; serial.value = '';
      if (window.gsap) gsap.fromTo('#wcBrand', { y: 16, opacity: 0, rotate: -4 }, { y: 0, opacity: 1, rotate: 0, duration: .5, ease: 'back.out(2)' });
    };
    list.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (btn) select(btn); });
    select($('button', list));
    $('#wcFind').addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); $$('li', list).forEach(li => li.hidden = q && !li.textContent.toLowerCase().includes(q)); });
    $('#wcForm').addEventListener('submit', () => {
      if (!serial.value.trim()) return serial.focus();
      state.hidden = false; state.className = 'wc-state loading';
      state.textContent = `Checking ${nameEl.textContent} warranty for ${serial.value.trim()}…`;
    });
  })();
  const mq = $('#marquee'); if (mq) mq.innerHTML = [...brands, ...brands].map(chip).join('');

  /* ---------------- Render: testimonials (video cards) ---------------- */
  const stars = Array.from({ length: 5 }, () => '<svg><use href="#i-star"/></svg>').join('');


  /* ---------------- Keyboard keys (hero laptop) ---------------- */
  const keys = $('#keys');
  if (keys) {
    const cols = 14, rows = 6, gap = 3, kw = (272 - gap * (cols + 1)) / cols, kh = (108 - gap * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (r === 5 && c > 3 && c < 10) { if (c === 4) addKey(24 + gap + c * (kw + gap), 18 + gap + r * (kh + gap), kw * 6 + gap * 5, kh); continue; }
      addKey(24 + gap + c * (kw + gap), 18 + gap + r * (kh + gap), kw, kh, r === 3 && c === 13);
    }
    function addKey(x, y, w, h, accent) {
      const k = document.createElementNS(svgNS, 'rect');
      k.setAttribute('x', x); k.setAttribute('y', y); k.setAttribute('width', w); k.setAttribute('height', h); k.setAttribute('rx', 2.5);
      k.setAttribute('fill', accent ? '#FF8A1F' : '#1E293B'); k.setAttribute('opacity', accent ? 1 : .88);
      keys.appendChild(k);
    }
  }

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

  /* ---------------- Particles ---------------- */
  const pc = $('#particles');
  if (pc && !reduce) for (let i = 0; i < 28; i++) {
    const s = document.createElement('span');
    s.style.left = (10 + Math.random() * 80) + '%'; s.style.top = (30 + Math.random() * 65) + '%';
    s.style.animationDuration = (4 + Math.random() * 5) + 's'; s.style.animationDelay = (-Math.random() * 8) + 's';
    pc.appendChild(s);
  }

  /* ---------------- Voice wave ---------------- */
  const wave = $('#wave');
  if (wave) for (let i = 0; i < 36; i++) { const b = document.createElement('i'); b.style.animationDelay = (-Math.random() * 1.2) + 's'; b.style.animationDuration = (.8 + Math.random() * .8) + 's'; wave.appendChild(b); }
  const timer = $('#callTimer');
  if (timer) { let t = 0; setInterval(() => { t++; timer.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }, 1000); }

  /* ---------------- Header, menu, to-top ---------------- */
  const topbar = $('#topbar'), toTop = $('#toTop');
  const onScroll = () => { const y = scrollY; topbar.classList.toggle('scrolled', y > 40); toTop && toTop.classList.toggle('show', y > 900); };
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
    if (!hasGsap || !sTxt) return;
    gsap.fromTo(sBar, { width: '0%' }, { width: '100%', duration: 3.6, ease: 'none', onComplete: () => {
      si = (si + 1) % heroSlides.length;
      gsap.to(sTxt, { y: -8, opacity: 0, duration: .25, onComplete: () => { sTxt.textContent = heroSlides[si]; gsap.fromTo(sTxt, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: .35 }); tick(); } });
    } });
  };

  /* ---------------- Testimonial slider ---------------- */


  /* ================= GSAP ================= */
  if (!hasGsap) { $$('[data-reveal]').forEach(el => el.style.opacity = 1); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // safety net: whenever the page comes back to the very top, make sure the hero is fully shown
  let topFix;
  addEventListener('scroll', () => {
    clearTimeout(topFix);
    topFix = setTimeout(() => { if (scrollY < 4) { ScrollTrigger.update(); $('#hero').classList.remove('is-dark'); gsap.set('#heroVeil', { opacity: 0 }); } }, 120);
  }, { passive: true });

  // Native scrolling only (a smooth-scroll library fought with the pinned hero in Firefox
  // and could leave a blank screen when scrolling back up).
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h.length < 2) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); } }));
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Hero intro ---------- */
  const typed = $('#typed');
  const chars = typed.textContent.split('');
  typed.innerHTML = chars.map(c => `<span style="opacity:0">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro.from('[data-hero-in]', { yPercent: 40, y: 20, opacity: 0, duration: 1, stagger: .09 })
       .to($$('span', typed), { opacity: 1, duration: .01, stagger: .055 }, .5)
       .from('#heroStage', { opacity: 0, scale: .92, duration: 1.4 }, .2)
       .from('.holo', { opacity: 0, y: 30, stagger: .2, duration: .9 }, .9)
       .add(tick, 1.2);

  /* ---------- Hero exploded → assembled laptop ---------- */
  const parts = ['#pCase', '#pBatt', '#pMobo', '#pSsd', '#pRam', '#pFan', '#pCpu', '#pDeck'].map(s => $(s));
  const exX = { pCase: 20, pBatt: -50, pMobo: 0, pSsd: 150, pRam: 170, pFan: -190, pCpu: -40, pDeck: 40 };
  const exR = { pCase: 0, pBatt: -4, pMobo: 0, pSsd: 8, pRam: -10, pFan: 6, pCpu: -6, pDeck: 0 };

  // wrap each part's content in a .bob group for idle floating
  const bobs = parts.map(p => { const g = document.createElementNS(svgNS, 'g'); g.setAttribute('class', 'bob'); while (p.firstChild) g.appendChild(p.firstChild); p.appendChild(g); return g; });
  const bobAmp = { v: 1 };
  if (!reduce) gsap.ticker.add((t) => bobs.forEach((b, i) => gsap.set(b, { y: Math.sin(t * 1.4 + i * .9) * 7 * bobAmp.v })));

  parts.forEach(p => gsap.set(p, { y: +p.dataset.ex, x: exX[p.id], rotation: exR[p.id], svgOrigin: '300 300' }));
  gsap.set('#laptopWrap', { scale: .62, svgOrigin: '300 330' });
  gsap.set('#pLid', { opacity: 0, y: 60 });

  const buildAssemble = () => gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    .to(bobAmp, { v: 0, duration: 1.6 }, 0)
    .to(parts, { y: 0, x: 0, rotation: 0, duration: 1.4, stagger: .12 }, 0)
    .to('#laptopWrap', { scale: .92, duration: 2 }, 0)
    .to('#floorShadow', { attr: { rx: 250, ry: 30 }, opacity: .2, duration: 2 }, 0)
    .to('#pLid', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, 1.9)
    .to('#screenUI', { opacity: 1, duration: .6 }, 2.4)
    .fromTo('#scanBeam', { attr: { y: 90 }, opacity: 0 }, { attr: { y: 470 }, opacity: .9, duration: 1, ease: 'none' }, 2.3)
    .to('#scanBeam', { opacity: 0, duration: .2 }, 3.2)
    .to('#healthMeter', { width: '100%', duration: 1.2 }, 2.2)
    .add(() => {}, 3.4);
  const healthTxt = $('#healthTxt');

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1025px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#heroPin', start: 'top top', end: '+=120%', scrub: .6, pin: true, pinSpacing: true,
        onUpdate: (st) => {
          const lock = st.progress > .02;
          if (lock !== !!window.__heroLock) { window.__heroLock = lock; window.__heroRestart && window.__heroRestart(); }
          if (lock && window.__heroSlide && window.__heroGo) window.__heroGo(0);
          $('#hero').classList.toggle('is-dark', st.progress > .66);
          if (!window.__heroSlide) healthTxt.textContent = st.progress > .52 ? 'All systems OK' : 'Scanning…';
        }
      }
    });
    tl.add(buildAssemble(), 0)
      .to('#heroVeil', { opacity: 1, duration: 1.2, ease: 'none' }, 3.1)
      .to('#floorShadow', { opacity: .5, duration: 1 }, 3.1)
      .to('.holo', { opacity: 0, y: -24, duration: .5, stagger: .1 }, 3.1)
      .to({}, { duration: .8 });
    return () => { $('#hero').classList.remove('is-dark'); };
  });
  mm.add('(max-width: 1024px)', () => {
    const assemble = buildAssemble().pause();
    gsap.to(assemble, { progress: 1, duration: 3.6, delay: 1, ease: 'power1.inOut', onComplete: () => { if (!window.__heroSlide) healthTxt.textContent = 'All systems OK'; } });
  });

  /* ---------- Mouse parallax in hero ---------- */
  const stage = $('#heroStage');
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    const layers = $$('[data-depth]', stage);
    const setters = layers.map(l => ({ x: gsap.quickTo(l, 'x', { duration: .8, ease: 'power3' }), y: gsap.quickTo(l, 'y', { duration: .8, ease: 'power3' }), d: +l.dataset.depth }));
    const lw = { x: gsap.quickTo('#laptopWrap', 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo('#laptopWrap', 'y', { duration: 1, ease: 'power3' }) };
    $('#hero').addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      setters.forEach(s => { s.x(nx * 22 * s.d); s.y(ny * 22 * s.d); });
      lw.x(nx * -14); lw.y(ny * -10);
    });
  }

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
  

  /* ---------- Count-up ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: end, duration: end > 50 ? 2 : 1.4, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-IN') });
  };
  $$('.stats [data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* ---------- Process timeline ---------- */
  const steps = $$('.step');
  if ($('#timeline')) {
  const vertical = () => innerWidth <= 1024;
  gsap.fromTo('#trackFill', { scaleX: 0, scaleY: 0 }, {
    scaleX: () => vertical() ? 0 : 1, scaleY: () => vertical() ? 1 : 0, ease: 'none',
    scrollTrigger: { trigger: '#timeline', start: 'top 75%', end: 'bottom 55%', scrub: .6, invalidateOnRefresh: true,
      onUpdate: (st) => steps.forEach((s, i) => s.classList.toggle('on', st.progress >= i / (steps.length - 1) - .02)) }
  });
  gsap.fromTo(steps, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .12, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '#timeline', start: 'top 85%', once: true } });
  }

  /* ---------- AMC dashboard ---------- */
  const line = $('#chartLine'), area = $('#chartArea'), dot = $('#chartDot');
  if (line) {
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
  }

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

/* ---------- Background videos: load & play only while on screen ---------- */
(() => {
  const vids = [...document.querySelectorAll('video[data-src]')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // keep the poster frames
  const io = new IntersectionObserver((entries) => entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '200px 0px' });
  vids.forEach(v => io.observe(v));
})();

/* ---------- Book a Repair: interactive repair ticket ---------- */
(() => {
  const t = document.getElementById('ticket'); if (!t) return;
  const img = document.getElementById('tkImg'), steps = [...t.querySelectorAll('#tkSteps li')], bar = document.getElementById('tkSteps');
  const devs = [...t.querySelectorAll('#tkDevs button')], no = document.getElementById('tkNo'), stamp = t.querySelector('.stamp');
  let step = 0, timer, touched = false;
  const setStep = (n) => { step = n; steps.forEach((s, i) => s.classList.toggle('on', i <= n)); bar.style.setProperty('--p', n / (steps.length - 1)); if (n === steps.length - 1) { stamp.classList.remove('hit'); void stamp.offsetWidth; stamp.classList.add('hit'); } };
  const run = () => { clearInterval(timer); setStep(0); timer = setInterval(() => { if (step < steps.length - 1) setStep(step + 1); else if (!touched) nextDevice(); }, 1300); };
  const pick = (b) => {
    devs.forEach(d => { d.classList.toggle('on', d === b); d.setAttribute('aria-selected', d === b); });
    img.classList.add('swap');
    setTimeout(() => { img.src = `assets/media/${b.dataset.img}.jpg`; img.onload = () => img.classList.remove('swap'); }, 250);
    no.textContent = 2000 + Math.floor(Math.random() * 900);
    run();
  };
  const nextDevice = () => pick(devs[(devs.findIndex(d => d.classList.contains('on')) + 1) % devs.length]);
  devs.forEach(b => b.addEventListener('click', () => { touched = true; pick(b); }));
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { if (!timer) run(); } else { clearInterval(timer); timer = null; } }, { threshold: .3 }).observe(t);
})();


/* ---------- Futuristic pointer effects: card spotlight + magnetic buttons ---------- */
(() => {
  if (!matchMedia('(pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest('.card, .wc, .ticket, .rent-tile, .vx'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--sx', (e.clientX - r.left) + 'px'); c.style.setProperty('--sy', (e.clientY - r.top) + 'px');
  }, { passive: true });
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.translate = `${(e.clientX - r.left - r.width / 2) * .15}px ${(e.clientY - r.top - r.height / 2) * .25}px`; });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
})();

/* ---------- AMC video cards: open full video in a lightbox ---------- */
(() => {
  const modal = document.getElementById('vxModal'), vid = document.getElementById('vxVideo'); if (!modal) return;
  const close = () => { modal.classList.remove('open'); vid.pause(); setTimeout(() => { modal.hidden = true; }, 350); };
  document.querySelectorAll('.vx-play').forEach(b => b.addEventListener('click', () => {
    vid.src = b.dataset.video || b.closest('.vx').dataset.video; modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open')); vid.play().catch(() => {});
  }));
  document.getElementById('vxClose').onclick = close;
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
})();

/* ---------- Footer wordmark: split letters for hover lift ---------- */


/* ---------- Footer stage: a FixPapa screw hops in, screws the "I" into the floor,
   takes its place, the lights go down and it looks up (Pixar-style homage) ---------- */
(() => {
  const stage = document.getElementById('ftrStage'); if (!stage || !window.gsap) return;
  const G = gsap, screw = '#fsScrew', body = '#fsBody', head = '#fsHeadG', I = '#fsI';
  const BASE = 240, TOP = BASE - 122, IX = 220;
  const reset = () => {
    G.set(screw, { x: 1080, y: BASE }); G.set(body, { scaleX: 1, scaleY: 1, svgOrigin: '0 0' });
    G.set(head, { rotation: 0, svgOrigin: '0 -100' }); G.set(I, { scaleY: 1, svgOrigin: `${IX} ${BASE}` });
    G.set('#fsShadow', { attr: { cx: 1080 }, opacity: .18 }); G.set('#fsThreadsIn', { y: 0 });
    G.set(['#fsDark', '#fsPool', '#fsCone', '#fsGlow', '#fsSlotGlow'], { opacity: 0 });
    stage.classList.remove('done');
  };
  const hop = (tl, fromY, x, y, dur = .55) => {
    const peak = Math.min(fromY, y) - 95;
    tl.to(body, { scaleY: .7, scaleX: 1.2, duration: .12, ease: 'power2.out' })
      .addLabel('a')
      .to(screw, { x, duration: dur, ease: 'none' }, 'a')
      .to('#fsShadow', { attr: { cx: x }, opacity: y === BASE ? .18 : 0, duration: dur, ease: 'none' }, 'a')
      .to(screw, { y: peak, duration: dur / 2, ease: 'power2.out' }, 'a')
      .to(screw, { y, duration: dur / 2, ease: 'power2.in' }, `a+=${dur / 2}`)
      .to(body, { scaleY: 1.14, scaleX: .88, duration: .16 }, 'a')
      .to(body, { scaleY: 1, scaleX: 1, duration: .14 }, `a+=${dur - .14}`)
      .to(body, { scaleY: .76, scaleX: 1.16, duration: .07, ease: 'power2.out' })
      .to(body, { scaleY: 1, scaleX: 1, duration: .22, ease: 'back.out(3)' });
    return y;
  };
  const build = () => {
    reset();
    const tl = G.timeline({ paused: true, repeat: -1 });
    let y = BASE;
    y = hop(tl, y, 950, BASE, .6);
    tl.to({}, { duration: .25 });
    y = hop(tl, y, 720, TOP, .6);
    y = hop(tl, y, 595, TOP, .5);
    y = hop(tl, y, 470, TOP, .5);
    y = hop(tl, y, 345, TOP, .5);
    // peeks at the "I"
    tl.to(head, { rotation: -22, duration: .3, ease: 'power2.out' }).to({}, { duration: .35 })
      .to(head, { rotation: 0, duration: .25 });
    y = hop(tl, y, IX, TOP, .55);
    // stomp, stomp…
    [.62, .3].forEach(s => {
      tl.to(screw, { y: TOP - 60, duration: .2, ease: 'power2.out' })
        .to(screw, { y: BASE - 122 * s, duration: .16, ease: 'power3.in' })
        .to(I, { scaleY: s, duration: .16, ease: 'power3.in' }, '<')
        .to(body, { scaleY: .72, scaleX: 1.18, duration: .07 })
        .to(body, { scaleY: 1, scaleX: 1, duration: .2, ease: 'back.out(3)' });
    });
    // …and screws the rest of it into the floor
    tl.to('#fsThreadsIn', { y: -7, duration: .12, ease: 'none', repeat: 7 }, 'screw')
      .to(screw, { y: BASE, duration: .9, ease: 'power1.inOut' }, 'screw')
      .to(I, { scaleY: 0, duration: .9, ease: 'power1.inOut' }, 'screw')
      .to('#fsShadow', { opacity: .18, duration: .3 }, 'screw+=.6')
      .to(body, { scaleY: 1.06, duration: .12, yoyo: true, repeat: 1 })
      // looks at the audience
      .to(head, { rotation: 10, duration: .3, ease: 'power2.out' }, '+=.3')
      .to(head, { rotation: 0, duration: .4, ease: 'power2.inOut' }, '+=.4')
      // lights go down, the screw glows…
      .to('#fsDark', { opacity: .96, duration: 2.2, ease: 'power1.in' }, '+=.2')
      .to('#fsShadow', { opacity: 0, duration: 1 }, '<')
      .to(['#fsGlow', '#fsSlotGlow'], { opacity: 1, duration: 1.2 }, '<+=1')
      .to('#fsPool', { opacity: .35, duration: 1.2 }, '<')
      // …and looks up
      .to(head, { rotation: -6, y: -3, duration: .8, ease: 'power2.inOut' })
      .to('#fsCone', { opacity: 1, duration: .9, ease: 'power2.out' }, '<+=.2')
      // hold the moment, then lights back up, the "I" pops back and the screw hops away → loop
      .to({}, { duration: 2.2 })
      .to(['#fsCone', '#fsGlow', '#fsSlotGlow', '#fsPool'], { opacity: 0, duration: .6 })
      .to('#fsDark', { opacity: 0, duration: 1, ease: 'power1.out' }, '<')
      .to(head, { rotation: 0, y: 0, duration: .4 }, '<')
      .to('#fsThreadsIn', { y: 7, duration: .1, ease: 'none', repeat: 5 }, 'out')
      .to(screw, { y: TOP, duration: .6, ease: 'power1.inOut' }, 'out')
      .to(I, { scaleY: 1, duration: .6, ease: 'power1.inOut' }, 'out')
      .to('#fsShadow', { opacity: 0, duration: .2 }, 'out');
    y = hop(tl, TOP, 95, TOP, .5);
    hop(tl, TOP, -90, BASE, .55);
    tl.to({}, { duration: .6 });
    return tl;
  };
  let tl = build();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { tl.progress(1); return; }
  // loops forever while the footer is on screen, pauses when it scrolls away
  new IntersectionObserver(([e]) => { e.isIntersecting ? tl.play() : tl.pause(); }, { threshold: .3 }).observe(stage);
})();

/* ---------- Header logo: same screw bit as the footer stage, in miniature —
   pops up on the last "a", hops back over the letters, stomps + screws the "i"
   into the floor, glows, then hops off; rests a few seconds and loops ---------- */
(() => {
  const svg = document.getElementById('hdrLogo'); if (!svg || !window.gsap) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const G = gsap, screw = '#hlScrew', body = '#hlBody', head = '#hlHeadG', I = '#hlI';
  // logo units (168×32): baseline, top of lowercase letters, top of the "i" dot, centre of the "i"
  const BASE = 27, XH = 9, ITOP = 2, IX = 34.5, IH = BASE - ITOP;
  G.set(body, { svgOrigin: '0 0' }); G.set(head, { svgOrigin: '0 -100' }); G.set(I, { svgOrigin: `${IX} ${BASE}` });
  const hop = (tl, fromY, x, y, dur = .42) => {
    const peak = Math.max(Math.min(fromY, y) - 4, .5);   // low hops: the header shell clips anything higher
    tl.to(body, { scaleY: .7, scaleX: 1.2, duration: .1, ease: 'power2.out' })
      .addLabel('a')
      .to(screw, { x, duration: dur, ease: 'none' }, 'a')
      .to(screw, { y: peak, duration: dur / 2, ease: 'power2.out' }, 'a')
      .to(screw, { y, duration: dur / 2, ease: 'power2.in' }, `a+=${dur / 2}`)
      .to(body, { scaleY: 1.14, scaleX: .88, duration: .14 }, 'a')
      .to(body, { scaleY: 1, scaleX: 1, duration: .12 }, `a+=${dur - .12}`)
      .to(body, { scaleY: .76, scaleX: 1.16, duration: .06, ease: 'power2.out' })
      .to(body, { scaleY: 1, scaleX: 1, duration: .18, ease: 'back.out(3)' });
    return y;
  };
  const tl = G.timeline({ repeat: -1, repeatDelay: 6, delay: 1.5 });
  // pops up out of the last "a"
  tl.set(screw, { x: 146, y: XH, scale: 0, transformOrigin: '50% 100%' })
    .set(I, { scaleY: 1 }).set('#hlThreadsIn', { y: 0 })
    .to(screw, { opacity: 1, scale: 1, duration: .35, ease: 'back.out(2.5)' })
    .to({}, { duration: .2 });
  let y = XH;
  y = hop(tl, y, 100, XH);
  y = hop(tl, y, 50, 1);   // the orange "x" sticks up higher
  // peeks at the "i"
  tl.to(head, { rotation: -22, duration: .25, ease: 'power2.out' }).to({}, { duration: .3 })
    .to(head, { rotation: 0, duration: .2 });
  y = hop(tl, y, IX, ITOP, .4);
  // stomp, stomp…
  [.62, .3].forEach(k => {
    tl.to(screw, { y: .5, duration: .16, ease: 'power2.out' })
      .to(screw, { y: BASE - IH * k, duration: .13, ease: 'power3.in' })
      .to(I, { scaleY: k, duration: .13, ease: 'power3.in' }, '<')
      .to(body, { scaleY: .72, scaleX: 1.18, duration: .06 })
      .to(body, { scaleY: 1, scaleX: 1, duration: .18, ease: 'back.out(3)' });
  });
  // …and screws the rest of it into the floor, becoming the "i"
  tl.to('#hlThreadsIn', { y: -9, duration: .1, ease: 'none', repeat: 6 }, 'screw')
    .to(screw, { y: BASE, duration: .75, ease: 'power1.inOut' }, 'screw')
    .to(I, { scaleY: 0, duration: .75, ease: 'power1.inOut' }, 'screw')
    .to(body, { scaleY: 1.06, duration: .1, yoyo: true, repeat: 1 })
    // looks at the audience, then lights up
    .to(head, { rotation: 10, duration: .25, ease: 'power2.out' }, '+=.2')
    .to(head, { rotation: 0, duration: .3, ease: 'power2.inOut' }, '+=.3')
    .to(['#hlGlow', '#hlSlotGlow'], { opacity: 1, duration: .8 })
    .to('#hlPool', { opacity: .35, duration: .8 }, '<')
    .to(head, { rotation: -6, duration: .6, ease: 'power2.inOut' })
    // hold, glow off, the "i" pops back and the screw hops away → rest → loop
    .to({}, { duration: 1.6 })
    .to(['#hlGlow', '#hlSlotGlow', '#hlPool'], { opacity: 0, duration: .5 })
    .to(head, { rotation: 0, duration: .3 }, '<')
    .to('#hlThreadsIn', { y: 9, duration: .08, ease: 'none', repeat: 5 }, 'out')
    .to(screw, { y: ITOP, duration: .5, ease: 'power1.inOut' }, 'out')
    .to(I, { scaleY: 1, duration: .5, ease: 'power1.inOut' }, 'out');
  y = hop(tl, ITOP, 20, ITOP, .38);
  tl.to(screw, { x: 4, y: BASE, scale: 0, opacity: 0, duration: .35, ease: 'power2.in' });
})();

/* ---------- Hero content slider (loops) + matching laptop-screen scene ---------- */
(() => {
  const wrap = document.getElementById('heroSlides'); if (!wrap) return;
  const slides = [...wrap.querySelectorAll('.hs-slide')], dots = [...document.querySelectorAll('.hs-nav button')];
  const scenes = [...document.querySelectorAll('#screenUI .scr')];
  const hk = document.getElementById('holoK'), hv = document.getElementById('holoV'), ht = document.getElementById('healthTxt');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap, DUR = 6500;
  let cur = 0, timer, paused = false;
  /* Set 5: every tab has its own stage scene (laptop / pulse / AMC / support / e-waste) */
  const stageScenes = [...document.querySelectorAll('#heroSvg .scene')];
  function swapScene(n) {
    const next = stageScenes.find(s => +s.dataset.scene === n); if (!next) return;
    document.getElementById('heroStage').classList.toggle('scene-alt', n !== 0);
    if (!G || reduce) { stageScenes.forEach(s => s.classList.toggle('on', s === next)); return; }
    // stop every running scene tween first, so quick tab clicks / scrolling can never leave 2+ scenes on screen
    stageScenes.forEach(s => { G.killTweensOf(s); const p = s.querySelectorAll('[data-pop]'); G.killTweensOf(p); if (s !== next) G.set(p, { opacity: 1, scale: 1 }); });
    stageScenes.forEach(s => {
      if (s === next) return;
      if (s.classList.contains('on')) G.to(s, { opacity: 0, scale: .94, y: 24, svgOrigin: '300 330', duration: .35, ease: 'power2.in', onComplete: () => { s.classList.remove('on'); G.set(s, { clearProps: 'all' }); } });
      else G.set(s, { clearProps: 'all' });
    });
    next.classList.add('on');
    G.fromTo(next, { opacity: 0, scale: 1.06, y: -20, svgOrigin: '300 330' }, { opacity: 1, scale: 1, y: 0, duration: .7, delay: .3, ease: 'power3.out' });
    const pops = next.querySelectorAll('[data-pop]');
    if (pops.length) G.fromTo(pops, { opacity: 0, scale: .7, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .6, stagger: .09, delay: .4, ease: 'back.out(1.7)' });
  }
  window.__heroGo = (n) => go(n);
  window.__heroRestart = () => restart();
  const setDotTimer = () => dots.forEach((d, i) => { d.classList.toggle('on', i === cur); d.style.setProperty('--d', DUR + 'ms'); d.setAttribute('aria-selected', i === cur); });
  function go(n) {
    if (n === cur) return;
    const out = slides[cur], inn = slides[n];
    out.classList.remove('on'); out.setAttribute('aria-hidden', 'true');
    inn.classList.add('on'); inn.removeAttribute('aria-hidden');
    if (G && !reduce) {
      G.fromTo(out.children, { y: 0, opacity: 1 }, { y: -24, opacity: 0, duration: .45, stagger: .04, ease: 'power2.in' });
      G.fromTo(inn.children, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .08, ease: 'power3.out', delay: .35, clearProps: 'transform' });
    }
    const sIdx = +inn.dataset.screen;
    scenes.forEach(sc => sc.classList.toggle('on', +sc.dataset.s === sIdx));
    swapScene(sIdx);
    const [k, v, t] = inn.dataset.holo.split('|');
    if (hk) { hk.textContent = k; hv.textContent = v; ht.textContent = t; }
    window.__heroSlide = n;
    cur = n; setDotTimer(); restart();
  }
  function restart() { clearTimeout(timer); dots.forEach(d => { d.classList.remove('run'); void d.offsetWidth; }); if (paused || reduce || window.__heroLock) return; dots[cur].classList.add('run'); timer = setTimeout(() => go((cur + 1) % slides.length), DUR); }
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  const copy = wrap.closest('.hero-copy');
  copy.addEventListener('mouseenter', () => { paused = true; restart(); });
  copy.addEventListener('mouseleave', () => { paused = false; restart(); });
  new IntersectionObserver(([e]) => { paused = !e.isIntersecting; restart(); }).observe(document.getElementById('hero'));
  setDotTimer(); setTimeout(restart, 2200);
  const qTab = +new URLSearchParams(location.search).get('tab'); // e.g. ?tab=2 opens AMC
  if (qTab > 0 && qTab < slides.length) setTimeout(() => go(qTab), 1200);
})();

/* ---------- Set 5: light / dark theme switch (choice remembered on this device) ---------- */
(() => {
  const btn = document.getElementById('themeToggle'); if (!btn) return;
  const root = document.documentElement;
  const logos = [...document.querySelectorAll('#hdrLogo image')];
  const apply = (dark) => {
    root.dataset.theme = dark ? 'dark' : 'light';
    btn.setAttribute('aria-pressed', dark); btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    logos.forEach(i => i.setAttribute('href', dark ? 'assets/img/logo-light.png' : 'assets/img/logo.png'));
  };
  apply(root.dataset.theme === 'dark');
  btn.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 600);
    apply(dark);
    try { localStorage.setItem('fp-theme', dark ? 'dark' : 'light'); } catch (e) {}
  });
})();

/* ---------- AMC + Rental: rotating ad carousels ---------- */
document.querySelectorAll('.amc2-ads').forEach((box) => {
  const ads = [...box.querySelectorAll('.amc2-ad')], dots = [...box.querySelectorAll('.amc2-dots button')];
  const wrap = box.querySelector('.amc2-slides'); if (ads.length < 2) return;
  let cur = 0, timer;
  const go = (n) => { cur = n; ads.forEach((a, i) => a.classList.toggle('on', i === n)); dots.forEach((d, i) => d.classList.toggle('on', i === n)); };
  const run = () => { clearInterval(timer); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => go((cur + 1) % ads.length), 4500); };
  dots.forEach((d, i) => d.addEventListener('click', () => { go(i); run(); }));
  wrap.addEventListener('mouseenter', () => clearInterval(timer)); wrap.addEventListener('mouseleave', run);
  run();
});

/* ---------- Rent vs Buy calculator ---------- */
(() => {
  const box = document.getElementById('rent-calc'); if (!box) return;
  const chips = [...box.querySelectorAll('.rcalc-chips button')];
  const qtyEl = box.querySelector('#rcQty'), range = box.querySelector('#rcMonths');
  const $ = (id) => box.querySelector('#' + id);
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  let qty = 1, shown = 0, raf;
  const animate = (to) => {
    cancelAnimationFrame(raf); const from = shown, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
      shown = from + (to - from) * e; $('rcSave').textContent = (shown < 0 ? '-' : '') + inr(Math.abs(shown));
      if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  const calc = () => {
    const c = chips.find((b) => b.classList.contains('on')), m = +range.value;
    const rent = +c.dataset.rent * m * qty, buy = +c.dataset.buy * qty * (1 + 0.12 * m / 12);
    const save = buy - rent, pct = Math.round(save / buy * 100), max = Math.max(rent, buy);
    $('rcMonthsLbl').textContent = m + (m === 1 ? ' month' : ' months');
    $('rcRent').textContent = inr(rent); $('rcBuy').textContent = inr(buy);
    $('rcRentBar').style.width = (rent / max * 100) + '%'; $('rcBuyBar').style.width = (buy / max * 100) + '%';
    const p = $('rcPct'); p.classList.toggle('is-neg', save < 0);
    p.textContent = save >= 0 ? pct + '% less than buying' : 'Buying is cheaper at this length';
    animate(save);
  };
  chips.forEach((b) => b.addEventListener('click', () => {
    chips.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); calc();
  }));
  box.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.min(50, Math.max(1, qty + +b.dataset.step)); qtyEl.textContent = qty; calc();
  }));
  range.addEventListener('input', calc);
  calc();
})();

/* ---------- E-waste recovery lab ---------- */
(() => {
  const lab = document.querySelector('.ew3-lab'); if (!lab) return;
  const picks = [...lab.querySelectorAll('.ewl-picks button')], segs = [...lab.querySelectorAll('.ewl-seg')];
  const vals = [...lab.querySelectorAll('.ewl-legend b')], C = 2 * Math.PI * 80, GAP = 3;
  const show = (b) => {
    const mix = b.dataset.mix.split(',').map(Number); let off = 0;
    segs.forEach((s, i) => {
      const len = Math.max(0, mix[i] / 100 * C - GAP);
      s.style.strokeDasharray = len + ' ' + (C - len); s.style.strokeDashoffset = -off; off += mix[i] / 100 * C;
    });
    vals.forEach((v, i) => { v.textContent = mix[i] + '%'; });
    lab.querySelector('#ewlPay').textContent = '₹' + (+b.dataset.pay).toLocaleString('en-IN');
    lab.querySelector('#ewlName').textContent = 'per ' + b.dataset.name;
    lab.querySelector('#ewlCo2').textContent = b.dataset.co2 + ' kg';
    lab.querySelector('#ewlIcon').setAttribute('href', '#' + b.dataset.icon);
  };
  picks.forEach((b) => b.addEventListener('click', () => {
    picks.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); show(b);
  }));
  requestAnimationFrame(() => show(picks.find((b) => b.classList.contains('on'))));
})();

/* ---------------- Technical support · scenario loop (tagline + chip + live call) ---------------- */
(() => {
  const root = document.querySelector('.tsx'); if (!root) return;
  const q = (s) => root.querySelector(s);
  const track = q('.ts-track'), box = q('.ts-view'), card = q('.ts-rotator'), prog = q('.ts-prog i'), chips = [...root.querySelectorAll('.tsx-chips button')];
  const ask = q('#tsAsk'), reply = q('#tsReply'), steps = q('#tsSteps'), done = q('#tsDone');
  const stepLbl = [...steps.querySelectorAll('span')], bar = steps.querySelector('i');
  const scenes = [
    { ask: 'My printer just stopped printing!', reply: 'No worries! Connecting to your PC to fix the printer driver.', mins: 4 },
    { ask: 'Wi-Fi keeps dropping, can you help?', reply: 'Sure! Resetting your network settings and router channel now.', mins: 6 },
    { ask: 'Just got a new laptop, please set it up.', reply: 'Happy to! Setting up Windows, updates and your accounts.', mins: 9 },
    { ask: 'Too many pop-ups, I think it’s a virus.', reply: 'Scanning now — removing the adware and speeding things up.', mins: 7 },
    { ask: 'My Outlook isn’t sending emails.', reply: 'Got it! Fixing your mail server settings right away.', mins: 5 },
    { ask: 'Can you install MS Office for me?', reply: 'Of course! Installing and activating it on your PC now.', mins: 8 },
  ];
  const n = scenes.length, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // wave + call timer
  const wave = q('#tsWave');
  for (let i = 0; i < 14; i++) { const b = document.createElement('i'); b.style.animationDelay = (-Math.random() * 1.2) + 's'; b.style.animationDuration = (.8 + Math.random() * .8) + 's'; wave.appendChild(b); }
  const timer = q('#tsTimer'); let t = 0;
  setInterval(() => { t++; timer.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }, 1000);

  // seamless vertical loop: clone first tagline at the end
  track.appendChild(track.children[0].cloneNode(true)).setAttribute('aria-hidden', 'true');
  let cur = 0, pos = 0, timers = [], cycle;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const moveTrack = (to) => {
    track.style.transform = `translateY(-${to * box.clientHeight}px)`; pos = to;
    if (to === n) later(() => { track.style.transition = 'none'; track.style.transform = 'translateY(0)'; pos = 0; track.offsetHeight; track.style.transition = ''; }, 650);
  };

  const play = (i, fromLoop) => {
    timers.forEach(clearTimeout); timers = [];
    const s = scenes[i];
    if (fromLoop && i === 0 && pos === n - 1) moveTrack(n); else moveTrack(i);
    cur = i;
    card.classList.remove('flash'); prog.classList.remove('run'); card.offsetWidth;
    if (!reduce) { card.classList.add('flash'); prog.classList.add('run'); }
    chips.forEach((c, k) => { c.classList.toggle('on', k === i); c.setAttribute('aria-selected', k === i); });
    q('#tsBill').textContent = '₹' + s.mins * 5;
    if (reduce) { ask.textContent = s.ask; reply.textContent = s.reply; steps.style.setProperty('--p', '100%'); stepLbl.forEach(l => l.classList.add('on')); done.classList.add('fixed'); q('#tsState').textContent = `Fixed in ${s.mins} min`; q('#tsStateSub').textContent = 'You didn’t move from your seat'; return; }
    // reset
    [ask, reply].forEach(el => el.classList.add('hide'));
    done.classList.remove('fixed'); q('#tsState').textContent = 'Expert is on it…'; q('#tsStateSub').textContent = 'Sit back, we’re fixing it live';
    bar.style.transition = 'none'; steps.style.setProperty('--p', '0%'); bar.offsetWidth; bar.style.transition = '';
    stepLbl.forEach(l => l.classList.remove('on'));
    // script
    later(() => { ask.textContent = s.ask; ask.classList.remove('hide'); }, 250);
    later(() => { reply.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>'; reply.classList.remove('hide'); }, 900);
    later(() => { reply.textContent = s.reply; }, 1900);
    later(() => { steps.style.setProperty('--p', '100%'); stepLbl[0].classList.add('on'); }, 2300);
    later(() => stepLbl[1].classList.add('on'), 2950);
    later(() => stepLbl[2].classList.add('on'), 3600);
    later(() => { done.classList.add('fixed'); q('#tsState').textContent = `Fixed in ${s.mins} min`; q('#tsStateSub').textContent = 'You didn’t move from your seat'; }, 4400);
  };

  const DUR = 6500;
  card.style.setProperty('--ts-dur', DUR + 'ms');
  const loop = () => { clearInterval(cycle); if (!reduce) cycle = setInterval(() => { if (!document.hidden) play((cur + 1) % n, true); }, DUR); };
  chips.forEach((c, k) => c.addEventListener('click', () => { play(k); loop(); }));
  root.addEventListener('mouseenter', () => { clearInterval(cycle); prog.style.animationPlayState = 'paused'; });
  root.addEventListener('mouseleave', () => { prog.style.animationPlayState = ''; prog.classList.remove('run'); prog.offsetWidth; if (!reduce) prog.classList.add('run'); loop(); });
  play(0); loop();
})();

/* ---------------- Warranty checker · 4 brands visible, scroll for more ---------------- */
(() => {
  const list = document.getElementById('wcList'); if (!list) return;
  const wrap = list.parentElement, up = document.querySelector('.wc-up'), down = document.querySelector('.wc-down'), count = document.getElementById('wcCount');
  const SHOW = 4;
  const rows = () => [...list.children].filter(li => !li.hidden);
  const step = () => { const r = rows(); return r.length > 1 ? r[1].offsetTop - r[0].offsetTop : (r[0]?.offsetHeight || 50); };
  const size = () => { const r = rows()[0]; if (!r) return; const gap = step() - r.offsetHeight; wrap.style.setProperty('--wc-h', (SHOW * step() - gap) + 'px'); update(); };
  const update = () => {
    const r = rows(), total = r.length, first = Math.round(list.scrollTop / step());
    const max = list.scrollHeight - list.clientHeight;
    count.textContent = total ? `${Math.min(first + 1, total)}–${Math.min(first + SHOW, total)} of ${total}` : 'No match';
    up.disabled = list.scrollTop <= 2; down.disabled = list.scrollTop >= max - 2;
    wrap.classList.toggle('can-up', !up.disabled); wrap.classList.toggle('can-down', !down.disabled);
  };
  up.addEventListener('click', () => list.scrollBy({ top: -SHOW * step() }));
  down.addEventListener('click', () => list.scrollBy({ top: SHOW * step() }));
  list.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  document.getElementById('wcFind')?.addEventListener('input', () => { list.scrollTop = 0; requestAnimationFrame(update); });
  addEventListener('resize', size);
  size();
})();
