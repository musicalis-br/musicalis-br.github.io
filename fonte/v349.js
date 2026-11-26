/* ===================== V3.49 • AVANÇADO SÓ COM BASE + EXPLICAÇÃO A CADA MÓDULO =====================
   Regra do professor (25/11/2026), vale para todos os alunos e para o Jazz:
   - o Avançado (e o Jazz) abre quando o aluno conclui METADE dos exercícios do Intermediário (64 de 128)
   - ou quando passa na PROVA PRÁTICA do Avançado: toca 5 exercícios-chave do Intermediário com o Ouvido ligado
     (só prática, sem teoria; não precisa ser perfeito: média de 60% e nenhum abaixo de 40%)
   - o app explica o porquê, mostra o caminho e, a cada novo módulo, explica o que vem e por que a base importa */
const AV_PROVA_EX=(()=>{const pick=['Intermediário I5','Intermediário I6','Intermediário I7','Intermediário I8','Intermediário I10'];
 return pick.map(lv=>{const l=EXS.filter(e=>!e.custom&&e.lv===lv);return l.length?l[Math.floor(l.length/2)].id:null}).filter(Boolean)})();
const AV_MEDIA=60,AV_MIN=40;
const interEx=()=>EXS.filter(e=>!e.custom&&/^Intermediário/.test(e.lv||''));
const avMeta=()=>Math.ceil(interEx().length/2);
const avFeitos=()=>interEx().filter(e=>exStatus(e.id)==='concluido').length;
function avProva(){S.provaAv=S.provaAv||{ex:{}};return S.provaAv}
function avProvaOk(){const P=avProva(),v=AV_PROVA_EX.map(id=>P.ex[id]);if(v.some(x=>x==null))return false;const m=v.reduce((s,x)=>s+x,0)/v.length;return m>=AV_MEDIA&&Math.min(...v)>=AV_MIN}
function avLiberado(){if(!ACC.session)return false;if(isOwner()||(typeof jzCriador==='function'&&jzCriador()))return true;return avFeitos()>=avMeta()||!!avProva().aprovado}
const ehAvancado=m=>!!m&&/^Avançado/.test(m.name||m);
let AV_PROVA_ATIVA=null;
/* trava do Avançado: por fora de tudo (inclusive do teste de nível) */
{const a=modUnlocked;modUnlocked=function(m){if(ehAvancado(m)){if(!avLiberado())return false;const av=modules().filter(k=>ehAvancado(k));if(av.length&&av[0].name===m.name)return true}return a(m)}}
{const a=canAccess;canAccess=function(id){if(AV_PROVA_ATIVA&&id===AV_PROVA_ATIVA)return _planAccess(id);return a(id)}}
{const a=jazzVisivel;jazzVisivel=function(){return a()&&avLiberado()}}
/* ---------- explicação ---------- */
function avTextoPorque(){return `<p class="sub" style="margin:6px 0">No MUSICALIS cada etapa prepara a próxima. O Avançado traz semicolcheias, tercinas, tonalidades com muitos acidentes, registro agudo e jazz. Sem a base do Intermediário, qualquer pessoa trava nesses estudos, mesmo com o app ajudando, e a sensação é de que não consegue evoluir.</p>
 <p class="sub" style="margin:6px 0">Por isso o Avançado abre quando você <b>conclui metade do Intermediário</b> (${avMeta()} exercícios) ou quando passa na <b>prova prática</b>, tocando 5 exercícios-chave com o Ouvido ligado. Não precisa ser perfeito: o app quer ver que a sua técnica já está pronta.</p>`}
function cardCaminhoAv(){if(avLiberado())return '';const f=avFeitos(),mt=avMeta(),pc=Math.min(100,Math.round(f/mt*100)),P=avProva(),feitas=AV_PROVA_EX.filter(id=>P.ex[id]!=null).length;
 return `<div class="card" id="av-caminho" style="border:2px solid #d39b1f"><h3>🔒 Caminho para o Avançado</h3>${avTextoPorque()}
 <div class="progress" style="margin:8px 0"><i style="width:${pc}%"></i></div><p class="tiny" style="margin:0 0 6px"><b>${f} de ${mt}</b> exercícios do Intermediário concluídos${f<mt?` • faltam ${mt-f}`:''}</p>
 <button class="btn gold" onclick="go('provaav')">🎤 Prova prática do Avançado${feitas?` (${feitas}/${AV_PROVA_EX.length})`:''}</button></div>`}
