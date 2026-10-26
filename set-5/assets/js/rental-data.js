/* FixPapa · Set 5 · rental catalogue (rental-category.html?cat=laptop|desktop|printer|projector)
   Single data source for the rental listing, exposed as window.FPRental = { cats, products, catOf, plans, monthly, inr }.
   Sample data modelled on the live rent-a-product pages; replace with the backend feed.
   price = monthly rent on a 1-month plan; longer plans are cheaper per month (PLANS). */
(() => {
  const cats = [
    { id: 'laptop', name: 'Laptop', plural: 'Laptops', art: 'bk-laptop', line: 'Lenovo, Dell, HP and Apple laptops from Core i3 to i9, set up and ready to work.' },
    { id: 'desktop', name: 'Desktop', plural: 'Desktops', art: 'bk-desktop', line: 'Core i3, i5 and i7 office desktops with 8 GB RAM and 256 GB SSD, delivered, set up and networked.' },
    { id: 'printer', name: 'Printer', plural: 'Printers', art: 'bk-printer', line: 'Laser and multifunction printers, serviced and installed at your desk.' },
    { id: 'projector', name: 'Projector', plural: 'Projectors', art: 'bk-projector', line: 'Full HD and 4K projectors for classrooms, meetings and events.' }
  ];
  const PLANS = [[1, 1], [3, .9], [6, .82], [12, .75]];   // months → share of the 1-month price
  /* laptops mirror the live fixpapa.com/rent-a-product/laptop catalogue (pages 1–2, 32 listings, same order; live typos such as
     "Interl" and "512 BG" cleaned up). The live pages show ₹0.00, so monthly prices are sample tiers by processor. */
  const L_PRICE = { i3: { 4: 899, 6: 1099, 8: 1299, 10: 1499 }, i5: { 4: 1199, 6: 1399, 8: 1699, 10: 1999 }, i7: { 6: 1899, 8: 2199, 10: 2599 } };
  const L = (brand, cpu, gen, storage = 256, extra = {}) => ({
    cat: 'laptop', brand, model: extra.model || 'Laptop',
    specs: { Processor: `Intel Core ${cpu} ${gen}th Gen`, RAM: '8 GB', Storage: `${storage} GB SSD` },
    price: L_PRICE[cpu][gen] + (storage > 256 ? 100 : 0), ...(extra.tag ? { tag: extra.tag } : {})
  });
  const MAC = (cpu, price, tag) => ({ cat: 'laptop', brand: 'Apple', model: 'MacBook', specs: { Processor: `Intel Core ${cpu}`, RAM: '16 GB', Storage: '512 GB SSD' }, price, ...(tag ? { tag } : {}) });
  const LAPTOPS = [
    L('Lenovo', 'i5', 10, 256, { tag: 'Most rented' }), L('Lenovo', 'i5', 8), L('Lenovo', 'i5', 6),
    L('Dell', 'i5', 10), L('Dell', 'i5', 8), L('Dell', 'i5', 6),
    L('HP', 'i5', 10), L('HP', 'i5', 8), L('HP', 'i5', 6), L('HP', 'i5', 4),
    L('Lenovo', 'i7', 10), L('Lenovo', 'i7', 8), L('Lenovo', 'i7', 6),
    L('Dell', 'i7', 10), L('Dell', 'i7', 8), L('Dell', 'i7', 6),
    L('HP', 'i7', 10, 256, { tag: 'Premium' }), L('HP', 'i7', 8), L('HP', 'i7', 6),
    MAC('i9', 3999, 'Mac'), MAC('i7', 3499),
    L('Lenovo', 'i3', 10), L('Lenovo', 'i3', 8, 256, { tag: 'Best for students' }), L('Lenovo', 'i3', 6), L('Lenovo', 'i3', 4),
    L('Dell', 'i3', 10), L('Dell', 'i3', 8), L('Dell', 'i3', 4),
    L('Dell', 'i3', 10, 256, { model: 'Vostro 3401' }),
    L('Lenovo', 'i5', 4, 512), L('HP', 'i3', 6, 512), L('HP', 'i3', 4, 512)
  ].reverse();   // reversed so the default "Newest" sort starts with Lenovo i5 10th Gen, as on the live page
  /* desktops mirror the live fixpapa.com/rent-a-product/desktop catalogue: Lenovo, Dell, HP × Core i7 / i5 / i3 × 10th / 8th / 6th Gen, 8 GB / 256 GB */
  const D_PRICE = { i7: [2399, 1999, 1699], i5: [1799, 1499, 1299], i3: [1399, 1199, 999] }, D_TAG = { 'Lenovo i5 10th': 'Most rented', 'Dell i3 8th': 'Best value', 'HP i7 10th': 'Premium' };
  const DESKTOPS = ['i7', 'i5', 'i3'].flatMap((cpu) => ['Lenovo', 'Dell', 'HP'].flatMap((brand) => ['10th', '8th', '6th'].map((gen, g) => {
    const tag = D_TAG[`${brand} ${cpu} ${gen}`];
    return { cat: 'desktop', brand, model: 'Desktop', specs: { Processor: `Intel Core ${cpu} ${gen} Gen`, RAM: '8 GB', Storage: '256 GB SSD' }, price: D_PRICE[cpu][g], ...(tag ? { tag } : {}) };
  }))).reverse();   // reversed so the default "Newest" sort starts with Lenovo i7 10th Gen, as on the live page
  const P = (brand, model, type, tech, conn, price, extra = {}) => ({ cat: 'printer', brand, model, specs: { 'Printer Type': type, 'Printer Technology': tech, Connectivity: conn }, price, ...extra });
  const J = (brand, model, type, conn, lumens, price, extra = {}) => ({ cat: 'projector', brand, model, specs: { 'Projector Type': type, Connectivity: conn, Brightness: lumens }, price, ...extra });
  const products = [
    ...LAPTOPS,
    ...DESKTOPS,
    P('HP', 'LaserJet Pro M126nw', 'Laser Jet', 'Multifunction', 'Wi-Fi + USB', 1299, { tag: 'Print · Scan · Copy' }),
    P('HP', 'LaserJet 1020 Plus', 'Laser Jet', 'Laser', 'USB', 899, { tag: 'Best value' }),
    P('HP', 'LaserJet Pro M404dn', 'Laser Jet', 'Laser', 'USB + Ethernet', 1499),
    P('Canon', 'imageCLASS LBP2900B', 'Laser Jet', 'Laser', 'USB', 899),
    P('Canon', 'imageCLASS LBP6030w', 'Laser Jet', 'Laser', 'Wi-Fi + USB', 1099),
    P('Canon', 'imageCLASS MF3010', 'Laser Jet', 'Multifunction', 'USB', 1199),
    P('Brother', 'HL-L2321D', 'Laser Jet', 'Laser', 'USB', 999),
    P('Epson', 'EcoTank L3250', 'Ink Tank', 'Multifunction', 'Wi-Fi + USB', 1099, { tag: 'Colour' }),
    J('Epson', 'EB-X51', 'HD', 'HDMI · USB · VGA', '3800 lumens', 1999, { tag: 'Classrooms' }),
    J('BenQ', 'MH560', 'Full HD', 'HDMI · USB · VGA', '3800 lumens', 2499, { tag: 'Meetings' }),
    J('Otek', '4K Smart Projector', '4K', 'Bluetooth · USB · Wi-Fi', '5000 lumens', 2999, { tag: 'Events' })
  ].map((p, i) => ({ ...p, id: i + 1, name: `${p.brand} ${p.model}` }));

  const catOf = (id) => cats.find((c) => c.id === id);
  const monthly = (p, months) => Math.round(p.price * (PLANS.find(([m]) => m === months) || PLANS[0])[1]);
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  window.FPRental = { cats, products, catOf, plans: PLANS.map(([m]) => m), monthly, inr };
})();
