'use strict';
/* Asentamiento — lógica del juego (v0.2) */
const N = 48;

const DEF = {
  chatarrero: { nombre: 'Chatarrero', tipo: 'u', hp: 45, vel: 2.6, dano: 4, cad: 1, alc: .9, vista: 6, coste: { d: 50 }, t: 9, tecla: 'Q', desc: 'Recoge chatarra con su carrito y levanta chabolas.' },
  echadora: { nombre: 'Echadora de la buenaventura', tipo: 'u', hp: 35, vel: 2.5, dano: 0, vista: 5, coste: { d: 60 }, t: 10, tecla: 'E', desc: 'Va a la plaza, lee el porvenir y vuelve con dinero. La policía no se mete con ella.' },
  navajero: { nombre: 'Navajero', tipo: 'u', hp: 90, vel: 2.9, dano: 10, cad: .8, alc: .9, vista: 6, coste: { d: 60, c: 20 }, t: 11, tecla: 'N', desc: 'Defiende el asentamiento cuerpo a cuerpo.' },
  policia: { nombre: 'Policía local', tipo: 'u', hp: 55, vel: 2.5, dano: 6, cad: .9, alc: .9, vista: 6, desc: 'Viene a desalojar, porra en mano.' },
  inspector: { nombre: 'Inspector de Urbanismo', tipo: 'u', hp: 40, vel: 2.2, dano: 6, cad: 1.6, alc: 4.5, vista: 7, proy: true, desc: 'Lanza multas a distancia. Duelen.' },
  principal: { nombre: 'Casa del Patriarca', tipo: 'e', tam: 3, hp: 700, pop: 6, vista: 8, produce: ['chatarrero', 'echadora'], desc: 'El corazón del asentamiento. Aquí se descarga la chatarra y el dinero.' },
  chabola: { nombre: 'Chabola', tipo: 'e', tam: 2, hp: 180, vista: 4, coste: { c: 50 }, t: 12, tecla: 'C', desc: 'Da sitio para más gente.' },
  taberna: { nombre: 'Taberna El Pincho', tipo: 'e', tam: 2, hp: 300, vista: 4, coste: { c: 90, d: 30 }, t: 16, tecla: 'T', produce: ['navajero'], desc: 'Entre caña y caña, aquí se curten los navajeros.' },
  ayuntamiento: { nombre: 'Ayuntamiento', tipo: 'e', tam: 4, hp: 1100, vista: 8, desc: 'De aquí salen las patrullas. Derríbalo para ganar.' },
  bloque: { nombre: 'Bloque de pisos', tipo: 'd', tam: 2, hp: 1 },
  monton: { nombre: 'Montón de chatarra', tipo: 'r', tam: 1, hp: 1, desc: 'Manda aquí a los chatarreros con el botón derecho.' },
  plaza: { nombre: 'Plaza de la fuente', tipo: 'p', tam: 2, hp: 1, desc: 'Llena de turistas. Manda aquí a las echadoras para ganar dinero.' }
};
const NIVEL = [
  { nombre: 'cartón', pop: 4, hp: 180 },
  { nombre: 'uralita', pop: 6, hp: 280, coste: { c: 60 }, t: 8 },
  { nombre: 'ladrillo', pop: 8, hp: 420, coste: { c: 100, d: 40 }, t: 10 }
];
const DIF = {
  facil: { primera: 180, intervalo: 100, base: 1, crece: 220, guardias: 2, insp: 3 },
  normal: { primera: 120, intervalo: 80, base: 2, crece: 150, guardias: 3, insp: 2 },
  dificil: { primera: 70, intervalo: 55, base: 3, crece: 85, guardias: 5, insp: 1 }
};
const POP_TOPE = 40, CARGA_CHATARRA = 5, CARGA_DINERO = 25;

let G = null;
const cv = document.getElementById('lienzo'), cx = cv.getContext('2d');
const mm = document.getElementById('minimapa'), mx = mm.getContext('2d');
const elPanel = document.getElementById('panel'), elInfo = document.getElementById('info'), elOrd = document.getElementById('ordenes');
let W = 0, H = 0, DPR = 1, Z = 1, difElegida = 'normal';
const raton = { x: 0, y: 0, dentro: false };
const teclas = {};

/* ---------- Sonido ---------- */
let AC = null, sonidoSi = true;
function tono(f1, f2, dur, tipo, vol, espera) {
  if (!AC || !sonidoSi) return;
  try {
    const t0 = AC.currentTime + (espera || 0), o = AC.createOscillator(), g = AC.createGain();
    o.type = tipo || 'square'; o.frequency.setValueAtTime(f1, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol || .06, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + dur + .02);
  } catch (e) { }
}
const ultSon = {};
function son(n) {
  const ahora = performance.now();
  if (ultSon[n] && ahora - ultSon[n] < 70) return;
  ultSon[n] = ahora;
  switch (n) {
    case 'sel': tono(660, 0, .06, 'square', .04); break;
    case 'orden': tono(440, 330, .09, 'triangle', .08); break;
    case 'error': tono(160, 110, .18, 'sawtooth', .06); break;
    case 'moneda': tono(988, 0, .07, 'square', .05); tono(1319, 0, .14, 'square', .05, .07); break;
    case 'chatarra': tono(220, 90, .09, 'square', .05); tono(140, 70, .08, 'square', .04, .05); break;
    case 'golpe': tono(180, 60, .07, 'sawtooth', .05); break;
    case 'listo': tono(523, 0, .09, 'triangle', .08); tono(659, 0, .09, 'triangle', .08, .09); tono(784, 0, .16, 'triangle', .08, .18); break;
    case 'alerta': tono(740, 0, .14, 'square', .06); tono(554, 0, .14, 'square', .06, .16); tono(740, 0, .14, 'square', .06, .32); break;
    case 'cae': tono(200, 40, .5, 'sawtooth', .08); break;
    case 'victoria': [523, 659, 784, 1047].forEach(function (f, i) { tono(f, 0, .22, 'triangle', .09, i * .16); }); break;
    case 'derrota': [392, 330, 262, 196].forEach(function (f, i) { tono(f, 0, .3, 'triangle', .09, i * .22); }); break;
  }
}

/* ---------- Utilidades ---------- */
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ent(id) { return G.porId.get(id); }
function centro(e) { const t = e.d.tam; return t ? { x: e.x + t / 2, y: e.y + t / 2 } : { x: e.x, y: e.y }; }
function distE(u, e) {
  const t = e.d.tam;
  if (!t) return Math.hypot(e.x - u.x, e.y - u.y);
  const dx = Math.max(e.x - u.x, 0, u.x - (e.x + t)), dy = Math.max(e.y - u.y, 0, u.y - (e.y + t));
  return Math.hypot(dx, dy);
}
function libre(x, y) { return x >= 0 && y >= 0 && x < N && y < N && !G.bloq[y * N + x]; }
function bloquear(e, v) { const t = e.d.tam; for (let j = 0; j < t; j++) for (let i = 0; i < t; i++) G.bloq[(e.y + j) * N + e.x + i] = v; }
function mirar(u, e) { const c = centro(e), s = (c.x - u.x) - (c.y - u.y); if (Math.abs(s) > .05) u.dir = s > 0 ? 1 : -1; }
function enPantalla(x, y) { return { x: (x - y) * 32 - G.cam.x, y: (x + y) * 16 - G.cam.y }; }
function mundo(sx, sy) { const a = (sx + G.cam.x) / 32, b = (sy + G.cam.y) / 16; return { x: (a + b) / 2, y: (b - a) / 2 }; }
function visible(e) { const c = centro(e), i = Math.floor(c.y) * N + Math.floor(c.x); return G.vis[i] === 1; }
function explorado(e) { const c = centro(e), i = Math.floor(c.y) * N + Math.floor(c.x); return G.expl[i] === 1; }
function seVe(e) { if (e.eq === 0) return true; return e.d.tam ? explorado(e) : visible(e); }
function textoCoste(c) { const p = []; if (c.d) p.push(c.d + ' dinero'); if (c.c) p.push(c.c + ' chatarra'); return p.join(' · '); }

