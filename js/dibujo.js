'use strict';
/* Asentamiento — dibujo vectorial por código (estilo cómic), v0.2 */
const TINTA = '#2A1E14', PAPEL = '#E8DCC2';

function iso(x, y, z) { return [(x - y) * 32, (x + y) * 16 - (z || 0)]; }

function poli(c, pts, relleno, borde) {
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]);
  }
  c.closePath();
  if (relleno) { c.fillStyle = relleno; c.fill(); }
  if (borde !== false) { c.strokeStyle = borde || TINTA; c.stroke(); }
}
function linea(c, a, b, col, w) {
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
  c.strokeStyle = col || TINTA; if (w) c.lineWidth = w; c.stroke();
}
function circ(c, x, y, r, relleno, borde) {
  c.beginPath(); c.arc(x, y, r, 0, 6.2832);
  if (relleno) { c.fillStyle = relleno; c.fill(); }
  if (borde !== false) { c.strokeStyle = borde || TINTA; c.stroke(); }
}
function elip(c, x, y, rx, ry, relleno, borde) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832);
  if (relleno) { c.fillStyle = relleno; c.fill(); }
  if (borde !== false) { c.strokeStyle = borde || TINTA; c.stroke(); }
}
function azar(x, y) { let h = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h % 10000) / 10000; }

/* Caja isométrica: caras visibles izquierda (y = y1) y derecha (x = x1) */
function Caja(x0, y0, x1, y1, h, z0) {
  z0 = z0 || 0;
  return {
    h: h, x0: x0, y0: y0, x1: x1, y1: y1, z0: z0,
    izq: function (u, z) { return iso(x0 + u * (x1 - x0), y1, z0 + z); },
    der: function (u, z) { return iso(x1, y1 - u * (y1 - y0), z0 + z); },
    sup: function (u, v) { return iso(x0 + u * (x1 - x0), y0 + v * (y1 - y0), z0 + h); }
  };
}
function dibCaja(c, k, cSup, cIzq, cDer) {
  poli(c, [k.izq(0, 0), k.izq(1, 0), k.izq(1, k.h), k.izq(0, k.h)], cIzq);
  poli(c, [k.der(0, 0), k.der(1, 0), k.der(1, k.h), k.der(0, k.h)], cDer);
  poli(c, [k.sup(0, 0), k.sup(1, 0), k.sup(1, 1), k.sup(0, 1)], cSup);
}
function sombra(c, x0, y0, x1, y1, h) {
  const sx = h * .5, sy = h * .1, L = iso(x0, y1), B = iso(x1, y1), R = iso(x1, y0), T = iso(x0, y0);
  poli(c, [L, B, [B[0] + sx, B[1] + sy], [R[0] + sx, R[1] + sy], [T[0] + sx, T[1] + sy], T], 'rgba(30,18,8,.2)', false);
}
function panel(c, f, u0, u1, z0, z1, col, borde) {
  poli(c, [f(u0, z0), f(u1, z0), f(u1, z1), f(u0, z1)], col, borde);
}
function rayas(c, f, n, z0, z1, col, u0, u1) {
  u0 = u0 || 0; u1 = u1 === undefined ? 1 : u1;
  c.lineWidth = 1;
  for (let i = 1; i < n; i++) { const u = u0 + (u1 - u0) * i / n; linea(c, f(u, z0), f(u, z1), col); }
  c.lineWidth = 2;
}
function ladrillos(c, f, h, col) {
  c.lineWidth = 1;
  let fila = 0;
  for (let z = 5; z < h; z += 5, fila++) {
    linea(c, f(0, z), f(1, z), col);
    for (let i = 0; i < 6; i++) { const u = (i + (fila % 2 ? .5 : 0)) / 6; if (u > .02 && u < .98) linea(c, f(u, z - 5), f(u, z), col); }
  }
  c.lineWidth = 2;
}
function brillo(c, f, h) { c.lineWidth = 1.5; linea(c, f(.03, h - 2), f(.97, h - 2), 'rgba(255,255,255,.4)'); c.lineWidth = 2; }
function mugre(c, f) { panel(c, f, 0, 1, 0, 3.5, 'rgba(70,45,20,.3)', false); }
function ventana(c, f, u0, u1, z0, z1, vid, marco) {
  c.lineWidth = 1.5;
  panel(c, f, u0, u1, z0, z1, marco || '#F4EFE4');
  const du = (u1 - u0) * .15, dz = (z1 - z0) * .15;
  c.lineWidth = 1;
  panel(c, f, u0 + du, u1 - du, z0 + dz, z1 - dz, vid || '#8FC3DD');
  poli(c, [f(u0 + du, z1 - dz), f(u0 + du + (u1 - u0) * .32, z1 - dz), f(u0 + du, z0 + dz + (z1 - z0) * .25)], 'rgba(255,255,255,.5)', false);
  linea(c, f((u0 + u1) / 2, z0 + dz), f((u0 + u1) / 2, z1 - dz), TINTA);
  c.lineWidth = 2;
  linea(c, f(u0 - .02, z0), f(u1 + .02, z0), TINTA);
}
function puerta(c, f, u0, u1, h, col) {
  c.lineWidth = 2;
  panel(c, f, u0, u1, 0, h, col);
  c.lineWidth = 1;
  const du = (u1 - u0) * .18;
  panel(c, f, u0 + du, u1 - du, h * .55, h * .9, 'rgba(0,0,0,.2)');
  panel(c, f, u0 + du, u1 - du, h * .1, h * .45, 'rgba(0,0,0,.2)');
  const k = f(u1 - du * .8, h * .5); circ(c, k[0], k[1], 1.3, '#F2D16B');
  c.lineWidth = 2;
}
function arco(c, f, uc, ru, z0, zc, rz, col) {
  const pts = [f(uc - ru, z0), f(uc + ru, z0)];
  for (let a = 0; a <= 8; a++) { const an = Math.PI * a / 8; pts.push(f(uc + Math.cos(an) * ru, zc + Math.sin(an) * rz)); }
  poli(c, pts, col);
}
function humo(c, x, y, t, n) {
  for (let i = 0; i < 3; i++) {
    const f = ((t * .45 + i / 3 + n) % 1), ga = c.globalAlpha;
    c.globalAlpha = ga * (1 - f) * .65;
    circ(c, x + Math.sin(f * 5 + i) * 4, y - f * 28, 2.5 + f * 5.5, '#F1ECE2', false);
    c.globalAlpha = ga;
  }
}
function neumatico(c, p, r) { elip(c, p[0], p[1], r, r * .5, '#26221F'); elip(c, p[0], p[1], r * .45, r * .22, '#6B6259'); }

const DIB = {};

/* ---------- Edificios ---------- */
DIB.chabola = function (c, e, t) {
  const x = e.x, y = e.y, n = e.nivel || 0;
  c.lineWidth = 2; c.lineJoin = 'round';
  const h = [24, 29, 36][n];
  sombra(c, x + .25, y + .25, x + 1.75, y + 1.75, h);
  const k = Caja(x + .25, y + .25, x + 1.75, y + 1.75, h);
  if (n === 0) {
    dibCaja(c, k, '#4F8FB8', '#CFA467', '#B08548');
    c.lineWidth = 1;
    linea(c, k.izq(.5, 0), k.izq(.5, h), '#8E6A38'); linea(c, k.der(.5, 0), k.der(.5, h), '#7A5A2E');
    linea(c, k.izq(0, h * .55), k.izq(1, h * .55), '#8E6A38');
    c.lineWidth = 2;
    panel(c, k.izq, .44, .56, 0, h, '#E9D3A0', false);
    panel(c, k.der, .08, .92, 9, 13, '#E9D3A0', false);
    // flechas de «frágil»
    c.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { const a = k.der(.62 + i * .14, 15), b = k.der(.62 + i * .14, 21); linea(c, a, b, '#8A3B22'); linea(c, b, [b[0] - 2.5, b[1] + 3], '#8A3B22'); linea(c, b, [b[0] + 2.5, b[1] + 2], '#8A3B22'); }
    c.lineWidth = 2;
    // cortina en vez de puerta
    panel(c, k.izq, .1, .38, 0, 18, '#C0392B');
    rayas(c, k.izq, 4, 0, 18, '#F2EDE4', .1, .38);
    mugre(c, k.izq); mugre(c, k.der); brillo(c, k.izq, h);
    // lona con vuelo
    poli(c, [k.sup(-.07, -.07), k.sup(1.07, -.07), k.sup(1.07, 1.07), k.sup(-.07, 1.07)], '#4F8FB8');
    poli(c, [k.sup(-.07, 1.07), k.sup(1.07, 1.07), iso(k.x1 + .1, k.y1 + .1, h - 5), iso(k.x0 - .1, k.y1 + .1, h - 5)], '#3C7499');
    poli(c, [k.sup(1.07, 1.07), k.sup(1.07, -.07), iso(k.x1 + .1, k.y0 - .1, h - 5), iso(k.x1 + .1, k.y1 + .1, h - 5)], '#33678A');
    c.lineWidth = 1;
    linea(c, k.sup(.02, .5), k.sup(.98, .5), '#2F5F80'); linea(c, k.sup(.5, .02), k.sup(.5, .98), '#2F5F80');
    poli(c, [k.sup(.1, .1), k.sup(.4, .1), k.sup(.4, .35), k.sup(.1, .35)], 'rgba(255,255,255,.18)', false);
    c.lineWidth = 1.5;
    neumatico(c, k.sup(.72, .3), 7);
    const b = k.sup(.25, .72); poli(c, [[b[0] - 5, b[1]], [b[0], b[1] - 3], [b[0] + 5, b[1]], [b[0], b[1] + 3]], '#B5532A');
    // cubo
    const q = iso(x + 1.95, y + 1.35); c.lineWidth = 1.5;
    poli(c, [[q[0] - 4, q[1] - 8], [q[0] + 4, q[1] - 8], [q[0] + 3, q[1]], [q[0] - 3, q[1]]], '#D0392B'); elip(c, q[0], q[1] - 8, 4, 1.6, '#7FB8D8');
  } else if (n === 1) {
    dibCaja(c, k, '#8C9A8A', '#A9B2AE', '#858F8B');
    rayas(c, k.izq, 12, 0, h, '#7A8480'); rayas(c, k.der, 12, 0, h, '#69736F');
    panel(c, k.der, 0, .3, 0, h, '#B5532A'); rayas(c, k.der, 4, 0, h, '#8F3F1E', 0, .3);
    puerta(c, k.izq, .1, .4, 20, '#7A5230');
    ventana(c, k.izq, .58, .88, 11, 22, '#F2D16B', '#6B5B4B');
    ventana(c, k.der, .5, .82, 11, 22, '#8FC3DD', '#6B5B4B');
    mugre(c, k.izq); mugre(c, k.der); brillo(c, k.izq, h);
    poli(c, [k.sup(-.05, -.05), k.sup(1.05, -.05), k.sup(1.05, 1.05), k.sup(-.05, 1.05)], '#93A291');
    c.lineWidth = 1;
    for (let i = 1; i < 10; i++) linea(c, k.sup(i / 10, -.05), k.sup(i / 10, 1.05), i % 2 ? '#6F7D6E' : '#B4C1B2');
    c.lineWidth = 1.5;
    neumatico(c, k.sup(.3, .3), 8); neumatico(c, k.sup(.75, .7), 7);
    const b = k.sup(.3, .75); poli(c, [[b[0] - 5, b[1]], [b[0], b[1] - 3], [b[0] + 5, b[1]], [b[0], b[1] + 3]], '#B5532A');
    const ch = k.sup(.78, .25); c.lineWidth = 2;
    panel(c, function (u, z) { return [ch[0] - 2.5 + u * 5, ch[1] - z]; }, 0, 1, 0, 13, '#5E5A55');
    humo(c, ch[0], ch[1] - 15, t, e.id * .37);
  } else {
    dibCaja(c, k, '#DDD6C6', '#C96B4C', '#A9543B');
    ladrillos(c, k.izq, h, '#93472F'); ladrillos(c, k.der, h, '#7C3B28');
    panel(c, k.izq, .6, 1, 0, 14, '#CFC8B8', false); panel(c, k.der, 0, .25, 20, h, '#CFC8B8', false);
    puerta(c, k.izq, .1, .38, 22, '#2F6B4F');
    ventana(c, k.izq, .56, .88, 13, 26);
    ventana(c, k.der, .14, .42, 13, 26);
    ventana(c, k.der, .58, .86, 13, 26, '#F2D16B');
    // macetas
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const m = k.izq(.6 + i * .12, 13); c.fillStyle = '#B5532A'; c.fillRect(m[0] - 2, m[1] - 3, 4, 3); circ(c, m[0], m[1] - 5, 2.4, '#3F8F4B', false); circ(c, m[0] + .8, m[1] - 6, 1.2, '#E24B4A', false); }
    c.lineWidth = 2;
    mugre(c, k.izq); mugre(c, k.der); brillo(c, k.izq, h);
    // pretil
    c.lineWidth = 1.5;
    poli(c, [k.sup(.07, .07), k.sup(.93, .07), k.sup(.93, .93), k.sup(.07, .93)], '#C9C1B0');
    c.lineWidth = 2;
    const dp = k.sup(.28, .3);
    linea(c, dp, [dp[0], dp[1] - 11]);
    elip(c, dp[0] + 2, dp[1] - 13, 8, 5.5, '#F1F1F1'); circ(c, dp[0] + 4, dp[1] - 14, 1.2, TINTA, false);
    const q = k.sup(.7, .58);
    c.lineWidth = 1.5;
    panel(c, function (u, z) { return [q[0] - 7 + u * 14, q[1] - z]; }, 0, 1, 0, 12, '#3E7CA6');
    elip(c, q[0], q[1] - 12, 7, 3, '#5C9CC6'); elip(c, q[0], q[1], 7, 3, null);
  }
};

