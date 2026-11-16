import re,sys,glob,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cssparse import *
css=open('app/globals.css',encoding='utf-8').read()
defined=set()
for r in scan(css):
    if r['kind']=='rule':
        defined.update(CLS.findall(re.sub(r'\[[^\]]*\]','',r['sel'])))
files=sys.argv[1:]
missing={}
for f in files:
    t=open(f,encoding='utf-8').read()
    for m in re.finditer(r'className=(?:"([^"]*)"|\{([^}]*)\}|\{`([^`]*)`\})',t):
        txt=' '.join(x for x in m.groups() if x)
        # {'a'+(cond?' b':'')} -> sadece string parçaları
        parts=re.findall(r"'([^']*)'|\"([^\"]*)\"|`([^`$]*)",txt) if m.group(1) is None else [(m.group(1),'','')]
        for tup in parts:
            for tok in ' '.join(tup).split():
                if re.match(r'^[a-z][\w-]*$',tok) and tok not in defined:
                    missing.setdefault(tok,set()).add(f.split('/')[-1])
dyn={'dot-','subject-','tl-'}
for k in sorted(missing):print(k,sorted(missing[k]))
print('TANIMSIZ SINIF SAYISI:',len(missing))
