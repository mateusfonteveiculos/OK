// Gera as artes da semana 06 a 11/10/2026 (Fonte Veículos · Oktober + indiretas do Fonte Fest).
// Uso: node gerar.js            → todos os PNGs em ./artes
//      node gerar.js qua-07     → só as peças cujo nome começa com "qua-07"
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DIR = __dirname;
const OUT = path.join(DIR, 'artes');
const TMP = path.join(DIR, '.build');

// Paleta do Fonte Fest (mesma dos carrosséis de outubro) + azul da Fonte
const C = {
  navy: '#0B1020', navy2: '#141C3A', night: '#26305A',
  gold: '#F2B233', red: '#E0312B', blue: '#1250A3', blue2: '#2F5BD3',
  white: '#FFFFFF', light: '#F3F6FC', muted: '#8E97AE', soft: '#C9CFDD',
};

// ---------- desenhos (SVG) ----------

function quad(p0, c, p1, t) {
  const m = 1 - t;
  return [m * m * p0[0] + 2 * m * t * c[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * c[1] + t * t * p1[1]];
}

// Fileira de bandeirinhas num varal curvo. `secret` = índice da bandeirinha com o "29" escondido.
function bandeirinhas({ w, y = 18, sag = 70, n = 11, size = 78, colors = [C.blue2, C.white, C.red, C.gold], secret = -1, cord = C.soft, opacity = 1 }) {
  const x0 = -30, x1 = w + 30;
  const p0 = [x0, y], p1 = [x1, y], c = [(x0 + x1) / 2, y + sag * 2];
  let s = `<g opacity="${opacity}"><path d="M${x0} ${y} Q${c[0]} ${c[1]} ${x1} ${y}" fill="none" stroke="${cord}" stroke-width="4"/>`;
  for (let i = 0; i < n; i++) {
    const a = quad(p0, c, p1, (i + 0.1) / n), b = quad(p0, c, p1, (i + 0.9) / n), m = quad(p0, c, p1, (i + 0.5) / n);
    s += `<polygon points="${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} ${m[0].toFixed(1)},${(m[1] + size * 1.15).toFixed(1)}" fill="${colors[i % colors.length]}"/>`;
    if (i === secret) {
      s += `<text x="${m[0].toFixed(1)}" y="${(m[1] + size * 0.5).toFixed(1)}" text-anchor="middle" font-family="Big Shoulders Display" font-weight="900" font-size="${Math.round(size * 0.4)}" fill="${C.navy}">29</text>`;
    }
  }
  return s + '</g>';
}

// Casario enxaimel (casas de madeira aparente de Blumenau).
function enxaimel({ base, houses, stroke = C.gold, fill = C.navy2, sw = 6, opacity = 1, windows = 'none' }) {
  let s = `<g opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" fill="${fill}">`;
  for (const { x, w, h, roof } of houses) {
    const top = base - h, mid = top + h * 0.46, cols = 4, pw = w / cols;
    s += `<polygon points="${x},${top} ${x + w / 2},${top - roof} ${x + w},${top}"/>`;
    s += `<rect x="${x}" y="${top}" width="${w}" height="${h}"/>`;
    s += `<line x1="${x}" y1="${mid}" x2="${x + w}" y2="${mid}"/>`;
    for (let k = 1; k < cols; k++) s += `<line x1="${x + pw * k}" y1="${top}" x2="${x + pw * k}" y2="${base}"/>`;
    s += `<line x1="${x}" y1="${base}" x2="${x + pw}" y2="${mid}"/><line x1="${x + w}" y1="${base}" x2="${x + w - pw}" y2="${mid}"/>`;
    s += `<line x1="${x}" y1="${mid}" x2="${x + pw}" y2="${top}"/><line x1="${x + w}" y1="${mid}" x2="${x + w - pw}" y2="${top}"/>`;
    for (const k of [1, 2]) {
      const wx = x + pw * k + pw * 0.22, wy = top + (mid - top) * 0.22, ww = pw * 0.56, wh = (mid - top) * 0.56;
      s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${windows === 'none' ? fill : windows}"/>`;
      s += `<line x1="${wx + ww / 2}" y1="${wy}" x2="${wx + ww / 2}" y2="${wy + wh}"/>`;
    }
    s += `<rect x="${x + pw * 1.5}" y="${mid + (base - mid) * 0.3}" width="${pw}" height="${(base - mid) * 0.7}"/>`;
    s += `<circle cx="${x + w / 2}" cy="${top - roof * 0.38}" r="${Math.min(roof * 0.16, pw * 0.3)}" fill="${windows === 'none' ? fill : windows}"/>`;
  }
  return s + '</g>';
}

function casario(w, base, scale = 1) {
  const spec = [[230, 170, 120], [190, 220, 130], [250, 150, 110], [200, 205, 125], [240, 165, 115], [210, 195, 120]];
  const out = [];
  for (let x = -10, i = 0; x < w; i++) {
    const [ww, h, roof] = spec[i % spec.length];
    out.push({ x, w: ww * scale, h: h * scale, roof: roof * scale });
    x += (ww - 30) * scale;
  }
  return out;
}

// Coroa do logo Fonte Fest (mesmo desenho do logo aprovado).
function coroa(width, color = C.gold) {
  return `<svg width="${width}" height="${(width * 100) / 180}" viewBox="0 0 180 100" aria-hidden="true"><path d="M10 82 L16 22 L52 56 L90 6 L128 56 L164 22 L170 82 Z" fill="${color}"/><rect x="10" y="88" width="160" height="10" fill="${color}"/><circle cx="16" cy="16" r="8" fill="${color}"/><circle cx="90" cy="8" r="9" fill="${color}"/><circle cx="164" cy="16" r="8" fill="${color}"/></svg>`;
}

// Selo misterioso: coroa + 29.10, sem nome do evento.
function selo({ scale = 1, crown = C.gold, text = C.gold, row = false } = {}) {
  return `<div class="selo ${row ? 'row' : ''}" style="--s:${scale}">${coroa(row ? 74 * scale : 96 * scale, crown)}<span style="color:${text}">29.10</span></div>`;
}

// Silhuetas de carro (viewBox 0 0 860 320)
const CARROS = {
  suv: { wheels: [200, 640], body: 'M40 255 L40 190 Q42 162 96 156 L230 146 Q282 70 372 66 L700 66 Q752 70 770 140 L780 190 L780 255 Z', win: ['M252 146 Q292 84 372 80 L470 80 L470 146 Z', 'M488 80 L600 80 L600 146 L488 146 Z', 'M618 80 L694 80 Q734 84 748 140 L618 146 Z'] },
  hatch: { wheels: [210, 590], body: 'M60 255 L60 200 Q64 176 118 168 L262 154 Q318 96 410 90 L600 90 Q672 94 700 150 L716 200 L716 255 Z', win: ['M282 156 Q326 108 410 104 L470 104 L470 156 Z', 'M488 104 L596 104 Q648 108 670 156 L488 156 Z'] },
  sedan: { wheels: [210, 660], body: 'M40 255 L40 205 Q44 178 100 170 L250 156 Q300 100 390 92 L540 92 Q610 96 668 152 L780 166 Q824 174 826 208 L826 255 Z', win: ['M270 158 Q310 112 390 106 L452 106 L452 158 Z', 'M470 106 L540 106 Q594 110 638 156 L470 156 Z'] },
  picape: { wheels: [200, 690], body: 'M40 255 L40 192 Q42 168 96 162 L220 150 Q272 84 350 80 L470 80 Q500 84 506 140 L510 168 L826 168 L826 255 Z', win: ['M242 150 Q284 96 350 94 L410 94 L410 150 Z', 'M426 94 L470 94 Q488 98 492 150 L426 150 Z'], extra: '<line x1="512" y1="172" x2="512" y2="250" stroke="#0B1020" stroke-width="7"/>' },
};

function carro(tipo, width, { body = C.gold, bg = C.navy } = {}) {
  const k = CARROS[tipo];
  let s = `<svg width="${width}" height="${(width * 320) / 860}" viewBox="0 0 860 320" aria-hidden="true">`;
  s += `<ellipse cx="430" cy="312" rx="400" ry="10" fill="rgba(0,0,0,.28)"/>`;
  s += `<path d="${k.body}" fill="${body}"/>`;
  for (const p of k.win) s += `<path d="${p}" fill="${bg}" opacity=".88"/>`;
  s += k.extra || '';
  for (const cx of k.wheels) {
    s += `<circle cx="${cx}" cy="258" r="72" fill="${bg}"/><circle cx="${cx}" cy="258" r="52" fill="${bg}" stroke="${body}" stroke-width="14"/><circle cx="${cx}" cy="258" r="15" fill="${body}"/>`;
  }
  return s + '</svg>';
}

// Carro coberto com pano xadrez azul e branco (losangos)
function carroCoberto(width) {
  let wave = '';
  for (let x = 860, i = 0; x > 40; x -= 70, i++) {
    const nx = Math.max(40, x - 70);
    wave += ` Q${x - 35} ${i % 2 ? 392 : 372} ${nx} 380`;
  }
  const d = `M40 380 C38 318 70 282 150 266 C220 254 262 246 302 220 C362 152 432 132 522 134 C622 136 692 162 742 220 C802 236 852 258 860 312 C866 340 864 362 860 380${wave} Z`;
  return `<svg width="${width}" height="${(width * 420) / 900}" viewBox="0 0 900 420" aria-hidden="true">
<defs>
<pattern id="raute" width="72" height="42" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)"><rect width="72" height="42" fill="#FFFFFF"/><polygon points="36,0 72,21 36,42 0,21" fill="${C.blue2}"/></pattern>
<linearGradient id="sombra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1020" stop-opacity="0"/><stop offset="1" stop-color="#0B1020" stop-opacity=".45"/></linearGradient>
</defs>
<ellipse cx="450" cy="392" rx="440" ry="24" fill="rgba(0,0,0,.45)"/>
<path d="${d}" fill="url(#raute)"/>
<path d="${d}" fill="url(#sombra)"/>
<g fill="none" stroke="#0B1020" stroke-opacity=".28" stroke-width="6" stroke-linecap="round">
<path d="M302 222 C322 284 300 336 284 382"/><path d="M522 136 C540 232 520 302 540 384"/><path d="M742 222 C730 284 752 334 736 384"/><path d="M150 268 C170 310 160 350 170 384"/>
</g>
<path d="${d}" fill="none" stroke="#0B1020" stroke-opacity=".5" stroke-width="4"/>
</svg>`;
}

// Calendário de outubro/2026 com 29, 30, 31 e 01/11 circulados
function calendario() {
  const dias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const cells = [];
  for (let i = 0; i < 4; i++) cells.push('<div></div>'); // 01/10/2026 é quinta
  for (let d = 1; d <= 31; d++) cells.push(`<div class="${d >= 29 ? 'mark' : ''}">${d}</div>`);
  cells.push('<div class="mark nov">1<small>NOV</small></div>');
  return `<div class="cal"><div class="cal-h">OUTUBRO 2026</div><div class="cal-g">${dias.map((d) => `<div class="wd">${d}</div>`).join('')}${cells.join('')}</div></div>`;
}

function seta(color = C.gold) {
  return `<svg width="70" height="90" viewBox="0 0 70 90" aria-hidden="true"><path d="M35 6 L35 78 M10 54 L35 80 L60 54" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ---------- molduras ----------

const LOGO = 'assets/logo-fonte.png';

function doc(w, h, body) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="assets/fonts/fonts.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${C.navy}}
.art{position:relative;width:${w}px;height:${h}px;overflow:hidden;font-family:'Barlow',sans-serif;color:${C.white}}
.dk{background:radial-gradient(ellipse at 50% 34%,#1A2550 0%,${C.navy} 64%)}
.nt{background:radial-gradient(ellipse at 50% 46%,#16204A 0%,#070A16 70%)}
.lt{background:${C.light};color:${C.navy}}
.layer{position:absolute;left:0;top:0}
.col{position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 80px}
.d{font-family:'Big Shoulders Display',sans-serif;font-weight:900;text-transform:uppercase;line-height:.9;text-wrap:balance}
.eb{font-weight:700;font-size:32px;letter-spacing:9px;text-transform:uppercase}
.sub{font-weight:600;font-size:46px;line-height:1.22;color:${C.soft};max-width:860px;text-wrap:balance}
.bar{width:110px;height:8px;background:${C.red}}
.logo{display:block;height:auto}
.logo.w{filter:brightness(0) invert(1)}
.selo{display:flex;flex-direction:column;align-items:center;gap:calc(8px*var(--s))}
.selo.row{flex-direction:row;gap:calc(16px*var(--s))}
.selo span{font-family:'Big Shoulders Display',sans-serif;font-weight:900;font-size:calc(58px*var(--s));letter-spacing:calc(5px*var(--s));line-height:1}
.foot{position:absolute;left:0;right:0;bottom:0;height:140px;padding:0 70px;display:flex;align-items:center;justify-content:space-between;background:${C.navy}}
.foot.lt{background:${C.light}}
.pill{display:inline-block;border-radius:999px;font-weight:800;text-transform:uppercase;letter-spacing:4px}
.card{background:${C.navy};color:${C.white};border-radius:32px;padding:44px 56px 50px;width:900px;display:flex;flex-direction:column;align-items:center;gap:14px}
.cal{background:#fff;border-radius:28px;padding:26px 40px 22px;width:820px;box-shadow:0 18px 40px rgba(11,16,32,.12)}
.cal-h{font-family:'Big Shoulders Display',sans-serif;font-weight:900;font-size:46px;letter-spacing:6px;color:${C.blue};text-align:center;margin-bottom:8px}
.cal-g{display:grid;grid-template-columns:repeat(7,1fr);row-gap:6px}
.cal-g div{height:54px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:36px;color:${C.navy};font-variant-numeric:tabular-nums;position:relative}
.cal-g .wd{height:36px;font-size:24px;color:${C.muted};letter-spacing:2px}
.cal-g .mark{color:${C.red};font-weight:800}
.cal-g .mark::after{content:'';position:absolute;width:76px;height:58px;border:6px solid ${C.red};border-radius:50%;transform:rotate(-8deg)}
.cal-g .nov{flex-direction:column;line-height:.9}
.cal-g .nov small{font-size:15px;letter-spacing:2px}
</style></head><body>${body}</body></html>`;
}

function footer({ light = false, seloOn = true } = {}) {
  return `<div class="foot ${light ? 'lt' : ''}"><img class="logo ${light ? '' : 'w'}" src="${LOGO}" style="width:250px" alt="Fonte Veículos">${
    seloOn ? selo({ scale: 0.9, row: true, crown: light ? C.red : C.gold, text: light ? C.navy : C.gold }) : `<div class="eb" style="font-size:24px;color:${light ? C.muted : C.muted}">DESDE 1988 · GARCIA</div>`
  }</div>`;
}

// Post de feed escuro (1080x1350) com bandeirinhas, casario e rodapé
function feed({ inner, top = 210, secret = 7, casas = 1, night = false, bandOpacity = 1 }) {
  const W = 1080, H = 1350;
  const svg = `<svg class="layer" width="${W}" height="${H}">
${bandeirinhas({ w: W, y: 10, sag: 64, n: 11, size: 80, secret, opacity: bandOpacity })}
${casas ? enxaimel({ base: H - 138, houses: casario(W, H - 138, casas), stroke: night ? C.night : C.gold, fill: night ? '#0E1530' : C.navy2, windows: night ? C.gold : 'none', opacity: night ? 1 : 0.9 }) : ''}
</svg>`;
  return doc(W, H, `<div class="art ${night ? 'nt' : 'dk'}">${svg}<div class="col" style="top:${top}px;gap:28px">${inner}</div>${footer()}</div>`);
}

// Story escuro (1080x1920)
function story({ inner, top = 330, secret = -1, casas = 0.66, bottom = '' }) {
  const W = 1080, H = 1920;
  const svg = `<svg class="layer" width="${W}" height="${H}">
${bandeirinhas({ w: W, y: 0, sag: 80, n: 10, size: 92, secret })}
${casas ? enxaimel({ base: H + 6, houses: casario(W, H, casas), opacity: 0.85 }) : ''}
</svg>`;
  return doc(W, H, `<div class="art dk">${svg}<div class="col" style="top:${top}px;gap:30px">${inner}</div><div class="col" style="top:1390px;gap:22px">${bottom}</div></div>`);
}

function rodapeStory({ seguranca = false, comSelo = false } = {}) {
  return `${comSelo ? selo({ scale: 0.8, row: true }) : ''}
${seguranca ? `<div class="pill" style="background:${C.red};color:#fff;font-size:30px;padding:14px 34px">Se beber, não dirija</div>` : ''}
<img class="logo w" src="${LOGO}" style="width:300px" alt="Fonte Veículos">`;
}

// Story de bom dia claro (1080x1920), no padrão do bom dia da Fonte
function bomDia({ dia, palavra, tamanho = 150, significado, frase, horario = true }) {
  const W = 1080, H = 1920;
  const svg = `<svg class="layer" width="${W}" height="${H}">
${bandeirinhas({ w: W, y: -6, sag: 76, n: 10, size: 88, colors: [C.blue2, C.red, C.gold, C.blue], cord: '#B9C2D6' })}
${enxaimel({ base: H + 6, houses: casario(W, H, 1), stroke: C.blue2, fill: C.light, opacity: 0.16 })}
</svg>`;
  const fim = horario
    ? `<div style="display:flex;flex-direction:column;align-items:center;gap:18px"><div class="eb" style="color:${C.blue2};font-size:30px">Hoje estamos abertos</div><div class="d" style="font-size:118px;font-weight:800;color:${C.navy}">Das 8h às 18h</div></div>`
    : `<div style="display:flex;flex-direction:column;align-items:center;gap:14px"><div style="font-weight:600;font-size:32px;color:#3B4357">+100 opções de veículos no site</div><div class="pill" style="background:${C.blue2};color:#fff;font-family:'Big Shoulders Display';font-size:64px;letter-spacing:1px;text-transform:none;padding:16px 50px 20px">fonteveiculos.com.br</div></div>`;
  return doc(W, H, `<div class="art lt">${svg}
<div class="col" style="top:250px;height:1420px;justify-content:center;gap:32px">
<img class="logo" src="${LOGO}" style="width:400px" alt="Fonte Veículos">
<div class="eb" style="color:${C.blue2};font-size:30px">Guten Morgen · ${dia}</div>
<div class="d" style="font-size:228px;color:${C.navy}">Bom dia</div>
<div class="bar"></div>
<div class="card">
<div class="eb" style="color:${C.gold};font-size:26px">Palavra do dia</div>
<div class="d" style="font-size:${tamanho}px;color:${C.gold};letter-spacing:2px">${palavra}</div>
<div style="font-weight:700;font-size:54px">= ${significado}</div>
<div style="font-weight:500;font-size:36px;line-height:1.3;color:${C.soft};max-width:760px;text-wrap:balance">${frase}</div>
</div>
${fim}
</div></div>`);
}

// Lâmina de carrossel (1080x1350)
function lamina({ inner, top = 200, secret = -1, casas = 0 }) {
  return feed({ inner, top, secret, casas });
}

// ---------- peças da semana ----------

const P = [];
const add = (nome, w, h, html) => P.push({ nome, w, h, html });

// TER 06/10 · véspera da abertura
add('ter-06_1-feed_vespera', 1080, 1350, feed({
  secret: 7,
  inner: `<div class="eb" style="color:${C.gold}">Amanhã começa a festa</div>
<div class="d" style="font-size:200px">Vai pra Oktober?</div>
<div class="bar"></div>
<div class="sub">Vai de app, ônibus ou carona. Teu carro fica guardado e te espera aqui no Garcia.</div>`,
}));
add('ter-06_2-story-noite_enquete', 1080, 1920, story({
  inner: `<div class="eb" style="color:${C.gold}">Amanhã começa a festa</div>
<div class="d" style="font-size:176px">Vai na Oktober esse ano?</div>
<div class="sub" style="font-size:44px">Responde aqui embaixo</div>${seta()}`,
  bottom: rodapeStory({ seguranca: true }),
}));

// QUA 07/10 · abertura da festa, 1º desfile às 19h
add('qua-07_1-story-bomdia_prost', 1080, 1920, bomDia({
  dia: 'quarta, 07.10', palavra: 'Prost!', tamanho: 170, significado: 'Saúde!',
  frase: 'Hoje Blumenau abre a festa. Prost pra cidade mais bonita de outubro!',
}));
add('qua-07_2-feed_abertura', 1080, 1350, feed({
  secret: 3, casas: 0.98,
  inner: `<div class="eb" style="color:${C.gold}">Hoje · 07.10</div>
<div class="d" style="font-size:196px">Boa festa, Blumenau!</div>
<div class="sub">Hoje a cidade abre a Oktober. Primeiro desfile às 19h.</div>
<div style="font-weight:600;font-size:32px;color:${C.muted}">Vá de app, ônibus ou carona. Se beber, não dirija.</div>`,
}));
add('qua-07_3-story-noite_desfile', 1080, 1920, story({
  inner: `<div class="eb" style="color:${C.gold}">Primeiro desfile</div>
<div class="d" style="font-size:230px">Hoje,<br><span style="color:${C.gold}">19h</span></div>
<div class="bar"></div>
<div class="sub">Deixe o carro guardado e vá de ônibus, táxi ou aplicativo. Boa festa!</div>`,
  bottom: rodapeStory({ seguranca: true, comSelo: true }),
}));

// QUI 08/10
add('qui-08_1-story-bomdia_wunderbar', 1080, 1920, bomDia({
  dia: 'quinta, 08.10', palavra: 'Wunderbar', tamanho: 160, significado: 'Maravilhoso!',
  frase: 'Maravilhoso é escolher o próximo carro com calma. Temos +100 opções em estoque.',
}));
add('qui-08_2-carrossel_1-capa', 1080, 1350, lamina({
  secret: 7, casas: 0.62, top: 200,
  inner: `<div class="eb" style="color:${C.gold}">Teste da Oktober</div>
<div class="d" style="font-size:186px">Qual carro é você na Oktober?</div>
<div style="display:flex;gap:26px;align-items:flex-end;margin-top:10px">${carro('suv', 200)}${carro('hatch', 186)}${carro('sedan', 210)}${carro('picape', 210)}</div>
<div class="sub" style="font-size:40px">Arrasta pro lado e marca o amigo que é cada um.</div>`,
}));
const lam = (n, tipo, nome, texto) => add(`qui-08_2-carrossel_${n}-${tipo}`, 1080, 1350, lamina({
  top: 210,
  inner: `<div class="eb" style="color:${C.gold}">Se você é…</div>
<div class="d" style="font-size:230px">${nome}</div>
<div style="margin:18px 0 10px">${carro(tipo, 820)}</div>
<div class="sub" style="color:${C.white}">${texto}</div>`,
}));
lam(2, 'suv', 'O SUV', 'Leva a turma toda pro desfile e ainda sobra lugar pra sogra.');
lam(3, 'hatch', 'O hatch', 'Acha vaga em qualquer cantinho do Garcia. Até em dia de festa.');
lam(4, 'sedan', 'O sedã', 'Elegante igual traje típico em dia de desfile. E com porta-malas pra tudo.');
lam(5, 'picape', 'A picape', 'Leva a decoração, a cuca e o que mais a festa pedir. Cabe tudo na caçamba.');
add('qui-08_2-carrossel_6-final', 1080, 1350, lamina({
  top: 200,
  inner: `<div class="eb" style="color:${C.gold}">E o melhor carro da festa?</div>
<div class="d" style="font-size:170px">Só aparece depois dela.</div>
<div style="margin:26px 0">${selo({ scale: 1.9 })}</div>
<div class="sub">Comenta aqui qual desses é você.</div>`,
}));
add('qui-08_3-story-noite_quiz', 1080, 1920, story({
  inner: `<div class="eb" style="color:${C.gold}">Quiz da Oktober</div>
<div class="d" style="font-size:168px">Como se diz “saúde” em alemão?</div>
<div class="sub" style="font-size:40px">Dica: tava no bom dia de ontem.</div>${seta()}`,
  bottom: rodapeStory({}),
}));

// SEX 09/10
add('sex-09_1-story-bomdia_geheimnis', 1080, 1920, bomDia({
  dia: 'sexta, 09.10', palavra: 'Geheimnis', tamanho: 160, significado: 'Segredo.',
  frase: 'A gente tem um. E ele já tem data marcada: 29.10.',
}));
add('sex-09_2-feed_after', 1080, 1350, feed({
  secret: -1, night: true, casas: 0.62, bandOpacity: 0.5, top: 186,
  inner: `<div class="eb" style="color:${C.soft}">A festa acaba dia 25. E depois?</div>
<div class="d" style="font-size:112px">Depois da Oktober,</div>
<div class="d" style="font-size:212px;color:${C.gold};margin-top:-14px">tem After.</div>
<div class="sub" style="font-size:46px;color:${C.white}">O que tá por vir? Fica de olho.</div>
<div>${selo({ scale: 1.2, row: true })}</div>`,
}));
add('sex-09_3-story-noite_sextou', 1080, 1920, story({
  inner: `<div class="eb" style="color:${C.gold}">Primeiro fim de semana de festa</div>
<div class="d" style="font-size:236px">Sextou na Oktober!</div>
<div class="bar"></div>
<div class="sub">Curte com quem você gosta e volta de app, ônibus ou carona.</div>`,
  bottom: rodapeStory({ seguranca: true, comSelo: true }),
}));

// SÁB 10/10 · desfile às 16h
add('sab-10_1-story-bomdia_samstag', 1080, 1920, bomDia({
  dia: 'sábado, 10.10', palavra: 'Samstag', tamanho: 170, significado: 'Sábado.',
  frase: 'Hoje tem desfile às 16h. Bom sábado, Blumenau!', horario: false,
}));
add('sab-10_2-feed_guarde-a-data', 1080, 1350, doc(1080, 1350, `<div class="art lt">
<svg class="layer" width="1080" height="1350">${bandeirinhas({ w: 1080, y: 8, sag: 60, n: 11, size: 76, colors: [C.blue2, C.red, C.gold, C.blue], cord: '#B9C2D6' })}</svg>
<div class="col" style="top:170px;gap:20px">
<div class="eb" style="color:${C.blue2}">Anota aí</div>
<div class="d" style="font-size:150px;color:${C.navy}">Guarde a data</div>
${calendario()}
<div style="font-weight:700;font-size:42px;color:${C.navy}">Algo grande está chegando ao Garcia.</div>
</div>${footer({ light: true })}</div>`));
add('sab-10_3-story-noite_carro-coberto', 1080, 1920, story({
  top: 320,
  inner: `<div class="eb" style="color:${C.gold}">Só uma espiada</div>
<div class="d" style="font-size:200px">Ninguém viu nada.</div>
<div style="margin:30px 0 10px">${carroCoberto(940)}</div>
<div class="sub">Fica entre nós até o dia 29.</div>`,
  bottom: rodapeStory({ comSelo: true }),
}));

// DOM 11/10
add('dom-11_1-story-bomdia_ueberraschung', 1080, 1920, bomDia({
  dia: 'domingo, 11.10', palavra: 'Überraschung', tamanho: 132, significado: 'Surpresa.',
  frase: 'Fica de olho: faltam 18 dias pra ela.', horario: false,
}));
add('dom-11_2-feed_faltam-18', 1080, 1350, feed({
  secret: 3, casas: 0.78, top: 186,
  inner: `<div class="eb" style="color:${C.gold}">Contagem regressiva</div>
<div style="display:flex;align-items:center;gap:34px">
<div class="d" style="font-size:150px;text-align:right">Faltam</div>
<div class="d" style="font-size:430px;color:${C.gold};line-height:.8">18</div>
<div class="d" style="font-size:150px;text-align:left">dias</div>
</div>
<div class="sub">A Oktober acaba dia 25. Dia 29, a festa é aqui no Garcia.</div>`,
}));
add('dom-11_3-story-noite_caixinha', 1080, 1920, story({
  inner: `<div class="eb" style="color:${C.gold}">Palpite</div>
<div class="d" style="font-size:190px">O que vem aí dia 29?</div>
<div class="sub" style="font-size:42px">Manda teu palpite. Os melhores aparecem aqui amanhã.</div>${seta()}`,
  bottom: rodapeStory({ comSelo: true }),
}));

// ---------- render ----------

(async () => {
  const filtro = process.argv[2] || '';
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  for (const f of ['assets']) {
    const dst = path.join(TMP, f);
    if (!fs.existsSync(dst)) fs.symlinkSync(path.join(DIR, f), dst);
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const lista = P.filter((p) => p.nome.startsWith(filtro));
  for (const p of lista) {
    const html = path.join(TMP, `${p.nome}.html`);
    fs.writeFileSync(html, p.html);
    const page = await browser.newPage({ viewport: { width: p.w, height: p.h } });
    await page.goto('file://' + html);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, `${p.nome}.png`) });
    await page.close();
    console.log('ok', p.nome);
  }
  await browser.close();
  console.log(`${lista.length} artes geradas em ${OUT}`);
})();
