/* FixPapa · Set 5 · FAQs (faqs.html). The questions are plain <details> in the HTML (grouped by .fq-group[data-cat]);
   this adds the category tabs (faqs.html#amc|service|inventory|support|general), live search over questions and answers,
   and deep links to one question (#q5 opens and scrolls to it). */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const list = $('#fqList'); if (!list) return;
  const tabs = $$('.fq-tabs [data-cat]'), groups = $$('.fq-group', list), input = $('#fqSearch');
  const items = $$('details', list).map((d) => ({ d, g: d.closest('.fq-group'), text: d.textContent.toLowerCase() }));
  let cat = 'all';

  const render = () => {
    const q = input.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach((it) => {
      const ok = (cat === 'all' || it.g.dataset.cat === cat) && words.every((w) => it.text.includes(w));
      it.d.hidden = !ok; if (ok) shown++;
      if (q && ok && words.length) it.d.open = true;
    });
    groups.forEach((g) => { g.hidden = !$$('details:not([hidden])', g).length; });
    $('#fqNone').hidden = !!shown; $('#fqTerm').textContent = input.value.trim();
    $('#fqCount').textContent = q ? `${shown} ${shown === 1 ? 'answer' : 'answers'} for “${input.value.trim()}”` : '';
  };
  const pick = (c, push) => {
    cat = tabs.some((t) => t.dataset.cat === c) ? c : 'all';
    tabs.forEach((t) => { const on = t.dataset.cat === cat; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    const lay = $('.fq-layout'); if (push && lay.getBoundingClientRect().top < 0) lay.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (push) history.replaceState(null, '', cat === 'all' ? location.pathname + location.search : '#' + cat);
    render();
  };
  tabs.forEach((t) => t.addEventListener('click', () => pick(t.dataset.cat, true)));
  $('.fq-tabs').addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement); if (i < 0 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault(); const n = tabs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); pick(n.dataset.cat, true);
  });
  input.addEventListener('input', render);
  $('#fqClear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });

  const fromHash = () => {
    const h = location.hash.slice(1), d = /^q\d+$/.test(h) && document.getElementById(h);
    if (d) { pick('all'); d.open = true; requestAnimationFrame(() => d.scrollIntoView({ block: 'center' })); return; }
    pick(h || 'all');
  };
  addEventListener('hashchange', fromHash);
  fromHash();
})();
