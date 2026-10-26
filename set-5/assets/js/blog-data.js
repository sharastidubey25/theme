/* FixPapa · Set 5 · blog posts for blogs.html and blog-post.html?slug=…
   SAMPLE CONTENT: the live fixpapa.com/blogs has no posts yet ("Page 1 of 0"), so these six guides are written from what
   the rest of the site says. Replace them with real articles (or a CMS feed) before launch. window.FPBlog = { cats, posts, bySlug }.
   body: list of blocks, ['h', text] heading · ['p', text] paragraph · ['ul' | 'ol', [items]] list · ['tip', text] callout. */
(() => {
  const cats = { repair: 'Repair tips', buying: 'Buying guides', rental: 'Rentals', business: 'Business IT', green: 'Sustainability' };
  const posts = [
    {
      slug: 'signs-your-laptop-needs-a-service', cat: 'repair', date: '2026-10-14', read: 5, img: 'repair.jpg',
      title: '7 signs your laptop needs a service',
      excerpt: 'Slow boots, a fan that never stops, a battery that drains by lunch. Here is what those signs mean and when to call a technician.',
      cta: ['Book a repair', 'repair.html'],
      body: [
        ['p', 'Most laptop problems give a warning long before they become expensive. Catching them early usually means a quick, low-cost fix instead of a new motherboard or a lost hard drive.'],
        ['h', 'The warning signs'],
        ['ol', ['It takes minutes to boot or wake from sleep.', 'The fan runs loud even when you are only browsing.', 'The bottom of the laptop gets too hot to keep on your lap.', 'The battery drops from full to empty in an hour or two.', 'Keys stick, repeat or stop working.', 'You see clicking noises, freezes or files that will not open.', 'The screen flickers, shows lines or has dark patches.']],
        ['h', 'What usually causes them'],
        ['p', 'Heat is the most common culprit: dust builds up in the vents and the processor slows itself down to stay cool. A clean and fresh thermal paste often brings back a lot of speed. Slow boots and freezes can also point to a failing hard drive, and swapping it for an SSD is one of the best upgrades you can make to an older machine.'],
        ['tip', 'If you hear clicking or see files that will not open, back up your data first. These are signs the drive may be about to fail.'],
        ['h', 'When to call a technician'],
        ['p', 'If cleaning the vents and closing heavy apps does not help, it is time for a proper diagnosis. A FixPapa technician checks the hardware, tells you the cost upfront and fixes it at your doorstep with genuine spare parts.']
      ]
    },
    {
      slug: 'refurbished-vs-new-laptop', cat: 'buying', date: '2026-10-07', read: 6, img: 'laptop-open.jpg',
      title: 'Refurbished vs new laptop: which should you buy?',
      excerpt: 'A certified refurbished business laptop can cost a fraction of a new one. Here is how to decide, and what to check before you pay.',
      cta: ['Shop refurbished', 'refurbished.html'],
      body: [
        ['p', 'Business-class laptops like ThinkPads, Latitudes and EliteBooks are built to last years of daily use. When companies refresh their fleets, many of these machines are tested, repaired and sold again as refurbished, often for far less than a new consumer laptop.'],
        ['h', 'When refurbished makes sense'],
        ['ul', ['You need a reliable machine for office work, study or browsing.', 'You want business build quality on a tight budget.', 'You are equipping a team and need several identical laptops.', 'You care about reducing e-waste.']],
        ['h', 'When to buy new'],
        ['p', 'Buy new if you need the latest processor for heavy video editing or gaming, or if you want the longest possible manufacturer warranty. For most everyday work, a recent refurbished model is more than enough.'],
        ['h', 'What to check before you buy'],
        ['ul', ['The grade (A, B or C) and what each grade means for scratches and wear.', 'Battery health and whether the battery has been replaced.', 'RAM and storage: 8 GB RAM and an SSD is the comfortable minimum today.', 'The warranty, and who services it.']],
        ['tip', 'Every FixPapa refurbished device is checked and graded, and comes with a warranty of up to 3 years.']
      ]
    },
    {
      slug: 'renting-vs-buying-office-it', cat: 'rental', date: '2026-09-29', read: 4, img: 'rent-desktop.jpg',
      title: 'Renting vs buying IT equipment for your office',
      excerpt: 'Short project, new branch or a training batch? Renting laptops and desktops can beat buying. A simple way to compare the two.',
      cta: ['See rental plans', 'rental.html'],
      body: [
        ['p', 'Buying hardware ties up cash on day one and leaves you with devices to maintain and eventually dispose of. Renting turns that into a predictable monthly cost, with delivery, setup and servicing included.'],
        ['h', 'Renting is usually better when'],
        ['ul', ['The need is temporary: a project, an event, an audit or a training batch.', 'You are opening a new office and want to move fast without a large purchase.', 'You do not have in-house IT staff to handle repairs.']],
        ['h', 'Buying is usually better when'],
        ['ul', ['You will use the same devices daily for three years or more.', 'You need custom builds or specialised software licences tied to the machine.']],
        ['h', 'Do the maths'],
        ['p', 'Compare the total rent for the period you need with the purchase price plus repairs, downtime and resale value. Longer rental plans cost less per month, so a 12-month plan can be much cheaper than renting month to month.'],
        ['tip', 'Need 10 or more devices? Ask about bulk rental pricing for offices and schools.']
      ]
    },
    {
      slug: 'what-an-amc-covers', cat: 'business', date: '2026-09-18', read: 5, img: 'amc-office.jpg',
      title: 'What an AMC covers, and when your business needs one',
      excerpt: 'An Annual Maintenance Contract keeps office PCs, printers and CCTV running with regular visits. Here is what is usually included.',
      cta: ['Explore AMC plans', 'index.html#amc'],
      body: [
        ['p', 'An Annual Maintenance Contract (AMC) is a yearly agreement for regular check-ups and repairs of your IT hardware. Instead of calling for help every time something breaks, you get planned visits and priority support.'],
        ['h', 'What is typically included'],
        ['ul', ['Scheduled preventive maintenance visits.', 'Priority resolution of hardware issues.', 'Tracking of contract dates, renewals and warranties.', 'Multiple devices under one contract: laptops, desktops, printers and more.']],
        ['p', 'Whether spare parts are covered depends on the contract, so always check what is included before you sign.'],
        ['h', 'Signs your business needs an AMC'],
        ['ul', ['You have more than a handful of devices and no IT person.', 'Downtime costs you sales or staff hours.', 'You keep losing track of warranties and service history.']],
        ['tip', 'With FixPapa you can raise service calls under your AMC, track every request and get reminders before the contract expires.']
      ]
    },
    {
      slug: 'dispose-of-e-waste-responsibly', cat: 'green', date: '2026-09-05', read: 4, img: 'ewaste.jpg',
      title: 'How to dispose of e-waste responsibly',
      excerpt: 'Old phones, chargers and dead laptops do not belong in the bin. How to recycle them safely, protect your data and even get paid.',
      cta: ['Sell your e-waste', 'sell-ewaste.html'],
      body: [
        ['p', 'Electronics contain metals and chemicals that harm soil and water when they end up in a landfill, and many of the same parts can be recovered and reused. Responsible recycling keeps them out of the environment.'],
        ['h', 'Before you hand anything over'],
        ['ol', ['Back up the files and photos you want to keep.', 'Sign out of your accounts and remove the device from them.', 'Factory reset phones and laptops, or ask for a certified data wipe.', 'Remove SIM and memory cards.']],
        ['h', 'Reuse first, recycle second'],
        ['p', 'A device that still works, or can be repaired, is worth more refurbished than recycled. Giving an old laptop a second life is the greenest option of all.'],
        ['tip', 'FixPapa offers free doorstep pickup for e-waste, wipes your data and pays you for eligible items.']
      ]
    },
    {
      slug: 'choosing-cctv-for-shop-or-office', cat: 'buying', date: '2026-08-22', read: 5, img: 'cctv.jpg',
      title: 'Choosing a CCTV setup for your shop or office',
      excerpt: 'How many cameras, which resolution and where to store the footage. A plain-language guide to a security setup that works.',
      cta: ['Book an installation', 'repair.html'],
      body: [
        ['p', 'A good CCTV setup is less about the most expensive camera and more about covering the right places and keeping the footage you need.'],
        ['h', 'Plan the coverage'],
        ['ul', ['Entrances and exits, including back doors.', 'Cash counters and stock rooms.', 'Parking and the street-facing side, if allowed.']],
        ['h', 'Pick the right cameras'],
        ['p', 'Dome cameras suit indoor ceilings, bullet cameras suit outdoor walls. 2 MP (1080p) is enough for most shops; choose higher resolution where you need to read faces or number plates. Night vision matters for anything outdoors.'],
        ['h', 'Recording and storage'],
        ['p', 'A DVR or NVR records the footage. Size the hard drive for at least 15 to 30 days of recording, and set up mobile viewing so you can check in from anywhere.'],
        ['tip', 'FixPapa installs and maintains CCTV systems from brands like Hikvision, Dahua and CP Plus.']
      ]
    }
  ];
  const bySlug = (s) => posts.find((p) => p.slug === s);
  window.FPBlog = { cats, posts, bySlug };
})();
