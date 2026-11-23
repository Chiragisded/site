"""Phase 2 edits: sales page blocks, WhatsApp messages, coaching form note."""

import glob

p = "files/index.html"
s = open(p, encoding="utf-8").read()

scope = '''  <section id="scope">
    <div class="wrap">
      <div class="sec-head">
        <p class="kicker">What I don't do</p>
        <h2>Three things that aren't in the price.</h2>
        <p>Saying it here is faster than saying it on the call.</p>
      </div>
      <div class="steps">
        <div class="step">
          <span class="num">01</span>
          <h3>No apps or logins in the base price</h3>
          <p>These are websites. A staff or customer login area is a separate job, quoted separately.</p>
        </div>
        <div class="step">
          <span class="num">02</span>
          <h3>No writing or photography</h3>
          <p>I build with your words and pictures. I'll tidy a rough draft, but I don't write your copy or shoot your shop.</p>
        </div>
        <div class="step">
          <span class="num">03</span>
          <h3>No monthly retainer unless you ask</h3>
          <p>Thirty days of fixes come with the build. After that the site is yours, and the care plan is optional.</p>
        </div>
      </div>
    </div>
  </section>

'''

terms = '''  <section id="terms">
    <div class="wrap">
      <div class="sec-head">
        <p class="kicker">Terms, in plain English</p>
        <h2>How the money and the dates work.</h2>
        <p>This is the whole agreement, not a summary of one.</p>
      </div>
      <ul class="costs">
        <li><div><b>Half now, half at launch</b><small>50% to start the work, the rest when the site goes live.</small></div></li>
        <li><div><b>One fixed price</b><small>The quote doesn't move unless you ask for something extra, and then I price that separately before doing it.</small></div></li>
        <li><div><b>Two rounds of changes</b><small>A round is one list of changes, sent together. Two are included before launch.</small></div></li>
        <li><div><b>If your words and photos are late</b><small>The launch date moves with them. I'll tell you the new date instead of leaving you guessing.</small></div></li>
        <li><div><b>The first thirty days</b><small>Fixes are free: anything broken, or not as we agreed. New pages or new features are quoted.</small></div></li>
        <li><div><b>If you want to stop</b><small>Tell me before launch and you pay for the work done so far. After launch, the site and everything in it is yours.</small></div></li>
      </ul>
    </div>
  </section>

'''

anchor = '  <section id="faq">'
assert anchor in s and 'id="scope"' not in s
s = s.replace(anchor, scope + terms + anchor, 1)

cta_css = '''  /* sticky mobile quote bar */
  .sticky-cta{display:none}
  @media (max-width:700px){
    .sticky-cta{
      display:flex;align-items:center;justify-content:center;
      position:fixed;left:14px;right:14px;bottom:14px;z-index:60;
      padding:14px 18px;border-radius:4px;
      background:var(--accent);color:#101405;
      font-size:15.5px;font-weight:600;text-decoration:none;
      box-shadow:0 10px 30px rgba(0,0,0,.55), 0 0 0 1px rgba(200,242,78,.35);
    }
    body{padding-bottom:84px}
  }
</style>'''
assert s.count("</style>") == 1 and "sticky-cta" not in s
s = s.replace("</style>", cta_css, 1)

cta_html = '''<a class="sticky-cta" href="https://wa.me/919004910077?text=Hi%20Chirag%2C%20I%27d%20like%20a%20quote%20for%20a%20website">Get a free quote</a>

</body>'''
assert s.count("</body>") == 1
s = s.replace("</body>", cta_html, 1)

open(p, "w", encoding="utf-8").write(s)
print("index.html updated")

old_new = [
    ("saw%20the%20salon%20sample", "saw%20the%20Kaya%20Salon%20sample"),
    ("saw%20the%20gym%20sample", "saw%20the%20Iron%20Yard%20gym%20sample"),
    ("saw%20the%20coaching%20sample", "saw%20the%20Bright%20Minds%20Classes%20sample"),
]

for path in sorted(glob.glob("files/demos/*/*.html")):
    t = open(path, encoding="utf-8").read()
    before = t
    for old, new in old_new:
        t = t.replace(old, new)
    if t != before:
        open(path, "w", encoding="utf-8").write(t)
        print("messages updated:", path)

p = "files/demos/coaching/book.html"
t = open(p, encoding="utf-8").read()
old = '''          <button class="btn" type="submit" style="width:100%">Request trial class</button>
        </form>'''
new = '''          <button class="btn" type="submit" style="width:100%">Request trial class</button>
        </form>
        <p class="note">On a live site each request is saved to a database and emailed to the office.</p>'''
assert old in t
t = t.replace(old, new, 1)
open(p, "w", encoding="utf-8").write(t)
print("book.html note added")
