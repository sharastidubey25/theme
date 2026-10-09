/* =========================================================
   FixPapa · Set 2 — Cinematic 3D laptop hero (Three.js + GSAP)
   Exploded view → magnetic assembly → lid close/open → screen on → loop
   ========================================================= */
(async () => {
const THREE = await import('three');
const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');

const stage = document.getElementById('h3Stage');
const canvas = document.getElementById('laptopCanvas');
const labelsEl = document.getElementById('h3Labels');
const phaseEl = document.getElementById('h3Phase');
const stepsEl = document.getElementById('h3Steps');
const gsap = window.gsap;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 1024px)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('h3Fallback').style.display = 'grid';
  return;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !small;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const camTarget = new THREE.Vector3(0, 0.85, 0);

/* ---------------- Lights: blue one side, orange the other ---------------- */
scene.add(new THREE.HemisphereLight(0x9ec5ff, 0x0b1220, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(2, 7, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
key.shadow.radius = 6;
scene.add(key);
const blue = new THREE.PointLight(0x3b82f6, 38, 16, 2); blue.position.set(-4.6, 2.6, 1.8); scene.add(blue);
const orange = new THREE.PointLight(0xf97316, 30, 16, 2); orange.position.set(4.6, 1.4, -0.8); scene.add(orange);
const rim = new THREE.DirectionalLight(0x93c5fd, 0.6); rim.position.set(-2, 3, -6); scene.add(rim);

/* ---------------- Helpers ---------------- */
const canvasTex = (w, h, draw) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};
const radial = (inner, outer = 'rgba(0,0,0,0)') => canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, inner); r.addColorStop(1, outer);
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const std = (color, metalness = 0.2, roughness = 0.5, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

/* ---------------- Materials ---------------- */
const alu = std(0xaeb6c2, 0.85, 0.3);
const aluDark = std(0x5b6474, 0.8, 0.35);
const black = std(0x0e131c, 0.3, 0.45);
const bezel = std(0x05070b, 0.2, 0.3);
const metal = std(0xd6dbe2, 1, 0.22);
const gold = std(0xd4a24c, 1, 0.3);
const copper = std(0xc47a44, 1, 0.26);
const ramPcb = std(0x0f6b3a, 0.2, 0.5);
const fanMat = std(0x1a202c, 0.4, 0.45);
const bladeMat = std(0x334155, 0.3, 0.4);
const keyMat = std(0x0d1118, 0.2, 0.62);

const pcbTex = canvasTex(1024, 360, (g, w, h) => {
  g.fillStyle = '#0b2a6b'; g.fillRect(0, 0, w, h);
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  g.lineWidth = 3; g.strokeStyle = 'rgba(59,130,246,.75)';
  for (let i = 0; i < 70; i++) {
    let x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { if (k % 2) y += (rnd() - .5) * 160; else x += (rnd() - .5) * 260; g.lineTo(x, y); }
    g.stroke(); g.fillStyle = '#e8b04b'; g.fillRect(x - 5, y - 5, 10, 10);
  }
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '600 22px monospace'; g.fillText('FIXPAPA  MB-FX01', 40, h - 30);
  for (let i = 0; i < 40; i++) { g.fillStyle = '#111827'; g.fillRect(rnd() * w, rnd() * h, 14 + rnd() * 20, 8 + rnd() * 10); }
});
const pcbMat = std(0xffffff, 0.25, 0.55, { map: pcbTex });

/* ---------------- Screen (canvas texture) ---------------- */
const SW = 1024, SH = 640;
const sCanvas = document.createElement('canvas'); sCanvas.width = SW; sCanvas.height = SH;
const sg = sCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(sCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
const screenMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0, roughness: 0.3, metalness: 0, envMapIntensity: 0.25 });
const screen = { mode: 'off', t: 0, prog: 0, power: 0 };

const rr = (x, y, w, h, r) => { sg.beginPath(); sg.roundRect(x, y, w, h, r); };
function drawScreen(time) {
  const { mode, prog } = screen;
  sg.globalAlpha = 1;
  if (mode === 'off') { sg.fillStyle = '#02040a'; sg.fillRect(0, 0, SW, SH); return; }
  const bg = sg.createLinearGradient(0, 0, SW, SH);
  if (mode === 'logo') {
    bg.addColorStop(0, '#0b1220'); bg.addColorStop(1, '#16307a'); sg.fillStyle = bg; sg.fillRect(0, 0, SW, SH);
    const glow = sg.createRadialGradient(SW / 2, SH / 2, 0, SW / 2, SH / 2, 380); glow.addColorStop(0, 'rgba(37,99,235,.55)'); glow.addColorStop(1, 'rgba(37,99,235,0)');
    sg.fillStyle = glow; sg.fillRect(0, 0, SW, SH);
    sg.font = '800 118px Manrope, Inter, sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
    const a = Math.min(1, prog * 2.2); sg.globalAlpha = a;
    sg.shadowColor = 'rgba(96,165,250,.9)'; sg.shadowBlur = 40;
    const fx = 'Fi', x = 'X', pp = 'Papa';
    const wF = sg.measureText(fx).width, wX = sg.measureText(x).width, wP = sg.measureText(pp).width, tot = wF + wX + wP;
    let cx = SW / 2 - tot / 2; sg.textAlign = 'left';
    sg.fillStyle = '#ffffff'; sg.fillText(fx, cx, SH / 2 - 20); cx += wF;
    sg.fillStyle = '#F97316'; sg.shadowColor = 'rgba(249,115,22,.9)'; sg.fillText(x, cx, SH / 2 - 20); cx += wX;
    sg.fillStyle = '#ffffff'; sg.shadowColor = 'rgba(96,165,250,.9)'; sg.fillText(pp, cx, SH / 2 - 20);
    sg.shadowBlur = 0; sg.textAlign = 'center';
    sg.font = '500 26px Inter, sans-serif'; sg.fillStyle = 'rgba(203,213,225,.85)'; sg.fillText('Trusted Electronics & Gadget Repair', SW / 2, SH / 2 + 62);
    rr(SW / 2 - 140, SH / 2 + 110, 280, 8, 4); sg.fillStyle = 'rgba(255,255,255,.12)'; sg.fill();
    rr(SW / 2 - 140, SH / 2 + 110, 280 * Math.min(1, prog), 8, 4); sg.fillStyle = '#F97316'; sg.fill();
    sg.globalAlpha = 1; return;
  }
  bg.addColorStop(0, '#0b1220'); bg.addColorStop(1, '#0f1b36'); sg.fillStyle = bg; sg.fillRect(0, 0, SW, SH);
  // top bar
  sg.fillStyle = 'rgba(255,255,255,.04)'; sg.fillRect(0, 0, SW, 64);
  sg.textAlign = 'left'; sg.textBaseline = 'middle';
  sg.font = '800 30px Manrope, Inter, sans-serif'; sg.fillStyle = '#fff'; sg.fillText('Fi', 36, 33);
  sg.fillStyle = '#F97316'; sg.fillText('X', 36 + sg.measureText('Fi').width, 33);
  sg.fillStyle = '#fff'; sg.fillText('Papa', 36 + sg.measureText('FiX').width, 33);
  sg.font = '500 20px JetBrains Mono, monospace'; sg.fillStyle = '#60A5FA';
  sg.fillText(mode === 'diag' ? 'DEVICE HEALTH · DIAGNOSTICS' : 'AMC & INVENTORY MANAGEMENT', 250, 34);
  sg.fillStyle = '#22C55E'; sg.beginPath(); sg.arc(SW - 44, 32, 8 + Math.sin(time * 6) * 2, 0, 7); sg.fill();

  if (mode === 'diag') {
    const items = ['CPU', 'Memory', 'Storage', 'Cooling fan', 'Battery', 'Display'];
    items.forEach((name, i) => {
      const y = 110 + i * 70, local = Math.max(0, Math.min(1, prog * items.length - i));
      rr(36, y, 560, 54, 12); sg.fillStyle = 'rgba(255,255,255,.04)'; sg.fill();
      sg.font = '600 22px Inter, sans-serif'; sg.fillStyle = '#E2E8F0'; sg.fillText(name, 60, y + 27);
      rr(250, y + 22, 230, 10, 5); sg.fillStyle = 'rgba(255,255,255,.08)'; sg.fill();
      rr(250, y + 22, 230 * local, 10, 5); sg.fillStyle = local >= 1 ? '#22C55E' : '#3B82F6'; sg.fill();
      sg.font = '600 18px JetBrains Mono, monospace'; sg.fillStyle = local >= 1 ? '#4ADE80' : '#93C5FD';
      sg.fillText(local >= 1 ? 'OK' : local > 0 ? Math.round(local * 100) + '%' : '—', 510, y + 28);
    });
    // big ring
    const cx = 810, cy = 330, r = 130;
    sg.lineWidth = 22; sg.strokeStyle = 'rgba(255,255,255,.08)'; sg.beginPath(); sg.arc(cx, cy, r, 0, Math.PI * 2); sg.stroke();
    const grad = sg.createLinearGradient(cx - r, cy, cx + r, cy); grad.addColorStop(0, '#1D4ED8'); grad.addColorStop(1, '#F97316');
    sg.strokeStyle = grad; sg.lineCap = 'round'; sg.beginPath(); sg.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); sg.stroke();
    sg.textAlign = 'center'; sg.font = '800 64px Manrope, Inter, sans-serif'; sg.fillStyle = '#fff'; sg.fillText(Math.round(prog * 100) + '%', cx, cy - 6);
    sg.font = '500 20px Inter, sans-serif'; sg.fillStyle = '#94A3B8'; sg.fillText('Repair progress', cx, cy + 46);
    sg.font = '600 20px Inter, sans-serif'; sg.fillStyle = prog >= 1 ? '#4ADE80' : '#FDBA74';
    sg.fillText(prog >= 1 ? 'All systems OK' : 'Scanning…', cx, cy + 190);
    return;
  }
  // inventory dashboard
  const kpis = [['Assets', Math.round(1284 * prog).toLocaleString('en-IN')], ['In stock', Math.round(342 * prog)], ['Open repairs', Math.round(18 * prog)]];
  kpis.forEach(([l, v], i) => {
    const x = 36 + i * 322; rr(x, 92, 300, 120, 16); sg.fillStyle = 'rgba(255,255,255,.05)'; sg.fill();
    sg.textAlign = 'left'; sg.font = '500 18px JetBrains Mono, monospace'; sg.fillStyle = '#64748B'; sg.fillText(l.toUpperCase(), x + 22, 124);
    sg.font = '800 48px Manrope, Inter, sans-serif'; sg.fillStyle = i === 2 ? '#FDBA74' : '#fff'; sg.fillText(String(v), x + 22, 176);
  });
  rr(36, 232, 600, 370, 16); sg.fillStyle = 'rgba(255,255,255,.04)'; sg.fill();
  const bars = [0.55, 0.78, 0.46, 0.92, 0.66, 0.84, 0.58, 0.74];
  bars.forEach((b, i) => {
    const h = 280 * b * Math.min(1, prog * 1.4 - i * 0.05);
    const x = 70 + i * 70; const g2 = sg.createLinearGradient(0, 580 - h, 0, 580);
    g2.addColorStop(0, i === 3 ? '#FB923C' : '#60A5FA'); g2.addColorStop(1, i === 3 ? 'rgba(249,115,22,.2)' : 'rgba(37,99,235,.2)');
    rr(x, 580 - Math.max(0, h), 40, Math.max(0, h), 8); sg.fillStyle = g2; sg.fill();
  });
  rr(656, 232, 332, 370, 16); sg.fillStyle = 'rgba(255,255,255,.04)'; sg.fill();
  ['Laptop · Keyboard', 'Desktop · SMPS', 'Printer · Drum', 'UPS · Battery'].forEach((n, i) => {
    const y = 270 + i * 82; sg.textAlign = 'left'; sg.font = '600 19px Inter, sans-serif'; sg.fillStyle = '#E2E8F0'; sg.fillText(n, 680, y);
    const p = Math.min(1, prog * (1.6 - i * 0.2));
    rr(680, y + 22, 280, 8, 4); sg.fillStyle = 'rgba(255,255,255,.08)'; sg.fill();
    rr(680, y + 22, 280 * p, 8, 4); sg.fillStyle = p >= 1 ? '#22C55E' : '#3B82F6'; sg.fill();
  });
}

/* ---------------- Build the laptop ---------------- */
const W = 3.2, D = 2.2;
const rig = new THREE.Group();        // scroll scale
const tilt = new THREE.Group();       // mouse tilt
const laptop = new THREE.Group();     // timeline rotation
rig.add(tilt); tilt.add(laptop); scene.add(rig);

const parts = [];
function part(label, home, exPos, exRot = [0, 0, 0], build) {
  const g = new THREE.Group();
  build(g);
  g.userData = { label, home: new THREE.Vector3(...home), homeRot: new THREE.Euler(0, 0, 0), ex: new THREE.Vector3(...exPos), exRot: new THREE.Euler(...exRot), k: 0, seed: parts.length };
  g.position.copy(g.userData.ex); g.rotation.copy(g.userData.exRot);
  laptop.add(g); parts.push(g);
  return g;
}

// 1 · Bottom panel
part('Bottom panel', [0, 0.03, 0], [0, -0.62, 0], [0, 0, 0.03], (g) => {
  g.add(mesh(new RoundedBoxGeometry(W, 0.06, D, 4, 0.05), aluDark));
  [[-1.4, -0.95], [1.4, -0.95], [-1.4, 0.95], [1.4, 0.95]].forEach(([x, z]) => g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), black, x, -0.035, z)));
  for (let i = 0; i < 18; i++) g.add(mesh(new THREE.BoxGeometry(0.04, 0.005, 0.5), black, -0.9 + i * 0.1, 0.031, -0.55));
});
// 2 · Screws
part('Screws', [0, -0.02, 0], [0, -1.05, 0], [0, 0.4, 0], (g) => {
  const head = new THREE.CylinderGeometry(0.05, 0.05, 0.025, 16), shaft = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 10);
  [[-1.45, -1], [0, -1], [1.45, -1], [-1.45, 1], [0, 1], [1.45, 1], [-0.8, 0], [0.8, 0]].forEach(([x, z]) => {
    const s = new THREE.Group(); s.add(mesh(head, metal)); s.add(mesh(shaft, metal, 0, 0.06, 0));
    const slot = mesh(new THREE.BoxGeometry(0.07, 0.01, 0.012), black, 0, -0.013, 0); s.add(slot);
    s.position.set(x, 0, z); s.userData.spin = true; g.add(s);
  });
});
// 3 · Battery
part('Battery', [0, 0.08, 0.5], [-0.15, -0.2, 0.5], [0, -0.08, 0], (g) => {
  g.add(mesh(new RoundedBoxGeometry(2.4, 0.045, 0.78, 2, 0.02), std(0x1f2430, 0.3, 0.55)));
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(0.72, 0.006, 0.66), std(0x2b3242, 0.4, 0.45), -0.8 + i * 0.8, 0.025, 0));
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.008, 0.12), std(0x22c55e, 0.1, 0.4, { emissive: 0x22c55e, emissiveIntensity: 0.6 }), 0.95, 0.028, -0.26));
});
// 4 · Motherboard
part('Motherboard', [0, 0.112, -0.45], [0, 0.2, -0.45], [0, 0, 0], (g) => {
  const b = mesh(new THREE.BoxGeometry(2.9, 0.022, 1.02), [black, black, pcbMat, black, black, black]); g.add(b);
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(0.08, 0.03, 0.12), metal, -1.35, 0.02, -0.4 + i * 0.16));
});
// 5 · RAM sticks
part('RAM', [-1.05, 0.135, -0.4], [-0.9, 0.55, -0.4], [0, 0.25, 0.05], (g) => {
  [-0.14, 0.14].forEach((z, j) => {
    const s = new THREE.Group();
    s.add(mesh(new THREE.BoxGeometry(0.9, 0.014, 0.22), ramPcb));
    for (let i = 0; i < 4; i++) s.add(mesh(new THREE.BoxGeometry(0.16, 0.012, 0.12), black, -0.3 + i * 0.2, 0.012, 0));
    s.add(mesh(new THREE.BoxGeometry(0.86, 0.004, 0.02), gold, 0, 0, 0.11));
    s.position.set(0, j * 0.02, z); g.add(s);
  });
});
// 6 · CPU
part('CPU', [-0.25, 0.135, -0.5], [-0.3, 0.88, -0.2], [0.1, 0.3, -0.06], (g) => {
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.02, 0.36), std(0x14532d, 0.2, 0.5)));
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.022, 0.26), metal, 0, 0.018, 0));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial('rgba(249,115,22,1)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8 }));
  glow.scale.set(0.9, 0.9, 1); glow.position.y = 0.05; glow.userData.cpuGlow = true; g.add(glow);
});
// 7 · GPU
part('GPU', [0.38, 0.135, -0.5], [0.55, 1.12, -0.35], [-0.08, -0.35, 0.05], (g) => {
  g.add(mesh(new THREE.BoxGeometry(0.44, 0.018, 0.38), std(0x1e3a8a, 0.2, 0.5)));
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.022, 0.24), black, 0, 0.015, 0));
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(0.07, 0.014, 0.07), black, -0.16 + (i % 2) * 0.32, 0.012, -0.13 + Math.floor(i / 2) * 0.26));
});
// 8 · SSD
part('SSD', [1.0, 0.132, -0.12], [1.15, 1.36, 0.1], [0, 0.4, 0.08], (g) => {
  g.add(mesh(new THREE.BoxGeometry(0.62, 0.014, 0.17), black));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.01, 0.12), std(0x334155, 0.3, 0.4), -0.14, 0.01, 0));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.01, 0.12), std(0x334155, 0.3, 0.4), 0.1, 0.01, 0));
  g.add(mesh(new THREE.BoxGeometry(0.08, 0.012, 0.08), std(0xf97316, 0.2, 0.4, { emissive: 0xf97316, emissiveIntensity: 0.4 }), 0.26, 0.01, 0));
});
// 9 · Heat pipes
part('Heat pipes', [0, 0.165, 0], [0.1, 1.6, 0], [0, -0.1, 0], (g) => {
  const mk = (pts) => g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 48, 0.026, 10), copper));
  mk([[-0.25, 0, -0.44], [0.38, 0, -0.44], [0.8, 0, -0.6], [1.05, 0, -0.62]]);
  mk([[-0.25, 0, -0.56], [0.38, 0, -0.56], [0.75, 0, -0.78], [1.05, 0, -0.8]]);
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.018, 0.42), copper, -0.25, -0.012, -0.5));
});
// 10 · Cooling fan
let fanBlades;
part('Cooling fan', [1.12, 0.155, -0.72], [1.35, 1.85, -0.5], [0.12, 0, -0.1], (g) => {
  g.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 40, 1, true), fanMat));
  g.add(mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.006, 40), fanMat, 0, -0.024, 0));
  fanBlades = new THREE.Group();
  for (let i = 0; i < 11; i++) { const b = mesh(new THREE.BoxGeometry(0.2, 0.008, 0.05), bladeMat, 0.14, 0, 0); b.rotation.x = 0.4; const p = new THREE.Group(); p.add(b); p.rotation.y = (i / 11) * Math.PI * 2; fanBlades.add(p); }
  fanBlades.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24), std(0xf97316, 0.3, 0.4, { emissive: 0xf97316, emissiveIntensity: 0.35 })));
  g.add(fanBlades);
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(0.012, 0.045, 0.3), metal, 0.33 + i * 0.022, 0, 0));
});
// 11 · Keyboard deck
part('Keyboard', [0, 0.21, 0], [0, 2.3, 0.05], [0, 0, 0], (g) => {
  g.add(mesh(new RoundedBoxGeometry(W, 0.05, D, 4, 0.05), alu));
  const kGeo = new RoundedBoxGeometry(0.17, 0.025, 0.15, 2, 0.02);
  const cols = 14, rows = 6, kx = 0.185, kz = 0.163;
  const keys = new THREE.InstancedMesh(kGeo, keyMat, cols * rows); keys.castShadow = true;
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    m4.makeTranslation(-(cols - 1) * kx / 2 + c * kx, 0.034, -0.93 + r * kz);
    keys.setMatrixAt(n, m4); keys.setColorAt(n, col.set(r === 3 && c === 13 ? 0xf97316 : 0xffffff)); n++;
  }
  g.add(keys);
  g.add(mesh(new RoundedBoxGeometry(1.1, 0.01, 0.66, 2, 0.02), std(0x9aa3b0, 0.8, 0.22), 0, 0.024, 0.58));
  const hinge = mesh(new THREE.CylinderGeometry(0.05, 0.05, W - 0.6, 20), aluDark, 0, 0.03, -D / 2 + 0.04); hinge.rotation.z = Math.PI / 2; g.add(hinge);
});
// 12 · Screen (lid, pivot on hinge)
const LID = { open: -0.26, closed: Math.PI / 2 - 0.04 };
const lidAngle = { v: 1.0 };
const screenLight = new THREE.PointLight(0x60a5fa, 0, 4.5, 2);
const lid = part('Screen', [0, 0.235, -D / 2 + 0.04], [0, 2.85, D / 2 - 0.02], [-Math.PI / 2, 0, 0], (g) => {
  const H = 2.1;
  g.add(mesh(new RoundedBoxGeometry(W, H, 0.05, 4, 0.04), alu, 0, H / 2, 0));
  g.add(mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.04), bezel, 0, H / 2, 0.027));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.22, H - 0.26), screenMat); scr.position.set(0, H / 2 + 0.03, 0.028); g.add(scr);
  const cam = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.005, 16), std(0x1e293b, 0.4, 0.3), 0, H - 0.08, 0.03); cam.rotation.x = Math.PI / 2; g.add(cam);
  screenLight.position.set(0, H / 2, 0.9); g.add(screenLight);
  // subtle logo on the back of the lid
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 112, (c, w, h) => { c.font = '800 88px Manrope, Inter, sans-serif'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('Fi', 20, h / 2); c.fillStyle = '#F97316'; c.fillText('X', 20 + c.measureText('Fi').width, h / 2); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('Papa', 20 + c.measureText('FiX').width, h / 2); }), transparent: true }));
  logo.position.set(0, H / 2, -0.027); logo.rotation.y = Math.PI; g.add(logo);
});

