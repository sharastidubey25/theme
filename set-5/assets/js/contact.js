/* FixPapa · Set 5 · Contact page (contact.html): "Message us" form validation + submit.
   Demo by default; a backend plugs in via window.FPContactApi = { send(message) } (Promise). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const api = window.FPContactApi || { demo: true, send: () => wait(700) };
  const form = $('#ctForm'); if (!form) return;
  const F = (n) => form.elements[n];
  const linky = /(https?:\/\/|www\.|<\s*\/?\s*[a-z!]|javascript:|\[url)/i;

  F('mobile').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
  form.addEventListener('input', (e) => { const l = e.target.closest('.ct-f.bad'); if (l) l.classList.remove('bad'); $('#ctSent').hidden = true; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = F('message').value.trim();
    $('#ctMsgErr').textContent = msg && linky.test(msg) ? 'Please remove links or code from your message.' : 'Please write your message.';
    const rules = [['name', (x) => /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(x.trim())], ['email', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.trim())],
      ['mobile', (x) => /^[6-9]\d{9}$/.test(x)], ['message', () => msg.length > 4 && !linky.test(msg)]];
    const bad = rules.filter(([n, ok]) => { const b = !ok(F(n).value); F(n).closest('.ct-f').classList.toggle('bad', b); return b; });
    if (bad.length) { F(bad[0][0]).focus(); return; }
    const btn = $('button[type="submit"]', form); btn.disabled = true; $('span', btn).textContent = 'Sending…';
    try { await api.send({ name: F('name').value.trim(), email: F('email').value.trim(), mobile: F('mobile').value, message: msg }); form.reset(); $('#ctSent').hidden = false; }
    catch (err) { $('#ctMsgErr').textContent = 'Could not send right now. Please call or email us.'; F('message').closest('.ct-f').classList.add('bad'); }
    finally { btn.disabled = false; $('span', btn).textContent = 'Submit'; }
  });
})();
