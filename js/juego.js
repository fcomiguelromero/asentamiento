'use strict';
/* Asentamiento — lógica del juego (v0.7) */
const N = 48;

const DEF = {
  chatarrero: { nombre: 'Chatarrero', tipo: 'u', hp: 45, vel: 2.6, dano: 4, cad: 1, alc: .9, vista: 6, coste: { d: 50 }, t: 9, tecla: 'Q', desc: 'Recoge chatarra con su carrito y levanta chabolas.' },
  echadora: { hab: { id: 'ojo', nombre: 'Mal de ojo', tecla: 'O', cd: 20, alc: 5, dur: 8, desc: 'Echa mal de ojo a un enemigo: anda y ataca a la mitad de ritmo durante 8 segundos.' }, nombre: 'Echadora de la buenaventura', tipo: 'u', hp: 35, vel: 2.5, dano: 0, vista: 5, coste: { d: 60 }, t: 10, tecla: 'E', desc: 'Va a la plaza, lee el porvenir y vuelve con dinero. La policía no se mete con ella.' },
  navajero: { nombre: 'Navajero', tipo: 'u', hp: 90, vel: 2.9, dano: 10, cad: .8, alc: .9, vista: 6, coste: { d: 60, c: 20 }, t: 11, tecla: 'N', desc: 'Defiende el asentamiento cuerpo a cuerpo.' },
  romero: { hab: { id: 'ramito', nombre: 'Ramito', tecla: 'G', cd: 25, alc: 3, dur: 7, desc: 'Regala un ramito de la suerte a un enemigo: se queda 7 segundos sin atacar.' }, nombre: 'Vendedora de romero', tipo: 'u', hp: 35, vel: 2.3, dano: 0, vista: 5, coste: { d: 70 }, t: 11, tecla: 'R', desc: 'Vende ramitos por las calles de la ciudad. Da poco dinero, pero no se agota. La policía no se mete con ella.' },
  chatarreria: { nombre: 'Chatarrería', tipo: 'e', tam: 3, hp: 260, vista: 4, coste: { c: 80 }, t: 14, tecla: 'H', desc: 'Los chatarreros también descargan aquí. Constrúyela junto a montones lejanos.' },
  policia: { nombre: 'Policía local', tipo: 'u', hp: 55, vel: 2.5, dano: 6, cad: .9, alc: .9, vista: 6, desc: 'Viene a desalojar, porra en mano.' },
  inspector: { nombre: 'Inspector de Urbanismo', tipo: 'u', hp: 40, vel: 2.2, dano: 6, cad: 1.6, alc: 4.5, vista: 7, proy: true, desc: 'Lanza multas a distancia. Duelen.' },
  principal: { nombre: 'Casa del Patriarca', tipo: 'e', tam: 3, hp: 700, pop: 6, vista: 8, produce: ['chatarrero', 'echadora', 'romero'], desc: 'El corazón del asentamiento. Aquí se descarga la chatarra y el dinero.' },
  chabola: { nombre: 'Chabola', tipo: 'e', tam: 2, hp: 180, vista: 4, coste: { c: 50 }, t: 12, tecla: 'C', desc: 'Da sitio para más gente.' },
  taberna: { nombre: 'Taberna El Pincho', tipo: 'e', tam: 2, hp: 300, vista: 4, coste: { c: 90, d: 30 }, t: 16, tecla: 'T', produce: ['navajero'], desc: 'Entre caña y caña, aquí se curten los navajeros.' },
  ayuntamiento: { nombre: 'Ayuntamiento', tipo: 'e', tam: 4, hp: 1100, vista: 8, desc: 'De aquí salen las patrullas. Derríbalo para ganar.' },
  bloque: { nombre: 'Bloque de pisos', tipo: 'd', tam: 3, hp: 1 },
  contenedor: { nombre: 'Contenedor de basura', tipo: 'r', tam: 1, hp: 1, desc: 'Siempre hay algo aprovechable. Manda aquí a los chatarreros.' },
  monton: { nombre: 'Montón de chatarra', tipo: 'r', tam: 1, hp: 1, desc: 'Manda aquí a los chatarreros con el botón derecho.' },
  plaza: { nombre: 'Plaza', tipo: 'p', tam: 2, hp: 1, desc: 'Manda aquí a las echadoras. Cuando los turistas se cansan de dar dinero, se van.' }
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
const PLAZAS = [{ x: 24, y: 24, cant: 500, nom: 'Plaza de la fuente' }, { x: 37, y: 30, cant: 900, nom: 'Plaza del mercado' }, { x: 26, y: 6, cant: 1400, nom: 'Plaza de la catedral' }];
const VENTA_ROMERO = 12;
function nombreDe(e) { return e.nom || e.d.nombre; }
function esChatarra(e) { return (e.k === 'monton' || e.k === 'contenedor') && !e.muerto; }
const NIVEL_CASA = [{ nombre: 'humilde', pop: 6, hp: 700 }, { nombre: 'ampliada', pop: 10, hp: 1000, coste: { c: 150, d: 100 }, t: 25 }, { nombre: 'señorial', pop: 14, hp: 1400, coste: { c: 250, d: 200 }, t: 35 }];
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
    case 'hechizo': tono(880, 1320, .12, 'triangle', .07); tono(1320, 660, .2, 'sine', .06, .1); break;
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
  let paso = u.d.vel * (u.lento > 0 ? .5 : 1) * dt;
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
    fx: [], ruinas: [], fin: null, modo: null, ia: { t: DIF[dif].primera, ola: 0, tg: 0, tr: 0 }, grupos: {}, alertaT: 0, visT: 0, uiT: 0, firma: '', arrastre: null
  };
  const rnd = mulberry(7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const h = Math.sin(x * .31 + 1.3) * Math.cos(y * .27) + Math.sin((x + y) * .13 + 2);
    let tp = h > 1.35 ? 1 : 0;
    if (x >= 30 && y <= 17) tp = (x === 30 || y === 17) ? 3 : 2;
    for (const q of PLAZAS) if (x >= q.x - 2 && x <= q.x + 3 && y >= q.y - 2 && y <= q.y + 3) tp = 3;
    if (x >= 38 && x <= 46 && y >= 4 && y <= 12) tp = 3;
    if (x >= 36 && x <= 43 && y >= 3 && y <= 10) tp = 3;
    G.tiles[y * N + x] = tp;
  }
  for (let bx = 31; bx <= 43; bx += 4) for (let by = 1; by <= 13; by += 4) {
    if (bx <= 42 && bx + 2 >= 37 && by <= 9 && by + 2 >= 4) continue;
    if (bx + 2 >= 38 && bx <= 46 && by + 2 >= 4 && by <= 12) continue;
    crear('bloque', bx, by, 2, { alto: 34 + Math.floor(rnd() * 3) * 13, tono: Math.floor(rnd() * 4) });
  }
  crear('ayuntamiento', 38, 5, 1);
  [[34, 2], [38, 14], [46, 10], [30, 6], [42, 16], [34, 10], [46, 2]].forEach(function (q) { if (libre(q[0], q[1])) crear('contenedor', q[0], q[1], 2, { cant: 150, cantMax: 150 }); });
  PLAZAS.forEach(function (q) { crear('plaza', q.x, q.y, 2, { cant: q.cant, cantMax: q.cant, nom: q.nom }); });
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
  [[37.2, 10.5], [42.6, 10.5]].forEach(function (q) { dec('farola', q[0], q[1]); });
  [[36.6, 4.4], [42.4, 4.4], [36.6, 8.6], [42.4, 8.6], [30.5, 8.5], [30.5, 12.5], [39.5, 17.5]].forEach(function (q) { dec('arbol', q[0], q[1]); });
  [[38.5, 10.6], [41.5, 10.6]].forEach(function (q) { dec('banco', q[0], q[1]); });
  dec('bidon', 11.6, 40.6);
  G.ents.filter(function (e) { return e.k === 'plaza'; }).forEach(function (pz) {
    const X = pz.x, Y = pz.y;
    [[X - 1.7, Y - 1.7], [X + 3.7, Y - 1.7], [X - 1.7, Y + 3.7], [X + 3.7, Y + 3.7]].forEach(function (q) { dec('farola', q[0], q[1]); });
    dec('arbol', X - 1, Y + 3.2); dec('arbol', X + 3.2, Y - 1); dec('banco', X + .2, Y - 1.4); dec('banco', X + 2.8, Y + 3.4); dec('columna', X - 1.3, Y + .2);
    for (let i = 0; i < 8; i++) { const a = i * .785 + .3, r = 1.75 + (i % 3) * .28; dec('turista', X + 1 + Math.cos(a) * r, Y + 1 + Math.sin(a) * r, i + pz.id); const d = G.deco[G.deco.length - 1]; d.dir = Math.cos(a) - Math.sin(a) > 0 ? -1 : 1; d.plaza = pz; d.n = i; }
  });
  G.peat = []; G.celdasCalle = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((enCiudad(x, y) || G.tiles[y * N + x] === 3) && libre(x, y)) G.celdasCalle.push([x, y]);
  for (let i = 0; i < 16; i++) { const q = G.celdasCalle[Math.floor(rnd() * G.celdasCalle.length)]; G.peat.push({ k: 'turista', deco: true, peaton: true, x: q[0] + .5, y: q[1] + .5, v: i + 3, id: 900 + i, dir: 1, ruta: null, parado: rnd() * 3, compro: 0 }); }
  for (let i = 0; i < 70; i++) { const x = 1 + rnd() * (N - 2), y = 1 + rnd() * (N - 2); if (G.tiles[Math.floor(y) * N + Math.floor(x)] < 2 && libre(Math.floor(x), Math.floor(y)) && Math.hypot(x - 10, y - 38) > 4) dec('matojo', x, y, Math.floor(rnd() * 4)); }
  calcVision();
  centrar(base.x + 1.5, base.y + 1.5);
  document.getElementById('avisos').innerHTML = '';
  G.firma = '?'; refrescarPanel(true); pintarRetrato();
  aviso('Chatarreros a los montones y echadora a la plaza (clic derecho). Las plazas se agotan: busca otras.');
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
function popMax() { let p = 0; for (const e of G.ents) if (e.eq === 0 && e.d.tipo === 'e' && e.obra >= 1) p += e.k === 'chabola' ? NIVEL[e.nivel || 0].pop : e.k === 'principal' ? NIVEL_CASA[e.nivel || 0].pop : (e.d.pop || 0); return Math.min(POP_TOPE, p); }
function popUso() { let p = 0; for (const e of G.ents) { if (e.eq !== 0) continue; if (e.d.tipo === 'u') p++; else if (e.cola) for (const it of e.cola) if (it.k !== 'mejora') p++; } return p; }
function puede(c) { return G.dinero >= (c.d || 0) && G.chatarra >= (c.c || 0); }
function pagar(c) { G.dinero -= c.d || 0; G.chatarra -= c.c || 0; }
function falta(c) { aviso(G.dinero < (c.d || 0) ? 'No hay dinero suficiente.' : 'No hay chatarra suficiente.', true); son('error'); }

