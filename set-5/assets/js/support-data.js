/* FixPapa · Set 5 · Technical support data layer (technical-support.html + technical-support-chat.html).
   window.FPSupport wraps every call the live site makes (customer-web services/technicalSupport.js + the wallet):
     engineers({ page, limit, search, experience, rating, location }) → { items, paginator, filters }
     wallet() → { amount }            addMoney(amount) → { amount }   (demo only; live tops up in account → wallet)
     initiateChat(engineer) → chatID  chat(chatID) → chat            history(chatID) → [message]
     send(chatID, { message, image }) updateStatus(chatID, { status, callCharge, chatDuration })
     review(chatID, { ratings, customerComments })
   Field names match the API (full_name, unique_code, chat_charges, is_available_for_chat, current_chat, engineer_skills …).
   It runs on a demo mock (sample engineers, wallet and chats in localStorage) unless window.FPSupportApi defines the
   same methods before this file loads. MIN_MINUTES: like the live site, a chat needs the rate × 5 in the wallet. */
(function () {
  'use strict';
  const MIN_MINUTES = 5;

  // device → problems offered before the chat starts (same lists as the live chat page)
  const CATEGORIES = [
    { name: 'Laptop', icon: 'i-laptop', problems: ['Won’t turn on', 'Slow performance', 'OS/Software error', 'No display / boot issues', 'Wi-Fi or Network problem', 'Battery not charging or draining fast', 'Overheating', 'Keyboard or touchpad not working', 'Screen cracked or flickering', 'Motherboard or hardware issue', 'Others'] },
    { name: 'Desktop', icon: 'i-desktop', problems: ['Won’t turn on', 'Slow performance', 'OS/Software error', 'No display / boot issues', 'Wi-Fi or Network problem', 'Mouse/keyboard not working', 'Power supply issues', 'Overheating', 'Motherboard or hardware issue', 'Others'] },
    { name: 'Server', icon: 'i-server', problems: ['Won’t turn on', 'Slow performance', 'OS/Software error', 'Boot failure', 'Network or connectivity issues', 'Disk/RAID failure', 'Power supply problems', 'Overheating', 'Motherboard or hardware issue', 'Others'] },
    { name: 'Printer (Inkjet / Laser)', short: 'Printer', icon: 'i-printer', problems: ['Not printing / paper jam', 'Driver/software error', 'Ink/toner issue', 'Power or connection issue', 'Print alignment or quality issue', 'Scanner not working', 'Fuser or roller problems', 'Others'] },
    { name: 'CCTV', icon: 'i-cctv', problems: ['No video / blurred feed', 'DVR/NVR not recording', 'Night vision issue', 'Network/remote access problem', 'Power supply or adapter issues', 'Storage/Disk full or failed', 'Camera alignment or angle issue', 'Others'] },
  ];

  // homepage "Common fixes" (?issue=…) → the device + problem the chat preselects
  const ISSUES = {
    printer: { label: 'Printer not printing', category: 'Printer (Inkjet / Laser)', problem: 'Not printing / paper jam', skill: 'Printer' },
    wifi: { label: 'Wi-Fi keeps dropping', category: 'Laptop', problem: 'Wi-Fi or Network problem', skill: 'Networking' },
    virus: { label: 'Slow PC or virus', category: 'Desktop', problem: 'Slow performance', skill: 'Virus removal' },
    software: { label: 'Software & email setup', category: 'Laptop', problem: 'OS/Software error', skill: 'Email & Office' },
  };

  const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
  const store = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } },
    set(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { } },
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const signedIn = () => { try { return window.FPAuth?.user?.() || null; } catch (e) { return null; } };

  /* ---------------- demo mock ---------------- */
  const S = (...names) => names.map((skill_name, i) => ({ id: i + 1, skill_name }));
  const ENGINEERS = [
    { id: 101, full_name: 'Rohit Sharma', unique_code: 'FPE-1042', about: 'Windows and Office specialist. Fixes slow PCs, boot errors and email setup over a remote session.', city_name: 'Jaipur', state_name: 'Rajasthan', total_experience: 8, total_calls: 1240, average_ratings: 4.9, chat_charges: 5, is_available_for_chat: 1, engineer_skills: S('Windows', 'Email & Office', 'Virus removal', 'Laptop') },
    { id: 102, full_name: 'Priya Verma', unique_code: 'FPE-1108', about: 'Printer and scanner engineer for HP, Canon, Epson and Brother. Drivers, spooler and network printing.', city_name: 'Jaipur', state_name: 'Rajasthan', total_experience: 6, total_calls: 860, average_ratings: 4.8, chat_charges: 5, is_available_for_chat: 1, engineer_skills: S('Printer', 'Scanner', 'Drivers', 'Networking') },
    { id: 103, full_name: 'Aman Gupta', unique_code: 'FPE-1131', about: 'Network engineer. Wi-Fi drops, router setup, LAN sharing and remote access for small offices.', city_name: 'Delhi', state_name: 'Delhi', total_experience: 10, total_calls: 1530, average_ratings: 4.7, chat_charges: 8, is_available_for_chat: 1, busy: true, engineer_skills: S('Networking', 'Router', 'CCTV', 'Server') },
    { id: 104, full_name: 'Neha Joshi', unique_code: 'FPE-1176', about: 'MacBook and Windows laptop support: updates, data backup, battery and performance checks.', city_name: 'Pune', state_name: 'Maharashtra', total_experience: 5, total_calls: 640, average_ratings: 4.8, chat_charges: 6, is_available_for_chat: 1, engineer_skills: S('macOS', 'Laptop', 'Data backup', 'Windows') },
    { id: 105, full_name: 'Vikas Meena', unique_code: 'FPE-1203', about: 'Server and RAID administrator. Windows Server, Linux, backups and disk recovery guidance.', city_name: 'Jaipur', state_name: 'Rajasthan', total_experience: 12, total_calls: 980, average_ratings: 4.9, chat_charges: 12, is_available_for_chat: 1, engineer_skills: S('Server', 'Linux', 'RAID', 'Data backup') },
    { id: 106, full_name: 'Sana Khan', unique_code: 'FPE-1229', about: 'CCTV, DVR/NVR and mobile-view setup. Recording, storage and remote viewing problems.', city_name: 'Lucknow', state_name: 'Uttar Pradesh', total_experience: 4, total_calls: 410, average_ratings: 4.6, chat_charges: 5, is_available_for_chat: 0, engineer_skills: S('CCTV', 'DVR/NVR', 'Networking') },
    { id: 107, full_name: 'Karan Mehta', unique_code: 'FPE-1254', about: 'Desktop hardware and OS installs. Blue screens, drivers, no-display and slow start-up.', city_name: 'Ahmedabad', state_name: 'Gujarat', total_experience: 7, total_calls: 920, average_ratings: 4.5, chat_charges: 5, is_available_for_chat: 1, engineer_skills: S('Desktop', 'Windows', 'Drivers', 'Virus removal') },
    { id: 108, full_name: 'Deepak Yadav', unique_code: 'FPE-1287', about: 'Tally, GST software and accounting PCs for shops and offices, including printer setup.', city_name: 'Jaipur', state_name: 'Rajasthan', total_experience: 3, total_calls: 260, average_ratings: 4.4, chat_charges: 5, is_available_for_chat: 0, engineer_skills: S('Tally', 'Email & Office', 'Printer') },
  ];

  const mock = {
    async engineers({ page = 1, limit = 6, search = '', experience = '', rating = '', location = '' } = {}) {
      await wait(450);
      const me = signedIn();
      const chats = store.get('fp-ts-chats', {});
      const live = Object.values(chats).filter(c => c.status === 'pending' || c.status === 'active');
      let items = ENGINEERS.map(e => {
        const mine = live.find(c => c.engineer_id === e.id);
        const current_chat = mine ? { id: mine.id, customer_id: me ? me.mobile || 1 : 0, status: mine.status }
          : e.busy ? { id: 0, customer_id: -1, status: 'active' } : null;
        const { busy, ...rest } = e;
        return { ...rest, current_chat };
      });
      const q = search.trim().toLowerCase();
      if (q) items = items.filter(e => [e.full_name, e.about, e.city_name, ...e.engineer_skills.map(s => s.skill_name)].join(' ').toLowerCase().includes(q));
      if (experience) items = items.filter(e => e.total_experience >= +experience);
      if (rating) items = items.filter(e => e.average_ratings >= +rating);
      if (location) { const set = location.split(','); items = items.filter(e => set.includes(e.city_name)); }
      items.sort((a, b) => (b.is_available_for_chat - a.is_available_for_chat) || (b.average_ratings - a.average_ratings));
      const total = items.length, pages = Math.max(1, Math.ceil(total / limit));
      const p = Math.min(Math.max(1, +page || 1), pages);
      const cities = [...new Set(ENGINEERS.map(e => e.city_name))].sort();
      return {
        items: items.slice((p - 1) * limit, p * limit),
        paginator: { currentPage: p, pageCount: pages, itemCount: total, perPage: limit, hasNextPage: p < pages, hasPrevPage: p > 1 },
        filters: { location: cities.map(name => ({ name, count: ENGINEERS.filter(e => e.city_name === name).length })) },
        online: ENGINEERS.filter(e => e.is_available_for_chat).length,
      };
    },
    async wallet() { return { amount: store.get('fp-wallet', { amount: 100 }).amount }; },
    async addMoney(amount) { await wait(600); const w = { amount: (await mock.wallet()).amount + amount }; store.set('fp-wallet', w); return w; },
    async initiateChat(engineer) {
      await wait(500);
      const chats = store.get('fp-ts-chats', {});
      const id = Date.now();
      chats[id] = { id, engineer_id: engineer.id, engineer_name: engineer.full_name, engineer_code: engineer.unique_code, chat_charges: engineer.chat_charges, status: 'pending', created_at: new Date().toISOString(), chat_start_time: null, chat_end_time: null, call_charge: 0, chat_duration: 0, ratings: 0, customer_comments: '', messages: [] };
      store.set('fp-ts-chats', chats);
      return id;
    },
    async chat(id) { const c = store.get('fp-ts-chats', {})[id]; if (!c) throw new Error('Not a valid chat'); const { messages, ...rest } = c; return rest; },
    async history(id) { return (store.get('fp-ts-chats', {})[id]?.messages) || []; },
    _save(id, fn) { const chats = store.get('fp-ts-chats', {}); if (chats[id]) { fn(chats[id]); store.set('fp-ts-chats', chats); } return chats[id]; },
    _push(id, msg) { return mock._save(id, c => c.messages.push({ id: Date.now() + Math.random(), created_at: new Date().toISOString(), ...msg })); },
    async send(id, { message = '', image = '' }) {
      await wait(250);
      const c = mock._push(id, { from: 'customer', message, image });
      mock._reply(id, c);
    },
    // the demo engineer accepts once the device + problem arrive, then answers each message
    _reply(id, c) {
      const first = c.status === 'pending';
      const name = c.engineer_name.split(' ')[0];
      setTimeout(() => {
        const now = mock._save(id, x => { if (x.status === 'pending') { x.status = 'active'; x.chat_start_time = new Date().toISOString(); } });
        if (!now || (now.status !== 'active')) return;
        if (first) {
          mock._push(id, { from: 'system', message: `${c.engineer_name} joined the chat. Billing has started at ${inr(c.chat_charges)}/min.` });
          setTimeout(() => mock._push(id, { from: 'engineer', message: `Hi, I’m ${name}. I’ve read your issue. Can you tell me when it started, and share a photo of any error on screen?` }), 1500);
        } else {
          const lines = ['Thanks, that helps. Please restart the device once and tell me what you see.', 'Got it. I’ll guide you step by step. Open Settings and tell me which version is shown.', 'Okay. That looks like a driver issue. Let’s reinstall it, I’ll send the steps.', 'Perfect, that should fix it. Please test it now and let me know.'];
          mock._push(id, { from: 'engineer', message: lines[(now.messages.filter(m => m.from === 'engineer').length - 1 + lines.length) % lines.length] });
        }
      }, first ? 2200 : 2600);
    },
    async updateStatus(id, { status, callCharge = 0, chatDuration = 0 }) {
      await wait(400);
      mock._save(id, c => { c.status = status; c.chat_end_time = new Date().toISOString(); c.call_charge = callCharge; c.chat_duration = chatDuration; });
      if (callCharge) store.set('fp-wallet', { amount: Math.max(0, (await mock.wallet()).amount - callCharge) });
      mock._push(id, { from: 'system', message: status === 'completed' ? `Chat ended · ${chatDuration} min · ${inr(callCharge)} charged from your wallet.` : 'Chat cancelled. Nothing was charged.' });
    },
    async review(id, { ratings, customerComments }) { await wait(400); mock._save(id, c => { c.ratings = ratings; c.customer_comments = customerComments; }); },
  };

  const api = Object.assign({}, mock, window.FPSupportApi || {});
  window.FPSupport = Object.assign(api, { MIN_MINUTES, CATEGORIES, ISSUES, inr, signedIn, isDemo: !window.FPSupportApi });
})();
