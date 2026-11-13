// Dernier Métro · Arrivée en station, tutoriels, horaire, train précédent, veille, game over
// ---------- Logique ----------
function arrive(st, err) {
  windZombiesBoard();   // zombies encore agrippés au pare-brise : ils entrent dans la rame
  S.v = 0; S.cur = STATIONS.indexOf(st); S.next = S.cur + 1;
  const r = st.res; const dt = Math.round(S.entryDelta !== null ? S.entryDelta : S.clock - st.arr);   // horaire mesuré à l'entrée à quai
  r.dt = dt; r.err = err;
  const ad = Math.abs(dt), ae = Math.abs(err);
  // la note ne juge QUE la précision de l'arrêt (avec tolérance) ; l'horaire est noté à part
  const prec = ae <= 0.5 ? 100 : Math.max(0, Math.round(100 - 25 * (ae - 0.5)));
  const punct = FIRE() ? 0 : ad <= 1 ? 100 : Math.max(0, 100 - 10 * (ad - 1));   // −10 par seconde d'écart (avance comme retard)
  let gr;
  if (ae <= 0.5) gr = { t: 'PARFAIT !', c: '#7dff8a', ok: true };
  else if (ae <= 1.5) gr = { t: 'TRÈS BIEN', c: '#9fe0ff', ok: true };
  else if (ae <= 3) gr = { t: 'CORRECT', c: '#ffd75e', ok: false };
  else gr = { t: 'RATÉ', c: '#ff6b5b', ok: false };
  gr.why = `Arrêt à ${ae.toFixed(1)} m ${err < 0 ? 'avant' : 'après'} la marque`;
  gr.time = dt > 2 ? [`Horaire : ${dt} s de retard`, ad > 8 ? '#ff6b5b' : '#ffd75e'] : dt < -2 ? [`Horaire : ${-dt} s d'avance`, ad > 8 ? '#ff6b5b' : '#ffd75e'] : ['Horaire : à l\'heure !', '#7dff8a'];
  if (FIRE()) { const fg = Math.round(fireGap()); gr.time = [`Vague de feu à ${fg} m`, fireCol(fg)]; r.fireGap = fg; }
  if (st.zombie) { gr.t = 'ZOMBIES !'; gr.c = '#9aff6a'; gr.ok = false; gr.time = ['Il ne fallait pas s\'arrêter ici !', '#9aff6a']; }
  S.combo = gr.ok ? S.combo + 1 : 0;
  S.pstreak = gr.t === 'PARFAIT !' ? S.pstreak + 1 : 0; if (S.pstreak >= 3) mDone('combo3');
  if (ae <= 1.5) { S.precCount++; if (S.precCount >= 5) mDone('precision5'); }
  if (dt > 5) mFail('retard0');
  const mult = Math.max(1, S.combo);
  S.base += punct + prec;
  r.pts = (punct + prec) * mult; r.grade = gr.t; r.mult = mult; S.score += r.pts;
  r.prec = prec; r.punct = punct; r.stars = { p: ae <= 1.5, t: FIRE() ? null : ad <= 2, v: null };
  S.trace.push([-err, 0]);
  S.fx = { gr, mult, pts: r.pts, prec, punct, stars: r.stars, ae, err, dt, trace: S.trace.slice(), t: 0 };
  if (gr.t === 'PARFAIT !') { [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.2, 'square', 0.06, i * 0.08)); beep(1568, 0.6, 'triangle', 0.07, 0.42); }
  else if (gr.t === 'RATÉ') [392, 330, 262].forEach((f, i) => beep(f, 0.22, 'sawtooth', 0.05, i * 0.14));
  else if (gr.ok) [523, 659, 784].forEach((f, i) => beep(f, 0.18, 'square', 0.05, i * 0.08));
  if (err > 3) pen(-20, 'Dépassement de la marque');
  if (ae > 3) {   // arrêt raté : plus de 3 m de la marque
    S.missed++;
    if (S.missed >= MISS_MAX && !FIRE()) gameOver(`${MISS_MAX} arrêts ratés`, 'Arrêtez-vous à moins de 3 m de la marque STOP.');
    else if (FIRE()) msg('Arrêt imprécis : les voyageurs courent jusqu\'aux portes', '#ffd75e', 3);
    else msg(`Arrêt raté : ${S.missed} / ${MISS_MAX} — au ${MISS_MAX}e, fin de partie`, '#ff6b5b', 4);
  }
  S.limit = 0; S.alarm = null; S.inc = null; S.theft = null; S.person = null; S.dog = null;
  if (S.blackout) { S.blackout = 0; msg('Éclairage rétabli', '#7dff8a', 2); }
  if (S.malaise && S.malaise.shown && st.zombie) { setTimeout(() => msg('Les secours ne peuvent pas intervenir dans une station infestée', '#ffb35e', 3), 900); }
  else if (S.malaise && S.malaise.shown) {
    const extra = S.malaise.called ? 8 : 15;
    S.medicT = extra; S.medicCar = S.malaise.car; S.medicKind = 'medic';   // l'intervention fait prendre du retard
    setTimeout(() => msg(`🚑 Secours à bord de la V${S.medicCar + 1} : intervention ${extra} s${S.malaise ? '' : ''}`, '#ff8a7a', 4), 900);
  }
  S.malaise = null;
  if (S.dirtyKeep && --S.dirtyLeft <= 0) { S.dirtyKeep = false; setTimeout(() => msg(`V${S.dirtyCar + 1} enfin nettoyée`, '#7dff8a', 3), 900); S.dirtyCar = -1; }
  const cb = S.cab, cbExtra = [];
  if (cb && cb.shown && cb.type === 'fight') {
    if (cb.called) setTimeout(() => msg(`🛡 La sécurité sépare les voyageurs de la V${cb.car + 1}`, '#7dff8a', 3.5), 900);
    else {   // la bagarre continue sur le quai : un des deux bloque une porte
      pen(-30, 'Bagarre non signalée');
      cbExtra.push(Object.assign(mkPerson(0, 0), cb.look2, { st: 'door', door: cb.car * 15 + 4, z: cb.car * 15 + 4, x: 0.25, t: 14, delay: 0, walk: 0, holder: true, fight: true }));
      setTimeout(() => msg(`La bagarre continue dans une porte de la V${cb.car + 1} ! A : appel radio`, '#ff6b5b', 4), 900);
    }
  }
  if (cb && cb.shown && cb.type === 'bag') {
    const ex = cb.called ? 6 : 12;
    if (!cb.called) pen(-50, 'Bagage abandonné non signalé');
    S.medicT = ex; S.medicCar = cb.car; S.medicKind = 'bag';
    setTimeout(() => msg(`🔎 Inspection du bagage en V${cb.car + 1} : ${ex} s${cb.called ? '' : ' (signalé trop tard)'}`, '#ffd75e', 4), 900);
  }
  if (cb && cb.shown && cb.type === 'slip') {
    if (cb.falls === 0) { S.score += 20; setTimeout(() => msg('Conduite souple : aucune chute dans la V' + (cb.car + 1) + ' (+20)', '#7dff8a', 3), 900); }
    else setTimeout(() => msg(`Sol nettoyé en V${cb.car + 1} (${cb.falls} chute${cb.falls > 1 ? 's' : ''})`, '#ffd75e', 3), 900);
  }
  if (cb && cb.shown && cb.type === 'vendor') {
    if (cb.called) {   // il descend avec son gros sac : sa porte reste occupée un moment
      cbExtra.push(Object.assign(mkPerson(0, 0), cb.look, { st: 'out', door: cb.car * 15 + 11, z: cb.car * 15 + 11, x: 0.1, t: 5, delay: 0, walk: 0, extra: true, sp: 1.1 }));
      setTimeout(() => msg(`Le vendeur descend en V${cb.car + 1}… avec son gros sac`, '#ffd75e', 3), 900);
    } else pen(-20, 'Vente à la sauvette : plaintes de voyageurs');
  }
  if (cb && cb.shown && cb.type === 'sick') {
    const c = cb.car; S.dirtyCar = c;
    if (cb.called) { S.dirtyKeep = false; S.cleanT = 8; setTimeout(() => msg(`🧹 Nettoyage de la V${c + 1} : personne n'y monte pendant 8 s`, '#ffd75e', 4), 900); }
    else { S.dirtyKeep = true; S.dirtyLeft = 2; pen(-40, 'Voyageur malade non signalé'); setTimeout(() => msg(`V${c + 1} souillée : personne n'y monte pendant 2 stations`, '#ff6b5b', 5), 900); }
  }
  S.cab = null;
  st.served = true; setupMirror(st); st.people = [];
  if (st.zombie) { st.res.zstop = true; setTimeout(() => msg('☣ ZOMBIES ! Fermez les portes tout de suite (⏎) : chaque zombie qui monte contamine 6 voyageurs !', '#9aff6a', 5), 600); for (let i = 0; i < 4; i++) beep(i % 2 ? 300 : 200, 0.15, 'sawtooth', 0.06, i * 0.18); }
  planEvents(st);
  S.mp.push(...cbExtra);
  // pickpockets restés à bord : vol signalé, ou débarquement prévu par radio
  S.suspects.forEach(x => {
    S.mp.push(Object.assign(mkPerson(0, 0), SUSPECT_LOOK, { st: 'out', door: x.car * 15 + 11, z: x.car * 15 + 11, x: 0.1, sp: 1.6, t: 0.3, delay: 1, walk: 0 }));
    S.cars[x.car] = Math.max(0, S.cars[x.car] - 1); S.load = Math.max(0, S.load - 1);
    if (x.pending) { S.caught++; msg(`Agents en station : individu de la V${x.car + 1} débarqué`, '#7dff8a', 3); }
    else { pen(-60, `Vol à la tire signalé en voiture ${x.car + 1} !`); mFail('police'); }
  });
  S.suspects = [];
  S.phase = 'dwell'; S.alerted = false; S.doors = 0; S.fullWarn = false;
  sfxDing(); setTimeout(sfxDoorsOpening, 500);
  if (S.next < STATIONS.length) S.sigPos = null;
  if (S.next >= STATIONS.length && FIRE()) {
    S.saved = 0; S.endT = 99;   // la fin attend que tout le monde soit descendu
    S.unload = { tot: S.load, goal: S.load + fireLostNow(), n: 0, t: 0, done: false, dt: 0, rate: S.load / unloadDur(S.load), tick: -1 };   // goal : tous ceux qu'il fallait sauver (à bord + perdus)
    startBlast();   // final : fermer les portes blindées de l'abri en rythme, avant que la vague n'arrive
    msg('FERMEZ LES PORTES BLINDÉES : flèches en rythme !', '#ffb35e', 3);
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.25, 'square', 0.06, i * 0.12));
  }
  else if (S.next >= STATIONS.length) { S.endT = 9; msg('Fin de service à ' + st.name + ' : tout le monde descend.', '#ffd75e', 6); }
}

