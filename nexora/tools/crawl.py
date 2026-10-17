import json, re, sys, urllib.request
from playwright.sync_api import sync_playwright
B='http://localhost:3111'
routes=['/','/tournaments','/tournaments?status=LIVE','/tournaments/nexora-mini-tour','/tournaments/past-cup','/roster','/roster/creed','/roster/adam-x','/media','/media?category=CLUTCH','/news','/news/nexora-mini-tour-registration-open','/giveaways','/giveaways/community-giveaway','/partners','/media-kit','/about','/contact','/contact?subject=Partnership','/login','/register','/reset-password']
bad=[];seen=set();issues=[]
with sync_playwright() as p:
    br=p.chromium.launch();ctx=br.new_context(viewport={'width':1440,'height':900});pg=ctx.new_page()
    errs=[];pg.on('console',lambda m: errs.append((pg.url,m.text)) if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append((pg.url,str(e))))
    pg.on('requestfailed',lambda r: errs.append((pg.url,'REQFAIL '+r.url)) if ('/api/track' not in r.url and '_rsc=' not in r.url) else None)
    for r in routes:
        resp=pg.goto(B+r,wait_until='networkidle');st=resp.status
        if st>=400: issues.append(('STATUS',r,st))
        for h in pg.eval_on_selector_all('a[href]','els=>els.map(e=>e.getAttribute("href"))'):
            if h.startswith('/') and not h.startswith('//'): seen.add(h.split('#')[0] or '/')
            elif h.lower().startswith('javascript:'): issues.append(('JSLINK',r,h))
    # internal link check
    for h in sorted(seen):
        if h in routes: continue
        rq=ctx.request.get(B+h,max_redirects=0);
        if rq.status>=400: issues.append(('DEADLINK',h,rq.status))
    # overflow at widths
    for w in (320,375,768,1440):
        pg.set_viewport_size({'width':w,'height':800})
        for r in ['/','/tournaments','/tournaments/nexora-mini-tour','/roster','/contact','/news','/news/nexora-mini-tour-registration-open','/partners','/media-kit','/about','/giveaways','/giveaways/community-giveaway','/media','/login','/register']:
            pg.goto(B+r,wait_until='networkidle');ov=pg.evaluate('document.documentElement.scrollWidth-window.innerWidth')
            if ov>1: issues.append(('OVERFLOW',f'{r}@{w}',ov))
    # hero video
    pg.set_viewport_size({'width':1440,'height':900});pg.goto(B+'/',wait_until='networkidle');pg.wait_for_timeout(800)
    print('video-in-dom',pg.locator('video').count(),'poster-bg',pg.evaluate("getComputedStyle(document.querySelector('section[aria-label=NEXORA]')).backgroundImage")[:40])
    print('video-playing',pg.evaluate("(()=>{const v=document.querySelector('video');return v?{paused:v.paused,muted:v.muted,ready:v.readyState,w:v.videoWidth}:null})()"))
    rc=br.new_context(reduced_motion='reduce');rp=rc.new_page();rp.goto(B+'/',wait_until='networkidle');rp.wait_for_timeout(600);print('reduced-motion video count',rp.locator('video').count())
    # countdown syncs
    pg.goto(B+'/tournaments/nexora-mini-tour',wait_until='networkidle');pg.wait_for_timeout(1500);print('countdown text:',pg.locator('[role=timer]').first.inner_text().replace('\n',' '))
    # XSS escaped
    pg.goto(B+'/news/nexora-mini-tour-registration-open');print('script tag in DOM:',pg.locator('article script').count(),'| escaped text shown:','<script>' in pg.locator('article').inner_text())
    # roster unsafe social
    pg.goto(B+'/roster/creed');print('roster links:',pg.eval_on_selector_all('main a, #main a','e=>e.map(x=>x.href).filter(h=>/instagram|javascript/.test(h))'))
    # contact form
    pg.goto(B+'/contact');pg.fill('input[name=name]','Test User');pg.fill('input[name=subject]','Partnership');pg.fill('input[name=email]','test@example.com');pg.fill('textarea[name=message]','Hello NEXORA team, this is a test message.');pg.click('button[type=submit]');pg.wait_for_timeout(1500)
    print('contact result:',pg.locator('[role=status],[role=alert]').first.inner_text() if pg.locator('[role=status],[role=alert]').count() else pg.content()[:200])
    # invalid contact
    pg.goto(B+'/contact');pg.fill('input[name=email]','bad');pg.click('button[type=submit]');pg.wait_for_timeout(800);print('validation alerts:',pg.locator('[role=alert]').count())
    # auth gating + redirects
    for u in ['/admin/dashboard','/captain/dashboard']:
        rq=ctx.request.get(B+u,max_redirects=0);print(u,rq.status,rq.headers.get('location'))
    print('/discord',ctx.request.get(B+'/discord',max_redirects=0).headers.get('location'))
    print('/go/sponsor',ctx.request.get(B+'/go/3b1f0d3e-6c1a-4c7b-9a55-0b9d2f5e7a11',max_redirects=0).headers.get('location'),'| bad id ->',ctx.request.get(B+'/go/nope',max_redirects=0).headers.get('location'))
    print('/nope',ctx.request.get(B+'/nope').status,'| /tournaments/<bad>',ctx.request.get(B+'/tournaments/DROP;TABLE').status)
    print('track ok',ctx.request.post(B+'/api/track',data=json.dumps({'type':'page_view','path':'/x'}),headers={'content-type':'application/json'}).status,'bad',ctx.request.post(B+'/api/track',data=json.dumps({'type':'hack','path':'/x'}),headers={'content-type':'application/json'}).status)
    h=ctx.request.get(B+'/').headers;print({k:h.get(k) for k in ['x-frame-options','x-content-type-options','strict-transport-security','cache-control']})
    print('robots:',ctx.request.get(B+'/robots.txt').text()[:200].replace('\n',' | '));sm=ctx.request.get(B+'/sitemap.xml').text();print('sitemap urls',len(re.findall('<loc>',sm)),'has mini-tour','nexora-mini-tour' in sm)
    # screenshots
    for name,w,r in [('home-d',1440,'/'),('home-m',390,'/'),('tour-m',390,'/tournaments/nexora-mini-tour'),('roster-d',1440,'/roster')]:
        pg.set_viewport_size({'width':w,'height':900});pg.goto(B+r,wait_until='networkidle');pg.wait_for_timeout(900);pg.screenshot(path=f'/tmp/{name}.png',full_page=(name!='home-d'))
    print('console/page errors:',[e for e in errs if 'favicon' not in e[1]][:8])
print('ISSUES:',issues)
print('inserted:',[(x['table'],list(x['row'].keys())[:5]) for x in json.load(urllib.request.urlopen('http://127.0.0.1:54321/__inserted'))][:4])
