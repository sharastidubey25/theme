"""Generate design-html/01-home.html — Figma-safe (run: python3 -I gen_home_html.py <scratch> <out>).

Figma-safe rules: images inlined (PNG/JPEG data URIs), photo + overlay as separate
layers, no ::before/::after, no line-clamp / aspect-ratio / sticky / text-transform,
icons with explicit colours, flexbox only.
"""
import html
import json
import re
import sys
from urllib.parse import quote, urlparse, parse_qs

sys.path.insert(0, sys.argv[1])
from figma_safe import clamp, img  # noqa: E402

SP, OUT = sys.argv[1], sys.argv[2]
CDN = "https://cdn.fixpapa.com/"
e = html.escape

# Colours (lib/core/theme/app_colors.dart)
INK, INK2, INK3 = "#0B1220", "#1E293B", "#475569"
PRIMARY, PRIMARY2, PRIMARY3 = "#FF6A00", "#FF8A1F", "#FDBA74"
WHITE, GREEN = "#FFFFFF", "#16A34A"


def load(name):
    d = json.load(open(f"{SP}/{name}.json"))["data"]
    return d["items"] if isinstance(d, dict) else d


def inr(v):
    s = str(int(round(v)))
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts) + "," + tail
    return "₹" + s


ICON = {
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "bag": '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    "login": '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4M14 12H4"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "outward": '<path d="M7 17L17 7M9 7h8v8"/>',
    "heart": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    "cart": '<path d="M3 4h2l2.2 10.5h10.3L19.5 8H8"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    "recycle": '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-.9 1.8 1.8 0 0 1 0-1.8L7.2 9.5"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-.9 1.8 1.8 0 0 0 0-1.8l-1.2-2.1"/><path d="M14 16l-3 3 3 3"/><path d="M8.3 13.6L7.2 9.5 3.1 10.6"/><path d="M9.3 5.8l1.1-1.9A1.8 1.8 0 0 1 12 3a1.8 1.8 0 0 1 1.5.9l3.9 6.8"/><path d="M13.4 9.6l4.1 1.1 1.1-4.1"/>',
    "grid": '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
}


def icon(name, size=20, color=INK):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[name]}</svg>')


STAR = f'<svg width="13" height="13" viewBox="0 0 24 24"><path fill="{PRIMARY2}" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>'
PLAY = f'<svg width="26" height="26" viewBox="0 0 24 24"><path fill="{PRIMARY}" d="M8 5.5v13l10.5-6.5z"/></svg>'
PIN = '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#FFFFFF" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>'


def photo(src, overlay, max_w=800, pos="center"):
    """Photo + gradient as two separate layers (Figma drops stacked backgrounds)."""
    return (f'<img class="ph" src="{img(src, max_w)}" alt="" style="object-position:{pos}">'
            f'<div class="ov" style="background:{overlay}"></div>')


def eyebrow(text, color=None, dark=False):
    c = color or (PRIMARY3 if dark else "#E85D04")
    return f'<div class="eyebrow" style="color:{c}"><span class="eyebrow__bar" style="background:{c}"></span>{e(text.upper())}</div>'


def section_header(eb, title, hl=None, sub=None, view_all=True, dark=False):
    hl_html = f' <span class="hl">{e(hl)}</span>' if hl else ""
    sub_html = f'<p class="sh__sub" style="color:{"rgba(255,255,255,.7)" if dark else INK3}">{e(sub)}</p>' if sub else ""
    all_html = f'<div class="sh__all">View all {icon("arrow", 16, PRIMARY)}</div>' if view_all else ""
    return f"""
      <div class="sh">
        <div class="sh__text">
          {eyebrow(eb, dark=dark)}
          <h2 class="sh__title" style="color:{WHITE if dark else INK}">{e(title)}{hl_html}</h2>
          {sub_html}
        </div>
        {all_html}
      </div>"""