// ---------- Premier service guidé : une consigne à la fois, validée par l'action du joueur ----------
const TUTO = [
  { t: 'Plus vous restez, plus de voyageurs montent… mais le retard guette. En haut : quand partir.', k: '', done: () => S.tutoT > 4 && S.clock >= STATIONS[S.cur].dep - 1 },
  { t: 'C\'est l\'heure : appuyez sur SONNERIE (le bouton qui clignote en bas). Ensuite, plus personne ne monte.', k: 'P', done: () => S.phase === 'alert' || S.phase === 'closing' || S.phase === 'drive' },
  { t: 'Portes libres ? Appuyez sur FERMETURE. Voyant PORTES vert : vous pouvez partir.', k: '⏎', done: () => S.phase === 'drive' },
  { t: 'Maintenez Z pour accélérer (relâchez : le train roule sur sa lancée).', k: 'Z', done: () => S.v * 3.6 > 20 },
  { t: 'En haut, HORAIRE : arrivez pile à l\'heure. Bleu = trop tôt (ralentissez), rouge = en retard.', k: '', done: () => S.tutoT > 5 },
  { t: 'Freinez avec S pour garder le curseur blanc dans le vert. Plus vous appuyez longtemps, plus ça freine.', k: 'S', done: () => S.next < STATIONS.length && STATIONS[S.next].pos - S.pos < 25 },
  { t: 'Petites touches de S pour freiner un peu : arrêtez-vous pile sur la marque STOP.', k: 'S', done: () => S.phase !== 'drive' },
  { t: 'Bravo ! Chaque station vaut 3 étoiles : arrêt précis, à l\'heure, quai vidé.', k: '', done: () => S.tutoT > 6 },
  { t: 'Visez la médaille d\'or (8000 pts). Touche ? : aide et légendes. Bon service !', k: '?', done: () => S.tutoT > 6 },
];
// première fuite guidée (mode feu) : les consignes suivent ce qui arrive vraiment (défi du tunnel, station infestée…)
const tunnelTip = () => S.barr && !S.barr.broken ? ['BARRICADE DE ZOMBIES : foncez à fond (au moins 60 km/h) pour la briser !', 'Z']
  : S.sw && S.sw.kind === 'fork' ? ['AIGUILLAGE : appuyez sur ← ou → selon la flèche en haut à droite, avant le verrou.', S.sw.want === 'D' ? '←' : '→']
  : S.bends && S.bends.length ? ['VIRAGES : freinez (S) pour rester sous le profil vert dans le virage, sinon déraillement.', 'S']
  : ['Ligne droite : aucune limite, foncez !', 'Z'];
