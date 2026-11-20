// Freeze a live Set 5 page (after its JS and intro animations have run) into a static screen file for Figma.
// Drives real Chrome over the DevTools protocol (Node 22+, no packages): loads the page, scrolls through it so
// every scroll-triggered reveal and lazy image fires, waits in real time, runs optional actions (--js, e.g. click
// a button to open the booking popup), then saves the DOM without scripts, with videos swapped for their posters.
// Needs the local server: python3 -m http.server 8000 (from set-5/).
//
//   node figma-screens/snap.mjs index.html figma-screens/03-homepage/01-homepage-desktop.html "Screen 01 · Homepage · Desktop"
//   options: --height 900 (fixed frame height)  --css "…" (extra CSS)  --js "…" (run before saving; may be async)
//            --wait 9000 (ms to settle after load)  --width 1440 (390 = phone: 390×844 touch viewport)
//            --pre "page.html|js"  (open another page first and run js there, e.g. to fill the cart in localStorage)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const argv = process.argv.slice(2), pos = [], opt = { width: 1440, wait: 9000, css: '', js: '' };
for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (opt[argv[i].slice(2)] = argv[++i]) : pos.push(argv[i]);
const [page, out, title] = pos, width = +opt.width, phone = width < 768, vh = phone ? 844 : 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'snap-'))}`, `--window-size=${width},${vh}`, 'about:blank'], { stdio: 'ignore' });

let ws, seq = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

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
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height: vh, deviceScaleFactor: 1, mobile: phone });
  if (phone) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (opt.pre) {
    const [prePage, preJs] = opt.pre.split(/\|(.*)/s);
    await send('Page.navigate', { url: `http://localhost:8000/${prePage}` });
    await sleep(2500);
    await evaluate(`(async () => { ${preJs} })()`);
  }
  await send('Page.navigate', { url: `http://localhost:8000/${page}` });
  await sleep(2500);
  // scroll through the whole page so reveals, counters and lazy images fire, then back to the top
  await evaluate(`(async () => { const s = (ms) => new Promise(r => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await s(120); }
    scrollTo(0, document.documentElement.scrollHeight); await s(800); scrollTo(0, 0); })()`);
  await sleep(+opt.wait);
  if (opt.js) await evaluate(`(async () => { ${opt.js} })()`);
  await sleep(600);
  // the frame's own CSS goes into the page before freezing, so whatever it hides is removed below too
  const h = opt.height ? `min-height:${opt.height}px;height:${opt.height}px;overflow:hidden;` : '';
  const css = '*,*::before,*::after{animation:none!important;transition:none!important}' +
    `body{${h}position:relative}.topbar{position:absolute}` +
    // assistant launcher/panel, toasts and the video lightbox are overlays, not part of the page frame
    '.fpa-root,.cart-toast,.vx-modal{display:none!important}' + opt.css;
  // freeze: stop GSAP, settle the hero headline, inline lazy video posters
  await evaluate(`(() => {
    window.gsap && gsap.globalTimeline.pause();
    const st = document.createElement('style'); st.textContent = ${JSON.stringify(css)}; document.head.append(st);
    const t = document.getElementById('typed'); if (t) t.textContent = 'at Your Doorstep';
    // header as in the live screenshot: the screw standing on the logo's "i", a cart count badge
    const sc = document.getElementById('hlScrew');
    if (sc) {
      ['hlI', 'hlBody', 'hlHeadG', 'hlThreadsIn'].forEach(id => { const n = document.getElementById(id); n && n.removeAttribute('transform'); n && n.removeAttribute('style'); });
      ['hlGlow', 'hlSlotGlow', 'hlPool'].forEach(id => { const n = document.getElementById(id); n && n.setAttribute('opacity', '0'); n && n.removeAttribute('style'); });
      sc.removeAttribute('style'); sc.setAttribute('opacity', '1'); sc.setAttribute('transform', 'translate(34.5 2)');
    }
    const cart = document.querySelector('.topbar a[href="cart.html"]');
    if (cart) {
      let b = cart.querySelector('.cart-badge');
      if (!b) { b = document.createElement('span'); b.className = 'cart-badge'; cart.append(b); }
      if (b.hidden || !b.textContent.trim()) { b.hidden = false; b.textContent = '6'; }
      cart.style.position = 'relative';
    }
    document.querySelectorAll('video').forEach(v => {
      const p = v.getAttribute('poster'); if (!p) return v.remove();
      const img = document.createElement('img'); img.src = p; img.className = v.className; img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover'; v.replaceWith(img);
    });
    document.querySelectorAll('img[loading=lazy]').forEach(i => i.removeAttribute('loading'));
    // displayed width ×2, so the bundler can shrink big photos to what the frame needs
    document.querySelectorAll('img').forEach(i => { const w = Math.ceil(i.getBoundingClientRect().width * 2); if (w) i.setAttribute('data-fw', w); });
    // Figma's importer ignores [hidden] and closed <details>: drop everything not rendered (svg defs/symbols stay)
    [...document.body.querySelectorAll('*')].filter(el => el.isConnected && !el.closest('svg defs, svg symbol')
      && !(el.ownerSVGElement && el.tagName !== 'svg') && getComputedStyle(el).display === 'none').forEach(el => el.remove());
    // position:fixed would float over the other screens of a bundle: pin it to this frame instead
    [...document.body.querySelectorAll('*')].filter(el => !el.ownerSVGElement && getComputedStyle(el).position === 'fixed')
      .forEach(el => el.style.setProperty('position', 'absolute', 'important'));
    document.querySelectorAll('details:not([open])').forEach(d => [...d.children].forEach(c => c.tagName !== 'SUMMARY' && c.remove()));
    // fixed-height frame: whatever starts below its bottom edge would only be hidden layers in Figma
    const H = ${+opt.height || 0};
    if (H) [...document.body.querySelectorAll('*')].filter(el => el.isConnected && !el.ownerSVGElement
      && el.getBoundingClientRect().top + scrollY >= H && getComputedStyle(el).position !== 'fixed').forEach(el => el.remove());
    // typed values live in DOM properties; write them into attributes so the saved HTML shows them
    document.querySelectorAll('input').forEach(i => {
      if (i.type === 'checkbox' || i.type === 'radio') i.toggleAttribute('checked', i.checked);
      else if (i.type !== 'file') i.setAttribute('value', i.value);
    });
    document.querySelectorAll('textarea').forEach(t => { t.textContent = t.value; });
    document.querySelectorAll('select').forEach(s => [...s.options].forEach(o => o.toggleAttribute('selected', o.selected)));
    document.querySelectorAll('script').forEach(s => s.remove());
  })()`);
  let html = '<!doctype html>\n' + await evaluate('document.documentElement.outerHTML');
  html = html.replace('<head>', '<head>\n<base href="../../">')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`${out}: ${Math.round(html.length / 1e3)} KB`);
} finally {
  ws?.close(); chrome.kill();
}