DIB.principal = function (c, e, t) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  sombra(c, x + .15, y + .15, x + 2.85, y + 2.85, 52);
  // alfombra de la entrada
  poli(c, [iso(x + 1.25, y + 2.9), iso(x + 1.95, y + 2.9), iso(x + 1.95, y + 3.3), iso(x + 1.25, y + 3.3)], '#A8324A');
  const k = Caja(x + .15, y + .15, x + 2.85, y + 2.85, 38);
  dibCaja(c, k, '#8C9A8A', '#CFA467', '#B08548');
  // paredes de retales
  panel(c, k.izq, 0, .28, 0, 38, '#A9B2AE'); rayas(c, k.izq, 6, 0, 38, '#7A8480', 0, .28);
  panel(c, k.izq, .7, 1, 0, 38, '#4F86A8'); rayas(c, k.izq, 5, 0, 38, '#3D6C8A', .7, 1);
  panel(c, k.izq, .28, .7, 26, 38, '#B98A52'); c.lineWidth = 1; linea(c, k.izq(.28, 32), k.izq(.7, 32), '#8E6A38'); c.lineWidth = 2;
  panel(c, k.der, 0, .36, 0, 38, '#B5532A'); rayas(c, k.der, 6, 0, 38, '#8F3F1E', 0, .36);
  panel(c, k.der, .36, .7, 0, 38, '#EDE3CF');
  panel(c, k.der, .7, 1, 0, 38, '#A9B2AE'); rayas(c, k.der, 5, 0, 38, '#7A8480', .7, 1);
  // puerta con marco dorado
  panel(c, k.izq, .4, .62, 0, 26, '#E0B23A');
  puerta(c, k.izq, .43, .59, 24, '#8A2F2F');
  ventana(c, k.izq, .75, .95, 14, 28, '#F2D16B', '#3D6C8A');
  ventana(c, k.izq, .05, .23, 16, 28, '#8FC3DD', '#6B5B4B');
  ventana(c, k.der, .42, .64, 13, 28);
  mugre(c, k.izq); mugre(c, k.der); brillo(c, k.izq, 38);
  // macetas
  c.lineWidth = 1;
  [.36, .66].forEach(function (u) { const m = iso(k.x0 + u * 2.7, k.y1 + .12); c.fillStyle = '#B5532A'; c.strokeStyle = TINTA; c.beginPath(); c.rect(m[0] - 3, m[1] - 6, 6, 6); c.fill(); c.stroke(); circ(c, m[0], m[1] - 9, 4, '#3F8F4B'); circ(c, m[0] - 1.5, m[1] - 10, 1.4, '#E24B4A', false); circ(c, m[0] + 2, m[1] - 8, 1.4, '#E24B4A', false); });
  c.lineWidth = 2;
  // tejado
  poli(c, [k.sup(-.03, -.03), k.sup(1.03, -.03), k.sup(1.03, 1.03), k.sup(-.03, 1.03)], '#93A291');
  c.lineWidth = 1;
  for (let i = 1; i < 14; i++) linea(c, k.sup(i / 14, -.03), k.sup(i / 14, 1.03), i % 2 ? '#6F7D6E' : '#B4C1B2');
  c.lineWidth = 2;
  poli(c, [k.sup(.04, .5), k.sup(.34, .5), k.sup(.34, .92), k.sup(.04, .92)], '#4F8FB8');
  c.lineWidth = 1.5; neumatico(c, k.sup(.12, .2), 8); neumatico(c, k.sup(.2, .62), 7); c.lineWidth = 2;
  // segunda planta
  const k2 = Caja(x + 1.25, y + .4, x + 2.65, y + 1.8, 22, 38);
  sombra(c, x + 1.25 - 1.2, y + .4 - 1.2, x + 2.65 - 1.2, y + 1.8 - 1.2, 0);
  dibCaja(c, k2, '#B5532A', '#C99A5E', '#A67B45');
  c.lineWidth = 1;
  for (let z = 5; z < 22; z += 5) { linea(c, k2.izq(0, z), k2.izq(1, z), '#8E6A38'); linea(c, k2.der(0, z), k2.der(1, z), '#7A5A2E'); }
  c.lineWidth = 2;
  ventana(c, k2.izq, .3, .7, 6, 17, '#F2D16B', '#6B5B4B');
  ventana(c, k2.der, .3, .7, 6, 17, '#8FC3DD', '#6B5B4B');
  poli(c, [k2.sup(-.06, -.06), k2.sup(1.06, -.06), k2.sup(1.06, 1.06), k2.sup(-.06, 1.06)], '#B5532A');
  c.lineWidth = 1;
  for (let i = 1; i < 8; i++) linea(c, k2.sup(i / 8, -.06), k2.sup(i / 8, 1.06), '#8F3F1E');
  c.lineWidth = 2;
  // antena, parabólica y chimenea
  const a = k2.sup(.25, .3);
  linea(c, a, [a[0], a[1] - 24]); c.lineWidth = 1.5;
  linea(c, [a[0] - 7, a[1] - 21], [a[0] + 7, a[1] - 21]); linea(c, [a[0] - 5, a[1] - 17], [a[0] + 5, a[1] - 17]); linea(c, [a[0] - 3, a[1] - 13], [a[0] + 3, a[1] - 13]);
  c.lineWidth = 2;
  const dp = k2.sup(.8, .75); linea(c, dp, [dp[0], dp[1] - 8]); elip(c, dp[0] + 2, dp[1] - 11, 8, 5.5, '#F1F1F1'); circ(c, dp[0] + 4, dp[1] - 12, 1.2, TINTA, false);
  const ch = k.sup(.86, .82);
  panel(c, function (u, z) { return [ch[0] - 4 + u * 8, ch[1] - z]; }, 0, 1, 0, 13, '#6B5B4B');
  humo(c, ch[0], ch[1] - 15, t, 0);
  // tendedero
  const p1 = k.sup(.42, .97), p2 = k.sup(.98, .97);
  linea(c, p1, [p1[0], p1[1] - 15]); linea(c, p2, [p2[0], p2[1] - 15]);
  c.lineWidth = 1; linea(c, [p1[0], p1[1] - 14], [p2[0], p2[1] - 14]); c.lineWidth = 1.3;
  const cols = ['#E24B4A', '#F2EDE4', '#F2D16B', '#7B3FA0'];
  for (let i = 0; i < 4; i++) {
    const f = (i + .7) / 4.6, px = p1[0] + (p2[0] - p1[0]) * f, py = p1[1] - 14 + (p2[1] - p1[1]) * f, m = Math.sin(t * 2 + i) * 1.5;
    poli(c, [[px - 4, py], [px + 4, py], [px + 4 + m, py + 9], [px - 4 + m, py + 9]], cols[i]);
  }
  // guirnalda de bombillas (luz pinchada)
  const bc = ['#F2D16B', '#E24B4A', '#6FB7D6', '#7BD45A'];
  c.lineWidth = 1;
  [k.izq, k.der].forEach(function (f, s) {
    c.beginPath();
    for (let i = 0; i <= 12; i++) { const u = i / 12, p = f(u, 36 - Math.abs(Math.sin(u * Math.PI * 3)) * 4); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
    c.strokeStyle = TINTA; c.stroke();
    for (let i = 0; i < 6; i++) { const u = (i + .5) / 6, p = f(u, 32); const on = Math.sin(t * 4 + i * 1.7 + s) > -.3; circ(c, p[0], p[1], 2, on ? bc[(i + s) % 4] : '#6B5B4B'); }
  });
  c.lineWidth = 2;
};