const TUTO_F = [
  { t: 'Une vague de feu vous poursuit ! Amenez un maximum de voyageurs jusqu\'à l\'abri du terminus.', k: '', done: () => S.tutoT > 6 },
  { t: 'À quai, les voyageurs montent tant que vous attendez… Mais regardez le panneau en bas à gauche : le feu approche.', k: '', done: () => S.tutoT > 7 },
  { t: 'Partez avant qu\'il soit trop près : SONNERIE (P), puis FERMETURE (Entrée).', k: 'P', done: () => S.phase === 'drive' && S.v > 0.5 || S.phase === 'closing' && S.tutoT > 1 },
  { t: 'Maintenez Z pour foncer. Plus la rame est chargée ou mal répartie, moins elle accélère (⚙ traction).', k: 'Z', done: () => S.v * 3.6 > 30 },
  { t: () => tunnelTip()[0], k: () => tunnelTip()[1], done: () => S.next < STATIONS.length && STATIONS[S.next].pos - S.pos < 140 || S.tutoT > 25 },
  { t: () => STATIONS[S.next] && STATIONS[S.next].zombie ? '☣ Station infestée de zombies : NE VOUS ARRÊTEZ PAS, traversez !' : 'Freinez avec S pour vous arrêter sur la marque STOP.', k: () => STATIONS[S.next] && STATIONS[S.next].zombie ? 'Z' : 'S', done: () => S.phase !== 'drive' || (STATIONS[S.cur] && STATIONS[S.cur].res.skipped && S.tutoT > 1) },
  { t: 'Touches 1 à 5 (en bas de chaque caméra) : fermer une voiture pour envoyer la foule vers les autres et équilibrer la rame.', k: '1', done: () => S.tutoT > 8 },
  { t: 'À chaque tunnel son défi : virages, aiguillages ou barricade. Au terminus, note sur 20. Touche ? : aide. Bonne fuite !', k: '?', done: () => S.tutoT > 8 },
];
const TUTOS = () => FIRE() ? TUTO_F : TUTO, TUTO_KEY = () => FIRE() ? 'dm_tuto_fire' : 'dm_tuto';
function updateTuto(dt) {
  if (S.tuto < 0) return;
  S.tutoT += dt;
  const L = TUTOS();
  if (L[S.tuto].done()) {
    S.tuto++; S.tutoT = 0; beep(1175, 0.08, 'sine', 0.05);
    if (S.tuto >= L.length) { S.tuto = -1; try { localStorage.setItem(TUTO_KEY(), '1'); } catch (e) {} }
  }
}
function drawTuto() {
  // bandeau en bas de l'écran, à la place de la ligne d'aide : ne masque ni la voie ni les caméras
  if (S.mode !== 'running' || S.tuto < 0) return;
  const L = TUTOS(), st = L[S.tuto], y = H - 11, h = 11, stT = typeof st.t === 'function' ? st.t() : st.t, stK = typeof st.k === 'function' ? st.k() : st.k;
  const pulse = 0.5 + 0.5 * Math.sin(S.t * 5);
  g.fillStyle = 'rgba(255,215,94,0.14)'; g.fillRect(0, y, W, h);
  g.fillStyle = `rgba(255,215,94,${0.4 + 0.6 * pulse})`; g.fillRect(0, y, W, 0.6);
  txt(`TUTO ${S.tuto + 1}/${L.length}`, 6, y + 7, 9, '#ffd75e');
  let x = 48;
  if (stK) {
    g.fillStyle = '#d8dce4'; g.fillRect(x, y + 0.5, 10, 7.5); g.fillStyle = '#9aa1ae'; g.fillRect(x, y + 7.2, 10, 0.8);
    txt(stK, x + 5, y + 6.6, 9, '#111', 'center'); x += 14;
  }
  txt(stT, x, y + 7, 11, '#ffffff', 'left', 'VT323', W - x - 6);
}

