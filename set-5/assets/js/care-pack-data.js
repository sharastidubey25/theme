/* FixPapa · Set 5 · Care Pack packages (care-pack.html).
   ─────────────────────────────────────────────────────────────────────────────
   EDIT THIS FILE to add, remove, rename or re-price packs. No other code changes are needed.

   devices  – the device chips shown above the packs (id, label, icon from the page's SVG sprite).
   packs    – shown left to right in this order. Per pack:
     id         unique slug, used in links (care-pack.html?buy=plus&device=laptop)
     name       pack name
     tagline    one short line under the name
     badge      optional ribbon text ('' for none)
     style      '' (white card) | 'featured' (orange border, highlighted) | 'dark' (navy premium card)
     months     validity in months
     prices     price per device id, in ₹ before GST. Leave a device out = pack not offered for it.
     mrp        optional "was" price per device id (shown struck through)
     highlights 3 key lines with an icon
     features   tick list ('Everything in Plus' style lines are fine)
     active     false hides the pack without deleting it
   gst      – GST % added at checkout (split equally into CGST + SGST).

   Live data: define window.FPCarePackApi.packs() (returns the same shape) before care-pack.js loads. */
window.FPCarePacks = {
  gst: 18,
  devices: [
    { id: 'laptop', label: 'Laptop', icon: 'i-laptop' },
    { id: 'desktop', label: 'Desktop', icon: 'i-desktop' },
    { id: 'printer', label: 'Printer', icon: 'i-printer' },
  ],
  packs: [
    {
      id: 'essential', name: 'Essential', tagline: 'The yearly basics, done right.', badge: '', style: '', months: 12,
      prices: { laptop: 999, desktop: 1199, printer: 799 },
      mrp: { laptop: 1499, desktop: 1799, printer: 1199 },
      highlights: [
        { icon: 'i-wrench', text: '<b>1</b> doorstep service visit' },
        { icon: 'i-headset', text: '<b>2</b> remote support sessions' },
        { icon: 'i-clock', text: 'Engineer within <b>48 hours</b>' },
      ],
      features: ['Deep cleaning and dust removal', 'Full health check with report', 'Software and driver tune-up', '10% off spare parts'],
      active: true,
    },
    {
      id: 'plus', name: 'Plus', tagline: 'Everyday care for a device you rely on.', badge: 'Most popular', style: 'featured', months: 12,
      prices: { laptop: 2499, desktop: 2799, printer: 1999 },
      mrp: { laptop: 3999, desktop: 4499, printer: 2999 },
      highlights: [
        { icon: 'i-wrench', text: '<b>3</b> doorstep service visits' },
        { icon: 'i-headset', text: '<b>Unlimited</b> remote support' },
        { icon: 'i-clock', text: 'Engineer within <b>24 hours</b>' },
      ],
      features: ['Everything in Essential', 'Free pickup and drop for repairs', 'No labour charge on repairs', '15% off spare parts', 'Health report every quarter'],
      active: true,
    },
    {
      id: 'premium', name: 'Premium', tagline: 'Complete care, nothing to think about.', badge: 'Complete care', style: 'dark', months: 12,
      prices: { laptop: 4999, desktop: 5499, printer: 3999 },
      mrp: { laptop: 7999, desktop: 8499, printer: 5999 },
      highlights: [
        { icon: 'i-wrench', text: '<b>6</b> doorstep service visits' },
        { icon: 'i-headset', text: 'Priority support, <b>24×7</b>' },
        { icon: 'i-clock', text: 'Engineer within <b>12 hours</b>' },
      ],
      features: ['Everything in Plus', 'Standby device for repairs over 3 days', 'Data backup assistance', '20% off spare parts', 'FixPapa Pulse monitoring included', 'Dedicated care manager'],
      active: true,
    },
  ],
};
