"""Generate the Book a Repair app flow — Figma-safe HTML (run: python3 -I gen_repair_html.py <this dir> <design-html dir>).

Writes 05-book-repair-all.html (every screen side by side) and one file per screen (05-book-repair-NN-*.html).
Same tokens as 01-home / 02-04-auth (lib/core/theme). Flow mirrors the live app + website booking:
landing → category → brand → service type → issue (+photo sheet) → address (+new address) → date & slot
→ review → verify number (if logged out) → submitted.

Figma-safe rules: images inlined as data URIs, no ::before/::after, no <use>, no sticky / aspect-ratio /
text-transform / line-clamp, explicit colours, flexbox (absolute only for overlays).
"""
import datetime
import html
import os
import re
import sys

sys.path.insert(0, sys.argv[1])
from figma_safe import img, svg_data  # noqa: E402

OUT = sys.argv[2]
SET5 = "/home/sharasti/theme/set-5/"
e = html.escape

INK, INK2, INK3, MUTED = "#0B1220", "#1E293B", "#475569", "#8E99AB"
PRIMARY, PRIMARY2, PRIMARY3, TINT = "#FF6A00", "#FF8A1F", "#FDBA74", "#FFF4EC"
WHITE, GREEN, LINE, FIELD = "#FFFFFF", "#16A34A", "#E8EBF1", "#F1F5F9"

# ---------------------------------------------------------------- icons (24px line icons, same set as the website)
SPRITE = open(SET5 + "repair.html", encoding="utf-8").read()
ICON = {m.group(1): m.group(2) for m in re.finditer(r'<symbol id="i-([\w-]+)"[^>]*>(.*?)</symbol>', SPRITE, re.S)}
ICON.update({
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "bag": '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
    "login": '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l4-4-4-4M14 12H4"/>',
    "grid": '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    "recycle": '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-.9 1.8 1.8 0 0 1 0-1.8L7.2 9.5"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-.9 1.8 1.8 0 0 0 0-1.8l-1.2-2.1"/><path d="M14 16l-3 3 3 3"/><path d="M8.3 13.6L7.2 9.5 3.1 10.6"/><path d="M9.3 5.8l1.1-1.9A1.8 1.8 0 0 1 12 3a1.8 1.8 0 0 1 1.5.9l3.9 6.8"/><path d="M13.4 9.6l4.1 1.1 1.1-4.1"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "chev-r": '<path d="M9 5l7 7-7 7"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "minus": '<path d="M5 12h14"/>',
    "x": '<path d="M6 6l12 12M18 6L6 18"/>',
    "camera": '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    "image": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    "locate": '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    "home": '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    "office": '<path d="M4 21V5.5L12 3v18M12 8.5l8 2.5v10M2.5 21h19M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
    "edit": '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "doc": '<path d="M6 2.5h9l4 4V21.5H6z"/><path d="M15 2.5v4h4M9 12h7M9 16h5"/>',
})


def icon(name, size=20, color=INK, sw=None):
    body = ICON[name].replace("currentColor", color)
    w = f' stroke-width="{sw}"' if sw else ' stroke-width="1.9"'
    fill = color if name in ("star", "play") else "none"
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" stroke="{color if fill == "none" else "none"}"'
            f'{w} stroke-linecap="round" stroke-linejoin="round">{body}</svg>')


def brand_logo(b, size=30):
    s = open(SET5 + "assets/img/brands/" + b + ".svg", encoding="utf-8").read()
    s = re.sub(r"<title>.*?</title>", "", s)
    return f'<img src="{svg_data(s)}" width="{size}" height="{size}" alt="">'


CATS = [("apple", "Apple", "apple"), ("biometric", "Biometric", "finger"), ("cctv", "CCTV", "cctv"),
        ("desktop", "Desktop", "desktop"), ("laptop", "Laptop", "laptop"), ("monitor", "Monitor", "monitor"),
        ("network", "Networking / LAN", "network"), ("printer", "Printer", "printer"), ("projector", "Projector", "projector"),
        ("server", "Server", "server"), ("scanner", "Scanner", "scanner"), ("tablet", "Tablet", "tablet"),
        ("ups", "UPS", "ups"), ("wifi", "Wi-Fi", "wifi")]
BRANDS = [("dell", "Dell"), ("hp", "HP"), ("lenovo", "Lenovo"), ("apple", "Apple"), ("asus", "Asus"),
          ("acer", "Acer"), ("msi", "MSI"), ("microsoft", "Microsoft")]
ISSUES = [("Laptop Software Issues", "OS, drivers, viruses, slow boot", 599),
          ("Laptop Hardware Issues", "Not powering on, shutdowns, keyboard, ports", 599),
          ("Laptop Physical / Damage Issues", "Broken hinge, body, liquid damage", 499),
          ("Laptop Display Issues", "No display, flicker, lines, cracked panel", 599),
          ("Laptop Power / Connectivity Issues", "Battery, charging, Wi-Fi, Bluetooth", 599),
          ("Other Issue", "Not sure? Our technician will diagnose it", 699)]

TODAY = datetime.date(2026, 11, 16)
DAYS = [TODAY + datetime.timedelta(d) for d in range(7)]
SLOTS = ["9 – 11 AM", "11 AM – 1 PM", "1 – 3 PM", "3 – 5 PM", "5 – 7 PM"]
PICK_DAY = DAYS[1]
WHEN = f"{PICK_DAY:%a}, {PICK_DAY.day} {PICK_DAY:%b} · 1 – 3 PM"
ADDR = "17B, Kumawat Colony, Alpana Colony, Jaipur, Rajasthan 302012"

GRAD_PRIMARY = "linear-gradient(135deg, #FF6A00 0%, #FF8A1F 70%, #FFA24D 100%)"
GRAD_DARK = "linear-gradient(160deg, #0B1220 0%, #111A2E 60%, #16254A 100%)"
REPAIR_OV = "linear-gradient(90deg, #0B1220 0%, rgba(11,18,32,.6) 45%, rgba(11,18,32,0) 100%)"

