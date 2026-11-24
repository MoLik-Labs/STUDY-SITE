# Kiểm độ tương phản WCAG cho token trong site/src/styles.css. Chạy từ gốc repo: python3 tools/design/contrast.py
import re
css=open('site/src/styles.css',encoding='utf-8').read()
light=css[css.index(':root {'):css.index('@media (prefers-color-scheme: dark)')]
dark=css[css.index('@media (prefers-color-scheme: dark)'):]
dark=dark[:dark.index('\n}\n')]
def toks(block):
    return {k:v for k,v in re.findall(r'--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})',block)}
L=toks(light); D={**L, **toks(dark)}
def lum(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
pairs=[('ink','paper'),('ink','surface'),('ink-2','paper'),('ink-2','surface'),('ink-2','surface-2'),
 ('muted','paper'),('muted','surface'),('muted','surface-2'),('accent','paper'),('accent','surface'),
 ('accent-ink','accent'),('accent','accent-soft'),('ink','accent-soft'),('danger','surface'),('danger','danger-soft'),
 ('warn','warn-soft'),('ok','ok-soft'),('ok','surface'),('focus','paper'),('focus','surface')]
bad=[]
for name,T in (('light',L),('dark',D)):
    for a,b in pairs:
        r=cr(T[a],T[b]); flag='' if r>=4.5 else '  <-- <4.5'
        if r<4.5: bad.append((name,a,b,round(r,2)))
        print(f'{name:5} {a:10} on {b:12} {r:5.2f}{flag}')
print('FAIL:',bad)
