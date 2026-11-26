/* ===================== V3.51 • CONFIRMAÇÃO DE PAGAMENTO PELO PROFESSOR =====================
   O aluno envia o comprovante pelo WhatsApp com um link #confirmar=… (confirma.js, nas páginas de pagamento).
   Só na conta do Criador o link abre a tela "Confirmar pagamento": ele confere o comprovante e, num toque,
   o app gera o acesso certo (plano, parcelado até a próxima parcela ou o plano completo) e a mensagem pronta. */
const PLANO_NOME={mensal:'Mensal',trimestral:'Trimestral',semestral:'Semestral',anual:'Anual',vitalicio:'Vitalício',escola:'Professor/Escola'};
let CONF=null,CONF_RES=null;
function confLer(){try{const t=sessionStorage.getItem('mus_conf');if(!t)return null;const j=JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g,'+').replace(/_/g,'/')))));
 const ok=['plano','parcela','ebook'].includes(j.k);if(!ok)return null;
 return {k:j.k,p:PLANO_NOME[j.p]?j.p:'',prod:limpaTxt(j.prod,80),v:limpaTxt(j.v,20),i:Math.max(1,Math.min(24,+j.i||1)),tot:Math.max(1,Math.min(24,+j.tot||1)),
  prox:/^\d{4}-\d{2}-\d{2}$/.test(j.prox||'')?j.prox:'',n:limpaTxt(j.n,80),e:normEmail(limpaTxt(j.e,120)),t:String(j.t||'').replace(/\D/g,'').slice(0,13),dt:/^\d{4}-\d{2}-\d{2}$/.test(j.dt||'')?j.dt:''}}catch(e){return null}}
(function(){const h=location.hash;if(h.indexOf('#confirmar=')===0){try{sessionStorage.setItem('mus_conf',h.slice(11))}catch(e){}history.replaceState(null,'',location.pathname+location.search)}})();
const confDono=()=>!!ACC.session&&(isOwner()||(typeof jzCriador==='function'&&jzCriador()));
function confWa(t,msg){const n=t?(t.length<=11?'55'+t:t):'';return 'https://wa.me/'+n+'?text='+encodeURIComponent(msg)}
function confirmar(){const d=CONF;if(!d){go('painel');return}
 const linha=(a,b)=>`<tr><td class="tiny" style="padding:4px 8px 4px 0;vertical-align:top">${a}</td><td><b>${b}</b></td></tr>`;
 const acesso=d.k==='ebook'?'Nenhum (é um e-book: envie o PDF)':d.k==='plano'?`Plano ${PLANO_NOME[d.p]||d.p}`:(d.prox&&d.i<d.tot?`Parcelado, liberado até ${brData(d.prox)} (próxima parcela)`:`${PLANO_NOME[d.p]||'Vitalício'} completo (última parcela)`);
 let res='';if(CONF_RES){res=`<div class="card" style="border:2px solid ${CONF_RES.ok?'#1f9d55':'#d39b1f'}"><h3>${CONF_RES.ok?'✅ Pagamento confirmado':'❌ Marcado como não recebido'}</h3>
  <textarea id="conf-msg" rows="9" style="width:100%;box-sizing:border-box;border-radius:10px;padding:10px;font-size:15px;font-family:inherit">${CONF_RES.msg}</textarea>
  <a class="btn" style="text-decoration:none;display:flex;justify-content:center;background:#25d366;color:#fff" target="_blank" rel="noopener" href="${confWa(d.t,CONF_RES.msg)}">Enviar para ${primeiroNome(d.n)||'o aluno'} no WhatsApp</a>
  <button class="btn alt" onclick="copyTxt(document.getElementById('conf-msg').value)">Copiar mensagem</button>
  <button class="btn alt" onclick="CONF=null;CONF_RES=null;try{sessionStorage.removeItem('mus_conf')}catch(e){}go('painel')">Concluir</button></div>`}
 document.getElementById('app').innerHTML=`<div class="wrap"><div class="top"></div><h1>💰 Confirmar pagamento</h1>
 <div class="card"><table style="border-collapse:collapse;width:100%">${linha('Aluno',d.n)}${linha('E-mail do app',d.e)}${linha('WhatsApp',d.t||'—')}${linha('Produto',d.prod)}${linha('Valor',d.v+(d.tot>1?` • ${d.i}ª de ${d.tot} parcelas`:''))}${linha('Informado em',brData(d.dt))}${linha('Acesso que será gerado',acesso)}</table></div>
 ${CONF_RES?'':`<div class="card" style="border:2px solid #d39b1f"><p class="sub" style="margin:0">Antes de confirmar, abra o comprovante no WhatsApp e confira: <b>valor ${d.v}</b>, destinatário <b>Anderson Alves</b> (chave (51) 98416-8848) e a data. Só confirme se o dinheiro entrou.</p></div>
 <button class="btn gold" onclick="confOk()">✅ Confirmar e gerar acesso</button><button class="btn alt" onclick="confNao()">❌ Não recebi esse pagamento</button>`}
 ${res}</div>`}