DIB.taberna = function (c, e, t) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  sombra(c, x + .2, y + .2, x + 1.8, y + 1.8, 30);
  const k = Caja(x + .2, y + .2, x + 1.8, y + 1.8, 30);
  dibCaja(c, k, '#B5532A', '#F1E9D8', '#D8CCB4');
  panel(c, k.izq, 0, 1, 0, 8, '#E0A63A'); panel(c, k.der, 0, 1, 0, 8, '#C48E2C');
  c.lineWidth = 1;
  for (let i = 1; i < 9; i++) linea(c, k.sup(i / 9, 0), k.sup(i / 9, 1), i % 2 ? '#8F3F1E' : '#CC6A3C');
  c.lineWidth = 2;
  // puerta con cortina de tiras
  panel(c, k.izq, .36, .62, 0, 20, '#3A2A1E');
  c.lineWidth = 1.3;
  const tc = ['#E24B4A', '#F2D16B', '#6FB7D6', '#7BD45A', '#F2EDE4'];
  for (let i = 0; i < 5; i++) { const u = .39 + i * .05; linea(c, k.izq(u, 19), k.izq(u + Math.sin(t * 2 + i) * .006, 2), tc[i]); }
  c.lineWidth = 2;
  // pizarra
  panel(c, k.izq, .7, .93, 9, 21, '#2F3B36');
  c.lineWidth = 1; linea(c, k.izq(.74, 18), k.izq(.89, 18), '#F2EDE4'); linea(c, k.izq(.74, 15), k.izq(.86, 15), '#F2EDE4'); linea(c, k.izq(.74, 12), k.izq(.89, 12), '#F2D16B'); c.lineWidth = 2;
  // ventana con reja
  ventana(c, k.der, .18, .52, 11, 23, '#F2D16B', '#3A2A1E');
  c.lineWidth = 1; for (let i = 1; i < 4; i++) linea(c, k.der(.18 + i * .085, 11), k.der(.18 + i * .085, 23), TINTA); c.lineWidth = 2;
  puerta(c, k.der, .64, .88, 16, '#7A5230');
  mugre(c, k.izq); mugre(c, k.der);
  // toldo
  for (let i = 0; i < 6; i++) {
    const u0 = .04 + i * .153, u1 = u0 + .153;
    poli(c, [k.izq(u0, 26), k.izq(u1, 26), iso(x + .2 + u1 * 1.6, y + 2.35, 16), iso(x + .2 + u0 * 1.6, y + 2.35, 16)], i % 2 ? '#F2EDE4' : '#D0392B');
    poli(c, [iso(x + .2 + u0 * 1.6, y + 2.35, 16), iso(x + .2 + u1 * 1.6, y + 2.35, 16), iso(x + .2 + u1 * 1.6, y + 2.35, 12.5), iso(x + .2 + u0 * 1.6, y + 2.35, 12.5)], i % 2 ? '#DAD3C8' : '#A82A20');
  }
  // rótulo con bombillas
  const s = k.sup(.5, .5);
  linea(c, [s[0] - 11, s[1] - 9], [s[0] - 11, s[1] + 1]); linea(c, [s[0] + 11, s[1] - 9], [s[0] + 11, s[1] + 1]);
  c.fillStyle = '#F2D16B'; c.strokeStyle = TINTA; c.beginPath(); c.rect(s[0] - 18, s[1] - 25, 36, 16); c.fill(); c.stroke();
  c.fillStyle = '#8A2F2F'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('BAR', s[0], s[1] - 16.5);
  c.lineWidth = 1;
  for (let i = 0; i < 7; i++) { const on = Math.floor(t * 3 + i) % 3 !== 0; circ(c, s[0] - 15 + i * 5, s[1] - 26.5, 1.5, on ? '#FFF3B0' : '#8E6A38'); }
  // barril con vasos
  const b = iso(x + 1.05, y + 2.25); c.lineWidth = 1.5;
  poli(c, [[b[0] - 6, b[1] - 14], [b[0] + 6, b[1] - 14], [b[0] + 7, b[1] - 7], [b[0] + 6, b[1]], [b[0] - 6, b[1]], [b[0] - 7, b[1] - 7]], '#8E5A30');
  c.lineWidth = 1; linea(c, [b[0] - 6.5, b[1] - 10], [b[0] + 6.5, b[1] - 10], '#3A2A1E'); linea(c, [b[0] - 6.5, b[1] - 4], [b[0] + 6.5, b[1] - 4], '#3A2A1E');
  c.lineWidth = 1.5; elip(c, b[0], b[1] - 14, 6, 2.6, '#A9713F');
  c.lineWidth = 1; c.fillStyle = '#F2C14A'; c.strokeStyle = TINTA; c.beginPath(); c.rect(b[0] - 3.5, b[1] - 19, 2.6, 4.5); c.fill(); c.stroke(); c.beginPath(); c.rect(b[0] + 1, b[1] - 18.5, 2.6, 4.5); c.fill(); c.stroke();
  c.fillStyle = '#FFFFFF'; c.fillRect(b[0] - 3.5, b[1] - 19.5, 2.6, 1.3); c.fillRect(b[0] + 1, b[1] - 19, 2.6, 1.3);
  c.lineWidth = 2;
};

DIB.ayuntamiento = function (c, e, t) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  sombra(c, x + .05, y + .05, x + 3.95, y + 3.95, 70);
  dibCaja(c, Caja(x + .05, y + .05, x + 3.95, y + 3.95, 4), '#DDD2BA', '#BFB298', '#A99C82');
  dibCaja(c, Caja(x + .22, y + .22, x + 3.78, y + 3.78, 4, 4), '#E4DAC3', '#C8BBA0', '#B2A58A');
  const k = Caja(x + .4, y + .4, x + 3.6, y + 3.6, 52, 8);
  dibCaja(c, k, '#B5532A', '#EAE0CA', '#CDC1A7');
  // cornisa y friso
  panel(c, k.izq, 0, 1, 41, 52, '#DDD2BA'); panel(c, k.der, 0, 1, 41, 52, '#BFB298');
  c.lineWidth = 1;
  for (let i = 0; i < 16; i++) { const u = .03 + i * .0615; panel(c, k.izq, u, u + .03, 43, 46, '#B2A58A', false); panel(c, k.der, u, u + .03, 43, 46, '#9C8F75', false); }
  linea(c, k.izq(0, 48), k.izq(1, 48), '#A99C82'); linea(c, k.der(0, 48), k.der(1, 48), '#93866C');
  c.lineWidth = 2;
  // portón con arco
  arco(c, k.izq, .5, .1, 0, 20, 9, '#5A4027');
  c.lineWidth = 1; linea(c, k.izq(.5, 0), k.izq(.5, 28), TINTA); const pk = k.izq(.52, 12); circ(c, pk[0], pk[1], 1.2, '#F2D16B'); c.lineWidth = 2;
  // columnas
  for (let i = 0; i < 6; i++) {
    const u = [.04, .17, .3, .64, .77, .9][i];
    panel(c, k.izq, u, u + .06, 2, 38, '#FAF5E8');
    c.lineWidth = 1; linea(c, k.izq(u + .03, 3), k.izq(u + .03, 37), '#CFC3A8'); c.lineWidth = 2;
    panel(c, k.izq, u - .012, u + .072, 0, 3, '#DDD2BA'); panel(c, k.izq, u - .012, u + .072, 38, 41, '#DDD2BA');
  }
  // balcón con banderas
  panel(c, k.izq, .36, .64, 30, 32.5, '#DDD2BA');
  c.lineWidth = 1; for (let i = 0; i <= 8; i++) linea(c, k.izq(.37 + i * .0325, 32.5), k.izq(.37 + i * .0325, 37), TINTA); linea(c, k.izq(.36, 37), k.izq(.64, 37), TINTA);
  c.lineWidth = 1.5;
  [[.42, '#6B4E9B', '#F2D16B'], [.58, '#F2EDE4', '#3E7CA6']].forEach(function (b, i) {
    const p = k.izq(b[0], 34), o = Math.sin(t * 3 + i) * 1.5, d = i ? 1 : -1;
    linea(c, p, [p[0] + d * 6, p[1] - 14]);
    poli(c, [[p[0] + d * 6, p[1] - 14], [p[0] + d * 17, p[1] - 12 + o], [p[0] + d * 15, p[1] - 5 + o], [p[0] + d * 4, p[1] - 7]], b[1]);
    circ(c, p[0] + d * 10.5, p[1] - 9.5 + o * .6, 2, b[2], false);
  });
  c.lineWidth = 2;
  // ventanas en arco de la cara derecha
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
    const u = .12 + i * .19;
    c.lineWidth = 1.5; arco(c, k.der, u, .055, 5 + j * 19, 13 + j * 19, 4.5, '#F4EFE4');
    c.lineWidth = 1; arco(c, k.der, u, .035, 6.5 + j * 19, 13 + j * 19, 3, azar(i, j + e.id) > .6 ? '#F2D16B' : '#5E7F99');
  }
  c.lineWidth = 2;
  mugre(c, k.izq); mugre(c, k.der); brillo(c, k.izq, 52);
  // tejado
  c.lineWidth = 1;
  for (let i = 1; i < 16; i++) linea(c, k.sup(i / 16, 0), k.sup(i / 16, 1), i % 2 ? '#8F3F1E' : '#CC6A3C');
  c.lineWidth = 2;
  poli(c, [k.sup(0, 0), k.sup(1, 0), k.sup(1, 1), k.sup(0, 1)], null);
  // torre del reloj
  const tr = Caja(x + 1.45, y + 1.45, x + 2.55, y + 2.55, 30, 60);
  dibCaja(c, tr, '#B5532A', '#EAE0CA', '#CDC1A7');
  panel(c, tr.izq, 0, 1, 26, 30, '#DDD2BA'); panel(c, tr.der, 0, 1, 26, 30, '#BFB298');
  [tr.izq, tr.der].forEach(function (f, i) {
    const r = f(.5, 14);
    c.lineWidth = 2; circ(c, r[0], r[1], 7.5, '#FFFFFF'); c.lineWidth = 1; circ(c, r[0], r[1], 5.8, null, '#B2A58A');
    c.lineWidth = 1.5; linea(c, r, [r[0] + (i ? .8 : -.8), r[1] - 5]); linea(c, r, [r[0] + 3, r[1] + 1.5]);
  });
  c.lineWidth = 2;
  const ap = iso(x + 2, y + 2, 112);
  poli(c, [tr.izq(-.08, 30), tr.izq(1.08, 30), ap], '#5E6C7A');
  poli(c, [tr.der(-.08, 30), tr.der(1.08, 30), ap], '#48545F');
  linea(c, ap, [ap[0], ap[1] - 20]);
  const o = Math.sin(t * 3) * 2;
  poli(c, [[ap[0], ap[1] - 20], [ap[0] + 19, ap[1] - 17 + o], [ap[0], ap[1] - 9]], '#6B4E9B');
  circ(c, ap[0] + 6, ap[1] - 15.5 + o * .3, 2.2, '#F2D16B', false);
  // faroles de la escalinata
  [[.3, 3.95], [3.7, 3.95]].forEach(function (q) {
    const p = iso(x + q[0], y + q[1], 4);
    c.lineWidth = 2; linea(c, p, [p[0], p[1] - 16]); c.lineWidth = 1.5; circ(c, p[0], p[1] - 19, 3.5, '#FFF3B0');
  });
  c.lineWidth = 2;
};

