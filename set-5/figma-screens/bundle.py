"""Pack several figma-screens/*.html into ONE self-contained HTML for Figma's html_to_figma import.

Each screen becomes a <div class="fig-screen"> (1440px desktop or 390px phone frame); importing with
cssSelector ".fig-screen" turns every screen into its own Figma frame (max 20 per import).
CSS and images are inlined, <use> icons are expanded, and @media rules are resolved for the frame's
viewport so the import renders that layout whatever size the importer's own viewport is.

  python3 figma-screens/bundle.py out.html figma-screens/01-header/*.html
  python3 figma-screens/bundle.py --width 390 out.html figma-screens/mobile/01-header/*.html   (phone frames)
"""
import base64, functools, io, mimetypes, os, re, sys

SET5 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIDTH, VH = 1440, 900


@functools.lru_cache(maxsize=None)
def data_uri(path, width=1440):
    p = os.path.join(SET5, path.split('?')[0])
    if not os.path.isfile(p):
        return None
    raw, mime = open(p, 'rb').read(), mimetypes.guess_type(p)[0] or 'application/octet-stream'
    if mime in ('image/png', 'image/jpeg') and len(raw) > 60_000:
        raw, mime = shrink(raw, mime, width)
    return f'data:{mime};base64,' + base64.b64encode(raw).decode()


def shrink(raw, mime, width):
    """Big photos repeat in every screen of a bundle (50 MB cap): resize to the width shown (×2), JPEG q82 / 256-colour PNG."""
    from PIL import Image
    im = Image.open(io.BytesIO(raw))
    im.thumbnail((min(width, 1440), 10_000))
    out = io.BytesIO()
    if im.mode in ('RGBA', 'LA', 'P') and 'A' in im.convert('RGBA').getbands():
        im.convert('RGBA').quantize(256, method=Image.Quantize.FASTOCTREE).save(out, 'PNG', optimize=True)
        mime = 'image/png'
    else:
        im.convert('RGB').save(out, 'JPEG', quality=82, optimize=True, progressive=True)
        mime = 'image/jpeg'
    return (out.getvalue(), mime) if out.tell() < len(raw) else (raw, mime)


def media_matches(cond):
    """Does an @media condition hold in the WIDTH × VH viewport? (only width/height queries are kept)"""
    if re.search(r'prefers-|hover|pointer|print', cond):
        return False
    for kind, dim, px in re.findall(r'(min|max)-(width|height)\s*:\s*([\d.]+)px', cond):
        v = WIDTH if dim == 'width' else VH
        if (kind == 'min' and v < float(px)) or (kind == 'max' and v > float(px)):
            return False
    return True


def for_viewport(css):
    """Resolve @media blocks for the frame's viewport: unwrap the ones that apply, drop the rest."""
    out, i = [], 0
    while True:
        j = css.find('@media', i)
        if j < 0:
            out.append(css[i:]); break
        out.append(css[i:j])
        k = css.index('{', j)
        cond, depth, e = css[j:k], 1, k + 1
        while depth:
            depth += {'{': 1, '}': -1}.get(css[e], 0); e += 1
        if media_matches(cond):
            out.append(css[k + 1:e - 1])
        i = e
    css = ''.join(out)
    # viewport units → px (the importer's viewport size is unknown)
    css = re.sub(r'(-?[\d.]+)[sdl]?vh\b', lambda m: f'{float(m.group(1)) * VH / 100:g}px', css)
    return re.sub(r'(-?[\d.]+)[sdl]?vw\b', lambda m: f'{float(m.group(1)) * WIDTH / 100:g}px', css)


def linked_css(html):
    """Stylesheet paths a screen links, in order."""
    return [h.split('?')[0] for h in re.findall(r'<link rel="stylesheet" href="(assets/[^"]+)">', html)]