def product_card(p):
    gallery = [g for g in p.get("product_gallery") or [] if not g.lower().endswith(".avif")]
    src = CDN + "product_gallery/" + quote(gallery[0] if gallery else "default_image.png")
    cost, sell = p["cost_price"], p.get("effective_selling_price") or p["selling_price"]
    disc = p.get("discount_percent") or 0
    has_disc = disc > 0 and cost > sell
    rating = float(p.get("average_rating") or 0)
    disc_html = f'<div class="product__disc">-{round(disc)}%</div>' if has_disc else ""
    rating_html = f'<span class="product__rating">{STAR}{rating:.1f}</span>' if rating else ""
    return f"""
        <div class="product">
          <div class="product__well">
            <img class="product__img" src="{img(src, 280)}" alt="">
            {disc_html}
            <div class="product__fav">{icon('heart', 16, INK2)}</div>
          </div>
          <div class="product__body">
            <div class="product__meta"><span class="mono">{e(p.get('brand_name') or p.get('product_category_name') or '')}</span>{rating_html}</div>
            <p class="product__name">{e(clamp(p['product_name'], 44))}</p>
            <div class="product__foot">
              <div>
                <p class="product__mrp{'' if has_disc else ' product__mrp--none'}">{inr(cost) if has_disc else ''}</p>
                <p class="product__price">{inr(sell)}</p>
              </div>
              <div class="product__add">{icon('cart', 18, WHITE)}</div>
            </div>
          </div>
        </div>"""


def rail(items):
    return '<div class="rail">' + "".join(product_card(p) for p in items) + "</div>"


def yt_thumb(t):
    if t.get("video_thumbnail"):
        return CDN + "testimonial_video_thumbnail/" + quote(t["video_thumbnail"])
    u = urlparse(t.get("video_file") or "")
    vid = parse_qs(u.query).get("v", [None])[0] or (u.path.strip("/") if "youtu.be" in u.netloc else None)
    return f"https://img.youtube.com/vi/{vid}/mqdefault.jpg"


deal, refurb, new = load("p_deal"), load("p_refurbished"), load("p_new")
svc, tst, ban = load("svc"), load("tst"), load("ban")
max_disc = max((p.get("discount_percent") or 0) for p in refurb) if refurb else 0
banners = [CDN + "banners/" + quote(b.get("app_banner") or b["desktop_responsive_banner"]) for b in ban[:2]]

services = "".join(
    f'<div class="svc"><img class="svc__icon" src="{img(CDN + "category_logo/" + quote(s["icon"]), 96)}" alt="">'
    f'<p class="svc__label">{e(s["product_category_name"])}</p></div>' for s in svc)

cats = [("Laptop", "category-laptop.png"), ("Desktop", "category-desktop.png"), ("LED/LCD Monitor", "category-monitor.png"),
        ("Rack &amp; Tower Servers", "category-server.png"), ("CCTV", "category-cctv.png")]
cat_tiles = "".join(f'<div class="cat"><img class="cat__img" src="{img(src, 240)}" alt=""><p class="cat__label">{lbl}</p></div>'
                    for lbl, src in cats)

RENT_OV = "linear-gradient(0deg, rgba(11,18,32,.9) 0%, rgba(11,18,32,.5) 55%, rgba(11,18,32,.05) 100%)"
rent = [("Desktop", "photo-desktop.jpg"), ("Printer", "photo-printer.jpg"), ("Laptop", "photo-laptops.jpg"), ("Projector", "photo-projector.jpg")]
rent_tiles = "".join(
    f'<div class="rent">{photo(src, RENT_OV, 400)}<div class="rent__text"><p class="rent__eb">RENT</p>'
    f'<div class="rent__row"><p class="rent__name">{lbl}</p>{icon("arrow", 18, WHITE)}</div></div></div>' for lbl, src in rent)

