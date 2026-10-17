/* =========================================================
   FixPapa Assistant · integration (config + wiring)
   ---------------------------------------------------------
   Picks the chat service, builds the floating launcher, and translates chat events into
   avatar states. This is the only file that knows both sides:
     conversation 'request'  → thinking          ui 'open'          → greeting → idle
     ui 'reply:start'        → talking           ui 'typing' (true) → listening
     ui 'reply:done'         → happy|idle        conversation 'error' → error → idle
   Optional config (set before these scripts load):
     window.FPAssistantConfig = { service: 'http', endpoint: '/api/assistant/chat', timeoutMs: 15000, enabled: true }
   ========================================================= */
(() => {
  const NS = window.FPAssistant;
  if (!NS || !NS.createConversation || !NS.createChatUI) return;
  const cfg = Object.assign({ enabled: true, service: 'mock', endpoint: '/api/assistant/chat', timeoutMs: 15000, storageKey: 'fp-assistant', logoSrc: 'assets/img/logo.png' }, window.FPAssistantConfig);
  if (!cfg.enabled || document.querySelector('.fpa-root')) return;

  const service = cfg.service === 'http' ? NS.createHttpService({ endpoint: cfg.endpoint, headers: cfg.headers }) : NS.createMockService();
  const conversation = NS.createConversation({ service, timeoutMs: cfg.timeoutMs, storageKey: cfg.storageKey });

  /* ---------- shell: launcher (avatar) + tooltip; the chat panel mounts inside ---------- */
  const root = document.createElement('div');
  root.className = 'fpa-root';
  root.innerHTML = `
    <div class="fpa-tip" role="status" hidden><span>Hi! Need help with a repair?</span><button type="button" class="fpa-tip-x" aria-label="Dismiss">×</button></div>
    <button type="button" class="fpa-launch" aria-label="Open FixPapa Assistant chat" aria-expanded="false">
      <span class="fpa-launch-av"></span><b class="fpa-badge" hidden></b>
    </button>`;
  document.body.append(root);
  document.body.classList.add('fpa-on');
  const launch = root.querySelector('.fpa-launch'), tip = root.querySelector('.fpa-tip'), badge = root.querySelector('.fpa-badge');

  const ui = NS.createChatUI({
    mount: root, conversation,
    notice: service.name === 'mock' ? 'Demo mode · sample answers, not a live AI' : '',
    returnFocus: () => launch.focus()
  });
  launch.setAttribute('aria-controls', ui.el.id);

  /* ---------- avatars: the standing technician is the launcher; the panel header shows his head and chest ---------- */
  const avatars = NS.createAvatar ? [NS.createAvatar(root.querySelector('.fpa-launch-av'), { logoSrc: cfg.logoSrc }), NS.createAvatar(ui.slots.avatar, { view: 'bust', logoSrc: cfg.logoSrc })] : [];
  let holdTimer;
  const resting = () => (ui.isOpen() && ui.hasDraft() ? 'listening' : 'idle');
  function mood(state, holdMs) {
    clearTimeout(holdTimer);
    avatars.forEach(a => a.setState(state));
    if (holdMs) holdTimer = setTimeout(() => mood(resting()), holdMs);
  }
  const busy = () => conversation.isBusy();

  /* ---------- open / close ---------- */
  let unread = 0;
  const setUnread = (n) => { unread = n; badge.hidden = !n; badge.textContent = n; launch.setAttribute('aria-label', 'Open FixPapa Assistant chat' + (n ? ` (${n} new)` : '')); };
  launch.addEventListener('click', () => ui.toggle());
  ui.on('open', () => {
    root.classList.add('is-open'); launch.setAttribute('aria-expanded', 'true');
    hideTip(true); setUnread(0);
    if (!busy()) mood('greeting', 1800);
  });
  const onHide = () => { root.classList.remove('is-open'); launch.setAttribute('aria-expanded', 'false'); if (!busy()) mood('idle'); };
  ui.on('minimize', onHide);
  ui.on('close', () => { conversation.reset(); onHide(); });

  /* ---------- chat → avatar ---------- */
  ui.on('typing', (on) => { if (!busy() && ['idle', 'listening'].includes(avatars[0] && avatars[0].getState())) mood(on ? 'listening' : 'idle'); });
  conversation.on('request', () => mood('thinking'));
  ui.on('reply:start', () => mood('talking'));
  ui.on('reply:done', (msg) => { if (msg.mood === 'happy') mood('happy', 1700); else mood(resting()); });
  conversation.on('response', () => { if (!ui.isOpen()) setUnread(unread + 1); });
  conversation.on('error', () => { mood('error', 2600); if (!ui.isOpen()) setUnread(unread + 1); });

  /* ---------- welcome tooltip: once per browser session ---------- */
  const TIP_KEY = 'fp-assistant-tip';
  let tipTimer;
  function hideTip(remember) {
    clearTimeout(tipTimer);
    tip.classList.remove('is-on'); setTimeout(() => { tip.hidden = true; }, 250);
    if (remember) try { sessionStorage.setItem(TIP_KEY, '1'); } catch (e) {}
  }
  let seen = false; try { seen = sessionStorage.getItem(TIP_KEY) === '1'; } catch (e) {}
  if (!seen && !conversation.getState().messages.length) {
    tipTimer = setTimeout(() => {
      if (ui.isOpen()) return;
      tip.hidden = false; requestAnimationFrame(() => tip.classList.add('is-on'));
      mood('greeting', 1800);
      tipTimer = setTimeout(() => hideTip(false), 9000);
    }, 2500);
  }
  tip.querySelector('.fpa-tip-x').addEventListener('click', () => hideTip(true));
  tip.querySelector('span').addEventListener('click', () => ui.open());

})();