async function confOk(){const d=CONF,pn=primeiroNome(d.n)||'';let code=null,msg;
 try{if(d.k==='plano')code=await makeLicense(d.e,d.p);else if(d.k==='parcela')code=(d.prox&&d.i<d.tot)?await makeLicense(d.e,'parcelado',0,d.prox):await makeLicense(d.e,d.p||'vitalicio')}
 catch(x){toast(x.message||'Não consegui gerar o código');go('chave');return}
 const plano=PLANO_NOME[d.p]||'Vitalício',link=code?linkAtiv(code):'';
 if(d.k==='ebook')msg=`Pagamento confirmado, ${pn}! 🎷 Obrigado pela compra do ${d.prod}.\n\nSegue o seu PDF logo abaixo. Bons estudos!\n\nKenny Anderson • MUSICALIS`;
 else if(d.k==='parcela'&&d.prox&&d.i<d.tot)msg=`Pagamento confirmado, ${pn}! 🎷 Recebi a ${d.i}ª parcela (${d.v}).\n\nSeu MUSICALIS está liberado até ${brData(d.prox)}, data da próxima parcela.\n\n1) Toque no link abaixo\n2) Entre com o e-mail ${d.e} (ou crie a conta com esse e-mail)\n3) Pronto: o acesso é ativado\n\n${link}\n\nKenny Anderson • MUSICALIS`;
 else msg=`Pagamento confirmado, ${pn}! 🎷 ${d.k==='parcela'?'Recebi a última parcela: seu MUSICALIS '+plano+' está completo! 🎉':'Seu MUSICALIS '+plano+' está liberado.'}\n\n1) Toque no link abaixo\n2) Entre com o e-mail ${d.e} (ou crie a conta com esse e-mail)\n3) Pronto: o plano é ativado\n\n${link}\n\nKenny Anderson • MUSICALIS`;
 ACC.cfg.sales=ACC.cfg.sales||[];if(code)ACC.cfg.sales.push({email:d.e,plan:d.k==='parcela'&&d.prox&&d.i<d.tot?'parcelado':d.p,code,ate:d.prox||'',date:new Date().toLocaleDateString('pt-BR')});
 ACC.cfg.confirmados=(ACC.cfg.confirmados||[]).concat([{q:new Date().toISOString().slice(0,10),n:d.n,e:d.e,prod:d.prod,v:d.v,par:d.tot>1?d.i+'/'+d.tot:'',st:'confirmado'}]).slice(-60);saveAcc();
 CONF_RES={ok:true,msg};confirmar()}
function confNao(){const d=CONF,pn=primeiroNome(d.n)||'';
 const msg=`Olá, ${pn}! Ainda não localizei o seu Pix de ${d.v}. Pode conferir no app do banco se ele foi concluído e me mandar o comprovante de novo? Assim que aparecer, eu libero na hora. 🎷\n\nKenny Anderson • MUSICALIS`;
 ACC.cfg.confirmados=(ACC.cfg.confirmados||[]).concat([{q:new Date().toISOString().slice(0,10),n:d.n,e:d.e,prod:d.prod,v:d.v,par:d.tot>1?d.i+'/'+d.tot:'',st:'não recebido'}]).slice(-60);saveAcc();
 CONF_RES={ok:false,msg};confirmar()}
function cardConfirmados(){const L=(ACC.cfg.confirmados||[]).slice().reverse().slice(0,15);
 return `<div class="card" id="card-confirmados"><h3>💰 Pagamentos avaliados</h3><p class="sub" style="margin:0 0 8px">Quando um aluno envia o comprovante, a mensagem dele traz um link. Toque nele aqui no seu aparelho para conferir e confirmar.</p>
 ${L.length?`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><th align="left">Data</th><th align="left">Aluno</th><th align="left">Produto</th><th align="left">Valor</th><th align="left">Situação</th></tr>${L.map(x=>`<tr><td>${brData(x.q)}</td><td>${limpaTxt(x.n,40)}</td><td>${limpaTxt(x.prod,40)}${x.par?' • '+x.par:''}</td><td>${limpaTxt(x.v,20)}</td><td>${x.st==='confirmado'?'✅':'❌'} ${x.st}</td></tr>`).join('')}</table></div>`:'<p class="tiny">Nenhum pagamento avaliado ainda.</p>'}</div>`}
{const a=render;render=function(){
 if(ACC.session&&!CONF&&sessionStorage.getItem('mus_conf')){if(confDono()){CONF=confLer();CONF_RES=null;if(CONF)page='confirmar';else{try{sessionStorage.removeItem('mus_conf')}catch(e){}}}
}
 if(ACC.session&&page==='confirmar'&&confDono()){confirmar();try{nav()}catch(e){}return}
 a();if(page==='painel'&&isOwner()&&!document.getElementById('card-confirmados')){const c=document.getElementById('card-aparelhos')||document.getElementById('card-especial')||document.querySelector('#app .card');c&&c.insertAdjacentHTML('afterend',cardConfirmados())}}}
/* criador por e-mail confirma depois que a verificação assíncrona termina */
function confChecar(){if(!ACC.session||CONF||!sessionStorage.getItem('mus_conf'))return;if(confDono()){render();return}try{sessionStorage.removeItem('mus_conf')}catch(e){}toast('Este link é só para o professor.')}
setTimeout(confChecar,1800);
