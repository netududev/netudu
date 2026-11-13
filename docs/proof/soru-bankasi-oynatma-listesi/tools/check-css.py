import re,sys
p=sys.argv[1];s=open(p,encoding='utf-8').read()
t=re.sub(r'/\*.*?\*/','',s,flags=re.S)
t2=re.sub(r"'[^']*'|\"[^\"]*\"|url\([^)]*\)",'',t)
depth=0;mn=0
for c in t2:
    if c=='{':depth+=1
    elif c=='}':depth-=1;mn=min(mn,depth)
print('süslü parantez: açık-kapalı farkı =',depth,'| en düşük derinlik =',mn)
print('parantez ( ) farkı =',t2.count('(')-t2.count(')'))
defs=set(re.findall(r'(--[\w-]+)\s*:',t))
uses=set(re.findall(r'var\((--[\w-]+)',t))
und=sorted(u for u in uses if u not in defs)
print('tanımlı değişken:',len(defs),'| kullanılan:',len(uses),'| TANIMSIZ:',und)
