import json,re,sys,urllib.parse,urllib.request
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36','Accept-Language':'vi-VN,vi;q=0.9'}
def txt(s):
    if not s: return ''
    r=re.sub(r'<[^>]+>','',s)
    for a,b in [('&amp;','&'),('&quot;','"'),('&#39;',"'")]: r=r.replace(a,b)
    return r.strip()
def chsearch(handle,q):
    url=f'https://www.youtube.com/{handle}/search?query='+urllib.parse.quote(q)
    html=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30).read().decode('utf-8','ignore')
    m=re.search(r'var ytInitialData = (\{.*?\});</script>',html)
    if not m: return []
    data=json.loads(m.group(1)); out=[]
    def walk(o):
        if isinstance(o,dict):
            if 'videoRenderer' in o:
                v=o['videoRenderer']
                out.append({'id':v.get('videoId'),'t':txt(v.get('title',{}).get('runs',[{}])[0].get('text','')),'d':v.get('lengthText',{}).get('simpleText','')})
            for k in o: walk(o[k])
        elif isinstance(o,list):
            for k in o: walk(k)
    walk(data); return [x for x in out if x['id']]
if __name__=='__main__':
    h=sys.argv[1]
    for q in sys.argv[2:]:
        print('\n=== '+q)
        try:
            for r in chsearch(h,q)[:16]: print(f"{r['id']}|{r['d']}|{r['t'][:100]}")
        except Exception as e: print('ERR',e)
