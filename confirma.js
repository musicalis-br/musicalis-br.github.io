/* MUSICALIS • comprovante com confirmação do professor
   O aluno informa nome, e-mail do app e WhatsApp; a mensagem leva um link que só o Criador consegue usar
   (o app gera o acesso apenas na conta do Criador, com a chave dele). */
(function(){
var APP='https://musicalis-br.github.io/app/',WA='5551984168848';
function b64u(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k)||'';localStorage.setItem(k,v)}catch(e){return ''}}
var inp='display:block;width:100%;box-sizing:border-box;margin:4px 0 10px;padding:12px;border-radius:10px;border:1px solid #3a5a86;background:#0b1626;color:#fff;font-size:16px';
var btn='display:block;width:100%;box-sizing:border-box;margin:6px 0;padding:14px;border-radius:12px;border:0;font-size:16px;font-weight:800;cursor:pointer';
window.musComprovante=function(d){
 var q=new URLSearchParams(location.search),old=document.getElementById('mc-modal');if(old)old.remove();
 document.body.insertAdjacentHTML('beforeend','<div id="mc-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px"><div style="background:#0f2240;border:2px solid #f0b33a;border-radius:16px;padding:18px;max-width:420px;width:100%;max-height:92vh;overflow:auto;color:#fff;font-family:inherit;text-align:left">'
 +'<b style="font-size:19px">📎 Enviar comprovante</b><p style="margin:6px 0 12px;color:#c9d6e8;font-size:15px;line-height:1.4">'+esc(d.prod)+' • <b>'+esc(d.v)+'</b>'+(d.tot>1?' • '+d.i+'ª de '+d.tot+' parcelas':'')+'<br>Preencha para o professor confirmar o pagamento e liberar o acesso no seu e-mail.</p>'
 +'<label style="font-size:14px">Seu nome<input id="mc-n" autocomplete="name" style="'+inp+'"></label>'
 +'<label style="font-size:14px">E-mail que você usa no app<input id="mc-e" type="email" autocomplete="email" style="'+inp+'"></label>'
 +'<label style="font-size:14px">Seu WhatsApp (com DDD)<input id="mc-t" inputmode="tel" autocomplete="tel" style="'+inp+'"></label>'
 +'<p id="mc-err" style="color:#ff9b9b;min-height:18px;margin:0 0 6px;font-size:14px"></p>'
 +'<button id="mc-ok" style="'+btn+';background:#25d366;color:#fff">Abrir o WhatsApp e enviar</button>'
 +'<button id="mc-x" style="'+btn+';background:transparent;color:#c9d6e8;border:1px solid #3a5a86">Cancelar</button></div></div>');
 var $=function(i){return document.getElementById(i)};
 $('mc-n').value=d.nome||ls('mus_cmp_n');$('mc-e').value=q.get('e')||ls('mus_cmp_e');$('mc-t').value=ls('mus_cmp_t');
 $('mc-x').onclick=function(){$('mc-modal').remove()};
 $('mc-ok').onclick=function(){var n=$('mc-n').value.trim().slice(0,80),e=$('mc-e').value.trim().toLowerCase().slice(0,120),t=$('mc-t').value.replace(/\D/g,'').slice(0,13);
  if(n.length<2){$('mc-err').textContent='Digite o seu nome.';return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)){$('mc-err').textContent='Digite o e-mail que você usa no app.';return}
  if(t.length<10){$('mc-err').textContent='Digite o WhatsApp com DDD.';return}
  ls('mus_cmp_n',n);ls('mus_cmp_e',e);ls('mus_cmp_t',t);
  var tok=b64u(JSON.stringify({k:d.k,p:d.p||'',prod:d.prod,v:d.v,i:d.i||1,tot:d.tot||1,prox:d.prox||'',n:n,e:e,t:t,dt:new Date().toISOString().slice(0,10)}));
  var msg='Olá, Kenny! Paguei '+d.prod+' ('+d.v+')'+(d.tot>1?' • '+d.i+'ª de '+d.tot+' parcelas':'')+'.\nNome: '+n+'\nE-mail do app: '+e+'\nWhatsApp: '+t+'\nSegue o comprovante 👇\n\n(Professor, para confirmar: '+APP+'#confirmar='+tok+')';
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(msg),'_blank');$('mc-modal').remove()};
};})();
