/* FixPapa · Set 5 · Technical support: engineer list (technical-support.html). Needs support-data.js (window.FPSupport)
   and auth.js (window.FPAuth). URL state: ?q=&exp=&rating=&loc=&online=1&page=&issue=printer|wifi|virus|software.
   Each card's button follows the live site's rules: offline → Not available; chatting with someone else → Engineer busy;
   your open chat → Resume chat; signed in with less than rate × 5 in the wallet → Add money; otherwise Start chat
   (signed out → login popup). Start chat confirms, opens the chat and goes to technical-support-chat.html?chat=ID. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FP = window.FPSupport;
  if (!FP || !$('#tsGrid')) return;
  const { inr, MIN_MINUTES, ISSUES } = FP;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PER_PAGE = 6;

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '', exp: params.get('exp') || '', rating: params.get('rating') || '',
    loc: params.get('loc') || '', online: params.get('online') === '1', page: +params.get('page') || 1,
    issue: ISSUES[params.get('issue')] ? params.get('issue') : '',
  };
  let wallet = null, items = [], req = 0;

  const syncUrl = () => {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q); if (state.exp) p.set('exp', state.exp); if (state.rating) p.set('rating', state.rating);
    if (state.loc) p.set('loc', state.loc); if (state.online) p.set('online', '1'); if (state.page > 1) p.set('page', state.page);
    if (state.issue) p.set('issue', state.issue);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash);
  };

  /* ---------------- wallet strip ---------------- */
  const renderWallet = () => {
    const box = $('#tsWallet');
    if (!FP.signedIn()) {
      box.innerHTML = `<span class="ts-wallet-ic"><svg width="20" height="20"><use href="#i-user"/></svg></span><div><b>Log in to start a chat</b><span>Chats are paid from your FixPapa wallet, per minute.</span></div><button type="button" class="btn btn--sm" data-ts-login>Log in</button>`;
      return;
    }
    const amount = wallet?.amount ?? 0;
    box.innerHTML = `<span class="ts-wallet-ic"><svg width="20" height="20"><use href="#i-tag"/></svg></span><div><b>Wallet balance <em>${inr(amount)}</em></b><span>A chat needs ${MIN_MINUTES} minutes of the expert’s rate in your wallet to start.</span></div><button type="button" class="btn btn--sm btn--ghost" data-ts-topup>Add money</button>`;
  };
  const loadWallet = () => FP.signedIn() ? FP.wallet().then(w => { wallet = w; renderWallet(); renderGrid(); }).catch(() => renderWallet()) : (wallet = null, renderWallet());

  /* ---------------- engineer cards ---------------- */
  const initials = (name) => name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = (id) => [24, 210, 160, 280, 340, 45, 190, 120][id % 8];

  // same decision tree as the live card footer (pages/technical-support/index.js)
  const cardState = (e) => {
    const me = FP.signedIn();
    if (!e.is_available_for_chat) return 'offline';
    const c = e.current_chat;
    if (c && (c.status === 'pending' || c.status === 'active')) return c.customer_id === -1 ? 'busy' : me ? 'resume' : 'start';
    if (me && (wallet?.amount ?? 0) < e.chat_charges * MIN_MINUTES) return 'low';
    return 'start';
  };

  const action = (e, st) => {
    const need = e.chat_charges * MIN_MINUTES;
    switch (st) {
      case 'offline': return `<span class="ts-act ts-act--off">Not available</span>`;
      case 'busy': return `<span class="ts-act ts-act--busy">Engineer busy</span>`;
      case 'resume': return `<button type="button" class="btn btn--sm ts-act--resume" data-resume="${e.current_chat.id}">Resume chat <svg class="arrow" width="16" height="16"><use href="#i-arrow"/></svg></button>`;
      case 'low': return `<button type="button" class="btn btn--sm btn--ghost" data-topup="${Math.max(need - (wallet?.amount || 0), 1)}">Add ${inr(need - (wallet?.amount || 0))} to chat</button>`;
      default: return `<button type="button" class="btn btn--sm" data-start="${e.id}"><svg width="16" height="16"><use href="#i-headset"/></svg>Start chat</button>`;
    }
  };

  const card = (e) => {
    const st = cardState(e);
    const status = st === 'offline' ? ['off', 'Offline'] : st === 'busy' ? ['busy', 'Busy'] : ['on', 'Online'];
    const match = state.issue && e.engineer_skills.some(s => s.skill_name === ISSUES[state.issue].skill);
    return `<article class="ts-card${st === 'offline' ? ' is-off' : ''}">
      <header class="ts-card-top">
        <span class="ts-av" style="--h:${hue(e.id)}" aria-hidden="true">${esc(initials(e.full_name))}<i class="ts-dot ts-dot--${status[0]}"></i></span>
        <div class="ts-who"><b>${esc(e.full_name)}</b><small>${esc(e.unique_code)}</small></div>
        <span class="ts-rate"><svg width="14" height="14"><use href="#i-star"/></svg>${Number(e.average_ratings).toFixed(1)}</span>
      </header>
      <div class="ts-tags"><span class="ts-pill ts-pill--${status[0]}">${status[1]}</span>${match ? '<span class="ts-pill ts-pill--match">Good match</span>' : ''}</div>
      <p class="ts-about">${esc(e.about)}</p>
      <ul class="ts-facts">
        <li><svg width="16" height="16"><use href="#i-pin"/></svg>${esc(e.city_name)}, ${esc(e.state_name)}</li>
        <li><svg width="16" height="16"><use href="#i-badge"/></svg>${e.total_experience} yr${e.total_experience == 1 ? '' : 's'} experience</li>
        <li><svg width="16" height="16"><use href="#i-user"/></svg>${Number(e.total_calls).toLocaleString('en-IN')}+ customers served</li>
      </ul>
      <div class="ts-skills">${e.engineer_skills.map(s => `<span${match && s.skill_name === ISSUES[state.issue].skill ? ' class="on"' : ''}>${esc(s.skill_name)}</span>`).join('')}</div>
      <footer class="ts-card-foot"><div class="ts-price"><b>${inr(e.chat_charges)}</b><span>/min</span></div>${action(e, st)}</footer>
    </article>`;
  };

  const skeleton = () => Array.from({ length: 4 }, () => `<div class="ts-card ts-card--sk" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`).join('');

  const renderGrid = () => {
    const grid = $('#tsGrid');
    const shown = state.online ? items.filter(e => e.is_available_for_chat) : items;
    grid.innerHTML = shown.length ? shown.map(card).join('') : `<div class="ts-empty"><svg width="28" height="28"><use href="#i-headset"/></svg><b>No experts match these filters</b><p>Try fewer filters, or call support on <a href="tel:+919588841806">+91 95888 41806</a>.</p><button type="button" class="btn btn--sm btn--ghost" data-clear>Clear filters</button></div>`;
  };

  const renderPages = (pg) => {
    const nav = $('#tsPages');
    if (!pg || pg.pageCount <= 1) { nav.innerHTML = ''; return; }
    let html = `<button type="button" data-page="${pg.currentPage - 1}" aria-label="Previous page" ${pg.hasPrevPage ? '' : 'disabled'}><svg width="16" height="16"><use href="#i-chev-l"/></svg></button>`;
    for (let i = 1; i <= pg.pageCount; i++) html += `<button type="button" data-page="${i}"${i === pg.currentPage ? ' aria-current="page"' : ''}>${i}</button>`;
    html += `<button type="button" data-page="${pg.currentPage + 1}" aria-label="Next page" ${pg.hasNextPage ? '' : 'disabled'}><svg width="16" height="16"><use href="#i-chev-r"/></svg></button>`;
    nav.innerHTML = html;
  };

  const renderLocations = (filters) => {
    const box = $('#tsLoc');
    if (!filters?.location?.length || box.dataset.ready) return;
    box.dataset.ready = '1';
    const on = state.loc.split(',');
    box.innerHTML = filters.location.map(l => `<label class="ts-check"><input type="checkbox" value="${esc(l.name)}"${on.includes(l.name) ? ' checked' : ''}><span>${esc(l.name)}</span><small>${l.count}</small></label>`).join('');
  };

  const load = () => {
    const id = ++req;
    syncUrl();
    $('#tsGrid').innerHTML = skeleton();
    $('#tsGrid').setAttribute('aria-busy', 'true');
    FP.engineers({ page: state.page, limit: PER_PAGE, search: state.q, experience: state.exp, rating: state.rating, location: state.loc }).then(res => {
      if (id !== req) return;
      items = res.items || [];
      state.page = res.paginator?.currentPage || 1;
      renderLocations(res.filters);
      renderGrid();
      renderPages(res.paginator);
      const total = res.paginator?.itemCount ?? items.length;
      $('#tsCount').innerHTML = `<b>${total}</b> expert${total === 1 ? '' : 's'}`;
      if (res.online != null) $$('[data-ts-online]').forEach(el => el.textContent = res.online);
    }).catch(err => {
      if (id !== req) return;
      $('#tsGrid').innerHTML = `<div class="ts-empty"><b>Couldn’t load the experts</b><p>${esc(err?.message || 'Please try again in a moment.')}</p><button type="button" class="btn btn--sm" data-retry>Try again</button></div>`;
    }).finally(() => id === req && $('#tsGrid').removeAttribute('aria-busy'));
  };

  /* ---------------- filters ---------------- */
  const syncFilterUi = () => {
    $$('[data-f="exp"] input').forEach(i => i.checked = i.value === state.exp);
    $$('[data-f="rating"] input').forEach(i => i.checked = i.value === state.rating);
    $('#tsOnlineOnly').checked = state.online;
    $$('#tsLoc input').forEach(i => i.checked = state.loc.split(',').includes(i.value));
    $('#tsSearch').value = state.q;
    const n = [state.exp, state.rating, state.loc, state.online].filter(Boolean).length;
    $('#tsFilterCount').textContent = n ? n : '';
  };
  const setF = (changes) => { Object.assign(state, changes, { page: changes.page || 1 }); syncFilterUi(); load(); };

  $('#tsSide').addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'tsOnlineOnly') { state.online = t.checked; syncFilterUi(); syncUrl(); renderGrid(); return; }
    const group = t.closest('[data-f]')?.dataset.f;
    if (group === 'exp' || group === 'rating') setF({ [group]: t.value });
    else if (t.closest('#tsLoc')) setF({ loc: $$('#tsLoc input:checked').map(i => i.value).join(',') });
  });
  let typing;
  $('#tsSearch').addEventListener('input', (e) => { clearTimeout(typing); typing = setTimeout(() => setF({ q: e.target.value.trim() }), 300); });
  const clearAll = () => setF({ q: '', exp: '', rating: '', loc: '', online: false });

  // phone: the sidebar is a drawer
  const side = $('#tsSide');
  const drawer = (open) => { side.classList.toggle('open', open); document.body.classList.toggle('ts-lock', open); $('#tsFilterBtn').setAttribute('aria-expanded', open); if (open) side.querySelector('input')?.focus(); };
  $('#tsFilterBtn').addEventListener('click', () => drawer(true));

  /* ---------------- issue banner (homepage "Common fixes") ---------------- */
  const renderIssue = () => {
    const box = $('#tsIssue');
    if (!state.issue) { box.hidden = true; return; }
    const i = ISSUES[state.issue];
    box.hidden = false;
    box.innerHTML = `<svg width="18" height="18"><use href="#i-wrench"/></svg><span>Help with <b>${esc(i.label)}</b>. Experts who know ${esc(i.skill)} are marked <em>Good match</em>, and your chat will start with this problem filled in.</span><button type="button" aria-label="Remove" data-issue-x><svg width="16" height="16"><use href="#i-close"/></svg></button>`;
  };

  /* ---------------- dialogs ---------------- */
  let opener = null;
  const openModal = (m) => { opener = document.activeElement; m.hidden = false; document.body.classList.add('ts-lock'); requestAnimationFrame(() => m.classList.add('in')); (m.querySelector('[data-focus]') || m.querySelector('button'))?.focus(); };
  const closeModal = (m) => { m.classList.remove('in'); m.hidden = true; document.body.classList.remove('ts-lock'); opener?.focus?.(); };

  const confirmBox = $('#tsConfirm');
  let picked = null;
  const openConfirm = (e) => {
    picked = e;
    const need = e.chat_charges * MIN_MINUTES, bal = wallet?.amount ?? 0;
    $('#tsConfirmBody').innerHTML = `
      <div class="ts-cf-who"><span class="ts-av" style="--h:${hue(e.id)}">${esc(initials(e.full_name))}<i class="ts-dot ts-dot--on"></i></span><div><b>${esc(e.full_name)}</b><small>${esc(e.unique_code)} · ${e.total_experience} yrs · ★ ${Number(e.average_ratings).toFixed(1)}</small></div></div>
      <dl class="ts-cf-rows">
        <div><dt>Chat rate</dt><dd>${inr(e.chat_charges)}/min</dd></div>
        <div><dt>Wallet balance</dt><dd>${inr(bal)}</dd></div>
        <div><dt>Talk time available</dt><dd>${Math.floor(bal / e.chat_charges)} min</dd></div>
      </dl>
      ${state.issue ? `<p class="ts-cf-note"><svg width="16" height="16"><use href="#i-wrench"/></svg>Problem: ${esc(ISSUES[state.issue].label)}</p>` : ''}
      <p class="ts-cf-small">Billing starts when ${esc(e.full_name.split(' ')[0])} joins and stops when you end the chat. Minimum balance to start: ${inr(need)}.</p>`;
    openModal(confirmBox);
  };
  $('#tsConfirmGo').addEventListener('click', (ev) => {
    const b = ev.currentTarget;
    b.disabled = true; b.classList.add('loading');
    FP.initiateChat(picked).then(id => {
      location.href = `technical-support-chat.html?chat=${encodeURIComponent(id)}${state.issue ? '&issue=' + state.issue : ''}`;
    }).catch(err => {
      b.disabled = false; b.classList.remove('loading');
      toast(err?.message || 'Couldn’t start the chat. Please try again.');
    });
  });

  const topBox = $('#tsTopup');
  const openTopup = (min = 0) => {
    const amounts = [100, 250, 500];
    const first = amounts.find(a => a >= min) || Math.ceil(min / 50) * 50;
    $('#tsTopAmounts').innerHTML = [...new Set([first, ...amounts])].sort((a, b) => a - b).slice(0, 4).map(a => `<label class="ts-amt"><input type="radio" name="tsAmt" value="${a}"${a === first ? ' checked' : ''}><span>${inr(a)}</span></label>`).join('');
    $('#tsTopNote').textContent = min ? `Add at least ${inr(min)} to start a chat with this expert.` : 'Money you add stays in your wallet for future chats and orders.';
    $('#tsTopNote').hidden = false;
    openModal(topBox);
  };
  $('#tsTopGo').addEventListener('click', (ev) => {
    const amt = +($('input[name="tsAmt"]:checked', topBox)?.value || 0);
    if (!amt) return;
    if (!FP.isDemo) { location.href = 'account.html#wallet'; return; } // live: top up from the account wallet
    const b = ev.currentTarget; b.disabled = true; b.classList.add('loading');
    FP.addMoney(amt).then(w => { wallet = w; renderWallet(); renderGrid(); closeModal(topBox); toast(`${inr(amt)} added to your wallet`); })
      .finally(() => { b.disabled = false; b.classList.remove('loading'); });
  });

  $$('.ts-modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const m = $('.ts-modal:not([hidden])');
    if (m) closeModal(m); else if (side.classList.contains('open')) drawer(false);
  });

  const toast = (msg) => {
    const t = $('#tsToast'); t.textContent = msg; t.hidden = false; t.classList.add('in');
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.hidden = true, 300); }, 2600);
  };

  const login = () => window.FPAuth?.open ? window.FPAuth.open(location.href) : (location.href = 'account.html');

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button,a');
    if (!t) return;
    if (t.matches('[data-start]')) {
      const eng = items.find(x => x.id == t.dataset.start);
      if (!FP.signedIn()) return login();
      if (eng) openConfirm(eng);
    } else if (t.matches('[data-resume]')) location.href = `technical-support-chat.html?chat=${encodeURIComponent(t.dataset.resume)}`;
    else if (t.matches('[data-topup]')) openTopup(+t.dataset.topup);
    else if (t.matches('[data-ts-topup]')) openTopup(0);
    else if (t.matches('[data-ts-login]')) login();
    else if (t.matches('[data-page]') && !t.disabled) { setF({ page: +t.dataset.page }); $('#tsList').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (t.matches('[data-clear]') || t.matches('#tsClear')) clearAll();
    else if (t.matches('[data-retry]')) load();
    else if (t.matches('[data-issue-x]')) { state.issue = ''; renderIssue(); syncUrl(); renderGrid(); }
    else if (t.matches('[data-side-close]')) drawer(false);
  });

  // signing in elsewhere on the page (login popup) refreshes the wallet and buttons
  window.addEventListener('storage', (e) => { if (e.key === 'fp-auth') loadWallet(); });
  let wasIn = !!FP.signedIn();
  setInterval(() => { const now = !!FP.signedIn(); if (now !== wasIn) { wasIn = now; loadWallet(); renderGrid(); } }, 1000);

  syncFilterUi();
  renderIssue();
  renderWallet();
  loadWallet();
  load();
})();