VID_OV = "linear-gradient(180deg, rgba(11,18,32,0) 0%, rgba(11,18,32,.6) 100%)"
testimonials = "".join(
    f"""<div class="video"><div class="video__thumb">{photo(yt_thumb(t), VID_OV, 480)}<div class="video__play">{PLAY}</div></div>
          <p class="video__title">{e(clamp((t.get('about') or t.get('comments') or '').strip(), 56))}</p><p class="mono">{e(t.get('submitted_by') or '')}</p></div>"""
    for t in tst)

BRANDS = "/home/sharasti/theme/customer-app/assets/images/brands/"
brand_dots = "".join(
    '<div class="brand">' + re.sub(r"<title>.*?</title>", "", open(BRANDS + b + ".svg").read().strip())
    .replace("<svg ", '<svg width="20" height="20" ', 1) + "</div>"
    for b in ["hp", "dell", "lenovo", "epson", "brother", "acer"])

PROMO_OV = "linear-gradient(45deg, rgba(11,18,32,.95) 0%, rgba(11,18,32,.52) 55%, rgba(11,18,32,.05) 100%)"
SUPPORT_OV = "linear-gradient(90deg, rgba(11,18,32,.92) 0%, rgba(11,18,32,.5) 55%, rgba(11,18,32,.05) 100%)"
REPAIR_OV = "linear-gradient(90deg, #0B1220 0%, rgba(11,18,32,.6) 45%, rgba(11,18,32,0) 100%)"
GRAD_PRIMARY = "linear-gradient(135deg, #FF6A00 0%, #FF8A1F 70%, #FFA24D 100%)"
GRAD_DARK = "linear-gradient(160deg, #0B1220 0%, #111A2E 60%, #16254A 100%)"

