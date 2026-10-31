/* FixPapa · Set 5 · Homepage GST business section (#gst)
   ITC calculator (monthly spend → yearly GST credit, amounts treated as GST-inclusive at 18%) and a GSTIN checker
   that validates locally with FPAuth.gstCheck and fills a sample tax invoice: CGST 9% + SGST 9% for Rajasthan
   (FixPapa is in Jaipur, state 08), IGST 18% for other states. "Create business account" opens the auth.js
   register popup as Business with the GSTIN prefilled; signed-in users go to their profile. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const sec = $('#gst'); if (!sec) return;
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

  /* calculator */
  const R = $('#gbSpend'), paint = () => {
    const v = +R.value; $('#gbSpendV').textContent = inr(v);
    $('#gbYear').textContent = inr(v * 12 * 18 / 118);
    R.style.setProperty('--p', ((v - R.min) / (R.max - R.min) * 100) + '%');
  };
  R.addEventListener('input', paint); paint();

  /* GSTIN checker → invoice preview */
  const G = $('#gbGst'), st = $('#gbStatus'), inv = $('#gbInv');
  const DEF = st.textContent;
  let valid = '';
  const check = (G0) => (window.FPAuth && FPAuth.gstCheck ? FPAuth.gstCheck(G0) : { ok: false, err: '' });
  const tax = (local) => local
    ? '<tr class="tax"><td>CGST 9%</td><td>₹1,845</td></tr><tr class="tax"><td>SGST 9%</td><td>₹1,845</td></tr>'
    : '<tr class="tax"><td>IGST 18%</td><td>₹3,690</td></tr>';
  const render = (r) => {
    valid = r && r.ok ? r.gstin : '';
    sec.classList.toggle('gb-ok', !!valid);
    $('#gbToG').textContent = valid || '— — —';
    $('#gbTo').textContent = valid ? 'Your business · PAN ' + r.pan : 'Your business';
    $('#gbPos').textContent = valid ? `${r.state} (${r.code})` : '—';
    $('#gbTax').innerHTML = valid ? tax(r.code === '08') : '<tr class="tax"><td>GST 18%</td><td>₹3,690</td></tr>';
    if (valid) { inv.classList.remove('flash'); void inv.offsetWidth; inv.classList.add('flash'); }
  };
  G.addEventListener('input', () => {
    G.value = G.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    st.className = 'gb-status';
    if (G.value.length === 15) return run();
    render(null); st.textContent = G.value ? `${G.value.length}/15 characters` : DEF;
  });
  const run = () => {
    const r = check(G.value);
    render(r);
    if (r.ok) { st.className = 'gb-status ok'; st.textContent = `Valid GSTIN · ${r.state} · ${r.code === '08' ? 'CGST + SGST' : 'IGST'} applies`; }
    else { st.className = 'gb-status bad'; st.textContent = r.err || 'Enter your 15-character GSTIN'; }
  };
  $('#gbCheck').addEventListener('submit', (e) => { e.preventDefault(); run(); });

  $('#gbCta').addEventListener('click', () => {
    if (window.FPAuth && FPAuth.user()) { if (window.FPGstBoard) FPGstBoard.open(); else location.href = 'account.html#profile'; return; }
    if (!window.FPAuth) { location.href = 'account.html'; return; }
    FPAuth.open('account.html', 'register', { type: 'firm', gst: valid || G.value });
  });
})();
