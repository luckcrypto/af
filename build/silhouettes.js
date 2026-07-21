/* aircraft.fyi — silhouette adapter
 *
 * Builds the military silhouettes by ADAPTING the hand-drawn ones already on the site,
 * rather than assembling aircraft from generic primitives. The XB-70 supplies the
 * twin-finned supersonic airframe, Concorde the slim single-finned delta. Every curve,
 * the gear and the fuselage section are inherited from the original drawing; only span,
 * height, fin geometry, body width and wing droop are moved.
 *
 * Ported from Python so the whole toolchain is one runtime: `node build/silhouettes.js`.
 * Zero dependencies, same as build.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const SIL = path.join(SITE, 'assets/img/silhouettes');
const BASE_Y = 118.0;          /* ground line, shared by every silhouette on the site */
const CX = 130.0;

/* Roles read off the actual files. */
const TEMPLATES = {
  xb70: { slug: 'north-american-xb-70', wing: [0], gear: [1, 2, 3, 4], fins: [5, 6], bridge: [7], body: [8] },
  concorde: { slug: 'concorde', wing: [0], gear: [1, 2, 3, 4], fins: [5], bridge: [], body: [6] }
};
const cache = {};

function load(slug) {
  const s = fs.readFileSync(path.join(SIL, slug + '.svg'), 'utf8');
  const out = [];
  const re = /<path d="([^"]+)"/g;
  let m;
  while ((m = re.exec(s))) {
    const pts = [];
    const pr = /[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g;
    let q;
    while ((q = pr.exec(m[1]))) pts.push([parseFloat(q[1]), parseFloat(q[2])]);
    out.push(pts);
  }
  return out;
}

function template(name) {
  if (!cache[name]) {
    const t = Object.assign({}, TEMPLATES[name]);
    t.paths = load(t.slug);
    cache[name] = t;
  }
  return cache[name];
}

const scaleY = (p, k, pivot = BASE_Y) => p.map(([x, y]) => [x, pivot - (pivot - y) * k]);
const scaleX = (p, k, pivot = CX) => p.map(([x, y]) => [pivot + (x - pivot) * k, y]);
const moveX = (p, dx) => p.map(([x, y]) => [x + dx, y]);
const shear = (p, deg, pivotY) => {
  const t = Math.tan(deg * Math.PI / 180);
  return p.map(([x, y]) => [x + (pivotY - y) * t, y]);
};
const meanX = p => p.reduce((a, [x]) => a + x, 0) / p.length;

function build(spec) {
  const t = template(spec.tpl);
  const src = t.paths;
  const out = [];

  /* vertical scale so the drawing matches this aircraft's true height-to-span ratio */
  let curH = BASE_Y - Math.min(...src.flat().map(([, y]) => y));
  const ky = (232.0 * spec.h_over_s) / curH;
  let finRoot = null;

  src.forEach((pts, i) => {
    let p = scaleY(pts, ky);

    if (t.body.includes(i)) {
      p = scaleX(p, spec.bodyW || 1);
      if (spec.bodyTall) p = scaleY(p, spec.bodyTall);

    } else if (t.fins.includes(i)) {
      if (finRoot === null) finRoot = Math.max(...p.map(([, y]) => y));
      const side = meanX(pts) < CX ? -1 : 1;
      /* A single-finned fighter keeps one of the pair, centred. The XB-70 wing suits an
         F-16 far better than Concorde's ogival delta, so those aircraft borrow this
         airframe and drop a fin rather than changing template. */
      if (spec.singleFin) {
        if (side < 0) return;
        p = moveX(p, CX - meanX(p));
        p = scaleX(p, spec.finW || 1);
        if ((spec.finH || 1) !== 1) p = scaleY(p, spec.finH, finRoot);
        out.push(p);
        return;
      }
      p = scaleX(p, spec.finW || 1);
      if ((spec.finH || 1) !== 1) p = scaleY(p, spec.finH, finRoot);
      p = moveX(p, side * (spec.finSpread || 0));
      if (spec.finCant) p = shear(p, side * spec.finCant, finRoot);

    } else if (t.gear.includes(i)) {
      p = scaleX(p, spec.gearSpread || 1);

    } else if (t.bridge.includes(i)) {
      if (spec.dropBridge) return;
      p = scaleX(p, spec.bridgeW || 1);

    } else if (t.wing.includes(i) && spec.wingDroop) {
      p = p.map(([x, y]) => [x, y + (Math.abs(x - CX) / 116.0) * spec.wingDroop]);
    }
    out.push(p);
  });

  /* optional canard foreplane, reusing the template's own wing profile */
  if (spec.canard) {
    const [cs, cy] = spec.canard;
    let c = scaleY(src[t.wing[0]], ky);
    c = scaleX(c, cs);
    const off = (BASE_Y - Math.min(...c.map(([, y]) => y))) * cy;
    out.push(c.map(([x, y]) => [x, y + off]));
  }

  const ys = out.flat().map(([, y]) => y);
  const vtop = Math.floor(Math.min(...ys) - 3);
  const vh = Math.ceil(Math.max(...ys) + 3 - vtop);
  const body = out.map(p =>
    '<path d="M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1) +
    p.slice(1).map(q => ' L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('') + ' Z"/>'
  ).join('\n');

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${vtop} 260 ${vh}">` +
         '<g id="sil" fill="currentColor">\n' + body + '\n</g></svg>',
    vtop, vh
  };
}

/* ---------- run ---------- */
if (require.main === module) {
  const SPECS = require('./silspecs.js');
  const P = path.join(__dirname, 'data/aircraft.json');
  const d = JSON.parse(fs.readFileSync(P, 'utf8'));
  const by = Object.fromEntries(d.aircraft.map(a => [a.slug, a]));
  let n = 0;
  for (const [slug, spec] of Object.entries(SPECS)) {
    const a = by[slug];
    if (!a) { console.warn('  no record for', slug); continue; }
    const s = Object.assign({}, spec, { h_over_s: a.core.height_m / a.core.wingspan_m });
    const r = build(s);
    fs.writeFileSync(path.join(SIL, slug + '.svg'), r.svg);
    a.vb = { top: r.vtop, h: r.vh };
    n++;
  }
  fs.writeFileSync(P, JSON.stringify(d, null, 1));
  console.log(`✔ ${n} silhouettes adapted from the drawn originals`);
}

module.exports = { build };
