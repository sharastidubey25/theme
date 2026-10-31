/* FixPapa · Set 5 · GST hanging board + "Add GST" flow (every page, after auth.js)
   Everyone except signed-in users who already have a GSTIN sees a café-style sign hanging under the header
   ("GST · Invoices OFF"). It drops in, swings, and on click flips like an OPEN/CLOSED board, then opens the flow.
   The flow stars "Billu", an SVG cartoon invoice printer: each keystroke prints a receipt line (state, PAN, ID),
   Billu watches while you type, shakes and frowns at a bad GSTIN, smiles and stamps the receipt when it is valid
   (local checksum via FPAuth.gstCheck). Step 2 asks the business name (printed as "TO …" plus CGST+SGST / IGST).
   Signed in: step 3 party (Billu jumps, ₹ coins fountain, receipt flies off); the board flips to "GST ON" and leaves.
   Signed out: step 2 hands the GSTIN + name to the register popup (Business).
   Saves to localStorage 'fp-auth' (.gst, .firm) and 'fp-profile' (gst, firm, type 'firm' if it was individual).
   Hidden for 3 days after × ('fp-gst-board' = time). Backend: window.FPAuthApi.saveGst({ gstin, firm }) (Promise).
   Anything with [data-gst-flow] opens the flow directly. window.FPGstBoard = { open() }. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const A = window.FPAuth; if (!A) return;
  const HIDE = 'fp-gst-board', DAYS = 3;
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = (p, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const X = svg('<path d="M6 6l12 12M18 6L6 18"/>', 14), OK = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 16);

  /* ---------- the hanging board ---------- */
  const board = document.createElement('div');
  board.className = 'gbd'; board.hidden = true;
  board.innerHTML = `
    <span class="gbd-nail" aria-hidden="true"></span>
    <div class="gbd-swing">
      <svg class="gbd-strings" width="150" height="40" viewBox="0 0 150 40" aria-hidden="true"><path d="M75 3L22 40M75 3l53 37"/></svg>
      <button type="button" class="gbd-sign" aria-label="Add your GST number to get GST invoices">
        <span class="gbd-face gbd-front">
          <small>Business?</small>
          <b>GST</b>
          <span class="gbd-state"><i></i>Invoices OFF</span>
          <em>Tap to switch on</em>
        </span>
        <span class="gbd-face gbd-back">
          <small>We're</small>
          <b>OPEN</b>
          <em>for your GSTIN</em>
        </span>
      </button>
      <button type="button" class="gbd-x" aria-label="Hide for now">${X}</button>
    </div>`;
  document.body.appendChild(board);
  const sign = $('.gbd-sign', board);

  const placeBoard = () => { const t = $('.topbar'); board.style.top = Math.round(t ? t.getBoundingClientRect().bottom : 80) + 'px'; };
  const showBoard = () => {
    const u = A.user(), h = get(HIDE);
    if ((u && u.gst) || (h && Date.now() - h < DAYS * 864e5) || /(^|\/)(cart|checkout|payment)\.html$/.test(location.pathname)) return;
    placeBoard(); board.hidden = false;
    requestAnimationFrame(() => board.classList.add('in'));
  };
  addEventListener('resize', placeBoard);
  addEventListener('scroll', () => { if (!board.hidden) { placeBoard(); board.classList.toggle('low', scrollY > 300); } }, { passive: true });
  $('.gbd-x', board).addEventListener('click', () => { put(HIDE, Date.now()); board.classList.remove('in'); setTimeout(() => { board.hidden = true; }, 400); });
  sign.addEventListener('click', () => {
    board.classList.add('flip');
    setTimeout(open, reduce ? 0 : 650);
  });

  /* ---------- the flow: "Billu", a cartoon invoice printer that prints your GSTIN ---------- */
  const BOT = `
    <svg class="gbf-bot" viewBox="0 0 200 170" aria-hidden="true">
      <ellipse class="sh" cx="100" cy="163" rx="56" ry="6"/>
      <g class="legs"><rect x="72" y="140" width="14" height="20" rx="7"/><rect x="114" y="140" width="14" height="20" rx="7"/></g>
      <g class="arm-l"><path d="M54 104c-14 2-22 10-24 20"/><circle cx="29" cy="127" r="6"/></g>
      <g class="arm-r"><path d="M146 104c14-4 22-14 24-26"/><circle cx="171" cy="75" r="6"/></g>
      <rect class="body" x="48" y="58" width="104" height="90" rx="24"/>
      <rect class="shine" x="56" y="64" width="40" height="6" rx="3"/>
      <rect class="slot" x="44" y="52" width="112" height="12" rx="6"/>
      <rect class="screen" x="64" y="78" width="72" height="46" rx="14"/>
      <g class="eyes eyes-o"><g class="eye"><circle cx="86" cy="97" r="5.5"/><circle class="glint" cx="88" cy="95" r="1.6"/></g><g class="eye"><circle cx="114" cy="97" r="5.5"/><circle class="glint" cx="116" cy="95" r="1.6"/></g></g>
      <g class="eyes eyes-h"><path d="M80 99q6-8 12 0M108 99q6-8 12 0"/></g>
      <g class="eyes eyes-x"><path d="M82 93l8 8M90 93l-8 8M110 93l8 8M118 93l-8 8"/></g>
      <ellipse class="cheek" cx="76" cy="109" rx="5" ry="3"/><ellipse class="cheek" cx="124" cy="109" rx="5" ry="3"/>
      <path class="mouth m-smile" d="M93 108q7 7 14 0"/>
      <path class="mouth m-big" d="M90 106q10 13 20 0z"/>
      <path class="mouth m-sad" d="M93 113q7-6 14 0"/>
      <g class="btns"><circle cx="84" cy="136" r="4"/><circle cx="100" cy="136" r="4"/><circle cx="116" cy="136" r="4"/></g>
    </svg>`;
  const COIN = '<span class="gbf-coin">₹</span>';
  const dlg = document.createElement('div');
  dlg.className = 'gbf'; dlg.hidden = true;
  dlg.innerHTML = `
  <div class="gbf-bd" data-close></div>
  <div class="gbf-box" role="dialog" aria-modal="true" aria-labelledby="gbfT">
    <div class="gbf-stage" aria-hidden="true">
      <div class="gbf-dots"><i data-s="1"></i><i data-s="2"></i><i data-s="3"></i></div>
      <span class="gbf-float f1">₹</span><span class="gbf-float f2">%</span><span class="gbf-float f3">₹</span><span class="gbf-spark s1"></span><span class="gbf-spark s2"></span><span class="gbf-spark s3"></span>
      <div class="gbf-bill" id="gbfBill">
        <div class="gbf-bill-in">
          <b class="bh">TAX INVOICE</b>
          <p class="r r1"><i></i><span id="gbfR1"></span></p>
          <p class="r r2"><i></i><span id="gbfR2"></span></p>
          <p class="r r3"><i></i><span id="gbfR3"></span></p>
          <p class="r r4"><i></i><span id="gbfR4"></span></p>
          <p class="r r5"><i></i><span id="gbfR5"></span></p>
          <span class="gbf-stamp">GST<br>OK</span>
        </div>
      </div>
      ${BOT}
      <div class="gbf-fountain">${COIN.repeat(10)}</div>
      <div class="gbf-confetti">${'<i></i>'.repeat(16)}</div>
    </div>
    <button type="button" class="gbf-x" data-close aria-label="Close">${X}</button>

    <form class="gbf-step" data-step="1" novalidate>
      <h2 id="gbfT">Got a <span>GSTIN?</span></h2>
      <p class="gbf-sub">Get 18% back on every IT bill.</p>
      <div class="gbf-in"><input id="gbfIn" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="15" placeholder="Type your 15-digit GSTIN" aria-describedby="gbfMsg"><small id="gbfN">0/15</small></div>
      <p class="gbf-msg" id="gbfMsg" aria-live="polite">Watch Billu print it</p>
      <button type="submit" class="btn gbf-go" disabled>Next</button>
      <p class="gbf-later"><button type="button" data-close>Maybe later</button></p>
    </form>

    <form class="gbf-step" data-step="2" novalidate hidden>
      <h2>Business <span>name?</span></h2>
      <p class="gbf-sub" id="gbfTax"></p>
      <div class="gbf-in"><input id="gbfFirm" autocomplete="organization" maxlength="100" placeholder="As on your GST certificate"></div>
      <p class="gbf-msg gbf-err" id="gbfFirmE" hidden>Please enter your business name</p>
      <button type="submit" class="btn gbf-go">Switch on GST</button>
      <p class="gbf-later"><button type="button" id="gbfBack">Back</button></p>
    </form>

    <div class="gbf-step gbf-done" data-step="3" hidden>
      <h2>GST is <span>ON</span></h2>
      <p class="gbf-sub" id="gbfDoneD"></p>
      <button type="button" class="btn gbf-go" data-close>Awesome</button>
    </div>
  </div>`;
  document.body.appendChild(dlg);

  const IN = $('#gbfIn'), FIRM = $('#gbfFirm'), go1 = $('[data-step="1"] .gbf-go', dlg), bill = $('#gbfBill'), box = $('.gbf-box', dlg);
  let step = 1, res = null, from;
  const mood = (m) => { box.dataset.mood = m; }; // idle | type | happy | sad | party
  const kick = (c) => { box.classList.remove(c); void box.offsetWidth; box.classList.add(c); };
  const row = (n, txt) => { const r = $('.r' + n, bill); $('span', r).textContent = txt || ''; r.classList.toggle('on', !!txt); };
  const rows = () => { const n = $$('.r.on', bill).length; bill.style.setProperty('--rows', n); bill.classList.toggle('is-out', n > 0); };
  const show = (n) => {
    step = n; $$('.gbf-step', dlg).forEach((s) => { s.hidden = +s.dataset.step !== n; });
    $$('.gbf-dots i', dlg).forEach((i) => i.classList.toggle('on', +i.dataset.s <= n));
    box.dataset.at = n;
    (n === 1 ? IN : n === 2 ? FIRM : $('[data-step="3"] .gbf-go', dlg)).focus();
  };
  const open = () => {
    from = document.activeElement;
    const u = A.user(), p = get('fp-profile') || {};
    IN.value = ''; FIRM.value = (u && u.firm) || p.firm || '';
    [1, 2, 3, 4, 5].forEach((n) => row(n, '')); rows(); bill.classList.remove('is-ok', 'is-fly'); paint(); mood('idle');
    $('[data-step="2"] .gbf-go', dlg).textContent = u ? 'Switch on GST' : 'Create business account';
    dlg.hidden = false; document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => dlg.classList.add('on'));
    show(1);
  };
  const close = () => {
    dlg.classList.remove('on');
    setTimeout(() => { dlg.hidden = true; document.body.style.overflow = ''; from && from.focus && from.focus(); }, 220);
    if (step === 3) { // board says "GST ON", then leaves
      board.classList.add('done'); board.classList.remove('flip');
      $('.gbd-front', board).innerHTML = '<small>All set</small><b>GST</b><span class="gbd-state on"><i></i>Invoices ON</span>';
      setTimeout(() => { board.classList.remove('in'); setTimeout(() => { board.hidden = true; }, 500); }, 2200);
    } else board.classList.remove('flip');
  };
  dlg.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', (e) => { if (!dlg.hidden && e.key === 'Escape') close(); });

  /* step 1: every keystroke prints a line on Billu's receipt */
  let idleT;
  function paint() {
    const g = IN.value; $('#gbfN').textContent = `${g.length}/15`;
    const st = g.length >= 2 ? (A.gstState && A.gstState(g.slice(0, 2))) : '';
    row(1, g.length ? `${g.slice(0, 2)}${st ? ' · ' + st : ''}` : '');
    row(2, g.length > 2 ? 'PAN ' + g.slice(2, 12) : '');
    row(3, g.length > 12 ? `ID ${g.slice(12, 15).split('').join(' ')}` : '');
    rows();
    res = g.length === 15 ? A.gstCheck(g) : null;
    const m = $('#gbfMsg'), ok = !!(res && res.ok), bad = !!(res && !res.ok);
    dlg.classList.toggle('valid', ok); dlg.classList.toggle('bad', bad); bill.classList.toggle('is-ok', ok);
    if (!g) { m.textContent = 'Watch Billu print it'; mood('idle'); }
    else if (ok) { m.textContent = 'Valid GSTIN!'; mood('happy'); }
    else if (bad) { m.textContent = res.err; mood('sad'); kick('shake'); }
    else { m.textContent = `${15 - g.length} to go`; mood('type'); }
    go1.disabled = !ok;
  }
  IN.addEventListener('input', () => {
    IN.value = IN.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15); paint(); kick('print');
    clearTimeout(idleT); if (box.dataset.mood === 'type') idleT = setTimeout(() => mood('idle'), 1200);
  });

  $('[data-step="1"]', dlg).addEventListener('submit', async (e) => {
    e.preventDefault(); if (!res || !res.ok) return;
    const api = window.FPAuthApi;
    if (api && api.validateGst) { go1.disabled = true; try { const i = await api.validateGst(res.gstin) || {}; if (i.legalName && !FIRM.value) FIRM.value = i.legalName; } catch (er) { $('#gbfMsg').textContent = 'Not found on the GST portal'; mood('sad'); kick('shake'); return; } finally { go1.disabled = false; } }
    const tax = res.code === '08' ? 'CGST 9% + SGST 9%' : 'IGST 18%';
    $('#gbfTax').textContent = `${res.state} · ${tax}`;
    row(5, tax); bill.classList.remove('is-ok'); firmRow(); mood('idle');
    show(2);
  });
  const firmRow = () => { row(4, FIRM.value.trim() ? 'TO ' + FIRM.value.trim() : 'TO …'); rows(); };
  $('#gbfBack').addEventListener('click', () => { row(4, ''); row(5, ''); paint(); show(1); });
  FIRM.addEventListener('input', () => { $('#gbfFirmE').hidden = true; firmRow(); kick('print'); mood('type'); clearTimeout(idleT); idleT = setTimeout(() => mood('idle'), 1200); });
  $('[data-step="2"]', dlg).addEventListener('submit', async (e) => {
    e.preventDefault();
    const firm = FIRM.value.trim(); if (firm.length < 2) { $('#gbfFirmE').hidden = false; mood('sad'); kick('shake'); return FIRM.focus(); }
    firmRow();
    if (!A.user()) { // signed out: carry the GSTIN and name into the register popup (Business)
      bill.classList.add('is-ok'); mood('happy');
      return setTimeout(() => { close(); setTimeout(() => A.open('account.html', 'register', { type: 'firm', gst: res.gstin, firm }), 230); }, reduce ? 0 : 700);
    }
    const b = $('[data-step="2"] .gbf-go', dlg); b.disabled = true; b.textContent = 'Printing…';
    try { if (window.FPAuthApi && FPAuthApi.saveGst) await FPAuthApi.saveGst({ gstin: res.gstin, firm }); else await new Promise((r) => setTimeout(r, 600)); }
    catch (er) { b.disabled = false; b.textContent = 'Switch on GST'; mood('sad'); return; }
    b.disabled = false; b.textContent = 'Switch on GST';
    put('fp-auth', { ...A.user(), gst: res.gstin, firm });
    const p = get('fp-profile') || {}; put('fp-profile', { ...p, gst: res.gstin, firm, type: !p.type || p.type === 'individual' ? 'firm' : p.type });
    $('#gbfDoneD').textContent = `${firm} · ${res.gstin}`;
    bill.classList.add('is-ok', 'is-fly'); mood('party');
    show(3);
  });

  /* other entry points */
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-gst-flow]'); if (!t) return; e.preventDefault(); open(); });

  setTimeout(showBoard, reduce ? 300 : 1800);
  window.FPGstBoard = { open };
})();
