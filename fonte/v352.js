/* ===================== V3.52 • UMA CONTA EM TODOS OS APARELHOS DO TITULAR =====================
   - O e-mail e a senha ficam salvos na planilha (só o PBKDF2 da senha; a planilha guarda o SHA-256 dele).
   - Em outro aparelho (celular, tablet, PC): "Entrar" com o mesmo e-mail e senha traz a conta e o plano.
   - O plano vale em até 3 aparelhos do titular (controle na planilha v6).
   - A senha só muda pelo "Esqueci minha senha" (código no e-mail). Os outros aparelhos entram com a senha nova.
   - Criador: depois de entrar uma vez com a senha do Criador, o código de recuperação ou o arquivo da chave,
     a chave fica num cofre cifrado com a SUA senha; nos outros aparelhos basta o e-mail e essa senha.
   - Planilha antiga ou sem internet: tudo continua como antes (conta local). */
async function srvConta(acao,d,ms){if(!srvUrl())return {status:'off'};try{const j=await chamarSrv('POST',null,Object.assign({acao},d),ms||20000);return j&&(j.status||j.ok)?j:{status:'off'}}catch(e){return {status:'off'}}}
function contaSubir(e,forcar){const u=ACC.users[e];if(!u||u.role==='owner'||!u.salt||!u.hash)return;if(!forcar&&u.contaSync===u.hash+'|'+(u.lic||''))return;
 srvConta('conta_salvar',{email:e,sal:u.salt,hash:u.hash,nome:u.nome||u.name||'',telefone:u.tel||'',cidade:u.cidade||'',estado:u.uf||'',licenca:u.lic||''}).then(j=>{if(j.status==='criada'||j.status==='ok'){u.contaSync=u.hash+'|'+(u.lic||'');saveAcc()}})}
async function contaAplicarLic(e,lic){const u=ACC.users[e];if(!u||!lic||u.lic===lic)return false;let r=null;try{r=await checkLicense(e,lic)}catch(x){}if(!r||r.expired)return false;
 u.plan=r.plan;u.exp=r.exp;u.lic=lic;u.contaSync=u.hash+'|'+lic;saveAcc();if(ACC.session===e&&typeof S==='object'){S.plan=PLANOS[r.plan]||S.plan;save()}return true}
function contaLocal(e,sal,hash,j){let u=ACC.users[e];if(!u)u=ACC.users[e]={role:'aluno',plan:'gratuito',exp:null,created:hojeISO()};
 u.salt=sal;u.hash=hash;delete u.senhaMudou;if(j.nome&&!u.nome){u.nome=limpaTxt(j.nome,80);u.name=u.nome}if(j.telefone&&!u.tel)u.tel=limpaTxt(j.telefone,20);
 if(j.cidade&&!u.cidade)u.cidade=limpaTxt(j.cidade,60);if(j.estado&&!u.uf)u.uf=limpaTxt(j.estado,2);return u}
/* traz a conta da planilha para este aparelho; devolve ok | senha | bloqueado | nao | off */
async function contaServidor(e,p,sal){if(!sal){const s=await srvConta('conta_sal',{email:e});if(s.status!=='existe')return s.status==='nao'?'nao':'off';sal=s.sal}
 const h=await pbkdf2(p,sal),j=await srvConta('conta_entrar',{email:e,hash:h});if(j.status!=='ok')return j.status;
 contaLocal(e,sal,h,j);rememberPick(e);saveAcc();enterSession(e);await contaAplicarLic(e,j.licenca);if(ACC.session===e)render();
 toast('Pronto! Sua conta MUSICALIS foi trazida para este aparelho 🎷',4500);return 'ok'}
