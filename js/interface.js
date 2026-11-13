// Dernier Métro · Pupitre, aide, messages, écrans de fin
// ---------- Interface ----------
function txt(s, x, y, size = 12, col = '#fff', align = 'left', font = 'VT323', maxW = 0) {
  g.font = `${size}px ${font}, monospace`;
  if (maxW) while (size > 7 && g.measureText(s).width > maxW) { size--; g.font = `${size}px ${font}, monospace`; }
  g.textAlign = align; g.fillStyle = col;
  g.fillText(s, Math.round(x), Math.round(y));
}
const fmt = t => { t = Math.max(0, Math.floor(t)); const h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, s = t % 60; return [h, m, s].map(v => String(v).padStart(2, '0')).join(':'); };

function drawGlass() {
  // vignette sombre sur les bords du pare-brise + léger reflet diagonal
  const vg = g.createRadialGradient(W / 2, 70, 60, W / 2, 70, 230);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = vg; g.fillRect(0, 0, W, VIEW_H);
  g.fillStyle = 'rgba(255,255,255,0.025)';
  g.beginPath(); g.moveTo(60, 0); g.lineTo(110, 0); g.lineTo(40, VIEW_H); g.lineTo(-10, VIEW_H); g.fill();
  g.beginPath(); g.moveTo(130, 0); g.lineTo(145, 0); g.lineTo(75, VIEW_H); g.lineTo(60, VIEW_H); g.fill();
}
// usure de la console : toujours au même endroit (pseudo-aléatoire stable), pour un poste de conduite qui a vécu
function drawConsoleWear(C0) {
  const top = C0 + 4, bot = H;
  // panneaux vissés : jointures et vis aux coins
  for (const sx of [56, 204, 300, 342]) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(sx, top, 0.8, bot - top);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(sx + 0.8, top, 0.5, bot - top);
  }
  for (const [x, y] of [[4, top + 3], [52, top + 3], [208, top + 3], [296, top + 3], [346, top + 3], [W - 5, top + 3], [4, bot - 14], [W - 5, bot - 14], [208, bot - 14], [296, bot - 14]]) {
    g.fillStyle = '#4a4d55'; g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill();
    g.strokeStyle = '#15161a'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x - 0.9, y - 0.3); g.lineTo(x + 0.9, y + 0.3); g.stroke();
    g.fillStyle = 'rgba(120,70,30,0.25)'; g.beginPath(); g.arc(x + 0.6, y + 0.8, 1.6, 0, 7); g.fill();   // rouille
  }
  // salissures sombres (graisse, poussière accumulée dans les coins)
  for (let i = 0; i < 22; i++) {
    const x = hsh(i, 3) * W, y = top + hsh(i, 4) * (bot - top), r = 6 + hsh(i, 5) * 16;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(10,8,5,${0.25 + hsh(i, 6) * 0.25})`); gr.addColorStop(1, 'rgba(10,8,5,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // peinture usée là où les mains se posent (devant la manette et les boutons)
  for (const [x, y, rx, ry] of [[322, top + 20, 16, 9], [250, top + 26, 34, 6], [130, top + 30, 40, 4]]) {
    const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(160,152,138,0.24)'); gr.addColorStop(1, 'rgba(150,145,135,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
  }
  // rayures fines
  g.lineWidth = 0.4;
  for (let i = 0; i < 70; i++) {
    const x = hsh(i, 11) * W, y = top + hsh(i, 12) * (bot - top - 12), l = 3 + hsh(i, 13) * 12, a = (hsh(i, 14) - 0.5) * 1.2;
    g.strokeStyle = `rgba(210,210,215,${0.1 + hsh(i, 15) * 0.16})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // rebord en caoutchouc écaillé
  for (let i = 0; i < 18; i++) { const x = hsh(i, 21) * W; g.fillStyle = 'rgba(80,80,85,0.5)'; g.fillRect(x, C0 + 0.5, 1 + hsh(i, 22) * 4, 1.2); }
  // étiquette jaunie collée au ruban adhésif, au bord du pupitre
  g.save(); g.translate(W - 9, VIEW_H - 62); g.rotate(Math.PI / 2 - 0.05);   // sur le montant droit du pare-brise
  g.fillStyle = 'rgba(220,210,170,0.85)'; g.fillRect(0, 0, 26, 7);
  g.fillStyle = 'rgba(255,255,240,0.25)'; g.fillRect(-2, -1, 6, 3); g.fillRect(22, 5, 6, 3);
  g.fillStyle = 'rgba(120,100,60,0.25)'; g.fillRect(0, 5.5, 26, 1.5);
  g.font = 'italic 5px "Comic Sans MS", "Bradley Hand", cursive'; g.fillStyle = '#3a3025'; g.textAlign = 'left'; g.fillText('rame 042', 2, 5.4);
  g.restore();
  // poussière
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(200,195,180,${0.08 + hsh(i, 31) * 0.14})`; g.fillRect(hsh(i, 32) * W, top + hsh(i, 33) * (bot - top), 0.5 + hsh(i, 34), 0.5); }
}
function drawCab() {
  if (S.phase === 'drive' || S.mode !== 'running') drawGlass();
  // montants du pare-brise (métal sombre avec arête éclairée)
  const pil = g.createLinearGradient(0, 0, 24, 0);
  pil.addColorStop(0, '#0d0e12'); pil.addColorStop(0.8, '#1c1e26'); pil.addColorStop(1, '#2a2d38');
  g.fillStyle = pil;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(24, 0); g.lineTo(12, VIEW_H); g.lineTo(0, VIEW_H); g.fill();
  const pir = g.createLinearGradient(W, 0, W - 24, 0);
  pir.addColorStop(0, '#0d0e12'); pir.addColorStop(0.8, '#1c1e26'); pir.addColorStop(1, '#2a2d38');
  g.fillStyle = pir;
  g.beginPath(); g.moveTo(W, 0); g.lineTo(W - 24, 0); g.lineTo(W - 12, VIEW_H); g.lineTo(W, VIEW_H); g.fill();
  g.fillStyle = '#14151b'; g.fillRect(0, 0, W, 6);
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 5.5, W, 0.5);
  // ---- console de cabine : plastique sombre mat, rebord caoutchouc, instruments encastrés
  const running = S.mode === 'running', atStation = running && S.phase !== 'drive';
  const kmh = Math.round(S.v * 3.6);
  const C0 = VIEW_H, SANS = '"Helvetica Neue", Arial, sans-serif';
  const dk = g.createLinearGradient(0, C0, 0, H);
  dk.addColorStop(0, '#2b2f37'); dk.addColorStop(0.25, '#22252c'); dk.addColorStop(1, '#14161b');
  g.fillStyle = dk; g.fillRect(0, C0, W, H - C0);
  g.fillStyle = '#0c0d10'; g.fillRect(0, C0, W, 3);                          // rebord (caoutchouc)
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, C0 + 3, W, 0.6);    // arête éclairée
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.012 + (i % 3) * 0.006})`; g.fillRect((i * 97) % W, C0 + 5 + (i * 13) % 30, 0.6, 0.6); }   // grain
  drawConsoleWear(C0);
  const sans = (t, x, y, sz, col, al = 'left', w = 0, bold = false) => {
    g.font = `${bold ? 'bold ' : ''}${sz}px ${SANS}`; g.textAlign = al; g.fillStyle = col;
    if (w) while (sz > 4 && g.measureText(t).width > w) { sz -= 0.5; g.font = `${bold ? 'bold ' : ''}${sz}px ${SANS}`; }
    g.fillText(t, x, y);
  };
  const IY = C0 + 4, IH = 30, cy = IY + IH / 2;   // zone des instruments

  // compteur rond à lunette chromée (0–80 km/h sur 270°)
  const gx0 = 32, gy0 = cy + 1, R = 13.5, ang = v => Math.PI * 0.75 + Math.PI * 1.5 * Math.min(80, Math.max(0, v)) / 80;
  const bez = g.createLinearGradient(gx0 - R, gy0 - R, gx0 + R, gy0 + R); bez.addColorStop(0, '#d8dde6'); bez.addColorStop(0.5, '#5d636e'); bez.addColorStop(1, '#a8afba');
  g.fillStyle = bez; g.beginPath(); g.arc(gx0, gy0, R + 1.6, 0, 7); g.fill();
  g.fillStyle = '#07080b'; g.beginPath(); g.arc(gx0, gy0, R, 0, 7); g.fill();
  g.strokeStyle = '#7a2a22'; g.lineWidth = 1.6; g.beginPath(); g.arc(gx0, gy0, R - 1.6, ang(60), ang(80)); g.stroke();
  for (let v = 0; v <= 80; v += 10) {
    const a = ang(v), r1 = R - (v % 20 ? 2.5 : 3.8);
    g.strokeStyle = '#e6e9ef'; g.lineWidth = v % 20 ? 0.5 : 0.9;
    g.beginPath(); g.moveTo(gx0 + Math.cos(a) * r1, gy0 + Math.sin(a) * r1); g.lineTo(gx0 + Math.cos(a) * (R - 0.6), gy0 + Math.sin(a) * (R - 0.6)); g.stroke();
    if (v % 20 === 0) sans(String(v), gx0 + Math.cos(a) * (R - 7), gy0 + Math.sin(a) * (R - 7) + 1.5, 4, '#9aa1ae', 'center');
  }
  const mark = (v, c) => { const a = ang(v); g.strokeStyle = c; g.lineWidth = 1.4; g.beginPath(); g.moveTo(gx0 + Math.cos(a) * (R - 4.5), gy0 + Math.sin(a) * (R - 4.5)); g.lineTo(gx0 + Math.cos(a) * (R + 1.4), gy0 + Math.sin(a) * (R + 1.4)); g.stroke(); };
  if (running && S.phase === 'drive' && S.vperm < VMAX) mark(S.vperm * 3.6, '#4fc8ff');
  const bA = running ? activeBend() : null, bLim = bA && (!S.limit || bA.lim < S.limit) ? bA.lim : 0;
  if (bLim) { mark(bLim, '#ffb35e'); mark(bLim + bendTol(), '#d42a2a'); }
  else if (S.limit) { mark(S.limit, '#ffb35e'); mark(S.limit + DERAIL, '#d42a2a'); }
  sans(String(kmh), gx0, gy0 + 8.5, 5.5, '#ffd75e', 'center', 0, true);
  const na = ang(S.v * 3.6);
  g.strokeStyle = '#ff7a2a'; g.lineWidth = 1.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(gx0 - Math.cos(na) * 2.5, gy0 - Math.sin(na) * 2.5); g.lineTo(gx0 + Math.cos(na) * (R - 2), gy0 + Math.sin(na) * (R - 2)); g.stroke(); g.lineCap = 'butt';
  g.fillStyle = '#3a3e48'; g.beginPath(); g.arc(gx0, gy0, 1.8, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.07)'; g.beginPath(); g.ellipse(gx0 - 3, gy0 - 5, 8, 4, -0.5, 0, 7); g.fill();   // reflet du verre
  if (S.limit || bLim) {   // panneau de limitation (travaux ou virage)
    const LIM = bLim || S.limit, over = kmh > LIM + 1;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(gx0 + 19, IY + 5, 5, 0, 7); g.fill();
    g.strokeStyle = '#d42a2a'; g.lineWidth = 1.2; g.beginPath(); g.arc(gx0 + 19, IY + 5, 4.4, 0, 7); g.stroke();
    sans(String(LIM), gx0 + 19, IY + 7, 4.5, over && Math.floor(S.t * 6) % 2 ? '#d42a2a' : '#111', 'center', 0, true);
  }

  // écran de bord : dalle anthracite faiblement rétroéclairée, texte ambre et blanc cassé
  const sx0 = 62, sw = 100, AMB = '#ffb547', OFF = '#e6dfcc', DIM = '#9c947e';
  // cadre épais biseauté (clair en haut à gauche, sombre en bas à droite) et deux vis
  const bx0 = sx0 - 5, by0 = IY - 3, bw = sw + 10, bh = IH + 6;
  const bz = g.createLinearGradient(bx0, by0, bx0 + bw * 0.3, by0 + bh); bz.addColorStop(0, '#4a4e57'); bz.addColorStop(0.5, '#2c3038'); bz.addColorStop(1, '#16181d');
  g.fillStyle = bz; g.fillRect(bx0, by0, bw, bh);
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(bx0, by0, bw, 0.6); g.fillRect(bx0, by0, 0.6, bh);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(bx0, by0 + bh - 0.6, bw, 0.6); g.fillRect(bx0 + bw - 0.6, by0, 0.6, bh);
  g.fillStyle = '#050608'; g.fillRect(sx0 - 1.2, IY - 0.2, sw + 2.4, IH + 0.4);       // feuillure
  for (const vx of [sx0 - 2.6, sx0 + sw + 2.6]) {
    const vg = g.createRadialGradient(vx - 0.4, cy - 0.4, 0.1, vx, cy, 1.3); vg.addColorStop(0, '#8a8e96'); vg.addColorStop(1, '#2a2d33');
    g.fillStyle = vg; g.beginPath(); g.arc(vx, cy, 1.3, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(vx - 0.9, cy + 0.5); g.lineTo(vx + 0.9, cy - 0.5); g.stroke();
  }
  const lcd = g.createLinearGradient(0, IY, 0, IY + IH); lcd.addColorStop(0, '#11171c'); lcd.addColorStop(1, '#0a0e12');
  g.fillStyle = lcd; g.fillRect(sx0, IY + 1, sw, IH - 2);
  glow(sx0 + sw / 2, IY + IH / 2, 40, '255,190,120', 0.035);                            // rétroéclairage faible
  sans(fmt(S.clock), sx0 + 5, IY + 11, 8, OFF, 'left', 0, true);
  if (atStation) {
    // ligne 1 : quand partir
    const st0 = STATIONS[S.cur];
    if (S.next < STATIONS.length && S.fire) {
      const gap = fireGap(), bl = Math.floor(S.t * 4) % 2;
      sans(gap < 80 ? 'PARTEZ !' : `feu ${Math.round(gap)} m`, sx0 + sw - 4, IY + 11, 6.5, gap < 80 ? (bl ? '#ffffff' : '#ff6b3a') : fireCol(gap), 'right', sw - 44, true);
    } else if (S.next < STATIONS.length) {
      const toDep = Math.ceil(st0.dep - S.clock), fc = departForecast(), bl = Math.floor(S.t * 4) % 2;
      const [l, c] = toDep > 0 ? [`départ dans ${toDep} s`, '#7dff8a'] : fc <= 0 ? [`partez ! marge ${Math.max(0, Math.floor(-fc))} s`, bl ? OFF : AMB] : [`retard prévu +${Math.ceil(fc)} s`, bl ? '#ff8a7a' : '#ffc0b8'];
      sans(l, sx0 + sw - 4, IY + 11, 6.5, c, 'right', sw - 44, true);
    } else sans('terminus', sx0 + sw - 4, IY + 11, 6.5, DIM, 'right');
    // ligne 2 : remplissage de la rame (5 voitures)
    const ratio = S.load / CAP, full = S.load >= CAP;
    sans('RAME', sx0 + 5, IY + 23.5, 5.5, DIM);
    for (let c = 0; c < 5; c++) {
      const fill = Math.min(1, carFill(c)), bx = sx0 + 22 + c * 10;
      g.fillStyle = '#1a1f24'; g.fillRect(bx, IY + 16, 8, 9);
      g.fillStyle = fill >= 1 ? '#ff4a3a' : fill > 0.85 ? '#ffb35e' : fill > 0.6 ? '#ffd75e' : '#7dff8a'; g.fillRect(bx, IY + 16 + 9 * (1 - fill), 8, 9 * fill);
    }
    sans(full ? 'PLEINE' : `${Math.round(ratio * 100)} %`, sx0 + sw - 4, IY + 23.5, 6, full ? '#ff8a7a' : OFF, 'right');
  } else {
  if (S.fire) sans(`🔥 ${Math.max(0, Math.round(fireGap()))} m`, sx0 + sw - 4, IY + 10, 6, fireCol(fireGap()), 'right', 0, true);
  else if (S.missed > 0) sans(`ratés ${S.missed}/${MISS_MAX}`, sx0 + sw - 4, IY + 10, 5.5, S.missed >= MISS_MAX - 1 ? '#ff8a7a' : '#ffc27a', 'right');
  if (S.next < STATIONS.length) {
    const n = STATIONS[S.next], Ln = LN();
    g.fillStyle = Ln.col; g.beginPath(); g.arc(sx0 + 9, IY + 21, 4.6, 0, 7); g.fill();
    sans(Ln.num, sx0 + 9, IY + 23.2, Ln.num.length > 1 ? 4.5 : 6, Ln.fg, 'center', 0, true);
    sans((n.zombie ? '☣ ' : '') + n.name, sx0 + 17, IY + 23.5, 7, n.zombie ? '#9aff6a' : AMB, 'left', sw - 22, true);
  } else sans('Terminus', sx0 + 17, IY + 23.5, 7, AMB, 'left', 0, true);
  }

  // vitre de l'écran : légèrement dépolie, reflet oblique discret, poussière
  g.fillStyle = 'rgba(190,195,200,0.035)'; g.fillRect(sx0, IY + 1, sw, IH - 2);
  g.save(); g.beginPath(); g.rect(sx0, IY + 1, sw, IH - 2); g.clip();
  const rf = g.createLinearGradient(sx0 + 20, IY, sx0 + 60, IY + IH); rf.addColorStop(0, 'rgba(255,255,255,0)'); rf.addColorStop(0.5, 'rgba(255,250,240,0.045)'); rf.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rf; g.fillRect(sx0, IY, sw, IH);
  g.restore();
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(220,215,200,${0.08 + 0.12 * hsh(i, 47)})`; g.fillRect(sx0 + hsh(i, 45) * sw, IY + 1 + hsh(i, 46) * (IH - 2), 0.5, 0.5); }
  // traces de doigts sur l'écran de bord, poussière sur le verre du compteur
  for (const [x, y, r] of [[sx0 + 24, IY + 20, 5], [sx0 + 66, IY + 9, 4], [sx0 + 86, IY + 22, 6]]) {
    const fp = g.createRadialGradient(x, y, 0, x, y, r); fp.addColorStop(0, 'rgba(255,255,255,0.06)'); fp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fp; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(220,215,200,0.18)'; g.fillRect(gx0 - R + hsh(i, 41) * 2 * R, gy0 - R + hsh(i, 42) * 2 * R, 0.5, 0.5); }
  // boutons lumineux : portes, sonnerie, klaxon, veille
  const mute = (col, k = 0.4) => {   // désature et assombrit une couleur de lampe
    const c = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)), l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    return '#' + c.map(v => Math.round((v + (l - v) * k) * 0.85).toString(16).padStart(2, '0')).join('');
  };
  const btn = (x, label, lit, col) => {
    col = mute(col);
    g.fillStyle = '#0a0b0e'; g.beginPath(); g.arc(x, cy - 2, 5.6, 0, 7); g.fill();
    const bg = g.createRadialGradient(x - 1.2, cy - 3.2, 0.5, x, cy - 2, 4.6);
    bg.addColorStop(0, lit ? '#ffffff' : '#5a5f6a'); bg.addColorStop(0.4, lit ? col : '#2e323b'); bg.addColorStop(1, lit ? col : '#1d2027');
    g.fillStyle = bg; g.beginPath(); g.arc(x, cy - 2, 4.6, 0, 7); g.fill();
    if (lit) { const rgb = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)).join(','); glow(x, cy - 2, 11, rgb, 0.3); }
    sans(label, x, cy + 11, 4.2, '#9aa1ae', 'center');
  };
  const blink = Math.floor(S.t * 6) % 2;
  // à quai (et juste après la fermeture) : bloc « portes », dans l'ordre de la manœuvre
  const justClosed = S.phase === 'drive' && S.v < 0.3 && S.next < STATIONS.length && S.pos - STATIONS[S.cur].pos < 1;
  if (running && (atStation || justClosed)) {
    const busy = S.doors > 0 && S.alerted && blocked();
    const step = S.phase === 'dwell' ? 'P' : S.phase === 'alert' ? '⏎' : justClosed ? 'Z' : '';
    const urgent = S.phase === 'dwell' && S.next < STATIONS.length && S.clock >= STATIONS[S.cur].dep - 4;
    const pulse = 0.5 + 0.5 * Math.sin(S.t * (urgent || step === 'Z' ? 10 : 5));
    const big = (x, key, label, col, active, wait) => {
      const r = 6.8, y = cy - 3;
      g.fillStyle = '#0a0b0e'; g.beginPath(); g.arc(x, y, r + 1.2, 0, 7); g.fill();
      const lit = active ? 0.55 + 0.45 * pulse : 0;
      const bg = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, r);
      bg.addColorStop(0, active ? '#ffffff' : '#5a5f6a'); bg.addColorStop(0.45, active ? col : wait ? '#5a4a20' : '#2e323b'); bg.addColorStop(1, active ? col : '#1d2027');
      g.globalAlpha = active ? 0.6 + 0.4 * lit : 1; g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.globalAlpha = 1;
      if (active) { const rgb = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)).join(','); glow(x, y, 15 + 6 * pulse, rgb, 0.35 + 0.35 * pulse); }
      sans(key, x, y + 2.3, 6.5, active ? '#111' : '#7d8290', 'center', 0, true);
      sans(label, x, cy + 12, 4.4, active ? '#ffffff' : '#8a909c', 'center', 0, active);
    };
    big(188, 'P', 'SONNERIE', '#ffd75e', step === 'P', false);
    big(222, '⏎', busy ? 'ATTENDEZ' : 'FERMETURE', '#ff9a3a', step === '⏎' && !busy, busy);
    big(256, 'Z', 'DÉPART', '#7dff8a', step === 'Z', false);
    // voyant PORTES : rouge ouvertes, orange en fermeture, vert verrouillées
    const dc = mute(S.doors <= 0 ? '#3dff6a' : S.phase === 'closing' || busy ? (blink ? '#ffb35e' : '#7a4a10') : '#ff3a2a', 0.25);
    g.fillStyle = '#0a0b0e'; g.fillRect(284, cy - 9, 12, 12);
    g.fillStyle = dc; g.fillRect(285.5, cy - 7.5, 9, 9);
    glow(290, cy - 3, 9, [1, 3, 5].map(i => parseInt(dc.slice(i, i + 2), 16)).join(','), 0.3);
    sans('PORTES', 290, cy + 12, 4.2, busy ? (blink ? '#ffb35e' : '#c08a4a') : '#8a909c', 'center', 0, busy);
  } else if (running && S.phase === 'drive' && S.sw && S.sw.kind === 'fork' && !S.sw.passed && !S.rev) {
    // sélecteur d'itinéraire : schéma de la bifurcation et deux boutons ← / →
    const w = S.sw, dp = Math.max(0, Math.round(w.pos - S.pos)), ok = w.tgt === w.want, moving = w.fixT > 0, lock = w.pos - S.pos < (FIRE() ? FIRE_LOCK : (w.lock || SW_LOCK));
    const mx0 = 178, mw = 60, my0 = IY + 1, mh = IH - 2;
    g.fillStyle = '#050608'; g.fillRect(mx0 - 1.5, my0 - 1.5, mw + 3, mh + 3);
    const lg = g.createLinearGradient(0, my0, 0, my0 + mh); lg.addColorStop(0, '#0f151a'); lg.addColorStop(1, '#090c10');
    g.fillStyle = lg; g.fillRect(mx0, my0, mw, mh);
    sans('ITINÉRAIRE', mx0 + 2, my0 + 5, 3.6, DIM); sans(`${dp} m`, mx0 + mw - 2, my0 + 5, 4, OFF, 'right', 0, true);
    // schéma : tronc commun, voie directe (tout droit) et voie déviée (à droite)
    const fx = w.y ? mx0 + 15 : mx0 + 10, fy = my0 + 21, top = my0 + 8, bx = w.y ? fx + 8 : fx + 13, dx = w.y ? fx - 8 : fx;   // Y : deux branches symétriques
    const setCol = moving ? (blink ? '#ffd75e' : '#6a5a20') : '#f2efe6', offCol = '#3a404a';
    const lineC = k => (moving ? w.tgt : w.set) === k ? setCol : offCol;
    g.lineCap = 'round';
    g.strokeStyle = setCol; g.lineWidth = 1.5; g.beginPath(); g.moveTo(fx, my0 + mh - 1); g.lineTo(fx, fy); g.stroke();
    g.strokeStyle = lineC('D'); g.beginPath(); g.moveTo(fx, fy); if (w.y) { g.quadraticCurveTo(fx, fy - 6, dx, top + 5); g.lineTo(dx, top); } else g.lineTo(fx, top); g.stroke();
    g.strokeStyle = lineC('G'); g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx, fy - 6, bx, top + 5); g.lineTo(bx, top); g.stroke();
    g.lineCap = 'butt';
    // bout de chaque voie : flèche verte (demandée) ou barrière rouge (fin de voie)
    for (const [k, ex] of [['D', dx], ['G', bx]]) {
      if (k === w.want) { g.fillStyle = '#7dff8a'; g.beginPath(); g.moveTo(ex, top - 3.5); g.lineTo(ex - 2.4, top - 0.5); g.lineTo(ex + 2.4, top - 0.5); g.fill(); }
      else { g.fillStyle = '#ff3a2a'; g.fillRect(ex - 3, top - 2.6, 6, 1.6); g.fillStyle = '#ffffff'; g.fillRect(ex - 1, top - 2.6, 1, 1.6); g.fillRect(ex + 1, top - 2.6, 1, 1.6); }
    }
    sans('PCC', mx0 + 29, my0 + 12, 3.6, DIM); sans(swLab(w, w.want) + (swSlow(w, w.want) ? ' 30' : ''), mx0 + 29, my0 + 17, 4.6, '#7dff8a', 'left', mw - 30, true);
    const [stT, stC] = moving ? ['EN MOUV.', '#ffd75e'] : lock ? ['VERROU', DIM] : ok ? ['OK', '#7dff8a'] : ['ERREUR !', blink ? '#ff6b5b' : '#7a2a26'];
    sans(stT, mx0 + 29, my0 + 24.5, 4.2, stC, 'left', mw - 30, true);
    // boutons-poussoirs lumineux d'itinéraire : boîtier métallique vissé, voyant carré gravé de la voie à prendre
    const rb = (x, k, label) => {
      const sel = w.tgt === k, good = k === w.want, mv = moving && sel, y = cy - 2.5;
      const pr = S.swPress && S.swPress.k === k && S.t - S.swPress.t < 0.14, dy = pr ? 0.8 : 0;
      const lit = sel && (!mv || blink), col = mv ? '#ffd75e' : good ? '#3dff6a' : '#ff3a2a';
      // boîtier : feuillure sombre, cadre en acier brossé, quatre vis
      g.fillStyle = '#060709'; g.fillRect(x - 12, y - 11, 24, 22);
      const fr = g.createLinearGradient(x - 11, y - 10, x + 11, y + 10); fr.addColorStop(0, '#6a707c'); fr.addColorStop(0.5, '#3a3f49'); fr.addColorStop(1, '#1c1f25');
      g.fillStyle = fr; g.fillRect(x - 11, y - 10, 22, 20);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x - 11, y - 10, 22, 0.6);
      g.fillStyle = '#14161a'; for (const [sx, sy] of [[-9, -8], [9, -8], [-9, 8], [9, 8]]) { g.beginPath(); g.arc(x + sx, y + sy, 0.9, 0, 7); g.fill(); }
      // le poussoir : ombre portée quand il est sorti, il s'enfonce à l'appui
      if (!pr) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x - 7, y - 6 + 1.2, 15, 13); }
      const lx = x - 7.5, ly = y - 7 + dy, lw = 15, lh = 13;
      const lg = g.createLinearGradient(0, ly, 0, ly + lh);
      if (lit) { lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.25, col); lg.addColorStop(1, mute(col, 0.45)); }
      else { lg.addColorStop(0, pr ? '#22262c' : '#2c3038'); lg.addColorStop(1, '#121418'); }
      g.fillStyle = lg; g.fillRect(lx, ly, lw, lh);
      g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 0.8; g.strokeRect(lx, ly, lw, lh);
      g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(lx + 1, ly + 1, 1.5, lh - 2);   // reflet du verre, sur le bord
      // la flèche gravée : tout droit (direct) ou qui part sur la droite (dévié)
      g.strokeStyle = lit ? 'rgba(10,20,10,0.85)' : '#5a606c'; g.fillStyle = g.strokeStyle; g.lineWidth = 1.6; g.lineCap = 'round';
      const ax = x, by0 = ly + lh - 2.5;
      g.beginPath();
      if (k === 'D' && w.y) { g.moveTo(ax + 2.5, by0); g.lineTo(ax + 2.5, ly + 8); g.quadraticCurveTo(ax + 2.5, ly + 5, ax - 2, ly + 4.2); g.stroke();
        g.beginPath(); g.moveTo(ax - 1, ly + 1.6); g.lineTo(ax - 5, ly + 3.6); g.lineTo(ax - 1.6, ly + 6.6); g.fill(); }
      else if (k === 'D') { g.moveTo(ax, by0); g.lineTo(ax, ly + 4.5); g.stroke(); g.beginPath(); g.moveTo(ax - 2.6, ly + 5); g.lineTo(ax, ly + 2); g.lineTo(ax + 2.6, ly + 5); g.fill(); }
      else { g.moveTo(ax - 2.5, by0); g.lineTo(ax - 2.5, ly + 8); g.quadraticCurveTo(ax - 2.5, ly + 5, ax + 2, ly + 4.2); g.stroke();
        g.beginPath(); g.moveTo(ax + 1, ly + 1.6); g.lineTo(ax + 5, ly + 3.6); g.lineTo(ax + 1.6, ly + 6.6); g.fill(); }
      g.lineCap = 'butt';
      if (lit) glow(x, y, 15, [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)).join(','), 0.4);
      if (!ok && good && !lock && blink) { g.strokeStyle = '#ffd75e'; g.lineWidth = 1; g.strokeRect(x - 13, y - 12, 26, 24); }   // celui-ci, vite !
      sans(label, x, cy + 13.5, 3.9, sel ? '#ffffff' : '#8a909c', 'center', 0, sel);
    };
    rb(259, 'D', w.y ? '← GAUCHE' : '← DIRECT'); rb(287, 'G', w.y ? 'DROITE →' : 'DÉVIÉ →');
  } else {
  btn(190, 'PORTES', S.doors <= 0, '#3dff6a');
  btn(222, 'SONN.', S.buzzT > 0, '#ffd75e');
  if (!FIRE()) {   // fuite : ni klaxon ni veille
  btn(254, 'KLAXON', (S.hornT || 0) > 0, '#e6ecf5');
  btn(286, 'VEILLE', S.vacAlert > 0 && blink, '#ff9a3a');
  }
  }

  // manette de traction / freinage (visuelle : suit l'accélérateur et le frein)
  const mx = 336, mt = IY + 2, mb = IY + IH - 2, mm = (mt + mb) / 2;
  g.fillStyle = '#0a0b0e'; g.fillRect(mx - 2, mt, 4, mb - mt);                      // fente
  for (let i = -3; i <= 3; i++) { g.fillStyle = i === 0 ? '#cfd6e6' : '#5a5f6a'; g.fillRect(mx + 4, mm + i * 3.8 - 0.3, i === 0 ? 5 : 3, 0.6); }
  sans('T', mx + 12, mt + 4, 4.5, mute('#7dff8a', 0.5)); sans('F', mx + 12, mb, 4.5, mute('#ff8a7a', 0.5));
  const lev = keyBrake() ? S.brakeF : keyTraction() && S.phase === 'drive' ? -1 : 0;   // −1 traction (vers l'avant), +1 frein
  const hy = mm + lev * (mb - mt) / 2 * 0.85;
  g.strokeStyle = '#7a808c'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, mm); g.lineTo(mx, hy); g.stroke();
  const kg = g.createRadialGradient(mx - 1.5, hy - 1.5, 0.5, mx, hy, 5); kg.addColorStop(0, '#5a5f6a'); kg.addColorStop(1, '#14161b');
  g.fillStyle = kg; g.beginPath(); g.ellipse(mx, hy, 6, 3.6, 0, 0, 7); g.fill();
  g.fillStyle = lev < 0 ? mute('#3dff6a') : lev > 0 ? mute('#ff6b5b') : '#9aa1ae'; g.fillRect(mx - 2.5, hy - 0.5, 5, 1);

  // arrêt d'urgence : « coup de poing » rouge sur platine jaune (touche B), il s'enfonce à chaque appui
  {
    const ex = 366, ey = cy - 2, e = S.eb, pressed = S.ebPressT !== undefined && S.t - S.ebPressT < 0.11;
    // platine jaune biseautée, vissée
    g.fillStyle = '#0a0b0e'; g.fillRect(ex - 12.5, ey - 12.5, 25, 25);
    const pl = g.createLinearGradient(ex - 12, ey - 12, ex + 12, ey + 12); pl.addColorStop(0, '#e8c23a'); pl.addColorStop(1, '#8a6a12');
    g.fillStyle = pl; g.fillRect(ex - 12, ey - 12, 24, 24);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (const [sx, sy] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) { g.beginPath(); g.arc(ex + sx, ey + sy, 0.9, 0, 7); g.fill(); }
    // collerette
    g.fillStyle = '#1a1a1e'; g.beginPath(); g.arc(ex, ey, 9, 0, 7); g.fill();
    g.fillStyle = '#3a3a40'; g.beginPath(); g.arc(ex, ey, 8, 0, 7); g.fill();
    // champignon : plus petit et plus sombre quand il est enfoncé
    const r = pressed ? 6.2 : 7.2, oy = pressed ? 0.6 : -0.6;
    if (!pressed) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(ex + 0.8, ey + 1.5, r, r * 0.9, 0, 0, 7); g.fill(); }
    const mg2 = g.createRadialGradient(ex - 2.2, ey + oy - 2.4, 0.4, ex, ey + oy, r);
    mg2.addColorStop(0, pressed ? '#ff8a7a' : '#ffb0a0'); mg2.addColorStop(0.35, pressed ? '#b0180e' : '#e0251a'); mg2.addColorStop(1, '#5a0806');
    g.fillStyle = mg2; g.beginPath(); g.arc(ex, ey + oy, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(ex - 2.2, ey + oy - 2.8, 2.4, 1.3, -0.5, 0, 7); g.fill();   // reflet
    sans('B', ex, ey + oy + 2, 5.5, 'rgba(255,230,220,0.85)', 'center', 0, true);
    if (e && !e.stopT) glow(ex, ey, 22, '255,40,30', 0.7);   // freinage en cours : il rougeoie
    sans('URGENCE', ex, cy + 14.5, 4, e && !e.stopT ? '#ff6b5b' : '#8a909c', 'center', 0, !!(e && !e.stopT));
  }

  // éclairage de cabine : légère teinte chaude commune à toute la console
  const wl = g.createLinearGradient(0, C0, 0, H); wl.addColorStop(0, 'rgba(255,175,105,0.07)'); wl.addColorStop(1, 'rgba(255,160,90,0.025)');
  g.fillStyle = wl; g.fillRect(0, C0, W, H - C0);
  // bandeau à LED pour les consignes (voir drawHint) : emplacement encastré
  g.fillStyle = '#050506'; g.fillRect(6, H - 11, W - 12, 10);

}

const BRAKE_MAX = 3.0;   // décélération du frein serré à fond (m/s²)
const BRAKE_REF = 1.8;   // décélération de référence (m/s²), le frein max est 2,4
function targetKmh(dist) { return Math.sqrt(2 * BRAKE_REF * Math.max(0, dist - 0.2)) * 3.6; }
// graphe distance (100 m → marque) / vitesse : zone verte = vitesse idéale pour s'arrêter pile, trace du conducteur
const CURVE_D = 130, CURVE_V = 70;
// point où il faut commencer à freiner pour la vitesse actuelle (là où elle croise la courbe idéale)
const brakePoint = (kmh, vl = 0) => vl ? ((kmh / 3.6) ** 2 - (vl / 3.6) ** 2) / (2 * BRAKE_REF) : (kmh / 3.6) ** 2 / (2 * BRAKE_REF) + 0.2;
// vl : vitesse limite visée au point 0 (0 = arrêt en station, sinon entrée de virage)
function drawCurve(x, y, w, h, trace, band, nowDist, light = false, vl = 0) {
  const T = vl ? d => Math.sqrt((vl / 3.6) ** 2 + 2 * BRAKE_REF * Math.max(0, d)) * 3.6 : targetKmh, eye = vl ? -99 : 10;
  const L = 13, B = 7;                                   // marges : graduations vitesse (gauche) et distance (bas)
  const gx = x + L, gw = w - L - 3, gy = y + 2, gh = h - B - 2;
  const X = d => gx + gw * (1 - Math.max(-3, Math.min(CURVE_D, d)) / CURVE_D) * 0.96;
  const Y = v => gy + gh - gh * Math.max(0, Math.min(CURVE_V, v)) / CURVE_V;
  g.fillStyle = light ? 'rgba(8,10,14,0.55)' : 'rgba(8,10,14,0.9)'; g.fillRect(x, y, w, h);
  // grille et graduations
  if (!light) for (const v of [10, 20, 30, 40, 50, 60, 70]) {
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(gx, Y(v), gw, 0.5);
    if (v % 20 === 0) txt(String(v), x + L - 2, Y(v) + 2.5, 7, '#7f8aa0', 'right');
  }
  if (!light) for (const d of vl ? [100, 75, 50, 25] : [100, 75, 50, 25, 10]) {
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(X(d), gy, 0.5, gh);
    txt(String(d), X(d), y + h - 1, 7, '#7f8aa0', 'center');
  }
  g.fillStyle = '#d42a2a'; g.fillRect(X(0) - 0.5, gy, 1, gh);
  txt(vl ? 'VIRAGE' : 'STOP', X(0), y + h - 1, 6, '#ff6b5b', 'center');
  // zones : trop vite (rouge) au-dessus de la courbe, vitesse idéale (vert) juste en dessous
  if (band > 0) {
    g.globalAlpha = band;
    const pts = []; for (let d = CURVE_D; d >= (vl ? -3 : 0); d -= 1) pts.push(d);
    g.fillStyle = 'rgba(150,44,34,0.45)'; g.beginPath(); g.moveTo(X(CURVE_D), gy);
    pts.forEach(d => g.lineTo(X(d), Y(T(d)))); g.lineTo(X(pts[pts.length - 1]), gy); g.fill();
    g.fillStyle = 'rgba(47,150,74,0.55)'; g.beginPath();
    pts.forEach((d, i) => i ? g.lineTo(X(d), Y(T(d))) : g.moveTo(X(d), Y(T(d))));
    for (let i = pts.length - 1; i >= 0; i--) g.lineTo(X(pts[i]), Y(Math.max(0, T(pts[i]) - 8)));
    g.fill();
    g.strokeStyle = '#7dff8a'; g.lineWidth = 0.8; g.beginPath();                       // bord de la courbe idéale
    pts.forEach((d, i) => i ? g.lineTo(X(d), Y(T(d))) : g.moveTo(X(d), Y(T(d)))); g.stroke();
    // repère « freinez ici » pour la vitesse actuelle
    if (nowDist !== undefined && S.v > 1) {
      const db = brakePoint(S.v * 3.6, vl);
      if (db > (vl ? 0 : 10) && db < nowDist + 0.5) {
        const near = nowDist - db < 4, xb = X(db);
        g.strokeStyle = near && Math.floor(S.t * 6) % 2 ? '#ffffff' : '#ffb35e'; g.lineWidth = 1;
        g.setLineDash([2, 1.5]); g.beginPath(); g.moveTo(xb, gy); g.lineTo(xb, gy + gh); g.stroke(); g.setLineDash([]);
        g.fillStyle = 'rgba(8,10,14,0.85)'; g.fillRect(xb - 15, gy, 30, 7);
        txt('FREINEZ ICI', xb, gy + 5.5, 6, '#ffb35e', 'center');
      }
    }
    g.globalAlpha = 1;
  }
  // trace du conducteur, colorée : blanc = bonne zone, rouge = trop vite, jaune = trop lent
  if (trace.length > 1) {
    g.lineWidth = 1.4; g.lineCap = 'round';
    for (let i = 1; i < trace.length; i++) {
      const [d0, v0] = trace[i - 1], [d1, v1] = trace[i], vt = T(d1);
      g.strokeStyle = d1 < eye ? '#ffffff' : v1 > vt + 1.5 ? '#ff6b5b' : v1 < vt - 8 ? '#ffd75e' : '#ffffff';
      g.beginPath(); g.moveTo(X(d0), Y(v0)); g.lineTo(X(d1), Y(v1)); g.stroke();
    }
    g.lineCap = 'butt';
  }
  if (nowDist !== undefined) {
    const kmh = S.v * 3.6, vt = T(nowDist), c = nowDist < eye ? '#ffffff' : kmh > vt + 1.5 ? '#ff6b5b' : kmh < vt - 8 ? '#ffd75e' : '#7dff8a';
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(X(nowDist), Y(kmh), 3.5, 0, 7); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(X(nowDist), Y(kmh), 2.2, 0, 7); g.fill();
  }
  if (!light) { g.strokeStyle = '#4a5166'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
}
function drawGauge() {
  if (S.phase !== 'drive' || S.next >= STATIONS.length) return;
  const st = STATIONS[S.next], dist = st.pos - S.pos;
  const bend = dist > CURVE_D && bendProfileOn() ? (activeBend() || S.bends.find(b => S.pos <= b.pos + b.len + 20)) : null;
  if (!bend && (dist > CURVE_D || dist < -PE)) return;
  if (!bend && FIRE() && st.zombie) return;   // station infestée : pas de courbe d'arrêt, on traverse
  // la courbe glisse vers la droite quand une caméra intérieure occupe le bas gauche de l'écran
  const camOpen = S.camAt !== undefined && S.t - S.camAt < 0.15;
  S.gaugeX = S.gaugeX === undefined ? 0 : S.gaugeX + ((camOpen ? 1 : 0) - S.gaugeX) * 0.2;
  const bw = 176, bh = 62, bx = Math.round(W / 2 - bw / 2 + S.gaugeX * (162 - (W / 2 - bw / 2))), by = VIEW_H - bh - 4;
  if (bend) {   // courbe de freinage du virage : la cible est la vitesse limite à l'entrée, puis tenue jusqu'à la sortie
    const d = bend.pos - S.pos, inB = d <= 0 && S.pos <= bend.pos + bend.len, kmh = S.v * 3.6, vt = bendEnv(S.pos);
    drawBendProfile(bx, by + 11, bw, bh - 11);
    g.fillStyle = 'rgba(8,10,14,0.88)'; g.fillRect(bx, by, bw, 11);
    const idx = S.bends.indexOf(bend) + 1, nb = S.bends.length;
    const BN = bend.sw ? `AIGUILLE ${bend.swIdx}/${bend.swTot} DÉVIÉE` : 'VIRAGE';
    txt(`${nb > 1 && !bend.sw ? `${idx}/${nb} ` : ''}${inB ? `${BN} ${bend.lim} · reste ${Math.max(0, bend.pos + bend.len - S.pos).toFixed(0)} m` : d > 0 ? `${BN} ${bend.lim} · ${d.toFixed(0)} m` : bend.sw ? 'SORTIE DE L\'AIGUILLE' : 'SORTIE DE VIRAGE'}`, bx + 4, by + 9, 10, '#ffffff', 'left', 'VT323', 108);
    let label, col;
    if (kmh > bend.lim + 1 && inB) { label = 'DÉRAILLEMENT !'; col = '#ff3a2a'; }
    else if (kmh > vt + 1.5) { label = keyBrake() ? 'FREINEZ ENCORE' : 'FREINEZ !'; col = '#ff6b5b'; }
    else if (kmh >= vt - 10) { label = 'ZONE VERTE'; col = '#7dff8a'; }
    else { label = inB ? 'TROP LENT' : 'ACCÉLÉREZ'; col = '#ffd75e'; }
    if (!/FREINEZ !|DÉRAILLEMENT/.test(label) || Math.floor(S.t * 6) % 2) txt(label, bx + bw - 4, by + 9, 10, col, 'right', 'VT323', 56);
    return;
  }
  // la courbe s'efface entre 15 et 10 m : la finition se fait à l'œil (loupe + bips)
  const band = Math.max(0, Math.min(1, (dist - 10) / 5));
  drawCurve(bx, by + 11, bw, bh - 11, S.trace, band, dist);
  g.fillStyle = 'rgba(8,10,14,0.88)'; g.fillRect(bx, by, bw, 11);
  txt(dist >= 0 ? `ARRÊT ${dist.toFixed(1)} m` : `+${(-dist).toFixed(1)} m`, bx + 4, by + 9, 11, dist < -0.3 ? '#ff6b5b' : '#ffffff');
  const kmh = S.v * 3.6, vt = targetKmh(dist);
  let label, col;
  if (dist < -0.3) { label = `ZONE : ${Math.max(0, PE + dist).toFixed(0)} m`; col = '#ffb35e'; }
  else if (band <= 0) { label = dist < 0.6 && kmh < 1 ? 'ARRÊT PILE !' : 'À L\'ŒIL !'; col = '#9fe0ff'; }
  else if (kmh > vt + 1.5) { label = keyBrake() ? 'FREINEZ ENCORE' : 'FREINEZ !'; col = '#ff6b5b'; }
  else if (kmh >= vt - 8) { label = 'BONNE VITESSE'; col = '#7dff8a'; }
  else { label = 'ACCÉLÉREZ'; col = '#ffd75e'; }
  if (label !== 'FREINEZ !' || Math.floor(S.t * 6) % 2) txt(label, bx + bw - 4, by + 9, 10, col, 'right', 'VT323', 70);
}

function drawPops() {
  S.pops.forEach(p => {
    g.globalAlpha = Math.min(1, (1 - p.t) * 2);
    txt(p.text, p.x + 1, p.y - p.t * 16 + 1, 16, '#000', 'center');
    txt(p.text, p.x, p.y - p.t * 16, 16, p.col, 'center');
    g.globalAlpha = 1;
  });
}
// caméra de plafond : vue de dessus de l'arrivée sur la marque
function drawTopCam() {
  if (S.mode !== 'running' || S.phase !== 'drive' || S.next >= STATIONS.length) return;
  const st = STATIONS[S.next], dist = st.pos - S.pos;
  if (dist > 15 || dist < -PE) return;
  const w = 160, h = 66, x0 = W - 8 - w, y0 = 8;
  // zoom progressif, puis loupe sur les derniers mètres (3 m à l'écran pile sur la marque)
  const span = Math.max(3, Math.min(34, Math.abs(dist) * 1.3 + 2.5));
  const ppm = w / span, markX = x0 + w * 0.72;
  const X = p => markX + (p - st.pos) * ppm;
  g.fillStyle = '#000'; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  // quai (en haut), voie (au milieu), piédroit (en bas)
  g.fillStyle = '#8a8589'; g.fillRect(x0, y0, w, 22);
  g.fillStyle = '#e8dca0'; g.fillRect(x0, y0 + 19, w, 3);
  g.fillStyle = '#3d3532'; g.fillRect(x0, y0 + 22, w, 36);
  g.fillStyle = '#2a2420'; for (let p = Math.floor((st.pos - span) / 0.6) * 0.6; p < st.pos + span; p += 0.6) g.fillRect(Math.round(X(p)), y0 + 26, Math.max(1, Math.round(0.25 * ppm)), 28);
  g.fillStyle = '#b8b8c4'; g.fillRect(x0, y0 + 30, w, 2); g.fillRect(x0, y0 + 48, w, 2);
  g.fillStyle = '#d8cfb8'; g.fillRect(x0, y0 + 58, w, 8);
  // zones de précision autour de la marque
  g.fillStyle = 'rgba(255,215,94,0.18)'; g.fillRect(Math.round(X(st.pos - 3)), y0 + 22, Math.round(6 * ppm), 36);
  g.fillStyle = 'rgba(159,224,255,0.25)'; g.fillRect(Math.round(X(st.pos - 1.5)), y0 + 22, Math.round(3 * ppm), 36);
  g.fillStyle = 'rgba(125,255,138,0.5)'; g.fillRect(Math.round(X(st.pos - 0.5)), y0 + 22, Math.max(2, Math.round(1 * ppm)), 36);
  // marque d'arrêt
  g.fillStyle = '#ffffff'; g.fillRect(Math.round(markX) - 1, y0 + 4, 2, 54);
  g.fillStyle = '#d42a2a'; g.fillRect(Math.round(markX) - 9, y0 + 3, 18, 8);
  txt('STOP', markX, y0 + 10, 9, '#fff', 'center');
  // rame vue de dessus (la cabine avance vers la droite)
  const fx = X(S.pos);
  g.fillStyle = '#e6eaee'; g.fillRect(Math.round(fx - 75 * ppm), y0 + 25, Math.round(75 * ppm), 28);
  g.fillStyle = '#9aa3ad'; for (let c = 1; c < 5; c++) g.fillRect(Math.round(fx - c * 15 * ppm), y0 + 25, 1, 28);
  g.fillStyle = '#1f5fae'; g.fillRect(Math.round(fx - 75 * ppm), y0 + 25, Math.round(75 * ppm), 3);
  g.fillStyle = '#c9d2dc'; g.beginPath(); g.moveTo(fx - 1.2 * ppm, y0 + 25); g.lineTo(fx, y0 + 30); g.lineTo(fx, y0 + 48); g.lineTo(fx - 1.2 * ppm, y0 + 53); g.fill();
  g.fillStyle = '#ffd75e'; g.fillRect(Math.round(fx) - 1, y0 + 30, 2, 18);   // nez de la cabine
  // balayage vidéo
  g.fillStyle = 'rgba(0,0,0,0.14)'; for (let yy = y0; yy < y0 + h; yy += 2) g.fillRect(x0, yy, w, 1);
  g.restore();
  g.strokeStyle = '#4a5166'; g.lineWidth = 1; g.strokeRect(x0 - 0.5, y0 - 0.5, w + 1, h + 1);
  g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(x0 + 1, y0 + h - 10, 58, 9);
  txt('CAM PLAFOND', x0 + 3, y0 + h - 3, 9, '#e6ecf5');
  const err = Math.abs(dist), col = err <= 0.5 ? '#7dff8a' : err <= 1.5 ? '#9fe0ff' : err <= 3 ? '#ffd75e' : '#ff6b5b';
  g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(x0 + w - 46, y0 + h - 12, 45, 11);
  txt((dist >= 0 ? '' : '+') + Math.abs(dist).toFixed(2) + ' m', x0 + w - 3, y0 + h - 3, 11, col, 'right');
  if (span < 9) { g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(x0 + 1, y0 + 1, 34, 9); txt('LOUPE', x0 + 3, y0 + 8, 9, '#ffd75e'); }
}
// indicateur de trafic de la ligne (style poste de commande)
function drawTraffic(x, y, w, compact = false) {
  const t = S.mode === 'running' ? S.trafShow : traffic(), [lab, col] = trafState(t);
  const h = compact ? 22 : 44;
  g.fillStyle = 'rgba(6,8,14,0.85)'; g.fillRect(x, y, w, h);
  g.strokeStyle = '#4a5166'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.fillStyle = LN().col; g.beginPath(); g.arc(x + 8, y + 8, 4.5, 0, 7); g.fill();
  txt(LN().num, x + 8, y + 11, LN().num.length > 1 ? 8 : 10, LN().fg, 'center');
  let waitTot = waitingHere(); STATIONS.forEach((st, i) => { if (i >= S.next) waitTot += st.people.length; });
  txt(`${waitTot} en attente`, x + 16, y + 11, 11, '#cfd6e6', 'left', 'VT323', w - 66);
  if (S.trafDown > 0) txt('▼', x + w - 4 - g.measureText(lab).width - 14, y + 11, 11, '#7dff8a');
  const crit = t >= 0.9 && Math.floor(S.t * 4) % 2;
  txt(lab, x + w - 4, y + 11, 12, crit ? '#ffffff' : col, 'right');
  g.fillStyle = '#20242e'; g.fillRect(x + 4, y + 15, w - 8, 4);
  g.fillStyle = col; g.fillRect(x + 4, y + 15, Math.round((w - 8) * Math.min(1, t)), 4);
  if (compact) return;
  // plan de ligne : un point par station, couleur = affluence sur le quai
  const n = STATIONS.length, lx0 = x + 9, lx1 = x + w - 9, ly = y + 32;
  g.fillStyle = LN().col; g.fillRect(lx0, ly - 1, lx1 - lx0, 2);
  STATIONS.forEach((st, i) => {
    const sx = lx0 + (lx1 - lx0) * i / (n - 1);
    const passed = i < S.next && !(i === S.cur && S.phase !== 'drive');
    const ratio = st.people.length / (st.aff * 45);
    const c = passed ? '#4a4f5c' : trafState(ratio)[1];
    const rad = passed ? 2 : 2 + Math.min(3, st.people.length / 15);
    g.fillStyle = '#0c0e13'; g.beginPath(); g.arc(sx, ly, rad + 1, 0, 7); g.fill();
    g.fillStyle = c; g.beginPath(); g.arc(sx, ly, rad, 0, 7); g.fill();
    if (!passed && i <= S.next + 1) txt(String(st.people.length), sx, ly + 11, 9, c, 'center');
  });
  // position de la rame
  const a = S.cur, bnext = Math.min(n - 1, S.next);
  let frac = 0;
  if (S.phase === 'drive' && bnext > a) frac = Math.max(0, Math.min(1, (S.pos - STATIONS[a].pos) / (STATIONS[bnext].pos - STATIONS[a].pos)));
  const tx = lx0 + (lx1 - lx0) * (a + frac * (bnext - a)) / (n - 1);
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(tx - 3, ly - 8); g.lineTo(tx + 3, ly - 8); g.lineTo(tx, ly - 4); g.fill();
}

// caméra intérieure incrustée : incidents à bord (malade, bagarre, bagage, sol glissant, vendeur)
function cabBackground(t) {
  g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, 112, 9);
  g.fillStyle = '#f2f0e6'; g.fillRect(4, 3, 104, 2);                      // néon
  g.fillStyle = '#e3e6e8'; g.fillRect(0, 9, 112, 25);
  for (const wx of [6, 44, 82]) {
    g.fillStyle = '#161a20'; g.fillRect(wx, 12, 26, 13);
    const off = (S.pos * 4) % 40;
    g.fillStyle = 'rgba(255,214,150,0.55)'; for (let k = -1; k < 2; k++) { const lx = wx + ((k * 40 - off + 400) % 40); if (lx > wx && lx < wx + 24) g.fillRect(lx, 17, 2, 1); }
  }
  for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#2e6fb8' : '#2a64a6'; g.fillRect(4 + k * 27, 26, 24, 10); g.fillStyle = '#1f4f8a'; g.fillRect(4 + k * 27, 35, 24, 4); }
  g.fillStyle = '#8c8984'; g.fillRect(0, 39, 112, 33);
  g.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 30; k++) g.fillRect(hsh(k, 61) * 112, 40 + hsh(k, 62) * 32, 1, 0.5);
  g.fillStyle = '#c8ccd2'; g.fillRect(30, 0, 1.5, 72); g.fillRect(84, 0, 1.5, 72);
}
const CAM_WIN = 14, SLIP_T = 15;           // fenêtre pour réagir (A) ; durée du sol glissant
function drawCabCam(sk) {
  if (!sk || !sk.shown || S.phase !== 'drive') return;
  // ouverture, puis fermeture une fois l'action faite (1,2 s pour lire la confirmation) ;
  // sol glissant : visible 6 s, puis seulement au moment d'une chute
  let pop = Math.min(1, sk.t * 5);
  if (sk.called) pop = Math.min(pop, Math.max(0, 1 - (sk.t - sk.calledAt - 1.2) * 5));
  else if (sk.type === 'slip' && sk.fallT <= 0) pop = Math.min(pop, Math.max(0, 1 - (sk.t - 6) * 5));
  else if (sk.type !== 'slip') pop = Math.min(pop, Math.max(0, 1 - (sk.t - CAM_WIN) * 5));   // trop tard : la fenêtre se ferme
  if (pop <= 0) return;
  S.camAt = S.t;
  const K = 1.3, w = Math.round(112 * K * pop), h = Math.round(72 * K * pop), x0 = 8, y0 = VIEW_H - 8 - Math.round(72 * K);
  const flash = Math.floor(S.t * 4) % 2;
  g.fillStyle = '#0d0f14'; g.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
  g.strokeStyle = sk.called ? '#3a6a44' : (flash ? '#ff4a3a' : '#7a1a14'); g.lineWidth = 1.5; g.strokeRect(x0 - 2.25, y0 - 2.25, w + 4.5, h + 4.5);
  if (pop < 1) return;
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.translate(x0, y0); g.scale(K, K); DRAW_K = K;
  const t = sk.t, fy = 50, away = Math.min(1, t / 3);       // fy : niveau du sol (pieds)
  cabBackground(t);
  const person = (x, pp, dir, walk = 0) => drawPerson(x, fy + 7, 20, Object.assign(pp, { dir }), walk);
  if (sk.type === 'malaise') {
    // un voyageur effondré au sol, un autre penché sur lui qui fait signe ; les autres reculent
    person(14 - 6 * away, sk.side[0], -1); person(100 + 6 * away, sk.side[1], 1);
    g.save(); g.translate(46, fy + 6); g.rotate(-Math.PI / 2); drawPerson(0, 0, 20, Object.assign(sk.look, { dir: 1 }), 0); g.restore();
    g.save(); g.translate(72, fy + 7); g.rotate(-0.35); drawPerson(0, 0, 18, Object.assign(sk.look2, { dir: -1 }), 0); g.restore();
    const wave = Math.sin(t * 9) * 3;
    g.fillStyle = sk.look2.k; g.fillRect(76 + wave, fy - 30, 2.5, 2.5);
    g.strokeStyle = sk.look2.c; g.lineWidth = 2; g.beginPath(); g.moveTo(72, fy - 20); g.lineTo(77 + wave, fy - 29); g.stroke();
    if (flash) { g.fillStyle = '#ffffff'; g.fillRect(92, 10, 14, 14); g.fillStyle = '#d42a2a'; g.fillRect(97, 12, 4, 10); g.fillRect(94, 15, 10, 4); }
  } else if (sk.type === 'sick') {
  // flaque qui s'étale
  const px = 61, pr = Math.min(1, t / 6);
  g.fillStyle = '#9a9440'; g.beginPath(); g.ellipse(px, fy + 2, 3 + 9 * pr, 1.5 + 3 * pr, 0, 0, 7); g.fill();
  g.fillStyle = '#b8b058'; g.beginPath(); g.ellipse(px - 1, fy + 1.5, 2 + 5 * pr, 1 + 1.6 * pr, 0, 0, 7); g.fill();
    person(22 - 10 * away, sk.side[0], -1); person(96 + 9 * away, sk.side[1], 1);
  // le malade, assis et penché en avant ; spasmes réguliers
  const L = sk.look, cyc = (t % 2.6) / 2.6, heave = cyc > 0.55 && cyc < 0.85;
  const bend = 0.95 + (heave ? 0.25 : 0.08 * Math.sin(t * 3));
  const hx = 52, hy = 37;                                   // hanche
  g.fillStyle = L.pants; g.fillRect(hx, hy - 1, 8, 3); g.fillRect(hx + 6, hy, 3, fy - hy);   // cuisses, tibias
  g.fillStyle = '#141414'; g.fillRect(hx + 6, fy - 1, 5, 2);
  g.save(); g.translate(hx + 1, hy); g.rotate(bend);
  g.fillStyle = L.c; g.fillRect(-2.5, -13, 5.5, 13);                       // buste
  g.fillStyle = L.k; g.beginPath(); g.arc(0.5, -15.5, 3, 0, 7); g.fill();   // tête
  g.fillStyle = L.hair; g.fillRect(-2.5, -18.5, 6, 2.2);
  g.fillStyle = L.k; g.fillRect(2, -11, 2, 7);                              // bras sur le ventre
  g.restore();
  // jet (pendant les spasmes)
  const mx = hx + 1 + Math.sin(bend) * 15.5, my = hy - Math.cos(bend) * 15.5 + 2;
  if (heave) {
    for (let k = 0; k < 9; k++) {
      const q = ((S.t * 3 + k / 9) % 1);
      g.fillStyle = k % 2 ? '#a8a24a' : '#c4bc62';
      g.fillRect(mx + q * 3 + hsh(k, 63) * 1.5, my + q * (fy + 1 - my), 1.4, 1.4);
    }
  }
  } else if (sk.type === 'fight') {
    // deux voyageurs se bousculent, les autres reculent
    person(14 - 8 * away, sk.side[0], -1); person(100 + 8 * away, sk.side[1], 1);
    const shove = Math.sin(t * 7), lunge = Math.max(0, Math.sin(t * 3.1));
    person(48 + shove * 2.5 + lunge * 3, sk.look, 1, t * 6); person(66 + shove * 2.5 - lunge * 2, sk.look2, -1, t * 6 + 1);
    g.fillStyle = flash ? '#ffd75e' : '#ff8a3a'; for (const [ax, ay] of [[52, 12], [60, 9], [68, 13]]) { const oy = flash ? 0 : 1; g.fillRect(ax, ay + oy, 1.4, 4); g.fillRect(ax, ay + oy + 5, 1.4, 1.4); }
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.6;
    for (let k = 0; k < 3; k++) { const yy = 24 + k * 5; g.beginPath(); g.moveTo(56 + shove * 2, yy); g.lineTo(60 + shove * 2, yy - 1); g.stroke(); }
  } else if (sk.type === 'bag') {
    // un sac seul sur la banquette, personne autour
    person(12, sk.side[0], 1); person(104, sk.side[1], -1);
    const bx = 56, by = 26;
    g.fillStyle = '#2a3a2a'; g.fillRect(bx, by, 11, 10); g.fillStyle = '#3a4a38'; g.fillRect(bx, by, 11, 3);
    g.fillStyle = '#1a221a'; g.fillRect(bx + 2, by - 2, 1.2, 3); g.fillRect(bx + 8, by - 2, 1.2, 3); g.fillRect(bx + 3, by + 5, 5, 3);
    if (!sk.called) { g.strokeStyle = flash ? '#ffd75e' : 'rgba(255,215,94,0.35)'; g.lineWidth = 1; g.beginPath(); g.ellipse(bx + 5.5, by + 5, 11, 9, 0, 0, 7); g.stroke(); }
  } else if (sk.type === 'slip') {
    // café renversé, voyageurs qui se tiennent aux barres ; chute après un freinage brusque
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.ellipse(60, fy + 4, 13, 3.5, 0, 0, 7); g.fill();
    g.fillStyle = '#7a5230'; g.beginPath(); g.ellipse(58, fy + 3.5, 7, 1.8, 0, 0, 7); g.fill();
    g.fillStyle = '#f2efe6'; g.fillRect(68, fy + 3, 4, 2.5); g.fillStyle = '#c8392b'; g.fillRect(68, fy + 3, 1, 2.5);   // gobelet couché
    person(30, sk.side[0], 1); person(86, sk.side[1], -1);
    if (sk.fallT > 0) {
      const k = Math.min(1, (2.5 - sk.fallT) * 5);
      g.save(); g.translate(52, fy + 7); g.rotate(-Math.PI / 2 * k); drawPerson(0, 0, 20, Object.assign(sk.look, { dir: 1 }), 0); g.restore();
    } else person(54 + Math.sin(t * 2.2) * 1.2, sk.look, 1);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(82, 10, 28, 8);
    txt(`chutes ${sk.falls}`, 96, 16.5, 8, sk.falls ? '#ff8a7a' : '#7dff8a', 'center');
  } else if (sk.type === 'vendor') {
    // le vendeur traverse la voiture avec son grand sac
    person(28, sk.side[0], 1); person(90, sk.side[1], -1);
    const vx = 6 + (t * 11) % 104;
    g.fillStyle = '#e8e4da'; g.fillRect(vx - 13, fy - 10, 9, 15); g.fillStyle = '#2e6fb8'; g.fillRect(vx - 13, fy - 6, 9, 2); g.fillRect(vx - 13, fy - 1, 9, 2);   // grand sac rayé
    person(vx, sk.look, 1, t * 8);
    g.fillStyle = '#d4ac0d'; g.fillRect(vx + 2, fy - 16, 7, 2); g.fillStyle = '#c0392b'; g.fillRect(vx + 3, fy - 18, 2, 2); g.fillStyle = '#3a8f5a'; g.fillRect(vx + 6, fy - 18, 2, 2);   // plateau
  }
  g.restore(); DRAW_K = 1;
  drawCRT(x0, y0, w, h, 7);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y0, w, 9);
  txt(`CAM V${sk.car + 1} · INTÉRIEUR`, x0 + 3, y0 + 7, 9, '#ffffff');
  if (Math.floor(S.t * 2) % 2) { g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(x0 + w - 5, y0 + 4.5, 2, 0, 7); g.fill(); }
  const foot = sk.type === 'slip' ? 'Freinez en douceur jusqu\'à la station'
    : sk.called ? { malaise: 'PCC prévenu : secours à quai', sick: 'PCC prévenu : nettoyage en station', fight: 'Sécurité prévenue : elle attend à quai', bag: 'Signalé : inspection en station', vendor: 'Annonce faite : il descend en station' }[sk.type]
    : { malaise: 'A : prévenir le PCC (secours)', sick: 'A : prévenir le PCC', fight: 'A : appeler la sécurité', bag: 'A : signaler le bagage', vendor: 'A : annonce au micro' }[sk.type];
  g.fillStyle = sk.called ? 'rgba(20,70,30,0.9)' : sk.type === 'slip' ? 'rgba(110,70,10,0.92)' : 'rgba(120,10,10,0.9)'; g.fillRect(x0, y0 + h - 11, w, 11);
  if (!sk.called) {
    const fr = Math.max(0, 1 - sk.t / (sk.type === 'slip' ? SLIP_T : CAM_WIN));
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y0 + h - 14, w, 3);
    g.fillStyle = fr < 0.3 ? '#ff4a3a' : '#ffd75e'; g.fillRect(x0, y0 + h - 14, w * fr, 3);
  }
  txt(foot, x0 + w / 2, y0 + h - 3, 10, '#ffffff', 'center', 'VT323', w - 4);
}
function drawTheft() {
  const T = S.theft; if (!T || !T.shown || S.phase !== 'drive') return;
  const close = Math.max(0, 1 - (T.t - CAM_WIN) * 5); if (close <= 0) return;
  // caméra intérieure, zoom sur la poche d'un voyageur : une main s'y glisse et ressort avec le portefeuille
  const K = 1.3, pop = Math.min(1, T.t * 5, close), w = Math.round(112 * K * pop), h = Math.round(72 * K * pop);
  const x0 = W - 8 - Math.round(112 * K), y0 = VIEW_H - 8 - Math.round(72 * K), flash = Math.floor(S.t * 4) % 2;
  g.fillStyle = '#0d0f14'; g.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
  g.strokeStyle = flash ? '#ff4a3a' : '#7a1a14'; g.lineWidth = 1.5; g.strokeRect(x0 - 2.25, y0 - 2.25, w + 4.5, h + 4.5);
  if (pop < 1) return;
  if (!T.look) T.look = { coat: pick(['#3a4a5a', '#6a4a3a', '#4a5a3a', '#2e3440', '#7a6a50']), skin: pick(SKIN), sleeve: '#151518' };
  const L = T.look;
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.translate(x0, y0); g.scale(K, K);
  // arrière-plan flou : voyageurs serrés, barre de maintien
  g.fillStyle = '#5a5e66'; g.fillRect(0, 0, 112, 72);
  [['#8a3a3a', 4], ['#3a5a8a', 22], ['#9a8a5a', 38], ['#4a4a52', 92]].forEach(([c, bx]) => { g.fillStyle = c; g.globalAlpha = 0.55; g.fillRect(bx, 0, 16, 72); });
  g.globalAlpha = 1; g.fillStyle = '#c8ccd2'; g.fillRect(46, 0, 2, 72);
  // la victime, de côté : manteau, poche, sangle de sac
  g.fillStyle = L.coat; g.fillRect(54, 0, 58, 72);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(54, 0, 3, 72);
  g.fillStyle = '#1a1a1e'; g.fillRect(96, 0, 4, 72);                       // sangle
  const pkX = 62, pkY = 40, pkW = 24, pkH = 16;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(pkX, pkY, pkW, pkH);        // intérieur de la poche
  // la main : approche, plonge dans la poche, ressort avec le portefeuille
  const c = T.t % 4.2, ease = q => q * q * (3 - 2 * q);
  let hx, hy, inside = false, wallet = false;
  if (c < 1.4) { const q = ease(c / 1.4); hx = 14 + q * 44; hy = 30 + q * 14; }
  else if (c < 2.6) { hx = 58 + Math.sin((c - 1.4) * 8) * 1.2; hy = 44 + Math.min(1, (c - 1.4) * 2) * 3; inside = true; }
  else if (c < 3.8) { const q = ease((c - 2.6) / 1.2); hx = 58 - q * 44; hy = 47 - q * 16; wallet = true; }
  else { hx = 14; hy = 31; }
  g.fillStyle = L.sleeve; g.beginPath(); g.moveTo(-4, hy - 10); g.lineTo(hx - 4, hy - 3); g.lineTo(hx - 4, hy + 4); g.lineTo(-4, hy + 10); g.fill();   // manche
  g.fillStyle = L.skin; g.fillRect(hx - 6, hy - 4, 12, 9); g.fillRect(hx + 6, hy - 3, 6, 2); g.fillRect(hx + 6, hy, 7, 2); g.fillRect(hx + 6, hy + 3, 5, 1.6); g.fillRect(hx - 2, hy - 6, 6, 2.5);   // main, doigts, pouce
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 0.6; g.strokeRect(hx - 6, hy - 4, 12, 9);
  if (wallet) { g.fillStyle = '#5a3a1e'; g.fillRect(hx + 2, hy - 1, 9, 6); g.fillStyle = '#7a5230'; g.fillRect(hx + 2, hy - 1, 9, 1.2); }
  if (inside) { g.fillStyle = L.coat; g.fillRect(pkX, pkY + 3, pkW, pkH - 3); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(pkX, pkY + 3, 1, pkH - 3); }   // le pan de la poche recouvre les doigts
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.8; g.strokeRect(pkX, pkY, pkW, pkH);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(pkX, pkY, pkW, 2);           // rabat
  // cadre de mise au point
  g.strokeStyle = flash ? 'rgba(255,80,60,0.9)' : 'rgba(255,255,255,0.6)'; g.lineWidth = 0.8;
  for (const [cx, cy, dx, dy] of [[52, 22, 1, 1], [100, 22, -1, 1], [52, 64, 1, -1], [100, 64, -1, -1]]) { g.beginPath(); g.moveTo(cx + 6 * dx, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + 6 * dy); g.stroke(); }
  g.restore();
  drawCRT(x0, y0, w, h, 11);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y0, w, 9);
  txt(`CAM V${T.car + 1} · ZOOM ×4`, x0 + 3, y0 + 7, 9, '#ffffff');
  drawSkull(x0 + w - 6, y0 + 8, 1);
  g.fillStyle = flash ? 'rgba(150,10,10,0.95)' : 'rgba(100,6,6,0.95)'; g.fillRect(x0, y0 + h - 11, w, 11);
  txt(`VOL en V${T.car + 1} — A : tirer l'alarme`, x0 + w / 2, y0 + h - 3, 10, flash ? '#ffd75e' : '#ffffff', 'center', 'VT323', w - 4);
  const fr = Math.max(0, 1 - T.t / CAM_WIN);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y0 + h - 14, w, 3);
  g.fillStyle = fr < 0.3 ? '#ff4a3a' : '#ffd75e'; g.fillRect(x0, y0 + h - 14, w * fr, 3);
}
function drawRadio() {
  if (!S.radio) return;
  const x = W / 2 - 110, y = 30, w = 220, h = 44;
  g.fillStyle = 'rgba(6,10,8,0.92)'; g.fillRect(x, y, w, h);
  g.strokeStyle = '#3dff6a'; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  txt('📻 RADIO — APPEL VOITURE', x + w / 2, y + 12, 13, '#3dff6a', 'center');
  for (let c = 0; c < 5; c++) {
    const bx = x + 14 + c * 40;
    g.fillStyle = '#103018'; g.fillRect(bx, y + 18, 32, 20);
    g.strokeStyle = '#3dff6a'; g.strokeRect(bx + 0.5, y + 18.5, 31, 19);
    txt(String(c + 1), bx + 16, y + 33, 16, '#c8ffd0', 'center');
  }
}
function drawMissions(x, y, compact) {
  txt('MISSIONS', x, y, 12, '#ffd75e');
  S.missions.forEach((m, i) => {
    const ic = m.state === 'done' ? '✓' : m.state === 'fail' ? '✗' : '○';
    const c = m.state === 'done' ? '#7dff8a' : m.state === 'fail' ? '#ff6b5b' : '#e6ecf5';
    txt(ic + ' ' + (compact ? m.short : m.label), x, y + 12 + i * 11, 12, c, 'left', 'VT323', 200);
  });
}