function abrirExplicacaoAv(){document.getElementById('av-modal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="volta-fundo" id="av-modal"><div class="card volta-card"><h2 style="margin:0 0 6px">🔒 O Avançado ainda não abriu</h2>${avTextoPorque()}
 <p class="tiny" style="margin:6px 0"><b>${avFeitos()} de ${avMeta()}</b> exercícios do Intermediário concluídos.</p>
 <button class="btn gold" onclick="document.getElementById('av-modal').remove();go('provaav')">🎤 Fazer a prova prática</button><button class="btn alt" onclick="document.getElementById('av-modal').remove();go('study')">Continuar o Intermediário</button></div></div>`)}
{const a=openEx;openEx=function(id){const ex=EXS.find(e=>e.id===id);if(ex&&/^Avançado/.test(ex.lv||'')&&!avLiberado()&&id!==AV_PROVA_ATIVA){abrirExplicacaoAv();return}return a(id)}}
/* ---------- prova prática ---------- */
function provaav(){const P=avProva(),ok=avProvaOk();
 const linhas=AV_PROVA_EX.map((id,i)=>{const e=EXS.find(x=>x.id===id)||{},v=P.ex[id];return `<div class="card" style="margin:8px 0"><div class="row" style="align-items:center;gap:8px"><div style="flex:1"><b>${i+1}. ${e.t||id}</b><br><span class="tiny">${e.lv||''}</span></div>
  <div style="text-align:right">${v==null?'<span class="tiny">não tocado</span>':`<b style="color:${v>=AV_MEDIA?'#1f9d55':v>=AV_MIN?'#d39b1f':'#d62828'}">${v}%</b>`}</div></div>
  <button class="btn ${v==null?'gold':'alt'}" onclick="avTocar('${id}')">${v==null?'🎤 Tocar com o Ouvido':'🎤 Tocar de novo'}</button></div>`}).join('');
 const vs=AV_PROVA_EX.map(id=>P.ex[id]).filter(x=>x!=null),media=vs.length?Math.round(vs.reduce((s,x)=>s+x,0)/vs.length):null;
 document.getElementById('app').innerHTML=`<div class="wrap"><div class="top"></div><h1>🎤 Prova prática do Avançado</h1>
 <div class="card"><p class="sub" style="margin:0">Toque os ${AV_PROVA_EX.length} exercícios abaixo com o <b>Ouvido</b> ligado: toque ▶ Tocar e acompanhe a partitura. O app escuta e avalia as notas e a sua técnica. Para passar: média de <b>${AV_MEDIA}%</b> e nenhum exercício abaixo de <b>${AV_MIN}%</b>. Pode repetir quantas vezes quiser; vale a sua melhor vez.</p>
 ${media!=null?`<p style="margin:8px 0 0"><b>Sua média: ${media}%</b> • ${vs.length} de ${AV_PROVA_EX.length} tocados</p>`:''}</div>
 ${P.aprovado||ok?`<div class="card" style="border:2px solid #1f9d55"><h3>🏆 Aprovado! O Avançado está liberado.</h3><p class="sub">Você mostrou a técnica que o Avançado pede. Bons estudos!</p><button class="btn gold" onclick="NIVEL_EST='Avançado';go('study')">Ir para o Avançado</button></div>`:''}
 ${linhas}<button class="btn alt" onclick="go('study')">Voltar aos estudos</button></div>`}
async function avTocar(id){const ok=await ouvPermissao();if(!ok){toast('Permita o microfone para fazer a prova');return}OUV.manualOn=true;AV_PROVA_ATIVA=id;openEx(id);toast('Ouvido ligado: toque ▶ Tocar e acompanhe 🎷',4000)}
{const a=ouvPainel;ouvPainel=function(R){a(R);if(AV_PROVA_ATIVA&&curEx===AV_PROVA_ATIVA){const P=avProva(),id=AV_PROVA_ATIVA;P.ex[id]=Math.max(P.ex[id]||0,R.precisao);
  if(!P.aprovado&&avProvaOk()){P.aprovado=new Date().toISOString().slice(0,10);try{registrar('prova_avancado',{aprovado:true,notas:P.ex})}catch(e){}toast('🏆 Prova aprovada! O Avançado está liberado.',5000)}
  else try{registrar('prova_avancado',{id,precisao:R.precisao})}catch(e){}
  save();const box=document.getElementById('ouv-res');box&&box.insertAdjacentHTML('beforeend',`<button class="btn gold" style="margin:6px 0 0" onclick="document.getElementById('ouv-res').remove();AV_PROVA_ATIVA=null;go('provaav')">Voltar para a prova</button>`)}}}
/* ---------- explicação a cada novo módulo ---------- */
function modalModulo(m){const T=TEORIA[m.name]||{},ms=modules(),i=ms.findIndex(k=>k.name===m.name),ant=i>0?ms[i-1]:null;
 document.getElementById('mod-modal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="volta-fundo" id="mod-modal"><div class="card volta-card"><div class="volta-sax">🎯</div>
 <h2 style="margin:4px 0 8px">Novo módulo: ${m.name}</h2>${T.titulo?`<p style="margin:0 0 8px"><b>${T.titulo}</b></p>`:''}
 <p class="sub" style="margin:6px 0">${ant?`Parabéns, você evoluiu! Tudo o que você praticou no <b>${ant.name}</b> é a base deste módulo.`:'Seja bem-vindo ao primeiro módulo: aqui começa a sua base.'} Cada passo prepara o próximo: é assim que a música fica fácil.</p>
 <p class="sub" style="margin:6px 0">Se aparecer algo que você ainda não sabe, <b>pare e leia a Teoria</b> deste módulo${ant?' ou volte a um exercício do módulo anterior':''}. Voltar um passo não é regredir: é o que faz você tocar com segurança.</p>
 ${T.titulo?`<button class="btn alt" onclick="document.getElementById('mod-modal').remove();TMOD='${m.name}';go('licao')">📖 Ler a teoria do módulo</button>`:''}
 <button class="btn gold" onclick="document.getElementById('mod-modal').remove()">Começar o módulo</button></div></div>`)}
