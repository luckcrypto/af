/* aircraft.fyi — MEGA-NAV v5 behaviour, ported per the family blueprint. */
(function () {
  'use strict';
  var mn = document.getElementById('mn'); if (!mn) return;
  var groups = [].slice.call(mn.querySelectorAll('.mn-group'));
  var desktop = window.matchMedia('(min-width:961px)');
  var hoverTimer;

  function openGroup(g) {
    groups.forEach(function (o) {
      if (o !== g) { o.classList.remove('is-open');
        var t = o.querySelector('.mn-top'); if (t) t.setAttribute('aria-expanded', 'false'); }
    });
    g.classList.add('is-open');
    var t = g.querySelector('.mn-top'); if (t) t.setAttribute('aria-expanded', 'true');
  }
  function closeGroup(g) {
    g.classList.remove('is-open');
    var t = g.querySelector('.mn-top'); if (t) t.setAttribute('aria-expanded', 'false');
  }
  function closeAll() { groups.forEach(closeGroup); }

  groups.forEach(function (g) {
    var top = g.querySelector('.mn-top'); if (!top) return;
    top.addEventListener('click', function () {
      g.classList.contains('is-open') ? closeGroup(g) : openGroup(g);
    });
    g.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      clearTimeout(hoverTimer); openGroup(g);
    });
    g.addEventListener('mouseleave', function () {
      if (!desktop.matches) return;
      hoverTimer = setTimeout(function () { closeGroup(g); }, 150);
    });
  });

  /* current-page highlight */
  var cur = mn.getAttribute('data-current');
  if (cur) {
    var el = mn.querySelector('.mn-group[data-key="' + cur + '"], .mn-direct[data-key="' + cur + '"]');
    if (el) el.classList.add('is-current');
  }

  /* Escape + click-outside close */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(); closeDrawer(); }
  });
  document.addEventListener('click', function (e) {
    if (!mn.contains(e.target)) closeAll();
  });

  /* scroll state */
  function onScroll() {
    if (mn.classList.contains('is-drawer')) return; /* drawer open: keep the bar exactly as it was */
    mn.classList.toggle('is-scrolled', (window.scrollY || 0) > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scrim sync (non-invasive) ---------- */
  (function () {
    var scrim = document.querySelector('.mn-scrim'); if (!scrim) return;
    function sync() {
      var open = desktop.matches && groups.some(function (g) { return g.classList.contains('is-open'); });
      document.documentElement.classList.toggle('mn-blur', open);
    }
    groups.forEach(function (g) {
      new MutationObserver(sync).observe(g, { attributes: true, attributeFilter: ['class'] });
    });
    if (desktop.addEventListener) desktop.addEventListener('change', sync);
    scrim.addEventListener('click', function () { closeAll(); sync(); });
    sync();
  })();

  /* ---------- mobile drawer ---------- */
  var burger = document.getElementById('mnBurger');
  var burger2 = document.getElementById('mnBurger2');
  function openDrawer() {
    mn.classList.add('is-drawer');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    mn.classList.remove('is-drawer');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    onScroll(); /* re-sync to the real scroll position now the drawer is shut */
  }
  if (burger) burger.addEventListener('click', function () {
    mn.classList.contains('is-drawer') ? closeDrawer() : openDrawer();
  });
  if (burger2) burger2.addEventListener('click', closeDrawer);
  if (desktop.addEventListener) desktop.addEventListener('change', function (e) {
    if (e.matches) closeDrawer(); else closeAll();
  });

  /* drawer accordions — single-open */
  var accs = [].slice.call(mn.querySelectorAll('.mn-acc'));
  accs.forEach(function (a) {
    var top = a.querySelector('.mn-acc-top'); if (!top) return;
    top.addEventListener('click', function () {
      var was = a.classList.contains('is-open');
      accs.forEach(function (o) {
        o.classList.remove('is-open');
        var t = o.querySelector('.mn-acc-top'); if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (!was) { a.classList.add('is-open'); top.setAttribute('aria-expanded', 'true'); }
    });
  });
})();

/* ---------- page: single-open <details> accordions ---------- */
(function () {
  document.querySelectorAll('[data-accordion]').forEach(function (group) {
    group.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        group.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });
})();

/* ---------- spec table: metric ⇄ imperial (remembered sitewide) ---------- */
(function () {
  function stored(){ try { return localStorage.getItem('acfyi.units') === 'imperial'; } catch(e){ return false; } }
  document.querySelectorAll('[data-unit-toggle]').forEach(function (btn) {
    var table = document.querySelector(btn.getAttribute('data-unit-toggle'));
    if (!table) return;
    var imperial = false;
    function apply(){
      table.querySelectorAll('td[data-metric]').forEach(function (td) {
        td.textContent = imperial ? td.getAttribute('data-imperial') : td.getAttribute('data-metric');
      });
      btn.textContent = imperial ? 'Switch to metric' : 'Switch to imperial';
    }
    btn.addEventListener('click', function () {
      imperial = !imperial;
      try { localStorage.setItem('acfyi.units', imperial ? 'imperial' : 'metric'); } catch(e){}
      apply();
    });
    if (stored()){ imperial = true; apply(); }
  });
})();

/* ============ ANIMATED NAV BRAND — ported verbatim from luck.fyi ============ */
/* 1. the .fyi expander */
(function(){
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fws=[].slice.call(document.querySelectorAll('.mn-logo b .fw'));
  fws.forEach(function(fw){
    var sp=fw.querySelector('.fwt'); if(!sp) return;
    var base=sp.textContent;
    function widthOf(t){
      var c=document.createElement('span'); c.textContent=t;
      c.style.cssText='position:absolute;visibility:hidden;white-space:nowrap';
      fw.appendChild(c); var w=c.offsetWidth; c.remove(); return w;
    }
    fw.style.width=widthOf(base)+'px';
    function swap(t,cb){
      sp.classList.add('fo');
      setTimeout(function(){
        sp.textContent=t; fw.style.width=widthOf(t)+'px';
        sp.classList.remove('fo'); sp.classList.add('fi');
        requestAnimationFrame(function(){requestAnimationFrame(function(){
          sp.classList.remove('fi');
        });});
        if(cb) setTimeout(cb,1350);
      },240);
    }
    var seq=['for','your','information'];
    function play(){
      if(document.hidden){ setTimeout(play,9000); return; }
      var i=0;
      (function step(){
        i<seq.length ? swap(seq[i++],step)
                     : swap(base,function(){ setTimeout(play, 7000 + Math.random()*6000); });
      })();
    }
    setTimeout(play, 5000 + Math.random()*7000);
  });
})();

/* 2. the tail-number roller */
(function(){
  var mbs=[].slice.call(document.querySelectorAll('.mn-mark .mm-b')); if(!mbs.length) return;

  /* manufacturer-prefixed type codes — the way the industry actually says them */
  var TYPES=['A220','A320','A330','A340','A350','A380',
             'B707','B717','B727','B737','B747','B757','B767','B777','B787',
             'E190','E195','E175','MD11','DC10','IL76','C919','Q400','AT72'];
  var EMO=['✈️','🛫','🛬','🛩️','💺','🌍','🌎','🌏','💨','🌬️','🧳','🎒','🧑‍✈️','👩‍✈️','👨‍✈️'];

  function next(){
    if(Math.random() < 0.22) return {emo:EMO[Math.floor(Math.random()*EMO.length)]};
    var n=TYPES[Math.floor(Math.random()*TYPES.length)];
    if(n==='B747') return {emo:'👑'};   /* easter egg: Queen of the Skies */
    return {n:n};
  }
  /* the favicon's Concorde planform, drawn in ink on the white disc */
  var PLN=[[32,1.5],[33.6,13],[34.4,22],[36.5,30],[41,37],[58.5,53.5],[58.5,57.5],[37,57.5],[35.6,62],[32,62.5]];
  var PLN_D=(function(){
    var t='M'+PLN.map(function(p){return p[0]+' '+p[1];}).join('L');
    for(var i=PLN.length-2;i>=0;i--){ t+='L'+(64-PLN[i][0])+' '+PLN[i][1]; }
    return t+'Z';
  })();
  function paint(mb,s){
    if(s.plane){ mb.classList.remove('emo'); mb.classList.add('pln');
      mb.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="'+PLN_D+'" fill="currentColor"/></svg>'; return; }
    mb.classList.remove('pln');
    if(s.emo){ mb.classList.add('emo'); mb.textContent=s.emo; }
    else{ mb.classList.remove('emo'); mb.textContent=s.n; }
  }

  mbs.forEach(function(mb){ paint(mb, {plane:true}); });

  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function roll(){
    if(document.hidden){ schedule(); return; }
    mbs.forEach(function(mb){ mb.classList.add('mo'); });
    setTimeout(function(){
      mbs.forEach(function(mb){
        paint(mb, next());
        mb.classList.remove('mo'); mb.classList.add('mi');
      });
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        mbs.forEach(function(mb){ mb.classList.remove('mi'); });
      });});
      schedule();
    },220);
  }
  function schedule(){ setTimeout(roll, 5000 + Math.random()*3000); }
  setTimeout(roll, 10000 + Math.random()*1500);   /* brand mark holds ~10 s, then the rotation begins */
})();

