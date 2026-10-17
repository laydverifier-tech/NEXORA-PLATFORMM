import json, base64, urllib.request, sys
from playwright.sync_api import sync_playwright
B='http://localhost:3111'; M='http://127.0.0.1:54321'
CEO='57d4765f-8392-4762-bab5-4bd67f38652d'; USR='4a42d482-cc7e-42f9-86c6-ace1140136a3'
b64=lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
def cookie(sub,aal,factors=True):
    tok=f"{b64({'alg':'HS256'})}.{b64({'sub':sub,'aal':aal,'role':'authenticated','aud':'authenticated','exp':9999999999,'session_id':'s'})}.sig"
    fac=[{'id':'a1000000-0000-4000-8000-000000000001','factor_type':'totp','status':'verified','friendly_name':'Phone','created_at':'2026-10-01T00:00:00Z','updated_at':'2026-10-01T00:00:00Z'}] if factors and sub==CEO else []
    sess={'access_token':tok,'token_type':'bearer','expires_in':3600,'expires_at':9999999999,'refresh_token':f'rt-{sub}-{aal}','user':{'id':sub,'aud':'authenticated','role':'authenticated','email':'x@test.dev','app_metadata':{},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z','factors':fac}}
    return {'name':'sb-127-auth-token','value':'base64-'+base64.urlsafe_b64encode(json.dumps(sess).encode()).decode().rstrip('='),'url':B}
def mlog(): return json.load(urllib.request.urlopen(M+'/__log'))
R=[]; 
def ok(name,cond,info=''): R.append((name,bool(cond),info)); print(('PASS ' if cond else 'FAIL ')+name+(' | '+str(info) if info and not cond else ''))
with sync_playwright() as p:
    br=p.chromium.launch()
    def ctx(c=None):
        x=br.new_context(viewport={'width':1280,'height':900});
        if c: x.add_cookies([c])
        return x
    # 1 unauthenticated
    x=ctx(); r=x.request.get(B+'/admin/dashboard',max_redirects=0); ok('anon /admin/dashboard -> login',r.status in(302,307) and '/admin/login' in (r.headers.get('location') or ''),r.headers.get('location'))
    for u in ['/admin/tournaments','/admin/roster','/admin/settings','/admin/security','/admin/registrations/export','/admin/mfa/verify']:
        r=x.request.get(B+u,max_redirects=0); ok(f'anon {u} blocked',r.status in(302,307,403) and 'location' in r.headers or r.status==403,r.status)
    # 2 aal1 with factor -> verify ; no factor -> enroll ; USER -> 403
    x=ctx(cookie(CEO,'aal1')); r=x.request.get(B+'/admin/dashboard',max_redirects=0); ok('aal1 CEO (factor enrolled) -> /admin/mfa/verify','/admin/mfa/verify' in (r.headers.get('location') or ''),r.headers.get('location'))
    x=ctx(cookie(CEO,'aal1',False)); r=x.request.get(B+'/admin/dashboard',max_redirects=0); ok('aal1 CEO (no factor) -> /admin/mfa/enroll','/admin/mfa/enroll' in (r.headers.get('location') or ''),r.headers.get('location'))
    x=ctx(cookie(USR,'aal2')); r=x.request.get(B+'/admin/dashboard'); t=r.text(); ok('plain user at aal2 -> ACCESS DENIED, no admin UI', 'ACCESS DENIED' in t and 'CONTROL CENTER' not in t, r.status)
    r=x.request.get(B+'/admin/registrations/export'); ok('plain user cannot export CSV',r.status==403,r.status)
    # 3 full MFA flow through the UI
    x=ctx(); pg=x.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(B+'/admin/login'); 
    pg.fill('input[name=email]','ceo@test.dev'); pg.fill('input[name=password]','wrong'); pg.click('main button[type=submit]'); pg.wait_for_timeout(1200)
    ok('wrong password -> generic error', 'Invalid email or password' in pg.inner_text('body'))
    pg.fill('input[name=email]','user@test.dev'); pg.fill('input[name=password]','Correct-Horse-9'); pg.click('main button[type=submit]'); pg.wait_for_timeout(1500)
    ok('non-staff with valid password -> same generic error (no leak)', 'Invalid email or password' in pg.inner_text('body') and '/admin/mfa' not in pg.url, pg.url)
    pg.fill('input[name=email]','ceo@test.dev'); pg.fill('input[name=password]','Correct-Horse-9'); pg.click('main button[type=submit]'); pg.wait_for_url('**/admin/mfa/verify**',timeout=8000)
    ok('staff password ok -> asked for authenticator code', 'VERIFICATION CODE' in pg.inner_text('body'))
    pg.fill('input[name=code]','000000'); pg.click('main button[type=submit]'); pg.wait_for_timeout(1200); ok('bad TOTP code rejected', 'Invalid or expired code' in pg.inner_text('body'))
    pg.fill('input[name=code]','123456'); pg.click('main button[type=submit]'); pg.wait_for_url('**/admin/dashboard**',timeout=8000); pg.wait_for_timeout(800)
    ok('good TOTP code -> dashboard (aal2)', 'CONTROL CENTER' in pg.inner_text('body') and '1,234' in pg.inner_text('body'))
    # 4 rate limit on login (8 / 15 min / IP, memory fallback in test)
    x2=ctx(); p2=x2.new_page(); p2.goto(B+'/admin/login'); last=''
    for i in range(10):
        p2.fill('input[name=email]',f'a{i}@test.dev'); p2.fill('input[name=password]','x'); p2.click('main button[type=submit]'); p2.wait_for_timeout(500); last=p2.inner_text('body')
    ok('login brute-force is throttled', 'Too many attempts' in last)
    # 5 all admin pages as aal2 CEO
    x=ctx(cookie(CEO,'aal2')); pg=x.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text[:100]) if m.type=='error' else None)
    pages={'/admin/dashboard':'PAGE VIEWS','/admin/tournaments':'NEXORA MINI TOUR','/admin/tournaments/new':'NEW TOURNAMENT',f'/admin/tournaments/11111111-1111-4111-8111-111111111111':'EDIT','/admin/registrations':'NX-001','/admin/roster':'Nex.CREED','/admin/roster/new':'ADD PLAYER','/admin/roster/22222222-2222-4222-8222-222222222221':'EDIT','/admin/news':'Registration open','/admin/news/new':'NEW ARTICLE','/admin/news/33333333-3333-4333-8333-333333333333':'EDIT ARTICLE','/admin/messages':'Partnership','/admin/settings':'HOME HERO','/admin/security':'203.0.113.7','/admin/mfa/enroll?add=1&next=/admin/security':'SET UP 2-STEP','/admin/rooms':'Room 1','/admin/results':'LEADERBOARD','/admin/giveaways':'Community Giveaway','/admin/giveaways/new':'NEW GIVEAWAY','/admin/giveaways/55555555-5555-4555-8555-555555555555':'entries','/admin/media':'ADD VIDEO','/admin/hall-of-fame':'ADD CHAMPION','/admin/partners':'ADD PARTNER','/admin/users':'USERS'}
    for u,t in pages.items():
        r=pg.goto(B+u,wait_until='networkidle'); pg.wait_for_timeout(300); ok(f'page {u.split("?")[0][-34:]}', r.status==200 and t in pg.inner_text('body'), (r.status, pg.url))
    ov=[]
    for w in (320,390,1024):
        pg.set_viewport_size({'width':w,'height':800})
        for u in ['/admin/dashboard','/admin/tournaments/new','/admin/roster','/admin/settings','/admin/security','/admin/registrations']:
            pg.goto(B+u,wait_until='networkidle'); d=pg.evaluate('document.documentElement.scrollWidth-window.innerWidth'); 
            if d>1: ov.append((u,w,d,pg.evaluate("[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).slice(0,4).map(e=>e.tagName+'.'+String(e.className).slice(0,50)+' '+Math.round(e.getBoundingClientRect().right))")))
    ok('no horizontal overflow on admin pages (320/390/1024)', not ov, ov)
    ok('no JS errors in admin', not [e for e in errs if 'RSC' not in e and 'Failed to fetch' not in e], errs[:3])
    # 6 XSS in messages
    pg.set_viewport_size({'width':1280,'height':900}); pg.goto(B+'/admin/messages'); ok('message <script> rendered as text, not executed', pg.locator('main script').count()==0 and '<script>' in pg.inner_text('main'))
    # 7 mutations
    urllib.request.urlopen(M+'/__reset')
    pg.goto(B+'/admin/roster/new'); pg.fill('input[name=nickname]','Nex.NEW'); pg.fill('input[name=slug]','new-player')
    png=bytes([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])+b'\x00'*64
    open('/tmp/ok.png','wb').write(png); open('/tmp/evil.png','wb').write(b'<html><script>alert(1)</script></html>'+b' '*64)
    pg.set_input_files('input[name=image]','/tmp/evil.png'); pg.click('main button[type=submit]'); pg.wait_for_timeout(1500)
    ok('HTML disguised as .png is rejected (magic-byte check), nothing uploaded', 'not a valid JPG/PNG/WebP' in pg.inner_text('body') and not [l for l in mlog() if l.get('m')=='storage.upload'], mlog())
    pg.goto(B+'/admin/roster/new'); pg.fill('input[name=nickname]','Nex.NEW'); pg.fill('input[name=slug]','new-player'); pg.set_input_files('input[name=image]','/tmp/ok.png'); pg.click('main button[type=submit]'); pg.wait_for_timeout(2000)
    lg=mlog(); up=[l for l in lg if l.get('m')=='storage.upload']; ins=[l for l in lg if l.get('m')=='POST' and l.get('table')=='roster_members']
    ok('valid PNG uploaded to bucket "roster" with random safe name', up and up[0]['path'].startswith('roster/new-player-') and up[0]['path'].endswith('.png'), up)
    ok('roster row inserted with image_url', ins and ins[0]['row'].get('image_url','').startswith('http') and ins[0]['row'].get('slug')=='new-player', ins)
    ok('audit log written as actor', any(l.get('m')=='POST' and l.get('table')=='activity_logs' and l['row'].get('actor_id')==CEO and l['row'].get('action')=='roster.create' for l in lg))
    pg.goto(B+'/admin/tournaments/new'); pg.fill('input[name=name]','X'); pg.fill('input[name=slug]','BAD SLUG'); pg.click('main button[type=submit]'); pg.wait_for_timeout(1200)
    ok('invalid tournament shows field errors, nothing written', 'Lowercase letters' in pg.inner_text('body') and not [l for l in mlog() if l.get('table')=='tournaments'])
    pg.goto(B+'/admin/settings'); pg.fill('input[name=instagram_url]','javascript:alert(1)'); pg.click('form:has(input[name=site_name]) button[type=submit]'); pg.wait_for_timeout(1200)
    ok('settings reject non-https social link', 'https' in pg.inner_text('body') and not [l for l in mlog() if l.get('table')=='site_settings'])
    pg.goto(B+'/admin/settings'); pg.fill('input[name=instagram_url]','https://instagram.com/nexora_tour'); pg.click('form:has(input[name=site_name]) button[type=submit]'); pg.wait_for_timeout(1500)
    st=[l for l in mlog() if l.get('table')=='site_settings']; ok('settings saved (upsert site/social/hero/stats)', st and isinstance(st[-1]['row'],list) and len(st[-1]['row'])==4 and any(r['key']=='social' and r['value'].get('instagram_url')=='https://instagram.com/nexora_tour' for r in st[-1]['row']), st[-1:] )
    pg.goto(B+'/admin/registrations'); pg.click('text=CONFIRM PAYMENT'); pg.wait_for_timeout(1200)
    pt=[l for l in mlog() if l.get('m')=='PATCH' and l.get('table')=='squad_registrations']; ok('confirm payment -> PATCH status+payment CONFIRMED, reviewed_by set', pt and pt[0]['row'].get('payment_status')=='CONFIRMED' and pt[0]['row'].get('reviewed_by')==CEO, pt)
    pg.goto(B+'/admin/messages'); pg.click('text=MARK READ'); pg.wait_for_timeout(1000); ok('message mark-read -> PATCH', any(l.get('m')=='PATCH' and l.get('table')=='contact_messages' for l in mlog()))
    r=x.request.get(B+'/admin/registrations/export'); t=r.text(); ok('CSV export works and neutralises formula injection', r.status==200 and "\"'=cmd|calc\"" in t and 'text/csv' in r.headers.get('content-type',''), t[:160])
    pg.goto(B+'/admin/security'); ok('last authenticator cannot be removed', 'LAST ONE' in pg.inner_text('body'))
    # 8 headers
    r=x.request.get(B+'/admin/dashboard'); h=r.headers
    ok('admin headers: no-store + noindex + CSP + frame deny', 'no-store' in h.get('cache-control','') and 'noindex' in h.get('x-robots-tag','') and "frame-ancestors 'none'" in h.get('content-security-policy','') and h.get('x-frame-options')=='DENY', h)
    r=x.request.get(B+'/'); ok('public CSP present, no x-powered-by', "default-src 'self'" in r.headers.get('content-security-policy','') and 'x-powered-by' not in r.headers)
    for u in ['/tournaments/nexora-mini-tour/register','/giveaways/community-giveaway','/tournaments/nexora-mini-tour']:
        r=x.request.get(B+u); ok(f'public {u} 200', r.status==200, r.status)
    r=x.request.get(B+'/tournaments/nexora-mini-tour/leaderboard?stage=GRAND_FINAL&format=story'); ok('leaderboard story image is a real PNG', r.status==200 and r.body()[:4]==b'\x89PNG', (r.status, r.headers.get('content-type')))
    r=x.request.get(B+'/manifest.webmanifest'); ok('PWA manifest served', r.status==200 and 'NEXORA' in r.text())
    pg.goto(B+'/admin/dashboard'); ok('admin pages hydrate under strict nonce CSP (no CSP violations)', not [e for e in errs if 'Content Security Policy' in e or 'Refused to' in e], errs[:2])
    br.close()
print('\nSUMMARY:',sum(1 for r in R if r[1]),'/',len(R),'passed'); sys.exit(0 if all(r[1] for r in R) else 1)
