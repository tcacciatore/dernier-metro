// Dernier Métro · Écran d'accueil et démarrage
// ===== écran d'accueil : intro (la rame arrive dans le tunnel), logo, puis choix de la ligne =====
const TITLE = { stage: 0, t: 0, sel: LINE, best: [] };
const INTRO_HIT = 3.2;                   // instant où la rame passe et où le logo s'abat
function titleGo() {
  TITLE.stage = 1; TITLE.t = 0; TITLE.sel = LINE;
  TITLE.best = LINES.map(Ln => { try { return +localStorage.getItem('dm_best_' + modeId(Ln.id)) || 0; } catch (e) { return 0; } });
  noise(0.6, 0.25, 'bandpass', 900, 0.8, 0, 0.05); beep(392, 0.08, 'square', 0.05); beep(587, 0.12, 'square', 0.05, 0.07);
  startMusic();
}
function titleShake() {
  if (S.mode !== 'title' || TITLE.stage !== 0) return 0;
  const k = TITLE.t - INTRO_HIT; return k > 0 && k < 0.45 ? 6 * (1 - k / 0.45) : 0;
}
// ---- intro : la vague de feu qui poursuit la rame dans le tunnel (dessinée derrière elle) ----
function drawIntroFire(dF, t) {
  if (dF > 1400) return;
  const [cx, cy] = P(0, 0.2, dF), R = 3.0 * F / dF, fl = 0.85 + 0.15 * Math.sin(t * 21) * Math.sin(t * 7.7);
  // lueur projetée sur les parois du tunnel, jusqu'à nous
  glow(cx, cy, Math.min(320, R * 5 + 40), '255,110,30', Math.min(0.38, 0.1 + 30 / dF) * fl);
  glow(cx, cy, Math.min(260, R * 3 + 12), '255,170,60', Math.min(0.7, 0.2 + 30 / dF) * fl);
  if (R < 1.5) return;
  g.save(); g.beginPath(); g.ellipse(cx, cy, R, R * 0.88, 0, 0, Math.PI * 2); g.clip();
  const fg = g.createRadialGradient(cx, cy + R * 0.3, R * 0.05, cx, cy, R * 1.1);
  fg.addColorStop(0, '#fff6d0'); fg.addColorStop(0.3, '#ffc24a'); fg.addColorStop(0.65, '#ff6a1a'); fg.addColorStop(1, '#7a1606');
  g.fillStyle = fg; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  for (let i = 0; i < 16; i++) {   // boules de feu qui roulent vers nous
    const ph = (t * (0.6 + 0.5 * hsh(i, 2)) + hsh(i, 1)) % 1, a = hsh(i, 3) * Math.PI * 2;
    const bx = cx + Math.cos(a) * R * 0.6 * ph, by = cy + Math.sin(a) * R * 0.5 * ph, br = R * (0.12 + 0.3 * ph);
    const bg = g.createRadialGradient(bx, by, 0, bx, by, br);
    bg.addColorStop(0, `rgba(255,${210 + Math.round(40 * hsh(i, 4))},140,${0.75 * (1 - ph)})`); bg.addColorStop(1, 'rgba(200,40,0,0)');
    g.fillStyle = bg; g.fillRect(bx - br, by - br, 2 * br, 2 * br);
  }
  for (let i = 0; i < 5; i++) {    // fumée noire sous la voûte
    const ph = (t * 0.4 + i / 5) % 1, sx = cx + (hsh(i, 9) - 0.5) * R * 1.4, sy = cy - R * (0.5 + 0.35 * ph), sr = R * (0.3 + 0.3 * ph);
    const sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, `rgba(25,14,10,${0.75 * (1 - 0.5 * ph)})`); sg.addColorStop(1, 'rgba(25,14,10,0)');
    g.fillStyle = sg; g.fillRect(sx - sr, sy - sr, 2 * sr, 2 * sr);
  }
  g.restore();
  flameWall(cx - R * 1.15, cx + R * 1.15, P(0, -2, dF)[1] + 1, R * 1.1, t, Math.max(0.3, R / 30));   // flammes qui lèchent le ballast
}
// ---- intro : face avant d'une rame de métro, détaillée, éclairée en contre-jour par le feu ----
function drawTrainFront(d, t = 0) {
  const lit = Math.max(0, Math.min(1, (300 - d) / 240)), s = F / d;
  const Q = (x, y) => P(x, y, d), X = x => P(x, 0, d)[0], Y = y => P(0, y, d)[1];
  const path = pts => { g.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = Q(x, y); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
  const rect = (x0, y0, x1, y1, col) => { g.fillStyle = col; g.fillRect(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1)); };
  // contour de la caisse : flancs légèrement galbés, toit arrondi
  const body = [[-1.46, -1.62], [-1.5, 0.2], [-1.49, 1.15], [-1.4, 1.5], [-1.15, 1.72], [1.15, 1.72], [1.4, 1.5], [1.49, 1.15], [1.5, 0.2], [1.46, -1.62]];
  if (s * 3 > 5) {
    // halo du feu qui déborde autour de la silhouette
    const [cx, cy] = Q(0, 0); glow(cx, cy, Math.min(380, s * 3), '255,120,40', 0.22);
    // langues de flammes qui lèchent la rame par derrière (dessinées derrière la caisse, elles dépassent du contour)
    const edge = [];
    for (let i = 0; i <= 10; i++) edge.push([-1.3 + 2.6 * i / 10, 1.72, 0, 1]);
    for (let i = 0; i <= 8; i++) { const y = -1.5 + 2.9 * i / 8; edge.push([-1.5, y, -1, 0], [1.5, y, 1, 0]); }
    edge.forEach(([x, y, nx, ny], i) => {
      const q = 0.5 + 0.5 * Math.sin(t * (7 + hsh(i, 3) * 6) + i * 1.9), L = (0.35 + 0.75 * q * hsh(i, 4)) * (ny ? 1.2 : 1), wd = 0.16;
      const tx = -ny, ty = nx, wob = Math.sin(t * 11 + i) * 0.12;
      const [ax, ay] = Q(x - tx * wd, y - ty * wd), [bx, by] = Q(x + nx * L + tx * wob, y + ny * L + ty * wob), [cx2, cy2] = Q(x + tx * wd, y + ty * wd), [mx, my] = Q(x + nx * L * 0.55 - tx * wd * 0.6, y + ny * L * 0.55 - ty * wd * 0.6);
      g.fillStyle = q > 0.6 ? 'rgba(255,215,110,0.85)' : q > 0.3 ? 'rgba(255,140,40,0.8)' : 'rgba(220,60,20,0.75)';
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx, my, bx, by); g.quadraticCurveTo(mx + (cx2 - ax) * 0.5, my + (cy2 - ay) * 0.5, cx2, cy2); g.closePath(); g.fill();
    });
    g.globalAlpha = Math.max(0.35, lit);
    path(body);
    const bg = g.createLinearGradient(0, Y(1.72), 0, Y(-1.62));
    bg.addColorStop(0, '#e2e6ea'); bg.addColorStop(0.45, '#c3c9d0'); bg.addColorStop(0.78, '#8a9099'); bg.addColorStop(1, '#4c5058');
    g.fillStyle = bg; g.fill();
    // reflet métallique vertical et liseré de feu sur les arêtes (contre-jour)
    const sh2 = g.createLinearGradient(X(-1.5), 0, X(1.5), 0);
    sh2.addColorStop(0, 'rgba(255,120,40,0.35)'); sh2.addColorStop(0.12, 'rgba(255,255,255,0)'); sh2.addColorStop(0.32, 'rgba(255,255,255,0.18)'); sh2.addColorStop(0.4, 'rgba(255,255,255,0)'); sh2.addColorStop(0.88, 'rgba(255,255,255,0)'); sh2.addColorStop(1, 'rgba(255,120,40,0.35)');
    g.fillStyle = sh2; path(body); g.fill();
    g.strokeStyle = `rgba(255,${150 + Math.round(40 * Math.sin(t * 9))},60,0.9)`; g.lineWidth = Math.max(1, 0.05 * s); path(body); g.stroke();
    if (s > 9) {
      // bandeau inférieur graphite, bande à la couleur de la ligne
      rect(-1.46, -1.62, 1.46, -0.62, '#2b2f36');
      rect(-1.48, -0.62, 1.48, -0.48, LN().col); rect(-1.48, -0.5, 1.48, -0.47, 'rgba(255,255,255,0.25)');
      // pare-brise en deux vitres, cabine éclairée derrière
      const ws = [[-1.3, 0.22], [-1.32, 1.18], [-1.12, 1.36], [1.12, 1.36], [1.32, 1.18], [1.3, 0.22]];
      path(ws); g.fillStyle = '#0a0e15'; g.fill();
      g.save(); path(ws); g.clip();
      const cab = g.createLinearGradient(0, Y(1.36), 0, Y(0.22)); cab.addColorStop(0, '#141b26'); cab.addColorStop(1, '#2a3444');
      g.fillStyle = cab; g.fillRect(X(-1.4), Y(1.4), X(1.4) - X(-1.4), Y(0.2) - Y(1.4));
      // pupitre : voyants verts et ambre
      rect(-1.25, 0.22, 1.25, 0.42, '#11161e');
      for (let i = 0; i < 9; i++) { const vx = -1.0 + i * 0.25, on = hsh(i, Math.floor(t * 3)) > 0.3; g.fillStyle = on ? (i % 3 ? '#3dff6a' : '#ffb547') : '#203024'; const [px, py] = Q(vx, 0.33); g.fillRect(px, py, Math.max(1, 0.05 * s), Math.max(1, 0.04 * s)); }
      // conducteur, à gauche, en silhouette
      const [hx, hy] = Q(-0.62, 0.86), hr = 0.17 * s; g.fillStyle = '#05070b';
      g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill();
      g.beginPath(); g.ellipse(hx, Y(0.5), 0.38 * s, 0.24 * s, 0, Math.PI, 2 * Math.PI); g.fill(); g.fillRect(hx - 0.38 * s, Y(0.5), 0.76 * s, Y(0.22) - Y(0.5));
      // reflets sur le verre
      g.fillStyle = 'rgba(200,220,255,0.13)'; path([[-1.2, 1.3], [-0.75, 1.3], [-1.05, 0.25], [-1.28, 0.25]]); g.fill();
      g.fillStyle = 'rgba(200,220,255,0.08)'; path([[0.45, 1.3], [0.62, 1.3], [0.35, 0.25], [0.2, 0.25]]); g.fill();
      g.fillStyle = 'rgba(255,140,50,0.12)'; path([[0.9, 1.3], [1.25, 1.2], [1.28, 0.25], [1.1, 0.25]]); g.fill();
      g.restore();
      // montant central, joints du pare-brise, essuie-glaces
      rect(-0.05, 0.22, 0.05, 1.36, '#9aa0a8');
      g.strokeStyle = '#3a3f47'; g.lineWidth = Math.max(1, 0.035 * s); path(ws); g.stroke();
      g.strokeStyle = '#15181d'; g.lineWidth = Math.max(1, 0.025 * s);
      for (const [x0, x1] of [[-0.75, -0.2], [0.35, 0.95]]) { const [ax, ay] = Q(x0, 0.27), [bx, by] = Q(x1, 0.72); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
      // girouette à LED ambre
      rect(-1.0, 1.39, 1.0, 1.64, '#070504');
      if (s > 40) {
        const sz = Math.max(6, Math.round(0.21 * s));
        g.save(); g.shadowColor = 'rgba(255,170,60,0.9)'; g.shadowBlur = 0.12 * s;
        txt('DERNIER MÉTRO', X(0), Y(1.445), sz, '#ffb547', 'center', '"Press Start 2P"', X(0.95) - X(-0.95)); g.restore();
        g.fillStyle = 'rgba(0,0,0,0.35)'; for (let yy = Y(1.64); yy < Y(1.39); yy += Math.max(1.5, 0.03 * s)) g.fillRect(X(-1), yy, X(1) - X(-1), Math.max(0.5, 0.008 * s));   // trame des LED
      } else rect(-0.8, 1.45, 0.8, 1.58, 'rgba(255,170,60,0.7)');
      // porte d'évacuation frontale (contour, poignée, marche)
      g.strokeStyle = 'rgba(30,34,40,0.8)'; g.lineWidth = Math.max(1, 0.02 * s);
      path([[-0.42, -1.45], [-0.42, 0.18], [0.42, 0.18], [0.42, -1.45]]); g.stroke();
      rect(0.25, -0.95, 0.33, -0.75, '#9aa0a8');
      // joints de panneaux et rivets
      g.strokeStyle = 'rgba(40,44,52,0.55)'; g.lineWidth = Math.max(0.6, 0.012 * s);
      for (const y of [0.12, -0.05]) { const [ax, ay] = Q(-1.48, y), [bx] = Q(1.48, y); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, ay); g.stroke(); }
      if (s > 60) { g.fillStyle = 'rgba(60,64,72,0.7)'; for (let x = -1.4; x <= 1.41; x += 0.14) for (const y of [0.15, -0.08]) { const [px, py] = Q(x, y); g.fillRect(px, py, Math.max(1, 0.015 * s), Math.max(1, 0.015 * s)); } }
      // numéro de rame
      rect(0.62, -0.38, 1.12, -0.22, '#e8eaee'); if (s > 50) txt('042', X(0.87), Y(-0.36), Math.max(6, Math.round(0.14 * s)), '#1a1d22', 'center');
      // blocs de phares : deux optiques rondes et un bandeau LED, dans un boîtier noir
      for (const sd of [-1, 1]) {
        rect(sd < 0 ? -1.38 : 0.62, -0.98, sd < 0 ? -0.62 : 1.38, -0.68, '#0c0e12');
        for (const ox of [0.86, 1.18]) { const [lx, ly] = Q(sd * ox, -0.83), r = 0.11 * s; const lg = g.createRadialGradient(lx, ly, 0, lx, ly, r); lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.6, '#fff4d8'); lg.addColorStop(1, '#a89878'); g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, r, 0, 7); g.fill(); }
        rect(sd < 0 ? -1.34 : 0.66, -0.75, sd < 0 ? -0.66 : 1.34, -0.71, '#fff6e0');
      }
      // feux de position en haut des angles
      for (const sd of [-1, 1]) { const [mx, my] = Q(sd * 1.22, 1.45); glow(mx, my, 0.2 * s, '255,240,220', 0.5); g.fillStyle = '#fffaf0'; g.fillRect(mx - 0.04 * s, my - 0.03 * s, 0.08 * s, 0.06 * s); }
      // chasse-pierres, anti-chevauchement, attelage, garde-corps
      for (let k = 0; k < 4; k++) rect(-1.1, -1.32 - k * 0.07, 1.1, -1.29 - k * 0.07, '#5a5f68');
      rect(-0.32, -1.95, 0.32, -1.55, '#3a3e45'); rect(-0.18, -1.9, 0.18, -1.7, '#6a6f78');
      for (const sd of [-1, 1]) { path([[sd * 0.6, -1.98], [sd * 1.2, -1.98], [sd * 1.35, -1.62], [sd * 0.7, -1.62]]); g.fillStyle = '#1d2026'; g.fill(); }
      for (const sd of [-1, 1]) rect(sd < 0 ? -1.42 : 1.36, -0.4, sd < 0 ? -1.36 : 1.42, 0.1, '#b8bec6');
      // salissures : traînées sombres sous les phares et le long du bas de caisse
      const gr = g.createLinearGradient(0, Y(-0.3), 0, Y(-1.62)); gr.addColorStop(0, 'rgba(30,24,18,0)'); gr.addColorStop(1, 'rgba(30,24,18,0.45)');
      g.fillStyle = gr; g.fillRect(X(-1.48), Y(-0.3), X(1.48) - X(-1.48), Y(-1.62) - Y(-0.3));
      g.fillStyle = 'rgba(40,30,20,0.18)'; for (let k = 0; k < 9; k++) { const x = -1.3 + hsh(k, 8) * 2.6; rect(x, -1.5, x + 0.04, -0.98 + hsh(k, 9) * 0.3, 'rgba(40,30,20,0.16)'); }
    }
    g.globalAlpha = 1;
  }
  // phares : visibles de très loin, faisceaux dans la poussière du tunnel
  for (const sx of [-1.02, 1.02]) {
    const [hx, hy] = Q(sx, -0.83), r = Math.max(0.8, 0.13 * s);
    glow(hx, hy, Math.min(60, r * 10 + 4), '255,236,190', 0.45); glow(hx, hy, Math.min(16, r * 3), '255,250,235', 0.8);
    if (s * 3 <= 9) { g.fillStyle = '#fffdf2'; g.beginPath(); g.arc(hx, hy, r, 0, 7); g.fill(); }
  }
}
// logo : « DERNIER » + « MÉTRO » en relief, contour noir, halo de néon qui grésille
function drawLogo(cx, cy, sc, neon) {
  const big = Math.round(34 * sc), small = Math.max(6, Math.round(11 * sc));
  g.textAlign = 'center'; g.lineJoin = 'round';
  g.font = `${small}px "Press Start 2P", monospace`;
  const dy = cy - big * 1.35 - 4 * sc;
  g.lineWidth = Math.max(2, 3 * sc); g.strokeStyle = '#000'; g.strokeText('DERNIER', cx, dy);
  g.fillStyle = '#e6ecf5'; g.fillText('DERNIER', cx, dy);
  g.font = `${big}px "Press Start 2P", monospace`;
  const word = 'METRO', tw = g.measureText(word).width, x0 = cx - tw / 2, mW = g.measureText('M').width, eW = g.measureText('E').width;
  g.textAlign = 'left';
  for (let k = Math.round(5 * sc); k >= 1; k--) { g.fillStyle = k > 2 * sc ? '#3a1404' : '#7a2a0c'; g.fillText(word, x0 + k, cy + k); }   // extrusion
  g.lineWidth = Math.max(2, 4 * sc); g.strokeStyle = '#000'; g.strokeText(word, x0, cy);
  const gr = g.createLinearGradient(0, cy - big, 0, cy); gr.addColorStop(0, '#fff6c2'); gr.addColorStop(0.45, '#ffd75e'); gr.addColorStop(1, '#ff8a2a');
  if (neon > 0) { g.shadowColor = '#ffb547'; g.shadowBlur = 14 * neon * RES; }
  g.fillStyle = gr; g.fillText(word, x0, cy); g.shadowBlur = 0;
  // accent du É
  const ax = x0 + mW + eW * 0.42, ay = cy - big * 1.22, aw = Math.max(3, big * 0.28), ah = Math.max(2, big * 0.16);
  const acc = (o, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(ax - o, ay + ah + o); g.lineTo(ax + aw * 0.6 - o, ay - o); g.lineTo(ax + aw * 1.25 + o, ay - o); g.lineTo(ax + aw * 0.65 + o, ay + ah + o); g.fill(); };
  acc(1.2, '#000'); acc(0, '#fff6c2');
  // tube de néon sous le mot, à la couleur de la ligne
  const ny = cy + big * 0.32 + 2, col = LN().col, rgb = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)).join(',');
  if (neon > 0) glow(cx, ny, tw * 0.55, rgb, 0.18 * neon);
  g.fillStyle = neon > 0.5 ? col : '#2a2e36'; g.fillRect(x0 + 4, ny, tw - 8, Math.max(1.5, 2 * sc));
  g.textAlign = 'left';
}
// texte en police pixel avec É : la police n'a pas la majuscule accentuée, on dessine l'accent
function pixText(str, x, y, size, col, shadow = '#000') {
  g.font = `${size}px "Press Start 2P", monospace`; g.textAlign = 'left';
  const plain = str.replace(/É/g, 'E'), tw = g.measureText(plain).width, x0 = x - tw / 2;
  const draw = (dx, dy, c) => {
    g.fillStyle = c; g.fillText(plain, x0 + dx, y + dy);
    for (let i = 0; i < str.length; i++) if (str[i] === 'É') {
      const ex = x0 + dx + g.measureText(plain.slice(0, i)).width + size * 0.35, ey = y + dy - size * 1.25;
      g.beginPath(); g.moveTo(ex, ey + size * 0.22); g.lineTo(ex + size * 0.22, ey); g.lineTo(ex + size * 0.42, ey); g.lineTo(ex + size * 0.2, ey + size * 0.22); g.fill();
    }
  };
  if (shadow) draw(1, 1, shadow);
  draw(0, 0, col);
}
function neonFlicker(t) {    // grésillement à l'allumage, puis quelques ratés de temps en temps
  if (t < 0) return 0;
  if (t < 1.1) return [1, 0, 1, 0.2, 0, 1, 1, 0, 0.6, 1, 0, 1, 1, 1, 0.3, 1][Math.floor(t * 14) % 16];
  return hsh(Math.floor(t * 9), 91) < 0.04 ? 0.25 : 1;
}
function drawTitle() {
  const t = TITLE.t;
  if (TITLE.stage === 0) {
    // 1. intro : noir du tunnel, deux phares au loin qui grossissent, la rame passe plein écran
    g.fillStyle = `rgba(2,3,8,${t < INTRO_HIT ? 0.8 : 0.74})`; g.fillRect(0, 0, W, H);
    if (t < INTRO_HIT) {
      const k = t / INTRO_HIT, d = 0.9 + 600 * Math.pow(1 - k, 3);
      const [vx, vy] = P(0, -0.75, d);
      drawIntroFire(d * 1.12 + 2.5, t);                                            // la vague de feu talonne la rame
      glow(vx, vy, 30 + 200 * k * k, '255,226,170', 0.06 + 0.16 * k * k);       // la lumière envahit le tunnel
      drawTrainFront(d, t);
      if (k > 0.8) for (let i = 0; i < 26; i++) {                                // étincelles sur les rails
        const side = i % 2 ? 1 : -1, [sx, sy] = P(side * 0.72, -1.98, Math.max(1, d)), q = hsh(i + Math.floor(t * 30) * 7, 5);
        g.fillStyle = q > 0.5 ? '#ffe9a0' : '#ff9a3a';
        g.fillRect(sx + side * q * 28 * k, sy - hsh(i, 6) * 16 * k, 1.5, 1.5);
      }
    } else {
      const k = t - INTRO_HIT;
      if (k < 0.5) { g.fillStyle = `rgba(255,250,235,${1 - k / 0.5})`; g.fillRect(0, 0, W, H); }   // éclair blanc
      const slam = Math.max(0, 1 - k / 0.2), sc = 1 + 2.4 * slam * slam;
      g.globalAlpha = Math.min(1, k / 0.08);
      drawLogo(W / 2, 92, sc, neonFlicker(k - 0.25));
      g.globalAlpha = 1;
      if (k > 0.9) {
        txt('Prenez les commandes de la dernière rame de la nuit', W / 2, 122, 11, '#a8b2c6', 'center', 'VT323', W - 40);
        if (Math.floor(t * 1.8) % 2 === 0) {
          pixText('APPUYEZ SUR ENTRÉE', W / 2, 157, 9, '#ffffff');
        }
        txt('ou cliquez', W / 2, 172, 10, '#6f7a90', 'center');
      }
    }
    return;
  }
  // 2. choix de la ligne : cartes façon sélection de niveau
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, 'rgba(4,6,12,0.9)'); gr.addColorStop(0.4, 'rgba(4,6,12,0.55)'); gr.addColorStop(1, 'rgba(4,6,12,0.96)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (t < 0.35) { g.fillStyle = `rgba(255,250,235,${0.5 * (1 - t / 0.35)})`; g.fillRect(0, 0, W, H); }
  drawLogo(W / 2, 40, 0.55, neonFlicker(t + 2));
  const intro = 1 - Math.pow(1 - Math.min(1, t / 0.45), 3), oy = (1 - intro) * 90;
  const order = LINES.map((_, i) => i).sort((a, b) => Math.abs(b - TITLE.sel) - Math.abs(a - TITLE.sel));
  for (const i of order) {
    const Ln = LINES[i], rel = i - TITLE.sel, ar = Math.min(1.4, Math.abs(rel));
    const sc = 1 - Math.min(1, ar) * 0.3, cw = 132 * sc, ch = 96 * sc;
    const x = W / 2 + rel * 128 - cw / 2, y = 102 - ch / 2 + oy, sel = Math.abs(rel) < 0.5;
    g.globalAlpha = 1 - Math.min(1, ar) * 0.5;
    if (sel) { const rgb = [1, 3, 5].map(k => parseInt(Ln.col.slice(k, k + 2), 16)).join(','); glow(x + cw / 2, y + ch / 2, cw * 0.8, rgb, 0.22 + 0.08 * Math.sin(S.t * 4)); }
    g.fillStyle = '#000'; g.fillRect(x + 3, y + 3, cw, ch);
    g.fillStyle = '#121826'; g.fillRect(x, y, cw, ch);
    g.fillStyle = Ln.col; g.fillRect(x, y, cw, 22 * sc);
    g.strokeStyle = sel ? Ln.col : '#3a4256'; g.lineWidth = sel ? 2 : 1; g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
    // pastille et nom
    const rx = x + 16 * sc, ry = y + 11 * sc;
    g.fillStyle = '#0d0f14'; g.beginPath(); g.arc(rx, ry, 9 * sc, 0, 7); g.fill();
    g.fillStyle = Ln.col; g.beginPath(); g.arc(rx, ry, 7.5 * sc, 0, 7); g.fill();
    txt(Ln.num, rx + (Ln.num.length > 1 ? 0.5 : 0), ry + (Ln.num.length > 1 ? 3 : 4) * sc, Math.round((Ln.num.length > 1 ? 7 : 10) * sc), Ln.fg, 'center', '"Press Start 2P"');
    g.font = `${Math.round(9 * sc)}px "Press Start 2P", monospace`; g.textAlign = 'left'; g.fillStyle = Ln.fg;
    g.fillText('LIGNE ' + Ln.num, x + 30 * sc, y + 15 * sc);
    // difficulté en étoiles
    const sy = y + 36 * sc;
    txt(Ln.diff, x + 8 * sc, sy, Math.round(12 * sc), Ln.dcol, 'left', 'VT323');
    for (let k = 0; k < 4; k++) txt('★', x + cw - 10 * sc - (3 - k) * 11 * sc, sy, Math.round(12 * sc), k <= i ? Ln.dcol : '#2e3446', 'center');
    if (sel) {
      txt(`${Ln.st[0][0]}  →  ${Ln.st[Ln.st.length - 1][0]}`, x + cw / 2, y + 52, 10, '#cfd6e6', 'center', 'VT323', cw - 12);
      txt(Ln.desc, x + cw / 2, y + 63, 10, '#8a94a8', 'center', 'VT323', cw - 12);
      const best = TITLE.best[i] || 0, med = medalOf(best);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 6, y + ch - 22, cw - 12, 16);
      txt(best ? `RECORD ${best}` : 'PAS ENCORE DE RECORD', x + 12, y + ch - 10, 11, best ? '#ffffff' : '#6f7a90', 'left', 'VT323');
      if (med) { g.fillStyle = med[2]; g.beginPath(); g.arc(x + cw - 16, y + ch - 14, 5, 0, 7); g.fill(); txt(med[1], x + cw - 24, y + ch - 10, 10, med[2], 'right', 'VT323'); }
    }
    g.globalAlpha = 1;
  }
  // flèches qui battent de part et d'autre de la carte choisie
  const ab = Math.sin(S.t * 6) * 2;
  g.font = '10px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillStyle = '#ffd75e';
  if (LINE > 0) g.fillText('◄', W / 2 - 74 + ab, 106 + oy);
  if (LINE < LINES.length - 1) g.fillText('►', W / 2 + 74 - ab, 106 + oy);
  g.textAlign = 'left';
  // bouton
  const pulse = 0.5 + 0.5 * Math.sin(S.t * 5);
  g.font = '8px "Press Start 2P", monospace'; const lab = FIRE() ? 'ENTRÉE : FUIR LA VAGUE' : 'ENTRÉE : PRENDRE LE SERVICE', bw = Math.ceil(g.measureText(lab.replace('É', 'E')).width) + 22;
  g.fillStyle = `rgba(255,215,94,${0.14 + 0.22 * pulse})`; g.fillRect(W / 2 - bw / 2, 160, bw, 18);
  g.strokeStyle = '#ffd75e'; g.lineWidth = 1; g.strokeRect(W / 2 - bw / 2 + 0.5, 160.5, bw - 1, 17);
  pixText(lab, W / 2, 173, 8, '#ffffff', null);
  // sélecteur de mode (▲ ▼)
  const fire = FIRE();
  [['SERVICE NORMAL', false], ['🔥 VAGUE DE FEU', true]].forEach(([lab, f], j) => {
    const on = f === fire, bx = W / 2 + (j ? 4 : -112), by = 182;
    g.fillStyle = on ? (f ? 'rgba(255,90,20,0.3)' : 'rgba(120,170,255,0.22)') : 'rgba(255,255,255,0.04)'; g.fillRect(bx, by, 108, 13);
    g.strokeStyle = on ? (f ? '#ff8a3a' : '#9fc4ff') : '#2e3446'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, 107, 12);
    txt(lab, bx + 54, by + 10, 11, on ? '#ffffff' : '#6f7a90', 'center', 'VT323', 104);
  });
  txt(fire ? 'Le feu remonte la ligne : embarquez un maximum de voyageurs et fuyez jusqu\'au terminus' : 'Un maximum de voyageurs, à l\'heure, arrêt pile sur la marque', W / 2, 204, 10, fire ? '#ffb38a' : '#a8b2c6', 'center', 'VT323', W - 20);
  txt('◄ ► ligne   ▲ ▼ mode   C classement   T tutoriel   ? aide   F plein écran', W / 2, 214, 9, '#6f7a90', 'center', 'VT323', W - 60);
  txt(VERSION, W - 4, 8, 8, '#4a5468', 'right');
  if (TITLE.rank) drawRanking();
}
// classement local de la ligne choisie : 5 meilleurs services et meilleures médailles par catégorie
function drawRanking() {
  const Ln = LN(), top = loadTop(modeId(Ln.id)), cat = loadCat(modeId(Ln.id));
  const x = 62, y = 22, w = W - 124, h = 170;
  g.fillStyle = 'rgba(4,6,12,0.96)'; g.fillRect(x, y, w, h);
  g.strokeStyle = Ln.col; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.fillStyle = Ln.col; g.fillRect(x, y, w, 16);
  pixText(`${FIRE() ? 'FUITE' : 'CLASSEMENT'} · LIGNE ${Ln.num}`, x + w / 2, y + 12, 8, Ln.fg, null);
  txt('Rang', x + 12, y + 30, 10, '#8fa0b8'); txt('Score', x + 44, y + 30, 10, '#8fa0b8'); txt('Médaille', x + 92, y + 30, 10, '#8fa0b8');
  ['Pon.', 'Aig.', 'Voy.'].forEach((l, j) => txt(l, x + 160 + j * 22, y + 30, 10, '#8fa0b8', 'center')); txt('Date', x + w - 12, y + 30, 10, '#8fa0b8', 'right');
  for (let i = 0; i < 5; i++) {
    const e = top[i], yy = y + 44 + i * 13, rc = ['#ffd75e', '#c8d0dc', '#d08a4a', '#8fa0b8', '#8fa0b8'][i];
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'; g.fillRect(x + 6, yy - 9, w - 12, 12);
    txt(`${i + 1}.`, x + 14, yy, 11, rc);
    if (!e) { txt('—', x + 44, yy, 11, '#4a5468'); continue; }
    txt(String(e.s), x + 44, yy, 11, '#ffffff');
    const md = medalOf(e.s); if (md) { medalDot(x + 96, yy - 3, MEDS().indexOf(md) + 1, 3.5); txt(md[1], x + 103, yy, 10, md[2]); } else txt('—', x + 96, yy, 10, '#4a5468');
    (e.m || []).forEach((lv, j) => medalDot(x + 160 + j * 22, yy - 3, lv, 3.5));
    txt(e.d || '', x + w - 12, yy, 10, '#8fa0b8', 'right');
  }
  txt('MEILLEURES MÉDAILLES PAR CATÉGORIE', x + w / 2, y + 120, 10, '#8fa0b8', 'center');
  CAT.forEach((c, i) => {
    const cx = x + 18 + i * 86, lv = cat[i];
    medalDot(cx, y + 133, lv, 5);
    txt(c[0], cx + 9, y + 132, 10, '#e6ecf5'); txt(lv ? LVL[lv][0] : 'à gagner', cx + 9, y + 142, 10, lv ? LVL[lv][1] : '#4a5468');
  });
  txt('Seuils : bronze 50 % · argent 75 % · or 95 %', x + w / 2, y + 156, 10, '#6f7a90', 'center', 'VT323', w - 12);
  txt('C ou Échap : fermer', x + w / 2, y + 166, 9, '#a8b2c6', 'center');
}