/* ---------- fleet filter (home) ---------- */
(function(){
  var bar = document.getElementById('fleetFilter');
  var grid = document.getElementById('fleetGrid');
  var out = document.getElementById('fleetCount');
  if (!bar || !grid) return;
  var chips = [].slice.call(bar.querySelectorAll('.fchip'));
  var cards = [].slice.call(grid.querySelectorAll('.acard'));
  function apply(f){
    var shown = 0;
    cards.forEach(function(c){
      var hit = (f === 'all') || (c.getAttribute('data-cat') === f);
      c.hidden = !hit;
      if (hit) shown++;
    });
    chips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === f)); });
    if (out) out.textContent = 'Showing ' + shown + ' of ' + cards.length + ' aircraft.';
  }
  chips.forEach(function(c){
    c.addEventListener('click', function(){ apply(c.getAttribute('data-filter')); });
  });
  apply('all');
})();

/* ---------- site search ---------- */
(function(){
  var dlg = document.getElementById('srch');
  var input = document.getElementById('srchInput');
  var list = document.getElementById('srchResults');
  if (!dlg || !input || !list) return;
  var IDX = window.SEARCH_INDEX || [];
  var open = false, sel = -1, hits = [];
  var esc = function(s){ var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  function score(item, q){
    var t = item.t.toLowerCase();
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;
    if (t.indexOf(q) > -1) return 60;
    if (item.q.indexOf(q) > -1) return 40;
    /* every word must appear somewhere */
    var words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1 && words.every(function(w){ return item.q.indexOf(w) > -1; })) return 30;
    return 0;
  }
  function render(){
    var q = input.value.trim().toLowerCase();
    if (!q){
      list.innerHTML = '';
      hits = [];
      return;
    }
    hits = IDX.map(function(i){ return { i: i, s: score(i, q) }; })
      .filter(function(x){ return x.s > 0; })
      .sort(function(a, b){ return b.s - a.s || a.i.t.length - b.i.t.length; })
      .slice(0, 8).map(function(x){ return x.i; });
    sel = hits.length ? 0 : -1;
    list.innerHTML = hits.length
      ? hits.map(function(h, n){
          return '<li role="option" aria-selected="' + (n === 0) + '" class="' + (n === 0 ? 'on' : '') + '">' +
            '<a href="' + h.u + '"><span class="sr-k">' + esc(h.k) + '</span>' +
            '<span class="sr-t">' + esc(h.t) + '</span>' +
            '<span class="sr-d">' + esc(h.d || '') + '</span></a></li>'; }).join('')
      : '<li class="srch-none">Nothing matches “' + esc(input.value) + '”.</li>';
  }
  function move(d){
    if (!hits.length) return;
    sel = (sel + d + hits.length) % hits.length;
    [].forEach.call(list.children, function(li, n){
      li.classList.toggle('on', n === sel);
      li.setAttribute('aria-selected', String(n === sel));
    });
    var el = list.children[sel];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  function show(){
    dlg.hidden = false; open = true;
    document.body.style.overflow = 'hidden';
    input.value = ''; render();
    setTimeout(function(){ input.focus(); }, 20);
  }
  function hide(){
    dlg.hidden = true; open = false;
    document.body.style.overflow = '';
  }
  ['mnSearchBtn', 'mnSearchBtn2'].forEach(function(id){
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', show);
  });
  var close = document.getElementById('srchClose');
  if (close) close.addEventListener('click', hide);
  var scrim = document.getElementById('srchScrim');
  if (scrim) scrim.addEventListener('click', hide);
  input.addEventListener('input', render);
  document.addEventListener('keydown', function(e){
    var ae = document.activeElement;
    if (!open && e.key === '/' && !(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))){
      e.preventDefault(); show(); return;
    }
    if (!open && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){
      e.preventDefault(); show(); return;
    }
    if (!open) return;
    if (e.key === 'Escape'){ e.preventDefault(); hide(); }
    if (e.key === 'ArrowDown'){ e.preventDefault(); move(1); }
    if (e.key === 'ArrowUp'){ e.preventDefault(); move(-1); }
    if (e.key === 'Enter' && sel > -1 && hits[sel]){ e.preventDefault(); location.href = hits[sel].u; }
  });
})();