function aviso(txt, mal) {
  const caja = document.getElementById('avisos');
  if (caja.lastChild && caja.lastChild.textContent === txt) return;
  const d = document.createElement('div'); d.textContent = txt; if (mal) d.className = 'mal';
  caja.appendChild(d);
  while (caja.children.length > 3) caja.removeChild(caja.firstChild);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 4200);
}

/* ---------- Rutas (A*) ---------- */
const AS = { g: new Float32Array(N * N), f: new Float32Array(N * N), pad: new Int32Array(N * N), est: new Uint32Array(N * N), cer: new Uint32Array(N * N), sello: 0 };
function ruta(sx, sy, gx, gy) {
  if (!libre(gx, gy)) return null;
  const s = sy * N + sx, m = gy * N + gx;
  if (s === m) return [];
  const sello = ++AS.sello, heap = [];
  function sube(i) { heap.push(i); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (AS.f[heap[p]] <= AS.f[heap[k]]) break; const t = heap[p]; heap[p] = heap[k]; heap[k] = t; k = p; } }
  function baja() {
    const top = heap[0], ult = heap.pop();
    if (heap.length) {
      heap[0] = ult; let k = 0;
      for (; ;) { const a = 2 * k + 1, b = a + 1; let mn = k; if (a < heap.length && AS.f[heap[a]] < AS.f[heap[mn]]) mn = a; if (b < heap.length && AS.f[heap[b]] < AS.f[heap[mn]]) mn = b; if (mn === k) break; const t = heap[mn]; heap[mn] = heap[k]; heap[k] = t; k = mn; }
    }
    return top;
  }
  AS.g[s] = 0; AS.f[s] = 0; AS.est[s] = sello; sube(s);
  let hallado = false;
  while (heap.length) {
    const i = baja();
    if (AS.cer[i] === sello) continue;
    AS.cer[i] = sello;
    if (i === m) { hallado = true; break; }
    const x = i % N, y = (i / N) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (!libre(nx, ny)) continue;
      if (dx && dy && (!libre(x + dx, y) || !libre(x, y + dy))) continue;
      const j = ny * N + nx;
      if (AS.cer[j] === sello) continue;
      const ng = AS.g[i] + (dx && dy ? 1.4142 : 1);
      if (AS.est[j] !== sello || ng < AS.g[j]) {
        AS.est[j] = sello; AS.g[j] = ng; AS.pad[j] = i;
        const ax = Math.abs(nx - gx), ay = Math.abs(ny - gy);
        AS.f[j] = ng + Math.max(ax, ay) + .4142 * Math.min(ax, ay);
        sube(j);
      }
    }
  }
  if (!hallado) return null;
  const r = [];
  for (let i = m; i !== s; i = AS.pad[i]) r.push([i % N + .5, ((i / N) | 0) + .5]);
  return r.reverse();
}
function celdaCerca(tx, ty, u) {
  for (let r = 1; r < 8; r++) {
    let mejor = null, md = 1e9;
    for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
      if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r || !libre(x, y)) continue;
      const d = Math.hypot(x + .5 - u.x, y + .5 - u.y);
      if (d < md) { md = d; mejor = [x, y]; }
    }
    if (mejor) return mejor;
  }
  return null;
}
function anillo(e) {
  const t = e.d.tam, r = [];
  for (let y = e.y - 1; y <= e.y + t; y++) for (let x = e.x - 1; x <= e.x + t; x++) {
    if (x >= e.x && x < e.x + t && y >= e.y && y < e.y + t) continue;
    if (libre(x, y)) r.push([x, y]);
  }
  return r;
}
function irA(u, x, y) {
  x = Math.max(.3, Math.min(N - .3, x)); y = Math.max(.3, Math.min(N - .3, y));
  let tx = Math.floor(x), ty = Math.floor(y), exacto = true;
  if (!libre(tx, ty)) { const c = celdaCerca(tx, ty, u); if (!c) { u.ruta = null; return false; } tx = c[0]; ty = c[1]; exacto = false; }
  const r = ruta(Math.floor(u.x), Math.floor(u.y), tx, ty);
  if (!r) { u.ruta = null; return false; }
  if (exacto) { if (r.length) r[r.length - 1] = [x, y]; else r.push([x, y]); }
  u.ruta = r; return true;
}
function irAEnt(u, e) {
  const cs = anillo(e);
  cs.sort(function (a, b) { return Math.hypot(a[0] + .5 - u.x, a[1] + .5 - u.y) - Math.hypot(b[0] + .5 - u.x, b[1] + .5 - u.y); });
  for (let i = 0; i < Math.min(cs.length, 4); i++) {
    const r = ruta(Math.floor(u.x), Math.floor(u.y), cs[i][0], cs[i][1]);
    if (r) { if (!r.length) r.push([cs[i][0] + .5, cs[i][1] + .5]); u.ruta = r; return true; }
  }
  u.ruta = null; return false;
}
function avanzar(u, dt) {
  if (!u.ruta || !u.ruta.length) return true;
  let paso = u.d.vel * dt;
  u.anda = true;
  while (paso > 0 && u.ruta.length) {
    const p = u.ruta[0], dx = p[0] - u.x, dy = p[1] - u.y, d = Math.hypot(dx, dy);
    const s = dx - dy; if (Math.abs(s) > .02) u.dir = s > 0 ? 1 : -1;
    if (d <= paso) { u.x = p[0]; u.y = p[1]; u.ruta.shift(); paso -= d; }
    else { u.x += dx / d * paso; u.y += dy / d * paso; paso = 0; }
  }
  return !u.ruta.length;
}