DIB.bloque = function (c, e) {
  const x = e.x, y = e.y, h = e.alto, id = e.id;
  c.lineWidth = 2; c.lineJoin = 'round';
  sombra(c, x + .12, y + .12, x + 1.88, y + 1.88, h);
  const k = Caja(x + .12, y + .12, x + 1.88, y + 1.88, h);
  const pal = [['#EBCDA6', '#C9A57A'], ['#DDBDB5', '#B8958C'], ['#CDD6C4', '#A5AF9B'], ['#E6DAAE', '#C0B485']][e.tono];
  dibCaja(c, k, '#A39A90', pal[0], pal[1]);
  // bajo comercial
  panel(c, k.izq, 0, 1, 0, 14, '#8C8279'); panel(c, k.der, 0, 1, 0, 14, '#766D65');
  const tol = ['#D0392B', '#2F6B4F', '#3E7CA6', '#E0A63A'][Math.floor(azar(id, 3) * 4)];
  c.lineWidth = 1.5;
  panel(c, k.izq, .08, .58, 2, 11, '#9CCBE0');
  poli(c, [k.izq(.08, 11), k.izq(.58, 11), k.izq(.08, 6)], 'rgba(255,255,255,.35)', false);
  puerta(c, k.izq, .68, .9, 11, '#5A4027');
  poli(c, [k.izq(.04, 14), k.izq(.62, 14), iso(k.x0 + .62 * 1.76, k.y1 + .28, 10), iso(k.x0 + .04 * 1.76, k.y1 + .28, 10)], tol);
  c.lineWidth = 1; rayas(c, k.der, 7, 1, 12, '#5F5750', .15, .7); c.lineWidth = 1.5;
  panel(c, k.der, .15, .7, 1, 12, null);
  // plantas
  const filas = Math.floor((h - 18) / 13);
  for (let j = 0; j < filas; j++) {
    const z = 18 + j * 13;
    for (let i = 0; i < 3; i++) {
      const u = .1 + i * .3;
      c.lineWidth = 1;
      const lz = azar(id + i, j) > .68, lz2 = azar(id + i + 7, j) > .68;
      panel(c, k.izq, u, u + .2, z, z + 8.5, '#F4EFE4'); panel(c, k.izq, u + .025, u + .175, z + 1.2, z + 7.3, lz ? '#F2D16B' : '#5E7F99');
      panel(c, k.der, u, u + .2, z, z + 8.5, '#E4DDCF'); panel(c, k.der, u + .025, u + .175, z + 1.2, z + 7.3, lz2 ? '#F2D16B' : '#4F6F88');
      if (i === 1) { // balcón
        panel(c, k.izq, u - .04, u + .24, z - 1.5, z, '#8C8279');
        for (let q = 0; q <= 5; q++) linea(c, k.izq(u - .04 + q * .056, z), k.izq(u - .04 + q * .056, z + 4.5), TINTA);
        linea(c, k.izq(u - .04, z + 4.5), k.izq(u + .24, z + 4.5), TINTA);
      } else if (azar(id + i * 3, j + 11) > .6) { // toldo verde
        poli(c, [k.izq(u - .01, z + 8.5), k.izq(u + .21, z + 8.5), iso(k.x0 + (u + .21) * 1.76, k.y1 + .12, z + 4.5), iso(k.x0 + (u - .01) * 1.76, k.y1 + .12, z + 4.5)], '#2F6B4F');
      }
      if (azar(id + i * 5, j + 23) > .72) { const a = k.der(u + .1, z - 1); c.fillStyle = '#E8E8E8'; c.strokeStyle = TINTA; c.beginPath(); c.rect(a[0] - 3.5, a[1] - 2, 7, 4); c.fill(); c.stroke(); }
    }
  }
  c.lineWidth = 2;
  panel(c, k.izq, 0, 1, h - 3, h, pal[1]); panel(c, k.der, 0, 1, h - 3, h, '#8C8279');
  brillo(c, k.izq, h - 3);
  // azotea
  c.lineWidth = 1.5;
  poli(c, [k.sup(.07, .07), k.sup(.93, .07), k.sup(.93, .93), k.sup(.07, .93)], '#8E857B');
  const cz = Caja(x + .5, y + .45, x + 1.05, y + 1, 10, h);
  dibCaja(c, cz, '#C9C1B0', '#DDD6C6', '#BDB5A4');
  const an = k.sup(.72, .35 + azar(id, 9) * .3);
  linea(c, an, [an[0], an[1] - 16]); c.lineWidth = 1; linea(c, [an[0] - 5, an[1] - 14], [an[0] + 5, an[1] - 14]); linea(c, [an[0] - 4, an[1] - 11], [an[0] + 4, an[1] - 11]);
  if (azar(id, 17) > .4) { const q = k.sup(.3, .78); c.lineWidth = 1.5; panel(c, function (u, z) { return [q[0] - 6 + u * 12, q[1] - z]; }, 0, 1, 0, 9, '#3E7CA6'); elip(c, q[0], q[1] - 9, 6, 2.6, '#5C9CC6'); }
  c.lineWidth = 2;
};

DIB.monton = function (c, e) {
  const p = iso(e.x + .5, e.y + .5), s = .6 + .5 * Math.min(1, e.cant / e.cantMax);
  c.save(); c.translate(p[0], p[1]); c.scale(s, s);
  c.lineWidth = 1.8 / s; c.lineJoin = 'round';
  elip(c, 2, 4, 30, 11, 'rgba(30,18,8,.25)', false);
  // lavadora
  poli(c, [[-24, 6], [-24, -12], [-8, -15], [-8, 4]], '#E4E6E8'); poli(c, [[-24, -12], [-17, -17], [-2, -19], [-8, -15]], '#F4F5F6'); poli(c, [[-8, -15], [-2, -19], [-2, 0], [-8, 4]], '#BFC4C8');
  circ(c, -16, -4, 5, '#5E7F99'); circ(c, -16, -4, 2.5, '#9CCBE0', false);
  // chapa oxidada y nevera
  poli(c, [[-4, 7], [3, -20], [15, -23], [26, 0], [17, 9]], '#B5532A');
  c.lineWidth = 1 / s; linea(c, [5, -14], [19, -4], '#8F3F1E'); linea(c, [3, -6], [15, 4], '#8F3F1E'); c.lineWidth = 1.8 / s;
  poli(c, [[-14, 10], [-7, -1], [8, 1], [12, 11], [-4, 14]], '#6E7880');
  poli(c, [[-7, -1], [8, 1], [6, 4], [-8, 2]], '#98A2AA', false);
  // tubo, rueda de bici y neumático
  c.save(); c.translate(-1, -18); c.rotate(-.5);
  c.fillStyle = '#C9CED3'; c.strokeStyle = TINTA; c.beginPath(); c.rect(-3, -13, 6, 24); c.fill(); c.stroke(); elip(c, 0, -13, 3, 1.4, '#6E7880');
  c.restore();
  c.lineWidth = 1.5 / s; elip(c, 22, -8, 7, 9, null); c.lineWidth = .8 / s; linea(c, [22, -17], [22, 1]); linea(c, [15, -8], [29, -8]); linea(c, [17, -14], [27, -2]); linea(c, [27, -14], [17, -2]);
  c.lineWidth = 1.8 / s;
  elip(c, 13, 8, 9, 5.5, '#26221F'); elip(c, 13, 8, 4, 2.2, '#6B6259');
  poli(c, [[-22, 8], [-16, 2], [-11, 8], [-15, 13]], '#3F8F6B');
  c.lineWidth = 1 / s; circ(c, -1, 11, 2.2, '#D8D4C8'); circ(c, 4, 13, 2, '#E24B4A');
  poli(c, [[6, -20], [10, -22], [11, -17]], 'rgba(255,255,255,.5)', false);
  c.restore();
};

DIB.plaza = function (c, e, t) {
  const p = iso(e.x + 1, e.y + 1);
  c.lineWidth = 2;
  elip(c, p[0] + 6, p[1] + 3, 50, 24, 'rgba(30,18,8,.18)', false);
  elip(c, p[0], p[1], 46, 23, '#CFC5B2');
  c.fillStyle = '#CFC5B2'; c.fillRect(p[0] - 46, p[1] - 8, 92, 8);
  linea(c, [p[0] - 46, p[1] - 8], [p[0] - 46, p[1]]); linea(c, [p[0] + 46, p[1] - 8], [p[0] + 46, p[1]]);
  elip(c, p[0], p[1] - 8, 46, 23, '#EAE0CA');
  elip(c, p[0], p[1] - 8, 39, 19, '#5FAED2');
  elip(c, p[0] - 8, p[1] - 12, 22, 9, 'rgba(255,255,255,.22)', false);
  c.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const f = (t * .6 + i / 3) % 1;
    c.globalAlpha = 1 - f;
    elip(c, p[0], p[1] - 8, 9 + f * 28, 4.5 + f * 13, null, '#FFFFFF');
    c.globalAlpha = 1;
  }
  c.lineWidth = 2;
  panel(c, function (u, z) { return [p[0] - 5 + u * 10, p[1] - 8 - z]; }, 0, 1, 0, 14, '#EAE0CA');
  elip(c, p[0], p[1] - 22, 17, 7, '#EAE0CA'); elip(c, p[0], p[1] - 23.5, 13, 5, '#5FAED2');
  panel(c, function (u, z) { return [p[0] - 3 + u * 6, p[1] - 23 - z]; }, 0, 1, 0, 12, '#EAE0CA');
  elip(c, p[0], p[1] - 36, 7, 3, '#EAE0CA');
  c.lineWidth = 2;
  for (let s = -1; s <= 1; s += 2) {
    c.beginPath(); c.moveTo(p[0], p[1] - 38);
    c.quadraticCurveTo(p[0] + s * 9, p[1] - 50 - Math.sin(t * 6) * 2, p[0] + s * 13, p[1] - 24);
    c.strokeStyle = '#D6F0FA'; c.stroke();
    c.beginPath(); c.moveTo(p[0] + s * 15, p[1] - 22);
    c.quadraticCurveTo(p[0] + s * 26, p[1] - 26, p[0] + s * 29, p[1] - 9);
    c.stroke();
  }
  c.lineWidth = 1.5; linea(c, [p[0], p[1] - 38], [p[0], p[1] - 46 - Math.sin(t * 7) * 2], '#D6F0FA');
};

