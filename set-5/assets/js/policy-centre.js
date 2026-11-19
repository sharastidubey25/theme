/* FixPapa · Set 5 · Policy Centre (policies.html). Search across every clause (hides non-matching sections, opens and
   highlights matches), Expand / Collapse all, and deep links: #s5-6 opens sub-section 5.6, key-timeline tiles open theirs.
   policy.js (loaded first) keeps the contents highlight in sync. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const input = $('#pcSearch'); if (!input) return;
  const clear = $('#pcClear'), status = $('#pcStatus'), empty = $('#pcEmpty'), allBtn = $('#pcAll');
  const secs = $$('.pc-sec'), accs = $$('.pc-acc'), toc = $$('#plToc a');
  const defaultStatus = status.textContent;
  const marked = new Set();

  const unmark = () => { marked.forEach((m) => m.replaceWith(m.textContent)); marked.clear(); secs.forEach((s) => s.normalize()); };
  const mark = (root, q) => {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentNode.closest('svg,summary small') ? 2 : 1 });
    const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
    nodes.forEach((n) => {
      if (!re.test(n.data)) return; re.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0;
      n.data.replace(re, (m, i) => {
        frag.append(n.data.slice(last, i)); const el = document.createElement('mark'); el.textContent = m; frag.append(el); marked.add(el); last = i + m.length;
      });
      frag.append(n.data.slice(last)); n.replaceWith(frag);
    });
  };
  const setAll = (open) => { accs.forEach((d) => (d.open = open)); allBtn.setAttribute('aria-pressed', open); allBtn.querySelector('span').textContent = open ? 'Collapse all' : 'Expand all'; };

  let t;
  const run = () => {
    const q = input.value.trim(); clear.hidden = !q; unmark();
    if (q.length < 2) {
      secs.forEach((s) => (s.hidden = false)); accs.forEach((d) => (d.hidden = false)); toc.forEach((a) => a.classList.remove('is-off'));
      empty.hidden = true; status.textContent = defaultStatus; return;
    }
    const lq = q.toLowerCase(); let hits = 0, pols = 0;
    secs.forEach((s) => {
      const subs = $$('.pc-acc', s);
      const headHit = $('.pc-sec-h', s).textContent.toLowerCase().includes(lq);
      const intro = [...s.children].filter((c) => !c.matches('.pc-sec-h,.pc-accs')).some((c) => c.textContent.toLowerCase().includes(lq));
      let any = headHit || intro;
      subs.forEach((d) => {
        const hit = headHit || d.textContent.toLowerCase().includes(lq);
        d.hidden = !hit; d.open = hit && !headHit; if (hit) { any = true; hits++; }
      });
      if (!subs.length && any) hits++;
      s.hidden = !any; if (any) { pols++; mark(s, q); }
      const a = toc.find((x) => x.getAttribute('href') === '#' + s.id); if (a) a.classList.toggle('is-off', !any);
    });
    empty.hidden = pols > 0; $('span', empty).textContent = q;
    status.textContent = pols ? `${hits} match${hits === 1 ? '' : 'es'} in ${pols} polic${pols === 1 ? 'y' : 'ies'}` : 'No matches';
  };
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 160); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; run(); } });
  clear.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
  allBtn.addEventListener('click', () => setAll(allBtn.getAttribute('aria-pressed') !== 'true'));

  // deep links: #s5-6 opens that sub-section; a policy id (#returns) opens its first one
  const openHash = (id, scroll) => {
    const el = id && document.getElementById(id); if (!el) return;
    if (input.value) { input.value = ''; run(); }
    const d = el.matches('.pc-acc') ? el : $('.pc-acc', el);
    if (d) d.open = true;
    if (scroll) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  $$('[data-open]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.open); openHash(a.dataset.open, true); }));
  addEventListener('hashchange', () => openHash(location.hash.slice(1), false));
  if (location.hash) openHash(location.hash.slice(1), true);
  else secs.forEach((s) => { const d = $('.pc-acc', s); if (d) d.open = true; });
})();
