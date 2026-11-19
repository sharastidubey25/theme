/* FixPapa · Set 5 · Extended Hardware Warranty (extended-warranty.html). Plans come from extended-warranty-data.js
   (window.FPWarrantyPlans), or from window.FPWarrantyApi.plans() when defined. Device chips switch the prices;
   "Buy Now": signed out → login popup that returns with ?buy=id&device=id → summary (brand/model + serial number,
   cover dates, CGST, SGST, total) → pay → warranty active. Bought plans are kept in localStorage 'fp-warranty' (banner).
   Demo unless window.FPWarrantyApi = { plans(), createOrder(plan, device, total, details), pay(order) } is defined. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (!$('#xwPlans')) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const store = {
    get(k, f) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  };
  const user = () => { try { return window.FPAuth?.user?.() || null; } catch (e) { return null; } };
  const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const mock = {
    async plans() { await wait(150); return window.FPWarrantyPlans || { gst: 18, devices: [], plans: [] }; },
    async createOrder(plan, device, total) { await wait(500); return { orderNumber: 'EW' + String(Date.now()).slice(-7), amount: total }; },
    async pay() { await wait(1500); return { paymentId: 'pay_' + Math.random().toString(36).slice(2, 14), status: 'success', created_at: new Date().toISOString() }; },
  };
  const API = Object.assign({}, mock, window.FPWarrantyApi || {});

  let data = { gst: 18, devices: [], plans: [], eligibility: [] }, device = '';
  const params = new URLSearchParams(location.search);
  const plans = () => data.plans.filter(p => p.active !== false);
  const gstOf = (price) => Math.round(price * data.gst / 100);
  const devLabel = (id) => data.devices.find(d => d.id === id)?.label || id;

  /* ---------- active warranty banner ---------- */
  const renderMine = () => {
    const box = $('#xwMine'), mine = user() ? store.get('fp-warranty', []).filter(x => new Date(x.end) > new Date()) : [];
    box.hidden = !mine.length;
    if (!mine.length) return;
    const m = mine[mine.length - 1];
    box.innerHTML = `<span class="ic"><svg width="20" height="20"><use href="#i-shield"/></svg></span>
      <div><b>Your ${esc(devLabel(m.device))} is covered</b><span>${esc(m.name)} warranty${m.model ? ' · ' + esc(m.model) : ''} · valid till <em>${fmtDate(m.end)}</em>${mine.length > 1 ? ` · +${mine.length - 1} more` : ''}</span></div>
      <a href="contact.html" class="btn btn--sm btn--ghost">Raise a claim</a>`;
  };

  /* ---------- device chips, plans, eligibility ---------- */
  const renderDevices = () => {
    $('#xwDevices').innerHTML = data.devices.map(d => `<button type="button" role="radio" aria-checked="${d.id === device}" class="xw-dev${d.id === device ? ' on' : ''}" data-dev="${esc(d.id)}"><svg width="18" height="18" aria-hidden="true"><use href="#${esc(d.icon)}"/></svg>${esc(d.label)}</button>`).join('');
  };

  const card = (p) => {
    const price = p.prices?.[device], mrp = p.mrp?.[device];
    const off = price != null && mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
    const perMonth = price != null && p.months > 1 ? `<small class="xw-pm">That’s ${inr(price / p.months)} a month</small>` : '';
    return `<article class="xw-plan${p.style ? ' xw-plan--' + esc(p.style) : ''}${price == null ? ' xw-plan--na' : ''}">
      ${p.badge ? `<span class="xw-badge">${esc(p.badge)}</span>` : ''}
      <header><span class="xw-len"><svg width="16" height="16" aria-hidden="true"><use href="#i-calendar"/></svg>${p.months} month${p.months > 1 ? 's' : ''} cover</span><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p></header>
      <div class="xw-price">${price == null ? `<b class="xw-na">Not offered for ${esc(devLabel(device).toLowerCase())}s</b>`
        : `<b>${inr(price)}</b>${off ? `<s>${inr(mrp)}</s><em>${off}% off</em>` : ''}`}</div>
      <small class="xw-tax">+ ${data.gst}% GST · ${esc(devLabel(device))}</small>${perMonth}
      <ul class="xw-hl">${(p.highlights || []).map(h => `<li><svg width="18" height="18" aria-hidden="true"><use href="#${esc(h.icon)}"/></svg><span>${h.text}</span></li>`).join('')}</ul>
      <div class="xw-cov"><b>Covered</b><ul>${(p.covered || []).map(f => `<li class="y"><svg width="16" height="16" aria-hidden="true"><use href="#i-check"/></svg>${esc(f)}</li>`).join('')}</ul></div>
      ${(p.notCovered || []).length ? `<div class="xw-cov xw-cov--n"><b>Not covered</b><ul>${p.notCovered.map(f => `<li class="n"><svg width="14" height="14" aria-hidden="true"><use href="#i-close"/></svg>${esc(f)}</li>`).join('')}</ul></div>` : ''}
      <button type="button" class="btn xw-buy${p.style === 'featured' ? '' : ' btn--ghost'}" data-buy="${esc(p.id)}"${price == null ? ' disabled' : ''}>Buy Now <svg class="arrow" width="18" height="18"><use href="#i-arrow"/></svg></button>
    </article>`;
  };

  const renderPlans = () => {
    const list = plans();
    $('#xwPlans').style.setProperty('--n', Math.min(list.length, 4) || 1);
    $('#xwPlans').innerHTML = list.length ? list.map(card).join('') : '<p class="xw-err">New warranty plans are on the way. Call <a href="tel:+918696544448">+91 86965 44448</a> to know more.</p>';
    const low = list.map(p => p.prices?.[device]).filter(v => v != null).sort((a, b) => a - b)[0];
    $$('[data-xw-from]').forEach(el => el.textContent = low != null ? inr(low) : '—');
  };

  const renderElig = () => {
    const box = $('#xwElig'); if (!box) return;
    box.innerHTML = (data.eligibility || []).map(t => `<li><svg width="18" height="18" aria-hidden="true"><use href="#i-check"/></svg>${esc(t)}</li>`).join('');
  };

  $('#xwDevices').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dev]'); if (!b) return;
    device = b.dataset.dev; renderDevices(); renderPlans();
    $(`[data-dev="${device}"]`)?.focus();
  });
  $('#xwDevices').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = data.devices.findIndex(d => d.id === device), n = data.devices.length;
    device = data.devices[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id;
    renderDevices(); renderPlans(); $(`[data-dev="${device}"]`)?.focus(); e.preventDefault();
  });

  /* ---------- buy dialog ---------- */
  const dlg = $('#xwBuy');
  let opener = null, picked = null;
  const view = (name) => $$('[data-view]', dlg).forEach(v => v.hidden = v.dataset.view !== name);

  const openBuy = (id) => {
    const p = plans().find(x => x.id === id), price = p?.prices?.[device];
    if (!p || price == null) return;
    if (!user()) {
      const next = new URL(location.href); next.searchParams.set('buy', id); next.searchParams.set('device', device); next.hash = 'plans';
      return window.FPAuth?.open ? window.FPAuth.open(next.toString()) : (location.href = 'account.html');
    }
    picked = { plan: p, device, price };
    const u = user(), start = new Date(), end = addMonths(start, p.months), tax = gstOf(price), half = Math.round(tax / 2);
    $('#xwBuyTitle').textContent = `Buy ${p.name} warranty`;
    $('#xwSum').innerHTML = `
      <div class="xw-sum-plan"><span class="ic"><svg width="22" height="22"><use href="#i-shield"/></svg></span><div><b>${esc(p.name)} · ${esc(devLabel(device))}</b><small>${(p.highlights || []).map(h => h.text.replace(/<[^>]+>/g, '')).slice(0, 2).map(esc).join(' · ')}</small></div></div>
      <div class="xw-fields">
        <label class="xw-f"><span>Brand and model</span><input id="xwModel" type="text" maxlength="60" placeholder="e.g. HP ProBook 440 G8" autocomplete="off"><em>Enter the brand and model.</em></label>
        <label class="xw-f"><span>Serial number</span><input id="xwSerial" type="text" maxlength="30" placeholder="On the sticker under the device" autocomplete="off" spellcheck="false"><em>Enter the serial number.</em></label>
      </div>
      <dl class="xw-rows">
        <div><dt>Cover</dt><dd>${fmtDate(start)} – ${fmtDate(end)}<small>${p.months} months</small></dd></div>
        <div><dt>Plan price</dt><dd>${inr(price)}</dd></div>
        <div><dt>CGST (${data.gst / 2}%)</dt><dd>${inr(half)}</dd></div>
        <div><dt>SGST (${data.gst / 2}%)</dt><dd>${inr(tax - half)}</dd></div>
        <div class="tot"><dt>Total payable</dt><dd>${inr(price + tax)}</dd></div>
      </dl>
      <div class="xw-bill">${u.gst ? `<svg width="18" height="18"><use href="#i-check"/></svg><span>GST invoice to <b>${esc(u.firm || u.name || '')}</b> · ${esc(u.gst)}.</span>`
        : `<svg width="18" height="18"><use href="#i-tag"/></svg><span>Buying for a business? <button type="button" data-gst-flow>Add your GSTIN</button> to get a GST invoice.</span>`}</div>
      <p class="xw-small">Billed to ${esc(u.name || 'you')}${u.mobile ? ' · +91 ' + esc(u.mobile) : ''}. Your device gets a quick health check before cover starts.</p>`;
    $('#xwPayGo').innerHTML = `<svg width="18" height="18"><use href="#i-shield"/></svg>Pay ${inr(price + tax)} securely`;
    view('sum');
    opener = document.activeElement;
    dlg.hidden = false; document.body.classList.add('xw-lock');
    requestAnimationFrame(() => dlg.classList.add('in'));
    $('#xwModel').focus();
  };
  const closeBuy = () => {
    if (!dlg.querySelector('[data-view="pay"]').hidden) return;
    dlg.classList.remove('in'); dlg.hidden = true; document.body.classList.remove('xw-lock'); opener?.focus?.();
  };

  dlg.addEventListener('input', (e) => e.target.closest('.xw-f')?.classList.remove('bad'));

  $('#xwPayGo').addEventListener('click', () => {
    const model = $('#xwModel').value.trim(), serial = $('#xwSerial').value.trim().toUpperCase();
    const bad = [[model.length < 2, '#xwModel'], [!/^[A-Z0-9-]{4,30}$/.test(serial), '#xwSerial']].filter(x => x[0]);
    bad.forEach(([, s]) => $(s).closest('.xw-f').classList.add('bad'));
    if (bad.length) { $(bad[0][1]).focus(); return; }
    const { plan: p, device: dev, price } = picked, total = price + gstOf(price);
    let order = null;
    view('pay');
    API.createOrder(p, dev, total, { model, serial }).then(o => { order = o; return API.pay(o); }).then(res => {
      if (res.status !== 'success' && res.status !== 'pending') throw new Error('Payment failed');
      const start = new Date(), end = addMonths(start, p.months);
      store.set('fp-warranty', [...store.get('fp-warranty', []), { id: p.id, name: p.name, device: dev, model, serial, start: start.toISOString(), end: end.toISOString(), order: order.orderNumber }]);
      $('#xwDone').innerHTML = `
        <span class="xw-done-ic"><svg width="30" height="30"><use href="#i-check"/></svg></span>
        <h2>Your warranty is booked</h2>
        <p>We’ll call to set up a quick health check. Your certificate is sent once the check is done.</p>
        <dl class="xw-rows">
          <div><dt>Order number</dt><dd>${esc(order.orderNumber)}</dd></div>
          <div><dt>Device</dt><dd>${esc(model)}<small>${esc(devLabel(dev))} · ${esc(serial)}</small></dd></div>
          <div><dt>Transaction ID</dt><dd class="mono">${esc(res.paymentId)}</dd></div>
          <div><dt>Amount paid</dt><dd>${inr(order.amount)}</dd></div>
          <div class="tot"><dt>Covered till</dt><dd>${fmtDate(end)}</dd></div>
        </dl>
        <div class="xw-dialog-act"><button type="button" class="btn" data-close>Done</button></div>`;
      view('done'); renderMine();
      $('#xwDone [data-close]').focus();
    }).catch(err => {
      $('#xwFail').innerHTML = `<span class="xw-done-ic xw-done-ic--bad"><svg width="30" height="30"><use href="#i-close"/></svg></span><h2>Payment failed</h2><p>${esc(err?.message || 'Your payment didn’t go through.')} No money was taken. If it was, it’s refunded within 5–7 days.</p><div class="xw-dialog-act"><button type="button" class="btn btn--ghost" data-close>Close</button><button type="button" class="btn" data-retry>Try again</button></div>`;
      view('fail');
    });
  });

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) closeBuy();
    else if (e.target.closest('[data-retry]')) { view('sum'); }
    else if (e.target.closest('[data-gst-flow]') && window.FPGstBoard?.open) { closeBuy(); window.FPGstBoard.open(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) closeBuy(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-buy]'); if (b && !b.disabled) openBuy(b.dataset.buy); });

  // FAQ: one open at a time
  $$('.xw-faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.xw-faq details').forEach(x => x !== d && (x.open = false)); }));

  let wasIn = !!user();
  setInterval(() => { const now = !!user(); if (now !== wasIn) { wasIn = now; renderMine(); } }, 1000);

  /* ---------- boot ---------- */
  $('#xwPlans').innerHTML = Array.from({ length: 3 }, () => '<div class="xw-plan xw-plan--sk" aria-hidden="true"></div>').join('');
  API.plans().then(d => {
    data = Object.assign({ gst: 18, devices: [], plans: [], eligibility: [] }, d);
    const want = params.get('device');
    device = data.devices.some(x => x.id === want) ? want : (data.devices[0]?.id || '');
    renderDevices(); renderPlans(); renderElig(); renderMine();
    const buy = params.get('buy');
    if (buy && user()) {
      const u = new URL(location.href); u.searchParams.delete('buy'); history.replaceState(null, '', u);
      openBuy(buy);
    }
  }).catch(() => { $('#xwPlans').innerHTML = '<p class="xw-err">Couldn’t load the plans. Please refresh, or call <a href="tel:+918696544448">+91 86965 44448</a>.</p>'; });
})();