/* ---------- Decorado (no bloquea) ---------- */
DIB.farola = function (c, e, t) {
  const V = '#2F4A3C';
  elip(c, 0, 0, 7, 2.8, 'rgba(30,18,8,.25)', false);
  c.lineWidth = 1.5; poli(c, [[-4, 0], [4, 0], [2.5, -6], [-2.5, -6]], V);
  c.lineWidth = 3.6; linea(c, [0, -6], [0, -45], TINTA); c.lineWidth = 1.8; linea(c, [0, -6], [0, -45], V);
  c.lineWidth = 1.3; elip(c, 0, -14, 2.8, 1.3, V); elip(c, 0, -30, 2.3, 1.1, V);
  for (let s = -1; s <= 1; s += 2) {
    c.beginPath(); c.moveTo(0, -40); c.bezierCurveTo(s * 4, -52, s * 13, -51, s * 11.5, -43); c.bezierCurveTo(s * 10.8, -39, s * 7, -40, s * 8.2, -43.5);
    c.lineWidth = 2.8; c.strokeStyle = TINTA; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = V; c.stroke();
    c.lineWidth = 1.3; circ(c, s * 11.5, -38.2, 3.7, '#FFF1B8'); c.fillStyle = V; c.fillRect(s * 11.5 - 1.6, -42.6, 3.2, 1.6);
  }
  circ(c, 0, -47, 2, V); c.lineWidth = 1.5; linea(c, [0, -49], [0, -53], TINTA);
  c.globalAlpha = .12 + Math.sin(t * 2 + e.id) * .02; circ(c, 0, -38, 21, '#FFF1B8', false); c.globalAlpha = 1;
};
DIB.columna = function (c) {
  elip(c, 2, 1, 13, 5, 'rgba(30,18,8,.25)', false);
  c.lineWidth = 1.5;
  c.fillStyle = '#EFE3C8'; c.strokeStyle = TINTA;
  c.beginPath(); c.moveTo(-9, -38); c.lineTo(-9, 0); c.ellipse(0, 0, 9, 3.4, 0, Math.PI, 0, true); c.lineTo(9, -38); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-8.3, -37, 3.4, 37);
  c.lineWidth = 1;
  c.fillStyle = '#D9A521'; c.beginPath(); c.rect(-7.5, -33, 7, 14); c.fill(); c.stroke();
  poli(c, [[-6, -20], [-4.5, -29], [-3, -27], [-2, -30.5], [-1.2, -20]], TINTA, false);
  c.fillStyle = '#B4432B'; c.beginPath(); c.rect(.5, -34, 7.5, 11); c.fill(); c.stroke(); circ(c, 4.2, -28.5, 2.6, '#F1E6CC', false);
  c.fillStyle = '#3D4A34'; c.beginPath(); c.rect(-7, -17, 8.5, 12); c.fill(); c.stroke(); poli(c, [[-5.5, -7], [-2.8, -15], [0, -7]], '#D9A521', false);
  c.fillStyle = '#F6EAD0'; c.beginPath(); c.rect(3, -21, 5.2, 15); c.fill(); c.stroke(); linea(c, [4, -18], [7.2, -18], '#B4432B'); linea(c, [4, -15], [7.2, -15], TINTA); linea(c, [4, -12.5], [6.4, -12.5], TINTA);
  c.lineWidth = 1.5;
  c.fillStyle = '#2F4A3C'; c.beginPath(); c.moveTo(-10.5, -38); c.quadraticCurveTo(-9, -50, 0, -52); c.quadraticCurveTo(9, -50, 10.5, -38); c.closePath(); c.fill(); c.stroke();
  elip(c, 0, -38, 10.5, 3.6, '#3D5E4C'); circ(c, 0, -54, 1.9, '#D9A521');
};
DIB.arbol = function (c, e, t) {
  elip(c, 3, 1, 15, 6, 'rgba(30,18,8,.25)', false);
  c.lineWidth = 1.5;
  poli(c, [[-2.5, 0], [2.5, 0], [1.8, -18], [-1.8, -18]], '#7A5230');
  const m = Math.sin(t * 1.3 + e.id) * .8;
  circ(c, -7 + m, -24, 9, '#3F8F4B'); circ(c, 7 + m, -25, 9, '#3F8F4B'); circ(c, m, -32, 11, '#4FA25A');
  circ(c, -3 + m, -34, 5, '#67B870', false);
  c.lineWidth = 1;
  [[-8, -22], [5, -21], [9, -29], [-2, -28], [1, -38], [-9, -29]].forEach(function (o) { circ(c, o[0] + m, o[1], 2, '#F28C28'); });
};
DIB.matojo = function (c, e) {
  c.lineWidth = 1.3;
  const v = e.v || 0, col = v % 2 ? '#8E9A4E' : '#A6A25A';
  elip(c, 1, 1, 9, 3, 'rgba(30,18,8,.2)', false);
  circ(c, -4, -3, 4.5, col); circ(c, 3, -4, 5.5, col); circ(c, 0, -7, 4.5, v % 2 ? '#A3AE5E' : '#BDB86C');
  if (v > 1) { circ(c, 3, -6, 1.2, '#F2EDE4', false); circ(c, -3, -4, 1.2, '#F2D16B', false); }
};
DIB.contenedor = function (c) {
  c.lineWidth = 1.5;
  elip(c, 2, 1, 13, 5, 'rgba(30,18,8,.25)', false);
  poli(c, [[-11, -1], [-1, 4], [-1, -11], [-11, -15]], '#2F7D4F');
  poli(c, [[-1, 4], [10, -1], [10, -15], [-1, -11]], '#256540');
  poli(c, [[-12, -15], [-1, -11], [11, -15], [0, -20]], '#3C9460');
  c.lineWidth = 1; linea(c, [-9, -9], [-3, -6.5], '#1C4D31'); circ(c, -8, 1, 1.6, '#26221F'); circ(c, 8, 0, 1.6, '#26221F');
  poli(c, [[4, -19], [9, -22], [11, -17]], '#3A3A3A');
};
DIB.banco = function (c) {
  c.lineWidth = 1.5;
  elip(c, 1, 1, 13, 4, 'rgba(30,18,8,.2)', false);
  poli(c, [[-12, -6], [0, 0], [12, -6], [0, -12]], '#A9713F');
  poli(c, [[0, -12], [12, -6], [12, -14], [0, -20]], '#8E5A30');
  c.lineWidth = 2; linea(c, [-11, -5], [-11, 0]); linea(c, [0, 0], [0, 5]); linea(c, [11, -5], [11, 0]);
};
DIB.bidon = function (c, e, t) {
  c.lineWidth = 1.5;
  elip(c, 1, 1, 9, 3.5, 'rgba(30,18,8,.25)', false);
  for (let i = 0; i < 3; i++) {
    const f = (t * 1.6 + i / 3) % 1;
    poli(c, [[-4 + i * 3, -16], [-2 + i * 3 + Math.sin(t * 9 + i) * 2, -24 - f * 8], [1 + i * 3, -16]], i === 1 ? '#F2D16B' : '#F28C28', false);
  }
  poli(c, [[-6, -16], [6, -16], [6, -1], [-6, -1]], '#5A6570');
  elip(c, 0, -1, 6, 2.4, '#5A6570'); elip(c, 0, -16, 6, 2.4, '#2B2B2B');
  c.lineWidth = 1; linea(c, [-6, -11], [6, -11], TINTA); linea(c, [-6, -6], [6, -6], TINTA);
  c.fillStyle = '#B5532A'; c.fillRect(-4, -10, 3, 3);
  c.globalAlpha = .12; circ(c, 0, -12, 22 + Math.sin(t * 8) * 2, '#F28C28', false); c.globalAlpha = 1;
};

/* ---------- Personas ---------- */
function trazo(c, x1, y1, x2, y2, col, w) {
  c.lineCap = 'round';
  c.strokeStyle = TINTA; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.lineWidth = 1.5;
}
function persona(c, p) {
  const ph = p.anda ? p.t * 11 : 0, bob = p.anda ? Math.abs(Math.sin(ph)) * 1.5 : 0, Y = -bob;
  c.lineWidth = 1.5; c.lineCap = 'round'; c.lineJoin = 'round';
  elip(c, 0, 0, 9.5, 3.8, 'rgba(30,18,8,.3)', false);
  if (p.falda) {
    const w = p.anda ? Math.sin(ph) * 1.5 : 0;
    elip(c, -3 + w, -1, 2.8, 1.6, p.zapato || '#3A2A20'); elip(c, 4 - w, -1, 2.8, 1.6, p.zapato || '#3A2A20');
    poli(c, [[-4.2, -13 + Y], [4.2, -13 + Y], [8 + w, -5], [-8 + w, -5]], p.falda);
    poli(c, [[-8 + w, -5], [8 + w, -5], [9.5 + w, -2], [-9.5 + w, -2]], p.volante || p.falda);
    c.lineWidth = 1;
    for (let i = -2; i <= 2; i++) linea(c, [i * 3.2 + w, -5], [i * 3.8 + w, -2.2], TINTA);
    if (p.lunar) { circ(c, -3 + w * .5, -7.5, 1.1, p.lunar, false); circ(c, 3 + w * .5, -9, 1.1, p.lunar, false); circ(c, .5 + w * .7, -6.5, 1.1, p.lunar, false); circ(c, -1, -11, 1, p.lunar, false); circ(c, 5.5 + w, -6.5, 1, p.lunar, false); }
    poli(c, [[-4.2, -13 + Y], [-1.5, -13 + Y], [-4.5 + w, -5], [-8 + w, -5]], 'rgba(0,0,0,.16)', false);
    c.lineWidth = 1.5;
  } else {
    for (let k = 0; k < 2; k++) {
      const a = p.anda ? Math.sin(ph + k * Math.PI) * .6 : (k ? .2 : -.2);
      const fx = Math.sin(a) * 10.5, fy = -11.5 + Math.cos(a) * 10.5;
      if (p.corto) { trazo(c, 0, -11.5 + Y, fx, fy - .5, p.piel, 2.8); trazo(c, 0, -11.5 + Y, fx * .45, -11.5 + (fy + 11.5) * .45, p.pant, 3.6); }
      else trazo(c, 0, -11.5 + Y, fx, fy - .5, k ? p.pant : (p.pantOsc || p.pant), 3.4);
      elip(c, fx + 1.8, fy + .2, 3.4, 1.9, p.zapato || '#3A2A20');
    }
  }
  const sw = p.anda ? Math.sin(ph) * 3 : 0;
  if (!p.sinBrazoTrasero) { trazo(c, -1.5, -21 + Y, -4 - sw, -13 + Y, p.oscuro || p.camisa, 2.4); circ(c, -4 - sw, -13 + Y, 1.6, p.piel); }
  if (p.detras) p.detras(c, Y, sw);
  c.fillStyle = p.camisa; c.strokeStyle = TINTA;
  c.beginPath(); c.roundRect(-5.2, -24 + Y, 10.4, 13.5, 4); c.fill(); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.roundRect(-4.6, -23.4 + Y, 3.2, 12.3, [3.5, 0, 0, 3.5]); c.fill();
  if (p.cinto) { c.lineWidth = 2; linea(c, [-4.6, -12 + Y], [4.6, -12 + Y], p.cinto); c.lineWidth = 1.5; }
  if (p.torso) p.torso(c, -24 + Y);
  c.fillStyle = p.piel; c.fillRect(-.6, -26 + Y, 3.2, 2.8);
  circ(c, 1, -30 + Y, 5.7, p.piel);
  c.lineWidth = 1; circ(c, -2.4, -29.3 + Y, 1.4, p.piel);
  c.lineWidth = .8; elip(c, 3.6, -30.7 + Y, 1.5, 1.8, '#FFFFFF');
  circ(c, 4.1, -30.6 + Y, .9, TINTA, false);
  c.lineWidth = 1.2; linea(c, [2.2, -33.2 + Y], [5.4, -32.8 + Y], p.ceja || TINTA);
  c.beginPath(); c.arc(6.5, -29.2 + Y, 1.3, -1.5, 1.7); c.fillStyle = p.piel; c.fill(); c.strokeStyle = TINTA; c.stroke();
  if (!p.sinBoca) linea(c, [3.4, -26.6 + Y], [5.6, -27 + Y], TINTA);
  c.lineWidth = 1.5;
  if (p.cabeza) p.cabeza(c, -30 + Y);
  const br = p.brazo || [5 + sw, -13];
  trazo(c, .5, -21 + Y, br[0], br[1] + Y, p.manga || p.camisa, 2.6);
  circ(c, br[0], br[1] + Y, 1.9, p.piel);
  return bob;
}

DIB.chatarrero = function (c, u, t) {
  const tr = u.trabaja, golpe = Math.sin(t * 12) * 5;
  const bob = persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#2E8B8B', oscuro: '#236E6E', pant: '#3C5068', pantOsc: '#2E3F54', piel: '#E2A77A', zapato: '#5A4027', cinto: '#3A2A20',
    sinBrazoTrasero: !tr, brazo: tr ? [8, -10 + golpe] : [9.5, -16],
    torso: function (c, y) { c.lineWidth = 2; linea(c, [-4.4, y + 6], [4.6, y + 6], '#F2D16B'); c.lineWidth = 1.5; },
    cabeza: function (c, y) {
      c.fillStyle = '#4A4039'; c.beginPath(); c.arc(.6, y - 1.6, 6.1, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      elip(c, 7.4, y - 1.9, 3.5, 1.4, '#3A322C');
      c.lineWidth = 1; linea(c, [-4, y - 3.8], [5, y - 3.8], '#6B5F55');
      c.lineWidth = 2; linea(c, [3, y + 2.3], [6.8, y + 2], '#3A2A20'); c.lineWidth = 1.5;
      c.fillStyle = '#3A2A20'; c.fillRect(-4.4, y - 1.5, 2.4, 3);
    }
  });
  if (tr) { trazo(c, 8, -10 + golpe, 13, -16 + golpe, '#8E979E', 1.8); c.lineWidth = 1.5; circ(c, 13.5, -16.5 + golpe, 2, '#6E7880'); }
  const j = u.anda ? Math.sin((t + u.id) * 22) * .6 : 0;
  c.lineWidth = 1.5;
  if (u.carga > 0) {
    circ(c, 15.5, -20 + j, 3.6, '#B5532A'); c.lineWidth = 1; circ(c, 15.5, -20 + j, 1.4, '#8F3F1E', false); c.lineWidth = 1.5;
    c.save(); c.translate(21, -22 - j); c.rotate(-.5); c.fillStyle = '#C9CED3'; c.beginPath(); c.rect(-1.7, -6, 3.4, 12); c.fill(); c.stroke(); c.restore();
    poli(c, [[22, -18], [26, -21 + j], [26.5, -17]], '#3F8F6B');
  }
  poli(c, [[11, -18], [26.5, -18], [24, -7.5], [13, -7.5]], '#DDE2E6');
  poli(c, [[11, -18], [15, -18], [16, -7.5], [13, -7.5]], 'rgba(0,0,0,.12)', false);
  c.lineWidth = .9;
  for (let i = 1; i < 5; i++) linea(c, [11 + i * 3.1, -18], [13 + i * 2.2, -7.5], '#6E7880');
  linea(c, [11.7, -14.5], [25.7, -14.5], '#6E7880'); linea(c, [12.4, -11], [24.9, -11], '#6E7880');
  c.lineWidth = 1.8; linea(c, [11, -18], [8, -19.5 - bob * .4], TINTA);
  c.lineWidth = 2.6; linea(c, [7, -19.8 - bob * .4], [9.5, -18.6 - bob * .4], '#D0392B');
  c.lineWidth = 1.5; linea(c, [14.5, -7.5], [14.5, -3.6]); linea(c, [22.5, -7.5], [22.5, -3.6]); linea(c, [13, -5.5], [24, -5.5]);
  const g = (t + u.id) * (u.anda ? 12 : 0);
  [14.5, 22.5].forEach(function (wx) { circ(c, wx, -2.5, 2.5, '#3A3A3A'); c.lineWidth = .9; linea(c, [wx - Math.cos(g) * 2, -2.5 - Math.sin(g) * 2], [wx + Math.cos(g) * 2, -2.5 + Math.sin(g) * 2], '#C9CED3'); c.lineWidth = 1.5; });
};

