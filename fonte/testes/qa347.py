import asyncio,json
from playwright.async_api import async_playwright
from protecao import proteger
B='http://localhost:8811/'
R=[];ok=lambda n,c,i='':R.append(('✓' if c else '✗',n,i))
AND='Mozilla/5.0 (Linux; Android 13; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
INSTA=AND+' Instagram 320.0.0.0 Android'
SAMS='Mozilla/5.0 (Linux; Android 13; SM-A135M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0 Mobile Safari/537.36'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();proteger(b)
  for nome,ua in [('chrome',AND),('instagram',INSTA),('samsung',SAMS)]:
   c=await b.new_context(viewport={'width':412,'height':915},user_agent=ua);pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)))
   await pg.goto(B+'app/');await pg.wait_for_timeout(800)
   await pg.evaluate("page='instalar';render()");await pg.wait_for_timeout(300)
   t=await pg.inner_text('#app')
   ok(f'{nome}: mostra o ícone certo',await pg.query_selector('#inst-icone img') is not None and 'ícone certo' in t)
   img_ok=await pg.evaluate("(()=>{const i=document.querySelector('#inst-icone img');return i&&i.complete&&i.naturalWidth===192})()")
   ok(f'{nome}: imagem do ícone carrega',img_ok)
   tem_aviso='Abrir no Chrome' in t
   ok(f'{nome}: aviso de navegador {"aparece" if nome!="chrome" else "não aparece"}',tem_aviso==(nome!='chrome'))
   await pg.screenshot(path=f'/home/claude/musicalis-br.github.io/../qa347_{nome}.png')
   ok(f'{nome}: sem erros JS',not err,str(err[:2]));await c.close()
  # páginas do site: manifesto e ícones
  c=await b.new_context();pg=await c.new_page()
  for pag in ['','pagar/','pix/','obrigado/','vitalicio-especial/']:
   await pg.goto(B+pag)
   href=await pg.evaluate("(document.querySelector('link[rel=manifest]')||{}).href")
   r=await pg.request.get(href);m=json.loads(await r.text())
   ics=[await pg.request.get(href.rsplit('/',1)[0]+'/'+i['src']) for i in m['icons']]
   ok(f'/{pag}: manifesto com ícones oficiais e abre o app',r.ok and all(x.ok for x in ics) and m['start_url']=='app/' and m['id']=='/app/')
  for f in ['favicon.ico','apple-touch-icon.png','app/manifest.webmanifest']:
   r=await pg.request.get(B+f);ok(f'{f} existe',r.ok)
  await b.close()
asyncio.run(main())
for r in R:print(*r)
print('FALHAS:',sum(1 for r in R if r[0]=='✗'))