/* ---------------- Floor, glow, particles ---------------- */
const FLOOR_Y = -1.3;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.4 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.receiveShadow = true; rig.add(floor);
const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: radial('rgba(37,99,235,.55)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
pool.rotation.x = -Math.PI / 2; pool.position.y = FLOOR_Y + 0.01; rig.add(pool);

const PN = small ? 50 : 120;
const pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSpd = new Float32Array(PN);
const cB = new THREE.Color(0x60a5fa), cO = new THREE.Color(0xf97316);
for (let i = 0; i < PN; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 12; pPos[i * 3 + 1] = Math.random() * 7 - 2; pPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
  const c = Math.random() < 0.28 ? cO : cB; pCol.set([c.r, c.g, c.b], i * 3); pSpd[i] = 0.1 + Math.random() * 0.35;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, map: radial('rgba(255,255,255,1)') }));
particles.material.opacity = 0.45;
scene.add(particles);

/* ---------------- Impact glow on snap ---------------- */
const flashTex = radial('rgba(255,255,255,1)');
const ringGeo = new THREE.RingGeometry(0.9, 1, 64);
const worldPos = new THREE.Vector3();
function impact(p) {
  p.getWorldPosition(worldPos);
  const col = p.userData.seed % 2 ? 0xf97316 : 0x60a5fa;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  s.position.copy(worldPos); scene.add(s);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  ring.position.copy(worldPos); ring.rotation.x = -Math.PI / 2; scene.add(ring);
  gsap.fromTo(s.scale, { x: 0.2, y: 0.2 }, { x: 1.8, y: 1.8, duration: 0.6, ease: 'power2.out' });
  gsap.to(s.material, { opacity: 0, duration: 0.6, ease: 'power2.in', onComplete: () => { scene.remove(s); s.material.dispose(); } });
  gsap.fromTo(ring.scale, { x: 0.1, y: 0.1, z: 0.1 }, { x: 1.6, y: 1.6, z: 1.6, duration: 0.7, ease: 'power3.out' });
  gsap.to(ring.material, { opacity: 0, duration: 0.7, ease: 'power2.in', onComplete: () => { scene.remove(ring); ring.material.dispose(); } });
  gsap.fromTo(rig.position, { y: -0.015 }, { y: 0, duration: 0.25, ease: 'power2.out' });
}

