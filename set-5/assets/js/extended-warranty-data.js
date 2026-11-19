/* FixPapa · Set 5 · Extended Hardware Warranty plans (extended-warranty.html).
   ─────────────────────────────────────────────────────────────────────────────
   EDIT THIS FILE to change, add, remove or re-price plans. No other code changes are needed.

   devices  – the device chips above the plans (id, label, icon from the page's SVG sprite).
   plans    – shown left to right in this order. Per plan:
     id          unique slug, used in links (extended-warranty.html?buy=1y&device=laptop)
     name        plan name shown on the card, e.g. '1 Year'
     months      warranty length in months (sets the "valid till" date)
     tagline     one short line under the name
     badge       optional ribbon text ('' for none)
     style       '' (white card) | 'featured' (orange border) | 'dark' (navy premium card)
     prices      price per device id, in ₹ before GST. Leave a device out = plan not offered for it.
     mrp         optional "was" price per device id (struck through, % off is worked out)
     highlights  3 key lines with an icon (short HTML allowed, e.g. <b>)
     covered     what the plan covers (tick list)
     notCovered  what it doesn't cover (cross list, keep short)
     active      false hides the plan without deleting it
   gst          – GST % added at checkout (split equally into CGST + SGST).
   eligibility  – the "Who can buy" lines on the page.

   Live data: define window.FPWarrantyApi.plans() (returns the same shape) before extended-warranty.js loads. */
window.FPWarrantyPlans = {
  gst: 18,
  devices: [
    { id: 'laptop', label: 'Laptop', icon: 'i-laptop' },
    { id: 'desktop', label: 'Desktop', icon: 'i-desktop' },
    { id: 'printer', label: 'Printer', icon: 'i-printer' },
  ],
  plans: [
    {
      id: '3m', name: '3 Months', months: 3, tagline: 'Short cover for a device you rely on right now.', badge: '', style: '',
      prices: { laptop: 799, desktop: 899, printer: 599 },
      mrp: { laptop: 999, desktop: 1099, printer: 749 },
      highlights: [
        { icon: 'i-shield', text: '<b>1</b> hardware claim' },
        { icon: 'i-wrench', text: 'Parts and labour, up to <b>₹5,000</b>' },
        { icon: 'i-clock', text: 'Claims after a <b>15-day</b> waiting period' },
      ],
      covered: ['Motherboard, RAM and storage failures', 'Power supply and charging faults', 'Genuine or certified parts', 'Doorstep pickup and drop'],
      notCovered: ['Physical or liquid damage', 'Software issues and viruses'],
      active: true,
    },
    {
      id: '6m', name: '6 Months', months: 6, tagline: 'Half a year of worry-free hardware.', badge: 'Most popular', style: 'featured',
      prices: { laptop: 1399, desktop: 1599, printer: 999 },
      mrp: { laptop: 1899, desktop: 2099, printer: 1399 },
      highlights: [
        { icon: 'i-shield', text: '<b>2</b> hardware claims' },
        { icon: 'i-wrench', text: 'Parts and labour, up to <b>₹10,000</b>' },
        { icon: 'i-clock', text: 'Claims after a <b>15-day</b> waiting period' },
      ],
      covered: ['Everything in 3 Months', 'Display and keyboard failures', 'Battery cover (laptops)', 'Free health check at the start'],
      notCovered: ['Physical or liquid damage', 'Software issues and viruses'],
      active: true,
    },
    {
      id: '1y', name: '1 Year', months: 12, tagline: 'Full-year protection with the best value.', badge: 'Best value', style: 'dark',
      prices: { laptop: 2499, desktop: 2799, printer: 1799 },
      mrp: { laptop: 3499, desktop: 3999, printer: 2499 },
      highlights: [
        { icon: 'i-shield', text: '<b>Unlimited</b> hardware claims' },
        { icon: 'i-wrench', text: 'Parts and labour, up to <b>₹25,000</b>' },
        { icon: 'i-clock', text: 'Repair within <b>7 working days</b>' },
      ],
      covered: ['Everything in 6 Months', 'Standby device for repairs over 7 days', 'Priority claim support', 'Two free health checks a year'],
      notCovered: ['Physical or liquid damage', 'Cosmetic wear and tear'],
      active: true,
    },
  ],
  eligibility: [
    'Device is under 5 years old',
    'It works when the plan starts (no known faults)',
    'Original or certified parts inside',
    'Passes a quick health check at pickup or on video',
  ],
};
