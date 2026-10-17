/* FixPapa · Set 5 · rental catalogue (rental-category.html?cat=laptop|desktop|printer|projector)
   Single data source for the rental listing, exposed as window.FPRental = { cats, products, catOf, plans, monthly, inr }.
   Sample data modelled on the live rent-a-product pages; replace with the backend feed.
   price = monthly rent on a 1-month plan; longer plans are cheaper per month (PLANS). */
(() => {
  const cats = [
    { id: 'laptop', name: 'Laptop', plural: 'Laptops', art: 'bk-laptop', line: 'ThinkPads, Latitudes, EliteBooks and MacBooks, set up and ready to work.' },
    { id: 'desktop', name: 'Desktop', plural: 'Desktops', art: 'bk-desktop', line: 'Office desktops with monitor, keyboard and mouse, delivered and networked.' },
    { id: 'printer', name: 'Printer', plural: 'Printers', art: 'bk-printer', line: 'Laser and multifunction printers, serviced and installed at your desk.' },
    { id: 'projector', name: 'Projector', plural: 'Projectors', art: 'bk-projector', line: 'Full HD and 4K projectors for classrooms, meetings and events.' }
  ];
  const PLANS = [[1, 1], [3, .9], [6, .82], [12, .75]];   // months → share of the 1-month price
  const L = (brand, model, cpu, ram, storage, screen, price, extra = {}) => ({ cat: 'laptop', brand, model, specs: { Processor: cpu, RAM: ram, Storage: storage, Screen: screen }, price, ...extra });
  const D = (brand, model, cpu, ram, storage, monitor, price, extra = {}) => ({ cat: 'desktop', brand, model, specs: { Processor: cpu, RAM: ram, Storage: storage, Monitor: monitor }, price, ...extra });
  const P = (brand, model, type, tech, conn, price, extra = {}) => ({ cat: 'printer', brand, model, specs: { 'Printer Type': type, 'Printer Technology': tech, Connectivity: conn }, price, ...extra });
  const J = (brand, model, type, conn, lumens, price, extra = {}) => ({ cat: 'projector', brand, model, specs: { 'Projector Type': type, Connectivity: conn, Brightness: lumens }, price, ...extra });
  const products = [
    L('Lenovo', 'ThinkPad E14', 'Intel Core i3 10th Gen', '8 GB', '256 GB SSD', '14"', 1499, { tag: 'Best for students' }),
    L('HP', 'ProBook 440 G5', 'Intel Core i5 8th Gen', '8 GB', '256 GB SSD', '14"', 1799),
    L('Dell', 'Latitude 5480', 'Intel Core i5 6th Gen', '8 GB', '256 GB SSD', '14"', 1599),
    L('Lenovo', 'ThinkPad T480', 'Intel Core i5 8th Gen', '8 GB', '256 GB SSD', '14"', 1899, { tag: 'Most rented' }),
    L('Dell', 'Latitude 5410', 'Intel Core i5 10th Gen', '8 GB', '256 GB SSD', '14"', 2299),
    L('HP', 'EliteBook 840 G7', 'Intel Core i5 10th Gen', '16 GB', '512 GB SSD', '14"', 2799),
    L('Lenovo', 'ThinkPad T490', 'Intel Core i7 8th Gen', '16 GB', '512 GB SSD', '14"', 2999),
    L('Dell', 'Latitude 7410', 'Intel Core i7 10th Gen', '16 GB', '512 GB SSD', '14"', 3399, { tag: 'Premium' }),
    L('HP', 'ProBook 450 G7', 'Intel Core i5 10th Gen', '8 GB', '512 GB SSD', '15.6"', 2199),
    L('Lenovo', 'ThinkPad L590', 'Intel Core i5 8th Gen', '8 GB', '256 GB SSD', '15.6"', 1999),
    L('Apple', 'MacBook Air M1', 'Apple M1', '8 GB', '256 GB SSD', '13.3"', 3999, { tag: 'Mac' }),
    L('Apple', 'MacBook Pro 13 (2020)', 'Intel Core i5 10th Gen', '16 GB', '512 GB SSD', '13.3"', 4499),
    D('Dell', 'OptiPlex 3060', 'Intel Core i3 8th Gen', '8 GB', '256 GB SSD', '19.5"', 1299, { tag: 'Best value' }),
    D('HP', 'ProDesk 400 G5', 'Intel Core i5 8th Gen', '8 GB', '256 GB SSD', '22"', 1599),
    D('Lenovo', 'ThinkCentre M720', 'Intel Core i5 8th Gen', '8 GB', '256 GB SSD', '22"', 1599),
    D('Dell', 'OptiPlex 5070', 'Intel Core i5 9th Gen', '8 GB', '256 GB SSD', '22"', 1799, { tag: 'Most rented' }),
    D('HP', 'EliteDesk 800 G4', 'Intel Core i7 8th Gen', '16 GB', '512 GB SSD', '24"', 2499),
    D('Lenovo', 'ThinkCentre M920', 'Intel Core i7 8th Gen', '8 GB', '256 GB SSD', '22"', 2199),
    D('Dell', 'OptiPlex 7080', 'Intel Core i7 10th Gen', '16 GB', '512 GB SSD', '24"', 2899, { tag: 'Premium' }),
    D('HP', 'ProDesk 600 G6', 'Intel Core i5 10th Gen', '8 GB', '512 GB SSD', '22"', 1999),
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
