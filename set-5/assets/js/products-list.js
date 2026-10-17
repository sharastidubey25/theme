/* FixPapa · Set 5 · All products (products.html?brand=HP&cat=Laptop&condition=New) — configuration for FPShopList.
   New products from products-data.js (window.FPProducts) + refurbished ones from refurb-data.js (window.FPRefurb).
   Brands page "Check products" links here with ?brand=…; a single selected brand shows a brand banner. */
(() => {
  const NP = window.FPProducts, R = window.FPRefurb; if (!NP || !window.FPShopList) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const num = (v) => parseFloat(v) || 0;

  /* one product shape for both sources */
  const REF_CAT = { laptops: 'Laptop', desktops: 'Desktop', printers: 'Printer', cctv: 'CCTV', accessories: 'Accessories' };
  const refurb = R ? R.products.map((p) => ({ ...p, id: p.id, catName: p.art === 'rf-monitor' ? 'Monitor' : p.art === 'rf-ssd' ? 'Storage' : REF_CAT[p.cat], art: p.art || R.catOf(p.cat).art, condition: 'Refurbished' })) : [];
  const all = NP.products.concat(refurb);

  /* facets from spec chips */
  const find = (p, re) => { for (const s of p.specs) { const m = s.match(re); if (m) return m; } return null; };
  const computer = (p) => ['Laptop', 'Desktop', 'Tablet'].includes(p.catName);
  const screenish = (p) => ['Laptop', 'Monitor', 'Tablet'].includes(p.catName) || (p.catName === 'Desktop' && find(p, /\d+(?:\.\d)?"/));
  const facetsOf = (p) => {
    const st = find(p, /(\d+)\s?(GB|TB)\s?(SSD|HDD|NVMe)?$/i), ram = computer(p) && find(p, /^(\d+)\s?GB\s?(RAM|DDR\d)/i), sc = screenish(p) && find(p, /(\d+(?:\.\d)?)"/);
    const cpu = computer(p) && find(p, /(Core i\d|Ryzen|Apple M\d|M\d|Xeon)/i);
    return {
      brand: [p.brand], cat: [p.catName], condition: [p.condition],
      storage: st && (computer(p) || p.catName === 'Storage' || p.catName === 'Server') ? [`${st[1]} ${st[2].toUpperCase()}`] : [],
      ram: ram ? [`${ram[1]} GB`] : [],
      screen: sc ? [`${sc[1]} inch`] : [],
      stype: screenish(p) ? [p.touch || find(p, /touch/i) ? 'Touch' : 'Non-touch'] : [],
      gpu: computer(p) ? [p.gpu || (find(p, /RTX|GTX|Radeon/i) ? 'Dedicated' : 'Integrated')] : [],
      gpub: cpu ? [find(p, /RTX|GTX/i) ? 'NVIDIA' : /ryzen/i.test(cpu[1]) ? 'AMD' : /M\d/.test(cpu[1]) ? 'Apple' : 'Intel'] : []
    };
  };
  const gb = (n) => (n >= 1024 ? `${n / 1024} TB` : `${n} GB`);

  /* card (same look as the refurbished cards) */
  const card = (p, i) => `
    <article class="card product rf-card pr-card" style="animation-delay:${Math.min(i, 8) * 40}ms" data-id="${p.id}">
      <div class="media">
        ${p.off > 0 ? `<span class="rf-off">-${p.off}%</span>` : ''}
        <button class="wish" aria-label="Add to wishlist"><svg width="16" height="16"><use href="#i-heart"/></svg></button>
        <svg viewBox="${p.art.startsWith('bk-') ? '0 0 120 90' : '0 0 120 120'}"><use href="#${p.art}"/></svg>
        <span class="rf-grade pr-cond pr-cond--${p.condition === 'New' ? 'new' : 'ref'}">${p.condition === 'New' ? 'New' : `Refurbished · ${p.grade || 'A'}`}</span>
        ${p.tag ? `<span class="rf-tag">${esc(p.tag)}</span>` : ''}
      </div>
      <div class="body">
        <div class="rf-meta"><span>${esc(p.catName)} · ${esc(p.brand)}</span><span class="rating"><svg width="14" height="14"><use href="#i-star"/></svg>${p.rating.toFixed(1)}</span></div>
        <h3 title="${esc(p.name + ' — ' + p.specs.join(', '))}">${esc(p.name)}</h3>
        <p class="rf-spec-line">${esc(p.specs.slice(0, 3).join(' · '))}</p>
        <div class="rf-price">
          <div class="rf-was"><s>${inr(p.mrp)}</s><span class="rf-pct">${p.off}% off</span></div>
          <div class="rf-now">${inr(p.price)}</div>
          <div class="rf-save">You save ${inr(p.mrp - p.price)}</div>
        </div>
        <button class="add"><svg width="16" height="16"><use href="#i-cart"/></svg>Add to Cart</button>
      </div>
    </article>`;

  /* brand banner + title follow the brand filter */
  const LOGO = { apple: 'svg', hp: 'svg', dell: 'svg', lenovo: 'svg', microsoft: 'svg', asus: 'svg', acer: 'svg', msi: 'svg', sony: 'svg', samsung: 'svg', huawei: 'svg', epson: 'svg', brother: 'svg',
    'tp-link': 'svg', 'cp-plus': 'png', hcl: 'svg', microtek: 'svg', luminous: 'png', zebronics: 'png', geonix: 'png', kingston: 'svg', cisco: 'svg', netgear: 'svg', fujitsu: 'svg', seagate: 'svg', sandisk: 'svg' };
  const slug = (b) => b.toLowerCase().replace(/\s+/g, '-');
  const onRender = ({ sel }) => {
    const brands = [...sel.brand], one = brands.length === 1 ? brands[0] : null, box = $('#prBrand');
    $('#prTitle').innerHTML = one ? `${esc(one)} <span>products</span>` : 'All <span>products</span>';
    $('#prCrumb').textContent = one || 'All products';
    document.title = `${one ? one + ' products' : 'All products'} | FixPapa`;
    box.hidden = !one; if (!one) return;
    const ext = LOGO[slug(one)];
    $('.pr-brand-logo', box).innerHTML = ext ? `<img src="assets/img/brands/${slug(one)}.${ext}" alt="${esc(one)}">` : `<b>${esc(one)}</b>`;
    $('#prBrandName').textContent = one;
    $('#prBrandCount').textContent = `${all.filter((p) => p.brand === one).length} products from ${one}, new and certified refurbished`;
  };

  window.FPShopList({
    items: all.map((p) => ({ p, f: facetsOf(p) })),
    facets: [
      { k: 'brand', name: 'Brand' }, { k: 'cat', name: 'Category' }, { k: 'condition', name: 'Condition' },
      { k: 'storage', name: 'Storage', range: { toNum: (v) => num(v) * (/TB/.test(v) ? 1024 : 1), unit: gb } },
      { k: 'ram', name: 'RAM', range: { toNum: num, unit: (n) => `${n} GB` } },
      { k: 'screen', name: 'Screen Size', range: { toNum: num, unit: (n) => `${n}″` } },
      { k: 'stype', name: 'Screen Type' }, { k: 'gpu', name: 'GPU Type' }, { k: 'gpub', name: 'GPU Brand' }
    ],
    sorts: {
      new: (a, b) => b.p.id - a.p.id, off: (a, b) => b.p.off - a.p.off, pop: (a, b) => b.p.rating - a.p.rating,
      lo: (a, b) => a.p.price - b.p.price, hi: (a, b) => b.p.price - a.p.price,
      az: (a, b) => a.p.name.localeCompare(b.p.name), za: (a, b) => b.p.name.localeCompare(a.p.name)
    },
    urlValue: { brand: [(v) => v, (v) => [...new Set(all.map((p) => p.brand))].find((b) => b.toLowerCase() === v.toLowerCase()) || v] },
    card, onRender, scrollTo: '#allProducts', priceStep: 500
  });
})();
