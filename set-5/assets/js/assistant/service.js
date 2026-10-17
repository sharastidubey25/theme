/* =========================================================
   FixPapa Assistant · chat service contract + real-backend adapter
   ---------------------------------------------------------
   A chat service is any object with:
     name: string                                   ('http', 'mock', …)
     send(request, { signal }) → Promise<Reply>     (rejects with ServiceError)

   Request  { sessionId, message: { text }, history: [{ role: 'user'|'assistant', text }], context: { page, title } }
   Reply    { text, suggestions: string[], actions: [{ label, href }], mood: 'neutral'|'happy', source }

   The backend answers the JSON body described in assets/js/assistant/README.md;
   normalizeResponse() turns it into a Reply and rejects anything malformed.
   No API keys live here: the endpoint is FixPapa's own server, which talks to any AI provider.
   ========================================================= */
(() => {
  const NS = window.FPAssistant = window.FPAssistant || {};

  class ServiceError extends Error {
    // code: NETWORK | TIMEOUT | HTTP_<status> | BAD_RESPONSE | EMPTY_RESPONSE | ABORTED | MOCK_FAILURE
    constructor(code, message, { retryable = true } = {}) {
      super(message || code);
      this.name = 'ServiceError'; this.code = code; this.retryable = retryable;
    }
  }

  const MAX_TEXT = 4000, MAX_SUGGESTIONS = 4, MAX_ACTIONS = 3;
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  // links from the backend: same-site paths/anchors, http(s), tel: and WhatsApp only, never javascript: etc.
  const safeHref = (h) => { h = str(h); return /^(https?:\/\/|tel:|mailto:|#|[\w./-]+(\.html)?(\?[^#\s]*)?(#[\w-]*)?$)/i.test(h) && !/^javascript:/i.test(h) ? h : ''; };

  /* raw backend JSON → Reply (throws ServiceError on anything we can't show) */
  function normalizeResponse(raw, source = 'http') {
    if (!raw || typeof raw !== 'object') throw new ServiceError('BAD_RESPONSE', 'Response is not an object');
    const reply = typeof raw.reply === 'string' ? { text: raw.reply } : raw.reply;
    if (!reply || typeof reply !== 'object') throw new ServiceError('BAD_RESPONSE', 'Missing "reply"');
    const text = str(reply.text).slice(0, MAX_TEXT);
    if (!text) throw new ServiceError('EMPTY_RESPONSE', 'Reply text is empty');
    const suggestions = (Array.isArray(reply.suggestions) ? reply.suggestions : []).map(str).filter(Boolean).slice(0, MAX_SUGGESTIONS);
    const actions = (Array.isArray(reply.actions) ? reply.actions : [])
      .map(a => a && { label: str(a.label), href: safeHref(a.href) })
      .filter(a => a && a.label && a.href).slice(0, MAX_ACTIONS);
    const mood = reply.mood === 'happy' ? 'happy' : 'neutral';
    return { text, suggestions, actions, mood, source: str(raw.meta && raw.meta.source) || source };
  }

  /* Production adapter: POST the request to FixPapa's backend. Swap in by setting
     window.FPAssistantConfig = { service: 'http', endpoint: '/api/assistant/chat' } before the assistant scripts. */
  function createHttpService({ endpoint, headers = {}, fetchImpl = window.fetch.bind(window) } = {}) {
    if (!endpoint) throw new Error('FixPapa Assistant: http service needs an endpoint');
    return {
      name: 'http',
      async send(request, { signal } = {}) {
        let res;
        try {
          res = await fetchImpl(endpoint, {
            method: 'POST', signal, credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
            body: JSON.stringify(request)
          });
        } catch (e) {
          if (e && e.name === 'AbortError') throw new ServiceError('ABORTED', 'Request aborted');
          throw new ServiceError('NETWORK', 'Network request failed');
        }
        if (!res.ok) throw new ServiceError('HTTP_' + res.status, 'Server answered ' + res.status, { retryable: res.status >= 500 || res.status === 429 });
        let body;
        try { body = await res.json(); } catch (e) { throw new ServiceError('BAD_RESPONSE', 'Response is not JSON'); }
        return normalizeResponse(body, 'http');
      }
    };
  }

  Object.assign(NS, { ServiceError, normalizeResponse, createHttpService });
})();