CSS = f"""
  /* Tokens mirror lib/core/theme — values written out (no var()) so Figma reads them directly. */
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ background:#E5E7EB; font-family:'Inter',sans-serif; color:#1E293B; -webkit-font-smoothing:antialiased; }}
  svg {{ display:block; flex:none; }}
  .mono {{ font-family:'JetBrains Mono',monospace; font-size:10.5px; font-weight:500; line-height:14px; color:#475569; }}

  .screen {{ width:390px; margin:0 auto; background:#FFFFFF; display:flex; flex-direction:column; }}
  .gap {{ height:36px; flex:none; }}
  .pad {{ padding:0 20px; }}

  /* Header */
  .header {{ height:64px; display:flex; align-items:center; gap:12px; padding:0 20px; background:#FFFFFF; border-bottom:1px solid #E8EBF1; }}
  .header__logo {{ height:24px; width:126px; }}
  .header__spacer {{ flex:1; }}
  .icon-btn {{ width:40px; height:40px; border-radius:20px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; }}
  .login {{ height:37px; padding:0 16px 0 14px; border-radius:19px; background:#0B1220; display:flex; align-items:center; gap:6px;
           font-family:'Manrope',sans-serif; font-weight:700; font-size:13.5px; line-height:17px; color:#FFFFFF; }}

  /* Search */
  .search {{ margin:16px 20px 18px; height:50px; border-radius:25px; background:#F1F5F9; display:flex; align-items:center; gap:10px; padding:0 18px;
            font-size:14.5px; line-height:20px; color:#475569; }}

  /* Banner */
  .banner {{ display:flex; gap:12px; padding-left:25px; overflow:hidden; }}
  .banner__img {{ width:339px; height:137px; border-radius:20px; object-fit:cover; flex:none; }}
  .dots {{ display:flex; justify-content:center; gap:6px; margin-top:12px; }}
  .dot {{ width:6px; height:6px; border-radius:3px; background:#D5DBE5; }}
  .dot--on {{ width:20px; background:#FF6A00; }}

  /* Eyebrow + section header */
  .eyebrow {{ display:flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace; font-weight:500; font-size:11px; line-height:14px; letter-spacing:1.5px; }}
  .eyebrow__bar {{ width:18px; height:2px; border-radius:1px; flex:none; }}
  .sh {{ display:flex; align-items:flex-end; gap:10px; }}
  .sh__text {{ flex:1; display:flex; flex-direction:column; }}
  .sh__title {{ margin-top:8px; font-family:'Manrope',sans-serif; font-weight:800; font-size:22px; line-height:25px; letter-spacing:-0.44px; }}
  .hl {{ color:#FF6A00; }}
  .sh__sub {{ margin-top:4px; font-size:13px; line-height:19px; }}
  .sh__all {{ display:flex; align-items:center; gap:4px; padding-bottom:2px; font-family:'Manrope',sans-serif; font-weight:700; font-size:13.5px; line-height:17px; color:#FF6A00; white-space:nowrap; }}

  /* Buttons */
  .btn {{ height:40px; flex:none; padding:0 18px; border-radius:20px; display:flex; align-items:center; gap:8px; align-self:flex-start;
         font-family:'Manrope',sans-serif; font-weight:700; font-size:13.5px; line-height:17px; }}
  .btn--primary {{ background:{GRAD_PRIMARY}; color:#FFFFFF; box-shadow:0 10px 36px -8px rgba(255,138,31,.55); }}
  .btn--light {{ background:#FFFFFF; color:#0B1220; box-shadow:0 8px 24px -10px rgba(15,23,42,.10); }}
  .btn--green {{ height:42px; border-radius:21px; background:#16A34A; color:#FFFFFF; }}

  /* Photo layers */
  .ph {{ position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; }}
  .ov {{ position:absolute; left:0; top:0; width:100%; height:100%; }}
  .layer {{ position:relative; display:flex; flex-direction:column; }}

  /* Book a Repair */
  .repair {{ margin:0 20px; border-radius:24px; background:{GRAD_DARK}; overflow:hidden; display:flex; flex-direction:column; }}
  .repair__hero {{ position:relative; }}
  .repair__photo {{ position:absolute; right:0; top:0; bottom:0; width:175px; overflow:hidden; }}
  .repair__text {{ position:relative; min-height:236px; padding:22px 20px 20px; display:flex; flex-direction:column; justify-content:flex-end; }}
  .repair__title {{ margin-top:12px; font-family:'Manrope',sans-serif; font-weight:800; font-size:32px; line-height:34px; letter-spacing:-0.64px; color:#FFFFFF; }}
  .repair__desc {{ margin-top:10px; width:196px; font-size:13px; line-height:19.5px; color:rgba(255,255,255,.72); }}
  .repair__text .btn {{ margin-top:22px; }}
  .repair__rule {{ height:1px; margin:0 20px; background:rgba(255,255,255,.08); }}
  .repair__svc {{ padding:18px 20px 20px; }}
  .repair__svc-title {{ font-family:'Manrope',sans-serif; font-weight:700; font-size:17px; line-height:20px; letter-spacing:-0.34px; color:#FFFFFF; }}
  .svc-grid {{ margin-top:14px; display:flex; flex-wrap:wrap; gap:10px; }}
  .svc {{ width:96px; height:96px; border-radius:16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.09);
         display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:10px 6px; }}
  .svc__icon {{ width:36px; height:36px; }}
  .svc__label {{ font-size:11.5px; font-weight:500; line-height:14px; color:#FFFFFF; text-align:center; }}

  /* Product rail */
  .rail {{ display:flex; gap:12px; padding:0 20px; margin-top:16px; overflow:hidden; }}
  .product {{ width:172px; flex:none; padding:8px; border-radius:20px; border:1px solid #E8EBF1; background:#FFFFFF; }}
  .product__well {{ position:relative; width:154px; height:154px; border-radius:16px; background:#FFFFFF; }}
  .product__img {{ position:absolute; left:16px; top:16px; width:122px; height:122px; object-fit:contain; }}
  .product__disc {{ position:absolute; left:8px; top:8px; padding:3px 7px; border-radius:6px; background:#0B1220; color:#FFFFFF;
                   font-family:'JetBrains Mono',monospace; font-weight:500; font-size:10.5px; line-height:13px; }}
  .product__fav {{ position:absolute; right:6px; top:6px; width:28px; height:28px; border-radius:14px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; }}
  .product__body {{ padding:10px 4px 4px; }}
  .product__meta {{ display:flex; align-items:center; justify-content:space-between; }}
  .product__rating {{ display:flex; align-items:center; gap:2px; font-size:11.5px; font-weight:600; line-height:14px; color:#1E293B; }}
  .product__name {{ margin-top:4px; height:36px; overflow:hidden; font-size:13px; font-weight:500; line-height:18px; color:#0B1220; }}
  .product__foot {{ margin-top:8px; display:flex; align-items:flex-end; justify-content:space-between; }}
  .product__mrp {{ height:16px; font-size:11px; line-height:16px; color:#475569; text-decoration:line-through; }}
  .product__mrp--none {{ text-decoration:none; }}
  .product__price {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:16px; line-height:19px; letter-spacing:-0.32px; color:#0B1220; }}
  .product__add {{ width:36px; height:36px; border-radius:18px; background:{GRAD_PRIMARY}; display:flex; align-items:center; justify-content:center; }}

  /* Categories */
  .cat-grid {{ margin-top:16px; display:flex; flex-wrap:wrap; gap:10px; }}
  .cat {{ width:110px; height:112px; border-radius:16px; background:#FFFFFF; border:1px solid #E8EBF1; padding:12px 8px 10px;
         display:flex; flex-direction:column; align-items:center; gap:8px; }}
  .cat__img {{ width:92px; height:58px; object-fit:contain; }}
  .cat__label {{ font-size:11.5px; font-weight:600; line-height:14px; color:#0B1220; text-align:center; }}
  .cat--explore {{ background:#0B1220; border-color:#0B1220; align-items:flex-start; justify-content:space-between; padding:12px; }}
  .cat__round {{ width:32px; height:32px; border-radius:16px; background:{GRAD_PRIMARY}; display:flex; align-items:center; justify-content:center; }}
  .cat__explore {{ font-family:'Manrope',sans-serif; font-weight:700; font-size:13px; line-height:16px; color:#FFFFFF; }}

  /* Technical support */
  .support {{ position:relative; margin:0 20px; height:244px; border-radius:24px; overflow:hidden; }}
  .support__text {{ position:relative; height:244px; padding:20px; display:flex; flex-direction:column; }}
  .support__title {{ margin-top:12px; font-family:'Manrope',sans-serif; font-weight:800; font-size:26px; line-height:29px; letter-spacing:-0.52px; color:#FFFFFF; }}
  .support__desc {{ margin-top:8px; width:220px; font-size:12.5px; line-height:19px; color:rgba(255,255,255,.75); }}
  .support__text .btn {{ margin-top:auto; }}

  /* Promos */
  .promos {{ display:flex; gap:12px; padding:0 20px; overflow:hidden; }}
  .promo {{ position:relative; width:312px; height:184px; flex:none; border-radius:20px; overflow:hidden; }}
  .promo__text {{ position:relative; height:184px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; }}
  .promo__title {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:19px; line-height:23px; letter-spacing:-0.38px; color:#FFFFFF; }}
  .promo__link {{ margin-top:10px; display:flex; align-items:center; gap:4px; font-family:'Manrope',sans-serif; font-weight:700; font-size:13px; line-height:16px; color:#FDBA74; }}

  /* Rent */
  .rentbox {{ margin:0 20px; padding:20px; border-radius:24px; background:{GRAD_DARK}; }}
  .rent-grid {{ margin-top:18px; display:flex; flex-wrap:wrap; gap:10px; }}
  .rent {{ position:relative; width:150px; height:123px; border-radius:16px; overflow:hidden; }}
  .rent__text {{ position:relative; height:123px; padding:12px; display:flex; flex-direction:column; justify-content:flex-end; }}
  .rent__eb {{ font-family:'JetBrains Mono',monospace; font-weight:500; font-size:11px; line-height:14px; letter-spacing:1.5px; color:#FDBA74; }}
  .rent__row {{ margin-top:2px; display:flex; align-items:center; justify-content:space-between; }}
  .rent__name {{ font-family:'Manrope',sans-serif; font-weight:700; font-size:16px; line-height:19px; color:#FFFFFF; }}

  /* E-waste */
  .ewaste {{ position:relative; margin:0 20px; padding:20px; border-radius:24px; background:#F0FDF4; border:1px solid #D1FADF; overflow:hidden; }}
  .ewaste__img {{ position:absolute; right:-30px; bottom:-20px; width:190px; height:190px; border-radius:95px; object-fit:cover; opacity:.9; }}
  .ewaste__title {{ margin-top:12px; font-family:'Manrope',sans-serif; font-weight:800; font-size:24px; line-height:28px; letter-spacing:-0.48px; color:#0B1220; }}
  .ewaste__desc {{ margin-top:8px; width:180px; font-size:13px; line-height:19.5px; color:#475569; }}
  .ewaste .btn {{ margin-top:20px; }}

  /* Testimonials */
  .videos {{ display:flex; gap:12px; padding:0 20px; margin-top:16px; overflow:hidden; }}
  .video {{ width:232px; flex:none; }}
  .video__thumb {{ position:relative; height:132px; border-radius:16px; overflow:hidden; }}
  .video__play {{ position:absolute; left:94px; top:44px; width:44px; height:44px; border-radius:22px; background:#FFFFFF;
                 display:flex; align-items:center; justify-content:center; box-shadow:0 18px 40px -16px rgba(15,23,42,.16); }}
  .video__title {{ margin:10px 0 2px; height:36px; overflow:hidden; font-size:13px; font-weight:600; line-height:18px; color:#0B1220; }}

  /* Service centre finder */
  .centre {{ position:relative; margin:0 20px; padding:20px; border-radius:24px; overflow:hidden;
            background:linear-gradient(135deg, #FFFFFF 0%, #FFF4EC 100%); border:1px solid #E8EBF1; box-shadow:0 8px 24px -10px rgba(15,23,42,.10); }}
  .ring {{ position:absolute; border-radius:50%; border:1px solid rgba(255,106,0,.14); background:rgba(255,106,0,.03); }}
  .pin {{ position:absolute; right:28px; top:28px; width:44px; height:44px; border-radius:22px; background:{GRAD_PRIMARY};
         box-shadow:0 10px 36px -8px rgba(255,138,31,.55); display:flex; align-items:center; justify-content:center; }}
  .centre__title {{ margin-top:12px; font-family:'Manrope',sans-serif; font-weight:800; font-size:26px; line-height:29px; letter-spacing:-0.52px; color:#0B1220; }}
  .centre__desc {{ margin-top:6px; font-size:14px; line-height:21px; color:#475569; }}
  .finder {{ margin-top:18px; height:52px; border-radius:26px; background:#FFFFFF; border:1px solid #E8EBF1; display:flex; align-items:center; gap:10px; padding:0 5px 0 16px;
            font-size:14px; line-height:20px; color:#475569; }}
  .finder__text {{ flex:1; }}
  .finder__go {{ width:42px; height:42px; border-radius:21px; background:{GRAD_PRIMARY}; display:flex; align-items:center; justify-content:center; }}
  .brands {{ margin-top:18px; display:flex; align-items:center; gap:10px; }}
  .brands__dots {{ display:flex; padding-right:8px; }}
  .brand {{ width:38px; height:38px; margin-right:-8px; border-radius:19px; background:#FFFFFF; border:1.5px solid #E8EBF1; box-shadow:0 2px 6px rgba(15,23,42,.08);
           display:flex; align-items:center; justify-content:center; }}
  .brands__strong {{ font-size:13px; font-weight:700; line-height:17px; color:#0B1220; }}
  .brands__muted {{ font-size:12px; line-height:16px; color:#475569; }}

  /* Bottom nav */
  .tabbar {{ height:64px; display:flex; background:#FFFFFF; border-top:1px solid #E8EBF1; box-shadow:0 -8px 24px rgba(15,23,42,.06); }}
  .tab {{ flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
         font-family:'Manrope',sans-serif; font-weight:600; font-size:11.5px; line-height:14px; color:#475569; }}
  .tab__pill {{ width:52px; height:30px; border-radius:15px; display:flex; align-items:center; justify-content:center; }}
  .tab--on {{ color:#0B1220; font-weight:700; }}
  .tab--on .tab__pill {{ background:#FFF4EC; }}
"""

