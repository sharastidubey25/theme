"""Generate design-html/01-home-v2.html — minimal home redesign (Urban Company / Cashify feel).

Run: python3 -I gen_home_v2.py <generators dir> <out>
Figma-safe: inlined images, flexbox only, no pseudo elements / sticky / line-clamp.
"""
import html
import json
import sys
from urllib.parse import quote

sys.path.insert(0, sys.argv[1])
from figma_safe import img  # noqa: E402

SP, OUT = sys.argv[1], sys.argv[2]
CDN = "https://cdn.fixpapa.com/"
e = html.escape

# Website palette (lib/core/theme/app_colors.dart)
INK, INK2, INK3, MUTED = "#0B1220", "#1E293B", "#475569", "#94A3B8"
OR, OR_SOFT, LINE, BG2 = "#FF6A00", "#FFF4EC", "#EEF0F4", "#F6F7F9"
GREEN = "#16A34A"


def load(name):
    d = json.load(open(f"{SP}/{name}.json"))["data"]
    return d["items"] if isinstance(d, dict) else d


def inr(v):
    s = str(int(round(v)))
    if len(s) > 3:
        head, tail, parts = s[:-3], s[-3:], []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts) + "," + tail
    return "₹" + s


P = {
    "pin": '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    "down": '<path d="M7 10l5 5 5-5"/>',
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    "cart": '<path d="M3 4h2l2.2 10.5h10.3L19.5 8H8"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    "right": '<path d="M9 6l6 6-6 6"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    "user": '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    "star": '<path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"/>',
    "home": '<path d="M4 11l8-6.5 8 6.5V20h-5v-5.5H9V20H4z"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    "bag": '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    "recycle": '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.5"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1"/><path d="M14 16l-3 3 3 3"/><path d="M8.3 13.6L7.2 9.5 3.1 10.6"/><path d="M9.3 5.8l1.1-1.9a1.8 1.8 0 0 1 3.1 0l3.9 6.8"/><path d="M13.4 9.6l4.1 1.1 1.1-4.1"/>',
    "headset": '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3.5" y="13" width="4" height="6" rx="1.5"/><rect x="16.5" y="13" width="4" height="6" rx="1.5"/><path d="M18.5 19c0 1.2-1.5 2-4 2h-1.5"/>',
    "doc": '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    "laptop": '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18.5h18"/>',
    "desktop": '<rect x="3.5" y="4" width="17" height="11.5" rx="1.5"/><path d="M9 20h6M12 15.5V20"/>',
    "printer": '<path d="M7 9V4h10v5"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.5"/><path d="M7 14h10v6H7z"/>',
    "cctv": '<path d="M3.5 8.5l13-3.5 1.6 5.8-13 3.5z"/><path d="M18 8l3-.8M8 13.5l1 3.5H4.5M4.5 14v6"/>',
    "server": '<rect x="4.5" y="3.5" width="15" height="7" rx="1.5"/><rect x="4.5" y="13.5" width="15" height="7" rx="1.5"/><path d="M8 7h.01M8 17h.01M12 7h4M12 17h4"/>',
    "heart": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
}


