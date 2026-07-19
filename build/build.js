#!/usr/bin/env node
/* aircraft.fyi build engine — zero dependencies.
   Family nav + footer (MEGA-NAV v5 / MEGA-FOOTER) generated ONCE here,
   batch-injected into every page. data/aircraft.json is the single
   source of truth: aircraft ↔ airlines cross-linked both ways. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;                       // build/ — data + templates live here
const SITE = path.join(ROOT, '..');
const STAMP = new Date().toISOString().slice(0, 10);
const GEAR = [
  { group: 'Build it yourself', note: 'The LEGO sets worth clearing desk space for.', items: [
    { title: 'LEGO Icons 10318 Concorde', blurb: 'The 2,083-piece flagship of the most beautiful airliner ever made — droop nose, retractable gear, display stand. The centrepiece of any desk.', url: 'https://amzn.to/3SWF01r', link: '/aircraft/concorde', tag: 'Display shelf' },
    { title: 'LEGO City 60367 Passenger Aeroplane', blurb: 'A wide-body with a full ground crew — pushback tug, catering loader, baggage truck, apron bus and nine minifigures. The best starter set for a young avgeek.', url: 'https://amzn.to/4hdX695', link: '', tag: 'Younger pilots' }
  ] },
  { group: 'On the shelf', note: 'Die-cast models and reference books — the collector\u2019s core.', items: [
    { title: 'Die-cast airliners (1:400 & 1:200)', blurb: 'Gemini Jets and Herpa are the names to know — accurately scaled metal models in real airline liveries. Search your favourite carrier and scale; the A380 and 747 look superb on a shelf.', q: 'Gemini Jets 1:400 diecast airliner', link: '/records/longest-aircraft', tag: 'Collectors' },
    { title: 'Aviation reference books', blurb: 'From airliner-recognition guides to the deep engineering histories. A good coffee-table book on jet development is the natural companion to this site.', q: 'commercial aviation airliner book', link: '/explained', tag: 'Reading' }
  ] },
  { group: 'Track the skies', note: 'Turn real aircraft overhead into data on your screen.', items: [
    { title: 'RTL-SDR receiver (ADS-B / Flightradar)', blurb: 'A cheap software-defined-radio USB stick that picks up ADS-B — the signals aircraft broadcast — so you can track everything flying near you and even feed Flightradar24. The gateway drug of plane-spotting tech.', q: 'RTL-SDR ADS-B receiver USB', link: '', tag: 'Spotter tech' },
    { title: 'Plane-spotting binoculars (8x42)', blurb: '8x42 is the spotter\u2019s sweet spot — bright, steady, wide enough to find a jet on approach and hold it. The classic airfield-fence companion.', q: '8x42 binoculars plane spotting', link: '', tag: 'Spotter tech' }
  ] },
  { group: 'In the cockpit (at home)', note: 'The flight-sim hardware that makes it feel real.', items: [
    { title: 'Flight-sim joystick & throttle (HOTAS)', blurb: 'A HOTAS — hands-on throttle-and-stick — is the single biggest upgrade to any flight simulator. Logitech and Thrustmaster make the go-to starter sets.', q: 'HOTAS flight simulator joystick throttle', link: '/compare', tag: 'Flight sim' }
  ] }
];
const amz = q => 'https://www.amazon.co.uk/s?k=' + encodeURIComponent(q) + '&tag=luck11106-21';
const WIKI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'wiki.json'), 'utf8'));
/* two-tier sources: Primary (the factual backbone) + Further reading (verified Wikipedia only).
   furtherSlug is looked up in WIKI[kind]; if absent, the Further-reading tier is simply omitted. */
function sourcesBlock(primary, kind, slug, label) {
  const prim = primary.map(s => `<li style="margin-bottom:8px"><a href="${esc(s.url)}" rel="noopener" target="_blank" style="color:var(--muted);font-size:.88rem">${esc(s.name)} &nearr;</a></li>`).join('\n');
  const w = WIKI[kind] && WIKI[kind][slug];
  const further = w ? `<div class="src-further"><span class="src-sub">Further reading</span><ul style="list-style:none;margin:8px 0 0;padding:0"><li><a href="https://en.wikipedia.org/wiki/${w}" rel="noopener" target="_blank" style="color:var(--muted);font-size:.88rem">${esc(label)} on Wikipedia &nearr;</a></li></ul></div>` : '';
  return `<div class="srcwrap"><div class="src-primary"><span class="src-sub">Primary sources</span><ul style="list-style:none;margin:8px 0 0;padding:0">${prim}</ul></div>${further}</div>`;
}
const AFFDISC = 'As an Amazon Associate, aircraft.fyi earns from qualifying purchases. This never affects the price you pay, and links are chosen on merit \u2014 never paid placement.';

/* LAUNCH CONFIG: English-only. To open a market later, add its code here (e.g. ['es'])
   once (a) Search Console shows real demand from that language and (b) the prose for it
   has been human-reviewed. The full 10-language engine below stays dormant until then. */
const LOCALES = [];
const I18N = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'i18n.json'), 'utf8'));
const I18N_LANGS = Object.keys(I18N.langs).filter(l => l !== 'en' && LOCALES.includes(l));           // repo root — the deployable site itself
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'aircraft.json'), 'utf8'));
const LAYOUT = fs.readFileSync(path.join(ROOT, 'templates', 'layout.html'), 'utf8');

/* Targeted clean: remove only what this build generates. NEVER recursive-delete SITE —
   it contains build/, assets/ and the git history. */
const GEN_DIRS = ['aircraft', 'airlines', 'compare', 'records', 'blog', 'explained', 'manufacturers', 'types', '.well-known',
  'zh', 'ru', 'es', 'fr', 'de', 'pt', 'ar', 'hi', 'ja'];
for (const d of GEN_DIRS) fs.rmSync(path.join(SITE, d), { recursive: true, force: true });
for (const f of fs.readdirSync(SITE)) {
  if (f.endsWith('.html') || /^sitemap.*\.xml$/.test(f) || ['feed.xml', 'robots.txt', 'humans.txt', 'CNAME', '.nojekyll'].includes(f)) {
    fs.rmSync(path.join(SITE, f), { force: true });
  }
}

