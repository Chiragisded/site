# Sample websites — Chirag

Demo websites built to show small businesses what they can get. All plain HTML, CSS and a little JavaScript — no build step, no dependencies. Open any file by double-clicking it.

## What's here

| File | What it is |
|---|---|
| `files/index.html` | My services and prices page (what I send to businesses) |
| `files/demos/index.html` | Hub page listing the three samples below |
| `files/demos/salon.html` | Sample 1 — simple business site with price list and WhatsApp booking |
| `files/demos/coaching.html` | Sample 2 — site with a working enquiry form, staff list and CSV export |
| `files/demos/gym.html` | Sample 3 — membership plans with an online checkout flow |

The three samples use invented businesses. They are demos of the work, not client projects.

## Notes on what is real vs simulated

- The enquiry form in `coaching.html` stores submissions in the browser (localStorage) so the flow can be demonstrated without a server.
- The checkout in `gym.html` is a demo screen. On a live site it is replaced by Razorpay (UPI, cards, netbanking), and the order is stored in a real database.

## Publishing it free with GitHub Pages

1. Push this repo to GitHub.
2. Repo → **Settings** → **Pages**.
3. Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)`.
4. After a minute the samples appear at:
   `https://<your-username>.github.io/<repo-name>/files/demos/`

Send that link to businesses — it works on any phone.

## Editing

Every page is one self-contained file. Colours live in the `:root` block at the top of each file's `<style>`.
