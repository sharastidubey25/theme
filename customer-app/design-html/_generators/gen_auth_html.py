"""Generate design-html/02-login.html, 03-otp.html, 04-register.html — Figma-safe.

Run: python3 -I gen_auth_html.py <scratch> <out_dir>
Rules: images inlined, no var()/::before/::after/inset/grid, icons with explicit colours,
fixed px line-heights, one frame per phone (multiple frames side by side for states).
"""
import sys

sys.path.insert(0, sys.argv[1])
from figma_safe import img  # noqa: E402

OUT = sys.argv[2]

INK, INK2, INK3 = "#0B1220", "#1E293B", "#475569"
PRIMARY, WHITE = "#FF6A00", "#FFFFFF"
GRAD_PRIMARY = "linear-gradient(135deg, #FF6A00 0%, #FF8A1F 70%, #FFA24D 100%)"
GRAD_DARK = "linear-gradient(160deg, #0B1220 0%, #111A2E 60%, #16254A 100%)"

ICON = {
    "back": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    "user-plus": '<circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 14.5-4.7M19 14v6M16 17h6"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 8l9 6 9-6"/>',
    "lock": '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "store": '<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16"/><path d="M9 20v-6h6v6"/>',
    "bank": '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    "building": '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
    "chev": '<path d="M6 9l6 6 6-6"/>',
    "ticket": '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 7v2M14 11v2M14 15v2"/>',
}
CHECK = f'<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="{PRIMARY}"/><path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def icon(name, size=20, color=INK3):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICON[name]}</svg>')


HERO_BG, HERO_BG_C = img(sys.argv[1] + "/hero-bg-268.png", 780), img(sys.argv[1] + "/hero-bg-170.png", 780)
STRIP, STRIP_C = img(sys.argv[1] + "/hero-strip-268.png", 780), img(sys.argv[1] + "/hero-strip-170.png", 780)

