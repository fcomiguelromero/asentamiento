'use strict';
/* Asentamiento — dibujo vectorial por código (estilo cómic) */
const TINTA = '#2A1E14';

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
function azar(x, y) { return (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000; }

/* Caja isométrica: caras visibles izquierda (y = y1) y derecha (x = x1) */
function Caja(x0, y0, x1, y1, h, z0) {
  z0 = z0 || 0;
  return {
    h: h,
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
function panel(c, f, u0, u1, z0, z1, col, borde) {
  poli(c, [f(u0, z0), f(u1, z0), f(u1, z1), f(u0, z1)], col, borde);
}
function rayas(c, f, n, z0, z1, col) {
  c.lineWidth = 1;
  for (let i = 1; i < n; i++) linea(c, f(i / n, z0), f(i / n, z1), col);
  c.lineWidth = 2;
}
function hiladas(c, f, h, paso, col) {
  c.lineWidth = 1;
  for (let z = paso; z < h; z += paso) linea(c, f(0, z), f(1, z), col);
  c.lineWidth = 2;
}

const DIB = {};

/* ---------- Edificios ---------- */
DIB.chabola = function (c, e) {
  const x = e.x, y = e.y, n = e.nivel || 0;
  c.lineWidth = 2; c.lineJoin = 'round';
  const k = Caja(x + .25, y + .25, x + 1.75, y + 1.75, [24, 28, 34][n]);
  if (n === 0) {
    dibCaja(c, k, '#5E8FB0', '#C89B5E', '#B08548');
    panel(c, k.izq, .46, .56, 0, k.h, '#E6CB95', false);
    panel(c, k.der, .1, .9, 9, 13, '#E6CB95', false);
    panel(c, k.izq, .12, .38, 0, 17, '#5A4027');
    c.lineWidth = 1;
    linea(c, k.sup(0, .5), k.sup(1, .5), '#3F6E8C');
    linea(c, k.sup(.5, 0), k.sup(.5, 1), '#3F6E8C');
    c.lineWidth = 2;
    const p = k.sup(.75, .3); elip(c, p[0], p[1], 5, 2.5, '#8E8E8E');
  } else if (n === 1) {
    dibCaja(c, k, '#8C9A8A', '#A3ACA8', '#858F8B');
    rayas(c, k.izq, 9, 0, k.h, '#7A8480');
    rayas(c, k.der, 9, 0, k.h, '#6A7470');
    c.lineWidth = 1;
    for (let i = 1; i < 6; i++) linea(c, k.sup(i / 6, 0), k.sup(i / 6, 1), '#6F7D6E');
    c.lineWidth = 2;
    panel(c, k.izq, .12, .4, 0, 19, '#7A5230');
    panel(c, k.der, .5, .8, 11, 20, '#F2D16B');
    const p = k.sup(.6, .55); elip(c, p[0], p[1], 9, 4.5, '#2B2B2B'); elip(c, p[0], p[1], 4, 2, '#8C9A8A');
  } else {
    dibCaja(c, k, '#D9D2C2', '#C4674A', '#A9543B');
    hiladas(c, k.izq, k.h, 6, '#8F4630');
    hiladas(c, k.der, k.h, 6, '#7C3B28');
    panel(c, k.izq, .12, .4, 0, 21, '#2F6B4F');
    panel(c, k.izq, .58, .86, 12, 23, '#9CCBE0');
    panel(c, k.der, .2, .45, 12, 23, '#9CCBE0');
    panel(c, k.der, .6, .85, 12, 23, '#F2D16B');
    const p = k.sup(.3, .35);
    c.lineWidth = 2; linea(c, p, [p[0], p[1] - 10]);
    elip(c, p[0] + 2, p[1] - 12, 7, 5, '#ECECEC');
    const q = k.sup(.72, .6);
    panel(c, function (u, z) { return [q[0] - 6 + u * 12, q[1] - z]; }, 0, 1, 0, 10, '#3E7CA6');
  }
};

DIB.principal = function (c, e, t) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  const k = Caja(x + .2, y + .2, x + 2.8, y + 2.8, 38);
  dibCaja(c, k, '#8C9A8A', '#C89B5E', '#B08548');
  panel(c, k.izq, 0, .3, 0, 38, '#A3ACA8'); rayas(c, function (u, z) { return k.izq(u * .3, z); }, 5, 0, 38, '#7A8480');
  panel(c, k.izq, .68, 1, 0, 38, '#4F86A8');
  panel(c, k.izq, .4, .6, 0, 24, '#5A4027');
  panel(c, k.izq, .74, .94, 16, 28, '#F2D16B');
  panel(c, k.der, 0, .35, 0, 38, '#B5532A'); rayas(c, function (u, z) { return k.der(u * .35, z); }, 5, 0, 38, '#8F3F1E');
  panel(c, k.der, .65, 1, 0, 38, '#A3ACA8');
  panel(c, k.der, .42, .58, 14, 27, '#9CCBE0');
  c.lineWidth = 1;
  for (let i = 1; i < 9; i++) linea(c, k.sup(i / 9, 0), k.sup(i / 9, 1), '#6F7D6E');
  c.lineWidth = 2;
  poli(c, [k.sup(.55, .1), k.sup(.95, .1), k.sup(.95, .45), k.sup(.55, .45)], '#5E8FB0');
  const a = k.sup(.2, .25);
  linea(c, a, [a[0], a[1] - 26]); linea(c, [a[0] - 7, a[1] - 22], [a[0] + 7, a[1] - 22]); linea(c, [a[0] - 5, a[1] - 17], [a[0] + 5, a[1] - 17]);
  const p1 = k.sup(.1, .95), p2 = k.sup(.9, .95);
  linea(c, p1, [p1[0], p1[1] - 16]); linea(c, p2, [p2[0], p2[1] - 16]);
  c.lineWidth = 1; linea(c, [p1[0], p1[1] - 15], [p2[0], p2[1] - 15]); c.lineWidth = 1.5;
  const cols = ['#E24B4A', '#F2EDE4', '#F2D16B', '#7B3FA0'];
  for (let i = 0; i < 4; i++) {
    const f = (i + 1) / 5, px = p1[0] + (p2[0] - p1[0]) * f, py = p1[1] - 15 + (p2[1] - p1[1]) * f;
    const m = Math.sin(t * 2 + i) * 1.5;
    poli(c, [[px - 4, py], [px + 4, py], [px + 4 + m, py + 9], [px - 4 + m, py + 9]], cols[i]);
  }
  c.lineWidth = 2;
  const ch = k.sup(.75, .7);
  panel(c, function (u, z) { return [ch[0] - 4 + u * 8, ch[1] - z]; }, 0, 1, 0, 12, '#6B5B4B');
  for (let i = 0; i < 3; i++) {
    const f = ((t * .5 + i / 3) % 1);
    c.globalAlpha = (1 - f) * .6 * (c.globalAlpha < 1 ? .5 : 1);
    circ(c, ch[0] + Math.sin(f * 5 + i) * 4, ch[1] - 14 - f * 26, 3 + f * 5, '#EDE7DC', false);
    c.globalAlpha = 1;
  }
};

DIB.taberna = function (c, e) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  const k = Caja(x + .2, y + .2, x + 1.8, y + 1.8, 30);
  dibCaja(c, k, '#B5532A', '#EDE3CF', '#D4C7AD');
  c.lineWidth = 1;
  for (let i = 1; i < 7; i++) linea(c, k.sup(i / 7, 0), k.sup(i / 7, 1), '#8F3F1E');
  c.lineWidth = 2;
  panel(c, k.izq, .36, .64, 0, 19, '#5A4027');
  panel(c, k.der, .2, .5, 10, 21, '#9CCBE0');
  panel(c, k.der, .62, .88, 0, 12, '#7A5230');
  for (let i = 0; i < 6; i++) {
    const u0 = .04 + i * .153, u1 = u0 + .153;
    poli(c, [k.izq(u0, 24), k.izq(u1, 24), iso(x + .2 + u1 * 1.6, y + 2.3, 15), iso(x + .2 + u0 * 1.6, y + 2.3, 15)], i % 2 ? '#F2EDE4' : '#D0392B');
  }
  const s = k.sup(.5, .5);
  c.fillStyle = '#F2D16B'; c.strokeStyle = TINTA;
  c.beginPath(); c.rect(s[0] - 15, s[1] - 22, 30, 13); c.fill(); c.stroke();
  linea(c, [s[0] - 9, s[1] - 9], [s[0] - 9, s[1]]); linea(c, [s[0] + 9, s[1] - 9], [s[0] + 9, s[1]]);
  c.fillStyle = TINTA; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('BAR', s[0], s[1] - 15);
};

DIB.ayuntamiento = function (c, e, t) {
  const x = e.x, y = e.y;
  c.lineWidth = 2; c.lineJoin = 'round';
  dibCaja(c, Caja(x + .1, y + .1, x + 3.9, y + 3.9, 6), '#D8CDB5', '#BFB298', '#A99C82');
  const k = Caja(x + .35, y + .35, x + 3.65, y + 3.65, 50, 6);
  dibCaja(c, k, '#B5532A', '#E6DCC6', '#C9BDA3');
  panel(c, k.izq, 0, 1, 40, 50, '#D8CDB5');
  panel(c, k.der, 0, 1, 40, 50, '#BBAF95');
  for (let i = 0; i < 6; i++) {
    const u = .06 + i * .168;
    panel(c, k.izq, u, u + .07, 0, 40, '#F7F1E1');
  }
  panel(c, k.izq, .41, .59, 0, 27, '#5A4027');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const u = .1 + i * .22;
    panel(c, k.der, u, u + .12, 8 + j * 17, 19 + j * 17, '#5E7F99');
  }
  const tr = Caja(x + 1.5, y + 1.5, x + 2.5, y + 2.5, 30, 56);
  dibCaja(c, tr, '#B5532A', '#E6DCC6', '#C9BDA3');
  const r = tr.izq(.5, 17);
  circ(c, r[0], r[1], 7, '#FFFFFF');
  c.lineWidth = 1.5; linea(c, r, [r[0], r[1] - 5]); linea(c, r, [r[0] + 3, r[1] + 1]); c.lineWidth = 2;
  const m = tr.sup(.5, .5);
  linea(c, m, [m[0], m[1] - 26]);
  const o = Math.sin(t * 3) * 2;
  poli(c, [[m[0], m[1] - 26], [m[0] + 18, m[1] - 23 + o], [m[0], m[1] - 15]], '#6B4E9B');
  circ(c, m[0] + 6, m[1] - 21.5 + o * .3, 2, '#F2D16B', false);
};