/* ---------- fleet sort (home) ---------- */
(function(){
  var bar = document.getElementById('fleetSort');
  var grid = document.getElementById('fleetGrid');
  if (!bar || !grid) return;
  var chips = [].slice.call(bar.querySelectorAll('.fchip'));
  function apply(key){
    var cards = [].slice.call(grid.querySelectorAll('.acard'));
    cards.sort(function(a, b){
      if (key === 'name') return a.getAttribute('data-name') < b.getAttribute('data-name') ? -1 : 1;
      if (key === 'manufacturer'){
        var am = a.getAttribute('data-manufacturer') || '', bm = b.getAttribute('data-manufacturer') || '';
        if (am !== bm) return am < bm ? -1 : 1;
        return parseFloat(b.getAttribute('data-wingspan') || 0) - parseFloat(a.getAttribute('data-wingspan') || 0);
      }
      return parseFloat(b.getAttribute('data-' + key) || 0) - parseFloat(a.getAttribute('data-' + key) || 0);
    });
    cards.forEach(function(c){ grid.appendChild(c); });
    chips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.getAttribute('data-sort') === key)); });
  }
  chips.forEach(function(c){ c.addEventListener('click', function(){ apply(c.getAttribute('data-sort')); }); });
})();

/* ---------- compare tray: collect up to three from anywhere ---------- */
(function(){
  var KEY = 'acfyi.tray';
  function load(){ try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch(e){ return []; } }
  function save(t){ try { sessionStorage.setItem(KEY, JSON.stringify(t)); } catch(e){} }
  var btns = [].slice.call(document.querySelectorAll('.addcmp'));
  var pill = document.createElement('div');
  pill.id = 'trayPill';
  pill.setAttribute('role', 'status');
  pill.hidden = true;
  pill.innerHTML = '<a id="trayGo" href="/compare">Compare</a><button type="button" id="trayClear" aria-label="Clear the compare tray">×</button>';
  document.body.appendChild(pill);
  var go = pill.querySelector('#trayGo');

  function sync(){
    var t = load();
    btns.forEach(function(b){
      b.setAttribute('aria-pressed', String(t.indexOf(b.getAttribute('data-slug')) > -1));
    });
    if (!t.length){ pill.hidden = true; return; }
    pill.hidden = false;
    if (t.length === 1){
      go.textContent = '1 in tray — pick one more to compare';
      go.setAttribute('href', '/compare#' + t[0]);
    } else {
      go.textContent = 'Compare ' + t.length + ' aircraft →';
      go.setAttribute('href', '/compare#' + t.join(','));
    }
  }
  btns.forEach(function(b){
    b.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var slug = b.getAttribute('data-slug');
      var t = load();
      var i = t.indexOf(slug);
      if (i > -1) t.splice(i, 1);
      else { if (t.length >= 3) t.shift(); t.push(slug); }
      save(t); sync();
    });
  });
  pill.querySelector('#trayClear').addEventListener('click', function(){ save([]); sync(); });
  sync();
})();


