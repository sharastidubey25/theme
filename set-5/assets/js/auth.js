/* FixPapa · Set 5 · Login / Register popup (mobile + OTP)
   Opens when a signed-out visitor clicks any link to account.html (header icon, phone menu) or any [data-login]
   element; account.html itself opens it on load when signed out (closing it goes back to the homepage).
   Steps: Login | Create account tabs → mobile (+ name & account type when registering) → 6-box OTP with resend
   timer → success, then continues to the link that was clicked.
   Session is kept in localStorage 'fp-auth' ({ mobile, name, type, at }); registering also seeds 'fp-profile'.
   Demo mode accepts any 6-digit OTP. A backend plugs in through
   Register: account type; name + optional email; Business / Government add firm name, optional GSTIN (format and
   check digit verified locally, state + PAN decoded; optional api.validateGst for the legal name) and a partner code.
   window.FPAuthApi = { sendOtp(mobile, mode), verifyOtp(mobile, otp, mode, details) → { name?, type? },
   validateGst?(gstin) → { legalName? } } (Promises).
   window.FPAuth = { user(), open(next, mode, { type, gst, firm }), logout(), gstCheck(gstin), gstState(code) }.
   [data-login] triggers: data-login="next-url", data-login-mode="register", data-login-type="firm". */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'fp-auth', wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const demo = !window.FPAuthApi;
  const api = window.FPAuthApi || {
    sendOtp: () => wait(650),
    verifyOtp: (m, otp) => wait(550).then(() => { if (!/^\d{6}$/.test(otp)) throw new Error('otp'); return {}; })
  };
  const user = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const save = (u) => { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {} };
  const logout = () => { try { localStorage.removeItem(KEY); } catch (e) {} };
  const isAccount = (a) => /(^|\/)account\.html(#.*)?$/.test(a.getAttribute('href') || '');
  const onAccount = /(^|\/)account\.html$/.test(location.pathname);

  const I = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
    bolt: '<path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    building: '<path d="M4 21V5.5L12 3v18M12 8.5l8 2.5v10M2.5 21h19M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
    receipt: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z"/><path d="M9 7.5h6M9 11h6M9 14.5h3.5"/>',
    tag: '<path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'
  };

  /* GSTIN: format + checksum (no network), decodes state and PAN */
  const STATES = { '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', 10: 'Bihar', 11: 'Sikkim', 12: 'Arunachal Pradesh', 13: 'Nagaland', 14: 'Manipur', 15: 'Mizoram', 16: 'Tripura', 17: 'Meghalaya', 18: 'Assam', 19: 'West Bengal', 20: 'Jharkhand', 21: 'Odisha', 22: 'Chhattisgarh', 23: 'Madhya Pradesh', 24: 'Gujarat', 26: 'Dadra & Nagar Haveli and Daman & Diu', 27: 'Maharashtra', 29: 'Karnataka', 30: 'Goa', 31: 'Lakshadweep', 32: 'Kerala', 33: 'Tamil Nadu', 34: 'Puducherry', 35: 'Andaman & Nicobar', 36: 'Telangana', 37: 'Andhra Pradesh', 38: 'Ladakh', 97: 'Other Territory' };
  const CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const gstCheck = (raw) => {
    const g = String(raw || '').toUpperCase().replace(/\s/g, '');
    if (g.length !== 15) return { ok: false, gstin: g, err: g ? `${g.length}/15 characters` : '' };
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false, gstin: g, err: 'That does not look like a GSTIN' };
    const state = STATES[g.slice(0, 2)] || STATES[+g.slice(0, 2)];
    if (!state) return { ok: false, gstin: g, err: 'Unknown state code ' + g.slice(0, 2) };
    let sum = 0;
    for (let i = 0; i < 14; i++) { const p = CH.indexOf(g[i]) * (i % 2 ? 2 : 1); sum += Math.floor(p / 36) + (p % 36); }
    if (CH[(36 - (sum % 36)) % 36] !== g[14]) return { ok: false, gstin: g, err: 'Check digit does not match. Please re-check the number' };
    return { ok: true, gstin: g, state, code: g.slice(0, 2), pan: g.slice(2, 12) };
  };
  const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  const root = document.createElement('div');
  root.className = 'au'; root.hidden = true;
  root.innerHTML = `
  <div class="au-bd" data-close></div>
  <div class="au-box" role="dialog" aria-modal="true" aria-labelledby="auT">
    <aside class="au-side">
      <b class="au-logo">Fix<span>Papa</span></b>
      <h3>Everything IT for your home and office, in one account.</h3>
      <ul>
        <li>${ic('tool', 18)}<span><b>Track repairs & tickets</b>Live status from booking to doorstep</span></li>
        <li>${ic('box', 18)}<span><b>Orders, rentals & AMC</b>Invoices and renewals in one place</span></li>
        <li>${ic('bolt', 18)}<span><b>Faster checkout</b>Saved addresses and branches</span></li>
      </ul>
      <p class="au-trust">${ic('shield', 16)}No password needed. We verify you with a one-time code.</p>
    </aside>
    <div class="au-main">
      <button type="button" class="au-x" data-close aria-label="Close">${ic('x', 18)}</button>

      <form class="au-form" id="auForm" novalidate>
        <div class="au-step" data-step="1">
          <div class="au-tabs" role="tablist">
            <button type="button" role="tab" data-mode="login" aria-selected="true">Login</button>
            <button type="button" role="tab" data-mode="register" aria-selected="false">Create account</button>
            <i></i>
          </div>
          <h2 id="auT">Welcome back</h2>
          <p class="au-sub" id="auSub">Log in with your registered mobile number.</p>

          <div class="au-reg" hidden>
            <div class="au-f"><span>Account type</span>
              <div class="au-type" role="radiogroup" aria-label="Account type">
                <button type="button" role="radio" data-v="individual" aria-checked="true">Individual</button>
                <button type="button" role="radio" data-v="firm" aria-checked="false">Business</button>
                <button type="button" role="radio" data-v="government" aria-checked="false">Government</button>
              </div></div>
            <div class="au-row">
              <label class="au-f"><span>Full name</span>
                <div class="au-in">${ic('user', 18)}<input name="name" autocomplete="name" placeholder="Your full name" maxlength="60"></div>
                <em>Please enter your name</em></label>
              <label class="au-f"><span>Email <i>(optional)</i></span>
                <div class="au-in">${ic('mail', 18)}<input name="email" type="email" autocomplete="email" placeholder="you@company.com" maxlength="80"></div>
                <em>Enter a valid email</em></label>
            </div>
            <div class="au-biz" hidden>
              <label class="au-f"><span id="auFirmL">Firm / business name</span>
                <div class="au-in">${ic('building', 18)}<input name="firm" autocomplete="organization" placeholder="As on your GST certificate" maxlength="100"></div>
                <em>Please enter the name</em></label>
              <div class="au-f au-gst"><span>GST number <i>(optional)</i> <small id="auGstN">0/15</small></span>
                <div class="au-gst-row">
                  <div class="au-in">${ic('receipt', 18)}<input name="gst" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. 08ABCDE1234F1Z5" maxlength="15"></div>
                  <button type="button" class="au-val" id="auVal">Validate</button>
                </div>
                <em id="auGstErr">Enter a valid 15-character GSTIN</em>
                <p class="au-gst-ok" id="auGstOk" hidden></p>
                <p class="au-gst-why">Add it now to get GST invoices and claim input tax credit on every order.</p>
              </div>
            </div>
            <button type="button" class="au-link au-pc-t" id="auPcT">Have a partner code?</button>
            <label class="au-f" id="auPc" hidden><span>Partner code</span>
              <div class="au-in">${ic('tag', 18)}<input name="partner" autocomplete="off" placeholder="Partner code" maxlength="20"></div></label>
          </div>

          <label class="au-f"><span>Mobile number</span>
            <div class="au-in au-mob"><b>+91</b><input name="mobile" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="10-digit mobile number" maxlength="10"></div>
            <em>Enter a valid 10-digit mobile number</em></label>

          <button type="submit" class="btn btn-primary au-go"><span>Send OTP</span></button>
          <p class="au-switch" id="auSwitch">New to FixPapa? <button type="button" data-mode="register">Create an account</button></p>
          <p class="au-legal">By continuing you agree to our <a href="terms-and-conditions.html">Terms</a> and <a href="privacy-policy.html">Privacy Policy</a>.</p>
        </div>

        <div class="au-step" data-step="2" hidden>
          <button type="button" class="au-back" id="auBack">${ic('back', 16)}Back</button>
          <div class="au-ic">${ic('phone', 26)}</div>
          <h2>Verify your number</h2>
          <p class="au-sub">Enter the 6-digit code sent to <b id="auNum"></b> <button type="button" class="au-link" id="auEdit">Edit</button></p>
          <div class="au-otp" id="auOtp">${'<input type="text" inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="OTP digit">'.repeat(6)}</div>
          <em class="au-err" id="auErr" hidden>That code didn't work. Check it and try again.</em>
          <p class="au-demo" id="auDemo" hidden>Demo: any 6 digits work</p>
          <button type="submit" class="btn btn-primary au-go"><span>Verify & continue</span></button>
          <p class="au-resend" id="auResend"></p>
        </div>

        <div class="au-step au-done" data-step="3" hidden>
          <div class="au-ok">${ic('check', 30)}</div>
          <h2 id="auDoneT">You're logged in</h2>
          <p class="au-sub" id="auDoneD"></p>
        </div>
      </form>
    </div>
  </div>`;
  document.body.appendChild(root);

  const form = $('#auForm'), M = form.elements.mobile, N = form.elements.name, E = form.elements.email, FIRM = form.elements.firm, G = form.elements.gst, PC = form.elements.partner, boxes = $$('#auOtp input');
  let mode = 'login', next = 'account.html', from, timer, step = 1;

  const setMode = (m) => {
    mode = m;
    $$('.au-tabs [role="tab"]', root).forEach((t) => t.setAttribute('aria-selected', t.dataset.mode === m));
    root.classList.toggle('is-reg', m === 'register');
    const mob = M.closest('.au-f'); // register: mobile sits right after name/email; login: alone above the button
    if (m === 'register') $('.au-row', root).after(mob); else $('.au-step[data-step="1"] .au-go', root).before(mob);
    $('.au-reg', root).hidden = m !== 'register';
    $('#auT').textContent = m === 'register' ? 'Create your account' : 'Welcome back';
    $('#auSub').textContent = m === 'register' ? 'It takes less than a minute. No password needed.' : 'Log in with your registered mobile number.';
    $('#auSwitch').innerHTML = m === 'register'
      ? 'Already have an account? <button type="button" data-mode="login">Log in</button>'
      : 'New to FixPapa? <button type="button" data-mode="register">Create an account</button>';
    $$('.au-f.bad', root).forEach((f) => f.classList.remove('bad'));
  };
  const show = (n) => {
    step = n;
    $$('.au-step', root).forEach((s) => { s.hidden = +s.dataset.step !== n; });
    if (n === 1) (mode === 'register' && !N.value ? N : M).focus();
    if (n === 2) boxes[0].focus();
  };
  const busy = (b) => { $$('.au-go', root).forEach((g) => { g.disabled = b; g.classList.toggle('is-busy', b); }); };

  /* account type → business fields; GSTIN counter + validate */
  const typeOf = () => ($('.au-type [aria-checked="true"]', root) || {}).dataset?.v || 'individual';
  const setType = (t) => {
    $$('.au-type [role="radio"]', root).forEach((b) => b.setAttribute('aria-checked', b.dataset.v === t));
    $('.au-biz', root).hidden = t === 'individual';
    $('#auFirmL').textContent = t === 'government' ? 'Department / office name' : 'Firm / business name';
  };
  let gstOk = null;
  const gstReset = () => { gstOk = null; $('#auGstOk').hidden = true; G.closest('.au-f').classList.remove('bad', 'good'); };
  G.addEventListener('input', () => {
    G.value = G.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    $('#auGstN').textContent = `${G.value.length}/15`; gstReset();
    if (G.value.length === 15) validateGst();
  });
  const validateGst = async () => {
    const r = gstCheck(G.value), f = G.closest('.au-f');
    if (!r.ok) { $('#auGstErr').textContent = r.err || 'Enter your 15-character GSTIN'; f.classList.add('bad'); return false; }
    const b = $('#auVal'); b.disabled = true; b.textContent = 'Checking…';
    let info = {};
    try { if (api.validateGst) info = await api.validateGst(r.gstin) || {}; } catch (e) { b.disabled = false; b.textContent = 'Validate'; $('#auGstErr').textContent = 'GSTIN not found on the GST portal'; f.classList.add('bad'); return false; }
    b.disabled = false; b.textContent = 'Validate';
    gstOk = r.gstin; f.classList.add('good');
    $('#auGstOk').innerHTML = `${ic('check', 14)}<span><b>${info.legalName || 'Valid GSTIN'}</b> · ${r.state} · PAN ${r.pan}</span>`;
    $('#auGstOk').hidden = false;
    if (info.legalName && !FIRM.value) FIRM.value = info.legalName;
    return true;
  };
  $('#auVal').addEventListener('click', validateGst);
  $('#auPcT').addEventListener('click', () => { $('#auPc').hidden = false; $('#auPcT').hidden = true; PC.focus(); });
  [E, FIRM].forEach((el) => el.addEventListener('input', () => el.closest('.au-f').classList.remove('bad')));

  const open = (to = 'account.html', m = 'login', pre = {}) => {
    next = to; from = document.activeElement;
    setMode(m); [M, N, E, FIRM, G, PC].forEach((el) => { el.value = ''; }); boxes.forEach((b) => { b.value = ''; });
    setType(pre.type || 'individual'); gstReset(); $('#auGstN').textContent = '0/15';
    $('#auPc').hidden = true; $('#auPcT').hidden = false;
    if (pre.firm) FIRM.value = pre.firm;
    if (pre.gst) { G.value = pre.gst; $('#auGstN').textContent = `${G.value.length}/15`; if (G.value.length === 15) validateGst(); }
    root.hidden = false; document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => root.classList.add('on'));
    show(1);
  };
  const close = () => {
    if (step === 3) return;
    if (onAccount && !user()) { location.href = 'index.html'; return; }
    root.classList.remove('on'); clearInterval(timer);
    setTimeout(() => { root.hidden = true; document.body.style.overflow = ''; from && from.focus && from.focus(); }, 200);
  };

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return close();
    const t = e.target.closest('[data-mode]'); if (t) { setMode(t.dataset.mode); show(1); }
    const r = e.target.closest('.au-type [role="radio"]'); if (r) setType(r.dataset.v);
  });
  addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('button,input,a[href]', $('.au-box', root)).filter((el) => !el.closest('[hidden]') && !el.disabled);
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  M.addEventListener('input', () => { M.value = M.value.replace(/\D/g, '').slice(0, 10); M.closest('.au-f').classList.remove('bad'); });
  N.addEventListener('input', () => N.closest('.au-f').classList.remove('bad'));

  /* OTP boxes: auto-advance, backspace, paste a full code */
  const code = () => boxes.map((b) => b.value).join('');
  const clearErr = () => { $('#auErr').hidden = true; $('#auOtp').classList.remove('bad'); };
  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      const d = b.value.replace(/\D/g, '');
      if (d.length > 1) { d.slice(0, 6 - i).split('').forEach((c, k) => { boxes[i + k].value = c; }); boxes[Math.min(i + d.length, 5)].focus(); }
      else { b.value = d; if (d && i < 5) boxes[i + 1].focus(); }
      clearErr();
      if (code().length === 6) form.requestSubmit();
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !b.value && i) { boxes[i - 1].value = ''; boxes[i - 1].focus(); e.preventDefault(); }
      if (e.key === 'ArrowLeft' && i) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus();
    });
    b.addEventListener('focus', () => b.select());
  });

  const startTimer = () => {
    let s = 30; const el = $('#auResend');
    const tick = () => { el.innerHTML = s > 0 ? `Resend code in <b>0:${String(s).padStart(2, '0')}</b>` : `Didn't get it? <button type="button" class="au-link" id="auAgain">Resend OTP</button>`; s--; if (s < -1) clearInterval(timer); };
    clearInterval(timer); tick(); timer = setInterval(tick, 1000);
  };
  root.addEventListener('click', async (e) => {
    if (e.target.id !== 'auAgain') return;
    await api.sendOtp(M.value, mode); boxes.forEach((b) => { b.value = ''; }); clearErr(); boxes[0].focus(); startTimer();
  });
  $('#auBack').addEventListener('click', () => { clearInterval(timer); show(1); });
  $('#auEdit').addEventListener('click', () => { clearInterval(timer); show(1); M.select(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (step === 1) {
      let ok = true;
      if (mode === 'register') {
        if (N.value.trim().length < 2) { N.closest('.au-f').classList.add('bad'); ok = false; }
        if (E.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(E.value)) { E.closest('.au-f').classList.add('bad'); ok = false; }
        if (typeOf() !== 'individual') {
          if (FIRM.value.trim().length < 2) { FIRM.closest('.au-f').classList.add('bad'); ok = false; }
          if (G.value && gstOk !== G.value && !(await validateGst())) ok = false;
        }
      }
      if (!/^[6-9]\d{9}$/.test(M.value)) { M.closest('.au-f').classList.add('bad'); ok = false; }
      if (!ok) return $('.au-f.bad input', root).focus();
      busy(true);
      try { await api.sendOtp(M.value, mode); } catch (err) { busy(false); M.closest('.au-f').classList.add('bad'); return; }
      busy(false);
      $('#auNum').textContent = `+91 ${M.value.slice(0, 5)} ${M.value.slice(5)}`;
      $('#auDemo').hidden = !demo;
      boxes.forEach((b) => { b.value = ''; }); clearErr(); show(2); startTimer();
    } else if (step === 2) {
      if (code().length < 6) { $('#auOtp').classList.add('bad'); return boxes.find((b) => !b.value).focus(); }
      busy(true);
      const type = typeOf(), biz = type !== 'individual';
      const details = mode === 'register' ? { name: N.value.trim(), email: E.value.trim(), type, firm: biz ? FIRM.value.trim() : '', gst: biz ? G.value : '', partner: PC.value.trim() } : null;
      let res;
      try { res = await api.verifyOtp(M.value, code(), mode, details) || {}; }
      catch (err) { busy(false); $('#auErr').hidden = false; $('#auOtp').classList.add('bad'); boxes.forEach((b) => { b.value = ''; }); return boxes[0].focus(); }
      busy(false); clearInterval(timer);
      const u = { mobile: M.value, name: res.name || (details ? details.name : ''), type: res.type || (details ? type : ''), gst: res.gst || (details ? details.gst : ''), at: Date.now() };
      save(u);
      if (demo && mode === 'register') { // seed the demo profile shown on account.html
        try { const p = JSON.parse(localStorage.getItem('fp-profile') || '{}'); localStorage.setItem('fp-profile', JSON.stringify({ ...p, name: u.name, mobile: u.mobile, type: u.type, email: details.email, firm: details.firm, gst: details.gst, hasCode: details.partner ? '1' : '0', code: details.partner })); } catch (er) {}
      }
      $('#auDoneT').textContent = mode === 'register' ? 'Account created' : "You're logged in";
      $('#auDoneD').textContent = `${u.name ? 'Hi ' + u.name.split(' ')[0] + ', t' : 'T'}aking you to My Account…`;
      show(3);
      setTimeout(() => { if (onAccount && /account\.html/.test(next) && !/#/.test(next)) location.reload(); else location.href = next; }, 1100);
    }
  });

  /* triggers */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a[href], [data-login]'); if (!t || user()) return;
    if (t.hasAttribute('data-login')) { e.preventDefault(); return open(t.getAttribute('data-login') || 'account.html', t.dataset.loginMode || 'login', { type: t.dataset.loginType }); }
    if (isAccount(t) && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); open(t.getAttribute('href')); }
  }, true);
  if (onAccount && !user()) open(location.hash ? 'account.html' + location.hash : 'account.html');

  window.FPAuth = { user, open, logout, gstCheck, gstState: (c) => STATES[c] || STATES[+c] || '' };
})();