DIB.bloque = function (c, e) {
  const x = e.x, y = e.y, h = e.alto;
  c.lineWidth = 2; c.lineJoin = 'round';
  const k = Caja(x + .15, y + .15, x + 1.85, y + 1.85, h);
  const pal = [['#E9C9A0', '#C9A57A'], ['#D9B8B0', '#B8958C'], ['#C9D2C0', '#A5AF9B'], ['#E2D6A8', '#C0B485']][e.tono];
  dibCaja(c, k, '#9A8F86', pal[0], pal[1]);
  const filas = Math.floor((h - 8) / 13);
  for (let j = 0; j < filas; j++) for (let i = 0; i < 3; i++) {
    const u = .12 + i * .29, z = 8 + j * 13;
    c.lineWidth = 1;
    panel(c, k.izq, u, u + .18, z, z + 8, azar(e.id + i, j) > .7 ? '#F2D16B' : '#5E7F99');
    panel(c, k.der, u, u + .18, z, z + 8, azar(e.id + i + 7, j) > .7 ? '#F2D16B' : '#4F6F88');
  }
  c.lineWidth = 2;
};

DIB.monton = function (c, e) {
  const p = iso(e.x + .5, e.y + .5), s = .55 + .45 * Math.min(1, e.cant / e.cantMax);
  c.save(); c.translate(p[0], p[1]); c.scale(s, s);
  c.lineWidth = 2 / s; c.lineJoin = 'round';
  elip(c, 0, 3, 26, 10, 'rgba(40,25,10,.25)', false);
  poli(c, [[-22, 4], [-12, -12], [2, -8], [8, 4]], '#8E979E');
  poli(c, [[-4, 6], [4, -18], [14, -20], [24, 2], [16, 8]], '#B5532A');
  poli(c, [[-16, 8], [-8, -2], [6, 0], [10, 10], [-6, 12]], '#6E7880');
  elip(c, 12, 6, 8, 5, '#2B2B2B'); elip(c, 12, 6, 3.5, 2, '#6E7880');
  c.save(); c.translate(-2, -14); c.rotate(-.5);
  c.fillStyle = '#C9CED3'; c.strokeStyle = TINTA; c.beginPath(); c.rect(-3, -12, 6, 22); c.fill(); c.stroke();
  c.restore();
  poli(c, [[-20, 2], [-14, -4], [-9, 2], [-13, 7]], '#3F8F6B');
  c.restore();
};

