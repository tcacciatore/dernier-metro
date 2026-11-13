// Dernier Métro · Quai : voyageurs, portes, montée et descente, remplissage des voitures
// ---------- Rétro (passagers vus dans le rétroviseur) ----------
function setupMirror(st) {
  if (!S.tipCars && S.tuto < 0 && STATIONS.indexOf(st) > 0 && STATIONS.indexOf(st) < STATIONS.length - 1) { S.tipCars = true; setTimeout(() => { if (S.mode === 'running' && S.phase !== 'drive') msg('Astuce : touches 1 à 5 pour fermer (ou rouvrir) les portes d\'une seule voiture. La touche est affichée en bas de chaque caméra.', '#ffd75e', 7); }, 1200); }
  S.mp = []; S.carShut = [false, false, false, false, false];
  const si = STATIONS.indexOf(st), last = si === STATIONS.length - 1;
  // descente : une part de la rame, plus forte dans les grosses stations, tout le monde au terminus
  if (last && FIRE()) {   // abri : un défilé de voyageurs à l'écran, le décompte exact est tenu par updateUnload
    const nv = Math.min(S.load, 80), step = unloadDur(S.load) / Math.max(1, Math.ceil(nv / DOORS.length));
    for (let i = 0; i < nv; i++) { const door = DOORS[i % DOORS.length];
      S.mp.push(Object.assign(mkPerson(0, 0), { st: 'out', cosm: true, door, z: door, x: 0.1, sp: 1.3 + Math.random() * 0.4, t: 0.3, delay: 0.4 + Math.floor(i / DOORS.length) * step + Math.random() * 0.2, walk: 0 })); }
    st.res.out = S.load; return;
  }
  const nOut = si === 0 ? 0 : last ? S.load : FIRE() ? 0 : Math.min(S.load, Math.round(S.load * (0.2 + 0.16 * st.aff) + 3 + Math.random() * 5));
  const perDoor = {}, left = S.cars.slice();
  for (let i = 0; i < nOut; i++) {
    // on choisit une voiture au prorata de son remplissage
    const tot = left.reduce((a, b) => a + b, 0); if (tot <= 0) break;
    let rr = Math.random() * tot, c = 0; while (rr >= left[c]) { rr -= left[c]; c++; }
    left[c]--;
    const door = c * 15 + (Math.random() < 0.5 ? 4 : 11); perDoor[door] = (perDoor[door] || 0) + 1;
    S.mp.push(Object.assign(mkPerson(0, 0), { st: 'out', door, z: door, x: 0.1, sp: 1.1 + Math.random() * 0.4,
      t: 0.4, delay: 0.9 + (perDoor[door] - 1) * 0.55 + Math.random() * 0.3, walk: 0 }));
  }
  st.res.out = nOut;
  if (last) return;
  st.people.forEach(pp => {
    const z = Math.min(76, Math.max(2.5, st.pos - pp.p));
    const door = DOORS.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a);
    S.mp.push(Object.assign({}, pp, { st: 'walk', door, z, x: Math.max(0.8, pp.x - 1.6), side: Math.random() < 0.5 ? -1 : 1,
      sp: 1.1 + Math.random() * 0.5, delay: 1 + Math.random() * (st.crowd ? 20 : 8 + 5 * st.aff), walk: 0 }));
  });
  st.res.offer += st.people.length; S.paxOffer += st.people.length;
  spawnGroups(st);
}
// ---------- Groupes à caser (service normal) ----------
// Un groupe prend plusieurs places et ne veut pas être séparé : il ne monte que dans une voiture qui a de la place
// pour tous. Devant une voiture trop pleine, il reste planté : il faut fermer cette voiture (touche 1 à 5)
// pour qu'il aille vers une autre. Bien casé : +20 en plus des +5 par voyageur.
const GROUPS = [
  { id: 'poussette', n: 3, w: 5, label: 'Poussette', pl: false },
  { id: 'touristes', n: 5, w: 4, label: 'Touristes', pl: true },
  { id: 'fanfare', n: 8, w: 1.3, label: 'Fanfare', pl: false },
];
const need = m => m.grp ? m.grp.n : 1;
function mkGroupMember(gid) {
  const p = mkPerson(0, 0);
  if (gid === 'touristes') Object.assign(p, { kind: 'adult', kid: null, acc: 'map', acc2: 'suitcase', hat: Math.random() < 0.6 ? 'cap' : p.hat });
  if (gid === 'fanfare') Object.assign(p, { kind: 'adult', kid: null, outfit: 'coat', c: '#9a1c1c', pants: '#1a1a22', hat: 'cap', acc: null, acc2: null, scarf: '#d4ac0d' });
  return p;
}
function spawnGroups(st) {
  const si = STATIONS.indexOf(st);
  if (FIRE() || st.zombie || si < 1 || si >= STATIONS.length - 1) return;
  let k = (Math.random() < 0.7 ? 1 : 0) + (st.aff > 1 && Math.random() < 0.35 ? 1 : 0);
  while (k-- > 0) {
    const tot = GROUPS.reduce((a, gq) => a + gq.w, 0); let r = Math.random() * tot, gq = GROUPS[0];
    for (const x of GROUPS) { if ((r -= x.w) < 0) { gq = x; break; } }
    const lead = mkGroupMember(gq.id);
    if (gq.id === 'poussette') Object.assign(lead, { kind: 'adult', kid: null, acc: 'stroller', slow: 0.85 });
    const z = pick([-2, 37, 79]) + Math.random() * 2, door = DOORS.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a);
    const fol = []; for (let i = 0; i < Math.min(4, gq.n - (gq.id === 'poussette' ? 2 : 1)); i++) fol.push(mkGroupMember(gq.id));
    S.mp.push(Object.assign(lead, { st: 'walk', door, z, x: 4.2, side: 1, sp: 1.0, delay: 3 + Math.random() * 10, walk: 0, grp: gq, fol }));
    st.res.offer += gq.n; S.paxOffer += gq.n;
  }
}
// un voyageur arrive sur le quai par un accès (escalier avant, milieu ou arrière)
function spawnArrival(st, extra) {
  if (!extra && S.mp.filter(m => m.st === 'walk').length >= (FIRE() ? 170 : 75)) return;
  const z = st.wts && Math.random() < 0.7 ? platformZ(st.wts) : pick([-2, 37, 79]) + Math.random() * 2;
  const door = DOORS.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a);
  S.mp.push(Object.assign(st.zombie ? mkZombie(0, 0) : mkPerson(0, 0), { st: 'walk', door, z, x: 4.2 + Math.random() * 0.6, side: Math.random() < 0.5 ? -1 : 1,
    sp: 1.2 + Math.random() * 0.6, delay: 0, walk: 0, fresh: true }, extra || {}));
  st.res.offer++; S.paxOffer++;
}
function planEvents(st) {
  const P = LN(), last = STATIONS.indexOf(st) === STATIONS.length - 1 || st.zombie || FIRE();   // fuite : plus de pickpocket ni de fêtard   // station infestée : ni pickpocket ni fêtard
  S.suspectAt = !last && Math.random() < P.suspect ? S.clock + 3 + Math.random() * 8 : -1;
  S.holderAt = !last && Math.random() < P.holder ? S.clock + 4 + Math.random() * 7 : -1;
  S.holderPending = false;
}
const SUSPECT_LOOK = { c: '#151518', pants: '#101012', hair: '#0a0a0a', hat: 'hood', outfit: 'hoodie', kind: 'adult', acc: null, acc2: null, kid: null, party: false, slow: 1, build: 1.02, shoe: '#e8e8e8', suspect: true };
// voix de synthèse du navigateur (annonces, radio) — ignorée si indisponible
function speak(text, opts = {}) {
  try {
    const ss = window.speechSynthesis; if (!ss) return;
    if (!text) { ss.cancel(); return; }
    const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = opts.rate || 1; u.pitch = opts.pitch || 1; u.volume = opts.vol || 0.7;
    const v = ss.getVoices().find(x => x.lang && x.lang.startsWith('fr')); if (v) u.voice = v;
    ss.speak(u);
  } catch (e) {}
}
const PCC_LINES = n => [`Ligne ${n}, à toutes les rames : trafic chargé, respectez les horaires.`, `P C C à rame douze, bien reçu, vous pouvez repartir.`, `Ligne ${n} : régulation en cours, espacement normal.`, `Rame sept, signalez-vous à l'approche du terminus.`, `Ligne ${n}, information voyageurs : affluence importante en station.`];
const PCC_FIRE = ['À toutes les rames… si quelqu\'un m\'entend… rejoignez l\'abri.', 'Ici le P C C… nous évacuons… bonne chance.', 'Rame sept… plus de réponse… ', 'Le feu a atteint la surface… ne vous arrêtez pas.'];
function pccChatter() {
  noise(0.25, 0.06, 'bandpass', 1800, 2); beep(1400, 0.05, 'square', 0.03);
  setTimeout(() => speak(pick(FIRE() ? PCC_FIRE : PCC_LINES(LN().num)), { rate: 1.15, pitch: 0.85, vol: 0.35 }), 250);
  setTimeout(() => noise(0.2, 0.05, 'bandpass', 1800, 2), 3800);
}
function chime() { [659, 523, 784].forEach((f, i) => beep(f, 0.35, 'sine', 0.06, i * 0.22)); }
// appel radio : diffusé dans toute la rame
function radioCall() {
  beep(1400, 0.05, 'square', 0.04); noise(0.3, 0.08, 'bandpass', 1800, 2);
  const sw = S.sw;
  if (sw && sw.kind === 'fork' && !sw.passed && !S.rev && sw.tgt !== sw.want && S.phase === 'drive') {
    msg(`Radio : « Prenez ${dirName(sw.want)}, utilisez votre sélecteur ← → »`, '#9fe0ff', 3.5); return;
  }
  if (S.malaise && S.malaise.shown && !S.malaise.called && !S.malaise.expired) {
    S.malaise.called = true; S.malaise.calledAt = S.malaise.t; S.score += 30;
    msg(`Radio : PCC prévenu, les secours attendent à ${STATIONS[S.next].name} (+30)`, '#7dff8a', 3.5); return;
  }
  const cb = S.cab;
  if (cb && cb.shown && !cb.called && !cb.expired && cb.type !== 'slip' && S.phase === 'drive' && S.next < STATIONS.length) {
    cb.called = true; cb.calledAt = cb.t; const nn = STATIONS[S.next].name, v = `V${cb.car + 1}`;
    const [pts, txt0] = {
      sick: [20, `Radio : agent de nettoyage à ${nn}, la ${v} y sera fermée à la montée`],
      fight: [20, `Radio : la sécurité attend la ${v} à ${nn}`],
      bag: [20, `Radio : inspection du bagage prévue à ${nn}`],
      vendor: [15, `📢 « La vente à la sauvette est interdite. » Il descendra à ${nn}`],
    }[cb.type];
    S.score += pts; msg(`${txt0} (+${pts})`, '#7dff8a', 4); return;
  }
  if (S.theft && S.theft.shown && !S.theft.expired && S.phase === 'drive') {      // alarme tirée pour le vol en cours
    S.suspects.forEach(x => x.pending = true); S.theft = null; S.score += 40;
    for (let i = 0; i < 4; i++) beep(i % 2 ? 660 : 990, 0.15, 'sawtooth', 0.05, i * 0.16);
    msg('Alarme donnée : le voleur sera arrêté à la prochaine station (+40)', '#7dff8a', 3.5); return;
  }
  const atStation = S.phase !== 'drive' && S.doors > 0.6;
  let did = false;
  const holds = S.mp.filter(m => m.holder && m.st === 'door');
  if (atStation && holds.length) {
    holds.forEach(m => { m.holder = false; m.t = 0.25; });
    S.score += 20 * holds.length; did = true;
    msg(`Radio : « Libérez les portes, s'il vous plaît ! » (+${20 * holds.length})`, '#9fe0ff', 3);
  }
  const sus = S.suspects.filter(x => !x.pending);
  if (sus.length) {
    did = true;
    if (atStation) {
      sus.forEach(x => {
        S.cars[x.car] = Math.max(0, S.cars[x.car] - 1); S.load = Math.max(0, S.load - 1);
        S.mp.push(Object.assign(mkPerson(0, 0), SUSPECT_LOOK, { st: 'out', door: x.car * 15 + 4, z: x.car * 15 + 4, x: 0.1, sp: 1.6, t: 0.3, delay: 0.6, walk: 0 }));
      });
      S.suspects = S.suspects.filter(x => x.pending);
      S.caught += sus.length; S.score += 50 * sus.length;
      msg(`Radio : « Individu signalé, veuillez descendre. » Débarqué ! (+${50 * sus.length})`, '#7dff8a', 3.5);
    } else {
      sus.forEach(x => x.pending = true); S.score += 25 * sus.length;
      msg(`Radio : individu signalé, débarqué à la prochaine station (+${25 * sus.length})`, '#9fe0ff', 3.5);
    }
  }
  if (!did) { S.score -= 10; msg('Radio : fausse alerte… (-10)', '#ff8a5b', 2.5); }
}
function pop(dz, text, col) {
  const car = Math.min(4, Math.floor(dz / 15)), [sx, sy] = CCTV[car];
  S.pops.push({ x: sx + (dz - car * 15 - CAM_CROP) * 112 / 15 * CAM_K, y: sy + 30 * CAM_K, text, col, t: 0 });
}
const doorBusyOut = dz => S.mp.some(o => o.door === dz && o.st === 'out');
const doorBusyIn = dz => S.mp.some(o => o.door === dz && o.st === 'door');
// files d'attente : de chaque côté de la porte, le long du quai, le centre laissé libre pour ceux qui descendent.
// Chacun garde le côté d'où il arrive et son rang (ordre d'arrivée) ; la tête de file monte par son vantail.
function rankQueues() {
  const Q = {};
  for (const m of S.mp) {
    if (m.st !== 'walk' || m.delay > 0 || m.halt) continue;
    if (m.qDoor !== m.door) { m.qDoor = m.door; m.qAt = undefined; m.qs = m.z < m.door ? -1 : 1; }   // nouvelle porte : on choisit son côté
    if (m.qAt === undefined && Math.abs(m.z - m.door) < 5 && m.x < 2.6) m.qAt = S.t + Math.random() * 0.01;
    (Q[m.door + '|' + m.qs] = Q[m.door + '|' + m.qs] || []).push(m);
  }
  for (const k in Q) Q[k].sort((a, b) => (a.qAt ?? 1e9 + Math.abs(a.z - a.door)) - (b.qAt ?? 1e9 + Math.abs(b.z - b.door))).forEach((m, i) => { m.qr = i; });
}
const laneBusy = (dz, side) => S.mp.some(o => o.door === dz && o.st === 'door' && o.lane === side);
function walkTo(m, tz, tx, dt) {
  const dz = tz - m.z, dx = tx - m.x, dd = Math.hypot(dz, dx), step = m.sp * (m.slow || 1) * dt;
  if (Math.abs(dz) > 0.02) m.dir = Math.sign(dz);
  if (dd <= step) { m.z = tz; m.x = tx; return true; }
  m.z += dz / dd * step; m.x += dx / dd * step; m.walk += dt * 10 * m.sp; return false;
}
function updateMirror(dt) {
  const open = S.doors > 0.6;
  rankQueues();
  for (const m of S.mp) {
    if (m.delay > 0) { if (open || m.st !== 'out') m.delay -= dt; continue; }
    if (m.st === 'walk') {
      if (!open || S.alerted) { m.halt = S.alerted; continue; }   // après le signal sonore : on ne monte plus
      const mc = carOf(m.door), shut = carShut(mc);
      if (shut || S.cars[mc] + need(m) > CAR_CAP || mc === S.dirtyCar) {
        // voiture pleine, fermée ou souillée : on cherche une porte d'une autre voiture
        const alt = DOORS.filter(dz => { const cc = carOf(dz); return S.cars[cc] + need(m) <= CAR_CAP && cc !== S.dirtyCar && !carShut(cc); }).sort((a, b) => Math.abs(a - m.z) - Math.abs(b - m.z))[0];
        // voiture fermée (ou souillée) : on file vers la porte ouverte la plus proche ; voiture pleine mais ouverte : on reste planté devant
        if ((shut || mc === S.dirtyCar) && alt !== undefined && Math.abs(alt - m.z) < 40) m.door = alt;
        else {
          m.halt = true;
          if (m.grp && !m.grpWarn && !shut) { m.grpWarn = true; msg(`${m.grp.label} (${m.grp.n} places) bloqué${m.grp.pl ? 's' : 'e'} devant V${mc + 1} : fermez-la (touche ${mc + 1}) pour ${m.grp.pl ? 'les' : 'la'} envoyer vers une voiture plus vide`, '#ffd75e', 4); }
          if (S.load >= CAP && !S.fullWarn) { S.fullWarn = true; msg('Rame pleine ! Plus personne ne peut monter', '#ff6b5b', 3); }
          if (Math.abs(m.x - 0.25) < 1.2) walkTo(m, m.z, 1.4, dt);   // recule du bord
          continue;
        }
      }
      m.halt = false;
      const qs = m.qs || 1, qr = m.qr || 0;
      if (!m.runner && (doorBusyOut(m.door) || laneBusy(m.door, qs) || qr > 0)) {
        // on laisse descendre, ou on attend son tour, rangé en file le long du quai (une place tous les 60 cm)
        walkTo(m, m.door + qs * (1.1 + 0.55 * qr), 0.45 + (qr % 2) * 0.35 + hsh(m.seed * 1000 | 0, 8) * 0.15, dt);
      } else if (walkTo(m, m.door + qs * 0.3, 0.25, dt)) {
        m.lane = qs; m.bz = m.door + qs * 0.3;   // monte par son vantail : deux flux en alternance
        m.st = 'door'; m.t = m.grp ? 0.3 + 0.2 * m.grp.n : 0.3;   // on monte vite (un groupe prend son temps)
        if (FIRE()) { const c = carOf(m.door), m0 = Math.max(12, carMean()), rc = S.cars[c] / m0; if (rc > 1.15) m.t = Math.min(2.4, 0.3 * (1 + 7 * (rc - 1.15))); }   // voiture surchargée : on s'y entasse au ralenti
        if (S.holderPending && !m.suspect) { S.holderPending = false; m.holder = true; m.t = 25; }   // fêtard qui retient la porte
      }
    } else if (m.st === 'door') {
      m.t -= dt;
      if (m.t <= 0 && m.fight) { m.st = 'gone'; continue; }
      if (m.t <= 0 && m.zombie) {
        m.st = 'in'; const c = carOf(m.door), lose = Math.min(S.cars[c], 6);
        S.cars[c] -= lose; S.load -= lose; S.lost += lose; S.score -= 40; STATIONS[S.cur].res.zbit = (STATIONS[S.cur].res.zbit || 0) + lose;
        pop(m.door, `☣ -${lose}`, '#9aff6a'); beep(140, 0.25, 'sawtooth', 0.06); noise(0.3, 0.2, 'bandpass', 400, 3);
        continue;
      }
      if (m.t <= 0 && !FIRE() && S.cars[carOf(m.door)] + need(m) > CAR_CAP) { m.st = 'walk'; m.x = 0.7; continue; }   // voiture pleine entre-temps : il repart vers la porte voisine
      if (m.t <= 0) {
        const nb = need(m);
        m.st = m.holder ? 'in' : 'inside'; m.t = 0.4; S.pax += nb; S.load += nb; S.cars[carOf(m.door)] += nb; S.score += 5 * nb; STATIONS[S.cur].res.board += nb;
        if (m.grp) { S.score += 20; S.grpOk = (S.grpOk || 0) + 1; msg(`${m.grp.label} casé${m.grp.pl ? 's' : 'e'} en V${carOf(m.door) + 1} ! (+${5 * nb + 20})`, '#7dff8a', 2); beep(660, 0.08, 'square', 0.04); beep(880, 0.08, 'square', 0.04, 0.09); beep(1320, 0.14, 'square', 0.04, 0.18); }
        if (m.suspect) S.suspects.push({ car: carOf(m.door), pending: false });
        if (S.pax >= LN().pax) mDone('pax');
        pop(m.door, m.grp ? `+${nb} ★` : m.runner ? '+5 ★' : '+1', m.runner || m.grp ? '#ffd75e' : '#7dff8a');
        beep(988, 0.05, 'square', 0.03); beep(1319, 0.09, 'square', 0.03, 0.05);   // « pièce »
      }
    } else if (m.st === 'out') {
      if (!open) continue;
      m.t -= dt; m.x = Math.min(0.5, m.x + dt);
      if (m.t <= 0 && m.extra) { m.st = 'leave'; m.tz = -4; m.tx = 3.2; m.sp = 1.1; continue; }
      if (m.t <= 0 && m.cosm) { m.st = 'leave'; m.tz = Math.random() < 0.5 ? -4 : 82; m.tx = 2.8 + Math.random() * 1.6; m.sp = 1.3 + Math.random() * 0.4; continue; }
      if (m.t <= 0) { m.st = 'leave'; S.load = Math.max(0, S.load - 1); S.cars[carOf(m.door)] = Math.max(0, S.cars[carOf(m.door)] - 1); S.out++; pop(m.door, '-1', '#7fd4ff');
        m.tz = Math.random() < 0.5 ? -4 : 82; m.tx = 2.8 + Math.random() * 1.6; m.sp = 1.2 + Math.random() * 0.4; }
    } else if (m.st === 'inside') {   // il s'enfonce dans la voiture et disparaît dans la foule
      m.t -= dt; m.walk += dt * 8; if (m.t <= 0) m.st = 'gone';
    } else if (m.st === 'leave') {
      if (Math.abs(m.x - m.tx) > 0.05) walkTo(m, m.z + Math.sign(m.tz - m.z) * 0.3, m.tx, dt);
      else if (walkTo(m, m.tz, m.tx, dt)) m.st = 'gone';
    }
  }
  S.mp = S.mp.filter(m => m.st !== 'in' && m.st !== 'gone');
}
const busyDoor = () => DOORS.find(dz => doorState(dz) === 2);   // porte où un voyageur est dans l'encadrement
const blocked = () => busyDoor() !== undefined;
