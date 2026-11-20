'use strict';
/* Asentamiento — relieve (v0.8): mesetas, rampas, caminos, sombras de nubes y palomas.
   G.alt por casilla: 0 llano, 1 meseta (16 px más alta), 2 rampa. */
const ALTO = 22;
T_BASE.push(['#C39563', '#BB8D5B', '#CA9C6A'], ['#B98E5E', '#B28757', '#BE9363'], ['#D9BE8A', '#D2B682', '#DEC491']);
const MESETAS = [
  { x0: 15, y0: 23, x1: 20, y1: 28, rampa: [[17, 29], [18, 29]] },
  { x0: 42, y0: 21, x1: 46, y1: 27, rampa: [[41, 24], [41, 25]] },
  { x0: 2, y0: 7, x1: 6, y1: 12, rampa: [[7, 9], [7, 10]] },
  { x0: 27, y0: 39, x1: 33, y1: 44, rampa: [[29, 38], [30, 38]] }
];
function generarRelieve(G) {
  G.alt = new Uint8Array(N * N);
  for (const m of MESETAS) {
    for (let y = m.y0; y <= m.y1; y++) for (let x = m.x0; x <= m.x1; x++) { G.alt[y * N + x] = 1; G.tiles[y * N + x] = 4; }
    for (const r of m.rampa) { G.alt[r[1] * N + r[0]] = 2; G.tiles[r[1] * N + r[0]] = 5; }
  }
  // camino de tierra del asentamiento a la ciudad
  const pts = [[12, 36], [16, 32], [21, 29], [24, 27], [27, 22], [29, 18]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2);
    for (let k = 0; k <= n; k++) {
      const x = Math.round(a[0] + (b[0] - a[0]) * k / n), y = Math.round(a[1] + (b[1] - a[1]) * k / n);
      for (const d of [[0, 0], [1, 0]]) { const j = (y + d[1]) * N + x + d[0]; if (G.tiles[j] <= 1 && !G.alt[j]) G.tiles[j] = 6; }
    }
  }
}
function altC(x, y) { if (x < 0 || y < 0 || x >= N || y >= N) return 0; return G.alt[y * N + x]; }
/* Altura de una esquina de rampa: alta si toca alguna casilla de meseta */
function hEsquina(cx, cy) {
  return (altC(cx - 1, cy - 1) === 1 || altC(cx, cy - 1) === 1 || altC(cx - 1, cy) === 1 || altC(cx, cy) === 1) ? ALTO : 0;
}
function alturaEn(x, y) {
  if (!G || !G.alt) return 0;
  const cx = Math.floor(x), cy = Math.floor(y), a = altC(cx, cy);
  if (a === 0) return 0;
  if (a === 1) return ALTO;
  const fx = x - cx, fy = y - cy;
  const h00 = hEsquina(cx, cy), h10 = hEsquina(cx + 1, cy), h01 = hEsquina(cx, cy + 1), h11 = hEsquina(cx + 1, cy + 1);
  return h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
}
function nivelVista(x, y) { const a = altC(Math.floor(x), Math.floor(y)); return a ? 1 : 0; }
/* ¿Se puede pasar entre dos casillas vecinas? */
function paso(x0, y0, x1, y1) { const a = altC(x0, y0), b = altC(x1, y1); return a === b || a === 2 || b === 2; }

