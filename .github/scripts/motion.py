import glob

p = "files/index.html"
s = open(p, encoding="utf-8").read()
old = "    body{padding-bottom:84px}\n  }"
new = "    body{padding-bottom:84px}\n    .nav .btn{display:none}\n  }"
assert old in s and ".nav .btn{display:none}" not in s
open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))

EXTRA = """<style>
  /* reduced motion, and a focus ring that follows the text colour */
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}
  }
  :where(a,button,summary,input,select,textarea,[tabindex]):focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:2px}
</style>
"""

for path in ["files/demos/index.html"] + sorted(glob.glob("files/demos/*/*.html")):
    t = open(path, encoding="utf-8").read()
    if "prefers-reduced-motion" in t and "focus-visible" in t:
        continue
    t = t.replace("</head>", EXTRA + "</head>", 1)
    open(path, "w", encoding="utf-8").write(t)
