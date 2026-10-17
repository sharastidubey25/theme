# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

FixPapa "Set 5" theme: a static multi-page marketing/shop site (IT repair, AMC, rental, refurbished devices). Plain HTML + CSS + vanilla JS. There is no build step, package manager, linter or test suite.

To preview, serve the folder over HTTP (needed for video and `?cat=` query handling), e.g. `python3 -m http.server 8000` and open `http://localhost:8000/index.html`.

## Architecture

**Page types and their asset stacks**
- `index.html` (homepage) — `style.css` + `refurb-shop.css`; scripts: GSAP 3.12.5 + ScrollTrigger (CDN), `refurb-data.js`, `main.js`, `fixpapa-story.js`. `main.js` must degrade gracefully when GSAP is missing (`hasGsap`) or `prefers-reduced-motion` is set (`reduce`).
- Inner pages (`account`, `brands`, `device-health`, `partner`, `pulse`, `sell-ewaste`, `open-box-deal`, `rental`, `rental-category`, `refurbished`, `refurbished-category`) — `style.css` + `inner.css` (shared `.ip-*` inner-page components, body class `ip`) + one page-specific `<page>.css`; script: `inner.js` (shared header, theme, reveal, lazy video, filters, rental plans, warranty checker).
- `repair.html` — standalone: `style.css` + `repair.css`, script `repair.js` (its own header/theme/reveal + booking modal; does not use `inner.css`/`inner.js`). The booking modal is 3 steps (device: category → brand → service type; issue & visit: description, address, date + slot; confirm: summary, mobile, OTP inline) plus a success screen. Brands, diagnosis prices and cities are sample data in `repair.js`; it runs on a demo mock (any 6-digit OTP) unless `window.FPBookingApi = { sendOtp(mobile), verifyAndBook(otp, booking) }` is defined before it loads.