/* ---------- Partida ---------- */
function crear(k, x, y, eq, extra) {
  const d = DEF[k];
  const e = Object.assign({ id: G.id++, k: k, eq: eq, x: x, y: y, hp: d.hp, hpMax: d.hp, d: d }, extra || {});
  if (d.tipo === 'u') { e.orden = { t: 'idle' }; e.ruta = null; e.cd = 0; e.dir = eq === 1 ? -1 : 1; e.carga = 0; e.pensar = Math.random() * .3; e.golpeT = 0; }
  if (d.tam) { bloquear(e, 1); e.cola = []; if (e.obra === undefined) e.obra = 1; }
  G.ents.push(e); G.porId.set(e.id, e);
  return e;
}
function nuevaPartida(dif) {
  G = {
    dif: DIF[dif], t: 0, ents: [], porId: new Map(), id: 1, dinero: 150, chatarra: 60, sel: [], cam: { x: 0, y: 0 },
    tiles: new Uint8Array(N * N), bloq: new Uint8Array(N * N), expl: new Uint8Array(N * N), vis: new Uint8Array(N * N),
    fx: [], fin: null, modo: null, ia: { t: DIF[dif].primera, ola: 0, tg: 0, tr: 0 }, grupos: {}, alertaT: 0, visT: 0, uiT: 0, firma: '', arrastre: null
  };
  const rnd = mulberry(7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const h = Math.sin(x * .31 + 1.3) * Math.cos(y * .27) + Math.sin((x + y) * .13 + 2);
    let tp = h > 1.35 ? 1 : 0;
    if (x >= 30 && y <= 17) tp = (x === 30 || y === 17) ? 3 : 2;
    if (x >= 22 && x <= 27 && y >= 22 && y <= 27) tp = 3;
    if (x >= 36 && x <= 43 && y >= 3 && y <= 10) tp = 3;
    G.tiles[y * N + x] = tp;
  }
  for (let bx = 32; bx <= 44; bx += 3) for (let by = 1; by <= 13; by += 3) {
    if (bx <= 43 && bx + 1 >= 36 && by <= 10 && by + 1 >= 3) continue;
    crear('bloque', bx, by, 2, { alto: 34 + Math.floor(rnd() * 3) * 13, tono: Math.floor(rnd() * 4) });
  }
  crear('ayuntamiento', 38, 5, 1);
  crear('plaza', 24, 24, 2);
  [[15, 34, 300], [16, 37, 300], [14, 41, 300], [5, 31, 400], [19, 43, 400], [20, 31, 500], [16, 22, 500], [33, 33, 500], [39, 26, 500], [9, 14, 500], [26, 12, 400], [44, 40, 600]]
    .forEach(function (m) { crear('monton', m[0], m[1], 2, { cant: m[2], cantMax: m[2] }); });
  const base = crear('principal', 8, 37, 0);
  crear('chatarrero', 11.5, 36.5, 0); crear('chatarrero', 11.5, 37.5, 0); crear('chatarrero', 11.5, 38.5, 0);
  crear('echadora', 10.5, 35.5, 0);
  for (let i = 0; i < G.dif.guardias; i++) crearEnemigo('policia', true);
  // decorado que no bloquea el paso
  G.deco = []; G.trozos = new Map();
  const dec = function (k, x, y, v) { G.deco.push({ k: k, x: x, y: y, v: v || 0, id: G.deco.length + 1, dir: rnd() > .5 ? 1 : -1, deco: true }); };
  [2, 6, 10, 14].forEach(function (y) { dec('farola', 30.5, y + .5); });
  [33, 37, 41, 45].forEach(function (x) { dec('farola', x + .5, 17.5); });
  [[22.3, 22.3], [27.7, 22.3], [22.3, 27.7], [27.7, 27.7], [36.4, 10.6], [43.6, 10.6]].forEach(function (q) { dec('farola', q[0], q[1]); });
  [[23, 27.2], [27.2, 23], [36.5, 3.5], [43.5, 3.5], [36.4, 7], [30.5, 8.5], [30.5, 12.5], [39.5, 17.5]].forEach(function (q) { dec('arbol', q[0], q[1]); });
  [[24.2, 22.6], [26.8, 27.4], [38.5, 10.6], [41.5, 10.6]].forEach(function (q) { dec('banco', q[0], q[1]); });
  [[31.5, 16.5], [34.5, 2.5], [46.5, 9.5], [37.5, 12.5]].forEach(function (q) { dec('contenedor', q[0], q[1]); });
  dec('bidon', 11.6, 40.6);
  for (let i = 0; i < 8; i++) { const a = i * .785 + .3, r = 1.75 + (i % 3) * .28; dec('turista', 25 + Math.cos(a) * r, 25 + Math.sin(a) * r, i); G.deco[G.deco.length - 1].dir = Math.cos(a) - Math.sin(a) > 0 ? -1 : 1; }
  for (let i = 0; i < 70; i++) { const x = 1 + rnd() * (N - 2), y = 1 + rnd() * (N - 2); if (G.tiles[Math.floor(y) * N + Math.floor(x)] < 2 && libre(Math.floor(x), Math.floor(y)) && Math.hypot(x - 10, y - 38) > 4) dec('matojo', x, y, Math.floor(rnd() * 4)); }
  calcVision();
  centrar(base.x + 1.5, base.y + 1.5);
  document.getElementById('avisos').innerHTML = '';
  G.firma = '?'; refrescarPanel(true);
  aviso('Manda a los chatarreros a por chatarra y a la echadora a la plaza (clic derecho).');
}
function centrar(x, y) {
  G.cam.x = (x - y) * 32 - W / 2;
  G.cam.y = (x + y) * 16 - (H - (elPanel.offsetHeight - 36) / Z) / 2;
}
function ajustarCam() {
  const ah = (H - (elPanel.offsetHeight - 36) / Z) / 2;
  let cxm = G.cam.x + W / 2, cym = G.cam.y + ah;
  cxm = Math.max(-N * 32, Math.min(N * 32, cxm)); cym = Math.max(0, Math.min(N * 32, cym));
  G.cam.x = cxm - W / 2; G.cam.y = cym - ah;
}

/* ---------- Recursos y población ---------- */
function popMax() { let p = 0; for (const e of G.ents) if (e.eq === 0 && e.d.tipo === 'e' && e.obra >= 1) p += e.k === 'chabola' ? NIVEL[e.nivel || 0].pop : (e.d.pop || 0); return Math.min(POP_TOPE, p); }
function popUso() { let p = 0; for (const e of G.ents) { if (e.eq !== 0) continue; if (e.d.tipo === 'u') p++; else if (e.cola) for (const it of e.cola) if (it.k !== 'mejora') p++; } return p; }
function puede(c) { return G.dinero >= (c.d || 0) && G.chatarra >= (c.c || 0); }
function pagar(c) { G.dinero -= c.d || 0; G.chatarra -= c.c || 0; }
function falta(c) { aviso(G.dinero < (c.d || 0) ? 'No hay dinero suficiente.' : 'No hay chatarra suficiente.', true); son('error'); }

/* ---------- Combate ---------- */
function enemigoCerca(u, r) {
  let mejor = null, md = r;
  for (const e of G.ents) {
    if (e.eq > 1 || e.eq === u.eq || e.hp <= 0 || e.k === 'echadora') continue;
    let d = distE(u, e); if (e.d.tam) d += 1.5;
    if (d < md) { md = d; mejor = e; }
  }
  return mejor;
}
function danar(e, d, autor) {
  if (e.hp <= 0) return;
  e.hp -= d; e.flash = .12;
  if (e.eq === 0 && G.alertaT <= 0) { G.alertaT = 12; aviso('¡Nos atacan!', true); son('alerta'); }
  if (seVe(e)) son('golpe');
  if (e.hp <= 0) { matar(e); return; }
  if (autor && e.d.tipo === 'u' && e.d.dano && e.orden.t === 'idle') e.orden = { t: 'atacar', obj: autor.id, luego: { t: 'idle' } };
}
function matar(e) {
  e.hp = 0; e.muerto = true;
  if (e.d.tam) bloquear(e, 0);
  const c = centro(e);
  G.fx.push({ t: 'humo', x: c.x, y: c.y, v: 0, dur: .5, r: e.d.tam ? 30 * e.d.tam : 14 });
  if (e.d.tipo === 'e' && seVe(e)) son('cae');
  if (e.k === 'ayuntamiento') terminar('victoria');
  if (e.k === 'principal' && e.eq === 0 && !G.ents.some(function (o) { return o !== e && o.k === 'principal' && o.eq === 0 && !o.muerto; })) terminar('derrota');
}
function terminar(tipo) {
  if (G.fin) return;
  G.fin = tipo; son(tipo);
  const m = Math.floor(G.t / 60), s = Math.floor(G.t % 60);
  document.getElementById('fin-titulo').textContent = tipo === 'victoria' ? '¡Victoria!' : 'Desalojados';
  document.getElementById('fin-texto').textContent = (tipo === 'victoria'
    ? 'El Ayuntamiento ha caído. El pleno aprueba por unanimidad recalificar el descampado.'
    : 'Desalojo consumado. El Ayuntamiento anuncia un aparcamiento disuasorio en el solar.') + ' Tiempo: ' + m + ':' + (s < 10 ? '0' : '') + s + '.';
  setTimeout(function () { document.getElementById('fin').classList.remove('oculto'); }, 900);
}

