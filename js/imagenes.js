'use strict';
/* Asentamiento — ilustraciones (v0.4). Si una imagen falta o no ha cargado, se usa el dibujo por código. */
const IMG = {};
const IMG_CONF = {
  // ancho relativo a la base isométrica (tam × 64 px) y ajuste vertical en píxeles del mundo
  'casa-patriarca': { f: 1.02, dy: 6 },
  'chabola-carton': { f: 1.0, dy: 2 },
  'chabola-uralita': { f: 1.0, dy: 2 },
  'chabola-ladrillo01': { f: .98, dy: 2 },
  'chabola-ladrillo02': { f: .98, dy: 2 },
  'chabola-ladrillo03': { f: .98, dy: 2 },
  'taberna': { f: 1.06, dy: 3 },
  'chatarreria': { f: 1.08, dy: 4 },
  'ayuntamiento': { f: 1.04, dy: 6 },
  'bloque-1': { f: 1.0, dy: 2 }, 'bloque-2': { f: 1.0, dy: 2 }, 'bloque-3': { f: 1.0, dy: 2 }, 'bloque-4': { f: 1.0, dy: 2 },
  'fuente': { f: .78, dy: -20 },
  'monton-chatarra': { f: 1.25, dy: -8 }
};
['retrato-chatarrero', 'retrato-echadora', 'retrato-navajero', 'retrato-patriarca', 'retrato-romero', 'cartel-inicio'].forEach(function (k) { IMG_CONF[k] = IMG_CONF[k] || {}; });
['taberna-obra', 'chatarreria-obra', 'chabola-carton-obra', 'chabola-uralita-obra', 'chabola-ladrillo-obra', 'obra-solar',
  'ayuntamiento-danado', 'ayuntamiento-ruina', 'ayuntamiento-ocupado', 'ruinas', 'contenedor'].forEach(function (k) { if (!IMG_CONF[k]) IMG_CONF[k] = { f: 1, dy: 2, opcional: true }; });

const DISPONIBLES = ["ayuntamiento", "bloque-1", "bloque-2", "bloque-3", "bloque-4", "cartel-inicio", "casa-patriarca", "chabola-carton", "chabola-ladrillo01", "chabola-ladrillo02", "chabola-ladrillo03", "chabola-uralita", "chatarreria", "fuente", "monton-chatarra", "retrato-chatarrero", "retrato-echadora", "retrato-navajero", "retrato-patriarca", "retrato-romero", "taberna"];
Object.keys(IMG_CONF).filter(function (k) { return DISPONIBLES.indexOf(k) >= 0; }).forEach(function (k) {
  const im = new Image();
  im.onload = function () { IMG[k] = im; };
  im.onerror = function () { };
  im.src = 'img/' + k + '.webp';
});

function claveImagen(e) {
  switch (e.k) {
    case 'chabola': return e.nivel === 2 ? 'chabola-ladrillo0' + (1 + e.id % 3) : e.nivel === 1 ? 'chabola-uralita' : 'chabola-carton';
    case 'principal': return 'casa-patriarca';
    case 'bloque': return (e.ocupado && IMG['bloque-' + (e.tono + 1) + '-ocupado']) ? 'bloque-' + (e.tono + 1) + '-ocupado' : 'bloque-' + (e.tono + 1);
    case 'plaza': return 'fuente';
    case 'monton': return 'monton-chatarra';
    case 'ayuntamiento': {
      const f = e.hp / e.hpMax;
      if (e.ocupadoPor0 && IMG['ayuntamiento-ocupado']) return 'ayuntamiento-ocupado';
      if (f < .34 && IMG['ayuntamiento-ruina']) return 'ayuntamiento-ruina';
      if (f < .67 && IMG['ayuntamiento-danado']) return 'ayuntamiento-danado';
      return 'ayuntamiento';
    }
    default: return e.k;
  }
}
function claveObra(e) {
  if (e.k === 'chabola') return 'chabola-carton-obra';
  return e.k + '-obra';
}
function claveMejora(e) {
  if (e.k === 'chabola') return (e.nivel || 0) === 0 ? 'chabola-uralita-obra' : 'chabola-ladrillo-obra';
  return null;
}