DIB.plaza = function (c, e, t) {
  const p = iso(e.x + 1, e.y + 1);
  c.lineWidth = 2;
  elip(c, p[0], p[1], 44, 22, '#CFC5B2');
  elip(c, p[0], p[1] - 7, 44, 22, '#E6DCC6');
  elip(c, p[0], p[1] - 7, 36, 17, '#6FB7D6');
  c.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const f = (t * .6 + i / 3) % 1;
    c.globalAlpha = 1 - f;
    elip(c, p[0], p[1] - 7, 8 + f * 26, 4 + f * 12, null, '#FFFFFF');
    c.globalAlpha = 1;
  }
  c.lineWidth = 2;
  panel(c, function (u, z) { return [p[0] - 5 + u * 10, p[1] - 7 - z]; }, 0, 1, 0, 20, '#E6DCC6');
  elip(c, p[0], p[1] - 28, 11, 5, '#E6DCC6');
  c.lineWidth = 2;
  for (let s = -1; s <= 1; s += 2) {
    c.beginPath(); c.moveTo(p[0], p[1] - 30);
    c.quadraticCurveTo(p[0] + s * 12, p[1] - 44 - Math.sin(t * 6) * 2, p[0] + s * 20, p[1] - 12);
    c.strokeStyle = '#BFE6F5'; c.stroke();
  }
};