CSS = """
  /* Tokens mirror lib/core/theme — literal values (no var()) so Figma reads them directly. */
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#E5E7EB; font-family:'Inter',sans-serif; color:#1E293B; -webkit-font-smoothing:antialiased;
         display:flex; flex-wrap:wrap; align-items:flex-start; gap:48px 40px; padding:24px; }
  body.one { justify-content:center; }
  svg, img { display:block; flex:none; }
  .frame { display:flex; flex-direction:column; align-items:flex-start; }
  .frame-title { margin-bottom:10px; font-family:'JetBrains Mono',monospace; font-weight:600; font-size:12px; line-height:16px; letter-spacing:.7px; color:#64748B; }
  .screen { position:relative; width:390px; height:844px; flex:none; background:#FFFFFF; display:flex; flex-direction:column; overflow:hidden; }
  .screen--long { height:auto; }
  .body { flex:1; display:flex; flex-direction:column; padding:0 20px; overflow:hidden; }
  .grow { flex:1; }
  .row { display:flex; align-items:center; }
  .ph { position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; }
  .ov { position:absolute; left:0; top:0; width:100%; height:100%; }
  .layer { position:relative; display:flex; flex-direction:column; }

  /* Type */
  .eyebrow { display:flex; align-items:center; gap:8px; font-family:'JetBrains Mono',monospace; font-weight:500; font-size:11px; line-height:14px; letter-spacing:1.6px; }
  .eyebrow__bar { width:18px; height:1.5px; }
  .h1 { font-family:'Manrope',sans-serif; font-weight:800; font-size:24px; line-height:29px; letter-spacing:-0.48px; color:#0B1220; }
  .h2 { font-family:'Manrope',sans-serif; font-weight:800; font-size:21px; line-height:26px; letter-spacing:-0.42px; color:#0B1220; }
  .h3 { font-family:'Manrope',sans-serif; font-weight:700; font-size:16px; line-height:20px; letter-spacing:-0.2px; color:#0B1220; }
  .sub { margin-top:6px; font-size:14px; line-height:21px; color:#475569; }
  .small { font-size:12.5px; line-height:17px; color:#475569; }
  .mono { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:12px; line-height:16px; color:#475569; }
  .orange { color:#FF6A00; }
  .link { font-family:'Manrope',sans-serif; font-weight:700; font-size:13px; line-height:16px; color:#FF6A00; }

  /* Main header (landing) */
  .header { height:64px; flex:none; display:flex; align-items:center; gap:12px; padding:0 20px; background:#FFFFFF; border-bottom:1px solid #E8EBF1; }
  .header__logo { height:24px; width:126px; object-fit:contain; }
  .icon-btn { width:40px; height:40px; border-radius:20px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex:none; }
  .login { height:37px; padding:0 16px 0 14px; border-radius:19px; background:#0B1220; display:flex; align-items:center; gap:6px;
           font-family:'Manrope',sans-serif; font-weight:700; font-size:13.5px; line-height:17px; color:#FFFFFF; }

  /* Flow top bar + stepper */
  .topbar { flex:none; padding:12px 20px 14px; background:#FFFFFF; display:flex; flex-direction:column; gap:14px; }
  .topbar__row { height:40px; display:flex; align-items:center; gap:12px; }
  .topbar__title { flex:1; font-family:'Manrope',sans-serif; font-weight:800; font-size:17px; line-height:21px; letter-spacing:-0.3px; color:#0B1220; }
  .topbar__count { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:11.5px; line-height:14px; color:#475569; }
  .steps { display:flex; gap:6px; }
  .step { flex:1; display:flex; flex-direction:column; gap:7px; }
  .step__bar { height:4px; border-radius:2px; background:#E8EBF1; }
  .step__lbl { font-family:'Manrope',sans-serif; font-weight:600; font-size:11px; line-height:13px; color:#8E99AB; }
  .step--done .step__bar { background:#FF8A1F; }
  .step--done .step__lbl { color:#475569; }
  .step--on .step__bar { background:#FF6A00; }
  .step--on .step__lbl { color:#0B1220; font-weight:800; }

  /* Picked summary chips */
  .picked { display:flex; gap:8px; margin-bottom:16px; }
  .chip { height:34px; padding:0 12px 0 8px; border-radius:17px; background:#FFF4EC; border:1px solid #FED7AA; display:flex; align-items:center; gap:6px;
          font-family:'Manrope',sans-serif; font-weight:700; font-size:12.5px; line-height:15px; color:#0B1220; }
  .chip__ic { width:22px; height:22px; border-radius:11px; background:#FFFFFF; display:flex; align-items:center; justify-content:center; }
  .chip--plain { background:#F1F5F9; border-color:#F1F5F9; padding:0 12px; color:#475569; font-weight:600; }

  /* Bottom CTA bar */
  .cta { flex:none; padding:12px 20px 22px; background:#FFFFFF; border-top:1px solid #E8EBF1; box-shadow:0 -8px 24px rgba(15,23,42,.06); display:flex; align-items:center; gap:14px; }
  .cta__info { display:flex; flex-direction:column; gap:2px; }
  .cta__k { font-size:11.5px; line-height:14px; color:#475569; }
  .cta__v { font-family:'Manrope',sans-serif; font-weight:800; font-size:18px; line-height:22px; color:#0B1220; }
  .btn { height:52px; flex:none; border-radius:26px; display:flex; align-items:center; justify-content:center; gap:8px; padding:0 22px;
         font-family:'Manrope',sans-serif; font-weight:700; font-size:15px; line-height:18px; letter-spacing:.15px; }
  .btn--primary { background:linear-gradient(135deg, #FF6A00 0%, #FF8A1F 70%, #FFA24D 100%); color:#FFFFFF; box-shadow:0 10px 30px -8px rgba(255,138,31,.55); }
  .btn--ghost { background:#FFFFFF; color:#0B1220; border:1px solid #D5DBE5; }
  .btn--dark { background:#0B1220; color:#FFFFFF; }
  .btn--off { background:#E8EBF1; color:#8E99AB; box-shadow:none; }
  .btn--full { flex:1; }
  .btn--sm { height:40px; border-radius:20px; padding:0 16px; font-size:13.5px; }

  /* Tiles: category */
  .grid { display:flex; flex-wrap:wrap; gap:10px; }
  .cat { position:relative; width:109px; height:92px; border-radius:18px; background:#F8FAFC; border:1.5px solid #EEF1F5;
         display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; padding:8px 6px; }
  .cat__ic { width:40px; height:40px; border-radius:20px; background:#FFFFFF; border:1px solid #E8EBF1; display:flex; align-items:center; justify-content:center; }
  .cat__lbl { font-size:12px; font-weight:600; line-height:14px; color:#1E293B; text-align:center; }
  .cat--on { background:#FFF4EC; border-color:#FF6A00; }
  .cat--on .cat__ic { background:#FF6A00; border-color:#FF6A00; }
  .tick { position:absolute; right:8px; top:8px; width:20px; height:20px; border-radius:10px; background:#FF6A00; display:flex; align-items:center; justify-content:center; }

  /* Tiles: brand */
  .brand { position:relative; width:109px; height:84px; border-radius:18px; background:#FFFFFF; border:1.5px solid #E8EBF1;
           display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; }
  .brand__name { font-family:'Manrope',sans-serif; font-weight:700; font-size:12.5px; line-height:15px; color:#1E293B; }
  .brand--on { background:#FFF4EC; border-color:#FF6A00; }
  .brand--other { background:#F8FAFC; border-style:dashed; border-color:#D5DBE5; }

  /* Search field */
  .search { height:46px; margin-bottom:14px; border-radius:23px; background:#F1F5F9; display:flex; align-items:center; gap:10px; padding:0 16px;
            font-size:14px; line-height:20px; color:#8E99AB; }

  /* Option cards (service type) */
  .opts { display:flex; flex-direction:column; gap:10px; }
  .opt { min-height:70px; border-radius:18px; background:#FFFFFF; border:1.5px solid #E8EBF1; display:flex; align-items:center; gap:12px; padding:12px 14px; }
  .opt__body { flex:1; display:flex; flex-direction:column; gap:3px; }
  .opt__t { font-family:'Manrope',sans-serif; font-weight:700; font-size:14.5px; line-height:18px; color:#0B1220; }
  .opt__d { font-size:12px; line-height:16px; color:#475569; }
  .opt__p { display:flex; flex-direction:column; align-items:flex-end; gap:1px; }
  .opt__pk { font-size:10.5px; line-height:13px; color:#8E99AB; }
  .opt__pv { font-family:'Manrope',sans-serif; font-weight:800; font-size:15px; line-height:18px; color:#0B1220; }
  .radio { width:22px; height:22px; border-radius:11px; border:2px solid #CBD5E1; background:#FFFFFF; flex:none; display:flex; align-items:center; justify-content:center; }
  .radio__dot { width:10px; height:10px; border-radius:5px; background:#FF6A00; }
  .opt--on { background:#FFF4EC; border-color:#FF6A00; }
  .opt--on .radio { border-color:#FF6A00; }

  /* Fields */
  .field { margin-top:14px; display:flex; flex-direction:column; }
  .label { margin-bottom:8px; display:flex; justify-content:space-between; font-size:13px; font-weight:600; line-height:16px; color:#1E293B; }
  .label i { font-style:normal; font-weight:500; color:#8E99AB; }
  .input { height:52px; border-radius:16px; background:#F1F5F9; border:1.5px solid #F1F5F9; display:flex; align-items:center; gap:10px; padding:0 16px; }
  .input--focus { background:#FFFFFF; border-color:#FF6A00; box-shadow:0 0 0 4px rgba(255,106,0,.12); }
  .input--area { height:96px; align-items:flex-start; padding-top:14px; }
  .input__hint { flex:1; font-size:14.5px; line-height:20px; color:#8E99AB; }
  .input__value { flex:1; font-size:14.5px; font-weight:500; line-height:20px; color:#0B1220; }
  .input__prefix { height:22px; padding-right:12px; border-right:1px solid #D5DBE5; font-size:15px; font-weight:600; line-height:22px; color:#0B1220; }
  .two { display:flex; gap:10px; }
  .two .field { flex:1; }
  .sugg { margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; }
  .pill { height:32px; padding:0 12px; border-radius:16px; background:#FFFFFF; border:1px solid #E2E8F0; display:flex; align-items:center; gap:6px;
          font-size:12.5px; font-weight:500; line-height:16px; color:#1E293B; }
  .pill--on { background:#0B1220; border-color:#0B1220; color:#FFFFFF; }

  /* Photos */
  .photos { margin-top:10px; display:flex; gap:10px; }
  .thumb { position:relative; width:76px; height:76px; border-radius:16px; overflow:hidden; }
  .thumb__x { position:absolute; right:5px; top:5px; width:20px; height:20px; border-radius:10px; background:rgba(11,18,32,.7); display:flex; align-items:center; justify-content:center; }
  .add { width:76px; height:76px; border-radius:16px; background:#F8FAFC; border:1.5px dashed #CBD5E1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
         font-size:11px; font-weight:600; line-height:13px; color:#475569; }

  /* Map */
  .map { position:relative; height:170px; border-radius:20px; overflow:hidden; background:#EEF2F6; border:1px solid #E2E8F0; }
  .map--tall { height:250px; border-radius:0; border:none; }
  .map__pin { position:absolute; left:50%; top:50%; margin-left:-18px; margin-top:-44px; }
  .map__locate { position:absolute; right:12px; bottom:12px; height:36px; padding:0 12px; border-radius:18px; background:#FFFFFF; box-shadow:0 6px 16px rgba(15,23,42,.14);
                 display:flex; align-items:center; gap:6px; font-family:'Manrope',sans-serif; font-weight:700; font-size:12.5px; line-height:15px; color:#0B1220; }
  .map__tag { position:absolute; left:50%; top:50%; margin-left:-78px; margin-top:-84px; width:156px; height:30px; border-radius:15px; background:#0B1220;
              display:flex; align-items:center; justify-content:center; font-size:11.5px; font-weight:600; line-height:14px; color:#FFFFFF; }

  /* Address cards */
  .addr { border-radius:18px; border:1.5px solid #E8EBF1; background:#FFFFFF; display:flex; gap:12px; padding:14px; }
  .addr--on { border-color:#FF6A00; background:#FFF4EC; }
  .addr__ic { width:36px; height:36px; border-radius:18px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex:none; }
  .addr--on .addr__ic { background:#FFFFFF; }
  .addr__body { flex:1; display:flex; flex-direction:column; gap:3px; }
  .addr__t { font-family:'Manrope',sans-serif; font-weight:700; font-size:14px; line-height:17px; color:#0B1220; }
  .addr__d { font-size:12.5px; line-height:18px; color:#475569; }
  .new { height:52px; border-radius:16px; border:1.5px dashed #FDBA74; background:#FFFFFF; display:flex; align-items:center; justify-content:center; gap:8px;
         font-family:'Manrope',sans-serif; font-weight:700; font-size:14px; line-height:17px; color:#FF6A00; }

  /* Date + slot */
  .days { display:flex; gap:7px; }
  .day { width:44px; height:68px; border-radius:16px; background:#FFFFFF; border:1.5px solid #E8EBF1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; flex:none; }
  .day__w { font-size:11px; font-weight:600; line-height:13px; color:#8E99AB; }
  .day__d { font-family:'Manrope',sans-serif; font-weight:800; font-size:18px; line-height:21px; color:#0B1220; }
  .day--on { background:#0B1220; border-color:#0B1220; }
  .day--on .day__w { color:rgba(255,255,255,.65); }
  .day--on .day__d { color:#FFFFFF; }
  .slots { display:flex; flex-wrap:wrap; gap:10px; }
  .slot { width:170px; height:50px; border-radius:16px; background:#FFFFFF; border:1.5px solid #E8EBF1; display:flex; align-items:center; justify-content:center; gap:8px;
          font-family:'Manrope',sans-serif; font-weight:700; font-size:14px; line-height:17px; color:#0B1220; }
  .slot--on { background:#FFF4EC; border-color:#FF6A00; color:#E85D04; }
  .slot--off { background:#F8FAFC; border-color:#F1F5F9; color:#B6BFCC; }
  .toggle { width:44px; height:26px; border-radius:13px; background:#CBD5E1; display:flex; align-items:center; padding:3px; flex:none; }
  .toggle__k { width:20px; height:20px; border-radius:10px; background:#FFFFFF; box-shadow:0 1px 3px rgba(15,23,42,.2); }
  .toggle--on { background:#FF6A00; justify-content:flex-end; }
  .card { border-radius:18px; border:1px solid #E8EBF1; background:#FFFFFF; padding:14px; }
  .note { border-radius:14px; background:#F1F5F9; padding:12px 14px; display:flex; gap:10px; align-items:flex-start; font-size:12.5px; line-height:18px; color:#475569; }

  /* Review */
  .sum { border-radius:20px; border:1px solid #E8EBF1; background:#FFFFFF; display:flex; flex-direction:column; }
  .sum__row { display:flex; gap:12px; padding:13px 14px; border-bottom:1px solid #F1F5F9; }
  .sum__row--last { border-bottom:none; }
  .sum__ic { width:34px; height:34px; border-radius:17px; background:#FFF4EC; display:flex; align-items:center; justify-content:center; flex:none; }
  .sum__body { flex:1; display:flex; flex-direction:column; gap:2px; }
  .sum__k { font-size:11.5px; font-weight:500; line-height:14px; color:#8E99AB; }
  .sum__v { font-size:13.5px; font-weight:600; line-height:18px; color:#0B1220; }
  .bill { margin-top:14px; border-radius:20px; background:#F8FAFC; padding:14px; display:flex; flex-direction:column; gap:9px; }
  .bill__r { display:flex; justify-content:space-between; font-size:13px; line-height:17px; color:#475569; }
  .bill__r b { font-weight:600; color:#0B1220; }
  .bill__rule { height:1px; background:#E2E8F0; }
  .bill__t { display:flex; justify-content:space-between; font-family:'Manrope',sans-serif; font-weight:800; font-size:16px; line-height:20px; color:#0B1220; }
  .check { width:22px; height:22px; border-radius:7px; background:#FF6A00; display:flex; align-items:center; justify-content:center; flex:none; }
  .terms { margin-top:14px; display:flex; gap:10px; align-items:center; font-size:12.5px; line-height:17px; color:#475569; }

  /* Overlay + bottom sheet */
  .dim { position:absolute; left:0; top:0; width:390px; height:844px; background:rgba(11,18,32,.55); }
  .sheet { position:absolute; left:0; bottom:0; width:390px; background:#FFFFFF; border-radius:28px 28px 0 0; padding:10px 20px 26px; display:flex; flex-direction:column; }
  .sheet__handle { width:36px; height:4px; border-radius:2px; background:#D5DBE5; margin:2px auto 18px; }
  .src { flex:1; height:112px; border-radius:20px; background:#F8FAFC; border:1.5px solid #E8EBF1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; }
  .src__ic { width:48px; height:48px; border-radius:24px; background:#FFF4EC; display:flex; align-items:center; justify-content:center; }
  .src__t { font-family:'Manrope',sans-serif; font-weight:700; font-size:14px; line-height:17px; color:#0B1220; }
  .src__d { font-size:11.5px; line-height:14px; color:#8E99AB; }
  .seg { height:46px; border-radius:23px; background:#F1F5F9; padding:4px; display:flex; }
  .seg__o { flex:1; border-radius:19px; display:flex; align-items:center; justify-content:center; font-family:'Manrope',sans-serif; font-weight:700; font-size:13.5px; line-height:16px; color:#475569; }
  .seg__o--on { background:#FFFFFF; color:#0B1220; box-shadow:0 2px 8px rgba(15,23,42,.08); }

  /* Success */
  .done { flex:1; display:flex; flex-direction:column; align-items:center; padding:56px 20px 0; }
  .done__ring { width:112px; height:112px; border-radius:56px; background:#DCFCE7; display:flex; align-items:center; justify-content:center; }
  .done__dot { width:76px; height:76px; border-radius:38px; background:#16A34A; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px -8px rgba(22,163,74,.6); }
  .ref { margin-top:16px; height:36px; padding:0 14px; border-radius:18px; background:#F1F5F9; display:flex; align-items:center; gap:8px; }
  .tl { width:350px; margin-top:24px; border-radius:20px; border:1px solid #E8EBF1; padding:16px; display:flex; flex-direction:column; }
  .tl__i { display:flex; gap:12px; }
  .tl__rail { width:22px; display:flex; flex-direction:column; align-items:center; }
  .tl__dot { width:22px; height:22px; border-radius:11px; display:flex; align-items:center; justify-content:center; background:#16A34A; }
  .tl__dot--todo { background:#FFFFFF; border:2px solid #D5DBE5; }
  .tl__line { width:2px; height:26px; background:#E2E8F0; }
  .tl__body { flex:1; padding-bottom:12px; display:flex; flex-direction:column; gap:2px; }

  /* Landing */
  .hero { position:relative; margin:16px 20px 0; border-radius:24px; overflow:hidden; background:linear-gradient(160deg, #0B1220 0%, #111A2E 60%, #16254A 100%); }
  .hero__photo { position:absolute; right:0; top:0; bottom:0; width:190px; overflow:hidden; }
  .hero__text { position:relative; padding:24px 20px 22px; display:flex; flex-direction:column; }
  .hero__title { margin-top:12px; font-family:'Manrope',sans-serif; font-weight:800; font-size:34px; line-height:36px; letter-spacing:-0.68px; color:#FFFFFF; }
  .hero__desc { margin-top:10px; width:210px; font-size:13px; line-height:19.5px; color:rgba(255,255,255,.72); }
  .hero__text .btn { margin-top:20px; align-self:flex-start; }
  .trust { position:relative; margin:0 20px 18px; padding-top:14px; border-top:1px solid rgba(255,255,255,.08); display:flex; justify-content:space-between; }
  .trust__i { display:flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; line-height:14px; color:rgba(255,255,255,.85); }
  .sec { margin-top:32px; padding:0 20px; display:flex; flex-direction:column; }
  .sec__head { margin-bottom:14px; display:flex; flex-direction:column; gap:6px; }
  .how { display:flex; flex-direction:column; gap:0; }
  .how__i { display:flex; gap:14px; }
  .how__rail { width:36px; display:flex; flex-direction:column; align-items:center; }
  .how__n { width:36px; height:36px; border-radius:18px; background:#FFF4EC; border:1.5px solid #FED7AA; display:flex; align-items:center; justify-content:center;
            font-family:'Manrope',sans-serif; font-weight:800; font-size:14px; line-height:17px; color:#E85D04; }
  .how__line { width:2px; height:22px; background:#FED7AA; }
  .how__body { flex:1; padding-top:2px; padding-bottom:12px; display:flex; flex-direction:column; gap:3px; }
  .stats { margin:32px 20px 0; border-radius:24px; background:linear-gradient(160deg, #0B1220 0%, #111A2E 60%, #16254A 100%); padding:22px 20px; display:flex; flex-direction:column; gap:18px; }
  .stats__grid { display:flex; flex-wrap:wrap; gap:16px 0; }
  .stat { width:50%; display:flex; flex-direction:column; gap:3px; }
  .stat__v { font-family:'Manrope',sans-serif; font-weight:800; font-size:28px; line-height:32px; letter-spacing:-0.5px; color:#FFFFFF; }
  .stat__k { font-size:12px; line-height:16px; color:rgba(255,255,255,.65); }
  .videos { display:flex; gap:12px; }
  .video { width:236px; flex:none; display:flex; flex-direction:column; gap:8px; }
  .video__thumb { position:relative; height:140px; border-radius:18px; overflow:hidden; }
  .video__play { position:absolute; left:50%; top:50%; margin:-24px 0 0 -24px; width:48px; height:48px; border-radius:24px; background:#FFFFFF; display:flex; align-items:center; justify-content:center; }
  .faq { border-bottom:1px solid #E8EBF1; padding:14px 0; display:flex; flex-direction:column; gap:8px; }
  .faq__q { display:flex; gap:12px; align-items:center; font-family:'Manrope',sans-serif; font-weight:700; font-size:14px; line-height:19px; color:#0B1220; }
  .faq__q span { flex:1; }
  .faq__a { font-size:13px; line-height:19.5px; color:#475569; }
  .tabbar { height:64px; flex:none; display:flex; background:#FFFFFF; border-top:1px solid #E8EBF1; box-shadow:0 -8px 24px rgba(15,23,42,.06); }
  .tab { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
         font-family:'Manrope',sans-serif; font-weight:600; font-size:11.5px; line-height:14px; color:#475569; }
  .tab__pill { width:52px; height:30px; border-radius:15px; display:flex; align-items:center; justify-content:center; }
  .tab--on { color:#0B1220; font-weight:700; }
  .tab--on .tab__pill { background:#FFF4EC; }
"""