const esc = s => (s === undefined || s === null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const A = DATA.aircraft, AL = DATA.airlines, HUBS = DATA.hubs;
const MK = DATA.makers, TY = DATA.types;
const EX = DATA.explained;
const POSTS = DATA.posts || [];
/* Two different things, deliberately separated:
   VERDICTS  — the whole written library (18 matchups). Ships to the tool; costs no pages.
   COMPARES  — the handful of pairs that get their own page, because people search those strings.
   Google penalises mass-templated compare pages; a search query is only worth a page if it exists. */
const pk = (x, y) => [x, y].sort().join('|');
const VERDICTS = new Map(DATA.compareMarquee.map(([x, y, v]) => [pk(x, y), v]));
const COMPARES = DATA.compareStatic
  .map(([x, y]) => [A.find(z => z.slug === x), A.find(z => z.slug === y), VERDICTS.get(pk(x, y))])
  .filter(p => p[0] && p[1] && p[2]);

const shortName = a => a.name
  .replace(/^(McDonnell Douglas|De Havilland Canada|North American|Aérospatiale \/ BAC|Lockheed Martin) /, '')
  .replace(/ (family|Ruslan|Mriya|Antei|Dreamliner|Stratofortress|Galaxy|Globemaster III|TriStar|Valkyrie|Hercules|Super Galaxy)$/, '');

const RECORD_BOARDS = [
  { urlPath: '/records/longest-aircraft', h1: 'The 50 longest aircraft ever built', lead: 'Ranked by fuselage length — the definitive board, from the An-225 down to the Il-76.' },
  { file: 'records/heaviest-aircraft.html', urlPath: '/records/heaviest-aircraft',
    title: 'The heaviest aircraft ever built — ranked by MTOW',
    description: 'Every aircraft on aircraft.fyi ranked by maximum take-off weight, from the 640-tonne Antonov An-225 down. Sourced figures, true-scale silhouettes.',
    h1: 'The heaviest aircraft ever built', lead: 'Ranked by maximum take-off weight — the total mass an aircraft is certified to lift off the runway.',
    note: 'MTOW is the honest measure of an aircraft\u2019s lifting power: structure, fuel and payload combined. Figures are the highest certified weight for each type.',
    key: 'mtow_kg', jsonldName: 'Heaviest aircraft by MTOW',
    fmt: a => Math.round(a.core.mtow_kg / 1000).toLocaleString('en-US') + ' t',
    sub: a => a.core.mtow_kg.toLocaleString('en-US') + ' kg' },
  { file: 'records/fastest-aircraft.html', urlPath: '/records/fastest-aircraft',
    title: 'The fastest aircraft here — ranked by top speed',
    description: 'Every aircraft on aircraft.fyi ranked by maximum speed, from the Mach 3 XB-70 Valkyrie down to the propliners. Sourced figures and true-scale silhouettes.',
    h1: 'The fastest aircraft here', lead: 'Ranked by maximum speed — where the supersonics leave everything else standing.',
    note: 'Military and supersonic figures are maximum speed; airliner figures are maximum operating speed, which is faster than the cruise they actually fly. Comparing them is unavoidable, so it is stated plainly.',
    key: 'speed_kmh', jsonldName: 'Fastest aircraft by top speed',
    fmt: a => a.core.speed_kmh.toLocaleString('en-US') + ' km/h',
    sub: a => Math.round(a.core.speed_kmh / 1.60934).toLocaleString('en-US') + ' mph' },
  { file: 'records/most-produced.html', urlPath: '/records/most-produced',
    title: 'The most-produced large aircraft ever',
    description: 'Every aircraft on aircraft.fyi ranked by how many were built, from the 12,000-strong Boeing 737 down to the one-off Spruce Goose. Sourced production numbers.',
    h1: 'The most-produced large aircraft', lead: 'Ranked by how many were actually built — where the giants of the size charts meet the giants of the sales charts.',
    note: 'Counts are total airframes built or delivered to date, across all variants of each family. This board covers the large aircraft on this site, not light aviation.',
    key: 'produced', jsonldName: 'Most-produced large aircraft',
    fmt: a => a.core.produced.toLocaleString('en-US') + (a.status.startsWith('In produc') ? '+' : ''),
    sub: a => 'First flew ' + a.core.firstFlightYear }
];
RECORD_BOARDS.push({ urlPath: '/records/longest-flights', h1: 'The longest flights in the world',
  lead: 'Every scheduled route over 12,900 km — filterable by aircraft and airline, with the record-breakers still to come.' });

const typeOf = a => (TY.find(t => t.cats.includes(a.category)) || {}).slug || '';
const byMaker = m => A.filter(a => m.matches.includes(a.manufacturer));
const byType  = t => A.filter(a => t.cats.includes(a.category));
const byAirline = slug => A.map(a => {
  const op = (a.operators || []).find(o => o.airline === slug);
  return op ? { aircraft: a, op } : null;
}).filter(Boolean);

const DISC = `<span class="mn-mark" aria-hidden="true"><span class="mm-b">B737</span></span>`;
const WORD = `<span class="lw">aircraft<b><i class="ld">.</i><span class="fw"><span class="fwt">fyi</span></span></b></span>`;
const BRAND = cls => `<a class="${cls}" href="/" aria-label="aircraft.fyi home">${DISC}${WORD}</a>`;

/* ---------- MEGA NAV (family structure, defined once) ---------- */
function navHTML(current) {
  const airbus = A.filter(a => a.manufacturer === 'Airbus');
  const boeing = A.filter(a => a.manufacturer === 'Boeing');
  const others = A.filter(a => a.manufacturer !== 'Airbus' && a.manufacturer !== 'Boeing').slice().sort((x, y) => x.name.localeCompare(y.name));
  const link = a => `<a class="mn-link" href="/aircraft/${a.slug}"><span class="lbl">${esc(a.name)}</span><span class="cc">${esc(a.cc)}</span></a>`;
  const alink = al => `<a class="mn-link" href="/airlines/${al.slug}"><span class="lbl">${esc(al.name)}</span><span class="cc">${esc(al.cc)}</span></a>`;
  const mlink = (href, lbl, cc) => `<a class="mn-mlink" href="${href}"><span>${esc(lbl)}</span>${cc ? `<span class="cc">${esc(cc)}</span>` : ''}</a>`;

  return `<nav class="mn" id="mn" data-current="${current}" aria-label="Primary">
<div class="mn-shell">
<div class="mn-bar">
${BRAND('mn-logo')}
<div class="mn-groups">
<div class="mn-group" data-key="menu">
<button class="mn-top" type="button" aria-expanded="false" aria-haspopup="true"><svg class="gi" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h14M3 10h14M3 15h9"/></svg>Explore<i class="caret"></i></button>
<div class="mn-panel" role="menu">
<div class="mn-panel-inner" style="grid-template-columns:1.05fr 1.15fr 1.15fr 1fr">
<div>
<div class="mn-col-h">Airbus</div>
${airbus.map(link).join('\n')}
<div class="mn-col-h mt">Boeing</div>
${boeing.map(link).join('\n')}
</div>
<div>
<div class="mn-col-h">Every other maker</div>
<div class="mn-2col">
${others.map(link).join('\n')}
</div>
</div>
<div>
<div class="mn-col-h">Airlines</div>
<div class="mn-2col">
${AL.filter(x => !x.cargo).map(alink).join('\n')}
</div>
<div class="mn-col-h mt">Cargo</div>
${AL.filter(x => x.cargo).map(alink).join('\n')}
</div>
<div>
<div class="mn-col-h">Guides</div>
<a class="mn-link" href="/fear-of-flying"><span class="lbl">Scared of flying?</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/travel-classes"><span class="lbl">Classes &amp; points</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/gear"><span class="lbl">The hangar shop</span><span class="arr">&rarr;</span></a>
<div class="mn-col-h mt">Explore &amp; learn</div>
<a class="mn-link" href="/explained"><span class="lbl">Explained</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/types"><span class="lbl">Aircraft types</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/manufacturers"><span class="lbl">Manufacturers</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/quiz"><span class="lbl">The Silhouette Quiz</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/compare"><span class="lbl">Compare aircraft</span><span class="arr">&rarr;</span></a>
<div class="mn-col-h mt">Records &amp; more</div>
<a class="mn-link" href="/records"><span class="lbl">Record boards</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/records/longest-flights"><span class="lbl">The longest flights</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/bring-back-concorde"><span class="lbl">Bring back Concorde</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/blog"><span class="lbl">The blog</span><span class="arr">&rarr;</span></a>
<a class="mn-link" href="/methodology"><span class="lbl">Methodology</span><span class="arr">&rarr;</span></a>
</div>
</div>
</div>
</div>
</div>
${I18N_LANGS.length ? `<div class="lang" id="langPill">
<button class="lang-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Language"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7.2"/><path d="M2.8 10h14.4M10 2.8c2.5 2.3 2.5 12.1 0 14.4M10 2.8c-2.5 2.3-2.5 12.1 0 14.4"/></svg><span class="lang-cur">EN</span></button>
<ul class="lang-menu" role="listbox" aria-label="Choose language" hidden></ul>
</div>` : ''}
<button class="mn-search" type="button" id="mnSearchBtn" aria-label="Search the site" aria-haspopup="dialog"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.4"/><path d="m13.2 13.2 3.3 3.3"/></svg><span>Search</span><kbd>/</kbd></button>
<a class="mn-cta" href="/compare"${current === 'compare' ? ' aria-current="page"' : ''}>Compare</a>
<button class="mn-search-icon" type="button" id="mnSearchBtn2" aria-label="Search the site"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.4"/><path d="m13.2 13.2 3.3 3.3"/></svg></button>
<button class="mn-burger" id="mnBurger" type="button" aria-label="Open menu" aria-expanded="false"><span></span></button>
</div>
</div>
<aside class="mn-drawer" id="mnDrawer" aria-label="Menu">
<div class="mn-drawer-top">
${BRAND('mn-logo')}
<button class="mn-burger" id="mnBurger2" type="button" aria-label="Close menu" style="display:block;margin-left:0"><span></span></button>
</div>
<div class="mn-drawer-scroll">
<div class="mn-acc">
<button class="mn-acc-top" type="button" aria-expanded="false"><span class="lhs">Aircraft</span><i class="caret"></i></button>
<div class="mn-acc-body"><div class="mn-acc-in">
${A.map(a => mlink('/aircraft/' + a.slug, a.name, a.cc)).join('\n')}
</div></div>
</div>
<div class="mn-acc">
<button class="mn-acc-top" type="button" aria-expanded="false"><span class="lhs">Airlines</span><i class="caret"></i></button>
<div class="mn-acc-body"><div class="mn-acc-in">
${AL.map(al => mlink('/airlines/' + al.slug, al.name, al.cc)).join('\n')}
</div></div>
</div>
<div class="mn-acc">
<button class="mn-acc-top" type="button" aria-expanded="false"><span class="lhs">Manufacturers</span><i class="caret"></i></button>
<div class="mn-acc-body"><div class="mn-acc-in">
${MK.map(m => mlink('/manufacturers/' + m.slug, m.name, m.cc)).join('\n')}
</div></div>
</div>
<div class="mn-acc">
<button class="mn-acc-top" type="button" aria-expanded="false"><span class="lhs">Types</span><i class="caret"></i></button>
<div class="mn-acc-body"><div class="mn-acc-in">
${TY.map(t => mlink('/types/' + t.slug, t.name, '')).join('\n')}
</div></div>
</div>
<a class="mn-acc-direct" href="/records/longest-aircraft">Records</a>
<a class="mn-acc-direct" href="/compare">Compare aircraft</a>
<a class="mn-acc-direct" href="/quiz">The Silhouette Quiz</a>
<a class="mn-acc-direct" href="/blog">Blog</a>
<a class="mn-acc-direct" href="/explained">Explained</a>
<a class="mn-acc-direct" href="/methodology">Methodology</a>
<a class="mn-acc-direct" href="/fear-of-flying">Scared of flying?</a>
<a class="mn-acc-direct" href="/travel-classes">Classes &amp; points</a>
<a class="mn-acc-direct" href="/gear">The hangar shop</a>
<a class="mn-acc-direct" href="/bring-back-concorde">Bring back Concorde</a>
</div>
<div class="mn-drawer-foot"><a class="mn-cta" href="/#fleet">Explore the fleet</a></div>
</aside>
</nav>`;
}

/* ---------- MEGA FOOTER (family structure, defined once) ---------- */
function footerHTML() {
  return `<footer class="mf">
<div class="wrap">
<div class="mf-top">
<div class="mf-brand">
${BRAND('mf-logo mn-logo')}
<p>The visual reference for aircraft. Sourced spec tables, every operator, and — soon — true-scale comparison of anything that flies.</p>
<div class="mf-soc">
<a href="https://ships.fyi">ships.fyi</a>
<a href="https://luck.fyi" target="_blank" rel="noopener">luck.fyi</a>
<a href="https://calculate.to" target="_blank" rel="noopener">calculate.to</a>
</div>
</div>
<div>
<h3 class="mf-h">Aircraft</h3>
<ul>${[...A].sort((p, q) => q.core.wingspan_m - p.core.wingspan_m).slice(0, 10).map(a => `<li><a href="/aircraft/${a.slug}">${esc(a.name)}</a></li>`).join('')}<li><a href="/#fleet"><b>All ${A.length} aircraft &rarr;</b></a></li></ul>
</div>
<div>
<h3 class="mf-h">Airlines</h3>
<ul>${AL.slice(0, 10).map(al => `<li><a href="/airlines/${al.slug}">${esc(al.name)}</a></li>`).join('')}<li><a href="/#airlines"><b>All ${AL.length} airlines &rarr;</b></a></li></ul>
</div>
<div>
<h3 class="mf-h">Guides</h3>
<ul><li><a href="/fear-of-flying">Scared of flying?</a></li><li><a href="/travel-classes">Classes &amp; points</a></li><li><a href="/gear">The hangar shop</a></li></ul>
<h3 class="mf-h mt">Reference</h3>
<ul><li><a href="/manufacturers">Manufacturers</a></li><li><a href="/types">Aircraft types</a></li><li><a href="/records/longest-aircraft">Longest aircraft</a></li><li><a href="/blog">Blog</a></li><li><a href="/explained">Explained</a></li><li><a href="/compare">Compare aircraft</a></li><li><a href="/bring-back-concorde">Bring back Concorde</a></li><li><a href="/methodology">Methodology</a></li><li><a href="/quiz">The Silhouette Quiz</a></li></ul>
</div>
<div>
<h3 class="mf-h">Site</h3>
<ul>
<li><a href="/">Home</a></li>
<li><a href="/#fleet">The fleet</a></li>
</ul>
</div>
</div>
<div class="mf-gens">
<div class="mf-gens-head"><h3 class="mf-h">The directory</h3><a href="/#fleet">Every page &rarr;</a></div>
<div class="mf-gens-grid">
${A.map(a => `<a href="/aircraft/${a.slug}">${esc(a.name)}<span class="cc">${esc(a.cc)}</span></a>`).join('\n')}
${AL.map(al => `<a href="/airlines/${al.slug}">${esc(al.name)}<span class="cc">${esc(al.cc)}</span></a>`).join('\n')}
${MK.map(m => `<a href="/manufacturers/${m.slug}">${esc(m.name)}<span class="cc">${esc(m.cc)}</span></a>`).join('\n')}
${TY.map(t => `<a href="/types/${t.slug}">${esc(t.name)}</a>`).join('\n')}
</div>
</div>
<div class="mf-rg"><b>About the data.</b> Every specification is compiled from manufacturer documents and cited per row. Operator fleet counts are approximate snapshots, marked ≈ and dated; individually verified figures carry a ✓. All silhouettes are original works of aircraft.fyi, drawn to true scale. <b>Corrections and enquiries:</b> <a href="mailto:${DATA.site.corrections}" style="color:var(--gold)">${esc(DATA.site.corrections)}</a> — we fix errors visibly, not silently.</div>
<div class="mf-bot">
<span>&copy; ${new Date().getFullYear()} aircraft.fyi</span>
<div class="mf-legal"><a href="/records">Records</a><a href="/explained">Explained</a></div>
</div>
</div>
</footer>`;
}

/* ---------- renderer ---------- */
const pages = [];

/* BreadcrumbList built from the URL, so the schema can never disagree with the visible crumb */
const CRUMB_NAMES = { aircraft: 'Aircraft', airlines: 'Airlines', manufacturers: 'Manufacturers', types: 'Types',
  explained: 'Explained', records: 'Records', compare: 'Compare', blog: 'Blog' };
function crumbLd(urlPath, title) {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aircraft.fyi/' }];
  let acc = '';
  parts.forEach((p, i) => {
    acc += '/' + p;
    const last = i === parts.length - 1;
    items.push({ '@type': 'ListItem', position: i + 2,
      name: last ? title.split(' — ')[0] : (CRUMB_NAMES[p] || p),
      item: 'https://aircraft.fyi' + acc });
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

const BUILT_PAGES = [];
function renderPage({ file, urlPath, title, description, ogImage, jsonld, content, head = '', ogType = 'website', current = '', sitemap = true }) {
  BUILT_PAGES.push({ file, urlPath, indexable: sitemap });
  if (title.length > 60) console.warn(`⚠ title > 60 (${title.length}): ${urlPath}`);
  if (description.length < 110 || description.length > 160) console.warn(`⚠ description ${description.length} (want 110–160): ${urlPath}`);
  let html = LAYOUT
    .replace(/{{TITLE}}/g, esc(title))
    .replace(/{{DESCRIPTION}}/g, esc(description))
    .replace(/{{PATH}}/g, urlPath)
    .replace(/{{OG_IMAGE}}/g, ogImage || 'default.png')
    .replace('{{OG_TYPE}}', ogType)
    .replace('{{HEAD}}', head)
    .replace('{{JSONLD}}', JSON.stringify(crumbLd(urlPath, title) ? [].concat(jsonld, crumbLd(urlPath, title)) : jsonld))
    .replace('{{NAV}}', navHTML(current))
    .replace('{{FOOTER}}', footerHTML())
    .replace('{{CONTENT}}', content);
  // '/assets/...' only resolves when served at a domain root; relative prefixes work everywhere
  // (file://, github.io/<repo>/ previews, and the live domain). og:image etc. stay absolute https.
  const depth = file.split('/').length - 1;
  const prefix = depth ? '../'.repeat(depth) : '';
  html = html.replace(/(href|src)="\/assets\//g, `$1="${prefix}assets/`);
  const out = path.join(SITE, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  pages.push({ path: urlPath, sitemap });
}


/* ---------- derived metrics: computed from core, never hand-authored ---------- */
const METRICS = DATA.methodology.metrics;
/* FAQPage schema from Q&A pairs — pairs with the visible accordions for rich SERP results */
function faqLd(qas) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qas.map(qa => ({
    '@type': 'Question', name: qa.q,
    acceptedAnswer: { '@type': 'Answer', text: qa.a }
  })) };
}

function metricValue(key, a) {
  const c = a.core;
  if (key === 'seatsPerMetre') return c.seats_typical ? c.seats_typical / c.length_m : null;
  if (key === 'rangePerTonne') return (c.range_km && c.mtow_kg) ? c.range_km / (c.mtow_kg / 1000) : null;
  if (key === 'spanRatio') return (c.wingspan_m && c.length_m) ? c.wingspan_m / c.length_m : null;
  if (key === 'massPerMetre') return (c.mtow_kg && c.length_m) ? (c.mtow_kg / 1000) / c.length_m : null;
  if (key === 'rangeHours') return (c.range_km && c.speed_kmh) ? c.range_km / c.speed_kmh : null;
  if (key === 'massPerSeat') return (c.mtow_kg && c.seats_typical) ? c.mtow_kg / c.seats_typical : null;
  return null;
}
function metricPool(key) {
  return A.map(x => ({ slug: x.slug, v: metricValue(key, x) })).filter(x => x.v !== null);
}
function metricRank(key, a) {
  const vals = metricPool(key).sort((p, q) => q.v - p.v);
  return { rank: vals.findIndex(x => x.slug === a.slug) + 1, of: vals.length };
}
function derivedSection(a) {
  const rows = METRICS.map(m => {
    const raw = metricValue(m.key, a);
    if (raw === null) return '';
    const v = raw.toFixed(m.decimals);
    const { rank, of } = metricRank(m.key, a);
    const max = Math.max(...metricPool(m.key).map(x => x.v));
    const pct = Math.round(raw / max * 100);
    return `<div class="dmetric">
<div class="dm-head"><span class="dm-name">${esc(m.name)}</span><span class="dm-rank">#${rank} of ${of}</span></div>
<div class="dm-bar"><span style="width:${pct}%"></span></div>
<div class="dm-val">${v}${m.unit ? ' ' + esc(m.unit) : ''} <span class="dm-formula">${esc(m.formula)}</span></div>
</div>`;
  }).filter(Boolean).join('\n');
  if (!rows) return '';
  return `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Our numbers</span>
<h2 class="title">Derived metrics</h2>
<p class="sub">Computed by aircraft.fyi from the core specification — <a href="/methodology" style="color:var(--gold)">see how we calculate these</a>.</p>
<div class="dgrid">${rows}</div>
</div></section>`;
}


function statStrip(a) {
  const c = a.core;
  const candidates = [
    ['Length', c.length_m ? c.length_m + ' m' : null],
    ['Wingspan', c.wingspan_m ? c.wingspan_m + ' m' : null],
    ['Range', c.range_km ? c.range_km.toLocaleString('en-US') + ' km' : null],
    ['MTOW', c.mtow_kg ? Math.round(c.mtow_kg / 1000) + ' t' : null],
    ['Typical seats', c.seats_typical ? String(c.seats_typical) : null],
    ['Built', (c.produced || c.produced === 0) ? (c.produced === 0 ? '0 yet' : c.produced.toLocaleString('en-US') + (a.status.startsWith('In production') ? '+' : '')) : null],
    ['First flight', c.firstFlightYear ? String(c.firstFlightYear) : null],
    ['Height', c.height_m ? c.height_m + ' m' : null]
  ];
  const items = candidates.filter(x => x[1] !== null).slice(0, 6);
  return `<div class="statstrip">${items.map(([k, v]) =>
    `<div class="ss"><span class="k">${k}</span><span class="v num">${v}</span></div>`).join('')}</div>`;
}

/* ---------- content builders ---------- */
const SIL = {};
for (const a of DATA.aircraft) {
  const raw = fs.readFileSync(path.join(SITE, a.silhouette), 'utf8');
  const m = raw.match(/<g id="sil"[^>]*>([\s\S]*?)<\/g>/);
  if (!m) throw new Error('no silhouette geometry for ' + a.slug);
  SIL[a.slug] = m[1].trim();
}
const CATCOLOR = {
  'Widebody':            '#3E6FB0',   /* semi-pastel jet blue */
  'Narrowbody':         '#6FA0C8',   /* lighter sky blue */
  'Supersonic transport':'#5B4E8C',   /* burple / violet-navy */
  'Strategic bomber':   '#3B4657',   /* slate navy */
  'Military transport': '#5F7488',   /* steel grey-blue */
  'Cargo':              '#4E7C77',   /* muted teal */
  'Outsize freighter':  '#2F5D63',   /* deep teal */
  'Trijet':             '#7E6A9E',   /* soft plum */
  'Turboprop airliner': '#8AA98C',   /* sage green */
  'Piston airliner':    '#A9895F',   /* warm taupe */
  'Flying boat':        '#4F8FA6',   /* lagoon blue */
  'Experimental':       '#9C6F86'    /* dusky mauve */
};
const CATLINK = {
  'Widebody': 'widebody', 'Narrowbody': 'narrowbody',
  'Supersonic transport': 'supersonic', 'Strategic bomber': 'bombers',
  'Military transport': 'military-transports', 'Cargo': 'freighters',
  'Outsize freighter': 'freighters', 'Trijet': 'trijets',
  'Turboprop airliner': 'propliners', 'Piston airliner': 'propliners',
  'Flying boat': 'propliners', 'Experimental': 'bombers'
};
const catColor = a => CATCOLOR[a.category] || 'var(--text)';
const MAXSPAN = Math.max(...DATA.aircraft.map(x => x.core.wingspan_m || 0));
const silScaled = a => {
  const pct = Math.max(46, Math.round(98 * Math.pow((a.core.wingspan_m || 0) / MAXSPAN, 0.38)));
  return `<div class="silbox" style="--pct:${pct}%" title="Wingspan ${a.core.wingspan_m} m — drawn at ${pct}% of the widest wings ever built"><svg viewBox="0 ${a.vb.top} 260 ${a.vb.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style="width:var(--silw,${pct}%);--silw-d:${pct}%;color:${catColor(a)}">
<g fill="currentColor">${SIL[a.slug]}</g></svg></div>`;
};
const rkLen = [...A].sort((x, y) => y.core.length_m - x.core.length_m).map(x => x.slug);
const rkWt = [...A].sort((x, y) => (y.core.mtow_kg || 0) - (x.core.mtow_kg || 0)).map(x => x.slug);
const rkSp = A.filter(x => x.core.speed_kmh).sort((x, y) => y.core.speed_kmh - x.core.speed_kmh).map(x => x.slug);

const silUse = (a, w) => `<svg viewBox="0 ${a.vb.top} 260 ${a.vb.h}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" style="color:${catColor(a)}${w ? `;max-width:${w}px` : ''}"><g fill="currentColor">${SIL[a.slug]}</g></svg>`;

function specTable(a) {
  const id = 'spec-' + a.slug;
  return `<div class="tablewrap"><table class="compare" id="${id}"><tbody>
${a.specs.map(s => `<tr><th scope="row">${esc(s.label)}</th><td data-metric="${esc(s.metric)}" data-imperial="${esc(s.imperial)}">${esc(s.metric)}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="unitrow"><button class="btn ghost" type="button" data-unit-toggle="#${id}">Switch to imperial</button></p>`;
}

function aircraftCard(a) {
  const top = a.specs.slice(0, 4);
  return `<article class="acard" data-cat="${typeOf(a)}" data-slug="${a.slug}" data-wingspan="${a.core.wingspan_m}" data-length="${a.core.length_m}" data-height="${a.core.height_m}" data-mtow="${a.core.mtow_kg}" data-year="${a.core.firstFlightYear}" data-name="${esc(a.name.toLowerCase())}" data-manufacturer="${esc(a.manufacturer.toLowerCase())}">
<button class="addcmp" type="button" data-slug="${a.slug}" data-short="${esc(shortName(a))}" aria-pressed="false" title="Add to compare tray" aria-label="Add ${esc(a.name)} to the compare tray">⇄</button>
<div class="sil">${silScaled(a)}</div>
<h3><a href="/aircraft/${a.slug}">${esc(a.name)}</a></h3>
<p class="kicker">${esc(a.manufacturer)} · ${esc(a.status)}</p>
<div class="stats">${top.map(s => `<div><span class="k">${esc(s.label)}</span><span class="v">${esc(s.metric)}</span></div>`).join('')}</div>
<a class="mini" href="/aircraft/${a.slug}">Full specification &rarr;</a>
</article>`;
}

const opNum = c => parseInt(String(c).replace(/[^0-9]/g, ''), 10) || 0;
function operatorRow(op, a) {
  const al = AL.find(x => x.slug === op.airline);
  const name = al ? al.name : (op.name || op.airline);
  const cc = al ? al.cc : (op.cc || '');
  // a zero count means different things: launch orders on an unflown type, nothing at all on a retired one
  const zero = (a && a.operatorsPreService) ? 'On order' : '—';
  const count = op.count === '0' ? zero : esc(op.count) + (op.verified ? '<span class="vtick" title="Individually verified against a cited source">✓</span>' : '');
  const note = op.note ? `<span class="note">${esc(op.note)}</span>` : '';
  const chip = al && al.iata ? `<span class="iata" style="background:${al.brand}">${al.iata}</span>` : (cc ? `<span class="cc">${esc(cc)}</span>` : '');
  const who = `<span class="who">${chip}<span><b>${esc(name)}</b>${note}</span></span>`;
  if (!al) {
    // never silently drop an operator — render unlinked until its page exists
    return `<div class="oprow">${who}<span class="tail"><span class="count num">${count}</span></span></div>`;
  }
  return `<a class="oprow" href="/airlines/${al.slug}">${who}<span class="tail"><span class="count num">${count}</span><span class="arr">&rarr;</span></span></a>`;
}
function operatorsMeta(a) {
  const n = (a.operators || []).length;
  if (a.operatorsPreService) {
    return `<p class="sub">Not yet in service — the key customers below hold the launch order book. Verified ${esc(a.lastVerified)}.</p>`;
  }
  if (a.operatorsHistorical) {
    return `<p class="sub">No current operators — this aircraft's flying days are over. The operators of record are below.</p>`;
  }
  if (a.operatorsComplete) {
    return `<p class="sub">All ${a.operatorsTotal} current operators, verified ${esc(a.lastVerified)}. Fleet counts are approximate where marked ≈.</p>`;
  }
  return `<p class="sub">The top ${n} operators by fleet size, of ${esc(String(a.operatorsTotal))} worldwide — the rest are aggregated below. Counts marked ≈ are approximate, verified ${esc(a.lastVerified)}.</p>`;
}

function fleetRow(entry) {
  const a = entry.aircraft, op = entry.op;
  const count = op.count === '0' ? 'On order' : esc(op.count);
  return `<a class="oprow" href="/aircraft/${a.slug}">
<span class="who"><span class="cc">${esc(a.cc)}</span><span><b>${esc(a.name)}</b>${op.note ? `<span class="note">${esc(op.note)}</span>` : ''}</span></span>
<span class="tail"><span class="count num">${count}</span><span class="arr">&rarr;</span></span></a>`;
}

/* ---------- home ---------- */
renderPage({
  file: 'index.html', urlPath: '/', current: '',
  title: 'aircraft.fyi — every aircraft, at true scale',
  description: 'The visual reference for aircraft. Sourced spec tables for every major type, full operator fleets, and true-scale comparison coming soon.',
  jsonld: [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'aircraft.fyi', url: 'https://aircraft.fyi/', logo: 'https://aircraft.fyi/assets/img/icon-512.png', email: DATA.site.contact, description: DATA.site.description },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'aircraft.fyi', url: 'https://aircraft.fyi/', description: DATA.site.description }
  ],
  content: `
<div class="wip">&#128679; Website under construction &mdash; we&rsquo;re still building this site. &#128679;</div>
<section class="hero home"><div class="wrap">
<h1>Aircraft — <span class="em">for your information</span>.</h1>
<p class="lead">Every giant of the sky — measured, sourced, and drawn to true scale. No stock photos. No guesswork.</p>
<div class="heroChips">
<span class="chip"><b class="num">84.00 m</b><span>longest ever</span></span>
<span class="chip"><b class="num">97.54 m</b><span>widest wings</span></span>
<span class="chip"><b class="num">Mach 3.02</b><span>fastest giant</span></span>
<span class="chip"><b class="num">${A.length} + 50</b><span>aircraft &amp; records</span></span>
</div>
<div class="heroCtas">
<a class="btn" href="/records/longest-aircraft">See the Top 50 &rarr;</a>
<a class="btn ghost" href="#fleet">Browse the fleet</a>
<a class="btn ghost" href="/quiz">&#127922; Silhouette quiz</a></div>
</div></section>
<section class="section" id="fleet" style="padding-top:30px"><div class="wrap">
<span class="eyebrow">The fleet</span>
<h2 class="title">Aircraft, page by page</h2>
<p class="sub">Every silhouette below is sized by real wingspan — the bigger the aircraft, the bigger it draws. Each page carries the full sourced spec table, every variant, and every operator.</p>
<div class="filterbar" id="fleetFilter" role="group" aria-label="Filter the fleet by type">
<span class="fsort-lbl">Filter</span>
<button class="fchip" type="button" data-filter="all" aria-pressed="true">All <span class="n">${A.length}</span></button>
${TY.map(t => `<button class="fchip" type="button" data-filter="${t.slug}" aria-pressed="false">${esc(t.name.replace(/ (airliners|& outsize cargo|& experimental giants|& flying boats)/, ''))} <span class="n">${byType(t).length}</span></button>`).join('\n')}
</div>
<div class="fleetTools">
<div class="filterbar" id="fleetSort" role="group" aria-label="Sort the fleet">
<span class="fsort-lbl">Sort</span>
<button class="fchip" type="button" data-sort="wingspan" aria-pressed="true">Wingspan</button>
<button class="fchip" type="button" data-sort="length" aria-pressed="false">Length</button>
<button class="fchip" type="button" data-sort="manufacturer" aria-pressed="false">Manufacturer</button>
<button class="fchip" type="button" data-sort="height" aria-pressed="false">Height</button>
<button class="fchip" type="button" data-sort="mtow" aria-pressed="false">Weight</button>
<button class="fchip" type="button" data-sort="year" aria-pressed="false">First flight</button>
<button class="fchip" type="button" data-sort="name" aria-pressed="false">A–Z</button>
</div>
<div class="filterbar colsbar" id="fleetCols" role="group" aria-label="Grid columns">
<span class="fsort-lbl">Grid</span>
<button class="fchip cols-d" type="button" data-cols="2" aria-pressed="true">2 columns</button>
<button class="fchip cols-d" type="button" data-cols="3" aria-pressed="false">3</button>
<button class="fchip cols-d" type="button" data-cols="4" aria-pressed="false">4</button>
<button class="fchip cols-m" type="button" data-cols="m1" aria-pressed="false">1 column</button>
<button class="fchip cols-m" type="button" data-cols="m2" aria-pressed="true">2</button>
</div>
</div>
<div class="grid2 cardgrid" id="fleetGrid">${[...A].sort((p,q)=>(q.core.wingspan_m||0)-(p.core.wingspan_m||0)).map(aircraftCard).join('\n')}</div>
<p class="sub" id="fleetCount" style="margin-top:16px"></p>
</div></section>
<section class="section" id="airlines" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Airlines</span>
<h2 class="title">Fleets, airline by airline</h2>
<div class="filterbar colsbar" data-scope="airlines" role="group" aria-label="Grid columns">
<span class="fsort-lbl">Grid</span>
<button class="fchip cols-d" type="button" data-cols="2" aria-pressed="true">2 columns</button>
<button class="fchip cols-d" type="button" data-cols="3" aria-pressed="false">3</button>
<button class="fchip cols-d" type="button" data-cols="4" aria-pressed="false">4</button>
<button class="fchip cols-m" type="button" data-cols="m1" aria-pressed="false">1 column</button>
<button class="fchip cols-m" type="button" data-cols="m2" aria-pressed="true">2</button>
</div>
<div class="grid2 cardgrid" data-scope="airlines">
${AL.map(al => `<article class="acard">${al.iata ? `<span class="iata" style="background:${al.brand}">${al.iata}</span>` : ''}<h3><a href="/airlines/${al.slug}">${esc(al.name)}</a></h3><p class="kicker">${esc(al.country)} · ${esc(al.alliance)}</p><p class="alh" style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(al.headline)}</p><a class="mini" href="/airlines/${al.slug}">See the fleet &rarr;</a></article>`).join('\n')}
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Novelty</span>
<h2 class="title">Bring back Concorde</h2>
<div class="callout" style="border-color:var(--gold)">
<p style="margin:0 0 6px"><b>Twenty-three years ago, the fastest way across the Atlantic retired — and nothing replaced it.</b></p>
<p style="margin:0 0 14px;color:var(--muted)">A petition with absolutely no legal force, a slide-to-verify gate, one signature per browser, and a SHA-256 receipt for every name. Purely because we miss it.</p>
<div class="heroCtas" style="margin:0"><a class="btn" href="/bring-back-concorde">Sign the petition &rarr;</a><a class="btn ghost" href="/blog/is-supersonic-travel-coming-back">Is supersonic coming back?</a></div>
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Browse</span>
<h2 class="title">By maker, or by kind</h2>
<div class="pillars two">
<article class="acard"><h3><a href="/manufacturers">Manufacturers</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Twelve builders, from Airbus and Boeing to Antonov, Tupolev, Hughes and Bristol — each with its full line-up.</p><a class="mini" href="/manufacturers">All manufacturers &rarr;</a></article>
<article class="acard"><h3><a href="/types">Aircraft types</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Widebody, narrowbody, freighter, military transport, bomber, supersonic, trijet, propliner — every category explained.</p><a class="mini" href="/types">All types &rarr;</a></article>
<article class="acard"><h3><a href="/blog">The blog</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Long-form writing on the aircraft we cover — sourced, dated, and honest about what nobody knows yet.</p><a class="mini" href="/blog">Read the blog &rarr;</a></article>
<article class="acard"><h3><a href="/explained">Explained</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">MTOW, ETOPS, range versus payload, winglets, turbofans — the ideas behind every spec table.</p><a class="mini" href="/explained">Start reading &rarr;</a></article>
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">For travellers</span>
<h2 class="title">Before you fly</h2>
<div class="pillars">
<article class="acard"><h3><a href="/fear-of-flying">Scared of flying?</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">The fear is usually a fear of the unknown. Learn to think like a pilot, understand every noise and movement, and let the engineering put you at ease.</p><a class="mini" href="/fear-of-flying">Feel calmer &rarr;</a></article>
<article class="acard"><h3><a href="/travel-classes">Fly better for less</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">How the cabins really differ, the evergreen tricks for cheaper flights, and how points can turn an economy budget into a business-class seat.</p><a class="mini" href="/travel-classes">Fly smarter &rarr;</a></article>
<article class="acard"><h3><a href="/gear">The hangar shop</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">A short, honest shelf for people who love flying machines — LEGO sets, die-cast models, spotter tech and flight-sim kit. Picked on merit, never paid placement.</p><a class="mini" href="/gear">Browse the shelf &rarr;</a></article>
</div>
<div class="heroCtas" style="justify-content:center">
<a class="btn" href="/fear-of-flying">Beat the fear</a>
<a class="btn ghost" href="/travel-classes">Fly for less</a>
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Now live</span>
<h2 class="title">The Scale Engine</h2>
<div class="callout"><p>Any two aircraft, rendered at true relative scale — next to a 1.8&nbsp;m person, a double-decker bus and a Boeing 737. Honest proportions, always.</p></div>
<div class="heroCtas" style="margin-top:18px"><a class="btn" href="/compare">Open the compare tool &rarr;</a><a class="btn ghost" href="/records">See all four record boards</a></div>
</div></section>`
});

/* ---------- aircraft pages ---------- */
for (const a of A) {
  const compareLinks = a.compareWith.map(s => A.find(x => x.slug === s)).filter(Boolean)
    .map(x => `<li style="margin-bottom:9px"><a href="/aircraft/${x.slug}" style="color:var(--gold);font-family:var(--display);font-weight:600">${esc(a.name)} vs ${esc(x.name)} &rarr;</a></li>`).join('\n');
  const ops = (a.operators || []).slice().sort((p, q) => opNum(q.count) - opNum(p.count)).map(o => operatorRow(o, a)).filter(Boolean).join('\n');
  const aff = (a.affiliate && a.affiliate.active && a.affiliate.url)
    ? `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Fly it</span>
<h2 class="title">${esc(a.affiliate.label)}</h2>
<p style="margin-top:18px"><a class="btn" href="${esc(a.affiliate.url)}" rel="sponsored noopener" target="_blank">${esc(a.affiliate.label)} &rarr;</a></p>
<p class="note-aff">Affiliate link — aircraft.fyi may earn a commission. It never affects the data.</p>
</div></section>` : '';

  renderPage({
    file: `aircraft/${a.slug}.html`, urlPath: `/aircraft/${a.slug}`, current: 'aircraft',
    title: `${a.name} — specs, size & operators`,
    description: `${a.headline} Sourced specs, every variant, and every airline that flies it.`,
    ogImage: `${a.slug}.png`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Dataset', name: `${a.name} specifications`, description: a.headline, url: `https://aircraft.fyi/aircraft/${a.slug}`, image: `https://aircraft.fyi/assets/img/og/${a.slug}.png`, dateModified: a.lastVerified, license: 'https://aircraft.fyi/methodology', creator: { '@type': 'Organization', name: 'aircraft.fyi', url: 'https://aircraft.fyi' } },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/#fleet">Aircraft</a> › ${esc(a.name)}</div>
<h1>${esc(a.name)}</h1>
<p class="kicker" style="margin-top:2px">${esc(a.manufacturer)} · ${esc(a.category)} · ${esc(a.status)}</p>
<p class="lead">${esc(a.identity)}</p>
<div class="hero-sil">${silUse(a, 520)}</div>
${statStrip(a)}
</div></section>
${derivedSection(a)}
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Sense of scale</span>
<h2 class="title">How big is it, really?</h2>
<p class="sub">The ${esc(a.name)}'s wingspan, against things you already know the size of.</p>
<div class="sizebars">
${[[a.name, a.core.wingspan_m, 1], ['Football pitch (width)', 68, 0], ['Blue whale', 25, 0], ['New Routemaster bus', 11.2, 0], ['You (probably)', 1.75, 0]].map(r => `<div class="szrow${r[2] ? ' me' : ''}"><span class="szl">${esc(String(r[0]))}</span><span class="szb"><i style="width:${Math.max(1.2, r[1] / Math.max(a.core.wingspan_m, 68) * 100).toFixed(1)}%"></i></span><span class="szv num">${r[1]} m</span></div>`).join('')}
</div>
<div class="recrow">
<a class="recchip" href="/records/longest-aircraft">#${rkLen.indexOf(a.slug) + 1} of ${A.length} by length &rarr;</a>
<a class="recchip" href="/records/heaviest-aircraft">#${rkWt.indexOf(a.slug) + 1} by weight &rarr;</a>
${rkSp.includes(a.slug) ? `<a class="recchip" href="/records/fastest-aircraft">#${rkSp.indexOf(a.slug) + 1} by speed &rarr;</a>` : ''}
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Specification</span>
<h2 class="title">The numbers</h2>
${specTable(a)}
<div class="cmpJump">
<span class="eyebrow">Compare it</span>
<h2 class="title" style="font-size:1.3rem;margin-bottom:12px">Put the ${esc(shortName(a))} next to something</h2>
${(() => { const t = typeOf(a); const rv = A.filter(x => x.slug !== a.slug && typeOf(x) === t).sort((p, q) => Math.abs(p.core.length_m - a.core.length_m) - Math.abs(q.core.length_m - a.core.length_m)).slice(0, 2); return rv.length ? `<div class="recrow" style="margin-top:12px">${rv.map(v => `<a class="recchip" href="/compare?a=${a.slug}&b=${v.slug}">vs ${esc(shortName(v))} &rarr;</a>`).join('')}</div>` : ''; })()}
<div class="cmpJumpRow">
${(a.compareWith || []).filter(c => A.find(z => z.slug === c)).slice(0, 3).map(c => {
  const o = A.find(z => z.slug === c);
  return `<a class="btn ghost sm" href="/compare#${a.slug},${o.slug}">vs ${esc(shortName(o))}</a>`;
}).join('\n')}
<a class="btn sm" href="/compare#${a.slug}">Compare with anything &rarr;</a>
<button class="btn ghost sm addcmp" type="button" data-slug="${a.slug}" data-short="${esc(shortName(a))}" aria-pressed="false">+ Add to tray</button>
</div>
</div>
${(() => { const S = [...A].sort((p, q) => p.name.localeCompare(q.name)); const i = S.findIndex(x => x.slug === a.slug);
const pv = S[(i - 1 + S.length) % S.length], nx = S[(i + 1) % S.length];
return `<nav class="pn" aria-label="More aircraft">
<a class="pn-a" href="/aircraft/${pv.slug}"><span class="pn-k">&larr; Previous</span><b>${esc(pv.name)}</b></a>
<a class="pn-a next" href="/aircraft/${nx.slug}"><span class="pn-k">Next &rarr;</span><b>${esc(nx.name)}</b></a>
</nav>`; })()}
<p class="verified">Last verified: ${esc(a.lastVerified)} · Spot an error? <a href="mailto:${DATA.site.corrections}?subject=Correction%3A%20${encodeURIComponent(a.name)}" style="color:var(--gold)">${esc(DATA.site.corrections)}</a></p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The story</span>
<h2 class="title">What makes it different</h2>
<div class="prose" style="margin-top:20px">
${a.prose.map(p => `<p>${esc(p)}</p>`).join('\n')}
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Variants</span>
<h2 class="title">The ${esc(a.name)} line</h2>
<div data-accordion>
${a.variants.map((v, i) => `<details class="qa"${i === 0 ? ' open' : ''}><summary>${esc(v.name)}<i class="caret"></i></summary><div class="body">${esc(v.note)}</div></details>`).join('\n')}
</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Operators</span>
<h2 class="title">Who flies the ${esc(a.name)}</h2>
${operatorsMeta(a)}
${ops}
${a.operatorsOther ? `<div class="oprow other"><span class="who"><span><b>${esc(a.operatorsOther.label)}</b><span class="note">${esc(a.operatorsOther.note)}</span></span></span><span class="tail"><span class="count num">${esc(a.operatorsOther.count)}</span></span></div>` : ''}
${a.operatorsOnOrder ? `<p class="sub" style="margin-top:18px">${esc(a.operatorsOnOrder)}</p>` : ''}
</div></section>
${aff}
${a.gear && a.gear.length ? `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">For the collector</span>
<h2 class="title">Build it yourself</h2>
<div class="gearcard">
<div class="gear-body">
<span class="gear-tag">Collector&rsquo;s pick</span>
<h3>${esc(a.gear[0].title)}</h3>
<p>${esc(a.gear[0].blurb)}</p>
<a class="gear-cta" href="${esc(a.gear[0].url)}" target="_blank" rel="sponsored nofollow noopener">View on Amazon &rarr;</a>
<p class="gear-disc">${AFFDISC}</p>
</div>
</div>
</div></section>` : ''}
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Compare</span>
<h2 class="title">Put it next to something</h2>
<ul style="list-style:none;margin:20px 0 0;padding:0">${compareLinks}</ul>
<h3 style="margin-top:32px;font-size:1.1rem">Sources</h3>
${sourcesBlock(a.sources, 'aircraft', a.slug, a.name)}
</div></section>`
  });
}

const RT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'routes-longest.json'), 'utf8'));

/* ---------- airline pages ---------- */
for (const al of AL) {
  const fl = A.map(a => ({ a, op: (a.operators || []).find(o => o.airline === al.slug) })).filter(x => x.op)
    .sort((x, y) => (y.a.core.wingspan_m || 0) - (x.a.core.wingspan_m || 0));
  const REC = { 'airbus-a380': 'the largest passenger aircraft ever built',
                'antonov-an-124': 'the heaviest production freighter ever made',
                'concorde': 'the fastest airliner in history' };
  const recs = fl.filter(x => REC[x.a.slug]);
  const rts = RT.routes.filter(r => r.als === al.slug).sort((p, q) => q.km - p.km);
  const opN = c => { const n = parseInt(String(c).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? -1 : n; };
  const isPast = x => /^(retired|destroyed|preserved|prototype)/i.test(String(x.a.status || '')) || /\b(retired|withdrawn|former)\b/i.test(String(x.op.note || ''));
  const past = fl.filter(isPast);
  const ord = fl.filter(x => !isPast(x) && opN(x.op.count) === 0).map(x => Object.assign({}, x, { _ord: true }));
  const cur = fl.filter(x => !isPast(x) && opN(x.op.count) !== 0);
  const flCards = [...cur, ...ord].map(x => `<article class="acard flcard">
<span class="opcount">${x._ord ? 'On order' : esc(String(x.op.count)) + ' in fleet'}</span>
<button class="addcmp" type="button" data-slug="${x.a.slug}" data-short="${esc(shortName(x.a))}" aria-pressed="false" title="Add to compare tray" aria-label="Add ${esc(x.a.name)} to the compare tray">&#8644;</button>
<div class="sil">${silScaled(x.a)}</div>
<h3><a href="/aircraft/${x.a.slug}">${esc(x.a.name)}</a></h3>
<p class="kicker">${esc(x.a.manufacturer)} · ${esc(x.a.status)}</p>
${x.op.note ? `<p class="opnote">${esc(x.op.note)}</p>` : ''}
<a class="mini" href="/aircraft/${x.a.slug}">Full specification &rarr;</a>
</article>`).join('\n');
  const aff = (al.affiliate && al.affiliate.active && al.affiliate.url)
    ? `<p style="margin-top:22px"><a class="btn" href="${esc(al.affiliate.url)}" rel="sponsored noopener" target="_blank">${esc(al.affiliate.label)} &rarr;</a></p><p class="note-aff">Affiliate link — aircraft.fyi may earn a commission. It never affects the data.</p>` : '';
  renderPage({
    file: `airlines/${al.slug}.html`, urlPath: `/airlines/${al.slug}`, current: 'airlines',
    title: `${al.name} fleet — every aircraft they fly`,
    description: `${al.headline} Full fleet, aircraft by aircraft, sourced.`,
    jsonld: { '@context': 'https://schema.org', '@type': 'Airline', name: al.name, iataCode: al.iata, foundingDate: al.founded, url: `https://aircraft.fyi/airlines/${al.slug}` },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › Airlines › ${esc(al.name)}</div>
<h1>${al.iata ? `<span class="iata big" style="background:${al.brand}">${al.iata}</span> ` : ''}${esc(al.name)}</h1>
<p class="kicker" style="margin-top:2px">${esc(al.country)} · ${esc(al.alliance)} · Hub: ${esc(al.hub)}</p>
<p class="lead">${esc(al.headline)}</p>
${aff}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<div class="statstrip">
<div class="ss"><span class="k">Types in fleet</span><span class="v num">${cur.length}</span></div>
<div class="ss"><span class="k">Biggest aircraft</span><span class="v">${cur.length ? esc(shortName(cur[0].a)) : '—'}</span></div>
<div class="ss"><span class="k">Alliance</span><span class="v">${esc(al.alliance)}</span></div>
<div class="ss"><span class="k">Founded</span><span class="v num">${esc(al.founded)}</span></div>
<div class="ss"><span class="k">IATA</span><span class="v">${esc(al.iata)}</span></div>
${past.length ? `<div class="ss"><span class="k">Retired types</span><span class="v num">${past.length}</span></div>` : ''}
</div>
</div></section>
${cur.length > 1 ? `<section class="section" style="padding-top:6px"><div class="wrap">
<span class="eyebrow">Side by side</span>
<h2 class="title">The fleet at true scale</h2>
<p class="sub">Every type ${esc(al.name)} flies, drawn to the same scale — widest wings on the left. Tap any silhouette.</p>
<div class="allineup">${cur.map(x => `<a class="lu" href="/aircraft/${x.a.slug}"${x.a.core.wingspan_m ? ` style="flex:${x.a.core.wingspan_m} 1 0"` : ''}><span class="lu-s">${silScaled(x.a)}</span><span class="lu-n">${esc(shortName(x.a))}</span></a>`).join('')}</div>
</div></section>` : ''}
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The fleet</span>
<h2 class="title">What ${esc(al.name)} flies</h2>
${(cur.length + ord.length) ? `<div class="filterbar colsbar" role="group" aria-label="Grid columns">
<span class="fsort-lbl">Grid</span>
<button class="fchip cols-d" type="button" data-cols="2" aria-pressed="true">2 columns</button>
<button class="fchip cols-d" type="button" data-cols="3" aria-pressed="false">3</button>
<button class="fchip cols-d" type="button" data-cols="4" aria-pressed="false">4</button>
<button class="fchip cols-m" type="button" data-cols="m1" aria-pressed="false">1 column</button>
<button class="fchip cols-m" type="button" data-cols="m2" aria-pressed="true">2</button>
</div>
<div class="grid2 cardgrid">
${flCards}
</div>` : '<p class="sub">Fleet pages for this airline are in build.</p>'}
${recs.length ? `<div class="recrow">${recs.map(x => `<a class="recchip" href="/aircraft/${x.a.slug}">${isPast(x) ? 'Flew' : 'Flies'} ${esc(shortName(x.a))} — ${REC[x.a.slug]} &rarr;</a>`).join('')}</div>` : ''}
</div></section>
${past.length ? `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The history</span>
<h2 class="title">Retired from the fleet</h2>
<div class="grid2 cardgrid">
${past.map(x => `<article class="acard flcard pastcard">
<span class="opcount">${opN(x.op.count) > 0 ? esc(String(x.op.count)) + ' flown' : 'Former operator'}</span>
<div class="sil">${silScaled(x.a)}</div>
<h3><a href="/aircraft/${x.a.slug}">${esc(x.a.name)}</a></h3>
<p class="kicker">${esc(x.a.status)}</p>
${x.op.note ? `<p class="opnote">${esc(x.op.note)}</p>` : ''}
<a class="mini" href="/aircraft/${x.a.slug}">The full story &rarr;</a>
</article>`).join('\n')}
</div>
</div></section>` : ''}
${rts.length ? `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Route records</span>
<h2 class="title">Their longest flights</h2>
<div class="specwrap"><table class="spec">
<thead><tr><th>Route</th><th>Aircraft</th><th>Distance</th><th>Block time</th></tr></thead>
<tbody>${rts.map(r => `<tr><td>${esc(r.fr)} (${esc(r.fri)}) &rarr; ${esc(r.to)} (${esc(r.toi)})${String(r.status).toLowerCase() === 'announced' ? ' <span class="rt-ann">announced</span>' : ''}</td><td>${r.acs ? `<a href="/aircraft/${r.acs}">${esc(r.ac)}</a>` : esc(r.ac)}</td><td class="num">${r.km.toLocaleString('en-US')} km</td><td class="num">${esc(r.time || '—')}</td></tr>`).join('\n')}</tbody></table></div>
<p class="sub" style="margin-top:10px">From our <a href="/records/longest-flights">longest flights in the world</a> board.</p>
</div></section>` : ''}
${al.facts && al.facts.length ? `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Good to know</span>
<h2 class="title">${esc(al.name)}, in a few facts</h2>
<ul class="facts">${al.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
</div></section>` : ''}
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow" style="display:block">Sources</span>
${sourcesBlock(al.sources, 'airlines', al.slug, al.name)}
</div></section>`
  });
}

/* ---------- methodology page (E-E-A-T: publish how the numbers are made) ---------- */
renderPage({
  file: 'methodology.html', urlPath: '/methodology', current: '',
  title: 'Methodology — how aircraft.fyi calculates its numbers',
  description: 'How every aircraft.fyi derived metric is computed, where the core specifications come from, and how corrections work. Every number, explained.',
  jsonld: { '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'How aircraft.fyi calculates its numbers', url: 'https://aircraft.fyi/methodology' },
  content: `
<section class="hero"><div class="wrap">
<h1>How we calculate our numbers</h1>
<p class="lead">Every derived metric on this site is computed from the sourced core specification. Here is exactly how — so the numbers are checkable, and citable.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Our numbers</span>
<h2 class="title" style="margin-bottom:8px">Every derived metric, formula by formula</h2>
${METRICS.map(m => `<div class="qa" style="margin-top:12px"><div style="padding:16px 18px">
<h3 style="font-size:1.1rem;margin-bottom:6px">${esc(m.name)}</h3>
<p style="color:var(--muted);font-size:.92rem;margin:0 0 6px"><b style="color:var(--text)">Formula:</b> ${esc(m.formula)}</p>
<p style="color:var(--muted);font-size:.92rem;margin:0">${esc(m.why)}</p>
</div></div>`).join('\n')}
<div class="mf-rg" style="margin-top:24px"><b>Caveats.</b> ${esc(DATA.methodology.caveats)}</div>
<h3 style="margin-top:40px;font-size:1.15rem">What the ✓ tick actually means</h3>
<div class="prose" style="margin-top:12px">
<p>Operator fleet counts move constantly, and most aviation sites quietly present a stale number as fact. We do not. Every operator row on this site is one of two things, and we say which.</p>
<p>A row marked <b>✓</b> has been individually checked against a named, dated source — an airline filing, a manufacturer statement, or a maintained fleet record — and that source is listed at the bottom of the page. A row marked <b>≈</b> is an approximate snapshot: broadly right, good enough to reason about, and not something you should quote in a contract. Currently ${(() => { const t = A.reduce((n, a) => n + (a.operators || []).length, 0); const v = A.reduce((n, a) => n + (a.operators || []).filter(o => o.verified).length, 0); return `<b>${v} of ${t}</b> operator rows`; })()} carry a tick, and the flagship fleets — Emirates, Southwest, United — are among them. That number will only go up.</p>
<p>We would rather show you an honest ≈ than a confident lie.</p>
</div>
<h3 style="margin-top:40px;font-size:1.15rem">Where the core data comes from</h3>
<div class="prose" style="margin-top:12px">
<p>Core specifications are taken from manufacturer documents — Boeing and Airbus airport-planning manuals and technical pages — and type certificate data sheets, cited per row on every spec table. Operator fleet counts are approximate snapshots, marked with ≈ and a last-verified date, and re-checked against airline press material.</p>
<p>Where sources conflict, we say so on the page and cite both. If you spot an error, tell us — corrections are made visibly, not silently.</p>
</div>
</div></section>`
});

/* ---------- records: longest-aircraft board + hub ---------- */
const RL = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'records-longest.json'), 'utf8'));
function recordRow(r) {
  const inner = `<span class="rr-rank num">${r.rank}</span>
<span class="rr-main"><span class="rr-name">${esc(r.name)}</span><span class="rr-len num"><b>${r.length_m.toFixed(2)} m</b><span class="rr-ft"> · ${esc(r.length_ft)}</span></span></span>
<span class="rr-sub"><span class="rr-ff num">${esc(r.firstFlight)}</span><span class="rr-st">${esc(r.status)}</span></span>`;
  return r.slug
    ? `<a class="recrow" href="/aircraft/${r.slug}">${inner}</a>`
    : `<div class="recrow">${inner}</div>`;
}
renderPage({
  file: 'records/longest-aircraft.html', urlPath: '/records/longest-aircraft', current: 'records',
  title: 'The 50 longest aircraft ever built — full ranked list',
  description: 'Every one of the 50 longest aircraft in history, ranked by fuselage length — from the destroyed Antonov An-225 to the 777-9, with dates and status.',
  jsonld: { '@context': 'https://schema.org', '@type': 'ItemList', name: RL.title,
    itemListElement: RL.records.slice(0, 10).map(r => ({ '@type': 'ListItem', position: r.rank, name: r.name })) },
  content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/records">Records</a> › Longest aircraft</div>
<h1>The 50 longest aircraft ever built</h1>
<p class="lead">Ranked by fuselage length — airliners, freighters, military giants, one flying boat and two supersonic transports. Number one no longer exists.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<div class="prose">
<p>Length is the record that tells the most stories. The top of this list is a graveyard of ambition: the An-225 destroyed in war after a life of world records, the Spruce Goose that flew for under a minute, Concorde and the Tu-144 racing each other into retirement. And the contest is still live — when the 777-9 enters service it will become the longest airliner ever to carry passengers, at 76.72 metres.</p>
<p>Lengths are manufacturer figures for the longest variant named in each row. Aircraft covered in depth on this site are linked.</p>
</div>
<h2 class="title" style="margin-top:34px">The board, one to fifty</h2>
<div class="reclist">
<div class="recrow head" aria-hidden="true"><span class="rr-rank">#</span><span class="rr-main"><span class="rr-name">Aircraft</span><span class="rr-len">Length</span></span><span class="rr-sub"><span class="rr-ff">First flight</span><span class="rr-st">Status</span></span></div>
${RL.records.map(recordRow).join('\n')}
</div>
<p class="verified">Compiled by aircraft.fyi from manufacturer specifications, verified ${esc(RL.asOf)}.</p>
<div class="mf-rg" style="margin-top:18px">Sources: ${RL.sources.map(s => `<a href="${s.url}" style="color:var(--gold)">${esc(s.name)}</a>`).join(' · ')}</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">More boards</span>
<h2 class="title">Other records</h2>
<div class="pillars two">
${RECORD_BOARDS.filter(x => x.urlPath !== '/records/longest-aircraft').map(x => `<article class="acard"><h3><a href="${x.urlPath}">${esc(x.h1)}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(x.lead)}</p><a class="mini" href="${x.urlPath}">Open the board &rarr;</a></article>`).join('\n')}
</div>
</div></section>`
});
renderPage({
  file: 'records.html', urlPath: '/records', current: 'records', ogImage: 'records.png',
  title: 'Aircraft records — the longest, biggest and fastest',
  description: 'Five ranked record boards compiled from sourced data: the longest, heaviest, fastest and most-produced aircraft — and the longest flights on Earth.',
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Aircraft records', url: 'https://aircraft.fyi/records' },
  content: `
<section class="hero"><div class="wrap">
<h1>Aircraft records</h1>
<p class="lead">Five ranked boards, compiled from manufacturer and schedule data and sourced on every page.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The boards</span>
<h2 class="title">Five ways to rank an aircraft</h2>
<div class="pillars two">
${RECORD_BOARDS.map(x => `<article class="acard"><h3><a href="${x.urlPath}">${esc(x.h1)}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(x.lead)}</p><a class="mini" href="${x.urlPath}">Open the board &rarr;</a></article>`).join('\n')}
</div>
</div></section>`
});

/* ---------- hub stubs (honest, out of sitemap) ---------- */


/* ---------- RECORDS BOARDS (computed from the dataset) ---------- */
function boardRow(rank, a, main, sub) {
  return `<a class="recrow" href="/aircraft/${a.slug}">
<span class="rr-rank num">${rank}</span>
<span class="rr-main"><span class="rr-name">${esc(a.name)}</span><span class="rr-len num"><b>${esc(main)}</b></span></span>
<span class="rr-sub"><span class="rr-ff num">${esc(sub)}</span><span class="rr-st">${esc(a.status)}</span></span>
</a>`;
}
function board({ file, urlPath, title, description, h1, lead, note, key, fmt, sub, jsonldName }) {
  const list = A.filter(a => a.core[key]).sort((x, y) => y.core[key] - x.core[key]);
  const rows = list.map((a, i) => boardRow(i + 1, a, fmt(a), sub(a))).join('\n');
  renderPage({
    file, urlPath, current: '', title, description,
    jsonld: { '@context': 'https://schema.org', '@type': 'ItemList', name: jsonldName, url: `https://aircraft.fyi${urlPath}`,
      itemListElement: list.slice(0, 20).map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: a.name, url: `https://aircraft.fyi/aircraft/${a.slug}` })) },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/records">Records</a> › ${esc(h1)}</div>
<h1>${esc(h1)}</h1>
<p class="lead">${esc(lead)}</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<p class="sub">${esc(note)}</p>
<div class="reclist">
${rows}
</div>
<p class="verified">${list.length} aircraft ranked · every figure sourced on its own page · last verified ${esc(A[0].lastVerified)}</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">More boards</span>
<h2 class="title">Other records</h2>
<div class="pillars two">
${RECORD_BOARDS.filter(x => x.urlPath !== urlPath).map(x => `<article class="acard"><h3><a href="${x.urlPath}">${esc(x.h1)}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(x.lead)}</p><a class="mini" href="${x.urlPath}">Open the board &rarr;</a></article>`).join('\n')}
</div>
</div></section>`
  });
}
RECORD_BOARDS.filter(x => x.key).forEach(board);

/* ---------- THE SCALE ENGINE ---------- */
const SCALE_DATA = A.map(a => ({ s: a.slug, n: a.name, sp: a.core.wingspan_m, l: a.core.length_m, h: a.core.height_m,
  m: a.core.mtow_kg || null, st: a.core.seats_typical || null }));
renderPage({
  file: 'scale.html', urlPath: '/scale', current: '', sitemap: false,
  title: 'The Scale Engine has moved to /compare',
  description: 'The Scale Engine now lives at /compare, where you can put any three aircraft side by side at true relative scale with every specification compared.',
  head: '<meta http-equiv="refresh" content="0; url=/compare"><link rel="canonical" href="https://aircraft.fyi/compare"><meta name="robots" content="noindex,follow">',
  jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Moved to /compare', url: 'https://aircraft.fyi/compare' },
  content: `
<section class="hero"><div class="wrap">
<h1>It moved to <span class="em">/compare</span>.</h1>
<p class="lead">The Scale Engine is now part of the compare tool — same true-scale drawing, but three aircraft instead of two, and the full specification table alongside it.</p>
<div class="heroCtas"><a class="btn" href="/compare">Open the compare tool &rarr;</a></div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<h2 class="title">Redirecting you now</h2>
<p class="sub">If nothing happens, <a href="/compare" style="color:var(--gold)">open the compare tool</a>.</p>
</div></section>`
});

/* ---------- MANUFACTURER + TYPE pages (real hubs, computed from the dataset) ---------- */
function fitDesc(s) {
  if (s.length > 160) s = s.slice(0, 157).replace(/[\s,\u2014-]+\S*$/, '') + '…';
  while (s.length < 110) s += ' Every number sourced and dated.';
  return s.length > 160 ? s.slice(0, 159) + '…' : s;
}
function miniTable(list) {
  const rows = list.slice().sort((x, y) => y.core.length_m - x.core.length_m).map(a =>
    `<tr><td><a href="/aircraft/${a.slug}">${esc(a.name)}</a></td><td class="num">${a.core.length_m.toFixed(2)} m</td><td class="num">${a.core.wingspan_m ? a.core.wingspan_m.toFixed(2) + ' m' : '—'}</td><td class="num">${a.core.firstFlightYear || '—'}</td><td style="color:var(--muted);font-size:.88em">${esc(a.status)}</td></tr>`).join('\n');
  return `<div class="specwrap"><table class="spec">
<thead><tr><th>Aircraft</th><th>Length</th><th>Wingspan</th><th>First flight</th><th>Status</th></tr></thead>
<tbody>${rows}</tbody></table></div>`;
}
function groupStats(list) {
  const built = list.reduce((s, a) => s + (a.core.produced || 0), 0);
  const longest = list.slice().sort((x, y) => y.core.length_m - x.core.length_m)[0];
  const years = list.map(a => a.core.firstFlightYear).filter(Boolean).sort();
  const items = [
    ['Aircraft here', String(list.length)],
    ['Longest', longest.core.length_m.toFixed(2) + ' m'],
    ['Combined built', built.toLocaleString('en-US')],
    ['First flights', years.length ? `${years[0]}–${years[years.length - 1]}` : '—']
  ];
  return `<div class="statstrip">${items.map(i => `<div class="ss"><span class="k">${esc(i[0])}</span><span class="v num">${esc(i[1])}</span></div>`).join('')}</div>`;
}

for (const m of MK) {
  const list = byMaker(m);
  if (!list.length) continue;
  const longest = list.slice().sort((x, y) => y.core.length_m - x.core.length_m)[0];
  renderPage({
    file: `manufacturers/${m.slug}.html`, urlPath: `/manufacturers/${m.slug}`, current: '',
    title: `${m.name} aircraft — every type, sourced`.slice(0, 60),
    description: fitDesc(`${m.tagline} ${list.length} ${m.name} aircraft on aircraft.fyi, led by the ${longest.name} — full specs, silhouettes and operators.`),
    jsonld: { '@context': 'https://schema.org', '@type': 'Organization', name: m.name, foundingDate: String(m.founded), url: `https://aircraft.fyi/manufacturers/${m.slug}` },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/manufacturers">Manufacturers</a> › ${esc(m.name)}</div>
<h1>${esc(m.name)}</h1>
<p class="kicker" style="margin-top:2px">${esc(m.country)} · Founded ${m.founded}</p>
<p class="lead">${esc(m.tagline)}</p>
${groupStats(list)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The company</span>
<h2 class="title">The story so far</h2>
${m.prose.map(p => `<p>${esc(p)}</p>`).join('\n')}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The line-up</span>
<h2 class="title">${esc(m.name)} aircraft</h2>
<p class="sub">Silhouettes are sized by real wingspan — bigger aircraft draw bigger.</p>
${list.length > 1 ? `<div class="allineup" style="margin-bottom:20px">${list.slice().sort((x, y) => (y.core.wingspan_m || 0) - (x.core.wingspan_m || 0)).map(x => `<a class="lu" href="/aircraft/${x.slug}" style="flex:${x.core.wingspan_m || 10} 1 0"><span class="lu-s">${silScaled(x)}</span><span class="lu-n">${esc(shortName(x))}</span></a>`).join('')}</div>` : ''}
<div class="filterbar colsbar" role="group" aria-label="Grid columns">
<span class="fsort-lbl">Grid</span>
<button class="fchip cols-d" type="button" data-cols="2" aria-pressed="true">2 columns</button>
<button class="fchip cols-d" type="button" data-cols="3" aria-pressed="false">3</button>
<button class="fchip cols-d" type="button" data-cols="4" aria-pressed="false">4</button>
<button class="fchip cols-m" type="button" data-cols="m1" aria-pressed="false">1 column</button>
<button class="fchip cols-m" type="button" data-cols="m2" aria-pressed="true">2</button>
</div>
<div class="grid2 cardgrid">${list.slice().sort((x, y) => (y.core.wingspan_m || 0) - (x.core.wingspan_m || 0)).map(aircraftCard).join('\n')}</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Side by side</span>
<h2 class="title">Every type, ranked by length</h2>
${miniTable(list)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow" style="display:block">Sources</span>
${sourcesBlock(m.sources, 'makers', m.slug, m.name)}
</div></section>`
  });
}

renderPage({
  file: 'gear.html', urlPath: '/gear',
  title: 'The hangar shop — aircraft models, LEGO & gifts for avgeeks',
  description: 'A short, honest shelf of the best aircraft models, LEGO sets and gifts for people who love flying machines. Hand-picked, never paid placement.',
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'The hangar shop', url: 'https://aircraft.fyi/gear' },
  content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › The hangar shop</div>
<h1>The hangar shop</h1>
<p class="lead">A short, honest shelf for people who love flying machines. Everything here is hand-picked on merit — no sponsored slots, no filler. ${AFFDISC}</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
${GEAR.map(grp => `<div class="geargroup">
<span class="eyebrow" style="display:block">${esc(grp.group)}</span>
<p class="sub" style="margin:2px auto 0">${esc(grp.note)}</p>
<div class="gearlist">
${grp.items.map(g => { const href = g.url || amz(g.q); const kind = g.url ? 'sponsored nofollow noopener' : 'nofollow noopener'; const key = 'gear:' + g.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); return `<article class="gearitem" data-key="${key}">
<div class="gi-head"><span class="gear-tag">${esc(g.tag)}</span><button class="gi-own" type="button" aria-pressed="false" title="Mark as owned">Own it</button></div>
<h3>${esc(g.title)}</h3>
<p>${esc(g.blurb)}</p>
<div class="gear-row">
<a class="gear-cta" href="${esc(href)}" target="_blank" rel="${kind}">${g.url ? 'View on Amazon' : 'Find on Amazon'} &rarr;</a>
${g.link ? `<a class="gear-alt" href="${g.link}">Explore on site &rarr;</a>` : ''}
</div>
</article>`; }).join('\n')}
</div>
</div>`).join('\n')}
<p class="sub" style="margin-top:8px">Your &ldquo;owned&rdquo; ticks are saved on this device only — nothing leaves your browser. Spotted something that belongs here? <a href="mailto:business@luck.fyi?subject=Hangar%20shop%20suggestion" style="color:var(--gold)">Tell us</a>.</p>
</div></section>`
});

renderPage({
  file: 'quiz.html', urlPath: '/quiz',
  title: 'The Silhouette Quiz — can you name the aircraft?',
  description: 'A planform appears. Four names. One is right. How long a streak can you build from ' + A.length + ' aircraft drawn to true scale?',
  jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'The Silhouette Quiz', url: 'https://aircraft.fyi/quiz' },
  content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › Quiz</div>
<h1>The Silhouette Quiz</h1>
<p class="lead">A planform appears. Four names. One is right. All ${A.length} aircraft, drawn to true scale — how long a streak can you build?</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<div class="quizcard">
<div class="qstat"><span>Streak <b class="num" id="qStreak">0</b></span><span>Best <b class="num" id="qBest">0</b></span></div>
<div class="qsil" id="qSil" aria-hidden="true"></div>
<div class="qopts" id="qOpts"></div>
<p class="qmsg" id="qMsg" aria-live="polite">&nbsp;</p>
<div class="qrow"><button class="fchip" type="button" id="qSkip">Skip &rarr;</button><button class="fchip" type="button" id="qShare">Share my streak</button></div>
</div>
</div></section>
<script>
(function(){
  var QD = ${JSON.stringify(A.map(x => ({ n: x.name, s: silUse(x).replace(/color:[^;"]+;?/, '') })))};
  var sil = document.getElementById('qSil'), opts = document.getElementById('qOpts'), msg = document.getElementById('qMsg');
  var stEl = document.getElementById('qStreak'), bEl = document.getElementById('qBest');
  if (!sil) return;
  var streak = 0, best = 0, cur = -1, lock = false;
  try { best = parseInt(localStorage.getItem('acfyi.quiz.best') || '0', 10) || 0; } catch (e) {}
  bEl.textContent = best;
  function pick() {
    lock = false; msg.innerHTML = '&nbsp;';
    var i; do { i = Math.floor(Math.random() * QD.length); } while (i === cur);
    cur = i;
    sil.innerHTML = QD[i].s;
    var set = [i];
    while (set.length < 4) { var r = Math.floor(Math.random() * QD.length); if (set.indexOf(r) < 0) set.push(r); }
    set.sort(function(){ return Math.random() - 0.5; });
    opts.innerHTML = set.map(function(k){ return '<button type="button" class="qopt" data-k="' + k + '">' + QD[k].n + '</button>'; }).join('');
  }
  opts.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.qopt') : null;
    if (!btn || lock) return;
    lock = true;
    var k = parseInt(btn.getAttribute('data-k'), 10);
    if (k === cur) {
      btn.classList.add('ok'); streak++;
      if (streak > best) { best = streak; bEl.textContent = best; try { localStorage.setItem('acfyi.quiz.best', String(best)); } catch (e2) {} }
      stEl.textContent = streak;
      msg.textContent = 'Correct — it\u2019s the ' + QD[cur].n + '.';
      setTimeout(pick, 750);
    } else {
      btn.classList.add('no');
      [].forEach.call(opts.querySelectorAll('.qopt'), function(o){ if (parseInt(o.getAttribute('data-k'), 10) === cur) o.classList.add('ok'); });
      streak = 0; stEl.textContent = 0;
      msg.textContent = 'It was the ' + QD[cur].n + '. Streak reset.';
      setTimeout(pick, 1600);
    }
  });
  document.getElementById('qSkip').addEventListener('click', function(){ if (!lock) { streak = 0; stEl.textContent = 0; pick(); } });
  document.getElementById('qShare').addEventListener('click', function(){
    var t = 'My best streak naming aircraft silhouettes is ' + best + ' \u2708\uFE0F Try it: https://aircraft.fyi/quiz';
    try { navigator.clipboard.writeText(t); msg.textContent = 'Copied — paste it anywhere.'; } catch (e) { msg.textContent = t; }
  });
  pick();
})();
</script>`
});

/* ---------- fear of flying (clean, no affiliate) ---------- */
renderPage({
  file: 'fear-of-flying.html', urlPath: '/fear-of-flying', current: '',
  title: 'Scared of flying? The engineering that makes it safe',
  description: 'A calm, factual guide to the fear of flying — what turbulence really is, why the noises happen, how aircraft are built to cope, and gentle ways to feel more in control. Understanding is the cure for a lot of fear.',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: 'Scared of flying? The engineering that makes it safe', description: 'What turbulence really is, why the noises happen, and how aircraft are built to cope.', url: 'https://aircraft.fyi/fear-of-flying' }, faqLd([
    { q: 'Is turbulence dangerous?', a: 'No. Turbulence is just uneven air, and aircraft wings are built to flex several metres and withstand far more than any turbulence you will ever feel. Pilots slow down mainly for comfort, not safety. Keep your seatbelt loosely fastened and it poses no real hazard.' },
    { q: 'What is the loud clunk after take-off?', a: 'That is the landing gear retracting into the belly and the doors closing over it. It is meant to be firm and loud. Minutes later you may hear the wing flaps sliding back in as the aircraft speeds up.' },
    { q: 'Why does the engine sound like it is giving up after take-off?', a: 'It is not. Just after take-off the pilots reduce power from full thrust to a quieter climb setting. It is planned and happens on every flight.' },
    { q: 'Can a plane still fly if an engine fails?', a: 'Yes. A fully loaded airliner can climb and fly safely on one engine, and pilots train for it constantly. If all thrust is lost the aircraft glides — an airliner at cruise can glide well over 100 kilometres.' }
  ])],
  content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › Scared of flying</div>
<h1>Scared of flying? Let&rsquo;s demystify it.</h1>
<p class="lead">Most fear of flying is really a fear of the <em>unknown</em> — a strange noise, a sudden bump, a feeling with no explanation. This whole site exists to explain these machines, so here is the calm, honest version: what is actually happening up there, and why the aircraft is built to handle every bit of it.</p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The big one</span>
<h2 class="title" style="margin-bottom:8px">Turbulence feels dangerous. It isn&rsquo;t.</h2>
<div class="prose" style="margin-top:12px">
<p>Turbulence is just uneven air — pockets moving at slightly different speeds, the way a boat rocks on choppy water. It feels dramatic because you can&rsquo;t see it coming, but to the aircraft it is completely routine. Wings are not rigid: they are engineered to <b>flex</b>, and on a big airliner the wingtips can move several metres up and down without any trouble at all. That flexing is the wing doing its job, not a sign of strain.</p>
<p>Test aircraft are deliberately pushed far beyond anything you will ever feel — wings bent upward past 1.5 times the worst imaginable load until they finally break, purely to prove how enormous the margin is. The bumps on your flight are a tiny fraction of what the airframe shrugs off by design. Pilots slow down or change altitude in turbulence mostly for <em>your comfort</em>, not because the aircraft is in any danger.</p>
<p>The single best thing you can do: keep your seatbelt loosely fastened the whole flight. Not because the plane is at risk — but because it means a sudden bump can never unseat you. That one habit removes the only real hazard turbulence poses.</p>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The mindset shift</span>
<h2 class="title" style="margin-bottom:8px">Learn to think like a pilot</h2>
<div class="prose" style="margin-top:12px">
<p>Here is the single idea that turns fear into fascination: <b>almost every movement you feel is the direct result of an input the pilot chose to make.</b> The aircraft is not being thrown around — it is being <em>flown</em>, deliberately, by two people following a precise plan. Once you understand what they are doing and why, the bumps and turns stop being mysterious forces and become a conversation you can follow.</p>
<p>Take off and landing — the parts that scare people most — are the most <em>hands-on</em> of all, and that is exactly why so much is happening. On take-off the pilot pulls back to rotate the nose up, so you feel pushed into your seat as the jet climbs steeply and deliberately. The engines are at high power on purpose; that is the plan, not a struggle. Moments later the power eases back to a calmer climb setting, the nose lowers slightly, and you feel the change — because the pilot <em>commanded</em> it, right on schedule.</p>
<p>Landing is the same story in reverse. The sinking feeling as the aircraft descends is a controlled, chosen descent. The whine and rumble is the pilot lowering flaps and gear to fly slower and steadier. A bank to one side is a planned turn onto the final approach. Even a firm touchdown is usually intentional — on a wet runway pilots plant the aircraft down firmly on purpose, to get the wheels gripping. Every one of those sensations has a hand on a control behind it.</p>
<p>So the trick that works: instead of bracing against each movement, ask yourself <em>&ldquo;what did the pilot just do to make that happen?&rdquo;</em> Climbing, easing power, banking into a turn, extending flaps, descending. You will nearly always be right — and the moment you can name the input, the fear has nothing left to feed on. You have stopped being a passenger something is happening <em>to</em>, and started being someone who understands the flight.</p>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">That noise</span>
<h2 class="title" style="margin-bottom:8px">The sounds are the aircraft working &mdash; here&rsquo;s each one</h2>
<div class="qa-list">
<details class="qa" open><summary>A loud whirr or clunk after take-off<i class="caret"></i></summary><div class="body">The landing gear retracting into the belly, then the doors closing over it. It is meant to be firm and loud. A few minutes later you may hear the reverse: the whine of the wing flaps sliding back in as the plane picks up speed.</div></details>
<details class="qa"><summary>A change in engine pitch, like it&rsquo;s &ldquo;giving up&rdquo;<i class="caret"></i></summary><div class="body">Completely normal. Just after take-off the pilots reduce power from full-thrust to a quieter climb setting — it is planned, and it happens on every single flight. The engines are still doing exactly what they should.</div></details>
<details class="qa"><summary>Barking or dog-like sounds before push-back (Airbus)<i class="caret"></i></summary><div class="body">A hydraulic pump on many Airbus jets, nicknamed the &ldquo;barking dog.&rdquo; Odd, but entirely mechanical and harmless — just a pump doing its job.</div></details>
<details class="qa"><summary>A bong or chime mid-flight<i class="caret"></i></summary><div class="body">Usually just the crew signalling each other, or the seatbelt sign changing. It is an intercom tone, nothing more — the aviation equivalent of a doorbell.</div></details>
<details class="qa"><summary>Rushing air / a whooshing hiss<i class="caret"></i></summary><div class="body">Air conditioning and pressurisation, constantly cycling fresh air through the cabin. Cabin air is fully refreshed every couple of minutes, cleaner than most offices.</div></details>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Built for it</span>
<h2 class="title" style="margin-bottom:8px">How much the aircraft can take</h2>
<div class="prose" style="margin-top:12px">
<p>Modern airliners are among the most redundant machines ever built. Two or more engines, and a fully loaded jet can climb and fly safely on just one — pilots train for it constantly. Multiple independent hydraulic systems, multiple electrical systems, backups for the backups. If something fails, there is almost always a second and third way to do the same job.</p>
<p>A jet does not fall if the engines quit, either — it glides. An airliner at cruise can glide well over 100 kilometres with no thrust at all, giving crews enormous time and distance to restart or divert. Lightning strikes aircraft routinely and the charge simply flows around the metal skin and off the other side; passengers rarely even notice.</p>
<p>And every one of those pilots has rehearsed the rare scenarios hundreds of times in simulators before they ever carry you. When something unusual happens, they are not surprised — they are running a checklist they know by heart.</p>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">In your control</span>
<h2 class="title" style="margin-bottom:8px">Gentle things that genuinely help</h2>
<div class="prose" style="margin-top:12px">
<p><b>Choose your seat.</b> A seat over the wing, toward the middle of the aircraft, feels the least motion — it is the balance point, the way the centre of a see-saw barely moves. A window seat lets some people feel more oriented; an aisle helps others feel less boxed in. Pick what suits <em>you</em>.</p>
<p><b>Breathe slowly and deliberately.</b> Fear speeds up your breathing, which fuels more fear. Breathe in for four counts, out for six. The long exhale is the part that calms your nervous system — do it for a minute and the physical panic genuinely eases.</p>
<p><b>Tell a crew member.</b> Cabin crew help nervous flyers all the time and will happily check in on you. Knowing someone calm knows how you feel is a real comfort — and they have seen every bump a thousand times.</p>
<p><b>Give your mind a job.</b> A gripping playlist, a film you&rsquo;ve saved, a game, a conversation. Anticipation feeds fear; occupying your attention starves it.</p>
<p><b>Learn what the flight will feel like.</b> Bumps on climb-out, the engine easing back, the flaps humming, a turn banking the whole cabin — all normal. When you know the script, the surprises stop being frightening.</p>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<div class="mf-rg" style="line-height:1.6">
<b>If your fear runs deeper than nerves.</b> For some people, flight anxiety is a genuine phobia, and no web page can talk that away — nor should it try. That is not a weakness; it is a common, treatable thing. Airline-run and pilot-led <b>fear-of-flying courses</b> have excellent track records, and a GP or a therapist trained in anxiety (CBT works especially well here) can help you get back in the air for good. Reaching out for that support is a strong, sensible move — and the reward is the whole world opening back up to you.</div>
<p class="sub" style="margin-top:22px;text-align:center">Curious rather than calm now? That is the goal. <a href="/explained" style="color:var(--gold)">Explore how these machines work</a> — or plan the trip itself with our guide to <a href="/travel-classes" style="color:var(--gold)">classes, bargains &amp; points &rarr;</a></p>
</div></section>`
});

/* ---------- travel classes, bargains & points (affiliate where relevant) ---------- */
renderPage({
  file: 'travel-classes.html', urlPath: '/travel-classes', current: '',
  title: 'Flight classes, bargains & points — fly better for less',
  description: 'How economy, premium economy, business and first really differ, the evergreen strategies for cheaper flights, and how transferable points can unlock business and first-class seats. Durable principles, not deals that expire.',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: 'Flight classes, bargains & points', description: 'How the cabins differ, how to find cheaper flights, and how points unlock premium seats.', url: 'https://aircraft.fyi/travel-classes' }, faqLd([
    { q: 'What is the difference between premium economy and business class?', a: 'Premium economy is a bigger, more reclined seat with better food and service, but still an upright seat. Business class on long-haul usually means a lie-flat bed, lounge access and direct aisle access. Premium economy is often the best value; business is the biggest comfort leap for overnight flights.' },
    { q: 'How do points and miles get you business or first class?', a: 'The cash price and points price of a seat are largely unrelated. A business seat costing thousands in cash may cost a points total you can realistically earn from everyday spending and sign-up bonuses. Points are worth most in premium cabins, so saving them for business or first gives the best value.' },
    { q: 'Are transferable points better than an airline credit card?', a: 'Usually yes. Transferable points from major card programmes move to many airline and hotel partners, so you are not locked to one airline or exposed to a single programme devaluing. A co-branded airline card ties you to that one airline.' },
    { q: 'When is the cheapest time to book flights?', a: 'For most international trips a booking window of roughly one to three months out tends to land near the lowest fares. Mid-week departures and the shoulder weeks either side of peak season are reliably cheaper. Painfully early rarely wins and last-minute long-haul is usually expensive.' }
  ])],
  content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › Classes, bargains &amp; points</div>
<h1>Fly better for less</h1>
<p class="lead">How the cabins actually differ, the strategies for cheaper flights that never go out of date, and how points and miles can turn an economy budget into a business-class seat. We stick to <em>durable principles</em> — the specifics of any card or programme change constantly, so treat named examples as a starting point and always check current terms yourself.</p>
<p class="sub" style="margin-top:10px">First time in the air, or a nervous flyer? Start with <a href="/fear-of-flying" style="color:var(--gold)">our guide to feeling calm on board &rarr;</a></p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The cabins</span>
<h2 class="title" style="margin-bottom:8px">What you&rsquo;re actually paying for</h2>
<div class="qa-list">
<details class="qa" open><summary>Economy<i class="caret"></i></summary><div class="body">The core product: you and your bag, from A to B. The price gap between airlines here is mostly about baggage rules, seat pitch and how much a change costs you — not safety or the flying itself. On most airlines the cheapest &ldquo;basic&rdquo; fares trade flexibility and seat choice for the low headline price.</div></details>
<details class="qa"><summary>Premium economy<i class="caret"></i></summary><div class="body">A bigger seat, more recline and legroom, better food and service — but still an upright seat, not a bed. Often the best <em>value</em> jump on a long flight: a large comfort gain for a fraction of the business-class price. The sweet spot for many long-haul travellers paying their own way.</div></details>
<details class="qa"><summary>Business<i class="caret"></i></summary><div class="body">On long-haul, this usually means a lie-flat bed, lounge access, priced meals and direct-aisle access. The single biggest leap in comfort for overnight flights — arriving rested instead of wrecked. Short-haul &ldquo;business&rdquo; is often just economy with a blocked middle seat and better catering, so check what you&rsquo;re actually buying.</div></details>
<details class="qa"><summary>First<i class="caret"></i></summary><div class="body">A shrinking, ultra-premium cabin — private suites, doors, exceptional dining — offered by only a handful of airlines now, as many replace it with very good business class. This is the cabin points-and-miles are uniquely good at unlocking, because paying cash is eye-watering but the points price can be merely ambitious.</div></details>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Cheaper flights</span>
<h2 class="title" style="margin-bottom:8px">Evergreen ways to pay less</h2>
<div class="prose" style="margin-top:12px">
<p><b>Be flexible on dates.</b> The same seat swings wildly in price by day and season. Mid-week departures and the quiet &ldquo;shoulder&rdquo; weeks either side of peak season are reliably cheaper. If a tool lets you see a whole month at once, the cheap days jump right out.</p>
<p><b>Book in the sweet spot.</b> Painfully early rarely wins, and last-minute long-haul is usually dear. For most international trips a booking window of a couple of months out tends to land near the low — not a magic date, just the fat middle of the curve where airlines haven&rsquo;t yet started squeezing.</p>
<p><b>Consider positioning.</b> Sometimes a cheap short hop to a bigger hub, then a separate long-haul from there, beats the single through-fare from your local airport. It takes more effort and a little risk if connections are tight, but the savings can be large.</p>
<p><b>Weigh the basic fares honestly.</b> A rock-bottom fare with no bag and no changes is a bargain <em>only</em> if that genuinely fits your trip. Add the bag you&rsquo;ll actually check and compare the real totals, not the headline numbers.</p>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The real magic</span>
<h2 class="title" style="margin-bottom:8px">Points &amp; miles, explained properly</h2>
<div class="prose" style="margin-top:12px">
<p>Here is the idea that changes everything: <b>the cash price and the points price of a seat have almost nothing to do with each other.</b> A business-class seat that costs thousands in money might cost a points total you can realistically earn from everyday spending and sign-up bonuses. Points are worth wildly more in a lie-flat seat than against a cheap economy fare — so the winning move is to <em>save</em> them for the premium cabins where cash prices are absurd.</p>
<p><b>Transferable points beat airline-specific ones.</b> The most flexible currencies are the &ldquo;transferable&rdquo; points from major card programmes — American Express Membership Rewards, and its equivalents — because you can move them to <em>many</em> different airline and hotel partners. That flexibility is the whole game: you&rsquo;re not locked to one airline&rsquo;s seats or one airline&rsquo;s devaluations. A co-branded airline card ties you to that one airline; a transferable-points card keeps your options open. <span style="color:var(--muted)">(Which programmes transfer where, and at what ratio, changes regularly — check current terms.)</span></p>
<p><b>Sign-up bonuses are the fast lane.</b> A single card&rsquo;s welcome bonus can be worth more points than a year of ordinary spending. That&rsquo;s often the difference between &ldquo;someday&rdquo; and &ldquo;this year&rdquo; for a premium redemption — just never chase one by spending money you wouldn&rsquo;t have spent, or carrying a balance whose interest dwarfs any reward.</p>
<p><b>Alliances widen the door.</b> Airlines sit in three big alliances, and points with one carrier can often book seats on its partners. That&rsquo;s how points earned at home can fly you on a completely different airline across the world.</p>
<p><b>The honest catch:</b> premium award seats are limited and go fast, so this rewards flexibility and a little planning. It is not free money — it is a skill. But it is a very learnable one, and the payoff is real: seats most people believe are out of reach, for a fraction of the cash.</p>
</div>
<div class="mf-rg" style="margin-top:22px;line-height:1.6"><b>Why we won&rsquo;t quote exact numbers.</b> Points transfer ratios, card bonuses and award prices change constantly — anything specific we printed today could be wrong within months, and this site&rsquo;s whole promise is accuracy. So we&rsquo;ve given you the durable principles that stay true. For today&rsquo;s exact figures, check the card or airline programme directly before you commit.</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">For the shelf</span>
<h2 class="title" style="margin-bottom:8px">Go deeper</h2>
<div class="gearlist">
<article class="gearitem">
<span class="gear-tag">Reading</span>
<h3>Points &amp; miles strategy books</h3>
<p>The field moves fast, but a good guide to the <em>fundamentals</em> — how earning, transferring and award-booking actually work — pays for itself on the first redemption. Look for a recent edition, since the specifics date quickly.</p>
<div class="gear-row">
<a class="gear-cta" href="${amz('points and miles travel hacking guide book')}" target="_blank" rel="nofollow noopener">Find on Amazon &rarr;</a>
</div>
</article>
<article class="gearitem">
<span class="gear-tag">On the flight</span>
<h3>What actually makes premium cabins comfortable</h3>
<p>If you&rsquo;re turning left for the first time — or just want economy to feel better — a decent noise-cancelling headset is the one upgrade that genuinely transforms a long flight, in any cabin.</p>
<div class="gear-row">
<a class="gear-cta" href="${amz('noise cancelling headphones travel')}" target="_blank" rel="nofollow noopener">Find on Amazon &rarr;</a>
</div>
</article>
</div>
<p class="gear-disc" style="max-width:64ch;margin:16px auto 0">${AFFDISC}</p>
</div></section>`
});

renderPage({
  file: 'manufacturers.html', urlPath: '/manufacturers', current: '',
  title: 'Aircraft manufacturers — who builds the giants',
  description: fitDesc(`Every manufacturer on aircraft.fyi, from Airbus and Boeing to Antonov, Tupolev and Lockheed — line-ups, production numbers and full sourced specifications.`),
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Aircraft manufacturers', url: 'https://aircraft.fyi/manufacturers' },
  content: `
<section class="hero"><div class="wrap">
<h1>The people who <span class="em">build</span> them.</h1>
<p class="lead">Sixteen manufacturers, one line-up each — every aircraft they built that appears on this site, with production numbers and true-scale silhouettes.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The builders</span>
<h2 class="title">Every manufacturer</h2>
<div class="pillars two">
${MK.map(m => {
  const list = byMaker(m);
  const longest = list.slice().sort((x, y) => y.core.length_m - x.core.length_m)[0];
  return `<article class="acard">
<h3><a href="/manufacturers/${m.slug}">${esc(m.name)}</a></h3>
<p class="kicker">${esc(m.country)} · Founded ${m.founded} · ${list.length} aircraft here</p>
<p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(m.tagline)}</p>
<p style="font-size:.86rem;color:var(--muted);margin:0 0 14px">Longest: <b style="color:var(--text)">${esc(longest.name)}</b> · ${longest.core.length_m.toFixed(2)} m</p>
<a class="mini" href="/manufacturers/${m.slug}">Open the line-up &rarr;</a>
</article>`;
}).join('\n')}
</div>
</div></section>`
});

for (const t of TY) {
  const list = byType(t);
  if (!list.length) continue;
  const longest = list.slice().sort((x, y) => y.core.length_m - x.core.length_m)[0];
  renderPage({
    file: `types/${t.slug}.html`, urlPath: `/types/${t.slug}`, current: '',
    title: `${t.name} — explained and compared`.slice(0, 60),
    description: fitDesc(`${t.tagline} ${list.length} ${t.name.toLowerCase()} on aircraft.fyi, led by the ${longest.name} — sourced specs, silhouettes and every operator.`),
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.name, url: `https://aircraft.fyi/types/${t.slug}` },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/types">Types</a> › ${esc(t.name)}</div>
<h1>${esc(t.name)}</h1>
<p class="lead">${esc(t.tagline)}</p>
${groupStats(list)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">What it means</span>
<h2 class="title">The category, explained</h2>
${t.prose.map(p => `<p>${esc(p)}</p>`).join('\n')}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The aircraft</span>
<h2 class="title">Every ${esc(t.name.toLowerCase().replace(/s$/, ''))} here</h2>
<p class="sub">Silhouettes are sized by real wingspan — bigger aircraft draw bigger.</p>
${list.length > 1 ? `<div class="allineup" style="margin-bottom:20px">${list.slice().sort((x, y) => (y.core.wingspan_m || 0) - (x.core.wingspan_m || 0)).map(x => `<a class="lu" href="/aircraft/${x.slug}" style="flex:${x.core.wingspan_m || 10} 1 0"><span class="lu-s">${silScaled(x)}</span><span class="lu-n">${esc(shortName(x))}</span></a>`).join('')}</div>` : ''}
<div class="filterbar colsbar" role="group" aria-label="Grid columns">
<span class="fsort-lbl">Grid</span>
<button class="fchip cols-d" type="button" data-cols="2" aria-pressed="true">2 columns</button>
<button class="fchip cols-d" type="button" data-cols="3" aria-pressed="false">3</button>
<button class="fchip cols-d" type="button" data-cols="4" aria-pressed="false">4</button>
<button class="fchip cols-m" type="button" data-cols="m1" aria-pressed="false">1 column</button>
<button class="fchip cols-m" type="button" data-cols="m2" aria-pressed="true">2</button>
</div>
<div class="grid2 cardgrid">${list.slice().sort((x, y) => (y.core.wingspan_m || 0) - (x.core.wingspan_m || 0)).map(aircraftCard).join('\n')}</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Side by side</span>
<h2 class="title">Ranked by length</h2>
${miniTable(list)}
</div></section>`
  });
}

renderPage({
  file: 'types.html', urlPath: '/types', current: '',
  title: 'Aircraft types — every category explained',
  description: fitDesc(`Widebody, narrowbody, freighter, military transport, bomber, supersonic, trijet and propliner — every aircraft category explained and compared at true scale.`),
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Aircraft types', url: 'https://aircraft.fyi/types' },
  content: `
<section class="hero"><div class="wrap">
<h1>Every kind of <span class="em">aircraft</span>, explained.</h1>
<p class="lead">Eight categories, from two-aisle widebodies to the outsize freighters that carry what nothing else can — each one defined, illustrated and ranked.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<div class="sillegend">
${Object.entries(CATCOLOR).map(([cat, col]) => `<span class="slg"><a class="slg-link" href="/types/${CATLINK[cat] || 'widebody'}"><i style="background:${col}"></i>${esc(cat)}</a><button class="slg-hex" type="button" data-hex="${col}" title="Copy ${col}">${col}</button></span>`).join('')}
</div>
<p class="sub" style="text-align:center;margin-top:10px">Every silhouette on the site is tinted by category. Tap a name to see the aircraft; tap a hex to copy it.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The categories</span>
<h2 class="title">Every type</h2>
<div class="pillars two">
${TY.map(t => {
  const list = byType(t);
  const longest = list.slice().sort((x, y) => y.core.length_m - x.core.length_m)[0];
  return `<article class="acard">
<h3><a href="/types/${t.slug}">${esc(t.name)}</a></h3>
<p class="kicker">${list.length} aircraft here</p>
<p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(t.tagline)}</p>
<p style="font-size:.86rem;color:var(--muted);margin:0 0 14px">Longest: <b style="color:var(--text)">${esc(longest.name)}</b> · ${longest.core.length_m.toFixed(2)} m</p>
<a class="mini" href="/types/${t.slug}">Open the category &rarr;</a>
</article>`;
}).join('\n')}
</div>
</div></section>`
});

for (const h of HUBS) {
  renderPage({
    file: `${h.slug}.html`, urlPath: `/${h.slug}`, current: '',
    title: `${h.name} — aircraft.fyi`, description: h.description, sitemap: false,
    jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: h.name, url: `https://aircraft.fyi/${h.slug}` },
    content: `
<section class="hero"><div class="wrap">
<h1>${esc(h.name)}</h1>
<p class="kicker" style="margin-top:2px">${esc(h.phase)}</p>
<p class="lead">${esc(h.description)}</p>
<div class="heroCtas"><a class="btn" href="/#fleet">Browse the fleet built so far</a></div>
</div></section>`
  });
}







/* ---------- search index: everything on the site, one small file ---------- */
const COLORWORD = {
  'Widebody': 'blue', 'Narrowbody': 'sky blue', 'Supersonic transport': 'burple violet purple',
  'Strategic bomber': 'slate navy', 'Military transport': 'steel grey', 'Cargo': 'teal',
  'Outsize freighter': 'deep teal', 'Trijet': 'plum purple', 'Turboprop airliner': 'sage green',
  'Piston airliner': 'taupe brown', 'Flying boat': 'lagoon blue', 'Experimental': 'mauve'
};
const SEARCH = [
  ...A.map(a => ({ t: a.name, u: `/aircraft/${a.slug}`, k: 'Aircraft', d: `${a.manufacturer} · ${a.status}`,
    q: [a.name, a.manufacturer, a.category, shortName(a), (a.headline || ''), (CATCOLOR[a.category] || ''), COLORWORD[a.category] || ''].join(' ').toLowerCase() })),
  ...MK.map(m => ({ t: m.name, u: `/manufacturers/${m.slug}`, k: 'Manufacturer', d: `${byMaker(m).length} aircraft`,
    q: [m.name, ...(m.matches || [])].join(' ').toLowerCase() })),
  ...AL.map(x => ({ t: x.name, u: `/airlines/${x.slug}`, k: 'Airline', d: x.cc || '',
    q: [x.name, x.cc || ''].join(' ').toLowerCase() })),
  ...TY.map(t => ({ t: t.name, u: `/types/${t.slug}`, k: 'Type', d: `${byType(t).length} aircraft`,
    q: [t.name, ...(t.cats || []), ...(t.cats || []).map(cn => CATCOLOR[cn] || '')].join(' ').toLowerCase() })),
  ...EX.map(e => ({ t: e.name.split(' — ')[0], u: `/explained/${e.slug}`, k: 'Explained', d: e.tagline,
    q: [e.name, e.tagline].join(' ').toLowerCase() })),
  ...POSTS.map(p => ({ t: p.title, u: `/blog/${p.slug}`, k: 'Blog', d: p.dek.slice(0, 70) + '…',
    q: [p.title, p.dek, ...(p.tags || [])].join(' ').toLowerCase() })),
  ...COMPARES.map(([x, y]) => ({ t: `${shortName(x)} vs ${shortName(y)}`, u: `/compare/${x.slug}-vs-${y.slug}`, k: 'Matchup', d: 'Written verdict + true-scale drawing',
    q: `${x.name} ${y.name} ${shortName(x)} ${shortName(y)} vs compare`.toLowerCase() })),
  ...RECORD_BOARDS.map(r => ({ t: r.h1, u: r.urlPath, k: 'Records', d: r.lead.slice(0, 70) + '…', q: r.h1.toLowerCase() })),
  { t: 'Compare aircraft', u: '/compare', k: 'Tool', d: 'Any three aircraft at true scale', q: 'compare tool scale engine side by side' },
  { t: 'Bring back Concorde', u: '/bring-back-concorde', k: 'Petition', d: 'Sign it', q: 'concorde petition bring back supersonic sign' },
  { t: 'Methodology', u: '/methodology', k: 'Reference', d: 'How every number is calculated', q: 'methodology sources how we calculate data' },
  { t: 'Scared of flying?', u: '/fear-of-flying', k: 'Guide', d: 'The engineering that makes flying safe', q: 'fear of flying scared afraid nervous anxiety turbulence safe phobia calm' },
  { t: 'Classes, bargains & points', u: '/travel-classes', k: 'Guide', d: 'Fly better for less', q: 'business first class economy premium points miles amex upgrade cheap flights bargains award' }
];
fs.writeFileSync(path.join(SITE, 'assets', 'js', 'search-index.js'),
  '/* GENERATED by build.js — do not edit by hand. */\nwindow.SEARCH_INDEX = ' + JSON.stringify(SEARCH) + ';\n');
console.log(`  · search index: ${SEARCH.length} entries`);

/* ---------- the client data file: GENERATED from data/aircraft.json, never hand-edited ---------- */
fs.mkdirSync(path.join(SITE, 'assets', 'js'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'assets', 'js', 'aircraft-data.js'),
  '/* GENERATED by build.js from data/aircraft.json — do not edit by hand, your changes will be overwritten. */\n' +
  'window.AIRCRAFT = ' + JSON.stringify(A.map(a => ({
    slug: a.slug, name: a.name, short: shortName(a), maker: a.manufacturer,
    type: typeOf(a), typeName: (TY.find(t => t.slug === typeOf(a)) || {}).name || '',
    status: a.status, identity: a.identity, core: a.core, vb: a.vb, sil: SIL[a.slug]
  }))) + ';\n' +
  'window.VERDICTS = ' + JSON.stringify(Object.fromEntries(VERDICTS)) + ';\n' +
  'window.COMPARE_PAGES = ' + JSON.stringify(COMPARES.map(([x, y]) => pk(x.slug, y.slug))) + ';\n');

/* ---------- COMPARE: one tool, any three aircraft ---------- */
renderPage({
  file: 'compare.html', urlPath: '/compare', current: 'compare', ogImage: 'compare-tool.png',
  title: 'Compare aircraft — side by side, at true scale',
  description: 'Pick any two or three aircraft and see them drawn at true relative scale, with every specification side by side. 43 aircraft, from the A320 to the An-225.',
  jsonld: { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'aircraft.fyi Compare', applicationCategory: 'ReferenceApplication', url: 'https://aircraft.fyi/compare', operatingSystem: 'Any' },
  head: '<script src="/assets/js/aircraft-data.js" defer></script>',
  content: `
<section class="hero"><div class="wrap">
<h1>Compare any <span class="em">three</span> aircraft.</h1>
<p class="lead">Drawn to true relative scale from sourced figures — against a 1.8 m person and a double-decker bus — with every specification side by side. Same metres, same pixels, no artistic licence.</p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<div class="cmpPicks" id="cmpPicks">
<label class="pick"><span>Aircraft one</span><select id="selA"></select></label>
<label class="pick"><span>Aircraft two</span><select id="selB"></select></label>
<label class="pick"><span>Aircraft three <i>(optional)</i></span><select id="selC"></select></label>
</div>
<div class="cmpBar">
<button class="btn ghost sm" type="button" id="cmpSwap">Swap one &amp; two</button>
<button class="btn ghost sm" type="button" id="cmpRandom">Surprise me</button>
<button class="btn ghost sm" type="button" id="cmpUnits">Switch to imperial</button>
<button class="btn ghost sm" type="button" id="cmpShare">Copy link to this comparison</button>
</div>

<div class="scaleStage" id="cmpStage"><svg viewBox="0 0 1200 430" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Selected aircraft drawn at true relative scale" id="cmpSvg"></svg></div>
<p class="sub" id="cmpNote" style="margin-top:12px"></p>
<div id="cmpVerdict" hidden style="margin-top:20px"></div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The numbers</span>
<h2 class="title">Every specification, side by side</h2>
<div class="tablewrap"><table class="spec" id="cmpTable"><thead id="cmpHead"></thead><tbody id="cmpBody"></tbody></table></div>
<p class="verified" style="margin-top:14px">Green marks the largest figure in each row. Every number comes from the sourced spec table on that aircraft's own page. Spot an error? <a href="mailto:${DATA.site.corrections}" style="color:var(--gold)">${esc(DATA.site.corrections)}</a></p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Popular matchups</span>
<h2 class="title">The ones everybody asks about</h2>
<p class="sub" style="margin-bottom:18px">Every other combination — all 903 of them — lives in the tool above. These six get a page of their own because they are the ones people actually search for.</p>
<div class="pillars two">
${COMPARES.slice(0, 6).map(([x, y]) => `<article class="acard"><h3><a href="/compare/${x.slug}-vs-${y.slug}">${esc(shortName(x))} vs ${esc(shortName(y))}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">A written verdict, both aircraft at true scale, and the full difference table.</p><a class="mini" href="/compare/${x.slug}-vs-${y.slug}">Read the matchup &rarr;</a></article>`).join('\n')}
</div>
</div></section>

<script>
(function(){
  function init(){
  var D = window.AIRCRAFT || [];
  if (!D.length) return;
  var $ = function(id){ return document.getElementById(id); };
  var selA = $('selA'), selB = $('selB'), selC = $('selC'), svg = $('cmpSvg');
  var imperial = false;
  try { imperial = localStorage.getItem('acfyi.units') === 'imperial'; } catch(e){}

  /* --- dropdowns, grouped by type --- */
  var groups = {};
  D.forEach(function(a){ (groups[a.typeName] = groups[a.typeName] || []).push(a); });
  function fill(sel, allowNone){
    var html = allowNone ? '<option value="">— none —</option>' : '';
    Object.keys(groups).forEach(function(g){
      html += '<optgroup label="' + g + '">';
      groups[g].slice().sort(function(p,q){ return p.name.localeCompare(q.name); })
        .forEach(function(a){ html += '<option value="' + a.slug + '">' + a.name + '</option>'; });
      html += '</optgroup>';
    });
    sel.innerHTML = html;
  }
  fill(selA, false); fill(selB, false); fill(selC, true);

  var get = function(s){ return D.find(function(a){ return a.slug === s; }); };
  function picked(){
    return [selA.value, selB.value, selC.value].map(get).filter(Boolean);
  }

  /* --- true scale: one px-per-metre for everything on the ground line --- */
  var W = 1200, H = 430, GROUND = 366, PAD = 34, GAP = 40, HUMAN = 1.8, BUS_W = 2.55, BUS_H = 4.4;
  function draw(){
    var items = picked();
    if (!items.length) return;
    var spans = items.reduce(function(t,a){ return t + a.core.wingspan_m; }, 0) + BUS_W + 1.4;
    var K = (W - PAD*2 - GAP*(items.length + 1)) / spans;
    var out = '<line x1="0" y1="' + GROUND + '" x2="' + W + '" y2="' + GROUND + '" stroke="#0E141C" stroke-width="1.5" opacity=".35"/>';
    var x = PAD;
    items.forEach(function(a){
      var w = a.core.wingspan_m * K * (260/232), h = w * (124/260);
      var cx = x + (a.core.wingspan_m * K) / 2;
      out += '<svg x="' + (cx - w/2).toFixed(1) + '" y="' + (GROUND - (118/124)*h).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" viewBox="0 0 260 124"><g fill="#0E141C">' + a.sil + '</g></svg>';
      out += '<text x="' + cx.toFixed(1) + '" y="' + (GROUND + 24) + '" text-anchor="middle" class="sl">' + a.short + '</text>';
      out += '<text x="' + cx.toFixed(1) + '" y="' + (GROUND + 42) + '" text-anchor="middle" class="sl2">' + a.core.wingspan_m.toFixed(1) + ' m span · ' + a.core.height_m.toFixed(1) + ' m tall</text>';
      x += a.core.wingspan_m * K + GAP;
    });
    var bw = BUS_W*K, bh = BUS_H*K;
    out += '<rect x="' + x.toFixed(1) + '" y="' + (GROUND-bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="' + Math.min(4, bw/5).toFixed(1) + '" fill="#1B6FCF"/>';
    out += '<text x="' + (x+bw/2).toFixed(1) + '" y="' + (GROUND+24) + '" text-anchor="middle" class="sl2">Bus</text>';
    x += bw + GAP*0.5;
    var hh = HUMAN*K, hw = Math.max(1.6, hh*0.26);
    out += '<rect x="' + x.toFixed(1) + '" y="' + (GROUND-hh).toFixed(1) + '" width="' + hw.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="' + (hw/2).toFixed(1) + '" fill="#1B6FCF"/>';
    out += '<text x="' + (x+hw/2).toFixed(1) + '" y="' + (GROUND+24) + '" text-anchor="middle" class="sl2">1.8 m</text>';
    svg.innerHTML = out;
    $('cmpNote').textContent = items.map(function(a){ return a.name; }).join(' · ') + ' — all drawn at the same scale, standing on the same ground line.';
  }

  /* --- the spec table --- */
  var ROWS = [
    { k:'length_m',       label:'Length',        u:'m',    imp: function(v){ return (v*3.28084).toFixed(1) + ' ft'; },  fmt: function(v){ return v.toFixed(2) + ' m'; } },
    { k:'wingspan_m',     label:'Wingspan',      u:'m',    imp: function(v){ return (v*3.28084).toFixed(1) + ' ft'; },  fmt: function(v){ return v.toFixed(2) + ' m'; } },
    { k:'height_m',       label:'Height',        u:'m',    imp: function(v){ return (v*3.28084).toFixed(1) + ' ft'; },  fmt: function(v){ return v.toFixed(2) + ' m'; } },
    { k:'mtow_kg',        label:'Max take-off weight', imp: function(v){ return Math.round(v*2.20462).toLocaleString('en-GB') + ' lb'; }, fmt: function(v){ return Math.round(v/1000).toLocaleString('en-GB') + ' t'; } },
    { k:'seats_typical',  label:'Typical seats', fmt: function(v){ return v.toLocaleString('en-GB'); } },
    { k:'range_km',       label:'Range',         imp: function(v){ return Math.round(v*0.539957).toLocaleString('en-GB') + ' nmi'; }, fmt: function(v){ return v.toLocaleString('en-GB') + ' km'; } },
    { k:'speed_kmh',      label:'Max speed',     imp: function(v){ return Math.round(v*0.621371).toLocaleString('en-GB') + ' mph'; }, fmt: function(v){ return v.toLocaleString('en-GB') + ' km/h'; } },
    { k:'firstFlightYear',label:'First flight',  fmt: function(v){ return String(v); }, noWin: true },
    { k:'produced',       label:'Built',         fmt: function(v){ return v.toLocaleString('en-GB'); } }
  ];
  function table(){
    var items = picked();
    $('cmpHead').innerHTML = '<tr><th></th>' + items.map(function(a){
      return '<th><a href="/aircraft/' + a.slug + '" style="color:var(--text)">' + a.short + '</a></th>'; }).join('') + '</tr>';
    var body = '';
    ROWS.forEach(function(r){
      var vals = items.map(function(a){ return a.core[r.k]; });
      var best = r.noWin ? null : Math.max.apply(null, vals.filter(function(v){ return typeof v === 'number'; }));
      body += '<tr><td>' + r.label + '</td>' + items.map(function(a){
        var v = a.core[r.k];
        if (v === undefined || v === null || v === '') return '<td class="num">—</td>';
        var txt = (imperial && r.imp) ? r.imp(v) : r.fmt(v);
        var win = (!r.noWin && v === best && items.length > 1 && vals.filter(function(x){ return x === best; }).length === 1);
        return '<td class="num' + (win ? ' win' : '') + '">' + txt + '</td>';
      }).join('') + '</tr>';
    });
    body += '<tr><td>Status</td>' + items.map(function(a){ return '<td>' + a.status + '</td>'; }).join('') + '</tr>';
    body += '<tr><td>Manufacturer</td>' + items.map(function(a){ return '<td>' + a.maker + '</td>'; }).join('') + '</tr>';
    $('cmpBody').innerHTML = body;
  }

  var V = window.VERDICTS || {}, PAGES = window.COMPARE_PAGES || [];
  function verdict(){
    var box = $('cmpVerdict');
    var items = picked();
    var key = items.length === 2 ? [items[0].slug, items[1].slug].sort().join('|') : '';
    var txt = key && V[key];
    if (!txt){ box.hidden = true; box.innerHTML = ''; return; }
    var link = PAGES.indexOf(key) > -1
      ? '<a class="mini" href="/compare/' + items[0].slug + '-vs-' + items[1].slug + '">Read the full matchup &rarr;</a>'
      : '';
    box.innerHTML = '<div class="qa"><div style="padding:20px 22px">' +
      '<span class="eyebrow">The verdict</span>' +
      '<p style="margin:8px 0 ' + (link ? '14px' : '0') + ';font-family:var(--display);font-size:1.05rem;line-height:1.55">' + txt + '</p>' + link +
      '</div></div>';
    box.hidden = false;
  }
  function render(){ draw(); table(); verdict(); hash(); }
  function hash(){
    var s = [selA.value, selB.value, selC.value].filter(Boolean).join(',');
    try { if (history.replaceState) history.replaceState(null, '', '#' + s); } catch(e){ /* file:// and sandboxed previews refuse this — harmless */ }
  }
  function fromHash(){
    var parts = decodeURIComponent(location.hash.replace('#','')).split(',').filter(function(p){ return get(p); });
    if (!parts.length) return false;
    selA.value = parts[0];
    /* arriving from an aircraft page with only itself named — give it a sensible opponent */
    if (parts.length === 1){
      var d = get(parts[0]);
      var rival = D.filter(function(a){ return a.slug !== d.slug; })
        .sort(function(p, q){
          return Math.abs(p.core.wingspan_m - d.core.wingspan_m) - Math.abs(q.core.wingspan_m - d.core.wingspan_m);
        })[0];
      selB.value = rival.slug; selC.value = '';
    } else {
      selB.value = parts[1];
      selC.value = (parts[2] && get(parts[2])) ? parts[2] : '';
    }
    return true;
  }

  [selA, selB, selC].forEach(function(s){ s.addEventListener('change', render); });
  $('cmpSwap').addEventListener('click', function(){
    var t = selA.value; selA.value = selB.value; selB.value = t; render();
  });
  $('cmpRandom').addEventListener('click', function(){
    var pool = D.slice();
    function pull(){ return pool.splice(Math.floor(Math.random()*pool.length), 1)[0].slug; }
    selA.value = pull(); selB.value = pull(); selC.value = Math.random() > 0.45 ? pull() : '';
    render();
  });
  if (imperial) $('cmpUnits').textContent = 'Switch to metric';
  $('cmpUnits').addEventListener('click', function(){
    imperial = !imperial;
    try { localStorage.setItem('acfyi.units', imperial ? 'imperial' : 'metric'); } catch(e){}
    this.textContent = imperial ? 'Switch to metric' : 'Switch to imperial';
    table();
  });

  var shareBtn = $('cmpShare');
  if (shareBtn) shareBtn.addEventListener('click', function(){
    var url = location.origin + location.pathname + location.hash;
    var done = function(){ shareBtn.textContent = 'Copied ✓'; setTimeout(function(){ shareBtn.textContent = 'Copy link to this comparison'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done, function(){ window.prompt('Copy this link:', url); }); }
    else { window.prompt('Copy this link:', url); }
  });
  if (!fromHash()){ selA.value = 'airbus-a380'; selB.value = 'boeing-747'; selC.value = 'boeing-737'; }
  render();
  }
  /* deferred scripts (aircraft-data.js) run before DOMContentLoaded — init then, or now if already past */
  if (window.AIRCRAFT) init();
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
</script>
<script>(function(){try{var q=new URLSearchParams(location.search);['a','b','c'].forEach(function(key,i){var el=document.getElementById('sel'+'ABC'[i]);var v=q.get(key);if(el&&v&&el.querySelector('option[value="'+v+'"]')){el.value=v;el.dispatchEvent(new Event('change'));}});}catch(e){}})();</script>`
});


/* ---------- RECORDS: the longest flights in the world (interactive) ---------- */
{
  const flying = RT.routes.filter(r => r.status === 'flying').length;
  const acFams = [...new Set(RT.routes.map(r => r.ac.split('-')[0].replace('Airbus ', '').replace('Boeing ', '')))];
  renderPage({
    file: 'records/longest-flights.html', urlPath: '/records/longest-flights', current: 'records',
    title: 'The longest flights in the world — ranked and filterable',
    description: fitDesc(`Every scheduled flight over 12,900 km, ranked by great-circle distance — filter by aircraft or airline, switch to the longest route per aircraft, and see the record-breakers still to come.`),
    ogImage: 'flights.png',
    jsonld: { '@context': 'https://schema.org', '@type': 'ItemList', name: RT.title, url: 'https://aircraft.fyi/records/longest-flights',
      itemListElement: RT.routes.filter(r => r.status === 'flying').slice(0, 10).map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: `${r.fr}–${r.to} (${r.airline})` })) },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/records">Records</a> › Longest flights</div>
<h1>The longest <span class="em">flights</span> in the world.</h1>
<p class="lead">Every scheduled route over 12,900 km, ranked by great-circle distance. The current record is Singapore to New York — and Qantas has already announced the flight that will beat it by 1,700 km, sometimes routing directly over the North Pole.</p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<div class="filterbar" role="group" aria-label="View mode" id="flMode">
<button class="fchip" type="button" data-mode="all" aria-pressed="true">All routes <span class="n">${RT.routes.length}</span></button>
<button class="fchip" type="button" data-mode="per" aria-pressed="false">Longest per aircraft</button>
</div>
<div class="filterbar" role="group" aria-label="Filter by aircraft" id="flAc">
<button class="fchip" type="button" data-ac="all" aria-pressed="true">All aircraft</button>
${[...new Set(RT.routes.map(r => r.acs))].map(s => { const a = A.find(z => z.slug === s); return `<button class="fchip" type="button" data-ac="${s}" aria-pressed="false">${esc(a ? shortName(a) : s)}</button>`; }).join('\n')}
</div>
<div class="flbar">
<label class="pick" style="margin:0;flex:1;min-width:200px"><span>Airline</span>
<select id="flAl"><option value="all">All airlines</option>${[...new Set(RT.routes.map(r => r.airline))].sort().map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>
<button class="btn ghost sm" type="button" id="flUnits" style="align-self:flex-end">Switch to imperial</button>
</div>

<div class="reclist" id="flList" style="margin-top:20px"></div>
<p class="sub" id="flCount" style="margin-top:14px"></p>
<p class="verified" style="margin-top:16px">Distances are great-circle figures. Compiled ${esc(RT.asOf)} from: ${RT.sources.map(s => `<a href="${s.url}" style="color:var(--gold)" rel="noopener" target="_blank">${esc(s.name)}</a>`).join(' · ')}. Spot an error? <a href="mailto:${DATA.site.corrections}" style="color:var(--gold)">${esc(DATA.site.corrections)}</a></p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">More boards</span>
<h2 class="title">Other records</h2>
<div class="pillars two">
${RECORD_BOARDS.filter(x => x.urlPath !== '/records/longest-flights').map(x => `<article class="acard"><h3><a href="${x.urlPath}">${esc(x.h1)}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(x.lead)}</p><a class="mini" href="${x.urlPath}">Open the board &rarr;</a></article>`).join('\n')}
</div>
</div></section>

<script>
(function(){
  var R = ${JSON.stringify(RT.routes)};
  var $ = function(id){ return document.getElementById(id); };
  var mode = 'all', ac = 'all', al = 'all';
  var imperial = false;
  try { imperial = localStorage.getItem('acfyi.units') === 'imperial'; } catch(e){}
  if (imperial) $('flUnits').textContent = 'Switch to metric';
  var esc = function(s){ var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  var dist = function(km){ return imperial ? Math.round(km * 0.621371).toLocaleString('en-GB') + ' mi' : km.toLocaleString('en-GB') + ' km'; };

  function rows(){
    var list = R.slice();
    if (mode === 'per'){
      var best = {};
      list.filter(function(r){ return r.status === 'flying'; }).forEach(function(r){
        if (!best[r.acs] || r.km > best[r.acs].km) best[r.acs] = r;
      });
      list = Object.keys(best).map(function(k){ return best[k]; });
    }
    if (ac !== 'all') list = list.filter(function(r){ return r.acs === ac; });
    if (al !== 'all') list = list.filter(function(r){ return r.airline === al; });
    return list.sort(function(p, q){ return q.km - p.km; });
  }
  function render(){
    var list = rows();
    $('flList').innerHTML = list.length ? list.map(function(r, i){
      var st = r.status === 'flying'
        ? '<span class="fl-st fly">Flying · ' + esc(r.time) + '</span>'
        : '<span class="fl-st soon">' + esc(r.when || 'Announced') + '</span>';
      var acLink = '<a href="/aircraft/' + r.acs + '">' + esc(r.ac) + '</a>';
      var alTxt = r.als ? '<a href="/airlines/' + r.als + '">' + esc(r.airline) + '</a>' : esc(r.airline);
      return '<div class="flrow' + (r.status !== 'flying' ? ' soon' : '') + '">' +
        '<span class="fl-rank num">' + (i + 1) + '</span>' +
        '<span class="fl-main"><span class="fl-route">' + esc(r.fr) + ' <i>' + esc(r.fri) + '</i> → ' + esc(r.to) + ' <i>' + esc(r.toi) + '</i></span>' +
        '<span class="fl-sub">' + alTxt + ' · ' + acLink + (r.note ? ' — <span class="fl-note">' + esc(r.note) + '</span>' : '') + '</span></span>' +
        '<span class="fl-tail"><b class="num">' + dist(r.km) + '</b>' + st + '</span></div>';
    }).join('') : '<p class="sub" style="padding:22px">Nothing matches those filters.</p>';
    var f = list.filter(function(r){ return r.status === 'flying'; }).length;
    $('flCount').textContent = 'Showing ' + list.length + ' route' + (list.length === 1 ? '' : 's') +
      (mode === 'per' ? ' — the single longest currently-flying route for each aircraft type.' :
       ' (' + f + ' flying, ' + (list.length - f) + ' announced).');
  }
  function chips(bar, attr, set){
    [].forEach.call(bar.querySelectorAll('.fchip'), function(c){
      c.addEventListener('click', function(){
        set(c.getAttribute(attr));
        [].forEach.call(bar.querySelectorAll('.fchip'), function(x){ x.setAttribute('aria-pressed', String(x === c)); });
        render();
      });
    });
  }
  chips($('flMode'), 'data-mode', function(v){ mode = v; });
  chips($('flAc'), 'data-ac', function(v){ ac = v; });
  $('flAl').addEventListener('change', function(){ al = this.value; render(); });
  $('flUnits').addEventListener('click', function(){
    imperial = !imperial;
    try { localStorage.setItem('acfyi.units', imperial ? 'imperial' : 'metric'); } catch(e){}
    this.textContent = imperial ? 'Switch to metric' : 'Switch to imperial';
    render();
  });
  render();
})();
</script>`
  });
}

/* ---------- BRING BACK CONCORDE — petition ---------- */
renderPage({
  file: 'bring-back-concorde.html', urlPath: '/bring-back-concorde', current: 'petition',
  title: 'Bring Back Concorde — sign the petition',
  description: 'Twenty-three years without supersonic flight. Sign the Bring Back Concorde petition — one signature per browser, each hashed into a verifiable receipt.',
  ogImage: 'petition.png',
  jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Bring Back Concorde', url: 'https://aircraft.fyi/bring-back-concorde' },
  content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › Bring Back Concorde</div>
<h1>Bring back <span class="em">Concorde</span>.</h1>
<p class="lead">On 24 October 2003 the fastest way to cross the Atlantic retired, and nothing has replaced it. Twenty-three years later, the journey takes twice as long as it did in 1996. This is a novelty petition with no legal force whatsoever — and we would still like to know how many of you feel the same way.</p>
<div class="hero-sil" style="margin-top:8px">${silUse(A.find(x => x.slug === 'concorde'), 460)}</div>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<div class="petStats">
<div class="ss"><span class="k">Signatures</span><span class="v num" id="petTally">—</span></div>
<div class="ss"><span class="k">Retired</span><span class="v num">24 Oct 2003</span></div>
<div class="ss"><span class="k">Years grounded</span><span class="v num" id="petYears">—</span></div>
<div class="ss"><span class="k">Top speed lost</span><span class="v num">2,179 km/h</span></div>
</div>

<div class="qa" id="petCard" style="margin-top:24px"><div style="padding:22px">
<h2 class="title" style="font-size:1.35rem;margin-bottom:6px">Sign it</h2>
<p class="sub" style="margin-bottom:18px">One signature per browser. Your name never leaves your device unless the public tally is connected — and either way you get a verifiable receipt.</p>

<label class="pick" style="margin-bottom:14px"><span>Your name</span>
<input id="petName" type="text" maxlength="40" placeholder="e.g. Brian Trubshaw" autocomplete="name">
</label>

<div class="slideWrap" id="petSlide" role="slider" tabindex="0" aria-label="Slide to verify you are human" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
  <span class="slideLabel">Slide to verify you're human</span>
  <span class="slideFill"></span>
  <span class="slideKnob" aria-hidden="true">⟩⟩</span>
  <button class="slideReset" type="button" id="petReset" aria-label="Reset the slider">↻</button>
</div>

<button class="btn" id="petSign" type="button" disabled style="margin-top:16px">Sign the petition &rarr;</button>
<p class="sub" id="petMsg" style="margin-top:14px"></p>

<div id="petReceipt" hidden style="margin-top:18px">
  <div class="mf-rg"><b>Your signature receipt.</b> Signed <span id="rTime"></span> by <b id="rName"></b>.<br>
  SHA-256: <code id="rHash" style="font-size:.78rem;word-break:break-all"></code></div>
</div>
</div></div>

<p class="sub" id="petMode" style="margin-top:16px"></p>
</div></section>

<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Why bother</span>
<h2 class="title">The case, in four numbers</h2>
<div class="pillars two">
<article class="acard"><h3>2 h 52 min</h3><p style="color:var(--muted);font-size:.92rem;margin:0">Concorde's record New York to London. A 777 needs about seven hours for the same crossing today.</p></article>
<article class="acard"><h3>Mach 2.04</h3><p style="color:var(--muted);font-size:.92rem;margin:0">Cruise speed — faster than a rifle bullet, at 60,000 ft, where you could see the curvature of the Earth.</p></article>
<article class="acard"><h3>23 years</h3><p style="color:var(--muted);font-size:.92rem;margin:0">Since the last commercial supersonic flight. Aviation is the only mode of transport that got slower.</p></article>
<article class="acard"><h3>0</h3><p style="color:var(--muted);font-size:.92rem;margin:0">Supersonic airliners currently carrying passengers, anywhere in the world.</p></article>
</div>
<div class="callout" style="margin-top:26px"><p style="margin:0 0 12px">Realistically, Concorde is not coming back — but something might. We looked hard at whether it actually will.</p><a class="btn ghost" href="/blog/is-supersonic-travel-coming-back">Read: is supersonic travel actually coming back? &rarr;</a></div>
</div></section>

<script>
(function(){
  /* ── connect a counter endpoint here to make the tally public (see petition-worker.js) ── */
  var ENDPOINT = '';
  var KEY = 'acfyi.petition.v1';
  var $ = function(id){ return document.getElementById(id); };
  var slide = $('petSlide'), name = $('petName'), signBtn = $('petSign'), msg = $('petMsg'), mode = $('petMode');
  var verified = false, dragging = false;

  $('petYears').textContent = String(new Date().getFullYear() - 2003);

  /* ---- slide to verify (pointer + keyboard) ---- */
  function setPct(p){
    p = Math.max(0, Math.min(100, p));
    slide.style.setProperty('--p', p + '%');
    slide.setAttribute('aria-valuenow', Math.round(p));
    if (p >= 98 && !verified){
      verified = true;
      slide.classList.add('done');
      slide.querySelector('.slideLabel').textContent = 'Verified ✓';
      gate();
    }
  }
  function pctFrom(e){
    var r = slide.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    return (x / r.width) * 100;
  }
  function down(e){ if (verified) return; dragging = true; setPct(pctFrom(e)); }
  function move(e){ if (!dragging || verified) return; e.preventDefault(); setPct(pctFrom(e)); }
  function up(){ if (!dragging) return; dragging = false; if (!verified) setPct(0); }
  slide.addEventListener('mousedown', down); slide.addEventListener('touchstart', down, {passive:true});
  window.addEventListener('mousemove', move); window.addEventListener('touchmove', move, {passive:false});
  window.addEventListener('mouseup', up); window.addEventListener('touchend', up);
  slide.addEventListener('keydown', function(e){
    if (verified) return;
    var cur = parseFloat(slide.getAttribute('aria-valuenow')) || 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp'){ e.preventDefault(); setPct(cur + 10); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ e.preventDefault(); setPct(cur - 10); }
    if (e.key === 'End' || e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setPct(100); }
  });
  $('petReset').addEventListener('click', function(e){
    e.stopPropagation();
    verified = false; slide.classList.remove('done');
    slide.querySelector('.slideLabel').textContent = "Slide to verify you're human";
    setPct(0); gate();
  });

  function gate(){ signBtn.disabled = !(verified && name.value.trim().length >= 2 && !signed()); }
  name.addEventListener('input', gate);

  /* ---- one signature per browser ---- */
  function signed(){ try { return !!localStorage.getItem(KEY); } catch(e){ return false; } }
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)); } catch(e){ return null; } }

  async function sha256(s){
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [].slice.call(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  }

  function showReceipt(rec){
    $('rName').textContent = rec.name;
    $('rTime').textContent = new Date(rec.t).toLocaleString('en-GB');
    $('rHash').textContent = rec.hash;
    $('petReceipt').hidden = false;
    signBtn.disabled = true;
    signBtn.textContent = 'You have signed ✓';
    name.disabled = true;
    msg.textContent = 'Thank you. This browser has already signed — one signature each, that is the whole point.';
  }

  signBtn.addEventListener('click', async function(){
    if (signed()) return;
    var n = name.value.trim();
    if (n.length < 2 || !verified) return;
    signBtn.disabled = true;
    var t = new Date().toISOString();
    /* receipt is hash-chained off the previous public count, exactly like luck.fyi's Luck Points */
    var prev = $('petTally').textContent.replace(/\D/g, '') || '0';
    var hash = await sha256(prev + '|' + n + '|' + t + '|bring-back-concorde');
    var rec = { name: n, t: t, hash: hash };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch(e){}
    if (ENDPOINT){
      try {
        var r = await fetch(ENDPOINT + '/sign', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ name: n, hash: hash, t: t }) });
        var j = await r.json();
        if (j && typeof j.count === 'number') $('petTally').textContent = j.count.toLocaleString('en-GB');
      } catch(e){ msg.textContent = 'Signed locally — the public tally could not be reached just now.'; }
    }
    showReceipt(rec);
  });

  /* ---- tally ---- */
  (async function(){
    if (ENDPOINT){
      try {
        var r = await fetch(ENDPOINT + '/count');
        var j = await r.json();
        $('petTally').textContent = (j.count || 0).toLocaleString('en-GB');
        mode.textContent = 'Public tally is live. One signature per browser.';
      } catch(e){
        $('petTally').textContent = '—';
        mode.textContent = 'The public tally is temporarily unreachable. You can still sign — your receipt is stored on this device.';
      }
    } else {
      $('petTally').textContent = signed() ? '1' : '0';
      mode.innerHTML = '<b>Honest note:</b> this is a static site, so there is no public counter connected yet — the number above is what <i>this browser</i> has signed, not a global total. We are not going to invent a number. Wire up the counter endpoint (petition-worker.js ships in the repo) and it becomes a real, public tally.';
    }
    var rec = load();
    if (rec) showReceipt(rec);
    gate();
  })();
})();
</script>`
});

/* ---------- BLOG ---------- */
function block(x) {
  if (x.h2) return `<h2 class="title" style="margin-top:38px">${esc(x.h2)}</h2>`;
  if (x.p) return `<p>${esc(x.p)}</p>`;
  if (x.callout) return `<div class="callout" style="margin:22px 0"><p style="margin:0"><b>${esc(x.callout)}</b></p></div>`;
  if (x.ul) return `<ul class="pl">${x.ul.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (x.table) return `<div class="specwrap"><table class="spec">
<thead><tr>${x.table.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${x.table.rows.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`;
  return '';
}
for (const post of POSTS) {
  renderPage({
    file: `blog/${post.slug}.html`, urlPath: `/blog/${post.slug}`, current: 'blog',
    ogImage: post.og || 'blog.png',
    ogType: 'article',
    head: `<meta property="article:published_time" content="${post.date}T09:00:00Z"><meta property="article:modified_time" content="${post.date}T09:00:00Z">`,
    title: post.title.length > 60 ? post.title.slice(0, 57) + '…' : post.title,
    description: fitDesc(post.dek),
    jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.dek,
      datePublished: post.date, dateModified: post.date,
      author: { '@type': 'Organization', name: DATA.site.author, email: DATA.site.contact },
      publisher: { '@type': 'Organization', name: 'aircraft.fyi', url: 'https://aircraft.fyi' },
      mainEntityOfPage: `https://aircraft.fyi/blog/${post.slug}` },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/blog">Blog</a> › ${esc(post.tags[0])}</div>
<h1>${esc(post.title)}</h1>
<p class="lead">${esc(post.dek)}</p>
<p class="kicker" style="margin-top:14px">${esc(post.author)} · <time datetime="${post.date}">${new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time> · ${esc(post.read)}</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<article class="prose">${post.body.map(block).join('\n')}</article>
${post.slug === 'is-supersonic-travel-coming-back' ? `<div class="callout" style="margin-top:34px"><p style="margin:0 0 12px"><b>Miss it yet?</b> We built a petition page for exactly this feeling.</p><a class="btn" href="/bring-back-concorde">Sign: Bring Back Concorde &rarr;</a></div>` : ''}
${POSTS.filter(p => p.slug !== post.slug).slice(0, 1).map(p => `<div class="callout" style="margin-top:34px"><p style="margin:0 0 6px"><b>Read next</b></p><p style="margin:0 0 12px;color:var(--muted)">${esc(p.dek)}</p><a class="btn ghost" href="/blog/${p.slug}">${esc(p.title)} &rarr;</a></div>`).join('')}
<h2 class="title" style="margin-top:40px">Sources</h2>
<ul style="list-style:none;margin:14px 0 0;padding:0">
${post.sources.map(s => `<li style="margin-bottom:8px"><a href="${esc(s.url)}" rel="noopener" target="_blank" style="color:var(--muted);font-size:.9rem">${esc(s.name)} &nearr;</a></li>`).join('\n')}
</ul>
<p class="verified" style="margin-top:20px">Written ${esc(post.date)}. Facts checked against the sources above. Spot an error? <a href="mailto:${DATA.site.corrections}" style="color:var(--gold)">${esc(DATA.site.corrections)}</a></p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Related</span>
<h2 class="title">Go deeper</h2>
<div class="pillars two">
<article class="acard"><div class="sil">${silScaled(A.find(x => x.slug === 'concorde'))}</div><h3><a href="/aircraft/concorde">Concorde</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">The only supersonic airliner that ever really worked — full specification, operators and history.</p><a class="mini" href="/aircraft/concorde">Open the page &rarr;</a></article>
<article class="acard"><div class="sil">${silScaled(A.find(x => x.slug === 'tupolev-tu-144'))}</div><h3><a href="/types/supersonic">Supersonic transports</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Two aircraft, one era, and a speed record nobody has taken back.</p><a class="mini" href="/types/supersonic">Open the category &rarr;</a></article>
</div>
</div></section>`
  });
}
renderPage({
  file: 'blog.html', urlPath: '/blog', current: 'blog', ogImage: 'blog.png',
  title: 'The aircraft.fyi blog',
  description: 'Long-form aviation writing from aircraft.fyi — supersonic comebacks, engineering explainers and the stories behind the specifications. Sourced and dated.',
  jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'aircraft.fyi blog', url: 'https://aircraft.fyi/blog' },
  content: `
<section class="hero"><div class="wrap">
<h1>The <span class="em">blog</span>.</h1>
<p class="lead">Long-form writing on the aircraft we cover — sourced, dated, and honest about what nobody actually knows yet.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Latest</span>
<h2 class="title">Posts</h2>
<div class="pillars two">
${POSTS.map(p => `<article class="acard">
<p class="kicker">${esc(p.tags.join(' · '))}</p>
<h3><a href="/blog/${p.slug}">${esc(p.title)}</a></h3>
<p style="color:var(--muted);font-size:.92rem;margin:8px 0 14px">${esc(p.dek)}</p>
<p style="font-size:.84rem;color:var(--muted);margin:0 0 14px"><time datetime="${p.date}">${new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time> · ${esc(p.read)}</p>
<a class="mini" href="/blog/${p.slug}">Read it &rarr;</a>
</article>`).join('\n')}
</div>
</div></section>`
});

/* ---------- COMPARE PAGES: static, true-scale, crawlable ---------- */

/* the same maths the Scale Engine runs, executed at build time into flat SVG */
function compareSVG(a, b2) {
  const W = 1200, H = 430, GROUND = 366, PAD = 34, GAP = 40;
  const HUMAN = 1.8, BUS_W = 2.55, BUS_H = 4.4;
  const spans = a.core.wingspan_m + b2.core.wingspan_m + BUS_W + 1.4;
  const K = (W - PAD * 2 - GAP * 3) / spans;                 // px per real-world metre
  let x = PAD, out = '';
  out += `<line x1="0" y1="${GROUND}" x2="${W}" y2="${GROUND}" stroke="#0E141C" stroke-width="1.5" opacity=".35"/>`;
  for (const d of [a, b2]) {
    const w = d.core.wingspan_m * K * (260 / 232);
    const h = w * (124 / 260);
    const cx = x + (d.core.wingspan_m * K) / 2;
    out += `<svg x="${(cx - w / 2).toFixed(1)}" y="${(GROUND - (118 / 124) * h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 260 124"><g fill="#0E141C">${SIL[d.slug]}</g></svg>`;
    out += `<text x="${cx.toFixed(1)}" y="${GROUND + 24}" text-anchor="middle" class="sl">${esc(shortName(d))}</text>`;
    out += `<text x="${cx.toFixed(1)}" y="${GROUND + 42}" text-anchor="middle" class="sl2">${d.core.wingspan_m.toFixed(1)} m span · ${d.core.height_m.toFixed(1)} m tall</text>`;
    x += d.core.wingspan_m * K + GAP;
  }
  const bw = BUS_W * K, bh = BUS_H * K;
  out += `<rect x="${x.toFixed(1)}" y="${(GROUND - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${Math.min(4, bw / 5).toFixed(1)}" fill="#1B6FCF"/>`;
  out += `<text x="${(x + bw / 2).toFixed(1)}" y="${GROUND + 24}" text-anchor="middle" class="sl2">Bus</text>`;
  x += bw + GAP * 0.5;
  const hh = HUMAN * K, hw = Math.max(1.6, hh * 0.26);
  out += `<rect x="${x.toFixed(1)}" y="${(GROUND - hh).toFixed(1)}" width="${hw.toFixed(1)}" height="${hh.toFixed(1)}" rx="${(hw / 2).toFixed(1)}" fill="#1B6FCF"/>`;
  out += `<text x="${(x + hw / 2).toFixed(1)}" y="${GROUND + 24}" text-anchor="middle" class="sl2">1.8 m</text>`;
  return `<div class="scaleStage"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${esc(a.name)} and ${esc(b2.name)} drawn at true relative scale">${out}</svg></div>`;
}

function verdicts(a, b2) {
  const rows = [
    ['Length', 'length_m', ' m', 'longer'],
    ['Wingspan', 'wingspan_m', ' m', 'wider'],
    ['Height', 'height_m', ' m', 'taller'],
    ['MTOW', 'mtow_kg', ' kg', 'heavier'],
    ['Typical seats', 'seats_typical', '', 'more seats'],
    ['Range', 'range_km', ' km', 'further'],
    ['Max speed', 'speed_kmh', ' km/h', 'faster']
  ];
  const fmt = (v, u) => u === ' kg' ? Math.round(v / 1000).toLocaleString('en-US') + ' t'
    : (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(2)) + u;
  const trs = rows.map(([label, key, unit]) => {
    const va = a.core[key], vb = b2.core[key];
    if (!va || !vb) return '';
    const diff = Math.abs(va - vb);
    const pct = Math.round((diff / Math.min(va, vb)) * 100);
    const winner = va > vb ? shortName(a) : shortName(b2);
    return `<tr><td>${label}</td><td class="num">${fmt(va, unit)}</td><td class="num">${fmt(vb, unit)}</td><td class="num">${fmt(diff, unit)}</td><td style="font-size:.88em">${esc(winner)}${pct ? ` <span style="color:var(--muted)">+${pct}%</span>` : ''}</td></tr>`;
  }).filter(Boolean).join('\n');
  return `<div class="specwrap"><table class="spec">
<thead><tr><th></th><th>${esc(shortName(a))}</th><th>${esc(shortName(b2))}</th><th>Difference</th><th>Bigger</th></tr></thead>
<tbody>${trs}</tbody></table></div>`;
}

function compareProse(a, b2) {
  const L = a.core.length_m > b2.core.length_m ? [a, b2] : [b2, a];
  const S = a.core.wingspan_m > b2.core.wingspan_m ? [a, b2] : [b2, a];
  const dl = Math.abs(a.core.length_m - b2.core.length_m).toFixed(2);
  const ds = Math.abs(a.core.wingspan_m - b2.core.wingspan_m).toFixed(2);
  const p1 = `The ${esc(L[0].name)} is the longer of the two, at ${L[0].core.length_m.toFixed(2)} m against ${L[1].core.length_m.toFixed(2)} m — a difference of ${dl} m. ` +
    (S[0].slug === L[0].slug
      ? `It also has the greater wingspan, ${ds} m wider, so it is the bigger aircraft on both measures.`
      : `Wingspan tells the opposite story: the ${esc(S[0].name)} spreads ${ds} m wider, so which one is "bigger" depends entirely on which dimension you care about.`);
  const p2 = `${esc(a.identity)} ${esc(b2.identity)} The silhouettes above are drawn at true relative scale from the sourced figures on each aircraft's page — same metres, same pixels, no artistic licence.`;
  const sa = a.core.seats_typical, sb = b2.core.seats_typical;
  const p3 = (sa && sb)
    ? `On capacity, the ${esc(sa > sb ? a.name : b2.name)} carries more people in a typical layout — ${Math.max(sa, sb)} against ${Math.min(sa, sb)}.`
    : `The two are built for different jobs, which is why a straight capacity comparison does not apply.`;
  return [p1, p2, p3];
}


for (const [a, b2, verdict] of COMPARES) {
  const slug = `${a.slug}-vs-${b2.slug}`;
  let title = `${shortName(a)} vs ${shortName(b2)} — size comparison`;
  if (title.length > 60) title = `${shortName(a)} vs ${shortName(b2)}`;
  if (title.length > 60) title = title.slice(0, 57) + '…';
  const related = COMPARES.filter(p => (p[0].slug === a.slug || p[1].slug === a.slug || p[0].slug === b2.slug || p[1].slug === b2.slug))
    .filter(p => `${p[0].slug}-vs-${p[1].slug}` !== slug).slice(0, 4);
  renderPage({
    file: `compare/${slug}.html`, urlPath: `/compare/${slug}`, current: '',
    ogImage: `compare-${a.slug}-vs-${b2.slug}.png`,
    title,
    description: fitDesc(`${shortName(a)} vs ${shortName(b2)}: length, wingspan, height, weight and seats side by side, with both aircraft drawn at true relative scale against a person and a bus.`),
    jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: `https://aircraft.fyi/compare/${slug}`,
      about: [{ '@type': 'Product', name: a.name }, { '@type': 'Product', name: b2.name }] },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/compare">Compare</a> › ${esc(shortName(a))} vs ${esc(shortName(b2))}</div>
<h1>${esc(shortName(a))} vs ${esc(shortName(b2))}</h1>
<p class="lead">Both aircraft at true relative scale — against a 1.8 m person and a double-decker bus.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
${compareSVG(a, b2)}
<p class="sub" style="margin-top:14px">Wingspan and overall height are drawn to true scale from the sourced figures on each aircraft page. <a href="/compare">Compare any other aircraft in the live tool &rarr;</a></p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The numbers</span>
<h2 class="title">Side by side</h2>
${verdicts(a, b2)}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The verdict</span>
<h2 class="title">Which is actually bigger?</h2>
<div class="prose"><p class="verdict">${esc(verdict)}</p>
${compareProse(a, b2).map(p => `<p>${p}</p>`).join('\n')}</div>
<div class="pillars two" style="margin-top:26px">
<article class="acard"><div class="sil">${silScaled(a)}</div><h3><a href="/aircraft/${a.slug}">${esc(a.name)}</a></h3><p class="kicker">${esc(a.manufacturer)} · ${esc(a.status)}</p><a class="mini" href="/aircraft/${a.slug}">Full specification &rarr;</a></article>
<article class="acard"><div class="sil">${silScaled(b2)}</div><h3><a href="/aircraft/${b2.slug}">${esc(b2.name)}</a></h3><p class="kicker">${esc(b2.manufacturer)} · ${esc(b2.status)}</p><a class="mini" href="/aircraft/${b2.slug}">Full specification &rarr;</a></article>
</div>
</div></section>
${related.length ? `<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">More matchups</span>
<h2 class="title">Related comparisons</h2>
<ul style="list-style:none;margin:20px 0 0;padding:0">
${related.map(p => `<li style="margin-bottom:10px"><a class="mini" href="/compare/${p[0].slug}-vs-${p[1].slug}">${esc(shortName(p[0]))} vs ${esc(shortName(p[1]))} &rarr;</a></li>`).join('\n')}
</ul>
</div></section>` : ''}`
  });
}
console.log(`  · ${COMPARES.length} compare pages`);

/* ---------- EXPLAINED: the concepts behind the spec tables ---------- */
for (const e of EX) {
  renderPage({
    file: `explained/${e.slug}.html`, urlPath: `/explained/${e.slug}`, current: '',
    title: e.name.length > 60 ? e.name.slice(0, 57) + '…' : e.name,
    description: fitDesc(`${e.tagline} Explained plainly by aircraft.fyi, with the aircraft that prove it — sourced specifications and true-scale silhouettes.`),
    jsonld: { '@context': 'https://schema.org', '@type': 'TechArticle', headline: e.name, description: e.tagline, url: `https://aircraft.fyi/explained/${e.slug}` },
    content: `
<section class="hero"><div class="wrap">
<div class="crumb"><a href="/">Home</a> › <a href="/explained">Explained</a> › ${esc(e.name.split(' — ')[0])}</div>
<h1>${esc(e.name)}</h1>
<p class="lead">${esc(e.tagline)}</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Explained</span>
<h2 class="title">What it actually means</h2>
<div class="prose">${e.prose.map(p => `<p>${esc(p)}</p>`).join('\n')}</div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">See it in the data</span>
<h2 class="title">Where this shows up</h2>
<ul style="list-style:none;margin:20px 0 0;padding:0">
${e.links.map(l => `<li style="margin-bottom:10px"><a class="mini" href="${l[1]}">${esc(l[0])} &rarr;</a></li>`).join('\n')}
</ul>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Keep reading</span>
<h2 class="title">Other concepts</h2>
<div class="pillars two">
${EX.filter(x => x.slug !== e.slug).slice(0, 4).map(x => `<article class="acard"><h3><a href="/explained/${x.slug}">${esc(x.name.split(' — ')[0])}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(x.tagline)}</p><a class="mini" href="/explained/${x.slug}">Read it &rarr;</a></article>`).join('\n')}
</div>
</div></section>`
  });
}
renderPage({
  file: 'explained.html', urlPath: '/explained', current: '',
  title: 'Explained — the concepts behind the spec tables',
  description: 'MTOW, ETOPS, range versus payload, wingtip devices, high-bypass turbofans and the widebody divide — the ideas behind the numbers, explained plainly.',
  jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Explained', url: 'https://aircraft.fyi/explained' },
  content: `
<section class="hero"><div class="wrap">
<h1>The ideas behind the <span class="em">numbers</span>.</h1>
<p class="lead">Every spec table on this site assumes you know what MTOW means, why twins are allowed over oceans, and why range figures hide a catch. Here is all of it, plainly.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">The concepts</span>
<h2 class="title">Start anywhere</h2>
<div class="pillars two">
${EX.map(e => `<article class="acard"><h3><a href="/explained/${e.slug}">${esc(e.name.split(' — ')[0])}</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">${esc(e.tagline)}</p><a class="mini" href="/explained/${e.slug}">Read it &rarr;</a></article>`).join('\n')}
</div>
</div></section>`
});


/* ---------- 404 ---------- */
renderPage({
  file: '404.html', urlPath: '/404', current: '', sitemap: false,
  title: 'Page not found — aircraft.fyi',
  description: 'That page does not exist. Search 43 aircraft, sixteen manufacturers, eleven airlines and four record boards — or head back to the fleet.',
  head: '<meta name="robots" content="noindex,follow">',
  jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Page not found', url: 'https://aircraft.fyi/404' },
  content: `
<section class="hero"><div class="wrap">
<h1>Lost the <span class="em">approach</span>.</h1>
<p class="lead">That page does not exist — mistyped, moved, or never built. Here is everything that does.</p>
<div class="heroCtas"><a class="btn" href="/">Back to the fleet &rarr;</a><a class="btn ghost" href="/compare">Compare aircraft</a></div>
<p class="sub" style="margin-top:16px">Or press <b>/</b> anywhere on the site to search.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
<span class="eyebrow">Everything on the site</span>
<h2 class="title">Try one of these</h2>
<div class="pillars two">
<article class="acard"><h3><a href="/">All ${A.length} aircraft</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Every silhouette drawn to true scale, with sourced specifications and full operator fleets.</p><a class="mini" href="/">Open the fleet &rarr;</a></article>
<article class="acard"><h3><a href="/compare">Compare aircraft</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Put any three aircraft side by side at true relative scale, against a person and a bus.</p><a class="mini" href="/compare">Open the tool &rarr;</a></article>
<article class="acard"><h3><a href="/records">Record boards</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">The longest, heaviest, fastest and most-produced aircraft ever built.</p><a class="mini" href="/records">See the records &rarr;</a></article>
<article class="acard"><h3><a href="/blog">The blog</a></h3><p style="color:var(--muted);font-size:.92rem;margin:0 0 14px">Long-form writing on the aircraft we cover — sourced, dated, and honest.</p><a class="mini" href="/blog">Read it &rarr;</a></article>
</div>
</div></section>`
});

/* ---------- RSS feed ---------- */
const feedItems = POSTS.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>https://aircraft.fyi/blog/${p.slug}</link>
    <guid isPermaLink="true">https://aircraft.fyi/blog/${p.slug}</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <description>${esc(p.dek)}</description>
  </item>`).join('\n');
fs.writeFileSync(path.join(SITE, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>aircraft.fyi</title>
  <link>https://aircraft.fyi</link>
  <description>Every aircraft, at true scale. Long-form aviation writing, sourced and dated.</description>
  <language>en-GB</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="https://aircraft.fyi/feed.xml" rel="self" type="application/rss+xml"/>
${feedItems}
</channel>
</rss>
`);

/* ---------- security.txt + humans.txt ---------- */
fs.mkdirSync(path.join(SITE, '.well-known'), { recursive: true });
fs.writeFileSync(path.join(SITE, '.well-known', 'security.txt'),
`Contact: mailto:${DATA.site.contact}
Expires: ${new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10)}T00:00:00.000Z
Preferred-Languages: en
Canonical: https://aircraft.fyi/.well-known/security.txt
`);
fs.writeFileSync(path.join(SITE, 'humans.txt'),
`/* TEAM */
  Built by: aircraft.fyi
  Contact: ${DATA.site.contact}
  Site: https://aircraft.fyi

/* SITE */
  Standards: HTML5, CSS3, vanilla JavaScript
  Components: none. No frameworks, no trackers, no cookies.
  Silhouettes: original works, generated parametrically and drawn to true scale.
`);

/* ---------- deploy files (assets are served in place — nothing to copy) ---------- */

const today = new Date().toISOString().slice(0, 10);
const seg = {
  'sitemap-aircraft.xml': pages.filter(p => p.sitemap && p.path.startsWith('/aircraft/')),
  'sitemap-airlines.xml': pages.filter(p => p.sitemap && p.path.startsWith('/airlines/')),
  'sitemap-compare.xml': pages.filter(p => p.sitemap && p.path.startsWith('/compare/')),
  'sitemap-reference.xml': pages.filter(p => p.sitemap && (p.path.startsWith('/manufacturers') || p.path.startsWith('/types') || p.path.startsWith('/explained'))),
  'sitemap-pages.xml': pages.filter(p => p.sitemap && !p.path.startsWith('/aircraft/') && !p.path.startsWith('/airlines/') && !p.path.startsWith('/manufacturers') && !p.path.startsWith('/types') && !p.path.startsWith('/explained') && !p.path.startsWith('/compare/'))
};
for (const [file, list] of Object.entries(seg)) {
  fs.writeFileSync(path.join(SITE, file),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    list.map(p => `  <url><loc>https://aircraft.fyi${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);
}
fs.writeFileSync(path.join(SITE, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  Object.keys(seg).map(f => `  <sitemap><loc>https://aircraft.fyi/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n') +
  `\n</sitemapindex>\n`);
fs.writeFileSync(path.join(SITE, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /compare?\n\nSitemap: https://aircraft.fyi/sitemap.xml\n');
fs.writeFileSync(path.join(SITE, 'CNAME'), 'aircraft.fyi\n');
fs.writeFileSync(path.join(SITE, '.nojekyll'), '');


/* ================= I18N: localized page trees /zh/ /ru/ /es/ /fr/ /de/ /pt/ /ar/ /hi/ /ja/ =================
   v1 scope: full chrome/headings/meta in 9 languages; long-form prose stays English with a
   per-language notice. Replacements are exact markup-anchored strings, applied OUTSIDE <script>
   regions only (apostrophes in translations would break inline JS strings). */

const HREFLANG_OF = l => I18N.langs[l].hreflang;

function hreflangBlock(urlPath) {
  const canon = p => 'https://aircraft.fyi' + (p === '/' ? '/' : p);
  let out = `<link rel="alternate" hreflang="en" href="${canon(urlPath)}">\n`;
  for (const l of I18N_LANGS) out += `<link rel="alternate" hreflang="${HREFLANG_OF(l)}" href="${canon('/' + l + (urlPath === '/' ? '/' : urlPath))}">\n`;
  out += `<link rel="alternate" hreflang="x-default" href="${canon(urlPath)}">`;
  return out;
}

function localize(html, lang, urlPath) {
  const L = I18N.langs[lang];
  // 1. split out <script> regions so replacements can never corrupt JS
  const parts = html.split(/(<script[\s\S]*?<\/script>)/);
  const rules = Object.entries(I18N.ui)
    .map(([k, v]) => [v.en, v[lang]])
    .filter(([a, b]) => a && b && a !== b)
    .sort((a, b) => b[0].length - a[0].length);          // longest first
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('<script')) continue;
    for (const [from, to] of rules) parts[i] = parts[i].split(from).join(to);
  }
  html = parts.join('');
  // 2. document language + direction
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${L.hreflang}"${L.dir === 'rtl' ? ' dir="rtl"' : ''}>`);
  // 3. aircraft pages: localized title + description templates
  const am = urlPath.match(/^\/aircraft\/([\w-]+)$/);
  if (am) {
    const a = A.find(x => x.slug === am[1]);
    if (a) {
      const t = I18N.meta.aircraft_title[lang].replace('{name}', a.name);
      const d = I18N.meta.aircraft_desc[lang].replace('{name}', a.name);
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(t)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(d)}$2`)
        .replace(/(property="og:title" content=")[^"]*(")/, `$1${esc(t)}$2`)
        .replace(/(property="og:description" content=")[^"]*(")/, `$1${esc(d)}$2`)
        .replace(/(name="twitter:title" content=")[^"]*(")/, `$1${esc(t)}$2`)
        .replace(/(name="twitter:description" content=")[^"]*(")/, `$1${esc(d)}$2`);
    }
  }
  if (urlPath === '/') {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(I18N.meta.site_title[lang])}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(I18N.meta.site_desc[lang])}$2`);
  }
  // 4. every absolute site URL (canonical, og:url, JSON-LD) points at the localized tree — assets excluded
  html = html.replace(/https:\/\/aircraft\.fyi\/(?!assets\/)/g, `https://aircraft.fyi/${lang}/`);
  // 5. internal navigation stays inside the language tree (feed is English-only)
  html = html.replace(/href="\/(?!\/)/g, m => m)
             .replace(/(href=")\/(?!feed\.xml)([^"]*")/g, `$1/${lang}/$2`);
  // 6. hreflang cluster (URL-swap above already ran, so inject with correct EN URLs now)
  html = html.replace('</head>', hreflangBlock(urlPath) + '\n</head>');
  // 7. the honest notice above long-form prose
  html = html.replace(/(<div class="prose[^"]*"[^>]*>)/g, `$1<p class="sub i18n-note">${esc(I18N.notice[lang])}</p>`);
  // 8. one more asset-depth hop: /zh/aircraft/x.html is one level deeper than aircraft/x.html
  html = html.replace(/(href|src)="((?:\.\.\/)*)assets\//g, (m, attr, dots) => `${attr}="../${dots}assets/`);
  return html;
}

{
  const targets = BUILT_PAGES.filter(p => p.indexable);   // 404 + scale stubs stay English-only
  for (const lang of I18N_LANGS) {
    const urls = [];
    for (const pg of targets) {
      const src = fs.readFileSync(path.join(SITE, pg.file), 'utf8');
      const out = path.join(SITE, lang, pg.file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, localize(src, lang, pg.urlPath));
      urls.push(`https://aircraft.fyi/${lang}${pg.urlPath === '/' ? '/' : pg.urlPath}`);
    }
    fs.writeFileSync(path.join(SITE, `sitemap-${lang}.xml`),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(u => `  <url><loc>${u}</loc><lastmod>${STAMP}</lastmod></url>`).join('\n') + '\n</urlset>\n');
  }
  // English pages join the hreflang cluster too (only when alternates actually exist)
  if (I18N_LANGS.length) {
  for (const pg of targets) {
    const f = path.join(SITE, pg.file);
    let h = fs.readFileSync(f, 'utf8');
    if (!h.includes('hreflang=')) fs.writeFileSync(f, h.replace('</head>', hreflangBlock(pg.urlPath) + '\n</head>'));
  }
  // localized segments join the sitemap index
  const idx = path.join(SITE, 'sitemap.xml');
  let sx = fs.readFileSync(idx, 'utf8');
  const extra = I18N_LANGS.map(l => `  <sitemap><loc>https://aircraft.fyi/sitemap-${l}.xml</loc></sitemap>`).join('\n');
  fs.writeFileSync(idx, sx.replace('</sitemapindex>', extra + '\n</sitemapindex>'));
  }
  console.log(`  · i18n: ${I18N_LANGS.length} languages × ${targets.length} pages = ${I18N_LANGS.length * targets.length} localized pages`);
}

console.log(`✔ built ${pages.length} pages (${pages.filter(p => p.sitemap).length} in sitemap)`);
pages.forEach(p => console.log(`  ${p.sitemap ? '●' : '○'} ${p.path}`));