function isoH(x, y, h) { return iso(x, y, h); }
function dibCaraRoca(c, A, B, hA, hB, bA, bB, clara) {
  const pA = iso(A[0], A[1], hA), pB = iso(B[0], B[1], hB), qB = iso(B[0], B[1], bB), qA = iso(A[0], A[1], bA);
  c.lineWidth = 1.5;
  poli(c, [pA, pB, qB, qA], clara ? '#A97B4F' : '#8A6340');
  c.lineWidth = 1;
  for (let k = 1; k < 4; k++) {
    const f = k / 4;
    linea(c, [pA[0], pA[1] + (qA[1] - pA[1]) * f + (k === 2 ? -1.5 : 1)], [pB[0], pB[1] + (qB[1] - pB[1]) * f + (k === 1 ? 1.5 : 0)], clara ? '#8E643E' : '#6E4E31');
  }
  // piedras en el cantil
  for (let k = 0; k < 3; k++) {
    const u = (k + .5 + azar(A[0] * 7 + k, A[1] * 3) * .4 - .2) / 3, v = .35 + azar(A[1] * 5, A[0] + k) * .45;
    const x = pA[0] + (pB[0] - pA[0]) * u, y = pA[1] + (pB[1] - pA[1]) * u + ((qA[1] - pA[1]) * (1 - u) + (qB[1] - pB[1]) * u) * v;
    elip(c, x, y, 3.2, 2, clara ? '#C29468' : '#9E7650', TINTA);
  }
  linea(c, pA, pB, '#D9B07A');
}
function dibCasillaRel(c, x, y) {
  const a = G.alt[y * N + x];
  if (a === 0) { dibCasilla(c, G.tiles, N, x, y); return; }
  if (a === 1) {
    c.save(); c.translate(0, -ALTO); dibCasilla(c, G.tiles, N, x, y);
    const p = iso(x + .5, y + .5), r = azar(x * 5, y * 3);
    if (r > .82) { c.lineWidth = 1.2; elip(c, p[0] - 4, p[1] + 2, 6, 3.4, '#A39B8E', '#6E665A'); elip(c, p[0] + 3, p[1] + 3, 3.4, 2, '#B5AD9F', '#6E665A'); }
    else if (r > .72) { // chumbera
      c.lineWidth = 1.2; elip(c, p[0], p[1] - 6, 4, 6, '#6F9058'); elip(c, p[0] - 5, p[1] - 11, 3, 4.5, '#7FA266'); elip(c, p[0] + 5, p[1] - 12, 3, 4.5, '#7FA266');
      circ(c, p[0] - 5, p[1] - 16, 1.4, '#D0392B', false); circ(c, p[0] + 5, p[1] - 17, 1.4, '#E0A63A', false);
    }
    c.restore();
    if (altC(x, y + 1) !== 1) {
      const b = altC(x, y + 1) === 2 ? [hEsquina(x, y + 1), hEsquina(x + 1, y + 1)] : [0, 0];
      if (b[0] < ALTO || b[1] < ALTO) dibCaraRoca(c, [x, y + 1], [x + 1, y + 1], ALTO, ALTO, b[0], b[1], true);
    }
    if (altC(x + 1, y) !== 1) {
      const b = altC(x + 1, y) === 2 ? [hEsquina(x + 1, y), hEsquina(x + 1, y + 1)] : [0, 0];
      if (b[0] < ALTO || b[1] < ALTO) dibCaraRoca(c, [x + 1, y], [x + 1, y + 1], ALTO, ALTO, b[0], b[1], false);
    }
    return;
  }
  // rampa
  const h00 = hEsquina(x, y), h10 = hEsquina(x + 1, y), h01 = hEsquina(x, y + 1), h11 = hEsquina(x + 1, y + 1);
  const P = [iso(x, y, h00), iso(x + 1, y, h10), iso(x + 1, y + 1, h11), iso(x, y + 1, h01)];
  c.lineWidth = 1;
  poli(c, P, '#C9A56E', '#C9A56E');
  c.lineWidth = 1;
  for (let k = 1; k < 5; k++) {
    const f = k / 5;
    const A = h00 !== h10 ? iso(x + f, y, h00 + (h10 - h00) * f) : iso(x, y + f, h00 + (h01 - h00) * f);
    const B = h00 !== h10 ? iso(x + f, y + 1, h01 + (h11 - h01) * f) : iso(x + 1, y + f, h10 + (h11 - h10) * f);
    linea(c, A, B, '#A9834C');
  }
  // laterales de la rampa
  if (altC(x, y + 1) === 0 && (h01 || h11)) dibCaraRoca(c, [x, y + 1], [x + 1, y + 1], h01, h11, 0, 0, true);
  if (altC(x + 1, y) === 0 && (h10 || h11)) dibCaraRoca(c, [x + 1, y], [x + 1, y + 1], h10, h11, 0, 0, false);
}
/* Sustituye al pintado del terreno: recorre en diagonal para que los cantiles tapen bien */
pintarTrozo = function (tiles, NN, x0, y0, tam, esc) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = Math.ceil((tam + 2) * esc);
  const c = cv.getContext('2d');
  c.fillStyle = PAPEL; c.fillRect(0, 0, cv.width, cv.height);
  c.scale(esc, esc); c.translate(-x0, -y0);
  c.lineJoin = 'round';
  for (let s = 0; s <= 2 * (N - 1); s++) for (let x = Math.max(0, s - N + 1); x <= Math.min(N - 1, s); x++) {
    const y = s - x, px = (x - y) * 32, py = (x + y) * 16;
    if (px < x0 - 48 || px > x0 + tam + 48 || py < y0 - 48 || py > y0 + tam + 40) continue;
    dibCasillaRel(c, x, y);
  }
  c.lineWidth = 3;
  poli(c, [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)], null, TINTA);
  return cv;
};

