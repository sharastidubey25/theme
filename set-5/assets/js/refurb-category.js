/* FixPapa · Set 5 · Refurbished category page — refurbished-category.html?cat=laptops|desktops|printers|cctv|accessories
   Renders hero, category tabs, brand filter, sort and the product grid from window.FPRefurb (refurb-data.js). */
(() => {
  const R = window.FPRefurb; if (!R) return;
  const $ = (s) => document.querySelector(s);
  const want = new URLSearchParams(location.search).get('cat');
  const cat = R.catOf(want) || R.cats[0];
  const list = R.byCat(cat.id), s = R.stats(cat.id);

  /* hero + title */
  document.title = `Refurbished ${cat.name} | FixPapa`;
  $('#rfcCrumb').textContent = $('#rfcName').textContent = cat.name;
  $('#rfcLine').textContent = cat.line + ' Tested on 40 points and covered by a 6-month warranty.';
  $('#rfcArt').setAttribute('href', '#' + cat.art);
  $('#rfcStats').innerHTML = `<li class="hot"><b>Up to ${s.maxOff}%</b>off MRP</li><li><b>${R.inr(s.from)}</b>starting price</li><li><b>${s.count}</b>products</li><li><b>6 months</b>warranty</li>`;

  /* category tabs — real links, so each category has its own URL */
  $('#rfcTabs').innerHTML = R.cats.map(c => `
    <a class="rfc-tab" href="?cat=${c.id}"${c.id === cat.id ? ' aria-current="page"' : ''}>
      <span class="ic"><svg width="22" height="22"><use href="#${c.icon}"/></svg></span>
      <span><b>${c.name}</b><small>Up to ${R.stats(c.id).maxOff}% off</small></span>
    </a>`).join('');
  const tabs = $('#rfcTabs'), cur = $('#rfcTabs [aria-current]');
  tabs.scrollLeft = cur.offsetLeft - (tabs.clientWidth - cur.offsetWidth) / 2;

  /* brand filter + sort */
  const brands = [...new Set(list.map(p => p.brand))].sort();
  const chips = $('#rfcBrands');
  chips.innerHTML = ['All', ...brands].map((b, i) => `<button type="button" data-b="${i ? b : ''}" aria-pressed="${!i}">${b}</button>`).join('');
  const sorters = { off: (a, b) => b.off - a.off, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
  let brand = '', sort = 'off';
  const grid = $('#rfcGrid'), count = $('#rfcCount');
  const render = () => {
    const shown = list.filter(p => !brand || p.brand === brand).sort(sorters[sort]);
    grid.innerHTML = shown.map((p, i) => R.card(p, { specs: true }).replace('<article ', `<article style="animation-delay:${i * 50}ms" `)).join('');
    count.innerHTML = `Showing <b>${shown.length}</b> refurbished ${brand ? brand + ' ' : ''}${cat.id === 'cctv' ? 'CCTV products' : cat.name.toLowerCase()}`;
  };
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    chips.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    brand = b.dataset.b; render();
  });
  $('#rfcSort').addEventListener('change', (e) => { sort = e.target.value; render(); });
  grid.addEventListener('click', (e) => {
    const w = e.target.closest('.wish'); if (w) w.style.color = w.style.color ? '' : '#E11D48';
  });
  render();
})();
