/* FixPapa · Set 5 · Care Pack (care-pack.html). Packs come from care-pack-data.js (window.FPCarePacks), or from
   window.FPCarePackApi.packs() when defined. Device chips switch the prices; "Buy Pack": signed out → login popup that
   returns with ?buy=id&device=id → summary (validity, CGST, SGST, total, GST invoice line) → pay → pack active.
   Bought packs are kept in localStorage 'fp-carepack' (banner). Demo unless window.FPCarePackApi =
   { packs(), createOrder(pack, device, total), pay(order) } is defined. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (!$('#cpPacks')) return;
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
    async packs() { await wait(150); return window.FPCarePacks || { gst: 18, devices: [], packs: [] }; },
    async createOrder(pack, device, total) { await wait(500); return { orderNumber: 'CP' + String(Date.now()).slice(-7), amount: total }; },
    async pay() { await wait(1500); return { paymentId: 'pay_' + Math.random().toString(36).slice(2, 14), status: 'success', created_at: new Date().toISOString() }; },
  };
  const API = Object.assign({}, mock, window.FPCarePackApi || {});

  let data = { gst: 18, devices: [], packs: [] }, device = '';
  const params = new URLSearchParams(location.search);
  const packs = () => data.packs.filter(p => p.active !== false);
  const gstOf = (price) => Math.round(price * data.gst / 100);
  const devLabel = (id) => data.devices.find(d => d.id === id)?.label || id;

  /* ---------- active packs banner ---------- */
  const renderMine = () => {
    const box = $('#cpMine'), mine = user() ? store.get('fp-carepack', []).filter(x => new Date(x.end) > new Date()) : [];
    box.hidden = !mine.length;
    if (!mine.length) return;
    const m = mine[mine.length - 1];
    box.innerHTML = `<span class="ic"><svg width="20" height="20"><use href="#i-shield"/></svg></span>
      <div><b>Your ${esc(m.name)} Care Pack is active</b><span>${esc(devLabel(m.device))}${m.model ? ' · ' + esc(m.model) : ''} · valid till <em>${fmtDate(m.end)}</em>${mine.length > 1 ? ` · +${mine.length - 1} more` : ''}</span></div>
      <a href="repair.html" class="btn btn--sm btn--ghost">Book a visit</a>`;
  };

  /* ---------- device chips + cards ---------- */
  const renderDevices = () => {
    $('#cpDevices').innerHTML = data.devices.map(d => `<button type="button" role="radio" aria-checked="${d.id === device}" class="cp-dev${d.id === device ? ' on' : ''}" data-dev="${esc(d.id)}"><svg width="18" height="18" aria-hidden="true"><use href="#${esc(d.icon)}"/></svg>${esc(d.label)}</button>`).join('');
  };

  const card = (p) => {
    const price = p.prices?.[device], mrp = p.mrp?.[device];
    const off = price != null && mrp > price ? Math.round((1 - price / mrp) * 100) : 0;
    return `<article class="cp-pack${p.style ? ' cp-pack--' + esc(p.style) : ''}${price == null ? ' cp-pack--na' : ''}">
      ${p.badge ? `<span class="cp-badge">${esc(p.badge)}</span>` : ''}
      <header><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p></header>
      <div class="cp-price">${price == null ? `<b class="cp-na">Not offered for ${esc(devLabel(device).toLowerCase())}s</b>`
        : `<b>${inr(price)}</b><span>/ ${p.months === 12 ? 'year' : p.months + ' months'}</span>${off ? `<s>${inr(mrp)}</s><em>${off}% off</em>` : ''}`}</div>
      <small class="cp-tax">+ ${data.gst}% GST · ${esc(devLabel(device))}</small>
      <ul class="cp-hl">${(p.highlights || []).map(h => `<li><svg width="18" height="18" aria-hidden="true"><use href="#${esc(h.icon)}"/></svg><span>${h.text}</span></li>`).join('')}</ul>
      <ul class="cp-feat">${(p.features || []).map(f => `<li><svg width="16" height="16" aria-hidden="true"><use href="#i-check"/></svg>${esc(f)}</li>`).join('')}</ul>
      <button type="button" class="btn cp-buy${p.style === 'featured' ? '' : ' btn--ghost'}" data-buy="${esc(p.id)}"${price == null ? ' disabled' : ''}>Buy Pack <svg class="arrow" width="18" height="18"><use href="#i-arrow"/></svg></button>
    </article>`;
  };

  const renderPacks = () => {
    const list = packs();
    $('#cpPacks').style.setProperty('--n', Math.min(list.length, 4) || 1);
    $('#cpPacks').innerHTML = list.length ? list.map(card).join('') : '<p class="cp-err">New Care Packs are on the way. Call <a href="tel:+918696544448">+91 86965 44448</a> to know more.</p>';
    const low = list.map(p => p.prices?.[device]).filter(v => v != null).sort((a, b) => a - b)[0];
    $$('[data-cp-from]').forEach(el => el.textContent = low != null ? inr(low) : '—');
  };

  $('#cpDevices').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dev]'); if (!b) return;
    device = b.dataset.dev; renderDevices(); renderPacks();
    $(`[data-dev="${device}"]`)?.focus();
  });
  $('#cpDevices').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const i = data.devices.findIndex(d => d.id === device), n = data.devices.length;
    device = data.devices[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id;
    renderDevices(); renderPacks(); $(`[data-dev="${device}"]`)?.focus(); e.preventDefault();
  });

  /* ---------- buy dialog ---------- */
  const dlg = $('#cpBuy');
  let opener = null, picked = null;
  const view = (name) => $$('[data-view]', dlg).forEach(v => v.hidden = v.dataset.view !== name);

  const openBuy = (id) => {
    const p = packs().find(x => x.id === id), price = p?.prices?.[device];
    if (!p || price == null) return;
    if (!user()) {
      const next = new URL(location.href); next.searchParams.set('buy', id); next.searchParams.set('device', device); next.hash = 'packs';
      return window.FPAuth?.open ? window.FPAuth.open(next.toString()) : (location.href = 'account.html');
    }
    picked = { pack: p, device, price };
    const u = user(), start = new Date(), end = addMonths(start, p.months), tax = gstOf(price), half = Math.round(tax / 2);
    $('#cpBuyTitle').textContent = `Buy ${p.name} Care Pack`;
    $('#cpSum').innerHTML = `
      <div class="cp-sum-pack"><span class="ic"><svg width="22" height="22"><use href="#i-shield"/></svg></span><div><b>${esc(p.name)} · ${esc(devLabel(device))}</b><small>${(p.highlights || []).map(h => h.text.replace(/<[^>]+>/g, '')).slice(0, 2).map(esc).join(' · ')}</small></div></div>
      <label class="cp-f"><span>Device brand and model <small>(optional)</small></span><input id="cpModel" type="text" maxlength="60" placeholder="e.g. Dell Latitude 5420" autocomplete="off"></label>
      <dl class="cp-rows">
        <div><dt>Valid</dt><dd>${fmtDate(start)} – ${fmtDate(end)}<small>${p.months} months</small></dd></div>
        <div><dt>Pack price</dt><dd>${inr(price)}</dd></div>
        <div><dt>CGST (${data.gst / 2}%)</dt><dd>${inr(half)}</dd></div>
        <div><dt>SGST (${data.gst / 2}%)</dt><dd>${inr(tax - half)}</dd></div>
        <div class="tot"><dt>Total payable</dt><dd>${inr(price + tax)}</dd></div>
      </dl>
      <div class="cp-bill">${u.gst ? `<svg width="18" height="18"><use href="#i-check"/></svg><span>GST invoice to <b>${esc(u.firm || u.name || '')}</b> · ${esc(u.gst)}.</span>`
        : `<svg width="18" height="18"><use href="#i-tag"/></svg><span>Buying for a business? <button type="button" data-gst-flow>Add your GSTIN</button> to get a GST invoice.</span>`}</div>
      <p class="cp-small">Billed to ${esc(u.name || 'you')}${u.mobile ? ' · +91 ' + esc(u.mobile) : ''}. Payment is processed securely.</p>`;
    $('#cpPayGo').innerHTML = `<svg width="18" height="18"><use href="#i-shield"/></svg>Pay ${inr(price + tax)} securely`;
    view('sum');
    opener = document.activeElement;
    dlg.hidden = false; document.body.classList.add('cp-lock');
    requestAnimationFrame(() => dlg.classList.add('in'));
    $('#cpPayGo').focus();
  };
  const closeBuy = () => {
    if (!dlg.querySelector('[data-view="pay"]').hidden) return;
    dlg.classList.remove('in'); dlg.hidden = true; document.body.classList.remove('cp-lock'); opener?.focus?.();
  };

  $('#cpPayGo').addEventListener('click', () => {
    const { pack: p, device: dev, price } = picked, total = price + gstOf(price), model = ($('#cpModel')?.value || '').trim();
    let order = null;
    view('pay');
    API.createOrder(p, dev, total).then(o => { order = o; return API.pay(o); }).then(res => {
      if (res.status !== 'success' && res.status !== 'pending') throw new Error('Payment failed');
      const start = new Date(), end = addMonths(start, p.months);
      store.set('fp-carepack', [...store.get('fp-carepack', []), { id: p.id, name: p.name, device: dev, model, start: start.toISOString(), end: end.toISOString(), order: order.orderNumber }]);
      $('#cpDone').innerHTML = `
        <span class="cp-done-ic"><svg width="30" height="30"><use href="#i-check"/></svg></span>
        <h2>Your ${esc(p.name)} Care Pack is active</h2>
        <p>Your invoice is on its way to your registered number. Book your first visit whenever you’re ready.</p>
        <dl class="cp-rows">
          <div><dt>Order number</dt><dd>${esc(order.orderNumber)}</dd></div>
          <div><dt>Device</dt><dd>${esc(devLabel(dev))}${model ? `<small>${esc(model)}</small>` : ''}</dd></div>
          <div><dt>Transaction ID</dt><dd class="mono">${esc(res.paymentId)}</dd></div>
          <div><dt>Amount paid</dt><dd>${inr(order.amount)}</dd></div>
          <div class="tot"><dt>Valid till</dt><dd>${fmtDate(end)}</dd></div>
        </dl>
        <div class="cp-dialog-act"><button type="button" class="btn btn--ghost" data-close>Done</button><a href="repair.html" class="btn">Book first visit</a></div>`;
      view('done'); renderMine();
      $('#cpDone [data-close]').focus();
    }).catch(err => {
      $('#cpFail').innerHTML = `<span class="cp-done-ic cp-done-ic--bad"><svg width="30" height="30"><use href="#i-close"/></svg></span><h2>Payment failed</h2><p>${esc(err?.message || 'Your payment didn’t go through.')} No money was taken. If it was, it’s refunded within 5–7 days.</p><div class="cp-dialog-act"><button type="button" class="btn btn--ghost" data-close>Close</button><button type="button" class="btn" data-retry>Try again</button></div>`;
      view('fail');
    });
  });

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) closeBuy();
    else if (e.target.closest('[data-retry]')) $('#cpPayGo').click();
    else if (e.target.closest('[data-gst-flow]') && window.FPGstBoard?.open) { closeBuy(); window.FPGstBoard.open(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) closeBuy(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-buy]'); if (b && !b.disabled) openBuy(b.dataset.buy); });

  // FAQ: one open at a time
  $$('.cp-faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.cp-faq details').forEach(x => x !== d && (x.open = false)); }));

  let wasIn = !!user();
  setInterval(() => { const now = !!user(); if (now !== wasIn) { wasIn = now; renderMine(); } }, 1000);

  /* ---------- boot ---------- */
  $('#cpPacks').innerHTML = Array.from({ length: 3 }, () => '<div class="cp-pack cp-pack--sk" aria-hidden="true"></div>').join('');
  API.packs().then(d => {
    data = Object.assign({ gst: 18, devices: [], packs: [] }, d);
    const want = params.get('device');
    device = data.devices.some(x => x.id === want) ? want : (data.devices[0]?.id || '');
    renderDevices(); renderPacks(); renderMine();
    const buy = params.get('buy');
    if (buy && user()) {
      const u = new URL(location.href); u.searchParams.delete('buy'); history.replaceState(null, '', u);
      openBuy(buy);
    }
  }).catch(() => { $('#cpPacks').innerHTML = '<p class="cp-err">Couldn’t load the packs. Please refresh, or call <a href="tel:+918696544448">+91 86965 44448</a>.</p>'; });
})();