/* ---------- Personas ---------- */
function trazo(c, x1, y1, x2, y2, col, w) {
  c.lineCap = 'round';
  c.strokeStyle = TINTA; c.lineWidth = w + 2.4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.lineWidth = 1.6;
}
function persona(c, p) {
  const ph = p.anda ? p.t * 11 : 0, bob = p.anda ? Math.abs(Math.sin(ph)) * 1.5 : 0;
  c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
  elip(c, 0, 0, 9, 3.5, 'rgba(40,25,10,.28)', false);
  if (p.falda) {
    const w = p.anda ? Math.sin(ph) * 1.5 : 0;
    elip(c, -3 + w, -1, 2.6, 1.5, TINTA, false); elip(c, 4 - w, -1, 2.6, 1.5, TINTA, false);
    poli(c, [[-4, -13 - bob], [4, -13 - bob], [8.5 + w, -2], [-8.5 + w, -2]], p.falda);
    if (p.lunar) {
      circ(c, -3 + w * .5, -6, 1.1, p.lunar, false); circ(c, 3 + w * .5, -8, 1.1, p.lunar, false);
      circ(c, 1 + w * .7, -4, 1.1, p.lunar, false); circ(c, -1, -10, 1, p.lunar, false);
    }
  } else {
    for (let k = 0; k < 2; k++) {
      const a = p.anda ? Math.sin(ph + k * Math.PI) * .6 : (k ? .2 : -.2);
      const fx = Math.sin(a) * 10, fy = -11 + Math.cos(a) * 10;
      trazo(c, 0, -11 - bob, fx, fy - .5, p.pant, 3.2);
      elip(c, fx + 1.5, fy, 3, 1.6, TINTA, false);
    }
  }
  c.fillStyle = p.camisa; c.strokeStyle = TINTA;
  c.beginPath(); c.roundRect(-5, -23 - bob, 10, 13, 4); c.fill(); c.stroke();
  if (p.torso) p.torso(c, -23 - bob);
  circ(c, 1, -28 - bob, 5.2, p.piel);
  circ(c, 3.6, -28.5 - bob, .8, TINTA, false);
  if (p.cabeza) p.cabeza(c, -28 - bob);
  const br = p.brazo || [5 + (p.anda ? Math.sin(ph) * 3 : 0), -12];
  trazo(c, 0, -20 - bob, br[0], br[1] - bob, p.manga || p.camisa, 2.6);
  circ(c, br[0], br[1] - bob, 1.8, p.piel);
  return bob;
}

