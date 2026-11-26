"""Gera a página de condição especial de UM aluno (cada caso é um caso).
Uso:
  python3 especial.py --nome "Luiz" --plano "Vitalício" \
     --parcela 500,2026-11-24 --parcela 500,2026-12-20 [--obs "texto extra"]
Cria ../especial/<nome>-<código>/index.html com QR Code e Pix Copia e Cola de cada parcela.
Não grava e-mail nem telefone (a página é pública; os dados ficam só na planilha)."""
import json,argparse,base64,io,os,re,secrets,unicodedata,datetime,html
import qrcode
CHAVE='+5551984168848';RECEB='ANDERSON ALVES';CIDADE='SAPUCAIA DO SUL'
def f(i,v):return f'{i}{len(v):02d}{v}'
def crc16(s):
    c=0xFFFF
    for ch in s.encode():
        c^=ch<<8
        for _ in range(8):c=((c<<1)^0x1021)&0xFFFF if c&0x8000 else (c<<1)&0xFFFF
    return f'{c:04X}'
def pix(valor,desc,txid):
    mai=f('00','br.gov.bcb.pix')+f('01',CHAVE)+(f('02',desc[:40]) if desc else '')
    p='000201'+f('26',mai)+'52040000'+'5303986'+f('54',f'{valor:.2f}')+'5802BR'+f('59',RECEB)+f('60',CIDADE)+f('62',f('05',txid))+'6304'
    return p+crc16(p)
def semacento(s):return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn')
def qr_b64(t):
    q=qrcode.QRCode(border=2,box_size=8);q.add_data(t);q.make(fit=True)
    b=io.BytesIO();q.make_image(fill_color='black',back_color='white').save(b,format='PNG');return base64.b64encode(b.getvalue()).decode()