function drawEnd() {
  g.fillStyle = 'rgba(4,5,9,0.88)'; g.fillRect(0, 0, W, H);
  if (S.over) { txt('GAME OVER', W / 2, 18, 12, '#ff4a3a', 'center', '"Press Start 2P"'); txt(S.over.title, W / 2, 28, 11, '#ffb3a8', 'center', 'VT323', W - 20); }
  else txt(S.fire ? `ABRI ATTEINT · NOTE ${S.note}/20` : 'FIN DE SERVICE', W / 2, 18, 12, S.fire ? NOTE_LBL(S.note)[1] : '#ffd75e', 'center', '"Press Start 2P"');
  txt('Station', 20, 32, 12, '#8fa0b8'); txt(S.fire ? 'Vague' : 'Horaire', 112, 32, 12, '#8fa0b8'); txt('Arrêt', 158, 32, 12, '#8fa0b8'); txt('Voy.', 204, 32, 12, '#8fa0b8'); txt('Étoiles', 248, 32, 12, '#8fa0b8'); txt('Points', 366, 32, 12, '#8fa0b8', 'right');
  STATIONS.forEach((s, i) => {
    const y = 32 + (i + 1) * 9.6;
    const r = s.res;
    txt(s.name, 20, y, 12, '#e6ecf5', 'left', 'VT323', 88);
    if (r.offer > 0) txt(`${r.board}/${r.offer}`, 204, y, 12, r.left === 0 ? '#7dff8a' : '#ffb35e');
    if (S.fire && r.lost) txt(`†${r.lost}`, 260, y, 11, '#ff8a5b');
    if (i > 0) {
      if (r.closed) txt('fermée', 112, y, 12, '#9fe0ff');
      else if (r.zok) txt('☣ évitée', 112, y, 12, '#9aff6a');
      else if (r.skipped) txt(S.fire ? 'sans arrêt' : 'brûlée', 112, y, 12, '#ff6b5b');
      else if (r.dt !== null) {
        const ad = Math.abs(r.dt);
        if (S.fire && s.zombie) txt(`☣ -${r.zbit || 0}`, 112, y, 12, '#9aff6a');
        else if (S.fire) txt(`${r.fireGap} m`, 112, y, 12, fireCol(r.fireGap));
        else txt(r.dt > 1 ? `+${r.dt} s` : r.dt < -1 ? `${r.dt} s` : 'à l\'heure', 112, y, 12, ad <= 1 ? '#7dff8a' : ad <= 5 ? '#ffd75e' : '#ff6b5b');
        const ae = Math.abs(r.err);
        txt(`${r.err >= 0 ? '+' : '−'}${ae.toFixed(1)} m`, 158, y, 12, ae <= 0.5 ? '#7dff8a' : ae <= 2 ? '#ffd75e' : '#ff6b5b');
      }
    }
    if (r.stars) (S.fire ? ['p'] : ['p', 't', 'v']).forEach((k, j) => { if (r.stars[k] !== null && r.stars[k] !== undefined) txt('★', 248 + j * 10, y, 12, r.stars[k] ? '#ffd75e' : '#3a3e4a'); });
    if (r.mult > 1) txt('x' + r.mult, 282, y, 11, '#9fe0ff');
    const tot = r.pts + r.pen + 5 * r.board - (S.fire ? 0 : 5 * r.left);
    txt(String(tot), 366, y, 12, tot >= 0 ? '#e6ecf5' : '#ff6b5b', 'right');
  });
  const max = (STATIONS.length - 1) * 200, b = S.base + Math.min(0, S.score - S.base);
  const rank = b >= max * 0.9 ? 'Conducteur légendaire' : b >= max * 0.7 ? 'Conducteur confirmé' : b >= max * 0.45 ? 'Conducteur stagiaire' : 'Retour au centre de formation…';
  S.missions.forEach((m, i) => {
    const ic = m.state === 'done' ? '★' : '✗', c = m.state === 'done' ? '#ffd75e' : '#ff6b5b';
    txt(ic + ' ' + m.short, 20 + i * 122, 152, 11, c, 'left', 'VT323', 116);
  });
  // bilan par pilier et point faible
  const served = STATIONS.filter((s, i) => i > 0 && s.res.stars), cnt = k => STATIONS.filter(s => s.res.stars && s.res.stars[k]).length;
  const nArr = Math.max(1, served.length), nDep = Math.max(1, STATIONS.filter(s => s.res.stars && s.res.stars.v !== null && s.res.stars.v !== undefined).length);
  const pil = [['la précision', cnt('p') / nArr], ['la ponctualité', cnt('t') / nArr], ['le remplissage', cnt('v') / nDep], ['la sécurité', secPct() / 100]];
  const weak = pil.reduce((a, b) => b[1] < a[1] ? b : a);
  const totStars = cnt('p') + cnt('t') + cnt('v');
  if (S.fire) txt(`🔥 ${S.saved} sauvés sur ${S.saved + S.lost} (${S.saved + S.lost ? Math.round(100 * S.saved / (S.saved + S.lost)) : 0} %)  ·  ${S.lost} perdus (†)  ·  ☣ ${STATIONS.filter(x => x.res.zok).length} station${STATIONS.filter(x => x.res.zok).length > 1 ? 's' : ''} infestée${STATIONS.filter(x => x.res.zok).length > 1 ? 's' : ''} évitée${STATIONS.filter(x => x.res.zok).length > 1 ? 's' : ''}  ·  🛡 ${secPct()} %`, W / 2, 163, 11, '#ffd0a8', 'center', 'VT323', W - 16);
  else txt(`★ ${totStars} étoiles  ·  🛡 ${secPct()} %  ·  ⚗ ${S.perfectFills || 0} dosage${(S.perfectFills || 0) > 1 ? 's' : ''} parfait${(S.perfectFills || 0) > 1 ? 's' : ''}  ·  trafic +${S.trafBonus}  ·  point faible : ${weak[0]}`, W / 2, 163, 11, '#e6ecf5', 'center', 'VT323', W - 16);
  if (S.cat) CAT.forEach((c, i) => {      // médailles par catégorie
    const cx = 34 + i * 118, lv = S.cat[i], blink = S.catNew[i] && lv > 0 && Math.floor(S.t * 4) % 2;
    medalDot(cx, 172, lv);
    txt(c[0], cx + 7, 175, 10, '#8fa0b8');
    txt(lv < 0 ? '—' : lv ? LVL[lv][0] + (S.catNew[i] ? ' !' : '') : `${Math.round(S.catR[i] * 100)} %`, cx + 7 + 58, 175, 10, blink ? '#ffffff' : lv > 0 ? LVL[lv][1] : '#6f7a90');
  });
  const med = medalOf(S.score);
  if (med) {   // médaille avec ruban
    const mx = W / 2 - 100;
    g.fillStyle = '#1d3c8f'; g.beginPath(); g.moveTo(mx - 4, 178); g.lineTo(mx + 4, 178); g.lineTo(mx + 2, 184); g.lineTo(mx - 2, 184); g.fill();
    g.fillStyle = med[2]; g.beginPath(); g.arc(mx, 188, 6, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(mx - 2, 186, 2, 0, 7); g.fill();
    txt(med[1], mx + 10, 192, 12, med[2]);
  }
  txt(`SCORE : ${S.score}`, W / 2 + (med ? 26 : 0), 190, 17, '#ffd75e', 'center');
  if (S.newRecord) { if (Math.floor(S.t * 4) % 2) txt('NOUVEAU RECORD !', W / 2, 201, 13, '#7dff8a', 'center'); }
  else if (S.rankPos) txt(`${S.rankPos}e meilleur service de la ligne  ·  record : ${BEST}  ·  +${S.starsWon || 0} missions`, W / 2, 201, 12, '#7dff8a', 'center', 'VT323', W - 16);
  else { const nm = nextMedal(S.score); txt(`Record : ${BEST}  ·  ${med ? 'médaille ' + med[1].toLowerCase() : 'pas de médaille'}${nm ? `  ·  ${nm[1].toLowerCase()} à ${nm[0]}` : ''}  ·  +${S.starsWon || 0} missions`, W / 2, 201, 12, '#cfd6e6', 'center', 'VT323', W - 16); }

  if (Math.floor(S.t * 2) % 2) txt('ENTREE OU R POUR REJOUER', W / 2, 211, 8, '#ffffff', 'center', '"Press Start 2P"');
}

function render() {
  g.setTransform(RES, 0, 0, RES, 0, 0);
  if (S.mode === 'title') {
    const sh = titleShake();
    if (sh) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.translate(sh * (hsh(Math.floor(S.t * 60), 3) - 0.5), sh * (hsh(Math.floor(S.t * 60), 4) - 0.5)); }
    g.fillStyle = '#04060c'; g.fillRect(-8, VIEW_H - 1, W + 16, H - VIEW_H + 9);   // pas de pupitre à l'accueil
    drawScene(); drawTitle(); if (S.help) drawHelp(); return;
  }
  const shk = S.shake > 0 ? S.shake * 9 : 0;   // secousse au choc contre la barricade
  if (shk) { g.save(); g.translate((Math.random() - 0.5) * shk, (Math.random() - 0.5) * shk); }
  drawScene();
  drawDebris();
  if (S.mode === 'running' && S.phase === 'drive' || (S.wz && S.wz.length)) drawWindZombies();
  if (shk) g.restore();
  drawFireGlow();
  drawGauge();
  const blastOn = S.mode === 'running' && S.phase !== 'drive' && S.blast;   // final des portes blindées : on n'est plus dans la rame
  if (!blastOn) drawCab();
  if (blastOn) drawBlastScene();   // final du mode feu : la scène des portes blindées remplace les caméras
  else if (S.mode === 'running' && S.phase !== 'drive') { drawCCTV(); drawPops(); if (S.fire) { drawFirePanel(8, CAM_Y0 + CAM_H + 3 + (CAM_H - 44) / 2, 117); } else drawTraffic(8, CAM_Y0 + CAM_H + 3 + (CAM_H - 44) / 2, 117); }
  if (S.mode === 'running' && S.phase === 'drive') { if (S.fire) { drawFireChip(); drawRearCam(); } else { drawSchedChip(); drawLeaderPanel(); drawTrafficWarn(); } drawTopCam(); }
  if (S.alarm && Math.floor(S.t * 4) % 2) { g.fillStyle = 'rgba(255,0,0,0.12)'; g.fillRect(0, 0, W, VIEW_H); }
  drawDoorAlarm();
  if (S.mode === 'running' && S.phase === 'drive' && S.person && S.person.state === 'track' && S.person.seen) {   // danger : cadre rouge pulsé
    const pz = 0.5 + 0.5 * Math.sin(S.t * 10);
    g.strokeStyle = `rgba(255,40,30,${0.4 + 0.6 * pz})`; g.lineWidth = 2.5; g.strokeRect(1.25, 1.25, W - 2.5, VIEW_H - 2.5);
    const vg = g.createRadialGradient(W / 2, VIEW_H / 2, VIEW_H * 0.4, W / 2, VIEW_H / 2, W * 0.62);
    vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, `rgba(255,0,0,${0.3 * pz})`); g.fillStyle = vg; g.fillRect(0, 0, W, VIEW_H);
  }
  drawFx();
  if (S.mode === 'running') { drawReverse(); drawCabCam(S.cab); drawCabCam(S.malaise); drawIncidentBars(); drawRadio(); drawTheft(); drawManual(); }   // le jeu de flèches passe par-dessus tout
  if (S.mode === 'running' && S.missionShow > 0 && !S.radio) {
    g.fillStyle = 'rgba(6,8,14,0.85)'; g.fillRect(W / 2 - 110, 54, 220, 50);
    drawMissions(W / 2 - 102, 66, false);
  }
  if (!blastOn) drawHint();
  drawTuto();
  if (!S.mg) drawMsgs();   // pendant le jeu de flèches, pas de messages par-dessus
  drawUnload();
  drawBlast();
  if (S.mode === 'title') drawTitle();
  if (S.mode === 'end') drawEnd();
  if (S.mode === 'running' && S.over) drawGameOver();
  if (S.help) drawHelp();
  if (S.paused && !S.help) drawPause();
}

reset('title');
if (document.fonts) { document.fonts.load('12px VT323'); document.fonts.load('8px "Press Start 2P"'); }
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!window.__stop) { update(dt); render(); }   // __stop : banc de test, qui fait avancer le jeu lui-même
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