# ---------------------------------------------------------------- building blocks
def eyebrow(text, color="#E85D04"):
    return f'<div class="eyebrow" style="color:{color}"><span class="eyebrow__bar" style="background:{color}"></span>{e(text.upper())}</div>'


STEP_NAMES = ["Device", "Issue", "Visit", "Confirm"]


def topbar(step, title="Book a Repair"):
    cells = "".join(
        f'<div class="step{" step--done" if i < step else " step--on" if i == step else ""}"><div class="step__bar"></div>'
        f'<p class="step__lbl">{n}</p></div>' for i, n in enumerate(STEP_NAMES))
    return (f'<header class="topbar"><div class="topbar__row"><div class="icon-btn">{icon("chev-l", 20)}</div>'
            f'<p class="topbar__title">{e(title)}</p><p class="topbar__count">STEP {step + 1}/4</p></div>'
            f'<div class="steps">{cells}</div></header>')


def chips(*items):
    out = []
    for ic, label in items:
        inner = f'<span class="chip__ic">{icon(ic, 14, PRIMARY)}</span>' if ic else ""
        out.append(f'<div class="chip">{inner}{e(label)}</div>')
    out.append(f'<div class="chip chip--plain">{icon("edit", 14, INK3)}Change</div>')
    return f'<div class="picked">{"".join(out)}</div>'


