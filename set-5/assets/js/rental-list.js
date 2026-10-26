/* FixPapa · Set 5 · Rental listing (rental-category.html?cat=laptop|desktop|printer|projector&months=3)
   One page for every rental category: category tabs, rental-period switch (prices are per month for the chosen
   plan), category-specific filters on the shared FPShopList engine. "Add to Cart" puts a rental line (product + chosen
   plan) into the shared cart (cart.js), which then goes through checkout.html and payment.html like any purchase. */
(() => {
  const R = window.FPRental; if (!R || !window.FPShopList) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const q = new URLSearchParams(location.search);
  const cat = R.catOf(q.get('cat')) || R.cats[0];
  let months = R.plans.includes(+q.get('months')) ? +q.get('months') : 1;
  const inCat = R.products.filter((p) => p.cat === cat.id);
  const num = (v) => parseFloat(v) || 0;

  /* header: title, crumb, tabs with counts + starting price */
  $('#rclTitle').textContent = $('#rclCrumb').textContent = cat.name;
  $('#rclLine').textContent = cat.line;
  document.title = `${cat.name} on Rent | FixPapa`;
  const link = (c, m) => `?cat=${c}${m > 1 ? `&months=${m}` : ''}`;
  $$('.rcl-cat').forEach((a) => {
    const c = R.catOf(a.dataset.cat), list = R.products.filter((p) => p.cat === c.id);
    a.href = link(c.id, months);
    a.querySelector('small').textContent = `${list.length} models · from ${R.inr(Math.min(...list.map((p) => R.monthly(p, months))))}/mo`;
    if (c.id === cat.id) a.setAttribute('aria-current', 'page');
  });
  // phones show the tabs as a scrolling strip: bring the current one into view
  { const strip = $('#rclCats'), on = $('.rcl-cat[aria-current]', strip); if (on && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2; }

  /* rental period (page level): a different period re-prices the list, so it reloads with ?months= */
  const planBtns = (wrap, cur) => { wrap.innerHTML = R.plans.map((m) => `<button type="button" role="radio" aria-checked="${m === cur}" data-m="${m}">${m} ${m === 1 ? 'month' : 'months'}${m > 1 ? `<small>save ${Math.round((1 - R.monthly({ price: 1000 }, m) / 1000) * 100)}%</small>` : ''}</button>`).join(''); };
  planBtns($('#rclPlans'), months);
  $('#rclPlans').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]'); if (!b || +b.dataset.m === months) return;
    const u = new URLSearchParams(location.search); +b.dataset.m > 1 ? u.set('months', b.dataset.m) : u.delete('months'); u.delete('min'); u.delete('max');
    location.search = u.toString();
  });

  /* facets per category */
  const S = (p, k) => (p.specs[k] ? [p.specs[k]] : []);
  const gb = (n) => (n >= 1024 ? `${n / 1024} TB` : `${n} GB`);
  const FACETS = {
    laptop: [{ k: 'brand', name: 'Brand' }, { k: 'Processor', name: 'Processor' }, { k: 'Storage', name: 'Storage', range: { toNum: (v) => num(v) * (/TB/.test(v) ? 1024 : 1), unit: gb } },
      { k: 'RAM', name: 'RAM', range: { toNum: num, unit: (n) => `${n} GB` } }],
    desktop: [{ k: 'brand', name: 'Brand' }, { k: 'Processor', name: 'Processor' }, { k: 'Storage', name: 'Storage', range: { toNum: (v) => num(v) * (/TB/.test(v) ? 1024 : 1), unit: gb } },
      { k: 'RAM', name: 'RAM', range: { toNum: num, unit: (n) => `${n} GB` } }],
    printer: [{ k: 'brand', name: 'Brand' }, { k: 'Printer Type', name: 'Printer Type' }, { k: 'Printer Technology', name: 'Printer Technology' }, { k: 'Connectivity', name: 'Connectivity' }],
    projector: [{ k: 'brand', name: 'Brand' }, { k: 'Projector Type', name: 'Projector Type' }, { k: 'Connectivity', name: 'Connectivity' }]
  }[cat.id];
  // prices on this page are per month for the chosen period
  const items = inCat.map((p) => ({ p: { ...p, price: R.monthly(p, months) }, f: Object.fromEntries(FACETS.map((f) => [f.k, f.k === 'brand' ? [p.brand] : S(p, f.k)])) }));

  /* labelled specs: icon + what it is + value, so "8 GB" reads as RAM and "256 GB SSD" as storage */
  const SPEC = {
    Processor: ['Processor', '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>'],
    RAM: ['RAM', '<rect x="2" y="7" width="20" height="10" rx="1.5"/><path d="M6 11v2M10 11v2M14 11v2M18 11v2M6 17v3M18 17v3"/>'],
    Storage: ['Storage', '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 14h18"/><circle cx="17" cy="17" r=".8" fill="currentColor"/>'],
    'Printer Type': ['Type', '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/>'],
    'Printer Technology': ['Function', '<path d="M4 7h16M4 12h16M4 17h10"/>'],
    'Projector Type': ['Resolution', '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>'],
    Connectivity: ['Connects', '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="18.5" r="1" fill="currentColor"/>'],
    Brightness: ['Brightness', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>']
  };
  const short = (v) => String(v).replace(/^Intel /, '');
  const specsOf = (p) => Object.entries(p.specs).filter(([k]) => SPEC[k]);
  const specLine = (p) => specsOf(p).map(([k, v]) => `${SPEC[k][0]} ${short(v)}`).join(', ');
  const card = (p, i) => `
    <article class="rcl-card" style="animation-delay:${Math.min(i, 8) * 40}ms" data-id="${p.id}">
      <div class="rcl-media"><svg viewBox="0 0 120 90" aria-hidden="true"><use href="#${cat.art}"/></svg>${p.tag ? `<span class="rcl-tag">${esc(p.tag)}</span>` : ''}</div>
      <div class="rcl-body">
        <h3>${esc(p.name)}</h3>
        <dl class="rcl-specs">${specsOf(p).map(([k, v]) => `<div><dt><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SPEC[k][1]}</svg>${SPEC[k][0]}</dt><dd>${esc(short(v))}</dd></div>`).join('')}</dl>
        <div class="rcl-foot">
          <div class="rcl-price"><span class="rcl-amt"><b>${R.inr(p.price)}</b><span>/month</span></span>${months > 1 ? `<small>on a ${months}-month plan</small>` : `<small>on a monthly plan</small>`}</div>
          <button type="button" class="btn btn--sm rcl-rent" data-cart="${p.id}" aria-label="Add ${esc(p.name)} (${esc(specLine(p))}) to cart, ${months} ${months === 1 ? 'month' : 'months'} rental" data-ripple><svg width="16" height="16"><use href="#i-cart"/></svg>Add to Cart</button>
        </div>
      </div>
    </article>`;

  window.FPShopList({
    items, facets: FACETS, card, noun: ['product', 'products'], keep: ['cat', 'months'], scrollTo: '#rentList',
    priceStep: 50, priceLabel: (n) => `${R.inr(n)}/mo`,
    sorts: { new: (a, b) => b.p.id - a.p.id, pop: (a, b) => (b.p.tag ? 1 : 0) - (a.p.tag ? 1 : 0) || a.p.price - b.p.price, lo: (a, b) => a.p.price - b.p.price, hi: (a, b) => b.p.price - a.p.price, az: (a, b) => a.p.name.localeCompare(b.p.name) }
  });

  /* ---------- Add to Cart: a rental line (chosen plan) goes into the shared cart (cart.js), then the cart opens ---------- */
  $('#rflGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cart]'); if (!b || !window.FPCart) return;
    const p = R.products.find((x) => x.id === +b.dataset.cart), monthly = R.monthly(p, months);
    window.FPCart.add({
      id: `r${p.id}-m${months}`, name: `${p.name} · ${specsOf(p).map(([, v]) => short(v)).join(', ')}`, meta: `${cat.name} on rent`, art: cat.art, vb: '0 0 120 90',
      rent: { months, monthly, base: p.price }, price: monthly * months, mrp: p.price * months
    });
    location.href = 'cart.html';
  });
})();
