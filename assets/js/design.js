/* ------------------------------------------------------------------
   aircraft.fyi — Blueprint Designer
   A parametric aircraft built from real dimensions, drawn as a 3D
   wireframe and freely rotatable. Everything adjustable sits behind
   one dropdown and one slider, so the whole tool fits on one screen.
   ------------------------------------------------------------------ */
(function () {
  var root = document.getElementById('dz');
  if (!root) return;

  var svg      = document.getElementById('dzScene');
  var pathNear = document.getElementById('dzNear');
  var pathFar  = document.getElementById('dzFar');
  var out      = document.getElementById('dzPrompt');
  var NS = 'http://www.w3.org/2000/svg';

  var W = 1000, H = 640, CX = W / 2, CY = H / 2;

  var P = {
    length: 63, diameter: 5.6, span: 60, sweep: 27, taper: 0.30, wingX: -0.02,
    decks: 1, wingPos: 'low', dihedral: 5,
    tailH: 17, tailType: 'conventional',
    engines: 2, engPos: 'wing', engDia: 3.0,
    mtow: 250, winglets: 1, gear: 1
  };
  var view = { yaw: -38, pitch: 14, roll: 0, zoom: 1 };

  /* ---------- geometry ---------- */
  var V, E, FIT = 1, BBOX = { x: 0, y: 0, z: 0 };
  function v(x, y, z) { V.push([x, y, z]); return V.length - 1; }
  function e(a, b) { E.push([a, b]); }
  function loop(ids) { for (var i = 0; i < ids.length; i++) e(ids[i], ids[(i + 1) % ids.length]); }
  function chain(ids) { for (var i = 0; i < ids.length - 1; i++) e(ids[i], ids[i + 1]); }

  function build() {
    V = []; E = [];
    var L = P.length, R = P.diameter / 2;
    /* Decks stack UPWARD. The cross-section stays the same width and grows taller,
       and yLift is chosen so the belly line never moves — the gear stays put and the
       crown climbs, exactly as it does on a real double-decker. */
    var ry = R * (1 + (P.decks - 1) * 0.46);
    var yLift = ry - R;
    var belly = yLift - ry;                       /* always -R, whatever the deck count */
    var crown = yLift + ry;

    var NSEG = 24, NR = 14, rings = [];
    for (var i = 0; i <= NSEG; i++) {
      var t = i / NSEG, x = -L / 2 + t * L, r;
      if (t < 0.14)      r = R * Math.pow(t / 0.14, 0.55);
      else if (t > 0.88) r = R * Math.pow((1 - t) / 0.12, 0.48);
      else               r = R;
      var yc = yLift + (t < 0.22 ? (0.22 - t) * L * 0.085 : 0);
      var ring = [];
      for (var j = 0; j < NR; j++) {
        var a = j / NR * Math.PI * 2;
        ring.push(v(x, yc + Math.sin(a) * r * (ry / R), Math.cos(a) * r));
      }
      rings.push(ring);
    }
    for (var i2 = 0; i2 < rings.length; i2 += 2) loop(rings[i2]);
    for (var j2 = 0; j2 < NR; j2 += 2) {
      var line = [];
      for (var i3 = 0; i3 < rings.length; i3++) line.push(rings[i3][j2]);
      chain(line);
    }

    var half = P.span / 2;
    var rootC = L * 0.26, tipC = rootC * P.taper;
    /* anchored with R, not ry — a low wing stays on the belly however tall the stack gets */
    var wy = P.wingPos === 'high' ? crown - R * 0.28 : P.wingPos === 'mid' ? yLift : belly + R * 0.34;
    var wx = P.wingX * L;                          /* slide the wing fore and aft */
    var sweepT = Math.tan(P.sweep * Math.PI / 180), dih = Math.tan(P.dihedral * Math.PI / 180);
    function wing(sign) {
      var top = [], bot = [];
      for (var k = 0; k <= 6; k++) {
        var fr = k / 6, z = sign * (R * 0.85 + fr * (half - R * 0.85));
        var yy = wy + Math.abs(z) * dih;
        var le = wx + rootC * 0.5 - Math.abs(z) * sweepT;
        var c  = rootC + (tipC - rootC) * fr;
        var a = v(le, yy, z), b = v(le - c, yy, z);
        top.push(a); bot.push(b); e(a, b);
      }
      chain(top); chain(bot);
      e(top[0], bot[0]);
      if (P.winglets) {
        var tz = sign * half, ty = wy + half * dih, tle = wx + rootC * 0.5 - half * sweepT;
        var w1 = v(tle, ty + P.span * 0.035, tz), w2 = v(tle - tipC * 0.75, ty + P.span * 0.035, tz);
        e(top[top.length - 1], w1); e(bot[bot.length - 1], w2); e(w1, w2);
      } else {
        e(top[top.length - 1], bot[bot.length - 1]);
      }
    }
    wing(1); wing(-1);

    var fx = -L * 0.40, fSweep = Math.tan(42 * Math.PI / 180);
    var fRoot = L * 0.20, fTip = fRoot * 0.44, fTop = crown + P.tailH;
    var f1 = v(fx + fRoot * 0.5, crown - R * 0.34, 0);
    var f2 = v(fx - fRoot * 0.5, crown - R * 0.34, 0);
    var f3 = v(fx + fRoot * 0.5 - P.tailH * fSweep, fTop, 0);
    var f4 = v(fx + fRoot * 0.5 - P.tailH * fSweep - fTip, fTop, 0);
    loop([f1, f3, f4, f2]);
    e(f1, f4);

    var tSpan = P.span * 0.34, tRoot = L * 0.13, tTip = tRoot * 0.45;
    var isT = P.tailType === 'T-tail';
    var ty0 = isT ? fTop : yLift + R * 0.30;
    var tx0 = isT ? (fx + fRoot * 0.5 - P.tailH * fSweep) : (fx + fRoot * 0.55);
    for (var s = -1; s <= 1; s += 2) {
      var h1 = v(tx0, ty0, 0), h2 = v(tx0 - tRoot, ty0, 0);
      var h3 = v(tx0 - tSpan * 0.31, ty0 + (isT ? 0 : tSpan * 0.04), s * tSpan * 0.5);
      var h4 = v(tx0 - tSpan * 0.31 - tTip, ty0 + (isT ? 0 : tSpan * 0.04), s * tSpan * 0.5);
      loop([h1, h3, h4, h2]);
    }

    var eR = P.engDia / 2, nac = L * 0.14;
    function nacelle(cx, cy, cz) {
      var a = [], b = [];
      for (var q = 0; q < 10; q++) {
        var ang = q / 10 * Math.PI * 2;
        a.push(v(cx + nac * 0.5, cy + Math.sin(ang) * eR, cz + Math.cos(ang) * eR));
        b.push(v(cx - nac * 0.5, cy + Math.sin(ang) * eR * 0.88, cz + Math.cos(ang) * eR * 0.88));
      }
      loop(a); loop(b);
      for (var q2 = 0; q2 < 10; q2++) e(a[q2], b[q2]);
    }
    if (P.engPos === 'wing') {
      var spots = P.engines >= 4 ? [0.30, 0.56] : [0.36];
      for (var g = 0; g < spots.length; g++) {
        for (var s2 = -1; s2 <= 1; s2 += 2) {
          var z2 = s2 * half * spots[g];
          nacelle(wx + rootC * 0.5 - Math.abs(z2) * sweepT + nac * 0.55,
                  wy + Math.abs(z2) * dih - eR * 0.95, z2);
        }
      }
    } else {
      for (var s3 = -1; s3 <= 1; s3 += 2)
        nacelle(-L * 0.26, yLift + R * 0.30, s3 * (R + eR * 0.92));
    }

    if (P.gear) {
      var legs = P.mtow > 350 ? 3 : P.mtow > 120 ? 2 : 1;
      var gy = belly - P.diameter * 0.42;
      e(v(L * 0.30, belly, 0), v(L * 0.30, gy + P.diameter * 0.12, 0));
      for (var s4 = -1; s4 <= 1; s4 += 2) {
        for (var b2 = 0; b2 < legs; b2++) {
          var bz = s4 * (R * 0.55 + b2 * P.diameter * 0.30);
          var t2 = v(wx, gy, bz);
          e(v(wx, wy, bz), t2);
          e(t2, v(wx + P.diameter * 0.22, gy, bz));
          e(t2, v(wx - P.diameter * 0.22, gy, bz));
        }
      }
    }
  }

  /* Centre on the model's own bounding box — otherwise a tall fin drags the
     whole drawing upward, because geometry is built around the fuselage axis. */
  function recentre() {
    var lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], i, k;
    for (i = 0; i < V.length; i++) for (k = 0; k < 3; k++) {
      if (V[i][k] < lo[k]) lo[k] = V[i][k];
      if (V[i][k] > hi[k]) hi[k] = V[i][k];
    }
    var mid = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    for (i = 0; i < V.length; i++) for (k = 0; k < 3; k++) V[i][k] -= mid[k];
    /* true extents of the finished aircraft, measured off the geometry rather than
       the input numbers — a tall fin or a deck stack changes Y well beyond diameter */
    BBOX = { x: hi[0] - lo[0], y: hi[1] - lo[1], z: hi[2] - lo[2] };
    FIT = Math.max(BBOX.x, BBOX.y, BBOX.z) || 1;
  }

  /* ---------- projection ---------- */
  function draw() {
    var cy = Math.cos(view.yaw * Math.PI / 180), sy = Math.sin(view.yaw * Math.PI / 180);
    var cp = Math.cos(view.pitch * Math.PI / 180), sp = Math.sin(view.pitch * Math.PI / 180);
    var cr = Math.cos(view.roll * Math.PI / 180), sr = Math.sin(view.roll * Math.PI / 180);
    var D = FIT * 2.8, F = FIT * 2.8;

    var u = new Array(V.length), lo0 = 1e9, hi0 = -1e9, lo1 = 1e9, hi1 = -1e9;
    for (var i = 0; i < V.length; i++) {
      var x = V[i][0], y = V[i][1], z = V[i][2], t;
      t = y * cr - z * sr; z = y * sr + z * cr; y = t;        /* roll  — about the fuselage axis */
      t = x * cp - y * sp; y = x * sp + y * cp; x = t;        /* pitch — about the spanwise axis */
      t = x * cy - z * sy; z = x * sy + z * cy; x = t;        /* yaw   — about the vertical axis */
      var d = D - z, k = F / Math.max(F * 0.25, d);
      var a = x * k, b = -y * k;
      u[i] = [a, b, d];
      if (a < lo0) lo0 = a; if (a > hi0) hi0 = a;
      if (b < lo1) lo1 = b; if (b > hi1) hi1 = b;
    }
    /* fit what we actually projected, so the aircraft fills the frame from any angle */
    var s = Math.min(W * 0.86 / Math.max(hi0 - lo0, 1e-6), H * 0.84 / Math.max(hi1 - lo1, 1e-6)) * view.zoom;
    var mx = (lo0 + hi0) / 2, my = (lo1 + hi1) / 2;

    var near = [], far = [];
    for (var j = 0; j < E.length; j++) {
      var p = u[E[j][0]], q = u[E[j][1]];
      var seg = 'M' + (CX + (p[0] - mx) * s).toFixed(1) + ' ' + (CY + (p[1] - my) * s).toFixed(1) +
                'L' + (CX + (q[0] - mx) * s).toFixed(1) + ' ' + (CY + (q[1] - my) * s).toFixed(1);
      ((p[2] + q[2]) / 2 > D ? far : near).push(seg);
    }
    pathFar.setAttribute('d', far.join(''));
    pathNear.setAttribute('d', near.join(''));
  }

  function refresh() { build(); recentre(); draw(); syncOut(); }

  /* ---------- one dropdown, one slider ---------- */
  var PARAMS = [
    { g: 'Dimensions',    k: 'length',   label: 'Length',             min: 12,   max: 170,  step: 0.5,   unit: ' m' },
    { g: 'Dimensions',    k: 'span',     label: 'Wingspan',           min: 10,   max: 130,  step: 0.5,   unit: ' m' },
    { g: 'Dimensions',    k: 'diameter', label: 'Fuselage diameter',  min: 1.6,  max: 11,   step: 0.1,   unit: ' m' },
    { g: 'Dimensions',    k: 'wingX',    label: 'Wing fore / aft',    min: -0.3, max: 0.3,  step: 0.005, pc: 1 },
    { g: 'Dimensions',    k: 'sweep',    label: 'Wing sweep',         min: 0,    max: 55,   step: 1,     unit: '\u00B0' },
    { g: 'Dimensions',    k: 'taper',    label: 'Wing taper',         min: 0.12, max: 0.85, step: 0.01,  unit: '' },
    { g: 'Dimensions',    k: 'dihedral', label: 'Dihedral',           min: -8,   max: 12,   step: 0.5,   unit: '\u00B0' },
    { g: 'Dimensions',    k: 'tailH',    label: 'Tail height',        min: 2,    max: 40,   step: 0.5,   unit: ' m' },
    { g: 'Dimensions',    k: 'engDia',   label: 'Engine diameter',    min: 0.7,  max: 6,    step: 0.1,   unit: ' m' },
    { g: 'Dimensions',    k: 'mtow',     label: 'Max takeoff weight', min: 8,    max: 900,  step: 5,     unit: ' t' },
    { g: 'Dimensions',    k: 'decks',    label: 'Passenger decks',    min: 1, max: 8, step: 1, deck: 1 },
    { g: 'Configuration', k: 'wingPos',  label: 'Wing height',        opts: [['low', 'Low wing'], ['mid', 'Mid wing'], ['high', 'High wing']] },
    { g: 'Configuration', k: 'tailType', label: 'Tail type',          opts: [['conventional', 'Conventional tail'], ['T-tail', 'T-tail']] },
    { g: 'Configuration', k: 'engines',  label: 'Engine count',       opts: [[2, 'Two engines'], [4, 'Four engines']] },
    { g: 'Configuration', k: 'engPos',   label: 'Engine position',    opts: [['wing', 'Under the wing'], ['rear', 'Rear fuselage']] },
    { g: 'Configuration', k: 'winglets', label: 'Wingtips',           opts: [[0, 'Plain tips'], [1, 'Winglets']] },
    { g: 'Configuration', k: 'gear',     label: 'Landing gear',       opts: [[0, 'Retracted'], [1, 'Extended']] },
    { g: 'View',          k: 'yaw',      label: 'Rotate \u2014 yaw',   min: -180, max: 180, step: 1,    unit: '\u00B0', view: 1 },
    { g: 'View',          k: 'pitch',    label: 'Rotate \u2014 pitch', min: -89,  max: 89,  step: 1,    unit: '\u00B0', view: 1 },
    { g: 'View',          k: 'roll',     label: 'Rotate \u2014 roll',  min: -180, max: 180, step: 1,    unit: '\u00B0', view: 1 },
    { g: 'View',          k: 'zoom',     label: 'Zoom',               min: 0.4,  max: 2.4, step: 0.05, unit: 'x', view: 1 }
  ];
  function pOf(k) { for (var i = 0; i < PARAMS.length; i++) if (PARAMS[i].k === k) return PARAMS[i]; return PARAMS[0]; }
  function idxOf(p) {
    for (var i = 0; i < p.opts.length; i++) if (p.opts[i][0] === P[p.k]) return i;
    return 0;
  }
  function label(p) {
    if (p.opts) return p.opts[idxOf(p)][1];
    var val = p.view ? view[p.k] : P[p.k];
    if (p.deck) return val + (val === 1 ? ' deck' : ' decks');
    if (p.pc) return (val > 0 ? '+' : '') + (val * 100).toFixed(1) + '% of length';
    return (p.step < 1 ? val.toFixed(p.step < 0.05 ? 2 : 1) : String(val)) + (p.unit || '');
  }

  var paramSel = document.getElementById('dParam');
  var slider   = document.getElementById('dSlider');
  var sliderV  = document.getElementById('dSliderV');
  var active   = 'length';

  if (paramSel) {
    var html = '', seen = '';
    for (var pi = 0; pi < PARAMS.length; pi++) {
      var pp = PARAMS[pi];
      if (pp.g !== seen) { if (seen) html += '</optgroup>'; html += '<optgroup label="' + pp.g + '">'; seen = pp.g; }
      html += '<option value="' + pp.k + '">' + pp.label + '</option>';
    }
    paramSel.innerHTML = html + '</optgroup>';
  }
  function loadSlider() {
    var p = pOf(active);
    if (!slider) return;
    if (p.opts) { slider.min = 0; slider.max = p.opts.length - 1; slider.step = 1; slider.value = idxOf(p); }
    else { slider.min = p.min; slider.max = p.max; slider.step = p.step; slider.value = p.view ? view[p.k] : P[p.k]; }
    if (sliderV) sliderV.textContent = label(p);
    if (paramSel) paramSel.value = active;
  }
  if (paramSel) paramSel.addEventListener('change', function () { active = paramSel.value; loadSlider(); });
  if (slider) slider.addEventListener('input', function () {
    var p = pOf(active), raw = parseFloat(slider.value);
    if (p.opts)      P[p.k] = p.opts[Math.round(raw)][0];
    else if (p.view) view[p.k] = raw;
    else             P[p.k] = raw;
    if (sliderV) sliderV.textContent = label(p);
    if (p.view) { draw(); syncOut(); } else refresh();
  });

  /* ---------- rotate by dragging ---------- */
  (function () {
    var id = null, lx = 0, ly = 0, mouse = false;
    function move(x, y) {
      view.yaw = ((view.yaw + (x - lx) * 0.55 + 180) % 360 + 360) % 360 - 180;
      view.pitch = Math.max(-89, Math.min(89, view.pitch + (y - ly) * 0.45));
      lx = x; ly = y;
      if (pOf(active).view) loadSlider();
      draw();
    }
    svg.addEventListener('touchstart', function (ev) {
      var t = ev.changedTouches[0]; id = t.identifier; lx = t.clientX; ly = t.clientY; ev.preventDefault();
    }, { passive: false });
    svg.addEventListener('touchmove', function (ev) {
      for (var i = 0; i < ev.touches.length; i++)
        if (ev.touches[i].identifier === id) { move(ev.touches[i].clientX, ev.touches[i].clientY); ev.preventDefault(); return; }
    }, { passive: false });
    svg.addEventListener('touchend', function () { id = null; syncOut(); });
    svg.addEventListener('mousedown', function (ev) { mouse = true; lx = ev.clientX; ly = ev.clientY; ev.preventDefault(); });
    document.addEventListener('mousemove', function (ev) { if (mouse) move(ev.clientX, ev.clientY); });
    document.addEventListener('mouseup', function () { if (mouse) { mouse = false; syncOut(); } });
  })();

  var spinBtn = document.getElementById('dSpin'), spinning = false, spinRaf = 0;
  if (spinBtn) spinBtn.addEventListener('click', function () {
    spinning = !spinning;
    spinBtn.textContent = spinning ? 'Stop' : 'Auto-rotate';
    spinBtn.setAttribute('aria-pressed', String(spinning));
    if (spinning) (function turn() {
      if (!spinning) return;
      view.yaw = ((view.yaw + 0.5 + 180) % 360 + 360) % 360 - 180;
      if (pOf(active).view) loadSlider();
      draw();
      spinRaf = requestAnimationFrame(turn);
    })();
    else { cancelAnimationFrame(spinRaf); syncOut(); }
  });
  var resetBtn = document.getElementById('dReset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    view.yaw = -38; view.pitch = 14; view.roll = 0; view.zoom = 1;
    loadSlider(); draw(); syncOut();
  });

  /* ---------- the prompt ---------- */
  function rootChord() { return P.length * 0.26; }
  function noseToWing() { return P.length / 2 - (P.wingX * P.length + rootChord() * 0.5); }
  function wingToTail() { return (P.wingX * P.length - rootChord() * 0.5) + P.length / 2; }

  /* Translate the orbit into plain language. An image model will not act on "yaw -38",
     but it will act on "front three-quarter view from slightly above" — so give it both. */
  function viewWords() {
    var a = ((view.yaw % 360) + 360) % 360; if (a > 180) a -= 360;
    var horiz;
    if (Math.abs(a) < 12)              horiz = 'a pure side-on profile view, nose to the right';
    else if (Math.abs(a + 90) < 12)    horiz = 'a head-on view from directly in front';
    else if (Math.abs(a - 90) < 12)    horiz = 'a tail-on view from directly behind';
    else if (Math.abs(Math.abs(a) - 180) < 12) horiz = 'a pure side-on profile view, nose to the left';
    else if (a < -90)                  horiz = 'a front three-quarter view from the far side';
    else if (a < 0)                    horiz = 'a front three-quarter view';
    else if (a < 90)                   horiz = 'a rear three-quarter view';
    else                               horiz = 'a rear three-quarter view from the far side';
    var vert = view.pitch > 25 ? 'looking steeply down from well above'
             : view.pitch > 8  ? 'looking slightly down from above'
             : view.pitch < -25 ? 'looking steeply up from below'
             : view.pitch < -8  ? 'looking slightly up from below'
             : 'level with the aircraft';
    var bank = Math.abs(view.roll) > 4
      ? ', with the aircraft banked ' + Math.abs(view.roll).toFixed(0) + ' degrees to the ' + (view.roll > 0 ? 'right' : 'left')
      : '';
    return horiz + ', ' + vert + bank;
  }

  function promptText() {
    var cls =
      P.span > 70 ? 'very large widebody airliner' :
      P.span > 45 ? 'widebody airliner' :
      P.span > 28 ? 'narrowbody airliner' :
      P.span > 18 ? 'regional jet' : 'light business jet';
    var engTxt = P.engines + ' turbofan engine' + (P.engines > 1 ? 's' : '') +
      (P.engPos === 'wing' ? ' mounted on pylons beneath the wings' : ' mounted on pylons either side of the rear fuselage');
    return [
      'A photorealistic ' + cls + ' at the moment of rotation on takeoff, nose pitched up about 12 degrees, ' +
      'main gear just leaving the runway. Frame it as ' + viewWords() + '.',
      '',
      'CAMERA — orbit angles about the aircraft, in degrees:',
      '- X axis (roll, about the fuselage centreline): ' + view.roll.toFixed(0) + '°',
      '- Y axis (yaw, about the vertical): ' + view.yaw.toFixed(0) + '°  — 0° is side-on, -90° is head-on, +90° is tail-on',
      '- Z axis (pitch, about the wing axis): ' + view.pitch.toFixed(0) + '°  — positive looks down from above',
      '- Resulting view: ' + viewWords(),
      '',
      'OVERALL SIZE — the finished aircraft occupies this bounding box:',
      '- X (front to back, nose to the rearmost point of the swept fin): ' + BBOX.x.toFixed(1) + ' m',
      '- Y (bottom of the landing gear to the top of the fin): ' + BBOX.y.toFixed(1) + ' m',
      '- Z (wingtip to wingtip): ' + BBOX.z.toFixed(1) + ' m',
      '',
      'EXACT GEOMETRY — build the aircraft to these proportions:',
      '- Overall length: ' + P.length.toFixed(1) + ' m',
      '- Wingspan: ' + P.span.toFixed(1) + ' m (span-to-length ratio ' + (P.span / P.length).toFixed(2) + ')',
      '- Fuselage diameter: ' + P.diameter.toFixed(1) + ' m, fineness ratio ' + (P.length / P.diameter).toFixed(1) + ':1',
      '- Passenger decks: ' + P.decks + (P.decks === 1
        ? ' (single deck, circular cross-section)'
        : ' full-length decks stacked vertically. The fuselage keeps its ' + P.diameter.toFixed(1) +
          ' m width and grows upward only: the belly line stays at normal height for the landing gear, ' +
          'and the crown rises to roughly ' + ((2 * (1 + (P.decks - 1) * 0.46) - 1) * (P.diameter / 2)).toFixed(1) +
          ' m above it, giving a tall slab-sided oval cross-section with ' + P.decks + ' rows of windows'),
      '- Wing placement: root leading edge sits ' + noseToWing().toFixed(1) + ' m aft of the nose, with ' +
        wingToTail().toFixed(1) + ' m of fuselage behind the wing root trailing edge',
      '- Wing: ' + P.wingPos + '-mounted, ' + P.sweep + ' degrees of leading-edge sweep, ' +
        P.dihedral + ' degrees dihedral, taper ratio ' + P.taper.toFixed(2) +
        (P.winglets ? ', with upward blended winglets' : ', with plain wingtips'),
      '- Tail: ' + P.tailType + ' configuration, fin height ' + P.tailH.toFixed(1) + ' m above the fuselage crown',
      '- Engines: ' + engTxt + ', each nacelle about ' + P.engDia.toFixed(1) + ' m in diameter',
      '- Maximum takeoff weight: ' + P.mtow + ' tonnes',
      '- Landing gear: ' + (P.gear ? 'extended, ' + (P.mtow > 350 ? 'three' : P.mtow > 120 ? 'two' : 'one') +
        ' main bogie' + (P.mtow > 120 ? 's' : '') + ' per side plus a twin nosewheel' : 'retracting, doors part open'),
      '',
      'STYLE: sharp commercial aviation photography, clean white and bare-metal livery with no airline branding, ' +
      'bright overcast daylight, heat haze off the runway, shallow depth of field, 4k, highly detailed panel lines. ' +
      'The proportions above are the priority — match them exactly rather than defaulting to a familiar airliner shape.'
    ].join('\n');
  }
  function syncOut() { if (out) out.value = promptText(); }

  var copyBtn = document.getElementById('dCopy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var txt = promptText();
    function done() { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Create prompt'; }, 1400); }
    function fallback() { if (out) { out.focus(); out.select(); } done(); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback);
      else fallback();
    } catch (err) { fallback(); }
  });

  /* ---------- starting points ---------- */
  var PRESETS = [
    ['Clean sheet',   { length: 63, diameter: 5.6, span: 60, sweep: 27, taper: 0.30, wingX: -0.02, decks: 1, wingPos: 'low',  dihedral: 5,  tailH: 17, tailType: 'conventional', engines: 2, engPos: 'wing', engDia: 3.0, mtow: 250, winglets: 1, gear: 1 }],
    ['Double decker', { length: 73, diameter: 7.1, span: 80, sweep: 33, taper: 0.24, wingX: -0.03, decks: 2, wingPos: 'low',  dihedral: 6,  tailH: 24, tailType: 'conventional', engines: 4, engPos: 'wing', engDia: 4.4, mtow: 575, winglets: 1, gear: 1 }],
    ['Business jet',  { length: 30, diameter: 2.6, span: 29, sweep: 33, taper: 0.28, wingX: -0.14, decks: 1, wingPos: 'low',  dihedral: 3,  tailH: 8,  tailType: 'T-tail',       engines: 2, engPos: 'rear', engDia: 1.6, mtow: 45,  winglets: 1, gear: 1 }],
    ['Freighter',     { length: 70, diameter: 6.5, span: 65, sweep: 25, taper: 0.35, wingX: 0.01,  decks: 1, wingPos: 'high', dihedral: -2, tailH: 20, tailType: 'T-tail',       engines: 4, engPos: 'wing', engDia: 3.6, mtow: 400, winglets: 0, gear: 1 }]
  ];
  var presetAt = 0, presetBtn = document.getElementById('dPrev');
  if (presetBtn) {
    presetBtn.textContent = PRESETS[0][0];
    presetBtn.addEventListener('click', function () {
      presetAt = (presetAt + 1) % PRESETS.length;
      var p = PRESETS[presetAt][1];
      for (var k in p) P[k] = p[k];
      presetBtn.textContent = PRESETS[presetAt][0];
      loadSlider(); refresh();
    });
  }

  loadSlider();
  refresh();
})();
