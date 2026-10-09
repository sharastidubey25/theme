/* FixPapa · Set 5 · Refurbished catalogue — shared by the homepage (index.html) and the category page
   (refurbished-category.html?cat=…). Exposes window.FPRefurb = { cats, products, byCat, stats, card, inr }.
   Product list is sample data in the site's real price range — swap in the live catalogue when wiring the backend. */
(() => {
  /* ---------------- Product art (flat slate style, matches p-mini) — injected once as an SVG sprite ---------------- */
  const keys = (() => { let s = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) s += `<rect x="${15 + c * 6.6}" y="${62 + r * 6}" width="5" height="4.2" rx="1"/>`; return s; })();
  const art = `
  <symbol id="rf-laptop" viewBox="0 0 120 120"><defs><linearGradient id="rfgL" x1="0" x2="1"><stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0B1220"/></linearGradient><linearGradient id="rfgLs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E3A5F"/><stop offset="1" stop-color="#0F172A"/></linearGradient></defs><path d="M30 20h60a5 5 0 0 1 5 5v47H25V25a5 5 0 0 1 5-5z" fill="url(#rfgL)"/><rect x="30" y="25" width="60" height="42" rx="2" fill="url(#rfgLs)"/><path d="M30 25h34L44 67H30z" fill="#fff" opacity=".07"/><circle cx="60" cy="22.6" r="1.1" fill="#FDBA74"/><path d="M17 72h86l9 15a3 3 0 0 1-2.6 4.5H10.6A3 3 0 0 1 8 87z" fill="#334155"/><path d="M25 75h70l4.5 7.5h-79z" fill="#475569"/><rect x="51" y="85" width="18" height="3.4" rx="1.4" fill="#64748B"/><rect x="8" y="90" width="104" height="2" rx="1" fill="#1E293B"/></symbol>
  <symbol id="rf-desktop" viewBox="0 0 120 120"><defs><linearGradient id="rfgD" x1="0" x2="1"><stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0B1220"/></linearGradient></defs><path d="M34 22l44-10 12 6v80l-44 10-12-6z" fill="url(#rfgD)"/><path d="M34 22l12 6v80l-12-6z" fill="#334155"/><path d="M46 28l44-10" stroke="#475569"/><g fill="#475569"><circle cx="38" cy="40" r="1.4"/><circle cx="42" cy="42" r="1.4"/><circle cx="38" cy="46" r="1.4"/><circle cx="42" cy="48" r="1.4"/><circle cx="38" cy="52" r="1.4"/><circle cx="42" cy="54" r="1.4"/></g><rect x="37" y="74" width="6" height="3" fill="#EF4444" transform="skewY(26)"/><circle cx="40" cy="30" r="2" fill="#FDBA74"/></symbol>
  <symbol id="rf-printer" viewBox="0 0 120 120"><defs><linearGradient id="rfgP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#0B1220"/></linearGradient></defs><path d="M32 48l8-30h40l8 30z" fill="#1E293B"/><path d="M41 46l5-24h28l5 24z" fill="#F8FAFC"/><path d="M48 30h24M47 35h26M46 40h28" stroke="#CBD5E1" stroke-width="1.4"/><rect x="14" y="46" width="92" height="40" rx="9" fill="url(#rfgP)"/><rect x="14" y="46" width="92" height="6" rx="3" fill="#475569"/><rect x="72" y="56" width="16" height="5" rx="1.5" fill="#64748B"/><circle cx="95" cy="58.5" r="2.6" fill="#22C55E"/><rect x="28" y="72" width="64" height="5" rx="2.5" fill="#05080F"/><path d="M33 75h54l5 22H28z" fill="#F8FAFC"/><path d="M38 82h44M37 87h46M36 92h30" stroke="#CBD5E1" stroke-width="1.4"/><rect x="14" y="64" width="4" height="12" rx="2" fill="#FF8A1F"/></symbol>
  <symbol id="rf-cctv" viewBox="0 0 120 120"><defs><linearGradient id="rfgC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="#CBD5E1"/></linearGradient></defs><rect x="88" y="18" width="18" height="30" rx="4" fill="#334155"/><circle cx="97" cy="24" r="1.4" fill="#64748B"/><circle cx="97" cy="42" r="1.4" fill="#64748B"/><path d="M96 40L74 62" stroke="#475569" stroke-width="7" stroke-linecap="round"/><g transform="rotate(20 56 66)"><rect x="16" y="50" width="78" height="32" rx="13" fill="url(#rfgC)"/><rect x="12" y="44" width="80" height="11" rx="5.5" fill="#E2E8F0"/><rect x="12" y="44" width="80" height="3" rx="1.5" fill="#fff"/><circle cx="24" cy="66" r="13" fill="#0B1220"/><circle cx="24" cy="66" r="13" fill="none" stroke="#FF8A1F" stroke-width="2"/><circle cx="24" cy="66" r="6.5" fill="#1E3A5F"/><circle cx="21.5" cy="63.5" r="2" fill="#93C5FD"/><circle cx="84" cy="72" r="1.8" fill="#EF4444"/></g></symbol>
  <symbol id="rf-dvr" viewBox="0 0 120 120"><defs><linearGradient id="rfgR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#0B1220"/></linearGradient></defs><path d="M14 52l14-12h64l14 12z" fill="#475569"/><rect x="14" y="52" width="92" height="30" rx="4" fill="url(#rfgR)"/><g fill="#22C55E"><circle cx="24" cy="67" r="1.8"/><circle cx="31" cy="67" r="1.8"/></g><circle cx="38" cy="67" r="1.8" fill="#F59E0B"/><rect x="54" y="63" width="36" height="8" rx="2" fill="#05080F"/><rect x="56" y="65" width="14" height="4" rx="1" fill="#FF8A1F"/><rect x="20" y="82" width="8" height="4" rx="1" fill="#1E293B"/><rect x="92" y="82" width="8" height="4" rx="1" fill="#1E293B"/></symbol>
  <symbol id="rf-acc" viewBox="0 0 120 120"><defs><linearGradient id="rfgK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0B1220"/></linearGradient></defs><rect x="10" y="56" width="76" height="34" rx="6" fill="url(#rfgK)"/><g fill="#334155">${keys}</g><rect x="28" y="85" width="40" height="3" rx="1.5" fill="#475569"/><rect x="92" y="54" width="20" height="34" rx="10" fill="#0F172A"/><path d="M102 54v13M92 67h20" stroke="#334155" stroke-width="1.4"/><rect x="100.6" y="58" width="2.8" height="6" rx="1.4" fill="#FF8A1F"/><path d="M102 54c0-10 6-14 10-22" stroke="#334155" stroke-width="2" fill="none"/></symbol>
  <symbol id="rf-monitor" viewBox="0 0 120 120"><defs><linearGradient id="rfgM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E3A5F"/><stop offset="1" stop-color="#0F172A"/></linearGradient></defs><rect x="10" y="16" width="100" height="64" rx="5" fill="#0B1220"/><rect x="14" y="20" width="92" height="54" rx="2" fill="url(#rfgM)"/><path d="M14 20h46L36 74H14z" fill="#fff" opacity=".07"/><path d="M52 80h16l4 16H48z" fill="#334155"/><rect x="34" y="95" width="52" height="6" rx="3" fill="#475569"/><circle cx="60" cy="77" r="1.2" fill="#FDBA74"/></symbol>
  <symbol id="rf-ssd" viewBox="0 0 120 120"><defs><linearGradient id="rfgS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#0B1220"/></linearGradient></defs><rect x="22" y="24" width="76" height="70" rx="7" fill="url(#rfgS)"/><rect x="30" y="34" width="60" height="34" rx="4" fill="#FF8A1F"/><rect x="36" y="42" width="30" height="4" rx="2" fill="#fff" opacity=".9"/><rect x="36" y="50" width="20" height="3" rx="1.5" fill="#fff" opacity=".6"/><path d="M40 94h40v5H40z" fill="#94A3B8"/><g fill="#0B1220"><rect x="44" y="94" width="2" height="5"/><rect x="50" y="94" width="2" height="5"/><rect x="56" y="94" width="2" height="5"/><rect x="62" y="94" width="2" height="5"/><rect x="68" y="94" width="2" height="5"/><rect x="74" y="94" width="2" height="5"/></g></symbol>`;
  const inject = () => document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${art}</svg>`);
  if (document.body) inject(); else document.addEventListener('DOMContentLoaded', inject);

  /* ---------------- Categories ---------------- */
  const cats = [
    { id: 'laptops', name: 'Laptops', single: 'Laptop', art: 'rf-laptop', icon: 'i-laptop', line: 'ThinkPads, Latitudes and EliteBooks built for 9-to-5 and beyond.' },
    { id: 'desktops', name: 'Desktops', single: 'Desktop', art: 'rf-desktop', icon: 'i-desktop', line: 'Tiny business PCs that fit behind a monitor and run all day.' },
    { id: 'printers', name: 'Printers', single: 'Printer', art: 'rf-printer', icon: 'i-printer', line: 'Laser and ink-tank printers, serviced with fresh rollers and test pages.' },
    { id: 'cctv', name: 'CCTV', single: 'CCTV', art: 'rf-cctv', icon: 'i-cctv', line: 'Cameras, DVRs and ready kits to secure a home, shop or office.' },
    { id: 'accessories', name: 'Accessories', single: 'Accessory', art: 'rf-acc', icon: 'i-box', line: 'Monitors, keyboards, docks, RAM and SSDs to complete the setup.' },
  ];

  /* ---------------- Products: mrp / price in ₹ (numbers), specs = short chips ---------------- */
  const P = (cat, brand, name, specs, mrp, price, extra = {}) => ({ cat, brand, name, specs, mrp, price, rating: 4.0, grade: 'A', ...extra });
  const products = [
    // Laptops
    P('laptops', 'Dell', 'Dell Latitude 5490', ['Core i5 8th Gen', '8 GB RAM', '256 GB SSD', '14" FHD'], 72000, 19999, { rating: 4.4, tag: 'Bestseller' }),
    P('laptops', 'Lenovo', 'Lenovo ThinkPad T480', ['Core i5 8th Gen', '16 GB RAM', '512 GB SSD', '14" FHD'], 89000, 26499, { rating: 4.6 }),
    P('laptops', 'HP', 'HP EliteBook 840 G5', ['Core i7 8th Gen', '16 GB RAM', '512 GB SSD', '14" FHD'], 115000, 31999, { rating: 4.5 }),
    P('laptops', 'Lenovo', 'Lenovo ThinkPad X1 Carbon (6th Gen)', ['Core i7 8th Gen', '16 GB RAM', '512 GB SSD', '14" WQHD'], 165000, 42999, { rating: 4.7, tag: 'Premium' }),
    P('laptops', 'HP', 'HP ProBook 440 G6', ['Core i5 8th Gen', '8 GB RAM', '256 GB SSD', '14" HD'], 58000, 17499, { rating: 4.2 }),
    P('laptops', 'Dell', 'Dell Latitude 7480', ['Core i7 7th Gen', '8 GB RAM', '256 GB SSD', '14" FHD'], 95000, 22999, { rating: 4.3 }),
    P('laptops', 'Apple', 'Apple MacBook Air 2017', ['Core i5 · 1.8 GHz', '8 GB RAM', '128 GB SSD', '13.3"'], 77000, 29999, { rating: 4.5, grade: 'B' }),
    P('laptops', 'Lenovo', 'Lenovo ThinkPad E14', ['Core i3 10th Gen', '8 GB RAM', '256 GB SSD', '14" FHD'], 52000, 14999, { rating: 4.1 }),
    // Desktops (existing FixPapa listings)
    P('desktops', 'HP', 'HP 400 G6 Tiny Desktop', ['Core i5-10500T 10th Gen', '8 GB DDR4', '256 GB SSD'], 188000, 27055, { rating: 4.3, tag: 'Lowest price' }),
    P('desktops', 'Lenovo', 'Lenovo ThinkCentre M720q Tiny', ['Core i7 9th Gen', '8 GB DDR4', '256 GB SSD'], 70000, 31720),
    P('desktops', 'Lenovo', 'Lenovo ThinkCentre M920q Tiny', ['Core i5 8th Gen', '8 GB DDR4', '256 GB SSD'], 100000, 24909),
    P('desktops', 'Lenovo', 'Lenovo ThinkCentre M700 Tiny', ['Core i5 6th Gen', '8 GB DDR4', '256 GB SSD'], 48000, 11724, { tag: 'Bestseller' }),
    P('desktops', 'Dell', 'Dell OptiPlex 3070 Micro', ['Core i5 9th Gen', '8 GB DDR4', '256 GB SSD'], 72000, 22999),
    P('desktops', 'HP', 'HP EliteDesk 800 G4 Mini', ['Core i7 8th Gen', '16 GB DDR4', '512 GB SSD'], 110000, 32999, { rating: 4.5 }),
    P('desktops', 'Dell', 'Dell OptiPlex 7060 Micro', ['Core i7 8th Gen', '8 GB DDR4', '256 GB SSD'], 85000, 30499),
    P('desktops', 'HP', 'HP ProDesk 600 G3 Mini', ['Core i5 7th Gen', '8 GB DDR4', '256 GB SSD'], 60000, 13499),
    // Printers
    P('printers', 'HP', 'HP LaserJet Pro M404dn', ['Mono laser', 'Auto duplex', 'Ethernet', '38 ppm'], 28999, 13999, { rating: 4.4, tag: 'Bestseller' }),
    P('printers', 'Brother', 'Brother HL-L2321D', ['Mono laser', 'Auto duplex', 'USB', '30 ppm'], 14990, 6999),
    P('printers', 'Canon', 'Canon imageCLASS LBP2900B', ['Mono laser', 'USB', '12 ppm', 'Compact'], 11995, 5499, { rating: 4.2 }),
    P('printers', 'Epson', 'Epson EcoTank L3110', ['Ink tank', 'Print · Scan · Copy', 'Colour', 'USB'], 13999, 6999),
    P('printers', 'HP', 'HP LaserJet M1136 MFP', ['Mono laser', 'Print · Scan · Copy', 'USB', '18 ppm'], 17500, 8499, { rating: 4.1 }),
    P('printers', 'Brother', 'Brother DCP-L2541DW', ['Mono laser', 'Wi-Fi', 'Duplex', 'Print · Scan · Copy'], 24990, 12499, { rating: 4.3 }),
    // CCTV
    P('cctv', 'Hikvision', 'Hikvision 4-Camera HD Kit', ['4 × 2 MP cameras', '4-ch DVR', '1 TB HDD', 'Night vision'], 22000, 9999, { art: 'rf-cctv', rating: 4.5, tag: 'Complete kit' }),
    P('cctv', 'CP Plus', 'CP Plus 2.4 MP Bullet Camera', ['1080p', '30 m IR', 'IP66 outdoor'], 3200, 1199, { rating: 4.0 }),
    P('cctv', 'Hikvision', 'Hikvision 2 MP Dome Camera', ['1080p', '20 m IR', 'Indoor'], 2499, 899),
    P('cctv', 'Hikvision', 'Hikvision 4-Channel DVR', ['4 channels', '1080p Lite', 'H.265+', 'Mobile view'], 5500, 2299, { art: 'rf-dvr' }),
    P('cctv', 'CP Plus', 'CP Plus 8-Channel DVR', ['8 channels', '5 MP Lite', 'Mobile view'], 8900, 3699, { art: 'rf-dvr', rating: 4.2 }),
    P('cctv', 'Dahua', 'Dahua 2 MP IP Bullet Camera', ['PoE', '30 m IR', 'IP67 outdoor'], 5200, 2199, { rating: 4.1 }),
    // Accessories
    P('accessories', 'Dell', 'Dell P2419H 24" Monitor', ['24" FHD IPS', 'HDMI · DP · VGA', 'Height adjust'], 18500, 7499, { art: 'rf-monitor', rating: 4.6, tag: 'Bestseller' }),
    P('accessories', 'HP', 'HP 22es 22" Monitor', ['22" FHD IPS', 'HDMI · VGA', 'Slim bezel'], 12999, 5299, { art: 'rf-monitor', rating: 4.3 }),
    P('accessories', 'Logitech', 'Logitech MK270 Wireless Combo', ['Keyboard + mouse', '2.4 GHz', 'Spill-resistant'], 2495, 899, { rating: 4.2 }),
    P('accessories', 'Lenovo', 'Lenovo USB-C Dock (Gen 2)', ['USB-C', '2 × DP · HDMI', '90 W charging'], 21000, 6999, { art: 'rf-dvr' }),
    P('accessories', 'Samsung', 'Samsung 256 GB SATA SSD', ['2.5" SATA', 'Health 95%+', 'Tested'], 4500, 1499, { art: 'rf-ssd' }),
    P('accessories', 'Kingston', 'Kingston 8 GB DDR4 RAM', ['DDR4 2666 MHz', 'Laptop SO-DIMM', 'Tested'], 3200, 999, { art: 'rf-ssd', rating: 4.1 }),
  ].map((p, i) => ({ ...p, id: i + 1, off: Math.round((1 - p.price / p.mrp) * 100) }));

  const byCat = (id) => products.filter(p => p.cat === id);
  const stats = (id) => {
    const list = byCat(id);
    return { count: list.length, maxOff: Math.max(...list.map(p => p.off)), from: Math.min(...list.map(p => p.price)) };
  };

  /* ---------------- Card ---------------- */
  const inr = (n) => '₹' + n.toLocaleString('en-IN');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const catOf = (id) => cats.find(c => c.id === id);
  /* opts.specs: show spec chips (category page); opts.cat: show category label (mixed lists, e.g. homepage) */
  const card = (p, opts = {}) => {
    const c = catOf(p.cat);
    return `
    <article class="card product rf-card" data-cat="${p.brand.toLowerCase().replace(/\s+/g, '-')}" data-id="${p.id}">
      <div class="media">
        <span class="rf-off">-${p.off}%</span>
        <button class="wish" aria-label="Add to wishlist"><svg width="16" height="16"><use href="#i-heart"/></svg></button>
        <svg viewBox="0 0 120 120"><use href="#${p.art || c.art}"/></svg>
        <span class="rf-grade">Grade ${p.grade}</span>
        ${p.tag ? `<span class="rf-tag">${p.tag}</span>` : ''}
      </div>
      <div class="body">
        <div class="rf-meta"><span>${opts.cat ? `${c.single} · ` : ''}${p.brand}</span><span class="rating"><svg width="14" height="14"><use href="#i-star"/></svg>${p.rating.toFixed(1)}</span></div>
        <h3 title="${esc(p.name + ' — ' + p.specs.join(', '))}">${p.name}</h3>
        ${opts.specs ? `<ul class="rf-specs">${p.specs.map(s => `<li>${s}</li>`).join('')}</ul>` : `<p class="rf-spec-line">${p.specs.slice(0, 3).join(' · ')}</p>`}
        <div class="rf-price">
          <div class="rf-was"><s>${inr(p.mrp)}</s><span class="rf-pct">${p.off}% off</span></div>
          <div class="rf-now">${inr(p.price)}</div>
          <div class="rf-save">You save ${inr(p.mrp - p.price)}</div>
        </div>
        <button class="add"><svg width="16" height="16"><use href="#i-cart"/></svg>Add to Cart</button>
      </div>
    </article>`;
  };

  window.FPRefurb = { cats, products, byCat, stats, card, inr, catOf };
})();
