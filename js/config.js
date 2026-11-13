// Dernier Métro · Constantes, données des lignes, profils de voyageurs
const cv = document.getElementById('c');
const g = cv.getContext('2d');
const W = 384, H = 216, VIEW_H = 170;
const VERSION = 'v1.19 · frein d\'urgence';
let RES = 2;

// Remplit la fenêtre en gardant le 16:9, avec un facteur entier en pixels
// physiques : chaque pixel logique = k×k pixels écran (net, sans flou),
// et le texte est rendu à la vraie résolution de l'écran (Retina compris).
function fit() {
  const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H) * dpr));
  if (k !== RES || cv.width !== W * k) {
    RES = k;
    cv.width = W * k;
    cv.height = H * k;
  }
  g.imageSmoothingEnabled = false;
  cv.style.width = (W * k / dpr) + 'px';
  cv.style.height = (H * k / dpr) + 'px';
}
addEventListener('resize', fit);
if (window.matchMedia) {
  // suit les changements de densité (déplacement vers un autre écran, zoom)
  const watchDpr = () => matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
    .addEventListener('change', () => { fit(); watchDpr(); }, { once: true });
  watchDpr();
}
fit();
cv.focus();

function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else { const el = d.documentElement; const r = el.requestFullscreen || el.webkitRequestFullscreen; if (r) r.call(el); }
}
cv.addEventListener('dblclick', toggleFullscreen);

