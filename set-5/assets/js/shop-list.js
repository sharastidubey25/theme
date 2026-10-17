/* FixPapa · Set 5 · shared product listing (refurbished.html, rental-category.html)
   window.FPShopList(cfg) builds the filter sidebar into #rflAccs and runs filtering, counts, sort, pagination,
   active-filter chips, the phone filter drawer and URL state. Page markup uses the rfl-* ids (see refurbished.html).
   cfg = {
     items:  [{ p, f }]          p = product (needs id, price, name; rating/off used by sorts), f = { facetKey: [values] }
     facets: [{ k, name, range?: { toNum(v), unit(n) } }]   checkbox list, or a range that snaps to the values in stock
     card(p, i)                  → card HTML
     sorts:  { key: comparator } first key is the default
     noun: ['product', 'products'], perPage: 12, priceStep: 100, scrollTo: '#refurb', priceLabel(n), keep: ['cat']  (URL params left alone)
     urlValue: { k: [toUrl, fromUrl] }  optional value encoding for a facet
     onRender({ count, sel })    optional, called after every render (sel = { facetKey: Set of values })
   } */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const fid = (k) => 'rflF-' + String(k).replace(/[^a-z0-9]+/gi, '-');

  window.FPShopList = (cfg) => {
    const grid = $('#rflGrid'); if (!grid) return;
    const items = cfg.items, PER = cfg.perPage || 12, STEP = cfg.priceStep || 100, noun = cfg.noun || ['product', 'products'];
    const SORT = cfg.sorts, SORT0 = Object.keys(SORT)[0], price = cfg.priceLabel || inr;
    const KEYS = cfg.facets.filter((f) => !f.range).map((f) => f.k), RF = Object.fromEntries(cfg.facets.filter((f) => f.range).map((f) => [f.k, f.range]));
    const RKEYS = Object.keys(RF), NAMES = Object.fromEntries(cfg.facets.map((f) => [f.k, f.name]));
    const STOPS = Object.fromEntries(RKEYS.map((k) => [k, [...new Set(items.flatMap((it) => it.f[k].map(RF[k].toNum)))].sort((a, b) => a - b)]));
    const prices = items.map((it) => it.p.price);
    const PMIN = Math.floor(Math.min(...prices) / STEP) * STEP, PMAX = Math.max(PMIN + STEP, Math.ceil(Math.max(...prices) / STEP) * STEP);
    const enc = (k, v) => (cfg.urlValue && cfg.urlValue[k] ? cfg.urlValue[k][0](v) : v), dec = (k, v) => (cfg.urlValue && cfg.urlValue[k] ? cfg.urlValue[k][1](v) : v);

    /* sidebar */
    $('#rflAccs').innerHTML = cfg.facets.concat([{ k: 'price', name: 'Price' }]).map((f) => `
      <div class="rfl-acc" data-facet="${f.k}">
        <button type="button" class="rfl-acc-h" aria-expanded="false" aria-controls="${fid(f.k)}">${f.name}<svg width="18" height="18"><use href="#i-chev-d"/></svg></button>
        <div class="rfl-acc-b" id="${fid(f.k)}" role="group" aria-label="${f.name}" hidden>${f.k === 'price' ? `
          <div class="rfl-price-in"><label><span>Min</span><input type="number" id="rflMin" inputmode="numeric"></label><i>–</i><label><span>Max</span><input type="number" id="rflMax" inputmode="numeric"></label></div>
          <div class="rfl-range"><div class="rfl-range-fill" id="rflFill"></div><input type="range" id="rflLo" aria-label="Minimum price"><input type="range" id="rflHi" aria-label="Maximum price"></div>` : ''}</div>
      </div>`).join('');

    /* state, mirrored in the URL */
    const st = { sel: Object.fromEntries(KEYS.map((k) => [k, new Set()])), lo: PMIN, hi: PMAX, sort: SORT0, page: 1,
      rng: Object.fromEntries(RKEYS.map((k) => [k, [0, STOPS[k].length - 1]])) };
    const narrowed = (k) => STOPS[k].length > 1 && (st.rng[k][0] > 0 || st.rng[k][1] < STOPS[k].length - 1);
    const inRange = (it, k) => { const [a, b] = st.rng[k].map((i) => STOPS[k][i]); return it.f[k].some((v) => { const n = RF[k].toNum(v); return n >= a && n <= b; }); };
    const q = new URLSearchParams(location.search);
    KEYS.forEach((k) => (q.get(k) || '').split(',').filter(Boolean).forEach((v) => st.sel[k].add(dec(k, v))));
    RKEYS.forEach((k) => { const m = (q.get(k) || '').match(/^([\d.]+)-([\d.]+)$/); if (!m || !STOPS[k].length) return;
      const near = (n) => STOPS[k].reduce((bi, v, i) => (Math.abs(v - n) < Math.abs(STOPS[k][bi] - n) ? i : bi), 0);
      st.rng[k] = [near(+m[1]), near(+m[2])].sort((a, b) => a - b); });
    if (SORT[q.get('sort')]) st.sort = q.get('sort');
    if (q.get('min')) st.lo = Math.max(PMIN, +q.get('min') || PMIN);
    if (q.get('max')) st.hi = Math.min(PMAX, +q.get('max') || PMAX);
    st.page = Math.max(1, +q.get('page') || 1);

    const passes = (it, skip) => KEYS.every((k) => k === skip || !st.sel[k].size || it.f[k].some((v) => st.sel[k].has(v)))
      && RKEYS.every((k) => k === skip || !narrowed(k) || inRange(it, k))
      && it.p.price >= st.lo && it.p.price <= st.hi;

    /* checkbox facets: counts reflect the other active filters */
    function drawFacets() {
      KEYS.forEach((k) => {
        const box = $('#' + fid(k)), counts = new Map();
        items.forEach((it) => it.f[k].forEach((v) => counts.has(v) || counts.set(v, 0)));
        items.filter((it) => passes(it, k)).forEach((it) => it.f[k].forEach((v) => counts.set(v, counts.get(v) + 1)));
        const vals = [...counts.keys()].sort((a, b) => (counts.get(b) - counts.get(a)) || a.localeCompare(b));
        box.innerHTML = vals.map((v) => { const n = counts.get(v), on = st.sel[k].has(v);
          return `<label class="rfl-chk${!n && !on ? ' is-zero' : ''}"><input type="checkbox" value="${esc(v)}"${on ? ' checked' : ''}${!n && !on ? ' disabled' : ''}><span>${esc(v)}</span><em>${n}</em></label>`; }).join('');
      });
    }

    /* numeric ranges: two handles snapping to in-stock values, labelled stops */
    const pct = (k, i) => (STOPS[k].length > 1 ? i / (STOPS[k].length - 1) * 100 : 0);
    // with many stops only ~4 evenly spaced labels show; the rest keep a tick mark (the summary line shows exact values)
    const labelled = (n, i) => n <= 6 || i === 0 || i === n - 1 || i % Math.ceil((n - 1) / 3) === 0 && n - 1 - i >= Math.ceil((n - 1) / 6);
    RKEYS.forEach((k) => {
      const n = STOPS[k].length, box = $('#' + fid(k)), U = RF[k].unit;
      box.classList.add('rfl-rbox');
      box.innerHTML = `<p class="rfl-rsum"><b></b><em></em></p>` + (n > 1 ? `<div class="rfl-range"><div class="rfl-range-fill"></div>
        <input type="range" min="0" max="${n - 1}" step="1" aria-label="Minimum ${NAMES[k]}"><input type="range" min="0" max="${n - 1}" step="1" aria-label="Maximum ${NAMES[k]}"></div>
        <div class="rfl-ticks">${STOPS[k].map((v, i) => `<button type="button" data-i="${i}" style="left:${pct(k, i)}%"${labelled(n, i) ? '' : ' class="sub"'} aria-label="${U(v)}">${U(v)}</button>`).join('')}</div>` : '');
      const [a, b] = $$('input', box);
      if (!a) return;
      const set = (i, h) => { const r = st.rng[k]; r[h] = i; if (r[0] > r[1]) r[h ? 0 : 1] = i; st.page = 1; render(); };
      a.addEventListener('input', () => set(+a.value, 0));
      b.addEventListener('input', () => set(+b.value, 1));
      $('.rfl-ticks', box).addEventListener('click', (e) => { const t = e.target.closest('[data-i]'); if (!t) return; const i = +t.dataset.i, r = st.rng[k];
        set(i, Math.abs(i - r[0]) <= Math.abs(i - r[1]) && !(i > r[1]) ? 0 : 1); });
    });
    function drawRanges() {
      RKEYS.forEach((k) => {
        const box = $('#' + fid(k)), [lo, hi] = st.rng[k], v = STOPS[k], U = RF[k].unit;
        const cnt = items.filter((it) => passes(it, k) && (narrowed(k) ? inRange(it, k) : it.f[k].length)).length;
        $('.rfl-rsum b', box).textContent = !v.length ? 'Not available' : v.length === 1 ? U(v[0]) : narrowed(k) ? (lo === hi ? U(v[lo]) : `${U(v[lo])} – ${U(v[hi])}`) : `Any (${U(v[0])} – ${U(v[v.length - 1])})`;
        $('.rfl-rsum em', box).textContent = `${cnt} ${cnt === 1 ? noun[0] : noun[1]}`;
        const [a, b] = $$('input', box); if (!a) return;
        a.value = lo; b.value = hi;
        const f = $('.rfl-range-fill', box); f.style.left = pct(k, lo) + '%'; f.style.width = (pct(k, hi) - pct(k, lo)) + '%';
        $$('.rfl-ticks button', box).forEach((t, i) => t.classList.toggle('on', i >= lo && i <= hi));
      });
    }

    /* price */
    const lo = $('#rflLo'), hi = $('#rflHi'), mn = $('#rflMin'), mx = $('#rflMax'), fill = $('#rflFill');
    [lo, hi, mn, mx].forEach((r) => { r.min = PMIN; r.max = PMAX; r.step = STEP; });
    const drawPrice = () => {
      lo.value = st.lo; hi.value = st.hi; mn.value = st.lo; mx.value = st.hi;
      const a = (st.lo - PMIN) / (PMAX - PMIN) * 100, b = (st.hi - PMIN) / (PMAX - PMIN) * 100;
      fill.style.left = a + '%'; fill.style.width = (b - a) + '%';
    };
    let priceT;
    const setPrice = (l, h, now) => {
      l = Math.max(PMIN, Math.min(+l || PMIN, PMAX)); h = Math.max(PMIN, Math.min(+h || PMAX, PMAX));
      if (l > h) [l, h] = [h, l];
      st.lo = l; st.hi = h; st.page = 1; drawPrice();
      clearTimeout(priceT); priceT = setTimeout(render, now ? 0 : 160);
    };
    lo.addEventListener('input', () => { if (+lo.value > +hi.value - STEP) lo.value = +hi.value - STEP; setPrice(lo.value, st.hi); });
    hi.addEventListener('input', () => { if (+hi.value < +lo.value + STEP) hi.value = +lo.value + STEP; setPrice(st.lo, hi.value); });
    mn.addEventListener('change', () => setPrice(mn.value, st.hi, true));
    mx.addEventListener('change', () => setPrice(st.lo, mx.value, true));

    /* render */
    function render() {
      const list = items.filter((it) => passes(it)).sort(SORT[st.sort]);
      const pages = Math.max(1, Math.ceil(list.length / PER));
      st.page = Math.min(st.page, pages);
      grid.innerHTML = list.slice((st.page - 1) * PER, st.page * PER).map((it, i) => cfg.card(it.p, i)).join('');
      $('#rflEmpty').hidden = !!list.length;
      $('#rflCount').textContent = `${list.length} ${list.length === 1 ? noun[0] : noun[1]}`;
      const pg = $('#rflPages');
      if (pages < 2) pg.innerHTML = list.length ? `<span class="rfl-pinfo">Page 1 of 1</span>` : '';
      else {
        let html = `<button type="button" data-p="${st.page - 1}"${st.page === 1 ? ' disabled' : ''} aria-label="Previous page"><svg width="16" height="16"><use href="#i-chev-l"/></svg></button>`;
        for (let i = 1; i <= pages; i++) html += `<button type="button" data-p="${i}"${i === st.page ? ' aria-current="page"' : ''}>${i}</button>`;
        pg.innerHTML = html + `<button type="button" data-p="${st.page + 1}"${st.page === pages ? ' disabled' : ''} aria-label="Next page"><svg width="16" height="16"><use href="#i-chev-r"/></svg></button><span class="rfl-pinfo">Page ${st.page} of ${pages}</span>`;
      }
      const chips = [];
      KEYS.forEach((k) => st.sel[k].forEach((v) => chips.push(`<button type="button" data-k="${k}" data-v="${esc(v)}"><small>${NAMES[k]}:</small> ${esc(v)}<span aria-hidden="true">✕</span></button>`)));
      RKEYS.forEach((k) => { if (!narrowed(k)) return; const [a, b] = st.rng[k].map((i) => RF[k].unit(STOPS[k][i]));
        chips.push(`<button type="button" data-k="${k}" data-r><small>${NAMES[k]}:</small> ${a === b ? a : `${a} – ${b}`}<span aria-hidden="true">✕</span></button>`); });
      if (st.lo > PMIN || st.hi < PMAX) chips.push(`<button type="button" data-k="price"><small>Price:</small> ${price(st.lo)} – ${price(st.hi)}<span aria-hidden="true">✕</span></button>`);
      const ch = $('#rflChips'); ch.hidden = !chips.length;
      ch.innerHTML = chips.join('') + (chips.length ? `<button type="button" class="rfl-chip-clear" data-clear>Clear all</button>` : '');
      const badge = $('#rflBadge'); badge.hidden = !chips.length; badge.textContent = chips.length;
      $('#rflApply').textContent = `Show ${list.length} result${list.length === 1 ? '' : 's'}`;
      drawFacets(); drawRanges(); syncUrl();
      if (cfg.onRender) cfg.onRender({ count: list.length, sel: st.sel });
    }
    function syncUrl() {
      const u = new URLSearchParams();
      (cfg.keep || []).forEach((k) => { const v = new URLSearchParams(location.search).get(k); if (v) u.set(k, v); });
      KEYS.forEach((k) => { if (st.sel[k].size) u.set(k, [...st.sel[k]].map((v) => enc(k, v)).join(',')); });
      RKEYS.forEach((k) => { if (narrowed(k)) u.set(k, st.rng[k].map((i) => STOPS[k][i]).join('-')); });
      if (st.lo > PMIN) u.set('min', st.lo); if (st.hi < PMAX) u.set('max', st.hi);
      if (st.sort !== SORT0) u.set('sort', st.sort); if (st.page > 1) u.set('page', st.page);
      const qs = u.toString(); history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
    const clearAll = () => { KEYS.forEach((k) => st.sel[k].clear()); RKEYS.forEach((k) => { st.rng[k] = [0, STOPS[k].length - 1]; }); st.lo = PMIN; st.hi = PMAX; st.page = 1; drawPrice(); render(); };

    /* events */
    const side = $('#rflSide');
    side.addEventListener('change', (e) => {
      const c = e.target.closest('.rfl-acc-b input[type="checkbox"]'); if (!c) return;
      const k = c.closest('.rfl-acc').dataset.facet; c.checked ? st.sel[k].add(c.value) : st.sel[k].delete(c.value); st.page = 1; render();
    });
    const toggleAcc = (h, open) => { h.setAttribute('aria-expanded', open); $('#' + h.getAttribute('aria-controls')).hidden = !open; };
    $$('.rfl-acc-h', side).forEach((h) => h.addEventListener('click', () => toggleAcc(h, h.getAttribute('aria-expanded') !== 'true')));
    $('#rflClear').addEventListener('click', clearAll);
    document.addEventListener('click', (e) => { if (e.target.closest('[data-clear]')) clearAll(); });
    $('#rflChips').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]'); if (!b) return;
      if (b.dataset.k === 'price') { st.lo = PMIN; st.hi = PMAX; drawPrice(); } else if ('r' in b.dataset) st.rng[b.dataset.k] = [0, STOPS[b.dataset.k].length - 1]; else st.sel[b.dataset.k].delete(b.dataset.v);
      st.page = 1; render();
    });
    $('#rflPages').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return;
      st.page = +b.dataset.p; render(); const t = $(cfg.scrollTo || '.rfl'); t && t.scrollIntoView({ behavior: 'smooth' });
    });

    // sort dropdown (listbox)
    const sBtn = $('#rflSortBtn'), sList = $('#rflSortList'), opts = $$('[role="option"]', sList);
    const showSort = (o) => { opts.forEach((x) => x.setAttribute('aria-selected', x === o)); $('#rflSortLabel').textContent = o.textContent; };
    const setSort = (o) => { showSort(o); st.sort = o.dataset.s; st.page = 1; render(); };
    const openSort = (open) => { sList.hidden = !open; sBtn.setAttribute('aria-expanded', open); if (open) (opts.find((o) => o.getAttribute('aria-selected') === 'true') || opts[0]).focus(); };
    opts.forEach((o) => { o.tabIndex = -1; });
    sBtn.addEventListener('click', () => openSort(sList.hidden));
    sList.addEventListener('click', (e) => { const o = e.target.closest('[role="option"]'); if (!o) return; setSort(o); openSort(false); sBtn.focus(); });
    sList.addEventListener('keydown', (e) => {
      const i = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (opts[i]) { setSort(opts[i]); openSort(false); sBtn.focus(); } }
      else if (e.key === 'Escape') { openSort(false); sBtn.focus(); }
    });
    document.addEventListener('click', (e) => { if (!sList.hidden && !e.target.closest('.rfl-sort')) openSort(false); });
    { const o = opts.find((x) => x.dataset.s === st.sort); if (o) showSort(o); }

    // phone: filters slide in as a drawer
    const scrim = $('#rflScrim'), tog = $('#rflOpen');
    const drawer = (open) => { side.classList.toggle('open', open); scrim.hidden = !open; tog.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; };
    tog.addEventListener('click', () => drawer(true));
    [scrim, $('#rflClose'), $('#rflApply')].forEach((b) => b.addEventListener('click', () => drawer(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && side.classList.contains('open')) drawer(false); });

    // sections start closed; one that already has a filter (from the link) opens so the choice is visible
    const openAcc = (k) => toggleAcc($(`.rfl-acc[data-facet="${k}"] .rfl-acc-h`), true);
    KEYS.forEach((k) => st.sel[k].size && openAcc(k)); RKEYS.forEach((k) => narrowed(k) && openAcc(k));
    if (st.lo > PMIN || st.hi < PMAX) openAcc('price');
    drawPrice(); render();
    return { render };
  };

  /* promo videos open in a lightbox (YouTube, privacy-enhanced embed) */
  const yt = $('#rflYt');
  if (yt) {
    const frame = $('iframe', yt); let from;
    $$('[data-yt]').forEach((b) => b.addEventListener('click', () => { from = b; frame.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`; yt.hidden = false; document.body.style.overflow = 'hidden'; $('.rfl-yt-x', yt).focus(); }));
    const close = () => { yt.hidden = true; frame.removeAttribute('src'); document.body.style.overflow = ''; from && from.focus(); };
    $$('[data-close]', yt).forEach((b) => b.addEventListener('click', close));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !yt.hidden) close(); });
  }
})();
