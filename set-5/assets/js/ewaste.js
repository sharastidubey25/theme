/* FixPapa · Set 5 · Sell e-waste (sell-ewaste.html)
   Items (prices per unit from the live sell-ewaste page) → select/remove → sticky bar → "Sell selected items" opens the
   pickup form with a quantity per item and a live estimate → success with a request ID.
   Demo mode resolves locally; a backend plugs in through window.FPEwasteApi = { submit(request) } (Promise → { ref }). */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const grid = $('#ewGrid'); if (!grid) return;
  const ITEMS = [
    ['laptop', 'Laptop', 150, 'bk-laptop'], ['printer', 'Printer', 100, 'bk-printer'], ['desktop', 'Desktop', 100, 'bk-desktop'], ['monitor', 'Monitor', 80, 'bk-monitor'],
    ['smps', 'SMPS', 30, 'ew-smps'], ['projector', 'Projector', 250, 'bk-projector'], ['keyboard', 'Keyboard', 10, 'ew-kb'], ['server', 'Server', 1000, 'bk-server'],
    ['mouse', 'Mouse', 10, 'ew-mouse'], ['multiple', 'Multiple products', 150, 'ew-mixed']
  ].map(([id, name, price, art]) => ({ id, name, price, art }));
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const sel = new Map();   // id → quantity
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const api = window.FPEwasteApi || { submit: () => new Promise((r) => setTimeout(() => r({ ref: 'EW' + Date.now().toString(36).toUpperCase().slice(-6) }), 700)) };

  grid.innerHTML = ITEMS.map((it) => `
    <article class="ew-card" data-id="${it.id}">
      <div class="ew-art"><svg viewBox="0 0 120 90" aria-hidden="true"><use href="#${it.art}"/></svg><span class="ew-tick" aria-hidden="true"><svg width="14" height="14"><use href="#i-check"/></svg></span></div>
      <h3>${it.name}</h3>
      <p>Estimated value <b>${inr(it.price)}</b> / unit</p>
      <button type="button" class="ew-pick" aria-pressed="false">Select</button>
    </article>`).join('');

  const bar = $('#ewBar');
  const total = () => [...sel].reduce((s, [id, q]) => s + ITEMS.find((i) => i.id === id).price * q, 0);
  function sync() {
    $$('.ew-card', grid).forEach((c) => { const on = sel.has(c.dataset.id), b = $('.ew-pick', c);
      c.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? 'Remove' : 'Select'; });
    const n = sel.size; bar.hidden = !n; document.body.classList.toggle('ew-has-bar', !!n);
    $('#ewBarCount').textContent = `${n} item${n === 1 ? '' : 's'} selected`;
    $('#ewBarList').textContent = ITEMS.filter((i) => sel.has(i.id)).map((i) => i.name).join(', ');
    $('#ewBarEst').textContent = inr(total());
  }
  grid.addEventListener('click', (e) => { const c = e.target.closest('.ew-card'); if (!c) return; const id = c.dataset.id; sel.has(id) ? sel.delete(id) : sel.set(id, 1); sync(); });

  /* states → cities */
  const CITIES = {
    'Andhra Pradesh': 'Visakhapatnam,Vijayawada,Guntur,Tirupati', Assam: 'Guwahati,Silchar,Dibrugarh', Bihar: 'Patna,Gaya,Muzaffarpur', Chandigarh: 'Chandigarh',
    Chhattisgarh: 'Raipur,Bhilai,Bilaspur', Delhi: 'New Delhi,Dwarka,Rohini,Saket', Goa: 'Panaji,Margao', Gujarat: 'Ahmedabad,Surat,Vadodara,Rajkot',
    Haryana: 'Gurugram,Faridabad,Panipat', 'Himachal Pradesh': 'Shimla,Dharamshala', 'Jammu and Kashmir': 'Srinagar,Jammu', Jharkhand: 'Ranchi,Jamshedpur,Dhanbad',
    Karnataka: 'Bengaluru,Mysuru,Mangaluru', Kerala: 'Kochi,Thiruvananthapuram,Kozhikode', 'Madhya Pradesh': 'Indore,Bhopal,Gwalior,Jabalpur',
    Maharashtra: 'Mumbai,Pune,Nagpur,Nashik,Thane', Odisha: 'Bhubaneswar,Cuttack', Punjab: 'Ludhiana,Amritsar,Jalandhar,Mohali',
    Rajasthan: 'Jaipur,Jodhpur,Udaipur,Kota,Ajmer', 'Tamil Nadu': 'Chennai,Coimbatore,Madurai', Telangana: 'Hyderabad,Warangal',
    'Uttar Pradesh': 'Lucknow,Noida,Ghaziabad,Kanpur,Agra', Uttarakhand: 'Dehradun,Haridwar', 'West Bengal': 'Kolkata,Howrah,Siliguri'
  };
  const form = $('#ewForm'), F = (n) => form.elements[n];
  F('state').insertAdjacentHTML('beforeend', Object.keys(CITIES).map((s) => `<option>${s}</option>`).join(''));
  F('state').addEventListener('change', () => {
    const c = F('city'); c.innerHTML = '<option value="">Select city</option>' + (CITIES[F('state').value] || '').split(',').filter(Boolean).map((x) => `<option>${x}</option>`).join('');
    c.disabled = !F('state').value;
  });

  /* modal */
  const modal = $('#ewModal'); let from;
  const drawItems = () => {
    $('#ewmItems').innerHTML = ITEMS.filter((i) => sel.has(i.id)).map((i) => `
      <div class="ewm-item" data-id="${i.id}">
        <span class="ewm-art"><svg viewBox="0 0 120 90" aria-hidden="true"><use href="#${i.art}"/></svg></span>
        <div><b>${i.name}</b><small>${inr(i.price)} / unit</small></div>
        <div class="ewm-qty"><button type="button" data-q="-1" aria-label="Fewer ${esc(i.name)}">−</button><input type="number" min="1" max="999" value="${sel.get(i.id)}" inputmode="numeric" aria-label="Number of ${esc(i.name)}"><button type="button" data-q="1" aria-label="More ${esc(i.name)}">+</button></div>
        <button type="button" class="ewm-rm" aria-label="Remove ${esc(i.name)}">✕</button>
      </div>`).join('');
    $('#ewmEst').textContent = inr(total());
  };
  const step = (s) => $$('[data-step]', modal).forEach((el) => { el.hidden = el.dataset.step !== s; });
  const open = () => { if (!sel.size) return; from = document.activeElement; step('form'); drawItems(); $$('.ewm-f.bad', form).forEach((l) => l.classList.remove('bad')); modal.hidden = false; document.body.style.overflow = 'hidden'; F('name').focus(); };
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; if (!$('[data-step="done"]', modal).hidden) { sel.clear(); form.reset(); F('city').disabled = true; sync(); } from && from.focus(); };
  $('#ewSell').addEventListener('click', open);
  $$('[data-close]', modal).forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  $('#ewmItems').addEventListener('click', (e) => {
    const row = e.target.closest('.ewm-item'); if (!row) return; const id = row.dataset.id;
    if (e.target.closest('.ewm-rm')) { sel.delete(id); sync(); if (!sel.size) return close(); drawItems(); return; }
    const b = e.target.closest('[data-q]'); if (!b) return;
    sel.set(id, Math.max(1, Math.min(999, sel.get(id) + +b.dataset.q))); $('input', row).value = sel.get(id); $('#ewmEst').textContent = inr(total()); sync();
  });
  $('#ewmItems').addEventListener('input', (e) => { const row = e.target.closest('.ewm-item'); if (!row) return; const v = Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)); sel.set(row.dataset.id, v); $('#ewmEst').textContent = inr(total()); sync(); });
  ['mobile', 'pin'].forEach((n) => F(n).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); }));
  form.addEventListener('input', (e) => { const l = e.target.closest('.ewm-f.bad'); if (l) l.classList.remove('bad'); });
  form.addEventListener('change', (e) => { const l = e.target.closest('.ewm-f.bad'); if (l) l.classList.remove('bad'); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = (n) => F(n).value.trim();
    const bad = [['name', /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(v('name'))], ['email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))], ['mobile', /^[6-9]\d{9}$/.test(v('mobile'))],
      ['address', v('address').length > 5], ['state', !!v('state')], ['city', !!v('city')], ['pin', /^[1-9]\d{5}$/.test(v('pin'))]]
      .filter(([n, ok]) => { F(n).closest('.ewm-f').classList.toggle('bad', !ok); return !ok; });
    if (bad.length) { F(bad[0][0]).focus(); return; }
    const btn = $('button[type="submit"]', form); btn.disabled = true; $('span', btn).textContent = 'Submitting…';
    try {
      const res = await api.submit({ name: v('name'), email: v('email'), mobile: v('mobile'), firm: v('firm'), address: v('address'), state: v('state'), city: v('city'), pincode: v('pin'),
        items: [...sel].map(([id, quantity]) => ({ id, quantity, unitPrice: ITEMS.find((i) => i.id === id).price })), estimate: total() });
      $('#ewmRef').textContent = (res && res.ref) || ''; step('done'); $('[data-step="done"] .btn', modal).focus();
    } finally { btn.disabled = false; $('span', btn).textContent = 'Submit request'; }
  });
  sync();
})();