def title(h, sub=None):
    return f'<div style="margin:6px 0 16px"><h1 class="h1">{h}</h1>' + (f'<p class="sub">{sub}</p>' if sub else "") + "</div>"


def cta(label, info=None, off=False, ic="arrow"):
    left = (f'<div class="cta__info"><p class="cta__k">{info[0]}</p><p class="cta__v">{info[1]}</p></div>') if info else ""
    cls = "btn--off" if off else "btn--primary"
    return (f'<footer class="cta">{left}<div class="btn {cls} btn--full">{e(label)}'
            f'{icon(ic, 18, MUTED if off else WHITE) if ic else ""}</div></footer>')


def tick():
    return f'<span class="tick">{icon("check", 12, WHITE, 3)}</span>'


def cat_tile(c, on=False):
    cid, name, ic = c
    return (f'<div class="cat{" cat--on" if on else ""}">{tick() if on else ""}<div class="cat__ic">{icon(ic, 22, WHITE if on else PRIMARY)}</div>'
            f'<p class="cat__lbl">{e(name)}</p></div>')


def field(label, value=None, hint=None, focus=False, prefix=None, area=False, ic=None, opt=False, right=None):
    cls = "input" + (" input--focus" if focus else "") + (" input--area" if area else "")
    inner = (f'<span class="input__prefix">{prefix}</span>' if prefix else "") + (icon(ic, 18, INK3) if ic else "")
    inner += f'<span class="input__value">{e(value)}</span>' if value else f'<span class="input__hint">{e(hint or "")}</span>'
    inner += right or ""
    lab = f'{e(label)}' + (' <i>Optional</i>' if opt else "")
    return f'<div class="field"><div class="label"><span>{lab}</span></div><div class="{cls}">{inner}</div></div>'


