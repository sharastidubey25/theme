/* FixPapa · Set 5 · AMC (amc.html), the live fixpapa.com/annual-maintenance-plan flow.
   Plans: the live amc-plans API response (id, plan_name, slug, valid_for months, price before tax, cgst, sgst, plan_details),
   labels from the live Enums.AMCPlans; total = price × (1 + (cgst + sgst) / 100) like the live createOrder.
   Choose plan (signed out → login popup, then back with ?buy=slug) → summary (validity, CGST, SGST, total, GST invoice) →
   pay → order placed (order number, transaction ID, amount, status, AMC end date). Active plan is kept in localStorage
   'fp-amc'; cards then show Current plan / Upgrade plan and a banner shows the expiry date (live: user.amc_status / amc_end_on).
   Quote builder (#quote): device counts + branches + visit time → recommended plan (or a custom quote above 100 devices),
   then a quote request with a reference number. Demo unless window.FPAmcApi = { plans(), createOrder(plan, total),
   pay(order), requestQuote(request) } is defined (live: getAllAMCs, generateRazorpayOrderID → Razorpay → verifyOrderStatus). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (!$('#amcPlans')) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const store = {
    get(k, f) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  };
  const user = () => { try { return window.FPAuth?.user?.() || null; } catch (e) { return null; } };

  const LABEL = {
    TotalServiceCalls: 'Total service calls', CoveredGadgets: 'Gadgets covered', AdditionalChargePerCall: 'Additional charge per call',
    CoveredDevices: 'Number of devices covered', EngineerVisitTime: 'Engineer visit time (business hours)', OnSiteSupport: 'On-site support',
    DiscountOnRefurbished: 'Discount on refurbished products', AdditionalTenure: 'Additional tenure', HealthReport: 'Health report of all devices',
    ReportHistory: 'Report history of all services', MultiLocationInSameCity: 'Multi-location cover in the same city', DedicatedEngineer: 'Dedicated engineer for your calls',
  };
  const BOOL = ['OnSiteSupport', 'DiscountOnRefurbished', 'HealthReport', 'ReportHistory', 'MultiLocationInSameCity', 'DedicatedEngineer'];
  const yes = (v) => v === true || v === 'true';

  // live amc-plans response (api.fixpapa.com/v1/customer/amc/amc-plans), "Unites" typo cleaned
  const PLANS = [
    { id: 4, plan_name: 'Gold', slug: 'gold', valid_for: 15, price: 49999, cgst: 9, sgst: 9, free_service_calls: 50, covered_device_units: 100, plan_details: { HealthReport: 'true', OnSiteSupport: 'true', ReportHistory: 'true', CoveredDevices: 'Up to 100 units', CoveredGadgets: 'Laptop, Desktop, Printer, CCTV, Biometric, Wi-Fi, LAN, Router, Server', AdditionalTenure: '3 Months, Total duration 15 Months', DedicatedEngineer: 'true', EngineerVisitTime: 'within 12 Hours', TotalServiceCalls: '50 service calls', DiscountOnRefurbished: 'true', AdditionalChargePerCall: '400', MultiLocationInSameCity: 'true' } },
    { id: 3, plan_name: 'Silver', slug: 'silver', valid_for: 14, price: 25999, cgst: 9, sgst: 9, free_service_calls: 25, covered_device_units: 50, plan_details: { HealthReport: 'true', OnSiteSupport: 'true', ReportHistory: 'true', CoveredDevices: 'Up to 50 units', CoveredGadgets: 'Laptop, Desktop, Printer, CCTV, Biometric, Wi-Fi, LAN, Router', AdditionalTenure: '2 Months, Total duration 14 Months', DedicatedEngineer: 'false', EngineerVisitTime: 'within 24 Hours', TotalServiceCalls: '25 service calls', DiscountOnRefurbished: 'true', AdditionalChargePerCall: '425', MultiLocationInSameCity: 'true' } },
    { id: 2, plan_name: 'Bronze', slug: 'bronze', valid_for: 13, price: 16999, cgst: 9, sgst: 9, free_service_calls: 12, covered_device_units: 40, plan_details: { HealthReport: 'true', OnSiteSupport: 'true', ReportHistory: 'true', CoveredDevices: 'Up to 40 units', CoveredGadgets: 'Laptop, Desktop, Printer, CCTV, Biometric, Wi-Fi', AdditionalTenure: '1 Months, Total duration 13 Months', DedicatedEngineer: 'false', EngineerVisitTime: 'between 24-48 Hours', TotalServiceCalls: '12 service calls', DiscountOnRefurbished: 'true', AdditionalChargePerCall: '450', MultiLocationInSameCity: 'true' } },
    { id: 1, plan_name: 'Starter', slug: 'starter', valid_for: 12, price: 4999, cgst: 9, sgst: 9, free_service_calls: 4, covered_device_units: 10, plan_details: { HealthReport: 'true', OnSiteSupport: 'true', ReportHistory: 'true', CoveredDevices: 'Up to 10 units', CoveredGadgets: 'Laptop, Desktop, Printer, CCTV', AdditionalTenure: '0 Days', DedicatedEngineer: 'false', EngineerVisitTime: 'Below 48 Hours', TotalServiceCalls: '4 service calls', DiscountOnRefurbished: 'true', AdditionalChargePerCall: '500', MultiLocationInSameCity: 'false' } },
  ];
  const VISIT_HOURS = { starter: 48, bronze: 48, silver: 24, gold: 12 };
  const BADGE = { silver: 'Most popular', gold: 'Best value' };

  const mock = {
    async plans() { await wait(250); return PLANS; },
    async createOrder(plan, total) { await wait(500); return { orderId: 'order_' + Math.random().toString(36).slice(2, 12), orderNumber: 'AMC' + String(Date.now()).slice(-7), amount: total }; },
    async pay(order) { await wait(1600); return { paymentId: 'pay_' + Math.random().toString(36).slice(2, 14), status: 'success', created_at: new Date().toISOString() }; },
    async requestQuote(req) { await wait(900); return { reference: 'AMC-Q-' + String(Date.now()).slice(-6) }; },
  };
  const API = Object.assign({}, mock, window.FPAmcApi || {});

  const tax = (p) => (p.cgst || 0) + (p.sgst || 0);
  const total = (p) => Math.round(p.price * (1 + tax(p) / 100));
  const baseMonths = (p) => p.valid_for - (parseInt(p.plan_details.AdditionalTenure) || 0);
  const bonusMonths = (p) => parseInt(p.plan_details.AdditionalTenure) || 0;
  const gadgets = (p) => String(p.plan_details.CoveredGadgets || '').split(',').map(s => s.trim()).filter(Boolean);
  const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let plans = [], withGst = false;
  const current = () => { const a = store.get('fp-amc', null); return a && user() ? a : null; };
  const status = (a) => a ? (new Date(a.end) > new Date() ? 'active' : 'expired') : '';

  /* ---------------- current plan banner ---------------- */
  const renderCurrent = () => {
    const a = current(), box = $('#amcCurrent');
    if (!a) { box.hidden = true; return; }
    const st = status(a);
    box.hidden = false;
    box.className = `amc-current amc-current--${st}`;
    box.innerHTML = `<span class="ic"><svg width="20" height="20"><use href="#i-${st === 'active' ? 'shield' : 'clock'}"/></svg></span>
      <div><b>${st === 'active' ? `Your ${esc(a.plan_name)} AMC is active` : `Your ${esc(a.plan_name)} AMC has expired`}</b>
      <span>${st === 'active' ? 'Current plan will expire on' : 'Your AMC expired on'} <em>${fmtDate(a.end)}</em>${st === 'active' ? ` · ${a.calls} service calls included` : ''}</span></div>
      <a href="account.html#tickets" class="btn btn--sm btn--ghost">${st === 'active' ? 'Raise a service call' : 'See past calls'}</a>`;
  };

  /* ---------------- plan cards ---------------- */
  const button = (p) => {
    const a = current(), st = status(a);
    if (st === 'active') {
      const cur = plans.find(x => x.id === a.plan_id);
      if (p.id === a.plan_id) return `<button type="button" class="btn amc-btn" disabled><svg width="18" height="18"><use href="#i-check"/></svg>Current plan</button>`;
      if (cur && p.price < cur.price) return `<button type="button" class="btn btn--ghost amc-btn" disabled>Included in your plan</button>`;
      return `<button type="button" class="btn amc-btn" data-buy="${p.slug}">Upgrade plan <svg class="arrow" width="18" height="18"><use href="#i-arrow"/></svg></button>`;
    }
    return `<button type="button" class="btn amc-btn${p.slug === 'silver' ? '' : ' btn--ghost'}" data-buy="${p.slug}">${st === 'expired' && p.id === a.plan_id ? 'Renew plan' : 'Choose plan'} <svg class="arrow" width="18" height="18"><use href="#i-arrow"/></svg></button>`;
  };

  const card = (p) => {
    const d = p.plan_details;
    const shown = withGst ? total(p) : p.price;
    return `<article class="amc-plan${BADGE[p.slug] ? ' amc-plan--' + p.slug : ''}">
      ${BADGE[p.slug] ? `<span class="amc-badge">${BADGE[p.slug]}</span>` : ''}
      <h3>${esc(p.plan_name)}</h3>
      <div class="amc-price"><b>${inr(shown)}</b><span>${withGst ? 'incl. 18% GST' : 'excluding taxes'}</span></div>
      <p class="amc-term"><b>${baseMonths(p)} months</b>${bonusMonths(p) ? `<em>+${bonusMonths(p)} month${bonusMonths(p) > 1 ? 's' : ''} free</em>` : ''}</p>
      <ul class="amc-keys">
        <li><svg width="18" height="18"><use href="#i-wrench"/></svg><span><b>${p.free_service_calls}</b> service calls</span></li>
        <li><svg width="18" height="18"><use href="#i-laptop"/></svg><span>Up to <b>${p.covered_device_units}</b> devices</span></li>
        <li><svg width="18" height="18"><use href="#i-clock"/></svg><span>Engineer ${esc(d.EngineerVisitTime.toLowerCase())}</span></li>
      </ul>
      <div class="amc-gad">${gadgets(p).map(g => `<span>${esc(g)}</span>`).join('')}</div>
      <ul class="amc-feat">${BOOL.map(k => `<li class="${yes(d[k]) ? 'y' : 'n'}"><svg width="16" height="16"><use href="#i-${yes(d[k]) ? 'check' : 'close'}"/></svg>${LABEL[k]}</li>`).join('')}
        <li class="y"><svg width="16" height="16"><use href="#i-tag"/></svg>Extra calls ${inr(+d.AdditionalChargePerCall)} each</li></ul>
      ${button(p)}
    </article>`;
  };

  const renderPlans = () => {
    $('#amcPlans').innerHTML = plans.map(card).join('');
    $('#amcCompare').innerHTML = `<table><thead><tr><th scope="col">Feature</th>${plans.map(p => `<th scope="col">${esc(p.plan_name)}</th>`).join('')}</tr></thead><tbody>
      <tr><th scope="row">Price (excl. GST)</th>${plans.map(p => `<td><b>${inr(p.price)}</b></td>`).join('')}</tr>
      <tr><th scope="row">Price (incl. 18% GST)</th>${plans.map(p => `<td>${inr(total(p))}</td>`).join('')}</tr>
      <tr><th scope="row">Validity</th>${plans.map(p => `<td>${p.valid_for} months</td>`).join('')}</tr>
      ${Object.keys(LABEL).map(k => `<tr><th scope="row">${LABEL[k]}</th>${plans.map(p => {
        const v = p.plan_details[k];
        if (BOOL.includes(k)) return `<td><svg class="${yes(v) ? 'y' : 'n'}" width="18" height="18" aria-label="${yes(v) ? 'Yes' : 'No'}"><use href="#i-${yes(v) ? 'check' : 'close'}"/></svg></td>`;
        if (k === 'AdditionalChargePerCall') return `<td>${inr(+v)}</td>`;
        if (k === 'AdditionalTenure') return `<td>${bonusMonths(p) ? `+${bonusMonths(p)} months` : '—'}</td>`;
        return `<td>${esc(v)}</td>`;
      }).join('')}</tr>`).join('')}
    </tbody></table>`;
  };

  $('#amcGst').addEventListener('change', (e) => { withGst = e.target.checked; renderPlans(); });

  /* ---------------- quote builder ---------------- */
  const DEVICES = [
    { key: 'Laptop', icon: 'i-laptop' }, { key: 'Desktop', icon: 'i-desktop' }, { key: 'Printer', icon: 'i-printer' },
    { key: 'CCTV', icon: 'i-cctv' }, { key: 'Biometric', icon: 'i-finger' }, { key: 'Wi-Fi', label: 'Wi-Fi / Router', icon: 'i-wifi', also: ['Router'] },
    { key: 'LAN', label: 'LAN / Switch', icon: 'i-network' }, { key: 'Server', icon: 'i-server' },
  ];
  const q = { counts: { Laptop: 10, Desktop: 5, Printer: 2 }, branches: '1', visit: '48' };

  const recommend = () => {
    const used = DEVICES.filter(d => q.counts[d.key] > 0);
    const totalUnits = used.reduce((s, d) => s + q.counts[d.key], 0);
    if (!totalUnits) return { totalUnits, plan: null, why: 'Add your devices to see a plan.' };
    if (totalUnits > 100) return { totalUnits, plan: null, custom: true, why: `${totalUnits} devices is more than our largest plan covers. We’ll put together a custom contract.` };
    const fits = [...plans].sort((a, b) => a.price - b.price).filter(p => {
      const g = gadgets(p);
      return p.covered_device_units >= totalUnits
        && used.every(d => g.includes(d.key) || (d.also || []).some(x => g.includes(x)))
        && VISIT_HOURS[p.slug] <= +q.visit
        && (q.branches === '1' || yes(p.plan_details.MultiLocationInSameCity));
    });
    const plan = fits[0] || null;
    if (!plan) return { totalUnits, plan: null, custom: true, why: 'Your mix of devices and visit time needs a custom contract.' };
    const reasons = [`covers up to ${plan.covered_device_units} devices`];
    if (used.some(d => ['Server', 'LAN'].includes(d.key))) reasons.push('includes servers and networking');
    if (q.branches !== '1') reasons.push('covers several branches in one city');
    if (+q.visit < 48) reasons.push(`engineer ${plan.plan_details.EngineerVisitTime.toLowerCase()}`);
    return { totalUnits, plan, why: `It ${reasons.join(', ')}.` };
  };

  const renderCounters = () => {
    $('#amcDevices').innerHTML = DEVICES.map(d => `<div class="amc-ctr${q.counts[d.key] ? ' on' : ''}">
      <span class="ic"><svg width="20" height="20"><use href="#${d.icon}"/></svg></span><b id="amcL-${d.key}">${d.label || d.key}</b>
      <div class="amc-step" role="group" aria-labelledby="amcL-${d.key}">
        <button type="button" data-dev="${d.key}" data-d="-1" aria-label="Fewer ${d.label || d.key}"${q.counts[d.key] ? '' : ' disabled'}>−</button>
        <input type="number" inputmode="numeric" min="0" max="999" value="${q.counts[d.key] || 0}" data-devin="${d.key}" aria-label="Number of ${d.label || d.key}">
        <button type="button" data-dev="${d.key}" data-d="1" aria-label="More ${d.label || d.key}">+</button>
      </div></div>`).join('');
  };

  const renderRec = () => {
    const r = recommend();
    $('#amcTotal').textContent = r.totalUnits;
    const box = $('#amcRec');
    if (r.plan) {
      const p = r.plan;
      box.innerHTML = `<small>Recommended for you</small><h3>${esc(p.plan_name)} plan</h3>
        <div class="amc-rec-price"><b>${inr(p.price)}</b><span>+ GST · ${p.valid_for} months</span></div>
        <p>${esc(r.why)}</p>
        <ul><li><b>${p.free_service_calls}</b> service calls</li><li><b>${r.totalUnits}</b> of ${p.covered_device_units} devices used</li><li>Extra calls <b>${inr(+p.plan_details.AdditionalChargePerCall)}</b></li></ul>
        ${button(p).replace('amc-btn', 'amc-btn amc-btn--rec')}`;
    } else {
      box.innerHTML = `<small>${r.custom ? 'Custom quote' : 'Recommended for you'}</small><h3>${r.custom ? 'Enterprise AMC' : 'Tell us what you have'}</h3><p>${esc(r.why)}</p>${r.custom ? '<p class="amc-rec-note">Send the form and our AMC team will call you within one working day.</p>' : ''}`;
    }
  };

  const setCount = (key, n) => { q.counts[key] = Math.max(0, Math.min(999, n | 0)); };
  $('#amcDevices').addEventListener('click', (e) => {
    const b = e.target.closest('[data-dev]'); if (!b) return;
    setCount(b.dataset.dev, (q.counts[b.dataset.dev] || 0) + +b.dataset.d);
    renderCounters(); renderRec();
    $(`[data-dev="${b.dataset.dev}"][data-d="${b.dataset.d}"]`)?.focus();
  });
  $('#amcDevices').addEventListener('change', (e) => {
    const i = e.target.closest('[data-devin]'); if (!i) return;
    setCount(i.dataset.devin, +i.value); renderCounters(); renderRec();
  });
  $('#amcQuoteOpts').addEventListener('change', (e) => {
    if (e.target.name === 'amcBranches') q.branches = e.target.value;
    if (e.target.name === 'amcVisit') q.visit = e.target.value;
    renderRec();
  });

  const form = $('#amcQuoteForm');
  const field = (name) => form.elements[name];
  const bad = (name, on) => field(name).closest('.amc-f').classList.toggle('bad', on);
  form.addEventListener('input', (e) => e.target.closest('.amc-f')?.classList.remove('bad'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = field('name').value.trim(), mobile = field('mobile').value.replace(/\D/g, ''), email = field('email').value.trim(), city = field('city').value.trim();
    let ok = true;
    if (name.length < 2) { bad('name', true); ok = false; }
    if (!/^[6-9]\d{9}$/.test(mobile)) { bad('mobile', true); ok = false; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { bad('email', true); ok = false; }
    if (city.length < 2) { bad('city', true); ok = false; }
    if (!ok) { form.querySelector('.bad input')?.focus(); return; }
    const r = recommend();
    const btn = form.querySelector('[type="submit"]'); btn.disabled = true; btn.classList.add('loading');
    API.requestQuote({ name, firm: field('firm').value.trim(), mobile, email, city, devices: q.counts, totalDevices: r.totalUnits, branches: q.branches, visitWithinHours: +q.visit, recommendedPlan: r.plan?.slug || 'custom' })
      .then(res => {
        $('#amcQuoteDone').hidden = false;
        $('#amcQuoteDone').innerHTML = `<span class="ic"><svg width="22" height="22"><use href="#i-check"/></svg></span><div><b>Quote request sent</b><span>Reference <em>${esc(res.reference)}</em>. Our AMC team will call ${esc(name.split(' ')[0])} on +91 ${mobile.slice(0, 5)} ${mobile.slice(5)} within one working day.</span></div>`;
        form.hidden = true;
        $('#amcQuoteDone').focus();
      })
      .catch(err => toast(err?.message || 'Couldn’t send your request. Please try again.'))
      .finally(() => { btn.disabled = false; btn.classList.remove('loading'); });
  });
  const prefill = () => { const u = user(); if (!u) return; if (u.name && !field('name').value) field('name').value = u.name; if (u.mobile && !field('mobile').value) field('mobile').value = u.mobile; if (u.firm && !field('firm').value) field('firm').value = u.firm; };

  /* ---------------- buy dialog ---------------- */
  const dlg = $('#amcBuy');
  let opener = null, picked = null, order = null;
  const view = (name) => $$('[data-view]', dlg).forEach(v => v.hidden = v.dataset.view !== name);

  const openBuy = (slug) => {
    const p = plans.find(x => x.slug === slug); if (!p) return;
    if (!user()) {
      const next = new URL(location.href); next.searchParams.set('buy', slug); next.hash = 'plans';
      return window.FPAuth?.open ? window.FPAuth.open(next.toString()) : (location.href = 'account.html');
    }
    picked = p; order = null;
    const u = user(), start = new Date(), end = addMonths(start, p.valid_for);
    const cg = Math.round(p.price * p.cgst / 100), sg = Math.round(p.price * p.sgst / 100);
    $('#amcBuyTitle').textContent = `${status(current()) === 'active' ? 'Upgrade to' : 'Buy'} ${p.plan_name} AMC`;
    $('#amcSum').innerHTML = `
      <div class="amc-sum-plan"><span class="ic"><svg width="22" height="22"><use href="#i-shield"/></svg></span><div><b>${esc(p.plan_name)} plan</b><small>${p.free_service_calls} service calls · up to ${p.covered_device_units} devices</small></div></div>
      <dl class="amc-rows">
        <div><dt>Valid</dt><dd>${fmtDate(start)} – ${fmtDate(end)}<small>${p.valid_for} months${bonusMonths(p) ? `, incl. ${bonusMonths(p)} free` : ''}</small></dd></div>
        <div><dt>Plan price</dt><dd>${inr(p.price)}</dd></div>
        <div><dt>CGST (${p.cgst}%)</dt><dd>${inr(cg)}</dd></div>
        <div><dt>SGST (${p.sgst}%)</dt><dd>${inr(sg)}</dd></div>
        <div class="tot"><dt>Total payable</dt><dd>${inr(p.price + cg + sg)}</dd></div>
      </dl>
      <div class="amc-bill">${u.gst ? `<svg width="18" height="18"><use href="#i-check"/></svg><span>GST invoice to <b>${esc(u.firm || u.name || '')}</b> · ${esc(u.gst)}. Claim the GST back as input tax credit.</span>`
        : `<svg width="18" height="18"><use href="#i-tag"/></svg><span>Buying for a business? <button type="button" data-gst-flow>Add your GSTIN</button> to get a GST invoice and claim ${inr(cg + sg)} back.</span>`}</div>
      <p class="amc-small">Billed to ${esc(u.name || 'you')} · +91 ${esc(u.mobile || '')}. Payment is processed securely by Razorpay.</p>`;
    $('#amcPayGo').innerHTML = `<svg width="18" height="18"><use href="#i-shield"/></svg>Pay ${inr(total(p))} securely`;
    view('sum');
    opener = document.activeElement;
    dlg.hidden = false; document.body.classList.add('amc-lock');
    requestAnimationFrame(() => dlg.classList.add('in'));
    $('#amcPayGo').focus();
  };
  const closeBuy = () => {
    if (!dlg.querySelector('[data-view="pay"]').hidden) return; // can't close mid-payment
    dlg.classList.remove('in'); dlg.hidden = true; document.body.classList.remove('amc-lock'); opener?.focus?.();
  };

  $('#amcPayGo').addEventListener('click', () => {
    const p = picked; view('pay');
    API.createOrder(p, total(p)).then(o => { order = o; return API.pay(o); }).then(res => {
      if (res.status !== 'success' && res.status !== 'pending') throw new Error('Payment failed');
      const start = new Date(), end = addMonths(start, p.valid_for);
      store.set('fp-amc', { plan_id: p.id, plan_name: p.plan_name, start: start.toISOString(), end: end.toISOString(), calls: p.free_service_calls, order: order.orderNumber });
      $('#amcDone').innerHTML = `
        <span class="amc-done-ic"><svg width="30" height="30"><use href="#i-check"/></svg></span>
        <h2 id="amcDoneTitle">Your ${esc(p.plan_name)} AMC is active</h2>
        <p>We’ve sent the invoice to your registered number. An engineer will call to schedule the first device audit.</p>
        <dl class="amc-rows">
          <div><dt>Order number</dt><dd>${esc(order.orderNumber)}</dd></div>
          <div><dt>Transaction ID</dt><dd class="mono">${esc(res.paymentId)}</dd></div>
          <div><dt>Order placed at</dt><dd>${new Date(res.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd></div>
          <div><dt>Total order amount</dt><dd>${inr(order.amount)}</dd></div>
          <div><dt>Payment status</dt><dd class="ok">${res.status === 'pending' ? 'Pending' : 'Paid'}</dd></div>
          <div class="tot"><dt>AMC valid till</dt><dd>${fmtDate(end)}</dd></div>
        </dl>
        <div class="amc-dialog-act"><a href="account.html#tickets" class="btn btn--ghost">Raise a service call</a><button type="button" class="btn" data-close>Done</button></div>`;
      view('done');
      renderCurrent(); renderPlans(); renderRec();
      $('#amcDone [data-close]').focus();
    }).catch(err => {
      $('#amcFail').innerHTML = `<span class="amc-done-ic amc-done-ic--bad"><svg width="30" height="30"><use href="#i-close"/></svg></span><h2>Payment failed</h2><p>${esc(err?.message || 'Your payment didn’t go through.')} No money was taken. If it was, it’s refunded within 5–7 days.</p><div class="amc-dialog-act"><button type="button" class="btn btn--ghost" data-close>Close</button><button type="button" class="btn" data-retry>Try again</button></div>`;
      view('fail');
    });
  });

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) closeBuy();
    else if (e.target.closest('[data-retry]')) $('#amcPayGo').click();
    else if (e.target.closest('[data-gst-flow]') && window.FPGstBoard?.open) { closeBuy(); window.FPGstBoard.open(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) closeBuy(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-buy]'); if (b) openBuy(b.dataset.buy); });

  const toast = (msg) => {
    const t = $('#amcToast'); t.textContent = msg; t.hidden = false; t.classList.add('in');
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.hidden = true, 300); }, 2800);
  };

  // FAQ: one open at a time
  $$('.amc-faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.amc-faq details').forEach(x => x !== d && (x.open = false)); }));

  // sign-in / sign-out from the header popup updates the buttons
  let wasIn = !!user();
  setInterval(() => { const now = !!user(); if (now !== wasIn) { wasIn = now; renderCurrent(); renderPlans(); renderRec(); prefill(); } }, 1000);

  /* ---------------- boot ---------------- */
  $('#amcPlans').innerHTML = Array.from({ length: 4 }, () => '<div class="amc-plan amc-plan--sk" aria-hidden="true"></div>').join('');
  renderCounters();
  API.plans().then(list => {
    plans = [...list].sort((a, b) => a.price - b.price);
    $$('[data-amc-from]').forEach(el => el.textContent = inr(plans[0].price));
    renderCurrent(); renderPlans(); renderRec(); prefill();
    const buy = new URLSearchParams(location.search).get('buy');
    if (buy && user()) {
      const u = new URL(location.href); u.searchParams.delete('buy'); history.replaceState(null, '', u);
      openBuy(buy);
    }
  }).catch(() => { $('#amcPlans').innerHTML = '<p class="amc-err">Couldn’t load the plans. Please refresh, or call <a href="tel:+918696544448">+91 86965 44448</a>.</p>'; });
})();