// ---------- Données ----------
// Chaque ligne : stations dans l'ordre réel [nom, distance depuis la précédente (m), affluence].
// Difficulté : foule (aff), arrivées sur les quais (acc), pickpockets, portes retenues,
// fréquence des incidents, temps à quai (dwell) et marge de l'horaire (tight : 1,25 = 25 % de plus que le trajet le plus rapide :
// une conduite franche et propre regagne quelques secondes par interstation, une conduite timide en perd).
const LINES = [
  { id: 'l1', num: '1', col: '#ffcd00', fg: '#111', diff: 'FACILE', dcol: '#7dff8a', desc: 'Interstations régulières',
    aff: 0.8, acc: 0.8, suspect: 0.2, holder: 0.12, inc: 0.45, dwell: 18, tight: 1.25, pax: 230,
    st: [['Château de Vincennes', 0, 1.0], ['Bérault', 100, 0.5], ['Saint-Mandé', 100, 0.7], ['Porte de Vincennes', 100, 0.8], ['Nation', 100, 1.8], ['Reuilly – Diderot', 100, 1.0], ['Gare de Lyon', 100, 2.3], ['Bastille', 100, 1.5], ['Saint-Paul', 100, 0.6], ['Hôtel de Ville', 100, 1.4], ['Châtelet', 100, 2.4]] },
  { id: 'l6', num: '6', col: '#6eca97', fg: '#111', diff: 'MOYEN', dcol: '#ffd75e', desc: 'Distances variables',
    aff: 1.0, acc: 1.0, suspect: 0.3, holder: 0.22, inc: 0.6, dwell: 16, tight: 1.21, pax: 260,
    st: [['Nation', 0, 1.6], ['Picpus', 110, 0.6], ['Bel-Air', 95, 0.5], ['Daumesnil', 120, 1.1], ['Dugommier', 90, 0.6], ['Bercy', 140, 1.3], ['Quai de la Gare', 110, 0.8], ['Chevaleret', 100, 0.6], ['Nationale', 90, 0.7], ["Place d'Italie", 130, 1.8]] },
  { id: 'l4', num: '4', col: '#be418d', fg: '#ffffff', diff: 'DIFFICILE', dcol: '#ffb35e', desc: 'Grandes gares, pickpockets',
    aff: 1.25, acc: 1.3, suspect: 0.45, holder: 0.3, inc: 0.7, dwell: 14, tight: 1.17, pax: 300,
    st: [['Simplon', 0, 0.8], ['Marcadet – Poissonniers', 110, 1.3], ['Château Rouge', 95, 1.1], ['Barbès – Rochechouart', 90, 1.7], ['Gare du Nord', 120, 2.4], ["Gare de l'Est", 100, 2.0], ["Château d'Eau", 95, 0.8], ['Strasbourg – Saint-Denis', 90, 1.5], ['Réaumur – Sébastopol', 95, 1.2], ['Étienne Marcel', 95, 0.8], ['Les Halles', 110, 2.3]] },
  { id: 'l13', num: '13', col: '#98d4e2', fg: '#111', diff: 'EXTRÊME', dcol: '#ff4a3a', desc: 'La plus saturée de Paris',
    aff: 1.5, acc: 1.6, suspect: 0.4, holder: 0.45, inc: 0.8, dwell: 12, tight: 1.13, pax: 330,
    st: [['Saint-Lazare', 0, 2.4], ['Miromesnil', 110, 0.9], ['Champs-Élysées – Clemenceau', 120, 1.3], ['Invalides', 150, 1.5], ['Varenne', 90, 0.7], ['Saint-François-Xavier', 95, 0.8], ['Duroc', 100, 1.2], ['Montparnasse – Bienvenüe', 130, 2.4], ['Gaîté', 95, 0.8], ['Pernety', 100, 0.9], ['Plaisance', 95, 1.0]] },
];
let LINE = 0;
try { LINE = Math.max(0, Math.min(LINES.length - 1, +localStorage.getItem('dm_line') || 0)); } catch (e) {}
const LN = () => LINES[LINE];
const lineRGB = () => [1, 3, 5].map(i => parseInt(LN().col.slice(i, i + 2), 16));
const DIST_K = 3;   // interstations d'environ 300 m : il faut monter à pleine vitesse pour tenir l'horaire
const SEATS = ['#e8a32a', '#3a8f5a', '#c8392b', '#2e6fb8', '#d8c040', '#e07a2a'];
const STATIONS = [];
function loadLine() {
  STATIONS.length = 0;
  // interstations allongées (× 3) : on a le temps de réagir aux événements en cours de trajet
  LN().st.forEach(([name, dist, aff], i) => STATIONS.push({ name, dist: Math.round(dist * DIST_K / 10) * 10, aff, seat: SEATS[(i * 5 + LINE) % SEATS.length] }));
}
// station la plus chargée (hors terminus d'arrivée) : objet de la mission « quai vidé »
const busiestStation = () => STATIONS.slice(0, -1).reduce((a, b) => b.aff > a.aff ? b : a).name;
loadLine();
const PL = 80, PE = 12;            // quai : 80 m avant la marque, 12 m après
const PERIODS = [
  { id: 'pointe', name: '7h30', label: 'HEURE DE POINTE', desc: 'Quais bondés, rame pleine', t0: 7 * 3600 + 30 * 60, affMul: 1.7, accMul: 2.0, suspect: 0.35, holder: 0.25, pax: 260, col: '#ff8a5b' },
];
const PER = 0;   // un seul mode de jeu : l'heure de pointe (la difficulté vient de la ligne choisie)
let T0 = PERIODS[PER].t0;
const VMAX = 80 / 3.6;          // vitesse maximale de la rame
const REF_VMAX = 70 / 3.6;      // vitesse de la rame « de référence » sur laquelle l'horaire est calculé
// mode de jeu : 'classic' (service à l'heure) ou 'fire' (vague de feu : fuir jusqu'au terminus avec un maximum de voyageurs)
let GM = 'classic';
try { GM = localStorage.getItem('dm_mode') === 'fire' ? 'fire' : 'classic'; } catch (e) {}
const FIRE = () => GM === 'fire';
const modeId = id => (FIRE() ? 'fire_' : '') + id;   // records et classements séparés par mode
let CAP = 200, CAR_CAP = CAP / 5;
// remplissage des voitures (service normal) : une zone verte à viser dans chacune ; une voiture ne dépasse jamais 100 %
// (en fuite, pas de dosage : on embarque un maximum de monde)
const GREEN_BAND = () => [0.6, 0.85];
const carRatio = c => S.cars[c] / CAR_CAP;
const CAR_VIS = () => FIRE() ? 320 : CAR_CAP;   // échelle d'affichage du remplissage (fuite : pas de capacité, une voiture « bien pleine » ≈ 320)
const carFill = c => S.cars[c] / CAR_VIS();
// fuite : le poids. Chaque voyageur alourdit la rame, et une rame mal répartie accélère encore moins bien
const W_REF = 1100;
// déséquilibre : écart de la voiture la plus chargée à la moyenne (0 = parfait, 1 = très mal réparti) ; un petit écart est toléré
const carMean = () => S.cars.reduce((a, b) => a + b, 0) / 5;
const heavyCar = () => S.cars.indexOf(Math.max(...S.cars));
const imbalance = () => { const m = carMean(); if (m < 12) return 0; const r = (Math.max(...S.cars) - m) / m; return Math.max(0, Math.min(1, (r - 0.15) / 0.85)); };
const IMB_TRAC = 0.55;   // jusqu'à −55 % de traction pour une rame très mal répartie
const tractionF = () => FIRE() ? (1 - 0.45 * Math.min(1.2, S.load / W_REF)) * (1 - IMB_TRAC * imbalance()) : 1;
const carShut = c => !!(S.carShut && S.carShut[c]);
const carState = c => { const f = carRatio(c), [a, b] = GREEN_BAND(); return f >= a && f <= b + 0.0001 ? 'ok' : 'low'; };   // capacité de la rame / par voiture (assez pour que patienter à quai fasse monter plus de monde)
const carOf = dz => Math.min(4, Math.floor(dz / 15));
const DOORS = []; for (let car = 0; car < 5; car++) DOORS.push(car * 15 + 4, car * 15 + 11);
const COLORS = ['#c0392b','#2e86c1','#27ae60','#d4ac0d','#8e44ad','#e67e22','#5d6d7e','#ecf0f1','#1abc9c','#a04000','#34495e'];
const SKIN = ['#f1c27d','#e0ac69','#c68642','#8d5524','#ffdbac'];
const C = {
  tWall:[78,70,80], tCeil:[52,48,60], ballast:[60,52,48], sleeper:[42,34,30], rail:[170,170,182],
  stTile:[226,216,186], stCeil:[236,230,210], plat:[128,122,126], edge:[236,226,170], face:[62,58,66], endWall:[200,190,165]
};
const pick = a => a[Math.floor(Math.random() * a.length)];
const HAIR = ['#1b1b1b', '#3b2a1a', '#6b4a2a', '#c9a66b', '#8a8a8a', '#a0522d'];
const PANTS = ['#23232b', '#2b3550', '#3d3d3d', '#5a4632', '#1f2a44'];
const BAGS = [null, null, '#5a3a22', '#222', '#8b1e2e', '#2e4a7a'];
// ---------- Profils de voyageurs (tenues, accessoires, types) selon le service ----------
const wpick = o => { let r = Math.random() * Object.values(o).reduce((a, b) => a + b, 0); for (const k in o) { r -= o[k]; if (r < 0) return k; } return Object.keys(o)[0]; };
const OUTFIT_COL = {
  suit: ['#2b2f3a', '#1c2233', '#3a3d45', '#22262e', '#4a4f5a', '#3b3226'],
  coat: ['#b08a5a', '#6b4f3a', '#2a2a30', '#3a4a6a', '#8a2f2f', '#5b6b4a', '#9a9aa0', '#c8b48a'],
  puffer: ['#1d1d22', '#c0392b', '#2e86c1', '#e67e22', '#27ae60', '#f1c40f', '#ecf0f1', '#6a3a8a'],
  hoodie: ['#5d6d7e', '#7a2a8a', '#2a6a4a', '#8a8a8a', '#a03a2a', '#2e4a7a', '#c8a040'],
};
const PARTY_COL = ['#ff3fa4', '#00e0ff', '#c6ff00', '#ff7a00', '#b84dff', '#ffe600', '#ffffff'];
const SHOES = ['#141414', '#2a1c12', '#5a3a22', '#e8e8e8', '#3a3a44', '#7a1e1e'];
const GREY_HAIR = ['#bdbdbd', '#d9d9d9', '#8a8a8a', '#eeeeee'];
const MIX = [
  { kind: { adult: 87, senior: 5, kid: 3, tourist: 3, wheel: 0.7, stroller: 1 },
    outfit: { suit: 28, coat: 28, puffer: 12, tshirt: 10, skirt: 10, dress: 5, hoodie: 7 },
    acc: { none: 14, handbag: 25, backpack: 25, headphones: 18, phone: 13, umbrella: 5 }, party: 0 },
  { kind: { adult: 54, senior: 18, kid: 11, tourist: 12, wheel: 2, stroller: 4 },
    outfit: { suit: 6, coat: 22, puffer: 10, tshirt: 26, skirt: 12, dress: 12, hoodie: 12 },
    acc: { none: 25, handbag: 25, backpack: 20, headphones: 10, phone: 12, umbrella: 8 }, party: 0 },
  { kind: { adult: 94, senior: 2, tourist: 4, wheel: 0.5 },
    outfit: { suit: 6, coat: 14, puffer: 16, tshirt: 18, skirt: 14, dress: 12, hoodie: 22 },
    acc: { none: 15, handbag: 15, backpack: 12, headphones: 18, phone: 40 }, party: 0.5 },
];
function mkPerson(p, x) {
  const M = MIX[PER] || MIX[0];
  let kind = wpick(M.kind), outfit = wpick(M.outfit), acc = wpick(M.acc);
  const fem = Math.random() < 0.5;
  if (!fem && (outfit === 'skirt' || outfit === 'dress')) outfit = pick(['coat', 'tshirt', 'puffer']);
  const pp = {
    p, x, kind: 'adult', outfit, c: OUTFIT_COL[outfit] ? pick(OUTFIT_COL[outfit]) : pick(COLORS), k: pick(SKIN),
    h: (fem ? 1.55 : 1.66) + Math.random() * 0.24, hair: pick(HAIR),
    hairStyle: fem ? pick(['long', 'long', 'bun', 'short', 'pony', 'afro']) : pick(['short', 'short', 'short', 'bald', 'afro']),
    beard: !fem && Math.random() < 0.28, glasses: Math.random() < 0.18,
    scarf: Math.random() < [0.35, 0.15, 0.1][PER] ? pick(['#c0392b', '#2e4a7a', '#d4ac0d', '#8a8a8a', '#5d2e6e', '#1d6b4a']) : null,
    hat: Math.random() < 0.12 ? pick(['cap', 'beanie']) : null,
    pants: pick(PANTS), shoe: pick(SHOES), bag: pick(BAGS.filter(Boolean)), tights: pick(['#2a2226', '#c8a080', '#1a1a1a']),
    acc: acc === 'none' ? null : acc, acc2: null, kid: null, party: Math.random() < M.party,
    seed: Math.random(), build: outfit === 'puffer' ? 1.15 : 0.92 + Math.random() * 0.16, slow: 1,
  };
  if (outfit === 'hoodie' && Math.random() < 0.25) pp.hat = 'hoodDown';
  if (pp.party) { pp.c = pick(PARTY_COL); if (Math.random() < 0.5) pp.acc = 'phone'; }
  if (kind === 'senior') {
    pp.h -= 0.08; pp.hair = pick(GREY_HAIR); pp.slow = 0.75;
    if (outfit === 'puffer' || outfit === 'hoodie') { pp.outfit = 'coat'; pp.c = pick(OUTFIT_COL.coat); }
    if (Math.random() < 0.45) pp.acc = 'cane';
    if (Math.random() < 0.3) pp.hat = fem ? 'beanie' : 'cap';
  } else if (kind === 'tourist') {
    pp.acc = 'map'; pp.acc2 = Math.random() < 0.5 ? 'backpack' : 'suitcase'; pp.hat = Math.random() < 0.6 ? 'cap' : pp.hat;
    if (pp.outfit === 'suit') { pp.outfit = 'tshirt'; pp.c = pick(COLORS); }
  } else if (kind === 'kid') {
    pp.kid = { kind: 'child', h: 0.95 + Math.random() * 0.3, outfit: pick(['tshirt', 'puffer', 'hoodie']), c: pick(COLORS), k: pp.k,
      hair: pp.hair, hairStyle: pick(['short', 'long']), hat: Math.random() < 0.3 ? 'beanie' : null, pants: pick(PANTS),
      shoe: pick(SHOES), seed: Math.random(), build: 1.05, acc: Math.random() < 0.4 ? 'backpack' : null, bag: pick(COLORS), slow: 1 };
    if (pp.acc === 'phone' || pp.acc === 'umbrella') pp.acc = null;
    pp.slow = 0.85;
  } else if (kind === 'stroller') { pp.acc = 'stroller'; pp.slow = 0.85; }
  else if (kind === 'wheel') { pp.kind = 'wheel'; pp.slow = 0.7; if (pp.acc !== 'headphones') pp.acc = null; }
  return pp;
}
// zombie : peau verdâtre, vêtements sales et déchirés, démarche lente, yeux rouges
const ZOMBIE_LOOK = () => ({ kind: 'adult', kid: null, k: pick(['#8fa07a', '#7d9470', '#9aa88a', '#a3a98a']), c: pick(['#3a3a2e', '#4a3e36', '#2e3a34', '#5a4a3a']),
  pants: pick(['#2a2a24', '#3a342c']), hair: pick(['#3a3a30', '#2a2620', '#5a5a50']), hat: null, glasses: false, scarf: null, acc: null, acc2: null,
  party: false, suspect: false, slow: 0.6, zombie: true, outfit: pick(['tshirt', 'coat', 'hoodie']) });
