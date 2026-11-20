"""Helpers for Figma-safe HTML: every image inlined as a PNG/JPEG data URI."""
import base64
import io
import urllib.request

from PIL import Image

ASSETS = "/home/sharasti/theme/customer-app/assets/images/"
_cache = {}


def img(src, max_w=800):
    """Return a data: URI for a local asset name, absolute path or http(s) URL.

    Images are downscaled to `max_w` px wide (2x the largest display size) and
    re-encoded as JPEG (opaque) or PNG (has transparency) — formats Figma always accepts.
    """
    key = (src, max_w)
    if key in _cache:
        return _cache[key]
    if src.startswith("http"):
        req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=30).read()
    else:
        raw = open(src if src.startswith("/") else ASSETS + src, "rb").read()
    im = Image.open(io.BytesIO(raw))
    im.load()
    has_alpha = im.mode in ("RGBA", "LA", "P") and (
        im.mode != "P" or "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    if has_alpha:
        # Fully opaque PNGs are smaller as JPEG.
        if im.getchannel("A").getextrema()[0] == 255:
            im, has_alpha = im.convert("RGB"), False
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    if has_alpha:
        im.save(buf, "PNG", optimize=True)
        mime = "image/png"
    else:
        im.save(buf, "JPEG", quality=82, optimize=True, progressive=False)
        mime = "image/jpeg"
    uri = f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()
    _cache[key] = uri
    return uri


def svg_data(svg_text):
    """Inline SVG markup as an <img>-ready data URI (keeps logos as one vector layer)."""
    return "data:image/svg+xml;base64," + base64.b64encode(svg_text.encode()).decode()


def clamp(text, n):
    """Pre-truncate text (Figma ignores -webkit-line-clamp)."""
    text = " ".join(text.split())
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"