/* ---------------- Labels (HTML overlay, burger-style callouts) ---------------- */
const labelOrder = ['Screen', 'Keyboard', 'Cooling fan', 'Heat pipes', 'SSD', 'GPU', 'CPU', 'RAM', 'Motherboard', 'Battery', 'Bottom panel', 'Screws'];
const labels = labelOrder.map((name, i) => {
  const p = parts.find(q => q.userData.label === name);
  const el = document.createElement('div');
  el.className = 'h3-lbl ' + (i % 2 ? 'r' : 'l');
  el.innerHTML = `<span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t">${name}</span><i class="ln"></i>`;
  el.style.transitionDelay = (i * 45) + 'ms';
  labelsEl.appendChild(el);
  return { p, el, line: el.querySelector('.ln'), side: i % 2 ? 1 : -1 };
});
const setLabels = (on) => labelsEl.classList.toggle('show', on);
const phase = (txt, step) => {
  phaseEl.textContent = txt;
  [...stepsEl.children].forEach((d, i) => d.classList.toggle('on', i <= step));
};

/* ---------------- Master loop timeline ---------------- */
const assemblyOrder = ['Bottom panel', 'Screws', 'Battery', 'Motherboard', 'RAM', 'CPU', 'GPU', 'SSD', 'Heat pipes', 'Cooling fan', 'Keyboard'].map(n => parts.find(p => p.userData.label === n));
const view = { rotY: -0.62, rotX: 0.06, fan: 0.4 };

