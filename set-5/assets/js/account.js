/* FixPapa · Set 5 · My Account (account.html#profile|wallet|orders|…)
   Sidebar panels switch with the URL hash. Personal Data mirrors the live profile form: read-only until
   "Edit profile", then validated and saved; firm/government accounts get a name field plus the Firm Branches and
   Sub Users menu items; partner code is optional; the photo uploads right away.
   Demo mode keeps the profile in localStorage ('fp-profile'). A backend plugs in through
   window.FPAccountApi = { getProfile(), updateProfile(profile), updateAvatar(dataUrl), logout() } (all Promises). */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#accForm'); if (!form) return;
  const KEY = 'fp-profile';
  const DEMO = { name: 'Rahul Verma', email: 'rahul.verma@example.com', mobile: '9876543210', type: 'individual', firm: '', hasCode: '0', code: '', avatar: '' };
  const store = { get: () => { try { return { ...DEMO, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...DEMO }; } },
    set: (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} } };
  const api = window.FPAccountApi || {
    getProfile: () => Promise.resolve(store.get()),
    updateProfile: (p) => new Promise((r) => setTimeout(() => { store.set({ ...store.get(), ...p }); r(store.get()); }, 450)),
    updateAvatar: (url) => new Promise((r) => setTimeout(() => { store.set({ ...store.get(), avatar: url }); r(store.get()); }, 300)),
    logout: () => Promise.resolve()
  };
  const F = (n) => form.elements[n];
  const TYPE = { individual: 'Individual account', firm: 'Firm / Business account', government: 'Government account' };
  let saved = store.get(), editing = false;

  /* toast */
  const toast = (msg) => { const t = $('#accToast'); t.textContent = msg; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600); };

  /* avatar: photo, or initials on an orange disc */
  const initials = (n) => (n || 'G').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const drawAvatar = (p) => $$('.acc-av').forEach((el) => { el.innerHTML = p.avatar ? `<img src="${p.avatar}" alt="">` : `<span>${initials(p.name)}</span>`; });

  /* segmented controls */
  const seg = (wrap, v) => $$('[role="radio"]', wrap).forEach((b) => b.setAttribute('aria-checked', b.dataset.v === String(v)));
  const segVal = (wrap) => ($('[aria-checked="true"]', wrap) || {}).dataset?.v;
  const syncConditional = () => {
    const t = segVal($('#accType')), code = segVal($('#accHasCode'));
    $('#accFirmF').hidden = t === 'individual';
    $('#accFirmL').textContent = t === 'government' ? 'Government department / office name' : 'Firm / business name';
    $('#accCodeF').hidden = code !== '1';
  };
  ['#accType', '#accHasCode'].forEach((s) => $(s).addEventListener('click', (e) => {
    const b = e.target.closest('[role="radio"]'); if (!b || !editing) return; seg($(s), b.dataset.v); syncConditional();
  }));

  /* fill + lock */
  function fill(p) {
    F('name').value = p.name; F('email').value = p.email; F('mobile').value = p.mobile; F('firm').value = p.firm; F('code').value = p.code;
    seg($('#accType'), p.type); seg($('#accHasCode'), p.hasCode); syncConditional();
    $('#accSideName').textContent = p.name || 'Guest';
    $('#accSideType').textContent = TYPE[p.type] || TYPE.individual;
    $$('[data-biz]').forEach((a) => { a.hidden = p.type === 'individual'; });
    $('#accPhotoL').textContent = p.avatar ? 'Change photo' : 'Add photo';
    $('#accPhotoX').hidden = !p.avatar;
    drawAvatar(p);
    $('#accPartner').textContent = p.partnerName ? `Linked to ${p.partnerName}` : '';
  }
  function lock(on) {
    editing = !on;
    $$('input', form).forEach((i) => { if (i.type !== 'file') i.readOnly = on; });
    $$('.acc-seg [role="radio"]', form).forEach((b) => { b.disabled = on; });
    form.classList.toggle('is-locked', on);
    $('#accActions').hidden = on; $('#accEdit').hidden = !on;
    $$('.acc-f.bad', form).forEach((l) => l.classList.remove('bad'));
  }
  $('#accEdit').addEventListener('click', () => { lock(false); F('name').focus(); });
  $('#accCancel').addEventListener('click', () => { fill(saved); lock(true); });
  ['mobile'].forEach((n) => F(n).addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); }));
  form.addEventListener('input', (e) => { const l = e.target.closest('.acc-f.bad'); if (l) l.classList.remove('bad'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!editing) return;
    const type = segVal($('#accType')), hasCode = segVal($('#accHasCode'));
    const v = { name: F('name').value.trim().replace(/\s+/g, ' '), email: F('email').value.trim(), mobile: F('mobile').value, type, firm: F('firm').value.trim(), hasCode, code: F('code').value.trim().toUpperCase() };
    const checks = [['name', /^[A-Za-z][A-Za-z .'-]{1,59}$/.test(v.name)], ['email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)], ['mobile', /^[6-9]\d{9}$/.test(v.mobile)],
      ['firm', type === 'individual' || v.firm.length > 1], ['code', hasCode !== '1' || v.code.length > 2]];
    const bad = checks.filter(([n, ok]) => { F(n).closest('.acc-f').classList.toggle('bad', !ok); return !ok; });
    if (bad.length) { F(bad[0][0]).focus(); return; }
    if (type === 'individual') v.firm = ''; if (hasCode !== '1') v.code = '';
    const btn = $('button[type="submit"]', form); btn.disabled = true; btn.textContent = 'Saving…';
    try { saved = await api.updateProfile(v); fill(saved); lock(true); toast('Profile updated'); }
    catch (err) { toast('Something went wrong, please try again'); }
    finally { btn.disabled = false; btn.textContent = 'Update profile'; }
  });

  /* photo: shrink to 320px on the device, then upload */
  $('#accPhoto').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file || !/^image\//.test(file.type)) return;
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = async () => {
      const s = Math.min(1, 320 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      try { saved = await api.updateAvatar(c.toDataURL('image/jpeg', .86)); fill(saved); toast('Profile photo updated'); } catch (err) { toast('Could not update the photo'); }
    };
    img.src = url;
  });
  $('#accPhotoX').addEventListener('click', async () => { saved = await api.updateAvatar(''); fill(saved); toast('Profile photo removed'); });

  /* panels via hash */
  const panels = $$('.acc-panel'), links = $$('#accMenu a[data-panel]');
  function show() {
    let id = location.hash.slice(1) || 'profile';
    let link = links.find((a) => a.dataset.panel === id);
    if (!link || link.hidden) { id = 'profile'; link = links[0]; }
    panels.forEach((p) => { p.hidden = p.id !== 'p-' + id; });
    links.forEach((a) => { a.classList.toggle('on', a === link); a.toggleAttribute('aria-current', a === link); if (a === link) a.setAttribute('aria-current', 'page'); });
    const title = $('#p-' + id).dataset.title; $('#accCrumb').textContent = title; document.title = `${title} | My Account | FixPapa`;
    if (id !== 'profile' && editing) { fill(saved); lock(true); }
    // phones: keep the active pill visible in the scrolling menu
    const menu = $('#accMenu'); if (menu.scrollWidth > menu.clientWidth) menu.scrollLeft = link.offsetLeft - (menu.clientWidth - link.offsetWidth) / 2;
  }
  addEventListener('hashchange', show);
  links.forEach((a) => a.addEventListener('click', () => { if (innerWidth > 900) requestAnimationFrame(() => scrollTo({ top: 0, behavior: 'smooth' })); }));

  /* logout */
  const dlg = $('#accDlg'); let from;
  const dlgOpen = (o) => { dlg.hidden = !o; document.body.style.overflow = o ? 'hidden' : ''; if (o) { from = document.activeElement; $('#accDlgYes').focus(); } else from && from.focus(); };
  $('#accLogout').addEventListener('click', () => dlgOpen(true));
  $$('[data-no]', dlg).forEach((b) => b.addEventListener('click', () => dlgOpen(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) dlgOpen(false); });
  $('#accDlgYes').addEventListener('click', async () => { await api.logout(); location.href = 'index.html'; });

  api.getProfile().then((p) => { saved = p; fill(p); lock(true); show(); });
})();
