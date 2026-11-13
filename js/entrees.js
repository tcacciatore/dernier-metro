// Dernier Métro · Clavier et pause
// ---------- Entrées ----------
addEventListener('keydown', e => {
  // chiffres : on lit la touche physique (sur un clavier AZERTY, « 1 » sans Maj donne « & »)
  const k = /^(Digit|Numpad)[0-9]$/.test(e.code || '') ? e.code.slice(-1) : e.key.toLowerCase();
  if (['enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (e.repeat && (k === 'p' || k === 'enter')) return;
  if (k === 'f' && !e.repeat) { toggleFullscreen(); return; }
  if (k === 'h' && !e.repeat) {
    HELP_SKULL = !HELP_SKULL;
    try { localStorage.setItem('dm_skull', HELP_SKULL ? '1' : '0'); } catch (err) {}
    msg(HELP_SKULL ? 'Aide visuelle : individus louches signalés' : 'Aide visuelle désactivée : repérez les capuches', '#9fe0ff', 2);
    return;
  }
  if ((e.key === '?' || k === 'f1') && !e.repeat) { e.preventDefault(); S.help = !S.help; return; }
  if (S.help) { if (k === 'escape' || k === 'enter') S.help = false; return; }
  if (S.paused) {
    if (k === 'escape' || k === 'enter' || k === ' ') setPause(false);
    else if (k === 'q') { setPause(false); stopMusic(); reset('title'); TITLE.stage = 1; TITLE.t = 0.5; }
    return;
  }
  keys[k] = true;
  initAudio(); if (AC && AC.state === 'suspended') AC.resume();
  if (S.mode === 'title') {
    if (TITLE.stage === 0 && TITLE.wait) { if (!e.repeat) introGo(); return; }   // premier appui : l'intro démarre, avec le son
    if (TITLE.stage === 0) { if (!e.repeat) titleGo(); return; }    // intro : n'importe quelle touche
    if (k === 'arrowleft' || k === 'arrowright' || ['1', '2', '3', '4'].includes(k)) {
      const nL = LINES.length;
      LINE = k === 'arrowleft' ? (LINE + nL - 1) % nL : k === 'arrowright' ? (LINE + 1) % nL : +k - 1;
      saveBest(); reset('title'); beep(660, 0.06, 'square', 0.04);
    }
    if (k === 'arrowup' || k === 'arrowdown') {   // choix du mode : service normal / vague de feu
      GM = GM === 'fire' ? 'classic' : 'fire'; saveBest(); reset('title');
      TITLE.best = LINES.map(Ln => { try { return +localStorage.getItem('dm_best_' + modeId(Ln.id)) || 0; } catch (e) { return 0; } });
      TITLE.modeT = 0; beep(GM === 'fire' ? 330 : 660, 0.08, 'square', 0.05); if (GM === 'fire') noise(0.5, 0.15, 'lowpass', 300, 0.7);
      return;
    }
    if (k === 'c') { TITLE.rank = !TITLE.rank; beep(TITLE.rank ? 880 : 520, 0.05, 'square', 0.04); return; }
    if (TITLE.rank && k === 'escape') { TITLE.rank = false; return; }
    if (k === 'enter' || k === 't') { TITLE.rank = false; startService(k === 't'); }
    return;
  }
  if (S.mode === 'end') { if (k === 'enter' || k === 'r') reset('running'); return; }
  if (k === 'r') {
    if (S.rConfirm > S.t) { reset('running'); msg('Nouvelle partie !', '#ffd75e'); }
    else { S.rConfirm = S.t + 2.5; msg('Recommencer ? Appuyez encore sur R', '#ffb35e', 2.5); }
    return;
  }
  if (S.blast && !S.blast.res && S.mode === 'running' && k !== 'escape') { const d = { arrowleft: 'L', q: 'L', arrowdown: 'D', s: 'D', arrowup: 'U', z: 'U', arrowright: 'R', d: 'R' }[k]; if (d) { if (!e.repeat) blastHit(d); return; } }
  if (S.mg && k !== 'escape') { if (!e.repeat) mgHit({ arrowleft: 'L', q: 'L', arrowdown: 'D', s: 'D', arrowup: 'U', z: 'U', arrowright: 'R', d: 'R' }[k]); return; }
  if (k === 'e' && !e.repeat && S.mode === 'running') { if (canManual()) startManual(); else if (S.sw && S.sw.kind === 'manual' && !S.sw.done && S.phase === 'drive') msg(S.v > 0 ? 'Arrêtez d\'abord la rame' : 'Approchez-vous du signal de l\'aiguille', '#ffd75e', 2); return; }
  if ((k === 'arrowleft' || k === 'arrowright') && S.mode === 'running') { chooseDir(k === 'arrowleft' ? 'D' : 'G'); return; }
  if (k === 'b' && !e.repeat && S.mode === 'running') { emergencyBrake(); return; }
  if (k === ' ') { if (FIRE() && S.mode === 'running') { if (!e.repeat) wipe(); } else vacmaAck(); return; }   // fuite : pas de veille, Espace actionne les essuie-glaces
  if (k === 'k' && FIRE()) return;   // fuite : pas de klaxon
  if (k === 'k') {
    sfxHorn(); S.hornT = 0.7;
    const pe = S.person;
    if (pe && pe.state === 'track' && S.phase === 'drive' && pe.pos - S.pos < 90) { pe.state = 'leaving'; msg('Coup de klaxon : la personne quitte la voie', '#9fe0ff', 2.5); }
    const dg = S.dog;
    if (dg && dg.seen && ['sit', 'trot', 'run'].includes(dg.state) && S.phase === 'drive' && dg.pos - S.pos < 90) {
      dg.horns++;
      if (Math.random() < 0.3 + 0.2 * dg.horns) { dg.state = 'leaving'; msg('Le chien file dans une niche du tunnel', '#9fe0ff', 2.5); }
      else { dg.state = 'run'; dg.runT = 1.4 + Math.random(); msg('Le chien a peur… et court droit devant !', '#ffd75e', 2.5); }
    }
    return;
  }
  if (['1', '2', '3', '4', '5'].includes(k) && S.mode === 'running' && (S.phase === 'dwell' || S.phase === 'alert') && !e.repeat) { toggleCar(+k - 1); return; }
  if (k === 'a') { radioCall(); return; }
  if (k === 'escape') { if (S.radio) { S.radio = 0; } else if (S.mode === 'running' && !S.over) setPause(true); return; }
  if (k === 'm') { S.missionShow = 5; return; }
  if (k === 'p') {
    if ((S.phase === 'dwell') && S.endT < 0) {
      S.alerted = true; S.phase = 'alert'; S.buzzT = 2; sfxBuzzer(); sfxDoorAlarm(2);
      const nStop = S.mp.filter(m => m.st === 'walk').length;
    }
  } else if (k === 'enter') {
    if (S.medicT > 0 && (S.phase === 'dwell' || S.phase === 'alert')) { msg(`${S.medicKind === 'bag' ? 'Inspection du bagage' : 'Secours en intervention'} : encore ${Math.ceil(S.medicT)} s`, '#ff8a7a', 2); return; }
    if ((S.phase === 'dwell' || S.phase === 'alert') && S.endT < 0) {
      if (!S.alerted && !STATIONS[S.cur].zombie) pen(-15, 'Fermeture sans signal sonore !');
      S.phase = 'closing'; sfxDoorsClosing();
    }
  }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
cv.addEventListener('click', () => {
  cv.focus(); initAudio(); if (AC && AC.state === 'suspended') AC.resume();
  if (S.mode === 'title') { if (TITLE.stage === 0 && TITLE.wait) introGo(); else if (TITLE.stage === 0) titleGo(); else startService(false); }
});
// pause : Échap, ou automatiquement quand la fenêtre perd le focus
function setPause(on) {
  if (on && (S.mode !== 'running' || S.over || S.paused)) return;
  S.paused = on;
  for (const k in keys) keys[k] = false;
  try { on ? speechSynthesis.pause() : speechSynthesis.resume(); } catch (e) {}
  if (on && AC) [motorGain, squealGain, rumbleGain, hissGain, whineGain, crowdGain].forEach(gn => gn && gn.gain.setTargetAtTime(0, AC.currentTime, 0.05));
  beep(on ? 440 : 660, 0.07, 'square', 0.04);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && !window.__noAutoPause) setPause(true); });
window.addEventListener('blur', () => { if (!window.__noAutoPause) setPause(true); });
function drawPause() {
  g.fillStyle = 'rgba(4,6,12,0.78)'; g.fillRect(0, 0, W, H);
  pixText('PAUSE', W / 2, 84, 22, '#ffd75e');
  txt('Échap ou Entrée : reprendre', W / 2, 110, 12, '#ffffff', 'center');
  txt('Q : quitter la partie (retour à l\'accueil)', W / 2, 124, 12, '#a8b2c6', 'center');
  txt('?  aide et commandes', W / 2, 146, 10, '#6f7a90', 'center');
}
function startService(tuto) {
  stopMusic();
  S.mode = 'running'; S.pos = 0; S.v = 0;
  if (FIRE()) {
    msg('🔥 Une vague de feu remonte la ligne ! Embarquez un maximum de voyageurs et fuyez jusqu\'au terminus.', '#ffb35e', 6);
    setTimeout(() => { if (S.mode === 'running' && S.fire) msg(`Abri : ${STATIONS[STATIONS.length - 1].name}. Chaque seconde à quai fait monter du monde… et rapproche le feu.`, '#ffd75e', 6); }, 6500);
    let seenF = false; try { seenF = localStorage.getItem('dm_tuto_fire') === '1'; } catch (err) {}
    if (tuto || !seenF) { S.tuto = 0; S.tutoT = 0; }
  } else {
    msg(`Ligne ${LN().num} · ${STATIONS[0].name} — en voiture !`, '#ffd75e');
    let seen = false; try { seen = localStorage.getItem('dm_tuto') === '1'; } catch (err) {}
    if (tuto || !seen) { S.tuto = 0; S.tutoT = 0; }
  }
  beep(523, 0.08, 'square', 0.05); beep(784, 0.14, 'square', 0.05, 0.08);
}
const keyTraction = () => keys['z'] || keys['w'] || keys['arrowup'];
const keyBrake = () => keys['s'] || keys['arrowdown'];