def brl(v):return 'R$ '+f'{v:,.2f}'.replace(',','X').replace('.',',').replace('X','.')
SEM=['segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado','domingo']
def main():
    a=argparse.ArgumentParser();a.add_argument('--nome',required=True);a.add_argument('--plano',default='Vitalício')
    a.add_argument('--parcela',action='append',required=True,help='valor,AAAA-MM-DD');a.add_argument('--obs',default='');a.add_argument('--slug')
    o=a.parse_args()
    nome=re.sub(r'[<>"&]','',o.nome).strip()[:40];plano=re.sub(r'[<>"&]','',o.plano).strip()[:30]
    parc=[]
    for p in o.parcela:
        v,d=p.split(',');parc.append((round(float(v.replace('R$','').strip()),2),datetime.date.fromisoformat(d.strip())))
    n=len(parc);total=sum(v for v,_ in parc)
    slug=o.slug or re.sub(r'[^a-z0-9]+','-',semacento(nome.split()[0].lower()))+'-'+secrets.token_hex(3)
    ini=''.join(w[0] for w in semacento(nome).upper().split()[:2])
    pl=semacento(plano).upper()[:3]
    cod={'vitalicio':'vitalicio','anual':'anual','semestral':'semestral','trimestral':'trimestral','mensal':'mensal'}.get(semacento(plano).lower(),'vitalicio')
    secs=[]
    for i,(v,d) in enumerate(parc,1):
        txid=f'MUS{pl}{ini}{i}'[:25];code=pix(v,f'MUSICALIS {semacento(plano)} {i}/{n}',txid)
        lemb=d-datetime.timedelta(days=2);prox=parc[i][1].isoformat() if i<n else ''
        if i==1:obs='Assim que o pagamento for confirmado, eu libero o seu acesso no app.'
        elif i<n:obs=f'No dia <b>{lemb:%d/%m}</b>, dois dias antes do vencimento, eu te mando um lembrete.'
        else:obs=f'No dia <b>{lemb:%d/%m}</b>, dois dias antes do vencimento, eu te mando um lembrete. Com esta parcela paga, o seu plano <b>{html.escape(plano)}</b> fica completo.'
        secs.append(f'''<section class="parc">
 <div class="tag">{i}ª parcela</div><div class="valor">{brl(v)}</div>
 <div class="venc">Pagar até <b>{d:%d/%m/%Y}</b> • {SEM[d.weekday()]}</div>
 <p class="obs">{obs}</p>
 <img class="qr" src="data:image/png;base64,{qr_b64(code)}" alt="QR Code Pix da {i}ª parcela" width="220" height="220">
 <p class="dica">No app do seu banco: <b>Pix → Pagar com QR Code</b> ou <b>Pix Copia e Cola</b>:</p>
 <textarea readonly id="c{i}" rows="3">{code}</textarea>
 <button class="btn ouro" onclick="copiar({i},this)">Copiar código Pix da {i}ª parcela</button>
 <button class="btn wa" onclick='musComprovante({{k:"parcela",p:"{cod}",prod:"MUSICALIS {html.escape(plano)}",v:"{brl(v)}",i:{i},tot:{n},prox:"{prox}",nome:{json.dumps(nome).replace(chr(39),"&#39;")}}})'>Já paguei: enviar comprovante</button>
</section>''')
    iguais=len({v for v,_ in parc})==1
    resumo=f'{n} parcelas de {brl(parc[0][0])}' if iguais and n>1 else (f'{n} parcelas, total de {brl(total)}' if n>1 else f'pagamento único de {brl(total)}')
    base=open(os.path.join(os.path.dirname(__file__),'..','vitalicio-especial','index.html'),encoding='utf-8').read()
    head=re.search(r'<head>.*?</head>',base,re.S).group()
    head=head.replace('../','../../').replace('MUSICALIS Vitalício • Condição especial',f'MUSICALIS {html.escape(plano)} • {html.escape(nome)}')
    head=re.sub(r'<meta property="og:title"[^>]*>',f'<meta property="og:title" content="🎷 MUSICALIS {html.escape(plano)} • condição especial para {html.escape(nome)}">',head)
    head=re.sub(r'<meta property="og:description"[^>]*>',f'<meta property="og:description" content="{resumo} no Pix • exclusivo para você">',head)
    extra=f'<p class="ajuda">{html.escape(o.obs)}</p>' if o.obs else ''
    ult=f'{n}ª parcela' if n>1 else 'pagamento'
    page=f'''<!doctype html><html lang="pt-BR">{head}<body>
<main>
<div class="logo"><img src="../../icone.png" alt="">MUSI<span>CALIS</span></div>
<h1>🎷 Olá, {html.escape(nome)}! Parabéns pela decisão de ter o <b>MUSICALIS {html.escape(plano)}</b>!</h1>
<p>Você é um aluno especial para mim, e por isso preparei uma <b>condição exclusiva</b>, só sua, que não está disponível no site:</p>
<div class="destaque"><div class="big">✅ Plano {html.escape(plano)} em {resumo} no Pix</div><small>Pagamento direto, sem taxas</small></div>
{''.join(secs)}
{extra}
<p class="aviso">⚠️ <b>Importante:</b> esta condição é especial e vale só com as parcelas em dia. Se uma parcela não for paga até a data, as funções pagas do app ficam pausadas até o pagamento.<br><br>Ao pagar, confira o destinatário: <b>Anderson Alves</b> • chave Pix <b>(51) 98416-8848</b>.</p>
<p class="ajuda">E você também está ajudando o MUSICALIS a crescer: é o único app com exercícios, teoria, partituras, playback e acompanhamento pensados de um jeito diferente de tudo o que existe no mercado musical. Cada aluno que acredita no projeto faz ele ficar ainda melhor. 🙏</p>
<a class="btn alt" target="_blank" rel="noopener" href="https://musicalis-br.github.io/app/">Abrir o app MUSICALIS</a>
<a class="btn wa" target="_blank" rel="noopener" id="duvida" href="#">Tirar uma dúvida no WhatsApp</a>
<footer>Kenny Anderson • MUSICALIS<br>WhatsApp (51) 98416-8848</footer>
</main>
<script src="../../confirma.js"></script>
<script>
const nome={nome!r};const wa=t=>'https://wa.me/5551984168848?text='+encodeURIComponent(t);
document.getElementById('duvida').href=wa('Olá, Kenny! Aqui é '+nome+'. Tenho uma dúvida sobre o MUSICALIS {html.escape(plano)}.');
function copiar(n,b){{const t=document.getElementById('c'+n),ok=()=>{{const o=b.textContent;b.textContent='Código copiado ✓';setTimeout(()=>b.textContent=o,2500)}};
 if(navigator.clipboard)navigator.clipboard.writeText(t.value).then(ok).catch(()=>{{t.select();document.execCommand('copy');ok()}});else{{t.select();document.execCommand('copy');ok()}}}}
</script></body></html>'''
    out=os.path.join(os.path.dirname(__file__),'..','especial',slug);os.makedirs(out,exist_ok=True)
    open(os.path.join(out,'index.html'),'w',encoding='utf-8').write(page)
    print('https://musicalis-br.github.io/especial/'+slug+'/')
    for i,(v,d) in enumerate(parc,1):print(f'  {i}ª parcela {brl(v)} até {d:%d/%m/%Y}')
if __name__=='__main__':main()