DIB.echadora = function (c, u, t) {
  const tr = u.trabaja;
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#C0392B', oscuro: '#992D22', falda: '#7B3FA0', volante: '#9B5BC0', lunar: '#F2D16B', piel: '#D99B6C', zapato: '#8A2F2F',
    brazo: tr ? [9, -19 + Math.sin(t * 5) * 1.5] : (u.carga > 0 ? [7.5, -17] : null),
    torso: function (c, y) {
      poli(c, [[-5, y + 1], [5, y + 1], [3, y + 7], [0, y + 10], [-4, y + 7]], '#2F6B4F');
      c.lineWidth = 1; for (let i = 0; i < 4; i++) linea(c, [-3.5 + i * 2, y + 7.5 + (i === 2 ? 1.6 : i === 1 ? 1.4 : 0)], [-3.8 + i * 2, y + 10.5 + (i === 2 ? 1.6 : i === 1 ? 1.4 : 0)], '#F2D16B'); c.lineWidth = 1.5;
    },
    cabeza: function (c, y) {
      c.fillStyle = '#1E1612'; c.beginPath(); c.arc(.2, y - .8, 6.1, Math.PI * .92, Math.PI * 1.9); c.closePath(); c.fill(); c.stroke();
      c.fillRect(-4.8, y - 1, 2.6, 5);
      circ(c, -5.2, y - 3.8, 3.2, '#1E1612');
      c.lineWidth = 1; circ(c, -1.8, y - 6, 2, '#E24B4A'); circ(c, -1.8, y - 6, .7, '#F2D16B', false);
      c.lineWidth = 1.2; circ(c, -1.6, y + 3.4, 1.7, null, '#F2D16B'); c.lineWidth = 1.5;
    }
  });
  if (u.carga > 0 && !tr) { circ(c, 9.5, -21, 3, '#F2D16B'); c.lineWidth = 1; circ(c, 9.5, -21, 1.5, null, '#B58A1E'); c.lineWidth = 1.5; }
  if (tr) {
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) { c.save(); c.translate(10.5, -20 + Math.sin(t * 5) * 1.5); c.rotate(-.5 + i * .45); c.fillStyle = '#FFFFFF'; c.strokeStyle = TINTA; c.beginPath(); c.rect(-1.6, -7, 3.2, 6); c.fill(); c.stroke(); c.fillStyle = i === 1 ? '#D0392B' : TINTA; c.fillRect(-.6, -5, 1.2, 1.6); c.restore(); }
    for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; c.fillStyle = '#FFF3B0'; c.beginPath(); c.arc(12 + Math.cos(a) * 6, -30 + Math.sin(a) * 4, 1.3, 0, 6.3); c.fill(); }
    c.lineWidth = 1.5;
  }
};

DIB.navajero = function (c, u, t) {
  const g = u.golpeT > 0;
  const mano = g ? [12.5, -18] : [6.5, -14];
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#F2EDE4', oscuro: '#D8D2C6', manga: '#F2EDE4', pant: '#2B2B33', pantOsc: '#1F1F26', piel: '#D99B6C', zapato: '#1A1A1A', cinto: '#1A1A1A', brazo: mano,
    torso: function (c, y) {
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) linea(c, [-4.4, y + 4 + i * 3], [4.4, y + 4 + i * 3], '#2B2B33');
      c.lineWidth = 1.2; poli(c, [[-3.2, y + .4], [4, y + .4], [.6, y + 4.6]], '#D0392B');
      c.lineWidth = 1; c.beginPath(); c.arc(.6, y + 2, 3.6, .3, 2.6); c.strokeStyle = '#E0B23A'; c.stroke();
      c.lineWidth = 1; c.fillStyle = '#E0B23A'; c.fillRect(-1.2, y + 10.5, 2.6, 2);
      c.lineWidth = 1.5;
    },
    cabeza: function (c, y) {
      c.fillStyle = '#1E1612'; c.beginPath(); c.arc(.6, y - 1.1, 6, Math.PI * .88, Math.PI * 1.96); c.closePath(); c.fill(); c.stroke();
      poli(c, [[3, y - 6.5], [7.5, y - 5.6], [4.6, y - 4]], '#1E1612', false);
      c.fillStyle = '#1E1612'; c.fillRect(-1.6, y - 1.4, 2.4, 5.4);
      c.lineWidth = 1; linea(c, [3.6, y + 4.6], [6, y + 4.2], '#1E1612'); c.lineWidth = 1.5;
    }
  });
  const b = u.anda ? Math.abs(Math.sin((t + u.id) * 11)) * 1.5 : 0;
  trazo(c, mano[0] - .5, mano[1] + .5 - b, mano[0] + 1.6, mano[1] - 1 - b, '#7A5230', 2);
  trazo(c, mano[0] + 1.6, mano[1] - 1 - b, mano[0] + 7.5, mano[1] - 5 - b, '#EEF3F6', 1.5);
  if (g) { c.lineWidth = 1.2; c.beginPath(); c.arc(8, -17, 9, -1, .4); c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke(); c.lineWidth = 1.5; }
};

DIB.policia = function (c, u, t) {
  const g = u.golpeT > 0;
  const mano = g ? [11.5, -15] : [6, -18];
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#27408B', oscuro: '#1D306A', pant: '#1B2A5C', pantOsc: '#141F45', piel: '#E8B48A', zapato: '#111111', cinto: '#111111', brazo: mano,
    torso: function (c, y) {
      c.lineWidth = 1.8; linea(c, [-4.4, y + 6.5], [4.6, y + 6.5], '#E6F04A'); c.lineWidth = 1;
      circ(c, 2.6, y + 3.2, 1.3, '#F2D16B');
      c.fillStyle = '#111111'; c.fillRect(-4, y + 9.6, 2.6, 3.4); c.fillRect(2, y + 9.8, 2.2, 3);
      c.lineWidth = 1.5;
    },
    cabeza: function (c, y) {
      c.fillStyle = '#1B2A5C'; c.beginPath(); c.arc(.6, y - 2, 6.2, Math.PI, 0); c.lineTo(6.8, y - 1.2); c.lineTo(-5.6, y - 1.2); c.closePath(); c.fill(); c.stroke();
      c.lineWidth = 1.5; linea(c, [-5, y - 2.6], [6.4, y - 2.6], '#E6F04A');
      c.lineWidth = 1; circ(c, 2.4, y - 5.2, 1.3, '#F2D16B');
      c.lineWidth = 1.5; elip(c, 7.4, y - 1.4, 3.3, 1.3, '#10183A');
      c.fillStyle = '#7A5230'; c.fillRect(-4.4, y - .8, 2.2, 2.6);
    }
  });
  const b = u.anda ? Math.abs(Math.sin((t + u.id) * 11)) * 1.5 : 0;
  if (g) { trazo(c, mano[0], mano[1] - b, mano[0] + 8, mano[1] + 2.5 - b, '#1A1A1A', 2); c.lineWidth = 1.2; c.beginPath(); c.arc(8, -16, 10, -.9, .5); c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke(); c.lineWidth = 1.5; }
  else trazo(c, mano[0], mano[1] - b, mano[0] + 3.2, mano[1] - 9 - b, '#1A1A1A', 2);
};

DIB.inspector = function (c, u, t) {
  const g = u.golpeT > 0;
  const bob = persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#8A8F98', oscuro: '#6E737B', pant: '#5C6068', pantOsc: '#4A4E55', piel: '#EFC6A0', zapato: '#3A2A20',
    brazo: g ? [10.5, -26] : [6.5, -14],
    detras: function (c, Y, sw) { c.lineWidth = 1.3; c.fillStyle = '#6B4A2A'; c.strokeStyle = TINTA; c.beginPath(); c.rect(-8.5 - sw, -13 + Y, 7.5, 6); c.fill(); c.stroke(); c.fillStyle = '#F2D16B'; c.fillRect(-5.5 - sw, -11 + Y, 1.6, 1.4); c.lineWidth = 1.5; },
    torso: function (c, y) {
      c.lineWidth = 1;
      poli(c, [[-.6, y + .6], [3.6, y + .6], [1.5, y + 5]], '#F4F1EA');
      poli(c, [[1, y + 1.4], [2.4, y + 1.4], [2.8, y + 8], [1.7, y + 9.6], [.6, y + 8]], '#D0392B');
      linea(c, [-.6, y + .6], [1, y + 6.5], TINTA); linea(c, [3.6, y + .6], [2.6, y + 6], TINTA);
      c.fillStyle = '#F4F1EA'; c.fillRect(-3.8, y + 3.4, 2.2, 1.4);
      c.lineWidth = 1.5;
    },
    cabeza: function (c, y) {
      c.fillStyle = '#7A5230'; c.beginPath(); c.arc(-.6, y - .2, 5.9, Math.PI * .7, Math.PI * 1.32); c.closePath(); c.fill(); c.stroke();
      c.lineWidth = 1; linea(c, [-1, y - 5.6], [3.6, y - 5.4], '#7A5230');
      c.lineWidth = 1.2; c.strokeStyle = TINTA; c.fillStyle = 'rgba(190,225,240,.6)'; c.beginPath(); c.rect(1.9, y - 2.4, 3.8, 3); c.fill(); c.stroke();
      linea(c, [1.9, y - 1.4], [-2, y - 1], TINTA); c.lineWidth = 1.5;
    }
  });
  if (g) dibMulta(c, 12, -30 - bob, -.3);
  else { c.lineWidth = 1.2; c.fillStyle = '#B98A52'; c.strokeStyle = TINTA; c.beginPath(); c.rect(4.6, -19 - bob, 6.6, 8.6); c.fill(); c.stroke(); c.fillStyle = '#FFFFFF'; c.fillRect(5.6, -17.6 - bob, 4.6, 6.2); c.lineWidth = .8; linea(c, [6.2, -16 - bob], [9.6, -16 - bob], '#888'); linea(c, [6.2, -14 - bob], [9.6, -14 - bob], '#888'); c.fillStyle = '#6E7880'; c.fillRect(6.6, -19.8 - bob, 2.6, 1.6); c.lineWidth = 1.5; }
};

