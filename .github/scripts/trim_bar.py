import pathlib
import sys

path = pathlib.Path('files/index.html')
s = path.read_text(encoding='utf-8')

pairs = [
    ('position:fixed;left:14px;right:14px;bottom:14px;z-index:60;',
     'position:fixed;left:16px;right:16px;bottom:8px;z-index:60;'),
    ('      padding:14px 18px;border-radius:4px;',
     '      padding:8px 14px;border-radius:3px;'),
    ('      font-size:15.5px;font-weight:600;text-decoration:none;',
     '      font-size:14px;line-height:1.3;font-weight:600;text-decoration:none;'),
    ('      box-shadow:0 10px 30px rgba(0,0,0,.55), 0 0 0 1px rgba(200,242,78,.35);',
     '      box-shadow:0 6px 18px rgba(0,0,0,.5), 0 0 0 1px rgba(200,242,78,.35);'),
    ('    body{padding-bottom:84px}',
     '    body{padding-bottom:66px}'),
]

for old, new in pairs:
    if s.count(old) != 1:
        sys.exit('expected exactly one %r, found %d' % (old, s.count(old)))
    s = s.replace(old, new)

path.write_text(s, encoding='utf-8')
print('files/index.html updated')