/* Dibuja la imagen con su base apoyada en el rombo de la casilla. Devuelve la altura dibujada o 0. */
function ponerImagen(c, k, x, y, tam, escala) {
  const im = IMG[k]; if (!im) return 0;
  const conf = IMG_CONF[k] || { f: 1, dy: 0 };
  const W = tam * 64 * conf.f * (escala || 1), Hh = W * im.height / im.width;
  const b = iso(x + tam, y + tam);
  const x0 = b[0] - W / 2, y0 = b[1] - Hh + conf.dy * (escala || 1);
  c.drawImage(im, x0, y0, W, Hh);
  if (ANIM[k]) ANIM[k](c, x0, y0, W, Hh, performance.now() / 1000, x + y);
  return Hh;
}

/* Animaciones superpuestas a las ilustraciones (coordenadas en fracciones de la imagen) */
function humoChimenea(c, x, y, s, t, n) {
  const ga = c.globalAlpha;
  for (let i = 0; i < 5; i++) {
    const f = (t * .35 + i / 5 + n * .17) % 1;
    c.globalAlpha = ga * (1 - f) * .75;
    c.lineWidth = 1;
    circ(c, x + (Math.sin(f * 5 + i + n) * 3 + f * 9) * s, y - f * 34 * s, (2.5 + f * 7) * s, '#F3EEE5', 'rgba(90,80,70,.35)');
  }
  c.globalAlpha = ga;
}
const CHORROS = [[.34, .22, .25, .52], [.39, .28, .32, .65], [.61, .28, .68, .65], [.66, .22, .76, .52]];
const ANIM = {
  'casa-patriarca': function (c, x, y, w, h, t, n) { humoChimenea(c, x + w * .745, y + h * .075, w / 200, t, n); },
  'chabola-uralita': function (c, x, y, w, h, t, n) { humoChimenea(c, x + w * .75, y + h * .1, w / 140, t, n); },
  'fuente': function (c, x, y, w, h, t) {
    const ga = c.globalAlpha;
    c.lineCap = 'round';
    // agua que cae por los chorros
    CHORROS.forEach(function (q, i) {
      const ax = x + q[0] * w, ay = y + q[1] * h, bx = x + q[2] * w, by = y + q[3] * h;
      const cxp = ax + (bx - ax) * .35 + (q[0] < .5 ? -1 : 1) * w * .04, cyp = ay - h * .04;
      c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(cxp, cyp, bx, by);
      c.setLineDash([w * .025, w * .05]); c.lineDashOffset = -t * w * .35 - i * 7;
      c.lineWidth = Math.max(1.2, w * .018); c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke();
      c.setLineDash([]);
      // salpicaduras y ondas donde cae
      for (let j = 0; j < 2; j++) {
        const f = (t * .9 + j * .5 + i * .23) % 1;
        c.globalAlpha = ga * (1 - f) * .8; c.lineWidth = 1;
        elip(c, bx, by + h * .005, w * (.015 + f * .07), h * (.006 + f * .025), null, '#FFFFFF');
        circ(c, bx + Math.cos(i + j * 3 + f * 2) * w * .03 * f, by - Math.sin(f * 3.14) * h * .045, Math.max(.8, w * .006), '#FFFFFF', false);
        c.globalAlpha = ga;
      }
    });
    // surtidor de arriba
    for (let j = 0; j < 6; j++) {
      const f = (t * 1.2 + j / 6) % 1, lado = j % 2 ? 1 : -1;
      c.globalAlpha = ga * (1 - f * .6);
      circ(c, x + w * (.5 + lado * f * .09), y + h * (.12 - Math.sin(f * 3.14) * .07 + f * .08), Math.max(.8, w * .008), '#FFFFFF', false);
      c.globalAlpha = ga;
    }
    // brillos en el pilón
    for (let j = 0; j < 4; j++) {
      const f = (t * .4 + j / 4) % 1;
      c.globalAlpha = ga * Math.sin(f * 3.14) * .6; c.lineWidth = 1.2;
      linea(c, [x + w * (.2 + j * .17), y + h * (.6 + (j % 2) * .07)], [x + w * (.24 + j * .17), y + h * (.6 + (j % 2) * .07)], '#FFFFFF');
      c.globalAlpha = ga;
    }
  }
};