DIB.turista = function (c, e, t) {
  const v = e.v || 0, foto = !e.anda && !e.compra && Math.sin(t * .9 + e.id * 2.3) > .93;
  const cam = ['#F28C38', '#4FA6C8', '#E8D44A', '#E56B8A'][v % 4];
  persona(c, {
    t: t + e.id, anda: !!e.anda, camisa: cam, pant: ['#D8C9A3', '#6E8FA8', '#B8B8A0'][v % 3], corto: true, piel: v % 2 ? '#F0A58C' : '#F3C9A8', zapato: '#B98A52',
    brazo: foto ? [7, -26] : [6, -19],
    torso: function (c, y) {
      c.lineWidth = 1;
      if (v % 2 === 0) { circ(c, -1, y + 4, 1.2, '#FFFFFF', false); circ(c, 2.6, y + 8, 1.2, '#FFFFFF', false); circ(c, 2, y + 2.6, 1, '#3F8F4B', false); circ(c, -2, y + 9, 1, '#3F8F4B', false); }
      linea(c, [-2, y + 1], [3, y + 7], TINTA);
      c.lineWidth = 1.5;
    },
    cabeza: function (c, y) {
      if (v % 3 === 0) { elip(c, .8, y - 3.2, 9, 2.6, '#E6CF8E'); c.fillStyle = '#E6CF8E'; c.beginPath(); c.arc(.8, y - 3.6, 5.2, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 1.5; linea(c, [-4.2, y - 4], [5.8, y - 4], '#D0392B'); }
      else if (v % 3 === 1) { c.fillStyle = '#F4F1EA'; c.beginPath(); c.arc(.6, y - 1.6, 6, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); elip(c, 7.2, y - 1.8, 3.4, 1.3, '#F4F1EA'); }
      else { c.fillStyle = '#C9A24A'; c.beginPath(); c.arc(.2, y - .8, 6, Math.PI * .9, Math.PI * 1.9); c.closePath(); c.fill(); c.stroke(); }
      c.lineWidth = 1; c.fillStyle = '#1A1A1A'; c.beginPath(); c.rect(1.8, y - 1.8, 4.2, 2.4); c.fill(); c.lineWidth = 1.5;
    }
  });
  const cy = foto ? -27 : -18;
  c.lineWidth = 1.2; c.fillStyle = '#2B2B2B'; c.strokeStyle = TINTA; c.beginPath(); c.rect(5, cy - 2.5, 6, 4.4); c.fill(); c.stroke(); circ(c, 10.5, cy - .3, 1.7, '#8FC3DD');
  if (foto) { c.fillStyle = '#FFFFFF'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 2.5 : 7; c.lineTo(13 + Math.cos(a) * r, cy - 3 + Math.sin(a) * r); } c.closePath(); c.fill(); }
  c.lineWidth = 1.5;
};

/* ---------- Varios ---------- */
function dibMulta(c, x, y, giro) {
  c.save(); c.translate(x, y); c.rotate(giro);
  c.lineWidth = 1.2; c.fillStyle = '#FFFFFF'; c.strokeStyle = TINTA;
  c.beginPath(); c.rect(-4, -5, 8, 10); c.fill(); c.stroke();
  c.lineWidth = 1; linea(c, [-2, -2.5], [2, -2.5], '#D0392B'); linea(c, [-2, 0], [2, 0], '#888'); linea(c, [-2, 2.2], [1, 2.2], '#888');
  c.restore();
}
function dibVida(c, x, y, ancho, f, propia) {
  c.fillStyle = TINTA; c.fillRect(x - ancho / 2 - 1, y - 1, ancho + 2, 6);
  c.fillStyle = '#5A4A3A'; c.fillRect(x - ancho / 2, y, ancho, 4);
  c.fillStyle = propia ? (f > .5 ? '#7BD45A' : f > .25 ? '#F2D16B' : '#E24B4A') : '#E24B4A';
  c.fillRect(x - ancho / 2, y, ancho * Math.max(0, f), 4);
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - ancho / 2, y, ancho * Math.max(0, f), 1.3);
}
function dibRombo(c, x, y, tam, col, w, relleno) {
  c.lineWidth = w || 2;
  poli(c, [iso(x, y), iso(x + tam, y), iso(x + tam, y + tam), iso(x, y + tam)], relleno || null, col);
}

/* ---------- Terreno por trozos, a la resolución de la pantalla ---------- */
const T_BASE = [['#CDAA70', '#C6A167', '#BF9A60'], ['#AAB56B', '#A0AC62', '#B3BC74'], ['#7E8188', '#787B82', '#84878E'], ['#DCD2C3', '#D4CABA', '#E2D9CB']];
function dibCasilla(c, tiles, N, x, y) {
  const tp = tiles[y * N + x], r = azar(x, y), r2 = azar(x + 91, y + 37);
  const col = T_BASE[tp][Math.floor(r * 3)];
  c.lineWidth = 1;
  poli(c, [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)], col, col);
  const p = iso(x + .5, y + .5);
  if (tp === 0) {
    if (r2 < .16) elip(c, p[0] + (r - .5) * 20, p[1] + (r2 - .08) * 40, 7, 3, 'rgba(120,85,40,.22)', false);
    if (r2 > .5 && r2 < .62) { c.lineWidth = 1; const a = [p[0] - 9 + r * 8, p[1] - 2]; linea(c, a, [a[0] + 6, a[1] + 3], '#A8834A'); linea(c, [a[0] + 6, a[1] + 3], [a[0] + 9, a[1] + 1.5], '#A8834A'); linea(c, [a[0] + 6, a[1] + 3], [a[0] + 8, a[1] + 6], '#A8834A'); }
    if (r > .86) { c.lineWidth = 1; elip(c, p[0] - 6, p[1] + 2, 3.4, 2, '#A39B8E', '#7E766A'); elip(c, p[0] - 1.5, p[1] + 4, 2, 1.3, '#B5AD9F', '#7E766A'); }
    else if (r > .74) { c.lineWidth = 1.4; const q = [p[0] + (r2 - .5) * 22, p[1] + 3]; linea(c, q, [q[0] - 3.5, q[1] - 7], '#8E9A4E'); linea(c, q, [q[0] + 3.5, q[1] - 6], '#9FAA5C'); linea(c, q, [q[0], q[1] - 8.5], '#8E9A4E'); linea(c, q, [q[0] + 1.6, q[1] - 5], '#7F8C45'); }
    else if (r < .018) { c.lineWidth = 1; elip(c, p[0], p[1], 8, 3.6, '#8FB4C6', '#7A6A4A'); elip(c, p[0] - 2, p[1] - .8, 3, 1.1, 'rgba(255,255,255,.5)', false); }
    else if (r < .04) { c.lineWidth = 1; c.save(); c.translate(p[0] + 5, p[1] + 2); c.rotate(.5); c.fillStyle = r2 > .5 ? '#D0392B' : '#C9CED3'; c.strokeStyle = TINTA; c.beginPath(); c.rect(-3, -1.6, 6, 3.2); c.fill(); c.stroke(); c.restore(); }
  } else if (tp === 1) {
    c.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { const q = [p[0] - 16 + azar(x + i, y * 3) * 32, p[1] - 6 + azar(x * 3, y + i) * 12]; linea(c, q, [q[0] - 2.5, q[1] - 6], '#7F8C45'); linea(c, q, [q[0] + 2.5, q[1] - 6], '#8E9A4E'); linea(c, q, [q[0], q[1] - 7.5], '#6F7C3A'); }
    if (r2 > .7) { c.lineWidth = 1; circ(c, p[0] + 8, p[1] - 3, 1.5, r > .5 ? '#F2EDE4' : '#F2D16B', false); circ(c, p[0] - 9, p[1] + 3, 1.3, '#F2EDE4', false); }
  } else if (tp === 2) {
    const vx = (x - 30) % 4 === 0, hy = y % 4 === 0;
    c.lineWidth = 2;
    if (vx && !hy) linea(c, iso(x + .5, y + .2), iso(x + .5, y + .8), '#E4E0D4');
    else if (hy && !vx) linea(c, iso(x + .2, y + .5), iso(x + .8, y + .5), '#E4E0D4');
    c.lineWidth = 1;
    if (r2 > .8) { const a = [p[0] - 10 + r * 12, p[1] - 3]; linea(c, a, [a[0] + 5, a[1] + 2], '#5E6168'); linea(c, [a[0] + 5, a[1] + 2], [a[0] + 7, a[1] + 6], '#5E6168'); linea(c, [a[0] + 5, a[1] + 2], [a[0] + 11, a[1] + 1], '#5E6168'); }
    if (r < .05) { elip(c, p[0], p[1], 7, 3.5, '#5E6168', '#3F4248'); linea(c, [p[0] - 5, p[1]], [p[0] + 5, p[1]], '#3F4248'); }
    if (r2 < .12) elip(c, p[0] + 4, p[1] + 1, 8, 3.5, 'rgba(40,40,46,.2)', false);
  } else {
    c.lineWidth = 1;
    linea(c, iso(x + .5, y), iso(x + .5, y + 1), '#BDB3A3'); linea(c, iso(x, y + .5), iso(x + 1, y + .5), '#BDB3A3');
    linea(c, iso(x, y), iso(x + 1, y), '#B0A696'); linea(c, iso(x, y), iso(x, y + 1), '#B0A696');
    if (r > .8) poli(c, [iso(x, y), iso(x + .5, y), iso(x + .5, y + .5), iso(x, y + .5)], 'rgba(120,105,85,.14)', false);
    if (r2 > .88) elip(c, p[0] + 6, p[1] + 3, 4, 1.8, 'rgba(90,75,55,.25)', false);
  }
}
function pintarTrozo(tiles, N, x0, y0, tam, esc) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = Math.ceil((tam + 2) * esc);
  const c = cv.getContext('2d');
  c.fillStyle = PAPEL; c.fillRect(0, 0, cv.width, cv.height);
  c.scale(esc, esc); c.translate(-x0, -y0);
  c.lineJoin = 'round';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = (x - y) * 32, py = (x + y) * 16;
    if (px < x0 - 48 || px > x0 + tam + 48 || py < y0 - 48 || py > y0 + tam + 20) continue;
    dibCasilla(c, tiles, N, x, y);
  }
  c.lineWidth = 3;
  poli(c, [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)], null, TINTA);
  return cv;
}

