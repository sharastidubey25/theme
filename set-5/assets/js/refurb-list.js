/* FixPapa · Set 5 · Refurbished listing (refurbished.html) — configuration for the shared FPShopList engine.
   Products come from refurb-data.js (window.FPRefurb); facet values are read from each product's spec chips
   until the backend supplies them as fields. RAM, storage and screen size are snapping ranges. */
(() => {
  const R = window.FPRefurb; if (!R || !window.FPShopList) return;
  const find = (p, re) => { for (const s of p.specs) { const m = s.match(re); if (m) return m; } return null; };
  const screenCat = (p) => p.cat === 'laptops' || p.art === 'rf-monitor';
  const computer = (p) => p.cat === 'laptops' || p.cat === 'desktops';
  const num = (v) => parseFloat(v) || 0;
  const facetsOf = (p) => {
    const st = find(p, /(\d+)\s?(GB|TB)\s?(SSD|HDD)/i), ram = computer(p) && find(p, /^(\d+)\s?GB\s?(RAM|DDR\d)/i), sc = screenCat(p) && find(p, /(\d+(?:\.\d)?)"/);
    const cpu = computer(p) && find(p, /(Core i\d|Ryzen|M1|M2)/i);
    return {
      brand: [p.brand], cat: [R.catOf(p.cat).name],
      storage: st ? [`${st[1]} ${st[2].toUpperCase()} ${st[3].toUpperCase()}`] : [],
      ram: ram ? [`${ram[1]} GB`] : [],
      screen: sc ? [`${sc[1]} inch`] : [],
      stype: screenCat(p) ? ['Non-touch'] : [],
      gpu: computer(p) ? ['Integrated'] : [],
      gpub: cpu ? [/ryzen/i.test(cpu[1]) ? 'AMD' : /^M\d/.test(cpu[1]) ? 'Apple' : 'Intel'] : []
    };
  };
  const gb = (n) => (n >= 1024 ? `${n / 1024} TB` : `${n} GB`);
  window.FPShopList({
    items: R.products.map((p) => ({ p, f: facetsOf(p) })),
    facets: [
      { k: 'brand', name: 'Brand' }, { k: 'cat', name: 'Category' },
      { k: 'storage', name: 'Storage', range: { toNum: (v) => num(v) * (/TB/.test(v) ? 1024 : 1), unit: gb } },
      { k: 'ram', name: 'RAM', range: { toNum: num, unit: (n) => `${n} GB` } },
      { k: 'screen', name: 'Screen Size', range: { toNum: num, unit: (n) => `${n}″` } },
      { k: 'stype', name: 'Screen Type' }, { k: 'gpu', name: 'GPU Type' }, { k: 'gpub', name: 'GPU Brand' }
    ],
    urlValue: { cat: [(name) => (R.cats.find((c) => c.name === name) || {}).id || name, (id) => (R.catOf(id) || {}).name || id] },
    sorts: {
      new: (a, b) => b.p.id - a.p.id, off: (a, b) => b.p.off - a.p.off, pop: (a, b) => b.p.rating - a.p.rating,
      lo: (a, b) => a.p.price - b.p.price, hi: (a, b) => b.p.price - a.p.price,
      az: (a, b) => a.p.name.localeCompare(b.p.name), za: (a, b) => b.p.name.localeCompare(a.p.name)
    },
    card: (p, i) => R.card(p, { cat: true }).replace('<article ', `<article style="animation-delay:${Math.min(i, 8) * 40}ms" `),
    scrollTo: '#refurb'
  });
})();