// ---------- Horaire : avance / retard par rapport à un train de référence parfaitement à l'heure ----------
// Le train de référence part à l'heure de départ, accélère (0,8 m/s²), roule, freine (1,2 m/s²)
// et arrive pile à l'heure. On compare l'instant présent à celui où il passe à notre position.
function refPos(D, T, tau) {
  const a = 1.4, b = 2.2, k = 1 / (2 * a) + 1 / (2 * b), disc = T * T - 4 * k * D;
  const vc = disc > 0 ? (T - Math.sqrt(disc)) / (2 * k) : T / (2 * k);
  const t1 = vc / a, t3 = vc / b, t2 = Math.max(0, T - t1 - t3);
  if (tau <= 0) return 0;
  if (tau < t1) return 0.5 * a * tau * tau;
  const x1 = 0.5 * a * t1 * t1;
  if (tau < t1 + t2) return x1 + vc * (tau - t1);
  const tb = Math.min(t3, tau - t1 - t2);
  return Math.min(D, x1 + vc * t2 + vc * tb - 0.5 * b * tb * tb);
}
// ---------- Train précédent : il suit l'horaire de référence avec un cycle d'avance (≈ une interstation) ----------
// À l'heure, il est trop loin pour être vu ; en avance, on le rattrape et il faut ralentir derrière lui.
const TRAIN_LEN = 75, GAP_MARGIN = 10, GAP_DECEL = 1.8;
function lineRefPos(tau) {                 // position d'un train parfaitement à l'heure (horaire de base) à l'instant tau
  const n = STATIONS.length;
  if (tau <= STATIONS[0].baseDep) return STATIONS[0].pos;
  for (let i = 0; i < n - 1; i++) {
    const A = STATIONS[i], B = STATIONS[i + 1];
    if (tau <= B.baseArr) return A.pos + refPos(B.pos - A.pos, B.baseArr - A.baseDep, tau - A.baseDep);
    if (tau <= B.baseDep) return B.pos;
  }
  const L = STATIONS[n - 1]; return L.pos + (tau - L.baseDep) * 10;   // part au garage après le terminus
}
const leadHead = () => (STATIONS[STATIONS.length - 1].baseArr - STATIONS[0].baseDep) / (STATIONS.length - 1) + 6;   // un cycle + 6 s : invisible tant qu'on est à l'heure
function updateLeader(dt) {
  if (FIRE()) {   // fuite : la voie devant est libre (mais le freinage d'urgence se relâche toujours à l'arrêt)
    S.gap = 999; S.vperm = 99;
    if (S.phase === 'drive' && S.ebrake) { S.v = Math.max(0, S.v - 6 * dt); if (S.v === 0) S.ebrake = false; }
    return;
  }
  S.gap = lineRefPos(S.clock + leadHead()) - TRAIN_LEN - S.pos;      // de notre avant à l'arrière du train précédent
  S.vperm = Math.sqrt(2 * GAP_DECEL * Math.max(0, S.gap - GAP_MARGIN));
  if (S.phase !== 'drive') { S.gapT = 0; return; }
  if (S.gap < 0.4 && S.v > 0.5) { gameOver('Collision avec le train précédent', 'Vous étiez trop en avance : respectez la vitesse limite (repère bleu).'); return; }
  if (S.gap < 0.5) S.pos = Math.min(S.pos, S.pos + S.gap - 0.5);
  if (S.ebrake) { S.v = Math.max(0, S.v - 6 * dt); if (S.v === 0 && S.gap > 4) S.ebrake = false; }
  if (S.gap < 2 && S.v > 0.3 && !S.ebrake) {
    S.ebrake = true; pen(-50, 'Freinage d\'urgence : train précédent trop proche !');
    for (let i = 0; i < 4; i++) beep(i % 2 ? 440 : 880, 0.15, 'square', 0.06, i * 0.16);
  }
  if (S.v <= S.vperm) S.gapArmed = true;
  if (S.v > S.vperm + 0.8 && !S.ebrake) {
    S.gapT += dt;
    if (S.gapT >= 1.2 && S.gapArmed) { S.gapT = 0; S.gapArmed = false; pen(-15, 'Trop près du train précédent : vous êtes en avance, ralentissez !'); }
  } else S.gapT = Math.max(0, S.gapT - dt);
}
function drawLeaderTail(d) {
  const yf = -2, xl = -1.35, xr = 1.35, yb = -1.62, yt = 1.45;
  const f = Math.min(1, 0.22 + 0.92 / (1 + (d / 24) * (d / 24)));
  const R = (x0, y0, x1, y1, col) => poly([[x0, y0, d], [x1, y0, d], [x1, y1, d], [x0, y1, d]], col);
  poly([[-1.3, yf + 0.01, d + 10], [1.3, yf + 0.01, d + 10], [1.3, yf + 0.01, d], [-1.3, yf + 0.01, d]], 'rgba(0,0,0,0.35)');
  R(-1.1, yf + 0.2, -0.6, yb + 0.05, sh([30, 30, 34], f)); R(0.6, yf + 0.2, 1.1, yb + 0.05, sh([30, 30, 34], f));
  R(xl, yb, xr, yt, sh([214, 220, 228], f));
  R(xl, yt - 0.12, xr, yt, sh([160, 168, 178], f));
  R(xl, yb, xl + 0.08, yt, sh([170, 176, 186], f)); R(xr - 0.08, yb, xr, yt, sh([170, 176, 186], f));
  R(xl, yb, xr, yb + 0.32, sh([46, 50, 58], f));
  R(xl, yb + 0.32, xr, yb + 0.4, sh([31, 95, 174], f));
  R(-1.12, 0.15, -0.32, 1.15, sh([24, 32, 46], f)); R(0.32, 0.15, 1.12, 1.15, sh([24, 32, 46], f));
  R(-0.26, -1.0, 0.26, 1.15, sh([180, 186, 196], f)); R(-0.2, 0.2, 0.2, 1.05, sh([24, 32, 46], f));
  for (const sd of [-1, 1]) {
    R(sd * 0.85 - 0.16, -0.95, sd * 0.85 + 0.16, -0.72, '#ff2a1a');
    const [lx, ly] = P(sd * 0.85, -0.83, d); glow(lx, ly, Math.min(60, 1.6 * F / d), '255,40,20', 0.45);
  }
  const [cx, cy] = P(-0.75, 1.32, d), r = Math.max(0.6, 0.1 * F / d);
  g.fillStyle = LN().col; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  if (r > 3) { g.fillStyle = LN().fg; g.font = `${Math.round(r * (LN().num.length > 1 ? 1.2 : 1.7))}px VT323, monospace`; g.textAlign = 'center'; g.fillText(LN().num, cx, cy + r * 0.6); }
}
// alerte trafic en conduite : seulement quand la ligne approche de la saturation
function drawTrafficWarn() {
  const t = S.trafShow; if (t < 0.7) return;
  const crit = t >= 0.85, p = 0.5 + 0.5 * Math.sin(S.t * (crit ? 9 : 4)), x = 30, y = 8, w = 74, h = 20;
  g.fillStyle = crit ? `rgba(${60 + Math.round(60 * p)},6,6,0.9)` : 'rgba(6,8,14,0.85)'; g.fillRect(x, y, w, h);
  g.strokeStyle = crit ? '#ff4a3a' : '#ffb35e'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt(crit ? 'LIGNE SATURÉE' : 'TRAFIC DENSE', x + w / 2, y + 8, 8, '#ffd0c8', 'center');
  g.fillStyle = '#20242e'; g.fillRect(x + 5, y + 12, w - 10, 4);
  g.fillStyle = crit ? '#ff4a3a' : '#ffb35e'; g.fillRect(x + 5, y + 12, (w - 10) * Math.min(1, t / TRAF_MAX), 4);
  txt(Math.round(t * 100) + '%', x + w - 4, y + 8, 8, '#ffffff', 'right');
}
// panneau « TRAIN DEVANT » : seulement quand il limite la vitesse
function drawLeaderPanel() {
  if (S.mode !== 'running' || S.phase !== 'drive' || S.vperm * 3.6 >= 66) return;
  const x = 146, y = 40, w = 66, h = 24, danger = S.v > S.vperm + 0.8 || S.gap < 15;
  const col = danger ? '#ff6b5b' : '#ffb35e';
  g.fillStyle = 'rgba(6,8,14,0.9)'; g.fillRect(x, y, w, h);
  g.strokeStyle = danger && Math.floor(S.t * 6) % 2 ? '#ff2a2a' : col; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt('TRAIN DEVANT', x + w / 2, y + 8, 8, '#8fa0b8', 'center');
  txt(`${Math.max(0, Math.round(S.gap))} m · max ${Math.round(S.vperm * 3.6)}`, x + w / 2, y + 19, 11, col, 'center', 'VT323', w - 4);
}
function scheduleDelta() {   // secondes : > 0 retard, < 0 avance
  if (S.phase !== 'drive' || S.next >= STATIONS.length) return null;
  const A = STATIONS[S.cur], Bs = STATIONS[S.next], D = Bs.pos - A.pos, T = Bs.arr - A.dep, x = S.pos - A.pos;
  if (x >= D - 0.05) return S.clock - Bs.arr;
  let lo = 0, hi = T;
  for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (refPos(D, T, m) < x) lo = m; else hi = m; }
  return S.clock - (A.dep + (lo + hi) / 2);
}
const schedState = d => Math.abs(d) <= 2 ? ['À L\'HEURE', '#7dff8a'] : d < 0 ? [`AVANCE ${Math.round(-d)} s`, '#4fc8ff'] : [`RETARD ${Math.round(d)} s`, '#ff6b5b'];
// pastille « HORAIRE » en haut du pare-brise
// consigne urgente uniquement (sinon rien) : en bas en conduite, en bandeau sur les caméras à quai
// effet tube cathodique : bruit, bande qui défile, scintillement, vignettage, coins arrondis, reflet du verre
function drawCRT(x, y, w, h, seed) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  // grain (neige)
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.08})`; g.fillRect(x + Math.random() * w, y + Math.random() * h, 0.8, 0.5); }
  // bande de balayage qui descend lentement
  const by = y + ((S.t * 18 + seed * 23) % (h + 24)) - 12;
  const bd = g.createLinearGradient(0, by - 6, 0, by + 6); bd.addColorStop(0, 'rgba(255,255,255,0)'); bd.addColorStop(0.5, 'rgba(255,255,255,0.07)'); bd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = bd; g.fillRect(x, by - 6, w, 12);
  // décalage chromatique sur les bords + scintillement
  g.fillStyle = 'rgba(255,40,40,0.05)'; g.fillRect(x, y, 1.2, h); g.fillStyle = 'rgba(40,120,255,0.05)'; g.fillRect(x + w - 1.2, y, 1.2, h);
  g.fillStyle = `rgba(0,0,0,${(Math.random() * 0.06).toFixed(3)})`; g.fillRect(x, y, w, h);
  // vignettage (tube bombé)
  const vg = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = vg; g.fillRect(x, y, w, h);
  // reflet du verre bombé
  const rf = g.createRadialGradient(x + w * 0.3, y + h * 0.2, 2, x + w * 0.3, y + h * 0.2, w * 0.6);
  rf.addColorStop(0, 'rgba(255,255,255,0.09)'); rf.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rf; g.fillRect(x, y, w, h);
  g.restore();
  // coins arrondis du tube : on remplit ce qui est entre le cadre et un rectangle arrondi
  if (g.roundRect) {
    g.save(); g.fillStyle = '#0d0f14'; g.beginPath(); g.rect(x - 1, y - 1, w + 2, h + 2); g.roundRect(x, y, w, h, 7); g.fill('evenodd'); g.restore();
  }
}
// barre d'informations à quai (au-dessus des caméras) : portes, heure et départ, remplissage
// retard prévu à l'arrivée si l'on partait maintenant (fermeture des portes + trajet le plus rapide)
function departForecast() {
  if (S.next >= STATIONS.length) return null;
  const st = STATIONS[S.cur], n = STATIONS[S.next];
  const closing = S.phase === 'closing' ? S.doors * 1.3 : 1.3;
  return S.clock + closing + playerFastestLeg(n.pos - st.pos) - n.arr;      // > 0 : retard prévu même à fond, < 0 : marge
}
// voyageurs qui attendent sur le quai, voiture par voiture
// touche 1 à 5 : fermer (ou rouvrir) les portes d'une seule voiture
function toggleCar(c) {
  if (!S.carShut) S.carShut = [false, false, false, false, false];
  if (S.doors < 0.5) return;
  if (!S.carShut[c] && S.mp.some(m => m.st === 'out' && carOf(m.door) === c)) { msg(`V${c + 1} : des voyageurs descendent encore`, '#ffb35e', 1.5); sfxBad(); return; }
  S.carShut[c] = !S.carShut[c];
  const f = Math.round(carRatio(c) * 100), st = FIRE() ? 'low' : carState(c);   // fuite : pas de dosage, on oriente seulement la foule
  if (S.carShut[c]) { beep(st === 'ok' ? 988 : 520, 0.08, 'square', 0.04); noise(0.2, 0.08, 'lowpass', 700, 0.8); msg(`V${c + 1} fermée ${FIRE() ? `(${S.cars[c]} à bord)` : `à ${f} %`}${st === 'ok' ? ' : dans le vert !' : ''}`, st === 'ok' ? '#7dff8a' : '#ffd75e', 1.6); }
  else { beep(660, 0.06, 'square', 0.04); msg(`V${c + 1} rouverte`, '#9fe0ff', 1.2); }
}
// au départ (service normal) : bilan du remplissage, voiture par voiture
function fillBilan() {
  let ok = 0, pts = 0;
  for (let c = 0; c < 5; c++) if (carState(c) === 'ok') { ok++; pts += 25; }
  if (ok === 5) pts += 100;
  S.score += pts; S.greenCars = (S.greenCars || 0) + ok; if (ok === 5) S.perfectFills = (S.perfectFills || 0) + 1;
  STATIONS[S.cur].res.greenCars = ok;
  if (ok === 5) { msg(`DOSAGE PARFAIT ! Les 5 voitures dans le vert (+${pts})`, '#7dff8a', 3.5); [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.12, 'square', 0.05, i * 0.08)); }
  else if (ok) msg(`${ok} voiture${ok > 1 ? 's' : ''} sur 5 dans le vert (+${pts})`, '#9fe0ff', 2.5);
}
function quaiCrowd() {
  const n = [0, 0, 0, 0, 0];
  S.mp.forEach(m => { if (m.st === 'walk') n[carOf(m.door)]++; });
  const free = [0, 1, 2, 3, 4].filter(c => S.cars[c] < CAR_CAP && c !== S.dirtyCar);
  const max = Math.max(...n), hi = n.indexOf(max);
  const lo = free.length ? free.reduce((a, b) => n[b] < n[a] ? b : a) : 0;
  return { n, max, hi, min: n[lo], lo };
}
function drawHint() {
  if (S.mode !== 'running' || S.tuto >= 0) return;
  let hint = '';
  const hold = S.mp.find(m => m.holder && m.st === 'door');
  if (S.vacAlert > 0) hint = 'VEILLE AUTOMATIQUE : appuyez sur ESPACE, sinon freinage d\'urgence !';
  else if (hold && S.holdT > 2.5) hint = `Quelqu'un retient la porte en V${carOf(hold.door) + 1} ! A : appel radio`;
  else if ((S.phase === 'dwell' || S.phase === 'alert') && S.alerted && blocked()) hint = `PORTE OCCUPÉE en V${carOf(busyDoor()) + 1} : attendez le cadre vert avant de fermer (⏎)`;
  else if (S.phase !== 'drive' && STATIONS[S.cur] && STATIONS[S.cur].zombie && S.next < STATIONS.length) hint = '☣ ZOMBIES À QUAI : fermez les portes (⏎), sans attendre la sonnerie !';
  else if (S.phase === 'dwell' && !FIRE() && !S.alerted && S.next < STATIONS.length && (() => { const c = [0, 1, 2, 3, 4].find(c => S.cars[c] >= CAR_CAP && !carShut(c) && S.mp.some(m => m.st === 'walk' && m.halt && carOf(m.door) === c)); return c !== undefined && (S.stuckCar = c, true); })()) hint = `V${S.stuckCar + 1} PLEINE : des voyageurs restent bloqués devant — touche ${S.stuckCar + 1} pour la fermer et les envoyer à la porte voisine`;
  else if (S.phase === 'dwell' && !FIRE() && !S.alerted && S.next < STATIONS.length && [0, 1, 2, 3, 4].some(c => carState(c) === 'ok' && !carShut(c))) { const c = [0, 1, 2, 3, 4].find(c => carState(c) === 'ok' && !carShut(c)); hint = `V${c + 1} dans le vert : touche ${c + 1} pour la fermer et garder le bon dosage`; }
  else if (S.phase === 'dwell' && FIRE() && !S.alerted && imbalance() > 0.12 && !carShut(heavyCar())) hint = `V${heavyCar() + 1} SURCHARGÉE : la montée y ralentit, traction −${Math.round(IMB_TRAC * imbalance() * 100)} % — touche ${heavyCar() + 1} pour la fermer et répartir la foule`;
  else if (S.phase === 'dwell' && !S.alerted && (() => { const c = quaiCrowd(); return c.max >= 10 && c.max >= 3 * c.min + 6; })()) {
    const c = quaiCrowd(); hint = `QUAI MAL RÉPARTI : foule en V${c.hi + 1}, V${c.lo + 1} presque vide — touche ${c.hi + 1} : fermer V${c.hi + 1} pour envoyer la foule ailleurs`;
  }
  else if (S.alarm) hint = 'ALARME : arrêtez le train 3 secondes';
  else if (S.medicT > 0) hint = `${S.medicKind === 'bag' ? 'INSPECTION DU BAGAGE' : 'SECOURS EN INTERVENTION'} en V${S.medicCar + 1} : portes ouvertes encore ${Math.ceil(S.medicT)} s`;
  else if (S.dog && S.dog.seen && ['sit', 'trot', 'run'].includes(S.dog.state)) hint = `CHIEN SUR LA VOIE à ${Math.max(0, Math.round(S.dog.pos - S.pos))} m : ralentissez et klaxonnez (K), ou arrêtez-vous`;
  else if (S.person && S.person.state === 'track' && S.person.seen) hint = 'PERSONNE SUR LA VOIE : freinez jusqu\'à l\'arrêt ou klaxonnez (K)';
  else if (S.cab && S.cab.shown && S.phase === 'drive' && S.cab.type === 'slip') hint = `SOL GLISSANT en V${S.cab.car + 1} : freinez en douceur, par petites touches sur S`;
  else if (S.cab && S.cab.shown && !S.cab.called && S.phase === 'drive') hint = { sick: 'VOYAGEUR MALADE', fight: 'BAGARRE', bag: 'BAGAGE ABANDONNÉ', vendor: 'VENDEUR À LA SAUVETTE' }[S.cab.type] + ` en V${S.cab.car + 1} : ` + { sick: 'A pour prévenir le PCC', fight: 'A pour appeler la sécurité', bag: 'A pour le signaler', vendor: 'A pour faire une annonce' }[S.cab.type];
  else if (S.malaise && S.malaise.shown) hint = `MALAISE en V${S.malaise.car + 1} : arrêt obligatoire à ${STATIONS[S.next].name}${S.malaise.called || S.malaise.expired ? '' : ' — A : prévenir le PCC'}`;
  else if (S.phase === 'drive' && STATIONS[S.next] && STATIONS[S.next].zombie) hint = `☣ ${STATIONS[S.next].name} INFESTÉE DE ZOMBIES : ne vous arrêtez pas, traversez !`;
  else if (S.phase === 'drive' && STATIONS[S.next] && STATIONS[S.next].closed) hint = `${STATIONS[S.next].name} FERMÉE : traversez sans arrêt, 30 km/h max`;
  else if (S.mg) hint = '';
  else if (S.rev) hint = 'MAUVAIS ITINÉRAIRE : retour en marche arrière';
  else if (S.sw && S.sw.kind === 'manual' && !S.sw.done && S.phase === 'drive' && !S.mg) hint = `AIGUILLE EN PANNE : arrêtez-vous avant le signal (${Math.max(0, Math.round(S.sw.sig - S.pos))} m)`;
  else if (S.sw && S.sw.kind === 'manual' && !S.sw.done && S.phase === 'drive') hint = `AIGUILLE EN PANNE à ${Math.max(0, Math.round(S.sw.sig - S.pos))} m : arrêtez-vous avant le signal rouge`;
  else if (S.sw && S.sw.kind === 'merge' && swRed() && S.phase === 'drive') hint = 'SIGNAL JAUNE : un train traverse votre voie, ralentissez pour arriver quand le signal passe au vert';
  else if (S.sw && S.sw.kind === 'fork' && S.sw.limOn) hint = S.v * 3.6 > 31 ? `VOIE DÉVIÉE : 30 km/h ! Déraillement au-delà de ${30 + DERAIL}` : 'VOIE DÉVIÉE : 30 km/h sur l\'aiguille';
  else if (S.phase === 'drive' && FIRE() && wzOn().length) hint = `☣ ZOMBIE${wzOn().length > 1 ? 'S' : ''} SUR LE PARE-BRISE : freinez franchement (S) pour ${wzOn().length > 1 ? 'les' : 'le'} décrocher, sinon ${wzOn().length > 1 ? 'ils entreront' : 'il entrera'} à la prochaine station`;
  else if (S.sw && S.sw.kind === 'fork' && S.sw.tot && S.sw.plan && S.sw.plan[S.sw.idx] && S.sw.passed && S.phase === 'drive' && S.sw.plan[S.sw.idx].set0 !== S.sw.plan[S.sw.idx].want) hint = `AIGUILLE SUIVANTE (${S.sw.idx + 1}/${S.sw.tot}) : appuyez dès maintenant sur ${S.sw.plan[S.sw.idx].want === 'D' ? '← DIRECT' : '→ DÉVIÉ'}, sinon signal rouge et freinage d'urgence`;
  else if (S.sw && S.sw.kind === 'fork' && !S.sw.passed && S.sw.pos - S.pos < 200 && S.phase === 'drive') hint = !S.sw.tgt ? `BIFURCATION : choisissez la direction ! ${S.sw.want === 'D' ? '← DIRECT' : '→ DÉVIÉ'}` : S.sw.tgt === S.sw.want ? `BIFURCATION : direction ${S.sw.want === 'D' ? 'DIRECTE' : FIRE() ? 'DÉVIÉE' : 'DÉVIÉE (30 km/h)'} sélectionnée${S.sw.fixT > 0 ? ', aiguille en mouvement…' : ''}` : `BIFURCATION : mauvaise direction sélectionnée ! ${S.sw.want === 'D' ? '← DIRECT' : '→ DÉVIÉ'}`;
  else if (S.barr && !S.barr.broken && !S.backup && S.phase === 'drive' && S.barr.pos - S.pos < 260) hint = `BARRICADE DE ZOMBIES à ${Math.max(0, Math.round(S.barr.pos - S.pos))} m : FONCEZ (Z) ! Au moins ${S.barr.need} km/h — vous : ${Math.round(S.v * 3.6)} km/h`;
  else if (bendHere() && S.v * 3.6 > bendHere().lim + 1) hint = `TROP VITE DANS LE VIRAGE ! Déraillement au-delà de ${Math.round(bendHere().lim + bendTol())} km/h : freinez (S)`;
  else if (derailEnv(S.pos) < 900 && S.v * 3.6 > derailEnv(S.pos) + 0.5 && S.phase === 'drive') hint = 'HORS DE LA ZONE VERTE ! Freinez (S) ou vous déraillez';
  else if (activeBend() && !bendHere()) hint = `VIRAGE à ${Math.round(activeBend().pos - S.pos)} m : ${activeBend().lim} km/h max, restez sous la courbe dans la zone verte`;
  else if (S.blackout) hint = FIRE() ? 'COUPURE D\'ÉCLAIRAGE : suivez la courbe et les bips' : 'COUPURE D\'ÉCLAIRAGE : suivez la courbe, les panneaux 50 / 25 / 10 et les bips';
  else if (S.sigRed > 0) hint = 'Signal rouge : attendez le vert';
  else if (S.limit && S.v * 3.6 > S.limit + 1) hint = `TROP VITE ! Au-delà de ${S.limit + DERAIL} km/h, la rame déraille : freinez (S)`;
  else if (S.limit) hint = `Travaux : ne dépassez pas ${S.limit} km/h, sinon risque de déraillement`;
  else if (S.ebrake) hint = 'FREINAGE D\'URGENCE : traction coupée jusqu\'à l\'arrêt';
  else if (S.phase === 'drive' && S.vperm * 3.6 < 66 && S.v > S.vperm - 0.5) hint = `Vous êtes en avance : train devant à ${Math.max(0, Math.round(S.gap))} m, ne dépassez pas ${Math.round(S.vperm * 3.6)} km/h`;
  if (!hint) return;
  if (S.phase === 'drive') txt(hint, W / 2, H - 3, 10, Math.floor(S.t * 3) % 2 ? '#ffb35e' : '#ffd08a', 'center', 'VT323', W - 20);
  else txt(hint, W / 2, H - 3, 10, Math.floor(S.t * 3) % 2 ? '#ffb35e' : '#ffd08a', 'center', 'VT323', W - 20);
}
function drawSchedChip() {
  if (S.mode !== 'running' || S.phase !== 'drive' || S.next >= STATIONS.length || S.entryDelta !== null) return;
  const d = S.schedShow, [lab, col] = schedState(d), x = 146, y = 8, w = 66, h = 30;
  const late = d > 2, urgent = d > 8, pulse = 0.5 + 0.5 * Math.sin(S.t * (urgent ? 9 : 5));
  g.fillStyle = late ? `rgba(${Math.round(40 + 60 * pulse * (urgent ? 1 : 0.5))},6,6,0.8)` : 'rgba(6,8,14,0.6)'; g.fillRect(x, y, w, h);
  g.strokeStyle = col; g.lineWidth = late ? 1.5 + pulse : 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt(urgent ? 'EN RETARD : FONCEZ !' : 'HORAIRE', x + w / 2, y + 8, 8, urgent ? (Math.floor(S.t * 4) % 2 ? '#ffffff' : '#ffb3a8') : '#8fa0b8', 'center', 'VT323', w - 4);
  txt(lab, x + w / 2, y + 18, 12, col, 'center', 'VT323', w - 6);
  // mini jauge : avance (bleu) ← à l'heure (vert) → retard (rouge), ±10 s
  const bx = x + 5, bw = w - 10, by = y + 22, map = v => bx + bw * (Math.max(-10, Math.min(10, v)) + 10) / 20;
  g.fillStyle = '#1d4a6a'; g.fillRect(bx, by, bw / 2, 4); g.fillStyle = '#6a1d1d'; g.fillRect(bx + bw / 2, by, bw / 2, 4);
  g.fillStyle = '#2f9a4a'; g.fillRect(map(-2), by, map(2) - map(-2), 4);
  g.fillStyle = '#ffffff'; g.fillRect(map(d) - 0.75, by - 1.5, 1.5, 7);
}