/* ---------- Combate ---------- */
function enemigoCerca(u, r) {
  let mejor = null, md = r;
  for (const e of G.ents) {
    if (e.eq > 1 || e.eq === u.eq || e.hp <= 0 || e.k === 'echadora' || e.k === 'romero') continue;
    let d = distE(u, e); if (e.d.tam) d += 1.5;
    if (d < md) { md = d; mejor = e; }
  }
  return mejor;
}
function danar(e, d, autor) {
  if (e.hp <= 0) return;
  e.hp -= d; e.flash = .12;
  if (e.eq === 0) { const c0 = centro(e); G.ultAlerta = { x: c0.x, y: c0.y, t: G.t }; }
  if (e.eq === 0 && G.alertaT <= 0) { G.alertaT = 12; aviso('¡Nos atacan! (Espacio para ir)', true); son('alerta'); }
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
  if (e.d.tipo === 'e' && e.obra >= 1) G.ruinas.push({ x: e.x, y: e.y, tam: e.d.tam, id: e.id, v: 0 });
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
    if (!m || m.muerto || (dinero && m.cant <= 0)) {
      m = dinero ? masCercano(u, function (e) { return e.k === 'plaza' && e.cant > 0; }) : masCercano(u, function (e) { return esChatarra(e); }, 12);
      if (!m) { u.orden = { t: 'idle' }; if (dinero) aviso('No quedan plazas con turistas.', true); return; }
      o.obj = m.id; u.ruta = null;
    }
    if (distE(u, m) <= .8) {
      if (!dinero && ocupantes(m, u) >= 2) {
        u.espera = (u.espera || 0) + dt; mirar(u, m);
        if (u.espera > 1.5) {
          u.espera = 0;
          const otro = masCercano(u, function (e) { return esChatarra(e) && e !== m && ocupantes(e, u) < 2 && Math.hypot(centro(e).x - m.x, centro(e).y - m.y) < 7; }, 9);
          if (otro) { o.obj = otro.id; u.ruta = null; }
        }
        return;
      }
      u.espera = 0; u.fase = 'pica'; u.tt = dinero ? 4 : 3; u.ruta = null; mirar(u, m); return;
    }
    if (!u.ruta || !u.ruta.length) { if (!irAEnt(u, m)) { u.orden = { t: 'idle' }; return; } }
    avanzar(u, dt);
  } else if (u.fase === 'pica') {
    u.trabaja = true; u.tt -= dt;
    if (u.tt <= 0) {
      if (dinero) { const m = ent(o.obj); if (m && m.cant > 0) { const q = Math.min(CARGA_DINERO, m.cant); m.cant -= q; u.carga = q; if (m.cant <= 0) { aviso('Los turistas de la ' + nombreDe(m).toLowerCase() + ' se han ido.', true); G.firma = '?'; } } }
      else {
        const m = ent(o.obj);
        if (m && !m.muerto) { const q = Math.min(CARGA_CHATARRA, m.cant); m.cant -= q; u.carga = q; if (m.cant <= 0) matar(m); }
        if (enVista(u)) son('chatarra');
      }
      u.fase = u.carga > 0 ? 'volver' : 'ir'; u.ruta = null;
    }
  } else {
    const b = masCercano(u, function (e) { return (e.k === 'principal' || (!dinero && e.k === 'chatarreria')) && e.eq === u.eq && e.obra >= 1 && !e.muerto; });
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
function ocupantes(m, yo) { let n = 0; for (const e of G.ents) if (e !== yo && e.k === 'chatarrero' && e.fase === 'pica' && e.orden.obj === m.id && e.orden.t === 'recoger') n++; return n; }
function enCiudad(x, y) { return x >= 30 && y <= 17 && x < N && y >= 0; }
function destinoVenta(o) {
  for (let i = 0; i < 14; i++) {
    const x = o.x + (Math.random() - .5) * 10, y = o.y + (Math.random() - .5) * 10;
    if (enCiudad(x, y) && libre(Math.floor(x), Math.floor(y))) return { x: x, y: y };
  }
  return { x: o.x, y: o.y };
}
function enVista(u) { const p = enPantalla(u.x, u.y); return p.x > 0 && p.x < W && p.y > 0 && p.y < H; }

function updU(u, dt) {
  u.anda = false; u.trabaja = false; u.cd = Math.max(0, u.cd - dt); u.pensar -= dt; u.golpeT = Math.max(0, u.golpeT - dt);
  u.cdHab = Math.max(0, (u.cdHab || 0) - dt); u.lento = Math.max(0, (u.lento || 0) - dt); u.calmado = Math.max(0, (u.calmado || 0) - dt);
  if (u.calmado > 0) { u.ruta = null; return; }
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
          u.cd = u.d.cad * (u.lento > 0 ? 2 : 1); u.golpeT = .22;
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
    case 'vender': {
      if (!u.fase) { u.fase = 'ir'; u.ruta = null; u.cliente = null; }
      let cl = u.cliente;
      if (u.fase === 'ir') {
        if (!cl || cl.compro > 0 || cl.reservado !== u.id) {
          cl = null; let md = 11;
          for (const q of G.peat) { if (q.compro > 0 || (q.reservado && q.reservado !== u.id)) continue; const d = Math.hypot(q.x - o.x, q.y - o.y) * .5 + Math.hypot(q.x - u.x, q.y - u.y); if (d < md) { md = d; cl = q; } }
          if (u.cliente && u.cliente !== cl) u.cliente.reservado = null;
          u.cliente = cl; if (cl) cl.reservado = u.id; u.ruta = null;
          if (!cl) { u.tt = (u.tt || 0) - dt; if (u.tt <= 0) { u.tt = 3; const d = destinoVenta(o); irA(u, d.x, d.y); } avanzar(u, dt); break; }
        }
        if (Math.hypot(cl.x - u.x, cl.y - u.y) < .9) { u.fase = 'pica'; u.tt = 3; u.ruta = null; cl.parado = 3.6; cl.ruta = null; cl.compra = true; cl.dir = cl.x - cl.y > u.x - u.y ? -1 : 1; mirar(u, { x: cl.x, y: cl.y, d: {} }); break; }
        u.tt = (u.tt || 0) - dt;
        if (!u.ruta || !u.ruta.length || u.tt <= 0) { u.tt = .8; if (!irA(u, cl.x, cl.y)) { cl.reservado = null; u.cliente = null; } }
        avanzar(u, dt);
      } else {
        u.trabaja = true; u.tt -= dt;
        if (u.tt <= 0) {
          G.dinero += VENTA_ROMERO; G.fx.push({ t: 'txt', x: u.x, y: u.y, v: 0, dur: 1, txt: '+' + VENTA_ROMERO, col: '#F2D16B' }); if (enVista(u)) son('moneda');
          if (cl) { cl.compro = 45; cl.reservado = null; G.fx.push({ t: 'txt', x: cl.x, y: cl.y, v: 0, dur: 1.2, txt: '¡Qué bien huele!', col: '#9FD07A' }); }
          u.cliente = null; u.fase = 'ir'; u.ruta = null;
        }
      }
      break;
    }
    case 'hab': {
      const e = ent(o.obj), h = u.d.hab;
      if (!e || e.muerto || !h) { u.orden = o.luego || { t: 'idle' }; u.fase = null; break; }
      if (distE(u, e) <= h.alc) {
        u.ruta = null; mirar(u, e); u.cdHab = h.cd; u.golpeT = .4;
        if (h.id === 'ojo') { e.lento = h.dur; G.fx.push({ t: 'txt', x: e.x, y: e.y, v: 0, dur: 1.4, txt: '¡Mal de ojo!', col: '#C9A6E8' }); }
        else { e.calmado = h.dur; e.ruta = null; G.fx.push({ t: 'txt', x: e.x, y: e.y, v: 0, dur: 1.4, txt: '¡Ramito de la suerte!', col: '#9FD07A' }); }
        G.fx.push({ t: 'rayo', x: u.x, y: u.y, x2: e.x, y2: e.y, v: 0, dur: .5, col: h.id === 'ojo' ? '#9B5BC0' : '#5E8B4A' });
        son('hechizo'); u.orden = o.luego || { t: 'idle' }; u.fase = null; u.ruta = null;
      } else {
        u.tt = (u.tt || 0) - dt;
        if (!u.ruta || !u.ruta.length || u.tt <= 0) { u.tt = .6; if (!irA(u, e.x, e.y)) { u.orden = o.luego || { t: 'idle' }; break; } }
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
      const T = b.k === 'principal' ? NIVEL_CASA : NIVEL;
      b.nivel = (b.nivel || 0) + 1; const sube = T[b.nivel].hp - b.hpMax; b.hpMax = T[b.nivel].hp; b.hp = Math.min(b.hpMax, b.hp + Math.max(100, sube));
      aviso(b.k === 'principal' ? 'La Casa del Patriarca ya es ' + T[b.nivel].nombre + '.' : 'Chabola mejorada a ' + T[b.nivel].nombre + '.'); son('listo');
    } else {
      const u = salir(b, it.k);
      if (u && b.rally) {
        const R = ent(b.rally.obj);
        if (R && esChatarra(R) && u.k === 'chatarrero') ordenar(u, { t: 'recoger', obj: R.id });
        else if (R && R.k === 'plaza' && u.k === 'echadora') ordenar(u, { t: 'ganar', obj: R.id });
        else if (u.k === 'romero' && enCiudad(b.rally.x, b.rally.y)) ordenar(u, { t: 'vender', x: b.rally.x, y: b.rally.y });
        else ordenar(u, { t: u.d.dano && u.k !== 'chatarrero' ? 'amover' : 'mover', x: b.rally.x, y: b.rally.y });
        son('listo');
      } else if (u) {
        if (u.k === 'chatarrero') { const m = masCercano(u, function (e) { return esChatarra(e); }, 14); if (m) ordenar(u, { t: 'recoger', obj: m.id }); }
        if (u.k === 'echadora') { const p = masCercano(u, function (e) { return e.k === 'plaza' && e.cant > 0; }); if (p) ordenar(u, { t: 'ganar', obj: p.id }); }
        if (u.k === 'romero') ordenar(u, { t: 'vender', x: 33.5, y: 14.5 });
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
      const obj = masCercano(u, function (e) { return e.eq === 0 && !e.muerto && e.k !== 'echadora' && e.k !== 'romero'; });
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
  for (const q of G.peat) {
    q.compro = Math.max(0, q.compro - dt); q.anda = false;
    if (q.parado > 0) { q.parado -= dt; continue; }
    q.compra = false;
    if (!q.ruta || !q.ruta.length) {
      const d = G.celdasCalle[Math.floor(Math.random() * G.celdasCalle.length)];
      if (Math.hypot(d[0] - q.x, d[1] - q.y) > 14) { q.parado = .5; continue; }
      q.ruta = ruta(Math.floor(q.x), Math.floor(q.y), d[0], d[1]); if (!q.ruta) { q.parado = 1; continue; }
      if (Math.random() < .4) q.parado = 1 + Math.random() * 3;
      continue;
    }
    let paso = 1.25 * dt; q.anda = true;
    while (paso > 0 && q.ruta.length) {
      const pt = q.ruta[0], dx = pt[0] - q.x, dy = pt[1] - q.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx - dy) > .02) q.dir = dx - dy > 0 ? 1 : -1;
      if (d <= paso) { q.x = pt[0]; q.y = pt[1]; q.ruta.shift(); paso -= d; } else { q.x += dx / d * paso; q.y += dy / d * paso; paso = 0; }
    }
  }
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
  for (const r of G.ruinas) r.v += dt;
  G.ruinas = G.ruinas.filter(function (r) { return r.v < 25; });
  if (G.ents.some(function (e) { return e.muerto; })) {
    G.ents = G.ents.filter(function (e) { if (e.muerto) G.porId.delete(e.id); return !e.muerto; });
    G.sel = G.sel.filter(function (e) { return !e.muerto; });
  }
  G.visT -= dt; if (G.visT <= 0) { G.visT = .2; calcVision(); }
  G.uiT -= dt; if (G.uiT <= 0) { G.uiT = .2; refrescarPanel(false); pintarMinimapa(); pintarRetrato(); }
}

/* ---------- Dibujo de la escena ---------- */
function pintar() {
  const t = G.t;
  cx.setTransform(DPR * Z, 0, 0, DPR * Z, 0, 0);
  cx.fillStyle = PAPEL; cx.fillRect(0, 0, W, H);
  cx.save();
  const ox = Math.round(G.cam.x), oy = Math.round(G.cam.y);
  cx.translate(-ox, -oy);
  const esc = Math.min(2, DPR * 1.5), TZ = 640;
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
    cx.fillStyle = G.expl[i] ? 'rgba(232,220,194,.56)' : PAPEL;
    cx.beginPath(); cx.moveTo(sx + ox, sy + oy - 1); cx.lineTo(sx + ox + 33, sy + oy + 16); cx.lineTo(sx + ox, sy + oy + 33); cx.lineTo(sx + ox - 33, sy + oy + 16); cx.closePath(); cx.fill();
  }
  // colocación de edificio
  if (G.modo && G.modo.t === 'construir' && raton.dentro) {
    const p = casilla(G.modo.k, raton.x, raton.y), ok = valido(G.modo.k, p.x, p.y);
    dibRombo(cx, p.x, p.y, DEF[G.modo.k].tam, ok ? '#7BD45A' : '#E24B4A', 3, ok ? 'rgba(123,212,90,.3)' : 'rgba(226,75,74,.3)');
  }
  for (const r of G.ruinas) { const i = Math.floor(r.y + r.tam / 2) * N + Math.floor(r.x + r.tam / 2); if (G.expl[i]) dibRuinas(cx, r, t); }
  // entidades ordenadas por profundidad
  const lista = [];
  for (const e of G.ents) { if (seVe(e)) { const c = centro(e); e._z = c.x + c.y; lista.push(e); } }
  for (const d of G.deco) { const i = Math.floor(d.y) * N + Math.floor(d.x); if (G.expl[i] && (d.k !== 'turista' || (G.vis[i] && d.n < Math.ceil(8 * d.plaza.cant / d.plaza.cantMax)))) { d._z = d.x + d.y; d._v = G.vis[i]; lista.push(d); } }
  for (const q of G.peat) { const i = Math.floor(q.y) * N + Math.floor(q.x); if (G.vis[i]) { q._z = q.x + q.y; lista.push(q); } }
  const unis = []; for (const e of lista) if (!e.deco && !e.d.tam) { const q = iso(e.x, e.y); unis.push([q[0], q[1] - 16, e.x + e.y]); }
  lista.sort(function (a, b) { return a._z - b._z; });
  for (const e of lista) {
    if (e.deco) { const p = iso(e.x, e.y); cx.save(); cx.translate(p[0], p[1]); if (e.dir < 0 && e.k !== 'farola') cx.scale(-1, 1); DIB[e.k](cx, e, t); cx.restore(); continue; }
    const sel = G.sel.indexOf(e) >= 0;
    if (e.d.tam) {
      if (sel) dibRombo(cx, e.x, e.y, e.d.tam, e.eq === 0 ? '#7BD45A' : e.eq === 1 ? '#E24B4A' : '#F2D16B', 3);
      const tenue = e.eq !== 0 && !visible(e);
      let alfa = 1;
      if (e.d.tipo !== 'r' && e.k !== 'plaza') {
        const r = rectEdificio(e), mx0 = r[0] + r[2] * .12, mx1 = r[0] + r[2] * .88;
        for (const q of unis) if (q[2] < e._z + .3 && q[0] > mx0 && q[0] < mx1 && q[1] > r[1] && q[1] < r[1] + r[3] * .85) { alfa = .38; break; }
      }
      cx.globalAlpha = alfa;
      if (e.obra < 1) { dibRombo(cx, e.x + .1, e.y + .1, e.d.tam - .2, '#F2D16B', 2, 'rgba(242,209,107,.15)'); cx.globalAlpha = .35 + .55 * e.obra; }
      if (e.flash > 0) cx.translate(2, 0);
      let hImg = 0;
      if (IMG[claveImagen(e)]) { cx.globalAlpha = alfa; hImg = dibEdificio(cx, e, t); }
      else if (e.k === 'contenedor') { const q = iso(e.x + .5, e.y + .5); cx.save(); cx.translate(q[0], q[1] + 4); cx.scale(1.7, 1.7); DIB.contenedor(cx, e, t); cx.restore(); hImg = 40; }
      else DIB[e.k](cx, e, t);
      if (e.flash > 0) cx.translate(-2, 0);
      cx.globalAlpha = 1;
      const bas = iso(e.x + e.d.tam, e.y + e.d.tam), top = [bas[0], bas[1]], alto = hImg ? hImg - 6 : (e.k === 'ayuntamiento' ? 100 : e.k === 'principal' ? 80 : 44) + e.d.tam * 32;
      if (e.d.tipo === 'e' && !tenue) {
        if (e.obra < 1) dibBarra(top[0], top[1] - alto + 16, 40, e.obra, '#F2D16B');
        else if (e.hp < e.hpMax || sel) dibVida(cx, top[0], top[1] - alto + 16, 12 * e.d.tam + 14, e.hp / e.hpMax, e.eq === 0);
        if (e.cola && e.cola.length && e.eq === 0) dibBarra(top[0], top[1] - alto + 24, 40, e.cola[0].p, '#6FB7D6');
      }
    } else {
      const p = iso(e.x, e.y);
      if (sel) dibHalo(cx, p[0], p[1], e.eq === 0 ? '#D9A521' : '#C8321E');
      cx.save(); cx.translate(p[0] + (e.flash > 0 ? 2 : 0), p[1]); cx.scale(e.dir, 1);
      DIB[e.k](cx, e, t);
      cx.restore();
      if (e.hp < e.hpMax || sel) dibVida(cx, p[0], p[1] - 47, 22, e.hp / e.hpMax, e.eq === 0);
      if (e.lento > 0) { cx.lineWidth = 1.5; elip(cx, p[0], p[1] - 56, 7, 4, '#F1E6CC'); circ(cx, p[0], p[1] - 56, 2.6, '#7B3FA0'); }
      if (e.calmado > 0) { cx.lineWidth = 2; for (let i = -1; i <= 1; i++) linea(cx, [p[0], p[1] - 50], [p[0] + i * 4, p[1] - 61 - Math.abs(i) * -2], '#5E8B4A'); circ(cx, p[0] + 4, p[1] - 58, 1.6, '#B9A6D6', false); }
    }
  }
  // efectos
  for (const f of G.fx) {
    const p = iso(f.x, f.y), k = f.v / f.dur;
    if (f.t === 'humo') { cx.globalAlpha = 1 - k; cx.lineWidth = 2; circ(cx, p[0], p[1] - 10 - k * 14, f.r * (.4 + k * .8), '#EDE7DC'); cx.globalAlpha = 1; }
    else if (f.t === 'txt') { cx.globalAlpha = 1 - k * k; cx.font = 'bold 14px sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = TINTA; cx.strokeText(f.txt, p[0], p[1] - 44 - k * 18); cx.fillStyle = f.col; cx.fillText(f.txt, p[0], p[1] - 44 - k * 18); cx.globalAlpha = 1; }
    else if (f.t === 'rayo') { const q = iso(f.x2, f.y2); cx.globalAlpha = 1 - k; cx.lineWidth = 3; cx.setLineDash([4, 5]); cx.beginPath(); cx.moveTo(p[0], p[1] - 22); cx.quadraticCurveTo((p[0] + q[0]) / 2, Math.min(p[1], q[1]) - 60, q[0], q[1] - 24); cx.strokeStyle = f.col; cx.stroke(); cx.setLineDash([]); cx.globalAlpha = 1; }
    else if (f.t === 'marca') { cx.globalAlpha = 1 - k; cx.lineWidth = 2.5; elip(cx, p[0], p[1], 16 * (1 - k * .6), 8 * (1 - k * .6), null, f.col); cx.globalAlpha = 1; }
    else if (f.t === 'multa') { if (G.vis[Math.floor(f.y) * N + Math.floor(f.x)]) dibMulta(cx, p[0], p[1] - 20, f.v * 14); }
  }
  if (G.sel.length === 1 && G.sel[0].eq === 0 && G.sel[0].rally) { const r = G.sel[0].rally, q = iso(r.x, r.y); dibBanderin(cx, q[0], q[1], t, .9); }
  cx.restore();
  // acabado de cartel litográfico: tono cálido, salpicado y viñeta
  cx.globalCompositeOperation = 'multiply'; cx.fillStyle = '#F7EBD2'; cx.fillRect(0, 0, W, H); cx.globalCompositeOperation = 'source-over';
  if (!G.grano) G.grano = cx.createPattern(crearGrano(), 'repeat');
  cx.fillStyle = G.grano; cx.fillRect(0, 0, W, H);
  const vg = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .45, W / 2, H / 2, Math.max(W, H) * .78);
  vg.addColorStop(0, 'rgba(70,40,10,0)'); vg.addColorStop(1, 'rgba(70,40,10,.3)');
  cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
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
      const txt = nombreDe(e) + (esChatarra(e) || e.k === 'plaza' ? ' (' + e.cant + ')' : '');
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
  mx.fillStyle = PAPEL; mx.fillRect(0, 0, 220, 116);
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
    mx.fillStyle = e.eq === 0 ? '#2F7D4F' : e.eq === 1 ? '#C8321E' : esChatarra(e) ? '#4A4F55' : e.k === 'plaza' ? '#3FA9E0' : '#8A7F76';
    mx.fillRect(px - s / 2, py - s / 2, s, s);
  }
  const k = MS / 32;
  if (G.ultAlerta && G.t - G.ultAlerta.t < 5) {
    const a = G.ultAlerta, px = (a.x - a.y) * MS + 110, py = (a.x + a.y) * MS * .5 + 3, r = 4 + ((G.t * 2) % 1) * 10;
    mx.strokeStyle = '#C8321E'; mx.lineWidth = 2; mx.beginPath(); mx.arc(px, py, r, 0, 6.3); mx.stroke();
  }
  mx.strokeStyle = '#2A1E14'; mx.lineWidth = 1.5;
  mx.strokeRect(G.cam.x * k + 110, G.cam.y * k + 3, W * k, H * k);
}