def map_art(tall=False, tag=None, locate="Use current location"):
    """A drawn street map (no third-party tiles), pin in the centre."""
    w, h = 390, (250 if tall else 170)
    roads = (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position:absolute;left:0;top:0">'
             f'<rect width="{w}" height="{h}" fill="#EEF2F6"/>'
             f'<path d="M-10 {h*.62} C 90 {h*.55}, 170 {h*.75}, 400 {h*.58}" stroke="#FFFFFF" stroke-width="14" fill="none"/>'
             f'<path d="M120 -10 L 150 {h+10}" stroke="#FFFFFF" stroke-width="12" fill="none"/>'
             f'<path d="M260 -10 C 240 {h*.4}, 300 {h*.7}, 280 {h+10}" stroke="#FFFFFF" stroke-width="10" fill="none"/>'
             f'<path d="M-10 {h*.22} L 400 {h*.3}" stroke="#FFFFFF" stroke-width="8" fill="none"/>'
             f'<path d="M-10 {h*.62} C 90 {h*.55}, 170 {h*.75}, 400 {h*.58}" stroke="#FDE68A" stroke-width="4" fill="none"/>'
             f'<rect x="20" y="{h*.32}" width="80" height="{h*.2}" rx="6" fill="#DCFCE7"/>'
             f'<rect x="300" y="{h*.72}" width="70" height="{h*.2}" rx="6" fill="#DCFCE7"/>'
             f'<rect x="170" y="{h*.05}" width="70" height="{h*.13}" rx="6" fill="#E2E8F0"/>'
             f'<rect x="300" y="{h*.05}" width="60" height="{h*.16}" rx="6" fill="#E2E8F0"/>'
             f'<circle cx="195" cy="{h/2}" r="34" fill="#FF6A00" fill-opacity=".12"/></svg>')
    pin = ('<svg class="map__pin" width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z" fill="#FF6A00"/>'
           '<circle cx="18" cy="17" r="7" fill="#FFFFFF"/></svg>')
    t = f'<div class="map__tag">{e(tag)}</div>' if tag else ""
    loc = f'<div class="map__locate">{icon("locate", 16, PRIMARY)}{e(locate)}</div>' if locate else ""
    return f'<div class="map{" map--tall" if tall else ""}">{roads}{t}{pin}{loc}</div>'