// ---------- Veille automatique (VACMA) : prouver régulièrement qu'on est vigilant ----------
function updateVacma(dt) {
  if (FIRE()) { S.vacAlert = 0; return; }   // fuite : pas de veille automatique
  if (S.phase !== 'drive' || S.v < 1 || S.ebrake || S.mg || S.rev) { if (S.phase !== 'drive') S.vacAlert = 0; return; }
  const w = S.sw;   // bifurcation ou grill d'aiguillages en cours : le conducteur a les mains occupées, la veille attend
  if (w && w.kind === 'fork' && (!w.passed || w.chain > 0) && w.pos - S.pos < 200) { S.vacAlert = 0; S.vacT = Math.max(S.vacT, 12); return; }
  if (S.vacAlert > 0) {
    S.vacAlert -= dt; S.vacBeep -= dt;
    if (S.vacBeep <= 0) { beep(1040, 0.12, 'square', 0.05); S.vacBeep = 0.4; }
    if (S.vacAlert <= 0) {
      S.vacAlert = 0; S.vacT = 30 + Math.random() * 10; S.ebrake = true;
      pen(-30, 'Veille automatique non acquittée : freinage d\'urgence');
    }
  } else {
    S.vacT -= dt;
    if (S.vacT <= 0) { S.vacAlert = 6.5; S.vacBeep = 0; }
  }
}
function vacmaAck() {
  if (S.vacAlert > 0) { S.vacAlert = 0; beep(660, 0.05, 'sine', 0.04); }
  S.vacT = 30 + Math.random() * 10;
}