const MSG_CONTA={senha:'Senha incorreta. É a mesma senha dos seus outros aparelhos. Se esqueceu, toque em "Esqueci minha senha".',bloqueado:'Muitas tentativas com senha errada. Espere 1 hora ou toque em "Esqueci minha senha".'};
{const a=doLogin;doLogin=async function(){const e=normEmail(($('#lg-email')||{}).value||''),p=($('#lg-pass')||{}).value||'';
 if(!validEmail(e)||!srvUrl()||await ehCriadorEmail(e))return a();
 const u=ACC.users[e];if(u&&u.salt&&!u.senhaMudou&&await pbkdf2(p,u.salt)===u.hash){await a();if(ACC.session===e)contaSubir(e);return}
 lgMsg('Conferindo sua conta…');const r=await contaServidor(e,p);if(r==='ok')return;if(MSG_CONTA[r]){lgMsg(MSG_CONTA[r]);return}return a()}}
{const a=doSignup;doSignup=async function(){const e=normEmail(($('#lg-email')||{}).value||''),p=($('#lg-pass')||{}).value||'',p2=($('#lg-pass2')||{}).value||'';
 if(!validEmail(e)||!srvUrl()||ACC.users[e]||p.length<6||p!==p2||await ehCriadorEmail(e)){await a();if(ACC.session===e)contaSubir(e);return}
 lgMsg('Conferindo…');const s=await srvConta('conta_sal',{email:e});
 if(s.status==='existe'){const r=await contaServidor(e,p,s.sal);if(r==='ok')return;
  lgMsg(r==='senha'?'Este e-mail já tem conta no MUSICALIS. Use a mesma senha dos seus outros aparelhos ou toque em "Esqueci minha senha".':(MSG_CONTA[r]||'Sem conexão. Tente de novo.'));return}
 await a();if(ACC.session===e)contaSubir(e)}}
/* código de plano ativado em um aparelho vale nos outros */
{const a=aplicarCodigo;aplicarCodigo=async function(code,sil){const r=await a(code,sil);const u=curUser();
 if(r==='ok'&&u&&u.role!=='owner'){const v=limpaCod(code);if(/^MUS-/.test(v)&&!v.startsWith('MUP')){u.lic=v;saveAcc();contaSubir(ACC.session)}}return r}}
/* ao abrir: confere se outro aparelho ativou um plano novo (a cada 6 h) */
let _contaT=0;async function contaSincronizar(){const u=curUser();if(!u||u.role==='owner'||!u.hash||!srvUrl()||Date.now()-_contaT<6*3600e3)return;_contaT=Date.now();
 const j=await srvConta('conta_entrar',{email:ACC.session,hash:u.hash});if(j.status==='nao'){contaSubir(ACC.session,true);return}
 if(j.status==='senha'){u.senhaMudou=true;saveAcc();return}if(j.status!=='ok')return;if(u.senhaMudou){delete u.senhaMudou;saveAcc()}
 if(j.licenca&&j.licenca!==u.lic){if(await contaAplicarLic(ACC.session,j.licenca)){toast('Seu plano foi atualizado: '+(PLANOS[u.plan]||u.plan),4000);render()}}
 else if(u.lic&&!j.licenca)contaSubir(ACC.session,true)}
setTimeout(contaSincronizar,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)contaSincronizar()});

/* ---------- Esqueci minha senha (aluno) ---------- */
let NS={etapa:'email',email:''};
function novaSenha(){shell(`<div class="sub">CONTA</div><h1>Criar uma nova senha</h1>
 <div class="card">${NS.etapa==='email'?`<p class="sub">Digite o e-mail da sua conta. Enviamos um código de 6 números para ele.</p>
 <label>E-mail</label><input class="field" id="ns-email" type="email" autocomplete="username" value="${limpaTxt(NS.email||ACC.lastEmail||'',120)}">
 <button class="btn gold" id="lg-go" onclick="nsPedir()">Enviar código para o meu e-mail</button>`
 :`<p class="sub">Enviamos o código para <b>${limpaTxt(NS.email,120)}</b>. Olhe também a caixa de spam.</p>
 <label>Código</label><input class="field" id="ns-cod" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code">
 <label>Nova senha</label><input class="field" id="ns-p1" type="password" autocomplete="new-password" placeholder="mínimo 6 caracteres">
 <label>Repita a nova senha</label><input class="field" id="ns-p2" type="password" autocomplete="new-password">
 <button class="btn gold" id="lg-go" onclick="nsSalvar()">Salvar nova senha e entrar</button>
 <p class="tiny">Depois, nos outros aparelhos, entre com esta senha nova.</p>`}<p class="sub" id="lg-msg"></p></div>
 <button class="btn alt" onclick="NS={etapa:'email',email:''};page='login';authMode='entrar';render()">Voltar</button>`)}
