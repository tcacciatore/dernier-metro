// Dernier Métro · Mode Vague de feu : la vague, caméra arrière, incidents de tunnel
// ---------- Vague de feu (mode « fire ») ----------
const FIRE_START = 230;                         // la vague part 230 m derrière le terminus de départ
const FIRE_V = [5.4, 5.8, 6.2, 6.6];            // vitesse de base par ligne (m/s) : ~20 à 26 km/h
const fireGap = () => S.fire ? S.pos - TRAIN_LEN - S.fire.z : 999;   // de la vague à l'arrière de la rame
function updateFire(dt) {
  const f = S.fire; if (!f || S.over) return;
  if (S.next >= STATIONS.length && S.phase !== 'drive') {   // terminus : la vague arrive sur l'abri pendant qu'on ferme les portes blindées
    const bl = S.blast;
    if (bl && !bl.res) { f.z += bl.fv * dt; if (fireGap() <= 0) blastResolve(false); }
    else if (!f.safe) f.safe = true;
    return;
  }
  const gap = fireGap();
  // la vague avance à vitesse constante, mais rattrape son retard si on la distance trop (la tension ne retombe jamais)
  const surge = f.surge ? gap > 280 : gap > 320;   // hystérésis : l'alerte ne clignote pas autour du seuil
  if (surge && !f.surge && S.t > 5) msg('🔥 La vague s\'emballe : elle accélère !', '#ff8a3a', 3);
  f.surge = surge;
  f.v = FIRE_V[LINE] * (surge ? 1.9 : gap > 220 ? 1.25 : 1);
  if (S.t > 3) f.z += f.v * dt;   // trois secondes de répit au tout début
  // les stations englouties : les voyageurs restés sur le quai sont perdus
  STATIONS.forEach((st, i) => {
    if (st.burnt || f.z < st.pos - PL) return;
    st.burnt = true;
    if (st.zombie) { st.people = []; return; }
    const n = st.people.length;
    if (i <= S.cur && n > 0) { S.lost += n; st.res.lost = n; msg(`🔥 La vague atteint ${st.name} : ${n} voyageur${n > 1 ? 's' : ''} n'ont pas pu monter`, '#ff8a5b', 3.5); }
    st.people = [];
  });
  if (gap <= 0) {
    gameOver('Rattrapé par la vague de feu', S.load ? `${S.load} voyageurs à bord. Il fallait repartir plus tôt !` : 'Il fallait repartir plus tôt !');
    return;
  }
  // alertes sonores quand elle se rapproche
  if (gap < 120) {
    f.rumbleT -= dt;
    if (f.rumbleT <= 0) { f.rumbleT = 0.25 + gap / 160; noise(0.6, 0.05 + 0.25 * (1 - gap / 120), 'lowpass', 180 + Math.random() * 120, 0.7); }
  }
  const lv = gap < 40 ? 3 : gap < 80 ? 2 : gap < 140 ? 1 : 0;
  if (lv > f.warn) {
    if (lv === 1) msg('🔥 La vague est à moins de 140 m !', '#ffb35e', 2.5);
    if (lv === 2) { msg('🔥 80 m ! Il faut partir !', '#ff6b5b', 2.5); for (let i = 0; i < 3; i++) beep(880, 0.08, 'square', 0.05, i * 0.15); }
    if (lv === 3) { msg('🔥 LA VAGUE EST SUR NOUS !', '#ff3a2a', 2.5); for (let i = 0; i < 6; i++) beep(i % 2 ? 660 : 990, 0.08, 'sawtooth', 0.05, i * 0.1); }
  }
  if (lv > f.warn || gap > [0, 170, 110, 60][f.warn]) f.warn = lv;   // hystérésis : on ne répète pas l'alerte en boucle
}
// temps estimé avant que la vague n'atteigne l'arrière de la rame (rame à l'arrêt)
const fireEta = () => S.fire && S.fire.v > 0 ? fireGap() / S.fire.v : 99;
const fireCol = gap => gap < 40 ? '#ff3a2a' : gap < 80 ? '#ff6b3a' : gap < 140 ? '#ffb35e' : '#ffd75e';
// pastille en haut de l'écran (remplace l'horaire)
function drawFireChip() {
  if (!S.fire || S.mode !== 'running' || S.phase !== 'drive') return;
  const gap = fireGap(), x = 146, y = 8, w = 66, h = 38, col = fireCol(gap), pulse = 0.5 + 0.5 * Math.sin(S.t * (gap < 80 ? 10 : 4));
  g.fillStyle = gap < 80 ? `rgba(${Math.round(60 + 70 * pulse)},14,4,0.85)` : 'rgba(10,6,4,0.65)'; g.fillRect(x, y, w, h);
  g.strokeStyle = col; g.lineWidth = gap < 80 ? 1.5 + pulse : 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt('VAGUE DE FEU', x + w / 2, y + 8, 8, '#d8a890', 'center', 'VT323', w - 4);
  txt(`${Math.max(0, Math.round(gap))} m`, x + w / 2, y + 18, 12, col, 'center', 'VT323', w - 6);
  // jauge : 0 (rattrapé) → 300 m
  const bx = x + 5, bw = w - 10, by = y + 22, k = Math.max(0, Math.min(1, gap / 300));
  const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ff2a10'); gr.addColorStop(0.35, '#ff9a2a'); gr.addColorStop(1, '#3a2a20');
  g.fillStyle = gr; g.fillRect(bx, by, bw, 4);
  g.fillStyle = '#ffffff'; g.fillRect(bx + bw * k - 0.75, by - 1.5, 1.5, 7);
  const tf = Math.round(tractionF() * 100);   // le poids de la rame
  txt(imbalance() > 0.05 ? `traction ${tf} % · déséq.` : `traction ${tf} %`, x + w / 2, y + 35, 9, imbalance() > 0.3 ? '#ff6b5b' : tf > 80 ? '#9fe0ff' : tf > 60 ? '#ffd75e' : '#ff8a5b', 'center', 'VT323', w - 4);
}
// caméra arrière : le tunnel derrière la rame, et la vague qui grossit en approchant
function drawRearCam() {
  if (!S.fire || S.mode !== 'running' || S.over) return;
  // affichée seulement pendant les 3 s qui suivent le départ (glisse depuis la gauche, puis repart)
  const ta = S.t - (S.departT ?? -99), vis = ta < 0 || ta > 3.3 ? 0 : Math.min(1, ta / 0.25, (3.3 - ta) / 0.3);
  if (vis <= 0) return;
  g.save(); g.translate(-(1 - vis) * 84, 0);
  drawRearCam0();
  g.restore();
}
function drawRearCam0() {
  const gap = fireGap(), x = 6, y = 6, w = 72, h = 44, cx = x + w / 2, cy = y + h / 2 + 3;
  g.fillStyle = '#000'; g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#07080a'; g.fillRect(x, y, w, h);
  const atSt = S.phase !== 'drive';
  // anneaux du tunnel qui défilent (ou quai éclairé quand on est à l'arrêt)
  const off = (S.pos % 6) / 6;
  for (let i = 7; i >= 0; i--) {
    const k = (i + 1 - off) / 8, r = 6 + 70 * k * k;
    const hot = Math.max(0, Math.min(1, 1 - gap / 260));   // les anneaux rougeoient quand la vague approche
    g.strokeStyle = atSt ? `rgba(${200 + 55 * hot | 0},${190 - 90 * hot | 0},${160 - 130 * hot | 0},${0.08 + 0.18 * k + 0.2 * hot})` : `rgba(${140 + 115 * hot | 0},${140 - 60 * hot | 0},${150 - 120 * hot | 0},${0.05 + 0.2 * k + 0.2 * hot})`; g.lineWidth = 0.6 + k;
    g.beginPath(); g.ellipse(cx, cy, r, r * 0.8, 0, Math.PI, 2 * Math.PI); g.stroke();
  }
  g.strokeStyle = 'rgba(160,160,170,0.35)'; g.lineWidth = 0.8;   // rails vers le point de fuite
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + sd * 1.5, cy); g.lineTo(cx + sd * 26, y + h); g.stroke(); }
  // la vague : une lueur au loin, puis un mur de flammes qui roule dans le tunnel et remplit l'écran
  if (gap < 520) {
    const R = Math.min(95, 1100 / (Math.max(0, gap) + 10)), fl = 0.85 + 0.15 * Math.sin(S.t * 23) * Math.sin(S.t * 7.3);
    // lumière projetée sur les parois du tunnel
    const lg = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 3 + 20);
    lg.addColorStop(0, `rgba(255,140,40,${0.55 * fl})`); lg.addColorStop(1, 'rgba(255,80,10,0)');
    g.fillStyle = lg; g.fillRect(x, y, w, h);
    // section du tunnel envahie : dégradé brûlant, boules de feu qui roulent, fumée au plafond
    g.save(); g.beginPath(); g.ellipse(cx, cy + R * 0.25, R, R * 0.85, 0, Math.PI, 2 * Math.PI); g.lineTo(cx + R, cy + R * 0.6); g.lineTo(cx - R, cy + R * 0.6); g.closePath(); g.clip();
    const fg = g.createLinearGradient(0, cy - R, 0, cy + R * 0.6);
    fg.addColorStop(0, '#3a0c04'); fg.addColorStop(0.35, '#c8300a'); fg.addColorStop(0.7, '#ff9a2a'); fg.addColorStop(1, '#fff0b0');
    g.fillStyle = fg; g.fillRect(cx - R, cy - R, 2 * R, 1.7 * R);
    for (let i = 0; i < 14; i++) {   // boules de feu qui gonflent vers la caméra
      const ph = (S.t * (0.7 + 0.5 * hsh(i, 2)) + hsh(i, 1)) % 1, a = hsh(i, 3) * Math.PI * 2;
      const bx = cx + Math.cos(a) * R * 0.55 * ph, by = cy - R * 0.1 + Math.sin(a) * R * 0.4 * ph, br = R * (0.15 + 0.35 * ph);
      const bg = g.createRadialGradient(bx, by, 0, bx, by, br);
      bg.addColorStop(0, `rgba(255,${200 + Math.round(55 * hsh(i, 4))},120,${0.8 * (1 - ph)})`); bg.addColorStop(0.6, `rgba(255,110,20,${0.5 * (1 - ph)})`); bg.addColorStop(1, 'rgba(160,30,0,0)');
      g.fillStyle = bg; g.fillRect(bx - br, by - br, 2 * br, 2 * br);
    }
    for (let i = 0; i < 6; i++) {    // fumée noire roulée au plafond
      const ph = (S.t * 0.35 + i / 6) % 1, sx = cx + (hsh(i, 9) - 0.5) * R * 1.4, sy = cy - R * (0.55 + 0.3 * ph), sr = R * (0.25 + 0.25 * ph);
      const sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, `rgba(20,12,10,${0.7 * (1 - ph * 0.5)})`); sg.addColorStop(1, 'rgba(20,12,10,0)');
      g.fillStyle = sg; g.fillRect(sx - sr, sy - sr, 2 * sr, 2 * sr);
    }
    g.restore();
    // le front de la vague : des langues de feu débordent tout autour de l'arche
    for (let i = 0; i < 18; i++) {
      const a0 = Math.PI * (1.02 + 0.96 * i / 17), q = 0.5 + 0.5 * Math.sin(S.t * (6 + hsh(i, 21) * 5) + i * 2.1);
      const L = R * (0.18 + 0.32 * q * hsh(i, 22) + 0.1), ex = cx + Math.cos(a0) * R, ey = cy + R * 0.25 + Math.sin(a0) * R * 0.85;
      const nx = Math.cos(a0), ny = Math.sin(a0), tx = -ny, ty = nx, wd = R * 0.12;
      g.fillStyle = q > 0.55 ? 'rgba(255,190,70,0.8)' : 'rgba(255,100,24,0.75)';
      g.beginPath(); g.moveTo(ex - tx * wd - nx * wd, ey - ty * wd - ny * wd);
      g.quadraticCurveTo(ex + nx * L * 0.6 + tx * wd * Math.sin(S.t * 9 + i), ey + ny * L * 0.6 + ty * wd * Math.sin(S.t * 9 + i), ex + nx * L, ey + ny * L);
      g.quadraticCurveTo(ex + nx * L * 0.4 - tx * wd, ey + ny * L * 0.4 - ty * wd, ex + tx * wd - nx * wd, ey + ty * wd - ny * wd); g.fill();
    }
    flameWall(cx - R * 1.3, cx + R * 1.3, cy + R * 0.62, R * 1.3, S.t, Math.max(0.3, R / 30));   // flammes qui lèchent le ballast
    // braises projetées vers la caméra
    const ne = Math.round(8 + 30 * Math.max(0, 1 - gap / 200));
    for (let i = 0; i < ne; i++) {
      const ph = (S.t * (0.9 + hsh(i, 5)) + hsh(i, 6)) % 1, a = hsh(i, 7) * Math.PI * 2, dd = (R * 0.3 + 60 * ph * ph);
      g.fillStyle = ph < 0.5 ? `rgba(255,230,140,${1 - ph})` : `rgba(255,120,30,${1 - ph})`;
      const sz = 0.6 + 1.6 * ph; g.fillRect(cx + Math.cos(a) * dd, cy + Math.sin(a) * dd * 0.7, sz, sz);
    }
    if (gap < 25) { g.fillStyle = `rgba(255,${Math.round(150 + 100 * fl)},80,${0.6 * (1 - gap / 25)})`; g.fillRect(x, y, w, h); }   // l'objectif fond
  }
  // grain vidéo
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${0.04 + 0.06 * hsh(i, Math.floor(S.t * 30))})`; g.fillRect(x + hsh(i, Math.floor(S.t * 30) + 1) * w, y + hsh(i + 50, Math.floor(S.t * 30)) * h, 1, 1); }
  g.restore();
  g.strokeStyle = fireCol(gap); g.lineWidth = gap < 80 && Math.floor(S.t * 6) % 2 ? 2 : 1; g.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y, w, 9);
  txt('CAM. ARRIÈRE', x + 3, y + 7, 7, '#c8ccd6');
  if (Math.floor(S.t * 2) % 2) { g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(x + w - 5, y + 4.5, 1.8, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y + h - 10, w, 10);
  txt(`🔥 ${Math.max(0, Math.round(gap))} m${atSt ? ` · ${Math.max(0, Math.floor(fireEta()))} s` : ''}`, x + w / 2, y + h - 2.5, 9, fireCol(gap), 'center', 'VT323', w - 4);
}
// mur de flammes : couches de langues de feu qui ondulent (du rouge sombre au cœur blanc)
const FLAME_LAYERS = [['rgba(160,26,4,0.8)', 1, 0.7], ['rgba(235,60,12,0.9)', 0.85, 1], ['rgba(255,120,26,0.9)', 0.64, 1.35], ['rgba(255,200,74,0.9)', 0.42, 1.8], ['rgba(255,246,200,0.85)', 0.2, 2.4]];
function flameWall(x0, x1, base, hgt, t, sc = 1) {
  FLAME_LAYERS.forEach(([col, kh, sp], L) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(x0, base);
    const st = Math.max(1, (x1 - x0) / 90);
    for (let xx = x0; xx <= x1 + st; xx += st) {
      const u = xx / sc;
      const tong = Math.pow(1 - Math.abs(Math.sin(u * 0.11 + t * 2.2 * sp + L * 1.7)), 1.6);
      const mod = 0.55 + 0.25 * Math.sin(u * 0.037 - t * 1.3 * sp + L) + 0.2 * Math.sin(u * 0.19 + t * 4.1);
      g.lineTo(xx, base - hgt * kh * (0.25 + 0.75 * tong * mod));
    }
    g.lineTo(x1, base); g.closePath(); g.fill();
  });
}
// vue principale : lueur vacillante, fumée au plafond, braises poussées par le souffle qui nous dépassent
function drawFireGlow() {
  if (!S.fire || S.mode !== 'running' || S.fire.safe) return;
  const gap = fireGap(); if (gap > 220) return;
  const k = Math.min(1, Math.max(0, (220 - gap) / 200)), fl = 0.8 + 0.2 * Math.sin(S.t * 17) * Math.sin(S.t * 5.1);
  // la lumière du brasier, derrière nous, éclaire le tunnel
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = `rgba(255,${Math.round(90 + 40 * fl)},20,${(0.04 + 0.16 * k) * fl})`; g.fillRect(0, 0, W, VIEW_H);
  g.restore();
  const vg = g.createRadialGradient(W / 2, VIEW_H / 2, VIEW_H * (0.75 - 0.35 * k), W / 2, VIEW_H / 2, W * 0.62);
  vg.addColorStop(0, 'rgba(255,90,10,0)'); vg.addColorStop(1, `rgba(255,${Math.round(110 - 60 * k)},10,${(0.12 + 0.5 * k) * fl})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, VIEW_H);
  // fumée qui envahit la voûte
  if (gap < 150) {
    const sk = Math.min(1, (150 - gap) / 130);
    const sg = g.createLinearGradient(0, 0, 0, VIEW_H * 0.55);
    sg.addColorStop(0, `rgba(24,14,10,${0.75 * sk})`); sg.addColorStop(1, 'rgba(24,14,10,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, VIEW_H * 0.55);
    for (let i = 0; i < 7; i++) {   // volutes qui roulent vers l'avant
      const ph = (S.t * 0.25 + i / 7) % 1, sx = (i % 2 ? W - 30 : 30) + (i % 2 ? -1 : 1) * ph * (W / 2 - 30), sy = 6 + ph * (CY - 10) * 0.6, sr = 60 * (1 - ph) + 10;
      const bg = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
      bg.addColorStop(0, `rgba(30,18,14,${0.45 * sk * (1 - ph)})`); bg.addColorStop(1, 'rgba(30,18,14,0)');
      g.fillStyle = bg; g.fillRect(sx - sr, sy - sr, 2 * sr, 2 * sr);
    }
  }
  // braises : elles naissent sur les bords et filent vers le fond du tunnel
  const n = Math.round(10 + 70 * k);
  for (let i = 0; i < n; i++) {
    const per = 1.2 + 1.2 * hsh(i, 11), ph = (S.t / per + hsh(i, 12)) % 1, e = Math.pow(ph, 0.6);
    const side = hsh(i, 13), x0 = side < 0.5 ? -10 + side * 120 : W + 10 - (side - 0.5) * 120, y0 = VIEW_H * (0.25 + 0.75 * hsh(i, 14));
    const ex = x0 + (CX - x0) * e + Math.sin(S.t * 3 + i) * 3, ey = y0 + (CY - y0) * e - 10 * Math.sin(ph * Math.PI);
    const sz = 2.4 * (1 - ph) + 0.5, a = (1 - ph) * (0.5 + 0.5 * hsh(i, 15));
    const col = hsh(i, 16) > 0.6 ? `rgba(255,240,170,${a})` : hsh(i, 16) > 0.25 ? `rgba(255,150,40,${a})` : `rgba(230,60,20,${a})`;
    // traînée : la braise file vers le fond, on dessine un trait dans le sens du mouvement
    const dx = CX - x0, dy = CY - y0, dl = Math.hypot(dx, dy) || 1, tl = 3 + 7 * (1 - ph);
    g.strokeStyle = col; g.lineWidth = Math.max(0.6, sz * 0.55); g.beginPath(); g.moveTo(ex - dx / dl * tl, ey - dy / dl * tl); g.lineTo(ex, ey); g.stroke();
    if (sz > 1.4) { g.fillStyle = `rgba(255,200,90,${a * 0.25})`; g.fillRect(ex - sz, ey - sz, sz * 3, sz * 3); }
  }
  // tout près : les flammes surgissent en bas de l'écran
  if (gap < 45) {
    const kk = 1 - gap / 45;
    flameWall(-10, W + 10, VIEW_H + 2, VIEW_H * 0.45 * kk, S.t, 2);
    g.fillStyle = `rgba(255,120,20,${0.15 * kk * fl})`; g.fillRect(0, 0, W, VIEW_H);
  }
}
// panneau à quai (à la place du trafic) : la vague, le temps restant, les voyageurs sauvés
function drawFirePanel(x, y, w) {
  const gap = fireGap(), h = 44, col = fireCol(gap);
  g.fillStyle = 'rgba(10,6,4,0.88)'; g.fillRect(x, y, w, h);
  g.strokeStyle = col; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt('VAGUE DE FEU', x + 5, y + 10, 10, '#d8a890');
  txt(S.fire.safe ? 'ABRI FERMÉ' : `${Math.max(0, Math.round(gap))} m · ${Math.max(0, Math.floor(fireEta()))} s`, x + w - 5, y + 10, 11, S.fire.safe ? '#7dff8a' : col, 'right');
  // frise de la ligne : vague, rame, terminus
  const lx = x + 6, lw = w - 12, ly = y + 21, end = STATIONS[STATIONS.length - 1].pos, z0 = -FIRE_START;
  const X = z => lx + lw * Math.max(0, Math.min(1, (z - z0) / (end - z0)));
  g.fillStyle = '#3a3e48'; g.fillRect(lx, ly - 0.5, lw, 1);
  STATIONS.forEach(st => { g.fillStyle = st.burnt ? '#ff5a2a' : '#8fa0b8'; g.fillRect(X(st.pos) - 0.5, ly - 2, 1, 4); });
  const fx = X(S.fire.z), gr = g.createLinearGradient(lx, 0, fx + 1, 0); gr.addColorStop(0, 'rgba(120,20,0,0.6)'); gr.addColorStop(1, '#ffb030');
  g.fillStyle = gr; g.fillRect(lx, ly - 2.5, Math.max(0, fx - lx), 5);
  g.fillStyle = '#ffffff'; g.fillRect(X(S.pos - TRAIN_LEN), ly - 2, Math.max(2, X(S.pos) - X(S.pos - TRAIN_LEN)), 4);
  const tf = Math.round(tractionF() * 100);
  txt(`À bord ${S.load}`, x + 5, y + 38, 10, '#7dff8a');
  const ib = imbalance(), blinkI = ib > 0.3 && Math.floor(S.t * 4) % 2;
  txt(`⚙ ${tf} %`, x + w * 0.62, y + 38, 10, blinkI ? '#ff4a3a' : tf > 80 ? '#9fe0ff' : tf > 60 ? '#ffd75e' : '#ff8a5b', 'center');
  if (ib > 0.05) { g.fillStyle = 'rgba(120,20,10,0.9)'; g.fillRect(x, y - 10, w, 9); txt(`RAME DÉSÉQUILIBRÉE : traction −${Math.round(IMB_TRAC * ib * 100)} % · V${heavyCar() + 1} surchargée`, x + w / 2, y - 3, 9, '#ffd0c8', 'center', 'VT323', w - 4); }
  txt(`† ${S.lost}`, x + w - 5, y + 38, 10, S.lost ? '#ff8a5b' : '#6f7a90', 'right');
}
function shiftSchedule(from, add) { for (let k = from; k < STATIONS.length; k++) { STATIONS[k].arr += add; STATIONS[k].dep += add; } }
function startLeg() {
  S.trace = [];
  S.vacT = Math.min(S.vacT, 25 + Math.random() * 15);
  S.runners = 0; S.waves = 0; S.waveT = 0;
  S.entryDelta = null;
  S.schedShow = S.clock - STATIONS[S.cur].dep;
  S.theft = null;
  const sus = S.suspects.find(x => !x.pending);
  if (sus) S.theft = { car: sus.car, at: S.clock + 2 + Math.random() * 4, shown: false };
  S.inc = null; S.limit = 0; S.sigRed = 0; S.sigPos = null; S.alarm = null; S.overT = 0; S.sw = null; S.mg = null; S.rev = null; S.bends = []; S.btrace = []; S.bendTr = null; S.barr = null; S.backup = null;
  if (S.next >= STATIONS.length) return;
  S.person = null; S.dog = null; S.blackout = 0; S.malaise = null; S.cab = null;
  if (!S.dirtyKeep) S.dirtyCar = -1;
  const n = STATIONS[S.next], cur = STATIONS[S.cur], L = LN();
  let r = Math.random() * 0.7 / L.inc;   // probabilité d'événement = L.inc
  // fin du monde : plus personne pour gérer travaux, alarmes, voyageurs égarés ou malaises. Restent les pannes et la foule
  if (FIRE() && ((r >= 0.07 && r < 0.14) || (r >= 0.21 && r < 0.60) || (r >= 0.70 && r < 0.80))) r = Math.random() < 0.5 ? 0.15 : 0.65;
  const D = n.pos - cur.pos, last = S.next === STATIONS.length - 1;
  let text = '', add = 0, col = '#ffb35e';
  if (r < 0.07) { S.inc = 'signal'; S.sigPos = cur.pos + 16; S.sigRed = FIRE() ? 3 + Math.random() * 3 : 5 + Math.random() * 5; add = Math.ceil(S.sigRed) - 1; text = 'INCIDENT : signal rouge en sortie de station'; }
  else if (r < 0.14) { S.inc = 'limit'; S.limit = 30; S.limitT = S.limitT0 = 18; add = 8; text = 'INCIDENT : travaux, vitesse limitée à 30 km/h'; }
  else if (r < 0.21) {
    S.inc = 'crowd'; n.crowd = true; text = FIRE() ? `Foule de réfugiés à ${n.name} : préparez-vous à embarquer` : `INCIDENT : quai bondé à ${n.name}`;
    const cnt = 26 + Math.floor(Math.random() * 9);
    const target = Math.max(cnt, n.people.length + 12);
    for (let k = n.people.length; k < target; k++) n.people.push(mkPerson(n.pos - 68 + Math.random() * 70, 2.2 + Math.random() * 3.6));
  }
  else if (r < 0.28) { S.inc = 'alarm'; S.alarmAt = S.clock + 2 + Math.random() * 3; }
  else if (r < 0.40) {           // 1. voyageur égaré sur la voie, au milieu de l'interstation
    S.inc = 'person'; add = 8;
    S.person = { pos: cur.pos + D * (0.4 + Math.random() * 0.25), x: 0.1, state: 'track', seen: false, hit: false, walk: 0,
      look: Object.assign(mkPerson(0, 0), { kind: 'adult', kid: null, acc: pick(['phone', 'backpack', null]), acc2: null, c: pick(['#ffcc00', '#ff6a00', '#e8e8e8']), dir: -1 }) };
  }
  else if (r < 0.51 && !FIRE()) {   // 2. ordre du PCC (pas pendant la fuite) : station fermée (traversée sans arrêt) ou régulation (arrêt prolongé)
    S.inc = 'pcc'; col = '#9fe0ff';
    // régulation : marquer l'arrêt 10 s de plus à la prochaine station
    n.dep += 10; shiftSchedule(S.next + 1, 10);
    text = `📻 PCC : régulation. Marquez l'arrêt 10 s de plus à ${n.name}.`;
    beep(1400, 0.05, 'square', 0.04); noise(0.4, 0.08, 'bandpass', 1800, 2);
  }
  else if (r < 0.60) {           // 5. malaise voyageur : arrêt obligatoire et intervention des secours
    S.inc = 'malaise'; S.malaise = { type: 'malaise', car: Math.floor(Math.random() * 5), at: S.clock + 4 + Math.random() * 6, shown: false, called: false, t: 0,
      look: mkPerson(0, 0), look2: mkPerson(0, 0), side: [mkPerson(0, 0), mkPerson(0, 0)], falls: 0, fallT: 0 };
  }
  else if (r < 0.70) {           // 7. coupure d'éclairage dans le tunnel
    S.inc = 'blackout'; S.blackout = 1; S.blackT = 0;
    text = 'Coupure d\'éclairage ! Fiez-vous aux phares, aux panneaux, à la courbe et aux bips.';
  }
  else if (r < 0.80 && D > 160) {   // 9. chien errant sur la voie : il trottine devant la rame, le klaxon le fait courir
    S.inc = 'dog';
    S.dog = { pos: cur.pos + D * (0.3 + Math.random() * 0.2), x: (Math.random() - 0.5) * 0.6, state: 'sit', seen: false, hit: false,
      walk: 0, stT: 1.5, runT: 0, horns: 0, wag: 0, col: pick(['#8a5a2a', '#2a2420', '#c8a060', '#e8e0d0', '#6a6a6a']) };
  }
  S.swCleared = false; const ch = FIRE() && !n.grill ? pick(['sw', 'barr', 'bends']) : null;   // fuite : un défi par tunnel, à parts égales
  if (ch === null || ch === 'sw') planSwitch(cur, n, D, L); else { S.sw = null; S.swQueue = null; }
  if (S.sw) S.bends = []; else if (!((ch === null || ch === 'barr') && planBarricade(cur, n, ch === 'barr'))) planBends(cur, n, D, L); addSwBends();   // un tunnel = des virages OU des aiguillages, jamais les deux
  if (n.zombie) setTimeout(() => { if (S.mode === 'running' && STATIONS[S.next] === n) { msg(`☣ PCC : ${n.name} est infestée de zombies ! NE VOUS ARRÊTEZ PAS : traversez la station.`, '#9aff6a', 6); for (let i = 0; i < 3; i++) beep(520, 0.12, 'sawtooth', 0.05, i * 0.2); } }, 3500);
  if (S.swCleared) text = '';
  if (text) msg(text, col, 5);   // le temps perdu n'est pas rendu : il faudra le rattraper
  // incidents à bord (vus sur la caméra intérieure), tirés à part : ils s'ajoutent aux incidents de voie
  if (!FIRE() && !S.malaise && Math.random() < Math.min(0.65, 0.2 + 0.5 * L.inc)) {
    const types = ['sick', 'fight', 'bag', 'slip', 'vendor'].filter(t => t !== 'sick' || S.dirtyCar < 0);
    S.cab = { type: pick(types), car: Math.floor(Math.random() * 5), at: S.clock + 3 + Math.random() * 6, shown: false, called: false, t: 0,
      look: mkPerson(0, 0), look2: mkPerson(0, 0), side: [mkPerson(0, 0), mkPerson(0, 0)], falls: 0, fallT: 0, hardT: 0 };
    if (S.cab.type === 'vendor') Object.assign(S.cab.look, { outfit: 'puffer', c: '#3a3a44', hat: 'cap' });
  }
}
function updateEvents(dt) {
  if (S.phase !== 'drive') return;
  // voyageur sur la voie
  const pe = S.person;
  if (pe && pe.state !== 'safe') {
    const dp = pe.pos - S.pos;
    if (!pe.seen && dp < 110) {
      pe.seen = true; msg('⚠ PERSONNE SUR LA VOIE ! Freinez ou klaxonnez (K)', '#ff4a3a', 4);
      for (let i = 0; i < 3; i++) beep(1250, 0.12, 'square', 0.05, i * 0.18);
    }
    if (pe.state === 'track') {
      if (S.v === 0 && dp > 0 && dp < 70) pe.state = 'leaving';                         // le train s'est arrêté : elle quitte la voie
      if (dp < 1.2 && S.v > 0.3) { pe.hit = true; gameOver('Voyageur percuté', 'Il fallait freiner jusqu\'à l\'arrêt ou klaxonner (K) à temps.'); }
    }
    if (pe.state === 'leaving') {
      pe.x = Math.max(-2.0, pe.x - dt * 1.4); pe.walk += dt * 9;
      if (pe.x <= -2.0) { pe.state = 'safe'; if (!pe.hit) { S.score += 40; msg('Voie dégagée, personne en sécurité (+40)', '#7dff8a', 3); } }
    }
  }
  // chien errant : alterne assis / trottine ; s'enfuit en courant au klaxon, quitte la voie si on s'arrête
  const dg = S.dog;
  if (dg && dg.state !== 'safe') {
    const dp = dg.pos - S.pos, st = STATIONS[S.next];
    dg.wag += dt * (dg.state === 'sit' ? 10 : 4);
    if (!dg.seen && dp < 120) {
      dg.seen = true; msg('🐕 CHIEN SUR LA VOIE ! Ralentissez, klaxonnez (K)', '#ff4a3a', 4);
      for (let i = 0; i < 2; i++) beep(1250, 0.12, 'square', 0.05, i * 0.18);
    }
    if (dg.state === 'sit' || dg.state === 'trot') {
      dg.stT -= dt;
      if (dg.stT <= 0) { dg.state = dg.state === 'sit' ? 'trot' : 'sit'; dg.stT = dg.state === 'trot' ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5; }
      if (dg.state === 'trot') { dg.pos += 2.6 * dt; dg.walk += dt * 9; }
      if (S.v === 0 && dp > 0 && dp < 60) { dg.stT2 = (dg.stT2 || 0) + dt; if (dg.stT2 > 2) { dg.state = 'leaving'; msg('Rame à l\'arrêt : le chien s\'éloigne de la voie', '#9fe0ff', 2.5); } }
    } else if (dg.state === 'run') {
      dg.runT -= dt; dg.pos += 7 * dt; dg.walk += dt * 16;
      if (dg.runT <= 0) { dg.state = 'sit'; dg.stT = 1 + Math.random(); }
    }
    if (st && dg.pos > st.pos - 45 && dg.state !== 'leaving') { dg.state = 'leaving'; }   // il ne va pas jusqu'au quai
    if (dg.state === 'leaving') {
      dg.x = Math.max(-2.1, dg.x - dt * 2.2); dg.walk += dt * 14;
      if (dg.x <= -2.1) { dg.state = 'safe'; if (!dg.hit) { S.score += 30; msg('Voie dégagée, le chien est sain et sauf (+30)', '#7dff8a', 3); } }
    }
    if (dg.state !== 'safe' && dg.state !== 'leaving' && dp < 1.2 && dp > -2 && S.v > 0.3 && !dg.hit) {
      dg.hit = true; dg.state = 'safe'; S.ebrake = true;
      pen(-60, 'Chien percuté : freinage d\'urgence');
      noise(0.25, 0.3, 'lowpass', 300, 0.5);
    }
  }
  // malaise : l'interphone sonne quelques secondes après le départ
  const ml = S.malaise;
  if (ml && !ml.shown && S.clock >= ml.at) {
    ml.shown = true;
    msg(`📞 Interphone V${ml.car + 1} : malaise voyageur ! Arrêt obligatoire à ${STATIONS[S.next].name}. A : prévenir le PCC`, '#ff6b5b', 6);
    ml.t = 0;
    for (let i = 0; i < 4; i++) beep(i % 2 ? 700 : 900, 0.15, 'sine', 0.05, i * 0.2);
  }
  const sk = S.cab;
  if (sk && !sk.shown && S.clock >= sk.at) {
    sk.shown = true; const v = `V${sk.car + 1}`;
    msg('📞 Interphone ' + v + ' : ' + {
      sick: 'un voyageur est malade ! A : prévenir le PCC pour le nettoyage',
      fight: 'bagarre entre voyageurs ! A : appeler la sécurité',
      bag: 'bagage abandonné sur un siège ! A : le signaler au PCC',
      slip: 'café renversé, le sol glisse ! Freinez en douceur jusqu\'à la station',
      vendor: 'un vendeur à la sauvette passe dans la rame. A : annonce au micro',
    }[sk.type], '#ff6b5b', 6);
    for (let i = 0; i < 4; i++) beep(i % 2 ? 700 : 900, 0.15, 'sine', 0.05, i * 0.2);
  }
  if (ml && ml.shown) {
    ml.t += dt;
    if (!ml.called && !ml.expired && ml.t > CAM_WIN) { ml.expired = true; msg('Trop tard pour prévenir : les secours mettront plus longtemps', '#ff8a7a', 3); }
  }
  if (sk && sk.shown) {
    sk.t += dt; sk.fallT = Math.max(0, sk.fallT - dt);
    if (!sk.called && !sk.expired && sk.type !== 'slip' && sk.t > CAM_WIN) { sk.expired = true; msg(`Trop tard : incident en V${sk.car + 1} non traité`, '#ff8a7a', 3); }
    if (sk.type === 'slip' && sk.t > SLIP_T) { if (!sk.dry) { sk.dry = true; msg(`Sol sec en V${sk.car + 1} : freinez normalement`, '#7dff8a', 2.5); } }
    else if (sk.type === 'slip') {   // freinage appuyé trop longtemps (ou d'urgence) : un voyageur tombe
      sk.hardT = (S.brakeF >= 0.95 || S.ebrake) && S.v > 1 ? sk.hardT + dt : 0;
      if (sk.hardT > 0.35 && sk.fallT <= 0) { sk.falls++; sk.fallT = 2.5; sk.hardT = 0; pen(-15, `Voyageur tombé en V${sk.car + 1} : freinage trop brusque`); noise(0.2, 0.2, 'lowpass', 400, 0.6); }
    }
  }
  if (S.blackout) { S.blackT += dt; if (S.blackT > BLACK_T) { S.blackout = 0; msg('Éclairage rétabli', '#7dff8a', 2); } }
  if (S.limit && S.inc === 'limit') { S.limitT -= dt; if (S.limitT <= 0) { S.limit = 0; S.inc = null; msg('Fin de la zone de travaux', '#7dff8a', 2); } }
  const dgg = S.dog;
  if (dgg && dgg.seen && ['sit', 'trot', 'run'].includes(dgg.state)) { dgg.t = (dgg.t || 0) + dt; if (dgg.t > DOG_T) { dgg.state = 'leaving'; msg('Le chien quitte la voie de lui-même', '#9fe0ff', 2.5); } }
  const pee = S.person;
  if (pee && pee.seen && pee.state === 'track') { pee.t = (pee.t || 0) + dt; if (pee.t > PERSON_T) { pee.state = 'leaving'; msg('La personne quitte la voie', '#9fe0ff', 2.5); } }
}
const BLACK_T = 15, DOG_T = 16, PERSON_T = 12;
// incidents en cours : une étiquette par incident, avec une barre qui se vide jusqu'à sa fin
function drawIncidentBars() {
  if (S.mode !== 'running' || S.phase !== 'drive' || S.over || S.mg) return;
  const L = [], sk = S.cab, ml = S.malaise, th = S.theft, dg = S.dog, pe = S.person;
  const NAME = { sick: 'MALADE', fight: 'BAGARRE', bag: 'BAGAGE', vendor: 'VENDEUR', slip: 'SOL GLISSANT' };
  if (ml && ml.shown && !ml.called && !ml.expired) L.push([`MALAISE V${ml.car + 1} · A`, 1 - ml.t / CAM_WIN, '#ff6b5b']);
  if (sk && sk.shown && sk.type === 'slip' && !sk.dry) L.push([`SOL GLISSANT V${sk.car + 1}`, 1 - sk.t / SLIP_T, '#ffb35e']);
  else if (sk && sk.shown && !sk.called && !sk.expired) L.push([`${NAME[sk.type]} V${sk.car + 1} · A`, 1 - sk.t / CAM_WIN, '#ff6b5b']);
  if (th && th.shown && !th.expired) L.push([`VOL V${th.car + 1} · A`, 1 - th.t / CAM_WIN, '#ff6b5b']);
  if (S.limit && S.inc === 'limit') L.push([`TRAVAUX ${S.limit} km/h`, S.limitT / S.limitT0, '#ffb35e']);
  if (S.blackout) L.push(['COUPURE D\'ÉCLAIRAGE', 1 - S.blackT / BLACK_T, '#9fb3d8']);
  if (S.sigRed > 0) L.push(['SIGNAL ROUGE', Math.min(1, S.sigRed / 10), '#ff4a3a']);
  if (dg && dg.seen && ['sit', 'trot', 'run'].includes(dg.state)) L.push(['CHIEN SUR LA VOIE · K', 1 - (dg.t || 0) / DOG_T, '#ffb35e']);
  if (pe && pe.seen && pe.state === 'track') L.push(['PERSONNE SUR LA VOIE · K', 1 - (pe.t || 0) / PERSON_T, '#ff4a3a']);
  const w = S.sw;
  const nx = w && w.kind === 'fork' && w.tot && w.plan && w.plan[w.idx] && (w.passed || w.pos - S.pos < (FIRE() ? FIRE_LOCK : (w.lock || SW_LOCK))) ? w.plan[w.idx] : null;
  if (nx) L.push([`AIGUILLE ${w.idx + 1}/${w.tot} · ${nx.want === 'D' ? '← DIRECT' : FIRE() ? '→ DÉVIÉ' : '→ DÉVIÉ 30'}${nx.set0 ? (nx.set0 === nx.want ? ' · tracé ✓' : ' · MAUVAISE DIRECTION') : ' · CHOISISSEZ !'}`, 1, nx.set0 === nx.want ? '#7dff8a' : (Math.floor(S.t * 4) % 2 ? '#ff6b5b' : '#ffd75e')]);   // la suivante, dès que la précédente est passée
  else if (w && w.kind === 'fork' && !w.passed) L.push(w.fixT > 0 ? ['AIGUILLE EN MOUVEMENT', w.fixT / (w.fix || SW_FIX), '#ffd75e'] : [`${w.tot ? `AIGUILLE ${w.idx}/${w.tot}` : 'BIFURCATION'} · ${w.want === 'D' ? '← DIRECT' : FIRE() ? '→ DÉVIÉ' : '→ DÉVIÉ 30'}${w.plan && w.plan[w.idx] ? ` · puis ${w.plan[w.idx].want === 'D' ? '←' : '→'}` : ''}`, (w.pos - S.pos) / w.d0, w.tgt === w.want ? '#9fe0ff' : '#ff6b5b']);
  if (w && w.kind === 'merge' && w.eta !== null && swRed()) L.push(['TRAVERSÉE · cédez', (w.eta + 0.8 - S.clock) / (w.eta + 0.8 - w.start), '#ffd75e']);
  if (w && w.kind === 'manual' && !w.done) L.push([S.mg ? 'COMMANDE DE SECOURS' : 'AIGUILLE EN PANNE · ARRÊTEZ-VOUS', S.mg ? 1 - S.mg.hits / DDR_NEED : Math.max(0, (w.sig - S.pos) / w.d0), '#ff8a5b']);
  const bz = S.barr;
  if (bz && !bz.broken && bz.pos - S.pos < 300) L.push([S.backup ? 'MARCHE ARRIÈRE · ÉLAN' : `BARRICADE · ${bz.need} km/h mini · vous ${Math.round(S.v * 3.6)}`, Math.max(0, Math.min(1, (bz.pos - S.pos) / 300)), S.v * 3.6 >= bz.need ? '#7dff8a' : '#ff8a5b']);
  const st = STATIONS[S.next], dz = st ? st.pos - S.pos : 99, top = dz <= 15 && dz >= -PE ? 80 : 6;   // sous le zoom d'arrêt s'il est affiché
  L.forEach(([lab, fr, col], i) => {
    const w = 112, h = 13, x = W - 6 - w, y = top + i * 15;
    g.fillStyle = 'rgba(6,8,14,0.6)'; g.fillRect(x, y, w, h);
    g.fillStyle = col; g.fillRect(x, y, 2, h);
    txt(lab, x + 5, y + 8.5, 10, '#ffffff', 'left', 'VT323', w - 8);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 4, y + h - 3, w - 6, 2);
    g.fillStyle = fr < 0.3 ? '#ff4a3a' : col; g.fillRect(x + 4, y + h - 3, (w - 6) * Math.max(0, Math.min(1, fr)), 2);
  });
}
// ---------- Mode feu : zombies agrippés au pare-brise (en traversant une station infestée) ----------
// Ils masquent la vue. Un frein d'urgence (B) donné au bon moment les projette tous ; un virage pris vite en décroche un ; ceux qui restent
// jusqu'à la station suivante se faufilent dans la rame et contaminent des voyageurs.
const WZ_SKIN = ['#7f9a6a', '#6e8a5c', '#8aa276', '#748f63'];
function windZombiesJump(st, nForce) {
  const kmh = S.v * 3.6, n = nForce || (kmh >= 55 ? 1 : kmh >= 35 ? 2 : 3);
  if (!S.wz) S.wz = [];
  const slots = [0.24, 0.5, 0.76].sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) S.wz.push({ x: W * slots[i] + (Math.random() - 0.5) * 30, y: VIEW_H - 40 - Math.random() * 30, s: 0.85 + Math.random() * 0.35,
    skin: pick(WZ_SKIN), ph: Math.random() * 6, t: 0, off: false, vx: 0, vy: 0, rot: 0, a: 1, land: 0.25 + i * 0.18 });
  msg(`☣ ${n} zombie${n > 1 ? 's' : ''} sur le pare-brise ! B quand l'aiguille est dans le rouge pour ${n > 1 ? 'les ' : 'l\''}arracher`, '#9aff6a', 3.5);
  noise(0.3, 0.35, 'lowpass', 300, 0.8); beep(90, 0.2, 'triangle', 0.25);
}
const wzOn = () => (S.wz || []).filter(z => !z.off);
function wzDetach(why) {
  const z = wzOn()[0]; if (!z) return;
  z.off = true; z.vx = (z.x < W / 2 ? -1 : 1) * (120 + Math.random() * 80); z.vy = why === 'brake' ? -60 : 20; z.rot = 0;
  if (!S.smears) S.smears = [];
  S.smears.push({ x: z.x, y: z.y - 20 * z.s, s: z.s, t: 0 });
  S.score += 15; noise(0.25, 0.25, 'lowpass', 400, 0.8); beep(150, 0.12, 'sawtooth', 0.06);
  msg(why === 'brake' ? 'Zombie décroché par le freinage (+15)' : 'Le virage a décroché un zombie (+15)', '#7dff8a', 1.8);
}
function updateWindZombies(dt) {
  if (!FIRE() || S.mode !== 'running') return;
  // saut au milieu du quai d'une station infestée qu'on traverse
  const st = STATIONS[S.next];
  if (st && st.zombie && S.phase === 'drive' && !st.wzDone && S.v > 2 && S.pos > st.pos - PL * 0.5) { st.wzDone = true; windZombiesJump(st); }
  if (S.wzPend && (S.wzPend.t -= dt) <= 0) { const n = S.wzPend.n; S.wzPend = null; if (S.phase === 'drive') windZombiesJump(null, n); }   // après une barricade
  if (S.smears) { S.smears.forEach(s => s.t += dt); S.smears = S.smears.filter(s => s.t < 18); }
  if (!S.wz || !S.wz.length) return;
  for (const z of S.wz) {
    z.t += dt; z.ph += dt;
    if (z.off) { z.x += z.vx * dt; z.y += z.vy * dt; z.vy += 500 * dt; z.rot += (z.vx > 0 ? 3 : -3) * dt; z.a = Math.max(0, z.a - dt * 1.4); }
  }
  S.wz = S.wz.filter(z => !z.off || z.a > 0);
  if (S.phase !== 'drive') return;
  // virage pris assez vite : la force centrifuge en arrache un de temps en temps
  const b = bendHere();
  if (b && S.v * 3.6 > 22 && wzOn().length) { S.wzBend = (S.wzBend || 0) + dt; if (S.wzBend > 1.1) { S.wzBend = 0; wzDetach('bend'); } } else S.wzBend = 0;
}
// frein d'urgence (B) : un seul coup, au bon moment. Quand des zombies sont sur la vitre, une jauge apparaît :
// une aiguille balaie d'un bout à l'autre, et il faut frapper B quand elle est dans la zone rouge.
// Dans le rouge : freinage violent (la cabine plonge, étincelles, secousse), les zombies sont arrachés.
// À côté : simple freinage d'urgence, ils restent accrochés. Dans les deux cas la rame s'arrête,
// puis 2 s de réarmement : la tentative coûte cher, on ne la tente pas au hasard.
const EB_SOFT = 3, EB_HARD = 9, EB_REARM = 2, EB_EJECT = 20;   // m/s² (raté / réussi), s, km/h minimum pour éjecter
const EB_SWEEP = 0.6, EB_ZONE = 0.84;   // durée d'un balayage (s), début de la zone rouge (0 → 1)
// position de l'aiguille : aller-retour régulier
const ebNeedle = () => { const k = ((S.ebSw || 0) / EB_SWEEP) % 2; return k < 1 ? k : 2 - k; };
const ebDec = () => S.eb && S.eb.hit ? EB_HARD : EB_SOFT;
function emergencyBrake() {
  if (S.over || S.phase !== 'drive' || S.rev || S.backup || S.mg || S.blast) return;
  S.ebPressT = S.t;   // le coup de poing du pupitre s'enfonce
  if (S.eb) return;   // un seul coup
  if (S.v < 0.5) { msg('Frein d\'urgence : la rame est déjà à l\'arrêt', '#ffb35e', 1.5); return; }
  const on = wzOn(), needle = ebNeedle(), hit = !on.length || needle >= EB_ZONE;   // sans zombie, pas de jauge : freinage violent d'office
  S.eb = { t: 0, hit, p: hit ? 1 : 0.25, ejected: false, sp: [], pit: 0, needle, zg: on.length > 0, judged: !on.length };
  noise(0.9, hit ? 0.45 : 0.25, 'highpass', 2800, 2); noise(0.4, hit ? 0.4 : 0.2, 'lowpass', 260, 0.8); beep(70, 0.25, 'square', hit ? 0.18 : 0.1);
  if (on.length && !hit) { msg('Raté ! Coup de frein trop mou : les zombies tiennent bon', '#ff6b5b', 2.5); sfxBad(); }
  else if (!on.length) msg('🛑 FREIN D\'URGENCE', '#ffb35e', 1.5);
  if (!FIRE()) pen(-30, `Freinage d'urgence à ${Math.round(S.v * 3.6)} km/h : voyageurs bousculés`);
}
function updateEmergencyBrake(dt) {
  // l'aiguille ne tourne que lorsqu'il y a des zombies à arracher
  if (!S.eb && FIRE() && S.phase === 'drive' && wzOn().length) S.ebSw = (S.ebSw || 0) + dt; else if (!S.eb) S.ebSw = 0;
  const e = S.eb; if (!e) return;
  e.t += dt;
  const moving = S.v > 0.5 && !e.stopT;
  // plongée de la cabine : forte si le coup est réussi
  const tgt = moving ? e.p * Math.min(1, S.v * 3.6 / 40) * 18 : 0;
  e.pit += (tgt - e.pit) * Math.min(1, dt * 12);
  // étincelles sous les roues
  if (moving) for (let i = 0; i < 1 + Math.round(e.p * 6); i++) { const sd = Math.random() < 0.5 ? -1 : 1;
    e.sp.push({ x: W / 2 + sd * (W * 0.3 + Math.random() * 40), y: VIEW_H - 6, vx: sd * (60 + Math.random() * 160), vy: -40 - Math.random() * 170, t: 0 }); }
  for (const p of e.sp) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; }
  e.sp = e.sp.filter(p => p.t < 0.5);
  if (moving) S.shake = Math.max(S.shake, 0.1 + e.p * Math.min(0.5, S.v / 40));
  // coup réussi : au pic de la secousse (0,2 s), les zombies sont arrachés
  if (!e.judged && e.hit && e.t >= 0.2) {
    e.judged = true;
    const on = wzOn();
    if (on.length && S.v * 3.6 >= EB_EJECT) {
      e.ejected = true;
      if (!S.smears) S.smears = [];
      for (const z of on) {   // projetés vers l'avant, dans le tunnel
        z.off = true; z.vx = (z.x - W / 2) * 0.9 + (Math.random() - 0.5) * 90; z.vy = -300 - Math.random() * 140; z.rot = 0;
        S.smears.push({ x: z.x, y: z.y - 20 * z.s, s: z.s, t: 0 });
      }
      S.score += 15 * on.length; S.shake = 0.8;
      noise(0.3, 0.35, 'lowpass', 500, 0.8); beep(130, 0.15, 'sawtooth', 0.08);
      msg(`💥 PILE DANS LE ROUGE ! ${on.length} zombie${on.length > 1 ? 's projetés' : ' projeté'} (+${15 * on.length})`, '#7dff8a', 2.5);
    } else if (on.length) msg(`Trop lent pour les arracher : il faut rouler à ${EB_EJECT} km/h ou plus`, '#ff6b5b', 2.5);
  }
  if (S.v <= 0.05 && !e.stopT) { e.stopT = e.t; S.ebT = EB_REARM; e.bounce = e.pit; S.ebSw = 0; }
  if (e.stopT) { const k = e.t - e.stopT; e.pit = (e.bounce || 0) * Math.cos(k * 9) * Math.exp(-k * 5); }
  if (e.stopT && e.t - e.stopT > 0.6 && !e.sp.length) S.eb = null;
}
const ebPitch = () => S.eb ? S.eb.pit : 0;
function drawEmergencyBrake() {
  const e = S.eb;
  if (e) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of e.sp) { const a = 1 - p.t / 0.5; g.strokeStyle = `rgba(255,${190 + Math.random() * 60 | 0},90,${a})`; g.lineWidth = 2;
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025); g.stroke(); }
    g.restore();
    if (!e.stopT && Math.floor(e.t * 6) % 2 === 0) { g.fillStyle = `rgba(255,40,30,${0.04 + e.p * 0.1})`; g.fillRect(0, 0, W, VIEW_H); }   // voyant rouge
  }
  // jauge de timing : visible tant que des zombies sont sur la vitre (et juste après le coup, figée)
  const show = e ? e.zg && e.t < 0.9 : FIRE() && S.phase === 'drive' && wzOn().length > 0;   // après le coup : l'aiguille reste figée un instant
  if (!show) return;
  const bw = 150, bx = W / 2 - bw / 2, by = 62, nd = e ? e.needle : ebNeedle(), inZone = nd >= EB_ZONE;
  g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(bx - 6, by - 14, bw + 12, 28);
  const title = e ? (e.hit ? 'PILE DANS LE ROUGE !' : 'RATÉ…') : 'FREIN D\'URGENCE : B DANS LE ROUGE !';
  txt(title, W / 2, by - 3, 10, e ? (e.hit ? '#7dff8a' : '#ff6b5b') : '#ffd75e', 'center');
  // fond : dégradé du jaune au rouge, zone rouge vive au bout
  const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#3a3216'); gr.addColorStop(EB_ZONE - 0.01, '#6a4a16'); gr.addColorStop(EB_ZONE, '#c8281c'); gr.addColorStop(1, '#ff3b2b');
  g.fillStyle = gr; g.fillRect(bx, by, bw, 8);
  if (!e && inZone) { g.fillStyle = 'rgba(255,90,70,0.35)'; g.fillRect(bx + bw * EB_ZONE - 2, by - 2, bw * (1 - EB_ZONE) + 4, 12); }   // la zone s'allume quand l'aiguille y est
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.6; g.strokeRect(bx + bw * EB_ZONE, by, bw * (1 - EB_ZONE), 8);
  // aiguille
  const nx = bx + bw * nd;
  g.fillStyle = '#ffffff'; g.fillRect(nx - 1, by - 3, 2, 14);
  g.beginPath(); g.moveTo(nx - 3, by - 5); g.lineTo(nx + 3, by - 5); g.lineTo(nx, by - 1); g.fill();
}
// à l'arrivée en station : ceux qui sont encore agrippés se faufilent dans la rame
function windZombiesBoard() {
  const on = wzOn(); if (!on.length || !FIRE()) return;
  let lost = 0;
  for (let i = 0; i < on.length; i++) { const c = heavyCar(), k = Math.min(S.cars[c], 6); S.cars[c] -= k; S.load -= k; lost += k; }
  S.lost += lost; S.score -= 40 * on.length; S.wz = [];
  msg(`☣ ${on.length} zombie${on.length > 1 ? 's' : ''} du pare-brise se faufile${on.length > 1 ? 'nt' : ''} dans la rame : ${lost} voyageurs contaminés`, '#9aff6a', 4);
  beep(140, 0.25, 'sawtooth', 0.06); noise(0.3, 0.2, 'bandpass', 400, 3);
}
// rendu : visages et mains plaqués contre la vitre, traces laissées sur le verre
function drawWindZombies() {
  // traînées laissées sur la vitre : sang séché et crasse qui coulent
  if (S.smears) for (const s of S.smears) {
    const a = 0.5 * (1 - s.t / 18), run = Math.min(1, s.t / 3);
    for (let k = 0; k < 5; k++) {
      const dx = (k - 2) * 7 * s.s, x0 = s.x + dx - 2 * s.s, y0 = s.y - 8 * s.s + Math.abs(k - 2) * 2, len = (26 + k * 5 + run * 30 * ((k * 37) % 5) / 4) * s.s;
      const gr = g.createLinearGradient(0, y0, 0, y0 + len);
      gr.addColorStop(0, `rgba(80,22,14,${a})`); gr.addColorStop(0.6, `rgba(60,40,24,${a * 0.6})`); gr.addColorStop(1, 'rgba(60,40,24,0)');
      g.fillStyle = gr; g.fillRect(x0, y0, 3.5 * s.s, len);
    }
  }
  if (!S.wz || !S.wz.length) return;
  for (const z of S.wz) {
    if (z.seed === undefined) z.seed = Math.random();
    const R = texRand(Math.floor(z.seed * 1e9));   // variations propres à chaque zombie, stables d'une image à l'autre
    const land = Math.min(1, z.t / z.land), sc = z.s * (0.4 + 0.6 * land), wob = Math.sin(z.ph * 3) * 2, slide = z.off ? 0 : Math.sin(z.ph * 0.7) * 3;
    const sk = z.skin, hasWound = R() < 0.7, woundX = (R() - 0.5) * 30, woundY = -22 + R() * 14, deadEye = R() < 0.35 ? (R() < 0.5 ? -1 : 1) : 0,
      bald = R() < 0.4, jawOpen = 0.6 + 0.4 * Math.sin(z.ph * 4), shirt = ['#2b2e33', '#3a2f28', '#2c3328', '#3b3b42'][Math.floor(R() * 4)];
    g.save(); g.globalAlpha = z.a * Math.min(1, land * 1.5); g.translate(z.x + wob, z.y + slide); g.rotate(z.rot); g.scale(sc, sc);
    // buée de la respiration sur la vitre
    const br = 0.08 + 0.06 * Math.sin(z.ph * 2.2);
    let gr = g.createRadialGradient(0, 22, 2, 0, 22, 34); gr.addColorStop(0, `rgba(210,225,215,${br})`); gr.addColorStop(1, 'rgba(210,225,215,0)');
    g.fillStyle = gr; g.fillRect(-36, -12, 72, 70);
    // épaules et torse : chemise déchirée, col ouvert, taches
    gr = g.createLinearGradient(0, 28, 0, 90); gr.addColorStop(0, shirt); gr.addColorStop(1, '#0c0c0c');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-62, 90); g.quadraticCurveTo(-60, 40, -20, 34); g.lineTo(20, 34); g.quadraticCurveTo(60, 40, 62, 90); g.closePath(); g.fill();
    g.fillStyle = 'rgba(90,20,14,0.55)'; g.beginPath(); g.ellipse(-18 + R() * 30, 62, 14, 9, R(), 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-14, 36); g.lineTo(0, 58); g.lineTo(14, 36); g.stroke();   // col
    for (let k = 0; k < 4; k++) { const tx = -50 + R() * 100; g.fillStyle = '#060606'; g.beginPath(); g.moveTo(tx, 90); g.lineTo(tx + 4, 70 + R() * 10); g.lineTo(tx + 9, 90); g.fill(); }   // lambeaux
    // cou décharné
    g.fillStyle = sk; g.fillRect(-12, 22, 24, 18); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-12, 22, 6, 18); g.fillRect(4, 26, 3, 14);
    // tête : modelé par dégradé, peau grisâtre et marbrée
    gr = g.createRadialGradient(-6, -8, 4, 0, 0, 40);
    gr.addColorStop(0, '#c9cfb2'); gr.addColorStop(0.35, sk); gr.addColorStop(1, '#2e3a26');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -38); g.bezierCurveTo(26, -38, 32, -14, 28, 6); g.bezierCurveTo(25, 24, 14, 34, 0, 35); g.bezierCurveTo(-14, 34, -25, 24, -28, 6); g.bezierCurveTo(-32, -14, -26, -38, 0, -38); g.fill();
    for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${R() < 0.5 ? '60,70,40' : '110,60,70'},${0.12 + R() * 0.14})`; g.beginPath(); g.ellipse((R() - 0.5) * 40, (R() - 0.5) * 50, 4 + R() * 8, 3 + R() * 6, R() * 3, 0, 7); g.fill(); }   // marbrures
    // pommettes saillantes et joues creusées
    for (const sd of [-1, 1]) {
      g.fillStyle = 'rgba(20,30,15,0.35)'; g.beginPath(); g.ellipse(sd * 17, 14, 7, 11, sd * 0.3, 0, 7); g.fill();
      g.fillStyle = 'rgba(230,235,210,0.18)'; g.beginPath(); g.ellipse(sd * 18, 2, 7, 4, sd * -0.3, 0, 7); g.fill();
    }
    // veines sur les tempes
    g.strokeStyle = 'rgba(70,30,80,0.45)'; g.lineWidth = 0.9;
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 24, -20); g.quadraticCurveTo(sd * 18, -12, sd * 22, -2); g.moveTo(sd * 21, -14); g.lineTo(sd * 15, -10); g.stroke(); }
    // plaie ouverte
    if (hasWound) {
      g.fillStyle = '#3a0a06'; g.beginPath(); g.ellipse(woundX, woundY, 9, 3.5, 0.4, 0, 7); g.fill();
      g.fillStyle = '#8a1d12'; g.beginPath(); g.ellipse(woundX, woundY, 6, 1.8, 0.4, 0, 7); g.fill();
      g.strokeStyle = 'rgba(120,25,15,0.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(woundX + 2, woundY + 2); g.lineTo(woundX + 3, woundY + 10 + 6 * Math.min(1, z.t / 2)); g.stroke();   // filet de sang
    }
    // orbites enfoncées, yeux laiteux qui fixent le conducteur
    for (const ex of [-11, 11]) {
      gr = g.createRadialGradient(ex, -5, 1, ex, -5, 11); gr.addColorStop(0, '#0a0606'); gr.addColorStop(0.6, 'rgba(25,15,15,0.85)'); gr.addColorStop(1, 'rgba(25,15,15,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(ex, -5, 11, 9, 0, 0, 7); g.fill();
      if ((ex < 0 ? -1 : 1) === deadEye) { g.fillStyle = '#050303'; g.beginPath(); g.ellipse(ex, -4, 5, 4, 0, 0, 7); g.fill(); continue; }   // orbite vide
      const look = Math.sin(z.ph * 0.9) * 1.2;
      g.fillStyle = '#d9d6b8'; g.beginPath(); g.ellipse(ex, -4, 5.5, 4, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(160,30,30,0.6)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(ex - 5, -4); g.lineTo(ex - 2, -3); g.moveTo(ex + 5, -5); g.lineTo(ex + 2, -4); g.stroke();
      g.fillStyle = 'rgba(120,130,125,0.85)'; g.beginPath(); g.arc(ex + look, -4, 2.4, 0, 7); g.fill();   // iris voilé
      g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(ex + look, -4, 0.9, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(ex - 6, -9, 12, 2.5);   // paupière lourde
    }
    // nez écrasé contre la vitre : zone blanchie et aplatie
    g.fillStyle = 'rgba(225,230,205,0.45)'; g.beginPath(); g.ellipse(0, 7, 8, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(-3, 10, 1.8, 1.2, 0, 0, 7); g.ellipse(3, 10, 1.8, 1.2, 0, 0, 7); g.fill();
    // mâchoire béante : lèvres déchirées, dents jaunies et inégales
    const my = 21, mh = 6 + 6 * jawOpen;
    gr = g.createLinearGradient(0, my - mh, 0, my + mh); gr.addColorStop(0, '#2a0806'); gr.addColorStop(1, '#0a0202');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, my, 11, mh, 0, 0, 7); g.fill();
    g.fillStyle = '#5a1810'; g.beginPath(); g.ellipse(4, my + mh - 2, 5, 2, 0, 0, 7); g.fill();   // langue
    for (let k = -4; k <= 4; k++) { if (R() < 0.18) continue;   // dents manquantes
      g.fillStyle = R() < 0.5 ? '#c9b98a' : '#a8946a'; g.fillRect(k * 2.4 - 1, my - mh + 1, 2, 2.5 + R() * 2);
      if (Math.abs(k) < 4) g.fillRect(k * 2.4 - 1, my + mh - 3.5 - R() * 1.5, 2, 2.5); }
    g.strokeStyle = 'rgba(130,40,30,0.8)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, my, 11.5, mh + 0.5, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.strokeStyle = 'rgba(160,190,150,0.35)'; g.lineWidth = 1.2;   // bave qui coule sur le verre
    g.beginPath(); g.moveTo(-5, my + mh); g.lineTo(-6, my + mh + 6 + 10 * ((z.ph * 0.3) % 1)); g.stroke();
    // cheveux collés, en mèches (ou crâne pelé)
    g.strokeStyle = '#141410'; g.lineWidth = 2;
    const nh = bald ? 5 : 14;
    for (let k = 0; k < nh; k++) { const hx = -26 + (52 * k) / (nh - 1) + (R() - 0.5) * 4, len = 10 + R() * 16;
      g.beginPath(); g.moveTo(hx * 0.8, -36); g.quadraticCurveTo(hx * 1.05 + (R() - 0.5) * 8, -30 + len * 0.3, hx * 1.1 + (R() - 0.5) * 6, -36 + len); g.stroke(); }
    if (bald) { g.fillStyle = 'rgba(150,90,80,0.35)'; g.beginPath(); g.ellipse(6, -28, 9, 5, 0.2, 0, 7); g.fill(); }
    // contour plaqué : la tête collée au verre dessine un liseré plus clair
    g.strokeStyle = 'rgba(200,215,190,0.22)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 2, 22, 26, 0, 0, 7); g.stroke();
    // mains à plat sur la vitre : paume blanchie par la pression, phalanges, ongles noirs
    for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * 58, -16 + Math.sin(z.ph * 2 + sd) * 3); g.rotate(sd * 0.25);
      gr = g.createRadialGradient(0, 2, 2, 0, 0, 18); gr.addColorStop(0, '#d2d6bc'); gr.addColorStop(0.5, sk); gr.addColorStop(1, '#3a4a30');
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 14, 16, 0, 0, 7); g.fill();
      for (let f = -2; f <= 2; f++) {
        const L = f === 0 ? 26 : Math.abs(f) === 1 ? 24 : 18;
        g.save(); g.rotate(f * 0.3 + (f === -2 ? -0.35 : 0) * sd);
        g.fillStyle = sk; g.beginPath(); g.moveTo(-3, -10); g.lineTo(-2.4, -10 - L); g.arc(0, -10 - L, 2.4, Math.PI, 0); g.lineTo(3, -10); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-2.5, -10 - L * 0.45, 5, 1); g.fillRect(-2.2, -10 - L * 0.75, 4.4, 1);   // phalanges
        g.fillStyle = '#1e1a10'; g.beginPath(); g.arc(0, -10 - L - 0.5, 1.8, Math.PI, 0); g.fill();   // ongle
        g.fillStyle = 'rgba(230,235,215,0.3)'; g.beginPath(); g.ellipse(0, -10 - L * 0.85, 1.8, 2.6, 0, 0, 7); g.fill();   // bout du doigt écrasé
        g.restore();
      }
      g.fillStyle = 'rgba(90,20,12,0.45)'; g.beginPath(); g.ellipse(sd * 4, 6, 5, 3, 0.5, 0, 7); g.fill();   // sang sur la paume
      g.restore();
    }
    g.restore();
  }
  g.globalAlpha = 1;
}
