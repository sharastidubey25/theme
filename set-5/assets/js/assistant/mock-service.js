/* =========================================================
   FixPapa Assistant · MOCK chat service (demo only, NOT an AI)
   ---------------------------------------------------------
   Matches the user's text against a few keyword patterns and returns canned answers built from
   what the FixPapa website already says. Same contract as the http service in service.js, so it
   can be swapped out without touching the UI. Every reply is tagged meta.source = 'mock'.

   Test commands (demo only):  /error  → service failure · /timeout → never answers (hits the timeout)
                               /empty  → empty reply      · /garbage → malformed response
   ========================================================= */
(() => {
  const NS = window.FPAssistant = window.FPAssistant || {};
  const PHONE = '+91 86965 44448', TEL = 'tel:+918696544448', WA = 'https://wa.me/918696544448';

  // sample answers · keep in step with the website copy; the real backend replaces all of this
  const intents = [
    { test: /\b(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/, reply: {
      text: 'Hello! I can help you book a repair, explain our services or point you to the right page. What do you need?',
      suggestions: ['Book a repair', 'What services do you offer?', 'How much will my repair cost?'] } },
    { test: /\b(book|booking|schedule|appointment|pick ?up|repair my|fix my)\b/, reply: {
      text: 'Booking takes about a minute:\n1. Pick your device and the problem.\n2. Choose a pickup slot.\n3. A FixPapa technician collects it, repairs it and brings it back.\nEvery repair comes with up to 3 years of service warranty.',
      actions: [{ label: 'Book a repair', href: 'repair.html#book-now' }],
      suggestions: ['Which devices do you repair?', 'How much will my repair cost?'], mood: 'happy' } },
    { test: /\b(price|prices|cost|costs|charge|charges|rate|rates|how much|fee|fees|quote)\b/, reply: {
      text: 'The price depends on the device and the fault. A technician diagnoses it first and shares the quote before any work starts, so there are no surprises.\nFor software problems, phone support starts at ₹5/min.',
      actions: [{ label: 'Get a quote', href: 'repair.html#book-now' }],
      suggestions: ['Book a repair', 'Talk to a person'] } },
    { test: /\b(service cent(er|re)s?|near me|location|nearest)\b/, reply: {
      text: 'We keep a list of brand service centres across India for 100+ brands.',
      actions: [{ label: 'Find service centres', href: 'index.html#trouble' }] } },
    { test: /\b(service|services|offer|offers|provide|what do you do|help with)\b/, reply: {
      text: 'FixPapa can help with:\n• Doorstep repair for laptops, desktops, printers, CCTV and more\n• Technical support on call, from ₹5/min\n• AMC & inventory management for offices\n• Rental, refurbished and open-box devices\n• FixPapa Pulse device-health monitoring\n• E-waste pickup and recycling',
      suggestions: ['Book a repair', 'Tell me about AMC', 'Sell my e-waste'] } },
    { test: /\b(laptop|desktop|printer|cctv|camera|apple|macbook|iphone|monitor|tablet|projector|scanner|ups|wi-?fi|router|network|lan|server|biometric|device|devices)\b/, reply: {
      text: 'Yes, we repair laptops, desktops, printers, CCTV, Apple devices, monitors, tablets, projectors, scanners, UPS, Wi-Fi and networking, servers and biometric machines.',
      actions: [{ label: 'Pick your device', href: 'repair.html#book-now' }],
      suggestions: ['How much will my repair cost?', 'Is there a warranty?'] } },
    { test: /\b(warranty|guarantee)\b/, reply: {
      text: 'Every FixPapa repair comes with up to 3 years of service warranty. You can also check your product’s manufacturer warranty on our site.',
      actions: [{ label: 'Check your warranty', href: 'index.html#warranty' }],
      suggestions: ['Book a repair', 'Find a service centre'] } },
    { test: /\b(amc|maintenance|contract|inventory|office|offices|business)\b/, reply: {
      text: 'FixPapa AMC covers regular maintenance and asset tracking for offices, shops and schools, with all branches in one dashboard.',
      actions: [{ label: 'See AMC plans', href: 'index.html#amc' }],
      suggestions: ['Talk to a person', 'What services do you offer?'] } },
    { test: /\b(rent|rental|hire|lease)\b/, reply: {
      text: 'You can rent laptops, desktops, projectors and more, for a day or for months, with free delivery.',
      actions: [{ label: 'Browse rentals', href: 'rental.html' }] } },
    { test: /\b(refurb|refurbished|second ?hand|used|open ?box)\b/, reply: {
      text: 'Our refurbished and open-box devices are tested by FixPapa technicians and cost up to 86% less than new.',
      actions: [{ label: 'Shop refurbished', href: 'refurbished.html' }, { label: 'Open-box deals', href: 'open-box-deal.html' }] } },
    { test: /\b(pulse|health|monitor(ing)?|slow|battery)\b/, reply: {
      text: 'FixPapa Pulse watches your devices’ health in real time on Windows and macOS, so problems are caught before they cause downtime.',
      actions: [{ label: 'About FixPapa Pulse', href: 'device-health.html' }] } },
    { test: /\b(e-?waste|recycle|recycling|old gadget|sell)\b/, reply: {
      text: 'Sell your old gadgets to FixPapa: free doorstep pickup, a fair price (up to ₹4,000 for an old laptop) and certified recycling.',
      actions: [{ label: 'Sell your e-waste', href: 'index.html#ewaste' }], mood: 'happy' } },
    { test: /\b(human|person|agent|call|phone|contact|whatsapp|talk to)\b/, reply: {
      text: 'Sure, you can reach the FixPapa team on ' + PHONE + ' or on WhatsApp.',
      actions: [{ label: 'Call now', href: TEL }, { label: 'WhatsApp', href: WA }] } },
    { test: /\b(thanks|thank you|thx|great|awesome|perfect)\b/, reply: {
      text: 'Happy to help! Anything else I can do for you?', mood: 'happy' } }
  ];
  const fallback = {
    text: 'I’m a demo assistant, so I only know a few topics for now. Try one of these:',
    suggestions: ['Book a repair', 'What services do you offer?', 'How much will my repair cost?', 'Talk to a person']
  };

  function createMockService({ minDelay = 650, maxDelay = 1300 } = {}) {
    const wait = (ms, signal) => new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      signal && signal.addEventListener('abort', () => { clearTimeout(t); reject(new NS.ServiceError('ABORTED', 'Request aborted')); }, { once: true });
    });
    return {
      name: 'mock',
      async send(request, { signal } = {}) {
        const text = String(request && request.message && request.message.text || '').toLowerCase();
        // predictable "typing" time: longer questions take a little longer
        await wait(Math.min(maxDelay, minDelay + text.length * 6), signal);
        if (text.startsWith('/error')) throw new NS.ServiceError('MOCK_FAILURE', 'Simulated failure');
        if (text.startsWith('/timeout')) await wait(10 * 60 * 1000, signal);
        if (text.startsWith('/empty')) return NS.normalizeResponse({ reply: { text: '' } }, 'mock');
        if (text.startsWith('/garbage')) return NS.normalizeResponse({ unexpected: true }, 'mock');
        const hit = intents.find(i => i.test.test(text));
        return NS.normalizeResponse({ reply: hit ? hit.reply : fallback, meta: { source: 'mock' } }, 'mock');
      }
    };
  }

  NS.createMockService = createMockService;
})();