DIB.chatarrero = function (c, u, t) {
  const tr = u.trabaja;
  const bob = persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#2E8B8B', pant: '#34495E', piel: '#E2A77A',
    brazo: tr ? [8, -10 + Math.sin(t * 12) * 5] : [9, -15],
    cabeza: function (c, y) {
      c.fillStyle = '#4A4039'; c.beginPath(); c.arc(.5, y - 1.5, 5.6, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      elip(c, 6.5, y - 1.8, 3.2, 1.3, '#4A4039');
      c.lineWidth = 1.3; c.beginPath(); c.moveTo(2.5, y + 2.6); c.quadraticCurveTo(5, y + 4, 6.5, y + 2.2); c.strokeStyle = TINTA; c.stroke(); c.lineWidth = 1.6;
    }
  });
  if (tr) { trazo(c, 8, -10 + Math.sin(t * 12) * 5, 12, -15 + Math.sin(t * 12) * 5, '#8E979E', 1.6); }
  const j = u.anda ? Math.sin((t + u.id) * 22) * .6 : 0;
  c.lineWidth = 1.6;
  if (u.carga > 0) {
    circ(c, 15, -18 + j, 3.4, '#B5532A');
    c.save(); c.translate(20, -20 - j); c.rotate(-.5); c.fillStyle = '#8E979E'; c.beginPath(); c.rect(-1.6, -5, 3.2, 10); c.fill(); c.stroke(); c.restore();
  }
  poli(c, [[11, -16], [25, -16], [23, -7], [13, -7]], '#D5DADF');
  c.lineWidth = 1; linea(c, [15.5, -16], [16.5, -7]); linea(c, [20.5, -16], [19.5, -7]); linea(c, [12, -11.5], [24, -11.5]);
  c.lineWidth = 1.6; linea(c, [11, -16], [8.5, -17.5 - bob * .4]);
  linea(c, [14, -7], [14, -3.5]); linea(c, [22, -7], [22, -3.5]);
  circ(c, 14, -2.4, 2.3, '#3A3A3A'); circ(c, 22, -2.4, 2.3, '#3A3A3A');
};