/* ---------- Panel e interfaz ---------- */
function propias() { return G.sel.filter(function (e) { return e.eq === 0 && e.d.tipo === 'u'; }); }
function acciones() {
  const r = [], us = propias();
  if (us.length) {
    if (us.some(function (u) { return u.k === 'chatarrero'; })) {
      ['chabola', 'chatarreria', 'taberna'].forEach(function (k) {
        r.push({ nombre: DEF[k].nombre.split(' ')[0], sub: textoCoste(DEF[k].coste), tecla: DEF[k].tecla, act: G.modo && G.modo.k === k, fn: function () { G.modo = { t: 'construir', k: k }; G.firma = '?'; } });
      });
    }
    if (us.some(function (u) { return u.d.dano; })) r.push({ nombre: 'Atacar', sub: 'Avanza atacando', tecla: 'A', act: G.modo && G.modo.t === 'atacar', fn: function () { G.modo = { t: 'atacar' }; G.firma = '?'; } });
    const vistos = {};
    us.forEach(function (u) {
      const h = u.d.hab; if (!h || vistos[h.id]) return; vistos[h.id] = 1;
      const delTipo = us.filter(function (x) { return x.k === u.k; }), listo = delTipo.some(function (x) { return !x.cdHab; });
      const espera = Math.ceil(Math.min.apply(null, delTipo.map(function (x) { return x.cdHab || 0; })));
      r.push({ nombre: h.nombre, sub: listo ? 'Elige a un enemigo' : 'Lista en ' + espera + ' s', tecla: h.tecla, act: G.modo && G.modo.h === h.id, fn: function () {
        if (!listo) { aviso('Todavía no: lista en ' + espera + ' segundos.', true); son('error'); return; }
        G.modo = { t: 'hab', h: h.id, k: u.k }; G.firma = '?';
      } });
    });
    r.push({ nombre: 'Parar', sub: 'Quietos ahí', tecla: 'S', fn: function () { us.forEach(function (u) { ordenar(u, { t: 'idle' }); }); } });
  } else if (G.sel.length === 1 && G.sel[0].eq === 0 && G.sel[0].d.tipo === 'e' && G.sel[0].obra < 1) {
    const b = G.sel[0];
    r.push({ nombre: 'Cancelar obra', sub: 'Recuperas el 75 %', tecla: 'X', fn: function () { cancelarObra(b); } });
  } else if (G.sel.length === 1 && G.sel[0].eq === 0 && G.sel[0].d.tipo === 'e' && G.sel[0].obra >= 1) {
    const b = G.sel[0];
    (b.d.produce || []).forEach(function (k) {
      r.push({ nombre: DEF[k].nombre.split(' ')[0], sub: textoCoste(DEF[k].coste), tecla: DEF[k].tecla, fn: function () { encolar(b, k); } });
    });
    if (b.k === 'principal' && (b.nivel || 0) < 2 && !b.cola.some(function (i) { return i.k === 'mejora'; })) {
      const nc = NIVEL_CASA[(b.nivel || 0) + 1];
      r.push({ nombre: 'Ampliar casa', sub: textoCoste(nc.coste), tecla: 'M', fn: function () { mejorar(b); } });
    }
    if (b.k === 'chabola' && (b.nivel || 0) < 2 && !b.cola.length) {
      const nv = NIVEL[(b.nivel || 0) + 1];
      r.push({ nombre: 'Mejorar a ' + nv.nombre, sub: textoCoste(nv.coste), tecla: 'M', fn: function () { mejorar(b); } });
    }
  }
  if (G.sel.length === 1 && G.sel[0].eq === 0 && G.sel[0].cola && G.sel[0].cola.length && G.sel[0].obra >= 1) {
    const b = G.sel[0];
    r.push({ nombre: 'Cancelar', sub: 'Quita el último encargo', tecla: 'X', fn: function () { cancelarCola(b); } });
  }
  return r;
}
function devolver(c, f) { G.dinero += Math.floor((c.d || 0) * f); G.chatarra += Math.floor((c.c || 0) * f); }
function cancelarObra(b) {
  devolver(b.d.coste, .75); matarSinRuinas(b); G.sel = []; son('orden'); aviso('Obra cancelada.'); G.firma = '?';
}
function matarSinRuinas(b) { b.obra = 0; matar(b); }
function cancelarCola(b) {
  const it = b.cola.pop(); if (!it) return;
  devolver(it.k === 'mejora' ? (b.k === 'principal' ? NIVEL_CASA : NIVEL)[(b.nivel || 0) + 1].coste : DEF[it.k].coste, 1);
  son('orden'); G.firma = '?';
}
function encolar(b, k) {
  const c = DEF[k].coste;
  if (b.cola.length >= 5) { aviso('La cola está llena.', true); son('error'); return; }
  if (popUso() >= popMax()) { aviso('No cabe más gente: construye o mejora chabolas.', true); son('error'); return; }
  if (!puede(c)) { falta(c); return; }
  pagar(c); b.cola.push({ k: k, p: 0, t: DEF[k].t }); son('sel'); G.firma = '?';
}
function mejorar(b) {
  const nv = (b.k === 'principal' ? NIVEL_CASA : NIVEL)[(b.nivel || 0) + 1];
  if (!puede(nv.coste)) { falta(nv.coste); return; }
  pagar(nv.coste); b.cola.push({ k: 'mejora', p: 0, t: nv.t }); son('sel'); G.firma = '?';
}
const rt = document.getElementById('retrato'), rx = rt.getContext('2d');
function pintarRetrato() {
  const e = G.sel[0];
  rt.style.display = e ? 'block' : 'none';
  if (!e) return;
  rx.setTransform(2, 0, 0, 2, 0, 0); rx.clearRect(0, 0, 96, 96);
  if (!e.d.tam && pintarRetratoImagen(rx, e)) return;
  medallonFondo(rx, 48, 48, 46);
  rx.save(); rx.beginPath(); rx.arc(48, 48, 37, 0, 6.2832); rx.clip();
  const ki = e.d.tam ? claveImagen(e) : null;
  if (ki && IMG[ki]) {
    const im = IMG[ki], s = Math.min(64 / im.width, 66 / im.height);
    rx.drawImage(im, 48 - im.width * s / 2, 50 - im.height * s / 2, im.width * s, im.height * s);
  } else if (e.d.tam) {
    const s = Math.min(1.1, 62 / (e.d.tam * 64)), alto = e.k === 'ayuntamiento' ? 110 : e.k === 'principal' ? 70 : e.k === 'bloque' ? e.alto : 36;
    rx.translate(48, 52 + alto * s * .5 - e.d.tam * 16 * s); rx.scale(s, s);
    DIB[e.k](rx, Object.assign({}, e, { x: 0, y: 0 }), G.t);
  } else {
    rx.translate(44, 104); rx.scale(2.5, 2.5);
    DIB[e.k](rx, { id: e.id, anda: false, trabaja: false, carga: 0, golpeT: 0 }, G.t);
  }
  rx.restore();
  medallonAro(rx, 48, 48, 46);
}
let accAct = [];
function refrescarPanel(forzar) {
  document.getElementById('r-din').textContent = Math.floor(G.dinero);
  document.getElementById('r-cha').textContent = Math.floor(G.chatarra);
  document.getElementById('r-pob').textContent = popUso() + '/' + popMax();
  const m = Math.floor(G.t / 60), s = Math.floor(G.t % 60);
  document.getElementById('reloj').textContent = m + ':' + (s < 10 ? '0' : '') + s;
  cv.classList.toggle('apuntar', !!G.modo);
  const firma = G.sel.map(function (e) { return e.id + ':' + (e.nivel || 0) + ':' + (e.obra >= 1 ? 1 : 0) + ':' + (e.cola ? e.cola.length : 0); }).join(',') + '|' + (G.modo ? G.modo.t + (G.modo.k || '') : '') + '|' + G.sel.map(function (e) { return Math.ceil(e.cdHab || 0); }).join(',');
  if (forzar || firma !== G.firma) {
    G.firma = firma; accAct = acciones();
    elOrd.innerHTML = accAct.map(function (a, i) { return '<button type="button" data-i="' + i + '"' + (a.act ? ' class="act"' : '') + '><b>' + a.nombre + '</b><small>' + a.sub + '</small><kbd>' + a.tecla + '</kbd></button>'; }).join('');
  }
  let h = '';
  if (!G.sel.length) h = '<h2>Asentamiento</h2><p>Selecciona con clic izquierdo; ordena con clic derecho.</p><p>Chatarreros a los montones, echadoras a la plaza de la fuente.</p>';
  else if (G.sel.length === 1) {
    const e = G.sel[0];
    h = '<h2>' + nombreDe(e) + (e.k === 'chabola' ? ' de ' + NIVEL[e.nivel || 0].nombre : '') + '</h2>';
    if (e.d.tipo === 'u' || e.d.tipo === 'e') h += '<div class="vida"><i style="width:' + Math.max(0, 100 * e.hp / e.hpMax) + '%"></i></div>';
    if (esChatarra(e)) h += '<p>Chatarra restante: ' + e.cant + '</p>';
    if (e.k === 'principal') h += '<p>Casa ' + NIVEL_CASA[e.nivel || 0].nombre + ': sitio para ' + NIVEL_CASA[e.nivel || 0].pop + ' personas.</p>';
    if (e.k === 'plaza') h += e.cant > 0 ? '<p>Dinero que aún sueltan los turistas: ' + e.cant + '</p>' : '<p>Los turistas se han ido.</p>';
    if (e.obra < 1) h += '<p>En obras: ' + Math.floor(e.obra * 100) + ' %</p>';
    else if (e.k === 'chabola') h += '<p>Sitio para ' + NIVEL[e.nivel || 0].pop + ' personas.</p>';
    if (e.d.desc) h += '<p>' + e.d.desc + '</p>';
    if (e.eq === 0 && e.d.hab) h += '<p><b>' + e.d.hab.nombre + ' (' + e.d.hab.tecla + '):</b> ' + e.d.hab.desc + '</p>';
    if (e.eq === 0 && e.d.produce) h += '<p>Clic derecho en el mapa: punto de reunión.</p>';
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
function lanzarHab(sx, sy) {
  const e = entEn(sx, sy), k = G.modo.k;
  if (!e || e.eq !== 1 || e.d.tipo !== 'u') { aviso('Elige a una unidad del Ayuntamiento.', true); son('error'); return; }
  let mejor = null, md = 1e9;
  propias().forEach(function (u) { if (u.k !== k || u.cdHab) return; const d = Math.hypot(u.x - e.x, u.y - e.y); if (d < md) { md = d; mejor = u; } });
  if (!mejor) { aviso('Nadie la tiene lista todavía.', true); son('error'); return; }
  const prev = mejor.orden && (mejor.orden.t === 'ganar' || mejor.orden.t === 'vender') ? mejor.orden : null;
  ordenar(mejor, { t: 'hab', obj: e.id, luego: prev }); son('orden');
  G.fx.push({ t: 'marca', x: e.x, y: e.y, v: 0, dur: .5, col: '#9B5BC0' });
}
function ordenInteligente(sx, sy, atacando) {
  const us = propias();
  if (!us.length) {
    const b = G.sel.length === 1 ? G.sel[0] : null;
    if (b && b.eq === 0 && b.d.produce && b.obra >= 1) {
      const e = entEn(sx, sy), w = mundo(sx, sy);
      b.rally = e && (esChatarra(e) || e.k === 'plaza') ? { x: centro(e).x, y: centro(e).y, obj: e.id } : { x: w.x, y: w.y };
      G.fx.push({ t: 'marca', x: b.rally.x, y: b.rally.y, v: 0, dur: .6, col: '#D9A521' }); son('orden');
      aviso('Punto de reunión fijado.');
    }
    return;
  }
  const e = entEn(sx, sy), w = mundo(sx, sy);
  let n = 0, hecho = false;
  us.forEach(function (u) {
    if (e && e.eq === 1 && u.d.dano) { ordenar(u, { t: 'atacar', obj: e.id }); hecho = true; }
    else if (e && esChatarra(e) && u.k === 'chatarrero') { ordenar(u, { t: 'recoger', obj: e.id }); hecho = true; }
    else if (u.k === 'romero' && enCiudad(w.x, w.y) && !(e && e.eq === 1)) { ordenar(u, { t: 'vender', x: w.x, y: w.y }); hecho = false; }
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
  pintarRetrato();
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
  if (ev.pointerType === 'mouse' && ev.button === 1) { ev.preventDefault(); try { cv.setPointerCapture(ev.pointerId); } catch (e) { } G.arrastre = { x0: p.x, y0: p.y, cx: G.cam.x, cy: G.cam.y, caja: false, movido: true, tactil: true, camara: true }; return; }
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
  const a = G.arrastre; G.arrastre = null; if (!a || a.camara) return;
  const p = pos(ev);
  if (a.caja) {
    const x0 = Math.min(a.x0, p.x), x1 = Math.max(a.x0, p.x), y0 = Math.min(a.y0, p.y), y1 = Math.max(a.y0, p.y);
    const l = G.ents.filter(function (e) { if (e.eq !== 0 || e.d.tipo !== 'u') return false; const q = enPantalla(e.x, e.y); return q.x >= x0 && q.x <= x1 && q.y - 14 >= y0 && q.y - 14 <= y1; });
    seleccionar(l, a.mayus); return;
  }
  if (a.movido) return;
  if (G.modo) {
    if (G.modo.t === 'construir') colocar(p.x, p.y);
    else if (G.modo.t === 'hab') { lanzarHab(p.x, p.y); G.modo = null; G.firma = '?'; }
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
  if (ev.key === ' ') {
    if (G.ultAlerta && G.t - G.ultAlerta.t < 10 && !G.yaAlerta) { centrar(G.ultAlerta.x, G.ultAlerta.y); G.yaAlerta = true; return; }
    G.yaAlerta = false; const b = G.ents.find(function (e) { return e.k === 'principal' && e.eq === 0; }); if (b) centrar(b.x + 1.5, b.y + 1.5); return;
  }
  if (ev.key === 'F1') {
    ev.preventDefault();
    const ociosos = G.ents.filter(function (e) { return e.eq === 0 && (e.k === 'chatarrero' || e.k === 'echadora' || e.k === 'romero') && e.orden.t === 'idle'; });
    if (!ociosos.length) { aviso('No hay trabajadores parados.'); return; }
    if (ev.ctrlKey || ev.shiftKey) { seleccionar(ociosos, false); return; }
    G.ociosoI = ((G.ociosoI || 0) + 1) % ociosos.length; const u = ociosos[G.ociosoI]; seleccionar([u], false); centrar(u.x, u.y); return;
  }
  if (ev.key === '+' || ev.key === '=' || ev.key === '-') { zoomA(Z * (ev.key === '-' ? 1 / 1.2 : 1.2), window.innerWidth / 2, window.innerHeight / 2); return; }
  if (ev.key === 'F2') {
    ev.preventDefault();
    seleccionar(G.ents.filter(function (e) { return e.eq === 0 && e.d.tipo === 'u' && e.d.dano && e.k !== 'chatarrero'; }), false); return;
  }
  if (/^Digit[1-9]$/.test(ev.code)) {
    const n = ev.code.slice(5);
    if (ev.ctrlKey || ev.metaKey) { G.grupos[n] = propias().map(function (e) { return e.id; }); ev.preventDefault(); aviso('Grupo ' + n + ' guardado.'); }
    else if (ev.shiftKey) { const g = G.grupos[n] || []; propias().forEach(function (e) { if (g.indexOf(e.id) < 0) g.push(e.id); }); G.grupos[n] = g; aviso('Añadidos al grupo ' + n + '.'); }
    else if (G.grupos[n]) {
      const l = G.grupos[n].map(ent).filter(Boolean), ahora = performance.now();
      if (G.ultGrupo && G.ultGrupo.n === n && ahora - G.ultGrupo.t < 350 && l.length) centrar(l[0].x, l[0].y);
      G.ultGrupo = { n: n, t: ahora }; seleccionar(l, false);
    }
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
  if (!medir.hecho) { Z = window.innerWidth < 760 ? 1 : 1.5; medir.hecho = true; }
  W = window.innerWidth / Z; H = window.innerHeight / Z;
  cv.width = Math.round(window.innerWidth * DPR); cv.height = Math.round(window.innerHeight * DPR);
  if (G) ajustarCam();
}
window.addEventListener('resize', medir);
const ZMIN = .55, ZMAX = 2.4;
function zoomA(nz, sx, sy) {
  if (!G) return;
  nz = Math.max(ZMIN, Math.min(ZMAX, nz));
  if (Math.abs(nz - Z) < .001) return;
  const wb = mundo(sx / Z, sy / Z);
  Z = nz; W = window.innerWidth / Z; H = window.innerHeight / Z;
  G.cam.x = (wb.x - wb.y) * 32 - sx / Z; G.cam.y = (wb.x + wb.y) * 16 - sy / Z;
  ajustarCam();
}
cv.addEventListener('wheel', function (ev) {
  ev.preventDefault();
  const r = cv.getBoundingClientRect();
  zoomA(Z * Math.exp(-ev.deltaY * .0015), ev.clientX - r.left, ev.clientY - r.top);
}, { passive: false });
const dedos = new Map();
cv.addEventListener('pointerdown', function (ev) {
  if (ev.pointerType !== 'touch') return;
  dedos.set(ev.pointerId, [ev.clientX, ev.clientY]);
  if (dedos.size === 2 && G) { const p = Array.from(dedos.values()); G.pinza = { d0: Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]), z0: Z }; G.arrastre = null; }
});
cv.addEventListener('pointermove', function (ev) {
  if (!dedos.has(ev.pointerId)) return;
  dedos.set(ev.pointerId, [ev.clientX, ev.clientY]);
  if (G && G.pinza && dedos.size === 2) { const p = Array.from(dedos.values()), r = cv.getBoundingClientRect(); zoomA(G.pinza.z0 * Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]) / G.pinza.d0, (p[0][0] + p[1][0]) / 2 - r.left, (p[0][1] + p[1][1]) / 2 - r.top); G.arrastre = null; }
});
['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function (ev) { dedos.delete(ev.pointerId); if (G && dedos.size < 2) G.pinza = null; }); });
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