CSS = f"""
  /* Tokens mirror lib/core/theme — literal values (no var()) so Figma reads them directly. */
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ background:#E5E7EB; font-family:'Inter',sans-serif; color:#1E293B; -webkit-font-smoothing:antialiased;
         display:flex; justify-content:center; align-items:flex-start; gap:40px; padding:24px; }}
  svg {{ display:block; flex:none; }}
  .frame {{ display:flex; flex-direction:column; align-items:center; }}
  .frame-title {{ margin-bottom:10px; font-family:'JetBrains Mono',monospace; font-weight:600; font-size:12px; line-height:16px; letter-spacing:.7px; color:#64748B; }}

  /* Phone frame */
  .screen {{ width:390px; height:844px; flex:none; background:#FFFFFF; display:flex; flex-direction:column; overflow:hidden; }}

  /* Hero */
  .hero {{ width:390px; height:240px; flex:none; background-image:url({HERO_BG}); background-size:390px 240px; padding:10px 20px 0; display:flex; flex-direction:column; }}
  .hero--compact {{ height:142px; background-image:url({HERO_BG_C}); background-size:390px 142px; }}
  .strip {{ width:390px; height:28px; flex:none; background-image:url({STRIP}); background-size:390px 28px; display:flex; }}
  .strip--compact {{ background-image:url({STRIP_C}); }}
  .strip__card {{ width:390px; height:28px; background:#FFFFFF; border-radius:28px 28px 0 0; }}
  .back {{ width:40px; height:40px; border-radius:20px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.14);
          display:flex; align-items:center; justify-content:center; }}
  .hero__spacer {{ height:60px; flex:none; }}
  .hero--compact .hero__spacer {{ height:40px; }}
  .hero__logo {{ width:125px; height:32px; }}
  .hero__tag {{ margin-top:18px; font-family:'Manrope',sans-serif; font-weight:800; font-size:26px; line-height:30px; letter-spacing:-0.52px; color:#FFFFFF; }}
  .hero__pad {{ height:20px; flex:none; }}

  /* Sheet */
  .sheet {{ width:390px; height:576px; flex:none; background:#FFFFFF; padding:4px 24px 24px; display:flex; flex-direction:column; }}
  .title {{ font-family:'Manrope',sans-serif; font-weight:800; font-size:26px; line-height:30px; letter-spacing:-0.52px; color:#0B1220; }}
  .sub {{ margin-top:8px; font-size:14.5px; line-height:22px; color:#475569; }}
  .strong {{ font-weight:700; color:#0B1220; }}
  .link {{ font-family:'Manrope',sans-serif; font-weight:700; font-size:13.5px; line-height:17px; color:#FF6A00; }}

  /* Field */
  .field {{ margin-top:16px; display:flex; flex-direction:column; }}
  .label {{ margin-bottom:8px; font-size:13px; font-weight:600; line-height:16px; color:#1E293B; }}
  .input {{ height:56px; border-radius:16px; background:#F1F5F9; border:1.5px solid #F1F5F9; display:flex; align-items:center; gap:12px; padding:0 16px; }}
  .input--focus {{ background:#FFFFFF; border-color:#FF6A00; box-shadow:0 0 0 4px rgba(255,106,0,.12); }}
  .input__prefix {{ height:22px; padding-right:12px; border-right:1px solid #D5DBE5; font-size:15px; font-weight:600; line-height:22px; color:#0B1220; }}
  .input__hint {{ flex:1; font-size:15px; line-height:20px; color:#8E99AB; }}
  .input__value {{ flex:1; font-size:15px; font-weight:500; line-height:20px; color:#0B1220; }}

  /* Buttons */
  .btn {{ height:52px; flex:none; border-radius:26px; display:flex; align-items:center; justify-content:center; gap:8px;
         font-family:'Manrope',sans-serif; font-weight:700; font-size:15px; line-height:18px; letter-spacing:.15px; }}
  .btn--primary {{ background:{GRAD_PRIMARY}; color:#FFFFFF; box-shadow:0 10px 36px -8px rgba(255,138,31,.55); }}
  .btn--ghost {{ background:#FFFFFF; color:#0B1220; border:1px solid #D5DBE5; }}
  .or {{ margin:22px 0; display:flex; align-items:center; gap:12px; font-family:'JetBrains Mono',monospace; font-weight:500; font-size:11px; line-height:14px; color:#475569; }}
  .or__line {{ flex:1; height:1px; background:#E8EBF1; }}
  .note {{ margin-top:28px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:12.5px; line-height:18px; color:#475569; }}
  .center {{ display:flex; justify-content:center; align-items:center; gap:4px; font-size:13.5px; line-height:20px; color:#475569; }}
  .mono {{ font-family:'JetBrains Mono',monospace; font-weight:500; font-size:13px; line-height:16px; color:#0B1220; }}

  /* OTP */
  .otp {{ margin-top:28px; display:flex; gap:10px; }}
  .box {{ flex:1; height:58px; border-radius:14px; background:#F1F5F9; border:1.5px solid #F1F5F9; display:flex; align-items:center; justify-content:center;
         font-family:'Manrope',sans-serif; font-weight:800; font-size:22px; line-height:26px; color:#0B1220; }}
  .box--filled {{ background:#FFFFFF; border-color:#0B1220; }}
  .box--active {{ background:#FFFFFF; border-color:#FF6A00; box-shadow:0 0 0 4px rgba(255,106,0,.12); }}
  .caret {{ width:2px; height:22px; background:#FF6A00; }}

  /* Customer-type picker */
  .dim {{ width:390px; flex:none; background:#0B1220; overflow:hidden; display:flex; }}
  .dim__content {{ width:390px; flex:none; opacity:.55; display:flex; flex-direction:column; }}
  .bwrap {{ width:390px; flex:none; background:#919499; display:flex; }}
  .bsheet {{ width:390px; height:287px; flex:none; background:#FFFFFF; border-radius:28px 28px 0 0; padding:12px 16px 24px; display:flex; flex-direction:column; }}
  .bsheet__handle {{ width:32px; height:4px; border-radius:2px; background:#D5DBE5; margin:4px auto 18px; }}
  .bsheet__title {{ padding:0 8px 12px; font-family:'Manrope',sans-serif; font-weight:700; font-size:18px; line-height:21px; letter-spacing:-0.36px; color:#0B1220; }}
  .opt {{ height:56px; margin-bottom:8px; border-radius:16px; background:#F1F5F9; border:1.5px solid #F1F5F9; display:flex; align-items:center; gap:12px; padding:0 16px; }}
  .opt--on {{ background:#FFF4EC; border-color:#FF6A00; }}
  .opt__label {{ flex:1; font-size:15px; font-weight:600; line-height:20px; color:#0B1220; }}
"""


