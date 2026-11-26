import asyncio,os,base64,json,urllib.parse
from playwright.async_api import async_playwright
from protecao import proteger
RAIZ=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'))
F='file://'+RAIZ+'/app/index.html'
R=[];ok=lambda n,c,i='':R.append(('✓' if c else '✗',n,i))
def tok(d):return base64.urlsafe_b64encode(json.dumps(d,ensure_ascii=False).encode()).decode().rstrip('=')
async def entrar(pg):
 await pg.evaluate("authMode='criar';page='login';render()")
 for sel,v in [('#lg-nome','Prof Teste'),('#lg-tel','51911112222'),('#lg-cid','Canoas'),('#lg-pass2','abcdef'),('#lg-email','prof@x.com'),('#lg-pass','abcdef')]:
  if await pg.query_selector(sel):await pg.fill(sel,v)
 if await pg.query_selector('#lg-uf'):await pg.select_option('#lg-uf','RS')
 await pg.click('#lg-go');await pg.wait_for_timeout(900)
 await pg.evaluate("document.querySelectorAll('.volta-fundo,#mod-modal').forEach(e=>e.remove())")
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();proteger(b)
  for vw,nome in [((412,915),'empe'),((889,400),'deitado')]:
   c=await b.new_context(viewport={'width':vw[0],'height':vw[1]});pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)))
   t1=tok({'k':'parcela','p':'vitalicio','prod':'MUSICALIS Vitalício','v':'R$ 500,00','i':1,'tot':2,'prox':'2026-12-20','n':'Luiz <b>Teste</b>','e':'Luiz@X.com','t':'51991750000','dt':'2026-11-26'})
   await pg.goto(F+'#confirmar='+t1);await pg.wait_for_timeout(400)
   ok(f'{nome}: link some da barra de endereço',await pg.evaluate("location.hash===''&&!!sessionStorage.getItem('mus_conf')"))
   await entrar(pg)
   # aluno comum: link ignorado
   await pg.evaluate("confChecar()");await pg.wait_for_timeout(200)
   ok(f'{nome}: aluno não abre a confirmação',await pg.evaluate("page!=='confirmar'&&!sessionStorage.getItem('mus_conf')"))
   # professor
   await pg.evaluate(f"sessionStorage.setItem('mus_conf','{t1}');isOwner=()=>true;window.__L=[];makeLicense=async(e,p,m,a)=>{{__L.push([e,p,m,a]);return 'COD'+p}};CONF=null;render()");await pg.wait_for_timeout(300)
   t=await pg.evaluate("document.getElementById('app').innerText")
   ok(f'{nome}: professor vê a tela de confirmação',('Confirmar pagamento' in t and 'luiz@x.com' in t and '1ª de 2' in t and '20/12/2026' in t),t[:120])
   ok(f'{nome}: nome do aluno limpo (sem HTML)',await pg.evaluate("!document.querySelector('#app b b')&&/Luiz bTeste|Luiz Teste/.test(document.getElementById('app').innerText)"))
   await pg.screenshot(path=f'/home/claude/qa351_conferir_{nome}.png')
   await pg.click('text=Confirmar e gerar acesso');await pg.wait_for_timeout(300)
   L=await pg.evaluate("__L")
   ok(f'{nome}: 1ª parcela gera acesso parcelado até 20/12',L==[['luiz@x.com','parcelado',0,'2026-12-20']],str(L))
   m=await pg.evaluate("document.getElementById('conf-msg').value")
   ok(f'{nome}: mensagem pronta com link de ativação',('1ª parcela' in m) and ('#ativar=CODparcelado' in m) and ('20/12/2026' in m),m[:90])
   h=await pg.evaluate("[...document.querySelectorAll('#app a')].map(a=>a.href).find(x=>x.includes('wa.me'))||''")
   ok(f'{nome}: botão WhatsApp vai para o aluno',h.startswith('https://wa.me/5551991750000?text='),h[:40])
   await pg.screenshot(path=f'/home/claude/qa351_confirmado_{nome}.png')
   # última parcela
   t2=tok({'k':'parcela','p':'vitalicio','prod':'MUSICALIS Vitalício','v':'R$ 500,00','i':2,'tot':2,'prox':'','n':'Luiz','e':'luiz@x.com','t':'51991750000','dt':'2026-12-20'})
   await pg.evaluate(f"__L=[];CONF=null;CONF_RES=null;sessionStorage.setItem('mus_conf','{t2}');render()");await pg.wait_for_timeout(200)
   await pg.click('text=Confirmar e gerar acesso');await pg.wait_for_timeout(300)
   ok(f'{nome}: última parcela gera o Vitalício completo',await pg.evaluate("__L[0][1]==='vitalicio'&&/última parcela/.test(document.getElementById('conf-msg').value)"))
   # plano normal
   t3=tok({'k':'plano','p':'anual','prod':'MUSICALIS Anual','v':'R$ 479,90','n':'Ana','e':'ana@x.com','t':'','dt':'2026-11-26'})
   await pg.evaluate(f"__L=[];CONF=null;CONF_RES=null;sessionStorage.setItem('mus_conf','{t3}');render()");await pg.wait_for_timeout(200)
   await pg.click('text=Confirmar e gerar acesso');await pg.wait_for_timeout(300)
   ok(f'{nome}: plano Anual gera código anual',await pg.evaluate("__L[0][1]==='anual'&&/MUSICALIS Anual está liberado/.test(document.getElementById('conf-msg').value)"))
   # não recebi
   await pg.evaluate(f"CONF=null;CONF_RES=null;sessionStorage.setItem('mus_conf','{t3}');render()");await pg.wait_for_timeout(200)
   await pg.click('text=Não recebi esse pagamento');await pg.wait_for_timeout(200)
   ok(f'{nome}: "não recebi" gera mensagem gentil',await pg.evaluate("/Ainda não localizei o seu Pix de R\\$ 479,90/.test(document.getElementById('conf-msg').value)"))
   # painel com histórico
   await pg.click('text=Concluir');await pg.wait_for_timeout(400)
   t=await pg.evaluate("(document.getElementById('card-confirmados')||{}).innerText||''")
   ok(f'{nome}: Painel mostra os pagamentos avaliados',t.count('confirmado')>=3 and 'não recebido' in t,t[:100])
   # token inválido
   await pg.evaluate("CONF=null;CONF_RES=null;sessionStorage.setItem('mus_conf','xxx');page='home';render()");await pg.wait_for_timeout(200)
   ok(f'{nome}: link estragado é descartado',await pg.evaluate("page!=='confirmar'&&!sessionStorage.getItem('mus_conf')"))
   ok(f'{nome}: sem erros JS',not err,str(err[:2]));await c.close()
  # páginas de pagamento: modal do comprovante
  c=await b.new_context(viewport={'width':412,'height':915});pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)))
  pops=[];c.on('page',lambda x:pops.append(x))
  await pg.goto('file://'+RAIZ+'/pagar/index.html?p=anual');await pg.wait_for_timeout(400)
  await pg.evaluate("window.open=(u)=>{window.__u=u;return null}")
  btn=await pg.query_selector('button.btn.wa')
  ok('pagar: botão Enviar comprovante',btn is not None)
  if btn:
   await btn.click();await pg.wait_for_timeout(200)
   await pg.click('#mc-ok');await pg.wait_for_timeout(100)
   ok('pagar: pede os dados antes de enviar',await pg.evaluate("!!(document.getElementById('mc-err')||{}).textContent&&!window.__u"))
   await pg.fill('#mc-n','Ana Souza');await pg.fill('#mc-e','ana@x.com');await pg.fill('#mc-t','(51) 99999-0000')
   await pg.click('#mc-ok');await pg.wait_for_timeout(200)
   u=await pg.evaluate("window.__u||''");txt=urllib.parse.unquote(u)
   ok('pagar: abre WhatsApp do professor com link de confirmação',u.startswith('https://wa.me/5551984168848') and '#confirmar=' in txt and 'ana@x.com' in txt,txt[:120])
  ok('pagar: sem erros JS',not err,str(err[:2]));await c.close()
  esp=[d for d in os.listdir(RAIZ+'/especial') if d.startswith('luiz')]
  c=await b.new_context(viewport={'width':412,'height':915});pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)))
  await pg.goto('file://'+RAIZ+'/especial/'+esp[0]+'/index.html');await pg.wait_for_timeout(400)
  n=await pg.evaluate("document.querySelectorAll('button[onclick*=musComprovante]').length")
  ok('especial Luiz: um botão de comprovante por parcela',n==2,str(n))
  ok('especial: sem erros JS',not err,str(err[:2]));await c.close()
  await b.close()
asyncio.run(main())
for r in R:print(*r)
print('FALHAS:',sum(1 for r in R if r[0]=='✗'))