/* ---------- card grid columns — scoped: each bar controls only its own section ---------- */
(function(){
  var bars = [].slice.call(document.querySelectorAll('.colsbar'));
  var grids = [].slice.call(document.querySelectorAll('.cardgrid'));
  if (!grids.length) return;
  function get(k, d){ try { return localStorage.getItem(k) || d; } catch(e){ return d; } }
  function set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
  function scopeOf(el){ return (el && el.getAttribute('data-scope')) || 'aircraft'; }
  function prefs(scope){
    /* aircraft scope migrates any pre-scope stored choice */
    var dc = get('acfyi.cols.' + scope, scope === 'aircraft' ? get('acfyi.cols', '2') : '2');
    var mc = get('acfyi.colsm.' + scope, scope === 'aircraft' ? get('acfyi.colsm', 'm2') : 'm2');
    return { dc: dc, mc: mc };
  }
  function apply(scope){
    var p = prefs(scope);
    grids.forEach(function(g){
      if (scopeOf(g) !== scope) return;
      g.classList.toggle('cols-3', p.dc === '3');
      g.classList.toggle('cols-4', p.dc === '4');
      g.classList.toggle('mcols-1', p.mc === 'm1');
    });
    bars.forEach(function(bar){
      if (scopeOf(bar) !== scope) return;
      [].forEach.call(bar.querySelectorAll('.fchip'), function(c){
        var v = c.getAttribute('data-cols');
        c.setAttribute('aria-pressed', String(v === p.dc || v === p.mc));
      });
    });
  }
  bars.forEach(function(bar){
    bar.addEventListener('click', function(e){
      var c = e.target.closest ? e.target.closest('.fchip') : null;
      if (!c) return;
      var v = c.getAttribute('data-cols');
      if (!v) return;
      var scope = scopeOf(bar);
      set(v.charAt(0) === 'm' ? 'acfyi.colsm.' + scope : 'acfyi.cols.' + scope, v);
      apply(scope);
    });
  });
  apply('aircraft'); apply('airlines');
})();