/* ---------- v0.3: chatarrería, vendedora de romero y estética de cartel ---------- */
DIB.chatarreria = function (c, e, t) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  sombra(c, x + .15, y + .15, x + 1.85, y + 1.85, 20);
  poli(c, [iso(x + .15, y + .15), iso(x + 1.85, y + .15), iso(x + 1.85, y + 1.85), iso(x + .15, y + 1.85)], '#9C8C74');
  const k = Caja(x + .2, y + .2, x + 1.0, y + 1.35, 24);
  dibCaja(c, k, '#8C9A8A', '#B5532A', '#8F3F1E');
  rayas(c, k.izq, 6, 0, 24, '#8F3F1E'); rayas(c, k.der, 8, 0, 24, '#6E2F16');
  ventana(c, k.izq, .25, .75, 10, 20, '#F2D16B', '#6B5B4B');
  puerta(c, k.der, .36, .66, 17, '#5A4027');
  c.lineWidth = 1; for (let i = 1; i < 6; i++) linea(c, k.sup(i / 6, 0), k.sup(i / 6, 1), '#6F7D6E'); c.lineWidth = 2;
  // montón del patio
  const m = iso(x + 1.45, y + .8); c.lineWidth = 1.5;
  poli(c, [[m[0] - 14, m[1] + 4], [m[0] - 8, m[1] - 12], [m[0] + 3, m[1] - 16], [m[0] + 13, m[1] - 2], [m[0] + 8, m[1] + 6]], '#6E7880');
  poli(c, [[m[0] - 6, m[1] + 5], [m[0] - 1, m[1] - 10], [m[0] + 9, m[1] - 6], [m[0] + 11, m[1] + 5]], '#B5532A');
  elip(c, m[0] - 8, m[1] + 4, 6, 3.4, '#26221F'); circ(c, m[0] + 4, m[1] - 13, 3, '#C9CED3');
  // grúa con imán
  const g = k.sup(.5, .5), bal = Math.sin(t * 1.5) * 3;
  c.lineWidth = 3.4; linea(c, g, [g[0], g[1] - 30], TINTA); c.lineWidth = 1.6; linea(c, g, [g[0], g[1] - 30], '#D9A521');
  c.lineWidth = 3.4; linea(c, [g[0] - 6, g[1] - 27], [g[0] + 36, g[1] - 22], TINTA); c.lineWidth = 1.6; linea(c, [g[0] - 6, g[1] - 27], [g[0] + 36, g[1] - 22], '#D9A521');
  c.lineWidth = 1; linea(c, [g[0] + 34, g[1] - 22], [g[0] + 34 + bal * .4, g[1] - 6 + bal], TINTA);
  c.lineWidth = 1.5; elip(c, g[0] + 34 + bal * .4, g[1] - 5 + bal, 6, 2.6, '#3A3A3A'); poli(c, [[g[0] + 30 + bal * .4, g[1] - 3 + bal], [g[0] + 37 + bal * .4, g[1] - 4 + bal], [g[0] + 35 + bal * .4, g[1] + 2 + bal]], '#8E979E');
  // valla
  const v = Caja(x + .15, y + .15, x + 1.85, y + 1.85, 11);
  c.lineWidth = 2;
  panel(c, v.izq, 0, .52, 0, 11, '#5E7B6A'); rayas(c, v.izq, 8, 0, 11, '#3F5A4A', 0, .52);
  panel(c, v.izq, .86, 1, 0, 11, '#5E7B6A');
  panel(c, v.der, 0, 1, 0, 11, '#4C6657'); rayas(c, v.der, 14, 0, 11, '#35503F');
  const r = v.izq(.26, 11);
  linea(c, [r[0] - 14, r[1] + 6], [r[0] - 14, r[1] - 6]); linea(c, [r[0] + 14, r[1] - 8], [r[0] + 14, r[1] - 20]);
  c.save(); c.translate(r[0], r[1] - 12); c.transform(1, .5, 0, 1, 0, 0);
  c.fillStyle = '#F1E6CC'; c.strokeStyle = TINTA; c.lineWidth = 1.5; c.beginPath(); c.rect(-19, -7, 38, 12); c.fill(); c.stroke();
  c.fillStyle = '#B4432B'; c.font = 'bold 7.5px Federo, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CHATARRA', 0, -.6);
  c.restore(); c.lineWidth = 2;
};

DIB.romero = function (c, u, t) {
  const tr = u.trabaja, my = tr ? -22 + Math.sin(t * 6) * 2 : -17, mx = tr ? 9 : 7;
  const bob = persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#4A5A44', oscuro: '#3A4836', falda: '#6B5340', volante: '#57422F', piel: '#D9A27A', zapato: '#3A2A20',
    sinBrazoTrasero: true, brazo: [mx, my],
    detras: function (c, Y, sw) {
      c.lineWidth = 1.3;
      for (let i = 0; i < 4; i++) { const bx = -11 + i * 2.2; linea(c, [bx, -13 + Y], [bx - 1 + i * .6, -21 + Y], '#5E7B4A'); linea(c, [bx - .5 + i * .3, -17 + Y], [bx - 2.2 + i * .3, -18.6 + Y], '#5E7B4A'); linea(c, [bx - .5 + i * .3, -17 + Y], [bx + 1.4, -19 + Y], '#5E7B4A'); }
      poli(c, [[-13, -13.5 + Y], [-3, -13.5 + Y], [-4.5, -7 + Y], [-11.5, -7 + Y]], '#C99A5E');
      c.lineWidth = 1; linea(c, [-12.5, -11 + Y], [-3.6, -11 + Y], '#8E6A38'); linea(c, [-10, -13.5 + Y], [-9.4, -7 + Y], '#8E6A38'); linea(c, [-6.4, -13.5 + Y], [-6.8, -7 + Y], '#8E6A38'); c.lineWidth = 1.5;
    },
    torso: function (c, y) { c.lineWidth = 1.2; poli(c, [[-1.6, y + 5], [4.6, y + 5], [4.6, y + 13], [-1.6, y + 13]], '#F1E6CC'); c.lineWidth = 1.5; },
    cabeza: function (c, y) {
      c.fillStyle = '#B4432B'; c.beginPath(); c.arc(.4, y - 1, 6.2, Math.PI * .8, Math.PI * 1.97); c.closePath(); c.fill(); c.stroke();
      poli(c, [[-4.6, y + 2], [-8.5, y + 4.5], [-5.4, y + 6]], '#B4432B');
      c.lineWidth = 1.2; linea(c, [3.4, y - 4.6], [6.2, y - 3.6], '#C9C4BA'); c.lineWidth = 1.5;
    }
  });
  c.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) { const ex = mx + i * 2.6, ey = my - 9 - bob - Math.abs(i); linea(c, [mx, my - bob], [ex, ey], '#5E7B4A'); linea(c, [mx + i * 1.3, my - 4.5 - bob], [mx + i * 1.3 + 2, my - 6 - bob], '#6F9058'); linea(c, [mx + i * 1.3, my - 4.5 - bob], [mx + i * 1.3 - 2, my - 6.4 - bob], '#6F9058'); }
  if (tr) { const f = (t * .8) % 1; c.globalAlpha = 1 - f; c.lineWidth = 1; circ(c, 14, -30 - f * 10, 2.6, '#F2D16B'); c.globalAlpha = 1; }
  c.lineWidth = 1.5;
};

function dibHalo(c, x, y, col) {
  c.lineWidth = 4.4; elip(c, x, y, 14.5, 7.2, null, TINTA);
  c.lineWidth = 2.2; elip(c, x, y, 14.5, 7.2, null, col);
  c.lineWidth = 1; elip(c, x, y, 10.6, 5.2, null, col);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .39; circ(c, x + Math.cos(a) * 12.5, y + Math.sin(a) * 6.2, 1.1, '#F6EAD0', false); }
}
function medallonFondo(c, x, y, r) {
  const g = c.createRadialGradient(x - r * .3, y - r * .45, r * .1, x, y, r);
  g.addColorStop(0, '#FBF3DF'); g.addColorStop(.55, '#F2D3A6'); g.addColorStop(1, '#D8A39A');
  circ(c, x, y, r, g, false);
  c.lineWidth = Math.max(.6, r * .012);
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; linea(c, [x + Math.cos(a) * r * .3, y + Math.sin(a) * r * .3], [x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8], 'rgba(180,67,43,.16)'); }
}
function medallonAro(c, x, y, r) {
  c.lineWidth = r * .2; circ(c, x, y, r * .9, null, '#3D4A34');
  c.lineWidth = Math.max(1.5, r * .035); circ(c, x, y, r, null, TINTA); circ(c, x, y, r * .8, null, TINTA);
  c.lineWidth = Math.max(.8, r * .015);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, px = x + Math.cos(a) * r * .9, py = y + Math.sin(a) * r * .9, q = r * .055;
    if (i % 2) circ(c, px, py, q, '#D9A521'); else poli(c, [[px, py - q * 1.3], [px + q * 1.1, py], [px, py + q * 1.3], [px - q * 1.1, py]], '#F1E6CC');
  }
}
function ramaRomero(c, x, y, r, a0, a1, t) {
  c.lineCap = 'round';
  const n = 26;
  c.beginPath();
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, rr = r + Math.sin(i * .7) * 3; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
  c.lineWidth = 3; c.strokeStyle = '#3D4A34'; c.stroke();
  for (let i = 1; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, rr = r + Math.sin(i * .7) * 3, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    const l = 13 - i * .22, w = Math.sin(t * 1.5 + i * .6) * .06;
    for (let s = -1; s <= 1; s += 2) { const b = a + s * (1.05 + w) + (a1 > a0 ? .5 : -.5); c.lineWidth = 2.6; linea(c, [px, py], [px + Math.cos(b) * l, py + Math.sin(b) * l], i % 3 ? '#5E7B4A' : '#7A9A62'); }
    if (i % 5 === 0) { c.lineWidth = 1; circ(c, px + Math.cos(a) * 5, py + Math.sin(a) * 5, 2.4, '#B9A6D6'); }
  }
}
function pintarCartel(c, t, w, h) {
  c.clearRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#F6E9C9'); g.addColorStop(.6, '#F3D2A8'); g.addColorStop(1, '#E6B59A');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.lineJoin = 'round';
  // siluetas planas: chabolas a la izquierda, ciudad a la derecha
  const b = h - 18;
  poli(c, [[0, b], [0, b - 46], [38, b - 60], [74, b - 44], [74, b - 30], [96, b - 30], [104, b - 70], [150, b - 78], [156, b - 40], [176, b - 40], [176, b]], '#5E6B45', false);
  linea(c, [128, b - 76], [128, b - 104], '#5E6B45', 2.5); linea(c, [120, b - 98], [136, b - 98], '#5E6B45', 2.5); linea(c, [122, b - 90], [134, b - 90], '#5E6B45', 2.5);
  poli(c, [[w, b], [w, b - 96], [w - 44, b - 96], [w - 44, b - 62], [w - 70, b - 62], [w - 70, b - 124], [w - 84, b - 150], [w - 98, b - 124], [w - 98, b - 80], [w - 150, b - 80], [w - 150, b - 48], [w - 182, b - 48], [w - 182, b]], '#B4432B', false);
  c.lineWidth = 2; circ(c, w - 84, b - 112, 8, '#F1E6CC', false); linea(c, [w - 84, b - 112], [w - 84, b - 118], '#B4432B', 1.6); linea(c, [w - 84, b - 112], [w - 80, b - 110], '#B4432B', 1.6);
  c.fillStyle = '#F2D16B'; for (let i = 0; i < 9; i++) c.fillRect(w - 140 + (i % 3) * 14, b - 70 + Math.floor(i / 3) * 14, 6, 8);
  c.fillStyle = '#3D4A34'; c.fillRect(0, b, w, h - b);
  // medallón con la echadora
  const mx = w / 2, my = h * .5, r = h * .43;
  ramaRomero(c, mx, my, r * 1.12, Math.PI * .62, Math.PI * 1.32, t);
  ramaRomero(c, mx, my, r * 1.12, Math.PI * .38, -Math.PI * .32, t);
  medallonFondo(c, mx, my, r);
  c.save(); c.beginPath(); c.arc(mx, my, r * .8, 0, 6.2832); c.clip();
  const e = r / 31;
  c.translate(mx - 3 * e, my + r * .84); c.scale(e, e);
  DIB.echadora(c, { id: 1, anda: false, trabaja: true, carga: 0, golpeT: 0 }, t);
  c.restore();
  medallonAro(c, mx, my, r);
  // estrellas
  c.fillStyle = '#D9A521';
  [[.16, .2], [.86, .16], [.24, .44], [.78, .4], [.1, .58]].forEach(function (q, i) { const s = 3 + (i % 2) * 2 + Math.sin(t * 2 + i) * 1; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? s * .35 : s; c.lineTo(q[0] * w + Math.cos(a) * rr, q[1] * h + Math.sin(a) * rr); } c.closePath(); c.fill(); });
}
function crearGrano() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  let s = 12345; const rnd = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 1500; i++) { c.fillStyle = 'rgba(60,38,16,' + (.05 + rnd() * .16).toFixed(2) + ')'; const r = .3 + rnd() * rnd() * 1.5; c.beginPath(); c.arc(rnd() * 256, rnd() * 256, r, 0, 6.3); c.fill(); }
  for (let i = 0; i < 500; i++) { c.fillStyle = 'rgba(255,248,230,' + (.1 + rnd() * .25).toFixed(2) + ')'; c.beginPath(); c.arc(rnd() * 256, rnd() * 256, .3 + rnd() * 1, 0, 6.3); c.fill(); }
  return cv;
}