DIB.echadora = function (c, u, t) {
  const tr = u.trabaja;
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#C0392B', falda: '#7B3FA0', lunar: '#F2D16B', piel: '#D99B6C',
    brazo: tr ? [8, -18 + Math.sin(t * 5) * 1.5] : (u.carga > 0 ? [7, -16] : null),
    cabeza: function (c, y) {
      c.fillStyle = '#1E1612'; c.beginPath(); c.arc(.2, y - .8, 5.6, Math.PI * .95, Math.PI * 1.9); c.closePath(); c.fill(); c.stroke();
      circ(c, -4.6, y - 3.6, 3, '#1E1612');
      circ(c, -1.6, y - 5.6, 1.7, '#E24B4A');
      circ(c, -.6, y + 2.6, 1.1, '#F2D16B', false);
    }
  });
  if (u.carga > 0 && !tr) { circ(c, 9, -20, 2.8, '#F2D16B'); }
  if (tr) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + i * 2.1;
      c.fillStyle = '#FFF3B0'; c.beginPath();
      c.arc(11 + Math.cos(a) * 5, -24 + Math.sin(a) * 4, 1.3, 0, 6.3); c.fill();
    }
  }
};

DIB.navajero = function (c, u, t) {
  const g = u.golpeT > 0;
  const mano = g ? [12, -17] : [6.5, -13];
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#F2EDE4', manga: '#F2EDE4', pant: '#2B2B33', piel: '#D99B6C', brazo: mano,
    torso: function (c, y) {
      c.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) linea(c, [-4.2, y + 3.2 + i * 3.2], [4.2, y + 3.2 + i * 3.2], '#2B2B33');
      c.lineWidth = 1.6;
      poli(c, [[-3, y + .5], [3.5, y + .5], [.5, y + 4.5]], '#D0392B');
    },
    cabeza: function (c, y) {
      c.fillStyle = '#1E1612'; c.beginPath(); c.arc(.6, y - 1, 5.5, Math.PI * .9, Math.PI * 1.95); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#1E1612'; c.fillRect(-1.2, y - 1, 2, 4.6);
    }
  });
  const b = u.anda ? Math.abs(Math.sin((t + u.id) * 11)) * 1.5 : 0;
  trazo(c, mano[0] + 1, mano[1] - 1 - b, mano[0] + 6.5, mano[1] - 4.5 - b, '#E8EEF2', 1.5);
};

DIB.policia = function (c, u, t) {
  const g = u.golpeT > 0;
  const mano = g ? [11, -14] : [6, -17];
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#27408B', pant: '#1B2A5C', piel: '#E8B48A', brazo: mano,
    torso: function (c, y) { circ(c, 2.4, y + 4, 1.2, '#F2D16B', false); },
    cabeza: function (c, y) {
      c.fillStyle = '#1B2A5C'; c.beginPath(); c.arc(.5, y - 2, 5.7, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
      c.lineWidth = 1.4; linea(c, [-4.6, y - 2.4], [5.6, y - 2.4], '#F2D16B'); c.lineWidth = 1.6;
      elip(c, 6.6, y - 2, 3, 1.2, '#10183A');
    }
  });
  const b = u.anda ? Math.abs(Math.sin((t + u.id) * 11)) * 1.5 : 0;
  if (g) trazo(c, mano[0], mano[1] - b, mano[0] + 7, mano[1] + 2 - b, '#1A1A1A', 1.8);
  else trazo(c, mano[0], mano[1] - b, mano[0] + 3, mano[1] - 8 - b, '#1A1A1A', 1.8);
};

DIB.inspector = function (c, u, t) {
  const g = u.golpeT > 0;
  persona(c, {
    t: t + u.id, anda: u.anda, camisa: '#8A8F98', pant: '#5C6068', piel: '#EFC6A0',
    brazo: g ? [10, -24] : [6, -13],
    torso: function (c, y) {
      poli(c, [[0, y + 1], [3, y + 1], [1.5, y + 4]], '#F2EDE4', false);
      c.lineWidth = 1.6; linea(c, [1.5, y + 2], [1.5, y + 9], '#D0392B');
    },
    cabeza: function (c, y) {
      c.fillStyle = '#7A5230'; c.beginPath(); c.arc(-.6, y - .4, 5.4, Math.PI * .75, Math.PI * 1.35); c.closePath(); c.fill(); c.stroke();
      c.lineWidth = 1.2; c.strokeStyle = TINTA; c.strokeRect(2, y - 2, 3.4, 2.6); c.lineWidth = 1.6;
    }
  });
  const b = u.anda ? Math.abs(Math.sin((t + u.id) * 11)) * 1.5 : 0;
  if (!g) { c.fillStyle = '#F2D16B'; c.strokeStyle = TINTA; c.beginPath(); c.rect(3, -15 - b, 6, 7.5); c.fill(); c.stroke(); }
};