function dibAndamio(c, e, alto) {
  const t = e.d.tam, x0 = e.x + .12, y0 = e.y + .12, x1 = e.x + t - .12, y1 = e.y + t - .12;
  c.lineCap = 'round';
  const cara = function (a, b2) {
    const pa = iso(a[0], a[1]), pb = iso(b2[0], b2[1]);
    for (let i = 0; i <= 3; i++) {
      const u = i / 3, p = [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u];
      c.lineWidth = 3.4; linea(c, p, [p[0], p[1] - alto], TINTA); c.lineWidth = 1.8; linea(c, p, [p[0], p[1] - alto], '#C99A5E');
    }
    for (let z = alto * .3; z < alto; z += alto * .3) {
      c.lineWidth = 4.6; linea(c, [pa[0], pa[1] - z], [pb[0], pb[1] - z], TINTA); c.lineWidth = 2.8; linea(c, [pa[0], pa[1] - z], [pb[0], pb[1] - z], '#B98A52');
    }
  };
  cara([x0, y1], [x1, y1]); cara([x1, y1], [x1, y0]);
}
function dibSolar(c, e, t) {
  const tm = e.d.tam;
  c.lineWidth = 2;
  poli(c, [iso(e.x + .1, e.y + .1), iso(e.x + tm - .1, e.y + .1), iso(e.x + tm - .1, e.y + tm - .1), iso(e.x + .1, e.y + tm - .1)], '#B08A55');
  c.lineWidth = 1.2;
  const esq = [iso(e.x + .2, e.y + .2), iso(e.x + tm - .2, e.y + .2), iso(e.x + tm - .2, e.y + tm - .2), iso(e.x + .2, e.y + tm - .2)];
  esq.forEach(function (p) { linea(c, p, [p[0], p[1] - 9], TINTA); });
  for (let i = 0; i < 4; i++) linea(c, [esq[i][0], esq[i][1] - 7], [esq[(i + 1) % 4][0], esq[(i + 1) % 4][1] - 7], '#F1E6CC');
  // palés, ladrillos y carretilla
  const p1 = iso(e.x + tm * .35, e.y + tm * .6);
  c.lineWidth = 1.5;
  for (let j = 0; j < 3; j++) poli(c, [[p1[0] - 14, p1[1] - j * 4], [p1[0], p1[1] + 7 - j * 4], [p1[0] + 14, p1[1] - j * 4], [p1[0], p1[1] - 7 - j * 4]], j === 2 ? '#C99A5E' : '#A9713F');
  const p2 = iso(e.x + tm * .7, e.y + tm * .35);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) { c.fillStyle = '#C96B4C'; c.strokeStyle = TINTA; c.beginPath(); c.rect(p2[0] - 8 + i * 8, p2[1] - 4 - j * 4, 8, 4); c.fill(); c.stroke(); }
  const p3 = iso(e.x + tm * .7, e.y + tm * .75);
  elip(c, p3[0], p3[1], 9, 4, '#D8C29A');
  c.lineWidth = 1.8; linea(c, [p3[0] - 2, p3[1] - 2], [p3[0] + 3, p3[1] - 15], '#7A5230');
  const golpe = Math.sin(t * 8) > .6 ? 1 : 0;
  if (golpe) { c.globalAlpha = .6; circ(c, p1[0] + 6, p1[1] - 18, 4, '#F1ECE2', false); c.globalAlpha = 1; }
}
function dibHumoDano(c, x, y, t, n, fuerte) {
  for (let i = 0; i < (fuerte ? 5 : 3); i++) {
    const f = ((t * .5 + i / (fuerte ? 5 : 3) + n * .13) % 1), ga = c.globalAlpha;
    c.globalAlpha = ga * (1 - f) * .7;
    circ(c, x + Math.sin(f * 6 + i + n) * 6, y - f * 40, 4 + f * 9, fuerte ? '#7C746C' : '#BDB6AC', false);
    c.globalAlpha = ga;
  }
  if (fuerte) {
    for (let i = 0; i < 3; i++) {
      const h = 9 + Math.sin(t * 11 + i * 2 + n) * 3;
      poli(c, [[x - 8 + i * 6, y + 4], [x - 5 + i * 6 + Math.sin(t * 9 + i) * 2, y + 4 - h], [x - 2 + i * 6, y + 4]], i === 1 ? '#F2D16B' : '#E8762B', false);
    }
  }
}
function dibBanderin(c, x, y, t, s) {
  c.lineWidth = 2; linea(c, [x, y], [x, y - 26 * s], TINTA);
  const o = Math.sin(t * 3 + x) * 2;
  c.lineWidth = 1.5;
  poli(c, [[x, y - 26 * s], [x + 18 * s, y - 24 * s + o], [x + 17 * s, y - 13 * s + o], [x, y - 15 * s]], '#D9A521');
  c.lineWidth = 1; circ(c, x + 8.5 * s, y - 19.5 * s + o * .6, 3.4 * s, null, '#3D4A34');
  linea(c, [x + 6 * s, y - 16 * s + o * .5], [x + 11 * s, y - 23 * s + o * .5], '#3D4A34');
}

