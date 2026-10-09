# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FixPapa "Set 5" theme: a static multi-page marketing/shop site (IT repair, AMC, rental, refurbished devices). Plain HTML + CSS + vanilla JS. There is no build step, package manager, linter or test suite.

To preview, serve the folder over HTTP (needed for video and `?cat=` query handling), e.g. `python3 -m http.server 8000` and open `http://localhost:8000/index.html`.

## Architecture

**Page types and their asset stacks**
- `index.html` (homepage) — `style.css` + `refurb-shop.css`; scripts: GSAP 3.12.5 + ScrollTrigger (CDN), `refurb-data.js`, `main.js`, `fixpapa-story.js`. `main.js` must degrade gracefully when GSAP is missing (`hasGsap`) or `prefers-reduced-motion` is set (`reduce`).
- Inner pages (`brands`, `device-health`, `open-box-deal`, `rental`, `refurbished`, `refurbished-category`) — `style.css` + `inner.css` (shared `.ip-*` inner-page components, body class `ip`) + one page-specific `<page>.css`; script: `inner.js` (shared header, theme, reveal, lazy video, filters, rental plans, warranty checker).
- `repair.html` — standalone: `style.css` + `repair.css`, script `repair.js` (its own header/theme/reveal + booking modal; does not use `inner.css`/`inner.js`).

**Shared design system** — `assets/css/style.css` holds all tokens (`--primary`, `--navy`, `--ink*`, radii, shadows, fonts Manrope/Inter/JetBrains Mono) and dark mode via `[data-theme="dark"]` overrides. Page CSS files build on these tokens rather than redefining them.

**Duplicated per-page markup** — each HTML file inlines its own copy of the header/topbar, mobile nav, footer, an SVG icon sprite (`<symbol id="i-…">`, referenced with `<use href="#i-…">`), and an inline `<head>` script that applies the saved theme before paint. Changes to nav, footer or icons must be applied to every HTML file.

**Theme toggle** — persisted in `localStorage` key `fp-theme` (`dark`/`light`), applied as `document.documentElement.dataset.theme`. `main.js`, `inner.js` and `repair.js` each implement the toggle and must keep using the same key.

**Refurbished catalogue** — `refurb-data.js` is the single data source, exposing `window.FPRefurb` (`cats`, `products`, `byCat`, `catOf`, `stats`, `card`, `inr`) and injecting the `rf-*` product-art SVG sprite. It must load before `main.js` (homepage section) and `refurb-category.js` (renders `refurbished-category.html?cat=laptops|desktops|printers|cctv|accessories`). Product list is sample data meant to be replaced by a live backend.

**Homepage data** — other homepage content (new products, brand list/logos, testimonials) is hard-coded in arrays at the top of `main.js` and rendered into the DOM. Brand logos live in `assets/img/brands/`.

**Media** — background/section videos use `data-src` + `preload="none"` and are lazy-loaded by JS; each has a `.jpg` poster of the same name in `assets/media/`. `fixpapa-story.js` builds the animated "In Action" ad story and `[data-fp-art]` illustrations around `fixpapa-story.mp4`. `assets/media/AI-PROMPTS.md` documents the technician-uniform spec (orange #F97316 polo, navy trousers) for generating new footage; credits are in the `CREDITS*.txt` files.

## Conventions

- **Cache busting**: assets are referenced with `?v=X.Y` query strings (e.g. `style.css?v=7.4`, `main.js?v=7.0`). Bump the version in every HTML file that references an asset when you change it. Versions currently differ between pages (index uses `style.css?v=7.4`, inner pages `?v=7.0`).
- JS files are IIFEs using local `$`/`$$` query helpers; no modules or globals except `window.FPRefurb`.
- CSS is written compactly (one rule per line, minified-style declarations); match that style.
