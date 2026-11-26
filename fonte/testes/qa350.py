import asyncio,os,re
from playwright.async_api import async_playwright
from protecao import proteger
VELHO=open('/home/claude/prospectarion/musicalis/app/index.html',encoding='utf-8').read()
NOVO=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','app','index.html'),encoding='utf-8').read()
R=[];ok=lambda n,c,i='':R.append(('✓' if c else '✗',n,i))
async def rotas(c):
  async def v(r):
    u=r.request.url
    if u.split('#')[0].rstrip('/').endswith('prospectarion/musicalis/app'):await r.fulfill(body=VELHO,content_type='text/html')
    elif u.split('#')[0].rstrip('/').endswith('musicalis-br.github.io/app'):await r.fulfill(body=NOVO,content_type='text/html')
    else:await r.fulfill(status=404,body='')
  await c.route(re.compile(r'https://(aap29|musicalis-br)\.github\.io/.*'),v)
async def criar(pg,email,nome):
  await pg.evaluate("authMode='criar';page='login';render()")
  for sel,val in [('#lg-nome',nome),('#lg-tel','51911112222'),('#lg-cid','Canoas'),('#lg-pass2','abcdef'),('#lg-email',email),('#lg-pass','abcdef')]:
    if await pg.query_selector(sel):await pg.fill(sel,val)
  if await pg.query_selector('#lg-uf'):await pg.select_option('#lg-uf','RS')
  await pg.click('#lg-go');await pg.wait_for_timeout(1500)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();proteger(b)
  c=await b.new_context(viewport={'width':800,'height':1200});await rotas(c);pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)))
  # 1) aluno no endereço antigo
  await pg.goto('https://aap29.github.io/prospectarion/musicalis/app/');await pg.wait_for_timeout(800)
  await criar(pg,'adao@x.com','Adão Teste');await pg.wait_for_timeout(1500)
  ok('aluno que entra no antigo vai para o novo',pg.url.startswith('https://musicalis-br.github.io/app/'),pg.url[:60])
  await pg.wait_for_timeout(1500)
  ses=await pg.evaluate("ACC.session");nome=await pg.evaluate("(curUser()||{}).nome||(curUser()||{}).name||''")
  ok('conta do aluno chegou ao novo',ses=='adao@x.com',f'{ses} {nome}')
  # 2) criador no endereço antigo não é levado
  c2=await b.new_context();await rotas(c2);q=await c2.new_page();q.on('pageerror',lambda x:err.append(str(x)))
  await q.goto('https://aap29.github.io/prospectarion/musicalis/app/');await q.wait_for_timeout(800)
  await q.evaluate("ACC.users['andersonpinto.rs@gmail.com']={nome:'Kenny',plan:'vitalicio',salt:'a',hash:'b'};ACC.session='andersonpinto.rs@gmail.com';saveAcc();location.reload()");await q.wait_for_timeout(2500)
  ok('Criador no antigo não é levado',q.url.startswith('https://aap29.github.io/'),q.url[:60])
  await q.goto('https://aap29.github.io/prospectarion/musicalis/app/#levar');await q.wait_for_timeout(600);await q.reload();await q.wait_for_timeout(2000)
  ok('#levar com Criador salvo desconecta e pede a conta do aluno',await q.evaluate("ACC.session===null&&/conta do aluno/.test((document.getElementById('lg-msg')||{}).textContent||'')"))
  # 3) e-mail desconhecido no novo
  c3=await b.new_context();await rotas(c3);n=await c3.new_page();n.on('pageerror',lambda x:err.append(str(x)))
  await n.goto('https://musicalis-br.github.io/app/');await n.wait_for_timeout(800)
  await n.evaluate("authMode='entrar';page='login';render()");await n.fill('#lg-email','quem@x.com');await n.fill('#lg-pass','abcdef');await n.click('#lg-go');await n.wait_for_timeout(800)
  h=await n.evaluate("(document.querySelector('#lg-antigo a')||{}).href||''")
  ok('novo mostra o botão para trazer do antigo',h.endswith('/prospectarion/musicalis/app/#levar'),h)
  await n.screenshot(path='/home/claude/qa350_novo.png')
  ok('sem erros JS',not err,str(err[:3]))
  await b.close()
asyncio.run(main())
for r in R:print(*r)
print('FALHAS:',sum(1 for r in R if r[0]=='✗'))