def page(title, frames):
    body = "\n".join(f'<div class="frame">\n  <p class="frame-title">{name}</p>\n{html}\n</div>' for name, html in frames)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FixPapa App — {title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>
"""


LOGO = img("logo-white.png", 296)


def hero(compact=False):
    tag = '' if compact else '<h1 class="hero__tag">Healthy devices.<br><span style="color:#FF8A1F">Happier business.</span></h1>'
    return f"""  <header class="hero{' hero--compact' if compact else ''}">
    <div class="back">{icon('back', 20, WHITE)}</div>
    <div class="hero__spacer"></div>
    <img class="hero__logo" src="{LOGO}" alt="FixPapa">
    {tag}
    <div class="hero__pad"></div>
  </header>
  <div class="strip{' strip--compact' if compact else ''}"><div class="strip__card"></div></div>"""


login = f"""<main class="screen" data-screen="Login">
{hero()}
  <section class="sheet">
    <h2 class="title">Welcome back</h2>
    <p class="sub">Enter your registered mobile number to continue.</p>
    <div class="field" style="margin-top:28px"><p class="label">Mobile number</p>
      <div class="input"><span class="input__prefix">+91</span><span class="input__hint">98765 43210</span></div></div>
    <div class="btn btn--primary" style="margin-top:24px">Login with OTP {icon('arrow', 18, WHITE)}</div>
    <div class="or"><div class="or__line"></div>OR<div class="or__line"></div></div>
    <div class="btn btn--ghost">{icon('user-plus', 18, INK)} Register now</div>
    <p class="note">{icon('lock', 15)} We'll text a 6-digit code to verify it's you.</p>
  </section>
</main>"""

otp = f"""<main class="screen" data-screen="OTP">
{hero()}
  <section class="sheet">
    <h2 class="title">Verify your number</h2>
    <p class="sub">Enter the 6-digit code sent to<br><span class="strong">+91 77910 66606</span>&nbsp;&nbsp;<span class="link">Change</span></p>
    <div class="otp">
      <div class="box box--filled">4</div><div class="box box--filled">3</div><div class="box box--filled">3</div>
      <div class="box box--active"><div class="caret"></div></div><div class="box"></div><div class="box"></div>
    </div>
    <div class="btn btn--primary" style="margin-top:28px">Verify &amp; continue {icon('arrow', 18, WHITE)}</div>
    <p class="center" style="margin-top:24px">Didn't get the code? Resend in <span class="mono">0:14</span></p>
  </section>
</main>"""

TYPES = [("Individual", "user"), ("Firm / Business", "store"), ("Government Organisation", "bank")]


def register(firm=False, sheet_open=False):
    cur = TYPES[1] if firm else TYPES[0]

    def val(v, hint):
        return f'<span class="input__value">{v}</span>' if firm else f'<span class="input__hint">{hint}</span>'

    extra = f"""
    <div class="field"><p class="label">Firm / business name</p>
      <div class="input input--focus">{icon('building', 20, PRIMARY)}<span class="input__value">Rao Traders</span></div></div>
    <div class="field"><p class="label">Partner code (optional)</p>
      <div class="input">{icon('ticket')}<span class="input__hint">If a FixPapa partner referred you</span></div></div>""" if firm else ""
    sheet = ""
    if sheet_open:
        opts = "".join(
            f'<div class="opt{" opt--on" if lbl == cur[0] else ""}">{icon(ic, 20, PRIMARY if lbl == cur[0] else INK3)}'
            f'<span class="opt__label">{lbl}</span>{CHECK if lbl == cur[0] else ""}</div>'
            for lbl, ic in TYPES)
        sheet = f"""<div class="bsheet"><div class="bsheet__handle"></div><p class="bsheet__title">Select customer type</p>{opts}</div>"""
    form = f"""  <section class="sheet">
    <h2 class="title">Create your account</h2>
    <p class="sub">Book repairs, track service tickets and shop — all in one place.</p>
    <div class="field" style="margin-top:24px"><p class="label">Full name</p>
      <div class="input">{icon('user')}{val('Asha Rao', 'Your name')}</div></div>
    <div class="field"><p class="label">Mobile number</p>
      <div class="input"><span class="input__prefix">+91</span>{val('98765 43210', '98765 43210')}</div></div>
    <div class="field"><p class="label">Email address</p>
      <div class="input">{icon('mail')}{val('asha@example.com', 'you@example.com')}</div></div>
    <div class="field"><p class="label">Customer type</p>
      <div class="input">{icon(cur[1])}<span class="input__value">{cur[0]}</span>{icon('chev', 22)}</div></div>{extra}
    <div class="btn btn--primary" style="margin-top:28px">Register now {icon('arrow', 18, WHITE)}</div>
    <p class="center" style="margin-top:20px">Already have an account? <span class="link">Log in</span></p>
  </section>"""
    tall = ' style="height:960px"' if firm else ''
    body = hero(compact=True) + "\n" + form.replace('<section class="sheet">', f'<section class="sheet" style="height:{790 if firm else 674}px">', 1)
    if sheet_open:
        body = f"""  <div class="dim" style="height:557px"><div class="dim__content">
{body}
  </div></div>
  <div class="bwrap">{sheet}</div>"""
    return f"""<main class="screen"{tall} data-screen="Register{' — Firm' if firm else ''}{' — type picker' if sheet_open else ''}">
{body}
</main>"""


for fname, title, frames in [
    ("02-login.html", "02 Login", [("LOGIN", login)]),
    ("03-otp.html", "03 OTP", [("OTP — ENTERING CODE", otp)]),
    ("04-register.html", "04 Register", [("REGISTER — DEFAULT", register()), ("CUSTOMER TYPE PICKER", register(sheet_open=True)),
                                         ("REGISTER — FIRM", register(firm=True))]),
]:
    open(f"{OUT}/{fname}", "w").write(page(title, frames))
    print(fname)