function buildLoop() {
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power3.inOut' } });
  tl.call(() => { phase('Exploded view', 0); setLabels(true); screen.mode = 'off'; })
    .to(view, { rotY: -0.42, duration: 3, ease: 'sine.inOut' }, 0)
    .call(() => { setLabels(false); phase('Assembling', 1); }, null, 2.6);
  assemblyOrder.forEach((p, i) => {
    tl.to(p.userData, { k: 1, duration: 1.1, ease: 'power4.in', onComplete: () => impact(p) }, 2.7 + i * 0.26);
  });
  const lidIn = 2.7 + assemblyOrder.length * 0.26 + 0.5;
  tl.to(lid.userData, { k: 1, duration: 1, ease: 'power3.inOut', onComplete: () => impact(lid) }, lidIn)
    .fromTo(lidAngle, { v: 1.0 }, { v: 1.0, duration: 0.01 }, lidIn)
    .to(view, { rotY: -0.3, rotX: 0.1, duration: 1.4, ease: 'sine.inOut' }, lidIn)
    // closes slightly…
    .to(lidAngle, { v: LID.closed, duration: 0.7, ease: 'power2.inOut' }, lidIn + 1.1)
    // …then opens toward the user
    .call(() => phase('Opening', 2), null, lidIn + 1.9)
    .to(view, { rotY: -0.08, rotX: 0.02, duration: 1.8, ease: 'power3.inOut' }, lidIn + 1.9)
    .to(lidAngle, { v: LID.open, duration: 1.6, ease: 'power3.out' }, lidIn + 2.0)
    // screen powers on
    .call(() => { phase('Screen on · FixPapa', 3); screen.mode = 'logo'; screen.prog = 0; }, null, lidIn + 3.2)
    .to(screen, { power: 1, duration: 0.5, ease: 'power2.out' }, lidIn + 3.2)
    .to(view, { fan: 1, duration: 0.8 }, lidIn + 3.2)
    .to(screen, { prog: 1, duration: 1.3, ease: 'power1.inOut' }, lidIn + 3.3)
    .call(() => { phase('Diagnostics · Repair progress', 3); screen.mode = 'diag'; screen.prog = 0; }, null, lidIn + 4.8)
    .to(screen, { prog: 1, duration: 2.4, ease: 'power1.inOut' }, lidIn + 4.85)
    .call(() => { phase('Inventory dashboard', 3); screen.mode = 'dash'; screen.prog = 0; }, null, lidIn + 7.6)
    .to(screen, { prog: 1, duration: 1.4, ease: 'power2.out' }, lidIn + 7.65)
    // power down & explode again
    .to(screen, { power: 0, duration: 0.5, ease: 'power2.in' }, lidIn + 10)
    .to(view, { fan: 0.4, duration: 0.8 }, lidIn + 10)
    .call(() => { screen.mode = 'off'; phase('Exploded view', 0); }, null, lidIn + 10.5)
    .to(lidAngle, { v: 1.0, duration: 0.8, ease: 'power2.inOut' }, lidIn + 10.4)
    .to(view, { rotY: -0.62, rotX: 0.06, duration: 1.8, ease: 'sine.inOut' }, lidIn + 10.6)
    .to([lid.userData, ...[...assemblyOrder].reverse().map(p => p.userData)], { k: 0, duration: 1.3, stagger: 0.06, ease: 'power3.inOut' }, lidIn + 10.8)
    .call(() => setLabels(true), null, lidIn + 11.8)
    .to({}, { duration: 0.6 });
  return tl;
}

