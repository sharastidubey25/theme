/* FixPapa · Set 5 · Partner program (partner.html#partner|#freelancer)
   Every "Become a Partner / Freelancer" button opens the join dialog with the matching choices from the live site:
   partner → partner panel (partner.fixpapa.com) or the app; freelancer → the FixPapa Engineer app. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const dlg = $('#ptDlg'); if (!dlg) return;
  let from;
  const open = (kind) => {
    from = document.activeElement;
    $$('[data-pane]', dlg).forEach((p) => { p.hidden = p.dataset.pane !== kind; });
    const pane = $(`[data-pane="${kind}"]`, dlg); dlg.setAttribute('aria-labelledby', ($('h2', pane).id = 'ptDlgT'));
    $$('h2', dlg).forEach((h) => { if (!pane.contains(h)) h.removeAttribute('id'); });
    dlg.hidden = false; document.body.style.overflow = 'hidden'; $('a', pane).focus();
  };
  const close = () => { dlg.hidden = true; document.body.style.overflow = ''; if (location.hash) history.replaceState(null, '', location.pathname); from && from.focus(); };
  $$('[data-join]').forEach((b) => b.addEventListener('click', () => open(b.dataset.join)));
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) close(); });
  // partner.html#freelancer (or #partner) opens the dialog straight away
  const h = location.hash.slice(1); if (h === 'partner' || h === 'freelancer') open(h);
})();