const mkZombie = (p, x) => Object.assign(mkPerson(p, x), ZOMBIE_LOOK());
// apparence à conserver quand un voyageur reste à quai
const LOOK_KEYS = ['zombie', 'kind', 'outfit', 'c', 'k', 'h', 'hair', 'hairStyle', 'hat', 'beard', 'glasses', 'scarf', 'pants', 'shoe', 'bag', 'tights', 'acc', 'acc2', 'kid', 'party', 'seed', 'build', 'slow'];
const lookOf = m => Object.fromEntries(LOOK_KEYS.map(k => [k, m[k]]));
let HELP_SKULL = false;
try { HELP_SKULL = localStorage.getItem('dm_skull') === '1'; } catch (e) {}

// trajet le plus rapide réaliste : pleine traction (1,1 m/s²), vitesse max, freinage franc (1,5 m/s²)
// position le long du quai (0 = tête de rame, 75 = queue) tirée selon le poids de chaque voiture
function platformZ(wts) {
  const tot = wts.reduce((a, b) => a + b, 0); let r = Math.random() * tot, c = 0;
  while (c < 4 && r >= wts[c]) { r -= wts[c]; c++; }
  return Math.min(74, c * 15 + 0.5 + Math.random() * 14);
}
function legTime(d, a, b, vmax) {      // trajet le plus rapide : pleine traction, vitesse max, freinage franc
  const vp = Math.min(vmax, Math.sqrt(2 * d * a * b / (a + b)));
  return vp / a + vp / b + Math.max(0, d - vp * vp / (2 * a) - vp * vp / (2 * b)) / vp;
}
const schedLeg = d => legTime(d, 1.45, 2.2, VMAX);             // base de l'horaire (inchangée quand la traction a été renforcée)
const playerFastestLeg = d => legTime(d, 2.0, 2.2, VMAX);      // ce que la rame peut réellement faire, à fond
function buildLine() {
  loadLine();
  const L = LN();
  let p = 0;
  STATIONS.forEach((s, i) => {
    s.grill = FIRE() && i >= 2 && Math.random() < 0.45;   // fuite : long tunnel avec un grill d'aiguillages
    if (i > 0) { p += s.grill ? Math.max(s.dist + 200, 575 + (STATIONS[i - 1].zombie ? 90 : 0)) : s.dist; s.arr = STATIONS[i - 1].dep + Math.round(schedLeg(s.dist) * L.tight + 1.5); }
    else s.arr = T0;
    s.pos = p; s.dep = s.arr + (i === 0 ? 25 : L.dwell);
    s.baseArr = s.arr; s.baseDep = s.dep;
    s.served = false;
    s.res = { pen: 0, inc: [], dt: null, err: null, pts: 0, skipped: false, board: 0, left: 0, offer: 0 };
    s.people = [];
    s.crowd = false; s.acc = 0;
    const n = Math.round(s.aff * PERIODS[PER].affMul * L.aff * (17 + Math.random() * 8) * (FIRE() ? 3 : 1.7));   // fuite : toute la ville se réfugie dans le métro ; service normal : quais bien garnis
    // dans 3 stations sur 4, la foule s'agglutine près d'un accès : une voiture bondée, une presque vide
    s.hot = Math.random() < 0.75 ? Math.floor(Math.random() * 5) : -1;
    const wts = [0, 1, 2, 3, 4].map(c => s.hot < 0 ? 1 : c === s.hot ? 6 : Math.abs(c - s.hot) === 1 ? 1.4 : Math.abs(c - s.hot) >= 3 ? 0.1 : 0.45);
    s.wts = wts;
    s.zombie = false;
    if (FIRE() && i > 1 && i < STATIONS.length - 1 && !STATIONS[i - 1].zombie && Math.random() < 0.18 + 0.1 * LINE) s.zombie = true;
    for (let k = 0; k < n; k++) s.people.push((s.zombie ? mkZombie : mkPerson)(p - platformZ(wts), 2.4 + Math.random() * 3.2));
  });
}