def screen(name, body, long=False):
    return name, f'<main class="screen{" screen--long" if long else ""}" data-screen="{e(name)}">{body}</main>'


SCREENS = []

# ---------------------------------------------------------------- 01 landing
how = [("Choose your device", "Pick the category, brand and the kind of problem."),
       ("Describe the issue", "A line about it, plus photos if you have them."),
       ("Pick address & slot", "Choose a date and a 2-hour visit window."),
       ("Technician visits", "A verified engineer diagnoses and fixes it at your place.")]
how_html = "".join(
    f'<div class="how__i"><div class="how__rail"><div class="how__n">{i + 1}</div>'
    + ('<div class="how__line"></div>' if i < 3 else "") + f'</div><div class="how__body"><p class="h3" style="font-size:15px">{t}</p>'
    f'<p class="small">{d}</p></div></div>' for i, (t, d) in enumerate(how))
faqs = [("Are spare parts used during repairs genuine?", "Yes. We use genuine or OEM-grade parts and tell you before anything is replaced."),
        ("Can I track the status of my service request?", None),
        ("How quickly will an engineer be assigned?", None),
        ("Which brands does FixPapa service?", None)]
faq_html = "".join(
    f'<div class="faq"><div class="faq__q"><span>{q}</span>{icon("minus" if a else "plus", 18, PRIMARY if a else INK3)}</div>'
    + (f'<p class="faq__a">{a}</p>' if a else "") + "</div>" for q, a in faqs)
stats = [("1K+", "Satisfied B2B clients"), ("2K+", "Satisfied B2C clients"), ("850+", "Freelancer engineers"), ("14K+", "Partners in network")]
stats_html = "".join(f'<div class="stat"><p class="stat__v">{v}</p><p class="stat__k">{k}</p></div>' for v, k in stats)
VID_OV = "linear-gradient(180deg, rgba(11,18,32,0) 0%, rgba(11,18,32,.55) 100%)"
vids = [("photo-tech.jpg", "Laptop fixed the same day", "Rakesh M · Jaipur"), ("photo-support.jpg", "Office printers back in an hour", "Neha S · Delhi")]
vids_html = "".join(
    f'<div class="video"><div class="video__thumb"><img class="ph" src="{img(src, 480)}" alt=""><div class="ov" style="background:{VID_OV}"></div>'
    f'<div class="video__play">{icon("play", 22, PRIMARY)}</div></div><p class="h3" style="font-size:14px">{t}</p><p class="mono" style="font-size:10.5px">{w}</p></div>'
    for src, t, w in vids)
tabs = "".join(
    f'<div class="tab{" tab--on" if on else ""}"><div class="tab__pill">{icon(ic, 22, PRIMARY if on else INK3)}</div>{lbl}</div>'
    for ic, lbl, on in [("grid", "Home", False), ("wrench", "Book Repair", True), ("recycle", "E-Waste", False), ("shield", "AMC", False)])

SCREENS.append(screen("01 · Book a Repair — landing", f"""
  <header class="header"><div class="icon-btn">{icon('menu', 20)}</div><img class="header__logo" src="{img('logo.png', 260)}" alt="">
    <div class="grow"></div><div class="icon-btn">{icon('bag', 19)}</div><div class="login">{icon('login', 16, WHITE)}Login</div></header>
  <section class="hero">
    <div class="hero__photo"><img class="ph" src="{img('photo-repair.jpg', 400)}" alt=""><div class="ov" style="background:{REPAIR_OV}"></div></div>
    <div class="hero__text">{eyebrow('Repair · Doorstep', PRIMARY3)}
      <h1 class="hero__title">Book a<br><span style="color:{PRIMARY2}">Repair</span></h1>
      <p class="hero__desc">Apple, HP, Dell, Lenovo, Canon, Epson and more. Skilled technicians at your doorstep.</p>
      <div class="btn btn--primary">Book a service now {icon('arrow', 18, WHITE)}</div></div>
    <div class="trust"><div class="trust__i">{icon('star', 14, PRIMARY2)}4.8 rating</div><div class="trust__i">{icon('badge', 15, PRIMARY3)}Verified experts</div>
      <div class="trust__i">{icon('clock', 15, PRIMARY3)}Call in 48 hrs</div></div>
  </section>
  <section class="sec"><div class="sec__head">{eyebrow('Explore services')}<h2 class="h2">What needs <span class="orange">fixing?</span></h2>
    <p class="small">Tap a device — we'll take you straight to choosing the brand.</p></div>
    <div class="grid">{''.join(cat_tile(c) for c in CATS)}</div></section>
  <section class="sec"><div class="sec__head">{eyebrow('How it works')}<h2 class="h2">Booked in <span class="orange">4 steps</span></h2></div>
    <div class="how">{how_html}</div></section>
  <section class="stats">{eyebrow('One stop for IT hardware', PRIMARY3)}<div class="stats__grid">{stats_html}</div>
    <div class="row" style="gap:10px"><p class="stat__v">500+</p><p class="stat__k">brands repaired<br>across India</p></div></section>
  <section class="sec"><div class="sec__head">{eyebrow('Testimonials')}<h2 class="h2">Words from our <span class="orange">clients</span></h2></div>
    <div class="videos">{vids_html}</div></section>
  <section class="sec"><div class="sec__head">{eyebrow('FAQ')}<h2 class="h2">Frequently asked <span class="orange">questions</span></h2></div>
    {faq_html}</section>
  <div style="height:28px"></div>
  <nav class="tabbar">{tabs}</nav>""", long=True))