async function nsPedir(){const e=normEmail($('#ns-email').value);if(!validEmail(e)){lgMsg('Digite um e-mail válido.');return}
 if(await ehCriadorEmail(e)){page='recuperar';render();return}
 lgMsg('Enviando…');const j=await srvConta('senha_codigo',{email:e});
 if(j.status==='enviado'){NS={etapa:'codigo',email:e};render();toast('Código enviado para o seu e-mail',4000)}
 else lgMsg(j.status==='nao'?'Não encontramos conta com esse e-mail. Confira ou toque em "Criar conta".':j.status==='muitos'?'Você já pediu 3 códigos hoje. Tente amanhã ou fale com o professor.':'Sem conexão. Tente de novo.')}
async function nsSalvar(){const c=($('#ns-cod').value||'').replace(/\D/g,''),p=$('#ns-p1').value,p2=$('#ns-p2').value,e=NS.email;
 if(c.length!==6){lgMsg('Digite o código de 6 números.');return}if(p.length<6){lgMsg('A senha precisa ter pelo menos 6 caracteres.');return}if(p!==p2){lgMsg('As senhas não conferem.');return}
 lgMsg('Salvando…');const sal=hex(crypto.getRandomValues(new Uint8Array(16))),h=await pbkdf2(p,sal),j=await srvConta('senha_nova',{email:e,codigo:c,sal,hash:h});
 if(j.status!=='ok'){lgMsg(j.status==='expirado'?'O código expirou. Volte e peça outro.':j.status==='invalido'?'Código incorreto.':'Sem conexão. Tente de novo.');return}
 contaLocal(e,sal,h,j);ACC.lastEmail=e;ACC.remember=true;saveAcc();NS={etapa:'email',email:''};enterSession(e);await contaAplicarLic(e,j.licenca);
 toast('Senha nova salva! Use ela também nos seus outros aparelhos 🎷',5000);render()}
{const a=login;login=function(){a();if(!srvUrl()||$('#lk-nsenha'))return;const r=$('#lk-rec');const html='<p class="tiny" style="text-align:center;margin:6px 0 0"><a id="lk-nsenha" href="#" onclick="NS={etapa:\'email\',email:(document.getElementById(\'lg-email\')||{}).value||\'\'};page=\'novasenha\';render();return false" style="color:inherit;font-weight:700">Esqueci minha senha</a></p>';
 if(r)r.parentNode.insertAdjacentHTML('beforebegin',html);else{const m=$('#lg-msg');m&&m.insertAdjacentHTML('afterend',html)}
 const dica=[...document.querySelectorAll('#app p.tiny')].find(x=>/Primeira vez neste aparelho/.test(x.textContent));if(dica)dica.textContent='Já tem conta em outro aparelho? Toque em "Entrar" com o mesmo e-mail e senha. Primeira vez? Toque em "Criar conta".'}}
{const a=render;render=function(){if(page==='novasenha'){novaSenha();try{nav()}catch(e){}return}return a()}}

/* ---------- Criador: cofre com a sua senha, para entrar em qualquer aparelho ---------- */
let _jwkUlt=null;
const b64e=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
abrirCofre=async function(cf,senha){try{const base=await crypto.subtle.importKey('raw',enc.encode(senha),'PBKDF2',false,['deriveKey']);
 const ak=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64d(cf.s),iterations:cf.n,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
 const ob=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(cf.i)},ak,b64d(cf.c)))),jwk=ob.jwk||ob;if(ob.tok){ACC.cfg.srvToken=ob.tok;saveAcc()}
 const k=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);if(!await chaveConfere(k))return null;_jwkUlt={jwk,tok:ob.tok||ACC.cfg.srvToken||''};return k}catch(x){return null}};