**Shop listings** — `refurbished.html`, `rental-category.html` and `products.html` share one listing engine: `assets/js/shop-list.js` (`window.FPShopList(cfg)`: builds the filter sidebar into `#rflAccs`, checkbox facets with live counts, snapping numeric ranges, price range, sort listbox, pagination, chips, phone drawer, URL state, promo-video lightbox) + `assets/css/shop-list.css` (`rfl-*`). Each page passes a config: `refurb-list.js` (data from `refurb-data.js`), `rental-list.js` (data from `rental-data.js`, `window.FPRental`) and `products-list.js` (all products: `products-data.js` `window.FPProducts` new items + refurbished items, with a Condition facet; `?brand=HP` from the Brands page "Check products" buttons, matched case-insensitively, shows a brand banner via the engine's `onRender` hook).

**Rental** — `rental-category.html?cat=laptop|desktop|printer|projector&months=1|3|6|12` is the single page for every rental category: category tabs (plain links), rental-period switch (prices are per month for the chosen plan, `FPRental.monthly`), category-specific filters, and a "Rent now" request modal (mock unless `window.FPRentalApi = { request(rental) }` is defined). `rental.html` "Rent Now" buttons (`data-rent-cat`) link there and carry the chosen plan (`inner.js`).

**My Account** — `account.html#profile|wallet|orders|wishlist|addresses|branches|sub-users|tickets|inventory|notifications|contact` (menu and fields mirror fixpapa.com/account/user-profile). Panels switch on the URL hash; Personal Data is read-only until "Edit profile", then validated and saved; firm/government accounts get a name field plus the Firm Branches and Sub Users menu items. Other panels are empty states until the backend exists. Demo data lives in `localStorage` key `fp-profile`; a backend plugs in via `window.FPAccountApi = { getProfile, updateProfile, updateAvatar, logout }` (`assets/js/account.js`). The header account icon and the phone menu link here on every page.

**FixPapa Pulse** — `pulse.html` mirrors pulse.fixpapa.com in the Set 5 theme (hero with the homepage `fpp-*` dashboard visual, demo video `assets/media/pulse-demo.mp4`, audiences, Windows/Mac pricing, 26 FAQs, contact form). Download menu and plan "Buy now" go through a mobile-OTP modal, then hand off to the official site (`window.FPPulseConfig = { downloads, checkoutUrl }`, `window.FPPulseApi = { sendOtp, verifyOtp, enquiry }`; demo accepts any 6-digit code). Every "Device Health", "FixPapa Pulse" and "Fleet Monitoring" link points here; `device-health.html` remains only for its warranty checker (Brands page "Warranty" links).

**Partner program** — `partner.html` (content from the live partner-program page). Every "Become a Partner / Freelancer" button (`data-join`) opens a dialog like the live site: partner → partner.fixpapa.com or the app; freelancer → the FixPapa Engineer app (Play Store / App Store). `partner.html#freelancer` opens the dialog directly (`assets/js/partner.js`). The header "Become a Partner" button, phone menu, mega-menu card and footer partner links point here on every page.

**Sell e-waste** — `sell-ewaste.html` (content and per-unit prices from fixpapa.com/sell-ewaste). Pick items (select/remove) → sticky bar with count and estimate → "Sell selected items" opens the pickup form with a quantity per item and live estimate → success with a request ID. Demo unless `window.FPEwasteApi = { submit(request) }` is defined (`assets/js/ewaste.js`). Every "Sell your e-waste" / "E-Waste Recycling" link points here.

**Shared design system** — `assets/css/style.css` holds all tokens (`--primary`, `--navy`, `--ink*`, radii, shadows, fonts Manrope/Inter/JetBrains Mono) and dark mode via `[data-theme="dark"]` overrides. Page CSS files build on these tokens rather than redefining them.

**Duplicated per-page markup** — each HTML file inlines its own copy of the header/topbar, mobile nav, footer, an SVG icon sprite (`<symbol id="i-…">`, referenced with `<use href="#i-…">`), and an inline `<head>` script that applies the saved theme before paint. Changes to nav, footer or icons must be applied to every HTML file.

**Header mega menu** — the primary nav (Home · Services ▾ · Shop ▾ · For Business ▾ · Book A Repair · Brands), its `.mm` dropdown panels (categories left, text cards right, no icons) and the grouped `.mn-group` phone menu are identical on every page except for the `active` item and homepage section links (`#amc` on index, `index.html#amc` elsewhere). Behaviour lives in `assets/js/megamenu.js`, loaded on all pages; styles are at the end of `style.css`.

**Theme toggle** — persisted in `localStorage` key `fp-theme` (`dark`/`light`), applied as `document.documentElement.dataset.theme`. `main.js`, `inner.js` and `repair.js` each implement the toggle and must keep using the same key.

**Refurbished catalogue** — `refurb-data.js` is the single data source, exposing `window.FPRefurb` (`cats`, `products`, `byCat`, `catOf`, `stats`, `card`, `inr`) and injecting the `rf-*` product-art SVG sprite. It must load before `main.js` (homepage section), `refurb-list.js` (the `refurbished.html` listing: filter sidebar with live counts, price range, sort, pagination, URL state like `?cat=laptops&brand=Dell&sort=lo`; RAM, storage and screen size are snapping range sliders, the other facets checkbox lists; facet values are parsed from each product's `specs`) and `refurb-category.js` (renders `refurbished-category.html?cat=laptops|desktops|printers|cctv|accessories`). Product list is sample data meant to be replaced by a live backend.

**Homepage data** — other homepage content (new products, brand list/logos, testimonials) is hard-coded in arrays at the top of `main.js` and rendered into the DOM. Brand logos live in `assets/img/brands/`.

**Media** — background/section videos use `data-src` + `preload="none"` and are lazy-loaded by JS; each has a `.jpg` poster of the same name in `assets/media/`. `fixpapa-story.js` builds the animated "In Action" ad story and `[data-fp-art]` illustrations around `fixpapa-story.mp4`. `assets/media/AI-PROMPTS.md` documents the technician-uniform spec (orange #F97316 polo, navy trousers) for generating new footage; credits are in the `CREDITS*.txt` files.

**AI assistant widget** — every page loads `assets/css/assistant.css` and the six scripts in `assets/js/assistant/` (order: service, mock-service, conversation, avatar, chat-ui, assistant) just before `</body>`. Avatar, chat UI, conversation state and the chat service are separate and only meet in `assistant.js`; the default service is a keyword **mock** (no AI). See `assets/js/assistant/README.md` for the backend API contract and `window.FPAssistantConfig`.

## Conventions

- **Cache busting**: assets are referenced with `?v=X.Y` query strings (e.g. `style.css?v=7.4`, `main.js?v=7.0`). Bump the version in every HTML file that references an asset when you change it. Versions currently differ between pages (index uses `style.css?v=7.4`, inner pages `?v=7.0`).
- JS files are IIFEs using local `$`/`$$` query helpers; no modules or globals except `window.FPRefurb`, `window.FPRental`, `window.FPProducts`, `window.FPShopList` and the assistant's `window.FPAssistant` namespace.
- CSS is written compactly (one rule per line, minified-style declarations); match that style.
