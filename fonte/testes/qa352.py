import asyncio,os,json,hashlib
from playwright.async_api import async_playwright
from protecao import proteger
F='file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','app','index.html'))
R=[];ok=lambda n,c,i='':R.append(('✓' if c else '✗',n,i))
DB={};CODES={};CHAMADAS=[]
def srv(d):
 a=d.get('acao');e=(d.get('email') or '').lower();CHAMADAS.append(a);c=DB.get(e)
 sha=lambda h:hashlib.sha256(h.encode()).hexdigest()
 if a=='conta_sal':return {'ok':True,'status':'existe','sal':c['sal']} if c and c.get('sal') else {'ok':True,'status':'nao'}
 if a=='conta_entrar':
  if not c or not c.get('sal'):return {'ok':True,'status':'nao'}
  if sha(d['hash'])!=c['ver']:return {'ok':True,'status':'senha'}
  return {'ok':True,'status':'ok','sal':c['sal'],'nome':c['nome'],'telefone':c['tel'],'licenca':c.get('lic','')}
 if a=='conta_salvar':
  if not c:DB[e]={'sal':d['sal'],'ver':sha(d['hash']),'nome':d.get('nome',''),'tel':d.get('telefone',''),'lic':d.get('licenca','')};return {'ok':True,'status':'criada'}
  if sha(d['hash'])!=c['ver']:return {'ok':True,'status':'senha'}
  if d.get('licenca'):c['lic']=d['licenca']
  return {'ok':True,'status':'ok'}
 if a=='senha_codigo':
  if not c:return {'ok':True,'status':'nao'}
  CODES[e]='123456';return {'ok':True,'status':'enviado'}
 if a=='senha_nova':
  if d.get('codigo')!=CODES.get(e):return {'ok':True,'status':'invalido'}
  c['sal']=d['sal'];c['ver']=sha(d['hash']);return {'ok':True,'status':'ok','nome':c['nome'],'telefone':c['tel'],'licenca':c.get('lic','')}
 if a=='cofre_obter':return {'ok':True,'cofre':(c or {}).get('cofre','')}
 if a=='cofre_salvar':
  if d.get('token')!='TOK':return {'erro':'token inválido'}
  DB.setdefault(e,{'nome':'Criador','tel':''})['cofre']=d['cofre'];return {'ok':True,'status':'ok'}
 if a=='aparelho':return {'ok':True,'status':'ok'}
 return {'ok':True}
async def rota(route):
 r=route.request
 if r.method=='POST':
  try:d=json.loads(r.post_data or '{}')
  except Exception:d={}
  await route.fulfill(status=200,content_type='application/json',body=json.dumps(srv(d)))
 else:await route.fulfill(status=200,content_type='application/json',body='{"ok":true,"versoes":[]}')
async def aparelho(b,vw=(412,915)):
 c=await b.new_context(viewport={'width':vw[0],'height':vw[1]});await c.route('https://script.google.com/**',rota)
 pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)));await pg.goto(F);await pg.wait_for_timeout(500);return c,pg,err