/* ---------- Órdenes y comportamiento ---------- */
function ordenar(u, o) {
  u.orden = o; u.ruta = null; u.fase = null; u.tt = 0;
  if (o.t === 'mover' || o.t === 'amover') { if (!irA(u, o.x, o.y)) u.orden = { t: 'idle' }; }
}
function masCercano(u, filtro, radio) {
  let mejor = null, md = radio || 1e9;
  for (const e of G.ents) { if (!filtro(e)) continue; const d = distE(u, e); if (d < md) { md = d; mejor = e; } }
  return mejor;
}
function ciclo(u, dt, o, dinero) {
  if (!u.fase) { u.fase = u.carga > 0 ? 'volver' : 'ir'; u.ruta = null; }
  if (u.fase === 'ir') {
    let m = ent(o.obj);
    if (!m || m.muerto) {
      m = dinero ? masCercano(u, function (e) { return e.k === 'plaza'; }) : masCercano(u, function (e) { return e.k === 'monton' && !e.muerto; }, 12);
      if (!m) { u.orden = { t: 'idle' }; return; }
      o.obj = m.id; u.ruta = null;
    }
    if (distE(u, m) <= .8) { u.fase = 'pica'; u.tt = dinero ? 4 : 3; u.ruta = null; mirar(u, m); return; }
    if (!u.ruta || !u.ruta.length) { if (!irAEnt(u, m)) { u.orden = { t: 'idle' }; return; } }
    avanzar(u, dt);
  } else if (u.fase === 'pica') {
    u.trabaja = true; u.tt -= dt;
    if (u.tt <= 0) {
      if (dinero) u.carga = CARGA_DINERO;
      else {
        const m = ent(o.obj);
        if (m && !m.muerto) { const q = Math.min(CARGA_CHATARRA, m.cant); m.cant -= q; u.carga = q; if (m.cant <= 0) matar(m); }
        if (enVista(u)) son('chatarra');
      }
      u.fase = u.carga > 0 ? 'volver' : 'ir'; u.ruta = null;
    }
  } else {
    const b = masCercano(u, function (e) { return e.k === 'principal' && e.eq === u.eq && e.obra >= 1 && !e.muerto; });
    if (!b) { u.orden = { t: 'idle' }; return; }
    if (distE(u, b) <= .8) {
      if (dinero) { G.dinero += u.carga; son('moneda'); } else G.chatarra += u.carga;
      G.fx.push({ t: 'txt', x: u.x, y: u.y, v: 0, dur: 1, txt: '+' + u.carga, col: dinero ? '#F2D16B' : '#D5DADF' });
      u.carga = 0; u.fase = 'ir'; u.ruta = null; return;
    }
    if (!u.ruta || !u.ruta.length) { if (!irAEnt(u, b)) { u.orden = { t: 'idle' }; return; } }
    avanzar(u, dt);
  }
}
function enVista(u) { const p = enPantalla(u.x, u.y); return p.x > 0 && p.x < W && p.y > 0 && p.y < H; }

function updU(u, dt) {
  u.anda = false; u.trabaja = false; u.cd = Math.max(0, u.cd - dt); u.pensar -= dt; u.golpeT = Math.max(0, u.golpeT - dt);
  const o = u.orden;
  switch (o.t) {
    case 'idle':
      if (u.d.dano && u.k !== 'chatarrero' && u.pensar <= 0) {
        u.pensar = .35;
        const en = enemigoCerca(u, u.d.vista);
        if (en) u.orden = { t: 'atacar', obj: en.id, luego: { t: 'idle' } };
      }
      break;
    case 'mover':
      if (avanzar(u, dt)) u.orden = { t: 'idle' };
      break;
    case 'amover':
      if (u.pensar <= 0) {
        u.pensar = .35;
        const en = enemigoCerca(u, u.d.vista);
        if (en) { u.orden = { t: 'atacar', obj: en.id, luego: o }; u.ruta = null; break; }
      }
      if (!u.ruta) { if (!irA(u, o.x, o.y)) { u.orden = { t: 'idle' }; break; } }
      if (avanzar(u, dt)) u.orden = { t: 'idle' };
      break;
    case 'atacar': {
      const e = ent(o.obj);
      if (!e || e.muerto || (u.eq === 1 && e.eq === 1)) { u.orden = o.luego || { t: 'idle' }; u.ruta = null; break; }
      const d = distE(u, e);
      if (d <= u.d.alc + (e.d.tam ? .35 : 0)) {
        u.ruta = null; mirar(u, e);
        if (u.cd <= 0) {
          u.cd = u.d.cad; u.golpeT = .22;
          if (u.d.proy) G.fx.push({ t: 'multa', x: u.x, y: u.y, obj: e.id, dano: u.d.dano, autor: u.id, v: 0, dur: 9 });
          else danar(e, u.d.dano, u);
        }
      } else {
        u.tt = (u.tt || 0) - dt;
        if (!u.ruta || !u.ruta.length || u.tt <= 0) { u.tt = .6; if (!(e.d.tam ? irAEnt(u, e) : irA(u, e.x, e.y))) { u.orden = o.luego || { t: 'idle' }; break; } }
        avanzar(u, dt);
      }
      break;
    }
    case 'recoger': ciclo(u, dt, o, false); break;
    case 'ganar': ciclo(u, dt, o, true); break;
    case 'construir': {
      const b = ent(o.obj);
      if (!b || b.muerto || b.obra >= 1) { u.orden = { t: 'idle' }; break; }
      if (distE(u, b) <= .8) {
        u.trabaja = true; u.ruta = null; mirar(u, b);
        b.obra = Math.min(1, b.obra + dt / b.d.t);
        b.hp = Math.min(b.hpMax, b.hp + dt / b.d.t * b.hpMax * .9);
        if (b.obra >= 1) { son('listo'); aviso(b.d.nombre + ' terminada.'); u.orden = { t: 'idle' }; G.firma = '?'; }
      } else {
        if (!u.ruta || !u.ruta.length) { if (!irAEnt(u, b)) { u.orden = { t: 'idle' }; break; } }
        avanzar(u, dt);
      }
      break;
    }
  }
}
function updE(b, dt) {
  if (b.flash) b.flash = Math.max(0, b.flash - dt);
  if (b.obra < 1 || !b.cola || !b.cola.length) return;
  const it = b.cola[0];
  it.p += dt / it.t;
  if (it.p >= 1) {
    b.cola.shift();
    if (it.k === 'mejora') {
      b.nivel = (b.nivel || 0) + 1; b.hpMax = NIVEL[b.nivel].hp; b.hp = Math.min(b.hpMax, b.hp + 100);
      aviso('Chabola mejorada a ' + NIVEL[b.nivel].nombre + '.'); son('listo');
    } else {
      const u = salir(b, it.k);
      if (u) {
        if (u.k === 'chatarrero') { const m = masCercano(u, function (e) { return e.k === 'monton' && !e.muerto; }, 14); if (m) ordenar(u, { t: 'recoger', obj: m.id }); }
        if (u.k === 'echadora') { const p = masCercano(u, function (e) { return e.k === 'plaza'; }); if (p) ordenar(u, { t: 'ganar', obj: p.id }); }
        son('listo');
      }
    }
    G.firma = '?';
  }
}
function salir(b, k, hacia) {
  const cs = anillo(b); if (!cs.length) return null;
  const ref = hacia || { x: b.x + b.d.tam + 1, y: b.y - 1 };
  cs.sort(function (a, c) { return Math.hypot(a[0] - ref.x, a[1] - ref.y) - Math.hypot(c[0] - ref.x, c[1] - ref.y); });
  const c = cs[Math.floor(Math.random() * Math.min(3, cs.length))];
  return crear(k, c[0] + .5, c[1] + .5, b.eq);
}

