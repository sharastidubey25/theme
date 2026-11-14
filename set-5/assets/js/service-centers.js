/* FixPapa · Set 5 · Find a Service Centre (service-centers.html). Needs service-centers-data.js (window.FPServiceCenters).
   The live fixpapa.com/service-centers flow: Brand / Category / State / City checkbox filters with counts, cards with
   name, address, phone, email and brand + "deals in" tags, pagination. Added: search, sort, brand tabs, filter chips,
   Call / Directions / Copy address. URL state uses the live keys, comma lists: ?brand=HP&category=&state=&city=&q=&sort=&page=
   (the homepage and device-health "Look for the Service Center" buttons pass ?brand=<chosen brand>).
   Backend: window.FPServiceCentersApi = { list() → Promise<[{ id, name, brand, address, city, state, pin, phones[], emails[], deals[] }]> }. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (!$('#sclGrid')) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PER_PAGE = 12;
  const LOGOS = { HP: 'assets/img/brands/hp.svg', Epson: 'assets/img/brands/epson.svg' };
  const FACETS = [
    { key: 'brand', label: 'Brand', get: (c) => [c.brand] },
    { key: 'category', label: 'Deals in', get: (c) => c.deals },
    { key: 'state', label: 'State', get: (c) => [c.state] },
    { key: 'city', label: 'City', get: (c) => [c.city], search: true, limit: 8 },
  ];

  const params = new URLSearchParams(location.search);
  const list = (k) => (params.get(k) || '').split(',').map(s => s.trim()).filter(Boolean);
  const state = { q: params.get('q') || '', sort: params.get('sort') || 'city', page: +params.get('page') || 1, open: {} };
  FACETS.forEach(f => { state[f.key] = list(f.key); });
  let all = [], missingBrand = '';

  const syncUrl = () => {
    const p = new URLSearchParams();
    FACETS.forEach(f => { if (state[f.key].length) p.set(f.key, state[f.key].join(',')); });
    if (state.q) p.set('q', state.q); if (state.sort !== 'city') p.set('sort', state.sort); if (state.page > 1) p.set('page', state.page);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '') + location.hash);
  };

  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ');
  const matchQ = (c) => {
    if (!state.q) return true;
    const hay = norm([c.name, c.address, c.city, c.state, c.pin, c.brand, c.deals.join(' '), c.phones.join(' ')].join(' '));
    return norm(state.q).split(' ').every(w => hay.includes(w));
  };
  // a centre passes when it matches the search and every facet except `skip` (so each facet's counts ignore its own picks)
  const passes = (c, skip) => matchQ(c) && FACETS.every(f => f.key === skip || !state[f.key].length || f.get(c).some(v => state[f.key].includes(v)));
  const sorters = {
    city: (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    name: (a, b) => a.name.localeCompare(b.name) || a.city.localeCompare(b.city),
    brand: (a, b) => a.brand.localeCompare(b.brand) || a.city.localeCompare(b.city),
  };

  const fmtPhone = (p) => /^\d{10}$/.test(p) ? p.slice(0, 5) + ' ' + p.slice(5) : p;
  const telOf = (p) => { const d = p.replace(/[^\d]/g, ''); return /^\d{10}$/.test(d) && !d.startsWith('0') ? '+91' + d : d; };
  const mapUrl = (c) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${c.name}, ${c.address}`);
  const brandMark = (b) => LOGOS[b] ? `<img src="${LOGOS[b]}" alt="${esc(b)}">` : `<b>${esc(b)}</b>`;

  const card = (c) => `<article class="scl-card">
    <div class="scl-card-top">
      <span class="scl-logo">${brandMark(c.brand)}</span>
      <div class="scl-who"><h3>${esc(c.name)}</h3><span><svg width="13" height="13"><use href="#i-pin"/></svg>${esc(c.city)}, ${esc(c.state)}</span></div>
      <span class="scl-auth" title="Authorised ${esc(c.brand)} service partner"><svg width="13" height="13"><use href="#i-badge"/></svg>${esc(c.brand)}</span>
    </div>
    <ul class="scl-facts">
      <li><svg width="16" height="16"><use href="#i-pin"/></svg><span>${esc(c.address)}</span></li>
      ${c.phones.length ? `<li><svg width="16" height="16"><use href="#i-phone"/></svg><span>${c.phones.map(p => `<a href="tel:${telOf(p)}">${esc(fmtPhone(p))}</a>`).join(', ')}</span></li>` : ''}
      ${c.emails.length ? `<li><svg width="16" height="16"><use href="#i-mail"/></svg><span>${c.emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(', ')}</span></li>` : ''}
    </ul>
    <div class="scl-tags">${c.deals.map(d => `<span>${esc(d)}</span>`).join('')}</div>
    <div class="scl-acts">
      ${c.phones.length ? `<a class="btn" href="tel:${telOf(c.phones[0])}"><svg width="16" height="16"><use href="#i-phone"/></svg>Call</a>` : ''}
      <a class="scl-act" href="${mapUrl(c)}" target="_blank" rel="noopener"><svg width="16" height="16"><use href="#i-pin"/></svg>Directions</a>
      <button type="button" class="scl-act" data-copy="${c.id}" aria-label="Copy address of ${esc(c.name)}"><svg width="16" height="16"><use href="#i-check"/></svg>Copy</button>
    </div>
  </article>`;

  /* ---------- render ---------- */
  const renderBrands = () => {
    const counts = {}; all.filter(c => passes(c, 'brand')).forEach(c => { counts[c.brand] = (counts[c.brand] || 0) + 1; });
    const brands = [...new Set(all.map(c => c.brand))].sort();
    const none = !state.brand.length;
    $('#sclBrands').innerHTML = `<button type="button" aria-pressed="${none}" data-brand=""><i class="scl-all"><svg width="18" height="18"><use href="#i-badge"/></svg></i>All brands<small>${Object.values(counts).reduce((a, b) => a + b, 0)}</small></button>` +
      brands.map(b => `<button type="button" aria-pressed="${state.brand.includes(b)}" data-brand="${esc(b)}"><i>${brandMark(b)}</i>${esc(b)}<small>${counts[b] || 0}</small></button>`).join('');
  };

  const renderFacets = () => {
    $('#sclFacets').innerHTML = FACETS.map(f => {
      const counts = {};
      all.filter(c => passes(c, f.key)).forEach(c => f.get(c).forEach(v => { counts[v] = (counts[v] || 0) + 1; }));
      state[f.key].forEach(v => { counts[v] = counts[v] || 0; });
      let vals = Object.keys(counts).sort((a, b) => (state[f.key].includes(b) - state[f.key].includes(a)) || (f.key === 'city' || f.key === 'state' ? a.localeCompare(b) : counts[b] - counts[a] || a.localeCompare(b)));
      const find = (state.open[f.key + 'q'] || '').toLowerCase();
      if (find) vals = vals.filter(v => v.toLowerCase().includes(find));
      const more = f.limit && !state.open[f.key] && !find && vals.length > f.limit + 2;
      const shown = more ? vals.slice(0, f.limit) : vals;
      return `<fieldset class="scl-fg" data-f="${f.key}"><legend>${f.label}${state[f.key].length ? `<button type="button" data-reset="${f.key}">Reset</button>` : ''}</legend>
        ${f.search ? `<label class="scl-fg-find"><svg width="14" height="14"><use href="#i-search"/></svg><input type="search" data-find="${f.key}" value="${esc(state.open[f.key + 'q'] || '')}" placeholder="Find a ${f.label.toLowerCase()}" aria-label="Find a ${f.label.toLowerCase()}"></label>` : ''}
        ${shown.map(v => `<label class="scl-check${counts[v] ? '' : ' is-zero'}"><input type="checkbox" value="${esc(v)}"${state[f.key].includes(v) ? ' checked' : ''}><span>${esc(v)}</span><small>${counts[v]}</small></label>`).join('') || '<p class="scl-fg-none">No match</p>'}
        ${more ? `<button type="button" class="scl-more" data-more="${f.key}">Show all ${vals.length}</button>` : ''}
      </fieldset>`;
    }).join('');
  };

  const renderChips = () => {
    const chips = FACETS.flatMap(f => state[f.key].map(v => `<button type="button" data-chip="${f.key}" data-v="${esc(v)}">${esc(v)}<svg width="12" height="12"><use href="#i-close"/></svg></button>`));
    if (state.q) chips.unshift(`<button type="button" data-chip="q">“${esc(state.q)}”<svg width="12" height="12"><use href="#i-close"/></svg></button>`);
    $('#sclChips').innerHTML = chips.length ? chips.join('') + '<button type="button" class="scl-chips-clear" data-clear>Clear all</button>' : '';
    const n = FACETS.reduce((s, f) => s + state[f.key].length, 0);
    $('#sclFilterCount').textContent = n || '';
  };

  const renderPages = (pages) => {
    const nav = $('#sclPages');
    if (pages < 2) { nav.innerHTML = ''; return; }
    const p = state.page, btn = (n, label, extra = '') => `<button type="button" data-page="${n}"${extra}>${label}</button>`;
    const nums = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - p) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
    nav.innerHTML = btn(p - 1, '<svg width="16" height="16"><use href="#i-chev-l"/></svg>', ` aria-label="Previous page"${p === 1 ? ' disabled' : ''}`) +
      nums.map(n => n === '…' ? '<span>…</span>' : btn(n, n, n === p ? ' aria-current="page"' : '')).join('') +
      btn(p + 1, '<svg width="16" height="16"><use href="#i-chev-r"/></svg>', ` aria-label="Next page"${p === pages ? ' disabled' : ''}`);
  };

  const renderNote = () => {
    const note = $('#sclNote');
    note.hidden = !missingBrand;
    if (missingBrand) note.innerHTML = `<svg width="20" height="20"><use href="#i-wrench"/></svg><span>We haven’t listed authorised <b>${esc(missingBrand)}</b> service centres yet, so here are all centres. FixPapa engineers repair ${esc(missingBrand)} devices at your doorstep.</span><a href="repair.html">Book a repair</a><button type="button" aria-label="Dismiss" data-note-x><svg width="16" height="16"><use href="#i-close"/></svg></button>`;
  };

  const render = () => {
    const hits = all.filter(c => passes(c)).sort(sorters[state.sort] || sorters.city);
    const pages = Math.max(1, Math.ceil(hits.length / PER_PAGE));
    state.page = Math.min(Math.max(1, state.page), pages);
    const from = (state.page - 1) * PER_PAGE, slice = hits.slice(from, from + PER_PAGE);
    $('#sclCount').innerHTML = hits.length ? `Showing <b>${from + 1}–${from + slice.length}</b> of <b>${hits.length}</b> service centre${hits.length > 1 ? 's' : ''}` : '';
    $('#sclGrid').innerHTML = slice.map(card).join('') || `<div class="scl-empty"><svg width="32" height="32"><use href="#i-pin"/></svg><b>No service centre found</b><p>Try another city or brand, or clear the filters.</p><button type="button" class="btn btn--ghost" data-clear>Clear filters</button><a href="repair.html">or book a FixPapa doorstep repair</a></div>`;
    renderBrands(); renderFacets(); renderChips(); renderPages(pages); syncUrl();
  };

  const renderStats = () => {
    const n = (k) => new Set(all.map(c => c[k])).size;
    $('#sclStats').innerHTML = `<li><b>${all.length}</b>service centres</li><li><b>${n('city')}</b>cities</li><li><b>${n('state')}</b>states</li><li><b>${n('brand')}</b>brands</li>`;
  };

  /* ---------- events ---------- */
  const reset = () => { FACETS.forEach(f => { state[f.key] = []; }); state.q = ''; state.page = 1; $('#sclQ').value = ''; $('#sclHeroQ').value = ''; render(); };
  const toList = () => { const el = $('#sclList'); if (el.getBoundingClientRect().top < 0 || el.getBoundingClientRect().top > innerHeight * .6) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  let toastT;
  const toast = (msg) => { const t = $('#sclToast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200); };

  $('#sclFacets').addEventListener('change', (e) => {
    const box = e.target.closest('input[type=checkbox]'); if (!box) return;
    const k = box.closest('[data-f]').dataset.f, v = box.value;
    state[k] = box.checked ? [...state[k], v] : state[k].filter(x => x !== v);
    state.page = 1; render();
  });
  $('#sclFacets').addEventListener('input', (e) => {
    const inp = e.target.closest('[data-find]'); if (!inp) return;
    const k = inp.dataset.find, pos = inp.selectionStart;
    state.open[k + 'q'] = inp.value; renderFacets();
    const again = $(`[data-find="${k}"]`); again.focus(); again.setSelectionRange(pos, pos);
  });
  $('#sclBrands').addEventListener('click', (e) => {
    const b = e.target.closest('[data-brand]'); if (!b) return;
    state.brand = b.dataset.brand ? [b.dataset.brand] : []; missingBrand = ''; renderNote(); state.page = 1; render();
  });
  let qT;
  $('#sclQ').addEventListener('input', (e) => { clearTimeout(qT); qT = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; render(); }, 180); });
  $('#sclHeroForm').addEventListener('submit', (e) => {
    e.preventDefault(); state.q = $('#sclHeroQ').value.trim(); $('#sclQ').value = state.q; state.page = 1; render(); toList();
  });
  $('#sclSort').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; render(); });

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.matches('[data-page]')) { state.page = +t.dataset.page; render(); toList(); }
    else if (t.matches('[data-chip]')) { const k = t.dataset.chip; if (k === 'q') { state.q = ''; $('#sclQ').value = ''; } else state[k] = state[k].filter(x => x !== t.dataset.v); state.page = 1; render(); }
    else if (t.matches('[data-clear]') || t.id === 'sclClear') reset();
    else if (t.matches('[data-reset]')) { state[t.dataset.reset] = []; state.page = 1; render(); }
    else if (t.matches('[data-more]')) { state.open[t.dataset.more] = true; renderFacets(); }
    else if (t.matches('[data-note-x]')) { missingBrand = ''; renderNote(); }
    else if (t.matches('[data-copy]')) {
      const c = all.find(x => String(x.id) === t.dataset.copy); if (!c) return;
      const txt = `${c.name}\n${c.address}${c.phones.length ? '\nPhone: ' + c.phones.join(', ') : ''}`;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Address copied'), () => toast('Could not copy, select the address instead'));
    }
  });

  // phone: the sidebar is a drawer
  const side = $('#sclSide');
  const drawer = (open) => { side.classList.toggle('open', open); document.body.classList.toggle('scl-lock', open); $('#sclFilterBtn').setAttribute('aria-expanded', open); if (open) side.querySelector('input,button')?.focus(); };
  $('#sclFilterBtn').addEventListener('click', () => drawer(true));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-side-close]')) drawer(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && side.classList.contains('open')) { drawer(false); $('#sclFilterBtn').focus(); } });

  /* ---------- load ---------- */
  const start = (rows) => {
    all = rows || [];
    // ?brand=Dell from the warranty checker: keep only brands we list, and say so for the rest
    const known = new Set(all.map(c => c.brand.toLowerCase()));
    const asked = state.brand;
    state.brand = asked.map(b => all.find(c => c.brand.toLowerCase() === b.toLowerCase())?.brand).filter(Boolean);
    missingBrand = asked.filter(b => !known.has(b.toLowerCase())).join(', ');
    $('#sclQ').value = state.q; $('#sclHeroQ').value = state.q; $('#sclSort').value = sorters[state.sort] ? state.sort : 'city';
    renderStats(); renderNote(); render();
  };
  $('#sclGrid').innerHTML = '<div class="scl-empty scl-loading"><i></i><b>Getting service centres…</b></div>';
  const api = window.FPServiceCentersApi;
  if (api && typeof api.list === 'function') Promise.resolve(api.list()).then(start, () => start(window.FPServiceCenters));
  else start(window.FPServiceCenters);
})();