/* ---------- language pill ---------- */
(function(){
  var pill = document.getElementById('langPill');
  if (!pill) return;
  var LANGS = [['en','English'],['zh','简体中文'],['ru','Русский'],['es','Español'],['fr','Français'],
               ['de','Deutsch'],['pt','Português'],['ar','العربية'],['hi','हिन्दी'],['ja','日本語']];
  var btn = pill.querySelector('.lang-btn');
  var menu = pill.querySelector('.lang-menu');
  var cur = pill.querySelector('.lang-cur');
  var m = location.pathname.match(/^\/(zh|ru|es|fr|de|pt|ar|hi|ja)(\/|$)/);
  var here = m ? m[1] : 'en';
  cur.textContent = here.toUpperCase();
  var rest = location.pathname.replace(/^\/(zh|ru|es|fr|de|pt|ar|hi|ja)(?=\/|$)/, '') || '/';
  menu.innerHTML = LANGS.map(function(l){
    var href = (l[0] === 'en' ? rest : '/' + l[0] + rest) + location.hash;
    return '<li role="option" aria-selected="' + (l[0] === here) + '">' +
      '<a href="' + href + '" data-lang="' + l[0] + '"' + (l[0] === here ? ' class="on"' : '') + '>' + l[1] + '</a></li>';
  }).join('');
  function close(){ menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function(e){ if (!pill.contains(e.target)) close(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  menu.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a[data-lang]') : null;
    if (a) { try { localStorage.setItem('acfyi.lang', a.getAttribute('data-lang')); } catch(err){} }
  });
})();

/* ---------- hangar shop: "owned" ticks, saved on-device ---------- */
(function(){
  var items = [].slice.call(document.querySelectorAll('.gearitem[data-key]'));
  if (!items.length) return;
  items.forEach(function(it){
    var key = it.getAttribute('data-key');
    var btn = it.querySelector('.gi-own');
    if (!btn) return;
    var on = false;
    try { on = localStorage.getItem(key) === '1'; } catch (e) {}
    function paint(){ it.classList.toggle('owned', on); btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'Owned \u2713' : 'Own it'; }
    paint();
    btn.addEventListener('click', function(){
      on = !on;
      try { on ? localStorage.setItem(key, '1') : localStorage.removeItem(key); } catch (e) {}
      paint();
    });
  });
})();

/* ---------- legend: copy a hex swatch ---------- */
(function(){
  var btns = [].slice.call(document.querySelectorAll('.slg-hex'));
  if (!btns.length) return;
  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var hex = btn.getAttribute('data-hex');
      var done = function(){ var old = btn.textContent; btn.textContent = 'Copied \u2713'; btn.classList.add('ok'); setTimeout(function(){ btn.textContent = old; btn.classList.remove('ok'); }, 1100); };
      try { navigator.clipboard.writeText(hex).then(done, function(){ btn.textContent = hex; }); }
      catch (e) { done(); }
    });
  });
})();