/* ---------- El Ayuntamiento (IA) ---------- */
function crearEnemigo(k, guardia) {
  const a = G.ents.find(function (e) { return e.k === 'ayuntamiento' && !e.muerto; });
  if (!a) return null;
  const u = salir(a, k, { x: a.x - 2, y: a.y + 6 });
  if (u) u.guardia = !!guardia;
  return u;
}
function ia(dt) {
  const I = G.ia, D = G.dif;
  I.t -= dt; I.tg -= dt; I.tr -= dt;
  if (I.tg <= 0) {
    I.tg = 25;
    let n = 0; for (const e of G.ents) if (e.eq === 1 && e.guardia) n++;
    if (n < D.guardias) crearEnemigo('policia', true);
  }
  if (I.t <= 0) {
    I.t = D.intervalo; I.ola++;
    const n = Math.min(12, D.base + Math.floor(G.t / D.crece));
    for (let i = 0; i < n; i++) crearEnemigo((i % 3 === 2 && I.ola >= D.insp) ? 'inspector' : 'policia', false);
    aviso('El Ayuntamiento envía una patrulla de desalojo.', true); son('alerta');
    I.tr = 0;
  }
  if (I.tr <= 0) {
    I.tr = 2;
    for (const u of G.ents) {
      if (u.eq !== 1 || u.d.tipo !== 'u' || u.guardia || u.orden.t !== 'idle') continue;
      const obj = masCercano(u, function (e) { return e.eq === 0 && !e.muerto && e.k !== 'echadora'; });
      if (obj) { const c = centro(obj); ordenar(u, { t: 'amover', x: c.x, y: c.y }); if (u.orden.t === 'idle' && obj.d.tam) { u.orden = { t: 'atacar', obj: obj.id }; } }
    }
  }
}

/* ---------- Visión ---------- */
function calcVision() {
  G.vis.fill(0);
  for (const e of G.ents) {
    if (e.eq !== 0) continue;
    const c = centro(e), r = e.d.tam && e.obra < 1 ? 2.5 : (e.d.vista || 4), r2 = r * r;
    const x0 = Math.max(0, Math.floor(c.x - r)), x1 = Math.min(N - 1, Math.floor(c.x + r));
    const y0 = Math.max(0, Math.floor(c.y - r)), y1 = Math.min(N - 1, Math.floor(c.y + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + .5 - c.x, dy = y + .5 - c.y;
      if (dx * dx + dy * dy <= r2) { G.vis[y * N + x] = 1; G.expl[y * N + x] = 1; }
    }
  }
}

/* ---------- Actualización ---------- */
function actualizar(dt) {
  G.t += dt; G.alertaT -= dt;
  const vc = 700 * dt;
  if (teclas.ArrowLeft) G.cam.x -= vc; if (teclas.ArrowRight) G.cam.x += vc;
  if (teclas.ArrowUp) G.cam.y -= vc; if (teclas.ArrowDown) G.cam.y += vc;
  if (raton.dentro && raton.tipo === 'mouse' && !G.arrastre) {
    if (raton.x < 10) G.cam.x -= vc; if (raton.x > W - 10) G.cam.x += vc;
    if (raton.y < 10) G.cam.y -= vc; if (raton.y > H - 6) G.cam.y += vc;
  }
  ajustarCam();
  for (let i = 0; i < G.ents.length; i++) {
    const e = G.ents[i];
    if (e.muerto) continue;
    if (e.d.tipo === 'u') { if (e.flash) e.flash = Math.max(0, e.flash - dt); updU(e, dt); }
    else if (e.d.tipo === 'e') updE(e, dt);
  }
  // separación suave entre unidades paradas
  for (let i = 0; i < G.ents.length; i++) {
    const a = G.ents[i];
    if (a.d.tipo !== 'u' || a.muerto || a.anda || a.trabaja) continue;
    for (let j = 0; j < G.ents.length; j++) {
      const b = G.ents[j];
      if (i === j || b.d.tipo !== 'u' || b.muerto) continue;
      let dx = a.x - b.x, dy = a.y - b.y; const d = Math.hypot(dx, dy);
      if (d < .5) {
        if (d < .001) { dx = Math.cos(a.id); dy = Math.sin(a.id); } else { dx /= d; dy /= d; }
        const nx = a.x + dx * dt * 1.2, ny = a.y + dy * dt * 1.2;
        if (libre(Math.floor(nx), Math.floor(ny))) { a.x = nx; a.y = ny; }
      }
    }
  }
  ia(dt);
  for (const f of G.fx) {
    f.v += dt;
    if (f.t === 'multa') {
      const e = ent(f.obj);
      if (!e || e.muerto) { f.v = f.dur; continue; }
      const c = centro(e), dx = c.x - f.x, dy = c.y - f.y, d = Math.hypot(dx, dy), p = 9 * dt;
      if (d <= p + .2) { danar(e, f.dano, ent(f.autor)); f.v = f.dur; } else { f.x += dx / d * p; f.y += dy / d * p; }
    }
  }
  G.fx = G.fx.filter(function (f) { return f.v < f.dur; });
  if (G.ents.some(function (e) { return e.muerto; })) {
    G.ents = G.ents.filter(function (e) { if (e.muerto) G.porId.delete(e.id); return !e.muerto; });
    G.sel = G.sel.filter(function (e) { return !e.muerto; });
  }
  G.visT -= dt; if (G.visT <= 0) { G.visT = .2; calcVision(); }
  G.uiT -= dt; if (G.uiT <= 0) { G.uiT = .2; refrescarPanel(false); pintarMinimapa(); }
}

/* ---------- Dibujo de la escena ---------- */
function pintar() {
  const t = G.t;
  cx.setTransform(DPR * Z, 0, 0, DPR * Z, 0, 0);
  cx.fillStyle = '#17120D'; cx.fillRect(0, 0, W, H);
  cx.save();
  const ox = Math.round(G.cam.x), oy = Math.round(G.cam.y);
  cx.translate(-ox, -oy);
  const esc = Math.min(2, DPR * Z), TZ = 640;
  for (let j = Math.floor(oy / TZ); j <= Math.floor((oy + H) / TZ); j++) for (let i = Math.floor(ox / TZ); i <= Math.floor((ox + W) / TZ); i++) {
    const x0 = i * TZ, y0 = j * TZ;
    if (x0 + TZ < -N * 32 - 8 || x0 > N * 32 + 8 || y0 + TZ < -8 || y0 > N * 32 + 8) continue;
    const clave = i + ',' + j; let tz = G.trozos.get(clave);
    if (!tz) { if (G.trozos.size >= 14) G.trozos.delete(G.trozos.keys().next().value); tz = pintarTrozo(G.tiles, N, x0, y0, TZ, esc); G.trozos.set(clave, tz); }
    cx.drawImage(tz, x0, y0, TZ + 2, TZ + 2);
  }
  // niebla
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (G.vis[i]) continue;
    const sx = (x - y) * 32 - ox, sy = (x + y) * 16 - oy;
    if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 8) continue;
    cx.fillStyle = G.expl[i] ? 'rgba(23,18,13,.5)' : '#17120D';
    cx.beginPath(); cx.moveTo(sx + ox, sy + oy - 1); cx.lineTo(sx + ox + 33, sy + oy + 16); cx.lineTo(sx + ox, sy + oy + 33); cx.lineTo(sx + ox - 33, sy + oy + 16); cx.closePath(); cx.fill();
  }
  // colocación de edificio
  if (G.modo && G.modo.t === 'construir' && raton.dentro) {
    const p = casilla(G.modo.k, raton.x, raton.y), ok = valido(G.modo.k, p.x, p.y);
    dibRombo(cx, p.x, p.y, DEF[G.modo.k].tam, ok ? '#7BD45A' : '#E24B4A', 3, ok ? 'rgba(123,212,90,.3)' : 'rgba(226,75,74,.3)');
  }
  // entidades ordenadas por profundidad
  const lista = [];
  for (const e of G.ents) { if (seVe(e)) { const c = centro(e); e._z = c.x + c.y; lista.push(e); } }
  for (const d of G.deco) { const i = Math.floor(d.y) * N + Math.floor(d.x); if (G.expl[i] && (d.k !== 'turista' || G.vis[i])) { d._z = d.x + d.y; d._v = G.vis[i]; lista.push(d); } }
  lista.sort(function (a, b) { return a._z - b._z; });
  for (const e of lista) {
    if (e.deco) { const p = iso(e.x, e.y); cx.save(); cx.translate(p[0], p[1]); if (e.dir < 0 && e.k !== 'farola') cx.scale(-1, 1); DIB[e.k](cx, e, t); cx.restore(); continue; }
    const sel = G.sel.indexOf(e) >= 0;
    if (e.d.tam) {
      if (sel) dibRombo(cx, e.x, e.y, e.d.tam, e.eq === 0 ? '#7BD45A' : e.eq === 1 ? '#E24B4A' : '#F2D16B', 3);
      const tenue = e.eq !== 0 && !visible(e);
      if (e.obra < 1) { dibRombo(cx, e.x + .1, e.y + .1, e.d.tam - .2, '#F2D16B', 2, 'rgba(242,209,107,.15)'); cx.globalAlpha = .35 + .55 * e.obra; }
      if (e.flash > 0) cx.translate(2, 0);
      DIB[e.k](cx, e, t);
      if (e.flash > 0) cx.translate(-2, 0);
      cx.globalAlpha = 1;
      const top = iso(e.x, e.y), alto = e.k === 'ayuntamiento' ? 100 : e.k === 'principal' ? 80 : 44;
      if (e.d.tipo === 'e' && !tenue) {
        if (e.obra < 1) dibBarra(top[0], top[1] - alto + 16, 40, e.obra, '#F2D16B');
        else if (e.hp < e.hpMax || sel) dibVida(cx, top[0], top[1] - alto + 16, 12 * e.d.tam + 14, e.hp / e.hpMax, e.eq === 0);
        if (e.cola && e.cola.length && e.eq === 0) dibBarra(top[0], top[1] - alto + 24, 40, e.cola[0].p, '#6FB7D6');
      }
    } else {
      const p = iso(e.x, e.y);
      if (sel) { cx.lineWidth = 2.5; elip(cx, p[0], p[1], 13, 6.5, null, e.eq === 0 ? '#7BD45A' : '#E24B4A'); }
      cx.save(); cx.translate(p[0] + (e.flash > 0 ? 2 : 0), p[1]); cx.scale(e.dir, 1);
      DIB[e.k](cx, e, t);
      cx.restore();
      if (e.hp < e.hpMax || sel) dibVida(cx, p[0], p[1] - 47, 22, e.hp / e.hpMax, e.eq === 0);
    }
  }
  // efectos
  for (const f of G.fx) {
    const p = iso(f.x, f.y), k = f.v / f.dur;
    if (f.t === 'humo') { cx.globalAlpha = 1 - k; cx.lineWidth = 2; circ(cx, p[0], p[1] - 10 - k * 14, f.r * (.4 + k * .8), '#EDE7DC'); cx.globalAlpha = 1; }
    else if (f.t === 'txt') { cx.globalAlpha = 1 - k * k; cx.font = 'bold 14px sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = TINTA; cx.strokeText(f.txt, p[0], p[1] - 44 - k * 18); cx.fillStyle = f.col; cx.fillText(f.txt, p[0], p[1] - 44 - k * 18); cx.globalAlpha = 1; }
    else if (f.t === 'marca') { cx.globalAlpha = 1 - k; cx.lineWidth = 2.5; elip(cx, p[0], p[1], 16 * (1 - k * .6), 8 * (1 - k * .6), null, f.col); cx.globalAlpha = 1; }
    else if (f.t === 'multa') { if (G.vis[Math.floor(f.y) * N + Math.floor(f.x)]) dibMulta(cx, p[0], p[1] - 20, f.v * 14); }
  }
  cx.restore();
  // recuadro de selección
  const a = G.arrastre;
  if (a && a.caja) {
    cx.lineWidth = 1.5; cx.strokeStyle = '#7BD45A'; cx.fillStyle = 'rgba(123,212,90,.15)';
    cx.beginPath(); cx.rect(Math.min(a.x0, raton.x), Math.min(a.y0, raton.y), Math.abs(raton.x - a.x0), Math.abs(raton.y - a.y0)); cx.fill(); cx.stroke();
  }
  // nombre bajo el cursor
  if (raton.dentro && raton.tipo === 'mouse' && !a && !G.modo) {
    const e = entEn(raton.x, raton.y);
    if (e && e.d.tipo !== 'd') {
      const txt = e.d.nombre + (e.k === 'monton' ? ' (' + e.cant + ')' : '');
      cx.font = 'bold 13px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      cx.lineWidth = 3.5; cx.strokeStyle = TINTA; cx.strokeText(txt, raton.x, raton.y + 30);
      cx.fillStyle = '#F4E9D2'; cx.fillText(txt, raton.x, raton.y + 30);
    }
  }
}
function dibBarra(x, y, w, f, col) {
  cx.fillStyle = TINTA; cx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
  cx.fillStyle = '#5A4A3A'; cx.fillRect(x - w / 2, y, w, 4);
  cx.fillStyle = col; cx.fillRect(x - w / 2, y, w * Math.min(1, f), 4);
}

