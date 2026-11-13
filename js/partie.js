// Dernier Métro · Abri (mode feu), fin de service, boucle de mise à jour
// ---------- Abri (mode feu) : décompte des voyageurs à la descente, puis la note ----------
const unloadDur = n => Math.max(2.5, Math.min(7, n / 45));          // durée du décompte (s)
const fireLostNow = () => S.lost + STATIONS.reduce((a, st, i) => a + (i < STATIONS.length - 1 && !st.burnt && !st.zombie ? st.people.length : 0), 0);
const fireNote = (sv, lo) => sv + lo ? Math.round(20 * Math.min(1, 1.8 * sv / (sv + lo))) : 0;   // 55 % de sauvés = 20/20
const NOTE_LBL = n => n >= 20 ? ['HÉROS DU DERNIER MÉTRO', '#ffd75e'] : n >= 16 ? ['Mention très bien', '#7dff8a'] : n >= 12 ? ['Mention bien', '#b6ff7a'] :
  n >= 10 ? ['Passable', '#ffd75e'] : n >= 6 ? ['Insuffisant', '#ff9a5b'] : ['Catastrophe', '#ff4a3a'];
function updateUnload(dt) {
  const u = S.unload; if (!u || S.over) return;
  if (u.done) { u.dt += dt; return; }
  if (S.doors <= 0.6) return;                 // on attend l'ouverture des portes
  u.t += dt;
  const target = Math.min(u.tot, Math.floor(u.t * u.rate));
  while (u.n < target) {
    u.n++; S.load = Math.max(0, S.load - 1); S.saved = u.n; S.score += 10; S.out++;
    const c = S.cars.indexOf(Math.max(...S.cars)); S.cars[c] = Math.max(0, S.cars[c] - 1);
  }
  const tk = Math.floor(u.t * 18); if (u.n < u.tot && tk !== u.tick) { u.tick = tk; beep(1200 + 600 * u.n / Math.max(1, u.tot), 0.025, 'square', 0.02); }
  if (u.n >= u.tot && u.t > 1.2) {
    u.done = true; S.load = 0; S.cars = S.cars.map(() => 0); S.saved = u.tot;
    u.lost = fireLostNow(); u.note = fireNote(u.tot, u.lost); S.endT = 7; S.msgs = []; S.mp = S.mp.filter(m => m.st !== 'walk');
    const good = u.note >= 12;
    (good ? [523, 659, 784, 1047, 1319] : [392, 330, 262]).forEach((f, i) => beep(f, good ? 0.18 : 0.3, 'square', 0.06, 0.5 + i * (good ? 0.1 : 0.2)));
  }
}
function drawUnload() {
  const u = S.unload; if (!u || S.mode !== 'running' || S.over) return;
  const x = 138, w = W - 8 - x, y = 8, h = u.done ? 96 : 50;
  g.fillStyle = 'rgba(6,8,14,0.92)'; g.fillRect(x, y, w, h);
  g.fillStyle = '#7dff8a'; g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2);
  txt('ABRI ATTEINT · DÉCOMPTE DES VOYAGEURS', x + w / 2, y + 12, 12, '#7dff8a', 'center', 'VT323', w - 12);
  pixText(`${u.n} / ${u.tot}`, x + w / 2, y + 30, 10, u.done ? '#ffffff' : '#9fe0ff');
  const bw = w - 24, k = u.tot ? u.n / u.tot : 1;
  g.fillStyle = '#1b2232'; g.fillRect(x + 12, y + 37, bw, 5); g.fillStyle = '#7dff8a'; g.fillRect(x + 12, y + 37, Math.round(bw * k), 5);
  txt(u.done ? 'Tout le monde est descendu' : 'Les voyageurs descendent…', x + w / 2, y + 48, 11, '#8fa0b8', 'center');
  if (!u.done) return;
  const ratio = u.tot + u.lost ? Math.round(100 * u.tot / (u.tot + u.lost)) : 0;
  txt(`✔ ${u.tot} sauvés   † ${u.lost} perdus   (${ratio} %)`, x + w / 2, y + 60, 11, '#ffd0a8', 'center', 'VT323', w - 12);
  if (u.dt < 0.5) return;
  const [lbl, col] = NOTE_LBL(u.note), pop = Math.min(1, (u.dt - 0.5) * 4);
  txt('NOTE', x + 46, y + 80, 12, '#8fa0b8', 'center');
  pixText(`${u.note}/20`, x + w / 2, y + 82, Math.round(8 + 6 * pop), col);
  txt(lbl, x + w / 2, y + 92, 11, col, 'center', 'VT323', w - 12);
}
function finish() {
  S.mode = 'end';
  const avg = S.trafT ? S.trafSum / S.trafT : 0;
  S.trafAvg = avg; S.trafBonus = FIRE() ? 0 : Math.max(0, Math.round((1 - avg) * 300)); S.score += S.trafBonus;
  if (avg < 0.3) mDone('fluide'); else mFail('fluide');
  ['retard0', 'clean', 'police'].forEach(mDone);
  S.missions.forEach(m => { if (m.state === 'pending') m.state = 'fail'; });
  S.starsWon = S.missions.filter(m => m.state === 'done').length; STARS += S.starsWon; saveBest();
  if (S.score > BEST) { S.newRecord = true; BEST = S.score; saveBest(); }
  // médailles par catégorie
  const arr = STATIONS.filter((st, i) => i > 0 && st.res.stars), nA = arr.length;
  const punct = FIRE() ? null : nA ? arr.filter(st => st.res.stars.t).length / nA : 0;
  const sw = S.swN ? Math.max(0, 1 - (S.swBad || 0) / S.swN) : null;
  if (FIRE()) STATIONS.forEach((st, i) => { if (i < STATIONS.length - 1 && !st.burnt && !st.zombie && st.people.length) { st.res.lost = (st.res.lost || 0) + st.people.length; S.lost += st.people.length; st.people = []; } });   // quais abandonnés derrière nous
  if (FIRE()) S.note = fireNote(S.saved, S.lost);
  const vy = FIRE() ? (S.saved + S.lost ? Math.min(1, 1.8 * S.saved / (S.saved + S.lost)) : 0) :   // impossible de sauver tout le monde : 55 % vaut l'or
    0.5 * (S.paxOffer ? S.pax / S.paxOffer : 1) + 0.5 * secPct() / 100;
  S.cat = [catLevel(punct), catLevel(sw), catLevel(vy)]; S.catR = [punct, sw, vy];
  const id = modeId(LN().id), best = loadCat(id);
  S.catNew = S.cat.map((l, i) => l > best[i]);
  const nb = best.map((b, i) => Math.max(b, S.cat[i]));
  // classement des 5 meilleurs services de la ligne
  const top = loadTop(id), now = new Date(), ent = { s: S.score, d: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`, m: S.cat, k: Date.now() };
  top.push(ent); top.sort((a, b) => b.s - a.s); const t5 = top.slice(0, 5);
  S.rankPos = t5.indexOf(ent) + 1;     // 0 : hors classement
  try { localStorage.setItem('dm_top_' + id, JSON.stringify(t5)); localStorage.setItem('dm_cat_' + id, JSON.stringify(nb)); } catch (e) {}
}

function update(dt) {
  if (S.help || S.paused) return;        // jeu en pause (aide ou pause)
  if (S.over) {                          // game over : quelques secondes d'effet, puis l'écran de fin
    S.t += dt; S.over.t += dt;
    if (S.over.t > 2.6 && S.mode === 'running') { S.mode = 'end'; S.t = 0; }
    return;
  }
  S.t += dt;
  S.msgs.forEach(m => m.t += dt); S.msgs = S.msgs.filter(m => m.t < m.life);
  if (S.mode === 'title') {
    TITLE.t += dt; TITLE.sel += (LINE - TITLE.sel) * Math.min(1, dt * 12);
    const still = TITLE.stage === 0 && TITLE.t < INTRO_HIT;          // pendant l'arrivée de la rame, la caméra ne bouge pas
    S.pos = still ? S.pos : (S.pos + 9 * dt) % 1080; S.v = still ? 0 : 9;
    if (TITLE.stage === 1 && AC && !MUS) startMusic();
  }
  if (S.mode !== 'running') { if (AC) { [motorGain, squealGain, rumbleGain, hissGain, whineGain].forEach(gn => gn.gain.setTargetAtTime(0, AC.currentTime, 0.1)); crowdGain.gain.setTargetAtTime(S.mode === 'title' ? 0.015 : 0, AC.currentTime, 0.5); } return; }
  S.clock += dt;
  // les quais se remplissent en continu tant que la rame n'est pas passée
  STATIONS.forEach((st, i) => {
    if (st.closed) return;                 // station fermée par le PCC : personne n'y entre
    const here = i === S.cur && S.phase !== 'drive';
    if (FIRE() && (st.burnt || (st.served && !here) || S.unload)) return;   // fuite : quai déjà quitté ou englouti
    st.acc += dt * st.aff * PERIODS[PER].accMul * LN().acc * (FIRE() ? (here ? 1 : 0.13) : (here ? 0.8 : 0.07));   // à quai, des voyageurs descendent sans cesse des escaliers   // flux entrant : l'embarquement doit pouvoir le dépasser
    while (st.acc >= 1) {
      st.acc -= 1;
      if (here) spawnArrival(st);
      else if (st.people.length < platCap(st)) st.people.push((st.zombie ? mkZombie : mkPerson)(st.pos - 68 + Math.random() * 70, 2.3 + Math.random() * 3.4));
    }
  });
  const tr = traffic(); S.trafSum += tr * dt; S.trafT += dt;
  if (tr >= TRAF_MAX && !FIRE()) gameOver('Ligne saturée', 'Le trafic a atteint 100 % : trop de voyageurs laissés sur les quais.');
  if (tr >= 0.85 && !S.trafWarn && !FIRE()) { S.trafWarn = true; msg('⚠ Trafic critique : la ligne va saturer ! Embarquez un maximum de voyageurs', '#ff4a3a', 5); }
  if (tr < 0.8) S.trafWarn = false;
  S.trafShow += (tr - S.trafShow) * Math.min(1, dt * 3);
  S.trafDown = Math.max(0, S.trafDown - dt); if (tr < S.trafShow - 0.003) S.trafDown = 0.6;
  const lvl = tr < 0.4 ? 0 : tr < 0.7 ? 1 : tr < 0.9 ? 2 : 3;
  S.trafLvl = lvl; S.trafMsgT -= dt;
  if (S.radio > 0) S.radio = Math.max(0, S.radio - dt);
  if (S.theft && !S.theft.shown && S.phase === 'drive' && S.clock >= S.theft.at) {
    S.theft.shown = true; S.theft.t = 0;
    for (let i = 0; i < 6; i++) beep(i % 2 ? 520 : 780, 0.12, 'square', 0.05, i * 0.13);
  }
  if (S.theft && S.theft.shown) {
    S.theft.t += dt;
    if (!S.theft.expired && S.theft.t > CAM_WIN) { S.theft.expired = true; msg('Trop tard : le pickpocket s\'est fondu dans la foule', '#ff8a7a', 3); }
  }
  if (S.missionShow > 0) S.missionShow -= dt;
  if (S.phase === 'dwell' && S.suspectAt > 0 && S.clock >= S.suspectAt) { S.suspectAt = -1; spawnArrival(STATIONS[S.cur], Object.assign({}, SUSPECT_LOOK, { sp: 1.0 })); }
  if ((S.phase === 'dwell' || S.phase === 'alert') && S.holderAt > 0 && S.clock >= S.holderAt) { S.holderAt = -1; S.holderPending = true; }
  const holder = S.mp.find(m => m.holder && m.st === 'door');
  S.holdT = holder ? S.holdT + dt : 0;
  S.warnT -= dt; S.hintT -= dt; S.buzzT = Math.max(0, S.buzzT - dt);

  // conduite « comme une voiture » : Z = accélérateur, S = frein, tant qu'on appuie.
  // Le frein serre progressivement (maximum en 0,5 s) et se desserre dès qu'on relâche :
  // une petite touche freine un peu, un appui long freine fort.
  const kZ = keyTraction(), kS = keyBrake();
  S.brakeF = kS ? Math.min(1, Math.max(0.2, S.brakeF + dt / 0.3)) : 0;   // serre en 0,3 s
  const Z = kZ && !kS, B = kS;
  let a = 0;
  if (Z && (S.mg || S.rev || S.backup)) { if (S.warnT <= 0) { msg(S.mg ? 'Terminez la manœuvre de l\'aiguille d\'abord' : 'Retour en marche arrière en cours…', '#ffb35e'); S.warnT = 2; } }
  else if (Z) {
    if (S.phase === 'drive' && !S.ebrake) a += (2.4 - 0.8 * S.v / VMAX) * tractionF();   // traction : forte au démarrage, un peu moins à pleine vitesse (fuite : alourdie par la charge)
    else if (S.warnT <= 0) { msg('Fermez d\'abord les portes !', '#ff6b5b'); S.warnT = 2; }
  }
  if (B) a -= BRAKE_MAX * S.brakeF;
  a -= 0.02 + 0.0004 * S.v * S.v;
  S.v = Math.min(VMAX, Math.max(0, S.v + a * dt));
  S.pos += S.v * dt;
  updateTuto(dt);
  updateEvents(dt);
  updateSwitch(dt); updateBends(dt); updateFire(dt); updateBarricade(dt);
  updateReverse(dt);
  updateManual(dt);
  updateLeader(dt);
  updateVacma(dt);
  if (S.hornT > 0) S.hornT -= dt;
  // échanges radio du PCC en fond, de temps en temps pendant la conduite
  if (S.phase === 'drive' && !S.over) { S.radioT -= dt; if (S.radioT <= 0) { S.radioT = 45 + Math.random() * 40; pccChatter(); } }
  // tic-tac de l'horloge quand le retard dépasse 5 s : de plus en plus rapide
  if (S.phase === 'drive' && S.entryDelta === null && S.schedShow > 5) {
    S.tickT -= dt;
    if (S.tickT <= 0) { beep(S.tickHi ? 2100 : 1700, 0.018, 'square', 0.025); S.tickHi = !S.tickHi; S.tickT = Math.max(0.25, 1 - (S.schedShow - 5) * 0.05); }
  } else S.tickT = 0;
  if (S.medicT > 0 && S.phase !== 'drive') S.medicT = Math.max(0, S.medicT - dt);
  if (S.cleanT > 0 && S.phase !== 'drive') {   // nettoyage terminé : la voiture rouvre à la montée
    S.cleanT = Math.max(0, S.cleanT - dt);
    if (S.cleanT === 0 && !S.dirtyKeep) { msg(`V${S.dirtyCar + 1} nettoyée : la montée reprend`, '#7dff8a', 2.5); S.dirtyCar = -1; }
  }
  const sd = scheduleDelta();
  if (sd !== null) S.schedShow += (sd - S.schedShow) * Math.min(1, dt * 4);
  // entrée à quai : le train est considéré comme arrivé, l'écart horaire est figé
  const stN = STATIONS[S.next];
  if (S.phase === 'drive' && sd !== null && S.entryDelta === null && stN && !stN.closed && S.pos >= stN.pos - PL) {
    S.entryDelta = sd;
    const [lab, col] = schedState(sd);
    if (!FIRE()) msg(`Entrée à quai : ${Math.abs(sd) <= 2 ? 'pile à l\'heure !' : lab.toLowerCase()}`, col, 2.5);
  }
  // trace vitesse / distance de l'approche (un point tous les 50 cm)
  if (S.phase === 'drive' && S.next < STATIONS.length) {
    const dm = STATIONS[S.next].pos - S.pos;
    if (dm <= CURVE_D) {
      const last = S.trace[S.trace.length - 1];
      if (!last || last[0] - dm >= 0.5) S.trace.push([dm, S.v * 3.6]);
    }
  }
  if (S.phase === 'drive') traceBend();
  // bips de proximité dans les 3 derniers mètres (son continu pile sur la marque)
  if (S.phase === 'drive' && S.next < STATIONS.length && S.v > 0.05) {
    const dm = STATIONS[S.next].pos - S.pos;
    if (dm < 3 && dm > -1.5) {
      S.beepT -= dt;
      if (S.beepT <= 0) {
        const on = Math.abs(dm) < 0.25;
        beep(on ? 1320 : 990, on ? 0.07 : 0.035, 'sine', 0.045);
        S.beepT = on ? 0.06 : 0.09 + Math.abs(dm) * 0.22;
      }
    } else S.beepT = 0;
  }

  // stations
  if (S.phase === 'drive' && S.next < STATIONS.length) {
    const st = STATIONS[S.next], err = S.pos - st.pos;
    if (st.closed) {
      // station fermée : traversée à 30 km/h maximum, sans s'arrêter
      S.limit = S.pos > st.pos - PL - 30 && S.pos < st.pos + PE ? 30 : 0;
      if (S.v === 0 && err > -PL && err <= PE && S.hintT <= 0) { msg('Station fermée : ne vous arrêtez pas, continuez !', '#ffb35e'); S.hintT = 3; }
      if (err > PE + 1) {
        S.cur = S.next; st.served = true; st.res.closed = true; S.limit = 0;
        S.score += 50; msg(`Station ${st.name} traversée selon l'ordre du PCC (+50)`, '#7dff8a', 3);
        S.next++;
        if (S.next >= STATIONS.length) S.endT = 3; else startLeg();
      }
    }
    else if (S.v === 0 && err >= -5 && err <= PE) arrive(st, err);
    else if (S.v === 0 && err < -5 && err > -45 && S.hintT <= 0) { msg('Avancez jusqu\'à la marque d\'arrêt', '#ffd75e'); S.hintT = 3; }
    else if (err > PE + 1) {
      S.cur = S.next; st.res.skipped = true; st.served = true;
      if (st.zombie) { S.score += 50; st.res.zok = true; msg(`☣ ${st.name} traversée sans arrêt : les zombies restent sur le quai (+50)`, '#9aff6a', 3.5); }
      else if (FIRE()) msg(`${st.name} passée sans arrêt : ${st.people.length} voyageurs restent sur le quai`, '#ff8a5b', 3.5);
      else pen(-100, `Station ${st.name} brûlée !`);
      if (!FIRE()) S.missed++;
      if (S.missed >= MISS_MAX && !FIRE()) gameOver(`${MISS_MAX} arrêts ratés`, `Station ${st.name} brûlée.`);
      if (S.malaise && S.malaise.shown) { pen(-80, 'Malaise voyageur : arrêt obligatoire non respecté !'); S.malaise = null; }
      S.next++;
      if (S.next >= STATIONS.length) S.endT = 3;
      else if (!S.over) { if (!FIRE()) msg(`Station brûlée : arrêt raté ${S.missed} / ${MISS_MAX}`, '#ff6b5b', 3.5); startLeg(); }   // nouvelle interstation : l'horaire et la courbe repartent
    }
  }

  // portes
  if (S.phase === 'dwell' || S.phase === 'alert') S.doors = Math.min(1, S.doors + dt / 0.8);
  if (S.phase === 'closing') {
    if (blocked()) {
      pen(-30, `Voyageur coincé dans une porte de V${carOf(busyDoor()) + 1} ! Réouverture`); sfxDoorBump();
      S.phase = 'dwell'; S.alerted = false;
    } else {
      S.doors -= dt / 1.3;
      if (S.doors <= 0) {
        const stayers = S.mp.filter(m => m.st === 'walk'), left = stayers.length, cst = STATIONS[S.cur];
        cst.people = stayers.map(m => Object.assign(mkPerson(cst.pos - m.z, Math.min(5.8, m.x + 1.8)), lookOf(m)));
        const res = STATIONS[S.cur].res; res.left = left;
        if (STATIONS[S.cur].name === busiestStation()) { if (left === 0) mDone('vide'); else mFail('vide'); }
        if (left > 0 && !FIRE()) S.score -= 5 * left;   // fuite : ceux qui restent sont comptés comme perdus, pas en points
        res.stars = Object.assign({ p: null, t: null }, res.stars || {}, { v: left === 0 });
        S.legPen = 0;
        S.pops = [];
        if (S.next < STATIONS.length && !FIRE()) fillBilan();
        S.carShut = null;
        S.doors = 0; S.phase = 'drive'; S.mp = []; S.departT = S.t; sfxDoor(); startLeg();
        if (S.next < STATIONS.length) { const nn = STATIONS[S.next].name; setTimeout(() => { if (S.mode === 'running' && !S.over) { chime(); setTimeout(() => speak(`Prochaine station : ${nn.replace(/ – /g, ', ')}.`, { vol: 0.6 }), 800); } }, 2500); }
        if (S.next < STATIONS.length && FIRE()) {
          msg(`${res.board} montés${left ? ', ' + left + ' laissés sur le quai' : ''} · vague à ${Math.round(fireGap())} m`, left ? '#ffd75e' : '#7dff8a', 3.5);
          const ib = imbalance();   // la répartition se paie (ou se récompense) au départ
          if (S.load >= 100 && ib < 0.08) { S.score += 40; S.balancedDeps = (S.balancedDeps || 0) + 1; setTimeout(() => msg('Rame bien équilibrée : pleine traction (+40)', '#7dff8a', 2.5), 900); }
          else if (ib > 0.2) setTimeout(() => msg(`Rame déséquilibrée : traction −${Math.round(IMB_TRAC * ib * 100)} %, et elle déraillera plus tôt dans les virages`, '#ff6b5b', 3.5), 900);
        }
        else if (S.next < STATIONS.length) {
          const fc = S.clock + playerFastestLeg(STATIONS[S.next].pos - cst.pos) - STATIONS[S.next].arr;
          const tm = fc > 0.5 ? `départ avec +${Math.ceil(fc)} s` : 'départ à l\'heure';
          msg(`${res.board} montés${left ? ', ' + left + ' laissés' : ''} · ${tm}`, fc > 0.5 ? '#ffb35e' : left ? '#ffd75e' : '#7dff8a', 3.5);
        }
        const st = STATIONS[S.cur], early = Math.round(st.dep - S.clock);
      }
    }
  }
  if (S.phase !== 'drive') updateMirror(dt);
  // vagues de voyageurs : autour de l'heure de départ, des groupes descendent des escaliers en courant.
  // Les attendre rapporte des voyageurs (+5 chacun) mais coûte du retard (−10 par seconde) : c'est tout le dilemme.
  if (S.phase === 'dwell' && S.endT < 0 && S.next < STATIONS.length && S.load < CAP) {
    const st = STATIONS[S.cur];
    S.waveT -= dt;
    if ((FIRE() ? S.clock > st.arr + 3 : S.clock > st.dep - 10) && S.waveT <= 0 && S.waves < (FIRE() ? 9 : 4)) {
      const z0 = pick([-2, 37, 79]), n = Math.round((4 + Math.random() * 5) * Math.min(1.6, 0.6 + st.aff * 0.4) * (FIRE() ? 2.5 : 1.6));
      for (let i = 0; i < n; i++) {
        const z = z0 + Math.random() * 3, door = DOORS.reduce((a, b) => Math.abs(b - z) < Math.abs(a - z) ? b : a);
        S.mp.push(Object.assign(mkPerson(0, 0), { kind: 'adult', kid: null, slow: 1, acc2: null }, st.zombie ? ZOMBIE_LOOK() : {}, { st: 'walk', door, z, x: 4 + Math.random() * 1.2, side: Math.random() < 0.5 ? -1 : 1,
          sp: 2.6 + Math.random() * 0.9, delay: Math.random() * 1.2, runner: true, walk: 0, fresh: true }));
        st.res.offer++; S.paxOffer++;
      }
      S.waves++; S.waveT = FIRE() ? 3.5 + Math.random() * 3 : 5 + Math.random() * 4;
      if (S.waves === 1 && st.zombie) msg('☣ Encore des zombies ! Fermez les portes !', '#9aff6a', 2.5);
      else if (S.waves === 1) msg(FIRE() ? `${n} voyageurs dévalent l'escalier : les attendre ? (vague à ${Math.round(fireGap())} m)` : `${n} voyageurs arrivent en courant : les attendre ?`, '#9fe0ff', 2.5);
    }
  }

  updateUnload(dt);
  if (S.mode === 'running') updateDebris(dt);
  if (S.endT > 0) { S.endT -= dt; if (S.endT <= 0) finish(); }

  // incidents
  if (S.fx) S.fx.t += dt;
  S.pops.forEach(p => p.t += dt); S.pops = S.pops.filter(p => p.t < 1);
  if (S.sigRed > 0) {
    S.sigRed -= dt;
    if (S.sigRed <= 0) { msg('Signal vert', '#7dff8a', 1.5); beep(880, 0.15, 'sine', 0.05); }
    else if (S.phase === 'drive' && S.pos > S.sigPos - 0.3) { S.sigRed = 0; pen(-50, 'Franchissement de signal rouge !'); }
  }
  if (S.limit && S.phase === 'drive' && S.v * 3.6 > S.limit + DERAIL) {
    gameOver('Déraillement', `Vous avez dépassé ${S.limit + DERAIL} km/h dans la zone limitée à ${S.limit} km/h.`);
  }
  if (S.limit && S.phase === 'drive' && S.v * 3.6 > S.limit + 1) {
    S.overT += dt;
    if (S.overT >= 1.5) { S.overT = 0; pen(-10, `Excès de vitesse (limite ${S.limit})`); }
  } else S.overT = Math.max(0, S.overT - dt);
  if (S.inc === 'alarm' && !S.alarm && S.phase === 'drive' && S.clock >= S.alarmAt && S.v > 2) {
    S.alarm = { t: 0, stop: 0 };
    msg('SIGNAL D\'ALARME ! Arrêtez-vous 3 s', '#ff6b5b', 4);
    for (let i = 0; i < 6; i++) beep(i % 2 ? 600 : 1000, 0.12, 'sawtooth', 0.04, i * 0.14);
  }
  if (S.alarm) {
    S.alarm.t += dt;
    if (S.v === 0) S.alarm.stop += dt; else S.alarm.stop = 0;
    if (S.alarm.stop >= 3) { msg('Alarme traitée, reprise du service', '#7dff8a'); S.alarm = null; S.inc = null; }
    else if (S.alarm.t > 9) { pen(-40, 'Alarme ignorée !'); S.alarm = null; S.inc = null; }
  }

  // sons
  if (AC) {
    const now = AC.currentTime;
    motor.frequency.setTargetAtTime(28 + S.v * 9, now, 0.05);
    motorGain.gain.setTargetAtTime(S.v > 0.2 ? (Z && S.phase === 'drive' ? 0.06 : 0.025) : 0, now, 0.1);
    squealGain.gain.setTargetAtTime(B && S.v > 0.05 && S.v < 4 ? 0.02 : 0, now, 0.05);
    const inSt = !!stationAt(S.pos);
    rumbleGain.gain.setTargetAtTime(Math.min(0.25, S.v / VMAX * (inSt ? 0.14 : 0.25)), now, 0.2);
    rumbleFilt.frequency.setTargetAtTime(120 + S.v * 12, now, 0.2);
    const toSt = S.next < STATIONS.length ? STATIONS[S.next].pos - S.pos : 999;   // le brouhaha du quai monte à l'approche
    const crowd = S.phase !== 'drive' ? Math.min(0.05, 0.008 + S.mp.length * 0.0007) : inSt ? 0.014 : toSt < 90 ? 0.014 * (1 - toSt / 90) : 0;
    whine.frequency.setTargetAtTime(180 + S.v * 40, now, 0.08);
    whineGain.gain.setTargetAtTime(S.phase === 'drive' && S.v > 0.3 ? (Z ? 0.022 : 0.008) * Math.min(1, S.v / 4) : 0, now, 0.15);
    crowdGain.gain.setTargetAtTime(crowd, now, 0.4);
    hissGain.gain.setTargetAtTime(B && S.v > 0.3 ? 0.02 : 0, now, 0.08);
    // claquements de rails (joints tous les 18 m, deux bogies)
    railAcc += S.v * dt;
    if (railAcc > 18) { railAcc -= 18; if (S.v > 1) { const gap = Math.min(0.4, 2.2 / S.v); noise(0.05, 0.12 + S.v / 80, 'lowpass', 1500, 0.8); noise(0.05, 0.1 + S.v / 90, 'lowpass', 1300, 0.8, gap); } }
  }
}
