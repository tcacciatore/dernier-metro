// Dernier Métro · Défis de tunnel : aiguillages, grills, virages, barricade, aiguille en panne
// ---------- Aiguillages : bifurcation, voie déviée, convergence, manœuvre manuelle ----------
const SW_LEN = 34, SW_SIG = 8, SW_DEV = 30, SW_FIX = 3, SW_LOCK = 20;   // longueur de la branche visible, signal 8 m avant l'aiguille
const CH_GAP = 26, CH_FIX = 0.6, CH_LOCK = 10, CH_LEAD = 14, CH_STEP = 34 + 2 + CH_GAP + 6;   // grill d'aiguillages : la suivante 26 m après la tête de tunnel (≈ 68 m d'une aiguille à l'autre), manœuvre éclair, verrou tardif
const swOff = (w, z) => {                                 // décalage latéral (vers la droite) de la branche au point z
  const u = w.kind === 'merge' ? (w.pos - z) / SW_LEN : (z - w.pos) / SW_LEN;
  return u < 0 || u > 1 ? null : w.kind === 'fork' ? BR * u * u * (3 - 2 * u) : 3.6 * Math.pow(u, 1.15);
};
// bifurcation : la branche s'écarte en S jusqu'à BR m, dans une salle qui s'élargit,
// fermée par une tête de tunnel percée de deux tubes (voie directe et voie déviée)
const BR = 5.2;
const zBof = w => Math.ceil((w.pos + SW_LEN) / STEP) * STEP;                     // tête des deux tubes (sur la grille des tranches)
const brOff = (w, z) => z <= w.pos ? 0 : z >= w.pos + SW_LEN ? BR : swOff(w, z);
const chLead = w => w.lead || 34;   // la salle commence à s'élargir chLead m avant l'aiguille (plus court dans un grill)
function chamberE(w, z) { const L = chLead(w), u = Math.max(0, Math.min(1, (z - (w.pos - L)) / (L - 4))); return BR * u * u * (3 - 2 * u); }
function chamberProf(e) {
  if (e <= 0.001) return T_PROF;
  const cxv = e / 2, A = 2.3 + e / 2, H = 1.7 + 0.25 * e, p = [[-2.3, -2], [-2.3, -0.9], [-2.3, 0.4]];
  for (let i = 1; i < 10; i++) { const a = Math.PI - i * Math.PI / 10; p.push([cxv + A * Math.cos(a), 0.4 + H * Math.sin(a)]); }
  p.push([2.3 + e, 0.4], [2.3 + e, -0.9], [2.3 + e, -2]);
  return p;
}
// vue : a = décalage de la salle (et de tout ce qui est avant la tête), b = au-delà, dans le tube emprunté
// grill : l'aiguille suivante existe déjà au bout du tube (même géométrie), pour un tunnel continu
function swGhost() {
  const w = S.sw; if (!w || !w.tot || !w.plan || !w.plan[w.idx] || S.mode !== 'running') return null;
  const e = w.plan[w.idx];
  if (!e.g) e.g = { kind: 'fork', pos: e.pos, sig: e.pos - SW_SIG, want: e.want, set: e.set0, fixT: 0, lead: CH_LEAD, passed: false, ghost: true };
  e.g.set = S.swQueue || e.set0;
  return e.g;
}
function swView() {
  const w = S.sw; if (!w || w.kind !== 'fork' || S.mode !== 'running') return null;
  const zB = zBof(w), onBr = w.passed && w.set === 'G' && S.pos > w.pos, setG = w.set === 'G';
  const camX = onBr ? brOff(w, S.pos) : 0;
  // au-delà de la tête, le monde est aligné sur le tube choisi (pas de saut quand on franchit l'aiguille)
  return { zB, onBr, setG, a: -camX, b: (setG ? BR : 0) - camX };
}
function chamberSlice(w, p0, d0, d1) {
  const yf = -2, full = p0 - S.pos >= NEAR, { f, w: wm } = tunnelLight(p0 + 1, d0);
  const e0 = chamberE(w, p0), e1 = chamberE(w, p0 + STEP), A = chamberProf(e0), B = chamberProf(e1);
  for (let i = 0; i < A.length - 1; i++) {
    const n = 0.93 + 0.1 * hsh(p0, i);
    poly([[A[i][0], A[i][1], d0], [A[i + 1][0], A[i + 1][1], d0], [B[i + 1][0], B[i + 1][1], d1], [B[i][0], B[i][1], d1]], tl(C.tWall, f * T_SHADE[i] * n, wm * T_SHADE[i]));
  }
  if (full) for (let i = 0; i < A.length - 1; i++) poly([[A[i][0], A[i][1], d0], [A[i + 1][0], A[i + 1][1], d0], [A[i + 1][0], A[i + 1][1], d0 + 0.06], [A[i][0], A[i][1], d0 + 0.06]], tl(C.tWall, f * T_SHADE[i] * 0.62, wm * 0.5));
  poly([[-2.3, yf, d1], [2.3 + e1, yf, d1], [2.3 + e0, yf, d0], [-2.3, yf, d0]], tl(C.ballast, f * 0.92, wm * 0.6));
  poly([[-0.12, yf + 0.002, d1], [0.12, yf + 0.002, d1], [0.12, yf + 0.002, d0], [-0.12, yf + 0.002, d0]], tl([22, 22, 26], f, 0));
  if (d0 < 34) poly([[-1.4, yf + 0.25, d1], [1.4, yf + 0.25, d1], [1.4, yf + 0.25, d0], [-1.4, yf + 0.25, d0]], `rgba(255,236,190,${(0.12 * (1 - d0 / 34)).toFixed(3)})`);
  brakeZone(p0, d0, f, yf);
  track(p0, d0, d1, f, yf);
  poly([[-2.3, -1.75, d1], [-1.7, -1.75, d1], [-1.7, -1.75, d0], [-2.3, -1.75, d0]], tl([74, 70, 74], f, wm));
  face([-1.7, -1.75], [-1.7, yf], d0, d1, tl([48, 46, 50], f, wm * 0.5));
  if (full && ((p0 % 8) + 8) % 8 === 0 && e0 > 1) {   // plafonniers de la salle
    const yc = 0.4 + 1.7 + 0.25 * e0 - 0.08, [lx, ly] = P(e0 / 2, yc, d0 + 1);
    poly([[e0 / 2 - 0.4, yc, d0 + 1.2], [e0 / 2 + 0.4, yc, d0 + 1.2], [e0 / 2 + 0.4, yc, d0 + 0.8], [e0 / 2 - 0.4, yc, d0 + 0.8]], '#ffe6b0');
    glow(lx, ly, Math.min(70, 2.6 * F / (d0 + 1)), '255,205,120', 0.32);
  }
}
// barrière de fin de voie : butoir rayé rouge et blanc, croix de Saint-André et feux rouges clignotants
function drawBarrier(x, d) {
  if (d < NEAR + 0.3) return;
  const yf = -2, f = Math.max(0.55, 1 - d / 140), on = Math.floor(S.t * 3) % 2 === 0;
  for (const sd of [-1, 1]) poly([[x + sd * 1.15 - 0.07, yf, d], [x + sd * 1.15 + 0.07, yf, d], [x + sd * 1.15 + 0.07, yf + 1.15, d], [x + sd * 1.15 - 0.07, yf + 1.15, d]], sh([190, 192, 198], f));
  for (let k = 0; k < 8; k++) {
    const xa = x - 1.35 + k * 0.3375, xb = xa + 0.3375;
    poly([[xa, yf + 0.68, d], [xb, yf + 0.68, d], [xb, yf + 1.02, d], [xa, yf + 1.02, d]], k % 2 ? sh([245, 245, 245], f) : sh([214, 32, 28], f));
  }
  // panneau : croix rouge sur fond blanc
  poly([[x - 0.45, yf + 1.25, d], [x + 0.45, yf + 1.25, d], [x + 0.45, yf + 2.05, d], [x - 0.45, yf + 2.05, d]], sh([240, 240, 240], f));
  poly([[x - 0.06, yf + 1.15, d], [x + 0.06, yf + 1.15, d], [x + 0.06, yf + 1.25, d], [x - 0.06, yf + 1.25, d]], sh([150, 150, 156], f));
  const bar = (s1) => poly([[x - 0.36, yf + 1.33 + (s1 ? 0 : 0.64), d], [x - 0.24, yf + 1.33 + (s1 ? 0 : 0.64), d], [x + 0.36, yf + 1.97 - (s1 ? 0 : 0.64), d], [x + 0.24, yf + 1.97 - (s1 ? 0 : 0.64), d]], sh([214, 32, 28], f));
  bar(true); bar(false);
  for (const sd of [-1, 1]) {
    const lit = on === (sd < 0), [lx, ly] = P(x + sd * 1.15, yf + 1.22, d), r = Math.max(0.8, 0.09 * F / d);
    g.fillStyle = lit ? '#ff3a22' : '#4a0f0a'; g.beginPath(); g.arc(lx, ly, r, 0, 7); g.fill();
    if (lit) glow(lx, ly, Math.min(50, 1.8 * F / d), '255,40,20', 0.7);
  }
  if (d < 45) { const [tx, ty] = P(x, yf + 0.45, d); txt('FIN DE VOIE', tx, ty, Math.max(6, Math.min(14, Math.round(0.42 * F / d))), '#ffd0c8', 'center'); }
}
// tête de la salle : mur percé des deux tubes ; le tube non emprunté reste noir
function drawHeadwall(w, d, SV = swView()) {
  if (!SV) return;
  const f = Math.max(0.12, tunnelLight(SV.zB, d).f);
  const out = chamberProf(BR), main = T_PROF, br = T_PROF.map(([x, y]) => [x + BR, y]);
  const path = pts => pts.forEach(([x, y], i) => { const [sx, sy] = P(x, y, d); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
  g.beginPath(); path(out); g.closePath(); path(main); g.closePath(); path(br); g.closePath();
  g.fillStyle = tl(C.tWall, f * 0.95, 0); g.fill('evenodd');
  const hole = SV.setG ? main : br;
  g.beginPath(); path(hole); g.closePath(); g.fillStyle = '#030305'; g.fill();
  for (const h of [main, br]) { g.beginPath(); path(h); g.strokeStyle = tl(C.tWall, Math.min(1, f * 1.35), 0); g.lineWidth = Math.max(0.6, 0.12 * F / d); g.stroke(); }
  // plaques lumineuses au-dessus des deux tubes : flèche verte sur la voie demandée, croix rouge sur l'autre
  for (const [x, k, lab] of [[0, 'D', 'DIRECT'], [BR, 'G', 'DÉVIÉ']]) {
    const good = w.want === k, y0 = 2.18, y1 = 2.9;
    poly([[x - 0.9, y0, d], [x + 0.9, y0, d], [x + 0.9, y1, d], [x - 0.9, y1, d]], '#0a0c10');
    poly([[x - 0.82, y0 + 0.07, d], [x + 0.82, y0 + 0.07, d], [x + 0.82, y1 - 0.07, d], [x - 0.82, y1 - 0.07, d]], good ? '#0f4a22' : '#4a1210');
    const c = good ? '#7dff8a' : '#ff4a3a', cyy = (y0 + y1) / 2;
    if (good) {   // flèche (droite pour DIRECT, oblique pour DÉVIÉ)
      const t = k === 'D' ? 0 : 0.6, q = (u, v) => [x + u * Math.cos(t) + v * Math.sin(t), cyy + v * Math.cos(t) - u * Math.sin(t), d];
      poly([q(-0.07, -0.26), q(0.07, -0.26), q(0.07, 0.08), q(-0.07, 0.08)], c);
      poly([q(-0.2, 0.06), q(0.2, 0.06), q(0, 0.3)], c);
    } else for (const sg of [1, -1]) poly([[x - 0.25, cyy - sg * 0.25, d], [x - 0.15, cyy - sg * 0.25, d], [x + 0.25, cyy + sg * 0.25, d], [x + 0.15, cyy + sg * 0.25, d]], c);
    const [gx, gy] = P(x, cyy, d); glow(gx, gy, Math.min(50, 1.2 * F / d), good ? '90,255,130' : '255,60,40', 0.35);
    const sz = Math.round(0.3 * F / d);
    if (sz >= 6) { const [tx, ty] = P(x, y0 - 0.12, d); txt(lab, tx, ty + sz * 0.7, Math.min(16, sz), c, 'center'); }
  }
  // barrière dans le tube non emprunté (sinon elle est dessinée dans le tube emprunté, plus loin)
  const notWant = w.want === 'D' ? 'br' : 'main', nonTaken = SV.setG ? 'main' : 'br';
  if (notWant === nonTaken) drawBarrier(notWant === 'br' ? BR : 0, d + 6);
}
// traversée : une voie oblique coupe la nôtre au point w.pos, de la gauche (près) vers la droite (loin)
const XU = 8 / Math.hypot(8, 12), XZ = 12 / Math.hypot(8, 12), X_LEN = 30, X_V = 11, X_SC = 4 / XU;   // X_SC : abscisse du croisement
const xPt = (w, s) => [-4 + XU * s, w.pos - 6 + XZ * s];
const X_IN = (4 - 2.29) / XU, X_OUT = (4 + 2.29) / XU;               // entrée / sortie entre les piédroits
const X_CLEAR = X_SC + 2.7 / XU + X_LEN;                              // la queue a dégagé notre voie
function dirName(k) { return k === 'D' ? `la voie DIRECTE (direction ${STATIONS[STATIONS.length - 1].name})` : FIRE() ? 'la voie DÉVIÉE' : 'la voie DÉVIÉE (30 km/h)'; }
// sélecteur de direction en cabine : le conducteur commande l'aiguille avant de l'atteindre
function chooseDir(k) {
  const w = S.sw;
  // grill : aiguille courante verrouillée ou dépassée, on présélectionne la suivante
  if (w && w.tot && w.chain > 0 && S.phase === 'drive' && !S.rev && (w.passed || w.pos - S.pos < (w.lock || SW_LOCK))) {
    if (S.swQueue !== k) { S.swQueue = k; w.plan[w.idx].set0 = k;   // l'aiguille suivante (déjà visible au bout du tube) bascule tout de suite
      beep(760, 0.05, 'square', 0.04); msg(`Aiguille ${w.idx + 1}/${w.tot} : ${k === 'D' ? '← DIRECT' : '→ DÉVIÉ'} tracé${k === w.plan[w.idx].want ? '' : ' (ce n\'est pas la bonne direction !)'}`, k === w.plan[w.idx].want ? '#7dff8a' : '#ff6b5b', 1.5); }
    return true;
  }
  if (!w || w.kind !== 'fork' || w.passed || S.rev || S.phase !== 'drive') return false;
  if (w.pos - S.pos < (w.lock || SW_LOCK)) { msg('Aiguille verrouillée : la rame est trop près', '#ff6b5b', 2); beep(220, 0.15, 'square', 0.04); return true; }
  if (k === w.tgt) { beep(990, 0.05, 'sine', 0.04); return true; }
  if (FIRE()) {   // fuite : l'aiguille bascule tout de suite, le signal ne repasse pas au rouge (on peut changer d'avis jusqu'au verrou)
    w.tgt = w.set = k; w.fixT = 0; w.chose = true; S.vacAlert = 0; S.vacT = Math.max(S.vacT, 20);
    beep(k === w.want ? 880 : 300, 0.07, 'square', 0.05); noise(0.25, 0.08, 'bandpass', 600, 2);
    return true;
  }
  w.tgt = k; w.fixT = w.fix || SW_FIX; w.chose = true; S.vacAlert = 0; S.vacT = Math.max(S.vacT, 20);
  beep(700, 0.06, 'square', 0.04); noise(0.4, 0.1, 'bandpass', 500, 2);
  if (!w.tot) msg(`Itinéraire commandé : ${k === 'D' ? 'DIRECT' : 'DÉVIÉ'}. Aiguille en mouvement, signal fermé`, '#ffd75e', 2.5);
  return true;
}
function swRed() {
  const w = S.sw; if (!w) return false;
  if (w.kind === 'manual') return !w.done;
  if (w.kind === 'fork') return w.fixT > 0 || !w.set;   // pas encore de direction choisie : signal fermé
  return w.eta !== null && S.clock < w.eta + 0.8;
}
function planSwitch(cur, n, D, L) {
  S.sw = null; S.mg = null; S.rev = null; S.swQueue = null;
  // incompatibles : travaux, signal rouge, personne ou chien sur la voie (même portion de tunnel)
  const seen = S.swSeen || (S.swSeen = []);
  const force = !seen.length && D >= 260;                          // le premier trajet assez long a toujours son aiguillage
  const grill = FIRE() && n.grill && D >= 400;
  if ((force || grill) && ['limit', 'signal', 'person', 'dog'].includes(S.inc)) {   // il remplace l'incident de voie incompatible
    S.inc = null; S.limit = 0; S.sigPos = null; S.sigRed = 0; S.person = null; S.dog = null; S.swCleared = true;
  }
  if (['limit', 'signal', 'person', 'dog'].includes(S.inc) || D < 260) return;
  if (!force && !grill && Math.random() > 0.3 + 0.35 * L.inc) return;
  const types = FIRE() ? ['fork', 'merge'] : ['fork', 'merge', 'manual'];   // fuite : pas de manœuvre à pied avec le feu derrière
  const fresh = types.filter(k => !seen.includes(k));   // on fait découvrir chaque type
  let kind = fresh.length ? pick(fresh) : FIRE() ? wpick({ fork: 0.75, merge: 0.25 }) : wpick({ fork: 0.45, merge: 0.35, manual: 0.2 });
  // fuite : grill d'aiguillages, une série d'aiguilles très rapprochées à choisir à la volée
  const ch0 = cur.res.skipped || cur.closed ? 160 : 70;   // station traversée lancée : de quoi freiner avant la 1re aiguille
  const chainRoom = n.pos - CURVE_D - 30 - (cur.pos + PE + ch0);
  const chain = grill ? Math.max(5, Math.min(7, 1 + Math.floor((chainRoom - SW_LEN) / CH_STEP))) : 0;   // au moins 5 aiguilles d'affilée
  if (chain >= 3) { kind = 'fork'; S.chainSeen = true; }
  seen.push(kind);
  const pos = chain >= 3 ? cur.pos + PE + ch0 + Math.random() * 15 : cur.pos + PE + 60 + Math.random() * (D - PL - PE - 140);
  S.swEnd = chain >= 3 ? pos + (chain - 1) * CH_STEP + SW_LEN : pos;   // les virages se tiennent à l'écart de toute la série
  S.swN = (S.swN || 0) + 1;
  const w = S.sw = { kind, pos, sig: pos - SW_SIG, d0: pos - cur.pos, want: 'D', set: 'D', fixT: 0, called: false, passed: false, sigPassed: false, eta: null, start: 0, stopped: false, done: false, limOn: false };
  if (chain >= 3) {
    // la série est tirée d'avance : positions et directions, pour que le profil de vitesse montre les passages en voie déviée
    const plan = []; let pz = pos;
    for (let k = 0; k < chain; k++) { plan.push({ pos: pz, want: Math.random() < 0.5 ? 'G' : 'D', set0: null }); pz = zBof({ pos: pz }) + 2 + CH_GAP + Math.random() * 6; }
    Object.assign(w, { chain: chain - 1, idx: 1, tot: chain, fix: CH_FIX, lock: CH_LOCK, lead: CH_LEAD, want: plan[0].want, plan });
    w.set = w.tgt = plan[0].set0; w.wrong0 = w.set !== w.want; w.chg = false;
    setTimeout(() => { if (S.sw && S.sw.tot && S.mode === 'running') msg(`📻 PCC : GRILL D'AIGUILLAGES ! ${chain} aiguilles en série. Suivez les flèches : ← direct, → dévié`, '#ffb35e', 5); for (let i = 0; i < 3; i++) beep(1250, 0.08, 'square', 0.05, i * 0.15); }, 1500);
    return;
  }
  const dist = Math.round((pos - cur.pos) / 10) * 10;
  if (kind === 'fork') {
    w.want = Math.random() < 0.45 ? 'G' : 'D';
    w.set = null; w.tgt = null; w.wrong0 = true;   // aucune direction tracée : au conducteur de choisir ← ou →
    w.chg = Math.random() < 0.3 && w.d0 > 230;
    setTimeout(() => { if (S.sw === w && S.mode === 'running') msg(`📻 PCC : bifurcation à ${dist} m, prenez ${dirName(w.want)}. Choisissez la direction : ← direct, → dévié.`, '#9fe0ff', 6); }, 1500);
  } else if (kind === 'manual') {
    setTimeout(() => { if (S.sw === w && S.mode === 'running') msg(`📻 PCC : aiguille en panne à ${dist} m. Arrêtez-vous au signal : commande de secours, flèches en rythme.`, '#ffb35e', 6); }, 1500);
  }
}
// ---- virages : série de courbes limitées en vitesse, chacune avec sa propre courbe de freinage ----
const BEND_RAMP = 8, BEND_TOL = 9;   // raccordement progressif sur 8 m ; déraillement quand on dépasse le profil de 9 km/h
const bendTol = () => FIRE() ? BEND_TOL - 6 * imbalance() : BEND_TOL;   // fuite : une rame déséquilibrée penche, elle déraille plus tôt
// vitesse permise avant et dans les virages (la descente de freinage, puis la limite) : 999 hors contrainte
function derailEnv(z) {
  let v = 999;
  for (const b of S.bends || []) {
    if (z > b.pos + b.len || b.pos - z > 220) continue;
    if (FIRE() && z < b.pos) continue;   // fuite : en ligne droite, aucune limite ; seul le virage lui-même se négocie
    v = Math.min(v, z < b.pos ? bendTarget(b, b.pos - z) : b.lim);
  }
  return v;
}
const bendTarget = (b, d) => d <= 0 ? b.lim : Math.sqrt((b.lim / 3.6) ** 2 + 2 * BRAKE_REF * d) * 3.6;
// grill d'aiguillages : chaque passage en voie déviée entre dans le profil de vitesse comme un « virage » à 30 km/h
function addSwBends() {
  const w = S.sw; if (!w || !w.plan || FIRE()) return;   // fuite : aiguillages sans limite de vitesse, pas de profil
  w.plan.forEach((e, k) => { if (e.want === 'G') S.bends.push({ pos: e.pos - 3, len: SW_DEV + 8, lim: 30, dir: 0, R: 1e9, sw: true, swIdx: k + 1, swTot: w.plan.length, tol: 20, entered: false, done: false }); });
  S.bends.sort((p, q) => p.pos - q.pos);
}
// ---- mode feu : barricade de zombies en bois. Un défi de tunnel (pas un incident) : il faut la percuter à fond ----
const BARR_NEED = 60;   // vitesse minimale pour la pulvériser (km/h)
function planBarricade(cur, n, force) {
  if (!FIRE()) return false;
  const lo = cur.pos + PE + (cur.res.skipped || cur.closed ? 100 : 130), hi = n.pos - 100;   // de quoi prendre de l'élan, puis freiner pour la station
  if (hi - lo < 10 || (!force && S.barrSeen && Math.random() > 0.65)) return false;
  S.barrSeen = true;
  const pos = lo + Math.random() * Math.min(80, hi - lo);
  S.barr = { pos, need: BARR_NEED, hits: 0, broken: false, warned: false, zs: [-1.3, -0.1, 1.2].map(x => ({ x: x + (Math.random() - 0.5) * 0.4, look: mkZombie(0, 0), ph: Math.random() * 6 })),
    planks: [0.35, 0.8, 1.25, 1.7].map(y => ({ y, t: (Math.random() - 0.5) * 0.12 })) };
  setTimeout(() => { if (S.barr && !S.barr.broken && S.mode === 'running') { msg(`📻 PCC : BARRICADE DE ZOMBIES dans le tunnel ! Foncez à fond pour la briser : au moins ${BARR_NEED} km/h.`, '#ff8a5b', 5); for (let i = 0; i < 3; i++) beep(330, 0.12, 'sawtooth', 0.05, i * 0.18); } }, 1500);
  return true;
}
function updateBarricade(dt) {
  const b = S.barr; if (!b || S.phase !== 'drive' || S.over) return;
  if (S.backup) {   // la rame recule pour reprendre de l'élan
    S.backup.t += dt; S.v = 0; S.pos = Math.max(STATIONS[S.cur].pos + PE + 8, S.pos - 45 * dt);
    if (S.backup.t >= 1.35) { S.backup = null; msg(`Repartez à fond ! Au moins ${b.need} km/h`, '#ffd75e', 2.5); }
    return;
  }
  if (b.broken) return;
  if (S.pos >= b.pos - 0.6) {
    const kmh = S.v * 3.6;
    if (kmh >= b.need) {   // pulvérisée
      b.broken = true; S.v *= 0.72; S.score += 60; S.shake = 0.6;
      msg(`💥 BARRICADE PULVÉRISÉE à ${Math.round(kmh)} km/h ! (+60)`, '#7dff8a', 3);
      noise(0.7, 0.5, 'lowpass', 900, 0.6); beep(70, 0.35, 'triangle', 0.35); noise(0.4, 0.25, 'bandpass', 2500, 3, 0.05);
      S.debris = [];
      for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 200; S.debris.push({ x: W / 2 + (Math.random() - 0.5) * 120, y: 70 + Math.random() * 60, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 4 + Math.random() * 14, h: 2 + Math.random() * 3, c: pick(['#8a5a2a', '#a8723a', '#6a4220', '#c08850']), t: 0 }); }
      for (const z of b.zs) S.debris.push({ x: W / 2 + z.x * 40, y: 80, vx: z.x * 160 + (Math.random() - 0.5) * 60, vy: -180 - Math.random() * 80, r: 0, vr: (Math.random() - 0.5) * 10, w: 7, h: 16, c: '#5a7a4a', t: 0, zb: true });
    } else {   // elle tient : rebond, puis marche arrière
      // chaque choc l'abîme : plus on tape fort, plus la prochaine fois il faudra peu de vitesse
      const was = b.need; b.hits++; b.need = Math.max(20, Math.round(b.need * Math.sqrt(Math.max(0, 1 - (kmh / b.need) ** 2))));
      S.v = 0; S.pos = b.pos - 0.8; S.shake = 0.4; S.backup = { t: 0 };
      msg(`La barricade tient ! ${Math.round(kmh)} km/h sur ${was} : elle est fissurée, il faut maintenant ${b.need} km/h. Marche arrière pour l'élan`, '#ff6b5b', 3.5);
      noise(0.4, 0.4, 'lowpass', 400, 0.7); beep(110, 0.25, 'square', 0.12); sfxBad();
    }
  }
}
function updateDebris(dt) {
  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt);
  if (!S.debris) return;
  for (const p of S.debris) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.r += p.vr * dt; }
  S.debris = S.debris.filter(p => p.t < 1.4 && p.y < VIEW_H + 20);
  if (!S.debris.length) S.debris = null;
}
function drawDebris() {
  if (!S.debris) return;
  for (const p of S.debris) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - p.t / 1.4);
    g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    if (p.zb) { g.fillStyle = '#ff2a2a'; g.fillRect(-2, -6, 1.5, 1.5); g.fillRect(1, -6, 1.5, 1.5); }
    g.restore();
  }
  g.globalAlpha = 1;
}
// barricade en bois : poteaux, planches clouées en travers, deux planches en croix ; fissurée après chaque choc raté
function drawBarricade(b, d) {
  const yf = -2, f = Math.max(0.3, 1 - d / 150), crack = b.hits;
  for (const x of [-2.05, 2.05]) poly([[x - 0.12, yf, d], [x + 0.12, yf, d], [x + 0.12, yf + 2.2, d], [x - 0.12, yf + 2.2, d]], sh([92, 62, 34], f));
  b.planks.forEach((pk, i) => {
    const y = yf + pk.y, t = pk.t + (crack ? (i % 2 ? 0.05 : -0.05) * crack : 0);
    poly([[-2.25, y - 0.17 + t, d], [2.25, y - 0.17 - t, d], [2.25, y + 0.17 - t, d], [-2.25, y + 0.17 + t, d]], sh(i % 2 ? [150, 102, 56] : [128, 86, 46], f));
    poly([[-2.25, y + 0.13 + t, d], [2.25, y + 0.13 - t, d], [2.25, y + 0.17 - t, d], [-2.25, y + 0.17 + t, d]], sh([86, 56, 30], f));
  });
  for (const sg of [1, -1]) poly([[-2.0 * sg, yf + 0.1, d], [-1.75 * sg, yf + 0.1, d], [2.0 * sg, yf + 2.05, d], [1.75 * sg, yf + 2.05, d]], sh([168, 116, 64], f));
  if (crack) for (let k = 0; k < crack * 3; k++) { const x = -1.8 + hsh(k, 5) * 3.6, y = yf + 0.3 + hsh(k, 6) * 1.6; poly([[x, y, d], [x + 0.35, y + 0.08, d], [x + 0.37, y + 0.11, d], [x + 0.02, y + 0.03, d]], sh([30, 20, 12], f)); }
  if (d < 70) { const [tx, ty] = P(0, yf + 2.45, d), sz = Math.min(22, Math.max(7, Math.round(0.42 * F / d))); txt(`${b.need} km/h`, tx, ty, sz, Math.floor(S.t * 4) % 2 ? '#ff6b5b' : '#ffd75e', 'center'); }
}
function planBends(cur, n, D, L) {
  S.bends = [];
  // portion libre : après la sortie de station, avant l'approche de la suivante, loin des aiguillages
  // station traversée sans arrêt : la rame arrive lancée, on laisse la place de freiner avant le premier virage
  let a = cur.pos + PE + (cur.res.skipped || cur.closed ? 140 : 25), b = n.pos - CURVE_D - 5;
  const ivs = [];
  if (S.sw) { const lo = S.sw.pos - (FIRE() ? 95 : 140), hi = S.swEnd + (FIRE() ? 40 : 55); if (lo > a) ivs.push([a, Math.min(b, lo)]); if (hi < b) ivs.push([Math.max(a, hi), b]); }
  else ivs.push([a, b]);
  const free = ivs.filter(v => v[1] - v[0] >= 20);
  if (!free.length) return;
  if (S.bendSeen && !FIRE() && Math.random() < 0.1) return;   // presque chaque interstation a sa série de virages (fuite : toutes)
  const LIMS = FIRE() ? [25, 30, 35, 40] : [15, 20, 25, 30, 35, 40];   // des virages très serrés (fuite : jamais plus lents que la vague)
  let lost = 0;
  free.forEach(iv => {
    // on remplit la portion libre : une série de 2 à 6 virages en S, parfois en épingle (même sens)
    const room = iv[1] - iv[0], want = 3 + Math.floor(Math.random() * 5), series = []; let len = 0;
    for (let i = 0; i < want; i++) {
      const l = 12 + Math.random() * 14, gap = i ? 7 + Math.random() * 12 : 0;
      if (len + l + gap > room) break;
      series.push({ l, gap }); len += l + gap;
    }
    if (!series.length) return;
    let z = iv[0] + Math.random() * Math.min(15, room - len), dir = Math.random() < 0.5 ? -1 : 1;
    series.forEach(sr => {
      z += sr.gap;
      const lim = LIMS[Math.floor(Math.random() * LIMS.length)], v = lim / 3.6;
      S.bends.push({ pos: z, len: sr.l, lim, dir, R: Math.max(20, v * v / 1.5), entered: false, done: false });
      // temps rendu à l'horaire : freinage, passage à vitesse réduite et réaccélération
      const vr = REF_VMAX;
      if (v < vr) lost += sr.l * (1 / v - 1 / vr) + (vr - v) ** 2 / (2 * vr) * (1 / BRAKE_REF + 1 / 2);
      z += sr.l; if (Math.random() < 0.75) dir = -dir;
    });
  });
  S.bends.sort((p, q) => p.pos - q.pos);
  const add = Math.ceil(lost);
  n.arr += add; n.dep += add; shiftSchedule(S.next + 1, add);
  if (!S.bendSeen) {
    S.bendSeen = true;
    setTimeout(() => { if (S.bends.length && S.mode === 'running') msg(`📻 PCC : ${S.bends.length > 1 ? 'virages' : 'virage'} en approche. Restez sous la courbe, sinon déraillement !`, '#9fe0ff', 5); }, 2500);
  }
}
// courbure de la voie à l'abscisse z (signe = côté)
const curveList = () => S.bends;
function bendK(z) {
  const bs = curveList(); if (!bs || !bs.length) return 0;
  for (const b of bs) if (z > b.pos && z < b.pos + b.len) {
    const u = Math.min(1, (z - b.pos) / BEND_RAMP, (b.pos + b.len - z) / BEND_RAMP);
    return b.dir / b.R * u * u * (3 - 2 * u);
  }
  return 0;
}
// décalage latéral de la voie vue depuis la cabine (la rame est toujours dans l'axe de la voie)
const CURV = new Float32Array(178); let CURV_ON = false;
function buildCurv() {
  CURV_ON = S.mode === 'running' && curveList() && curveList().some(b => b.pos + b.len > S.pos && b.pos < S.pos + DMAX);
  if (!CURV_ON) return;
  let h = 0, x = 0;
  for (let i = 0; i < CURV.length; i++) { CURV[i] = x; h += bendK(S.pos + i + 0.5); x += h; }
}
function curvAt(d) {
  if (!CURV_ON || d <= 0) return 0;
  const i = Math.min(CURV.length - 2, d | 0), f = Math.min(1, d - i);
  return CURV[i] + (CURV[i + 1] - CURV[i]) * f;
}
// profil de vitesse permise le long de la voie : descente avant chaque virage, plateau dans le virage, remontée après
const BEND_ACC = 1.6;   // remontée après le virage (m/s², à peu près la traction de la rame à ces vitesses)
function bendEnv(z) {
  let v = 80;
  for (const b of S.bends || []) {
    const end = b.pos + b.len;
    const t = z < b.pos ? bendTarget(b, b.pos - z) : z <= end ? b.lim : Math.sqrt((b.lim / 3.6) ** 2 + 2 * BEND_ACC * (z - end)) * 3.6;
    v = Math.min(v, t);
  }
  return v;
}
const BP_BACK = 25, BP_AHEAD = 125;   // fenêtre du profil : 25 m derrière, 125 m devant
const bendProfileOn = () => S.mode === 'running' && S.phase === 'drive' && (S.bends || []).some(b => b.pos - S.pos <= BP_AHEAD && S.pos <= b.pos + b.len + 20);
// virage le plus contraignant pour la vitesse actuelle (celui dont la courbe impose la vitesse la plus basse)
function activeBend() {
  if (S.mode !== 'running' || S.phase !== 'drive' || !S.bends) return null;
  let best = null, bv = 1e9;
  for (const b of S.bends) {
    const d = b.pos - S.pos;
    if (b.done || d > CURVE_D || S.pos > b.pos + b.len) continue;
    const t = bendTarget(b, d);
    if (t < bv) { bv = t; best = b; }
  }
  return best;
}
const bendHere = () => S.bends && S.bends.find(b => S.pos >= b.pos && S.pos <= b.pos + b.len);
function updateBends(dt) {
  if (S.phase !== 'drive' || S.over || !S.bends || !S.bends.length) return;
  const kmh = S.v * 3.6;
  for (const b of S.bends) {
    if (!b.entered && S.pos >= b.pos) {
      b.entered = true;
      if (kmh <= b.lim + 1 && kmh >= b.lim - 10) { S.score += 20; msg(`${b.sw ? 'Voie déviée' : 'Virage'} pris${b.sw ? 'e' : ''} en zone verte (+20)`, '#7dff8a', 2); }
    }
    if (b.entered && !b.done && S.pos > b.pos + b.len) b.done = true;
  }
  // on sort de la zone verte (au-dessus du profil + 4 km/h, à l'approche comme dans le virage) : déraillement
  const env = derailEnv(S.pos);
  if (env < 900 && kmh > env + bendTol()) {
    S.derT = (S.derT || 0) + dt;
    if (S.derT > 0.5) {   // tolérance : un écart bref se rattrape
      const bb = S.bends.find(x => S.pos <= x.pos + x.len && x.pos - S.pos < 220) || {};
      gameOver('Déraillement', `Sorti de la zone verte à ${Math.round(kmh)} km/h (profil ${Math.round(env)} km/h${bb.lim ? `, ${bb.sw ? 'voie déviée' : 'virage'} à ${bb.lim}` : ''}).`); return;
    }
  } else S.derT = 0;
  if (env < 900 && kmh > env + 0.5) {   // au-dessus du profil : alerte, il faut freiner tout de suite
    S.squealT = (S.squealT || 0) - dt;
    if (S.squealT <= 0) { S.squealT = 0.2; beep(2600 + Math.random() * 500, 0.15, 'sawtooth', 0.03); }
  }
  const b = bendHere();
  if (!b) { S.bendOverT = 0; return; }
  if (kmh > b.lim + 1) {   // crissement  if (kmh > b.lim + 1) {   // crissement des roues et pénalité tant qu'on reste au-dessus
    S.bendOverT = (S.bendOverT || 0) + dt;
    S.squealT = (S.squealT || 0) - dt;
    if (S.squealT <= 0) { S.squealT = 0.25; beep(2600 + Math.random() * 500, 0.22, 'sawtooth', 0.025); }
    if (S.bendOverT >= 1) { S.bendOverT = 0; pen(-10, `Survitesse dans le virage (limite ${b.lim})`); }
  } else S.bendOverT = 0;
  // léger chant des roues dans la courbe, même à bonne vitesse
  if (S.v > 6) { S.wheelT = (S.wheelT || 0) - dt; if (S.wheelT <= 0) { S.wheelT = 0.6 + Math.random() * 0.8; noise(0.3, 0.025 + S.v / 900, 'bandpass', 3200, 6); } }
}
// trace vitesse / distance du virage suivi par la courbe
function traceBend() {
  if (!bendProfileOn()) return;
  const last = S.btrace[S.btrace.length - 1];
  if (!last || S.pos - last[0] >= 0.5) S.btrace.push([S.pos, S.v * 3.6]);
  while (S.btrace.length && S.btrace[0][0] < S.pos - BP_BACK - 2) S.btrace.shift();
}
// graphique « montagnes » : la vitesse permise sur les 150 m autour de la rame, zone verte juste en dessous
function drawBendProfile(x, y, w, h) {
  const L = 13, B = 7, gx = x + L, gw = w - L - 3, gy = y + 2, gh = h - B - 2, z0 = S.pos - BP_BACK, span = BP_BACK + BP_AHEAD, VM = 80;
  const X = z => gx + gw * (z - z0) / span, Y = v => gy + gh - gh * Math.max(0, Math.min(VM, v)) / VM;
  g.fillStyle = 'rgba(8,10,14,0.9)'; g.fillRect(x, y, w, h);
  for (const v of [20, 40, 60, 80]) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(gx, Y(v), gw, 0.5); if (v < 80) txt(String(v), x + L - 2, Y(v) + 2.5, 7, '#7f8aa0', 'right'); }
  // virages : bandes sombres et vitesse limite en bas
  for (const b of S.bends) {
    const a = Math.max(z0, b.pos), e = Math.min(z0 + span, b.pos + b.len); if (e <= a) continue;
    g.fillStyle = 'rgba(255,215,94,0.08)'; g.fillRect(X(a), gy, X(e) - X(a), gh);
    txt(String(b.lim), (X(a) + X(e)) / 2, y + h - 1, 7, '#ffd75e', 'center');
  }
  const pts = []; for (let z = z0; z <= z0 + span + 0.01; z += 1) pts.push([z, bendEnv(z)]);
  // trop vite (rouge) au-dessus du profil, zone verte dessous
  g.fillStyle = 'rgba(150,44,34,0.45)'; g.beginPath(); g.moveTo(X(z0), gy); pts.forEach(([z, v]) => g.lineTo(X(z), Y(v))); g.lineTo(X(z0 + span), gy); g.fill();
  g.fillStyle = 'rgba(47,150,74,0.55)'; g.beginPath(); pts.forEach(([z, v], i) => i ? g.lineTo(X(z), Y(v)) : g.moveTo(X(z), Y(v)));
  for (let i = pts.length - 1; i >= 0; i--) g.lineTo(X(pts[i][0]), Y(Math.max(0, pts[i][1] - 10))); g.fill();
  g.strokeStyle = '#7dff8a'; g.lineWidth = 0.8; g.beginPath(); pts.forEach(([z, v], i) => i ? g.lineTo(X(z), Y(v)) : g.moveTo(X(z), Y(v))); g.stroke();
  // seuil de déraillement dans les virages
  g.strokeStyle = 'rgba(255,58,42,0.8)'; g.setLineDash([2, 1.5]);
  g.setLineDash([]);
  {
    // seuil de déraillement : il épouse le profil (descente de freinage puis plateau du virage), 4 km/h au-dessus
    const dp = []; for (let z = z0; z <= z0 + span + 0.01; z += 0.5) { const e = derailEnv(z); dp.push([z, e < 900 ? e + bendTol() : null]); }
    let seg = [];
    const flush = () => {
      if (seg.length > 1) {
        g.fillStyle = 'rgba(255,40,30,0.38)'; g.beginPath(); g.moveTo(X(seg[0][0]), gy); seg.forEach(([z, v]) => g.lineTo(X(z), Y(v))); g.lineTo(X(seg[seg.length - 1][0]), gy); g.fill();
        g.strokeStyle = 'rgba(255,80,60,0.95)'; g.lineWidth = 0.9; g.setLineDash([2, 1.5]);
        g.beginPath(); seg.forEach(([z, v], i) => i ? g.lineTo(X(z), Y(v)) : g.moveTo(X(z), Y(v))); g.stroke(); g.setLineDash([]);
      }
      seg = [];
    };
    dp.forEach(p => { if (p[1] === null || p[1] > 84) flush(); else seg.push(p); }); flush();
  }
  // repère « freinez ici » : là où la vitesse actuelle croise la descente du prochain virage
  const kmh = S.v * 3.6, nb = activeBend();
  if (nb && S.v > 1 && nb.pos > S.pos) {
    const db = nb.pos - brakePoint(kmh, nb.lim);
    if (db > S.pos + 0.5 && db < z0 + span) {
      const xb = X(db), near = db - S.pos < 4;
      g.strokeStyle = near && Math.floor(S.t * 6) % 2 ? '#ffffff' : '#ffb35e'; g.lineWidth = 1; g.setLineDash([2, 1.5]);
      g.beginPath(); g.moveTo(xb, gy); g.lineTo(xb, gy + gh); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(8,10,14,0.85)'; g.fillRect(xb - 15, gy, 30, 7); txt('FREINEZ ICI', xb, gy + 5.5, 6, '#ffb35e', 'center');
    }
  }
  // trace du conducteur et position actuelle
  const tr = S.btrace || [];
  g.lineWidth = 1.4; g.lineCap = 'round';
  for (let i = 1; i < tr.length; i++) {
    const [z1, v1] = tr[i], e = bendEnv(z1);
    g.strokeStyle = v1 > e + 1.5 ? '#ff6b5b' : v1 < e - 10 ? '#ffd75e' : '#ffffff';
    g.beginPath(); g.moveTo(X(tr[i - 1][0]), Y(tr[i - 1][1])); g.lineTo(X(z1), Y(v1)); g.stroke();
  }
  g.lineCap = 'butt';
  const e = bendEnv(S.pos), c = kmh > e + 1.5 ? '#ff6b5b' : kmh < e - 10 ? '#ffd75e' : '#7dff8a';
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(X(S.pos) - 0.25, gy, 0.5, gh);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(X(S.pos), Y(kmh), 3.5, 0, 7); g.fill();
  g.fillStyle = c; g.beginPath(); g.arc(X(S.pos), Y(kmh), 2.2, 0, 7); g.fill();
  g.strokeStyle = '#4a5166'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
