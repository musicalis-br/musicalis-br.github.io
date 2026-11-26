import asyncio,os
from playwright.async_api import async_playwright
from protecao import proteger
F='file://'+os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','app','index.html'))
R=[];ok=lambda n,c,i='':R.append(('✓' if c else '✗',n,i))
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();proteger(b)
  for vw,nome in [((412,915),'empe'),((889,400),'deitado')]:
   c=await b.new_context(viewport={'width':vw[0],'height':vw[1]});pg=await c.new_page();err=[];pg.on('pageerror',lambda x:err.append(str(x)))
   await pg.goto(F);await pg.wait_for_timeout(500)
   await pg.evaluate("authMode='criar';page='login';render()")
   for sel,v in [('#lg-nome','Bruno Teste'),('#lg-tel','51911112222'),('#lg-cid','Canoas'),('#lg-pass2','abcdef'),('#lg-email','bruno@x.com'),('#lg-pass','abcdef')]:
     if await pg.query_selector(sel):await pg.fill(sel,v)
   if await pg.query_selector('#lg-uf'):await pg.select_option('#lg-uf','RS')
   await pg.click('#lg-go');await pg.wait_for_timeout(1000)
   await pg.evaluate("S.theory=80;S.modAnunciado=undefined;page='home';save();document.querySelectorAll('.volta-fundo').forEach(e=>e.remove())")
   info=await pg.evaluate("({meta:avMeta(),total:interEx().length,prova:AV_PROVA_EX.length,lib:avLiberado()})")
   ok(f'{nome}: metade = {info["meta"]} de {info["total"]}, prova com {info["prova"]}',info['meta']==-(-info['total']//2) and info['prova']==5 and not info['lib'],str(info))
   # teste de nível mandando para o Avançado não abre
   tr=await pg.evaluate("S.nivelRecIdx=8;save();const a1=modules().find(m=>m.name==='Avançado A1');modUnlocked(a1)")
   ok(f'{nome}: teste de nível não abre o Avançado',tr is False)
   ok(f'{nome}: Jazz fechado',await pg.evaluate("jazzVisivel()") is False)
   await pg.evaluate("openEx(EXS.find(e=>/^Avançado/.test(e.lv)).id)");await pg.wait_for_timeout(200)
   t=await pg.evaluate("(document.getElementById('av-modal')||{}).innerText||''")
   ok(f'{nome}: abrir exercício do Avançado mostra a explicação',('ainda não abriu' in t) and ('64' in t or str(info['meta']) in t),t[:80])
   await pg.evaluate("document.getElementById('av-modal')?.remove();NIVEL_EST='Intermediário';go('study')");await pg.wait_for_timeout(300)
   t=await pg.evaluate("(document.getElementById('av-caminho')||{}).innerText||''")
   ok(f'{nome}: cartão Caminho para o Avançado no estudo',f'0 de {info["meta"]}' in t,t[:60])
   await pg.screenshot(path=f'/home/claude/qa349_caminho_{nome}.png')
   # prova prática
   await pg.evaluate("go('provaav')");await pg.wait_for_timeout(200)
   ok(f'{nome}: tela da prova lista 5 exercícios',await pg.evaluate("document.querySelectorAll('#app .card button.btn.gold').length")>=5)
   await pg.evaluate("AV_PROVA_EX.forEach((id,i)=>{AV_PROVA_ATIVA=id;curEx=id;ouvPainel({precisao:[70,65,55,80,45][i],total:10,ok:6,erros:{acidente:0,oitava:0,nota:1,silencio:0},itens:[]})});document.getElementById('ouv-res')?.remove()")
   ok(f'{nome}: prova aprovada libera o Avançado',await pg.evaluate("!!avProva().aprovado&&avLiberado()&&modUnlocked(modules().find(m=>m.name==='Avançado A1'))"))
   await pg.evaluate("AV_PROVA_ATIVA=null;go('provaav')");await pg.screenshot(path=f'/home/claude/qa349_prova_{nome}.png')
   # reprovado: outra conta lógica
   ok(f'{nome}: nota baixa reprova',await pg.evaluate("(()=>{const g=S.provaAv;S.provaAv={ex:{}};AV_PROVA_EX.forEach((id,i)=>S.provaAv.ex[id]=[90,90,90,90,30][i]);const r=avProvaOk();S.provaAv=g;return r===false})()"))
   # 64 exercícios liberam
   ok(f'{nome}: {info["meta"]} exercícios do Intermediário liberam',await pg.evaluate(f"(()=>{{S.provaAv={{ex:{{}}}};S.progress=S.progress||{{}};interEx().slice(0,{info['meta']}).forEach(e=>S.progress[e.id]='concluido');return avLiberado()&&modUnlocked(modules().find(m=>m.name==='Avançado A1'))}})()"))
   ok(f'{nome}: {info["meta"]-1} não liberam',await pg.evaluate(f"(()=>{{const e=interEx()[0];S.progress[e.id]='nao';return !avLiberado()}})()"))
   # novo módulo
   await pg.evaluate("document.querySelectorAll('.volta-fundo').forEach(e=>e.remove());S.modAnunciado='Básico B0';save();go('study')");await pg.wait_for_timeout(600)
   t=await pg.evaluate("(document.getElementById('mod-modal')||{}).innerText||''")
   ok(f'{nome}: explicação ao entrar em novo módulo',('Novo módulo' in t) and ('Teoria' in t),t[:70])
   await pg.screenshot(path=f'/home/claude/qa349_modulo_{nome}.png')
   await pg.evaluate("document.getElementById('mod-modal')?.remove();toast('Libere o módulo pela prática')");await pg.wait_for_timeout(100)
   ok(f'{nome}: módulo trancado explica o motivo',await pg.evaluate("/ainda não abriu/.test((document.getElementById('mod-modal')||{}).innerText||'')"))
   ok(f'{nome}: sem erros JS',not err,str(err[:2]));await c.close()
  await b.close()
asyncio.run(main())
for r in R:print(*r)
print('FALHAS:',sum(1 for r in R if r[0]=='✗'))
