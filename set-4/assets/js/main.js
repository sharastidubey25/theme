/* =========================================================
   FixPapa · Set 4 — light, dependency-free interactions
   ========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Data (same catalogue as the live site) ---------- */
  const products = {
    refurb: [
      { name: '(Refurbished )Tiny HP Core i5-10500T 10th Gen ,8 GB DDR4 .256 GB SSD.400 G6 Tiny Desktop', off: 86, mrp: '₹1,88,000.00', price: '₹27,055.00', icon: 'i-desktop' },
      { name: '(Refurbished) Tiny Lenovo Think centre M720q Tiny - Core i7 9th Gen 8 GB DDR4 256 GB SSD', off: 55, mrp: '₹70,000.00', price: '₹31,720.00', icon: 'i-desktop' },
      { name: '(Refurbished) Tiny Lenovo Think…', off: 75, mrp: '₹1,00,000.00', price: '₹24,909.00', icon: 'i-desktop' },
      { name: 'Refurbished Lenovo Thinkcentre M700 Tiny- Core i5 6th Gen ,8 GB DDR4 .256 GB SSD', off: 76, mrp: '₹48,000.00', price: '₹11,724.00', icon: 'i-desktop' },
    ],
    new: [
      { name: 'EXIDE UPS Battery 12v/9AH', off: 33, mrp: '₹2,500.00', price: '₹1,681.00', icon: 'i-box' },
      { name: 'Intex UPS 600VA PROTECTOR 725', off: 29, mrp: '₹3,499.00', price: '₹2,470.00', icon: 'i-server' },
      { name: 'Microtek 650VA LEGEND 750M UPS (2+2 Warranty)', off: 21, mrp: '₹2,999.00', price: '₹2,365.00', icon: 'i-server' },
      { name: 'HIKVISION UPS 600VA (DS-UPS600)', off: 0, mrp: '', price: '₹2,798.00', icon: 'i-server' },
    ],
  };
  const brands = ['HP', 'Dell', 'Brother', 'TP-Link', 'CP Plus', 'Microtek', 'Geonix', 'HCL', 'Luminous', 'Zebronics', 'Otek'];

  /* ---------- Header: shadow once scrolled, mobile drawer ---------- */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('stuck', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('#burger'), drawer = $('#drawer');
  burger.addEventListener('click', () => { const o = drawer.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  $$('a', drawer).forEach(a => a.addEventListener('click', () => { drawer.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  /* ---------- Hero booking: device chips drive the button label ---------- */
  const chips = $$('.chips button'), dev = $('#bookDev');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => { x.classList.toggle('on', x === c); x.setAttribute('aria-checked', x === c); });
    dev.textContent = c.textContent.trim();
  }));

  /* ---------- Brands marquee (list doubled for a seamless loop) ---------- */
  const mq = $('#mq');
  mq.innerHTML = [...brands, ...brands].map((b, i) => `<span${i >= brands.length ? ' aria-hidden="true"' : ''}>${b}</span>`).join('');

  /* ---------- Warranty checker ---------- */
  const pills = $('#brandPills'), serial = $('#wcSerial'), hint = $('#wcHint');
  const HINT = hint.textContent;
  pills.innerHTML = brands.map((b, i) => `<button type="button" role="tab" aria-selected="${!i}" class="${i ? '' : 'on'}">${b}</button>`).join('');
  $$('button', pills).forEach(p => p.addEventListener('click', () => {
    $$('button', pills).forEach(x => { x.classList.toggle('on', x === p); x.setAttribute('aria-selected', x === p); });
    serial.placeholder = 'Serial number for ' + p.textContent; serial.value = '';
    hint.textContent = HINT; hint.classList.remove('ok');
  }));
  $('#wcForm').addEventListener('submit', () => {
    const v = serial.value.trim();
    hint.classList.toggle('ok', !!v);
    hint.textContent = v ? `Checking warranty for ${$('.on', pills).textContent} · ${v}…` : 'Please enter your serial number.';
  });

  /* ---------- Products + tabs ---------- */
  const grid = $('#prods');
  const card = (p) => `
    <article class="prod">
      <div class="prod-img">${p.off ? `<span class="off">${p.off}% Off</span>` : ''}<svg><use href="#${p.icon}"/></svg></div>
      <h4 title="${p.name}">${p.name}</h4>
      <div class="prod-p"><b>${p.price}</b>${p.mrp ? `<s>${p.mrp}</s>` : ''}</div>
      <a href="#" class="btn">Add to Cart</a>
    </article>`;
  const show = (k) => { grid.innerHTML = products[k].map(card).join(''); $$('.prod', grid).forEach((el, i) => el.style.animationDelay = i * 70 + 'ms'); };
  const tabs = $$('.tabs button');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
    show(t.dataset.tab);
  }));
  show('refurb');

  /* ---------- Count-up numbers ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count;
    if (reduced) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- Pulse gauge ---------- */
  const gauge = $('#gauge'), gv = $('#gaugeVal');
  const fillGauge = () => {
    const pct = 85; gauge.style.strokeDashoffset = 314 * (1 - pct / 100);
    gv.dataset.count = pct; countUp(gv);
  };

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    if (el.matches('[data-reveal]')) el.classList.add('in');
    if (el.matches('[data-count]')) countUp(el);
    if (el.matches('.gauge')) fillGauge();
  }), { threshold: .2 });
  $$('[data-reveal], .stats [data-count], .gauge').forEach(el => io.observe(el));
})();
