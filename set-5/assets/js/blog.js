/* FixPapa · Set 5 · Blog. blogs.html (#blogList): featured post + grid, category chips (blogs.html?cat=repair|buying|rental|business|green)
   and search. blog-post.html?slug=… (#blogPost): article, share buttons, related posts. Data: blog-data.js (window.FPBlog). */
(() => {
  const B = window.FPBlog; if (!B) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const url = (p) => `blog-post.html?slug=${encodeURIComponent(p.slug)}`;
  const meta = (p) => `<span class="bl-cat">${esc(B.cats[p.cat])}</span><span>${fmt(p.date)}</span><span>${p.read} min read</span>`;
  const card = (p) => `
    <article class="bl-card">
      <a href="${url(p)}" class="bl-img"><img src="assets/media/${esc(p.img)}" alt="" loading="lazy"></a>
      <div class="bl-body">
        <div class="bl-meta">${meta(p)}</div>
        <h3><a href="${url(p)}">${esc(p.title)}</a></h3>
        <p>${esc(p.excerpt)}</p>
        <a href="${url(p)}" class="bl-more" aria-label="Read: ${esc(p.title)}">Read article<svg width="14" height="14"><use href="#i-arrow"/></svg></a>
      </div>
    </article>`;

  /* ---------------- listing ---------------- */
  const list = $('#blogList');
  if (list) {
    const posts = B.posts.slice().sort((a, b) => b.date.localeCompare(a.date));
    const chips = $('#blogCats'), input = $('#blogSearch');
    const q0 = new URLSearchParams(location.search).get('cat');
    let cat = B.cats[q0] ? q0 : 'all';
    chips.innerHTML = [['all', 'All posts', posts.length], ...Object.entries(B.cats).map(([k, n]) => [k, n, posts.filter((p) => p.cat === k).length])]
      .filter(([, , n]) => n).map(([k, n, c]) => `<button type="button" data-cat="${k}" aria-pressed="${k === cat}">${esc(n)} <small>${c}</small></button>`).join('');
    const render = () => {
      const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const hits = posts.filter((p) => (cat === 'all' || p.cat === cat) && words.every((w) => `${p.title} ${p.excerpt} ${B.cats[p.cat]}`.toLowerCase().includes(w)));
      const lead = !words.length && cat === 'all' ? hits[0] : null, rest = lead ? hits.slice(1) : hits;
      $('#blogFeat').hidden = !lead;
      if (lead) $('#blogFeat').innerHTML = `
        <a href="${url(lead)}" class="bl-feat-img"><img src="assets/media/${esc(lead.img)}" alt=""></a>
        <div class="bl-feat-body"><span class="bl-badge">Latest</span><div class="bl-meta">${meta(lead)}</div><h2><a href="${url(lead)}">${esc(lead.title)}</a></h2><p>${esc(lead.excerpt)}</p>
        <a href="${url(lead)}" class="btn btn--sm" data-ripple>Read article <svg class="arrow" width="16" height="16"><use href="#i-arrow"/></svg></a></div>`;
      list.innerHTML = rest.map(card).join('');
      $('#blogNone').hidden = !!hits.length;
    };
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      cat = b.dataset.cat; $$('[data-cat]', chips).forEach((x) => x.setAttribute('aria-pressed', x === b));
      const u = new URLSearchParams(location.search); cat === 'all' ? u.delete('cat') : u.set('cat', cat);
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '')); render();
    });
    input.addEventListener('input', render);
    $('#blogClear').addEventListener('click', () => { input.value = ''; cat = 'all'; $$('[data-cat]', chips).forEach((x) => x.setAttribute('aria-pressed', x.dataset.cat === 'all')); render(); });
    render();
  }

  /* ---------------- article ---------------- */
  const art = $('#blogPost');
  if (art) {
    const p = B.bySlug(new URLSearchParams(location.search).get('slug'));
    if (!p) { art.innerHTML = '<div class="bl-404"><h1>Article not found</h1><p>It may have moved or been removed.</p><a href="blogs.html" class="btn" data-ripple>Back to the blog</a></div>'; return; }
    document.title = `${p.title} | FixPapa Blog`;
    const d = $('meta[name="description"]'); if (d) d.setAttribute('content', p.excerpt);
    $('#bpCrumb').textContent = p.title;
    const block = ([t, v]) => t === 'h' ? `<h2>${esc(v)}</h2>` : t === 'p' ? `<p>${esc(v)}</p>` : t === 'tip' ? `<aside class="bp-tip"><svg width="18" height="18"><use href="#i-check"/></svg><p>${esc(v)}</p></aside>` : `<${t}>${v.map((x) => `<li>${esc(x)}</li>`).join('')}</${t}>`;
    const here = location.href.split('#')[0], enc = encodeURIComponent;
    art.innerHTML = `
      <header class="bp-head">
        <a href="blogs.html?cat=${p.cat}" class="bl-cat">${esc(B.cats[p.cat])}</a>
        <h1>${esc(p.title)}</h1>
        <p class="bp-lede">${esc(p.excerpt)}</p>
        <div class="bp-by"><span class="bp-av" aria-hidden="true">FP</span><div><b>FixPapa Team</b><small>${fmt(p.date)} · ${p.read} min read</small></div></div>
      </header>
      <img class="bp-hero" src="assets/media/${esc(p.img)}" alt="">
      <div class="bp-wrap">
        <div class="bp-body">${p.body.map(block).join('')}
          <div class="bp-cta"><div><b>Need help with this?</b><span>Certified technicians, genuine parts and doorstep service.</span></div><a href="${p.cta[1]}" class="btn btn--sm" data-ripple>${esc(p.cta[0])} <svg class="arrow" width="16" height="16"><use href="#i-arrow"/></svg></a></div>
        </div>
        <aside class="bp-share" aria-label="Share this article"><small>Share</small>
          <a href="https://wa.me/?text=${enc(p.title + ' ' + here)}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">WA</a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${enc(here)}" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><svg width="15" height="15"><use href="#i-in"/></svg></a>
          <a href="https://twitter.com/intent/tweet?text=${enc(p.title)}&url=${enc(here)}" target="_blank" rel="noopener" aria-label="Share on X"><svg width="14" height="14"><use href="#i-x"/></svg></a>
          <button type="button" id="bpCopy" aria-label="Copy link"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>
        </aside>
      </div>`;
    $('#bpCopy').addEventListener('click', (e) => {
      const b = e.currentTarget; const done = () => { b.classList.add('ok'); b.setAttribute('aria-label', 'Link copied'); setTimeout(() => { b.classList.remove('ok'); b.setAttribute('aria-label', 'Copy link'); }, 1800); };
      (navigator.clipboard ? navigator.clipboard.writeText(here) : Promise.reject()).then(done, () => window.prompt('Copy this link:', here));
    });
    const rel = B.posts.filter((x) => x !== p).sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat) || b.date.localeCompare(a.date)).slice(0, 3);
    $('#bpRelated').innerHTML = rel.map(card).join('');
  }
})();
