/* ------------------------------------------------------------------
   aircraft.fyi — Gate Runner
   The handling comes from the real numbers: cruise speed sets pace,
   MTOW sets inertia, and your WINGSPAN is the hitbox. The aircraft you
   fly is the same silhouette used everywhere else on the site, drawn
   to true span against the gates.
   ------------------------------------------------------------------ */
(function () {
  var root = document.getElementById('fly');
  if (!root || !window.FLY_FLEET) return;

  var svg   = document.getElementById('flyScene');
  var msg   = document.getElementById('flyMsg');
  var msgH  = document.getElementById('flyMsgH');
  var msgB  = document.getElementById('flyMsgB');
  var btnGo = document.getElementById('flyGo');
  var endEl = document.getElementById('flyEnd');
  var endH  = document.getElementById('flyEndH');
  var endB  = document.getElementById('flyEndB');
  var endCmp = document.getElementById('flyEndCmp');
  var hud   = { spd: document.getElementById('hSpd'), alt: document.getElementById('hAlt'),
                gate: document.getElementById('hGate'), score: document.getElementById('hScore'),
                best: document.getElementById('hBest'), name: document.getElementById('hName'),
                span: document.getElementById('hSpan') };
  var NS = 'http://www.w3.org/2000/svg';

  var reduce = false;
  try { reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  var W = 1000, H = 600, CX = W / 2, CY = H / 2, FOCAL = 620;   /* H and CY are set by fit() */
  var PASS_Z = 78;
  /* metres centre-to-post. Set by the build from the widest aircraft on the site. */
  var GATE_HALF = window.FLY_GATE || 63;
  /* resting horizon, as a fraction down the frame — low, because you are up high */
  var HZ_BASE = 0.84;
  /* Spacing along the flight path. Wider than it was, so gates arrive with more
     breathing room between them. */
  var GAP_Z = 210;

  /* Drawing scale for your own aircraft. True scale left a Cessna at 10% of the frame,
     which is honest but unreadable, so the range is compressed with a power curve: the
     widest aircraft on the site fills 85% and everything else falls away gently.
     Purely a rendering choice — the hitbox is still the real wingspan in metres. */
  var SELF_MAX = 0.85, SELF_P = 0.62;
  var MAX_SPAN = (function () {
    var m = 0, fleet = window.FLY_FLEET || [];
    for (var i = 0; i < fleet.length; i++) if (fleet[i].span > m) m = fleet[i].span;
    return m || 97.5;
  })();
  var AOA_BASE = 0.88;         /* standing angle of attack in level cruise */
  var joystick = true;         /* pull back to climb — real stick sense, flippable below */
  var state = null, raf = 0, best = 0, running = false, last = 0;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }

  var L = {};
  /* ---------- responsive frame ----------
     The viewBox was a fixed 1000x600 drawn with preserveAspectRatio="slice", which
     crops to cover. On a tall phone that left barely 40% of the width visible, so an
     aircraft drawn at 85% of the viewBox was wider than the screen and you could not
     see your own wingtips. The world height is now fixed and the width follows the
     frame's shape, so 85% always means 85% of what you can actually see. */
  function fit() {
    var r = svg.getBoundingClientRect();
    var ratio = (r.width && r.height) ? r.width / r.height : 1000 / 600;
    /* Width is FIXED. Horizontal scale is what the game is judged on — your wingspan
       against the gate — so it must be identical on every device. The frame grows
       VERTICALLY instead, which on a tall phone simply means more sky above and more
       ground below. That beats letterboxing the sides with empty space. */
    W = 1000;
    H = Math.max(520, Math.min(2400, Math.round(W / ratio)));
    /* one degree of pitch, in pixels, for a roughly 68-degree vertical field of view */
    PX_DEG = H / 68;
    CX = W / 2; CY = H / 2;
    PASS_Z = (GATE_HALF * FOCAL) / (W / 2);   /* constant, since W is */
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    buildScene();
    if (state) { buildSelf(state.ac); if (running) draw(state); }
  }

  function buildScene() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {});
    var g = el('linearGradient', { id: 'flySky', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#7FBBEC' }, g);
    el('stop', { offset: '1', 'stop-color': '#DCEBF9' }, g);
    var cl = el('clipPath', { id: 'flyClip' }, defs);
    el('rect', { x: 0, y: 0, width: W, height: H }, cl);
    L.world  = el('g', { 'clip-path': 'url(#flyClip)' });
    /* The scene rotates about the horizon, so sky and ground have to cover the frame's
       DIAGONAL in every direction, not just its width — otherwise a hard bank swings a
       bare corner into view. R is that diagonal, and everything is sized off it. */
    var R = Math.sqrt(W * W + H * H);
    L.sky    = el('rect', { x: CX - R * 2, y: H * HZ_BASE - R * 3, width: R * 4, height: R * 4, fill: 'url(#flySky)' }, L.world);
    /* Position the scene at its level-flight resting place immediately. draw() does this
       every frame, but it does not run until the loop starts — without it the ground rect
       sits at y=0 and fills the whole viewport green on the idle screen. */
    /* Bank rotates the WORLD about the aircraft, which is what a cockpit view does.
       Previously only the ground rotated, and it pivoted about the horizon — which now
       sits near the bottom of the frame, so almost nothing moved and the rings never
       tilted at all. Ground and rings both live inside L.roll now. */
    L.roll   = el('g', {}, L.world);
    L.spin   = el('g', { transform: 'translate(0,' + (H * HZ_BASE) + ')' }, L.roll);
    L.ground = el('rect', { x: CX - R * 2, y: 0, width: R * 4, height: R * 3, fill: '#2E6B3F' }, L.spin);
    L.grid   = el('g', { stroke: '#3E8452', 'stroke-width': 2, fill: 'none' }, L.spin);
    L.horiz  = el('rect', { x: CX - R * 2, y: -3, width: R * 4, height: 4, fill: '#1B4D2C' }, L.spin);
    L.gates  = el('g', {}, L.roll);
    L.self   = el('g', {}, L.world);
    idleGround();
  }

  /* a few resting ground lines, so the pre-flight view looks like sky over terrain */
  function idleGround() {
    while (L.grid.firstChild) L.grid.removeChild(L.grid.firstChild);
    for (var k = 1; k <= 12; k++) {
      var zz = k * 70, yy = FOCAL * 26 / Math.max(14, zz);
      if (yy < H * 1.3) el('line', { x1: -W * 2, y1: yy, x2: W * 3, y2: yy,
        opacity: Math.max(0.05, 1 - zz / 800) }, L.grid);
    }
  }

  /* Your aircraft, seen from BEHIND. The site's silhouettes are front views, and the
     one thing that gives that away is the cabin window slot — an even-odd hole. Drop
     the even-odd rule and those holes fill solid, which is what the tail end looks like. */
  function buildSelf(ac) {
    while (L.self.firstChild) L.self.removeChild(L.self.firstChild);
    var inner = el('g', {}, L.self);
    try {
      var doc = new DOMParser().parseFromString('<svg xmlns="' + NS + '">' + ac.sil + '</svg>', 'image/svg+xml');
      var kids = doc.documentElement.childNodes;
      for (var i = 0; i < kids.length; i++) inner.appendChild(document.importNode(kids[i], true));
    } catch (e) {}
    var paths = inner.getElementsByTagName('path');
    for (var p = 0; p < paths.length; p++) {
      var pt = paths[p];
      /* Even-odd paths carry their detail as extra subpaths: the cabin window slot, and
         the hole in an engine ring. From behind you see neither, so keep only the outer
         subpath — the slot closes up and a ring becomes a solid nacelle. Filling them
         is not enough on its own, because the stroke would still outline the slot. */
      if ((pt.getAttribute('fill-rule') || '') === 'evenodd') {
        var d = pt.getAttribute('d') || '';
        var cut = d.indexOf('M', 1);
        if (cut > 0) pt.setAttribute('d', d.slice(0, cut).trim());
        pt.removeAttribute('fill-rule');
      }
      pt.setAttribute('vector-effect', 'non-scaling-stroke');
    }
    /* Centred in the frame, your own aircraft sits between the camera and the gates,
       so a solid fill would hide a distant gate entirely — fatal for the wide ones.
       The fill is part-transparent so gates read through the airframe, while the
       outline stays solid so the wingspan is still unmistakable. */
    /* The aircraft wears its real scheme colour rather than a flat white. Very light
       schemes are nudged darker so they still read against the sky. */
    inner.setAttribute('fill', ac.col || '#FFFFFF');
    inner.setAttribute('fill-opacity', '0.52');
    inner.setAttribute('stroke', '#16324F');
    inner.setAttribute('stroke-width', '1.6');
    inner.setAttribute('stroke-linejoin', 'round');
    inner.setAttribute('vector-effect', 'non-scaling-stroke');
    /* silhouettes are normalised to ~232 units of wingspan inside a 260-wide box */
    var k = (SELF_MAX * W * Math.pow(ac.span / MAX_SPAN, SELF_P)) / 232;
    /* Centre on the airframe itself (about 74% down the viewBox) rather than the very
       bottom, so scaling up pushes a large aircraft off the bottom of the frame instead
       of lifting it into the middle where it would hide the gates. */
    inner.setAttribute('transform',
      'scale(' + k.toFixed(4) + ') translate(-130,' + (-(ac.vbTop + ac.vbH * 0.74)).toFixed(1) + ')');
    L.selfInner = inner;
  }

  function makeState(ac) {
    var mt = ac.mtow || 5000;
    return {
      ac: ac, x: 0, y: 0, vx: 0, vy: 0, roll: 0, pitch: 0, spd: 1, stalled: false,
      /* A Cessna answers instantly, an A320 at 45% of that, a 747 at a third.
         The old curve sat at 1.00 for everything under 200 t, so weight did nothing. */
      /* Weight alone said an F-22 handles like an A320. Combat aircraft carry a
         manoeuvre multiplier and are allowed past 1.0, so a fighter out-turns a Cessna. */
      agility: Math.max(0.30, Math.min(1.85, Math.pow(1157 / mt, 0.19) * (ac.agi || 1))),
      /* sqrt compresses a 4x spread of cruise speeds into 2x, so a 747 is quick but not impossible */
      speed: 34 * Math.sqrt(ac.kmh / 230),
      throttle: 1, alt: 900,
      gates: [], score: 0, passed: 0, t: 0, figs: figuresFor(ac), figIdx: 0,
      px: 0, pz: 0, yaw: 0,
      pathX: 0, pathY: 0, pathZ: 0, pathYaw: 0, turn: 0, rise: 0, segLeft: 0
    };
  }
  /* Steady-state vertical speed for this airframe. Per frame the solver does
     v = (v + acc*dt) * 0.92, which settles at 0.92*acc*dt/0.08 = 11.5*acc*dt.
     Everything about the climb is expressed as a fraction of this, so a Concorde and
     a Cessna are asked for the same EFFORT rather than the same metres. */
  function vTermOf(agility) { return 11.5 * (320 * agility) / 60; }

  function withReach(s) {
    s.reach = reachOf(320 * s.agility, GAP_Z / s.speed);
    s.vTerm = vTermOf(s.agility);
    /* How far the course rises per gate: 30% of everything this aircraft could climb
       in the time it takes to reach the next one. Flat metres-per-gate was trivial in
       a Cessna (9% of its authority) and nearly impossible in a Concorde (75%). */
    s.climbUnit = 0.30 * s.vTerm * (GAP_Z / s.speed);
    return s;
  }
  /* How far this aircraft can shift sideways between gates, measured by simulating
     its own acceleration. Gates are then placed within reach, so a heavy jet gets a
     course it can fly rather than one it is physically unable to reach. */
  function reachOf(acc, gap) {
    var x = 0, v = 0, dt = 1 / 60;
    for (var t = 0; t < gap; t += dt) { v += acc * dt; v *= 0.92; x += v * dt; }
    return x;
  }
  /* Difficulty is one number, 0 to 1. It stays at 0 for the first GRACE seconds so a
     new player can learn the controls on a genuinely easy course, then climbs — by
     time, or faster if you are clearing gates quickly, whichever is further along. */
  var GRACE = 20;
  function ramp(s) {
    if (s.t <= GRACE) return 0;
    var byTime = (s.t - GRACE) / 75;                 /* full difficulty around 95 s */
    var byGate = Math.max(0, s.passed - 4) / 22;     /* good players get there sooner */
    return Math.min(1, Math.max(byTime, byGate));
  }
  function paceOf(s) { return 1 + 0.62 * ramp(s); }
  function gateSpread(s) {
    var reachNow = s.reach / paceOf(s);              /* faster course = less time to move */
    return reachNow * (0.24 + 0.70 * ramp(s));
  }
  /* ---------- course shape ----------
     The course used to climb forever, which is neither how flight works nor interesting
     to fly. It now runs as sustained ARCS: a heading is chosen in the vertical plane —
     left, right, up, down or any diagonal — and held for 10 to 15 rings while curving
     steadily, then a new one is chosen. Altitude rises AND falls with the course. */
  var SEG_MIN = 10, SEG_MAX = 15;
  function sgn(v) { return v < 0 ? -1 : 1; }
  /* how hard bank converts into rate of turn */
  var TURN_K = 0.78;
  /* weight, in the same units as the control accelerations */
  /* maximum nose angle in degrees; PX_DEG is how many pixels one degree is worth */
  var PITCH_MAX = 42;
  /* how much altitude an unloaded bank costs, as a fraction of forward speed */
  var BANK_SINK = 1.15;
  var PX_DEG = 26;
  /* no segment may bend through more than this in total */
  var MAX_SWEEP = 2.4;

  function newSegment(s) {
    /* The circuit tightens as a run goes on: segments get shorter so direction changes
       come more often, the turns themselves get harder, and the climbs and descents
       steepen. Early on it is long open sweepers; later it is a slalom. */
    var r = ramp(s);
    var lo = Math.round(11 - 5 * r), hi = Math.round(16 - 6 * r);
    s.segLeft = lo + Math.floor(rnd() * (hi - lo + 1));
    var want = (0.08 + 0.10 * r) + rnd() * (0.15 + 0.16 * r);
    s.turn = (rnd() < 0.5 ? -1 : 1) * Math.min(want, MAX_SWEEP / s.segLeft);
    /* Climb or descent runs THROUGH the turn rather than between turns, so a segment is
       one combined movement — rolling into a climbing left-hander, and so on. */
    s.rise = (rnd() - 0.45) * (22 + 32 * r);
    if (s.pathY > 230) s.rise = -Math.abs(s.rise);
    if (s.pathY < -110) s.rise = Math.abs(s.rise);
  }

  /* Lay the next ring one gate-interval further along a track that is itself turning. */
  function place(s, g) {
    if (!s.segLeft) newSegment(s);
    s.segLeft--;
    s.pathYaw += s.turn;
    s.pathX += Math.sin(s.pathYaw) * GAP_Z;
    s.pathZ += Math.cos(s.pathYaw) * GAP_Z;
    s.pathY += s.rise;
    g.x = s.pathX; g.y = s.pathY; g.z = s.pathZ;
    g.hit = false;
  }

  function clearPops() {
    for (var i = 0; i < POP_LINES.length; i++) {
      var t = POP_LINES[i];
      if (t && t.parentNode) t.parentNode.removeChild(t);
      POP_LINES[i] = null;
    }
  }

  function seedGates(s) {
    s.gates = [];
    s.pathX = 0; s.pathY = 0; s.pathZ = 0; s.pathYaw = 0;
    /* An opening straight, so you are not already behind the course on ring one. */
    s.segLeft = 5; s.turn = (rnd() < 0.5 ? -1 : 1) * 0.035; s.rise = 4;
    /* run the track out ahead of the aircraft before the first frame */
    for (var i = 0; i < 9; i++) {
      var g = { x: 0, y: 0, z: 0, rx: 0, rz: 0, hit: false };
      place(s, g);
      s.gates.push(g);
    }
  }


  var keys = {};
  document.addEventListener('keydown', function (e) {
    if (!running) return;
    var k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' ','a','s','d','f'].indexOf(k) > -1) { keys[k] = true; e.preventDefault(); }
  });
  document.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });

  /* Throttle is a SETTING, not a button — it holds where you leave it, like a real lever.
     thr runs 0..1 and maps to the multiplier below; the engine spools toward it. */
  var THR_MIN = 0.55, THR_MAX = 1.90;
  var thr = 0.333;                       /* ~1.0x on the dial: cruise */
  var thrEl = {}, firewall = false;
  function thrMult() { return THR_MIN + thr * (THR_MAX - THR_MIN); }
  function paintThr() {
    if (!thrEl.fill) return;
    var pct = (thr * 100).toFixed(0);
    thrEl.fill.style.height = pct + '%';
    thrEl.knob.style.bottom = 'calc(' + pct + '% - 17px)';
    thrEl.val.textContent = pct + '%';
  }

  /* Thumb-stick, bottom-left. Tracked by touch identifier so the stick and the throttle
     work at the same time and neither steals the other's finger. */
  var touch = { on: false, dx: 0, dy: 0 };
  (function () {
    var stick = document.getElementById('flyStick'), knob = document.getElementById('flyKnob');
    if (!stick || !knob) return;
    var MAX = 46, DEAD = 0.15, id = null;
    /* Squared response: near centre the stick is gentle enough to trim a line,
       at the edge it still has full authority. Linear was the sensitivity problem. */
    function curve(v) {
      var a = Math.abs(v);
      if (a <= DEAD) return 0;
      a = (a - DEAD) / (1 - DEAD);
      return (v < 0 ? -1 : 1) * (0.22 * a + 0.78 * a * a);
    }
    function move(t) {
      var r = stick.getBoundingClientRect();
      var dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; }
      knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      touch.dx = curve(dx / MAX); touch.dy = curve(dy / MAX); touch.on = true;
    }
    function release() {
      id = null; touch.on = false; touch.dx = touch.dy = 0;
      knob.style.transform = ''; stick.classList.remove('on');
    }
    function find(list) {
      for (var i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
      return null;
    }
    stick.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0]; id = t.identifier;
      stick.classList.add('on'); move(t); e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
      if (id === null) return;
      var t = find(e.touches); if (!t) return;
      move(t); e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', function (e) { if (id !== null && find(e.changedTouches)) release(); });
    document.addEventListener('touchcancel', release);
  })();

  /* Throttle slider, bottom-right. Works by touch and by mouse. */
  (function () {
    var box = document.getElementById('flyThr');
    if (!box) return;
    thrEl.fill = document.getElementById('flyThrFill');
    thrEl.knob = document.getElementById('flyThrKnob');
    thrEl.val  = document.getElementById('flyThrVal');
    var id = null, dragging = false;
    function set(clientY) {
      var r = box.getBoundingClientRect();
      thr = Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height));
      paintThr();
    }
    function find(list) {
      for (var i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
      return null;
    }
    box.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0]; id = t.identifier; set(t.clientY); e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
      if (id === null) return;
      var t = find(e.touches); if (!t) return;
      set(t.clientY); e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', function (e) { if (id !== null && find(e.changedTouches)) id = null; });
    box.addEventListener('mousedown', function (e) { dragging = true; set(e.clientY); e.preventDefault(); });
    document.addEventListener('mousemove', function (e) { if (dragging) set(e.clientY); });
    document.addEventListener('mouseup', function () { dragging = false; });
    paintThr();
  })();

  function step(ts) {
    if (!running) return;
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    var s = state; s.t += dt;

    var ax = 0, pitchIn = 0;
    if (keys['arrowleft'])  ax -= 1;
    if (keys['arrowright']) ax += 1;
    if (keys['arrowup'])    pitchIn -= 1;   /* push the stick forward -> nose down */
    if (keys['arrowdown'])  pitchIn += 1;   /* pull the stick back    -> nose up   */
    if (keys['a']) ax -= 0.6;
    if (keys['d']) ax += 0.6;
    if (keys['s']) { thr = Math.max(0, thr - dt * 0.55); paintThr(); }
    if (keys['f']) { thr = Math.min(1, thr + dt * 0.55); paintThr(); }
    if (touch.on) { ax += touch.dx; pitchIn += touch.dy; }   /* drag down = pull back */
    /* ay is positive when climbing. Joystick mode maps a pulled-back stick to a climb. */
    var ay = joystick ? pitchIn : -pitchIn;
    /* the lever holds where you left it; the engine spools toward it rather than snapping */
    firewall = !!keys[' '];
    var want = firewall ? THR_MAX : thrMult();
    s.throttle += (want - s.throttle) * Math.min(1, dt * 2.4);

    var acc = 320 * s.agility;

    /* ---- HEADING ----
       Until now the aircraft had none. It slid sideways along x while the gates marched
       straight down the z axis: a strafing game in a straight tunnel, which is why no
       amount of course shaping ever felt like turning. Bank now drives an actual rate
       of turn the way it does in flight, and the aircraft travels along its heading. */
    s.roll  += (ax * 46 - s.roll) * Math.min(1, dt * 4.2);
    var bank = s.roll * Math.PI / 180;
    /* ---- PITCH ATTITUDE ----
       s.pitch used to be a smoothed stick value worth a 6-pixel nudge. It is now the
       real nose angle in degrees, and everything else is derived from it. Heavy aircraft
       rotate more slowly. */
    /* Control authority follows airspeed. Slow down and the stick goes soft, which is
       both correct and the warning you need before a stall. */
    var q = Math.max(0.30, Math.min(1.20, s.spd));
    /* A banked wing points most of its lift sideways, so the same pull buys less climb.
       cos(bank) is exactly how much of it is still holding you up. */
    var cosB = Math.cos(bank);
    s.pitch += (ay * PITCH_MAX * cosB - s.pitch) * Math.min(1, dt * (0.9 + 1.7 * s.agility) * q);
    s.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, s.pitch));
    var bank = s.roll * Math.PI / 180;
    /* Pulling back in a bank TIGHTENS the turn — the horizontal component of lift grows
       with the pull. This is the technique the whole circuit is flown with, and until now
       the engine simply did not allow it: pitch and bank were independent. */
    var pull = 1 + 0.85 * Math.max(0, ay);
    s.yaw += Math.tan(bank) * TURN_K * (0.55 + 0.45 * s.agility) * pull * q * dt;

    /* ---- ENERGY ----
       Airspeed is not a constant. Point the nose up and gravity bleeds it away; point it
       down and you build it back. This is what makes a heavy aircraft feel heavy, and
       what makes a sustained climb cost something. */
    var th = s.pitch * Math.PI / 180;
    s.spd += ((s.throttle - 1) * 0.34 - Math.sin(th) * 0.34) * dt;
    s.spd += (1 - s.spd) * 0.30 * dt;              /* drag pulls back toward trim */
    s.spd = Math.max(0.10, Math.min(2.4, s.spd));

    /* ---- STALL ----
       Below flying speed the wing stops working and the nose falls through whatever the
       stick is doing. Agile airframes hang on longer; an An-225 does not. */
    var stallAt = 0.50 - 0.17 * s.agility;
    s.stalled = s.spd < stallAt;
    if (s.stalled) {
      s.pitch -= 62 * dt;                          /* nose drops of its own accord */
      s.spd += 0.30 * dt;                          /* and the dive begins to recover it */
    }

    /* ---- FLIGHT PATH ----
       Climb rate is speed along the flight path times the sine of the attitude, which is
       how it actually works. No separate gravity term is needed. */
    var fwdNow = s.speed * s.spd;
    /* The lift the bank stole has to come from somewhere: hold a turn without pulling
       and you descend, exactly as you would in an aircraft. */
    /* Scaled by speed, because the climb it has to be paid for out of is too. A fixed
       number made slow aircraft unable to hold any turn at all. */
    var bankSink = (1 - cosB) * fwdNow * BANK_SINK;
    s.vy = fwdNow * Math.sin(th) * (s.stalled ? 0.20 : 1) - bankSink - (s.stalled ? 46 : 0);
    s.y = Math.max(-600, Math.min(6000, s.y + s.vy * dt));
    s.alt = Math.max(40, 900 + s.y * 1.6);

    var fwd = s.speed * s.spd * paceOf(s), half = s.ac.span / 2;
    /* move through the world along the heading, not down a fixed corridor */
    s.px += Math.sin(s.yaw) * fwd * dt;
    s.pz += Math.cos(s.yaw) * fwd * dt;
    /* Vertical clearance is governed by HEIGHT, not wingspan. Using half the span both
       ways demanded 44 m of headroom from an An-225 that is only 18 m tall, so gates you
       had visibly flown through were scored as crashes. */
    var vhalf = (s.ac.hgt ? s.ac.hgt : s.ac.span * 0.25) / 2;
    for (var i = 0; i < s.gates.length; i++) {
      var g = s.gates[i];
      /* Where the ring sits relative to the nose: rz along the flight path, rx off to
         the side. This is what turns a straight tunnel into a course you fly around. */
      var wx = g.x - s.px, wz = g.z - s.pz;
      g.rz = wx * Math.sin(s.yaw) + wz * Math.cos(s.yaw);
      g.rx = wx * Math.cos(s.yaw) - wz * Math.sin(s.yaw);
      if (!g.hit && g.rz <= PASS_Z) {
        g.hit = true;
        var dx = Math.abs(g.rx), dy = Math.abs(s.y - g.y);
        /* The opening is a circle, so the test is the aircraft's outermost corner
           against the radius — not a box against a box. */
        var reach2 = Math.sqrt((dx + half) * (dx + half) + (dy + vhalf) * (dy + vhalf));
        if (reach2 <= GATE_HALF) {
          var gained = Math.round(100 * s.throttle + 25);
          s.passed++; s.score += gained;
          flash('#2FA84F', 0.30, 120); pop('+' + gained);
          if (s.passed % 2 === 1) showFigure(s);
        } else { return end(dx, dy, half, vhalf); }
      }
      if (g.rz < -90) place(s, g);
    }
    draw(s);
    hud.spd.textContent = Math.round(s.ac.kmh * s.spd);
    hud.alt.textContent = Math.round(s.alt);
    /* A stall has to announce itself — losing the wing with no warning is just confusing. */
    if (hud.spd.parentNode) hud.spd.parentNode.style.color = s.stalled ? '#C4342B' : '';
    hud.gate.textContent = s.passed;
    hud.score.textContent = s.score;
    raf = requestAnimationFrame(step);
  }

  function flash(c, strength, ms) {
    var r = el('rect', { x: 0, y: 0, width: W, height: H, fill: c, opacity: strength || 0.2 }, L.world);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, ms || 90);
  }
  /* a short shake, so an impact is felt and not just reported. Bounded by a frame
     count rather than a clock, so it can never run away if timers misbehave. */
  function shake(frames) {
    var n = frames || 16;
    (function jolt() {
      if (n-- <= 0) { svg.style.transform = ''; return; }
      var k = (n / (frames || 16)) * 9;
      svg.style.transform = 'translate(' + ((Math.random() * 2 - 1) * k).toFixed(1) + 'px,' +
                                           ((Math.random() * 2 - 1) * k).toFixed(1) + 'px)';
      setTimeout(jolt, 16);
    })();
  }
  /* a score popup at the gate you just cleared */
  /* Three real lines, each held by one message at a time. A message keeps its line for
     its whole life and the line is only released when it is removed — so the next one
     takes the gap that just opened rather than landing on a neighbour. The earlier
     version rotated slots blindly, but each message also drifted 57 px upward, which is
     further than the 52 px spacing: they climbed straight into each other. */
  var POP_LINES = [null, null, null];
  var POP_GAP = 58;
  function pop(txt) {
    var slot = POP_LINES.indexOf(null);
    if (slot < 0) {                     /* all three busy — retire the top one early */
      slot = 0;
      var old = POP_LINES[0];
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    var y0 = CY - 40 - slot * POP_GAP;
    var t = el('text', { x: CX, y: y0, 'text-anchor': 'middle', fill: '#1B7F3B',
      'font-size': 44, 'font-weight': 700, 'font-family': 'system-ui, sans-serif', opacity: 0.95 }, L.world);
    t.textContent = txt;
    POP_LINES[slot] = t;
    var n = 0;
    (function rise() {
      if (++n > 26) {
        if (t.parentNode) t.parentNode.removeChild(t);
        if (POP_LINES[slot] === t) POP_LINES[slot] = null;   /* free the line */
        return;
      }
      /* drift is capped well inside the line spacing so it can never reach the one above */
      t.setAttribute('y', y0 - Math.min(18, n * 0.9));
      t.setAttribute('opacity', (0.95 * (1 - n / 26)).toFixed(2));
      setTimeout(rise, 16);
    })();
  }



  function draw(s) {
    /* The horizon answered stick input alone, so a steady climb moved nothing on screen.
       It now falls away with both climb RATE and accumulated altitude, which is what
       actually reads as leaving the ground behind. */
    /* Absolute metres differ hugely between airframes, so the cues run off a normalised
       climb: how far up the course you are in units of this aircraft's own climb step. */
    /* The horizon answers to ATTITUDE, not altitude. Driving it from accumulated height
       meant that simply flying level somewhere lower swung the horizon up the screen and
       flooded the view with ground — a dive that was never actually happening. In a real
       cockpit the horizon sits at eye level whatever your altitude, and moves only as the
       nose does. Height instead drives how far away the ground LOOKS, below. */
    var norm = s.y / 215;                     /* height, for ground texture only */
    var rate = s.vTerm > 0 ? Math.max(-1, Math.min(1, s.vy / s.vTerm)) : 0;
    /* The horizon sat at the centre of the frame, which is the view you get sitting on
       a runway — half the screen is dirt and the rings straddle the horizon line. You
       are flying at altitude, so it belongs LOW in the frame with the ground as a strip
       far beneath. The action then happens in open sky, where it should. */
    /* climbCue is gone: the horizon is now placed by the real nose angle, not estimated
       from vertical speed. Attitude is the thing you actually see. */
    /* Clamped into the frame. Whatever the pitch and climb terms add up to, the horizon
       has to stay visible — the moment it leaves the screen there is no reference left
       and a full climb becomes indistinguishable from level flight. */
    var hz = H * HZ_BASE + s.pitch * PX_DEG;
    s.norm = norm;
    L.roll.setAttribute('transform',
      'translate(' + CX + ',' + CY + ') rotate(' + (-s.roll).toFixed(2) + ') translate(' + (-CX) + ',' + (-CY) + ')');
    L.spin.setAttribute('transform', 'translate(0,' + hz.toFixed(1) + ')');
    L.sky.setAttribute('y', hz - Math.sqrt(W * W + H * H) * 3);

    while (L.grid.firstChild) L.grid.removeChild(L.grid.firstChild);
    /* ---- GROUND PLANE ----
       Stacked horizontal lines could only ever slide up and down. This is a real grid
       lying on the ground in WORLD space, projected through the same camera as the rings,
       so it sweeps as you yaw, fans out as you pitch and converges on a vanishing point
       that moves with your heading.

       A world line of constant X, seen from an aircraft yawed by `yaw`, satisfies
           rx = (dx - sin(yaw) * rz) / cos(yaw)
       and one of constant Z satisfies
           rx = (cos(yaw) * rz - dz) / sin(yaw)
       Between them one is always well conditioned, so the grid never degenerates. */
    var sY = Math.sin(s.yaw), cY = Math.cos(s.yaw);
    /* Eye height sets how far the grid spreads below the horizon. At 26 it was a
       cramped 269 px band; 90 spreads it over 930 px so it reads as actual ground. */
    var eye = 90 * (1 + Math.max(0, s.norm || 0) * 2.4);
    var haze = Math.max(0.10, 1 - Math.max(0, s.norm || 0) * 1.1);
    /* FAR has to be enormous: screen offset below the horizon is eye*FOCAL/rz, so at
       1600 the furthest line still sat 35 px short and left a dead band. */
    var SP = 150, NEAR = 32, FAR = 26000, SPAN = 13;
    var GY = H * 1.45;

    function groundPt(rx, rz) {
      var sc2 = FOCAL / rz;
      return { x: CX + rx * sc2, y: eye * sc2, z: rz };
    }
    function gline(ax, az, bx, bz, fade) {
      if (az < NEAR || bz < NEAR) return;
      var p = groundPt(ax, az), q = groundPt(bx, bz);
      if (p.y > GY && q.y > GY) return;
      el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y,
                   opacity: Math.max(0.04, fade) }, L.grid);
    }

    /* lines running away from you — these are the ones that sweep when you turn */
    if (Math.abs(cY) > 0.22) {
      var baseX = Math.round(s.px / SP) * SP;
      for (var gi = -SPAN; gi <= SPAN; gi++) {
        var dxw = baseX + gi * SP - s.px;
        gline((dxw - sY * NEAR) / cY, NEAR, (dxw - sY * FAR) / cY, FAR,
              haze * Math.max(0.05, 1 - Math.abs(gi) / (SPAN + 3)));
      }
    }
    /* and the cross lines, which slide toward you as you fly */
    if (Math.abs(sY) > 0.22) {
      var baseZ = Math.round(s.pz / SP) * SP;
      for (var gj = -SPAN; gj <= SPAN; gj++) {
        var dzw = baseZ + gj * SP - s.pz;
        gline((cY * NEAR - dzw) / sY, NEAR, (cY * FAR - dzw) / sY, FAR,
              haze * Math.max(0.05, 1 - Math.abs(gj) / (SPAN + 3)));
      }
    }
    /* When the heading is square to one family of lines that family is skipped, so the
       other has to carry the scene. Rings of constant distance keep it readable. */
    /* Stepping these in even distance left them bunched well short of the horizon.
       Stepping in SCREEN space instead — a geometric series in y — spaces them evenly
       down the ground and carries them right up to the horizon line. */
    var GRW = Math.sqrt(W * W + H * H) * 2;
    for (var yr = eye * FOCAL / NEAR; yr > 1.2; yr *= 0.72) {
      if (yr < GY) el('line', { x1: CX - GRW, y1: yr, x2: CX + GRW, y2: yr,
        opacity: Math.max(0.03, Math.min(0.5, yr / 260) * haze * 0.5) }, L.grid);
    }

    while (L.gates.firstChild) L.gates.removeChild(L.gates.firstChild);
    var list = s.gates.slice().sort(function (p, q) { return q.rz - p.rz; });
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      if (g.rz < 12 || g.rz > 1500) continue;
      var sc = FOCAL / g.rz, hw = GATE_HALF * sc;
      var gx = CX + g.rx * sc, gy = CY + (s.y - g.y) * sc + s.pitch * PX_DEG;
      var op = Math.max(0.12, 1 - g.rz / 1400), nearest = i === list.length - 1;
      /* A gate you have already been judged against goes green and fades back, so the
         verdict is visible on the gate itself as it sweeps out of view. */
      /* One flat ring, no backing stroke and no shading — a nickel-alloy champagne
         gold that reads as metal against both the sky and the ground. */
      var col = g.hit ? '#2FA84F' : '#C3AC74';
      if (g.hit) op *= 0.55;
      var sw = Math.max(1.5, 5.2 * sc);
      el('circle', { cx: gx, cy: gy, r: hw, fill: 'none', stroke: col,
                     'stroke-width': sw, opacity: op }, L.gates);
      if (nearest) el('circle', { cx: gx, cy: gy, r: hw * 0.04, fill: col, opacity: op * 0.7 }, L.gates);

      /* On the gate you are about to fly, mark where your wingtips will actually pass —
         drawn at the GATE's own scale, so it is a true comparison regardless of how the
         aircraft itself is drawn. This is the judgement made visible. */
      if (nearest && !g.hit) {
        var hh = s.ac.span / 2, vh2 = (s.ac.hgt || s.ac.span * 0.25) / 2;
        var wt = hh * sc, vt = vh2 * sc;
        var ddx = Math.abs(g.rx) + hh, ddy = Math.abs(s.y - g.y) + vh2;
        var fits = Math.sqrt(ddx * ddx + ddy * ddy) <= GATE_HALF;
        var mc = fits ? '#2FA84F' : '#C4342B';
        var mx = CX, my = CY + s.pitch * PX_DEG;
        el('rect', { x: mx - wt, y: my - vt, width: wt * 2, height: vt * 2, fill: 'none',
                     stroke: mc, 'stroke-width': Math.max(1.4, 3 * sc), opacity: 0.5,
                     'stroke-dasharray': (10 * sc).toFixed(1) + ' ' + (8 * sc).toFixed(1) }, L.gates);
      }
    }

    /* Seen from behind, a nose-up attitude foreshortens the airframe vertically.
       AOA_BASE is the standing angle of attack in level cruise; pulling back adds to it. */
    /* The angle-of-attack squash stretched the airframe vertically and read as the
       aircraft being made of rubber. An aircraft is rigid; it does not deform. */
    /* Where you actually are, and where the next gate is. Without these you are
       guessing your own position, which is most of what made it feel unfair. */
    var me = CY + s.pitch * PX_DEG;
    var cross = 'M' + (CX - 19) + ' ' + me + 'h11 M' + (CX + 8) + ' ' + me + 'h11' +
                ' M' + CX + ' ' + (me - 19) + 'v11 M' + CX + ' ' + (me + 8) + 'v11';
    el('path', { d: cross, stroke: '#10233A', 'stroke-width': 2, opacity: 0.45, fill: 'none' }, L.gates);

    var nx = null;
    for (var n = 0; n < s.gates.length; n++)
      if (!s.gates[n].hit && s.gates[n].rz > 0 && (!nx || s.gates[n].rz < nx.rz)) nx = s.gates[n];
    if (nx) {
      var nsc = FOCAL / Math.max(nx.rz, 1);
      var tx = CX + nx.rx * nsc, ty = CY + (s.y - nx.y) * nsc + s.pitch * PX_DEG;
      if (tx < 40 || tx > W - 40 || ty < 40 || ty > H - 40) {
        var ang = Math.atan2(ty - me, tx - CX);
        var ex = CX + Math.cos(ang) * (Math.min(W, H) * 0.40);
        var ey = me + Math.sin(ang) * (Math.min(W, H) * 0.40);
        var a1 = ang + 2.5, a2 = ang - 2.5;
        el('path', { d: 'M' + ex.toFixed(0) + ' ' + ey.toFixed(0) +
          'L' + (ex + Math.cos(a1) * 26).toFixed(0) + ' ' + (ey + Math.sin(a1) * 26).toFixed(0) +
          'L' + (ex + Math.cos(a2) * 26).toFixed(0) + ' ' + (ey + Math.sin(a2) * 26).toFixed(0) + 'Z',
          fill: '#1B6FCF', opacity: 0.85 }, L.gates);
      }
    }

    L.self.setAttribute('transform',
      'translate(' + CX + ',' + CY + ') rotate(' + (s.roll * 0.62).toFixed(2) + ')');
  }

  function end(dx, dy, half, vhalf) {
    running = false; cancelAnimationFrame(raf);
    if (state.score > best) { best = state.score; hud.best.textContent = best; }
    var ac = state.ac, span = ac.span, room = GATE_HALF - span / 2;
    var missed = dx > GATE_HALF || dy > GATE_HALF;
    var sideways = (dx + half > GATE_HALF);
    var vertical = (dy + (vhalf || half) > GATE_HALF);

    /* Degrade rather than throw if any part of the modal is missing — a crash that
       breaks the game loop is far worse than a result card that renders plainly. */
    if (!endEl || !endH || !endB) {
      if (msgH) msgH.textContent = missed ? 'Missed the gate' : 'Clipped a gate';
      if (msg) msg.hidden = false;
      return;
    }
    endH.textContent = missed ? 'Missed the gate' : 'Clipped a gate';
    if (room < 0) {
      endB.textContent = 'The ' + ac.name + ' has a ' + span.toFixed(1) + ' m wingspan against a ' +
        (GATE_HALF * 2) + ' m gate — it does not fit at all. Pick something smaller.';
    } else if (missed) {
      endB.textContent = 'You were about ' + Math.round(Math.max(dx, dy) - GATE_HALF) +
        ' m outside the ring. It is ' + (GATE_HALF * 2) + ' m across — line up earlier.';
    } else {
      endB.textContent = sideways
        ? 'A wingtip caught a post. With ' + span.toFixed(1) + ' m of wing you had only ' +
          room.toFixed(1) + ' m of clearance either side.'
        : 'Clipped the top or bottom of the ring. It is ' + (GATE_HALF * 2) +
          ' m across and you were ' + Math.round(dy) + ' m off its centre.';
    }
    endB.textContent += ' Gates cleared: ' + state.passed + '. Score: ' + state.score + '.';

    var up = bySpan(ac, 1), dn = bySpan(ac, -1), bits = [];
    if (dn) bits.push(an(dn.name) + ' would have given you ' + ((GATE_HALF - dn.span / 2) - room).toFixed(1) + ' m more room');
    if (up) bits.push(an(up.name) + ' would have left you ' + (room - (GATE_HALF - up.span / 2)).toFixed(1) + ' m less');
    if (endCmp) endCmp.textContent = bits.length ? 'For comparison, ' + bits.join(', and ') + '.' : '';

    saveBest(ac.slug, state.passed);
    BESTS = loadBests();
    paintGrid();

    var cta = document.getElementById('flyCta');
    if (cta) { cta.href = '/aircraft/' + ac.slug; cta.textContent = 'Learn more about the ' + ac.name; }

    var share = document.getElementById('flyShare');
    if (share) share.onclick = function () {
      var line = 'Gate Runner — ' + ac.name + ': ' + state.passed + ' rings, ' + span.toFixed(1) +
        ' m of wing through a ' + (GATE_HALF * 2) + ' m ring' + (daily ? ' (daily challenge)' : '') + '.';
      var url = 'https://aircraft.fyi/fly';
      function flash(msg) {
        share.textContent = msg;
        setTimeout(function () { share.textContent = 'Share result'; }, 1600);
      }
      /* Native sheet first: on iOS and Android this is the system share UI, so the
         result can go to Messages, WhatsApp, anywhere. Some desktop browsers have it
         too. Everything else falls back to the clipboard. */
      if (navigator.share) {
        navigator.share({ title: 'Gate Runner', text: line, url: url })
          .then(function () {}, function (err) {
            /* dismissing the sheet is not a failure and should say nothing */
            if (err && err.name === 'AbortError') return;
            copyOut(line + ' ' + url, flash);
          });
        return;
      }
      copyOut(line + ' ' + url, flash);
    };


    /* The result sits in its own layer above the game, so it never has to share
       space with the picker. Closing it reveals the picker underneath. */
    endEl.hidden = false;
    endEl.classList.remove('crash');
    void endEl.offsetWidth;
    endEl.classList.add('crash');
    shake(16);
  }




  /* ---------- daily challenge ----------
     Seeded from the UTC date, so every player gets the same aircraft and the same
     gate sequence on the same day, and it resets at midnight. No server involved —
     the seed is the date itself. */
  function todayKey() {
    var d = new Date();
    return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate();
  }
  function hashOf(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var daily = false, dailyRng = null;
  function dailyAircraft() {
    var fl = window.FLY_FLEET || [];
    return fl[hashOf(todayKey()) % fl.length];
  }
  /* one random source, swapped for the seeded one in daily mode */
  function rnd() { return daily && dailyRng ? dailyRng() : Math.random(); }

  /* ---------- figures ----------
     Every line is computed from the aircraft's own data and compared against the rest
     of the fleet, so nothing here is written by hand and nothing can go stale. */
  var FLEET = window.FLY_FLEET || [];
  function an(name) { return (/^[AEIOU]/i.test(name) ? 'an ' : 'a ') + name; }

  /* A comparison is only worth making against an aircraft that is meaningfully
     different. The nearest neighbour by span is often 0.1 m away, which says nothing,
     so aim for roughly a third bigger or smaller and take the closest to that. */
  function bySpan(ac, dir) {
    var best = null, want = ac.span * (dir > 0 ? 1.35 : 0.65);
    for (var i = 0; i < FLEET.length; i++) {
      var o = FLEET[i];
      if (o.slug === ac.slug) continue;
      if (dir > 0 ? o.span < ac.span * 1.15 : o.span > ac.span * 0.85) continue;
      if (!best || Math.abs(o.span - want) < Math.abs(best.span - want)) best = o;
    }
    return best;
  }
  function smallest() {
    var s = FLEET[0];
    for (var i = 1; i < FLEET.length; i++) if (FLEET[i].span < s.span) s = FLEET[i];
    return s;
  }
  function figuresFor(ac) {
    var out = [], room = GATE_HALF - ac.span / 2, tiny = smallest();
    out.push(ac.span.toFixed(1) + ' m of wing, and ' + room.toFixed(1) + ' m of air either side of it');
    if (ac.span > tiny.span * 1.6)
      out.push('You could park ' + Math.floor(ac.span / tiny.span) + ' ' + tiny.name + 's wingtip to wingtip across that span');
    out.push(Math.round(ac.kmh) + ' km/h is ' + Math.round(ac.kmh / 3.6) + ' metres every second');
    if (ac.len) out.push(ac.len.toFixed(1) + ' m nose to tail — a span-to-length ratio of ' + (ac.span / ac.len).toFixed(2));
    var tn = ac.mtow / 1000;
    out.push((tn < 10 ? tn.toFixed(1) : String(Math.round(tn))) + (tn < 1.05 && tn > 0.95 ? ' tonne' : ' tonnes') +
      ' loaded, which is why it answers the way it does');
    if (ac.seats) out.push(ac.seats > 12
      ? 'Typically ' + ac.seats + ' seats, so that is ' + (ac.seats - 2) + ' people behind you'
      : 'Typically ' + ac.seats + ' seats — you and ' + (ac.seats - 1) + ' others');
    if (ac.range) out.push(Math.round(ac.range).toLocaleString() + ' km of range — ' + Math.round(ac.range / ac.kmh) + ' hours at cruise');
    if (ac.year) out.push('First flew in ' + ac.year + ', ' + (new Date().getFullYear() - ac.year) + ' years ago');
    if (ac.mtow > tiny.mtow * 20)
      out.push('It weighs what ' + Math.round(ac.mtow / tiny.mtow) + ' ' + tiny.name + 's weigh');
    return out;
  }
  /* a figure shown between gates, cycling so a long run keeps saying something new */
  function showFigure(s) {
    if (!s.figs || !s.figs.length) return;
    var txt = s.figs[s.figIdx % s.figs.length];
    s.figIdx++;
    var t = el('text', { x: CX, y: CY + 250, 'text-anchor': 'middle', fill: '#10233A',
      'font-size': 21, 'font-weight': 700, 'font-family': 'system-ui, sans-serif', opacity: 0 }, L.world);
    t.textContent = txt;
    var n = 0;
    (function fade() {
      n++;
      if (n > 150) { if (t.parentNode) t.parentNode.removeChild(t); return; }
      var o = n < 18 ? n / 18 : n > 120 ? (150 - n) / 30 : 1;
      t.setAttribute('opacity', (o * 0.85).toFixed(2));
      setTimeout(fade, 16);
    })();
  }

  /* Clipboard, with a fallback for browsers where writeText is unavailable or blocked. */
  function copyOut(text, done) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done('Copied'); },
                                                 function () { legacyCopy(text, done); });
        return;
      }
    } catch (e) {}
    legacyCopy(text, done);
  }
  function legacyCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok ? 'Copied' : 'Copy failed');
    } catch (e) { done('Copy failed'); }
  }

  /* ---------- personal bests ----------
     Kept per aircraft, so 48 aircraft becomes 48 things to beat. Storage can be
     unavailable or throw, so every access is guarded and the game works without it. */
  var BKEY = 'fly.best.v1';
  function loadBests() {
    try { return JSON.parse(localStorage.getItem(BKEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveBest(slug, gates) {
    try {
      var all = loadBests();
      if (!all[slug] || gates > all[slug]) { all[slug] = gates; localStorage.setItem(BKEY, JSON.stringify(all)); }
    } catch (e) {}
  }
  var BESTS = loadBests();

  /* ---------- aircraft picker ---------- */
  var chosen = window.FLY_FLEET[0], band = 'all', query = '';
  var grid    = document.getElementById('flyGrid');
  var filter  = document.getElementById('flyFilter');
  var bandsEl = document.getElementById('flyBands');
  var BANDS = ['all', 'forgiving', 'tricky', 'hard', 'brutal', 'supersonic'];

  function roomOf(ac) { return GATE_HALF - ac.span / 2; }
  function bandOf(ac) {
    /* Past Mach 1.6 the challenge stops being wingspan and becomes pace, so those
       aircraft get their own band rather than sitting in 'forgiving' with a Cessna. */
    if (ac.kmh >= 1960) return 'supersonic';
    var room = GATE_HALF - ac.span / 2;
    return room < GATE_HALF * 0.38 ? 'brutal'
         : room < GATE_HALF * 0.52 ? 'hard'
         : room < GATE_HALF * 0.75 ? 'tricky' : 'forgiving';
  }

  function paintBands() {
    if (!bandsEl) return;
    bandsEl.innerHTML = BANDS.map(function (bnd) {
      return '<button type="button" class="flyband' + (bnd === band ? ' on' : '') + '" data-b="' + bnd + '">' +
        (bnd === 'all' ? 'All' : bnd.charAt(0).toUpperCase() + bnd.slice(1)) + '</button>';
    }).join('');
  }
  function paintGrid() {
    if (!grid) return;
    var q = query.toLowerCase();
    var list = window.FLY_FLEET.filter(function (ac) {
      return (band === 'all' || bandOf(ac) === band) && (!q || ac.name.toLowerCase().indexOf(q) > -1);
    });
    if (!list.length) { grid.innerHTML = '<p class="flynone">Nothing matches that.</p>'; return; }
    grid.innerHTML = list.map(function (ac) {
      /* real anchors to the aircraft page: crawlable, and still open in a new tab on
         middle-click, while a plain click is intercepted below and flies instead */
      return '<a class="flyopt' + (ac.slug === chosen.slug ? ' on' : '') +
        '" href="/aircraft/' + ac.slug + '" data-s="' + ac.slug +
        '" role="option" aria-selected="' + (ac.slug === chosen.slug) + '">' +
        '<span class="fo-n">' + (ac.flag ? ac.flag + ' ' : '') + ac.name + '</span>' +
        '<span class="fo-m">' + ac.span.toFixed(1) + ' m span &middot; ' + roomOf(ac).toFixed(0) + ' m clear</span>' +
        (BESTS[ac.slug] ? '<span class="fo-pb">best ' + BESTS[ac.slug] + '</span>' : '') +
        '<span class="fo-b b-' + bandOf(ac) + '">' + bandOf(ac) + '</span></a>';
    }).join('');
  }
  if (bandsEl) bandsEl.addEventListener('click', function (ev) {
    var t = ev.target;
    while (t && t !== bandsEl && !t.getAttribute('data-b')) t = t.parentNode;
    if (!t || t === bandsEl) return;
    band = t.getAttribute('data-b'); paintBands(); paintGrid();
  });
  if (grid) grid.addEventListener('click', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button > 0) return;   /* let people open the page */
    var t = ev.target;
    while (t && t !== grid && !t.getAttribute('data-s')) t = t.parentNode;
    if (!t || t === grid) return;
    ev.preventDefault();
    var slug = t.getAttribute('data-s');
    for (var i = 0; i < window.FLY_FLEET.length; i++)
      if (window.FLY_FLEET[i].slug === slug) chosen = window.FLY_FLEET[i];
    paintGrid();
    start();
  });
  if (filter) filter.addEventListener('input', function () { query = filter.value || ''; paintGrid(); });

  var dailyBtn = document.getElementById('flyDaily');
  function paintDaily() {
    if (!dailyBtn) return;
    var ac = dailyAircraft();
    dailyBtn.textContent = daily ? 'Daily challenge: ' + ac.name : 'Daily challenge';
    dailyBtn.classList[daily ? 'add' : 'remove']('on');
    dailyBtn.setAttribute('aria-pressed', String(daily));
  }
  if (dailyBtn) dailyBtn.addEventListener('click', function () {
    daily = !daily;
    if (daily) { chosen = dailyAircraft(); paintGrid(); }
    paintDaily();
    if (daily) start();
  });

  function current() { return chosen; }
  function start() {
    clearPops();
    var ac = current();
    buildScene(); buildSelf(ac);
    if (daily) dailyRng = mulberry(hashOf(todayKey()));
    state = withReach(makeState(ac)); state.throttle = thrMult(); seedGates(state);
    hud.name.textContent = (ac.flag ? ac.flag + ' ' : '') + ac.name;
    hud.span.textContent = ac.span.toFixed(1);
    hud.best.textContent = best;
    if (endEl) { endEl.hidden = true; endEl.classList.remove('crash'); }
    msg.classList.remove('crash');
    msg.hidden = true; running = true; last = 0;
    if (paused) setPaused(false);
    raf = requestAnimationFrame(step);
  }

  /* Bind everything FIRST. An earlier version bailed out on reduced motion before
     wiring any listeners, which left the whole game dead with no way to start it. */
  fit();

  function armed(label, head, body) {
    btnGo.hidden = false;
    btnGo.textContent = label;
    if (head) msgH.textContent = head;
    if (body) msgB.textContent = body;
    msg.hidden = false;
  }
  function brief(ac) {
    var room = (GATE_HALF * 2 - ac.span) / 2;
    return room < 0
      ? 'Wingspan ' + ac.span.toFixed(1) + ' m against a ' + (GATE_HALF * 2) + ' m gate. This one does not fit. Good luck.'
      : 'Wingspan ' + ac.span.toFixed(1) + ' m, so ' + room.toFixed(1) + ' m of clearance either side of a ' + (GATE_HALF * 2) + ' m gate.';
  }

  /* picking an aircraft flies it straight away — no second tap needed */
  btnGo.addEventListener('click', start);

  /* ---------- pause and mid-run aircraft change ---------- */
  var paused = false;
  var pauseBtn = document.getElementById('flyPause');
  function setPaused(p) {
    paused = p;
    if (pauseBtn) {
      pauseBtn.innerHTML = paused ? '&#9654;' : '&#10073;&#10073;';
      pauseBtn.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    }
    if (paused) { running = false; cancelAnimationFrame(raf); }
    else if (state) {
      /* reset the clock, or the first frame after a pause gets a huge dt and the
         aircraft teleports through the next gate */
      last = 0; running = true; raf = requestAnimationFrame(step);
    }
  }
  if (pauseBtn) pauseBtn.addEventListener('click', function () {
    if (!state) return;
    setPaused(!paused);
  });

  /* the aircraft name in the corner opens the picker mid-run */
  var nameBtn = document.getElementById('flyName');
  if (nameBtn) nameBtn.addEventListener('click', function () {
    setPaused(true);
    if (endEl) endEl.hidden = true;
    msg.hidden = false;
    if (filter) { filter.value = ''; query = ''; }
    paintGrid();
  });

  /* closing the result always returns you to the picker — three ways in, one path out */
  function toPicker() {
    if (endEl) { endEl.hidden = true; endEl.classList.remove('crash'); }
    msg.hidden = false;
    if (filter) { filter.value = ''; query = ''; }
    paintGrid();
  }
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && endEl && !endEl.hidden) toPicker();
  });
  var endX = document.getElementById('flyEndX');
  if (endX) endX.addEventListener('click', toPicker);
  var pickBtn = document.getElementById('flyPick');
  if (pickBtn) pickBtn.addEventListener('click', toPicker);
  var againBtn = document.getElementById('flyAgain');
  if (againBtn) againBtn.addEventListener('click', start);

  var inv = document.getElementById('flyInv');
  if (inv) {
    var setLbl = function () {
      inv.textContent = joystick ? 'Pitch: joystick (pull back to climb)' : 'Pitch: direct (press up to climb)';
      inv.setAttribute('aria-pressed', String(joystick));
    };
    setLbl();
    inv.addEventListener('click', function () { joystick = !joystick; setLbl(); });
  }

  paintBands(); paintGrid(); paintDaily();

  var fitTimer = 0;
  function refit() { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 120); }
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  if (reduce) {
    /* respect the preference by not moving anything unasked, but never strand the player */
    armed('Select plane & fly',
      'Reduced motion is on',
      'Your device asks for reduced motion, so this will not start by itself. Pick an aircraft or tap below to fly anyway.');
  } else {
    start();                       /* auto-fly on load */
  }
})();
