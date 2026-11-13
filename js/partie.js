// Dernier Métro · Abri (mode feu), fin de service, boucle de mise à jour
// ---------- Abri (mode feu) : décompte des voyageurs à la descente, puis la note ----------
const unloadDur = n => Math.max(2.5, Math.min(7, n / 45));          // durée du décompte (s)
const fireLostNow = () => S.lost + STATIONS.reduce((a, st, i) => a + (i < STATIONS.length - 1 && !st.burnt && !st.zombie ? st.people.length : 0), 0);
const fireNote = (sv, lo) => sv + lo ? Math.round(20 * Math.min(1, sv / (sv + lo) / 0.9)) : 0;   // la note suit la part sauvée : 90 % = 20/20
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
  if (u.n >= u.tot && u.t > 1.2 && (!S.blast || S.blast.res)) {   // la note attend l'issue des portes blindées
    u.done = true; S.load = 0; S.cars = S.cars.map(() => 0); S.saved = u.tot;
    u.lost = fireLostNow(); u.note = fireNote(u.tot, u.lost); S.endT = S.blast ? 5.5 : 7;   // mode feu : on laisse voir l'issue des portes, puis le bilan à l'écran de fin S.msgs = []; S.mp = S.mp.filter(m => m.st !== 'walk');
    const good = u.note >= 12;
    (good ? [523, 659, 784, 1047, 1319] : [392, 330, 262]).forEach((f, i) => beep(f, good ? 0.18 : 0.3, 'square', 0.06, 0.5 + i * (good ? 0.1 : 0.2)));
  }
}
// ---- final du mode feu : les portes blindées de l'abri, fermées à la manivelle, en rythme ----
// Les flèches montent vers la ligne cible (← ↓ ↑ → ou Q S Z D). Chaque flèche juste fait descendre les portes.
// Il en faut b.need (plus il y a de temps, plus il y en a : la manœuvre dure jusqu'à l'arrivée du feu) ; sinon le feu s'engouffre et emporte une partie des derniers voyageurs.
const BLAST_TRAVEL = 1.3;
const blastNeed = T => Math.max(18, Math.min(32, Math.round(T * 1.35)));
function startBlast() {
  const T = Math.max(13, Math.min(24, fireEta() * 1.6));   // l'avance prise sur la vague donne plus ou moins de temps
  S.blast = { t: 0, T, need: blastNeed(T), fv: Math.max(1, fireGap()) / T, notes: [], next: 1.2, hits: 0, perf: 0, combo: 0, fb: null, fbT: 0, flash: 0, lane: [0, 0, 0, 0], res: null, rt: 0 };
  S.fire.v = S.blast.fv;   // les panneaux du feu affichent le vrai compte à rebours
  S.fx = null;              // pas de bilan d'arrêt par-dessus le final
  for (let i = 0; i < 3; i++) beep(330, 0.15, 'sawtooth', 0.05, i * 0.22);
}
function updateBlast(dt) {
  const b = S.blast; if (!b || S.over) return;
  b.ang = (b.ang || 0) + ((b.hits * Math.PI / 2) - (b.ang || 0)) * Math.min(1, dt * 9);   // le volant tourne d'un quart de tour par flèche juste
  b.dp = (b.dp || 0) + (Math.min(1, b.hits / b.need) - (b.dp || 0)) * Math.min(1, dt * 6);   // les battants suivent
  if (b.res) { b.rt += dt; return; }
  b.t += dt; b.fbT = Math.max(0, b.fbT - dt); b.flash = Math.max(0, b.flash - dt); b.lane = b.lane.map(v => Math.max(0, v - dt));
  while (b.next < b.t + BLAST_TRAVEL + 0.2) { b.notes.push({ t: b.next, dir: DDR_DIRS[Math.floor(Math.random() * 4)], res: null }); b.next += pick([0.42, 0.5, 0.5, 0.6]); }
  for (const n of b.notes) if (!n.res && b.t > n.t + DDR_GOOD) { n.res = 'miss'; b.combo = 0; b.fb = 'RATÉ'; b.fbT = 0.45; }
  b.notes = b.notes.filter(n => n.t > b.t - 1);
  const tk = Math.floor(b.t * 2); if (tk !== b.tk) { b.tk = tk; noise(0.4, 0.04 + 0.2 * Math.min(1, b.t / b.T), 'lowpass', 200, 0.7); }   // grondement qui monte
}
function blastHit(dir) {
  const b = S.blast; if (!b || b.res) return;
  b.lane[DDR_DIRS.indexOf(dir)] = 0.15;
  const n = b.notes.filter(x => !x.res && x.dir === dir).sort((p, q) => Math.abs(p.t - b.t) - Math.abs(q.t - b.t))[0];
  const dt = n ? Math.abs(n.t - b.t) : 9;
  if (n && dt <= DDR_GOOD) {
    n.res = dt <= DDR_PERF ? 'perf' : 'good'; b.hits++; b.combo++; if (n.res === 'perf') b.perf++;
    b.fb = n.res === 'perf' ? 'PARFAIT !' : 'BIEN'; b.fbT = 0.45; S.score += n.res === 'perf' ? 10 : 5;
    beep(140 + 20 * b.hits, 0.12, 'square', 0.08); noise(0.15, 0.2, 'lowpass', 600, 0.8);   // la manivelle cogne, les portes descendent
    if (b.hits >= b.need) blastResolve(true);
  } else { b.combo = 0; b.flash = 0.25; b.fb = 'TROP TÔT'; b.fbT = 0.35; beep(180, 0.08, 'square', 0.04); }
}
function blastResolve(ok) {
  const b = S.blast; if (!b || b.res) return;
  b.res = ok ? 'ok' : 'fail'; b.rt = 0;
  const u = S.unload;
  if (ok) {
    S.score += 100; S.fire.safe = true;
    msg('🛡 PORTES BLINDÉES SCELLÉES ! La vague s\'écrase contre l\'abri', '#7dff8a', 4);
    beep(70, 0.5, 'triangle', 0.4); noise(0.6, 0.4, 'lowpass', 500, 0.7);
  } else {
    // le feu s'engouffre : une partie des derniers voyageurs, encore près de l'entrée, est perdue (moins si les portes étaient presque fermées)
    const prog = b.hits / b.need, k = Math.round(u.tot * 0.5 * (1 - prog));
    const fromOn = Math.min(k, S.load), fromOff = k - fromOn;   // d'abord ceux encore à bord, puis ceux déjà descendus
    S.load -= fromOn; u.tot -= k; if (u.n > u.tot) { S.score -= 10 * (u.n - u.tot); u.n = u.tot; }
    S.saved = Math.min(S.saved, u.tot); S.lost += k; S.fire.safe = true; S.shake = 0.8;
    msg('🔥 Le feu s\'engouffre avant la fermeture des portes !', '#ff6b5b', 4);
    noise(0.9, 0.5, 'lowpass', 700, 0.6); [196, 165, 131].forEach((f, i) => beep(f, 0.35, 'sawtooth', 0.07, i * 0.2));
  }
}
// scène du final : vue de l'intérieur de l'abri. Deux battants d'acier se referment sur l'ouverture,
// la vague de feu grossit au fond du tunnel, et deux mains tournent le volant de manœuvre au premier plan.
function drawBlastScene() {
  const b = S.blast, k = Math.min(1, b.t / b.T), dp = b.dp || 0, fl = 0.85 + 0.15 * Math.sin(S.t * 19) * Math.sin(S.t * 6.3);
  const failed = b.res === 'fail', sealed = b.res === 'ok';
  const ox0 = 40, ox1 = 250, oy0 = 16, oy1 = H - 10, cx = (ox0 + ox1) / 2, vy = 78;
  g.save(); g.beginPath(); g.rect(0, 0, W, H); g.clip();   // plein écran : on n'est plus dans la rame
  // mur intérieur de l'abri (béton)
  g.fillStyle = '#1a1b20'; g.fillRect(0, 0, W, H);
  if (TEX.concrete) { g.globalAlpha = 0.55; TEX.concrete.pat.setTransform(new DOMMatrix([0.6, 0, 0, 0.6, 0, 0])); g.fillStyle = TEX.concrete.pat; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  // au-delà de l'ouverture : le tunnel et la vague qui arrive
  g.save(); g.beginPath(); g.rect(ox0, oy0, ox1 - ox0, oy1 - oy0); g.clip();
  g.fillStyle = '#0a0a0e'; g.fillRect(ox0, oy0, ox1 - ox0, oy1 - oy0);
  for (let i = 9; i >= 1; i--) {   // anneaux du tunnel qui convergent vers le fond
    const q = i / 9, rw = 22 + 150 * q * q, rh = 18 + 110 * q * q, hot = Math.min(1, k * 1.3);
    g.strokeStyle = `rgba(${150 + 105 * hot | 0},${120 - 40 * hot | 0},${100 - 70 * hot | 0},${0.12 + 0.25 * q})`; g.lineWidth = 0.6 + 1.6 * q;
    g.beginPath(); g.ellipse(cx, vy + 20 * q, rw, rh, 0, Math.PI, 2 * Math.PI); g.stroke();
  }
  g.fillStyle = '#121014'; g.beginPath(); g.moveTo(cx - 14, vy + 4); g.lineTo(cx + 14, vy + 4); g.lineTo(ox1 + 40, oy1); g.lineTo(ox0 - 40, oy1); g.fill();   // radier
  g.strokeStyle = 'rgba(180,180,190,0.35)'; g.lineWidth = 1; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + sd * 4, vy + 5); g.lineTo(cx + sd * 70, oy1); g.stroke(); }   // rails
  const R = sealed ? 10 + 140 * k * k : failed ? 260 : 6 + 150 * k * k;   // la vague grossit avec le temps
  const gr = g.createRadialGradient(cx, vy + 6, 0, cx, vy + 6, R * 1.6);
  gr.addColorStop(0, `rgba(255,250,210,${0.95 * fl})`); gr.addColorStop(0.3, `rgba(255,170,50,${0.9 * fl})`); gr.addColorStop(0.7, `rgba(220,60,10,${0.7 * fl})`); gr.addColorStop(1, 'rgba(120,20,0,0)');
  g.fillStyle = gr; g.fillRect(ox0, oy0, ox1 - ox0, oy1 - oy0);
  if (R > 12) flameWall(cx - R * 1.1, cx + R * 1.1, vy + 8 + R * 0.45, R * 0.9, S.t, Math.max(0.4, R / 40));
  g.restore();
  // lumière du feu qui entre par l'ouverture restante
  const gapW = (ox1 - ox0) * (1 - dp);
  if (!sealed && gapW > 1) { const lg = g.createRadialGradient(cx, vy, 10, cx, vy, 260); lg.addColorStop(0, `rgba(255,120,30,${(0.1 + 0.35 * k) * (gapW / (ox1 - ox0)) * fl})`); lg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H); }
  // battants d'acier qui glissent l'un vers l'autre
  const half = (ox1 - ox0) / 2 * dp;
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? ox0 : ox1 - half, w0 = half; if (w0 < 0.5) continue;
    const sg = g.createLinearGradient(x0, 0, x0 + w0, 0); sg.addColorStop(0, '#4a5058'); sg.addColorStop(0.5, '#6c737c'); sg.addColorStop(1, '#3e434a');
    g.fillStyle = sg; g.fillRect(x0, oy0, w0, oy1 - oy0);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = oy0 + 12; y < oy1; y += 22) g.fillRect(x0, y, w0, 2);   // renforts
    g.fillStyle = '#9aa0a8'; for (let y = oy0 + 6; y < oy1; y += 11) for (const xx of [x0 + 4, x0 + w0 - 5]) g.fillRect(xx, y, 1.6, 1.6);   // rivets
    const ex = sd < 0 ? x0 + w0 - 8 : x0;   // bord d'attaque : bandes jaunes et noires
    for (let y = oy0; y < oy1; y += 8) { g.fillStyle = (y / 8) % 2 < 1 ? '#ffd23a' : '#1a1a1a'; g.fillRect(ex, y, 8, 8); }
    if (failed) { g.fillStyle = `rgba(255,120,30,${0.3 * fl})`; g.fillRect(x0, oy0, w0, oy1 - oy0); }
  }
  // encadrement en béton et panneau ABRI
  g.fillStyle = '#2a2b31'; g.fillRect(ox0 - 10, oy0 - 10, ox1 - ox0 + 20, 10); g.fillRect(ox0 - 10, oy0, 10, oy1 - oy0); g.fillRect(ox1, oy0, 10, oy1 - oy0);
  g.fillStyle = '#19b85a'; g.fillRect(cx - 22, 2, 44, 11); txt('ABRI', cx, 11, 10, '#eaffea', 'center', '"Press Start 2P"');
  if (failed) { g.fillStyle = `rgba(255,110,20,${0.25 * fl})`; g.fillRect(0, 0, W, H); flameWall(-10, W + 10, H + 2, 60 + 20 * Math.sin(S.t * 3), S.t, 2.5); }
  // volant de manœuvre au premier plan, avec son carter fixé au mur
  const wx = 52, wy = H - 34, wr = 30, ang = b.ang || 0;
  g.fillStyle = '#2e3138'; g.fillRect(wx - 16, wy - 16, 32, 50); g.fillStyle = '#3c4048'; g.fillRect(wx - 12, wy - 12, 24, 4);
  g.strokeStyle = '#b8241c'; g.lineWidth = 6; g.beginPath(); g.arc(wx, wy, wr, 0, Math.PI * 2); g.stroke();   // jante rouge
  g.strokeStyle = 'rgba(255,200,180,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(wx, wy, wr + 1.5, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  g.strokeStyle = '#8a1a14'; g.lineWidth = 4; for (let s2 = 0; s2 < 4; s2++) { const a = ang + s2 * Math.PI / 2; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr); g.stroke(); }
  g.fillStyle = '#d0d4da'; g.beginPath(); g.arc(wx, wy, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a5f68'; g.beginPath(); g.arc(wx, wy, 3, 0, Math.PI * 2); g.fill();
  // deux mains gantées qui tiennent la jante, aux extrémités opposées, et suivent la rotation
  for (const off of [0, Math.PI]) {
    const a = ang + off + Math.PI * 0.25, hx = wx + Math.cos(a) * wr, hy = wy + Math.sin(a) * wr;
    const sx = hx + (Math.cos(a) > 0 ? 70 : -30), sy = H + 30;   // l'avant-bras vient du bas de l'écran
    g.strokeStyle = '#26354a'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();   // manche
    g.strokeStyle = '#1c2838'; g.lineWidth = 4; g.beginPath(); g.moveTo(sx + 3, sy); g.lineTo(hx + 3, hy); g.stroke();
    g.fillStyle = '#3a2a1e'; g.beginPath(); g.ellipse(hx, hy, 10, 8, a, 0, Math.PI * 2); g.fill();   // gant de cuir
    g.fillStyle = '#4e3a2a'; for (let f = -1; f <= 2; f++) { const fa = a + Math.PI / 2 + f * 0.28; g.beginPath(); g.ellipse(hx + Math.cos(fa) * 8, hy + Math.sin(fa) * 8, 4, 2.6, fa, 0, Math.PI * 2); g.fill(); }
    g.lineCap = 'butt';
  }
  g.restore();
}
function drawBlast() {
  const b = S.blast; if (!b || b.res || S.mode !== 'running' || S.over) return;   // une fois l'issue connue, place au bilan
  const x = W - 126, y = 22, w = 122, h = 120, lw = 26, x0 = x + (w - lw * 4) / 2, top = y + 26, bot = y + h - 4, ty = top + 9;
  const prog = Math.min(1, b.hits / b.need), left = Math.max(0, b.T - b.t);
  g.fillStyle = b.flash ? 'rgba(90,10,10,0.9)' : 'rgba(6,8,14,0.9)'; g.fillRect(x, y, w, h);
  g.strokeStyle = b.res === 'ok' ? '#7dff8a' : b.res === 'fail' ? '#ff4a3a' : '#ffb35e'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt('PORTES BLINDÉES', x + 6, y + 9, 10, '#ffd75e');
  txt(b.res ? (b.res === 'ok' ? 'SCELLÉES ✓' : 'TROP TARD') : `feu ${left.toFixed(1)} s`, x + w - 6, y + 9, 10, b.res === 'ok' ? '#7dff8a' : left < 3 && Math.floor(S.t * 6) % 2 ? '#ffffff' : '#ff6b5b', 'right');
  // jauge des portes : les deux battants qui se rejoignent
  const gx = x + 6, gw = w - 12, gy = y + 13, half = gw / 2 * prog;
  g.fillStyle = '#1b2232'; g.fillRect(gx, gy, gw, 6);
  g.fillStyle = '#8a929e'; g.fillRect(gx, gy, half, 6); g.fillRect(gx + gw - half, gy, half, 6);
  g.fillStyle = '#ffd75e'; for (let k = 0; k < 6; k++) { g.fillRect(gx + k * 8, gy, 3, 6 * (half > k * 8 ? 1 : 0)); g.fillRect(gx + gw - k * 8 - 3, gy, 3, 6 * (half > k * 8 ? 1 : 0)); }
  if (b.res) { txt(b.res === 'ok' ? 'Tout le monde est à l\'abri' : 'Le feu est entré', x + w / 2, y + 60, 11, b.res === 'ok' ? '#7dff8a' : '#ff6b5b', 'center'); return; }
  const COL = { L: '#ff5ab0', D: '#4ab0ff', U: '#7dff8a', R: '#ffb33a' };
  DDR_DIRS.forEach((d, i) => { const cx = x0 + lw * i + lw / 2; g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x0 + lw * i + 1, top, lw - 2, bot - top); ddrArrow(cx, ty, 8, d, b.lane[i] > 0 ? COL[d] : 'rgba(255,255,255,0.08)', '#c8ccd6'); });
  for (const n of b.notes) {
    if (n.res && n.res !== 'miss') continue;
    const k = (n.t - b.t) / BLAST_TRAVEL; if (k > 1 || k < -0.2) continue;
    ddrArrow(x0 + lw * DDR_DIRS.indexOf(n.dir) + lw / 2, ty + k * (bot - ty), 8, n.dir, n.res === 'miss' ? 'rgba(120,120,130,0.6)' : COL[n.dir], '#ffffff');
  }
  if (b.fbT > 0) txt(b.fb, x + w / 2, ty + 26, 9, b.fb === 'PARFAIT !' ? '#7dff8a' : b.fb === 'BIEN' ? '#9fe0ff' : '#ff6b5b', 'center', '"Press Start 2P"');
  txt(`${b.hits} / ${b.need}`, x + w - 6, bot - 2, 9, '#e6ecf5', 'right');
}
function drawUnload() {
  const u = S.unload; if (!u || S.mode !== 'running' || S.over) return;
  if (S.blast) return;   // mode feu : le bilan des voyageurs n'apparaît qu'à l'écran de fin, pas pendant les portes
  const x = 138, w = W - 8 - x, y = 8, h = u.done ? 96 : 50;
  g.fillStyle = 'rgba(6,8,14,0.92)'; g.fillRect(x, y, w, h);
  g.fillStyle = '#7dff8a'; g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2);
  const goal = Math.max(1, u.goal || u.tot);   // tous ceux qu'il fallait sauver, à bord ou restés sur les quais
  txt('ABRI ATTEINT · VOYAGEURS SAUVÉS', x + w / 2, y + 12, 12, '#7dff8a', 'center', 'VT323', w - 12);
  pixText(`${u.n} sur ${goal}`, x + w / 2, y + 30, 10, u.done ? '#ffffff' : '#9fe0ff');
  // barre : part sauvée (vert, se remplit au fil de la descente) et part perdue (rouge, d'emblée)
  const bw = w - 24, kS = u.n / goal, kT = u.tot / goal;
  g.fillStyle = '#1b2232'; g.fillRect(x + 12, y + 37, bw, 5);
  g.fillStyle = '#a83020'; g.fillRect(x + 12 + Math.round(bw * kT), y + 37, bw - Math.round(bw * kT), 5);
  g.fillStyle = '#7dff8a'; g.fillRect(x + 12, y + 37, Math.round(bw * kS), 5);
  txt(u.done ? 'Tous les voyageurs à bord sont descendus' : 'Les voyageurs descendent…', x + w / 2, y + 48, 11, '#8fa0b8', 'center');
  if (!u.done) return;
  const ratio = Math.round(100 * u.tot / goal);
  txt(`✔ ${u.tot} sauvés   † ${goal - u.tot} perdus en route   ${ratio} %`, x + w / 2, y + 60, 11, '#ffd0a8', 'center', 'VT323', w - 12);
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
  const vy = FIRE() ? (S.saved + S.lost ? Math.min(1, S.saved / (S.saved + S.lost) / 0.9) : 0) :   // 90 % de sauvés vaut l'or
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
    if (!TITLE.wait || TITLE.stage !== 0) TITLE.t += dt;
    TITLE.sel += (LINE - TITLE.sel) * Math.min(1, dt * 12);
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
      if (here) { if (!FIRE()) spawnArrival(st); else if (st.extra > 0) { st.extra--; spawnArrival(st); } }   // fuite : à quai, seulement le quota d'arrivées de cet arrêt
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
  if (S.ebT > 0) S.ebT = Math.max(0, S.ebT - dt);
  if (Z && S.ebT > 0) { if (S.warnT <= 0) { msg('Frein d\'urgence : réarmement en cours…', '#ffb35e'); S.warnT = 1; } }
  else if (Z && (S.mg || S.rev || S.backup)) { if (S.warnT <= 0) { msg(S.mg ? 'Terminez la manœuvre de l\'aiguille d\'abord' : 'Retour en marche arrière en cours…', '#ffb35e'); S.warnT = 2; } }
  else if (Z && S.eb) { if (S.warnT <= 0) { msg('Frein d\'urgence serré : traction coupée jusqu\'à l\'arrêt', '#ffb35e'); S.warnT = 1.5; } }
  else if (Z) {
    if (S.phase === 'drive' && !S.ebrake) a += (2.4 - 0.8 * S.v / VMAX) * tractionF();   // traction : forte au démarrage, un peu moins à pleine vitesse (fuite : alourdie par la charge)
    else if (S.warnT <= 0) { msg('Fermez d\'abord les portes !', '#ff6b5b'); S.warnT = 2; }
  }
  if (S.eb && !S.eb.stopT) a = -ebDec();   // frein d'urgence : il l'emporte sur tout
  else if (B) a -= BRAKE_MAX * S.brakeF;
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
        const stayers = S.mp.filter(m => m.st === 'walk'), left = stayers.reduce((a, m) => a + need(m), 0), cst = STATIONS[S.cur];
        cst.people = stayers.map(m => Object.assign(mkPerson(cst.pos - m.z, Math.min(5.8, m.x + 1.8)), lookOf(m)));
        const res = STATIONS[S.cur].res; res.left = left;
        if (STATIONS[S.cur].name === busiestStation()) { if (left === 0) mDone('vide'); else mFail('vide'); }
        if (left > 0 && !FIRE()) S.score -= 5 * left;   // fuite : ceux qui restent sont comptés comme perdus, pas en points
        res.stars = Object.assign({ p: null, t: null }, res.stars || {}, { v: left === 0 });
        S.legPen = 0;
        S.pops = []; S.msgs = [];   // les alertes de quai ne débordent pas sur la conduite
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

  updateBlast(dt);
  updateUnload(dt);
  updateWindZombies(dt); updateEmergencyBrake(dt);
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