// alarme de fermeture des portes : flash rouge au rythme de la sirène, cadre rouge, bandeau clignotant
function drawDoorAlarm() {
  if (S.mode !== 'running' || S.buzzT <= 0) return;
  const VH = VIEW_H, k = Math.min(1, S.buzzT / 0.3);                      // s'éteint en douceur à la fin
  const on = Math.floor(S.t / 0.17) % 2 === 0, p = 0.5 + 0.5 * Math.sin(S.t * Math.PI / 0.17);
  g.fillStyle = `rgba(255,20,10,${(on ? 0.26 : 0.1) * k})`; g.fillRect(0, 0, W, VH);
  // halo rouge sur les bords
  const vg = g.createRadialGradient(W / 2, VH / 2, VH * 0.35, W / 2, VH / 2, W * 0.62);
  vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(255,0,0,${0.45 * p * k})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, VH);
  g.strokeStyle = `rgba(255,40,30,${(on ? 1 : 0.4) * k})`; g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, VH - 3);
  // gyrophares dans les coins
  for (const [gx, gy] of [[10, 10], [W - 10, 10]]) glow(gx, gy, 26, '255,40,20', (on ? 0.9 : 0.3) * k);
  if (on) {
    const w = 170, x = W / 2 - w / 2, y = VH / 2 - 9;
    g.fillStyle = `rgba(120,0,0,${0.85 * k})`; g.fillRect(x, y, w, 18);
    g.strokeStyle = '#ffd75e'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, 17);
    txt('⚠ FERMETURE DES PORTES ⚠', W / 2, y + 13, 13, '#ffffff', 'center');
  }
}
function drawMsgs() {
  if (!S.msgs.length) return;
  const cctv = S.mode === 'running' && S.phase !== 'drive', drive = S.mode === 'running' && !cctv;
  if (cctv) return;   // à quai : pas d'alerte par-dessus les caméras, l'essentiel passe par le bandeau du bas
  let left = 30, right = W - 30, y0 = cctv ? CAM_Y0 + CAM_H - 5 : 14, bottom = false;
  if (drive && S.phase === 'drive') {
    // en conduite : en bas de la vue, pour laisser libres le tunnel et les signaux
    bottom = true;
    const cam = S.camAt !== undefined && S.t - S.camAt < 0.15;
    if (cam) left = 160;
    const st = STATIONS[S.next], dz = st ? st.pos - S.pos : 99;
    if ((S.next < STATIONS.length && dz <= CURVE_D && dz >= -PE) || bendProfileOn()) {   // courbe d'arrêt (ou de virage) affichée en bas au centre
      const gL = Math.round(W / 2 - 88 + (S.gaugeX || 0) * (162 - (W / 2 - 88)));
      if (!cam) { left = 6; right = gL - 4; } else { bottom = false; y0 = 40; left = 30; right = W - 30; if (dz <= 15) right = W - 172; }
    }
  }
  const maxW = right - left, cx = (left + right) / 2;
  // une carte par message (au plus deux), jamais collés dans une même phrase ; coupure en lignes si besoin
  const cards = S.msgs.slice(-2).map(m => {
    let size = 12; g.font = `${size}px VT323, monospace`;
    while (size > 10 && g.measureText(m.text).width > maxW - 10) { size--; g.font = `${size}px VT323, monospace`; }
    const lines = [];
    let cur = '';
    m.text.split(' ').forEach(wd => { const t = cur ? cur + ' ' + wd : wd; if (cur && g.measureText(t).width > maxW - 10) { lines.push(cur); cur = wd; } else cur = t; });
    if (cur) lines.push(cur);
    const w = Math.min(maxW, Math.max(...lines.map(l => g.measureText(l).width)) + 10);
    return { m, size, lines: lines.slice(0, 3), w, h: 3 + 10 * Math.min(3, lines.length) };
  });
  const total = cards.reduce((t, c) => t + c.h, 0) + 2 * (cards.length - 1);
  let y = bottom ? VIEW_H - 4 - total : y0;
  cards.forEach(c => {
    const m = c.m, x = Math.round(cx - c.w / 2);
    g.globalAlpha = Math.max(0, Math.min(1, (m.life - m.t) * 2, m.t * 8));
    g.fillStyle = 'rgba(6,8,14,0.6)'; g.fillRect(x, y, Math.round(c.w), c.h);
    g.fillStyle = m.col; g.fillRect(x, y, 1.5, c.h);
    c.lines.forEach((l, i) => txt(l, cx + 1, y + 10 + i * 10, c.size, m.col, 'center', 'VT323', maxW - 10));
    y += c.h + 2;
  });
  g.globalAlpha = 1;
}