/* Edificios y recursos con imagen: devuelve la altura dibujada (0 si no hay imagen). */
function dibEdificio(c, e, t) {
  const k = claveImagen(e);
  if (!IMG[k]) return 0;
  if (e.obra !== undefined && e.obra < 1) {
    if (e.obra < .5) { if (IMG['obra-solar']) ponerImagen(c, 'obra-solar', e.x, e.y, e.d.tam); else dibSolar(c, e, t); return 30; }
    const ko = claveObra(e);
    if (IMG[ko]) return ponerImagen(c, ko, e.x, e.y, e.d.tam);
    const ga = c.globalAlpha; c.globalAlpha = .35 + (e.obra - .5) * 1.1;
    const h = ponerImagen(c, k, e.x, e.y, e.d.tam); c.globalAlpha = ga;
    dibAndamio(c, e, h * .62);
    return h;
  }
  const mej = e.cola && e.cola[0] && e.cola[0].k === 'mejora';
  if (mej && claveMejora(e) && IMG[claveMejora(e)]) return ponerImagen(c, claveMejora(e), e.x, e.y, e.d.tam);
  let esc = 1;
  if (e.k === 'monton') esc = .6 + .4 * Math.min(1, e.cant / e.cantMax);
  if (e.k === 'plaza') {
    const p = iso(e.x + 1, e.y + 1); elip(c, p[0] + 4, p[1] + 2, 44, 21, 'rgba(30,18,8,.16)', false);
    return ponerImagen(c, k, e.x, e.y, e.d.tam);
  }
  if (e.k === 'monton') {
    const c2 = iso(e.x + .5, e.y + .5);
    elip(c, c2[0] + 3, c2[1] + 2, 30 * esc, 11 * esc, 'rgba(30,18,8,.22)', false);
    return ponerImagen(c, k, e.x + .5 - .5 * esc, e.y + .5 - .5 * esc, 1, esc);
  }
  // sombra suave
  const tm = e.d.tam, L = iso(e.x, e.y + tm), B = iso(e.x + tm, e.y + tm), R = iso(e.x + tm, e.y);
  poli(c, [L, B, R, [R[0] + 26 * tm / 2, R[1] + 4], [B[0] + 26 * tm / 2, B[1] + 4]], 'rgba(30,18,8,.18)', false);
  const h = ponerImagen(c, k, e.x, e.y, e.d.tam);
  if (mej) dibAndamio(c, e, h * .55);
  if (e.k === 'principal' && e.nivel) {
    const top = iso(e.x + 1.5, e.y + 1.5);
    dibBanderin(c, top[0] - 26, top[1] - h * .62, t, 1.1);
    if (e.nivel > 1) dibBanderin(c, top[0] + 30, top[1] - h * .5, t + 1, 1.1);
  }
  const f = e.hp / e.hpMax;
  if (e.d.tipo === 'e' && f < .5 && !(e.k === 'ayuntamiento' && IMG['ayuntamiento-danado'])) {
    const top = iso(e.x + tm * .55, e.y + tm * .45);
    dibHumoDano(c, top[0], top[1] - h * .55, t, e.id, f < .25);
  }
  if (e.k === 'ayuntamiento' && !IMG['ayuntamiento-danado'] && f < .67) {
    const top = iso(e.x + 2, e.y + 2);
    dibHumoDano(c, top[0] - 40, top[1] - h * .45, t, 1, f < .34);
    if (f < .34) dibHumoDano(c, top[0] + 45, top[1] - h * .35, t, 2, true);
  }
  return h;
}