def ic(name, size=20, color=INK2, sw=1.8, fill="none"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{P[name]}</svg>')


# ---------- data ----------
svc = load("svc")[:8]
deals = load("p_deal")[:6]
refurb = load("p_refurbished")[:4]
new = load("p_new")[:4]


def pimg(p, w=300):
    g = [x for x in p.get("product_gallery") or [] if not x.lower().endswith(".avif")]
    return img(CDN + "product_gallery/" + quote(g[0] if g else "default_image.png"), w)


SHORT = {"CCTV Repair": "CCTV", "Desktop Repair": "Desktop", "Laptop Repair": "Laptop",
         "Printer Repair": "Printer", "Server Repair": "Server"}
MEDIA = "/home/sharasti/theme/set-5/assets/media/"
tiles = "".join(
    f'<div class="tile"><div class="tile__ph"><img src="{img(src, 240)}" alt=""></div><div class="tile__t">{t}</div></div>'
    for src, t in (("photo-laptops.jpg", "Laptop"), ("photo-desktop.jpg", "Desktop"), ("photo-printer.jpg", "Printer"),
                   ("photo-cctv.jpg", "CCTV camera"), ("photo-tech.jpg", "Server"), ("photo-projector.jpg", "Projector")))


HELP = [("repair", "Book a Repair"), ("refurbished", "Refurbished"), ("health", "Device Health"), ("amc", "AMC &amp; Inventory"),
        ("ewaste", "E-Waste Recycling"), ("support", "Technical Support"), ("warranty", "Check Your Warranty"), ("it", "IT Services"),
        ("centers", "Find Service Centers"), ("rental", "Rental"), ("openbox", "Open Box Deals"), ("newproduct", "New Product")]
HELP_DIR = "/home/sharasti/theme/customer-app/assets/images/help/"
help_tiles = "".join(f'<div class="hp"><div class="hp__ph"><img src="{img(HELP_DIR + k + ".jpg", 160)}" alt=""></div><div class="hp__t">{t}</div></div>' for k, t in HELP)


def card(p):
    sp, mrp = p["selling_price"], p["cost_price"]
    off = round((1 - sp / mrp) * 100) if mrp and mrp > sp else 0
    badge = f'<div class="pc__off">{off}% off</div>' if off else ""
    strike = f'<span class="pc__mrp">{inr(mrp)}</span>' if off else ""
    import re
    name = re.sub(r"\(\s*Refurbished\s*\)", "", p["product_name"], flags=re.I).strip()
    name = name if len(name) < 40 else name[:38].rstrip() + "…"
    return (f'<div class="pc"><div class="pc__img"><img src="{pimg(p)}" alt="">{badge}</div>'
            f'<div class="pc__brand">{e(p.get("brand_name") or "")}</div>'
            f'<div class="pc__name">{e(name)}</div>'
            f'<div class="pc__price"><span class="pc__sp">{inr(sp)}</span>{strike}</div></div>')


deal_cards = "".join(card(p) for p in deals)
refurb_cards = "".join(card(p) for p in refurb)
new_cards = "".join(card(p) for p in new)
# "How a repair works" + "Brands we repair" — same content as _HowItWorks / _BrandsWeRepair in home_screen.dart
import base64  # noqa: E402
HOW = [("Book in a minute", "Pick your device, brand and problem"),
       ("Engineer visits", "In the 2-hour slot you choose"),
       ("Pay after the visit", "Cash, once your device is checked")]
how_rows = "".join(
    f'<div class="how__r"><div class="how__rail"><div class="how__n">{i + 1}</div>{"<i></i>" if i < 2 else ""}</div>'
    f'<div class="how__b"><div class="how__t">{t}</div><div class="how__s">{d}</div></div></div>' for i, (t, d) in enumerate(HOW))
BRANDS = ["dell", "hp", "lenovo", "apple", "asus", "acer", "epson", "brother"]
BR_DIR = "/home/sharasti/theme/customer-app/assets/images/brands/"
brand_tiles = "".join(
    f'<div class="bt"><img src="data:image/svg+xml;base64,{base64.b64encode(open(BR_DIR + b + ".svg", "rb").read()).decode()}" alt=""></div>' for b in BRANDS)
# rental categories — same list as lib/features/home/presentation/home_screen.dart _RentRail
RENT = [("rent-laptop.jpg", "Laptop", "laptop"), ("rent-desktop.jpg", "Desktop", "desktop"),
        ("rent-printer.jpg", "Printer", "printer"), ("rent-projector.jpg", "Projector", "projector")]
rent_cards = "".join(
    f'<div class="rc"><div class="rc__ph"><img src="{img("/home/sharasti/theme/set-5/assets/media/" + f, 320)}" alt=""><div class="rc__tag">RENT</div></div>'
    f'<div class="rc__t">{t}</div><div class="rc__s">Monthly plans</div></div>' for f, t, _ in RENT)

page = f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=390">
<title>Home · Minimal</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#E5E7EB; font-family:'Inter',sans-serif; color:{INK2}; -webkit-font-smoothing:antialiased; display:flex; justify-content:center; padding:24px 0; }}
.screen {{ width:390px; background:#FFFFFF; display:flex; flex-direction:column; position:relative; overflow:hidden; }}
.h {{ font-family:'Manrope',sans-serif; font-weight:800; color:{INK}; }}

.status {{ height:44px; padding:0 24px; display:flex; align-items:center; justify-content:space-between; font-weight:600; font-size:15px; color:{INK}; }}
.top {{ padding:6px 20px 0; display:flex; align-items:center; justify-content:space-between; }}
.loc {{ display:flex; flex-direction:column; gap:2px; }}
.loc__a {{ display:flex; align-items:center; gap:4px; font-family:'Manrope',sans-serif; font-weight:800; font-size:17px; color:{INK}; }}
.loc__b {{ font-size:12.5px; color:{INK3}; padding-left:22px; }}
.top__r {{ display:flex; gap:10px; }}
.iconbtn {{ width:40px; height:40px; border-radius:20px; border:1px solid {LINE}; display:flex; align-items:center; justify-content:center; position:relative; }}
.dot {{ position:absolute; top:9px; right:10px; width:8px; height:8px; border-radius:4px; background:{OR}; border:1.5px solid #FFFFFF; }}

.search {{ margin:16px 20px 0; height:48px; border-radius:14px; background:{BG2}; display:flex; align-items:center; gap:10px; padding:0 14px; }}
.search span {{ flex:1; font-size:14px; color:{MUTED}; }}

.help {{ margin:18px 20px 0; padding:16px 14px 18px; border-radius:22px; border:1px solid #F6E6D8;
         background:linear-gradient(135deg,#FFFFFF 0%,#FFF9F4 55%,{OR_SOFT} 100%); }}
.help__t {{ font-size:16px; line-height:21px; }}
.help__g {{ margin-top:14px; display:flex; flex-wrap:wrap; gap:14px 10px; }}
.hp {{ width:72px; display:flex; flex-direction:column; align-items:center; gap:7px; }}
.hp__ph {{ width:72px; height:72px; border-radius:18px; overflow:hidden; border:3px solid #FFFFFF; box-shadow:0 4px 12px rgba(11,18,32,.10); }}
.hp__ph img {{ width:100%; height:100%; object-fit:cover; }}
.hp__t {{ font-size:11.5px; line-height:14px; font-weight:600; color:{INK}; text-align:center; }}
.hero {{ margin:18px 20px 0; height:172px; border-radius:20px; background:{OR_SOFT}; display:flex; overflow:hidden; position:relative; }}
.hero__txt {{ width:196px; position:relative; z-index:1; padding:20px 0 0 20px; display:flex; flex-direction:column; }}
.hero__tag {{ display:flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; color:{OR}; }}
.hero__h {{ margin-top:8px; font-size:21px; line-height:26px; width:168px; }}
.hero__btn {{ margin-top:14px; width:128px; height:38px; border-radius:19px; background:{OR}; color:#FFFFFF; font-weight:600; font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:6px; }}
.hero__img {{ position:absolute; right:0; top:0; width:150px; height:172px; object-fit:cover; }}
.dots {{ display:flex; justify-content:center; gap:5px; margin-top:10px; }}
.dots i {{ width:5px; height:5px; border-radius:3px; background:#D5DBE5; }}
.dots i.on {{ width:16px; background:{OR}; }}

.sec {{ margin-top:28px; padding:0 20px; }}
.sec__hd {{ display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:14px; }}
.sec__t {{ font-size:18px; line-height:24px; }}
.sec__s {{ font-size:12.5px; color:{INK3}; margin-top:2px; }}
.sec__all {{ font-size:13px; font-weight:600; color:{OR}; }}

.tiles {{ display:flex; flex-wrap:wrap; gap:16px 10px; }}
.tile {{ width:110px; display:flex; flex-direction:column; gap:8px; }}
.tile__ph {{ width:110px; height:96px; border-radius:16px; overflow:hidden; background:{BG2}; }}
.tile__ph img {{ width:110px; height:96px; object-fit:cover; }}
.tile__t {{ font-size:13px; font-weight:600; color:{INK}; text-align:center; }}
.amc {{ margin-top:16px; padding:12px 14px; border-radius:16px; background:{OR_SOFT}; display:flex; align-items:center; gap:12px; }}
.amc__ic {{ width:40px; height:40px; border-radius:12px; background:#FFFFFF; display:flex; align-items:center; justify-content:center; }}
.amc__t {{ flex:1; display:flex; flex-direction:column; gap:2px; }}
.amc__h {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:14px; color:{INK}; }}
.amc__s {{ font-size:12px; color:{INK3}; }}

.trust {{ margin:24px 20px 0; padding:14px 6px; border:1px solid {LINE}; border-radius:16px; display:flex; }}
.trust__i {{ flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; }}
.trust__i + .trust__i {{ border-left:1px solid {LINE}; }}
.trust__v {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:15px; color:{INK}; display:flex; align-items:center; gap:4px; }}
.trust__l {{ font-size:11px; color:{INK3}; }}

.feat {{ height:184px; border-radius:20px; background:linear-gradient(135deg,#0B1220 0%,#111A2E 60%,#16254A 100%); position:relative; overflow:hidden; display:flex; }}
.feat__glow {{ position:absolute; right:-40px; top:-30px; width:220px; height:220px; border-radius:110px; background:{OR}; opacity:.22; filter:blur(40px); }}
.feat__txt {{ position:relative; z-index:1; padding:18px 0 0 18px; width:190px; display:flex; flex-direction:column; }}
.feat__chip {{ align-self:flex-start; padding:4px 9px; border-radius:20px; background:rgba(255,106,0,.16); color:#FFA24D; font-size:11px; font-weight:600; }}
.feat__h {{ margin-top:10px; font-size:24px; line-height:29px; color:#FFFFFF; }}
.feat__h b {{ color:{OR}; font-weight:800; }}
.feat__s {{ margin-top:4px; font-size:12px; line-height:17px; color:#94A3B8; }}
.feat__btn {{ margin-top:12px; align-self:flex-start; height:34px; padding:0 14px; border-radius:17px; background:{OR}; color:#FFFFFF; font-weight:600; font-size:13px; display:flex; align-items:center; gap:6px; }}
.feat__img {{ position:absolute; right:-10px; bottom:26px; width:172px; height:118px; object-fit:contain; }}
.duo {{ margin-top:12px; display:flex; gap:12px; }}
.duo__c {{ flex:1; border-radius:18px; border:1px solid {LINE}; overflow:hidden; display:flex; flex-direction:column; background:#FFFFFF; }}
.duo__ph {{ height:96px; position:relative; }}
.duo__ph img {{ width:100%; height:96px; object-fit:cover; }}
.duo__tag {{ position:absolute; left:8px; top:8px; padding:3px 8px; border-radius:6px; font-size:10.5px; font-weight:700; color:#FFFFFF; }}
.duo__b {{ padding:10px 12px 12px; display:flex; align-items:center; justify-content:space-between; }}
.duo__h {{ font-size:14.5px; line-height:19px; }}
.duo__s {{ margin-top:2px; font-size:11.5px; color:{INK3}; }}
.duo__a {{ width:30px; height:30px; border-radius:15px; background:{BG2}; display:flex; align-items:center; justify-content:center; }}

.rail {{ display:flex; gap:12px; overflow:hidden; margin-right:-20px; }}
.pc {{ width:148px; flex-shrink:0; display:flex; flex-direction:column; }}
.pc__img {{ width:148px; height:148px; border-radius:16px; background:{BG2}; display:flex; align-items:center; justify-content:center; position:relative; }}
.pc__img img {{ width:108px; height:108px; object-fit:contain; mix-blend-mode:multiply; }}
.pc__off {{ position:absolute; left:8px; top:8px; padding:3px 7px; border-radius:6px; background:#FFFFFF; font-size:10.5px; font-weight:700; color:{GREEN}; }}
.pc__brand {{ margin-top:10px; font-size:11px; color:{MUTED}; font-weight:500; }}
.pc__name {{ margin-top:2px; font-size:13px; line-height:17px; font-weight:500; color:{INK2}; height:34px; overflow:hidden; }}
.pc__price {{ margin-top:6px; display:flex; align-items:baseline; gap:6px; }}
.pc__sp {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:15px; color:{INK}; }}
.pc__mrp {{ font-size:11.5px; color:{MUTED}; text-decoration:line-through; }}

.rc {{ width:150px; flex-shrink:0; display:flex; flex-direction:column; }}
.rc__ph {{ width:150px; height:110px; border-radius:16px; overflow:hidden; position:relative; }}
.rc__ph img {{ width:100%; height:100%; object-fit:cover; }}
.rc__tag {{ position:absolute; left:8px; top:8px; padding:3px 8px; border-radius:6px; background:#2563EB; color:#FFFFFF; font-size:10.5px; font-weight:700; }}
.rc__t {{ margin-top:10px; font-family:'Manrope',sans-serif; font-weight:800; font-size:14.5px; color:{INK}; }}
.rc__s {{ margin-top:2px; font-size:12px; color:{INK3}; }}
.how {{ border-radius:18px; background:{BG2}; padding:16px; display:flex; flex-direction:column; }}
.how__r {{ display:flex; gap:12px; }}
.how__rail {{ display:flex; flex-direction:column; align-items:center; width:28px; }}
.how__n {{ width:28px; height:28px; border-radius:14px; background:{OR}; color:#FFFFFF; font-family:'Manrope',sans-serif; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center; }}
.how__rail i {{ width:2px; height:22px; background:#FCD9BD; }}
.how__b {{ display:flex; flex-direction:column; gap:2px; padding:3px 0 12px; }}
.how__t {{ font-size:14px; font-weight:700; color:{INK}; }}
.how__s {{ font-size:12px; color:{INK3}; }}
.how__btn {{ margin-top:6px; height:44px; border-radius:14px; background:{OR}; color:#FFFFFF; font-weight:600; font-size:14px; display:flex; align-items:center; justify-content:center; gap:6px; }}
.brands {{ display:flex; flex-wrap:wrap; gap:10px; }}
.bt {{ width:80px; height:56px; border-radius:14px; border:1px solid {LINE}; background:#FFFFFF; display:flex; align-items:center; justify-content:center; }}
.bt img {{ width:52px; height:26px; object-fit:contain; }}
.expert {{ margin:28px 20px 0; padding:16px; border-radius:18px; background:{INK}; display:flex; align-items:center; gap:14px; }}
.expert__ic {{ width:46px; height:46px; border-radius:23px; background:#1A2540; display:flex; align-items:center; justify-content:center; }}
.expert__t {{ flex:1; display:flex; flex-direction:column; gap:3px; }}
.expert__h {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:15px; color:#FFFFFF; }}
.expert__s {{ font-size:12px; color:#94A3B8; }}
.expert__go {{ width:36px; height:36px; border-radius:18px; background:{OR}; display:flex; align-items:center; justify-content:center; }}

.spacer {{ height:110px; }}
.nav {{ position:absolute; left:0; right:0; bottom:0; height:84px; background:#FFFFFF; border-top:1px solid {LINE}; display:flex; padding:10px 8px 0; }}
.nav__i {{ flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:11px; font-weight:500; color:{MUTED}; }}
.nav__i.on {{ color:{OR}; font-weight:600; }}
.homebar {{ position:absolute; bottom:8px; left:128px; width:134px; height:5px; border-radius:3px; background:{INK}; }}
</style></head><body>
<div class="screen">
  <div class="status"><span>9:41</span><span style="font-size:12px">●●● ▮</span></div>

  <div class="top">
    <div class="loc">
      <div class="loc__a">{ic("pin", 18, OR, 2)}Jaipur{ic("down", 16, INK, 2.2)}</div>
      <div class="loc__b">17B, Kumawat Colony, Alpana Colony</div>
    </div>
    <div class="top__r">
      <div class="iconbtn">{ic("bell", 20)}<i class="dot"></i></div>
      <div class="iconbtn">{ic("cart", 20)}</div>
    </div>
  </div>

  <div class="search">{ic("search", 19, INK3)}<span>Search “laptop repair”</span>{ic("mic", 19, INK3)}</div>

  <div class="help">
    <div class="h help__t">What do you need help with?</div>
    <div class="help__g">{help_tiles}</div>
  </div>

  <div class="sec">
    <div class="sec__hd"><div><div class="h sec__t">New products</div><div class="sec__s">Fresh arrivals</div></div><div class="sec__all">See all</div></div>
    <div class="rail">{new_cards}</div>
  </div>

  <div class="trust">
    <div class="trust__i"><div class="trust__v">4.8{ic("star", 14, OR, 0, OR)}</div><div class="trust__l">Customer rating</div></div>
    <div class="trust__i"><div class="trust__v">90 days</div><div class="trust__l">Repair warranty</div></div>
    <div class="trust__i"><div class="trust__v">50k+</div><div class="trust__l">Devices fixed</div></div>
  </div>

  <div class="sec">
    <div class="sec__hd"><div class="h sec__t">Buy, rent or sell</div></div>
    <div class="feat">
      <div class="feat__glow"></div>
      <div class="feat__txt">
        <div class="feat__chip">Certified refurbished</div>
        <div class="h feat__h">Up to <b>86% off</b></div>
        <div class="feat__s">Laptops &amp; desktops, quality<br>tested with warranty</div>
        <div class="feat__btn">Shop now {ic("arrow", 14, "#FFFFFF", 2.2)}</div>
      </div>
      <img class="feat__img" src="{img(SP + '/laptop-cutout.png', 360)}" alt="">
    </div>
    <div class="duo">
      <div class="duo__c">
        <div class="duo__ph"><img src="{img(MEDIA + 'rent-laptop.jpg', 340)}" alt=""><div class="duo__tag" style="background:#2563EB">RENT</div></div>
        <div class="duo__b"><div><div class="h duo__h">Rent a device</div><div class="duo__s">Monthly plans</div></div><div class="duo__a">{ic("right", 15, INK, 2.2)}</div></div>
      </div>
      <div class="duo__c">
        <div class="duo__ph"><img src="{img('photo-ewaste.jpg', 340)}" alt=""><div class="duo__tag" style="background:{GREEN}">SELL</div></div>
        <div class="duo__b"><div><div class="h duo__h">Sell e-waste</div><div class="duo__s">Free pickup</div></div><div class="duo__a">{ic("right", 15, INK, 2.2)}</div></div>
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="sec__hd"><div><div class="h sec__t">How a repair works</div><div class="sec__s">Simple, at your doorstep</div></div></div>
    <div class="how">{how_rows}
      <div class="how__btn">Book a repair {ic("arrow", 15, "#FFFFFF", 2.2)}</div>
    </div>
  </div>

  <div class="sec">
    <div class="sec__hd"><div><div class="h sec__t">Certified refurbished</div><div class="sec__s">Quality tested · with warranty</div></div><div class="sec__all">See all</div></div>
    <div class="rail">{refurb_cards}</div>
  </div>

  <div class="sec">
    <div class="sec__hd"><div><div class="h sec__t">Brands we repair</div><div class="sec__s">And many more</div></div><div class="sec__all">Book now</div></div>
    <div class="brands">{brand_tiles}</div>
  </div>

  <div class="expert">
    <div class="expert__ic">{ic("headset", 22, OR, 1.8)}</div>
    <div class="expert__t"><div class="expert__h">Talk to an expert</div><div class="expert__s">Fix it on a call · from ₹5/min</div></div>
    <div class="expert__go">{ic("arrow", 17, "#FFFFFF", 2.2)}</div>
  </div>

  <div class="spacer"></div>
  <div class="nav">
    <div class="nav__i on">{ic("home", 22, OR, 2)}Home</div>
    <div class="nav__i">{ic("wrench", 22, MUTED, 1.8)}Bookings</div>
    <div class="nav__i">{ic("bag", 22, MUTED, 1.8)}Shop</div>
    <div class="nav__i">{ic("user", 22, MUTED, 1.8)}Account</div>
  </div>
  <div class="homebar"></div>
</div>
</body></html>"""

open(OUT, "w").write(page)
print("wrote", OUT, len(page) // 1024, "KB")
