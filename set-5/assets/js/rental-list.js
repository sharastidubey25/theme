/* FixPapa · Set 5 · Rental listing (rental-category.html?cat=laptop|desktop|printer|projector&months=3)
   One page for every rental category: category tabs, rental-period switch (prices are per month for the chosen
   plan), category-specific filters on the shared FPShopList engine, and the "Rent now" request modal.
   A real backend plugs in through window.FPRentalApi = { request(rental) } (returns a Promise → { ref }). */
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
      { k: 'RAM', name: 'RAM', range: { toNum: num, unit: (n) => `${n} GB` } }, { k: 'Screen', name: 'Screen Size', range: { toNum: num, unit: (n) => `${n}″` } }],
    desktop: [{ k: 'brand', name: 'Brand' }, { k: 'Processor', name: 'Processor' }, { k: 'Storage', name: 'Storage', range: { toNum: (v) => num(v) * (/TB/.test(v) ? 1024 : 1), unit: gb } },
      { k: 'RAM', name: 'RAM', range: { toNum: num, unit: (n) => `${n} GB` } }, { k: 'Monitor', name: 'Monitor Size', range: { toNum: num, unit: (n) => `${n}″` } }],
    printer: [{ k: 'brand', name: 'Brand' }, { k: 'Printer Type', name: 'Printer Type' }, { k: 'Printer Technology', name: 'Printer Technology' }, { k: 'Connectivity', name: 'Connectivity' }],
    projector: [{ k: 'brand', name: 'Brand' }, { k: 'Projector Type', name: 'Projector Type' }, { k: 'Connectivity', name: 'Connectivity' }]
  }[cat.id];
  // prices on this page are per month for the chosen period
  const items = inCat.map((p) => ({ p: { ...p, price: R.monthly(p, months) }, f: Object.fromEntries(FACETS.map((f) => [f.k, f.k === 'brand' ? [p.brand] : S(p, f.k)])) }));

  const tagsOf = (p) => Object.entries(p.specs).filter(([k]) => k !== 'Brightness' || p.cat === 'projector').map(([, v]) => v);
  const card = (p, i) => `
    <article class="rcl-card" style="animation-delay:${Math.min(i, 8) * 40}ms" data-id="${p.id}">
      <div class="rcl-media"><svg viewBox="0 0 120 90" aria-hidden="true"><use href="#${cat.art}"/></svg>${p.tag ? `<span class="rcl-tag">${esc(p.tag)}</span>` : ''}</div>
      <div class="rcl-body">
        <small class="rcl-kicker">${esc(p.brand)} · ${cat.name}</small>
        <h3>${esc(p.model)}</h3>
        <ul class="rcl-tags">${tagsOf(p).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="rcl-foot">
          <div class="rcl-price"><b>${R.inr(p.price)}</b><span>/month</span>${months > 1 ? `<small>on a ${months}-month plan</small>` : `<small>on a monthly plan</small>`}</div>
          <button type="button" class="btn btn--sm rcl-rent" data-rent="${p.id}" data-ripple>Rent now</button>
        </div>
      </div>
    </article>`;

  window.FPShopList({
    items, facets: FACETS, card, noun: ['product', 'products'], keep: ['cat', 'months'], scrollTo: '#rentList',
    priceStep: 50, priceLabel: (n) => `${R.inr(n)}/mo`,
    sorts: { new: (a, b) => b.p.id - a.p.id, pop: (a, b) => (b.p.tag ? 1 : 0) - (a.p.tag ? 1 : 0) || a.p.price - b.p.price, lo: (a, b) => a.p.price - b.p.price, hi: (a, b) => b.p.price - a.p.price, az: (a, b) => a.p.name.localeCompare(b.p.name) }
  });

  /* ---------- Rent now · request modal ---------- */
  const modal = $('#rentModal'), form = $('#rentForm'), F = (n) => form.elements[n];
  let cur = null, plan = months, lastFocus;
  const api = window.FPRentalApi || { demo: true, request: () => new Promise((r) => setTimeout(() => r({ ref: 'RT' + Date.now().toString(36).toUpperCase().slice(-6) }), 700)) };
  const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
  const total = () => {
    const qty = Math.max(1, Math.min(50, +F('qty').value || 1)), m = R.monthly(cur, plan);
    $('#rcmMonthly').textContent = `${R.inr(m * qty)}${qty > 1 ? ` (${qty} × ${R.inr(m)})` : ''}`;
    $('#rcmTotalL').textContent = `Total for ${plan} ${plan === 1 ? 'month' : 'months'}`;
    $('#rcmTotal').textContent = R.inr(m * qty * plan);
    $('#rcmBulk').hidden = qty < 10;
  };
  const open = (p) => {
    cur = p; plan = months; lastFocus = document.activeElement;
    $('.rcm-art use', modal).setAttribute('href', '#' + cat.art);
    $('#rcmCat').textContent = `${p.brand} · ${cat.name} on rent`; $('#rcmTitle').textContent = p.model;
    $('#rcmTags').innerHTML = tagsOf(p).map((t) => `<li>${esc(t)}</li>`).join('');
    planBtns($('#rcmPlans'), plan);
    F('start').min = tomorrow(); if (!F('start').value || F('start').value < F('start').min) F('start').value = tomorrow();
    $$('.rcm-q.bad', modal).forEach((l) => l.classList.remove('bad'));
    $$('.rcm-step', modal).forEach((s) => { s.hidden = s.dataset.step !== 'form'; });
    total(); modal.hidden = false; document.body.style.overflow = 'hidden'; F('qty').focus({ preventScroll: true });
  };
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  $('#rflGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-rent]'); if (b) open(R.products.find((p) => p.id === +b.dataset.rent)); });
  $$('[data-close]', modal).forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  $('#rcmPlans').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; plan = +b.dataset.m; $$('[data-m]', $('#rcmPlans')).forEach((x) => x.setAttribute('aria-checked', x === b)); total(); });
  $('.rcm-qty', modal).addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; F('qty').value = Math.max(1, Math.min(50, (+F('qty').value || 1) + +b.dataset.q)); total(); });
  F('qty').addEventListener('input', total);
  ['mobile', 'pin'].forEach((n) => F(n).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); }));
  form.addEventListener('input', (e) => { const l = e.target.closest('.rcm-q.bad'); if (l) l.classList.remove('bad'); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = [['start', (v) => v && v >= F('start').min], ['name', (v) => v.trim().length > 1], ['mobile', (v) => /^[6-9]\d{9}$/.test(v)], ['pin', (v) => /^[1-9]\d{5}$/.test(v)]]
      .filter(([n, ok]) => { const b = !ok(F(n).value); F(n).closest('.rcm-q').classList.toggle('bad', b); return b; });
    if (bad.length) { F(bad[0][0]).focus(); return; }
    const go = $('.rcm-go', modal); go.disabled = true; $('span', go).textContent = 'Sending…';
    try {
      const res = await api.request({ productId: cur.id, product: cur.name, category: cat.id, months: plan, quantity: +F('qty').value, monthlyRent: R.monthly(cur, plan),
        startDate: F('start').value, name: F('name').value.trim(), mobile: F('mobile').value, pincode: F('pin').value });
      $('#rcmRef').textContent = (res && res.ref) || '';
      $$('.rcm-step', modal).forEach((s) => { s.hidden = s.dataset.step !== 'done'; });
    } finally { go.disabled = false; $('span', go).textContent = 'Request rental'; }
  });
})();