const MS = 220 / (2 * N);
function pintarMinimapa() {
  mx.fillStyle = '#17120D'; mx.fillRect(0, 0, 220, 116);
  const col = ['#C8A46A', '#A9B36A', '#7C7F86', '#D9CFC0'];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x; if (!G.expl[i]) continue;
    mx.globalAlpha = G.vis[i] ? 1 : .55;
    mx.fillStyle = col[G.tiles[i]];
    mx.fillRect((x - y) * MS + 110 - 2, (x + y) * MS * .5 + 3, 4.6, 2.4);
  }
  mx.globalAlpha = 1;
  for (const e of G.ents) {
    if (!seVe(e)) continue;
    const c = centro(e), px = (c.x - c.y) * MS + 110, py = (c.x + c.y) * MS * .5 + 3;
    const s = e.d.tam ? e.d.tam * 2 + 1 : 3;
    mx.fillStyle = e.eq === 0 ? '#7BFF5A' : e.eq === 1 ? '#FF4A3A' : e.k === 'monton' ? '#4A4F55' : e.k === 'plaza' ? '#3FA9E0' : '#8A7F76';
    mx.fillRect(px - s / 2, py - s / 2, s, s);
  }
  const k = MS / 32;
  mx.strokeStyle = '#FFFFFF'; mx.lineWidth = 1.5;
  mx.strokeRect(G.cam.x * k + 110, G.cam.y * k + 3, W * k, H * k);
}