function drawHelp() {
  g.fillStyle = 'rgba(4,6,12,0.95)'; g.fillRect(0, 0, W, H);
  txt('AIDE — jeu en pause', W / 2, 13, 9, '#ffd75e', 'center', '"Press Start 2P"');
  const col = (x, y, title, lines) => {
    txt(title, x, y, 12, '#ffd75e');
    lines.forEach((l, i) => {
      const [c, t] = Array.isArray(l) ? l : ['#e6ecf5', l];
      if (c.startsWith('#') && t.startsWith('■')) { g.fillStyle = c; g.fillRect(x, y + 6 + i * 10, 6, 6); txt(t.slice(1), x + 9, y + 12 + i * 10, 10, '#e6ecf5', 'left', 'VT323', 178); }
      else txt(t, x, y + 12 + i * 10, 10, c, 'left', 'VT323', 182);
    });
  };
  if (FIRE()) {   // aide du mode Vague de feu
    col(10, 28, 'LE BUT', [
      'Une vague de feu remonte la ligne derrière vous :',
      'amenez un maximum de voyageurs au terminus.',
      'À quai, plus on attend, plus il en monte…',
      ['#ffb35e', '…mais le feu approche (panneau bas gauche).'],
      'Quai brûlé : ses voyageurs sont perdus.',
      'À l\'abri : sauvés sur le total, note sur 20 (90 % = 20).',
      `Médailles : bronze ${MEDS()[0][0]} · argent ${MEDS()[1][0]} · or ${MEDS()[2][0]}`,
    ]);
    col(198, 28, 'À QUAI', [
      'Pas de limite de place : on s\'entasse.',
      'Chiffre sur chaque caméra : voyageurs à bord.',
      '⚙ Traction : une rame lourde ou mal répartie',
      'accélère moins bien.',
      'Touche 1 à 5 (sous chaque caméra) : fermer',
      'une voiture, la foule va vers les autres.',
      ['#9aff6a', '☣ Station infestée : ne vous arrêtez pas !'],
    ]);
    col(10, 122, 'DÉFIS DE TUNNEL (un par tunnel)', [
      ['#7dff8a', 'Virages : restez sous le profil vert ;'],
      ['#7dff8a', 'seul le virage compte, la ligne droite est libre.'],
      ['#9fe0ff', 'Aiguillages : ← ou → selon la flèche en haut'],
      ['#9fe0ff', 'à droite ; « puis » annonce la suivante.'],
      ['#ffb35e', 'Barricade : foncez, au moins 60 km/h. Trop lent :'],
      ['#ffb35e', 'rebond et marche arrière, mais elle se fissure.'],
    ]);
    col(198, 122, 'COMMANDES', [
      'Z : accélérer · S : freiner',
      'P : sonnerie · Entrée : fermer les portes',
      '← → : aiguillages · 1 à 5 : voitures',
      ['#9aff6a', 'Espace : essuie-glaces (zombies)'],
      'Caméra arrière : 3 s après chaque départ.',
      'Pastille VAGUE DE FEU : distance au feu.',
      'Échap : pause · ? : cette aide',
    ]);
  } else {   // aide du service normal
    col(10, 28, 'LE BUT', [
      'Chaque station vaut 3 étoiles :',
      ['#ffd75e', '★ arrêt à moins de 1,5 m de la marque'],
      ['#ffd75e', '★ entrée à quai à ±2 s de l\'heure'],
      ['#ffd75e', '★ quai vidé (personne ne reste)'],
      '+5 par voyageur monté, −5 par voyageur laissé.',
      ['#7dff8a', 'Voitures dans le vert (60–85 %) : +25 chacune,'],
      ['#7dff8a', '+100 si les 5 le sont (dosage parfait).'],
      `Médailles : bronze ${MEDS()[0][0]} · argent ${MEDS()[1][0]} · or ${MEDS()[2][0]}`,
    ]);
    col(198, 28, 'CAMÉRAS DE QUAI', [
      ['#3dff6a', '■porte libre'],
      ['#ffb35e', '■voyageur qui approche de la porte'],
      ['#ff2a2a', '■porte occupée : ne fermez pas !'],
      'Niveau dans la caisse : remplissage (40 places).',
      'Voiture pleine : la foule reste bloquée devant.',
      ['#ffd75e', 'Groupe ×N : N places d\'un coup, sinon bloqué.'],
      'Touche 1 à 5 (sous chaque caméra) : fermer',
      'la voiture, la foule va à la porte voisine.',
    ]);
    col(10, 122, 'EN CONDUITE', [
      'Z : accélérer · S : freiner (appui court = peu).',
      'Courbe d\'arrêt : gardez le curseur dans le vert.',
      'Panneaux 50 / 25 / 10 : mètres avant la marque.',
      ['#7dff8a', 'Virages : restez sous le profil vert (déraillement'],
      ['#7dff8a', 'au-delà de la ligne rouge pointillée).'],
      ['#9fe0ff', '← → : direction aux bifurcations.'],
      ['#4fc8ff', 'HORAIRE : bleu avance, rouge retard.'],
    ]);
    col(198, 122, 'ACTIONS', [
      'P : sonnerie · Entrée : fermer les portes',
      'A : radio (incidents à bord, porte retenue…)',
      'Espace : veille (quand elle sonne)',
      'K : klaxon (personne ou chien sur la voie)',
      'Aiguille en panne : arrêt au signal, puis',
      'flèches en rythme (← ↓ ↑ → ou Q S Z D).',
      'M : missions · H : louches · Échap : pause',
    ]);
  }
  txt(FIRE() ? 'GAME OVER si : la vague de feu rattrape la rame · déraillement' : 'GAME OVER si : voyageur percuté · collision avec le train devant · déraillement · 3 arrêts ratés · trafic à 100 %', W / 2, 203, 9, '#ff8a7a', 'center', 'VT323', W - 16);
  txt('? ou Échap : reprendre', W / 2, 212, 9, '#8fa0b8', 'center');
}
