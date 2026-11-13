// Dernier Métro · Caméras de quai
// ---------- Écrans de contrôle vidéo (une caméra par voiture) ----------
const CAM_W = 124, CAM_H = 80, CAM_Y0 = 4, CAM_CROP = 1.5, CAM_SPAN = 12;   // on montre 12 m de la voiture (les 2 portes)
const CCTV = [[3, CAM_Y0], [130, CAM_Y0], [257, CAM_Y0], [130, CAM_Y0 + CAM_H + 3], [257, CAM_Y0 + CAM_H + 3]];
const CAM_K = CAM_W / (CAM_SPAN * 112 / 15);   // facteur d'agrandissement de l'image caméra
function drawCCTV() {
  const flash = Math.floor(S.t * 6) % 2;
  g.fillStyle = '#0d0f14'; g.fillRect(0, 0, W, VIEW_H);
  g.fillStyle = '#1b1e26'; g.fillRect(2, CAM_Y0 - 2, W - 4, 2 * CAM_H + 7);
  CCTV.forEach(([SX, SY], car) => {
    // dessin dans le repère de la caméra (112 px = 15 m), puis agrandi et recadré à l'écran
    const sx = 0, sy = 0, ppm = 112 / 15, w = CAM_SPAN * ppm, h = CAM_H / CAM_K, z0 = car * 15, vpm = 9;
    const X = z => (z - z0 - CAM_CROP) * ppm;
    g.save(); g.beginPath(); g.rect(SX, SY, CAM_W, CAM_H); g.clip();
    g.translate(SX, SY); g.scale(CAM_K, CAM_K); DRAW_K = CAM_K;
    // fond : voûte du tunnel au-dessus de la rame
    g.fillStyle = '#2a2b31'; g.fillRect(sx, sy, w, h);
    const ty = sy + 3, by = sy + 25;               // haut / bas de caisse
    g.fillStyle = '#e6eaee'; g.fillRect(sx, ty, w, by - ty);
    g.fillStyle = '#9aa3ad'; g.fillRect(sx, ty, w, 2);
    g.fillStyle = '#1f5fae'; g.fillRect(sx, by - 4, w, 4);
    g.fillStyle = '#2b9a6a'; g.fillRect(sx, by - 5, w, 1);
    // fenêtres entre les portes
    [z0 + 0.6, z0 + 6.5, z0 + 13.2].forEach(wz => { g.fillStyle = '#2c3440'; g.fillRect(Math.round(X(wz)), ty + 5, Math.round(1.6 * ppm), 7); });
    [z0 + 4, z0 + 11].forEach(dz => {
      const stt = doorState(dz);
      const frame = S.doors <= 0 ? '#5a6270' : stt === 2 ? (flash ? '#ff2a2a' : '#ffb0b0') : stt === 1 ? '#ffb35e' : '#3dff6a';
      const dx0 = Math.round(X(dz - 0.85)), dx1 = Math.round(X(dz + 0.85));
      g.fillStyle = frame; g.fillRect(dx0, ty + 2, dx1 - dx0, by - ty - 1);
      const lx0 = Math.round(X(dz - 0.65)), lx1 = Math.round(X(dz + 0.65));
      g.fillStyle = '#5f7f9f'; g.fillRect(lx0, ty + 3, lx1 - lx0, by - ty - 3);
      const o = carShut(car) ? 0 : S.doors * 0.62;
      if (o > 0.01) {
        const ox0 = Math.round(X(dz - o)), ox1 = Math.round(X(dz + o));
        g.fillStyle = '#f2e2a8'; g.fillRect(ox0, ty + 3, Math.max(1, ox1 - ox0), by - ty - 3);
      } else { g.fillStyle = '#3a4452'; g.fillRect(lx0 + 1, ty + 5, lx1 - lx0 - 2, 6); g.fillStyle = '#222'; g.fillRect(Math.round(X(dz)), ty + 3, 1, by - ty - 3); }
      // voiture bondée : un voyageur reste coincé devant la porte, à l'intérieur
      if (S.cars[car] >= CAR_CAP && o > 0.2) {
        const bl = S.blockers[car];
        drawPerson(X(dz + (dz % 15 === 4 ? -0.15 : 0.15)), by - 1, (by - ty - 3) / 1.75, bl);
        g.fillStyle = 'rgba(255,60,40,0.25)'; g.fillRect(Math.round(X(dz - o)), ty + 3, Math.max(1, Math.round(X(dz + o) - X(dz - o))), by - ty - 3);
      }
      // voyageurs qui attendent de descendre (derrière la porte)
      const waiting = S.mp.filter(m => m.st === 'out' && m.door === dz && m.delay > 0).length;
      for (let k = 0; k < Math.min(3, waiting); k++) {
        const hx = Math.round(X(dz - 0.35 + k * 0.35));
        g.fillStyle = 'rgba(40,30,30,0.75)'; g.fillRect(hx - 1, ty + 7, 3, 3); g.fillRect(hx - 2, ty + 10, 5, by - ty - 11);
      }
    });
    if (S.next < STATIONS.length) {   // remplissage, directement sur la voiture filmée : le niveau monte dans la caisse
      const fire = FIRE(), f = fire ? carFill(car) : carRatio(car), [va, vb] = GREEN_BAND(), st = fire ? 'low' : carState(car), Hb = by - ty, Yv = v => by - Hb * Math.min(1, v);
      const col = fire ? (f > 0.75 ? '255,140,40' : f > 0.45 ? '255,210,80' : '74,168,255') : st === 'ok' ? '61,255,106' : '74,168,255';
      g.fillStyle = `rgba(${col},0.42)`; g.fillRect(sx, Yv(f), w, by - Yv(f));
      g.fillStyle = `rgb(${col})`; g.fillRect(sx, Yv(f) - 0.4, w, 0.8);                                   // surface
      if (!fire) {
        g.fillStyle = 'rgba(61,255,106,0.9)'; for (let xx = sx; xx < sx + w; xx += 3) { g.fillRect(xx, Yv(va) - 0.25, 1.6, 0.5); g.fillRect(xx, Yv(vb) - 0.25, 1.6, 0.5); }   // zone verte
        g.fillStyle = 'rgba(255,60,40,0.95)'; g.fillRect(sx, Yv(1) - 0.3, w, 0.6);                           // 100 %
      }
    }
    // quai
    g.fillStyle = '#8a8589'; g.fillRect(sx, by, w, h - (by - sy));
    g.fillStyle = '#e8dca0'; g.fillRect(sx, by, w, 3);
    g.fillStyle = '#6f6a6e'; g.fillRect(sx, by + 5, w, 1);
    // voyageurs : du plus proche de la rame au plus proche de la caméra
    JOSTLE = S.mp.filter(m => m.st === 'walk' && m.z > z0 - 1 && m.z < z0 + 16).length > 9 ? 1 : 0;
    S.mp.filter(m => (m.st !== 'out' || m.delay <= 0) && m.z > z0 - 1 && m.z < z0 + 16)
      .sort((a, b) => a.x - b.x)
      .forEach(m => {
        const k = vpm * (1 + 0.07 * m.x);
        if ((m.st === 'door' && !m.holder && !m.fight) || m.st === 'inside') {
          // montée : il franchit le seuil, monte la marche et s'enfonce dans la voiture (dessiné dans l'encadrement de porte)
          const p = m.st === 'door' ? 0.55 * Math.max(0, Math.min(1, 1 - m.t / 0.3)) : 0.55 + 0.45 * Math.max(0, Math.min(1, 1 - m.t / 0.4));
          const o = Math.max(0.3, S.doors * 0.62), zz = m.z + (m.door - m.z) * Math.min(1, p * 2);
          g.save();
          if (p > 0.2) { g.beginPath(); g.rect(X(m.door - o), ty + 3, X(m.door + o) - X(m.door - o), by - ty + 4); g.clip(); }
          g.globalAlpha = p > 0.55 ? 1 - (p - 0.55) / 0.45 * 0.85 : 1;
          drawPerson(X(zz), by + 2 + 0.25 * 5 - p * 5, k * (1 - 0.18 * p), m, m.walk);
          g.globalAlpha = 1; g.restore();
          return;
        }
        drawPerson(X(m.z), by + 2 + m.x * 5, k, m, m.walk);
        if (m.halt) { g.fillStyle = '#ff6b5b'; g.fillRect(Math.round(X(m.z)) - 1, Math.round(by + 2 + m.x * 5 - k * m.h) - 5, 3, 3); }
      });
    JOSTLE = 0;
    // effet vidéo : lignes de balayage + vignette
    g.fillStyle = 'rgba(0,0,0,0.13)'; for (let yy = sy; yy < sy + h; yy += 2) g.fillRect(sx, yy, w, 1);
    g.fillStyle = 'rgba(120,180,255,0.05)'; g.fillRect(sx, sy, w, h);
    g.restore();
    DRAW_K = 1;
    drawCRT(SX, SY, CAM_W, CAM_H, car);
    // cadre + étiquette (coordonnées écran)
    g.strokeStyle = '#4a5166'; g.lineWidth = 1; g.strokeRect(SX - 0.5, SY - 0.5, CAM_W + 1, CAM_H + 1);
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(SX + 1, SY + 1, 40, 9);
    txt(`CAM ${car + 1} · V${car + 1}`, SX + 3, SY + 8, 9, '#e6ecf5');
    if (S.medicT > 0 && car === S.medicCar) {
      g.fillStyle = Math.floor(S.t * 3) % 2 ? '#ffffff' : '#ffd0d0'; g.fillRect(SX + CAM_W - 36, SY + CAM_H - 16, 34, 14);
      if (S.medicKind === 'bag') { g.fillStyle = '#2a3a2a'; g.fillRect(SX + CAM_W - 34, SY + CAM_H - 14, 9, 9); g.fillStyle = '#ffb35e'; g.fillRect(SX + CAM_W - 31, SY + CAM_H - 16, 3, 2); }
      else { g.fillStyle = '#d42a2a'; g.fillRect(SX + CAM_W - 33, SY + CAM_H - 12, 8, 2.5); g.fillRect(SX + CAM_W - 30.25, SY + CAM_H - 14.75, 2.5, 8); }
      txt(`${Math.ceil(S.medicT)} s`, SX + CAM_W - 4, SY + CAM_H - 5, 10, '#d42a2a', 'right');
    }
    const cf = Math.min(1, S.cars[car] / CAR_CAP);
    if (S.next < STATIONS.length) {   // gros pourcentage au centre de la voiture
      const fire = FIRE(), fv = carFill(car), st = fire ? 'low' : carState(car), cy = SY + 21;
      const col = fire ? (fv > 0.75 ? '#ffa04a' : fv > 0.45 ? '#ffd75e' : '#9fd4ff') : st === 'ok' ? '#3dff6a' : '#9fd4ff';
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(SX + CAM_W / 2 - 24, cy - 11, 48, 15);
      txt(fire ? `${S.cars[car]}` : `${Math.round(carRatio(car) * 100)} %`, SX + CAM_W / 2, cy + 1, 16, col, 'center');   // fuite : le nombre de voyageurs à bord
      if (carShut(car)) { g.fillStyle = 'rgba(160,20,20,0.92)'; g.fillRect(SX + CAM_W / 2 - 24, cy + 5, 48, 10); txt('🔒 FERMÉE', SX + CAM_W / 2, cy + 13, 10, '#ffffff', 'center'); }
      else if (st === 'ok') { g.fillStyle = 'rgba(20,90,40,0.9)'; g.fillRect(SX + CAM_W / 2 - 24, cy + 5, 48, 10); txt(`DANS LE VERT · ${car + 1}`, SX + CAM_W / 2, cy + 13, 9, '#ffffff', 'center', 'VT323', 46); }
    }
    if (S.suspects.some(x => x.car === car)) {
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(SX + 90, SY + 1, 12, 9); drawSkull(SX + 96, SY + 9, 1);
    }
    if (car === S.dirtyCar) { g.fillStyle = 'rgba(120,100,10,0.9)'; g.fillRect(SX + CAM_W - 63, SY + CAM_H - 13, 60, 10); txt(S.dirtyKeep ? 'SOUILLÉE' : `NETTOYAGE ${Math.ceil(S.cleanT)} s`, SX + CAM_W - 33, SY + CAM_H - 5, 10, '#ffffff', 'center'); }
    else if (cf >= 1) { g.fillStyle = 'rgba(160,20,20,0.85)'; g.fillRect(SX + CAM_W - 47, SY + CAM_H - 13, 44, 10); txt('COMPLET', SX + CAM_W - 25, SY + CAM_H - 5, 10, '#ffffff', 'center'); }
    if ((S.phase === 'dwell' || S.phase === 'alert') && S.next < STATIONS.length && S.doors > 0.5) {
      // la touche à utiliser, dessinée comme une touche de clavier : elle clignote quand c'est le moment de s'en servir
      const shut = carShut(car), stuck = !FIRE() && S.cars[car] >= CAR_CAP && !shut && S.mp.some(m => m.st === 'walk' && m.halt && carOf(m.door) === car);
      const call = stuck || (!FIRE() && !shut && carState(car) === 'ok') || (FIRE() && !shut && car === heavyCar() && imbalance() > 0.12), on = call && Math.floor(S.t * 4) % 2;
      // étiquette réservée aux voitures vraiment trop chargées
      if (FIRE() && !shut && carMean() >= 12 && S.cars[car] > carMean() * 1.35) { g.fillStyle = Math.floor(S.t * 3) % 2 ? 'rgba(170,20,10,0.92)' : 'rgba(110,10,6,0.92)'; g.fillRect(SX + CAM_W - 63, SY + CAM_H - 13, 60, 10); txt('SURCHARGÉE', SX + CAM_W - 33, SY + CAM_H - 5, 10, '#ffffff', 'center'); }
      const kx = SX + 4, ky = SY + CAM_H - 16;
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(kx - 1, ky - 1, 58, 14);
      g.fillStyle = on ? '#ffd75e' : '#e6e8ec'; g.fillRect(kx, ky, 12, 12);                  // touche
      g.fillStyle = on ? '#b08a20' : '#9aa0aa'; g.fillRect(kx, ky + 10, 12, 2);
      txt(String(car + 1), kx + 6, ky + 9, 11, '#111', 'center');
      txt(shut ? 'ROUVRIR' : 'FERMER', kx + 15, ky + 9, 10, shut ? '#9fe0ff' : on ? '#ffd75e' : '#e6ecf5');
    }
    if (S.doors > 0 && S.alerted) for (const dz of [z0 + 4, z0 + 11]) {   // après la sonnerie seulement
      if (doorState(dz) !== 2) continue;
      const cx = SX + (dz - z0 - CAM_CROP) * (112 / 15) * CAM_K, hw = 0.95 * (112 / 15) * CAM_K;
      g.strokeStyle = flash ? '#ff2a2a' : '#ffd0c8'; g.lineWidth = 2.5;
      g.strokeRect(cx - hw, SY + 12, hw * 2, CAM_H - 16);
      g.fillStyle = flash ? 'rgba(200,20,20,0.92)' : 'rgba(120,10,10,0.92)'; g.fillRect(cx - 21, SY + 12, 42, 10);
      txt('OCCUPÉE', cx, SY + 20, 10, '#ffffff', 'center');
    }
    const worst = Math.max(doorState(z0 + 4), doorState(z0 + 11));
    g.fillStyle = S.doors <= 0 ? '#5a6270' : worst === 2 ? (flash ? '#ff2a2a' : '#7a1010') : worst === 1 ? '#ffb35e' : '#3dff6a';
    g.beginPath(); g.arc(SX + CAM_W - 6, SY + 6, 3, 0, 7); g.fill();
  });
  if (S.load >= CAP && flash) { g.fillStyle = 'rgba(255,40,40,0.18)'; g.fillRect(2, CAM_Y0 - 2, W - 4, 2 * CAM_H + 7); }
}

// 0 = libre, 1 = voyageur qui approche, 2 = voyageur dans la porte
function doorState(dz) {
  let s = 0;
  for (const m of S.mp) {
    if (m.delay > 0 || m.door !== dz) continue;
    if (m.st === 'door' || (m.st === 'out' && m.delay <= 0)) return 2;
    if (m.st === 'out') s = Math.max(s, 1);
    if (m.st === 'walk' && Math.hypot(m.z - dz, m.x) < 3.5) s = 1;
  }
  return s;
}
