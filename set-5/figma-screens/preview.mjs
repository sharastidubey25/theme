// Screenshot every .fig-screen inside a bundle (what Figma will receive), at 40% (phones 80%), to check it before uploading.
//   node figma-screens/preview.mjs figma-screens/_b.html <out-dir>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';

const [bundle, outDir] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'prev-'))}`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
let ws, seq = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params }));
});
try {
  let targets;
  for (let i = 0; i < 50 && !targets; i++) {
    await sleep(200);
    targets = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).catch(() => null);
  }
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data), p = pending.get(m.id);
    if (p) { pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  };
  await send('Page.enable');
  await send('Page.navigate', { url: `http://localhost:8000/${relative(process.cwd(), bundle)}` });
  await sleep(4000);
  const { result } = await send('Runtime.evaluate', { returnByValue: true, expression:
    `[...document.querySelectorAll('.fig-screen')].map(s => { const r = s.getBoundingClientRect(); return { name: s.dataset.name, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })` });
  mkdirSync(outDir, { recursive: true });
  for (const [i, s] of result.value.entries()) {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: s.x, y: s.y, width: s.w, height: s.h, scale: s.w < 768 ? 0.8 : 0.4 } });
    const f = join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
    writeFileSync(f, Buffer.from(shot.data, 'base64'));
    console.log(`${f}  ${Math.round(s.w)}×${Math.round(s.h)}  ${s.name}`);
  }
} finally {
  ws?.close(); chrome.kill();
}