// panneau de limitation à l'entrée de chaque virage (et chevrons sur la paroi extérieure)
function bendSprites(list) {
  if (!S.bends) return;
  for (const b of S.bends) {
    if (b.sw) continue;   // passage en voie déviée : l'aiguillage a sa propre signalisation
    const dd = b.pos - 4 - S.pos;
    if (dd > NEAR + 0.3 && dd < 120) list.push({ d: dd, draw: d => {
      const x = 1.95, y = 0.15, r = 0.36, [sx, sy] = P(x, y, d), rr = r * F / d;
      if (rr < 0.8) return;
      const [px, py] = P(x, -1.75, d);
      g.fillStyle = '#3a3e44'; g.fillRect(sx - Math.max(0.5, 0.03 * F / d), sy, Math.max(1, 0.06 * F / d), py - sy);
      g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(sx, sy, rr, 0, 7); g.fill();
      g.strokeStyle = '#d42a2a'; g.lineWidth = Math.max(0.6, rr * 0.22); g.beginPath(); g.arc(sx, sy, rr * 0.86, 0, 7); g.stroke();
      if (rr > 3) txt(String(b.lim), sx, sy + rr * 0.38, Math.max(5, Math.round(rr * 1.05)), '#111', 'center');
      glow(sx, sy, Math.min(30, rr * 2.2), '255,255,240', 0.12);
    } });
    // chevrons jaunes et noirs sur la paroi extérieure du virage
    for (let z = b.pos + 4; z < b.pos + b.len - 2; z += 6) {
      const dc = z - S.pos; if (dc < NEAR + 0.3 || dc > 90) continue;
      const side = -b.dir;
      list.push({ d: dc, draw: d => {
        const xw = side * 2.26, [ax, ay] = P(xw, 0.75, d), [, by] = P(xw, 0.25, d), hw = 0.28 * F / d;
        if (hw < 0.7) return;
        g.fillStyle = '#e8c020'; g.fillRect(ax - hw, ay, hw * 2, by - ay);
        g.strokeStyle = '#111'; g.lineWidth = Math.max(0.5, hw * 0.28);
        const pt = side > 0 ? -1 : 1;   // pointe vers l'intérieur du virage
        for (const o of [-0.45, 0.2]) { g.beginPath(); g.moveTo(ax + o * hw * 2 - pt * hw * 0.3, ay + 1); g.lineTo(ax + o * hw * 2 + pt * hw * 0.35, (ay + by) / 2); g.lineTo(ax + o * hw * 2 - pt * hw * 0.3, by - 1); g.stroke(); }
      } });
    }
  }
}
function updateSwitch(dt) {
  const w = S.sw; if (!w || S.phase !== 'drive') return;
  const dp = w.sig - S.pos;
  if (w.kind === 'merge' && w.eta === null && dp < 190) {
    w.eta = S.clock + dp / VMAX + 0.5 + Math.random() * 1.3; w.start = S.clock;   // le train traverse juste devant nous : il suffit d'ajuster l'allure, à peine
    w.t0 = w.eta - X_CLEAR / X_V;
    msg('Signal jaune : un train va traverser votre voie. Laissez-le passer !', '#ffd75e', 3.5);
    beep(1250, 0.1, 'square', 0.04); beep(1250, 0.1, 'square', 0.04, 0.2);
  }
  if (w.kind === 'fork' && w.fixT > 0) {
    w.fixT -= dt;
    if (w.fixT <= 0) { w.fixT = 0; w.set = w.tgt; if (!w.tot) msg(`Aiguille en position ${w.set === 'D' ? 'DIRECT' : 'DÉVIÉ'} : signal ouvert`, w.set === w.want ? '#7dff8a' : '#ffd75e', 2.5); beep(880, 0.15, 'sine', 0.05); noise(0.3, 0.12, 'bandpass', 600, 2); }
  }
  if (w.kind === 'fork' && w.chg && !w.passed && w.pos - S.pos < 150 && w.pos - S.pos > 70) {   // le PCC change d'itinéraire en route
    w.chg = false; w.want = w.want === 'D' ? 'G' : 'D'; w.chgT = S.t;
    msg(`📻 PCC : CHANGEMENT D'ITINÉRAIRE ! ${w.want === 'D' ? 'Voie déviée occupée' : 'Voie directe occupée'}, prenez ${dirName(w.want)}`, '#ffb35e', 5);
    for (let i = 0; i < 2; i++) beep(1250, 0.1, 'square', 0.05, i * 0.2);
  }
  if (!w.sigPassed && S.v === 0 && dp < 40 && (w.kind !== 'merge' || w.eta !== null)) w.stopped = true;
  if (!w.sigPassed && S.pos > w.sig - 0.3) {
    w.sigPassed = true;
    if (swRed()) {
      S.ebrake = true; w.bad = true;
      S.swBad = (S.swBad || 0) + 1;
      if (w.kind === 'manual') { w.done = true; pen(-150, 'Aiguille talonnée : franchissement avant la manœuvre !'); }
      else if (w.kind === 'merge') pen(-80, 'Signal rouge franchi : le train qui traverse freine d\'urgence !');
      else { const none = !w.tgt; w.fixT = 0; w.set = w.tgt; pen(-80, none ? `Signal rouge : aucune direction choisie pour ${w.tot ? `l'aiguille ${w.idx}/${w.tot}` : 'la bifurcation'} (← ou →). Freinage d'urgence !` : 'Signal rouge franchi pendant le mouvement de l\'aiguille !'); }
    } else if (w.kind === 'merge' && !w.stopped) { S.score += 40; msg('Traversée bien anticipée, sans arrêt (+40)', '#7dff8a', 3); }
  }
  if (w.kind === 'fork') {
    const inZ = w.set === 'G' && S.pos > w.pos - 3 && S.pos < w.pos + SW_DEV + 5;
    if (inZ && !FIRE()) { S.limit = 30; w.limOn = true; } else if (w.limOn) { S.limit = 0; w.limOn = false; }
    if (!w.passed && S.pos > w.pos) {
      w.passed = true;
      if (w.set !== w.want) {
        S.ebrake = true; S.rev = { t: 0 }; if (!w.bad) { w.bad = true; S.swBad = (S.swBad || 0) + 1; }
        pen(-100, `Mauvais itinéraire : la rame part en voie ${w.set === 'D' ? 'directe' : 'déviée'} !`);
        for (let i = 0; i < 3; i++) beep(330, 0.2, 'sawtooth', 0.05, i * 0.25);
      } else if (w.tot) {
        S.score += 25; pop0(`+25`); beep(1047, 0.07, 'square', 0.04);
        if (!w.chain) { S.score += 60; msg(`Grill franchi sans erreur ! (+${25 * w.tot + 60})`, '#7dff8a', 3); }
      } else if (w.chose && (w.wrong0 || w.chgT)) { S.score += 30; msg('Bonne direction prise (+30)', '#7dff8a', 2.5); }
    }
    if (w.chain > 0 && w.passed && !S.rev && S.pos > zBof(w) + 2) nextChainFork(w);
  }
}
const pop0 = t => msg(t, '#7dff8a', 1);
// grill d'aiguillages : dès que la rame a dégagé une aiguille, la suivante apparaît un peu plus loin
function nextChainFork(w0) {
  const nx = w0.plan[w0.idx], pos = nx.pos;   // exactement là où on la voyait déjà au bout du tube
  if (S.limit === 30 && w0.limOn) S.limit = 0;
  const w = S.sw = { kind: 'fork', pos, sig: pos - SW_SIG, d0: pos - S.pos, want: Math.random() < 0.5 ? 'G' : 'D', set: 'D', fixT: 0, called: false, passed: false, sigPassed: false, eta: null, start: 0, stopped: false, done: false, limOn: false,
    chain: w0.chain - 1, idx: w0.idx + 1, tot: w0.tot, fix: CH_FIX, lock: CH_LOCK, lead: CH_LEAD, chg: false, plan: w0.plan };
  w.want = nx.want;
  if (S.swQueue) { w.chose = true; S.swQueue = null; }   // déjà en position : signal vert, pas d'attente
  w.set = w.tgt = nx.set0; w.wrong0 = w.set !== w.want;
  S.swN = (S.swN || 0) + 1;
  msg(`Aiguille ${w.idx}/${w.tot} : ${w.want === 'D' ? '← DIRECT' : '→ DÉVIÉ'}`, w.want === 'D' ? '#9fe0ff' : '#ffd75e', 2);
  beep(w.want === 'D' ? 880 : 1175, 0.08, 'square', 0.05);
}
const REV_T = 5;      // retour en marche arrière : 5 s à l'écran, environ 20 s d'horaire perdues
function updateReverse(dt) {
  const r = S.rev; if (!r || S.v > 0) return;
  S.ebrake = false; r.t += dt; S.clock += dt * 3;
  if (r.t >= REV_T) {
    const w = S.sw; S.rev = null;
    if (w) { w.set = w.tgt = w.want; w.passed = false; w.sigPassed = true; S.pos = w.pos - 14; w.limOn = false; S.limit = 0; }
    msg('Retour effectué, bon itinéraire tracé : repartez', '#9fe0ff', 3);
  }
}
// ---- manœuvre manuelle de l'aiguille (mini-jeu) ----
// ---- aiguille en panne : commande de secours en cabine, un jeu de flèches en rythme ----
// les flèches montent vers la ligne cible : appuyer sur la bonne direction (← ↓ ↑ → ou Q S Z D) quand elles l'atteignent
const DDR_DIRS = ['L', 'D', 'U', 'R'], DDR_TRAVEL = 1.5, DDR_PERF = 0.09, DDR_GOOD = 0.18, DDR_N = 8, DDR_NEED = 6;
const canManual = () => { const w = S.sw; return w && w.kind === 'manual' && !w.done && !S.mg && S.phase === 'drive' && S.v === 0 && w.sig - S.pos > -0.5 && w.sig - S.pos < 40; };
function ddrNotes(t0) {
  const n = []; let t = t0;
  for (let i = 0; i < DDR_N; i++) { n.push({ t, dir: DDR_DIRS[Math.floor(Math.random() * 4)], res: null }); t += pick([0.45, 0.6, 0.6, 0.75]); }
  return n;
}
function startManual() {
  S.mg = { t: 0, notes: ddrNotes(DDR_TRAVEL + 0.6), hits: 0, perf: 0, combo: 0, fb: null, fbT: 0, flash: 0, lane: [0, 0, 0, 0], tries: 1 };
  beep(523, 0.08, 'square', 0.05); beep(784, 0.1, 'square', 0.05, 0.1);
}
function updateManual(dt) {
  if (!S.mg) { if (canManual()) startManual(); return; }   // à l'arrêt devant le signal : la commande de secours s'ouvre d'elle-même
  const m = S.mg;
  m.t += dt; m.fbT = Math.max(0, m.fbT - dt); m.flash = Math.max(0, m.flash - dt); m.lane = m.lane.map(v => Math.max(0, v - dt));
  for (const n of m.notes) if (!n.res && m.t > n.t + DDR_GOOD) { n.res = 'miss'; m.combo = 0; m.fb = 'RATÉ'; m.fbT = 0.5; }
  if (m.notes.every(n => n.res)) {
    if (m.hits >= DDR_NEED) finishManual();
    else {   // pas assez de coups justes : l'aiguille n'est pas calée, on recommence
      m.tries++; m.hits = 0; m.perf = 0; m.combo = 0; m.notes = ddrNotes(m.t + DDR_TRAVEL + 0.4); S.score -= 20;
      msg(`L'aiguille n'est pas calée (${DDR_NEED} flèches justes sur ${DDR_N} nécessaires) : on recommence (−20)`, '#ff8a5b', 3); sfxBad();
    }
  }
}
function mgHit(dir) {
  const m = S.mg; if (!m || !dir) return;
  m.lane[DDR_DIRS.indexOf(dir)] = 0.15;
  const n = m.notes.filter(x => !x.res && x.dir === dir).sort((a, b) => Math.abs(a.t - m.t) - Math.abs(b.t - m.t))[0];
  const dt = n ? Math.abs(n.t - m.t) : 9;
  if (n && dt <= DDR_GOOD) {
    n.res = dt <= DDR_PERF ? 'perf' : 'good'; m.hits++; m.combo++; if (n.res === 'perf') m.perf++;
    S.score += n.res === 'perf' ? 10 : 5; m.fb = n.res === 'perf' ? 'PARFAIT !' : 'BIEN'; m.fbT = 0.5;
    beep(n.res === 'perf' ? 880 + 60 * Math.min(8, m.combo) : 660, 0.07, 'square', 0.05); noise(0.08, 0.15, 'lowpass', 900, 0.8);
  } else { m.combo = 0; m.flash = 0.25; m.fb = 'TROP TÔT'; m.fbT = 0.4; beep(180, 0.08, 'square', 0.04); }
}
function finishManual() {
  const m = S.mg; S.mg = null; S.sw.done = true;
  beep(70, 0.3, 'triangle', 0.35); noise(0.2, 0.4, 'lowpass', 600, 0.8);
  const all = m.perf === DDR_N ? 40 : 0; S.score += all;
  msg(`Aiguille calée et verrouillée${all ? ' : sans-faute ! (+40)' : ''}. Signal ouvert, repartez !`, '#7dff8a', 3.5);
}
// flèche style « tapis de danse » : pointe dans la direction donnée
function ddrArrow(cx, cy, r, dir, fill, stroke) {
  const a = { L: Math.PI, D: Math.PI / 2, U: -Math.PI / 2, R: 0 }[dir], P2 = (u, v) => [cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)];
  const pts = [[r, 0], [0, -r], [0, -r * 0.42], [-r, -r * 0.42], [-r, r * 0.42], [0, r * 0.42], [0, r]].map(([u, v]) => P2(u, v));
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.2; g.stroke(); }
}
function drawManual() {
  const m = S.mg; if (!m) return;
  const lw = 30, x0 = W / 2 - lw * 2, top = 34, bot = 160, ty = top + 12, COL = { L: '#ff5ab0', D: '#4ab0ff', U: '#7dff8a', R: '#ffb33a' };
  g.fillStyle = m.flash ? 'rgba(90,10,10,0.82)' : 'rgba(6,8,14,0.82)'; g.fillRect(x0 - 8, top - 26, lw * 4 + 16, bot - top + 30);
  g.strokeStyle = '#ffd75e'; g.lineWidth = 1; g.strokeRect(x0 - 7.5, top - 25.5, lw * 4 + 15, bot - top + 29);
  txt('AIGUILLE EN PANNE · COMMANDE DE SECOURS', W / 2, top - 16, 10, '#ffd75e', 'center', 'VT323', lw * 4 + 12);
  txt(`${m.hits} / ${DDR_NEED} flèches justes${m.combo > 1 ? `  ·  combo ×${m.combo}` : ''}`, W / 2, top - 6, 10, '#e6ecf5', 'center', 'VT323', lw * 4 + 12);
  DDR_DIRS.forEach((d, i) => {
    const cx = x0 + lw * i + lw / 2;
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x0 + lw * i + 1, top, lw - 2, bot - top);
    ddrArrow(cx, ty, 10, d, m.lane[i] > 0 ? COL[d] : 'rgba(255,255,255,0.08)', '#c8ccd6');    // cible
  });
  for (const n of m.notes) {
    if (n.res && n.res !== 'miss') continue;
    const k = (n.t - m.t) / DDR_TRAVEL; if (k > 1 || k < -0.2) continue;
    const cx = x0 + lw * DDR_DIRS.indexOf(n.dir) + lw / 2, cy = ty + k * (bot - ty);
    ddrArrow(cx, cy, 10, n.dir, n.res === 'miss' ? 'rgba(120,120,130,0.6)' : COL[n.dir], '#ffffff');
  }
  if (m.fbT > 0) txt(m.fb, W / 2, ty + 32, 10, m.fb === 'PARFAIT !' ? '#7dff8a' : m.fb === 'BIEN' ? '#9fe0ff' : '#ff6b5b', 'center', '"Press Start 2P"');
  txt('← ↓ ↑ →  ou  Q S Z D', W / 2, bot - 2, 9, '#8fa0b8', 'center');
}
function drawReverse() {
  const r = S.rev; if (!r) return;
  g.fillStyle = 'rgba(4,6,12,0.7)'; g.fillRect(0, 0, W, VIEW_H);
  if (S.v > 0) { txt('MAUVAIS ITINÉRAIRE : freinage d\'urgence', W / 2, 74, 14, '#ff6b5b', 'center'); return; }
  txt('◄◄ RETOUR EN MARCHE ARRIÈRE', W / 2, 70, 16, '#ffb35e', 'center');
  txt('Le PCC retrace l\'aiguille… l\'horaire tourne', W / 2, 86, 11, '#cfd6e6', 'center');
  g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(W / 2 - 70, 94, 140, 4);
  g.fillStyle = '#ffb35e'; g.fillRect(W / 2 - 70, 94, 140 * Math.min(1, r.t / REV_T), 4);
}
function xingSprites(w, list, yf) {
  const NX = XZ, NZ = -XU;                                     // normale côté droit (tournée vers nous)
  const dc = w.pos - S.pos; if (dc < NEAR + 4 || dc > DMAX) return;
  // par tranches de 1 m (dessinées juste après le piédroit et le sol de la même tranche) :
  // bouches des tunnels latéraux (gauche avant le croisement, droite après) et rails de la voie oblique
  for (let z = w.pos - 6.5; z < w.pos + 6.5; z += 1) {
    const d = z - S.pos; if (d < NEAR + 0.3) continue;
    list.push({ d: d - 0.05, draw: () => {
      const da = d, db = d + 1;
      if (z + 1 <= w.pos - 0.5) poly([[-2.29, yf, db], [-2.29, 0.9, db], [-2.29, 0.9, da], [-2.29, yf, da]], '#020203');
      if (z >= w.pos + 0.5) poly([[2.29, yf, db], [2.29, 0.9, db], [2.29, 0.9, da], [2.29, yf, da]], '#020203');
      for (const o of [-0.72, 0.72]) {
        const s0 = (z - (w.pos - 6) - NZ * o) / XZ, s1 = s0 + 1 / XZ;
        const pa = Math.max(s0, X_IN), pb = Math.min(s1, X_OUT); if (pb <= pa) continue;
        const p = (s, e) => { const [x, zz] = xPt(w, s); return [Math.max(-2.29, Math.min(2.29, x + NX * (o + e))), yf + 0.13, zz + NZ * (o + e) - S.pos]; };
        poly([p(pa, -0.05), p(pb, -0.05), p(pb, 0.05), p(pa, 0.05)], sh(C.rail, 0.85));
      }
    } });
  }
  // phares qui éclairent la bouche gauche avant l'arrivée
  if (w.t0 !== undefined) {
    const sh0 = X_V * (S.clock - w.t0);
    if (sh0 > -40 && sh0 < X_IN + 1) list.push({ d: dc - 3.5, draw: dd => { const [gx, gy] = P(-2.3, -1.2, dd); glow(gx, gy, Math.min(70, 3.4 * F / dd), '255,236,190', Math.min(0.5, 0.15 + 0.012 * (sh0 + 40)) + 0.08 * Math.sin(S.t * 20)); } });
    // la rame qui traverse : vue de trois quarts arrière, coupée par les piédroits
    const sH = Math.min(sh0, X_OUT), sT = Math.max(sh0 - X_LEN, X_IN);
    if (sH > sT) {
      const zn = Math.min(xPt(w, sT)[1] + NZ * 1.35, xPt(w, sT)[1] - NZ * 1.35);   // point le plus proche : la rame passe devant les bouches
      list.push({ d: Math.max(NEAR + 0.4, zn - S.pos - 0.1), draw: () => {
        const f = Math.min(1, 0.22 + 0.92 / (1 + (dc / 24) * (dc / 24)));
        const Q = (s, o, y) => { const [x, z] = xPt(w, s); return [Math.max(-2.29, Math.min(2.29, x + NX * o)), y, z + NZ * o - S.pos]; };
        const face = (s0, s1, o, y0, y1, col) => poly([Q(s0, o, y0), Q(s1, o, y0), Q(s1, o, y1), Q(s0, o, y1)], col);
        const yb = -1.62, yt = 1.45;
        face(sT, sH, 1.35, yb, yt, sh([196, 202, 212], f));                   // flanc
        face(sT, sH, 1.35, yb, yb + 0.32, sh([46, 50, 58], f));
        face(sT, sH, 1.35, yb + 0.32, yb + 0.4, sh([31, 95, 174], f));
        for (let k = sh0 - X_LEN + 1.5; k < sh0 - 1; k += 3.2) {            // fenêtres éclairées
          const a = Math.max(k, sT), b = Math.min(k + 2, sH); if (b > a) face(a, b, 1.36, 0.1, 1.05, sh([255, 226, 160], Math.max(0.5, f)));
        }
        const sRear = sh0 - X_LEN;
        if (sRear >= X_IN && sRear <= X_OUT) {                                 // face arrière et feux rouges
          const R = (o0, o1, y0, y1, col) => poly([Q(sRear, o0, y0), Q(sRear, o1, y0), Q(sRear, o1, y1), Q(sRear, o0, y1)], col);
          R(-1.35, 1.35, yb, yt, sh([214, 220, 228], f)); R(-1.12, -0.32, 0.15, 1.15, sh([24, 32, 46], f)); R(0.32, 1.12, 0.15, 1.15, sh([24, 32, 46], f));
          for (const o of [-0.85, 0.85]) { R(o - 0.16, o + 0.16, -0.95, -0.72, '#ff2a1a'); const q = Q(sRear, o, -0.83); const [lx, ly] = P(q[0], q[1], q[2]); glow(lx, ly, Math.min(60, 1.6 * F / q[2]), '255,40,20', 0.45); }
        }
        if (Math.abs(sH - X_SC) < 6 || Math.abs(sT - X_SC) < 6) { const [gx, gy] = P(0, yf + 0.1, dc); glow(gx, gy, Math.min(40, 2 * F / dc), '160,200,255', 0.12 * (Math.sin(S.t * 37) > 0.6 ? 1 : 0)); }   // étincelles au croisement
      } });
    }
  }
}
function swSprites(list) {
  if (!S.sw) return;
  swSpritesW(S.sw, list, false);
  const gh = swGhost(); if (gh) swSpritesW(gh, list, true);
}
function swSpritesW(w, L0, gh) {
  const yf = -2, list = { push: o => L0.push(gh ? Object.assign(o, { gh: true }) : o) };
  // branche déviée : rails et traverses qui s'écartent en S jusqu'à la tête des tubes
  if (w.kind === 'fork') {
    const zB = zBof(w);
    for (let z = w.pos; z < zB; z += 2) {
      const d = z - S.pos; if (d < NEAR + 0.3 || d > DMAX) continue;
      list.push({ d, cs: true, draw: dd => {
        const a = brOff(w, z), b = brOff(w, z + 2), d1 = dd + 2, f = Math.max(0.3, 1 - dd / 150);
        if (a > 1.45) for (const q of [0.1, 1.1]) poly([[a - 1.0, yf + 0.06, dd + q + 0.25], [a + 1.0, yf + 0.06, dd + q + 0.25], [a + 1.0, yf + 0.06, dd + q], [a - 1.0, yf + 0.06, dd + q]], sh([70, 60, 52], f));
        for (const rx of [-0.72, 0.72]) {
          if (a < 1.44 && rx < 0) continue;   // le rail gauche de la branche se confond d'abord avec la voie directe
          poly([[rx + b - 0.06, yf + 0.14, d1], [rx + b + 0.06, yf + 0.14, d1], [rx + a + 0.06, yf + 0.14, dd], [rx + a - 0.06, yf + 0.14, dd]], sh([205, 210, 220], Math.max(f, 0.45)));
        }
      } });
    }
    const dB = zB - S.pos;
    const SVw = gh ? { zB, onBr: false, setG: w.set === 'G' } : swView();
    if (dB > NEAR + 0.3 && dB < DMAX) list.push({ d: dB, cs: true, draw: dd => drawHeadwall(w, dd, SVw) });
    // barrière dans le tube emprunté (la voie droit devant mène à une fin de voie)
    const notWant = w.want === 'D' ? 'br' : 'main', taken = SVw && SVw.setG ? 'br' : 'main', dK = zB + 12 - S.pos;
    if (!gh && notWant === taken && dK > NEAR + 0.3 && dK < DMAX) list.push({ d: dK, draw: dd => drawBarrier(0, dd) });
  }
  // lames d'aiguille : un trait brillant contre le rail de la voie tracée
  const dA = w.pos - S.pos;
  if (w.kind === 'fork' && dA > NEAR + 0.3 && dA < 70) list.push({ d: dA, draw: d => {
    if (!w.set) return;
    const rx = w.set === 'D' ? 0.62 : -0.62;
    poly([[rx - 0.03, yf + 0.13, d + 4], [rx + 0.03, yf + 0.13, d + 4], [rx + 0.03, yf + 0.13, d], [rx - 0.03, yf + 0.13, d]], '#e8ecf4');
  } });
  if (w.kind === 'merge') xingSprites(w, list, yf);
  // signaux : signal d'aiguille, et signal d'avertissement 110 m avant la convergence
  const sigs = [[w.sig, () => gh ? (w.set ? 'g' : 'r') : swRed() ? 'r' : 'g']];   // aiguille suivante : rouge tant qu'aucune direction n'est choisie
  if (w.kind === 'merge') sigs.push([w.pos - 110, () => swRed() || w.eta === null ? 'y' : 'g']);
  sigs.forEach(([pz, st]) => { const d = pz - S.pos; if (d > NEAR + 0.3 && d < DMAX) list.push({ d, draw: dd => drawSigHead(dd, st()) }); });
  // indicateur d'itinéraire et panneau 30 de la voie déviée
  const di = w.pos - 45 - S.pos;
  if (!gh && !w.tot && w.kind === 'fork' && di > NEAR + 0.3 && di < DMAX) list.push({ d: di, draw: d => {
    const [cx0, cy0] = P(-1.95, 0.9, d), s0 = F / d;
    const bw = Math.max(2, Math.round(0.75 * s0)), bh = bw, X = Math.round(cx0 - bw / 2), Y = Math.round(cy0 - bh / 2);
    g.fillStyle = '#2c2f38'; g.fillRect(Math.round(cx0 - 0.05 * s0), Y + bh, Math.max(1, Math.round(0.1 * s0)), Math.round(P(-1.95, -2, d)[1] - Y - bh));
    g.fillStyle = '#08090c'; g.fillRect(X, Y, bw, bh);
    if (bw > 5 && w.fixT <= 0 && w.set) {
      const cx = X + bw / 2, cy = Y + bh / 2, r = bh * 0.32, lw = Math.max(1, bh * 0.1);
      if (w.set === 'D') { seg(cx, cy + r, cx, cy - r, lw, '#ffffff'); seg(cx, cy - r, cx - r * 0.5, cy - r * 0.4, lw, '#ffffff'); seg(cx, cy - r, cx + r * 0.5, cy - r * 0.4, lw, '#ffffff'); }
      else { seg(cx - r * 0.6, cy + r, cx + r * 0.6, cy - r * 0.7, lw, '#ffffff'); seg(cx + r * 0.6, cy - r * 0.7, cx, cy - r * 0.7, lw, '#ffffff'); seg(cx + r * 0.6, cy - r * 0.7, cx + r * 0.55, cy, lw, '#ffffff'); }
      glow(cx, cy, bh, '255,255,255', 0.15);
    }
  } });
  const dl = w.pos - 60 - S.pos;
  if (!gh && !FIRE() && w.kind === 'fork' && w.set === 'G' && dl > NEAR + 0.3 && dl < DMAX) list.push({ d: dl, draw: d => {
    const [x0, y0] = P(-2.5, 0.2, d), [x1, y1] = P(-1.9, -0.4, d);
    g.fillStyle = '#111'; g.fillRect(Math.round(x0) - 1, Math.round(y0) - 1, Math.round(x1 - x0) + 2, Math.round(y1 - y0) + 2);
    g.fillStyle = '#ffd400'; g.fillRect(Math.round(x0), Math.round(y0), Math.max(1, Math.round(x1 - x0)), Math.max(1, Math.round(y1 - y0)));
    const hp = y1 - y0; if (hp > 5) { g.fillStyle = '#111'; g.textAlign = 'center'; g.font = `${Math.min(30, Math.round(hp * 0.95))}px VT323, monospace`; g.fillText('30', (x0 + x1) / 2, y0 + hp * 0.82); }
  } });
  // levier de manœuvre (aiguille en panne)
  if (w.kind === 'manual' && dA > NEAR + 0.3 && dA < DMAX) list.push({ d: dA, draw: d => {
    const [bx, by] = P(1.6, yf, d), [, ty] = P(1.6, -1.3, d), s = F / d;
    g.fillStyle = '#e0a020'; g.fillRect(Math.round(bx - 0.3 * s), Math.round(ty + 0.4 * s), Math.max(1, Math.round(0.6 * s)), Math.max(1, Math.round(by - ty - 0.4 * s)));
    seg(bx, ty + 0.4 * s, bx + (w.done ? 0.3 : -0.3) * s, ty, Math.max(1, 0.08 * s), '#d8d8d8');
    if (!w.done && Math.floor(S.t * 3) % 2) glow(bx, ty, Math.min(30, 1.5 * s), '255,180,60', 0.4);
  } });
}
const SIG_FLARES = [];
function drawSigHead(d, st) {
  // signal sur potence, décollé du piédroit, à sa taille réelle ; seuls les feux restrictifs (rouge, jaune)
  // gardent un halo renforcé, redessiné après les phares, pour être repérés de loin
  const sc = F / d, xs = -1.45;
  const [bx, by] = P(xs, -2, d), [, ty] = P(xs, 1.45, d);
  const hw = Math.max(2, Math.round(0.8 * sc)), hh = Math.max(4, Math.round(1.6 * sc));
  const X = Math.round(bx - hw / 2), Y = Math.round(ty), lr = Math.max(0.7, hw * 0.3);
  const pw = Math.max(1, Math.round(0.12 * sc));
  g.fillStyle = '#3a3e48'; g.fillRect(Math.round(bx - pw / 2), Y + hh, pw, Math.max(0, Math.round(by - Y - hh)));
  if (hw >= 5) { const m = Math.max(1, Math.round(hw * 0.15)); g.fillStyle = '#d8d8d8'; g.fillRect(X - m, Y - m, hw + 2 * m, hh + 2 * m); }
  g.fillStyle = '#0e0f12'; g.fillRect(X, Y, hw, hh);
  const lamps = [['r', 0.2, '#ff2a2a', '#3a1414', '255,40,40'], ['y', 0.5, '#ffc21a', '#3a2c10', '255,190,30'], ['g', 0.8, '#3dff6a', '#103a1a', '60,255,100']];
  lamps.forEach(([k, fy, on, off, rgb]) => {
    const lx = X + hw / 2, ly = Y + hh * fy, lit = st === k;
    g.fillStyle = lit ? on : off; g.beginPath(); g.arc(lx, ly, lr, 0, 7); g.fill();
    if (!lit) return;
    glow(lx, ly, Math.min(40, lr * 4), rgb, 0.4);
    if (k !== 'g') {
      SIG_FLARES.push([lx, ly, lr, rgb, on]);
      if (d < 70) for (const rx of [-0.72, 0.72]) { const [rxp, ryp] = P(rx, -1.88, d + 1); glow(rxp, ryp, Math.min(26, 1.3 * sc), rgb, 0.25); }   // reflet sur les rails
    }
  });
}
function sfxHorn() {
  if (!AC) return;
  const t = AC.currentTime;
  [311, 370].forEach(f => {
    const o = AC.createOscillator(), gn = AC.createGain(), fl = AC.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 1400;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.06, t + 0.04);
    gn.gain.setValueAtTime(0.06, t + 0.6); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    o.connect(fl).connect(gn).connect(AC.destination); o.start(t); o.stop(t + 0.8);
  });
}

const TRAF_REF = 100;   // voyageurs « normaux » par quai et par unité d affluence (relevé avec les quais plus garnis)
const platCap = st => FIRE() ? Math.min(300, Math.round(st.aff * 160 + 50)) : Math.min(170, Math.round(st.aff * 95 + 25));
const waitingHere = () => S.phase !== 'drive' && S.mode === 'running' ? S.mp.filter(m => m.st === 'walk').length : 0;
function traffic() {
  // saturation de toute la ligne : les quais déjà desservis comptent comme dégagés,
  // donc chaque voyageur embarqué fait baisser durablement la barre
  let w = 0, ref = 0;
  STATIONS.forEach((st, i) => { ref += st.aff * TRAF_REF; if (i >= S.next) w += st.people.length; });
  w += waitingHere();
  return ref ? w / ref : 0;
}
const trafState = t => t < 0.4 ? ['FLUIDE', '#7dff8a'] : t < 0.7 ? ['DENSE', '#ffd75e'] : t < 0.9 ? ['SATURÉ', '#ffb35e'] : ['CRITIQUE', '#ff4a3a'];