/* ---------- Varios ---------- */
function dibMulta(c, x, y, giro) {
  c.save(); c.translate(x, y); c.rotate(giro);
  c.lineWidth = 1.2; c.fillStyle = '#FFFFFF'; c.strokeStyle = TINTA;
  c.beginPath(); c.rect(-4, -5, 8, 10); c.fill(); c.stroke();
  c.lineWidth = 1; linea(c, [-2, -2], [2, -2], '#D0392B'); linea(c, [-2, 1], [2, 1], '#888');
  c.restore();
}
function dibVida(c, x, y, ancho, f, propia) {
  c.fillStyle = TINTA; c.fillRect(x - ancho / 2 - 1, y - 1, ancho + 2, 6);
  c.fillStyle = '#5A4A3A'; c.fillRect(x - ancho / 2, y, ancho, 4);
  c.fillStyle = propia ? (f > .5 ? '#7BD45A' : f > .25 ? '#F2D16B' : '#E24B4A') : '#E24B4A';
  c.fillRect(x - ancho / 2, y, ancho * Math.max(0, f), 4);
}
function dibRombo(c, x, y, tam, col, w, relleno) {
  c.lineWidth = w || 2;
  poli(c, [iso(x, y), iso(x + tam, y), iso(x + tam, y + tam), iso(x, y + tam)], relleno || null, col);
}

/* Terreno prerenderizado */
function pintarTerreno(tiles, N) {
  const cv = document.createElement('canvas');
  cv.width = N * 64; cv.height = N * 32 + 60;
  const c = cv.getContext('2d');
  c.translate(N * 32, 40);
  const base = ['#C8A46A', '#A9B36A', '#7C7F86', '#D9CFC0'];
  const alt = ['#C19C62', '#9FAA60', '#74777E', '#D0C6B6'];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const tp = tiles[y * N + x], r = azar(x, y);
    const col = r > .5 ? base[tp] : alt[tp];
    c.lineWidth = 1;
    poli(c, [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)], col, tp === 3 ? '#BDB3A3' : col);
    const p = iso(x + .5, y + .5);
    if (tp === 0) {
      if (r < .12) elip(c, p[0] + 6, p[1] - 2, 5, 2.2, '#B28D55', false);
      else if (r > .9) { elip(c, p[0] - 5, p[1] + 2, 3, 1.8, '#9B9488', false); }
      else if (r > .82) { c.lineWidth = 1.5; linea(c, [p[0], p[1]], [p[0] - 3, p[1] - 6], '#8E9A4E'); linea(c, [p[0], p[1]], [p[0] + 3, p[1] - 5], '#8E9A4E'); linea(c, [p[0], p[1]], [p[0], p[1] - 7], '#8E9A4E'); }
    } else if (tp === 1) {
      if (r > .6) { c.lineWidth = 1.5; linea(c, [p[0] - 6, p[1]], [p[0] - 8, p[1] - 6], '#7F8C45'); linea(c, [p[0] - 6, p[1]], [p[0] - 4, p[1] - 6], '#7F8C45'); linea(c, [p[0] + 7, p[1] + 3], [p[0] + 8, p[1] - 3], '#7F8C45'); }
    } else if (tp === 2) {
      if ((x + y) % 4 === 0) { c.lineWidth = 2; linea(c, iso(x + .3, y + .5), iso(x + .7, y + .5), '#D8D4C8'); }
    }
  }
  c.lineWidth = 3;
  poli(c, [iso(0, 0), iso(N, 0), iso(N, N), iso(0, N)], null, TINTA);
  return cv;
}
