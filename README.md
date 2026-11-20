# Sample websites — Chirag

Four demo websites for small businesses, built to show what a client actually gets. Plain HTML, CSS and JavaScript — no build step, no install. Open any file by double-clicking it.

## What's here

| Path | What it is |
|---|---|
| `files/index.html` | My services and prices page |
| `files/demos/index.html` | Hub page listing the four samples |
| `files/demos/salon/` | Sample 1 — simple business site (₹12,000) |
| `files/demos/coaching/` | Sample 2 — site with a working enquiry form (₹35,000) |
| `files/demos/gym/` | Sample 3 — memberships with an online checkout (₹55,000) |
| `files/demos/atelier/` | Sample 4 — premium, animation-led brand site |

Every sample is a three-page site sharing one stylesheet per folder: home, a detail page, and a page where the customer does something (visit, book, pay, enquire).

All four businesses are invented. They are demos of the work, not client projects.

## Sample 4 — Sable & Stone

An architecture studio site, deliberately the most advanced of the four:

- `index.html` — WebGL shader behind the headline, a 3D deck of rooms that turns as you scroll, hover-lit cards, a marquee strip.
- `work.html` — a pinned horizontal project reel and a grid of cards that tilt toward the cursor.
- `studio.html` — a timeline whose line fills as you scroll, team cards, fees, and a short section explaining how the page is built.
- `app.js` — reveals via Motion, split-text headline via anime.js, pointer effects.
- `shader.js` — the GLSL fragment shader (no library).
- `scroll.js` — the 3D deck, horizontal rail, timeline beam and parallax.
- `style.css`, `components.css`, `layout.css` — linked in that order.

The animation libraries load from a CDN at runtime. If they fail, or the visitor prefers reduced motion, the pages fall back to static, readable content.

## Notes on what is real vs simulated

- The enquiry form in `demos/coaching/` stores submissions in the browser (localStorage) so the flow can be shown without a server.
- The checkout in `demos/gym/` is a demo screen. On a live site it is replaced by Razorpay (UPI, cards, netbanking).
- Photos are free-licence Unsplash images, linked from Unsplash's CDN rather than copied into this repo.

## Publishing it free with GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings** → **Pages**.
3. Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)`.
4. After a minute the samples appear at:
   `https://<your-username>.github.io/<repo-name>/files/demos/`

Send that link to businesses — it works on any phone.

## Editing

Colours live in the `:root` block at the top of each sample's stylesheet. Each sample folder is self-contained, so duplicate a folder to start a new sample.
