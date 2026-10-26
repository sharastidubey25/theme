/* FixPapa · Set 5 · Checkout (checkout.html), step 2 of Cart → Checkout → Payment. Needs cart.js (window.FPCart).
   Ship to / Bill to pick from saved addresses and branches (localStorage `fp-addresses`); "Add new …" opens the address
   dialog, the branch variant adds branch name + GSTIN. "Same as shipping address" (checked by default) mirrors the shipping choice and hides the billing picker.
   Discount codes are a demo mock (FIXPAPA10: 10% off up to ₹2,000; FLAT500: ₹500 off orders of ₹5,000+) unless
   window.FPCheckoutApi = { applyCoupon(code, cart) → Promise<{ code, amount }> } is defined before this loads.
   "Continue to pay" saves { ship, bill, coupon } to localStorage `fp-checkout` and opens payment.html. */
(() => {
  const C = window.FPCart; if (!C) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const inr = C.inr;
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  if (!C.count()) { location.replace('cart.html'); return; }

  let addrs = load('fp-addresses', []);
  const ck = Object.assign({ ship: '', bill: '', same: true, coupon: null }, load('fp-checkout', {}));
  const byId = (id) => addrs.find((a) => a.id === id);
  if (!byId(ck.ship)) ck.ship = '';
  if (!byId(ck.bill)) ck.bill = '';

  /* ---------------- order summary ---------------- */
  const items = C.items;
  $('#ckItems').innerHTML = items.map((i) => `
    <li>
      <span class="ck-art">${i.art ? `<svg viewBox="${esc(i.vb)}"><use href="#${esc(i.art)}"/></svg>` : '<svg width="24" height="24"><use href="#i-box"/></svg>'}</span>
      <div><b title="${esc(i.name)}">${esc(i.name)}</b><small>× ${i.qty}${i.rent ? ` · Rental, ${i.rent.months} ${i.rent.months === 1 ? 'month' : 'months'}` : ''}</small></div>
      <span class="ck-ip">${i.mrp > i.price ? `<s>${inr(i.mrp * i.qty)}</s>` : ''}${inr(i.price * i.qty)}</span>
    </li>`).join('');

  /* ---------------- coupons ---------------- */
  const MOCK = {
    FIXPAPA10: (t) => ({ amount: Math.min(2000, Math.round(t * 0.1)) }),
    FLAT500: (t) => (t >= 5000 ? { amount: 500 } : { error: 'FLAT500 needs an order of ₹5,000 or more' })
  };
  const mock = {
    async applyCoupon(code, cart) {
      await new Promise((r) => setTimeout(r, 500));
      const rule = MOCK[code]; if (!rule) throw new Error('This code isn’t valid');
      const r = rule(cart.total); if (r.error) throw new Error(r.error);
      return { code, amount: r.amount };
    }
  };
  const api = window.FPCheckoutApi || mock;
  /* demo codes are recomputed on load so the amount follows the current cart */
  if (ck.coupon && !window.FPCheckoutApi) { const r = MOCK[ck.coupon.code] && MOCK[ck.coupon.code](C.totals().total); ck.coupon = r && !r.error ? { code: ck.coupon.code, amount: r.amount } : null; }

  const form = $('#ckCoupon'), inp = $('#ckCode'), msg = $('#ckCodeMsg'), btn = $('#ckApply');
  const totals = () => { const t = C.totals(), cp = ck.coupon ? Math.min(ck.coupon.amount, t.total) : 0; return { ...t, coupon: cp, grand: t.total - cp }; };
  const renderTotals = () => {
    const t = totals();
    $('#ckSub').textContent = inr(t.subtotal);
    $('#ckDisc').textContent = '-' + inr(t.discount);
    $('#ckCp').textContent = '-' + inr(t.coupon);
    $('#ckTotal').textContent = inr(t.grand);
    $('#ckBarTotal').textContent = inr(t.grand);
    const on = !!ck.coupon;
    form.classList.toggle('is-on', on); inp.readOnly = on;
    if (on) inp.value = ck.coupon.code;
    btn.textContent = on ? 'Remove' : 'Apply';
  };
  const note = (text, bad) => { msg.textContent = text; msg.classList.toggle('bad', !!bad); msg.hidden = !text; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (ck.coupon) { ck.coupon = null; inp.value = ''; note(''); save(); renderTotals(); inp.focus(); return; }
    const code = inp.value.trim().toUpperCase(); if (!code) { note('Enter a discount code', true); inp.focus(); return; }
    btn.disabled = true; btn.textContent = '…';
    try {
      const t = C.totals();
      ck.coupon = await api.applyCoupon(code, { items: C.items, ...t });
      note(`${code} applied · you save ${inr(Math.min(ck.coupon.amount, t.total))}`);
    } catch (err) { note(err.message || 'This code isn’t valid', true); }
    btn.disabled = false; save(); renderTotals();
  });
  inp.addEventListener('input', () => note(''));

  /* ---------------- addresses ---------------- */
  const label = (a) => `${a.kind === 'branch' ? a.branch + ' · ' : ''}${a.name}, ${a.line}, ${a.city} - ${a.pin}`;
  const sel = { ship: $('#ckShip'), bill: $('#ckBill') };
  const fillSelects = () => {
    const opts = addrs.length
      ? [['Branches', addrs.filter((a) => a.kind === 'branch')], ['Addresses', addrs.filter((a) => a.kind !== 'branch')]]
          .filter(([, l]) => l.length).map(([g, l]) => `<optgroup label="${g}">${l.map((a) => `<option value="${a.id}">${esc(label(a))}</option>`).join('')}</optgroup>`).join('')
      : '';
    Object.entries(sel).forEach(([k, s]) => {
      s.innerHTML = `<option value="">Select Address</option>${opts}`;
      s.closest('.ck-sel').hidden = !addrs.length;
      s.value = ck[k] || '';
    });
    $$('.ck-none').forEach((n) => { n.hidden = !!addrs.length; });
    syncSame();
  };
  const sameBtn = $('#ckSame');
  const syncSame = () => {
    if (ck.same) { ck.bill = ck.ship; sel.bill.value = ck.ship; }
    sameBtn.checked = ck.same;
    $('#ckSameHint').textContent = ck.same ? 'Uncheck to bill a different address or branch' : 'Choose or add the billing address below';
    $('#ckBillBody').hidden = ck.same;
    Object.values(sel).forEach((s) => s.closest('.ck-sel').classList.toggle('has', !!s.value));
  };
  const save = () => store('fp-checkout', ck);
  sel.ship.addEventListener('change', () => { ck.ship = sel.ship.value; err('ship', false); syncSame(); save(); });
  sel.bill.addEventListener('change', () => { ck.bill = sel.bill.value; err('bill', false); syncSame(); save(); });
  sameBtn.addEventListener('change', () => { ck.same = sameBtn.checked; if (!ck.same) ck.bill = ''; else err('bill', false); fillSelects(); save(); if (!ck.same) (addrs.length ? sel.bill : $('[data-add="address"][data-to="bill"]')).focus(); });
  const err = (k, on) => $(k === 'ship' ? '#ckShipF' : '#ckBillF').classList.toggle('bad', on);

  /* ---------------- address dialog ---------------- */
  const dlg = $('#ckDlg'), df = $('#ckAddrForm'), F = (n) => df.elements[n];
  let target = 'ship', lastFocus = null;
  const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
  F('state').innerHTML = '<option value="">Select state</option>' + STATES.map((s) => `<option>${s}</option>`).join('');
  const open = (kind, to, from) => {
    target = to; lastFocus = from;
    df.reset(); $$('.ck-f', df).forEach((f) => f.classList.remove('bad'));
    df.dataset.kind = kind;
    $$('[data-branch]', df).forEach((f) => { f.hidden = kind !== 'branch'; });
    $('#ckDlgT').textContent = `Add ${to === 'ship' ? 'shipping' : 'billing'} ${kind === 'branch' ? 'branch' : 'address'}`;
    const p = load('fp-profile', null); if (p) { F('name').value = p.name || ''; F('mobile').value = p.mobile || ''; }
    F('state').value = 'Rajasthan';
    dlg.hidden = false; document.body.style.overflow = 'hidden';
    (kind === 'branch' ? F('branch') : F('name')).focus();
  };
  const close = () => { dlg.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => open(b.dataset.add, b.dataset.to, b)));
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', close));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { const f = $$('input:not([hidden]),select,textarea,button', dlg).filter((x) => !x.closest('[hidden]')), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  ['mobile', 'pin'].forEach((n) => F(n).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); }));
  F('gstin').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
  df.addEventListener('input', (e) => { const f = e.target.closest('.ck-f'); f && f.classList.remove('bad'); });
  df.addEventListener('submit', (e) => {
    e.preventDefault();
    const branch = df.dataset.kind === 'branch';
    const v = {}; ['branch', 'gstin', 'name', 'mobile', 'pin', 'line', 'landmark', 'city', 'state'].forEach((n) => { v[n] = F(n).value.trim().replace(/\s+/g, ' '); });
    const checks = [
      ['name', /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(v.name)], ['mobile', /^[6-9]\d{9}$/.test(v.mobile)], ['pin', /^[1-9]\d{5}$/.test(v.pin)],
      ['line', v.line.length >= 5], ['city', v.city.length >= 2], ['state', !!v.state]
    ];
    if (branch) checks.unshift(['branch', v.branch.length >= 2], ['gstin', !v.gstin || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.gstin)]);
    const bad = checks.filter(([, ok]) => !ok).map(([n]) => n);
    checks.forEach(([n, ok]) => F(n).closest('.ck-f').classList.toggle('bad', !ok));
    if (bad.length) { F(bad[0]).focus(); return; }
    const a = { id: 'a' + Date.now().toString(36), kind: branch ? 'branch' : 'address', ...v };
    if (!branch) { delete a.branch; delete a.gstin; }
    addrs.push(a); store('fp-addresses', addrs);
    if (target === 'bill') ck.same = false;
    ck[target] = a.id; if (target === 'ship' && ck.same) ck.bill = a.id;
    err(target, false); save(); fillSelects(); close();
    lastFocus = null; sel[target].focus();
  });

  /* ---------------- continue ---------------- */
  const go = (e) => {
    e.preventDefault();
    if (ck.same) ck.bill = ck.ship;
    const miss = (ck.same ? ['ship'] : ['ship', 'bill']).filter((k) => !ck[k]);
    miss.forEach((k) => err(k, true));
    if (miss.length) {
      const k = miss[0], f = $(k === 'ship' ? '#ckShipF' : '#ckBillF');
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (addrs.length ? sel[k] : $(`[data-add="address"][data-to="${k}"]`)).focus({ preventScroll: true }); return;
    }
    save(); location.href = 'payment.html';
  };
  $$('[data-pay]').forEach((b) => b.addEventListener('click', go));

  C.subscribe(() => { if (!C.count()) location.replace('cart.html'); else location.reload(); });
  fillSelects(); renderTotals();
})();
