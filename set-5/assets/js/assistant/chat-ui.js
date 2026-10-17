/* =========================================================
   FixPapa Assistant · chat panel (presentation only)
   ---------------------------------------------------------
   createChatUI({ mount, conversation, ...options }) builds the panel, renders the conversation's
   messages and forwards user input to conversation.send(). It knows nothing about the avatar:
   it exposes an empty `slots.avatar` element and reports what happens through events:
     open · minimize · close · typing (bool) · reply:start (msg) · reply:done (msg)
   ========================================================= */
(() => {
  const NS = window.FPAssistant = window.FPAssistant || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const icon = {
    min: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    retry: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5"/></svg>'
  };
  const DEFAULTS = {
    name: 'FixPapa Assistant',
    status: 'Online · usually replies instantly',
    welcome: 'Hi! I’m the FixPapa Assistant. I can help you book a repair, find the right service or answer quick questions.',
    suggestions: ['Book a repair', 'What services do you offer?', 'How much will my repair cost?'],
    placeholder: 'Type your question…',
    notice: '',
    errors: {
      TIMEOUT: 'That took too long. Please try again.',
      NETWORK: 'I couldn’t reach FixPapa. Check your connection and try again.',
      EMPTY_RESPONSE: 'I didn’t get an answer that time. Please try again.',
      BAD_RESPONSE: 'I got a reply I couldn’t read. Please try again.',
      default: 'Something went wrong on my side. Please try again, or call us on +91 86965 44448.'
    }
  };

  function createChatUI({ mount, conversation, returnFocus, ...opts }) {
    const o = { ...DEFAULTS, ...opts, errors: { ...DEFAULTS.errors, ...(opts.errors || {}) } };
    const listeners = {};
    const emit = (evt, data) => (listeners[evt] || []).forEach(fn => fn(data));
    const uid = 'fpa' + Math.random().toString(36).slice(2, 7);

    mount.insertAdjacentHTML('beforeend', `
<section class="fpa-panel" id="${uid}" role="dialog" aria-modal="false" aria-labelledby="${uid}-t" hidden>
  <header class="fpa-head">
    <span class="fpa-head-av" data-slot="avatar" aria-hidden="true"></span>
    <div class="fpa-head-txt"><b id="${uid}-t">${esc(o.name)}</b><small><i></i>${esc(o.status)}</small></div>
    <button type="button" class="fpa-ibtn" data-act="min" aria-label="Minimize chat" title="Minimize">${icon.min}</button>
    <button type="button" class="fpa-ibtn" data-act="close" aria-label="End chat" title="End chat">${icon.close}</button>
  </header>
  <div class="fpa-log" role="log" aria-live="polite" aria-relevant="additions">
    <div class="fpa-msg fpa-msg--bot fpa-welcome"><p>${esc(o.welcome)}</p></div>
  </div>
  <div class="fpa-typing" hidden aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="fpa-suggest" role="group" aria-label="Suggested questions"></div>
  <form class="fpa-form" novalidate>
    <label class="fpa-sr" for="${uid}-in">Message ${esc(o.name)}</label>
    <textarea id="${uid}-in" rows="1" maxlength="500" placeholder="${esc(o.placeholder)}" autocomplete="off"></textarea>
    <button type="submit" class="fpa-send" aria-label="Send message" disabled>${icon.send}</button>
  </form>
  ${o.notice ? `<p class="fpa-notice">${esc(o.notice)}</p>` : ''}
</section>`);
    const panel = mount.lastElementChild;
    const $ = (s) => panel.querySelector(s);
    const log = $('.fpa-log'), typing = $('.fpa-typing'), sugg = $('.fpa-suggest'), form = $('.fpa-form'), input = $('textarea'), sendBtn = $('.fpa-send');
    let open = false, hideTimer, rendered = new Set(), lastSuggest = '';

    /* ---------- messages ---------- */
    const scrollDown = () => { log.scrollTop = log.scrollHeight; };
    const textHtml = (t) => esc(t).replace(/\n/g, '<br>');
    function bubble(m) {
      const el = document.createElement('div');
      el.dataset.id = m.id;
      if (m.role === 'user') { el.className = 'fpa-msg fpa-msg--me'; el.innerHTML = `<p>${textHtml(m.text)}</p>`; }
      else if (m.role === 'error') {
        el.className = 'fpa-msg fpa-msg--err';
        el.innerHTML = `<p>${esc(o.errors[m.code] || o.errors.default)}</p>` + (m.retryable ? `<button type="button" class="fpa-retry">${icon.retry}Try again</button>` : '');
      } else {
        el.className = 'fpa-msg fpa-msg--bot';
        const actions = (m.actions || []).map(a => `<a class="fpa-act" href="${esc(a.href)}"${/^https?:/i.test(a.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(a.label)}</a>`).join('');
        // screen readers get the full answer at once; the typed-out copy is visual only
        el.innerHTML = `<p><span class="fpa-sr">${esc(m.text)}</span><span class="fpa-type" aria-hidden="true"></span></p>` + (actions ? `<div class="fpa-acts">${actions}</div>` : '');
      }
      return el;
    }
    // types an answer out word by word; instant when hidden or with reduced motion
    function typeOut(el, m) {
      const out = el.querySelector('.fpa-type'), acts = el.querySelector('.fpa-acts');
      const words = m.text.split(/(\s+)/);
      emit('reply:start', m);
      if (!open || reduce.matches || document.hidden) { out.innerHTML = textHtml(m.text); emit('reply:done', m); return; }
      if (acts) acts.hidden = true;
      const step = Math.max(14, Math.min(55, 1700 / words.length));
      let i = 0;
      (function tick() {
        i = Math.min(words.length, i + 2);
        out.innerHTML = textHtml(words.slice(0, i).join(''));
        scrollDown();
        if (i < words.length) setTimeout(tick, step);
        else { if (acts) acts.hidden = false; scrollDown(); emit('reply:done', m); }
      })();
    }
    function setSuggestions(list) {
      const key = list.join('|');
      if (key === lastSuggest) return;
      lastSuggest = key;
      sugg.innerHTML = list.map(s => `<button type="button" class="fpa-chip">${esc(s)}</button>`).join('');
      sugg.hidden = !list.length;
    }
    function render(state, { animate = true } = {}) {
      const ids = new Set(state.messages.map(m => m.id));
      log.querySelectorAll('[data-id]').forEach(el => { if (!ids.has(el.dataset.id)) { rendered.delete(el.dataset.id); el.remove(); } });
      state.messages.forEach(m => {
        if (rendered.has(m.id)) return;
        rendered.add(m.id);
        const el = bubble(m);
        log.append(el);
        if (m.role === 'assistant') { if (animate) typeOut(el, m); else el.querySelector('.fpa-type').innerHTML = textHtml(m.text); }
      });
      const busy = state.status === 'sending';
      typing.hidden = !busy;
      if (busy) log.append(typing); else if (typing.parentNode === log) panel.insertBefore(typing, sugg);
      const lastBot = [...state.messages].reverse().find(m => m.role === 'assistant');
      setSuggestions(busy ? [] : lastBot ? lastBot.suggestions || [] : state.messages.length ? [] : o.suggestions);
      updateSend();
      scrollDown();
    }

    /* ---------- input ---------- */
    const hasDraft = () => input.value.trim().length > 0;
    function updateSend() { sendBtn.disabled = !hasDraft() || conversation.isBusy(); }
    function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 104) + 'px'; }
    let wasTyping = false;
    input.addEventListener('input', () => {
      grow(); updateSend();
      if (hasDraft() !== wasTyping) { wasTyping = hasDraft(); emit('typing', wasTyping); }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
    });
    function submit(text) {
      const value = text != null ? text : input.value;
      if (!String(value).trim() || conversation.isBusy()) return;
      if (text == null) { input.value = ''; grow(); }
      if (wasTyping) { wasTyping = false; emit('typing', false); }
      conversation.send(value);
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    sugg.addEventListener('click', (e) => { const b = e.target.closest('.fpa-chip'); if (b) submit(b.textContent); });
    log.addEventListener('click', (e) => { if (e.target.closest('.fpa-retry')) conversation.retry(); });

    /* ---------- open / minimize / close ---------- */
    function show() {
      if (open) return;
      open = true; clearTimeout(hideTimer);
      panel.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
      scrollDown();
      setTimeout(() => input.focus({ preventScroll: true }), reduce.matches ? 0 : 180);
      emit('open');
    }
    function hide(evt) {
      if (!open) return;
      open = false;
      panel.classList.remove('is-open');
      hideTimer = setTimeout(() => { panel.hidden = true; }, reduce.matches ? 0 : 260);
      if (panel.contains(document.activeElement) && returnFocus) returnFocus();
      emit(evt);
    }
    panel.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (act) hide(act.dataset.act === 'close' ? 'close' : 'minimize');
    });
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); hide('minimize'); } });

    conversation.on('change', (s) => render(s));
    render(conversation.getState(), { animate: false });

    return {
      el: panel,
      slots: { avatar: panel.querySelector('[data-slot="avatar"]') },
      open: show,
      minimize: () => hide('minimize'),
      close: () => hide('close'),
      toggle: () => (open ? hide('minimize') : show()),
      isOpen: () => open,
      hasDraft,
      on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
    };
  }

  NS.createChatUI = createChatUI;
})();
