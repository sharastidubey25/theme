/* FixPapa · Set 5 · FixPapa Pulse page (pulse.html) — mirrors pulse.fixpapa.com in the Set 5 theme.
   Download menu → mobile OTP → download; plan "Buy now" → mobile OTP → checkout; Windows/Mac pricing switch;
   FAQ "Show all"; lazy demo video; contact form (no links/scripts).
   Demo mode accepts any 6-digit OTP and hands off to the official Pulse site. Configure with
   window.FPPulseConfig = { downloads: { win, 'mac-arm', 'mac-intel' }, checkoutUrl } and/or
   window.FPPulseApi = { sendOtp(mobile), verifyOtp(mobile, otp), enquiry(form) } (Promises). */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cfg = Object.assign({ downloads: {}, checkoutUrl: 'https://www.fixpapa.com/?pulseSSO=1' }, window.FPPulseConfig || {});
  const OFFICIAL = 'https://pulse.fixpapa.com/';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const api = window.FPPulseApi || { demo: true, sendOtp: () => wait(600), verifyOtp: (m, otp) => wait(500).then(() => { if (!/^\d{6}$/.test(otp)) throw new Error('otp'); }), enquiry: () => wait(700) };
  const PLATFORM = { win: 'Windows (64-bit) · v1.0.10', 'mac-arm': 'macOS (Apple Silicon) · v1.0.0 Beta', 'mac-intel': 'macOS (Intel) · v1.0.0 Beta' };

  /* ---------- hero dashboard (same visual as the homepage Pulse section): fit screens, draw charts, count up ---------- */
  const dash = $('#plDash');
  if (dash) {
    const screens = $$('.fpp-screen', dash);
    const fit = () => screens.forEach((sc) => sc.style.setProperty('--s', sc.clientWidth / 720));
    fit(); if (window.ResizeObserver) new ResizeObserver(fit).observe(dash);
    const nums = $$('[data-to]', dash);
    if (!reduce) nums.forEach((n) => { n.textContent = '0'; });
    const run = () => {
      dash.classList.add('in'); if (reduce) return;
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3); nums.forEach((n) => { n.textContent = Math.round(+n.dataset.to * e); }); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    if (!window.IntersectionObserver) run();
    else { const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(); } }, { threshold: .3 }); io.observe(dash); }
  }

  /* ---------- download menu ---------- */
  const dl = $('.pl-dl'), dlBtn = $('.pl-dl-btn', dl), dlMenu = $('.pl-dl-menu', dl), items = $$('[role="menuitem"]', dlMenu);
  const menu = (open) => { dlMenu.hidden = !open; dlBtn.setAttribute('aria-expanded', open); if (open) items[0].focus(); };
  dlBtn.addEventListener('click', () => menu(dlMenu.hidden));
  document.addEventListener('click', (e) => { if (!dlMenu.hidden && !e.target.closest('.pl-dl')) menu(false); });
  dlMenu.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
    if (e.key === 'Escape') { menu(false); dlBtn.focus(); }
  });
  items.forEach((b) => b.addEventListener('click', () => { menu(false); verify({ kind: 'download', platform: b.dataset.platform }); }));
  $$('[data-download-scroll]').forEach((b) => b.addEventListener('click', () => {
    $('#download').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(() => menu(true), reduce ? 0 : 650);
  }));

  /* ---------- Windows / Mac pricing ---------- */
  let os = 'win';
  const osTabs = $$('.pl-os-tabs [role="radio"]');
  osTabs.forEach((b) => b.addEventListener('click', () => {
    os = b.dataset.os; osTabs.forEach((x) => x.setAttribute('aria-checked', x === b));
    $$('.pl-price b[data-win]').forEach((p) => { p.textContent = p.dataset[os]; p.classList.remove('flip'); void p.offsetWidth; p.classList.add('flip'); });
  }));
  $$('[data-buy]').forEach((b) => b.addEventListener('click', () => {
    const card = b.closest('.pl-plan'), price = $('.pl-price', card).textContent.trim();
    verify({ kind: 'buy', plan: $('h3', card).textContent, price, os });
  }));

  /* ---------- mobile verification modal ---------- */
  const dlg = $('#plOtp'), form = $('#plOtpForm'), M = form.elements.mobile, O = form.elements.otp, go = $('.pl-otp-go', form);
  let job = null, step = 1, from;
  const stepTo = (n) => {
    step = n;
    $$('[data-s]', form).forEach((el) => { el.hidden = +el.dataset.s !== n && !(n === 2 && el.dataset.s === '1'); });
    M.readOnly = n === 2; go.hidden = n === 3;
    $('span', go).textContent = n === 1 ? 'Send OTP' : 'Verify & continue';
    $$('.pl-f.bad', form).forEach((l) => l.classList.remove('bad'));
  };
  function verify(j) {
    job = j; from = document.activeElement;
    $('#plOtpT').textContent = 'Verify your mobile number';
    $('#plOtpD').textContent = j.kind === 'download' ? "We'll text you a one-time code before your download starts." : "We'll text you a one-time code, then take you to secure checkout.";
    $('#plOtpFor').innerHTML = j.kind === 'download' ? `<svg width="16" height="16"><use href="#i-download"/></svg>${PLATFORM[j.platform]}` : `<svg width="16" height="16"><use href="#i-tag"/></svg>${j.plan} plan · ${j.os === 'mac' ? 'Mac' : 'Windows'} · ${j.price}`;
    O.value = ''; stepTo(1); dlg.hidden = false; document.body.style.overflow = 'hidden'; M.focus();
  }
  const close = () => { dlg.hidden = true; document.body.style.overflow = ''; from && from.focus(); };
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) close(); });
  [M, O].forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, ''); i.closest('.pl-f').classList.remove('bad'); }));
  $('#plOtpEdit').addEventListener('click', () => { stepTo(1); M.focus(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!/^[6-9]\d{9}$/.test(M.value)) { M.closest('.pl-f').classList.add('bad'); M.focus(); return; }
      go.disabled = true; try { await api.sendOtp(M.value); } finally { go.disabled = false; }
      $('#plOtpHint').textContent = `Sent to +91 ${M.value}${api.demo ? ' · demo: any 6 digits' : ''}`;
      stepTo(2); O.focus(); return;
    }
    if (step === 2) {
      go.disabled = true;
      try { await api.verifyOtp(M.value, O.value); } catch (err) { O.closest('.pl-f').classList.add('bad'); O.focus(); go.disabled = false; return; }
      go.disabled = false;
      const btn = $('#plDoneBtn');
      if (job.kind === 'download') {
        $('#plDoneT').textContent = 'Your download is ready';
        $('#plDoneD').textContent = `${PLATFORM[job.platform]}. Run the installer and sign in with this mobile number.`;
        btn.textContent = 'Download'; btn.href = cfg.downloads[job.platform] || OFFICIAL;
      } else {
        $('#plDoneT').textContent = 'Number verified';
        $('#plDoneD').textContent = `${job.plan} plan for ${job.os === 'mac' ? 'Mac' : 'Windows'} at ${job.price}. Continue to secure checkout to activate it.`;
        btn.textContent = 'Continue to checkout'; btn.href = cfg.checkoutUrl;
      }
      $('#plOtpT').textContent = 'All set'; $('#plOtpD').textContent = '';
      stepTo(3); btn.focus();
    }
  });

  /* ---------- FAQ: show all ---------- */
  const more = $('#plMore'), extra = $$('.pl-faq [data-more]'), label = more.textContent;
  more.addEventListener('click', () => {
    const open = more.getAttribute('aria-expanded') !== 'true';
    extra.forEach((d) => { d.hidden = !open; }); more.setAttribute('aria-expanded', open); more.textContent = open ? 'Show fewer' : label;
    if (!open) more.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- demo video: loads only when asked ---------- */
  const v = $('#plVideo'), play = $('#plPlay');
  play.addEventListener('click', () => { if (!v.src) v.src = v.dataset.src; v.controls = true; v.muted = false; v.play().catch(() => {}); play.hidden = true; });

  /* ---------- contact form ---------- */
  const cf = $('#plForm'), C = (n) => cf.elements[n];
  $$('[data-enquiry]').forEach((a) => a.addEventListener('click', () => { C('type').value = a.dataset.enquiry; }));
  C('phone').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
  cf.addEventListener('input', (e) => { const l = e.target.closest('.pl-f.bad'); if (l) l.classList.remove('bad'); $('#plSent').hidden = true; });
  cf.addEventListener('change', (e) => { const l = e.target.closest('.pl-f.bad'); if (l) l.classList.remove('bad'); });
  const linky = /(https?:\/\/|www\.|<\s*\/?\s*[a-z!]|javascript:|\[url)/i;
  cf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = C('msg').value.trim();
    $('#plMsgErr').textContent = msg && linky.test(msg) ? 'Please remove links or code from your message.' : 'Please describe what you need.';
    const rules = [['name', (x) => /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(x.trim()) && !linky.test(x)], ['company', (x) => x.trim().length > 1 && !linky.test(x)],
      ['phone', (x) => /^[6-9]\d{9}$/.test(x)], ['email', (x) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.trim())], ['type', (x) => !!x], ['msg', () => msg.length > 4 && !linky.test(msg)]];
    const bad = rules.filter(([n, ok]) => { const b = !ok(C(n).value); C(n).closest('.pl-f').classList.toggle('bad', b); return b; });
    if (bad.length) { C(bad[0][0]).focus(); return; }
    const btn = $('button[type="submit"]', cf); btn.disabled = true; $('span', btn).textContent = 'Sending…';
    try { await api.enquiry(Object.fromEntries(new FormData(cf))); cf.reset(); $('#plSent').hidden = false; }
    finally { btn.disabled = false; $('span', btn).textContent = 'Send message'; }
  });
})();
