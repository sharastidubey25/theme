/* =========================================================
   FixPapa Assistant · conversation state (no DOM, no avatar)
   ---------------------------------------------------------
   Holds the message list, sends through any chat service (see service.js), applies the timeout,
   blocks duplicate sends and keeps the chat in sessionStorage so it survives minimising and
   moving between pages. Listeners: on('change' | 'request' | 'response' | 'error' | 'reset', fn).

   Message  { id, role: 'user' | 'assistant' | 'error', text, suggestions?, actions?, mood?, source?, code?, retryable? }
   ========================================================= */
(() => {
  const NS = window.FPAssistant = window.FPAssistant || {};
  const MAX_INPUT = 500, MAX_STORED = 60, HISTORY = 12;
  const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function createConversation({ service, timeoutMs = 15000, storageKey = 'fp-assistant' } = {}) {
    if (!service || typeof service.send !== 'function') throw new Error('FixPapa Assistant: conversation needs a chat service');
    const listeners = {};
    const emit = (evt, data) => (listeners[evt] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });

    const load = () => { try { return JSON.parse(sessionStorage.getItem(storageKey)) || null; } catch (e) { return null; } };
    const saved = load();
    let state = {
      sessionId: (saved && saved.sessionId) || uid(),
      messages: (saved && Array.isArray(saved.messages)) ? saved.messages : [],
      status: 'idle'                                   // 'idle' | 'sending'
    };
    const save = () => { try { sessionStorage.setItem(storageKey, JSON.stringify({ sessionId: state.sessionId, messages: state.messages.slice(-MAX_STORED) })); } catch (e) {} };
    const set = (patch) => { state = { ...state, ...patch }; save(); emit('change', state); };

    let inflight = null;
    async function request(text) {
      const history = state.messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-HISTORY - 1, -1).map(m => ({ role: m.role, text: m.text }));
      const req = { sessionId: state.sessionId, message: { text }, history, context: { page: location.pathname, title: document.title } };
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, timeoutMs);
      inflight = ctrl;
      set({ status: 'sending' });
      emit('request', req);
      try {
        const reply = await service.send(req, { signal: ctrl.signal });
        if (!reply || !reply.text) throw new NS.ServiceError('EMPTY_RESPONSE', 'No reply');
        const msg = { id: uid(), role: 'assistant', text: reply.text, suggestions: reply.suggestions || [], actions: reply.actions || [], mood: reply.mood || 'neutral', source: reply.source || service.name };
        set({ status: 'idle', messages: state.messages.concat(msg) });
        emit('response', msg);
        return { ok: true, message: msg };
      } catch (err) {
        if (ctrl.signal.aborted && !timedOut) { set({ status: 'idle' }); return { ok: false, reason: 'aborted' }; }   // reset() cancelled it
        const code = timedOut ? 'TIMEOUT' : (err && err.code) || 'UNKNOWN';
        const msg = { id: uid(), role: 'error', text: text, code, retryable: !(err && err.retryable === false) };
        set({ status: 'idle', messages: state.messages.concat(msg) });
        emit('error', { code, message: msg, error: err });
        return { ok: false, reason: code };
      } finally {
        clearTimeout(timer);
        if (inflight === ctrl) inflight = null;
      }
    }

    return {
      on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); return () => { listeners[evt] = listeners[evt].filter(f => f !== fn); }; },
      getState: () => state,
      isBusy: () => state.status === 'sending',
      /* send a user message · ignored while a reply is pending or when empty */
      send(raw) {
        const text = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT);
        if (!text) return Promise.resolve({ ok: false, reason: 'empty' });
        if (state.status === 'sending') return Promise.resolve({ ok: false, reason: 'busy' });
        set({ messages: state.messages.concat({ id: uid(), role: 'user', text }) });
        return request(text);
      },
      /* resend the question behind the latest error, without repeating the user's bubble */
      retry() {
        const last = state.messages[state.messages.length - 1];
        if (!last || last.role !== 'error' || state.status === 'sending') return Promise.resolve({ ok: false, reason: 'nothing-to-retry' });
        set({ messages: state.messages.slice(0, -1) });
        return request(last.text);
      },
      /* forget everything and start a new session */
      reset() {
        if (inflight) inflight.abort();
        state = { sessionId: uid(), messages: [], status: 'idle' };
        try { sessionStorage.removeItem(storageKey); } catch (e) {}
        emit('reset', state); emit('change', state);
      }
    };
  }

  NS.createConversation = createConversation;
})();
