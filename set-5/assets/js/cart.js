/* FixPapa · Set 5 · Shopping cart (loaded on every page).
   window.FPCart = { items, add, setQty, remove, clear, count, totals, inr }. Items live in localStorage key `fp-cart`
   as { id, name, meta, art, vb, mrp, price, qty, rent? }; a rental line (rental-list.js) carries rent = { months, monthly, base }
   and its price is monthly × months. `art` is the id of the product-art sprite symbol shown on the card.
   Every product card's "Add to Cart" button (`.card.product .add`) adds the item and opens cart.html. The header cart
   icon gets a live count badge. On cart.html (`#cartPage`) it renders the items, quantity controls and payment details.
   Checkout hands off to checkout.html. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'fp-cart', MAX = 10;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const inr = (n) => '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (el) => (el ? parseFloat(el.textContent.replace(/[^\d.]/g, '')) || 0 : 0);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  let items = read();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} emit(); };
  const subs = [];
  const emit = () => { badge(); subs.forEach((f) => f(items)); };

  const find = (id) => items.find((i) => i.id === id);
  const add = (p, qty = 1) => {
    const hit = find(p.id);
    if (hit) hit.qty = Math.min(MAX, hit.qty + qty); else items.push({ ...p, qty: Math.min(MAX, qty) });
    save();
  };
  const setQty = (id, q) => { const it = find(id); if (!it) return; it.qty = Math.max(1, Math.min(MAX, q)); save(); };
  const remove = (id) => { items = items.filter((i) => i.id !== id); save(); };
  const clear = () => { items = []; save(); };
  const count = () => items.reduce((n, i) => n + i.qty, 0);
  const totals = () => {
    const subtotal = items.reduce((n, i) => n + Math.max(i.mrp, i.price) * i.qty, 0);
    const total = items.reduce((n, i) => n + i.price * i.qty, 0);
    return { subtotal, discount: subtotal - total, total };
  };

  /* product card → cart item (works for every card markup on the site: rf-* refurbished/products cards and the plain cards) */
  const fromCard = (card) => {
    const name = ($('h3', card) || {}).textContent || 'Product';
    const use = $('.media > svg use', card), svg = use && use.closest('svg');
    const price = money($('.rf-now', card) || $('.price', card));
    const mrp = money($('.rf-was s', card) || $('.mrp', card)) || price;
    const meta = $('.rf-meta span', card) || $('.cond', card);
    return {
      id: card.dataset.id ? 'p' + card.dataset.id : slug(name), name: name.trim(), meta: meta ? meta.textContent.trim() : '',
      art: use ? use.getAttribute('href').slice(1) : '', vb: svg ? svg.getAttribute('viewBox') : '0 0 120 120', mrp, price
    };
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card.product .add'); if (!btn) return;
    e.preventDefault();
    add(fromCard(btn.closest('.card.product')));
    if (page) { toast('Added to your cart'); return; }
    location.href = 'cart.html';
  });

  /* header cart icon: link + count badge */
  const badge = () => {
    const n = count();
    $$('a.icon-btn[aria-label^="Cart"]').forEach((a) => {
      a.setAttribute('href', 'cart.html'); a.classList.add('cart-btn');
      let b = $('.cart-badge', a);
      if (!b) { b = document.createElement('span'); b.className = 'cart-badge'; a.append(b); }
      b.textContent = n > 99 ? '99+' : n; b.hidden = !n;
      a.setAttribute('aria-label', n ? `Cart, ${n} item${n > 1 ? 's' : ''}` : 'Cart');
    });
  };
  addEventListener('storage', (e) => { if (e.key === KEY) { items = read(); emit(); } });

  let toastT;
  const toast = (msg, undo) => {
    let t = $('#cartToast');
    if (!t) { t = document.createElement('div'); t.id = 'cartToast'; t.className = 'ct-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">Undo</button>' : ''}`;
    if (undo) $('button', t).onclick = () => { undo(); t.classList.remove('show'); };
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4000);
  };

  window.FPCart = { get items() { return items.slice(); }, add, setQty, remove, clear, count, totals, inr, subscribe: (f) => subs.push(f) };

  /* ---------------- cart.html ---------------- */
  const page = $('#cartPage');
  if (page) {
    const list = $('#ctList'), empty = $('#ctEmpty'), layout = $('#ctLayout');
    const row = (i) => `
      <article class="ct-item" data-id="${esc(i.id)}">
        <div class="ct-art">${i.art ? `<svg viewBox="${esc(i.vb)}"><use href="#${esc(i.art)}"/></svg>` : '<svg width="40" height="40"><use href="#i-box"/></svg>'}</div>
        <div class="ct-info">
          <h3>${esc(i.name)}</h3>
          ${i.rent ? `<span class="ct-rent">Rental · ${i.rent.months} ${i.rent.months === 1 ? 'month' : 'months'} · ${inr(i.rent.monthly)}/month</span>` : ''}
          <div class="ct-price">${i.mrp > i.price ? `<s>${inr(i.mrp)}</s>` : ''}<b>${inr(i.price)}</b></div>
        </div>
        <div class="ct-act">
          <div class="ct-qty" role="group" aria-label="Quantity">
            <button type="button" data-q="-1" aria-label="Decrease quantity"${i.qty <= 1 ? ' disabled' : ''}>−</button>
            <input type="number" min="1" max="${MAX}" value="${i.qty}" inputmode="numeric" aria-label="Quantity">
            <button type="button" data-q="1" aria-label="Increase quantity"${i.qty >= MAX ? ' disabled' : ''}>+</button>
          </div>
          <b class="ct-line">${inr(i.price * i.qty)}</b>
          <button type="button" class="ct-del" data-del aria-label="Remove ${esc(i.name)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
        </div>
      </article>`;

    const render = () => {
      const n = count(), t = totals();
      layout.hidden = !items.length; empty.hidden = !!items.length;
      $('#ctCount').textContent = n ? `(${n} item${n > 1 ? 's' : ''})` : '';
      list.innerHTML = items.map(row).join('');
      $('#ctSub').textContent = inr(t.subtotal);
      $('#ctDisc').textContent = '-' + inr(t.discount);
      $('#ctTotal').textContent = inr(t.total);
      $('#ctBarTotal').textContent = inr(t.total);
    };

    list.addEventListener('click', (e) => {
      const it = e.target.closest('.ct-item'); if (!it) return;
      const id = it.dataset.id, cur = find(id); if (!cur) return;
      const q = e.target.closest('[data-q]');
      if (q) { setQty(id, cur.qty + +q.dataset.q); return; }
      if (e.target.closest('[data-del]')) {
        const at = items.indexOf(cur), copy = { ...cur };
        it.classList.add('out');
        setTimeout(() => { remove(id); toast(`Removed ${copy.name.length > 40 ? copy.name.slice(0, 40) + '…' : copy.name}`, () => { items.splice(Math.min(at, items.length), 0, copy); save(); }); }, 220);
      }
    });
    list.addEventListener('change', (e) => {
      const inp = e.target.closest('.ct-qty input'); if (!inp) return;
      setQty(inp.closest('.ct-item').dataset.id, parseInt(inp.value, 10) || 1);
    });

    $$('[data-checkout]').forEach((b) => b.addEventListener('click', (e) => { if (!items.length) e.preventDefault(); }));
    subs.push(render);
    render();
  }
  badge();
})();
