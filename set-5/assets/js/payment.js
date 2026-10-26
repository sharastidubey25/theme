/* FixPapa · Set 5 · Payment (payment.html), step 3 of Cart → Checkout → Payment. Needs cart.js (window.FPCart).
   Reads the checkout choice from localStorage `fp-checkout` ({ ship, bill, same, coupon }) and addresses from `fp-addresses`;
   sends people back to the cart (empty cart) or checkout (no address). Methods: UPI, card, net banking, cash on delivery
   (orders up to ₹50,000). Payment is a demo mock (UPI ID fail@upi or a card ending 0002 is declined) unless
   window.FPPaymentApi = { pay(order) → Promise<{ orderId }> } is defined before this loads. On success the order is kept
   in localStorage `fp-orders`, the cart and coupon are cleared and the success panel shows. */
(() => {
  const C = window.FPCart; if (!C) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const inr = C.inr;
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const ck = load('fp-checkout', {}), addrs = load('fp-addresses', []);
  const ship = addrs.find((a) => a.id === ck.ship), bill = ck.same ? ship : addrs.find((a) => a.id === ck.bill);
  if (!C.count()) { location.replace('cart.html'); return; }
  if (!ship || !bill) { location.replace('checkout.html'); return; }

  const items = C.items, t = C.totals();
  const coupon = ck.coupon ? Math.min(ck.coupon.amount, t.total) : 0, grand = t.total - coupon;
  const COD_MAX = 50000;

  /* ---------------- summary ---------------- */
  $('#pyItems').innerHTML = items.map((i) => `
    <li>
      <span class="ck-art">${i.art ? `<svg viewBox="${esc(i.vb)}"><use href="#${esc(i.art)}"/></svg>` : '<svg width="24" height="24"><use href="#i-box"/></svg>'}</span>
      <div><b title="${esc(i.name)}">${esc(i.name)}</b><small>× ${i.qty}${i.rent ? ` · Rental, ${i.rent.months} ${i.rent.months === 1 ? 'month' : 'months'}` : ''}</small></div>
      <span class="ck-ip">${inr(i.price * i.qty)}</span>
    </li>`).join('');
  $('#pySub').textContent = inr(t.subtotal);
  $('#pyDisc').textContent = '-' + inr(t.discount);
  $('#pyCp').textContent = '-' + inr(coupon);
  $('#pyCpRow').hidden = $('#pyCp').hidden = !coupon;
  if (coupon) $('#pyCpRow').textContent = `Coupon (${ck.coupon.code})`;
  $('#pyTotal').textContent = inr(grand);
  $('#pyBarTotal').textContent = inr(grand);

  const addrHtml = (a) => `${a.kind === 'branch' ? `<b>${esc(a.branch)}</b>${a.gstin ? ` <small>GSTIN ${esc(a.gstin)}</small>` : ''}<br>` : ''}<b>${esc(a.name)}</b> · ${esc(a.mobile)}<br>${esc(a.line)}${a.landmark ? ', ' + esc(a.landmark) : ''}, ${esc(a.city)}, ${esc(a.state)} - ${esc(a.pin)}`;
  $('#pyShip').innerHTML = addrHtml(ship);
  $('#pyBill').innerHTML = ck.same ? 'Same as shipping address' : addrHtml(bill);

  /* ---------------- methods ---------------- */
  const methods = $$('input[name="pm"]');
  let method = 'upi';
  const pick = (m) => {
    method = m;
    methods.forEach((r) => { const on = r.value === m; r.checked = on; r.closest('.py-m').classList.toggle('on', on); $(`#pm-${r.value}`).hidden = !on; });
    $$('[data-pay]').forEach((b) => { b.textContent = m === 'cod' ? 'Place order' : `Pay ${inr(grand)}`; });
    note('');
  };
  methods.forEach((r) => r.addEventListener('change', () => pick(r.value)));
  if (grand > COD_MAX) { const r = $('input[value="cod"]'); r.disabled = true; r.closest('.py-m').classList.add('off'); $('#pyCodNote').textContent = `Not available on orders above ${inr(COD_MAX)}`; }

  /* UPI apps fill nothing in; they just choose "pay in app" */
  $$('.py-app').forEach((b) => b.addEventListener('click', () => {
    $$('.py-app').forEach((x) => x.setAttribute('aria-pressed', x === b));
    $('#upiId').value = ''; bad('upiId', false);
  }));
  $('#upiId').addEventListener('input', () => { $$('.py-app').forEach((x) => x.setAttribute('aria-pressed', 'false')); bad('upiId', false); });

  /* card formatting */
  const num = $('#cardNo'), exp = $('#cardExp'), cvv = $('#cardCvv');
  const brand = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^(60|65|81|82|508)/.test(n) ? 'RuPay' : /^3[47]/.test(n) ? 'Amex' : '');
  num.addEventListener('input', () => {
    const d = num.value.replace(/\D/g, '').slice(0, 19);
    num.value = d.replace(/(\d{4})(?=\d)/g, '$1 ');
    const b = brand(d), LOGO = { Visa: 'visa', Mastercard: 'mastercard', RuPay: 'rupay', Amex: 'amex' };
    $('#cardBrand').innerHTML = b ? `<img src="assets/img/pay/${LOGO[b]}.svg" alt="${b}">` : ''; bad('cardNo', false);
  });
  exp.addEventListener('input', (e) => {
    let d = exp.value.replace(/\D/g, '').slice(0, 4);
    if (d.length === 1 && d > '1') d = '0' + d;
    exp.value = d.length > 2 || (d.length === 2 && e.inputType !== 'deleteContentBackward') ? d.slice(0, 2) + '/' + d.slice(2) : d;
    bad('cardExp', false);
  });
  cvv.addEventListener('input', () => { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4); bad('cardCvv', false); });
  $('#cardName').addEventListener('input', () => bad('cardName', false));
  $('#bank').addEventListener('change', () => bad('bank', false));
  $$('.py-bank').forEach((b) => b.addEventListener('click', () => { $('#bank').value = b.dataset.bank; bad('bank', false); syncBanks(); }));
  const syncBanks = () => $$('.py-bank').forEach((b) => b.setAttribute('aria-pressed', b.dataset.bank === $('#bank').value));
  $('#bank').addEventListener('change', syncBanks);

  const luhn = (d) => { let s = 0; for (let i = 0; i < d.length; i++) { let n = +d[d.length - 1 - i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } s += n; } return s % 10 === 0; };
  const bad = (id, on) => { const f = $('#' + id).closest('.ck-f'); f && f.classList.toggle('bad', on); };

  const validate = () => {
    if (method === 'upi') {
      const app = $('.py-app[aria-pressed="true"]'), id = $('#upiId').value.trim();
      if (app) return { upiApp: app.dataset.app };
      const ok = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(id); bad('upiId', !ok);
      return ok ? { upiId: id } : ($('#upiId').focus(), null);
    }
    if (method === 'card') {
      const d = num.value.replace(/\D/g, ''), [mm, yy] = exp.value.split('/').map(Number), now = new Date();
      const expOk = mm >= 1 && mm <= 12 && yy >= 0 && new Date(2000 + yy, mm) > now;
      const checks = [['cardNo', d.length >= 13 && luhn(d)], ['cardName', /^[A-Za-z][A-Za-z .'-]{1,59}$/.test($('#cardName').value.trim())], ['cardExp', !!expOk], ['cardCvv', new RegExp(`^\\d{${brand(d) === 'Amex' ? 4 : 3}}$`).test(cvv.value)]];
      checks.forEach(([id, ok]) => bad(id, !ok));
      const first = checks.find(([, ok]) => !ok); if (first) { $('#' + first[0]).focus(); return null; }
      return { card: { last4: d.slice(-4), brand: brand(d) || 'Card' } };
    }
    if (method === 'netbanking') { const b = $('#bank').value; bad('bank', !b); return b ? { bank: b } : ($('#bank').focus(), null); }
    return { cod: true };
  };

  /* ---------------- pay ---------------- */
  const mock = {
    async pay(order) {
      await new Promise((r) => setTimeout(r, 1800));
      const p = order.payment;
      if (p.upiId === 'fail@upi' || (p.card && p.card.last4 === '0002')) throw new Error('Your bank declined this payment. No money was taken. Try another method.');
      return { orderId: 'FP' + Date.now().toString().slice(-8) };
    }
  };
  const api = window.FPPaymentApi || mock;
  const msg = $('#pyMsg');
  const note = (text) => { msg.textContent = text; msg.hidden = !text; };
  const busy = $('#pyBusy');
  const label = (o) => o.payment.cod ? 'Cash on delivery' : o.payment.card ? `${o.payment.card.brand} •••• ${o.payment.card.last4}` : o.payment.bank ? `Net banking · ${o.payment.bank}` : o.payment.upiApp ? `UPI · ${o.payment.upiApp}` : `UPI · ${o.payment.upiId}`;
  let paying = false;

  const pay = async (e) => {
    e.preventDefault(); if (paying) return;
    const payment = validate(); if (!payment) { $('#pyMethods').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    note(''); paying = true;
    const order = { items, ship, bill, coupon: ck.coupon || null, totals: { ...t, coupon, grand }, method, payment };
    busy.hidden = false; $('#pyBusyT').textContent = method === 'cod' ? 'Placing your order…' : method === 'upi' ? 'Waiting for UPI approval…' : 'Processing payment…';
    try {
      const r = await api.pay(order);
      const done = { ...order, id: r.orderId, at: new Date().toISOString() };
      const orders = load('fp-orders', []); orders.unshift(done); store('fp-orders', orders.slice(0, 20));
      store('fp-checkout', { ship: ck.ship, bill: ck.bill, same: ck.same, coupon: null });
      success(done);
      C.clear();
    } catch (err) {
      note(err.message || 'Payment failed. Try again.');
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    busy.hidden = true; paying = false;
  };
  $$('[data-pay]').forEach((b) => b.addEventListener('click', pay));

  const success = (o) => {
    const eta = new Date(); eta.setDate(eta.getDate() + 4);
    $('#pyDoneId').textContent = o.id;
    $('#pyDoneAmt').textContent = inr(o.totals.grand) + (o.payment.cod ? ' (pay on delivery)' : ' paid');
    $('#pyDoneM').textContent = label(o);
    $('#pyDoneEta').textContent = eta.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    $('#pyDoneTo').innerHTML = addrHtml(o.ship);
    $('#pyMain').hidden = true; $('#pyBar').hidden = true; $('#pyDone').hidden = false;
    $('.ck-steps').style.setProperty('--p', 1); $$('.ck-steps li').forEach((l) => { l.classList.remove('on'); l.classList.add('done'); l.removeAttribute('aria-current'); });
    document.title = 'Order placed | FixPapa';
    scrollTo({ top: 0, behavior: 'smooth' }); $('#pyDone h1').focus({ preventScroll: true });
  };

  pick('upi');
})();