/* ---------------- Mouse / scroll / resize ---------------- */
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
const hero = document.getElementById('hero');
if (matchMedia('(pointer:fine)').matches && !reduce) {
  addEventListener('mousemove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
  document.addEventListener('mouseleave', () => { mouse.x = 0; mouse.y = 0; });
}
/* The laptop lives behind the whole site: move the stage out of the hero into a
   fixed layer (above the world background, below all content). It is fully lit in
   the hero ("focus") and dims to a quiet background loop everywhere else. */
document.body.insertBefore(stage, document.querySelector('main'));
stage.classList.add('is-global');
const spacer = document.getElementById('h3Spacer');
const hud = stage.querySelector('.h3-hud');
let scrollP = 0, focus = 1;
function updateFocus() {
  const vh = innerHeight;
  let base = 0.12;
  if (innerWidth <= 1024 && spacer) {
    // mobile: the laptop scrolls up with its slot in the hero, then parks
    // in the centre of the screen and fades into a quiet background loop
    const r = spacer.getBoundingClientRect();
    const c = r.top + r.height / 2 - vh / 2;
    stage.style.transform = `translate3d(0, ${Math.max(0, c).toFixed(1)}px, 0)`;
    focus = c > 0 ? 1 : THREE.MathUtils.clamp(1 + c / (vh * 0.45), 0, 1);
    base = 0.05;
  } else {
    stage.style.transform = '';
    focus = THREE.MathUtils.clamp(1 - scrollY / (hero.offsetHeight * 0.75), 0, 1);
  }
  scrollP = 1 - focus;
  const eased = focus * focus * (3 - 2 * focus);
  stage.style.opacity = (base + (1 - base) * eased).toFixed(3);
  labelsEl.style.opacity = hud.style.opacity = Math.max(0, eased * 1.4 - 0.4).toFixed(3);
}
addEventListener('scroll', updateFocus, { passive: true });
addEventListener('resize', updateFocus);

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const dist = w / h < 0.9 ? 11.5 : w / h < 1.15 ? 10.4 : 9.6;
  camera.position.set(0, 2.5, dist);
  camera.lookAt(camTarget);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------------- Render loop ---------------- */
const clock = new THREE.Clock();
const tmpV = new THREE.Vector3(), homeQ = new THREE.Quaternion(), exQ = new THREE.Quaternion();
let visible = true, loop;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (loop) visible ? loop.resume() : loop.pause(); });

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

  // parts: lerp between exploded pose and home pose, plus float while exploded
  parts.forEach((p) => {
    const u = p.userData, k = u.k, f = 1 - k;
    p.position.lerpVectors(u.ex, u.home, k);
    p.position.y += Math.sin(t * 1.3 + u.seed * 0.9) * 0.05 * f;
    const home = p === lid ? new THREE.Euler(lidAngle.v, 0, 0) : u.homeRot;
    homeQ.setFromEuler(home); exQ.setFromEuler(u.exRot);
    p.quaternion.slerpQuaternions(exQ, homeQ, k);
    if (f > 0.001) { p.rotation.z += Math.sin(t * 0.9 + u.seed) * 0.03 * f; p.rotation.x += Math.cos(t * 0.8 + u.seed) * 0.02 * f; }
  });
  parts[1].children.forEach(s => { if (s.userData.spin) s.rotation.y += dt * 3 * (1 - parts[1].userData.k); });
  fanBlades.rotation.y -= dt * (4 + view.fan * 22);

  // laptop pose (timeline) + mouse tilt (smoothed)
  mouse.sx += (mouse.x - mouse.sx) * 0.06; mouse.sy += (mouse.y - mouse.sy) * 0.06;
  laptop.rotation.set(view.rotX, view.rotY, 0);
  tilt.rotation.set(mouse.sy * 0.22, mouse.sx * 0.45, 0);
  const s = 1 - scrollP * 0.22;
  rig.scale.setScalar(s * (small ? 0.92 : 1));
  rig.position.x = 0;
  // stack is taller when exploded: recentre vertically
  const avgK = parts.reduce((a, p) => a + p.userData.k, 0) / parts.length;
  laptop.position.y = THREE.MathUtils.lerp(-0.35, 0, avgK);
  laptop.scale.setScalar(THREE.MathUtils.lerp(0.78, 1, avgK));

  // lights follow the cursor → moving reflections
  blue.position.set(-4.6 + mouse.sx * 2.4, 2.6 - mouse.sy * 1.5, 1.8);
  orange.position.set(4.6 + mouse.sx * 2.4, 1.4 - mouse.sy * 1.2, -0.8);
  key.position.x = 2 + mouse.sx * 3;

  // screen
  screenMat.emissiveIntensity = screen.power * (1.15 + Math.sin(t * 40) * 0.03 * (screen.power < 0.95 ? 1 : 0));
  screenLight.intensity = screen.power * 7;
  if (screen.mode !== 'off' || screenMat.emissiveIntensity > 0) { drawScreen(t); screenTex.needsUpdate = true; }
  parts.forEach(p => p.children.forEach(c => { if (c.userData.cpuGlow) c.material.opacity = (0.45 + Math.sin(t * 3) * 0.2) * (1 - p.userData.k * 0.9); }));

  // particles drift upward and lean with the mouse
  const pa = pGeo.attributes.position.array;
  for (let i = 0; i < PN; i++) { pa[i * 3 + 1] += pSpd[i] * dt; if (pa[i * 3 + 1] > 5) pa[i * 3 + 1] = -2; }
  pGeo.attributes.position.needsUpdate = true;
  particles.rotation.y = mouse.sx * 0.35; particles.rotation.x = mouse.sy * 0.15;

  camera.position.x = mouse.sx * 0.5;
  camera.position.y = 2.5 - scrollP * 0.5 - mouse.sy * 0.3;
  tilt.rotation.y += scrollY * 0.00035;   // the laptop slowly turns as the page scrolls
  camera.lookAt(camTarget);

  // labels follow their parts on screen
  if (labelsEl.classList.contains('show')) {
    const w = stage.clientWidth, h = stage.clientHeight, cx = w / 2, col = w < 640 ? w / 2 - 92 : Math.min(w * 0.33, 270);
    labels.forEach((L) => {
      L.p.getWorldPosition(tmpV); tmpV.project(camera);
      L.px = (tmpV.x * 0.5 + 0.5) * w; L.py = L.y = (-tmpV.y * 0.5 + 0.5) * h;
    });
    // keep callouts on each side at least 38px apart
    [-1, 1].forEach((side) => {
      const col2 = labels.filter(L => L.side === side).sort((a, b) => a.py - b.py);
      for (let i = 1; i < col2.length; i++) col2[i].y = Math.max(col2[i].py, col2[i - 1].y + 38);
    });
    labels.forEach(({ el, line, side, px, y }) => {
      const lx = cx + side * col;
      el.style.transform = `translate(${lx}px, ${y}px)`;
      line.style.width = Math.max(10, Math.abs(px - lx) - 16) + 'px';
    });
  }
  renderer.render(scene, camera);
}

/* ---------------- Start ---------------- */
if (reduce) {
  parts.forEach(p => { p.userData.k = 1; });
  lidAngle.v = LID.open; view.rotY = -0.08; view.rotX = 0.02;
  screen.mode = 'dash'; screen.prog = 1; screen.power = 1;
  phase('Inventory dashboard', 3);
} else {
  loop = buildLoop();
}
updateFocus();
frame();
})().catch((e) => { console.error('3D hero failed:', e); const f = document.getElementById('h3Fallback'); if (f) f.style.display = 'grid'; });
