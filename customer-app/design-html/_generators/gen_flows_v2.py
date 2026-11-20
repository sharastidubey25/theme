"""Minimal redesign v2 — Login flow + Book a Repair (category + one brand screen per category).

Run: python3 -I gen_flows_v2.py <generators dir> <design-html dir>
Writes 02-auth-v2.html and 05-book-repair-v2.html (one .screen per phone frame, 390 wide).
Figma-safe: images inlined, flexbox, no pseudo elements.
"""
import base64
import html
import os
import re
import sys

sys.path.insert(0, sys.argv[1])
from figma_safe import img  # noqa: E402

SP, OUT = sys.argv[1], sys.argv[2]
SET5 = "/home/sharasti/theme/set-5/"
e = html.escape

INK, INK2, INK3, MUTED = "#0B1220", "#1E293B", "#475569", "#94A3B8"
OR, OR2, OR_SOFT, LINE, BG2 = "#FF6A00", "#FF8A1F", "#FFF4EC", "#EEF0F4", "#F6F7F9"
GREEN = "#16A34A"

# ---------------------------------------------------------------- icons
P = {
    "back": '<path d="M15 5l-7 7 7 7"/>',
    "right": '<path d="M9 6l6 6-6 6"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "x": '<path d="M6 6l12 12M18 6L6 18"/>',
    "user": '<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    "phone": '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    "lock": '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    "home": '<path d="M4 11l8-6.5 8 6.5V20h-5v-5.5H9V20H4z"/>',
    "office": '<path d="M4 21V5.5L12 3v18M12 8.5l8 2.5v10M2.5 21h19M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
    "bank": '<path d="M3 9.5L12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
    "edit": '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    "star": '<path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"/>',
}