# ---------------------------------------------------------------- 02 category
SCREENS.append(screen("02 · Step 1 — Select category", f"""
  {topbar(0)}
  <div class="body">{title('What needs fixing?', 'Choose your device category.')}
    <div class="grid">{''.join(cat_tile(c, c[0] == 'laptop') for c in CATS)}</div></div>
  {cta('Continue to brand')}"""))

# ---------------------------------------------------------------- 03 brand
brand_tiles = "".join(
    f'<div class="brand{" brand--on" if b == "dell" else ""}">{tick() if b == "dell" else ""}{brand_logo(b, 28)}<p class="brand__name">{n}</p></div>'
    for b, n in BRANDS) + f'<div class="brand brand--other">{icon("plus", 22, INK3)}<p class="brand__name" style="color:{INK3}">Other brand</p></div>'
SCREENS.append(screen("03 · Step 1 — Select brand", f"""
  {topbar(0)}
  <div class="body">{chips(('laptop', 'Laptop'))}{title('Select the brand')}
    <div class="search">{icon('search', 18, MUTED)}Search brand</div>
    <div class="grid">{brand_tiles}</div></div>
  {cta('Continue to service')}"""))

# ---------------------------------------------------------------- 04 service type
opts = "".join(
    f'<div class="opt{" opt--on" if i == 1 else ""}"><div class="radio">{"<span class=radio__dot></span>" if i == 1 else ""}</div>'
    f'<div class="opt__body"><p class="opt__t">{e(t)}</p><p class="opt__d">{e(d)}</p></div>'
    f'<div class="opt__p"><p class="opt__pk">Diagnosis</p><p class="opt__pv">₹{p}</p></div></div>'
    for i, (t, d, p) in enumerate(ISSUES))
SCREENS.append(screen("04 · Step 1 — Select service type", f"""
  {topbar(0)}
  <div class="body">{chips(('laptop', 'Laptop'), ('check', 'Dell'))}{title('Select service type', 'Final repair cost is shared after diagnosis.')}
    <div class="opts">{opts}</div></div>
  {cta('Continue', ('Diagnosis charge', '₹599'))}"""))

# ---------------------------------------------------------------- 05 issue
issue_body = f"""
  {topbar(1)}
  <div class="body">{title('Tell us about the issue', 'Helps the technician bring the right parts.')}
    {field('Explain the issue', 'Laptop shuts down after 10 minutes', focus=True)}
    <div class="sugg"><div class="pill pill--on">Shuts down</div><div class="pill">Overheating</div><div class="pill">Not turning on</div><div class="pill">Very slow</div></div>
    {field('Any other information', 'Started last week. Fan gets very loud before it switches off.', area=True, opt=True)}
    <div class="field"><div class="label"><span>Relevant images <i>Optional · up to 5</i></span></div>
      <div class="photos" style="margin-top:0">
        <div class="thumb"><img class="ph" src="{img('photo-laptops.jpg', 160)}" alt=""><span class="thumb__x">{icon('x', 12, WHITE, 2.6)}</span></div>
        <div class="thumb"><img class="ph" src="{img('photo-repair.jpg', 160)}" alt=""><span class="thumb__x">{icon('x', 12, WHITE, 2.6)}</span></div>
        <div class="add">{icon('camera', 20, INK3)}Add</div></div></div></div>
  {cta('Continue to address')}"""
SCREENS.append(screen("05 · Step 2 — Describe the issue", issue_body))

# ---------------------------------------------------------------- 06 photo source sheet
SCREENS.append(screen("06 · Step 2 — Add photo (sheet)", issue_body + f"""
  <div class="dim"></div>
  <div class="sheet"><div class="sheet__handle"></div><p class="h3" style="font-size:18px">Add a photo</p>
    <p class="small" style="margin-top:4px">Show the problem — screen, error message or damage.</p>
    <div class="row" style="gap:12px;margin-top:18px">
      <div class="src"><div class="src__ic">{icon('camera', 24, PRIMARY)}</div><p class="src__t">Camera</p><p class="src__d">Take a photo</p></div>
      <div class="src"><div class="src__ic">{icon('image', 24, PRIMARY)}</div><p class="src__t">Gallery</p><p class="src__d">Choose from phone</p></div></div>
    <div class="btn btn--ghost" style="margin-top:16px">Cancel</div></div>"""))

# ---------------------------------------------------------------- 07 address
SCREENS.append(screen("07 · Step 3 — Select address", f"""
  {topbar(2)}
  <div class="body">{title('Where should we come?')}
    {map_art(tag='Alpana Colony, Jaipur')}
    <p class="h3" style="margin:20px 0 12px;font-size:15px">Saved addresses</p>
    <div class="addr addr--on"><div class="addr__ic">{icon('home', 18, PRIMARY)}</div><div class="addr__body"><p class="addr__t">Home</p>
      <p class="addr__d">{ADDR}</p></div><div class="radio" style="border-color:{PRIMARY}"><span class="radio__dot"></span></div></div>
    <div class="addr" style="margin-top:10px"><div class="addr__ic">{icon('office', 18, INK3)}</div><div class="addr__body"><p class="addr__t">Office</p>
      <p class="addr__d">4th Floor, Ganpati Plaza, MI Road, Jaipur 302001</p></div><div class="radio"></div></div>
    <div class="new" style="margin-top:12px">{icon('plus', 18, PRIMARY)}Add new address</div></div>
  {cta('Continue to date &amp; time'.replace('&amp;', '&'))}"""))

# ---------------------------------------------------------------- 08 new address
state_right = icon("chev-d", 18, INK3)
SCREENS.append(screen("08 · Step 3 — Add new address", f"""
  {topbar(2, 'Add new address')}
  {map_art(tall=True, tag='Move the map to your door', locate='Locate me')}
  <div class="body" style="padding-top:4px">
    {field('Apt, building, area', '17B, Kumawat Colony', focus=True)}
    {field('Street, locality', hint='Max 36 characters')}
    <div class="two">{field('State', 'Rajasthan', right=state_right)}{field('City', 'Jaipur', right=state_right)}</div>
    <div class="two">{field('Pincode', '302012')}<div class="field"><div class="label"><span>Save as</span></div>
      <div class="row" style="gap:6px;height:52px"><div class="pill pill--on">Home</div><div class="pill">Office</div><div class="pill">Other</div></div></div></div></div>
  {cta('Save address', ic='check')}"""))

