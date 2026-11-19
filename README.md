# Website samples — Chirag

Sample websites for small businesses, plus my own one-page services site.
Everything here is plain HTML, CSS and a little JavaScript: no build step, no
dependencies, nothing to install. Open any file in a browser and it works.

**These are samples.** The three businesses are made up — they are demos built to
show what a real site would look like, not past clients. The photos are
free-licence Unsplash images.

## What is in here

```
files/
  index.html              my services and prices page
  demos/
    index.html            the samples index ("three businesses, three levels")
    salon/                Kaya Salon & Spa, Vashi          — ₹12,000 sample
      index.html  services.html  visit.html  style.css
    coaching/             Bright Minds Classes, Nerul      — ₹35,000 sample
      index.html  batches.html  book.html    style.css
    gym/                  Iron Yard Fitness, Kharghar      — ₹55,000 sample
      index.html  plans.html  inside.html    style.css
```

Each sample is a small multi-page site that shares one stylesheet inside its
folder, so all the pages look the same and stay easy to edit.

- `salon/` — prices and a visit page; the booking buttons open WhatsApp with the
  message already written.
- `coaching/` — a batches-and-fees table, and a trial booking form that saves
  every enquiry to a list beside it and can download the list as a CSV.
- `gym/` — memberships with a demo checkout that produces a member ID and a
  receipt.

The forms and the checkout are demos: the coaching list is stored in the
browser, and no payment is taken anywhere. On a real build the list goes to a
database and payments run through Razorpay.

## Viewing it

Locally, open `files/index.html` in a browser.

Online, publish the repository with GitHub Pages:

1. Settings → Pages
2. Source: **Deploy from a branch**
3. Branch **main**, folder **/ (root)**
4. Save

The site then appears at
`https://chiragisded.github.io/website-samples/files/index.html`, and the samples
at `https://chiragisded.github.io/website-samples/files/demos/`.

## Editing

All pages use the same small set of CSS custom properties at the top of each
`style.css` (colours, fonts, spacing), so changing a colour in one place changes
it across that whole sample. Text sits in the HTML — no templates, no build.
