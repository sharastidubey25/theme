/* =========================================================
   FixPapa · Set 2 — Continuous "digital world" background
   One fixed animated layer + one page-length circuit spine,
   shared by every section so nothing cuts off between them.
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 700;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------------- Fixed layer ---------------- */
  const world = document.createElement('div');
  world.className = 'world';
  world.setAttribute('aria-hidden', 'true');
  world.innerHTML = `
    <div class="world-glow g1"></div><div class="world-glow g2"></div><div class="world-glow g3"></div>
    <div class="world-board"></div>
    <div class="world-parts"></div>
    <canvas class="world-canvas"></canvas>
    <div class="world-vignette"></div>`;
  document.body.prepend(world);
  const board = world.querySelector('.world-board');
  const partsEl = world.querySelector('.world-parts');
  const glows = [...world.querySelectorAll('.world-glow')];
  const cvs = world.querySelector('.world-canvas');
  const ctx = cvs.getContext('2d');

  /* ---------------- Motherboard tile (SVG data URL) ---------------- */
  (function makeBoard() {
    let seed = 11; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const T = 520; let d = '', pads = '', chips = '';
    for (let i = 0; i < 26; i++) {
      let x = Math.round(r() * T / 20) * 20, y = Math.round(r() * T / 20) * 20;
      d += `M${x} ${y}`;
      for (let k = 0; k < 3; k++) {
        if (k % 2) y = Math.max(0, Math.min(T, y + (r() < .5 ? -1 : 1) * (40 + Math.round(r() * 5) * 20)));
        else x = Math.max(0, Math.min(T, x + (r() < .5 ? -1 : 1) * (40 + Math.round(r() * 6) * 20)));
        d += `L${x} ${y}`;
      }
      pads += `<circle cx="${x}" cy="${y}" r="3.5"/>`;
    }
    for (let i = 0; i < 7; i++) {
      const x = Math.round(r() * (T - 80)), y = Math.round(r() * (T - 60)), w = 30 + Math.round(r() * 50), h = 20 + Math.round(r() * 30);
      chips += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
      for (let p = 6; p < w - 4; p += 8) chips += `<path d="M${x + p} ${y}v-6M${x + p} ${y + h}v6"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}"><g fill="none" stroke="#60A5FA" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/>${chips}</g><g fill="#F97316">${pads}</g></svg>`;
    board.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  })();

  /* ---------------- Floating laptop components (holographic line-art) ---------------- */
  const S = 'fill="rgba(96,165,250,.06)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"';
  const art = {
    ram: `<svg viewBox="0 0 160 50"><rect x="2" y="4" width="156" height="34" rx="3" ${S}/><g fill="rgba(96,165,250,.25)"><rect x="12" y="11" width="24" height="18" rx="2"/><rect x="44" y="11" width="24" height="18" rx="2"/><rect x="92" y="11" width="24" height="18" rx="2"/><rect x="124" y="11" width="24" height="18" rx="2"/></g><path d="M10 38v8M20 38v8M30 38v8M40 38v8M50 38v8M60 38v8M70 38v8M90 38v8M100 38v8M110 38v8M120 38v8M130 38v8M140 38v8M150 38v8" stroke="#F97316" stroke-width="2"/></svg>`,
    ssd: `<svg viewBox="0 0 140 40"><rect x="2" y="4" width="136" height="32" rx="4" ${S}/><rect x="14" y="11" width="34" height="18" rx="2" fill="rgba(96,165,250,.25)"/><rect x="56" y="11" width="34" height="18" rx="2" fill="rgba(96,165,250,.25)"/><rect x="110" y="13" width="16" height="14" rx="2" fill="#F97316" opacity=".8"/></svg>`,
    cpu: `<svg viewBox="0 0 90 90"><rect x="15" y="15" width="60" height="60" rx="6" ${S}/><rect x="28" y="28" width="34" height="34" rx="4" fill="rgba(249,115,22,.18)" stroke="#F97316" stroke-width="2"/><path d="M25 15V5M37 15V5M49 15V5M61 15V5M25 85V75M37 85V75M49 85V75M61 85V75M15 25H5M15 37H5M15 49H5M15 61H5M85 25H75M85 37H75M85 49H75M85 61H75" stroke="#60A5FA" stroke-width="2"/></svg>`,
    fan: `<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="16" ${S}/><circle cx="50" cy="50" r="36" fill="none" stroke="#60A5FA" stroke-width="2"/><g class="spin" fill="rgba(96,165,250,.3)" stroke="#60A5FA" stroke-width="1.5"><path d="M50 50L50 18A32 32 0 0 1 76 34Z"/><path d="M50 50L78 64A32 32 0 0 1 56 82Z"/><path d="M50 50L26 74A32 32 0 0 1 20 40Z"/><circle cx="50" cy="50" r="7" fill="#F97316" stroke="none"/></g></svg>`,
    key: `<svg viewBox="0 0 60 60"><rect x="3" y="3" width="54" height="54" rx="10" ${S}/><rect x="10" y="8" width="40" height="38" rx="7" fill="none" stroke="#60A5FA" stroke-width="1.5" opacity=".7"/><text x="30" y="34" text-anchor="middle" font-family="Manrope,sans-serif" font-weight="800" font-size="18" fill="#93C5FD">KEY</text></svg>`,
    chip: `<svg viewBox="0 0 80 50"><rect x="12" y="8" width="56" height="34" rx="4" ${S}/><circle cx="20" cy="16" r="2.5" fill="#F97316"/><path d="M20 8V2M30 8V2M40 8V2M50 8V2M60 8V2M20 48v-6M30 48v-6M40 48v-6M50 48v-6M60 48v-6" stroke="#60A5FA" stroke-width="2"/></svg>`,
  };
  const keyLetters = ['F', 'X', 'P', 'A', 'Esc', 'Ctrl', '⌘'];
  const kinds = [];
  const floaters = kinds.map((k, i) => {
    const el = document.createElement('div');
    el.className = 'world-part';
    el.innerHTML = k === 'key' ? art.key.replace('>KEY<', `>${keyLetters[i % keyLetters.length]}<`) : art[k];
    const depth = 0.25 + ((i * 37) % 75) / 100;          // 0.25 … 1
    const size = { ram: 150, ssd: 120, cpu: 80, fan: 90, key: 50, chip: 70 }[k] * (0.6 + depth * 0.6);
    el.style.width = size + 'px';
    el.style.opacity = (0.12 + depth * 0.16).toFixed(2);
    if (depth < 0.5) el.style.filter = `blur(${((0.5 - depth) * 6).toFixed(1)}px)`;   // depth-of-field
    partsEl.appendChild(el);
    return { el, depth, size, x: ((i * 0.618) % 1), y: ((i * 0.37) % 1), rot: (i * 47) % 360, rs: (i % 2 ? 1 : -1) * (3 + (i % 4) * 2), sp: 6 + (i % 5) * 4 };
  });

  /* ---------------- Canvas: particles + binary ---------------- */
  let W = 0, H = 0, dpr = 1;
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return c; })();
  const tint = (color) => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.drawImage(dot, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, 32, 32); return c; };
  const dotB = tint('#60A5FA'), dotO = tint('#F97316'), dotW = tint('#E0ECFF');
  let particles = [], bits = [];
  function resize() {
    dpr = Math.min(devicePixelRatio, 1.5); W = innerWidth; H = innerHeight;
    cvs.width = W * dpr; cvs.height = H * dpr; cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = small() ? 16 : 34;
    particles = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 2 + Math.random() * 5, v: 6 + Math.random() * 26, d: 0.3 + Math.random() * 0.7, a: 0.25 + Math.random() * 0.55, img: Math.random() < 0.22 ? dotO : Math.random() < 0.5 ? dotW : dotB, w: Math.random() * 6.28 }));
    bits = [];
  }
  function newBit(any) { return { x: Math.random() * W, y: any ? Math.random() * H : H + 20, c: Math.random() < 0.5 ? '0' : '1', v: 8 + Math.random() * 14, life: 0, max: 5 + Math.random() * 7, o: Math.random() < 0.25 }; }

  /* ---------------- Page-length circuit spine ---------------- */
  let spine;
  function buildSpine() {
    return; // minimal mode: no page-length circuit lines
    if (spine) spine.remove();
    const docH = document.documentElement.scrollHeight, w = document.documentElement.clientWidth;
    spine = document.createElementNS(NS, 'svg');
    spine.setAttribute('class', 'world-spine'); spine.setAttribute('aria-hidden', 'true');
    spine.setAttribute('width', w); spine.setAttribute('height', docH); spine.setAttribute('viewBox', `0 0 ${w} ${docH}`);
    const gutter = small() ? 8 : Math.max(22, (w - 1240) / 2 - 36);
    const sections = [...document.querySelectorAll('main > section, main > div, footer')].map(s => s.getBoundingClientRect().top + scrollY).filter(y => y > 80);
    const mk = (side) => {
      const x0 = side < 0 ? gutter : w - gutter, j = small() ? 4 : 18;
      let d = `M${x0} 0`, x = x0, branches = '', nodes = '';
      sections.forEach((y, i) => {
        const nx = x0 + (i % 2 ? 0 : -side * j);
        d += ` L${x} ${y - 70} L${nx} ${y - 70 + Math.abs(nx - x)}`; x = nx;
        if (!small()) {
          const bx = x - side * 70;
          branches += `M${x} ${y - 20} L${x - side * 26} ${y + 6} L${bx} ${y + 6}`;
          nodes += `<circle class="node" cx="${bx}" cy="${y + 6}" r="3.5" style="animation-delay:${(i * .4) % 3}s"/>`;
        }
      });
      d += ` L${x} ${docH}`;
      return { d, branches, nodes };
    };
    const L = mk(-1), R = mk(1);
    spine.innerHTML = `
      <path class="trace" d="${L.d}"/><path class="trace" d="${R.d}"/>
      <path class="trace thin" d="${L.branches}${R.branches}"/>
      ${L.nodes}${R.nodes}
      <path class="pulse b" d="${L.d}"/><path class="pulse o" d="${L.d}"/>
      <path class="pulse o" d="${R.d}"/><path class="pulse b" d="${R.d}"/>
      <path class="pulse b short" d="${L.branches}${R.branches}"/>`;
    document.body.appendChild(spine);
    spine.querySelectorAll('.pulse').forEach((p, i) => {
      const len = p.getTotalLength();
      const short = p.classList.contains('short');
      p.style.strokeDasharray = short ? `10 ${140}` : `${60} ${len}`;
      p.style.setProperty('--len', short ? 150 : len + 60);
      p.style.animationDuration = short ? '3s' : `${Math.max(14, len / (i % 2 ? 520 : 760))}s`;
      p.style.animationDelay = short ? '0s' : `-${(i * 7) % 20}s`;
    });
  }

  /* ---------------- Section rings ---------------- */
  [].forEach(([sel, side]) => {
    const host = document.querySelector(sel); if (!host) return;
    const ring = document.createElement('div');
    ring.className = 'world-ring ' + side; ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<i></i><i></i><i></i>';
    host.prepend(ring);
  });

  /* ---------------- Loop ---------------- */
  let last = performance.now(), lastScroll = scrollY, t = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    const sy = scrollY, dS = sy - lastScroll; lastScroll = sy;

    // motherboard drifts vertically; glows shift with scroll
    board.style.backgroundPosition = `0 ${(-sy * 0.12 + t * 6).toFixed(1)}px`;
    glows[0].style.transform = `translate3d(0, ${(-sy * 0.05 % 400).toFixed(1)}px, 0)`;
    glows[1].style.transform = `translate3d(0, ${(Math.sin(sy / 1400) * 120).toFixed(1)}px, 0)`;
    glows[2].style.transform = `translate3d(${(Math.cos(sy / 1800) * 160).toFixed(1)}px, 0, 0)`;

    // floating components (parallax + slow rise + rotation)
    const span = H + 300;
    floaters.forEach((f) => {
      let y = (f.y * span - sy * f.depth * 0.35 - t * f.sp) % span; if (y < 0) y += span; y -= 150;
      const x = f.x * (W - f.size) + Math.sin(t * 0.25 + f.depth * 9) * 24;
      f.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(f.rot + t * f.rs).toFixed(1)}deg)`;
    });

    // particles
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      p.y -= p.v * dt + dS * p.d * 0.25; p.x += Math.sin(t * 0.6 + p.w) * 0.15;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } else if (p.y > H + 10) p.y = -10;
      ctx.globalAlpha = p.a * (0.7 + Math.sin(t * 2 + p.w) * 0.3);
      ctx.drawImage(p.img, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
    });
    // binary stream
    ctx.font = '500 12px "JetBrains Mono", monospace';
    bits.forEach((b, i) => {
      b.life += dt; b.y -= b.v * dt + dS * 0.1;
      const k = b.life / b.max; if (k >= 1) { bits[i] = newBit(false); bits[i].y = Math.random() * H; return; }
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.16;
      ctx.fillStyle = b.o ? '#F97316' : '#60A5FA';
      ctx.fillText(b.c, b.x, b.y);
      if (Math.random() < 0.01) b.c = b.c === '0' ? '1' : '0';
    });
    ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(frame);
  }

  resize();
  let rt;
  addEventListener('resize', () => { resize(); clearTimeout(rt); rt = setTimeout(buildSpine, 250); });
  addEventListener('load', () => { buildSpine(); setTimeout(buildSpine, 1500); });
  if (document.fonts) document.fonts.ready.then(buildSpine);
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(buildSpine, 300); }).observe(document.body);
  requestAnimationFrame(frame);
})();
