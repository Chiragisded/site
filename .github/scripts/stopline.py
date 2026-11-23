"""Replace the cancellation line with wording that promises no refund policy."""

p = "files/index.html"
s = open(p, encoding="utf-8").read()

old = "<li><div><b>If you want to stop</b><small>Tell me before launch and you pay for the work done so far. After launch, the site and everything in it is yours.</small></div></li>"
new = "<li><div><b>If you want to stop</b><small>Tell me as soon as you can and we'll agree what's fair for the work done so far. After launch, the site and everything in it is yours.</small></div></li>"

assert old in s, "cancellation line not found"
s = s.replace(old, new, 1)
open(p, "w", encoding="utf-8").write(s)
print("cancellation line softened")