/* ---------- Panel e interfaz ---------- */
function propias() { return G.sel.filter(function (e) { return e.eq === 0 && e.d.tipo === 'u'; }); }
function acciones() {
  const r = [], us = propias();
  if (us.length) {
    if (us.some(function (u) { return u.k === 'chatarrero'; })) {
      ['chabola', 'taberna'].forEach(function (k) {
        r.push({ nombre: DEF[k].nombre.split(' ')[0], sub: textoCoste(DEF[k].coste), tecla: DEF[k].tecla, act: G.modo && G.modo.k === k, fn: function () { G.modo = { t: 'construir', k: k }; G.firma = '?'; } });
      });
    }
    if (us.some(function (u) { return u.d.dano; })) r.push({ nombre: 'Atacar', sub: 'Avanza atacando', tecla: 'A', act: G.modo && G.modo.t === 'atacar', fn: function () { G.modo = { t: 'atacar' }; G.firma = '?'; } });
    r.push({ nombre: 'Parar', sub: 'Quietos ahí', tecla: 'S', fn: function () { us.forEach(function (u) { ordenar(u, { t: 'idle' }); }); } });
  } else if (G.sel.length === 1 && G.sel[0].eq === 0 && G.sel[0].d.tipo === 'e' && G.sel[0].obra >= 1) {
    const b = G.sel[0];
    (b.d.produce || []).forEach(function (k) {
      r.push({ nombre: DEF[k].nombre.split(' ')[0], sub: textoCoste(DEF[k].coste), tecla: DEF[k].tecla, fn: function () { encolar(b, k); } });
    });
    if (b.k === 'chabola' && (b.nivel || 0) < 2 && !b.cola.length) {
      const nv = NIVEL[(b.nivel || 0) + 1];
      r.push({ nombre: 'Mejorar a ' + nv.nombre, sub: textoCoste(nv.coste), tecla: 'M', fn: function () { mejorar(b); } });
    }
  }
  return r;
}
function encolar(b, k) {
  const c = DEF[k].coste;
  if (b.cola.length >= 5) { aviso('La cola está llena.', true); son('error'); return; }
  if (popUso() >= popMax()) { aviso('No cabe más gente: construye o mejora chabolas.', true); son('error'); return; }
  if (!puede(c)) { falta(c); return; }
  pagar(c); b.cola.push({ k: k, p: 0, t: DEF[k].t }); son('sel'); G.firma = '?';
}
function mejorar(b) {
  const nv = NIVEL[(b.nivel || 0) + 1];
  if (!puede(nv.coste)) { falta(nv.coste); return; }
  pagar(nv.coste); b.cola.push({ k: 'mejora', p: 0, t: nv.t }); son('sel'); G.firma = '?';
}
let accAct = [];
function refrescarPanel(forzar) {
  document.getElementById('r-din').textContent = Math.floor(G.dinero);
  document.getElementById('r-cha').textContent = Math.floor(G.chatarra);
  document.getElementById('r-pob').textContent = popUso() + '/' + popMax();
  const m = Math.floor(G.t / 60), s = Math.floor(G.t % 60);
  document.getElementById('reloj').textContent = m + ':' + (s < 10 ? '0' : '') + s;
  cv.classList.toggle('apuntar', !!G.modo);
  const firma = G.sel.map(function (e) { return e.id + ':' + (e.nivel || 0) + ':' + (e.obra >= 1 ? 1 : 0) + ':' + (e.cola ? e.cola.length : 0); }).join(',') + '|' + (G.modo ? G.modo.t + (G.modo.k || '') : '');
  if (forzar || firma !== G.firma) {
    G.firma = firma; accAct = acciones();
    elOrd.innerHTML = accAct.map(function (a, i) { return '<button type="button" data-i="' + i + '"' + (a.act ? ' class="act"' : '') + '><b>' + a.nombre + '</b><small>' + a.sub + '</small><kbd>' + a.tecla + '</kbd></button>'; }).join('');
  }
  let h = '';
  if (!G.sel.length) h = '<h2>Asentamiento</h2><p>Selecciona con clic izquierdo; ordena con clic derecho.</p><p>Chatarreros a los montones, echadoras a la plaza de la fuente.</p>';
  else if (G.sel.length === 1) {
    const e = G.sel[0];
    h = '<h2>' + e.d.nombre + (e.k === 'chabola' ? ' de ' + NIVEL[e.nivel || 0].nombre : '') + '</h2>';
    if (e.d.tipo === 'u' || e.d.tipo === 'e') h += '<div class="vida"><i style="width:' + Math.max(0, 100 * e.hp / e.hpMax) + '%"></i></div>';
    if (e.k === 'monton') h += '<p>Chatarra restante: ' + e.cant + '</p>';
    if (e.obra < 1) h += '<p>En obras: ' + Math.floor(e.obra * 100) + ' %</p>';
    else if (e.k === 'chabola') h += '<p>Sitio para ' + NIVEL[e.nivel || 0].pop + ' personas.</p>';
    if (e.d.desc) h += '<p>' + e.d.desc + '</p>';
    if (e.eq === 0 && e.cola && e.cola.length) {
      h += '<div class="cola"><div class="prog"><i style="width:' + Math.floor(e.cola[0].p * 100) + '%"></i></div>' + e.cola.map(function (it) { return '<span>' + (it.k === 'mejora' ? 'Mejora' : DEF[it.k].nombre.split(' ')[0]) + '</span>'; }).join('') + '</div>';
    }
  } else {
    const n = {}; G.sel.forEach(function (e) { n[e.d.nombre] = (n[e.d.nombre] || 0) + 1; });
    h = '<h2>' + G.sel.length + ' unidades</h2>' + Object.keys(n).map(function (k) { return '<p>' + n[k] + ' × ' + k + '</p>'; }).join('');
  }
  if (elInfo.innerHTML !== h) elInfo.innerHTML = h;
}
elOrd.addEventListener('click', function (ev) {
  const b = ev.target.closest('button'); if (!b || !G) return;
  const a = accAct[+b.dataset.i]; if (a) { a.fn(); refrescarPanel(false); }
});

/* ---------- Selección y órdenes del jugador ---------- */
function entEn(sx, sy) {
  let mejor = null;
  for (const e of G.ents) {
    if (e.d.tam || !seVe(e)) continue;
    const p = enPantalla(e.x, e.y);
    if (Math.abs(sx - p.x) < 12 && sy > p.y - 40 && sy < p.y + 7 && (!mejor || e._z > mejor._z)) mejor = e;
  }
  if (mejor) return mejor;
  const w = [mundo(sx, sy), mundo(sx, sy + 20)];
  for (const e of G.ents) {
    if (!e.d.tam || !seVe(e)) continue;
    for (const q of w) if (q.x >= e.x && q.x < e.x + e.d.tam && q.y >= e.y && q.y < e.y + e.d.tam) { if (!mejor || e._z > mejor._z) mejor = e; }
  }
  return mejor;
}
function casilla(k, sx, sy) { const w = mundo(sx, sy), t = DEF[k].tam; return { x: Math.floor(w.x - t / 2 + .5), y: Math.floor(w.y - t / 2 + .5) }; }
function valido(k, tx, ty) {
  const t = DEF[k].tam;
  for (let j = 0; j < t; j++) for (let i = 0; i < t; i++) {
    const x = tx + i, y = ty + j;
    if (!libre(x, y) || !G.expl[y * N + x] || G.tiles[y * N + x] >= 2) return false;
  }
  return true;
}
function colocar(sx, sy) {
  const k = G.modo.k, p = casilla(k, sx, sy), c = DEF[k].coste;
  if (!valido(k, p.x, p.y)) { aviso('Ahí no se puede construir.', true); son('error'); return; }
  if (!puede(c)) { falta(c); return; }
  pagar(c);
  const b = crear(k, p.x, p.y, 0, { obra: 0, nivel: 0 }); b.hp = b.hpMax * .1;
  propias().forEach(function (u) { if (u.k === 'chatarrero') ordenar(u, { t: 'construir', obj: b.id }); });
  if (!teclas.Shift) G.modo = null;
  son('orden'); G.firma = '?';
}
function ordenInteligente(sx, sy, atacando) {
  const us = propias(); if (!us.length) return;
  const e = entEn(sx, sy), w = mundo(sx, sy);
  let n = 0, hecho = false;
  us.forEach(function (u) {
    if (e && e.eq === 1 && u.d.dano) { ordenar(u, { t: 'atacar', obj: e.id }); hecho = true; }
    else if (e && e.k === 'monton' && u.k === 'chatarrero') { ordenar(u, { t: 'recoger', obj: e.id }); hecho = true; }
    else if (e && e.k === 'plaza' && u.k === 'echadora') { ordenar(u, { t: 'ganar', obj: e.id }); hecho = true; }
    else if (e && e.eq === 0 && e.d.tipo === 'e' && e.obra < 1 && u.k === 'chatarrero') { ordenar(u, { t: 'construir', obj: e.id }); hecho = true; }
    else if (e && e.k === 'principal' && e.eq === 0 && u.carga > 0) { ordenar(u, { t: u.k === 'echadora' ? 'ganar' : 'recoger', obj: -1 }); u.fase = 'volver'; hecho = true; }
    else {
      const an = n * 2.4, r = .55 * Math.sqrt(n); n++;
      ordenar(u, { t: atacando && u.d.dano ? 'amover' : 'mover', x: w.x + Math.cos(an) * r, y: w.y + Math.sin(an) * r });
    }
  });
  const c = e && hecho ? centro(e) : w;
  G.fx.push({ t: 'marca', x: c.x, y: c.y, v: 0, dur: .5, col: (e && e.eq === 1) || atacando ? '#E24B4A' : '#7BD45A' });
  son('orden');
}
function seleccionar(lista, sumar) {
  if (sumar) lista.forEach(function (e) { const i = G.sel.indexOf(e); if (i >= 0) G.sel.splice(i, 1); else G.sel.push(e); });
  else G.sel = lista;
  if (lista.length) son('sel');
  refrescarPanel(false);
}
function mismasEnPantalla(k) { return G.ents.filter(function (e) { return e.eq === 0 && e.k === k && enVista(e); }); }