def ic(name, size=20, color=INK2, sw=1.8, fill="none"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{P[name]}</svg>')


def svg_uri(svg):
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


# ---------------------------------------------------------------- device illustrations (website repair.html bk-* sprite)
REPAIR = open(SET5 + "repair.html", encoding="utf-8").read()
DEFS = "<defs>" + "".join(re.findall(r"<(?:linear|radial)Gradient\b.*?</(?:linear|radial)Gradient>", REPAIR, re.S)) + "</defs>"
ART = {}
for m in re.finditer(r'<symbol id="bk-([\w-]+)"[^>]*>(.*?)</symbol>', REPAIR, re.S):
    ART[m.group(1)] = svg_uri(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">{DEFS}{m.group(2)}</svg>')


def art(key, w=72):
    return f'<img src="{ART[key]}" width="{w}" height="{round(w * .75)}" alt="">'


# ---------------------------------------------------------------- brands
LOGOS = {f.rsplit(".", 1)[0]: f for f in os.listdir(SET5 + "assets/img/brands") if f.endswith((".svg", ".png"))}
NAME = {"hp": "HP", "msi": "MSI", "hcl": "HCL", "cp-plus": "CP Plus", "tp-link": "TP-Link", "essl": "eSSL",
        "zkteco": "ZKTeco", "apc": "APC", "lg": "LG", "benq": "BenQ", "d-link": "D-Link", "ibm": "IBM",
        "viewsonic": "ViewSonic", "oneplus": "OnePlus", "v-guard": "V-Guard", "secugen": "SecuGen",
        "idemia": "IDEMIA", "supermicro": "Supermicro"}
# brands without a logo file: coloured wordmark in the brand's own colour
WORD = {"canon": "#CC0000", "hikvision": "#E2231A", "dahua": "#E60012", "benq": "#5B2E8C", "lg": "#A50034",
        "viewsonic": "#6B2C91", "optoma": "#D71920", "d-link": "#0072BC", "ubiquiti": "#0559C9", "juniper": "#3E8F2E",
        "aruba": "#FF8300", "ricoh": "#C8102E", "kyocera": "#E60012", "xerox": "#E5242B", "kodak": "#E31B23",
        "avision": "#0067B1", "plustek": "#00529B", "xiaomi": "#FF6900", "oneplus": "#EB0028", "realme": "#C99A00",
        "apc": "#111111", "v-guard": "#E31E24", "eaton": "#005EB8", "numeric": "#E30613", "vertiv": "#E2561B",
        "essl": "#0B5FA5", "zkteco": "#00A651", "mantra": "#E31E24", "matrix": "#E21F26", "realtime": "#1B75BC",
        "secugen": "#0E4D92", "idemia": "#3B1A6E", "godrej": "#6E2A8C", "honeywell": "#DC1E35", "bosch": "#EA0016",
        "tenda": "#F27321", "ibm": "#0F62FE", "supermicro": "#1A1A1A", "panasonic": "#0041C0"}


def bname(b):
    return NAME.get(b, b.replace("-", " ").title())


def logo(b):
    if b in LOGOS:
        f = SET5 + "assets/img/brands/" + LOGOS[b]
        src = svg_uri(re.sub(r"<title>.*?</title>", "", open(f, encoding="utf-8").read())) if f.endswith(".svg") else img(f, 160)
        return f'<img class="logo" src="{src}" alt="">'
    return f'<div class="word" style="color:{WORD.get(b, INK)}">{e(bname(b))}</div>'


# Brands per repair category = live site (api.fixpapa.com/v1/customer/master/product-category-brands,
# category_type "service"), saved in brands.json; logos from cdn.fixpapa.com/brand_logo/.
import json  # noqa: E402
from urllib.parse import quote  # noqa: E402
LIVE = [r for r in json.load(open(f"{SP}/brands.json"))["data"] if r["category_type"] == "service"]
CLEAN = {"MSI (Micro-Star International)": "MSI", "Hewlett Packard Enterprise (HPE)": "HPE",
         "Bosch Security Systems": "Bosch", "Honeywell Security": "Honeywell", "Dahua Technology": "Dahua",
         "Chrisite": "Christie", "RICOH": "Ricoh"}


def live_brands(cat_id):
    rows = sorted((r for r in LIVE if r["product_category_id"] == cat_id), key=lambda r: r.get("display_order") or 0)
    return [(CLEAN.get(r["brand_name"].strip(), r["brand_name"].strip()), r["logo"]) for r in rows]


CATS = [  # id, label, art, live service category id
    ("laptop", "Laptop", "laptop", 3), ("desktop", "Desktop", "desktop", 8), ("printer", "Printer", "printer", 1),
    ("cctv", "CCTV", "cctv", 5), ("apple", "Apple", "apple", None), ("monitor", "Monitor", "monitor", 12),
    ("tablet", "Tablet", "tablet", 50), ("projector", "Projector", "projector", 9), ("scanner", "Scanner", "scanner", 55),
    ("ups", "UPS", "ups", 56), ("wifi", "Wi-Fi", "wifi", 18), ("network", "Networking", "network", 16),
    ("server", "Server", "server", 19), ("biometric", "Biometric", "biometric", 22),
]


LOGO_CACHE = os.path.join(SP, "logo-cache")


def trimmed(url):
    """Download a live logo, crop its empty margins (white or transparent), cache it as PNG."""
    import io
    import urllib.request
    from PIL import Image, ImageChops
    os.makedirs(LOGO_CACHE, exist_ok=True)
    out = os.path.join(LOGO_CACHE, re.sub(r"[^\w.-]", "_", url.rsplit("/", 1)[1]) + ".png")
    if not os.path.exists(out):
        raw = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        flat = Image.new("RGBA", im.size, (255, 255, 255, 255))
        flat.alpha_composite(im)
        diff = ImageChops.difference(flat.convert("RGB"), Image.new("RGB", im.size, (255, 255, 255)))
        box = diff.convert("L").point(lambda v: 255 if v > 18 else 0).getbbox()
        (im.crop(box) if box else im).save(out)
    return out


LOCAL = {"Dell": "dell", "HP": "hp", "Lenovo": "lenovo", "Asus": "asus", "Acer": "acer", "Microsoft": "microsoft",
         "MSI": "msi", "Cisco": "cisco", "TP-Link": "tp-link", "Samsung": "samsung", "Epson": "epson", "Brother": "brother",
         "Fujitsu": "fujitsu", "HCL": "hcl", "CP Plus": "cp-plus", "Luminous": "luminous", "Microtek": "microtek",
         "Zebronics": "zebronics", "Apple": "apple"}


def live_logo(name, f):
    if name in LOCAL:
        return logo(LOCAL[name])
    try:
        return f'<img class="logo" src="{img(trimmed("https://cdn.fixpapa.com/brand_logo/" + quote(f)), 200)}" alt="">'
    except Exception:
        return f'<div class="word">{e(name)}</div>'


APPLE = [("laptop", "MacBook"), ("desktop", "iMac"), ("monitor", "Mac mini"), ("tablet", "iPad"),
         ("apple", "iPhone"), ("monitor", "Studio Display")]

# ---------------------------------------------------------------- CSS
CSS = f"""
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#E5E7EB; font-family:'Inter',sans-serif; color:{INK2}; -webkit-font-smoothing:antialiased;
       display:flex; flex-wrap:wrap; align-items:flex-start; gap:48px 40px; padding:24px; }}
img, svg {{ display:block; flex:none; }}
.frame {{ display:flex; flex-direction:column; }}
.frame-title {{ margin-bottom:10px; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; letter-spacing:.6px; color:#64748B; }}
.screen {{ width:390px; height:844px; background:#FFFFFF; display:flex; flex-direction:column; position:relative; overflow:hidden; }}
.h {{ font-family:'Manrope',sans-serif; font-weight:800; color:{INK}; }}
.status {{ height:44px; flex:none; padding:0 24px; display:flex; align-items:center; justify-content:space-between; font-weight:600; font-size:15px; color:{INK}; }}
.homebar {{ position:absolute; bottom:8px; left:128px; width:134px; height:5px; border-radius:3px; background:{INK}; }}
.btn {{ height:54px; border-radius:16px; background:{OR}; color:#FFFFFF; font-weight:600; font-size:15.5px; display:flex; align-items:center; justify-content:center; gap:8px; }}
.btn--off {{ background:#E2E8F0; color:{MUTED}; }}
.round {{ width:40px; height:40px; border-radius:20px; border:1px solid {LINE}; display:flex; align-items:center; justify-content:center; background:#FFFFFF; }}

/* auth */
.ahero {{ height:300px; flex:none; background:linear-gradient(180deg,{OR_SOFT} 0%,#FFFFFF 100%); position:relative; overflow:hidden; }}
.ahero__ring {{ position:absolute; border-radius:50%; border:1px solid rgba(255,106,0,.14); }}
.float {{ position:absolute; width:92px; height:80px; border-radius:22px; background:#FFFFFF; display:flex; align-items:center; justify-content:center;
         box-shadow:0 10px 30px rgba(11,18,32,.08); }}
.ahero__logo {{ position:absolute; left:24px; top:56px; height:26px; }}
.abody {{ flex:1; padding:6px 24px 0; display:flex; flex-direction:column; }}
.atitle {{ font-size:26px; line-height:32px; }}
.asub {{ margin-top:6px; font-size:14px; line-height:20px; color:{INK3}; }}
.label {{ margin-top:22px; margin-bottom:8px; font-size:13px; font-weight:600; color:{INK2}; }}
.field {{ height:54px; border-radius:14px; border:1.5px solid {LINE}; background:#FFFFFF; display:flex; align-items:center; gap:10px; padding:0 14px;
          font-size:15px; color:{INK}; }}
.field--on {{ border-color:{OR}; box-shadow:0 0 0 4px rgba(255,106,0,.10); }}
.field .ph {{ color:{MUTED}; }}
.cc {{ display:flex; align-items:center; gap:6px; padding-right:12px; border-right:1px solid {LINE}; font-weight:600; }}
.flag {{ width:20px; height:14px; border-radius:3px; overflow:hidden; display:flex; flex-direction:column; }}
.flag i {{ flex:1; }}
.caret {{ width:2px; height:20px; background:{OR}; margin-left:-6px; }}
.note {{ margin-top:14px; font-size:12px; line-height:17px; color:{MUTED}; text-align:center; }}
.note b {{ color:{INK3}; font-weight:600; }}
.alt {{ margin-top:auto; padding-bottom:34px; text-align:center; font-size:14px; color:{INK3}; }}
.alt b {{ color:{OR}; font-weight:700; }}
.trustrow {{ margin-top:18px; display:flex; justify-content:center; gap:16px; font-size:11.5px; color:{INK3}; }}
.trustrow span {{ display:flex; align-items:center; gap:5px; }}
.otp {{ margin-top:26px; display:flex; gap:10px; }}
.otp div {{ width:48px; height:56px; border-radius:14px; border:1.5px solid {LINE}; display:flex; align-items:center; justify-content:center;
           font-family:'Manrope',sans-serif; font-weight:800; font-size:22px; color:{INK}; }}
.otp .f {{ background:{BG2}; border-color:{BG2}; }}
.otp .on {{ border-color:{OR}; box-shadow:0 0 0 4px rgba(255,106,0,.10); }}
.badge {{ width:64px; height:64px; border-radius:20px; background:{OR_SOFT}; display:flex; align-items:center; justify-content:center; }}
.seg {{ display:flex; gap:8px; }}
.seg div {{ flex:1; height:74px; border-radius:14px; border:1.5px solid {LINE}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
           font-size:12.5px; font-weight:600; color:{INK2}; }}
.seg .on {{ border-color:{OR}; background:{OR_SOFT}; color:{OR}; }}
.opt {{ font-weight:400; color:{MUTED}; }}

/* booking */
.bar {{ padding:4px 20px 0; display:flex; align-items:center; gap:12px; }}
.bar__t {{ flex:1; font-family:'Manrope',sans-serif; font-weight:800; font-size:17px; color:{INK}; }}
.bar__s {{ font-size:12.5px; font-weight:600; color:{MUTED}; }}
.prog {{ margin:14px 20px 0; display:flex; gap:6px; }}
.prog i {{ flex:1; height:4px; border-radius:2px; background:{LINE}; }}
.prog i.on {{ background:{OR}; }}
.prog-l {{ margin:7px 20px 0; display:flex; font-size:11px; font-weight:500; color:{MUTED}; }}
.prog-l span {{ flex:1; }}
.prog-l .on {{ color:{OR}; font-weight:700; }}
.bbody {{ flex:1; padding:0 20px; display:flex; flex-direction:column; overflow:hidden; }}
.btitle {{ margin-top:20px; font-size:24px; line-height:30px; }}
.bsub {{ margin-top:4px; font-size:13.5px; color:{INK3}; }}
.search {{ margin-top:16px; height:48px; border-radius:14px; background:{BG2}; display:flex; align-items:center; gap:10px; padding:0 14px; font-size:14px; color:{MUTED}; }}
.grid {{ margin-top:16px; display:flex; flex-wrap:wrap; gap:10px; }}
.cat {{ width:110px; height:104px; border-radius:18px; background:{BG2}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; }}
.cat__t {{ font-size:12.5px; font-weight:600; color:{INK}; }}
.pop {{ margin-top:18px; font-size:12px; font-weight:700; letter-spacing:.4px; color:{MUTED}; }}
.chosen {{ margin-top:16px; height:76px; border-radius:18px; background:{OR_SOFT}; display:flex; align-items:center; gap:12px; padding:0 14px 0 8px; }}
.chosen__t {{ flex:1; display:flex; flex-direction:column; gap:2px; }}
.chosen__k {{ font-size:11.5px; font-weight:600; color:{OR}; }}
.chosen__h {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:16px; color:{INK}; }}
.chosen__c {{ height:32px; padding:0 12px; border-radius:16px; background:#FFFFFF; display:flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; color:{INK2}; }}
.brand {{ width:110px; height:92px; border-radius:18px; border:1.5px solid {LINE}; background:#FFFFFF; display:flex; flex-direction:column; align-items:center;
          justify-content:center; gap:10px; position:relative; }}
.brand .logo {{ width:62px; height:30px; object-fit:contain; mix-blend-mode:multiply; }}
.word {{ height:30px; display:flex; align-items:center; font-family:'Manrope',sans-serif; font-weight:800; font-size:16px; letter-spacing:-.2px; }}
.brand__n {{ font-size:12px; font-weight:600; color:{INK3}; }}
.brand--on {{ border-color:{OR}; background:{OR_SOFT}; }}
.brand--on .brand__n {{ color:{INK}; }}
.tick {{ position:absolute; right:8px; top:8px; width:20px; height:20px; border-radius:10px; background:{OR}; display:flex; align-items:center; justify-content:center; }}
.brand--other {{ border-style:dashed; background:{BG2}; border-color:#D5DBE5; }}
.foot {{ flex:none; padding:14px 20px 34px; border-top:1px solid {LINE}; background:#FFFFFF; display:flex; flex-direction:column; gap:10px; }}
.foot__hint {{ display:flex; align-items:center; justify-content:center; gap:6px; font-size:12px; color:{INK3}; }}
"""

FONTS = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">'
STATUS = '<div class="status"><span>9:41</span><span style="font-size:12px">●●● ▮</span></div>'
FLAG = '<div class="flag"><i style="background:#FF9933"></i><i style="background:#FFFFFF"></i><i style="background:#138808"></i></div>'
LOGO = img("logo.png", 300)


def page(title, frames):
    body = "\n".join(f'<div class="frame"><p class="frame-title">{e(n.upper())}</p><main class="screen" data-screen="{e(n)}">{b}<div class="homebar"></div></main></div>'
                     for n, b in frames)
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{e(title)}</title>{FONTS}<style>{CSS}</style></head><body>{body}</body></html>'


# ================================================================ AUTH
def ahero(small=False):
    floats = [("laptop", 214, 92, -6), ("printer", 290, 176, 6), ("cctv", 196, 196, 4)]
    rings = "".join(f'<div class="ahero__ring" style="width:{d}px;height:{d}px;left:{290 - d // 2}px;top:{170 - d // 2}px"></div>' for d in (180, 300, 420))
    fl = "".join(f'<div class="float" style="left:{x}px;top:{y}px;transform:rotate({r}deg)">{art(a, 70)}</div>' for a, x, y, r in floats)
    tag = (f'<div style="position:absolute;left:24px;top:104px;display:flex;flex-direction:column;gap:6px">'
           f'<div class="h" style="font-size:15px;color:{INK3};font-weight:700;line-height:20px">Repairs, rentals &amp;<br>refurbished tech</div></div>')
    close = f'<div class="round" style="position:absolute;right:16px;top:12px">{ic("x", 18, INK, 2)}</div>'
    return f'<div class="ahero">{rings}{fl}<img class="ahero__logo" src="{LOGO}" alt="">{tag}{close}</div>'


AUTH = []
AUTH.append(("01 · Login — mobile number", f"""{STATUS}{ahero()}
<div class="abody">
  <div class="h atitle">Login or sign up</div>
  <div class="asub">We'll send a one-time code to verify your number.</div>
  <div class="label">Mobile number</div>
  <div class="field field--on"><div class="cc">{FLAG}+91</div><span>98765 43210</span></div>
  <div class="btn" style="margin-top:18px">Get OTP {ic("arrow", 18, "#FFFFFF", 2.2)}</div>
  <div class="trustrow"><span>{ic("lock", 13, GREEN, 2)}Secure login</span><span>{ic("shield", 13, GREEN, 2)}No spam calls</span></div>
  <div class="alt">New to FixPapa? <b>Create account</b></div>
</div>"""))

AUTH.append(("02 · Verify OTP", f"""{STATUS}
<div class="bar"><div class="round">{ic("back", 20, INK, 2)}</div></div>
<div class="abody" style="padding-top:22px">
  <div class="badge">{ic("phone", 30, OR, 1.7)}</div>
  <div class="h atitle" style="margin-top:20px">Enter the code</div>
  <div class="asub">Sent by SMS to <b style="color:{INK}">+91 98765 43210</b> · <b style="color:{OR}">Edit</b></div>
  <div class="otp"><div class="f">4</div><div class="f">3</div><div class="f">8</div><div class="on"><i class="caret" style="margin:0"></i></div><div></div><div></div></div>
  <div style="margin-top:18px;display:flex;align-items:center;gap:6px;font-size:13.5px;color:{INK3}">{ic("clock", 15, INK3, 2)}Resend code in <b style="color:{INK}">0:24</b></div>
  <div style="flex:1"></div>
  <div class="btn btn--off" style="margin-bottom:12px">Verify &amp; continue</div>
  <div class="note" style="margin:0 0 34px">By continuing you agree to our <b>Terms</b> &amp; <b>Privacy Policy</b></div>
</div>"""))

AUTH.append(("03 · Create account", f"""{STATUS}
<div class="bar"><div class="round">{ic("back", 20, INK, 2)}</div></div>
<div class="abody" style="padding-top:18px">
  <div class="h atitle">Create your account</div>
  <div class="asub">Takes 30 seconds. Book repairs and track them in one place.</div>
  <div class="label">I am</div>
  <div class="seg">
    <div class="on">{ic("user", 22, OR, 1.8)}Individual</div>
    <div>{ic("office", 22, INK3, 1.7)}Business</div>
    <div>{ic("bank", 22, INK3, 1.7)}Government</div>
  </div>
  <div class="label">Full name</div>
  <div class="field field--on">{ic("user", 19, INK3)}<span>Asha Rao</span><i class="caret" style="margin-left:-8px"></i></div>
  <div class="label">Mobile number</div>
  <div class="field"><div class="cc">{FLAG}+91</div><span>98765 43210</span>{ic("check", 18, GREEN, 2.4)}</div>
  <div class="label">Email <span class="opt">(optional)</span></div>
  <div class="field">{ic("mail", 19, INK3)}<span class="ph">you@example.com</span></div>
  <div class="btn" style="margin-top:24px">Create account</div>
  <div class="alt" style="margin-top:16px">Already have an account? <b>Log in</b></div>
</div>"""))

# ================================================================ BOOK A REPAIR
STEPS = ["Device", "Issue", "Visit", "Confirm"]


def topbar(step=0):
    prog = "".join(f'<i class="{"on" if i <= step else ""}"></i>' for i in range(4))
    lab = "".join(f'<span class="{"on" if i == step else ""}">{s}</span>' for i, s in enumerate(STEPS))
    return (f'{STATUS}<div class="bar"><div class="round">{ic("back", 20, INK, 2)}</div><div class="bar__t">Book a repair</div>'
            f'<div class="bar__s">Step {step + 1} of 4</div></div><div class="prog">{prog}</div><div class="prog-l">{lab}</div>')


BOOK = []
cat_tiles = "".join(f'<div class="cat">{art(a, 64)}<div class="cat__t">{n}</div></div>' for _, n, a, _b in CATS)
BOOK.append(("01 · What needs fixing — all categories", f"""{topbar()}
<div class="bbody">
  <div class="h btitle">What needs fixing?</div>
  <div class="bsub">Pick your device. Engineer visits at your doorstep.</div>
  <div class="search">{ic("search", 18, MUTED)}Search device, e.g. printer</div>
  <div class="grid">{cat_tiles}</div>
</div>"""))
# make the first screen tall enough for all 14 tiles
BOOK[0] = (BOOK[0][0], BOOK[0][1])


def chosen(a, n, kind="Device"):
    return (f'<div class="chosen">{art(a, 64)}<div class="chosen__t"><div class="chosen__k">{kind}</div><div class="h chosen__h">{n} repair</div></div>'
            f'<div class="chosen__c">{ic("edit", 13, INK2, 2)}Change</div></div>')


def foot(label, hint=True):
    h = f'<div class="foot__hint">{ic("shield", 14, GREEN, 2)}Genuine parts · 90-day repair warranty</div>' if hint else ""
    return f'<div class="foot">{h}<div class="btn">{label} {ic("arrow", 18, "#FFFFFF", 2.2)}</div></div>'


# Problem types = live master/services?productCategoryID=… (saved as services-<id>.json)
def live_services(cat_id):
    rows = sorted(json.load(open(f"{SP}/services-{cat_id}.json"))["data"], key=lambda r: r.get("display_order") or 0)
    return [(r["service_name"].strip(), r["primary_sub_service_name"].strip(), r["minimum_service_price"]) for r in rows]


def svc_icon(name):  # same keyword map as lib/features/booking/presentation/booking_ui.dart serviceIcon()
    t = name.lower()
    for k, v in (("software", "code"), ("display", "monitor"), ("screen", "monitor"), ("motherboard", "chip"),
                 ("hardware", "chip"), ("damage", "crack"), ("power", "bolt"), ("battery", "bolt"), ("other", "help")):
        if k in t:
            return v
    return "wrench"


SVC_LAPTOP, SVC_APPLE = live_services(3), live_services(34)


def problem_screen(a, cat, brand, svcs, pick):
    opts = "".join(
        f'<div class="opt{" opt--on" if i == pick else ""}"><div class="opt__ic">{ic(svc_icon(t), 21, OR if i == pick else INK3, 1.8)}</div>'
        f'<div class="opt__b"><div class="opt__t">{e(t)}</div></div>'
        f'<div class="opt__p"><div class="opt__pv">₹{p}</div><div class="opt__pk">{e(sub.lower())}</div></div></div>'
        for i, (t, sub, p) in enumerate(svcs))
    label = f"{cat} · {brand}" if brand else cat
    return f"""{topbar(0)}
<div class="bbody">
  {mini(a, label)}
  <div class="h btitle" style="margin-top:16px">What's the problem?</div>
  <div class="bsub">Final repair cost is shared after diagnosis.</div>
  <div class="opts">{opts}</div>
</div>{foot2("Continue", "Diagnosis charge", f"₹{svcs[pick][2]}")}"""


for i, (cid, n, a, live_id) in enumerate(CATS, start=2):
    if live_id is None:
        APPLE_AT = len(BOOK)  # filled in once problem_screen's helpers exist (below)
        BOOK.append((f"{i:02d} · {n} — what's the problem (one brand, brand step skipped)", ""))
        continue
    tiles = "".join(
        f'<div class="brand{" brand--on" if j == 0 else ""}">{"<div class=tick>" + ic("check", 12, "#FFFFFF", 3) + "</div>" if j == 0 else ""}'
        f'{live_logo(b, f)}<div class="brand__n">{e(b)}</div></div>' for j, (b, f) in enumerate(live_brands(live_id)))
    tiles += f'<div class="brand brand--other">{ic("plus", 22, INK3, 2)}<div class="brand__n">Other brand</div></div>'
    body = f"""{topbar()}
<div class="bbody">
  {chosen(a, n)}
  <div class="h btitle">Select the brand</div>
  <div class="search">{ic("search", 18, MUTED)}Search {n if n.isupper() or "-" in n else n.lower()} brands</div>
  <div class="grid">{tiles}</div>
</div>{foot("Continue")}"""
    BOOK.append((f"{i:02d} · {n} — select brand", body))

# ================================================================ BOOK A REPAIR — steps after the brand
import datetime  # noqa: E402

TODAY = datetime.date(2026, 11, 17)
DAYS = [TODAY + datetime.timedelta(d) for d in range(7)]
PICK = DAYS[1]
# real slots: 9 AM – 9 PM in 2-hour windows (RN SelectDateTime generateTimeSlots); today only before 3 PM and after now
SLOTS = ["09:00AM - 11:00AM", "11:00AM - 01:00PM", "01:00PM - 03:00PM", "03:00PM - 05:00PM", "05:00PM - 07:00PM", "07:00PM - 09:00PM"]
SLOT_SHOW = ["9 – 11 AM", "11 AM – 1 PM", "1 – 3 PM", "3 – 5 PM", "5 – 7 PM", "7 – 9 PM"]
WHEN = f"{PICK:%a}, {PICK.day} {PICK:%b} · 1 – 3 PM"
ADDR = "17B, Kumawat Colony, Alpana Colony"
DEV = ("laptop", "Laptop", "Acer")
PICK_ISSUE = 1
ISSUE_NAME, _, FEE = SVC_LAPTOP[PICK_ISSUE]

P.update({
    "code": '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    "chip": '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.5 9.5h5v5h-5zM9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    "crack": '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 4l-2 4.5 3 2-2.5 6.5M8 21h8"/>',
    "monitor": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
    "bolt": '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
    "help": '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01"/>',
    "camera": '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    "image": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    "x": '<path d="M6 6l12 12M18 6L6 18"/>',
    "pin": '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    "locate": '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    "calendar": '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    "doc": '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    "down": '<path d="M7 10l5 5 5-5"/>',
    "wallet": '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11" rx="2.5"/><path d="M16.5 13.5h.01"/>',
})

CSS2 = f"""
.chips {{ margin-top:14px; display:flex; flex-wrap:wrap; gap:8px; }}
.chip {{ height:36px; padding:0 14px; border-radius:18px; border:1.5px solid {LINE}; display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; color:{INK2}; }}
.chip--on {{ border-color:{OR}; background:{OR_SOFT}; color:{OR}; font-weight:600; }}
.mini {{ margin-top:16px; height:52px; border-radius:14px; background:{BG2}; display:flex; align-items:center; gap:10px; padding:0 12px 0 6px; }}
.mini__t {{ flex:1; font-size:14px; font-weight:600; color:{INK}; }}
.mini__c {{ font-size:12.5px; font-weight:600; color:{OR}; }}
.opts {{ margin-top:14px; display:flex; flex-direction:column; gap:8px; }}
.opt {{ height:62px; border-radius:16px; border:1.5px solid {LINE}; display:flex; align-items:center; gap:12px; padding:0 14px 0 10px; }}
.opt--on {{ border-color:{OR}; background:{OR_SOFT}; }}
.opt__ic {{ width:40px; height:40px; border-radius:12px; background:{BG2}; display:flex; align-items:center; justify-content:center; }}
.opt--on .opt__ic {{ background:#FFFFFF; }}
.opt__b {{ flex:1; display:flex; flex-direction:column; gap:2px; }}
.opt__t {{ font-size:14.5px; font-weight:600; color:{INK}; }}
.opt__d {{ font-size:12px; line-height:16px; color:{INK3}; }}
.opt__p {{ display:flex; flex-direction:column; align-items:flex-end; gap:2px; }}
.opt__pv {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:15px; color:{INK}; }}
.opt__pk {{ font-size:10.5px; color:{MUTED}; }}
.radio {{ width:22px; height:22px; border-radius:11px; border:2px solid #D5DBE5; display:flex; align-items:center; justify-content:center; flex:none; }}
.radio--on {{ border-color:{OR}; }}
.radio--on i {{ width:10px; height:10px; border-radius:5px; background:{OR}; }}
.lab {{ margin-top:20px; margin-bottom:8px; font-size:13px; font-weight:600; color:{INK2}; display:flex; justify-content:space-between; }}
.lab i {{ font-style:normal; font-weight:400; color:{MUTED}; }}
.area {{ height:104px; border-radius:14px; border:1.5px solid {OR}; box-shadow:0 0 0 4px rgba(255,106,0,.10); padding:12px 14px; font-size:14.5px; line-height:21px; color:{INK}; position:relative; }}
.area__n {{ position:absolute; right:12px; bottom:8px; font-size:11px; color:{MUTED}; }}
.photos {{ display:flex; gap:10px; }}
.thumb {{ width:76px; height:76px; border-radius:14px; overflow:hidden; position:relative; }}
.thumb img {{ width:76px; height:76px; object-fit:cover; }}
.thumb__x {{ position:absolute; right:5px; top:5px; width:20px; height:20px; border-radius:10px; background:rgba(11,18,32,.7); display:flex; align-items:center; justify-content:center; }}
.addph {{ width:76px; height:76px; border-radius:14px; border:1.5px dashed #D5DBE5; background:{BG2}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; font-size:11.5px; font-weight:600; color:{INK3}; }}
.dim {{ position:absolute; left:0; top:0; right:0; bottom:0; background:rgba(11,18,32,.45); }}
.sheet {{ position:absolute; left:0; right:0; bottom:0; background:#FFFFFF; border-radius:26px 26px 0 0; padding:10px 20px 38px; display:flex; flex-direction:column; }}
.sheet__h {{ align-self:center; width:40px; height:4px; border-radius:2px; background:#D5DBE5; margin-bottom:18px; }}
.src {{ flex:1; height:112px; border-radius:18px; background:{BG2}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; }}
.src__ic {{ width:46px; height:46px; border-radius:23px; background:#FFFFFF; display:flex; align-items:center; justify-content:center; }}
.src__t {{ font-size:14px; font-weight:700; color:{INK}; }}
.src__d {{ font-size:11.5px; color:{INK3}; }}
.ghost {{ height:50px; border-radius:16px; background:{BG2}; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:15px; color:{INK2}; }}
.loc {{ margin-top:16px; height:56px; border-radius:16px; background:{OR_SOFT}; display:flex; align-items:center; gap:12px; padding:0 14px; }}
.loc__t {{ flex:1; display:flex; flex-direction:column; gap:1px; }}
.loc__h {{ font-size:14px; font-weight:700; color:{OR}; }}
.loc__s {{ font-size:11.5px; color:{INK3}; }}
.sh {{ margin-top:22px; margin-bottom:10px; font-size:12px; font-weight:700; letter-spacing:.5px; color:{MUTED}; }}
.addr {{ border-radius:16px; border:1.5px solid {LINE}; display:flex; align-items:flex-start; gap:12px; padding:14px; }}
.addr + .addr {{ margin-top:10px; }}
.addr--on {{ border-color:{OR}; background:{OR_SOFT}; }}
.addr__ic {{ width:38px; height:38px; border-radius:11px; background:{BG2}; display:flex; align-items:center; justify-content:center; flex:none; }}
.addr--on .addr__ic {{ background:#FFFFFF; }}
.addr__b {{ flex:1; display:flex; flex-direction:column; gap:3px; }}
.addr__t {{ font-size:14.5px; font-weight:700; color:{INK}; }}
.addr__d {{ font-size:12.5px; line-height:18px; color:{INK3}; }}
.dtag {{ align-self:flex-start; margin-top:4px; padding:2px 8px; border-radius:6px; background:#DCFCE7; color:{GREEN}; font-size:11px; font-weight:700; }}
.newaddr {{ margin-top:12px; height:52px; border-radius:16px; border:1.5px dashed #D5DBE5; display:flex; align-items:center; justify-content:center; gap:8px; font-size:14px; font-weight:600; color:{OR}; }}
.map {{ height:210px; flex:none; position:relative; overflow:hidden; background:#EEF2F6; }}
.map__pin {{ position:absolute; left:175px; top:62px; display:flex; flex-direction:column; align-items:center; }}
.map__tag {{ padding:7px 12px; border-radius:10px; background:{INK}; color:#FFFFFF; font-size:12px; font-weight:600; margin-bottom:6px; }}
.map__me {{ position:absolute; right:16px; bottom:16px; height:36px; padding:0 12px; border-radius:18px; background:#FFFFFF; display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:{OR}; box-shadow:0 4px 14px rgba(11,18,32,.12); }}
.inp {{ height:50px; border-radius:14px; border:1.5px solid {LINE}; display:flex; align-items:center; justify-content:space-between; padding:0 14px; font-size:14.5px; color:{INK}; }}
.inp--on {{ border-color:{OR}; box-shadow:0 0 0 4px rgba(255,106,0,.10); }}
.inp .ph {{ color:{MUTED}; }}
.lab2 {{ margin:14px 0 6px; font-size:12.5px; font-weight:600; color:{INK2}; }}
.two {{ display:flex; gap:10px; }}
.two > div {{ flex:1; }}
.days {{ margin-top:14px; display:flex; gap:7px; }}
.day {{ width:44px; height:66px; border-radius:16px; border:1.5px solid {LINE}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; flex:none; }}
.day__w {{ font-size:11px; font-weight:500; color:{INK3}; }}
.day__d {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:18px; color:{INK}; }}
.day--on {{ background:{OR}; border-color:{OR}; }}
.day--on .day__w, .day--on .day__d {{ color:#FFFFFF; }}
.slots {{ display:flex; flex-wrap:wrap; gap:10px; }}
.slot {{ width:170px; height:50px; border-radius:14px; border:1.5px solid {LINE}; display:flex; align-items:center; justify-content:center; gap:7px; font-size:13.5px; font-weight:600; color:{INK2}; }}
.slot--on {{ border-color:{OR}; background:{OR_SOFT}; color:{OR}; }}
.slot--off {{ background:{BG2}; border-color:{BG2}; color:#B6C0CE; text-decoration:line-through; }}
.toggle {{ width:44px; height:26px; border-radius:13px; background:#D5DBE5; padding:3px; display:flex; }}
.toggle i {{ width:20px; height:20px; border-radius:10px; background:#FFFFFF; }}
.card {{ border-radius:18px; border:1px solid {LINE}; padding:4px 14px; }}
.row2 {{ display:flex; align-items:center; gap:12px; padding:12px 0; }}
.row2 + .row2 {{ border-top:1px solid {LINE}; }}
.row2__ic {{ width:36px; height:36px; border-radius:11px; background:{OR_SOFT}; display:flex; align-items:center; justify-content:center; flex:none; }}
.row2__b {{ flex:1; display:flex; flex-direction:column; gap:2px; }}
.row2__k {{ font-size:11.5px; color:{MUTED}; font-weight:500; }}
.row2__v {{ font-size:13.5px; line-height:18px; font-weight:600; color:{INK}; }}
.row2__e {{ font-size:12.5px; font-weight:600; color:{OR}; }}
.bill {{ margin-top:12px; border-radius:18px; background:{BG2}; padding:14px; display:flex; flex-direction:column; gap:10px; }}
.bill__r {{ display:flex; justify-content:space-between; font-size:13.5px; color:{INK3}; }}
.bill__r b {{ color:{INK}; font-weight:600; }}
.bill__rule {{ height:1px; background:#E2E8F0; }}
.bill__t {{ display:flex; justify-content:space-between; font-family:'Manrope',sans-serif; font-weight:800; font-size:16px; color:{INK}; }}
.paynote {{ margin-top:12px; display:flex; align-items:center; gap:8px; font-size:12.5px; color:{GREEN}; font-weight:600; }}
.terms {{ margin-top:14px; display:flex; align-items:center; gap:10px; font-size:12.5px; color:{INK3}; }}
.cbox {{ width:20px; height:20px; border-radius:6px; background:{OR}; display:flex; align-items:center; justify-content:center; flex:none; }}
.foot2 {{ flex:none; padding:12px 20px 34px; border-top:1px solid {LINE}; background:#FFFFFF; display:flex; align-items:center; gap:14px; }}
.foot2__k {{ font-size:11.5px; color:{MUTED}; }}
.foot2__v {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:17px; color:{INK}; }}
.foot2 .btn {{ flex:1; }}
.done {{ flex:1; display:flex; flex-direction:column; align-items:center; padding:30px 20px 0; }}
.done__r1 {{ width:150px; height:150px; border-radius:75px; background:#F0FDF4; display:flex; align-items:center; justify-content:center; }}
.done__r2 {{ width:110px; height:110px; border-radius:55px; background:#DCFCE7; display:flex; align-items:center; justify-content:center; }}
.done__d {{ width:74px; height:74px; border-radius:37px; background:{GREEN}; display:flex; align-items:center; justify-content:center; }}
.bid {{ margin-top:18px; height:40px; padding:0 16px; border-radius:20px; background:{BG2}; display:flex; align-items:center; gap:8px; font-size:12.5px; color:{INK3}; }}
.bid b {{ font-family:'JetBrains Mono',monospace; color:{INK}; font-weight:600; letter-spacing:.5px; }}
.tl {{ margin-top:24px; width:100%; border-radius:18px; border:1px solid {LINE}; padding:16px; display:flex; flex-direction:column; }}
.tl__i {{ display:flex; gap:12px; }}
.tl__rail {{ display:flex; flex-direction:column; align-items:center; width:22px; }}
.tl__dot {{ width:22px; height:22px; border-radius:11px; background:{GREEN}; display:flex; align-items:center; justify-content:center; }}
.tl__dot--todo {{ background:#FFFFFF; border:2px solid #D5DBE5; }}
.tl__line {{ width:2px; height:30px; background:{LINE}; }}
.tl__b {{ display:flex; flex-direction:column; gap:2px; padding-bottom:12px; }}
.tl__t {{ font-size:14px; font-weight:600; color:{INK}; }}
.tl__s {{ font-size:12px; color:{INK3}; }}
"""
CSS += CSS2


def mini(a, text):
    return f'<div class="mini">{art(a, 44)}<div class="mini__t">{text}</div><div class="mini__c">Change</div></div>'


def foot2(label, k, v, icon="arrow"):
    return (f'<div class="foot2"><div><div class="foot2__k">{k}</div><div class="foot2__v">{v}</div></div>'
            f'<div class="btn">{label} {ic(icon, 18, "#FFFFFF", 2.4)}</div></div>')


def foot1(label, icon="arrow"):
    return f'<div class="foot2"><div class="btn">{label} {ic(icon, 18, "#FFFFFF", 2.4)}</div></div>'


BOOK[APPLE_AT] = (BOOK[APPLE_AT][0], problem_screen("apple", "Apple", None, SVC_APPLE, 0))
n = len(BOOK) + 1
# ---- Step 1c: problem type (live services)
BOOK.append((f"{n:02d} · Step 1 — What's the problem", problem_screen(DEV[0], DEV[1], DEV[2], SVC_LAPTOP, PICK_ISSUE)))
n += 1

# ---- Step 2: describe the issue
TAGS = ["Shuts down", "Overheating", "Not turning on", "Very slow", "Loud fan", "Battery drains"]
issue_body = f"""{topbar(1)}
<div class="bbody">
  <div class="h btitle">Tell us more</div>
  <div class="bsub">Helps the engineer bring the right parts.</div>
  <div class="lab">What's the issue? <i>Required</i></div>
  <div class="inp inp--on"><span>Shuts down, overheating</span></div>
  <div class="chips">{"".join(f'<div class="chip{" chip--on" if t in ("Shuts down", "Overheating") else ""}">{ic("check", 14, OR, 2.6) if t in ("Shuts down", "Overheating") else ""}{t}</div>' for t in TAGS)}</div>
  <div class="lab">More details <i>Optional</i></div>
  <div class="area" style="border-color:{LINE};box-shadow:none;height:92px">Switches off after 10 minutes. The fan gets very loud just before.<span class="area__n">66/1000</span></div>
  <div class="lab">Photos <i>Optional · 2/5</i></div>
  <div class="photos">
    <div class="thumb"><img src="{img('photo-laptops.jpg', 160)}" alt=""><div class="thumb__x">{ic("x", 11, "#FFFFFF", 2.8)}</div></div>
    <div class="thumb"><img src="{img('photo-repair.jpg', 160)}" alt=""><div class="thumb__x">{ic("x", 11, "#FFFFFF", 2.8)}</div></div>
    <div class="addph">{ic("camera", 20, INK3, 1.8)}Add</div>
  </div>
</div>{foot1("Continue")}"""
BOOK.append((f"{n:02d} · Step 2 — Describe the issue", issue_body)); n += 1
BOOK.append((f"{n:02d} · Step 2 — Add photo (sheet)", issue_body + f"""
<div class="dim"></div>
<div class="sheet"><div class="sheet__h"></div>
  <div class="h" style="font-size:19px">Add a photo</div>
  <div class="bsub">Show the problem: screen, error message or damage.</div>
  <div style="display:flex;gap:12px;margin-top:18px">
    <div class="src"><div class="src__ic">{ic("camera", 22, OR, 1.8)}</div><div class="src__t">Camera</div><div class="src__d">Take a photo</div></div>
    <div class="src"><div class="src__ic">{ic("image", 22, OR, 1.8)}</div><div class="src__t">Gallery</div><div class="src__d">Choose from phone</div></div>
  </div>
  <div class="ghost" style="margin-top:14px">Cancel</div>
</div>""")); n += 1

# ---- Step 3: address
BOOK.append((f"{n:02d} · Step 3 — Select address", f"""{topbar(2)}
<div class="bbody">
  <div class="h btitle">Where should we come?</div>
  <div class="bsub">Pick a saved address or add a new one.</div>
  <div class="sh">SAVED ADDRESSES</div>
  <div class="addr addr--on"><div class="addr__ic">{ic("pin", 18, OR, 1.9)}</div><div class="addr__b"><div class="addr__t">{ADDR}</div><div class="addr__d">Jaipur, Rajasthan · 302012</div><div class="dtag">Default</div></div><div class="radio radio--on"><i></i></div></div>
  <div class="addr"><div class="addr__ic">{ic("pin", 18, INK3, 1.8)}</div><div class="addr__b"><div class="addr__t">4th Floor, Ganpati Plaza, MI Road</div><div class="addr__d">Jaipur, Rajasthan · 302001</div></div><div class="radio"></div></div>
  <div class="newaddr">{ic("plus", 18, OR, 2.2)}Add new address</div>
</div>{foot1("Continue")}""")); n += 1

BOOK.append((f"{n:02d} · Step 3 — Add new address", f"""{STATUS}
<div class="bar"><div class="round">{ic("back", 20, INK, 2)}</div><div class="bar__t">Add new address</div></div>
<div class="bbody" style="padding-top:8px">
  <div class="lab2">Full address</div><div class="area" style="height:84px">17B, Kumawat Colony, Alpana Colony<i class="caret" style="display:inline-block;vertical-align:middle;margin-left:2px"></i></div>
  <div class="lab2">Landmark / street <span style="font-weight:400;color:{MUTED}">(optional)</span></div><div class="inp"><span class="ph">e.g. Near City Mall</span></div>
  <div class="two"><div><div class="lab2">State</div><div class="inp"><span>Rajasthan</span>{ic("down", 17, INK3, 2)}</div></div>
    <div><div class="lab2">City</div><div class="inp"><span>Jaipur</span>{ic("down", 17, INK3, 2)}</div></div></div>
  <div class="lab2">Pincode</div><div class="inp"><span>302012</span></div>
  <div class="card" style="margin-top:16px"><div class="row2"><div class="row2__b"><div class="row2__v">Set as default address</div><div class="row2__k">Used first next time</div></div><div class="toggle" style="background:{OR};justify-content:flex-end"><i></i></div></div></div>
</div>{foot1("Save address", "check")}""")); n += 1

days = "".join(
    f'<div class="day{" day--on" if d == PICK else ""}"><div class="day__w">{"Today" if d == TODAY else f"{d:%a}"}</div><div class="day__d">{d.day}</div></div>'
    for d in DAYS)
slots = "".join(
    f'<div class="slot{" slot--on" if i == 2 else ""}">{ic("clock", 15, OR if i == 2 else INK3, 2)}{s}</div>'
    for i, s in enumerate(SLOT_SHOW))
BOOK.append((f"{n:02d} · Step 3 — Date & time", f"""{topbar(2)}
<div class="bbody">
  <div class="h btitle">When should we come?</div>
  <div class="lab" style="margin-top:18px">{PICK:%B %Y} <i style="color:{OR};font-weight:600;display:flex;align-items:center;gap:5px">{ic("calendar", 15, OR, 2)}Calendar</i></div>
  <div class="days" style="margin-top:0">{days}</div>
  <div class="lab" style="margin-top:22px">Time slot <i>Engineer arrives within the slot</i></div>
  <div class="slots">{slots}</div>
  <div class="card" style="margin-top:20px"><div class="row2"><div class="row2__ic" style="background:{BG2}">{ic("user", 18, INK3, 1.8)}</div>
    <div class="row2__b"><div class="row2__v">Someone else will be there?</div><div class="row2__k">Add their name &amp; mobile</div></div><div class="toggle"><i></i></div></div></div>
</div>{foot2("Continue", f"{PICK:%a}, {PICK.day} {PICK:%b}", "1 – 3 PM")}""")); n += 1

# ---- Step 4: review
rows = [("laptop", "Device", f"{DEV[1]} · {DEV[2]}"), ("wrench", "Problem", ISSUE_NAME),
        ("doc", "Issue", "Shuts down, overheating · 2 photos"), ("pin", "Address", ADDR + ", Jaipur 302012"), ("calendar", "Visit", WHEN)]
rows_html = "".join(
    f'<div class="row2"><div class="row2__ic">{ic(i_ if i_ in P else "monitor", 17, OR, 1.9)}</div><div class="row2__b"><div class="row2__k">{k}</div>'
    f'<div class="row2__v">{e(v)}</div></div><div class="row2__e">Edit</div></div>' for i_, k, v in rows)
fee = FEE
gst = round(fee * 0.18, 2)
total = round(fee + gst, 2)
review = f"""{topbar(3)}
<div class="bbody">
  <div class="h btitle">Review &amp; confirm</div>
  <div class="card" style="margin-top:14px">{rows_html}</div>
  <div class="bill"><div class="bill__r"><span>Diagnosis charge</span><b>₹{fee:,.2f}</b></div>
    <div class="bill__r"><span>GST (CGST 9% + SGST 9%)</span><b>₹{gst:,.2f}</b></div>
    <div class="bill__rule"></div><div class="bill__t"><span>Total</span><span>₹{total:,.2f}</span></div></div>
  <div class="paynote">{ic("wallet", 16, GREEN, 2)}Pay by cash after the visit</div>
  <div class="terms"><div class="cbox">{ic("check", 13, "#FFFFFF", 3)}</div><span>I accept the <b style="color:{OR}">Terms &amp; Conditions</b></span></div>
</div>{foot2("Confirm booking", "Total", f"₹{total:,.2f}", "check")}"""
BOOK.append((f"{n:02d} · Step 4 — Review & confirm", review)); n += 1
BOOK.append((f"{n:02d} · Step 4 — Verify number (logged out)", review + f"""
<div class="dim"></div>
<div class="sheet"><div class="sheet__h"></div>
  <div class="badge" style="width:52px;height:52px;border-radius:16px">{ic("phone", 24, OR, 1.8)}</div>
  <div class="h" style="font-size:20px;margin-top:14px">Log in to book</div>
  <div class="bsub">One-time code by SMS. No password needed.</div>
  <div class="label">Mobile number</div>
  <div class="field field--on"><div class="cc">{FLAG}+91</div><span>98765 43210</span></div>
  <div class="btn" style="margin-top:18px">Get OTP {ic("arrow", 18, "#FFFFFF", 2.2)}</div>
  <div class="alt" style="margin-top:16px;padding:0">New to FixPapa? <b>Create account</b></div>
</div>""")); n += 1

# ---- done
tl = [("Request received", "Just now", True), ("Engineer assigned", "We'll call you to confirm", False), ("Engineer visits", WHEN, False)]
tl_html = "".join(
    f'<div class="tl__i"><div class="tl__rail"><div class="tl__dot{"" if done else " tl__dot--todo"}">{ic("check", 12, "#FFFFFF", 3) if done else ""}</div>'
    + ('<div class="tl__line"></div>' if i < 2 else "") + f'</div><div class="tl__b"><div class="tl__t">{t}</div><div class="tl__s">{e(s)}</div></div></div>'
    for i, (t, s, done) in enumerate(tl))
BOOK.append((f"{n:02d} · Request submitted", f"""{STATUS}
<div class="done">
  <div class="done__r1"><div class="done__r2"><div class="done__d">{ic("check", 38, "#FFFFFF", 3)}</div></div></div>
  <div class="h" style="margin-top:20px;font-size:26px">Request submitted!</div>
  <div class="bsub" style="text-align:center;width:300px;margin-top:6px">{DEV[1]} · {DEV[2]} · {ISSUE_NAME}. Track it any time from Bookings.</div>
  <div class="bid">Request ID <b>#10482</b></div>
  <div class="tl">{tl_html}</div>
</div>
<div style="padding:12px 20px 38px;display:flex;flex-direction:column;gap:10px">
  <div class="btn">View my bookings {ic("arrow", 18, "#FFFFFF", 2.2)}</div><div class="ghost">Back to home</div></div>"""))


a = page("FixPapa App — Login v2", AUTH)
open(os.path.join(OUT, "02-auth-v2.html"), "w").write(a)
b = page("FixPapa App — Book a Repair v2", BOOK)
# category screen is taller than one phone (14 tiles) — let it grow
b = b.replace('<main class="screen" data-screen="01 · What needs fixing', '<main class="screen" style="height:auto;padding-bottom:40px" data-screen="01 · What needs fixing', 1)
open(os.path.join(OUT, "05-book-repair-v2.html"), "w").write(b)
print("02-auth-v2.html", len(a) // 1024, "KB · 05-book-repair-v2.html", len(b) // 1024, "KB ·", len(BOOK), "screens")