// ---------- Fin de partie (game over) ----------
const MISS_MAX = 3, TRAF_MAX = 1.0, DERAIL = 20;   // déraillement au-delà de limite + 20 km/h
function gameOver(title, reason) {
  if (S.over || S.mode !== 'running') return;
  S.over = { title, reason, t: 0 };
  [motorGain, squealGain, rumbleGain, hissGain, whineGain].forEach(gn => gn && AC && gn.gain.setTargetAtTime(0, AC.currentTime, 0.05));
  speak(null);
  noise(0.9, 0.35, 'lowpass', 500, 0.7); [196, 165, 131, 98].forEach((f, i) => beep(f, 0.4, 'sawtooth', 0.07, 0.2 + i * 0.22));
}
function drawGameOver() {
  const o = S.over; if (!o) return;
  const k = Math.min(1, o.t / 0.6), flash = o.t < 0.5 && Math.floor(o.t * 12) % 2;
  if (S.fire && o.title.startsWith('Rattrapé')) {   // la vague engloutit la rame
    const kk = Math.min(1, o.t / 1.4);
    g.fillStyle = `rgba(255,${Math.round(200 - 120 * kk)},40,${0.5 * (1 - kk) + 0.1})`; g.fillRect(0, 0, W, H);
    flameWall(-10, W + 10, H + 4, H * (0.4 + 1.3 * kk), S.t, 3);
    g.fillStyle = `rgba(20,4,0,${0.6 * Math.max(0, (o.t - 1) / 1.2)})`; g.fillRect(0, 0, W, H);
  } else { g.fillStyle = flash ? 'rgba(255,40,20,0.55)' : `rgba(20,0,0,${0.75 * k})`; g.fillRect(0, 0, W, H); }
  if (o.t < 0.25) return;
  if (S.fire && o.title.startsWith('Rattrapé')) { g.fillStyle = 'rgba(12,3,0,0.72)'; g.fillRect(0, H / 2 - 32, W, 64); }
  txt('GAME OVER', W / 2, H / 2 - 12, 22, '#ff4a3a', 'center', '"Press Start 2P"');
  txt(o.title, W / 2, H / 2 + 10, 16, '#ffffff', 'center', 'VT323', W - 30);
  txt(o.reason, W / 2, H / 2 + 24, 12, '#ffb3a8', 'center', 'VT323', W - 30);
}
