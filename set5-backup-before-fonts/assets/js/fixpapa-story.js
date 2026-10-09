/* =========================================================
   FixPapa — "In Action" artwork + animated ad story
   • injects the shared character sprite (FixPapa technician in uniform, customer)
   • draws the "Our experts at work" illustrations   [data-fp-art]
   • builds the 30s story (device breaks → booked on fixpapa.com → expert picks up
     → repaired at the lab → delivered back) into #fpStory, played by a GSAP timeline.
   The same file powers the MP4 export: window.FPStory.build(el) returns the paused timeline.
   ========================================================= */
(() => {
  const SKIN = '#C68A5B', SKIN_D = '#A86F45', HAIR = '#1F1410';
  const OR = '#F97316', OR_D = '#EA580C', NAVY = '#0B1220';

  /* ---------- character sprite (flat fills only, so it renders from a hidden sprite) ---------- */
  const person = ({ id, shirt, shirtD, pants, pantsD, cap, logo }) => `
    <symbol id="${id}" viewBox="0 0 80 200" overflow="visible">
      <ellipse cx="40" cy="195" rx="27" ry="5" fill="#0B1220" opacity=".14"/>
      <path d="M25 116h14l-1 72H26z" fill="${pants}"/><path d="M41 116h14l-1 72H42z" fill="${pantsD}"/>
      <path d="M24 186h15v7H20q0-7 4-7z" fill="#0B1220"/><path d="M41 186h15q4 0 4 7H41z" fill="#0B1220"/>
      <path d="M21 60 10 67 8 88l12 2z" fill="${shirtD}"/><rect x="8" y="85" width="10" height="33" rx="5" fill="${SKIN}"/><circle cx="13" cy="119" r="5.5" fill="${SKIN}"/>
      <path d="M59 60l11 7 2 21-12 2z" fill="${shirtD}"/><rect x="62" y="85" width="10" height="33" rx="5" fill="${SKIN}"/><circle cx="67" cy="119" r="5.5" fill="${SKIN}"/>
      <path d="M22 58q18-6 36 0l4 6-2 56H20l-2-56z" fill="${shirt}"/>
      <path d="M58 58l4 6-2 56h-9z" fill="${shirtD}" opacity=".55"/>
      <rect x="35" y="45" width="10" height="13" rx="3" fill="${SKIN_D}"/>
      <path d="M31 57l9 11 9-11" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
      ${logo ? `<rect x="23" y="72" width="8" height="11" rx="1.5" fill="#fff"/><rect x="24.5" y="74" width="5" height="2" fill="${OR}"/>
      <text x="41" y="98" text-anchor="middle" font-family="Manrope,Inter,sans-serif" font-weight="800" font-size="9.5" fill="#fff">FixPapa</text>` : ''}
      <rect x="20" y="113" width="40" height="6" rx="2" fill="#0B1220"/><rect x="37" y="113" width="6" height="6" rx="1" fill="#94A3B8"/>
      <circle cx="28" cy="37" r="3.2" fill="${SKIN_D}"/><circle cx="52" cy="37" r="3.2" fill="${SKIN_D}"/>
      <ellipse cx="40" cy="36" rx="12" ry="14" fill="${SKIN}"/>
      ${cap
        ? `<path d="M28 31q0-10 12-10t12 10z" fill="${HAIR}"/><path d="M27 29q0-16 13-16t13 16z" fill="${OR}"/><ellipse cx="40" cy="29" rx="17" ry="3.6" fill="${OR_D}"/><circle cx="40" cy="20" r="3.2" fill="#fff"/><circle cx="40" cy="13.5" r="1.6" fill="${OR_D}"/>`
        : `<path d="M27 34q-1-17 13-17t13 17q-4-8-13-8t-13 8z" fill="${HAIR}"/>`}
      <circle cx="35.5" cy="37" r="1.5" fill="#1F1410"/><circle cx="44.5" cy="37" r="1.5" fill="#1F1410"/>
      <path d="M36 43q4 3.2 8 0" fill="none" stroke="#5B3A24" stroke-width="1.6" stroke-linecap="round"/>
    </symbol>`;
  const SPRITE = `<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
    ${person({ id: 'fpTech', shirt: OR, shirtD: OR_D, pants: '#1E293B', pantsD: '#0F172A', cap: true, logo: true })}
    ${person({ id: 'fpCust', shirt: '#14B8A6', shirtD: '#0F9488', pants: '#334155', pantsD: '#1E293B', cap: false, logo: false })}
  </svg>`;
  if (!document.getElementById('fpTech')) document.body.insertAdjacentHTML('afterbegin', SPRITE);

  /* ---------- drawing helpers (all return SVG strings) ---------- */
  const at = (x, y, s, inner, cls = '') => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}">${inner}</g></g>`;
  const who = (id, x, y, s = 1.3, cls = '') => at(x, y, s, `<use href="#${id}" width="80" height="200"/>`, cls);
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || 'Inter,sans-serif'}" font-size="${o.s || 14}" font-weight="${o.w || 600}" fill="${o.c || NAVY}" text-anchor="${o.a || 'start'}"${o.cls ? ` class="${o.cls}"` : ''}>${t}</text>`;
  const H = (x, y, t, s = 16, c = NAVY, a = 'start', cls) => txt(x, y, t, { f: 'Manrope,Inter,sans-serif', s, w: 800, c, a, cls });
  const card = (x, y, w, h, inner, cls = '', fill = '#fff') => `<g transform="translate(${x} ${y})"><g class="${cls}"><rect width="${w}" height="${h}" rx="16" fill="${fill}" stroke="#FED7AA" filter="url(#fpShadow)"/>${inner}</g></g>`;
  const tick = (x, y, r = 9, cls = '') => `<g class="${cls}" transform="translate(${x} ${y})"><circle r="${r}" fill="#22C55E"/><path d="M${-r * .45} 0l${r * .3} ${r * .32} ${r * .55} ${-r * .6}" fill="none" stroke="#fff" stroke-width="${r * .26}" stroke-linecap="round" stroke-linejoin="round"/></g>`;

  // open laptop, origin = bottom centre of the base. screens: normal / broken / ok
  const laptop = (k = '') => `
    <path d="M-96 -10h192l16 14h-224z" fill="#CBD5E1"/><rect x="-112" y="4" width="224" height="6" rx="3" fill="#94A3B8"/>
    <rect x="-86" y="-132" width="172" height="124" rx="10" fill="#1E293B"/>
    <g class="${k}scr-norm"><rect x="-78" y="-124" width="156" height="106" rx="4" fill="#E0F2FE"/><rect x="-78" y="-124" width="156" height="14" fill="#BAE6FD"/>
      <rect x="-66" y="-100" width="40" height="30" rx="4" fill="#fff"/><rect x="-20" y="-100" width="40" height="30" rx="4" fill="#fff"/><rect x="26" y="-100" width="40" height="30" rx="4" fill="#fff"/><rect x="-66" y="-62" width="132" height="8" rx="4" fill="#fff"/></g>
    <g class="${k}scr-broken" opacity="0"><rect x="-78" y="-124" width="156" height="106" rx="4" fill="#0B1220"/>
      <path class="${k}crack" d="M-40 -124l14 26-18 14 22 18-10 26M-26 -98l30-6 10 22 26-4M-22 -66l-26 10" fill="none" stroke="#E2E8F0" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="40" cy="-70" r="16" fill="#EF4444"/><rect x="38" y="-81" width="4" height="13" rx="2" fill="#fff"/><circle cx="40" cy="-61" r="2.4" fill="#fff"/></g>
    <g class="${k}scr-ok" opacity="0"><rect x="-78" y="-124" width="156" height="106" rx="4" fill="${OR}"/><circle cx="0" cy="-80" r="22" fill="#fff"/>
      <path d="M-10 -80l7 7 13-14" fill="none" stroke="#22C55E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${txt(0, -40, 'Working perfectly', { s: 12, w: 700, c: '#fff', a: 'middle' })}</g>
    <circle cx="0" cy="-128" r="2" fill="#475569"/>`;
  const closedLaptop = `<rect x="-38" y="-6" width="76" height="11" rx="3" fill="#94A3B8"/><rect x="-38" y="-6" width="76" height="4" rx="2" fill="#CBD5E1"/>`;

  // small device icons, centred at 0,0 (~44px)
  const ICON = {
    laptop: `<rect x="-17" y="-14" width="34" height="22" rx="3" fill="#1E293B"/><rect x="-14" y="-11" width="28" height="16" rx="1.5" fill="#BAE6FD"/><path d="M-22 9h44l-3 5h-38z" fill="#94A3B8"/>`,
    desktop: `<rect x="-19" y="-16" width="38" height="25" rx="3" fill="#1E293B"/><rect x="-16" y="-13" width="32" height="19" rx="1.5" fill="#BAE6FD"/><rect x="-3" y="9" width="6" height="6" fill="#64748B"/><rect x="-10" y="14" width="20" height="3" rx="1.5" fill="#64748B"/>`,
    printer: `<rect x="-11" y="-17" width="22" height="10" fill="#fff" stroke="#CBD5E1"/><rect x="-19" y="-8" width="38" height="18" rx="4" fill="#64748B"/><rect x="-12" y="5" width="24" height="10" fill="#fff" stroke="#CBD5E1"/><circle cx="13" cy="-2" r="2" fill="#22C55E"/>`,
    cctv: `<rect x="-14" y="-8" width="30" height="13" rx="6" fill="#E2E8F0" stroke="#94A3B8"/><circle cx="12" cy="-1.5" r="5" fill="#0B1220"/><circle cx="12" cy="-1.5" r="2" fill="#3B82F6"/><rect x="-11" y="5" width="4" height="9" fill="#64748B"/><rect x="-17" y="13" width="16" height="4" rx="2" fill="#64748B"/>`,
    ups: `<rect x="-12" y="-17" width="24" height="34" rx="4" fill="#1E293B"/><rect x="-7" y="-11" width="14" height="7" rx="1.5" fill="#22C55E"/><circle cx="0" cy="8" r="3.5" fill="none" stroke="#F97316" stroke-width="2"/>`,
    projector: `<rect x="-19" y="-9" width="38" height="20" rx="6" fill="#E2E8F0" stroke="#94A3B8"/><circle cx="-6" cy="1" r="7" fill="#0B1220"/><circle cx="-6" cy="1" r="3" fill="#60A5FA"/><rect x="6" y="-3" width="9" height="3" rx="1.5" fill="#94A3B8"/>`
  };

  // FixPapa scooter, origin = ground under the middle, facing left; optional rider
  const scooter = (rider = true, k = '') => `
    <ellipse cx="0" cy="22" rx="92" ry="7" fill="#0B1220" opacity=".12"/>
    <rect x="30" y="-108" width="66" height="56" rx="8" fill="${OR}"/><rect x="30" y="-108" width="66" height="12" rx="6" fill="${OR_D}"/>
    ${txt(63, -70, 'FixPapa', { f: 'Manrope,sans-serif', s: 13, w: 800, c: '#fff', a: 'middle' })}
    <path d="M-70 -14q4-40 34-46l10 30h80q22 0 26 30h-150z" fill="${OR}"/><path d="M-6 -48h70q8 0 8 8v6h-78z" fill="#1E293B"/>
    <path d="M-60 -60l-6-34" stroke="#334155" stroke-width="7" stroke-linecap="round"/><path d="M-76 -96h22" stroke="#0B1220" stroke-width="7" stroke-linecap="round"/>
    <circle cx="-72" cy="-62" r="6" fill="#FDE68A"/>
    ${rider ? `<g class="${k}rider">
      <path d="M8 -50l-14 30h20l14-30z" fill="#1E293B"/><path d="M-4 -20h-22v8h26z" fill="#0B1220"/>
      <path d="M-2 -104q24-4 30 14l-6 42h-36z" fill="${OR}"/>${txt(10, -72, 'FP', { f: 'Manrope,sans-serif', s: 11, w: 800, c: '#fff', a: 'middle' })}
      <path d="M-2 -96l-50 2" stroke="${OR_D}" stroke-width="10" stroke-linecap="round"/><circle cx="-56" cy="-94" r="6" fill="${SKIN}"/>
      <rect x="4" y="-118" width="10" height="14" rx="3" fill="${SKIN_D}"/>
      <ellipse cx="8" cy="-128" rx="14" ry="15" fill="${SKIN}"/>
      <path d="M-8 -130q0-22 18-22t18 22z" fill="${OR}"/><path d="M-10 -131h22v8h-22z" fill="#0B1220" opacity=".75"/><circle cx="10" cy="-146" r="3" fill="#fff"/></g>` : ''}
    <g class="${k}wheel" transform="translate(-58 6)"><circle r="20" fill="#0B1220"/><circle r="9" fill="#94A3B8"/><path d="M-9 0h18M0 -9v18" stroke="#475569" stroke-width="3"/></g>
    <g class="${k}wheel" transform="translate(60 6)"><circle r="20" fill="#0B1220"/><circle r="9" fill="#94A3B8"/><path d="M-9 0h18M0 -9v18" stroke="#475569" stroke-width="3"/></g>`;

  const fpBox = (k = '') => `<rect x="-40" y="-52" width="80" height="52" rx="6" fill="${OR}"/><rect x="-40" y="-52" width="80" height="10" fill="${OR_D}"/>
    ${txt(0, -18, 'FixPapa', { f: 'Manrope,sans-serif', s: 13, w: 800, c: '#fff', a: 'middle' })}
    <g class="${k}lid"><rect x="-44" y="-60" width="88" height="10" rx="3" fill="${OR_D}"/></g>`;

  /* ---------- "Our experts at work" illustrations (viewBox 0 0 400 300) ---------- */
  const FLOOR = `<rect width="400" height="300" fill="#FFF7ED"/><circle cx="300" cy="80" r="120" fill="#FFEDD5"/><rect y="236" width="400" height="64" fill="#FED7AA"/><rect y="236" width="400" height="4" fill="#FDBA74"/>`;
  const ART = {
    laptop: `${FLOOR}
      <g transform="translate(150 60)"><use href="#fpTech" width="80" height="200"/></g>
      <g transform="translate(217 178) rotate(-50)"><rect x="-3" y="-30" width="6" height="24" rx="2" fill="#94A3B8"/><rect x="-6" y="-8" width="12" height="20" rx="4" fill="${OR_D}"/></g>
      <rect x="30" y="196" width="340" height="14" rx="4" fill="#9A3412"/><rect x="48" y="210" width="12" height="34" fill="#7C2D12"/><rect x="340" y="210" width="12" height="34" fill="#7C2D12"/>
      <g transform="translate(290 196) scale(.6)"><path d="M-96 -10h192l16 14h-224z" fill="#CBD5E1"/><rect x="-86" y="-132" width="172" height="124" rx="10" fill="#1E293B"/>
        <rect x="-78" y="-124" width="156" height="106" rx="4" fill="#065F46"/><path d="M-60 -100h40v24h-40zM-6 -100h56v14h-56zM-6 -76h26v26h-26zM34 -76h20v40h-20zM-60 -60h40v26h-40z" fill="#0F766E" stroke="#34D399" stroke-width="1.5"/>
        <rect x="-4" y="-74" width="22" height="22" rx="2" fill="#0B1220"/></g>
      <g transform="translate(70 196)"><rect x="-26" y="-34" width="52" height="34" rx="5" fill="${OR}"/><rect x="-26" y="-34" width="52" height="8" rx="4" fill="${OR_D}"/><rect x="-8" y="-40" width="16" height="7" rx="3" fill="none" stroke="#0B1220" stroke-width="3"/></g>
      <g fill="#FBBF24"><path d="M248 120l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M330 100l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>`,
    printer: `${FLOOR}
      <g transform="translate(70 92)"><use href="#fpTech" width="80" height="200"/></g>
      <rect x="62" y="196" width="34" height="18" rx="3" fill="#0B1220"/><rect x="62" y="202" width="34" height="5" fill="${OR}"/>
      <g transform="translate(260 234)"><ellipse cx="0" cy="2" rx="96" ry="9" fill="#0B1220" opacity=".1"/>
        <path d="M-40 -150h80l8 44h-96z" fill="#fff" stroke="#E2E8F0"/><rect x="-82" y="-110" width="164" height="110" rx="14" fill="#E2E8F0"/>
        <rect x="-82" y="-110" width="164" height="26" rx="12" fill="#F8FAFC"/><rect x="30" y="-100" width="22" height="6" rx="3" fill="#94A3B8"/><circle cx="64" cy="-97" r="5" fill="#22C55E"/>
        <rect x="-58" y="-56" width="116" height="9" rx="4.5" fill="#334155"/><path d="M-42 -50h84v40h-84z" fill="#fff" stroke="#E2E8F0"/>
        <rect x="-30" y="-40" width="40" height="5" rx="2.5" fill="${OR}"/><rect x="-30" y="-30" width="58" height="4" rx="2" fill="#CBD5E1"/></g>`,
    cctv: `<rect width="400" height="300" fill="#FFF7ED"/><rect x="0" y="0" width="400" height="236" fill="#FFEDD5"/><path d="M0 60h400M0 120h400M0 180h400" stroke="#FED7AA" stroke-width="2"/>
      <rect y="236" width="400" height="64" fill="#FED7AA"/>
      <g transform="translate(236 104)"><rect x="-6" y="0" width="30" height="10" rx="2" fill="#64748B"/>
        <g transform="rotate(14)"><rect x="-58" y="8" width="70" height="30" rx="14" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2"/><circle cx="-54" cy="23" r="12" fill="#0B1220"/><circle cx="-54" cy="23" r="5" fill="#3B82F6"/><circle cx="-6" cy="16" r="3" fill="#EF4444"/></g></g>
      <path d="M70 290l40-230M150 290l-4-230" stroke="#94A3B8" stroke-width="7" stroke-linecap="round"/>
      <path d="M80 252H146 M87 212H146 M94 172H145 M100 132H144 M107 92H144" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(88 22)"><use href="#fpTech" width="80" height="200"/></g>
      <path d="M152 128l26 -6" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>
      <g transform="translate(316 190)"><rect x="-40" y="-26" width="80" height="52" rx="10" fill="#fff" stroke="#FED7AA"/>${txt(0, -4, 'CAM 04', { f: 'JetBrains Mono,monospace', s: 12, w: 700, a: 'middle' })}${txt(0, 14, '● LIVE', { s: 11, w: 700, c: '#16A34A', a: 'middle' })}</g>`,
    pickup: `${FLOOR}
      <g transform="translate(150 236)">${scooter(false)}</g>
      <g transform="translate(262 40)"><use href="#fpTech" width="80" height="200"/></g>
      <g transform="translate(302 159)">${closedLaptop}</g>
      <g transform="translate(40 26)"><rect width="150" height="44" rx="22" fill="#fff" stroke="#FED7AA"/><circle cx="22" cy="22" r="10" fill="#22C55E"/><path d="M17 22l4 4 7-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>${txt(40, 27, 'Free pickup & drop', { s: 12, w: 700 })}</g>`
  };
  document.querySelectorAll('[data-fp-art]').forEach(el => {
    const k = el.dataset.fpArt; if (!ART[k]) return;
    el.innerHTML = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${ART[k]}</svg>`;
  });

  /* ---------- the story (viewBox 0 0 960 540) ---------- */
  const STEPS = [
    { t: 0, label: 'Device breaks', cap: 'Laptop dead? Printer jammed? CCTV offline? Any device, any problem.' },
    { t: 4.5, label: 'Book online', cap: 'Book a repair on fixpapa.com in under a minute' },
    { t: 9.5, label: 'Expert arrives', cap: 'A verified FixPapa expert reaches your doorstep' },
    { t: 14, label: 'Safe pickup', cap: 'Sealed, OTP-verified pickup, tracked live' },
    { t: 18.5, label: 'Repair at lab', cap: 'Repaired by certified FixPapa experts with genuine parts' },
    { t: 23.5, label: 'Delivered back', cap: 'Delivered back to you, working like new' }
  ];
  const DURATION = 30;
  const caption = (i) => `<g transform="translate(40 474)"><g class="st-cap"><rect width="880" height="46" rx="23" fill="#0B1220" opacity=".92"/>
      <rect x="8" y="8" width="46" height="30" rx="15" fill="${OR}"/>${txt(31, 28, '0' + (i + 1), { f: 'JetBrains Mono,monospace', s: 14, w: 700, c: '#fff', a: 'middle' })}
      ${txt(70, 29, STEPS[i].cap, { s: 18, w: 600, c: '#fff' })}</g></g>`;
  const room = `<rect width="960" height="540" fill="#FFF7ED"/><circle cx="760" cy="150" r="230" fill="#FFEDD5"/><rect y="400" width="960" height="140" fill="#FED7AA"/><rect y="400" width="960" height="5" fill="#FDBA74"/>`;
  const street = `<rect width="960" height="540" fill="#FFF7ED"/>
      <g fill="#FFEDD5"><rect x="420" y="190" width="90" height="210"/><rect x="520" y="140" width="70" height="260"/><rect x="600" y="220" width="110" height="180"/><rect x="720" y="170" width="80" height="230"/><rect x="810" y="240" width="120" height="160"/></g>
      <rect y="400" width="960" height="140" fill="#CBD5E1"/><path d="M0 470h960" stroke="#fff" stroke-width="6" stroke-dasharray="40 30"/><rect y="400" width="960" height="12" fill="#E2E8F0"/>`;
  const house = (k) => `<g transform="translate(60 160)"><path d="M-10 70L140 -20 290 70z" fill="${OR_D}"/><rect x="0" y="70" width="280" height="172" fill="#fff" stroke="#FED7AA" stroke-width="3"/>
      <rect x="30" y="104" width="70" height="56" rx="6" fill="#BAE6FD" stroke="#FED7AA" stroke-width="3"/><path d="M65 104v56M30 132h70" stroke="#FED7AA" stroke-width="3"/>
      <rect x="160" y="110" width="80" height="132" fill="#7C2D12"/><g class="${k}door"><rect x="160" y="110" width="80" height="132" fill="#9A3412"/><circle cx="228" cy="178" r="4" fill="#FDBA74"/></g>
</g>`;

  const SCENES = [
    /* 1 · the problem */ `${room}
      <rect x="250" y="330" width="330" height="16" rx="5" fill="#9A3412"/><rect x="270" y="346" width="14" height="56" fill="#7C2D12"/><rect x="546" y="346" width="14" height="56" fill="#7C2D12"/>
      ${at(400, 330, 1, laptop('s1-'), 's1-laptop')}
      <g class="s1-smoke" fill="#94A3B8"><circle cx="370" cy="190" r="12"/><circle cx="400" cy="184" r="16"/><circle cx="430" cy="192" r="11"/></g>
      ${who('fpCust', 120, 160, 1.3)}
      <g class="s1-bubble" transform="translate(215 120)"><path d="M0 0h86a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14H30l-14 16v-16H14A14 14 0 0 1 0 44V14A14 14 0 0 1 14 0z" fill="#fff" stroke="#FCA5A5" stroke-width="2"/>${H(50, 38, 'Oh no!', 18, '#DC2626', 'middle')}</g>
      <g class="s1-devs">${['printer', 'cctv', 'desktop', 'ups'].map((d, i) => `<g class="s1-dev" transform="translate(${690 + (i % 2) * 120} ${120 + Math.floor(i / 2) * 120})">
        <rect x="-48" y="-44" width="96" height="88" rx="18" fill="#fff" stroke="#FED7AA" filter="url(#fpShadow)"/><g transform="translate(0 -8) scale(1.3)">${ICON[d]}</g>
        <circle cx="34" cy="-30" r="11" fill="#EF4444"/><path d="M29 -35l10 10M39 -35l-10 10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
        ${txt(0, 32, d === 'ups' ? 'UPS' : d === 'cctv' ? 'CCTV' : d[0].toUpperCase() + d.slice(1), { s: 12, w: 700, c: '#334155', a: 'middle' })}</g>`).join('')}</g>
      ${caption(0)}`,

    /* 2 · book on fixpapa.com */ `${room}
      <g transform="translate(210 28)"><g class="s2-phone"><rect width="230" height="430" rx="34" fill="#0B1220"/><rect x="10" y="10" width="210" height="410" rx="26" fill="#fff"/>
        <rect x="88" y="18" width="54" height="8" rx="4" fill="#0B1220"/>
        <image href="assets/img/logo.png" x="24" y="38" width="96" height="22" preserveAspectRatio="xMinYMid meet"/>
        <rect x="24" y="68" width="182" height="1.5" fill="#FED7AA"/>
        ${H(24, 98, 'Book a Repair', 19)}${txt(24, 118, 'Select your device', { s: 12, w: 500, c: '#64748B' })}
        ${['laptop', 'desktop', 'printer', 'cctv', 'ups', 'projector'].map((d, i) => `<g class="s2-tile${i === 0 ? ' s2-pick' : ''}" transform="translate(${24 + (i % 3) * 62} ${134 + Math.floor(i / 3) * 74})">
          <rect class="s2-tbg" width="56" height="66" rx="12" fill="#FFF7ED" stroke="#FED7AA" stroke-width="1.5"/><g transform="translate(28 28) scale(.82)">${ICON[d]}</g>
          ${txt(28, 58, d === 'cctv' ? 'CCTV' : d === 'ups' ? 'UPS' : d[0].toUpperCase() + d.slice(1), { s: 9.5, w: 700, c: '#334155', a: 'middle' })}</g>`).join('')}
        <g transform="translate(24 290)"><rect width="182" height="40" rx="10" fill="#FFF7ED" stroke="#FED7AA"/>${txt(12, 25, 'Pickup: Home · Today 4 PM', { s: 11, w: 600, c: '#334155' })}</g>
        <g class="s2-btn" transform="translate(24 344)"><rect class="s2-btnbg" width="182" height="46" rx="23" fill="${OR}"/>
          ${txt(91, 29, 'Book Free Pickup', { s: 15, w: 800, c: '#fff', a: 'middle', cls: 's2-bt1' })}${txt(91, 29, 'Booked ✓', { s: 15, w: 800, c: '#fff', a: 'middle', cls: 's2-bt2' })}</g>
      </g></g>
      <g class="s2-finger"><circle class="s2-ring" r="22" fill="none" stroke="${OR}" stroke-width="4"/><circle r="13" fill="#0B1220" opacity=".55"/><circle r="6" fill="#fff"/></g>
      ${card(520, 120, 400, 220, `
        ${tick(46, 50, 20, 's2-tick')}${H(80, 46, 'Booking confirmed', 22)}${txt(80, 70, 'Booking ID  #FP-24817', { f: 'JetBrains Mono,monospace', s: 13, w: 500, c: '#64748B' })}
        <rect x="24" y="96" width="352" height="1.5" fill="#FED7AA"/>
        ${txt(28, 130, '•  Laptop repair · doorstep pickup', { s: 15, w: 600 })}${txt(28, 160, '•  Pickup today, 4:00 PM', { s: 15, w: 600 })}${txt(28, 190, '•  Free pickup & drop', { s: 15, w: 600, c: '#16A34A' })}`, 's2-conf')}
      ${caption(1)}`,

    /* 3 · technician arrives */ `${street}${house('s3-')}
      ${who('fpCust', 236, 182, 1.15, 's3-cust')}
      <g class="s3-custlap" transform="translate(282 318)">${closedLaptop}</g>
      ${at(640, 432, 1, scooter(true, 's3-'), 's3-scooter')}
      ${who('fpTech', 520, 176, 1.25, 's3-tech')}
      ${card(560, 40, 360, 96, `<circle cx="44" cy="48" r="24" fill="${OR}"/><g transform="translate(44 48) scale(.5)" fill="#fff"><path d="M-30 6q2-20 18-22l6 14h30q10 0 12 14h-66z"/><circle cx="-22" cy="14" r="8"/><circle cx="24" cy="14" r="8"/></g>
        ${H(82, 42, 'Your FixPapa expert is arriving', 15)}${txt(82, 66, 'Verified · ID checked · 2 min away', { s: 13, w: 500, c: '#64748B' })}
        <rect class="s3-trk" x="82" y="78" width="250" height="5" rx="2.5" fill="#FED7AA"/><rect class="s3-trkfill" x="82" y="78" width="250" height="5" rx="2.5" fill="${OR}"/>`, 's3-card')}
      ${caption(2)}`,

    /* 4 · safe pickup */ `${room}
      ${who('fpTech', 240, 140, 1.4)}
      ${who('fpCust', 560, 140, 1.4)}
      <g class="s4-lap" transform="translate(616 306)">${closedLaptop}</g>
      <g transform="translate(140 412)">${fpBox('s4-')}</g>
      <g class="s4-seal" transform="translate(140 336)"><rect x="-44" y="-15" width="88" height="30" rx="15" fill="#16A34A"/>${txt(0, 5, 'Sealed ✓', { s: 13, w: 800, c: '#fff', a: 'middle' })}</g>
      ${card(640, 60, 280, 116, `${txt(24, 36, 'Pickup OTP', { s: 13, w: 600, c: '#64748B' })}
        ${[4, 8, 2, 1].map((n, i) => `<rect x="${24 + i * 46}" y="50" width="38" height="44" rx="10" fill="#FFF7ED" stroke="#FED7AA"/>${txt(43 + i * 46, 80, n, { f: 'JetBrains Mono,monospace', s: 20, w: 700, a: 'middle' })}`).join('')}
        ${tick(236, 72, 16, 's4-otpok')}`, 's4-otp')}
      <g transform="translate(330 30)"><g class="s4-status"><rect width="300" height="44" rx="22" fill="#0B1220"/><circle cx="24" cy="22" r="7" fill="#22C55E"/>${txt(40, 27, 'Picked up · on the way to FixPapa lab', { s: 13, w: 600, c: '#fff' })}</g></g>
      ${caption(3)}`,

    /* 5 · repair at the FixPapa lab */ `<rect width="960" height="540" fill="#FFF7ED"/><rect width="960" height="330" fill="#FFEDD5"/>
      <g transform="translate(360 30)"><rect width="240" height="44" rx="22" fill="#0B1220"/><circle cx="24" cy="22" r="6" fill="#22C55E"/>${txt(40, 27, 'FIXPAPA SERVICE LAB', { f: 'JetBrains Mono,monospace', s: 13, w: 700, c: '#fff' })}</g>
      <g transform="translate(40 130)"><rect width="250" height="10" rx="3" fill="#9A3412"/><rect y="100" width="250" height="10" rx="3" fill="#9A3412"/>
        ${['printer', 'cctv', 'desktop'].map((d, i) => `<g transform="translate(${44 + i * 82} 64) scale(1.2)">${ICON[d]}</g>${tick(70 + i * 82, 34, 9, 's5-shelf')}`).join('')}
        ${['ups', 'projector', 'laptop'].map((d, i) => `<g transform="translate(${44 + i * 82} -26) scale(1.1)">${ICON[d]}</g>`).join('')}</g>
      ${who('fpTech', 368, 120, 1.25)}
      <g class="s5-tool" transform="translate(470 286)"><g class="s5-driver"><rect x="-3" y="-40" width="6" height="30" rx="2" fill="#94A3B8"/><rect x="-7" y="-12" width="14" height="28" rx="5" fill="${OR_D}"/></g></g>
      <rect x="300" y="330" width="420" height="18" rx="5" fill="#9A3412"/><rect x="300" y="348" width="420" height="120" fill="#7C2D12"/><rect x="300" y="348" width="420" height="6" fill="#0B1220" opacity=".2"/>
      ${at(420, 330, .9, laptop('s5-'), 's5-laptop')}
      <g class="s5-spark" fill="#FBBF24"><path d="M500 240l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M360 220l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>
      ${card(740, 60, 190, 280, `${H(18, 36, 'Repair status', 15)}
        <rect x="18" y="52" width="154" height="10" rx="5" fill="#FFEDD5"/><rect class="s5-bar" x="18" y="52" width="154" height="10" rx="5" fill="${OR}"/>
        ${txt(172, 82, '', { s: 12, w: 700, c: OR_D, a: 'end', cls: 's5-pct' })}
        ${['Diagnosis', 'Genuine part', 'Quality test', 'Cleaned & packed'].map((s, i) => `<g class="s5-step" transform="translate(18 ${110 + i * 42})"><circle cx="11" cy="0" r="11" fill="#E2E8F0"/>${tick(11, 0, 11, 's5-ok')}${txt(30, 5, s, { s: 13, w: 600, c: '#334155' })}</g>`).join('')}`)}
      ${caption(4)}`,

    /* 6 · delivered back + end card */ `${street}${house('s6-')}
      ${who('fpCust', 236, 182, 1.15)}
      ${who('fpTech', 360, 176, 1.25)}
      <g class="s6-lap" transform="translate(414 322)">${at(0, 0, .42, laptop('s6-'))}</g>
      <g class="s6-hearts" fill="#F43F5E">${[0, 1, 2].map(i => `<g transform="translate(${250 + i * 26} ${170 - i * 14}) scale(${1 - i * .15})"><path d="M0 6C-10-4-2-14 0-6 2-14 10-4 0 6z"/></g>`).join('')}</g>
      ${card(560, 90, 360, 150, `${H(24, 40, 'Delivered ✓', 22, '#16A34A')}
        <g class="s6-stars" transform="translate(24 66)">${[0, 1, 2, 3, 4].map(i => `<path class="s6-star" transform="translate(${i * 34} 0)" d="M14 0l4.2 8.6 9.5 1.4-6.9 6.7 1.6 9.4L14 21.7 5.6 26.1l1.6-9.4L.3 10l9.5-1.4z" fill="#FBBF24"/>`).join('')}</g>
        ${txt(24, 124, '“Super fast doorstep service!”', { s: 15, w: 600, c: '#334155' })}`, 's6-card')}
      ${caption(5)}
      <g class="s6-end"><rect width="960" height="540" fill="#0B1220"/><circle cx="820" cy="60" r="220" fill="${OR}" opacity=".16"/><circle cx="120" cy="520" r="200" fill="${OR}" opacity=".12"/>
        <rect x="330" y="70" width="300" height="76" rx="20" fill="#fff"/><image href="assets/img/logo.png" x="360" y="86" width="240" height="44" preserveAspectRatio="xMidYMid meet"/>
        ${H(480, 222, 'Broken device? Just FixPapa it.', 40, '#fff', 'middle')}
        ${txt(480, 268, 'Laptop · Desktop · Printer · CCTV · UPS · Projector', { s: 21, w: 600, c: '#FDBA74', a: 'middle' })}
        ${txt(480, 300, 'Repair  ·  AMC  ·  Rental  ·  Tech Support  ·  E-Waste', { s: 17, w: 500, c: '#CBD5E1', a: 'middle' })}
        <g transform="translate(330 340)"><rect width="300" height="64" rx="32" fill="${OR}"/>${H(150, 41, 'Book now · fixpapa.com', 21, '#fff', 'middle')}</g>
        <ellipse cx="96" cy="452" rx="74" ry="16" fill="#000" opacity=".35"/><ellipse cx="864" cy="452" rx="74" ry="16" fill="#000" opacity=".35"/>
        <g class="s6-endtech">${who('fpTech', 44, 210, 1.25)}${who('fpTech', 812, 210, 1.25)}</g></g>`
  ];

  const SVG = `<svg class="fp-story-svg" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid meet" role="img" aria-label="FixPapa story: a device breaks, the customer books a repair on fixpapa.com, a FixPapa expert in uniform picks it up, repairs it at the lab and delivers it back.">
    <defs><filter id="fpShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#9A3412" flood-opacity=".16"/></filter>
      <clipPath id="fpClip"><rect width="960" height="540"/></clipPath></defs>
    <g clip-path="url(#fpClip)">${SCENES.map((s, i) => `<g class="st-scene" data-i="${i}">${s}</g>`).join('')}
    <g class="st-logo" transform="translate(24 20)"><rect width="150" height="40" rx="12" fill="#fff" opacity=".95"/><image href="assets/img/logo.png" x="14" y="9" width="122" height="22" preserveAspectRatio="xMinYMid meet"/></g></g>
  </svg>`;

  function build(root) {
    const G = window.gsap;
    root.innerHTML = SVG;
    const svg = root.querySelector('svg');
    const q = (s) => svg.querySelector(s), qa = (s) => svg.querySelectorAll(s);
    const scenes = [...qa('.st-scene')];
    if (!G) { scenes.forEach((s, i) => s.style.display = i === 5 ? '' : 'none'); return null; }
    const tl = G.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    G.set(scenes, { autoAlpha: 0 }); G.set(scenes[0], { autoAlpha: 1 });
    STEPS.forEach((s, i) => {
      tl.addLabel('s' + i, s.t);
      if (i) { tl.to(scenes[i - 1], { autoAlpha: 0, duration: .4 }, s.t); tl.fromTo(scenes[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: .4, immediateRender: false }, s.t); }
      tl.from(scenes[i].querySelector('.st-cap'), { y: 30, opacity: 0, duration: .5 }, s.t + .3);
    });

    /* 1 · problem */
    G.set([q('.s1-scr-broken'), q('.s1-bubble'), ...qa('.s1-dev'), ...qa('.s1-smoke circle')], { opacity: 0 });
    const crack = q('.s1-crack'), cl = 260; G.set(crack, { strokeDasharray: cl, strokeDashoffset: cl });
    tl.to(q('.s1-scr-norm'), { opacity: 0, duration: .06, repeat: 5, yoyo: true }, .9)
      .set(q('.s1-scr-broken'), { opacity: 1 }, 1.6).set(q('.s1-scr-norm'), { opacity: 0 }, 1.6)
      .to(crack, { strokeDashoffset: 0, duration: .6, ease: 'none' }, 1.6)
      .fromTo(q('.s1-laptop'), { x: -4 }, { x: 4, duration: .05, repeat: 7, yoyo: true, ease: 'none' }, 1.6)
      .fromTo(qa('.s1-smoke circle'), { opacity: .7, y: 0, scale: .6, transformOrigin: '50% 50%' }, { opacity: 0, y: -70, scale: 1.6, duration: 1.4, stagger: .25, immediateRender: false }, 1.8)
      .fromTo(q('.s1-bubble'), { opacity: 0, scale: 0, transformOrigin: '0% 100%' }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2)' }, 1.9)
      .fromTo(qa('.s1-dev'), { opacity: 0, scale: .5, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .45, stagger: .18, ease: 'back.out(2)' }, 2.5);

    /* 2 · book online */
    const t2 = STEPS[1].t, fin = q('.s2-finger');
    G.set(q('.s2-bt2'), { opacity: 0 }); G.set(fin, { x: 520, y: 520, opacity: 0 }); G.set(q('.s2-ring'), { opacity: 0, scale: .4, transformOrigin: '50% 50%' });
    const tap = (at) => tl.fromTo(q('.s2-ring'), { opacity: 1, scale: .4 }, { opacity: 0, scale: 1.6, duration: .45, immediateRender: false }, at);
    tl.from(q('.s2-phone'), { y: 80, opacity: 0, duration: .7 }, t2 + .1)
      .from(qa('.s2-tile'), { scale: .6, opacity: 0, transformOrigin: '50% 50%', duration: .35, stagger: .07, ease: 'back.out(2)' }, t2 + .6)
      .to(fin, { opacity: 1, x: 262, y: 196, duration: .8, ease: 'power3.inOut' }, t2 + 1.2);
    tap(t2 + 2.05);
    tl.to(q('.s2-pick .s2-tbg'), { attr: { fill: '#FFEDD5', stroke: OR }, duration: .2 }, t2 + 2.1)
      .to(fin, { x: 325, y: 395, duration: .7, ease: 'power3.inOut' }, t2 + 2.5);
    tap(t2 + 3.25);
    tl.to(q('.s2-btnbg'), { attr: { fill: '#16A34A' }, duration: .25 }, t2 + 3.3).to(q('.s2-bt1'), { opacity: 0, duration: .15 }, t2 + 3.3).to(q('.s2-bt2'), { opacity: 1, duration: .2 }, t2 + 3.4)
      .to(fin, { opacity: 0, duration: .3 }, t2 + 3.7)
      .from(q('.s2-conf'), { x: 60, opacity: 0, duration: .6 }, t2 + 3.5)
      .from(q('.s2-tick'), { scale: 0, transformOrigin: '50% 50%', duration: .4, ease: 'back.out(3)' }, t2 + 3.9);

    /* 3 · expert arrives */
    const t3 = STEPS[2].t;
    G.set([q('.s3-tech'), q('.s3-cust'), q('.s3-custlap')], { opacity: 0 });
    tl.from(q('.s3-scooter'), { x: 520, duration: 1.7, ease: 'power2.out' }, t3 + .1)
      .fromTo(qa('.s3-wheel'), { rotation: 0, transformOrigin: '50% 50%' }, { rotation: -900, duration: 1.7, ease: 'power2.out' }, t3 + .1)
      .from(q('.s3-card'), { y: -40, opacity: 0, duration: .5 }, t3 + .3)
      .fromTo(q('.s3-trkfill'), { scaleX: .1, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1.6, ease: 'power1.inOut' }, t3 + .5)
      .to(q('.s3-rider'), { opacity: 0, duration: .3 }, t3 + 1.9)
      .fromTo(q('.s3-tech'), { opacity: 0, x: 60 }, { opacity: 1, x: 40, duration: .4 }, t3 + 1.9)
      .to(q('.s3-tech'), { x: -150, duration: 1.3, ease: 'power1.inOut' }, t3 + 2.4)
      .fromTo(q('.s3-tech'), { y: 0 }, { y: -6, duration: .16, repeat: 7, yoyo: true, ease: 'sine.inOut', immediateRender: false }, t3 + 2.4)
      .to(q('.s3-door'), { scaleX: .12, transformOrigin: '0% 50%', duration: .5 }, t3 + 3.4)
      .to([q('.s3-cust'), q('.s3-custlap')], { opacity: 1, duration: .4 }, t3 + 3.7);

    /* 4 · pickup */
    const t4 = STEPS[3].t;
    G.set([q('.s4-seal'), q('.s4-status')], { opacity: 0 }); G.set(q('.s4-otpok'), { scale: 0, transformOrigin: '50% 50%' });
    tl.from(q('.s4-otp'), { y: -30, opacity: 0, duration: .5 }, t4 + .4)
      .to(q('.s4-otpok'), { scale: 1, duration: .4, ease: 'back.out(3)' }, t4 + 1.1)
      .to(q('.s4-lap'), { x: '-=324', duration: 1, ease: 'power2.inOut' }, t4 + 1.4)
      .to(q('.s4-lid'), { rotation: -100, transformOrigin: '0% 50%', duration: .4 }, t4 + 2.3)
      .to(q('.s4-lap'), { x: '-=152', y: '+=86', scale: .7, duration: .7, ease: 'power2.in' }, t4 + 2.5)
      .set(q('.s4-lap'), { opacity: 0 }, t4 + 3.2)
      .to(q('.s4-lid'), { rotation: 0, duration: .3 }, t4 + 3.2)
      .fromTo(q('.s4-seal'), { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(3)' }, t4 + 3.4)
      .fromTo(q('.s4-status'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .4 }, t4 + 3.6);

    /* 5 · repair */
    const t5 = STEPS[4].t;
    G.set(q('.s5-scr-norm'), { opacity: 0 }); G.set(q('.s5-scr-broken'), { opacity: 1 });
    G.set([...qa('.s5-ok'), ...qa('.s5-shelf')], { scale: 0, transformOrigin: '50% 50%' }); G.set(q('.s5-bar'), { scaleX: 0, transformOrigin: '0% 50%' });
    const pct = q('.s5-pct'), prog = { v: 0 };
    tl.fromTo(q('.s5-driver'), { rotation: -18, transformOrigin: '50% 80%' }, { rotation: 18, duration: .22, repeat: 15, yoyo: true, ease: 'sine.inOut', immediateRender: false }, t5 + .5)
      .fromTo(qa('.s5-spark path'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1.2, duration: .3, repeat: 7, yoyo: true, stagger: .2, immediateRender: false }, t5 + .6)
      .to(q('.s5-bar'), { scaleX: 1, duration: 3.2, ease: 'power1.inOut' }, t5 + .6)
      .to(prog, { v: 100, duration: 3.2, ease: 'power1.inOut', onUpdate: () => { pct.textContent = Math.round(prog.v) + '%'; } }, t5 + .6)
      .to(qa('.s5-ok'), { scale: 1, duration: .35, stagger: .8, ease: 'back.out(3)' }, t5 + 1)
      .to(qa('.s5-shelf'), { scale: 1, duration: .35, stagger: .3, ease: 'back.out(3)' }, t5 + 1.6)
      .to(q('.s5-scr-broken'), { opacity: 0, duration: .3 }, t5 + 3.8).to(q('.s5-scr-ok'), { opacity: 1, duration: .3 }, t5 + 3.8);

    /* 6 · delivered + end card */
    const t6 = STEPS[5].t;
    G.set(q('.s6-scr-norm'), { opacity: 0 }); G.set(q('.s6-scr-ok'), { opacity: 1 });
    G.set(q('.s6-door'), { scaleX: .12, transformOrigin: '0% 50%' });
    G.set([...qa('.s6-hearts path'), ...qa('.s6-star')], { opacity: 0 }); G.set(q('.s6-end'), { autoAlpha: 0 });
    tl.to(q('.s6-lap'), { x: '-=118', duration: 1, ease: 'power2.inOut' }, t6 + .6)
      .from(q('.s6-card'), { x: 60, opacity: 0, duration: .5 }, t6 + 1.2)
      .fromTo(qa('.s6-star'), { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .3, stagger: .12, ease: 'back.out(3)' }, t6 + 1.6)
      .fromTo(qa('.s6-hearts path'), { opacity: 0, y: 10 }, { opacity: 1, y: -16, duration: .6, stagger: .15 }, t6 + 1.7)
      .fromTo(q('.s6-end'), { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, t6 + 3.3)
      .to(q('.st-logo'), { autoAlpha: 0, duration: .3 }, t6 + 3.3)
      .from(q('.s6-end').children, { opacity: 0, duration: .5, stagger: .06, immediateRender: false }, t6 + 3.5)
      .to({}, { duration: .01 }, DURATION - .01);
    return tl;
  }

  window.FPStory = { build, STEPS, DURATION };

  /* ---------- on-page player: real-footage ad video (assets/media/fixpapa-story.mp4) ---------- */
  const vid = document.getElementById('fpVideo'); if (!vid) return;
  const CHAPTERS = [0, 4.2, 8.4, 12.6, 16.8, 21]; // must match the cuts in the MP4
  const playBtn = document.getElementById('fpPlay'), bar = document.getElementById('fpBar'), time = document.getElementById('fpTime');
  const steps = [...document.querySelectorAll('#fpSteps button')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let userPaused = reduce, inView = false;
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const paint = () => {
    const t = vid.currentTime, d = vid.duration || 29.6;
    bar.style.transform = `scaleX(${t / d})`; time.textContent = fmt(t);
    let cur = 0; CHAPTERS.forEach((c, i) => { if (t >= c) cur = i; });
    steps.forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('done', i < cur); });
  };
  vid.addEventListener('timeupdate', paint);
  vid.addEventListener('ended', () => { if (!userPaused && inView) setTimeout(() => { vid.currentTime = 0; sync(); }, 1500); });
  const sync = () => {
    const play = inView && !userPaused;
    if (play && vid.paused && !vid.ended) vid.play().catch(() => {}); else if (!play) vid.pause();
    playBtn.classList.toggle('paused', !play); playBtn.setAttribute('aria-label', play ? 'Pause video' : 'Play video');
  };
  playBtn.addEventListener('click', () => { userPaused = !userPaused; if (vid.ended) vid.currentTime = 0; sync(); });
  steps.forEach((b, i) => b.addEventListener('click', () => { vid.currentTime = CHAPTERS[i] + .05; userPaused = false; sync(); paint(); }));
  document.getElementById('fpBarWrap').addEventListener('click', (e) => {
    const r = e.currentTarget.getBoundingClientRect(); vid.currentTime = (vid.duration || 29.6) * (e.clientX - r.left) / r.width; paint();
  });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: .35 }).observe(vid);
})();