async function fazerCofre(jwk,tok,senha){const s=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),n=600000;
 const base=await crypto.subtle.importKey('raw',enc.encode(senha),'PBKDF2',false,['deriveKey']);const ak=await crypto.subtle.deriveKey({name:'PBKDF2',salt:s,iterations:n,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt']);
 const c=await crypto.subtle.encrypt({name:'AES-GCM',iv:i},ak,enc.encode(JSON.stringify({jwk,tok})));return JSON.stringify({s:b64e(s),i:b64e(i),c:b64e(c),n})}
async function cofreSubir(e,senha){const J=_jwkUlt;_jwkUlt=null;const tok=(J&&J.tok)||ACC.cfg.srvToken;if(!J||!tok||!srvUrl()||!senha)return;
 try{const cf=await fazerCofre(J.jwk,tok,senha);const j=await srvConta('cofre_salvar',{email:e,token:tok,cofre:cf},30000);
  if(j.status==='ok'){ACC.cfg.cofreNuvem=hojeISO();saveAcc();toast('Pronto: nos seus outros aparelhos, entre com este e-mail e esta senha.',5000)}}catch(x){}}
/* entrar como Criador: cofre do app, chave deste aparelho ou cofre com a sua senha (na planilha) */
entrarCriador=async function(e,p){const b=$('#lg-go');if(b){b.disabled=true;b.textContent='Verificando…'}lgMsg('Verificando o acesso de Criador…');
 _jwkUlt=null;let k=await abrirCofre(COFRE.senha,p.trim()),via='senha';
 if(!k){const u=ACC.users[e];let v=null;try{v=await kGet()}catch(x){}const temChave=v&&v.k&&(v.emails||[v.email]).includes(e);if(u&&temChave&&await pbkdf2(p,u.salt)===u.hash){k=v.k;via='aparelho'}}
 if(!k&&srvUrl()){lgMsg('Conferindo o seu cofre…');const j=await srvConta('cofre_obter',{email:e});if(j.cofre){try{k=await abrirCofre(JSON.parse(j.cofre),p);if(k)via='nuvem'}catch(x){}}}
 if(!k){lgMsg('Senha não confere neste aparelho. Use a senha do Criador, o código de recuperação ("Esqueci a senha do Criador") ou o arquivo da chave.');return}
 await ativarCriador(k,e);await contaCriador(e,p);rememberPick(e);saveAcc();toast('Bem-vindo, Criador! Acesso total liberado');enterSession(e);
 if(via==='senha')cofreSubir(e,p);else _jwkUlt=null}
{const a=fazerRecuperacao;fazerRecuperacao=async function(){const e=normEmail(($('#rc-email')||{}).value||''),p=($('#rc-pass')||{}).value||'';_jwkUlt=null;await a();if(ACC.session===e&&isOwner())cofreSubir(e,p);else _jwkUlt=null}}
/* chave instalada pelo arquivo: guarda o cofre com a senha deste aparelho (pede a senha uma vez) */
{const a=importarChave;importarChave=async function(inp){const f=inp.files&&inp.files[0];let jwk=null;try{const j=JSON.parse(await f.text());jwk=Object.assign({},j.jwk||j);delete jwk.key_ops;delete jwk.ext}catch(x){}
 await a(inp);if(jwk&&isOwner()&&srvUrl()&&ACC.cfg.srvToken){_jwkUlt={jwk,tok:ACC.cfg.srvToken};CRI_PEDE=true;render()}}}
let CRI_PEDE=false;
async function criSalvarNuvem(){const p=($('#cri-p')||{}).value||'',u=curUser();if(!u||await pbkdf2(p,u.salt)!==u.hash){toast('Senha incorreta');return}CRI_PEDE=false;await cofreSubir(ACC.session,p);render()}
{const a=render;render=function(){a();if(CRI_PEDE&&isOwner()&&!$('#cri-nuvem')){const c=document.querySelector('#app .card');c&&c.insertAdjacentHTML('beforebegin',`<div class="card" id="cri-nuvem" style="border:2px solid #d39b1f"><h3>🔐 Usar o MUSICALIS nos seus outros aparelhos</h3><p class="sub">Digite a sua senha deste app. A chave fica guardada cifrada com ela; nos outros aparelhos basta entrar com o seu e-mail e essa senha.</p><input class="field" id="cri-p" type="password" autocomplete="current-password"><button class="btn gold" onclick="criSalvarNuvem()">Guardar</button></div>`)}}}