function dibRuinas(c, r, t) {
  if (IMG.ruinas) { ponerImagen(c, 'ruinas', r.x, r.y, r.tam); return; }
  const tm = r.tam;
  c.lineWidth = 1.5;
  poli(c, [iso(r.x + .1, r.y + .1), iso(r.x + tm - .1, r.y + .1), iso(r.x + tm - .1, r.y + tm - .1), iso(r.x + .1, r.y + tm - .1)], 'rgba(90,70,50,.35)', false);
  for (let i = 0; i < 6 * tm; i++) {
    const a = azar(r.id + i, i * 7), b = azar(i * 3, r.id), p = iso(r.x + .2 + a * (tm - .4), r.y + .2 + b * (tm - .4));
    c.save(); c.translate(p[0], p[1]); c.rotate((a - .5) * 2);
    c.fillStyle = ['#A9713F', '#8C9A8A', '#C96B4C', '#CFA467', '#6E7880'][i % 5]; c.strokeStyle = TINTA;
    c.beginPath(); c.rect(-9, -2.5, 18, 5); c.fill(); c.stroke(); c.restore();
  }
  const f = Math.min(1, r.v / 2), p = iso(r.x + tm / 2, r.y + tm / 2);
  c.globalAlpha = (1 - f) * .7; circ(c, p[0], p[1] - 10 - f * 20, 20 * tm * (.6 + f), '#E4DCCD', false); c.globalAlpha = 1;
}

function rectEdificio(e) {
  const tm = e.d.tam, b = iso(e.x + tm, e.y + tm), k = claveImagen(e), im = IMG[k];
  if (im) { const conf = IMG_CONF[k] || { f: 1, dy: 0 }, w = tm * 64 * conf.f, h = w * im.height / im.width; return [b[0] - w / 2, b[1] - h + conf.dy, w, h]; }
  const alto = (e.k === 'ayuntamiento' ? 100 : e.k === 'bloque' ? e.alto : 40) + tm * 32;
  return [b[0] - tm * 32, b[1] - alto, tm * 64, alto];
}
function pintarRetratoImagen(rx, e) {
  const im = IMG['retrato-' + e.k];
  if (!im) return false;
  rx.drawImage(im, 0, 0, 96, 96);
  return true;
}