function pos(ev) { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / Z, y: (ev.clientY - r.top) / Z }; }
cv.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
cv.addEventListener('pointerdown', function (ev) {
  if (!G || G.fin) return;
  const p = pos(ev); raton.x = p.x; raton.y = p.y; raton.dentro = true; raton.tipo = ev.pointerType;
  if (ev.pointerType === 'mouse' && ev.button === 2) {
    if (G.modo) { G.modo = null; G.firma = '?'; return; }
    ordenInteligente(p.x, p.y, false); return;
  }
  if (ev.button !== 0) return;
  try { cv.setPointerCapture(ev.pointerId); } catch (e) { }
  G.arrastre = { x0: p.x, y0: p.y, cx: G.cam.x, cy: G.cam.y, caja: false, movido: false, tactil: ev.pointerType !== 'mouse', mayus: ev.shiftKey };
});
cv.addEventListener('pointermove', function (ev) {
  const p = pos(ev); raton.x = p.x; raton.y = p.y; raton.dentro = true; raton.tipo = ev.pointerType;
  const a = G && G.arrastre; if (!a) return;
  if (!a.movido && Math.hypot(p.x - a.x0, p.y - a.y0) > 7) { a.movido = true; if (!a.tactil && !G.modo) a.caja = true; }
  if (a.movido && a.tactil) { G.cam.x = a.cx - (p.x - a.x0); G.cam.y = a.cy - (p.y - a.y0); ajustarCam(); }
});
cv.addEventListener('pointerleave', function () { raton.dentro = false; });
cv.addEventListener('pointerup', function (ev) {
  if (!G) return;
  const a = G.arrastre; G.arrastre = null; if (!a) return;
  const p = pos(ev);
  if (a.caja) {
    const x0 = Math.min(a.x0, p.x), x1 = Math.max(a.x0, p.x), y0 = Math.min(a.y0, p.y), y1 = Math.max(a.y0, p.y);
    const l = G.ents.filter(function (e) { if (e.eq !== 0 || e.d.tipo !== 'u') return false; const q = enPantalla(e.x, e.y); return q.x >= x0 && q.x <= x1 && q.y - 14 >= y0 && q.y - 14 <= y1; });
    seleccionar(l, a.mayus); return;
  }
  if (a.movido) return;
  if (G.modo) {
    if (G.modo.t === 'construir') colocar(p.x, p.y);
    else { ordenInteligente(p.x, p.y, true); G.modo = null; G.firma = '?'; }
    return;
  }
  const e = entEn(p.x, p.y);
  if (a.tactil) {
    if (e && e.eq === 0) { if (G.sel.length === 1 && G.sel[0] === e && e.d.tipo === 'u') seleccionar(mismasEnPantalla(e.k), false); else seleccionar([e], false); }
    else if (propias().length) ordenInteligente(p.x, p.y, false);
    else seleccionar(e && e.d.tipo !== 'd' ? [e] : [], false);
    return;
  }
  if (!e || e.d.tipo === 'd') { if (!a.mayus) seleccionar([], false); return; }
  const ahora = performance.now();
  if (e.eq === 0 && e.d.tipo === 'u' && G.ultClic && G.ultClic.id === e.id && ahora - G.ultClic.t < 350) seleccionar(mismasEnPantalla(e.k), false);
  else seleccionar([e], a.mayus && e.eq === 0 && e.d.tipo === 'u' && propias().length > 0);
  G.ultClic = { id: e.id, t: ahora };
});

function miniA(ev) {
  const r = mm.getBoundingClientRect(), k = 220 / r.width;
  const px = (ev.clientX - r.left) * k, py = (ev.clientY - r.top) * k, f = 32 / MS;
  G.cam.x = (px - 110) * f - W / 2; G.cam.y = (py - 3) * f - (H - (elPanel.offsetHeight - 36) / Z) / 2; ajustarCam();
}
let miniPulsado = false;
mm.addEventListener('pointerdown', function (ev) { if (!G) return; miniPulsado = true; try { mm.setPointerCapture(ev.pointerId); } catch (e) { } miniA(ev); });
mm.addEventListener('pointermove', function (ev) { if (G && miniPulsado) miniA(ev); });
mm.addEventListener('pointerup', function () { miniPulsado = false; });

window.addEventListener('keydown', function (ev) {
  teclas[ev.key] = true;
  if (!G || G.fin || !document.getElementById('inicio').classList.contains('oculto')) return;
  if (ev.key.indexOf('Arrow') === 0 || ev.key === ' ') ev.preventDefault();
  if (ev.key === 'Escape') { if (G.modo) G.modo = null; else G.sel = []; G.firma = '?'; refrescarPanel(false); return; }
  if (ev.key === ' ') { const b = G.ents.find(function (e) { return e.k === 'principal' && e.eq === 0; }); if (b) centrar(b.x + 1.5, b.y + 1.5); return; }
  if (/^[1-9]$/.test(ev.key)) {
    if (ev.ctrlKey || ev.metaKey) { G.grupos[ev.key] = propias().map(function (e) { return e.id; }); ev.preventDefault(); aviso('Grupo ' + ev.key + ' guardado.'); }
    else if (G.grupos[ev.key]) seleccionar(G.grupos[ev.key].map(ent).filter(Boolean), false);
    return;
  }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = ev.key.toUpperCase();
  const a = accAct.find(function (x) { return x.tecla === k; });
  if (a) { a.fn(); refrescarPanel(false); }
});
window.addEventListener('keyup', function (ev) { teclas[ev.key] = false; });
window.addEventListener('blur', function () { for (const k in teclas) teclas[k] = false; });

/* ---------- Arranque ---------- */
function medir() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  Z = window.innerWidth < 760 ? 1 : 1.5;
  if (G && G.trozos) G.trozos.clear();
  W = window.innerWidth / Z; H = window.innerHeight / Z;
  cv.width = Math.round(window.innerWidth * DPR); cv.height = Math.round(window.innerHeight * DPR);
  if (G) ajustarCam();
}
window.addEventListener('resize', medir);
medir();

document.getElementById('dif').addEventListener('click', function (ev) {
  const b = ev.target.closest('button'); if (!b) return;
  difElegida = b.dataset.d;
  this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('act', x === b); });
});
function empezar() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) { } }
  document.getElementById('inicio').classList.add('oculto');
  document.getElementById('fin').classList.add('oculto');
  nuevaPartida(difElegida);
}
document.getElementById('b-jugar').addEventListener('click', empezar);
document.getElementById('b-otra').addEventListener('click', function () {
  document.getElementById('fin').classList.add('oculto');
  document.getElementById('inicio').classList.remove('oculto');
});
document.getElementById('b-son').addEventListener('click', function () {
  sonidoSi = !sonidoSi; this.textContent = 'Sonido: ' + (sonidoSi ? 'sí' : 'no');
});

let ultimo = 0;
function bucle(ts) {
  const dt = Math.min(.05, (ts - ultimo) / 1000 || 0); ultimo = ts;
  if (G) { if (!G.fin) actualizar(dt); pintar(); }
  requestAnimationFrame(bucle);
}
requestAnimationFrame(bucle);

/* Fondo de la pantalla de inicio: una partida de muestra detenida */
nuevaPartida('normal'); G.fin = 'demo';