def scope(css, sel):
    """Prefix every selector of a screen's own <style> with its frame id, so it can't leak into other screens."""
    def rule(m):
        head, body = m.group(1).strip(), m.group(2)
        if head.startswith('@'):
            return f'{head}{{{scope(body, sel)}}}' if head.startswith('@media') else m.group(0)
        sels = []
        for x in head.split(','):
            x = re.sub(r'^(html|:root)\b\s*', '', x.strip())
            sels.append(re.sub(r'^body\b', sel, x) if x.startswith('body') else f'{sel} {x}' if x else sel)
        return ','.join(sels) + '{' + body + '}'
    return re.sub(r'([^{}]+)\{((?:[^{}]|\{[^{}]*\})*)\}', rule, css)


def expand_icons(body, symbols):
    def repl(m):
        attrs, ref = m.group(1), m.group(2)
        sym = symbols.get(ref)
        if not sym:
            return m.group(0)
        sattrs, inner = sym
        return f'<svg{attrs} {sattrs}>{inner}</svg>'
    return re.sub(r'<svg([^>]*)>\s*<use (?:xlink:)?href="#([\w-]+)"[^>]*?(?:/>|></use>)\s*</svg>', repl, body)


def screen(path, n):
    html = open(path, encoding='utf-8').read()
    title = re.search(r'<title>(.*?)</title>', html).group(1)
    height = re.search(r'body\{min-height:(\d+)px', html)
    btag, body = re.search(r'<body([^>]*)>(.*)</body>', html, re.S).groups()
    cls = re.search(r'class="([^"]*)"', btag)
    symbols = {}
    for sprite in re.findall(r'<svg width="0" height="0".*?</svg>', body, re.S):
        for sid, sattrs, inner in re.findall(r'<symbol id="([\w-]+)"([^>]*)>(.*?)</symbol>', sprite, re.S):
            symbols[sid] = (sattrs.strip(), inner)
        if '<linearGradient' not in sprite and '<clipPath' not in sprite:   # keep sprites that also hold shared defs
            body = body.replace(sprite, '')
    body = expand_icons(body, symbols)
    def img(m):   # <img> with the displayed width recorded by snap.mjs
        tag, fw = m.group(0), re.search(r'data-fw="(\d+)"', m.group(0))
        return re.sub(r'src="(assets/[^"]+)"', lambda s: f'src="{data_uri(s.group(1), int(fw.group(1)) if fw else 1440) or s.group(1)}"', tag)
    body = re.sub(r'<img\b[^>]*>', img, body)
    body = re.sub(r'(src|href)="(assets/[^"]+\.(?:png|jpe?g|webp|svg|gif)(?:\?[^"]*)?)"',
                  lambda m: f'{m.group(1)}="{data_uri(m.group(2)) or m.group(2)}"', body)
    own = '\n'.join(scope(c, f'#s{n}') for c in re.findall(r'<style>(.*?)</style>', html, re.S))
    h = f'height:{height.group(1)}px;' if height else ''
    # the page's <body> classes (e.g. "ip page-cart") move onto the frame so page CSS still matches
    return linked_css(html), (f'<div id="s{n}" class="fig-screen {cls.group(1) if cls else ""}" data-name="{title}" '
                              f'style="width:{WIDTH}px;{h}position:relative;overflow:hidden;background:#fff">'
                              f'<style>{own}</style>{body}</div>')


def main():
    global WIDTH, VH
    args = sys.argv[1:]
    if args[0] == '--width':
        WIDTH, VH, args = int(args[1]), 844 if int(args[1]) < 768 else 900, args[2:]
    out, files = args[0], args[1:]
    sheets, screens = [], []
    for n, f in enumerate(files, 1):
        links, s = screen(f, n)
        sheets += [l for l in links if l not in sheets]
        screens.append(s)
    css = '\n'.join(for_viewport(open(os.path.join(SET5, p), encoding='utf-8').read()) for p in sheets)
    doc = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width={WIDTH}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>{css}
body{{margin:0;min-height:0;width:{WIDTH}px}}
.fig-screen{{margin:0 0 80px}}
.fig-screen .mm-scrim{{position:absolute}}
</style></head>
<body data-set="set-5">
{chr(10).join(screens)}
</body></html>
'''
    open(out, 'w', encoding='utf-8').write(doc)
    print(f'{len(screens)} screens, {len(doc) / 1e6:.2f} MB -> {out}')


if __name__ == '__main__':
    main()