function checarNovoModulo(){if(!ACC.session||isOwner()||!S||S.theory==null||document.querySelector('.volta-fundo'))return;let m;try{m=moduloAtual()}catch(e){return}if(!m)return;
 if(S.modAnunciado===undefined){S.modAnunciado=m.name;save();return}
 if(S.modAnunciado!==m.name&&modUnlocked(m)){S.modAnunciado=m.name;save();modalModulo(m)}}
/* módulo trancado: explicação em vez do aviso curto */
{const a=toast;toast=function(msg,t){if(msg==='Libere o módulo pela prática'){document.body.insertAdjacentHTML('beforeend',`<div class="volta-fundo" id="mod-modal"><div class="card volta-card"><h2 style="margin:0 0 8px">🔒 Este módulo ainda não abriu</h2><p class="sub">Cada módulo abre quando você chega a <b>${PASS}%</b> de prática no módulo anterior. Assim você só encontra o que já tem base para tocar, e evolui com segurança.</p><button class="btn gold" onclick="document.getElementById('mod-modal').remove()">Entendi</button></div></div>`);return}return a(msg,t)}}
/* ---------- telas ---------- */
{const a=render;render=function(){if(ACC.session&&page==='provaav'){provaav();try{nav()}catch(e){}return}a();if(!ACC.session)return;
 if(page==='study'&&(NIVEL_EST==='Intermediário'||NIVEL_EST==='Avançado')&&!document.getElementById('av-caminho')){const h=cardCaminhoAv();if(h)inserirTopo(h)}
 if(page==='result'&&!avLiberado()&&S.diag&&/Avançado/.test(S.diag.rec||'')&&!document.getElementById('av-caminho')){const h=cardCaminhoAv();if(h)inserirTopo(h)}
 if(['study','home','journey'].includes(page))setTimeout(checarNovoModulo,300)}}
