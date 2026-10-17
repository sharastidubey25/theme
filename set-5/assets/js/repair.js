/* FixPapa · Set 5 · Book a Repair page — header, theme, reveal, lazy video, booking modal */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* header height → page offset, scrolled state, to-top */
  const topbar = $('#topbar'), toTop = $('#toTop');
  const setH = () => root.style.setProperty('--hdr-h', (topbar.offsetHeight + 20) + 'px');
  setH(); addEventListener('resize', setH);
  const onScroll = () => { topbar.classList.toggle('scrolled', scrollY > 40); toTop.classList.toggle('show', scrollY > 700); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }));

  /* mobile menu */
  const menu = $('#mobileNav');
  $('#menuToggle').addEventListener('click', () => menu.classList.toggle('open'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

  /* theme toggle (same storage key as the homepage) */
  const tt = $('#themeToggle');
  const apply = (dark) => { if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme; tt.setAttribute('aria-pressed', dark); tt.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); };
  apply(root.dataset.theme === 'dark');
  tt.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 600);
    apply(dark); try { localStorage.setItem('fp-theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  /* ripple */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-ripple]'); if (!b) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });

  /* reveal on scroll + lazy videos */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rv = $$('[data-reveal]');
  const from = { left: 'translateX(-40px)', right: 'translateX(40px)', scale: 'scale(.96)' };
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(el => el.style.opacity = 1);
  else {
    rv.forEach(el => { el.style.opacity = 0; el.style.transform = from[el.dataset.reveal] || 'translateY(40px)'; el.style.transition = 'opacity .9s var(--ease), transform .9s var(--ease)'; });
    const io = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { en.target.style.opacity = 1; en.target.style.transform = 'none'; io.unobserve(en.target); } }), { threshold: .12 });
    rv.forEach(el => io.observe(el));
  }
  const vio = new IntersectionObserver((es) => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; if (!reduce) v.play().catch(() => {}); } else v.pause();
  }), { threshold: .2 });
  $$('video[data-src]').forEach(v => vio.observe(v));

  /* ---------------- booking modal · 3 steps ----------------
     1 Your device: category → brand → service type (each collapses to a summary once picked)
     2 Issue & visit: description (+ optional details/photos), address, date + time slot
     3 Confirm: summary, mobile + Individual/Business + terms → OTP appears in the same screen
     Brands, issue prices and cities below are sample data until the booking API is connected.
     A real backend plugs in through window.FPBookingApi = { sendOtp(mobile), verifyAndBook(otp, booking) } (both return Promises). */
  const modal = $('#bookModal'), form = $('#bookForm'), next = $('#rpmNext'), back = $('#rpmBack');
  const cats = $$('.rpm-cat', modal), qCat = $('#qCat'), qBrand = $('#qBrand'), qIssue = $('#qIssue');
  const LOGO = { acer: 'acer.svg', apple: 'apple.svg', asus: 'asus.svg', brother: 'brother.svg', cisco: 'cisco.svg', 'cp-plus': 'cp-plus.png', dell: 'dell.svg', epson: 'epson.svg', fujitsu: 'fujitsu.svg', geonix: 'geonix.png', hcl: 'hcl.svg', hp: 'hp.svg', huawei: 'huawei.svg', lenovo: 'lenovo.svg', luminous: 'luminous.png', microsoft: 'microsoft.svg', microtek: 'microtek.svg', msi: 'msi.svg', netgear: 'netgear.svg', samsung: 'samsung.svg', sony: 'sony.svg', 'tp-link': 'tp-link.svg', zebronics: 'zebronics.png' };
  const NAME = { hp: 'HP', msi: 'MSI', hcl: 'HCL', 'cp-plus': 'CP Plus', 'tp-link': 'TP-Link', essl: 'eSSL', zkteco: 'ZKTeco', apc: 'APC' };
  const brandName = (b) => NAME[b] || b.replace(/(^|-)\w/g, (m) => m.toUpperCase()).replace('-', ' ');
  const BRANDS = {
    laptop: ['dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'msi', 'microsoft'], desktop: ['dell', 'hp', 'lenovo', 'acer', 'asus', 'hcl'],
    printer: ['hp', 'epson', 'brother', 'canon', 'samsung'], cctv: ['cp-plus', 'hikvision', 'dahua', 'geonix'], apple: ['apple'],
    monitor: ['dell', 'hp', 'lenovo', 'samsung', 'acer', 'asus'], tablet: ['apple', 'samsung', 'lenovo', 'huawei'], projector: ['epson', 'sony', 'hp', 'benq'],
    scanner: ['hp', 'epson', 'brother', 'fujitsu', 'canon'], ups: ['luminous', 'microtek', 'apc', 'zebronics'], wifi: ['tp-link', 'netgear', 'cisco'],
    network: ['cisco', 'tp-link', 'netgear'], server: ['dell', 'hp', 'lenovo', 'fujitsu'], biometric: ['essl', 'zkteco', 'mantra']
  };
  const SCREEN = ['laptop', 'desktop', 'apple', 'monitor', 'tablet', 'projector'];
  const issuesFor = (id, n) => [[`${n} Software Issues`, 599], [`${n} Hardware Issue`, 599], [`${n} Physical/Damage Issues`, 499]]
    .concat(SCREEN.includes(id) ? [[`${n} Display Issues`, 599]] : [], [[`${n} Power/Connectivity Issues`, 599], ['Other Issue', 699]]);
  const CITIES = {
    'Andhra Pradesh': 'Visakhapatnam,Vijayawada,Guntur,Tirupati', Assam: 'Guwahati,Silchar,Dibrugarh', Bihar: 'Patna,Gaya,Muzaffarpur,Bhagalpur', Chandigarh: 'Chandigarh',
    Chhattisgarh: 'Raipur,Bhilai,Bilaspur', Delhi: 'New Delhi,Dwarka,Rohini,Saket', Goa: 'Panaji,Margao,Vasco da Gama', Gujarat: 'Ahmedabad,Surat,Vadodara,Rajkot,Gandhinagar',
    Haryana: 'Gurugram,Faridabad,Panipat,Ambala', 'Himachal Pradesh': 'Shimla,Dharamshala,Mandi', 'Jammu and Kashmir': 'Srinagar,Jammu', Jharkhand: 'Ranchi,Jamshedpur,Dhanbad',
    Karnataka: 'Bengaluru,Mysuru,Mangaluru,Hubballi', Kerala: 'Kochi,Thiruvananthapuram,Kozhikode', 'Madhya Pradesh': 'Indore,Bhopal,Gwalior,Jabalpur',
    Maharashtra: 'Mumbai,Pune,Nagpur,Nashik,Thane', Odisha: 'Bhubaneswar,Cuttack,Rourkela', Punjab: 'Ludhiana,Amritsar,Jalandhar,Mohali',
    Rajasthan: 'Jaipur,Jodhpur,Udaipur,Kota,Ajmer,Bikaner', 'Tamil Nadu': 'Chennai,Coimbatore,Madurai,Tiruchirappalli', Telangana: 'Hyderabad,Warangal,Secunderabad',
    'Uttar Pradesh': 'Lucknow,Noida,Ghaziabad,Kanpur,Agra,Varanasi', Uttarakhand: 'Dehradun,Haridwar,Haldwani', 'West Bengal': 'Kolkata,Howrah,Siliguri,Durgapur'
  };
  const SLOTS = [[9, '9 – 11 AM'], [11, '11 AM – 1 PM'], [13, '1 – 3 PM'], [15, '3 – 5 PM'], [17, '5 – 7 PM']];
  const delay = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
  const api = window.FPBookingApi || {   // demo only: any 6-digit OTP is accepted
    demo: true,
    sendOtp: () => delay(600),
    verifyAndBook: (otp) => delay(800).then(() => (/^\d{6}$/.test(otp) ? { ref: 'FP' + Date.now().toString(36).toUpperCase().slice(-6) } : Promise.reject(new Error('otp'))))
  };
  const st = { step: 1, cat: null, brand: null, issue: null, day: null, slot: null, kind: 'Individual', otp: false, done: false, busy: false };
  const F = (n) => form.elements[n];
  let lastFocus, timerId;

  // a choice tile/chip group: aria-checked radio buttons
  const radio = (wrap, btn) => $$('[role="radio"]', wrap).forEach((x) => x.setAttribute('aria-checked', x === btn));
  const collapse = (q, html) => { const p = $('.rpm-picked', q); p.innerHTML = html; p.hidden = false; $('.rpm-change', q).hidden = false; $('.rpm-grid,.rpm-brands', q).hidden = true; const tm = $('.rpm-tm', q); if (tm) tm.hidden = true; };
  const expand = (q) => { $('.rpm-picked', q).hidden = true; $('.rpm-change', q).hidden = true; $('.rpm-grid,.rpm-brands', q).hidden = false; const tm = $('.rpm-tm', q); if (tm) tm.hidden = false; };
  const reveal = (q) => { q.hidden = false; requestAnimationFrame(() => q.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })); };
  const brandTile = (b) => `<button type="button" class="rpm-brand" role="radio" aria-checked="false" data-b="${b}">${LOGO[b] ? `<img src="assets/img/brands/${LOGO[b]}" alt="${brandName(b)}" loading="lazy">` : `<b>${brandName(b)}</b>`}</button>`;
  const catName = () => st.cat.textContent.trim().replace(/ Repair$/, '');

  function pickCat(c) {
    radio(qCat, c); st.cat = c; st.brand = st.issue = null;
    collapse(qCat, `<span class="rpm-art">${$('svg', c).outerHTML}</span><b>${c.textContent.trim()}</b>`);
    const list = BRANDS[c.dataset.id] || [];
    $('.rpm-brands', qBrand).innerHTML = list.map(brandTile).join('') + `<button type="button" class="rpm-brand" role="radio" aria-checked="false" data-b="other"><b>Other brand</b></button>`;
    expand(qBrand); qIssue.hidden = true; reveal(qBrand); sync();
    if (list.length === 1) pickBrand($('.rpm-brand', qBrand));
  }
  function pickBrand(b) {
    radio(qBrand, b); st.brand = b.dataset.b === 'other' ? 'Other brand' : brandName(b.dataset.b); st.issue = null;
    collapse(qBrand, b.innerHTML.replace(/<img /, '<img class="rpm-pl" ') + (b.querySelector('img') ? `<b>${st.brand}</b>` : ''));
    $('.rpm-issues', qIssue).innerHTML = issuesFor(st.cat.dataset.id, catName()).map(([t, pr]) =>
      `<button type="button" class="rpm-issue" role="radio" aria-checked="false" data-t="${t}" data-p="${pr}"><b>${t}</b><span>Diagnosis · ₹${pr}</span></button>`).join('');
    reveal(qIssue); sync();
  }
  qCat.addEventListener('click', (e) => { const c = e.target.closest('.rpm-cat'); if (c) pickCat(c); else if (e.target.closest('.rpm-change')) expand(qCat); });
  qBrand.addEventListener('click', (e) => { const b = e.target.closest('.rpm-brand'); if (b) pickBrand(b); else if (e.target.closest('.rpm-change')) { expand(qBrand); } });
  qIssue.addEventListener('click', (e) => { const i = e.target.closest('.rpm-issue'); if (!i) return; radio(qIssue, i); st.issue = { t: i.dataset.t, p: +i.dataset.p }; sync(); });

  /* step 2 · photos, cities, map, date + slot */
  const thumbs = $('.rpm-thumbs', modal); let photos = [];
  const drawThumbs = () => { thumbs.innerHTML = photos.map((f, i) => `<figure><img src="${f.url}" alt=""><button type="button" data-i="${i}" aria-label="Remove photo">✕</button></figure>`).join(''); };
  F('photos').addEventListener('change', (e) => { [...e.target.files].slice(0, 5 - photos.length).forEach((f) => photos.push({ f, url: URL.createObjectURL(f) })); e.target.value = ''; drawThumbs(); });
  thumbs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; URL.revokeObjectURL(photos[b.dataset.i].url); photos.splice(+b.dataset.i, 1); drawThumbs(); });
  F('state').addEventListener('change', () => { $('#rpmCities').innerHTML = (CITIES[F('state').value] || '').split(',').filter(Boolean).map((c) => `<option value="${c}">`).join(''); F('city').value = ''; });
  const map = $('.rpm-map', modal), mapFrame = $('iframe', map);
  const showMap = (q) => { const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`; if (mapFrame.src !== src) mapFrame.src = src; map.hidden = false; };
  let mapT; ['apt', 'street', 'city', 'pin'].forEach((n) => F(n).addEventListener('input', () => { clearTimeout(mapT); mapT = setTimeout(() => { if (/^[1-9]\d{5}$/.test(F('pin').value) && F('city').value.trim()) showMap([F('street').value, F('city').value, F('state').value, F('pin').value].filter(Boolean).join(', ')); }, 700); }));
  const loc = $('#rpmLoc');
  if (!('geolocation' in navigator)) loc.hidden = true;
  loc.addEventListener('click', () => {
    loc.classList.add('busy');
    navigator.geolocation.getCurrentPosition((p) => { loc.classList.remove('busy'); st.geo = [p.coords.latitude, p.coords.longitude]; showMap(st.geo.join(',')); },
      () => { loc.classList.remove('busy'); loc.querySelector('svg').nextSibling.textContent = 'Location blocked, please type the address'; }, { timeout: 10000 });
  });
  const days = $('.rpm-days', modal), slots = $('.rpm-slots', modal);
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const slotOpen = (d, h) => d.toDateString() !== new Date().toDateString() || h > new Date().getHours() + 1;
  function drawDays() {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    days.innerHTML = Array.from({ length: 7 }, (_, i) => { const d = new Date(t); d.setDate(t.getDate() + i);
      const open = SLOTS.some(([h]) => slotOpen(d, h));
      return `<button type="button" role="radio" aria-checked="false" data-d="${d.toISOString()}"${open ? '' : ' disabled'}><small>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DOW[d.getDay()]}</small><b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small></button>`; }).join('');
    st.day = st.slot = null; drawSlots();
  }
  function drawSlots() {
    const d = st.day && new Date(st.day);
    slots.innerHTML = SLOTS.map(([h, l]) => `<button type="button" role="radio" aria-checked="false" data-s="${l}"${d && slotOpen(d, h) ? '' : ' disabled'}><svg width="14" height="14"><use href="#i-clock"/></svg>${l}</button>`).join('');
  }
  days.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; radio(days, b); st.day = b.dataset.d; st.slot = null; drawSlots(); err('when', false); });
  slots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; radio(slots, b); st.slot = b.dataset.s; err('when', false); });

  /* step 3 · Individual/Business, OTP */
  const seg = $('.rpm-seg', modal);
  seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; radio(seg, b); st.kind = b.dataset.v; });
  const timerEl = $('#rpmTimer'), resend = $('#rpmResend');
  const startTimer = () => { let t = 30; resend.disabled = true; clearInterval(timerId);
    const tick = () => { timerEl.textContent = `00:${String(t).padStart(2, '0')}`; if (t-- <= 0) { clearInterval(timerId); resend.disabled = false; timerEl.textContent = ''; } };
    tick(); timerId = setInterval(tick, 1000); };
  resend.addEventListener('click', () => api.sendOtp(F('mobile').value).then(startTimer));
  $('#rpmOtpEdit').addEventListener('click', () => { st.otp = false; F('mobile').readOnly = false; $('#qOtp').hidden = true; clearInterval(timerId); F('otp').value = ''; F('mobile').focus(); sync(); });

  /* validation */
  const bad = (n, on) => { const l = F(n).closest('.rpm-f'); l.classList.toggle('bad', on); return on; };
  const err = (k, on) => { const e = $(`[data-err="${k}"]`, modal); e.classList.toggle('show', on); return on; };
  form.addEventListener('input', (e) => { const l = e.target.closest('.rpm-f.bad'); if (l) l.classList.remove('bad'); if (e.target.name === 'terms') err('terms', false); });
  ['pin', 'mobile', 'altMobile', 'otp'].forEach((n) => F(n).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); }));
  function check(step) {
    const v = (n) => F(n).value.trim(), out = [];
    if (step === 2) {
      if (bad('apt', !v('apt'))) out.push(F('apt'));
      if (bad('street', !v('street'))) out.push(F('street'));
      if (bad('state', !v('state'))) out.push(F('state'));
      if (bad('city', !v('city'))) out.push(F('city'));
      if (bad('pin', !/^[1-9]\d{5}$/.test(v('pin')))) out.push(F('pin'));
      if (err('when', !st.day || !st.slot)) out.push(days);
      if (bad('altMobile', !!v('altMobile') && !/^[6-9]\d{9}$/.test(v('altMobile')))) { F('altMobile').closest('details').open = true; out.push(F('altMobile')); }
    }
    if (step === 3) {
      if (bad('mobile', !/^[6-9]\d{9}$/.test(v('mobile')))) out.push(F('mobile'));
      if (err('terms', !F('terms').checked)) out.push(F('terms'));
      if (st.otp && bad('otp', !/^\d{6}$/.test(v('otp')))) out.push(F('otp'));
    }
    if (out[0]) { out[0].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); if (out[0].focus) out[0].focus({ preventScroll: true }); }
    return !out.length;
  }

  /* summary + navigation */
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function summary() {
    const v = (n) => esc(F(n).value.trim()), d = new Date(st.day);
    $('#rpmSum').innerHTML = `
      <div><span>Device</span><b>${esc(st.cat.textContent.trim())} · ${esc(st.brand)}</b><button type="button" data-go="1">Edit</button></div>
      <div><span>Service</span><b>${esc(st.issue.t)} <em>Diagnosis ₹${st.issue.p}</em></b><button type="button" data-go="1">Edit</button></div>
      <div><span>Visit</span><b>${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}, ${esc(st.slot)}<small>${v('apt')}, ${v('street')}, ${v('city')}, ${v('state')} ${v('pin')}</small></b><button type="button" data-go="2">Edit</button></div>`;
  }
  $('#rpmSum').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go); });
  const LABEL = { 1: 'Continue', 2: 'Continue', 3: 'Book a Service' };
  function sync() {
    next.disabled = st.busy || (st.step === 1 && !(st.cat && st.brand && st.issue));
    $('span', next).textContent = st.busy ? 'Please wait…' : st.step === 3 && st.otp ? 'Verify & Book' : LABEL[st.step];
    back.hidden = st.step === 1;
  }
  function go(n) {
    st.step = n;
    $$('.rpm-step', modal).forEach((s) => { s.hidden = +s.dataset.step !== n; });
    $$('.rpm-steps li', modal).forEach((li, i) => { li.classList.toggle('on', i + 1 === n); li.classList.toggle('done', i + 1 < n); li.toggleAttribute('aria-current', i + 1 === n); if (i + 1 === n) li.setAttribute('aria-current', 'step'); });
    if (n === 2 && !days.children.length) drawDays();
    if (n === 3) summary();
    form.scrollTop = 0; sync();
  }
  back.addEventListener('click', () => go(st.step - 1));
  next.addEventListener('click', async () => {
    if (st.step < 3) { if (check(st.step)) go(st.step + 1); return; }
    if (!check(3)) return;
    st.busy = true; sync();
    try {
      if (!st.otp) {
        await api.sendOtp(F('mobile').value);
        st.otp = true; F('mobile').readOnly = true; $('#rpmOtpTo').textContent = '+91 ' + F('mobile').value + (api.demo ? ' (demo: any 6 digits)' : '');
        $('#qOtp').hidden = false; startTimer(); $('#qOtp').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }); F('otp').focus({ preventScroll: true });
      } else {
        const res = await api.verifyAndBook(F('otp').value, {
          category: st.cat.textContent.trim(), brand: st.brand, service: st.issue.t, diagnosisFee: st.issue.p,
          issue: F('issue').value.trim(), details: F('details').value.trim(), photos: photos.map((p) => p.f),
          address: { apt: F('apt').value.trim(), street: F('street').value.trim(), city: F('city').value.trim(), state: F('state').value, pincode: F('pin').value, geo: st.geo || null },
          visit: { date: st.day.slice(0, 10), slot: st.slot }, alternate: { name: F('altName').value.trim(), mobile: F('altMobile').value },
          mobile: F('mobile').value, customerType: st.kind
        });
        clearInterval(timerId); st.done = true;
        $('#rpmRef').textContent = res && res.ref ? res.ref : '';
        $$('.rpm-step', modal).forEach((s) => { s.hidden = true; });
        $('.rpm-done', modal).hidden = false; modal.classList.add('is-done');
      }
    } catch (e) { if (st.otp) bad('otp', true); }
    st.busy = false; sync();
  });
  function reset() {
    form.reset(); photos.forEach((p) => URL.revokeObjectURL(p.url)); photos = []; drawThumbs();
    Object.assign(st, { cat: null, brand: null, issue: null, day: null, slot: null, kind: 'Individual', otp: false, done: false, geo: null });
    cats.forEach((c) => c.setAttribute('aria-checked', 'false')); expand(qCat); qBrand.hidden = qIssue.hidden = true;
    F('mobile').readOnly = false; $('#qOtp').hidden = true; map.hidden = true; mapFrame.removeAttribute('src'); clearInterval(timerId);
    $$('.rpm-f.bad', modal).forEach((l) => l.classList.remove('bad')); $$('.rpm-qerr.show', modal).forEach((e) => e.classList.remove('show'));
    radio(seg, $('button', seg)); days.innerHTML = ''; $('.rpm-done', modal).hidden = true; modal.classList.remove('is-done'); go(1);
  }
  $('#rpmAgain').addEventListener('click', reset);

  /* open / close */
  const open = () => { lastFocus = document.activeElement; modal.hidden = false; document.body.style.overflow = 'hidden'; ($('[aria-checked="true"]', modal.querySelector('.rpm-step:not([hidden])')) || $('.rpm-step:not([hidden]) button, .rpm-step:not([hidden]) input', modal)).focus({ preventScroll: true }); };
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; if (st.done) reset(); lastFocus && lastFocus.focus(); };
  $$('[data-open-booking]').forEach((b) => b.addEventListener('click', open));
  $$('[data-close]', modal).forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
  go(1);
  // ?device=Laptop%20Repair (from the home page device tiles) pre-selects that category
  const want = new URLSearchParams(location.search).get('device');
  const pre = want && cats.find((c) => c.textContent.trim() === want);
  if (pre) pickCat(pre);
  if (location.hash === '#book-now') open();
})();