TAB_ICONS = [("grid", "Home", True), ("wrench", "Book Repair", False), ("recycle", "E-Waste", False), ("shield", "AMC", False)]
tabs = "".join(
    f'<div class="tab{" tab--on" if on else ""}"><div class="tab__pill">{icon(ic, 22, PRIMARY if on else INK3)}</div>{lbl}</div>'
    for ic, lbl, on in TAB_ICONS)
banner_imgs = "".join(f'<img class="banner__img" src="{img(b, 840)}" alt="">' for b in banners)
dots = "".join('<div class="dot dot--on"></div>' if i == 0 else '<div class="dot"></div>' for i in range(len(ban)))
refurb_hl = f"· up to {round(max_disc)}% off" if max_disc else None

doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FixPapa App — 01 Home</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<main class="screen" data-screen="Home">

  <header class="header">
    <div class="icon-btn">{icon('menu', 21)}</div>
    <img class="header__logo" src="{img('logo.png', 336)}" alt="FixPapa">
    <div class="header__spacer"></div>
    <div class="icon-btn">{icon('bag', 21)}</div>
    <div class="login">{icon('login', 17, WHITE)}Login</div>
  </header>

  <div class="search">{icon('search', 22, INK3)}Search laptops, printers, ink…</div>

  <section>
    <div class="banner">{banner_imgs}</div>
    <div class="dots">{dots}</div>
  </section>

  <div style="height:28px"></div>

  <section class="repair">
    <div class="repair__hero">
      <div class="repair__photo">{photo('photo-repair.jpg', REPAIR_OV, 420, '62% center')}</div>
      <div class="repair__text">
        {eyebrow('Repair · Doorstep', dark=True)}
        <h2 class="repair__title">Book a<br><span style="color:{PRIMARY2}">Repair</span></h2>
        <p class="repair__desc">Comprehensive repair for a wide range of brands, all under one roof.</p>
        <div class="btn btn--primary">Book now {icon('arrow', 17, WHITE)}</div>
      </div>
    </div>
    <div class="repair__rule"></div>
    <div class="repair__svc">
      <h3 class="repair__svc-title">Frequently booked <span style="color:{PRIMARY2}">services</span></h3>
      <div class="svc-grid">{services}</div>
    </div>
  </section>

  <div class="gap"></div>
  <section>
    <div class="pad">{section_header('Limited time', 'Deal of the', 'day', 'Offers closing soon')}</div>
    {rail(deal)}
  </section>

  <div class="gap"></div>
  <section class="pad">
    {section_header('Shop', 'Shop by', 'category', view_all=False)}
    <div class="cat-grid">{cat_tiles}
      <div class="cat cat--explore"><div class="cat__round">{icon('outward', 18, WHITE)}</div><p class="cat__explore">Explore all<br>products</p></div>
    </div>
  </section>

  <div class="gap"></div>
  <section class="support">
    {photo('photo-support.jpg', SUPPORT_OV, 700)}
    <div class="support__text">
      {eyebrow('Technical support', dark=True)}
      <h2 class="support__title">Fixed on a call,<br>from <span style="color:{PRIMARY2}">₹5</span></h2>
      <p class="support__desc">Skilled technicians help you install and configure a range of devices and systems.</p>
      <div class="btn btn--light">Know more {icon('arrow', 17)}</div>
    </div>
  </section>

  <div class="gap"></div>
  <section>
    <div class="pad">{section_header('Certified pre-owned', 'Refurbished', refurb_hl)}</div>
    {rail(refurb)}
  </section>

  <div class="gap"></div>
  <section class="promos">
    <div class="promo">{photo('photo-tech.jpg', PROMO_OV, 624)}
      <div class="promo__text">{eyebrow('Installation', dark=True)}
        <div><h3 class="promo__title">Seamless setup for your technology</h3><div class="promo__link">Know more {icon('arrow', 16, PRIMARY3)}</div></div></div>
    </div>
    <div class="promo">{photo('photo-amc.jpg', PROMO_OV, 624)}
      <div class="promo__text">{eyebrow('AMC packages', dark=True)}
        <div><h3 class="promo__title">Exclusive discounts on non-comprehensive IT support</h3><div class="promo__link">Know more {icon('arrow', 16, PRIMARY3)}</div></div></div>
    </div>
  </section>

  <div class="gap"></div>
  <section class="rentbox">
    {section_header('Rental', 'Why buy when you can', 'rent?', 'A huge collection of IT gadgets, available on rent.', view_all=False, dark=True)}
    <div class="rent-grid">{rent_tiles}</div>
  </section>

  <div class="gap"></div>
  <section>
    <div class="pad">{section_header('Fresh arrivals', 'New', 'products')}</div>
    {rail(new)}
  </section>

  <div class="gap"></div>
  <section class="ewaste">
    <img class="ewaste__img" src="{img('photo-ewaste.jpg', 380)}" alt="">
    <div class="layer">
      {eyebrow('Sustainability', color=GREEN)}
      <h2 class="ewaste__title">Unlock value from<br>your <span style="color:{GREEN}">e-waste</span></h2>
      <p class="ewaste__desc">Responsible e-waste management, made easy. Sell and benefit while you contribute to a sustainable future.</p>
      <div class="btn btn--green">{icon('recycle', 18, WHITE)}Sell your e-waste</div>
    </div>
  </section>

  <div class="gap"></div>
  <section>
    <div class="pad">{section_header('Testimonials', 'Few words from our', 'clients', view_all=False)}</div>
    <div class="videos">{testimonials}</div>
  </section>

  <div class="gap"></div>
  <section class="centre">
    <div class="ring" style="right:-70px;top:-70px;width:240px;height:240px"></div>
    <div class="ring" style="right:-36px;top:-36px;width:173px;height:173px"></div>
    <div class="ring" style="right:-3px;top:-3px;width:106px;height:106px"></div>
    <div class="pin">{PIN}</div>
    <div class="layer">
      {eyebrow('Service centres')}
      <h2 class="centre__title">Got into <span style="color:{PRIMARY}">trouble?</span></h2>
      <p class="centre__desc">Find an authorised centre near you.</p>
      <div class="finder">{icon('search', 21, INK3)}<span class="finder__text">Search by brand or city</span><div class="finder__go">{icon('arrow', 20, WHITE)}</div></div>
      <div class="brands">
        <div class="brands__dots">{brand_dots}</div>
        <div><p class="brands__strong">100+ brands</p><p class="brands__muted">across India</p></div>
      </div>
    </div>
  </section>

  <div style="height:32px"></div>

  <nav class="tabbar">{tabs}</nav>
</main>
</body>
</html>
"""
open(OUT, "w").write(doc)
print(OUT, f"{len(doc) / 1024:.0f} KB")
