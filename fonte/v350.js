/* ===================== V3.50 • CONTA NO ENDEREÇO ANTIGO =====================
   Quando o e-mail não existe neste aparelho no endereço novo, oferece trazer a conta do endereço antigo
   (aap29.github.io): lá o aluno entra e volta para cá com a conta, as práticas e os selos. */
const END_ANTIGO='https://aap29.github.io/prospectarion/musicalis/app/#levar';
{const a=doLogin;doLogin=async function(){await a();const m=$('#lg-msg');if(m&&/Conta não encontrada/.test(m.textContent)&&!document.getElementById('lg-antigo')){
 m.textContent='Esta conta ainda não está neste endereço.';
 m.insertAdjacentHTML('afterend',`<div id="lg-antigo" class="card" style="border:2px solid #d39b1f;margin:8px 0"><p class="sub" style="margin:0 0 6px">Se você já usava o MUSICALIS antes, a sua conta está no <b>endereço antigo</b>. Toque abaixo, entre com o seu e-mail e senha, e você volta para cá com tudo: conta, práticas e selos.</p>
 <a class="btn gold" style="text-decoration:none;display:flex;justify-content:center" href="${END_ANTIGO}">Trazer minha conta do endereço antigo</a>
 <p class="tiny" style="margin:6px 0 0">Nunca usou o MUSICALIS? Toque em "Criar conta".</p></div>`)}}}