# ---------------------------------------------------------------- 09 date + slot
days = "".join(
    f'<div class="day{" day--on" if d == PICK_DAY else ""}"><p class="day__w">{"Today" if d == TODAY else f"{d:%a}"}</p><p class="day__d">{d.day}</p></div>'
    for d in DAYS)
slots = "".join(
    f'<div class="slot{" slot--on" if i == 2 else ""}">{icon("clock", 16, PRIMARY if i == 2 else INK3)}{s}</div>' for i, s in enumerate(SLOTS))
SCREENS.append(screen("09 · Step 3 — Date & time slot", f"""
  {topbar(2)}
  <div class="body">{title('Pick a visit slot', 'When should the technician come?')}
    <div class="row" style="justify-content:space-between;margin-bottom:10px"><p class="h3" style="font-size:15px">{PICK_DAY:%B %Y}</p>
      <div class="row" style="gap:6px">{icon('calendar', 16, PRIMARY)}<span class="link">Calendar</span></div></div>
    <div class="days">{days}</div>
    <p class="h3" style="margin:22px 0 10px;font-size:15px">Time slot</p>
    <div class="slots">{slots}</div>
    <div class="card" style="margin-top:20px"><div class="row" style="gap:12px"><div class="addr__ic">{icon('user', 18, INK3)}</div>
      <div class="grow"><p class="addr__t">Someone else will be there?</p><p class="small">Add their name &amp; number</p></div>
      <div class="toggle"><span class="toggle__k"></span></div></div></div></div>
  {cta('Review booking', (f'{PICK_DAY:%a}, {PICK_DAY.day} {PICK_DAY:%b}', '1 – 3 PM'))}"""))

# ---------------------------------------------------------------- 10 review
rows = [("laptop", "Device", "Laptop · Dell"), ("wrench", "Service", "Laptop Hardware Issues"),
        ("doc", "Issue", "Laptop shuts down after 10 minutes · 2 photos"), ("pin", "Address", ADDR), ("calendar", "Visit", WHEN)]
rows_html = "".join(
    f'<div class="sum__row{" sum__row--last" if i == len(rows) - 1 else ""}"><div class="sum__ic">{icon(ic, 17, PRIMARY)}</div>'
    f'<div class="sum__body"><p class="sum__k">{k}</p><p class="sum__v">{e(v)}</p></div>{icon("edit", 16, MUTED)}</div>'
    for i, (ic, k, v) in enumerate(rows))
review_body = f"""
  {topbar(3)}
  <div class="body">{title('Review your booking')}
    <div class="sum">{rows_html}</div>
    <div class="bill"><div class="bill__r"><span>Diagnosis charge</span><b>₹599</b></div><div class="bill__r"><span>Visit charge</span><b style="color:{GREEN}">Free</b></div>
      <div class="bill__rule"></div><div class="bill__t"><span>Total</span><span>₹599</span></div></div>
    <div class="terms"><span class="check">{icon('check', 13, WHITE, 3)}</span><span>I have read and accepted the <b class="link" style="font-size:12.5px">Terms &amp; Conditions</b></span></div></div>
  {cta('Confirm booking', ('Total', '₹599'), ic='check')}"""
SCREENS.append(screen("10 · Step 4 — Review & confirm", review_body))

# ---------------------------------------------------------------- 11 verify number (logged out)
SCREENS.append(screen("11 · Step 4 — Verify number (logged out)", review_body + f"""
  <div class="dim"></div>
  <div class="sheet"><div class="sheet__handle"></div><p class="h3" style="font-size:18px">Verify your number to book</p>
    <p class="small" style="margin-top:4px">We'll send a one-time code. No password needed.</p>
    <div class="field"><div class="label"><span>Booking for</span></div><div class="seg"><div class="seg__o seg__o--on">Individual</div><div class="seg__o">Business</div></div></div>
    {field('Mobile number', '98765 43210', focus=True, prefix='+91')}
    <div class="btn btn--primary" style="margin-top:20px">Send OTP {icon('arrow', 18, WHITE)}</div></div>"""))

# ---------------------------------------------------------------- 12 success
tl = [("Request received", "Just now", True), ("Call from our representative", "Within 48 hours", False), ("Technician visit", WHEN, False)]
tl_html = "".join(
    f'<div class="tl__i"><div class="tl__rail"><div class="tl__dot{"" if done else " tl__dot--todo"}">{icon("check", 12, WHITE, 3) if done else ""}</div>'
    + ('<div class="tl__line"></div>' if i < 2 else "") + f'</div><div class="tl__body"><p class="addr__t">{t}</p><p class="small">{e(s)}</p></div></div>'
    for i, (t, s, done) in enumerate(tl))
SCREENS.append(screen("12 · Booking submitted", f"""
  <div class="done"><div class="done__ring"><div class="done__dot">{icon('check', 38, WHITE, 3)}</div></div>
    <h1 class="h1" style="margin-top:24px;text-align:center">Request submitted!</h1>
    <p class="sub" style="text-align:center;width:300px">Laptop · Dell · Hardware issue. Track it any time from My Account.</p>
    <div class="ref"><span class="mono">BOOKING ID</span><span class="mono" style="color:{INK};font-weight:600">FP-7K2Q9X</span></div>
    <div class="tl">{tl_html}</div></div>
  <footer class="cta" style="flex-direction:column;align-items:stretch;gap:10px;border-top:none;box-shadow:none">
    <div class="btn btn--primary">Track request {icon('arrow', 18, WHITE)}</div><div class="btn btn--ghost">Book another service</div></footer>"""))


# ---------------------------------------------------------------- write
def page(title_, frames, one=False):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title_)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body{' class="one"' if one else ''}>
{frames}
</body>
</html>
"""


def frame(name, body):
    return f'<div class="frame"><p class="frame-title">{e(name.upper())}</p>\n{body}\n</div>'


all_html = page("FixPapa App — 05 Book a Repair (full flow)", "\n".join(frame(n, b) for n, b in SCREENS))
open(os.path.join(OUT, "05-book-repair-all.html"), "w").write(all_html)
print("05-book-repair-all.html", f"{len(all_html) / 1024:.0f} KB")
for n, b in SCREENS:
    num, rest = n.split(" · ", 1)
    slug = re.sub(r"[^a-z0-9]+", "-", rest.lower()).strip("-")
    fn = f"05-book-repair-{num}-{slug}.html"
    open(os.path.join(OUT, fn), "w").write(page(f"FixPapa App — Book a Repair {n}", frame(n, b), one=True))
    print(fn)