/* Sombras de nubes que cruzan el mapa */
function dibNubes(c, t, cam, W, H) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 4; i++) {
    const vx = 14 + i * 3, ox = ((t * vx + i * 900) % (N * 64 + 1200)) - N * 32 - 600, oy = (i * 397) % (N * 32) + Math.sin(t * .05 + i) * 40;
    const g = c.createRadialGradient(ox, oy, 20, ox, oy, 260 + i * 40);
    g.addColorStop(0, 'rgba(120,100,80,.16)'); g.addColorStop(1, 'rgba(120,100,80,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(ox, oy, 300 + i * 40, 150 + i * 20, 0, 0, 6.3); c.fill();
  }
  c.restore();
}

/* Palomas de las plazas: picotean y salen volando si alguien se acerca */
DIB.paloma = function (c, e, t) {
  if (e.vuelo > 0) {
    const f = 1 - e.vuelo / 2.5, a = Math.sin(t * 30) * 4;
    c.globalAlpha = Math.max(0, 1 - f * 1.4);
    c.translate(f * 40, -f * 70);
    c.lineWidth = 1.2; c.fillStyle = '#9AA0A8'; c.strokeStyle = TINTA;
    c.beginPath(); c.ellipse(0, -4, 4, 2.4, 0, 0, 6.3); c.fill(); c.stroke();
    poli(c, [[-1, -5], [-6, -10 - a], [2, -6]], '#B5BBC2'); poli(c, [[1, -5], [6, -10 + a], [3, -4]], '#8A9098');
    c.globalAlpha = 1; return;
  }
  const pic = Math.sin(t * 6 + e.id * 1.7) > .55;
  c.lineWidth = 1.1; elip(c, 0, 0, 4, 1.5, 'rgba(30,18,8,.2)', false);
  c.fillStyle = '#9AA0A8'; c.strokeStyle = TINTA;
  c.beginPath(); c.ellipse(0, -3.5, 4.2, 2.8, 0, 0, 6.3); c.fill(); c.stroke();
  poli(c, [[-3, -4], [-7, -3], [-3, -2]], '#7A8088');
  const hx = pic ? 4.5 : 3.5, hy = pic ? -2.2 : -6.5;
  circ(c, hx, hy, 1.9, '#6E7B86'); c.fillStyle = '#E0A63A'; c.fillRect(hx + 1.5, hy - .3, 1.6, .9);
  c.fillStyle = '#5E9C8A'; c.fillRect(hx - 1.6, hy + 1.2, 2, 1);
  linea(c, [-.5, -1], [-.5, 0], '#C96B4C'); linea(c, [1, -1], [1, 0], '#C96B4C');
};
function actualizarPalomas(dt) {
  for (const d of G.deco) {
    if (d.k !== 'paloma') continue;
    if (d.vuelo > 0) { d.vuelo -= dt; if (d.vuelo <= 0) d.vuelta = 6 + Math.random() * 8; continue; }
    if (d.vuelta > 0) { d.vuelta -= dt; d.oculta = true; continue; }
    d.oculta = false;
    for (const e of G.ents) if (e.d.tipo === 'u' && e.anda && Math.hypot(e.x - d.x, e.y - d.y) < 1.4) { d.vuelo = 2.5; break; }
  }
}
