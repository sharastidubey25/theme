/* FixPapa · Set 5 · Technical support chat room (technical-support-chat.html?chat=ID[&issue=…]). Needs support-data.js
   and auth.js. Same life cycle as the live chat page: pending (pick device + problem → "Submit info to start chat") →
   active (engineer joined, billing per started minute, time left = wallet ÷ rate, auto-ends at 0) → completed / cancelled
   (summary, then rate the engineer, then "Book a service call"). Polls the chat and its messages every 2 s like the live
   page. history() items are { from: 'customer'|'engineer'|'system', message, image, created_at }. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const FP = window.FPSupport;
  const feed = $('#tcFeed');
  if (!FP || !feed) return;
  const { inr, CATEGORIES, ISSUES } = FP;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const params = new URLSearchParams(location.search);
  const chatID = params.get('chat');
  const issue = ISSUES[params.get('issue')] || null;

  let chat = null, msgs = [], wallet = 0, poll = 0, tick = 0, sig = '', ending = false;
  const pick = { category: issue?.category || '', problem: issue?.problem || '' };
  const review = { ratings: 0, comment: '' };

  const isOpen = () => chat && (chat.status === 'pending' || chat.status === 'active');
  const mins = (ms) => Math.max(1, Math.ceil(ms / 60000));
  const time = (iso) => { try { return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
  const mmss = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
  const initials = (name) => String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ---------------- whole-room states ---------------- */
  const blocked = (title, text, button) => {
    $('#tcRoom').classList.add('is-blocked');
    feed.innerHTML = `<div class="tc-blocked"><svg width="30" height="30"><use href="#i-headset"/></svg><b>${title}</b><p>${text}</p>${button}</div>`;
    $('#tcCompose').hidden = true;
  };

  /* ---------------- header + side panel ---------------- */
  const STATUS = { pending: ['wait', 'Waiting for expert'], active: ['on', 'Live'], completed: ['done', 'Ended'], cancelled_by_customer: ['off', 'Cancelled'], cancelled_by_engineer: ['off', 'Cancelled by expert'] };
  const elapsed = () => chat?.chat_start_time ? (chat.chat_end_time && !isOpen() ? new Date(chat.chat_end_time) : new Date()) - new Date(chat.chat_start_time) : 0;
  const secondsLeft = () => Math.floor(wallet / chat.chat_charges) * 60 - Math.floor(elapsed() / 1000);

  const renderHead = () => {
    const st = STATUS[chat.status] || ['off', chat.status];
    $('#tcAv').innerHTML = `${esc(initials(chat.engineer_name))}<i class="ts-dot ts-dot--${st[0] === 'on' || st[0] === 'wait' ? 'on' : 'off'}"></i>`;
    $('#tcName').textContent = chat.engineer_name;
    $('#tcSub').textContent = `${chat.engineer_code} · ${inr(chat.chat_charges)}/min`;
    $('#tcStatus').className = `tc-status tc-status--${st[0]}`;
    $('#tcStatus').textContent = st[1];
    $('#tcEnd').hidden = !isOpen();
    $('#tcEnd').textContent = chat.status === 'pending' ? 'Cancel' : 'End chat';
    $('#tcCompose').hidden = !isOpen();
    $('#tcRoom').classList.toggle('is-closed', !isOpen());
  };

  const renderClock = () => {
    const clock = $('#tcClock');
    if (chat?.status !== 'active') { clock.hidden = true; renderSession(); return; }
    const left = secondsLeft();
    clock.hidden = false;
    clock.classList.toggle('low', left < 120);
    clock.innerHTML = `<svg width="16" height="16"><use href="#i-clock"/></svg><span>${left > 0 ? `${mmss(left)} left` : 'Recharge your wallet'}</span>`;
    renderSession();
    if (left <= 0 && !ending) endChat(true);
  };

  const renderSession = () => {
    if (!chat) return;
    const on = chat.status === 'active', done = !isOpen() && chat.chat_start_time;
    const used = on ? mins(elapsed()) : (chat.chat_duration || 0);
    const cost = on ? used * chat.chat_charges : (chat.call_charge || 0);
    $('#tcSession').innerHTML = `
      <h3>Session</h3>
      <dl class="tc-rows">
        <div><dt>Expert</dt><dd>${esc(chat.engineer_name)}</dd></div>
        <div><dt>Rate</dt><dd>${inr(chat.chat_charges)}/min</dd></div>
        <div><dt>Started</dt><dd>${chat.chat_start_time ? time(chat.chat_start_time) : '—'}</dd></div>
        <div><dt>${done ? 'Duration' : 'Billed minutes'}</dt><dd>${chat.chat_start_time ? used + ' min' : '—'}</dd></div>
        <div class="tot"><dt>${done ? 'Charged' : 'Cost so far'}</dt><dd>${inr(cost)}</dd></div>
        <div><dt>Wallet balance</dt><dd>${inr(on ? Math.max(0, wallet - cost) : wallet)}</dd></div>
      </dl>
      <p class="tc-small">${on ? 'Every started minute is billed. End the chat when your problem is fixed.' : chat.status === 'pending' ? 'Billing starts only when the expert joins.' : 'Thanks for using FixPapa remote support.'}</p>`;
  };

  /* ---------------- feed ---------------- */
  const bubble = (m) => {
    if (m.from === 'system') return `<div class="tc-sys"><span>${esc(m.message)}</span></div>`;
    const me = m.from === 'customer';
    return `<div class="tc-msg ${me ? 'tc-msg--me' : 'tc-msg--them'}">
      ${me ? '' : `<span class="ts-av ts-av--sm" aria-hidden="true">${esc(initials(chat.engineer_name))}</span>`}
      <div class="tc-bub">${m.image ? `<a class="tc-img" href="${esc(m.image)}" target="_blank" rel="noopener"><img src="${esc(m.image)}" alt="Shared image"></a>` : ''}${m.message ? `<p>${esc(m.message)}</p>` : ''}<time>${me ? 'You' : esc(chat.engineer_name.split(' ')[0])} · ${time(m.created_at)}</time></div>
    </div>`;
  };

  const intake = () => {
    const cat = CATEGORIES.find(c => c.name === pick.category);
    return `<div class="tc-intake">
      <div class="tc-intake-head"><span class="tc-step">1</span><b>Choose your device</b></div>
      <div class="tc-opts" role="group" aria-label="Device">${CATEGORIES.map(c => `<button type="button" class="tc-opt${c.name === pick.category ? ' on' : ''}" data-cat="${esc(c.name)}" aria-pressed="${c.name === pick.category}"><svg width="18" height="18"><use href="#${c.icon}"/></svg>${esc(c.short || c.name)}</button>`).join('')}</div>
      ${cat ? `<div class="tc-intake-head"><span class="tc-step">2</span><b>What’s the problem?</b></div>
      <div class="tc-opts tc-opts--wrap" role="group" aria-label="Problem">${cat.problems.map(p => `<button type="button" class="tc-chip${p === pick.problem ? ' on' : ''}" data-prob="${esc(p)}" aria-pressed="${p === pick.problem}">${esc(p)}</button>`).join('')}</div>` : ''}
      <button type="button" class="btn btn--sm tc-intake-go" data-intake ${cat && pick.problem ? '' : 'disabled'}>Submit info to start chat <svg class="arrow" width="16" height="16"><use href="#i-arrow"/></svg></button>
    </div>`;
  };

  const closing = () => {
    if (isOpen()) return '';
    const done = chat.status === 'completed';
    let html = `<div class="tc-summary">
      <span class="tc-summary-ic"><svg width="22" height="22"><use href="#i-${done ? 'check' : 'close'}"/></svg></span>
      <b>${done ? 'Chat ended' : 'Chat cancelled'}</b>
      <dl class="tc-rows tc-rows--inline">${done ? `<div><dt>Duration</dt><dd>${chat.chat_duration} min</dd></div><div><dt>Rate</dt><dd>${inr(chat.chat_charges)}/min</dd></div><div class="tot"><dt>Charged</dt><dd>${inr(chat.call_charge)}</dd></div>` : '<div><dt>Charged</dt><dd>₹0</dd></div>'}</dl>
    </div>`;
    if (done && !chat.ratings && !chat.customer_comments) {
      html += `<form class="tc-review" id="tcReview">
        <b>How would you rate this conversation?</b>
        <div class="tc-stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${n === review.ratings}" aria-label="${n} star${n > 1 ? 's' : ''}" data-star="${n}" class="${n <= review.ratings ? 'on' : ''}"><svg width="28" height="28"><use href="#i-star"/></svg></button>`).join('')}</div>
        <label class="tc-f"><span>Any comments? <small>(optional)</small></span><textarea id="tcComment" rows="3" maxlength="500" placeholder="Tell us what went well or what could be better">${esc(review.comment)}</textarea></label>
        <button type="submit" class="btn btn--sm" ${review.ratings ? '' : 'disabled'}>Submit review</button>
      </form>`;
    } else if (chat.ratings || chat.customer_comments) {
      html += `<div class="tc-reviewed"><b>Your review</b><span class="tc-stars tc-stars--ro" aria-label="${chat.ratings} out of 5">${[1, 2, 3, 4, 5].map(n => `<svg class="${n <= chat.ratings ? 'on' : ''}" width="18" height="18"><use href="#i-star"/></svg>`).join('')}</span>${chat.customer_comments ? `<p>${esc(chat.customer_comments)}</p>` : ''}</div>`;
    }
    html += `<div class="tc-next"><div><b>Still having trouble?</b><span>Book an onsite repair or inspection.</span></div><a href="repair.html" class="btn btn--sm">Book a service call <svg class="arrow" width="16" height="16"><use href="#i-arrow"/></svg></a></div>
      <a href="technical-support.html" class="tc-more">Chat with another expert</a>`;
    return html;
  };

  const renderFeed = (force) => {
    const s = `${chat.status}|${msgs.length}|${chat.ratings}|${chat.customer_comments}`;
    if (s === sig && !force) return;
    sig = s;
    const nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 120;
    const asked = msgs.some(m => m.from === 'customer');
    let html = `<div class="tc-sys"><span>${chat.status === 'pending' && !asked ? `Chat request sent to ${esc(chat.engineer_name)}. Tell us about your device so they can join.` : `Chat with ${esc(chat.engineer_name)} · ${new Date(chat.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}</span></div>`;
    if (chat.status === 'pending' && !asked) html += intake();
    html += msgs.map(bubble).join('');
    if (chat.status === 'pending' && asked) html += `<div class="tc-msg tc-msg--them tc-typing"><span class="ts-av ts-av--sm">${esc(initials(chat.engineer_name))}</span><div class="tc-bub"><i></i><i></i><i></i><time>Waiting for ${esc(chat.engineer_name.split(' ')[0])} to join…</time></div></div>`;
    html += closing();
    feed.innerHTML = html;
    if (nearBottom || force) feed.scrollTop = feed.scrollHeight;
  };

  /* ---------------- data ---------------- */
  const refresh = (force) => Promise.all([FP.chat(chatID), FP.history(chatID)]).then(([c, h]) => {
    const wasActive = chat?.status === 'active';
    chat = c; msgs = h || [];
    if (!wasActive && chat.status === 'active') FP.wallet().then(w => { wallet = w.amount; renderClock(); });
    renderHead(); renderFeed(force); renderClock();
    if (!isOpen()) stop();
  });

  const start = () => { stop(); poll = setInterval(() => refresh().catch(() => { }), 2000); tick = setInterval(renderClock, 1000); };
  const stop = () => { clearInterval(poll); clearInterval(tick); };

  const send = (payload) => FP.send(chatID, payload).then(() => refresh(true)).catch(err => toast(err?.message || 'Message not sent. Please try again.'));

  const endChat = (auto) => {
    if (ending || !isOpen()) return;
    ending = true;
    const pending = chat.status === 'pending';
    const chatDuration = pending ? 0 : mins(elapsed());
    const status = pending ? 'cancelled_by_customer' : 'completed';
    FP.updateStatus(chatID, { status, chatDuration, callCharge: chatDuration * chat.chat_charges })
      .then(() => FP.wallet()).then(w => { wallet = w.amount; })
      .then(() => refresh(true))
      .then(() => { if (auto) toast('Your wallet ran out, so the chat ended.'); })
      .catch(err => toast(err?.message || 'Couldn’t end the chat. Please try again.'))
      .finally(() => { ending = false; });
  };

  /* ---------------- events ---------------- */
  feed.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cat) { pick.category = b.dataset.cat; pick.problem = ''; renderFeed(true); feed.querySelector('[data-prob]')?.focus(); }
    else if (b.dataset.prob) { pick.problem = b.dataset.prob; renderFeed(true); feed.querySelector('[data-intake]')?.focus(); }
    else if (b.matches('[data-intake]')) { b.disabled = true; send({ message: `Your selected device is ${pick.category} and your problem is ${pick.problem}` }); }
    else if (b.dataset.star) { review.ratings = +b.dataset.star; review.comment = $('#tcComment')?.value || ''; sig = ''; renderFeed(true); feed.querySelector(`[data-star="${review.ratings}"]`)?.focus(); }
  });
  feed.addEventListener('input', (e) => { if (e.target.id === 'tcComment') review.comment = e.target.value; });
  feed.addEventListener('submit', (e) => {
    if (e.target.id !== 'tcReview') return;
    e.preventDefault();
    const b = e.target.querySelector('[type="submit"]'); b.disabled = true;
    FP.review(chatID, { ratings: review.ratings, customerComments: review.comment.trim() }).then(() => { toast('Thanks for your review!'); return refresh(true); })
      .catch(err => { b.disabled = false; toast(err?.message || 'Couldn’t save your review.'); });
  });

  const input = $('#tcInput');
  const sendBtn = $('#tcSend');
  input.addEventListener('input', () => { sendBtn.disabled = !input.value.trim(); });
  $('#tcCompose').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; sendBtn.disabled = true;
    send({ message: text });
  });
  $('#tcAttach').addEventListener('click', () => $('#tcFile').click());
  $('#tcFile').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('Please choose an image.');
    if (file.size > 5 * 1024 * 1024) return toast('Images up to 5 MB, please.');
    if (!FP.isDemo) return send({ image: file }); // the live API takes the file itself (FormData messageImage)
    // demo: shrink to a small data URL so it fits in localStorage
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 640 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      send({ image: c.toDataURL('image/jpeg', .75) });
    };
    img.onerror = () => toast('Couldn’t read that image.');
    img.src = url;
  });

  const endBox = $('#tcEndBox');
  let opener = null;
  const openEnd = () => {
    opener = document.activeElement;
    const pending = chat.status === 'pending';
    $('#tcEndTitle').textContent = pending ? 'Cancel this chat request?' : 'End this chat?';
    $('#tcEndText').textContent = pending ? 'The expert hasn’t joined yet, so nothing will be charged.' : `You’ll be charged ${inr(mins(elapsed()) * chat.chat_charges)} for ${mins(elapsed())} min. You can rate ${chat.engineer_name.split(' ')[0]} next.`;
    $('#tcEndGo').textContent = pending ? 'Cancel request' : 'End chat';
    endBox.hidden = false; document.body.classList.add('ts-lock');
    requestAnimationFrame(() => endBox.classList.add('in'));
    $('#tcEndKeep').focus();
  };
  const closeEnd = () => { endBox.classList.remove('in'); endBox.hidden = true; document.body.classList.remove('ts-lock'); opener?.focus?.(); };
  $('#tcEnd').addEventListener('click', openEnd);
  endBox.addEventListener('click', (e) => { if (e.target === endBox || e.target.closest('[data-close]')) closeEnd(); });
  $('#tcEndGo').addEventListener('click', () => { closeEnd(); endChat(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !endBox.hidden) closeEnd(); });

  const toast = (msg) => {
    const t = $('#tsToast'); t.textContent = msg; t.hidden = false; t.classList.add('in');
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.hidden = true, 300); }, 2800);
  };

  /* ---------------- boot ---------------- */
  const boot = () => {
    if (!FP.signedIn()) {
      blocked('Log in to open this chat', 'Your chats are linked to your FixPapa account.', '<button type="button" class="btn btn--sm" id="tcLogin">Log in</button>');
      $('#tcLogin').addEventListener('click', () => window.FPAuth?.open ? window.FPAuth.open(location.href) : (location.href = 'account.html'));
      return;
    }
    if (!chatID) return blocked('No chat selected', 'Pick an expert to start a chat.', '<a href="technical-support.html" class="btn btn--sm">See experts</a>');
    $('#tcRoom').classList.remove('is-blocked');
    feed.innerHTML = '<div class="tc-loading"><i></i><span>Loading chat…</span></div>';
    FP.wallet().then(w => { wallet = w.amount; }).catch(() => { })
      .then(() => refresh(true))
      .then(() => { if (isOpen()) start(); })
      .catch(() => blocked('This chat link isn’t valid', 'It may have expired, or it belongs to another account.', '<a href="technical-support.html" class="btn btn--sm">Back to experts</a>'));
  };
  window.addEventListener('beforeunload', stop);
  let wasIn = !!FP.signedIn();
  setInterval(() => { const now = !!FP.signedIn(); if (now !== wasIn) { wasIn = now; boot(); } }, 1000);
  boot();
})();
