import json,re,sys,urllib.parse,urllib.request

UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    'Accept-Language':'vi-VN,vi;q=0.9,en;q=0.8'}

def txt(s):
    if not s: return ''
    r=re.sub(r'<[^>]+>','',s)
    for a,b in [('&amp;','&'),('&quot;','"'),('&#39;',"'"),('&lt;','<'),('&gt;','>')]:
        r=r.replace(a,b)
    return r.strip()

def search(q,maxn=14):
    url='https://www.youtube.com/results?search_query='+urllib.parse.quote(q)+'&hl=vi&gl=VN'
    req=urllib.request.Request(url,headers=UA)
    html=urllib.request.urlopen(req,timeout=30).read().decode('utf-8','ignore')
    m=re.search(r'var ytInitialData = (\{.*?\});</script>',html)
    if not m: return []
    data=json.loads(m.group(1))
    out=[]
    def walk(o):
        if isinstance(o,dict):
            if 'videoRenderer' in o:
                v=o['videoRenderer']
                vid=v.get('videoId')
                title=txt(v.get('title',{}).get('runs',[{}])[0].get('text',''))
                ch=txt(v.get('ownerText',{}).get('runs',[{}])[0].get('text',''))
                dur=v.get('lengthText',{}).get('simpleText','')
                views=v.get('viewCountText',{}).get('simpleText','')
                pub=v.get('publishedTimeText',{}).get('simpleText','')
                if vid: out.append({'id':vid,'t':title,'ch':ch,'d':dur,'v':views,'p':pub})
            for k in o: walk(o[k])
        elif isinstance(o,list):
            for k in o: walk(k)
    walk(data)
    seen=set();res=[]
    for r in out:
        if r['id'] in seen: continue
        seen.add(r['id']);res.append(r)
        if len(res)>=maxn: break
    return res

if __name__=='__main__':
    for q in sys.argv[1:]:
        print('\n=== '+q)
        try:
            for r in search(q):
                print(f"{r['id']}|{r['d']}|{r['ch'][:32]}|{r['v'][:14]}|{r['p'][:12]}|{r['t'][:95]}")
        except Exception as e:
            print('ERR',e)
