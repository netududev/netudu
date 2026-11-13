import re
def scan(s):
    """top-level + nested (@media/@supports) rules -> list of dict(start,end,sel,body_start,depth,parent)"""
    out=[];i=0;n=len(s)
    def skip_str(i):
        q=s[i];i+=1
        while i<n and s[i]!=q:
            if s[i]=='\\':i+=1
            i+=1
        return i+1
    def parse(i,end_on_brace,parent):
        while i<n:
            # skip ws and comments
            m=re.compile(r'\s+').match(s,i)
            if m:i=m.end();continue
            if s.startswith('/*',i):
                i=s.index('*/',i)+2;continue
            if s[i]=='}':return i+1
            # read prelude until { or ;
            st=i;j=i;par=0
            while j<n:
                c=s[j]
                if c in '"\'':j=skip_str(j);continue
                if c=='(':par+=1
                elif c==')':par-=1
                elif c in '{;' and par==0:break
                j+=1
            if j>=n:break
            pre=s[st:j]
            if s[j]==';':
                i=j+1;continue
            if pre.strip().startswith('@'):
                head=pre.strip()
                bs=j
                if re.match(r'@(media|supports|layer|container)',head):
                    k=parse(j+1,True,head)
                    out.append(dict(kind='group',start=st,end=k,head=head,parent=parent,bstart=bs))
                    i=k
                else: # keyframes, font-face: opaque
                    d=0;k=j
                    while k<n:
                        c=s[k]
                        if c in '"\'':k=skip_str(k);continue
                        if c=='{':d+=1
                        elif c=='}':
                            d-=1
                            if d==0:k+=1;break
                        k+=1
                    out.append(dict(kind='opaque',start=st,end=k,head=head,parent=parent,bstart=bs))
                    i=k
            else:
                d=0;k=j
                while k<n:
                    c=s[k]
                    if c in '"\'':k=skip_str(k);continue
                    if c=='(':d+=0
                    if c=='{':d+=1
                    elif c=='}':
                        d-=1
                        if d==0:k+=1;break
                    k+=1
                out.append(dict(kind='rule',start=st,end=k,sel=pre,parent=parent,bstart=j))
                i=k
        return i
    parse(0,False,None)
    return out
def split_sel(sel):
    parts=[];par=0;cur='';
    for c in sel:
        if c in '([':par+=1
        elif c in ')]':par-=1
        if c==',' and par==0:parts.append(cur);cur=''
        else:cur+=c
    parts.append(cur);return parts
CLS=re.compile(r'\.(-?[_a-zA-Z][\w-]*)')