async def entrar(pg,e,p):
 await pg.evaluate("authMode='entrar';page='login';render()");await pg.fill('#lg-email',e);await pg.fill('#lg-pass',p);await pg.click('#lg-go');await pg.wait_for_timeout(1500)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();proteger(b)
  # Aparelho 1: cria a conta
  c1,p1,e1=await aparelho(b)
  await p1.evaluate("authMode='criar';page='login';render()")
  for sel,v in [('#lg-nome','Bruno Silva'),('#lg-tel','51911112222'),('#lg-cid','Canoas'),('#lg-email','bruno@x.com'),('#lg-pass','abc123'),('#lg-pass2','abc123')]:
   if await p1.query_selector(sel):await p1.fill(sel,v)
  if await p1.query_selector('#lg-uf'):await p1.select_option('#lg-uf','RS')
  await p1.click('#lg-go');await p1.wait_for_timeout(2000)
  ok('Aparelho 1: conta criada e salva na planilha',await p1.evaluate("ACC.session")=='bruno@x.com' and 'bruno@x.com' in DB,str(list(DB)))
  # Aparelho 2 (tablet): entrar com o mesmo e-mail e senha
  c2,p2,e2=await aparelho(b,(800,1280))
  await entrar(p2,'bruno@x.com','errada1')
  m=await p2.evaluate("($('#lg-msg')||{}).textContent||''")
  ok('Aparelho 2: senha errada é recusada com explicação','mesma senha dos seus outros aparelhos' in m,m[:80])
  t=await p2.evaluate("[...document.querySelectorAll('#app a')].map(a=>a.textContent).join('|')")
  ok('Tela de login tem "Esqueci minha senha"','Esqueci minha senha' in t,t)
  await p2.screenshot(path='/home/claude/qa352_login.png')
  DB['bruno@x.com']['lic']='MUS-A271127-ABCD-EFGHJK'
  await p2.evaluate("checkLicense=async(e,c)=>c==='MUS-A271127-ABCD-EFGHJK'?{plan:'anual',exp:'2027-11-27'}:null")
  await entrar(p2,'bruno@x.com','abc123')
  info=await p2.evaluate("({s:ACC.session,n:curUser()&&curUser().nome,pl:curUser()&&curUser().plan})")
  ok('Aparelho 2: entra com a mesma senha e traz nome e plano',info=={'s':'bruno@x.com','n':'Bruno Silva','pl':'anual'},str(info))
  # Aparelho 3 (PC): "Criar conta" com o mesmo e-mail
  c3,p3,e3=await aparelho(b,(1280,720))
  await p3.evaluate("authMode='criar';page='login';render()")
  for sel,v in [('#lg-nome','Bruno'),('#lg-tel','51911112222'),('#lg-cid','Canoas'),('#lg-email','bruno@x.com'),('#lg-pass','outra9'),('#lg-pass2','outra9')]:
   if await p3.query_selector(sel):await p3.fill(sel,v)
  if await p3.query_selector('#lg-uf'):await p3.select_option('#lg-uf','RS')
  await p3.click('#lg-go');await p3.wait_for_timeout(1500)
  m=await p3.evaluate("($('#lg-msg')||{}).textContent||''")
  ok('Aparelho 3: "Criar conta" com senha diferente não cria outra conta','já tem conta' in m and not await p3.evaluate("ACC.session"),m[:70])
  await entrar(p3,'bruno@x.com','abc123')
  ok('Aparelho 3 (PC): entra com a mesma senha',await p3.evaluate("ACC.session")=='bruno@x.com')
  # Esqueci minha senha no aparelho 3
  await p3.evaluate("logout()");await p3.wait_for_timeout(200)
  await p3.click('#lk-nsenha');await p3.wait_for_timeout(200);await p3.fill('#ns-email','bruno@x.com');await p3.click('#lg-go');await p3.wait_for_timeout(600)
  await p3.fill('#ns-cod','111111');await p3.fill('#ns-p1','nova777');await p3.fill('#ns-p2','nova777');await p3.click('#lg-go');await p3.wait_for_timeout(800)
  ok('Nova senha: código errado recusado',await p3.evaluate("/Código incorreto/.test($('#lg-msg').textContent)"))
  await p3.fill('#ns-cod','123456');await p3.click('#lg-go');await p3.wait_for_timeout(1500)
  ok('Nova senha: salva e entra',await p3.evaluate("ACC.session")=='bruno@x.com')
  await p3.screenshot(path='/home/claude/qa352_pc.png')
  # Aparelho 2 percebe a troca e passa a pedir a nova
  await p2.evaluate("_contaT=0;contaSincronizar()");await p2.wait_for_timeout(1200)
  await p2.evaluate("logout()");await entrar(p2,'bruno@x.com','abc123')
  ok('Aparelho 2: senha antiga deixa de valer depois da troca',not await p2.evaluate("ACC.session"))
  await entrar(p2,'bruno@x.com','nova777')
  ok('Aparelho 2: entra com a senha nova',await p2.evaluate("ACC.session")=='bruno@x.com')
  # Aluno antigo (só local) é enviado para a planilha ao abrir
  c4,p4,e4=await aparelho(b)
  await p4.evaluate("""(async()=>{const s=hex(crypto.getRandomValues(new Uint8Array(16)));ACC.users['ana@x.com']={salt:s,hash:await pbkdf2('ana123',s),role:'aluno',plan:'gratuito',exp:null,nome:'Ana'};ACC.session='ana@x.com';saveAcc();enterSession('ana@x.com');_contaT=0;await contaSincronizar()})()""");await p4.wait_for_timeout(1500)
  ok('Aluno que já usava o app é registrado na planilha sozinho','ana@x.com' in DB)
  # Criador: cofre com a própria senha
  await p4.evaluate("""(async()=>{const kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);window.__jwk=await crypto.subtle.exportKey('jwk',kp.privateKey);
   chaveConfere=async()=>true;ACC.cfg.srvToken='TOK';_jwkUlt={jwk:__jwk,tok:'TOK'};await cofreSubir('kenny@x.com','minhaSenha1')})()""");await p4.wait_for_timeout(4000)
  ok('Criador: cofre guardado com a senha dele',bool(DB.get('kenny@x.com',{}).get('cofre')))
  c5,p5,e5=await aparelho(b,(1280,720))
  await p5.evaluate("ehCriadorEmail=async e=>e==='kenny@x.com';chaveConfere=async()=>true")
  await entrar(p5,'kenny@x.com','errada');await p5.wait_for_timeout(4000)
  ok('Criador no PC novo: senha errada não abre',not await p5.evaluate("ACC.session"))
  await entrar(p5,'kenny@x.com','minhaSenha1');await p5.wait_for_timeout(5000)
  dbg=await p5.evaluate("({s:ACC.session,o:isOwner(),m:($('#lg-msg')||{}).textContent,k:KEY_OK,ke:KEY_EMAILS})")
  ok('Criador no PC novo: entra com a própria senha e vira Criador',dbg['s']=='kenny@x.com' and dbg['o'],str(dbg)+str(CHAMADAS[-6:]))
  # Sem planilha (servidor antigo): continua como antes
  c6,p6,e6=await aparelho(b)
  await c6.unroute('https://script.google.com/**');await c6.route('https://script.google.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{"erro":"ação desconhecida"}'))
  await entrar(p6,'ze@x.com','abc123')
  m=await p6.evaluate("($('#lg-msg')||{}).textContent||''")
  ok('Planilha antiga: login local funciona como antes',('não' in m.lower()) and not await p6.evaluate("ACC.session"),m[:70])
  for n,e in [('1',e1),('2',e2),('3',e3),('4',e4),('5',e5),('6',e6)]:ok(f'Aparelho {n}: sem erros JS',not e,str(e[:2]))
  await b.close()
asyncio.run(main())
for r in R:print(*r)
print('FALHAS:',sum(1 for r in R if r[0]=='✗'))
