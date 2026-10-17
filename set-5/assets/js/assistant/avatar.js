/* =========================================================
   FixPapa Assistant · standing technician avatar (rendering + expressions only)
   ---------------------------------------------------------
   createAvatar(container, { view: 'full' | 'bust', logoSrc }) → { el, setState(name), getState(), destroy() }
   States: idle · greeting · listening · thinking · talking · happy · error
   The avatar only sets data-state on its <svg>; poses, expressions and animations live in
   assets/css/assistant.css under "AVATAR". It knows nothing about chat, services or pricing,
   so it can be replaced by any object with the same three methods (e.g. a Lottie or Rive player).
   ========================================================= */
(() => {
  const NS = window.FPAssistant = window.FPAssistant || {};
  const STATES = ['idle', 'greeting', 'listening', 'thinking', 'talking', 'happy', 'error'];
  const VIEWS = { full: '0 0 120 240', bust: '21 18 78 78' };   // whole figure · head and chest (panel header)
  const SKIN = '#F3CDA6', SKIN_D = '#E9BB92', NECK = '#E2AD84', SHIRT_LINE = '#D5DBE5', PANT = '#1E3A8A', SHOE = '#111827';

  // a white sleeve drawn as an outlined stroke, ending in a hand
  const arm = (cls, d, hx, hy) => `
    <g class="${cls}"><path d="${d}" fill="none" stroke="${SHIRT_LINE}" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${hx}" cy="${hy}" r="4.6" fill="${SKIN_D}"/></g>`;

  // formal look: blue baseball cap, white shirt with the FixPapa logo on the chest, blue formal trousers, black formal shoes
  const svg = (view, logoSrc) => `
<svg class="fpa-av" data-state="idle" data-view="${view}" viewBox="${VIEWS[view] || VIEWS.full}" aria-hidden="true" focusable="false">
  <ellipse class="fpa-shadow" cx="60" cy="233" rx="28" ry="4" fill="#0B1220" opacity=".14"/>
  <g class="fpa-av-fig">
    <g class="fpa-legs">
      <path d="M40 137h40l-1.5 85H63.5L60 160l-3.5 62H41.5z" fill="${PANT}"/>
      <path d="M49.5 148v72M70.5 148v72" stroke="#172E6E" stroke-width="1.2"/>
      <path d="M41.5 219h15.5v6.5c0 3-2 4.5-5 4.5H37c-3 0-4.2-2.2-3-4.5 1.4-3 4.4-4.6 7.5-6.5z" fill="${SHOE}"/>
      <path d="M63 219h15.5c3.1 1.9 6.1 3.5 7.5 6.5 1.2 2.3 0 4.5-3 4.5H68c-3 0-5-1.5-5-4.5z" fill="${SHOE}"/>
      <path d="M38 227h12M70 227h12" stroke="#374151" stroke-width="1.2" stroke-linecap="round"/>
    </g>
    <g class="fpa-av-body">
      <rect x="54" y="64" width="12" height="13" rx="4" fill="${NECK}"/>
      <path d="M40 83c0-5 6-8.5 14-9.5h12c8 1 14 4.5 14 9.5l2 55H38z" fill="#fff" stroke="${SHIRT_LINE}" stroke-width="1"/>
      <path d="M70 76c6 2 9.6 4.4 10 8l2 54h-8z" fill="#EEF2F7"/>
      <path d="M55 73.5l5 8 5-8z" fill="${NECK}"/>
      <path d="M54 73l6 9-8 2.5-2.5-8.5zM66 73l-6 9 8 2.5 2.5-8.5z" fill="#fff" stroke="#CBD5E1" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M60 83v52" stroke="#E2E8F0" stroke-width="1"/>
      <g fill="#CBD5E1"><circle cx="60" cy="100" r="1"/><circle cx="60" cy="112" r="1"/><circle cx="60" cy="124" r="1"/></g>
      <image class="fpa-logo" href="${logoSrc}" x="45" y="90" width="30" height="5.72" preserveAspectRatio="xMidYMid meet"/>
      <rect x="38.5" y="133" width="43" height="6" rx="1.5" fill="${SHOE}"/>
      <rect x="57" y="133.6" width="6" height="4.8" rx="1" fill="none" stroke="#CBD5E1" stroke-width="1.1"/>
      <g class="fpa-arms-crossed">
        ${arm('fpa-arm', 'M41 87C37 96 35.5 104 37 112L71 106', 74.5, 104.5)}
        ${arm('fpa-arm', 'M79 87C83 96 84.5 104 83 112L49 108', 45.5, 107)}
      </g>
      ${arm('fpa-arm fpa-arm-l', 'M41 87C36 100 34.5 114 35.5 131', 36, 135)}
      ${arm('fpa-arm fpa-arm-r', 'M79 87C84 100 85.5 114 84.5 131', 84, 135)}
      ${arm('fpa-arm fpa-arm-hold', 'M79 87C83 96 84.5 104 83 113L48 113', 45, 112.5)}
      ${arm('fpa-arm fpa-arm-wave', 'M78.5 87L93 101 99.5 78', 100, 72)}
      ${arm('fpa-arm fpa-arm-chin', 'M41 87L35.5 105 52.5 73', 54, 70)}
      ${arm('fpa-arm fpa-arm-talk', 'M79 87L84 111 97 103', 99.5, 101.5)}
    </g>
    <g class="fpa-av-head">
      <circle cx="43.6" cy="52" r="4.2" fill="${SKIN_D}"/><circle cx="76.4" cy="52" r="4.2" fill="${SKIN_D}"/>
      <ellipse cx="60" cy="51" rx="16.8" ry="18.6" fill="${SKIN}"/>
      <path d="M43 47c-1.5-14 6-23.5 17.5-23.5C72 23.5 79 31 77.5 45c-2.5-6.5-8-10.5-15-10.5-3 4-10 7-19.5 12.5z" fill="#2B1D14"/>
      <g class="fpa-cap">
        <path d="M43.5 41.5c-.5-10.5 7-17 17-17s17.5 6.5 17 17z" fill="#1D4ED8"/>
        <path d="M60.5 24.5v17" stroke="#1E40AF" stroke-width="1"/>
        <path d="M49 28.5c3.5-2.6 7.2-3.6 11.5-3.6" fill="none" stroke="#3B82F6" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        <circle cx="60.5" cy="24.6" r="1.6" fill="#1E40AF"/>
        <path d="M58 40.2c11-1.6 25.5-.9 34.5 3.8-8.2 3.6-22.5 3.8-34.5 1.4z" fill="#1E3A8A"/>
        <path d="M43.2 41.6h34.6" stroke="#1E3A8A" stroke-width="2.6" stroke-linecap="round"/>
      </g>
      <g transform="translate(13.2 8.1) scale(.78)">
        <g class="fpa-brows" fill="none" stroke="#2B1D14" stroke-width="2.4" stroke-linecap="round">
          <path class="fpa-brow-l" d="M47.5 47.5q4-2.6 8 0"/><path class="fpa-brow-r" d="M64.5 47.5q4-2.6 8 0"/>
        </g>
        <g class="fpa-eyes">
          <ellipse cx="51.5" cy="55" rx="2.8" ry="3.4" fill="#1A1410"/><ellipse cx="68.5" cy="55" rx="2.8" ry="3.4" fill="#1A1410"/>
          <circle cx="52.5" cy="53.8" r=".9" fill="#fff"/><circle cx="69.5" cy="53.8" r=".9" fill="#fff"/>
        </g>
        <path class="fpa-eyes-happy" d="M48 56.5q3.5-4.6 7 0M65 56.5q3.5-4.6 7 0" fill="none" stroke="#1A1410" stroke-width="2.6" stroke-linecap="round"/>
        <g class="fpa-blush" fill="#F87171" opacity=".38"><circle cx="45" cy="62.5" r="3.6"/><circle cx="75" cy="62.5" r="3.6"/></g>
        <path d="M60 57.5q-2.2 5 .6 6.2" fill="none" stroke="#D39B72" stroke-width="1.8" stroke-linecap="round"/>
        <g fill="none" stroke="#5B2318" stroke-width="2.6" stroke-linecap="round">
          <path class="fpa-m fpa-m-smile" d="M54 66.5q6 5 12 0"/>
          <path class="fpa-m fpa-m-flat" d="M55.5 67.8h9"/>
          <path class="fpa-m fpa-m-frown" d="M54.5 69.8q5.5-4.4 11 0"/>
        </g>
        <g class="fpa-m fpa-m-grin"><path d="M52.5 65.5q7.5 9.5 15 0z" fill="#5B2318"/><path d="M54.6 66.3h10.8" stroke="#fff" stroke-width="1.7"/></g>
        <ellipse class="fpa-m fpa-m-talk" cx="60" cy="67.6" rx="4.6" ry="3.6" fill="#5B2318"/>
        <path class="fpa-sweat" d="M82 50c2.2 3.2 3.3 5.2 3.3 6.8a3.3 3.3 0 0 1-6.6 0c0-1.6 1.1-3.6 3.3-6.8z" fill="#7DD3FC"/>
      </g>
    </g>
  </g>
  <g class="fpa-think">
    <circle cx="79" cy="30" r="2" fill="#fff" stroke="#E2E8F0"/>
    <rect x="83" y="6" width="31" height="17" rx="8.5" fill="#fff" stroke="#E2E8F0"/>
    <circle class="fpa-dot" cx="91.5" cy="14.5" r="2.1"/><circle class="fpa-dot" cx="98.5" cy="14.5" r="2.1"/><circle class="fpa-dot" cx="105.5" cy="14.5" r="2.1"/>
  </g>
  <g class="fpa-spark" fill="#FBBF24">
    <path d="M28 26l1.8 4.4 4.4 1.8-4.4 1.8-1.8 4.4-1.8-4.4-4.4-1.8 4.4-1.8z"/>
    <path d="M93 36l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3z"/>
  </g>
</svg>`;

  function createAvatar(container, { view = 'full', logoSrc = 'assets/img/logo.png' } = {}) {
    container.insertAdjacentHTML('beforeend', svg(view, logoSrc));
    const el = container.lastElementChild;
    let current = 'idle';
    return {
      el,
      setState(name) {
        const next = STATES.includes(name) ? name : 'idle';
        if (next === current) return;
        current = next;
        el.setAttribute('data-state', next);
      },
      getState: () => current,
      destroy() { el.remove(); }
    };
  }

  NS.AVATAR_STATES = STATES;
  NS.createAvatar = createAvatar;
})();
