/* ===================== V3.47 • INSTALAÇÃO SEMPRE COM O ÍCONE OFICIAL =====================
   - mostra o ícone certo (o "M" oficial) no cartão e na tela de instalar
   - avisa quando o app foi aberto por dentro do Instagram, Facebook, WhatsApp ou outro navegador
     (ali o "adicionar à tela inicial" cria um atalho com outra imagem) e oferece "Abrir no Chrome"
   - explica o que fazer se aparecer na tela inicial um ícone diferente do M */
const UA_I=navigator.userAgent||'';
const NAV_INTERNO=/Instagram|FBAN|FBAV|FB_IAB|WhatsApp|Line\/|TikTok|musical_ly|Snapchat|; wv\)/i.test(UA_I);
const NAV_OUTRO=ANDROID&&!NAV_INTERNO&&/SamsungBrowser|MiuiBrowser|OPR\/|Firefox\/|EdgA\/|UCBrowser|HuaweiBrowser|YaBrowser/i.test(UA_I);
const NAV_IOS_OUTRO=IOS&&/CriOS|FxiOS|EdgiOS|GSA\//i.test(UA_I);
const CHROME_INTENT='intent://musicalis-br.github.io/app/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fmusicalis-br.github.io%2Fapp%2F;end';
function iconeCerto(){return `<div style="display:flex;gap:12px;align-items:center;margin:8px 0"><img src="icone-192.png" alt="Ícone oficial do MUSICALIS" width="56" height="56" style="border-radius:14px;flex:none"><p class="sub" style="margin:0">Este é o <b>ícone certo</b> do MUSICALIS. Se aparecer na sua tela inicial outra imagem (uma foto, uma letra ou uma bolinha), segure esse ícone, escolha <b>Remover</b> e instale de novo por aqui.</p></div>`}
function avisoNavegador(){
 if(NAV_INTERNO&&ANDROID)return `<div class="card" style="border:2px solid #d39b1f"><h3>⚠️ Abra no Google Chrome para instalar</h3><p class="sub">Você abriu o MUSICALIS por dentro de outro aplicativo (Instagram, Facebook ou WhatsApp). Instalando daqui, a tela inicial fica com o ícone errado.</p><a class="btn gold" style="text-decoration:none;display:flex;justify-content:center" href="${CHROME_INTENT}">Abrir no Chrome</a><button class="btn alt" onclick="copyTxt('${APP_URL}')">Copiar endereço</button></div>`;
 if(NAV_INTERNO&&IOS)return `<div class="card" style="border:2px solid #d39b1f"><h3>⚠️ Abra no Safari para instalar</h3><p class="sub">Você abriu o MUSICALIS por dentro de outro aplicativo. Toque em <b>⋯</b> ou no ícone de bússola e escolha <b>Abrir no Safari</b>, ou copie o endereço e cole no Safari.</p><button class="btn alt" onclick="copyTxt('${APP_URL}')">Copiar endereço</button></div>`;
 if(NAV_OUTRO)return `<div class="card" style="border:2px solid #d39b1f"><h3>Use o Google Chrome para instalar</h3><p class="sub">Neste navegador o ícone pode não sair certo. No Chrome a instalação é garantida, com o ícone oficial.</p><a class="btn gold" style="text-decoration:none;display:flex;justify-content:center" href="${CHROME_INTENT}">Abrir no Chrome</a></div>`;
 if(NAV_IOS_OUTRO)return `<div class="card" style="border:2px solid #d39b1f"><h3>Use o Safari para instalar</h3><p class="sub">No iPhone e no iPad, a instalação com o ícone certo é pelo Safari. Copie o endereço e cole no Safari.</p><button class="btn alt" onclick="copyTxt('${APP_URL}')">Copiar endereço</button></div>`;
 return ''}
{const a=cardInstalar;cardInstalar=function(sempre){const h=a(sempre);if(!h)return h;
 return h.replace('</p><button',`</p>${iconeCerto()}${avisoNavegador()?'<p class="sub" style="color:#ffd35a;margin:6px 0">Antes de instalar, veja o aviso abaixo.</p>':''}<button`).replace(/<\/div>$/,`</div>${avisoNavegador()}`)}}
{const a=instalar;instalar=function(){a();const h=document.querySelector('#app h1');if(h&&!document.getElementById('inst-icone')){h.insertAdjacentHTML('afterend',`<div class="card" id="inst-icone">${iconeCerto()}</div>${avisoNavegador()}`)}}}
