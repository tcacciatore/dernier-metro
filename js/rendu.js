// Dernier Métro · Rendu 3D du tunnel et des stations, voyageurs, publicités
// ---------- Rendu 3D (pseudo-perspective par tranches) ----------
const F = 130, CX = 192, NEAR = 0.8, DMAX = 170, STEP = 2;
let CY = 72;
let XOFF = 0;   // décalage latéral de la vue (la rame qui s'engage sur la branche déviée)
const P = (x, y, d) => [CX + (x + XOFF + curvAt(d)) * F / d, CY - y * F / d];
// ombrage : 24 paliers (au lieu de 8) et brume colorée au loin plutôt qu'un noir pur
let FOG = [6, 7, 12];
function sh(c, f) {
  f = Math.max(0, Math.min(1, Math.round(f * 24) / 24));
  const k = 1 - f;
  return `rgb(${c[0] * f + FOG[0] * k | 0},${c[1] * f + FOG[1] * k | 0},${c[2] * f + FOG[2] * k | 0})`;
}
function poly(pts, col, proj = P) {
  g.fillStyle = col; g.beginPath();
  pts.forEach((pt, i) => { const [sx, sy] = proj(pt[0], pt[1], pt[2]); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
  g.closePath(); g.fill();
  // bouche les fines coutures d'anticrénelage entre faces jointives (couleurs opaques uniquement)
  if (!col.startsWith('rgba')) { g.strokeStyle = col; g.lineWidth = 1 / RES; g.stroke(); }
}
// halo lumineux additif
function glow(x, y, r, rgb, a) {
  if (r < 0.5) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  const op = g.globalCompositeOperation;
  g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.globalCompositeOperation = op;
}
const stationAt = p => STATIONS.find(s => p >= s.pos - PL && p <= s.pos + PE) || null;

// pseudo-aléatoire stable (texture qui ne « grouille » pas d'une image à l'autre)
const hsh = (a, b = 0) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
// voie de la ligne 1 (roulement sur pneus) : traverses, rails de sécurité, pistes de roulement, barres de guidage
function track(p0, d0, d1, f, yf) {
  const near = d0 < 70;
  // traverses (tous les ~0,67 m de près)
  const nSl = near ? 3 : 1;
  for (let k = 0; k < nSl; k++) {
    const z = p0 + k * STEP / nSl, dz = z - S.pos;
    if (dz < NEAR) continue;
    poly([[-1.25, yf + 0.04, dz + 0.24], [1.25, yf + 0.04, dz + 0.24], [1.25, yf + 0.04, dz], [-1.25, yf + 0.04, dz]], sh(C.sleeper, f * (0.9 + 0.2 * hsh(z))));
  }
  // rails de sécurité (acier)
  for (const rx of [-0.72, 0.72]) {
    poly([[rx - 0.07, yf + 0.05, d1], [rx + 0.07, yf + 0.05, d1], [rx + 0.07, yf + 0.05, d0], [rx - 0.07, yf + 0.05, d0]], sh([40, 36, 34], f));
    poly([[rx - 0.04, yf + 0.12, d1], [rx + 0.04, yf + 0.12, d1], [rx + 0.04, yf + 0.12, d0], [rx - 0.04, yf + 0.12, d0]], sh(C.rail, Math.max(f, 0.3)));
    if (near) poly([[rx - 0.012, yf + 0.121, d1], [rx + 0.012, yf + 0.121, d1], [rx + 0.012, yf + 0.121, d0], [rx - 0.012, yf + 0.121, d0]], sh([235, 240, 255], Math.max(f, 0.35)));
  }
  // pistes de roulement des pneus : poutre plate, bande d'usure brillante au centre
  for (const s of [-1, 1]) {
    const x0 = s * 0.74, x1 = s * 1.04;
    face([x0, yf + 0.04], [x0, yf + 0.2], d0, d1, sh([46, 46, 52], f));
    poly([[x0, yf + 0.2, d1], [x1, yf + 0.2, d1], [x1, yf + 0.2, d0], [x0, yf + 0.2, d0]], sh([118, 118, 128], f));
    if (near) poly([[s * 0.82, yf + 0.201, d1], [s * 0.96, yf + 0.201, d1], [s * 0.96, yf + 0.201, d0], [s * 0.82, yf + 0.201, d0]], sh([200, 204, 214], Math.max(f, 0.3)));
    // barre de guidage latérale (alimentation 750 V) sur isolateurs
    face([s * 1.42, yf + 0.42], [s * 1.42, yf + 0.6], d0, d1, sh([92, 92, 100], f));
    poly([[s * 1.42, yf + 0.6, d1], [s * 1.5, yf + 0.6, d1], [s * 1.5, yf + 0.6, d0], [s * 1.42, yf + 0.6, d0]], sh([150, 150, 160], f));
    if (near && d0 > NEAR) poly([[s * 1.47, yf + 0.04, d0 + 0.12], [s * 1.47, yf + 0.42, d0 + 0.12], [s * 1.47, yf + 0.42, d0], [s * 1.47, yf + 0.04, d0]], sh([214, 206, 180], f));
  }
}

let BZ = null;
function brakeZone(p0, d0, f, yf) {
  if (!BZ) return;
  const p1 = p0 + STEP, a = Math.max(p0, BZ.from), b = Math.min(p1, BZ.to);
  if (a >= b) return;
  const da = Math.max(a - S.pos, NEAR), db = b - S.pos + 0.12;
  if (db <= da) return;
  poly([[-1.15, yf + 0.02, db], [1.15, yf + 0.02, db], [1.15, yf + 0.02, da], [-1.15, yf + 0.02, da]], sh(BZ.col, Math.max(f, 0.5)));
  if (BZ.from >= p0 && BZ.from < p1 && BZ.from - S.pos > NEAR) {
    const d = BZ.from - S.pos;
    poly([[-1.6, yf + 0.03, d + 0.5], [1.6, yf + 0.03, d + 0.5], [1.6, yf + 0.03, d], [-1.6, yf + 0.03, d]], '#ffe14a');
  }
}
// profils (x, y) : tunnel voûté (piédroits + voûte en anse de panier) et station à voûte elliptique
const T_PROF = [[-2.3, -2], [-2.3, -0.9], [-2.3, 0.4]];
for (let i = 1; i < 10; i++) { const a = Math.PI - i * Math.PI / 10; T_PROF.push([2.3 * Math.cos(a), 0.4 + 1.7 * Math.sin(a)]); }
T_PROF.push([2.3, 0.4], [2.3, -0.9], [2.3, -2]);
// ombrage par face : piédroits bien éclairés par les phares, voûte qui s'assombrit vers la clé
const T_SHADE = T_PROF.slice(1).map((b, i) => {
  const a = T_PROF[i], ym = (a[1] + b[1]) / 2;
  return ym < 0.4 ? (ym < -0.9 ? 1 : 0.94) : 0.9 - 0.32 * Math.min(1, (ym - 0.4) / 1.7);
});
const ST_VAULT = [];
for (let i = 0; i <= 8; i++) { const a = Math.PI - i * Math.PI / 8; ST_VAULT.push([1.95 + 4.55 * Math.cos(a), 1.2 + 2.8 * Math.sin(a)]); }
const ST_PROF = [[-2.6, -2], ...ST_VAULT, [6.5, -0.95], [1.6, -0.95], [1.6, -2]];
const T_LEN = profLen(T_PROF), SV_LEN = profLen(ST_VAULT);   // longueurs cumulées, pour raccorder les textures
function face(a, b, d0, d1, col) { poly([[a[0], a[1], d1], [b[0], b[1], d1], [b[0], b[1], d0], [a[0], a[1], d0]], col); }

// couleur éclairée avec teinte chaude des lampes du tunnel
const WARM = [255, 186, 104];
function tl(c, f, w) {
  f = Math.max(0, Math.min(1, Math.round(f * 32) / 32)); w = Math.round(w * 32) / 32;
  const k = 1 - f;
  return `rgb(${Math.min(255, c[0] * f + FOG[0] * k + WARM[0] * w * 0.32) | 0},${Math.min(255, c[1] * f + FOG[1] * k + WARM[1] * w * 0.32) | 0},${Math.min(255, c[2] * f + FOG[2] * k + WARM[2] * w * 0.32) | 0})`;
}
// lumière reçue par une tranche : ambiance + phares (décroissance en 1/d²) ; flaque chaude près des lampes
function tunnelLight(pm, d) {
  const head = 0.92 / (1 + (d / 24) * (d / 24));
  const lp = Math.round(pm / 24) * 24, pool = Math.max(0, 1 - Math.abs(pm - lp) / 9);
  return { f: Math.min(1, 0.07 + head + pool * 0.28 * Math.max(0.3, 1 - d / 160)), w: pool * pool * Math.max(0.2, 1 - d / 140) };
}

function tunnelSlice(p0, d0, d1) {
  const sw = S.sw;
  if (sw && sw.kind === 'fork' && p0 < zBof(sw) && p0 + STEP > sw.pos - chLead(sw)) return chamberSlice(sw, p0, d0, d1);
  const gh = swGhost(); if (gh && p0 < zBof(gh) && p0 + STEP > gh.pos - chLead(gh)) return chamberSlice(gh, p0, d0, d1);
  const yf = -2, full = p0 - S.pos >= NEAR;
  const { f, w } = tunnelLight(p0 + 1, d0);
  const detail = d0 < 55;
  // béton : léger marbrage par anneau et par face
  for (let i = 0; i < T_PROF.length - 1; i++) {
    const n = detail ? 0.93 + 0.1 * hsh(p0, i) : 0.97;
    face(T_PROF[i], T_PROF[i + 1], d0, d1, tl(C.tWall, f * T_SHADE[i] * n, w * T_SHADE[i]));
    if (d0 < 30) texFace(T_PROF[i], T_PROF[i + 1], d0, d1, 'concrete', Math.min(1, (30 - d0) / 12) * Math.min(1, f * T_SHADE[i] * 1.5), T_LEN[i], p0);   // béton (proche seulement)
  }
  // joints entre anneaux de voussoirs (tous les 2 m) et joints longitudinaux
  if (full && detail) {
    for (let i = 0; i < T_PROF.length - 1; i++) face(T_PROF[i], T_PROF[i + 1], d0, d0 + 0.06, tl(C.tWall, f * T_SHADE[i] * 0.62, w * 0.5));
    for (const i of [2, 5, 8, 11]) { const a = T_PROF[i]; face(a, [a[0] * 0.995, a[1] - 0.04], d0, d1, tl(C.tWall, f * 0.6, w * 0.4)); }
  }
  // coulures d'humidité / suie
  if (full && d0 < 80 && hsh(p0, 7) > 0.55) {
    const side = hsh(p0, 8) > 0.5 ? 2.29 : -2.29, z0 = d0 + hsh(p0, 9) * 1.4, wz = 0.25 + hsh(p0, 10) * 0.5, top = 0.2 + hsh(p0, 11) * 1.1;
    poly([[side, -1.4, z0 + wz * 0.6], [side, top, z0 + wz], [side, top, z0], [side, -1.4, z0 + wz * 0.3]], `rgba(10,12,8,${(0.28 * f).toFixed(3)})`);
  }
  // radier : ballast/béton avec gravillons
  poly([[-2.3, yf, d1], [2.3, yf, d1], [2.3, yf, d0], [-2.3, yf, d0]], tl(C.ballast, f * 0.92, w * 0.6));
  if (detail) texFace([-2.3, yf], [2.3, yf], d0, d1, 'ballast', texFade(d0) * Math.min(1, f * 1.5), 0, p0);
  if (full && d0 < 32) for (let k = 0; k < 10; k++) {
    const x = -2.1 + hsh(p0, 20 + k) * 4.2, z = d0 + hsh(p0, 40 + k) * 1.9, s = 0.04 + hsh(p0, 60 + k) * 0.06;
    poly([[x, yf + 0.003, z + s], [x + s, yf + 0.003, z + s], [x + s, yf + 0.003, z], [x, yf + 0.003, z]], tl(hsh(p0, 80 + k) > 0.5 ? [120, 110, 100] : [28, 24, 22], f, w * 0.4));
  }
  // caniveau central
  poly([[-0.12, yf + 0.002, d1], [0.12, yf + 0.002, d1], [0.12, yf + 0.002, d0], [-0.12, yf + 0.002, d0]], tl([22, 22, 26], f, 0));
  // faisceau des phares sur la voie
  if (d0 < 34) poly([[-1.4, yf + 0.25, d1], [1.4, yf + 0.25, d1], [1.4, yf + 0.25, d0], [-1.4, yf + 0.25, d0]], `rgba(255,236,190,${(0.12 * (1 - d0 / 34)).toFixed(3)})`);
  brakeZone(p0, d0, f, yf);
  track(p0, d0, d1, f, yf);
  // chemins de câbles sur le piédroit droit, avec mou entre les consoles (tous les 6 m)
  const sag = p => 0.07 * Math.sin(Math.PI * (((p % 6) + 6) % 6) / 6);
  [[0.15, '#1d1a14'], [0.32, '#121216'], [0.5, '#2a1414'], [0.68, '#121216']].forEach(([cy, col]) => {
    const y0 = cy - sag(p0), y1 = cy - sag(p0 + STEP);
    poly([[2.28, y1, d1], [2.28, y1 + 0.06, d1], [2.28, y0 + 0.06, d0], [2.28, y0, d0]], col);
  });
  if (full && ((p0 % 6) + 6) % 6 === 0) poly([[2.27, 0.05, d0 + 0.08], [2.27, 0.8, d0 + 0.08], [2.27, 0.8, d0], [2.27, 0.05, d0]], tl([60, 60, 66], f, w));
  // piste de service côté gauche, avec bordure
  poly([[-2.3, -1.75, d1], [-1.7, -1.75, d1], [-1.7, -1.75, d0], [-2.3, -1.75, d0]], tl([74, 70, 74], f, w));
  face([-1.7, -1.75], [-1.7, yf], d0, d1, tl([48, 46, 50], f, w * 0.5));
  if (detail) poly([[-1.76, -1.749, d1], [-1.7, -1.749, d1], [-1.7, -1.749, d0], [-1.76, -1.749, d0]], tl([200, 180, 60], f, 0));
  if (!full) return;
  const m = ((p0 % 24) + 24) % 24;
  if (m === 0) {   // lampe de tunnel (hublot grillagé)
    poly([[-2.29, 0.45, d0 + 0.7], [-2.29, 0.8, d0 + 0.7], [-2.29, 0.8, d0], [-2.29, 0.45, d0]], '#3a3226');
    poly([[-2.28, 0.5, d0 + 0.62], [-2.28, 0.75, d0 + 0.62], [-2.28, 0.75, d0 + 0.08], [-2.28, 0.5, d0 + 0.08]], '#ffe0a0');
    if (d0 < 40) for (const zz of [0.25, 0.45]) poly([[-2.275, 0.5, d0 + zz + 0.03], [-2.275, 0.75, d0 + zz + 0.03], [-2.275, 0.75, d0 + zz], [-2.275, 0.5, d0 + zz]], '#6a5a40');
    const [lx, ly] = P(-2.25, 0.62, d0 + 0.35), rad = Math.min(52, 2 * F / (d0 + 0.35));
    glow(lx, ly, rad, '255,200,110', 0.42);
    glow(lx, ly, rad * 0.22, '255,240,200', 0.65);
  }
  if (m === 12) { // petit feu de repère vert + plaque kilométrique
    poly([[2.28, -0.3, d0 + 0.2], [2.28, -0.1, d0 + 0.2], [2.28, -0.1, d0], [2.28, -0.3, d0]], '#2bff6a');
    if (d0 < 70) { const [gx, gy] = P(2.27, -0.2, d0 + 0.1); glow(gx, gy, Math.min(14, 0.6 * F / d0), '60,255,120', 0.35); }
    poly([[-2.29, -0.6, d0 + 0.5], [-2.29, -0.2, d0 + 0.5], [-2.29, -0.2, d0], [-2.29, -0.6, d0]], sh([230, 230, 230], Math.max(f, 0.25)));
    if (d0 < 30) poly([[-2.285, -0.52, d0 + 0.4], [-2.285, -0.28, d0 + 0.4], [-2.285, -0.28, d0 + 0.1], [-2.285, -0.52, d0 + 0.1]], sh([30, 30, 30], Math.max(f, 0.25)));
  }
  if (m === 6) poly([[2.28, 1.3, d0 + 0.25], [2.28, 1.55, d0 + 0.25], [2.28, 1.55, d0], [2.28, 1.3, d0]], '#3a7bff');
  // niche de refuge (alternée gauche/droite tous les 50 m environ)
  const r50 = ((p0 % 48) + 48) % 48;
  if (r50 === 18 || r50 === 42) {
    const sd = r50 === 18 ? -2.3 : 2.3, s1 = sd < 0 ? -2.29 : 2.29;
    poly([[s1, -1.75, d0 + 1.4], [s1, 0.1, d0 + 1.4], [s1, 0.1, d0], [s1, -1.75, d0]], tl([14, 13, 16], f, 0));
    poly([[s1, 0.1, d0 + 1.4], [s1, 0.22, d0 + 1.4], [s1, 0.22, d0], [s1, 0.1, d0]], tl([120, 112, 116], f, w));
    // panneau vert « issue de secours » éclairé + boîte d'appel orange
    poly([[s1 * 0.998, 0.35, d0 + 1.1], [s1 * 0.998, 0.6, d0 + 1.1], [s1 * 0.998, 0.6, d0 + 0.3], [s1 * 0.998, 0.35, d0 + 0.3]], '#19b85a');
    if (d0 < 45) poly([[s1 * 0.997, 0.4, d0 + 0.85], [s1 * 0.997, 0.55, d0 + 0.85], [s1 * 0.997, 0.55, d0 + 0.7], [s1 * 0.997, 0.4, d0 + 0.7]], '#eaffea');
    const [ex, ey] = P(s1, 0.47, d0 + 0.7); glow(ex, ey, Math.min(26, 1.1 * F / (d0 + 0.7)), '40,220,110', 0.3);
    poly([[s1 * 0.998, -0.7, d0 + 1.9], [s1 * 0.998, -0.25, d0 + 1.9], [s1 * 0.998, -0.25, d0 + 1.55], [s1 * 0.998, -0.7, d0 + 1.55]], sh([230, 110, 30], Math.max(f, 0.3)));
  }
}

function stationSlice(s, p0, d0, d1, f) {
  const xl = -2.6, xe = 1.6, xb = 6.5, yf = -2, yp = -0.95;
  const tile = (Math.floor(p0 / 2) % 2) ? 1 : 0.95;
  const full = p0 - S.pos >= NEAR;
  // voûte carrelée (carreaux blancs biseautés du métro parisien)
  for (let i = 0; i < 8; i++) {
    const a = ST_VAULT[i], b = ST_VAULT[i + 1], mid = Math.PI - (i + 0.5) * Math.PI / 8;
    face(a, b, d0, d1, sh(C.stTile, f * tile * (0.8 + 0.2 * Math.sin(mid))));
    texFace(a, b, d0, d1, 'tiles', texFade(d0) * Math.min(1, f * 1.3), SV_LEN[i], p0);   // carrelage biseauté
    if (d0 < 45) {
      const L = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      face(a, L(0.06), d0, d1, sh([248, 244, 228], f * tile));                       // biseau éclairé
      face(L(0.47), L(0.5), d0, d1, sh(C.stTile, f * 0.72));                         // joint de rangée
      face(L(0.5), L(0.55), d0, d1, sh([248, 244, 228], f * tile * 0.97));          // biseau de la rangée suivante
      face(L(0.96), b, d0, d1, sh(C.stTile, f * 0.7));                               // biseau à l'ombre
    }
    if (d0 < 28 && full) for (let q = 0; q < 4; q++) face(a, b, d0 + q * 0.5, d0 + q * 0.5 + 0.035, sh(C.stTile, f * 0.74));   // joints d'anneaux
  }
  face([xl, yf], [xl, 1.2], d0, d1, sh(C.stTile, f * tile * 0.9));
  texFace([xl, yf], [xl, 1.2], d0, d1, 'tiles', texFade(d0) * Math.min(1, f * 1.3), 0, p0);
  poly([[xl, yf, d1], [xe, yf, d1], [xe, yf, d0], [xl, yf, d0]], sh(C.ballast, f * 0.9));
  texFace([xl, yf], [xe, yf], d0, d1, 'ballast', texFade(d0) * Math.min(1, f * 1.5), 0, p0);
  brakeZone(p0, d0, f, yf);
  track(p0, d0, d1, f, yf);
  face([xe, yf], [xe, yp], d0, d1, sh(C.face, f));
  // quai : dallage alterné, bande podotactile, bordure
  poly([[xe, yp, d1], [xb, yp, d1], [xb, yp, d0], [xe, yp, d0]], sh(C.plat, f * tile));
  texFace([xe, yp], [xb, yp], d0, d1, 'platform', texFade(d0) * Math.min(1, f * 1.3), 0, p0);   // dallage
  poly([[xe + 0.5, yp, d1], [xe + 0.62, yp, d1], [xe + 0.62, yp, d0], [xe + 0.5, yp, d0]], sh([95, 92, 96], f));
  const inBZ = BZ && p0 + STEP > BZ.from && p0 < BZ.to;
  poly([[xe, yp, d1], [xe + 0.35, yp, d1], [xe + 0.35, yp, d0], [xe, yp, d0]], inBZ ? sh(BZ.col, 1) : sh(C.edge, f));
  face([xb, 1.2], [xb, yp], d0, d1, sh(C.stTile, f * tile));
  texFace([xb, 1.2], [xb, yp], d0, d1, 'tiles', texFade(d0) * Math.min(1, f * 1.3), 0, p0);
  face([xb, yp + 0.18], [xb, yp], d0, d1, sh([60, 70, 90], f));          // plinthe
  face([xl, yf + 0.0], [xl, -1.7], d0, d1, sh([60, 70, 90], f));          // plinthe côté voie
  if (d0 < 60) for (const yy of [-1.2, -0.6, 0, 0.6]) face([xl, yy], [xl, yy + 0.03], d0, d1, sh(C.stTile, f * 0.8));
  if (d0 < 60) for (const yy of [-0.3, 0.3, 0.9]) face([xb, yy + 0.03], [xb, yy], d0, d1, sh(C.stTile, f * 0.8));
  poly([[xb - 0.45, yp + 0.001, d1], [xb, yp + 0.001, d1], [xb, yp + 0.001, d0], [xb - 0.45, yp + 0.001, d0]], 'rgba(0,0,0,0.16)');   // ombre au pied du mur
  poly([[xb - 0.18, yp + 0.002, d1], [xb, yp + 0.002, d1], [xb, yp + 0.002, d0], [xb - 0.18, yp + 0.002, d0]], 'rgba(0,0,0,0.14)');
  face([xe, yp - 0.02], [xe, yp - 0.3], d0, d1, 'rgba(0,0,0,0.3)');                                                                    // ombre sous le nez de quai
  poly([[xl, yf + 0.001, d1], [xl + 0.5, yf + 0.001, d1], [xl + 0.5, yf + 0.001, d0], [xl, yf + 0.001, d0]], 'rgba(0,0,0,0.25)');
  if (!full) return;
  const rel = p0 - s.pos;
  if (d0 < 50) poly([[xe + 0.62, yp + 0.001, d0 + 0.05], [xb, yp + 0.001, d0 + 0.05], [xb, yp + 0.001, d0], [xe + 0.62, yp + 0.001, d0]], sh([90, 86, 92], f));   // joints du dallage
  if (((p0 % 4) + 4) % 4 === 0) poly([[2.6, yp + 0.002, d0 + 1.6], [4.4, yp + 0.002, d0 + 1.6], [4.4, yp + 0.002, d0 - 0.2], [2.6, yp + 0.002, d0 - 0.2]], 'rgba(255,250,230,0.10)'); // reflets des lampes
  // rampes lumineuses sous la voûte
  if (((p0 % 4) + 4) % 4 === 0) {
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    face(lerp(ST_VAULT[5], ST_VAULT[6], 0.3), lerp(ST_VAULT[5], ST_VAULT[6], 0.6), d0, d0 + 1.2, '#fffbe8');
    face(lerp(ST_VAULT[2], ST_VAULT[3], 0.4), lerp(ST_VAULT[2], ST_VAULT[3], 0.7), d0, d0 + 1.2, '#fff6d8');
    if (d0 < 90) {   // halos des rampes
      const r = Math.min(36, 1.4 * F / (d0 + 0.6)), a = 0.22 * f;
      for (const [v0, v1, t] of [[5, 6, 0.45], [2, 3, 0.55]]) {
        const [vx, vy] = lerp(ST_VAULT[v0], ST_VAULT[v1], t), [sx, sy] = P(vx, vy, d0 + 0.6);
        glow(sx, sy, r, '255,246,215', a);
      }
    }
  }
  if (rel === -PL) {
    poly([[xe, yf, d0], [xb, yf, d0], [xb, yp, d0], [xe, yp, d0]], sh(C.face, f * 0.85));
    poly([[xl, yf, d0], [-2.3, yf, d0], [-2.3, 1.5, d0], [xl, 1.2, d0]], sh(C.endWall, f));
  }
  const si = STATIONS.indexOf(s);
  // affiches côté quai (cadre + visuel)
  [-70, -62, -48, -40, -14, -6].forEach((off, i) => {
    if (rel === off) {
      poly([[xb - 0.01, -0.5, d0 + 4.1], [xb - 0.01, 1.18, d0 + 4.1], [xb - 0.01, 1.18, d0 - 0.1], [xb - 0.01, -0.5, d0 - 0.1]], sh([196, 146, 72], f));
      drawPoster(xb, -1, -0.38, 1.08, d0 + 0.15, d0 + 3.85, si * 7 + i, f);
    }
  });
  // plan de la ligne sur le mur du quai
  if (rel === -28) {
    const W0 = (y0, y1, z0, z1, col, e = 0.02) => poly([[xb - e, y0, z1], [xb - e, y1, z1], [xb - e, y1, z0], [xb - e, y0, z0]], col);
    W0(-0.2, 0.95, d0, d0 + 2.6, sh([30, 40, 70], f), 0.01);
    W0(-0.12, 0.87, d0 + 0.08, d0 + 2.52, sh([244, 242, 236], f));
    W0(0.55, 0.85, d0 + 0.08, d0 + 2.52, sh([29, 60, 143], f), 0.025);
    W0(0.22, 0.27, d0 + 0.25, d0 + 2.35, sh(lineRGB(), f), 0.03);
    const nS = STATIONS.length;
    for (let q = 0; q < nS; q++) { const z = d0 + 0.3 + q * 2.0 / nS; W0(0.19, 0.3, z, z + 0.07, sh(q === si ? [220, 40, 40] : [255, 255, 255], f), 0.035); }
  }
  // grandes affiches côté voie
  [-74, -62, -50, -38, -26, -14, -2].forEach((off, i) => {
    if (rel === off) {
      poly([[xl + 0.01, -0.45, d0 + 4.1], [xl + 0.01, 1.18, d0 + 4.1], [xl + 0.01, 1.18, d0 - 0.1], [xl + 0.01, -0.45, d0 - 0.1]], sh([196, 146, 72], f));
      drawPoster(xl, 1, -0.33, 1.08, d0 + 0.15, d0 + 3.85, si * 5 + i + 3, f);
    }
  });
  // plaques émaillées nom de station
  [-24, -54].forEach(off => {
    if (rel === off) {
      poly([[xb - 0.03, 1.25, d0 + 4.1], [xb - 0.03, 1.85, d0 + 4.1], [xb - 0.03, 1.85, d0 - 0.1], [xb - 0.03, 1.25, d0 - 0.1]], '#f4f1e8');
      poly([[xb - 0.04, 1.3, d0 + 4], [xb - 0.04, 1.8, d0 + 4], [xb - 0.04, 1.8, d0], [xb - 0.04, 1.3, d0]], '#1d3c8f');
      const [ax, ay] = P(xb, 1.55, d0 + 2), [x0] = P(xb, 0, d0), [x1] = P(xb, 0, d0 + 4);
      const hpx = 0.5 * F / (d0 + 2), w = Math.abs(x0 - x1);
      if (w > 20 && hpx > 3) {
        g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `bold ${Math.max(6, Math.min(24, Math.round(hpx * 1.05)))}px "Helvetica Neue", Arial, sans-serif`;
        g.fillText(s.name, ax, ay + 1, w - 2);
        g.textBaseline = 'alphabetic';
      }
    }
  });
}

// ---------- Voyageurs : silhouette, tenues, accessoires, animation, éclairage ----------
// éclairage appliqué aux voyageurs (réglé par l'appelant : brume en 3D, neutre sur les caméras)
let PL_F = 1, PL_FOG = [0, 0, 0], JOSTLE = 0, DRAW_K = 1;   // DRAW_K : agrandissement appliqué par l'appelant (caméras)
const RGBC = {};
function rgbOf(c) {
  let r = RGBC[c];
  if (!r) { r = c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : (c.match(/\d+/g) || [128, 128, 128]).slice(0, 3).map(Number); RGBC[c] = r; }
  return r;
}
// couleur éclairée : m < 1 = face à l'ombre, m > 1 = rehaut
function pc(c, m = 1) {
  const r = rgbOf(c), f = PL_F, k = 1 - f;
  return `rgb(${Math.min(255, r[0] * m) * f + PL_FOG[0] * k | 0},${Math.min(255, r[1] * m) * f + PL_FOG[1] * k | 0},${Math.min(255, r[2] * m) * f + PL_FOG[2] * k | 0})`;
}
function quad(a, b, c, d, col) { g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); }
function circ(x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, 7); g.fill(); }
function seg(x0, y0, x1, y1, w, col) { g.strokeStyle = col; g.lineWidth = Math.max(1 / RES, w); g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.lineCap = 'butt'; }
// membre en deux segments (épaule→coude→main) avec épaisseur
function limb(x0, y0, x1, y1, x2, y2, w, col) {
  g.strokeStyle = col; g.lineWidth = Math.max(1 / RES, w); g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter';
}

// affiche publicitaire composée : fond, visuel avec horizon et disque, bandeau de texte, logo
// publicités fictives : fond, illustration, titre, accroche, logo
const ADS = [
  { bg: ['#2b1b4a', '#5b2a86'], title: 'PARIS JAZZ', sub: 'Festival · 12–20 juin', col: '#ffd75e', art: 'sax' },
  { bg: ['#4a2a16', '#8a5530'], title: 'Café Lumière', sub: 'Le réveil des Parisiens', col: '#fff3dc', art: 'cup' },
  { bg: ['#0f3d2e', '#1f6b50'], title: 'MUSÉE DU RAIL', sub: 'Exposition « Vapeur »', col: '#e8f5e0', art: 'loco' },
  { bg: ['#0e3a6e', '#2e86c1'], title: 'ZÉPHYR', sub: 'Le vélo électrique qui file', col: '#ffffff', art: 'bike' },
  { bg: ['#6a0d18', '#c0392b'], title: 'CARMEN', sub: 'Opéra Moderne · jusqu\'au 30 juin', col: '#ffe8c0', art: 'rose' },
  { bg: ['#d9a514', '#ffd75e'], title: 'Croissants Dupont', sub: 'Croustillants depuis 1952', col: '#3a2410', art: 'croissant' },
  { bg: ['#0d5c63', '#16a085'], title: 'Sérénité', sub: 'L\'assurance qui vous suit', col: '#ffffff', art: 'umbrella' },
  { bg: ['#101014', '#2a2a36'], title: 'NUIT BLANCHE', sub: 'Au cinéma le 4 juillet', col: '#ffcf3a', art: 'moon' },
  { bg: ['#f2efe6', '#ffffff'], title: 'Vélos & Co', sub: 'Location à la journée', col: '#1d3c8f', art: 'bike' },
  { bg: ['#1a1a1a', '#3a3a3a'], title: 'Parfum ÉCLAT', sub: 'L\'élégance à la parisienne', col: '#e8d5a0', art: 'bottle' },
];
function adArt(c, art, x, y, s, col) {          // illustration simple, en coordonnées d'affiche
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  const st = (c, w) => { c.strokeStyle = c; c.lineWidth = w; };
  if (art === 'sax') { st(col, 7); c.beginPath(); c.moveTo(10, -30); c.lineTo(10, 15); c.quadraticCurveTo(10, 32, -6, 30); c.quadraticCurveTo(-18, 28, -16, 14); c.stroke(); c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(10, -20 + i * 9, 2.2, 0, 7); c.fill(); } }
  else if (art === 'cup') { c.fillStyle = '#fff'; c.fillRect(-16, -6, 26, 26); st('#fff', 4); c.beginPath(); c.arc(13, 6, 7, -1.5, 1.5); c.stroke(); st('rgba(255,255,255,0.6)', 2.5); for (const dx of [-10, -2, 6]) { c.beginPath(); c.moveTo(dx, -10); c.quadraticCurveTo(dx + 5, -18, dx, -26); c.stroke(); } c.fillStyle = '#6b4226'; c.fillRect(-14, -4, 22, 5); }
  else if (art === 'loco') { c.fillStyle = '#1a1a1a'; c.fillRect(-26, -8, 40, 22); c.fillRect(4, -22, 12, 16); c.fillRect(-20, -18, 6, 10); c.fillStyle = '#c0392b'; c.fillRect(-26, 10, 44, 4); c.fillStyle = '#333'; for (const dx of [-18, -4, 10]) { c.beginPath(); c.arc(dx, 18, 6, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(-17, -26, 6, 0, 7); c.arc(-10, -32, 8, 0, 7); c.fill(); }
  else if (art === 'bike') { st(col, 3.5); for (const dx of [-16, 16]) { c.beginPath(); c.arc(dx, 12, 11, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(-16, 12); c.lineTo(-2, -8); c.lineTo(14, -8); c.lineTo(16, 12); c.moveTo(-2, -8); c.lineTo(2, 12); c.lineTo(-16, 12); c.moveTo(14, -8); c.lineTo(12, -16); c.stroke(); }
  else if (art === 'rose') { st('#2a7a3a', 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.stroke(); c.fillStyle = '#ff3a4a'; for (let i = 0; i < 5; i++) { const a = i * 1.26; c.beginPath(); c.arc(Math.cos(a) * 6, -6 + Math.sin(a) * 6, 8, 0, 7); c.fill(); } c.fillStyle = '#a0101e'; c.beginPath(); c.arc(0, -6, 5, 0, 7); c.fill(); }
  else if (art === 'croissant') { c.fillStyle = '#b8701e'; c.beginPath(); c.arc(0, 6, 22, Math.PI * 1.05, Math.PI * 1.95); c.arc(0, 14, 12, Math.PI * 1.9, Math.PI * 1.1, true); c.fill(); st('#7a4510', 2); for (const dx of [-10, 0, 10]) { c.beginPath(); c.moveTo(dx, -14); c.lineTo(dx * 0.8, 2); c.stroke(); } }
  else if (art === 'umbrella') { c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 22, Math.PI, 2 * Math.PI); c.fill(); st('#fff', 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 24); c.arc(-5, 24, 5, 0, Math.PI); c.stroke(); }
  else if (art === 'moon') { c.fillStyle = '#ffcf3a'; c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fill(); c.fillStyle = '#1c1c24'; c.beginPath(); c.arc(8, -6, 15, 0, 7); c.fill(); c.fillStyle = '#fff'; for (const [sx, sy] of [[-26, -20], [22, 18], [-20, 22], [28, -24]]) c.fillRect(sx, sy, 2, 2); }
  else if (art === 'bottle') { c.fillStyle = 'rgba(232,213,160,0.85)'; c.fillRect(-12, -8, 24, 32); c.fillStyle = '#e8d5a0'; c.fillRect(-4, -18, 8, 10); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-9, -4, 4, 24); }
  c.restore();
}
// ---------- Publicités personnalisées : images déposées dans pubs/ et listées dans pubs/pubs.json ----------
// Format conseillé : 2,5 × plus large que haut (ex. 1500 × 600 px). Si le fichier est absent (ou si le jeu est
// ouvert directement depuis le disque), le jeu garde ses publicités fictives.
const CUSTOM_ADS = []; let CUSTOM_MODE = 'melanger';
function loadCustomAds() {
  try {
    fetch('pubs/pubs.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(cfg => {
      if (!cfg || !Array.isArray(cfg.pubs)) return;
      CUSTOM_MODE = cfg.mode === 'remplacer' ? 'remplacer' : 'melanger';
      cfg.pubs.forEach((pb, i) => {
        if (!pb || !pb.image) return;
        const img = new Image();
        img.onload = () => {
          let avg = '#3a3a3a';   // couleur moyenne, utilisée quand l'affiche est trop loin pour être détaillée
          try { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; avg = `rgb(${d[0]},${d[1]},${d[2]})`; } catch (e) {}
          CUSTOM_ADS[i] = { title: 'pub:' + pb.image, nom: pb.nom || pb.image, img, bg: [avg, avg] };
        };
        img.src = 'pubs/' + encodeURI(pb.image);
      });
    }).catch(() => {});
  } catch (e) {}
}
loadCustomAds();
function adPool() {
  const mine = CUSTOM_ADS.filter(Boolean);
  if (!mine.length) return ADS;
  return CUSTOM_MODE === 'remplacer' ? mine : ADS.concat(mine);
}
// texture de chaque publicité, peinte une seule fois (250 × 100 unités, en double résolution)
const AD_W = 250, AD_H = 100, AD_RES = 3, AD_TEX = {};
function adTexture(ad) {
  if (AD_TEX[ad.title]) return AD_TEX[ad.title];
  const cvs = document.createElement('canvas'); cvs.width = AD_W * AD_RES; cvs.height = AD_H * AD_RES;
  const c = cvs.getContext('2d'); c.scale(AD_RES, AD_RES);
  const bg = c.createLinearGradient(0, 0, AD_W, AD_H); bg.addColorStop(0, ad.bg[0]); bg.addColorStop(1, ad.bg[1]);
  c.fillStyle = bg; c.fillRect(0, 0, AD_W, AD_H);
  adArt(c, ad.art, 190, 50, 1.4, ad.col);
  c.fillStyle = ad.col; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = 'bold 30px "Helvetica Neue", Arial, sans-serif'; c.fillText(ad.title, 14, 46, 150);
  c.font = '15px "Helvetica Neue", Arial, sans-serif'; c.globalAlpha = 0.85; c.fillText(ad.sub, 14, 70, 150); c.globalAlpha = 1;
  c.fillRect(14, 82, 40, 3); c.fillRect(14, 88, 26, 3);                                           // logo / mentions
  const sheen = c.createLinearGradient(0, 0, AD_W, AD_H); sheen.addColorStop(0, 'rgba(255,255,255,0.18)'); sheen.addColorStop(0.4, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(255,255,255,0.06)');
  c.fillStyle = sheen; c.fillRect(0, 0, AD_W, AD_H);                                               // reflet du plexiglas
  return (AD_TEX[ad.title] = cvs);
}
function drawPoster(x, e, y0, y1, z0, z1, seed, f) {
  const pool = adPool(), ad = pool[((seed % pool.length) + pool.length) % pool.length], xx = x + e * 0.03;
  // sur le mur de droite (e < 0), la gauche de l'affiche est au loin ; sur celui de gauche, au près
  const zAt = u => e < 0 ? z1 - (z1 - z0) * u / AD_W : z0 + (z1 - z0) * u / AD_W;
  const wpx = Math.abs(P(xx, y1, z0)[0] - P(xx, y1, z1)[0]);
  if (wpx <= 14) {   // trop loin : simple aplat de la couleur de fond
    poly([[xx, y0, z0], [xx, y1, z0], [xx, y1, z1], [xx, y0, z1]], ad.bg[0]);
  } else {
    // découpe en bandes verticales : chacune est déformée selon sa propre position sur le mur,
    // ce qui suit la vraie perspective (une seule déformation globale faisait glisser le contenu)
    const tex = ad.img || adTexture(ad), N = 20, du = AD_W / N;
    const tw = ad.img ? ad.img.naturalWidth : AD_W * AD_RES, th = ad.img ? ad.img.naturalHeight : AD_H * AD_RES;
    for (let i = 0; i < N; i++) {
      const u0 = i * du, u1 = u0 + du;
      const A = P(xx, y1, zAt(u0)), B = P(xx, y1, zAt(u1)), Cb = P(xx, y0, zAt(u0)), Db = P(xx, y0, zAt(u1));
      g.save();
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(Db[0], Db[1]); g.lineTo(Cb[0], Cb[1]); g.closePath(); g.clip();
      // repère local de la bande : axe horizontal le long du haut, axe vertical sur son bord gauche
      g.transform((B[0] - A[0]) / du, (B[1] - A[1]) / du, (Cb[0] - A[0]) / AD_H, (Cb[1] - A[1]) / AD_H, A[0], A[1]);
      g.drawImage(tex, u0 / AD_W * tw, 0, du / AD_W * tw, th, 0, 0, du * 1.06, AD_H);
      g.restore();
    }
  }
  if (f < 1) poly([[xx, y0, z0], [xx, y1, z0], [xx, y1, z1], [xx, y0, z1]], `rgba(${FOG_ST.join(',')},${(1 - f).toFixed(3)})`);   // brume au loin
}

// petite tête de mort pixel (aide visuelle optionnelle, touche H)
const SKULL = ['01110', '11111', '10101', '11111', '01010'];
function drawSkull(cx, by, px) {
  const bob = Math.round(Math.sin(S.t * 6) * px);
  const x0 = Math.round(cx - 2.5 * px), y0 = Math.round(by - 5 * px) + bob;
  g.fillStyle = '#000'; g.fillRect(x0 - 1, y0 - 1, 5 * px + 2, 5 * px + 2);
  SKULL.forEach((row, j) => [...row].forEach((c, i) => { g.fillStyle = c === '1' ? '#ff3b3b' : '#000'; g.fillRect(x0 + i * px, y0 + j * px, px, px); }));
}

// sx, sy : pieds à l'écran ; sc : pixels par mètre ; walk : phase de marche cumulée
function drawPerson(sx, sy, sc, pp, walk = 0) {
  const H0 = pp.h * sc;
  if (H0 < 1.5) return null;
  const dev = H0 * RES * DRAW_K;                       // taille réelle à l'écran → niveau de détail
  const D1 = dev >= 16, D2 = dev >= 42, D3 = dev >= 75;
  const t = (S ? S.t : 0) + pp.seed * 37;
  // en mouvement ? (la phase de marche a changé récemment)
  if (walk !== pp._lw) { pp._lw = walk; pp._mt = S.t; }
  const moving = walk > 0 && S.t - (pp._mt || -9) < 0.15;
  const run = moving && pp.runner, dir = pp.dir || 1;
  const sus = !!pp.suspect;
  const kids = pp.kind === 'child';

  // ---- fauteuil roulant : personne assise
  if (pp.kind === 'wheel') return drawWheelchair(sx, sy, sc, pp, t, D1, D2, D3);

  const H = H0;
  const stride = moving ? Math.sin(walk * (run ? 0.8 : 1)) : 0;
  const bob = moving ? -Math.abs(Math.sin(walk)) * H * (run ? 0.035 : 0.018) : Math.sin(t * 1.7) * H * 0.005;
  // balancement au repos, plus marqué pour les fêtards ; bousculade dans la foule
  let sway = moving ? 0 : Math.sin(t * 0.45) * H * 0.012 * (pp.party ? 3.5 : 1);
  if (JOSTLE && !moving) sway += (Math.sin(t * 2.3) + Math.sin(t * 3.7 + 1)) * H * 0.012 * JOSTLE;
  const cx = sx + sway;
  const lean = run ? H * 0.12 * dir : sus ? H * 0.03 * dir : (pp.acc === 'stroller' && moving ? H * 0.04 * dir : 0);
  const LX = y => cx + lean * (sy - y) / H;    // décalage d'inclinaison selon la hauteur

  const build = pp.build || 1;
  const shW = H * (kids ? 0.25 : 0.245) * build, hipW = H * 0.185 * build;
  const hipY = sy - H * (kids ? 0.45 : 0.5) + bob * 0.5;
  const shY = sy - H * (kids ? 0.74 : 0.805) + bob + (sus ? H * 0.025 : 0);
  const headR = H * (kids ? 0.095 : 0.068);
  const headY = shY - headR * (sus ? 0.9 : 1.2) - H * 0.01;
  const headX = LX(headY) + (sus ? H * 0.02 * dir : 0);
  const shX = LX(shY), hipX = LX(hipY);
  const skin = pc(pp.k), skinD = pc(pp.k, 0.8);
  const cloth = pc(pp.c), clothD = pc(pp.c, 0.72), clothL = pc(pp.c, 1.18);
  const onPhone = pp.acc === 'phone';
  const longLow = pp.outfit === 'coat' || pp.outfit === 'dress';

  // ombre portée
  g.fillStyle = `rgba(0,0,0,${0.28 * PL_F})`; g.beginPath(); g.ellipse(sx, sy, shW * 0.9, Math.max(0.5, shW * 0.22), 0, 0, 7); g.fill();

  // ---- arrière-plan : cheveux longs, capuche baissée, sac à dos, valise
  if (D1 && (pp.hairStyle === 'long') && pp.hat !== 'hood') {
    quad([headX - headR * 1.05, headY], [headX + headR * 1.05, headY], [shX + shW * 0.36, shY + H * 0.07], [shX - shW * 0.36, shY + H * 0.07], pc(pp.hair, 0.85));
  }
  if (D2 && pp.hat === 'hoodDown') circ(shX, shY - headR * 0.1, headR * 1.05, clothD);
  const pack = pp.acc === 'backpack' || pp.acc2 === 'backpack';
  if (D1 && pack) {
    const bw = shW * 0.95, bh = H * 0.25;
    quad([shX - bw / 2 - dir * shW * 0.12, shY + H * 0.02], [shX + bw / 2 - dir * shW * 0.12, shY + H * 0.02], [shX + bw / 2 - dir * shW * 0.15, shY + bh], [shX - bw / 2 - dir * shW * 0.15, shY + bh], pc(pp.bag, 0.8));
  }
  if (D1 && pp.acc2 === 'suitcase') {
    const kx = cx - dir * shW * 0.95, kw = H * 0.17, kh = H * 0.3;
    g.fillStyle = pc(pp.bag); g.fillRect(kx - kw / 2, sy - kh - H * 0.02, kw, kh);
    if (D2) { g.fillStyle = pc(pp.bag, 0.7); g.fillRect(kx - kw / 2, sy - kh * 0.55, kw, kh * 0.05); circ(kx - kw * 0.3, sy - H * 0.01, H * 0.012, '#111'); circ(kx + kw * 0.3, sy - H * 0.01, H * 0.012, '#111'); }
    seg(kx, sy - kh - H * 0.02, kx, sy - kh - H * 0.1, H * 0.012, '#333');
  }

  // ---- jambes + chaussures
  const legW = hipW * 0.46, footY = sy;
  const kneeLift = run ? H * 0.06 : H * 0.015;
  const legs = [-1, 1].map(s => {
    const off = moving ? s * stride * H * (run ? 0.2 : 0.12) : 0;
    const lift = moving ? Math.max(0, s * Math.cos(walk)) * kneeLift : 0;
    return { hx: hipX + s * hipW * 0.24, fx: cx + s * hipW * 0.24 + off, fy: footY - lift };
  });
  const legCol = (pp.outfit === 'skirt' || pp.outfit === 'dress') ? pc(pp.tights || '#2a2226') : pc(pp.pants);
  const legColD = (pp.outfit === 'skirt' || pp.outfit === 'dress') ? pc(pp.tights || '#2a2226', 0.75) : pc(pp.pants, 0.72);
  legs.forEach((l, i) => {
    const w0 = legW * (pp.outfit === 'puffer' ? 1.05 : 1);
    // genou : fléchi vers l'avant pendant la foulée, légèrement au repos
    const ph = walk + (i ? 0 : Math.PI), bend = moving ? H * (run ? 0.07 : 0.035) * Math.max(0, Math.sin(ph)) : H * 0.004;
    const kx = (l.hx + l.fx) / 2 + dir * bend, ky = (hipY + l.fy) / 2 - (moving ? bend * 0.3 : 0);
    if (D1) {
      limb(l.hx, hipY + w0 * 0.3, kx, ky, l.fx, l.fy - H * 0.035, w0, i ? legCol : legColD);
      g.fillStyle = `rgba(0,0,0,${0.12 * PL_F})`; g.beginPath(); g.arc(kx, ky, w0 * 0.22, 0, 7); g.fill();   // pli du genou
    } else quad([l.hx - w0 / 2, hipY], [l.hx + w0 / 2, hipY], [l.fx + w0 * 0.4, l.fy - H * 0.035], [l.fx - w0 * 0.4, l.fy - H * 0.035], i ? legCol : legColD);
    if (D1) { // chaussure, pointée dans le sens de la marche
      const sw = w0 * 1.25;
      g.fillStyle = pc(pp.shoe || '#141414'); g.beginPath();
      g.ellipse(l.fx + dir * sw * 0.18, l.fy - H * 0.018, sw * 0.62, H * 0.022, 0, 0, 7); g.fill();
    }
  });

  // ---- bas de tenue : manteau / robe / jupe
  if (longLow) {
    const hemY = sy - H * 0.25, flare = moving ? stride * H * 0.03 : 0;
    quad([shX - shW * 0.45, shY + H * 0.05], [shX + shW * 0.45, shY + H * 0.05], [cx + hipW * 0.75 + flare, hemY], [cx - hipW * 0.75 + flare, hemY], cloth);
    quad([shX - shW * 0.45, shY + H * 0.05], [shX - shW * 0.2, shY + H * 0.05], [cx - hipW * 0.4 + flare, hemY], [cx - hipW * 0.75 + flare, hemY], clothD);
    if (D2 && pp.outfit === 'coat') { seg(shX, shY + H * 0.08, cx + flare * 0.5, hemY, Math.max(1 / RES, H * 0.006), pc(pp.c, 0.6)); }
  } else if (pp.outfit === 'skirt') {
    const hemY = hipY + H * 0.17;
    quad([hipX - hipW * 0.55, hipY - H * 0.01], [hipX + hipW * 0.55, hipY - H * 0.01], [cx + hipW * 0.78, hemY], [cx - hipW * 0.78, hemY], pc(pp.bag));
  }

  // ---- torse
  let torsoCol = cloth;
  if (D1) {   // lumière du plafond : haut du buste plus clair
    torsoCol = g.createLinearGradient(0, shY, 0, hipY);
    torsoCol.addColorStop(0, pc(pp.c, 1.15)); torsoCol.addColorStop(1, pc(pp.c, 0.82));
  }
  quad([shX - shW / 2, shY], [shX + shW / 2, shY], [hipX + hipW / 2, hipY + H * 0.01], [hipX - hipW / 2, hipY + H * 0.01], torsoCol);
  if (D2) {
    g.strokeStyle = `rgba(0,0,0,${0.35 * PL_F})`; g.lineWidth = 1 / RES; g.beginPath();
    g.moveTo(shX - shW / 2, shY); g.lineTo(shX + shW / 2, shY); g.lineTo(hipX + hipW / 2, hipY + H * 0.01); g.lineTo(hipX - hipW / 2, hipY + H * 0.01); g.closePath(); g.stroke();
  }
  // face à l'ombre (lumière venant du plafond, côté quai)
  quad([shX - shW / 2, shY], [shX - shW * 0.27, shY], [hipX - hipW * 0.28, hipY + H * 0.01], [hipX - hipW / 2, hipY + H * 0.01], clothD);
  if (sus) quad([shX - shW / 2, shY], [shX + shW / 2, shY], [shX + shW * 0.42, shY + H * 0.04], [shX - shW * 0.42, shY + H * 0.04], clothD);   // épaules voûtées
  if (D2) {
    if (pp.outfit === 'suit') { // chemise + cravate
      quad([shX - shW * 0.13, shY], [shX + shW * 0.13, shY], [shX + shW * 0.02, shY + H * 0.12], [shX - shW * 0.02, shY + H * 0.12], pc('#f2f2f2'));
      quad([shX - shW * 0.03, shY + H * 0.01], [shX + shW * 0.03, shY + H * 0.01], [shX + shW * 0.045, shY + H * 0.13], [shX - shW * 0.045, shY + H * 0.13], pc(pp.bag));
    } else if (pp.outfit === 'puffer') { // matelassage
      for (let q = 1; q <= 3; q++) { const yy = shY + (hipY - shY) * q / 4; g.fillStyle = clothD; g.fillRect(LX(yy) - shW * 0.45, yy, shW * 0.9, Math.max(1 / RES, H * 0.007)); }
    } else if (pp.outfit === 'hoodie') { // poche kangourou + cordons
      g.fillStyle = clothD; g.fillRect(hipX - hipW * 0.35, hipY - H * 0.1, hipW * 0.7, H * 0.06);
      if (pp.hat !== 'hood') { seg(shX - shW * 0.08, shY + H * 0.01, shX - shW * 0.08, shY + H * 0.08, 1 / RES * 1.5, pc('#eeeeee')); seg(shX + shW * 0.08, shY + H * 0.01, shX + shW * 0.08, shY + H * 0.08, 1 / RES * 1.5, pc('#eeeeee')); }
    } else if (pp.outfit === 'coat' && D3) { // boutons
      for (let q = 0; q < 3; q++) circ(shX + shW * 0.06, shY + H * (0.08 + q * 0.07), H * 0.007, pc(pp.c, 0.5));
    } else if (pp.outfit === 'tshirt' && D3 && pp.party) { // motif
      circ(shX, shY + H * 0.1, H * 0.03, pc('#ffffff', 0.9));
    }
    if (pack) { // bretelles
      seg(shX - shW * 0.28, shY, hipX - hipW * 0.3, shY + H * 0.2, H * 0.016, pc(pp.bag, 0.6));
      seg(shX + shW * 0.28, shY, hipX + hipW * 0.3, shY + H * 0.2, H * 0.016, pc(pp.bag, 0.6));
    }
  }
  // rehaut : liseré lumineux sur les épaules
  if (D1) { g.fillStyle = `rgba(255,246,220,${0.28 * PL_F})`; g.fillRect(shX - shW / 2, shY, shW, Math.max(1 / RES, H * 0.008)); }

  // ---- bras
  const armW = H * (pp.outfit === 'puffer' ? 0.085 : 0.07);
  const sleeve = pc(pp.c), sleeveD = clothD, foreCol = pp.outfit === 'tshirt' || pp.outfit === 'dress' ? skin : sleeve;
  const arms = [-1, 1].map(s => {
    const ax = shX + s * (shW / 2 - armW * 0.35), ay = shY + armW * 0.45;
    let ex, ey, hx, hy;
    const swing = moving ? -s * stride * H * (run ? 0.16 : 0.08) : (pp.party ? Math.sin(t * 1.3 + s) * H * 0.015 : 0);
    ex = ax + s * H * 0.02 + swing * 0.5; ey = ay + H * 0.16;
    hx = ax + s * H * 0.025 + swing; hy = ay + H * 0.31;
    if (run) { ey = ay + H * 0.12; hy = ay + H * 0.2; hx = ax + swing * 1.2 + dir * H * 0.06; }
    if (sus && !moving) { ex = ax + s * H * 0.01; ey = ay + H * 0.15; hx = hipX + s * hipW * 0.25; hy = hipY - H * 0.06; }   // mains dans les poches
    if (onPhone && s === 1) { ex = ax + H * 0.02; ey = ay + H * 0.17; hx = shX + H * 0.03; hy = shY + H * 0.12; }
    if (pp.acc === 'map') { ex = ax + s * H * 0.04; ey = ay + H * 0.16; hx = shX + s * H * 0.05; hy = shY + H * 0.14; }
    if (pp.acc === 'stroller') { ex = ax + dir * H * 0.06; ey = ay + H * 0.14; hx = ax + dir * H * 0.17; hy = ay + H * 0.2; }
    if ((pp.acc === 'cane' || pp.acc === 'umbrella') && s === dir) { ex = ax + dir * H * 0.03; ey = ay + H * 0.15; hx = ax + dir * H * 0.09; hy = ay + H * 0.28; }
    if (pp.acc2 === 'suitcase' && s === -dir) { hx = ax - dir * H * 0.06; hy = ay + H * 0.3; ex = ax - dir * H * 0.03; ey = ay + H * 0.15; }
    if (pp.kid && s === -dir) { ex = ax - dir * H * 0.04; ey = ay + H * 0.15; hx = ax - dir * H * 0.11; hy = ay + H * 0.29; }   // tend la main à l'enfant
    if (kids && s === dir) { ex = ax + dir * H * 0.05; ey = ay + H * 0.1; hx = ax + dir * H * 0.12; hy = ay + H * 0.04; }      // l'enfant lève la main
    if (pp.holder && pp.st === 'door' && s === -1) { ex = ax - H * 0.07; ey = ay - H * 0.02; hx = ax - H * 0.12; hy = ay - H * 0.16; }   // retient la porte, bras levé
    return { ax, ay, ex, ey, hx, hy, s };
  });
  if (D1) arms.forEach(a => {
    const back = a.s === -1;
    limb(a.ax, a.ay, a.ex, a.ey, a.ex, a.ey, armW, back ? sleeveD : sleeve);
    limb(a.ex, a.ey, a.ex, a.ey, a.hx, a.hy, armW * 0.9, back && foreCol !== skin ? sleeveD : foreCol);
    circ(a.hx, a.hy, armW * 0.5, back ? skinD : skin);
  });
  else { g.fillStyle = clothD; g.fillRect(shX - shW / 2 - armW * 0.4, shY, armW * 0.5, H * 0.3); g.fillRect(shX + shW / 2 - armW * 0.1, shY, armW * 0.5, H * 0.3); }

  // ---- accessoires portés devant
  const hand = arms[1], handL = arms[0];
  if (D1 && pp.acc === 'handbag') {
    const bx = hipX + hipW * 0.62, by = hipY - H * 0.03, bw = H * 0.1, bh = H * 0.085;
    if (D2) seg(shX - shW * 0.2, shY + H * 0.01, bx, by, Math.max(1 / RES, H * 0.006), pc(pp.bag, 0.6));
    g.fillStyle = pc(pp.bag); g.fillRect(bx - bw / 2, by, bw, bh);
    if (D2) { g.fillStyle = pc(pp.bag, 1.3); g.fillRect(bx - bw / 2, by, bw, Math.max(1 / RES, bh * 0.15)); }
  }
  if (D1 && onPhone) {
    const ph = H * 0.05;
    g.fillStyle = '#111'; g.fillRect(hand.hx - ph * 0.3, hand.hy - ph * 0.9, ph * 0.6, ph);
    const night = PER === 2;
    if (D2) { g.fillStyle = night ? '#bfe6ff' : '#5a8ab0'; g.fillRect(hand.hx - ph * 0.22, hand.hy - ph * 0.82, ph * 0.44, ph * 0.8); }
    if (night) glow(hand.hx, hand.hy - ph * 0.4, H * 0.12, '150,200,255', 0.35);
  }
  if (D1 && pp.acc === 'map') {
    const mw = H * 0.2, mh = H * 0.12, my = shY + H * 0.08;
    g.fillStyle = pc('#f4ecd0'); g.fillRect(shX - mw / 2, my, mw, mh);
    if (D2) { g.fillStyle = pc('#7ab0d8'); g.fillRect(shX - mw * 0.3, my + mh * 0.2, mw * 0.25, mh * 0.5); g.fillStyle = pc('#8ac07a'); g.fillRect(shX + mw * 0.05, my + mh * 0.35, mw * 0.3, mh * 0.4); g.fillStyle = pc('#c0b090'); g.fillRect(shX - 1 / RES / 2, my, 1 / RES, mh); }
  }
  if (D1 && (pp.acc === 'cane' || pp.acc === 'umbrella')) {
    const h0 = arms.find(a => a.s === dir) || hand;
    const tipX = h0.hx + dir * H * (pp.acc === 'cane' ? 0.08 : 0.04);
    seg(h0.hx, h0.hy - H * 0.02, tipX, sy - H * 0.005, H * (pp.acc === 'cane' ? 0.014 : 0.03), pc(pp.acc === 'cane' ? '#5a3a22' : pp.bag));
    if (pp.acc === 'umbrella' && D2) seg(h0.hx, h0.hy - H * 0.02, h0.hx, h0.hy - H * 0.05, H * 0.012, '#222');
  }
  if (D1 && pp.acc === 'stroller') {
    const bx = cx + dir * H * 0.42, by = sy - H * 0.2, bw = H * 0.34, bh = H * 0.2;
    seg(hand.hx, hand.hy, bx - dir * bw * 0.35, by, H * 0.012, '#222');
    g.fillStyle = pc(pp.bag); g.beginPath(); g.ellipse(bx, by, bw / 2, bh / 2, 0, 0, 7); g.fill();
    g.fillStyle = pc(pp.bag, 0.7); g.beginPath(); g.ellipse(bx - dir * bw * 0.12, by - bh * 0.25, bw * 0.38, bh * 0.55, 0, Math.PI, 2 * Math.PI); g.fill();
    seg(bx - bw * 0.3, by + bh * 0.4, bx - bw * 0.3, sy - H * 0.04, H * 0.01, '#222'); seg(bx + bw * 0.3, by + bh * 0.4, bx + bw * 0.3, sy - H * 0.04, H * 0.01, '#222');
    circ(bx - bw * 0.3, sy - H * 0.03, H * 0.03, '#151515'); circ(bx + bw * 0.3, sy - H * 0.03, H * 0.03, '#151515');
  }

  // ---- cou + tête
  g.fillStyle = skinD; g.fillRect(headX - headR * 0.35, headY + headR * 0.6, headR * 0.7, shY - headY - headR * 0.5);
  if (D1 && pp.scarf && pp.hat !== 'hood') {   // écharpe enroulée + pan qui tombe
    const sc = pc(pp.scarf), scD = pc(pp.scarf, 0.75);
    g.fillStyle = sc; g.beginPath(); g.ellipse(headX, shY - H * 0.005, shW * 0.3, H * 0.022, 0, 0, 7); g.fill();
    quad([headX + dir * shW * 0.05, shY], [headX + dir * shW * 0.17, shY], [headX + dir * shW * 0.15, shY + H * 0.13], [headX + dir * shW * 0.04, shY + H * 0.12], scD);
  }
  const hcol0 = pc(pp.hair);
  if (D1 && pp.hat !== 'hood' && !pp.hat) {   // volumes de coiffure derrière la tête
    if (pp.hairStyle === 'afro') circ(headX, headY - headR * 0.2, headR * 1.38, hcol0);
    if (pp.hairStyle === 'pony') { g.fillStyle = hcol0; g.beginPath(); g.ellipse(headX - dir * headR * 1.05, headY + headR * 0.2, headR * 0.35, headR * 0.75, -dir * 0.4, 0, 7); g.fill(); }
  }
  if (pp.hat === 'hood') circ(headX, headY - headR * 0.05, headR * 1.32, pc(pp.c, 0.85));          // capuche relevée
  circ(headX, headY, headR, skin);
  if (D2) { g.fillStyle = `rgba(0,0,0,${0.13 * PL_F})`; g.beginPath(); g.arc(headX, headY, headR, Math.PI * 0.5, Math.PI * 1.5); g.fill(); }   // joue à l'ombre
  if (D2 && pp.beard && pp.hat !== 'hood') { g.fillStyle = pc(pp.hair, 0.95); g.beginPath(); g.arc(headX, headY + headR * 0.22, headR * 0.82, Math.PI * 0.05, Math.PI * 0.95); g.fill(); g.fillStyle = pc(pp.k, 0.8); g.fillRect(headX - headR * 0.2, headY + headR * 0.55, headR * 0.4, headR * 0.08); }
  if (pp.hat === 'hood') {   // visage dans l'ombre de la capuche
    g.fillStyle = pc(pp.c, 0.85); g.beginPath(); g.arc(headX, headY - headR * 0.05, headR * 1.32, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(headX, headY - headR * 0.2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(headX, headY, headR * 0.98, Math.PI, 2 * Math.PI); g.fill();
  } else if (D1) {
    // cheveux
    const hcol = pc(pp.hair);
    if (pp.hairStyle !== 'bald') { g.fillStyle = hcol; g.beginPath(); g.arc(headX, headY - headR * 0.02, headR * 1.04, Math.PI * 0.95, Math.PI * 2.05); g.fill(); }
    else { g.fillStyle = hcol; g.beginPath(); g.arc(headX, headY, headR * 1.03, Math.PI * 0.85, Math.PI * 1.1); g.arc(headX, headY, headR * 1.03, Math.PI * 1.9, Math.PI * 2.15); g.fill(); }
    if (pp.hairStyle === 'bun' && D2) circ(headX, headY - headR * 1.15, headR * 0.42, hcol);
    if (pp.hat === 'cap') {
      g.fillStyle = pc(pp.bag); g.beginPath(); g.arc(headX, headY - headR * 0.3, headR * 1.04, Math.PI, 2 * Math.PI); g.fill();
      g.fillStyle = pc(pp.bag, 0.75); g.fillRect(dir > 0 ? headX : headX - headR * 1.5, headY - headR * 0.38, headR * 1.5, headR * 0.16);
    } else if (pp.hat === 'beanie') {
      g.fillStyle = pc(pp.bag, 1.1); g.beginPath(); g.arc(headX, headY - headR * 0.15, headR * 1.08, Math.PI, 2 * Math.PI); g.fill();
      if (D2) { g.fillStyle = pc(pp.bag, 0.8); g.fillRect(headX - headR * 1.08, headY - headR * 0.3, headR * 2.16, headR * 0.3); circ(headX, headY - headR * 1.25, headR * 0.25, pc('#eeeeee')); }
    }
  }
  // casque audio
  if (D2 && pp.acc === 'headphones') {
    g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(1 / RES, headR * 0.22); g.beginPath(); g.arc(headX, headY, headR * 1.12, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    circ(headX - headR * 1.02, headY + headR * 0.05, headR * 0.32, pp.party ? pc(pp.c) : '#222'); circ(headX + headR * 1.02, headY + headR * 0.05, headR * 0.32, pp.party ? pc(pp.c) : '#222');
  }
  // visage : yeux (regard qui se balade ; les louches surveillent nerveusement autour d'eux)
  if (D3) {
    let look = Math.round(Math.sin(t * 0.35) * 1.2) * 0.25;
    if (sus) look = (Math.sin(t * 1.9) > 0 ? 1 : -1) * 0.38;
    if (moving) look = dir * 0.3;
    const ey = headY + (onPhone ? headR * 0.3 : headR * 0.05) + (pp.hat === 'hood' ? headR * 0.1 : 0);
    const er = Math.max(0.6 / RES, headR * 0.11);
    const blink = Math.sin(t * 0.9) > 0.985;
    const eyeC = pp.zombie ? '#ff3a2a' : pp.hat === 'hood' ? 'rgba(255,255,255,0.75)' : '#1a1410';
    if (!blink) { circ(headX - headR * 0.35 + look * headR, ey, er, eyeC); circ(headX + headR * 0.35 + look * headR, ey, er, eyeC); }
    if (pp.hat !== 'hood' && !pp.beard) { g.fillStyle = skinD; g.fillRect(headX - headR * 0.18 + look * headR * 0.6, headY + headR * 0.5, headR * 0.36, Math.max(0.5 / RES, headR * 0.07)); }
    if (pp.glasses && pp.hat !== 'hood') {
      g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(0.6 / RES, headR * 0.07);
      for (const sx2 of [-0.35, 0.35]) { g.beginPath(); g.arc(headX + sx2 * headR + look * headR, ey, headR * 0.24, 0, 7); g.stroke(); }
      seg(headX - headR * 0.11 + look * headR, ey, headX + headR * 0.11 + look * headR, ey, Math.max(0.6 / RES, headR * 0.06), '#1a1a1a');
    }
  }
  // rehaut sur le haut de la tête
  if (D2 && pp.hat !== 'hood') { g.strokeStyle = `rgba(255,248,225,${0.3 * PL_F})`; g.lineWidth = Math.max(1 / RES, headR * 0.12); g.beginPath(); g.arc(headX, headY, headR * 1.02, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }

  // tête de mort : seulement en aide visuelle (touche H) ou pendant un vol
  if (sus && (HELP_SKULL || (S.theft && S.theft.shown))) drawSkull(headX, headY - headR * 1.6, Math.max(1, Math.round(H / 14)));

  // enfant tenu par la main
  if (pp.kid && D1) {
    const k = pp.kid, kx = cx - dir * H * 0.27;
    k.dir = dir; k.st = pp.st;
    const kr = drawPerson(kx, sy, sc, k, walk ? walk * 1.4 : 0);
    if (kr) { const a = arms.find(q => q.s === -dir) || handL; seg(a.hx, a.hy, kr.hand[0], kr.hand[1], armW * 0.6, skin); }
  }
  return { hand: [(arms.find(a => a.s === dir) || hand).hx, (arms.find(a => a.s === dir) || hand).hy], top: headY - headR };
}

// personne en fauteuil roulant (vue de profil)
function drawWheelchair(sx, sy, sc, pp, t, D1, D2, D3) {
  const H = 1.7 * sc, dir = pp.dir || 1;
  const wr = H * 0.19, wx = sx - dir * H * 0.05, wy = sy - wr;
  const seatY = sy - H * 0.3, skin = pc(pp.k);
  g.fillStyle = `rgba(0,0,0,${0.28 * PL_F})`; g.beginPath(); g.ellipse(sx, sy, H * 0.25, H * 0.05, 0, 0, 7); g.fill();
  // dossier + assise
  seg(wx - dir * H * 0.1, seatY, wx - dir * H * 0.12, seatY - H * 0.28, H * 0.025, '#2a2d34');
  seg(wx - dir * H * 0.12, seatY - H * 0.28, wx - dir * H * 0.2, seatY - H * 0.28, H * 0.02, '#2a2d34');
  // corps assis
  const shY = seatY - H * 0.3, hipX = wx - dir * H * 0.02;
  const breathe = Math.sin(t * 1.7) * H * 0.004;
  quad([hipX - H * 0.08, shY + breathe], [hipX + H * 0.08, shY + breathe], [hipX + H * 0.07, seatY], [hipX - H * 0.07, seatY], pc(pp.c));
  // cuisses + jambes
  limb(hipX, seatY - H * 0.03, hipX + dir * H * 0.2, seatY - H * 0.03, hipX + dir * H * 0.22, sy - H * 0.06, H * 0.07, pc(pp.pants));
  if (D1) { g.fillStyle = pc(pp.shoe || '#141414'); g.fillRect(hipX + dir * H * 0.22 - H * 0.03, sy - H * 0.06, H * 0.08 * dir, H * 0.03); }
  // roue
  g.strokeStyle = '#3a3e48'; g.lineWidth = Math.max(1 / RES, H * 0.02); g.beginPath(); g.arc(wx, wy, wr, 0, 7); g.stroke();
  if (D2) { g.lineWidth = Math.max(0.5 / RES, H * 0.005); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + (pp._lw || 0) * 0.3; g.beginPath(); g.moveTo(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr); g.lineTo(wx - Math.cos(a) * wr, wy - Math.sin(a) * wr); g.stroke(); } }
  circ(wx + dir * H * 0.24, sy - H * 0.03, H * 0.03, '#2a2d34');
  // bras sur la main courante
  limb(hipX, shY + H * 0.04, hipX + dir * H * 0.05, shY + H * 0.16, wx + dir * wr * 0.4, wy - wr * 0.6, H * 0.06, pc(pp.c, 0.85));
  // tête
  const hr = H * 0.068, hx = hipX + dir * H * 0.01, hy = shY - hr * 1.2;
  circ(hx, hy, hr, skin);
  if (D1) { g.fillStyle = pc(pp.hair); g.beginPath(); g.arc(hx, hy - hr * 0.02, hr * 1.04, Math.PI * 0.95, Math.PI * 2.05); g.fill(); }
  if (D3) { const er = Math.max(0.6 / RES, hr * 0.11); circ(hx - hr * 0.3 + dir * hr * 0.25, hy + hr * 0.05, er, '#1a1410'); circ(hx + hr * 0.3 + dir * hr * 0.25, hy + hr * 0.05, er, '#1a1410'); }
  if (D2 && pp.acc === 'headphones') { g.strokeStyle = '#1a1a1a'; g.lineWidth = Math.max(1 / RES, hr * 0.22); g.beginPath(); g.arc(hx, hy, hr * 1.12, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
  return { hand: [wx + dir * wr * 0.4, wy - wr * 0.6], top: hy - hr };
}

// chien vu de dos (il regarde vers le fond du tunnel) ; en fuite latérale, vu de profil
function drawDog(dg, d) {
  const sc = 2.4 * F / d; if (sc * 0.6 < 1.2) return;   // un peu exagéré pour rester lisible de loin
  const [bx, by] = P(dg.x, -2, d), side = dg.state === 'leaving';
  const col = pc(dg.col), dark = pc(dg.col, 0.7), step = Math.sin(dg.walk) * (dg.state === 'sit' ? 0 : 1);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(bx, by, sc * (side ? 0.45 : 0.22), sc * 0.04, 0, 0, 7); g.fill();
  if (!side) {
    const sit = dg.state === 'sit', bh = sc * (sit ? 0.42 : 0.36), bw = sc * 0.2;
    // pattes arrière
    g.fillStyle = dark;
    g.fillRect(bx - bw * 0.85, by - sc * 0.22 + step * sc * 0.03, bw * 0.45, sc * 0.22 - step * sc * 0.03);
    g.fillRect(bx + bw * 0.4, by - sc * 0.22 - step * sc * 0.03, bw * 0.45, sc * 0.22 + step * sc * 0.03);
    // corps (arrière-train)
    g.fillStyle = col; g.beginPath(); g.ellipse(bx, by - sc * 0.22 - bh * 0.35, bw, bh * 0.55, 0, 0, 7); g.fill();
    // tête et oreilles au-dessus
    const hy = by - sc * 0.22 - bh * 0.95;
    g.beginPath(); g.arc(bx, hy, sc * 0.12, 0, 7); g.fill();
    g.fillStyle = dark; g.beginPath(); g.moveTo(bx - sc * 0.12, hy - sc * 0.02); g.lineTo(bx - sc * 0.07, hy - sc * 0.17); g.lineTo(bx - sc * 0.02, hy - sc * 0.06); g.fill();
    g.beginPath(); g.moveTo(bx + sc * 0.12, hy - sc * 0.02); g.lineTo(bx + sc * 0.07, hy - sc * 0.17); g.lineTo(bx + sc * 0.02, hy - sc * 0.06); g.fill();
    // queue qui remue
    const ta = Math.sin(dg.wag) * 0.7;
    g.strokeStyle = col; g.lineWidth = Math.max(1 / RES, sc * 0.045); g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx, by - sc * 0.3); g.lineTo(bx + Math.sin(ta) * sc * 0.16, by - sc * 0.3 - Math.cos(ta) * sc * 0.14); g.stroke(); g.lineCap = 'butt';
  } else {
    // de profil, il court vers la gauche
    const len = sc * 0.55, bh = sc * 0.18, ty = by - sc * 0.26;
    g.fillStyle = dark;
    for (const [lx, ph] of [[-0.2, 0], [-0.1, Math.PI], [0.15, Math.PI], [0.24, 0]]) { const sw = Math.sin(dg.walk + ph) * sc * 0.06; g.fillRect(bx + lx * len * 2 + sw, ty + bh * 0.4, sc * 0.05, sc * 0.26 - bh * 0.4); }
    g.fillStyle = col; g.beginPath(); g.ellipse(bx, ty, len * 0.5, bh * 0.6, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(bx - len * 0.55, ty - bh * 0.6, sc * 0.1, sc * 0.08, 0, 0, 7); g.fill();
    g.fillStyle = dark; g.beginPath(); g.moveTo(bx - len * 0.5, ty - bh * 0.9); g.lineTo(bx - len * 0.42, ty - bh * 1.5); g.lineTo(bx - len * 0.38, ty - bh * 0.8); g.fill();
    g.strokeStyle = col; g.lineWidth = Math.max(1 / RES, sc * 0.04); g.beginPath(); g.moveTo(bx + len * 0.48, ty - bh * 0.2); g.lineTo(bx + len * 0.7, ty - bh * 0.9); g.stroke();
  }
}

function collectSprites() {
  const list = [], yp = -0.95;
  if (S.mode === 'running' && S.barr && !S.barr.broken) {   // barricade de zombies
    const b = S.barr, dp = b.pos - S.pos;
    if (dp > NEAR + 0.3 && dp < DMAX) {
      list.push({ d: dp, draw: d => drawBarricade(b, d) });
      for (const z of b.zs) { const dz = dp - 1.2; if (dz > NEAR + 0.3) list.push({ d: dz, draw: d => { const [sx, sy] = P(z.x, -2, d); PL_F = Math.max(0.25, 1 - d / 150); PL_FOG = FOG_TUN; z.look.dir = 1; drawPerson(sx, sy, F / d, z.look, S.t * 2 + z.ph); PL_F = 1; } }); }
    }
  }
  if (S.mode === 'running' && S.gap > NEAR + 0.2 && S.gap < DMAX) list.push({ d: S.gap, draw: drawLeaderTail });
  if (S.person && S.person.state !== 'safe') {
    const pe = S.person, dp = pe.pos - S.pos;
    if (dp > NEAR + 0.3 && dp < DMAX) list.push({ d: dp, draw: d => {
      const [sx, sy] = P(pe.x, -2, d); PL_F = Math.max(0.25, 1 - d / 150); PL_FOG = FOG_TUN;
      drawPerson(sx, sy, F / d, pe.look, pe.state === 'leaving' ? pe.walk : 0); PL_F = 1;
      if (pe.state === 'track' && Math.floor(S.t * 4) % 2) { const [ax, ay] = P(pe.x, 0.2, d); txt('⚠', ax, ay, Math.min(28, Math.max(8, 0.9 * F / d)), '#ff4a3a', 'center'); }
    } });
  }
  if (S.dog && S.dog.state !== 'safe') {
    const dg = S.dog, dp = dg.pos - S.pos;
    if (dp > NEAR + 0.3 && dp < DMAX) list.push({ d: dp, draw: d => {
      PL_F = Math.max(0.25, 1 - d / 150); PL_FOG = FOG_TUN; drawDog(dg, d); PL_F = 1;
      if (['sit', 'trot', 'run'].includes(dg.state)) { const [ax, ay] = P(dg.x, 0.6, d); txt('⚠', ax, ay, Math.min(26, Math.max(13, 1.2 * F / d)), Math.floor(S.t * 4) % 2 ? '#ffb35e' : '#ff4a3a', 'center'); }
    } });
  }
  if (S.sigPos !== null) {
    const ds = S.sigPos - S.pos;
    if (ds > NEAR + 0.3 && ds < DMAX) list.push({ d: ds, draw: d => drawSigHead(d, S.sigRed > 0 ? 'r' : 'g') });
  }
  if (S.mode === 'running') swSprites(list);
  STATIONS.forEach(s => {
    const db = s.pos + 5 - S.pos;
    if (db > NEAR + 0.3 && db < DMAX) list.push({ d: db, draw: d => {
      const sc = F / d;
      const [bx, by] = P(1.95, yp, d), [, ty] = P(1.95, yp + 1.75, d);
      g.fillStyle = '#555a66'; g.fillRect(Math.round(bx - Math.max(1, 0.08 * sc) / 2), Math.round(ty), Math.max(1, Math.round(0.08 * sc)), Math.round(by - ty));
      const bw = Math.max(2, Math.round(0.7 * sc)), bh = Math.max(2, Math.round(0.5 * sc));
      const X = Math.round(bx - bw / 2), Y = Math.round(ty);
      g.fillStyle = '#ffffff'; g.fillRect(X, Y, bw, bh);
      g.fillStyle = '#d42a2a'; g.fillRect(X, Y, bw, Math.max(1, Math.round(bh * 0.18))); g.fillRect(X, Y + bh - Math.max(1, Math.round(bh * 0.18)), bw, Math.max(1, Math.round(bh * 0.18)));
      if (bw > 14) { g.fillStyle = '#111'; g.textAlign = 'center'; g.font = `${Math.min(24, Math.round(bh * 0.7))}px VT323, monospace`; g.fillText('STOP', bx, Y + bh * 0.72, bw - 2); }
    }});
    const si = STATIONS.indexOf(s);
    // panneaux de distance avant la marque d'arrêt
    if (!FIRE()) [[50, '50'], [25, '25'], [10, '10']].forEach(([off, lab]) => {   // fuite : pas de panneaux chiffrés (on les prenait pour des limitations)
      const d = s.pos - off - S.pos;
      if (d > NEAR + 0.5 && d < DMAX) list.push({ d, draw: d => {
        const [x0, y0] = P(-2.5, 1.0, d), [x1, y1] = P(-1.9, 0.4, d);
        g.fillStyle = '#111'; g.fillRect(Math.round(x0) - 1, Math.round(y0) - 1, Math.round(x1 - x0) + 2, Math.round(y1 - y0) + 2);
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(x0), Math.round(y0), Math.max(1, Math.round(x1 - x0)), Math.max(1, Math.round(y1 - y0)));
        const hp = y1 - y0;
        if (hp > 5) { g.fillStyle = '#111'; g.textAlign = 'center'; g.font = `${Math.min(30, Math.round(hp * 0.95))}px VT323, monospace`; g.fillText(lab, (x0 + x1) / 2, y0 + hp * 0.82); }
      }});
    });
    // sièges « coque » colorés le long du piédroit
    [-64, -46, -30, -16].forEach(off => {
      const d = s.pos + off - S.pos;
      if (d > NEAR + 0.3 && d < 90) list.push({ d, draw: d => {
        for (let k = 3; k >= 0; k--) {
          const z0 = d + k * 0.6, z1 = z0 + 0.48;
          if (z0 <= NEAR) continue;
          poly([[5.75, yp + 0.95, z1], [6.45, yp + 0.95, z1], [6.45, yp + 0.95, z0], [5.75, yp + 0.95, z0]], s.seat);
          poly([[6.3, yp + 0.45, z1], [6.45, yp + 0.95, z1], [6.45, yp + 0.95, z0], [6.3, yp + 0.45, z0]], s.seat);
          poly([[5.75, yp + 0.45, z1], [6.3, yp + 0.45, z1], [6.3, yp + 0.45, z0], [5.75, yp + 0.45, z0]], s.seat);
          poly([[5.75, yp + 0.38, z1], [5.75, yp + 0.45, z1], [5.75, yp + 0.45, z0], [5.75, yp + 0.38, z0]], 'rgba(0,0,0,0.35)');
        }
        poly([[6.0, yp, d + 2.2], [6.0, yp + 0.38, d + 2.2], [6.0, yp + 0.38, d], [6.0, yp, d]], '#3a3a40');
      }});
    });
    // mobilier : poubelles et distributeur de boissons
    [[-22, 'bin'], [-52, 'bin'], [-33, 'vend']].forEach(([off, kind]) => {
      const d = s.pos + off - S.pos;
      if (d > NEAR + 0.3 && d < 90) list.push({ d, draw: d => {
        const f = Math.max(0.35, 1 - d / 260);
        if (kind === 'bin') {   // support vert + sac transparent
          const x0 = 5.95, x1 = 6.35, yb = yp, yt = yp + 0.75;
          poly([[x0, yb, d], [x1, yb, d], [x1, yt, d], [x0, yt, d]], sh([150, 160, 150], f));
          poly([[x0, yb, d + 0.4], [x0, yb, d], [x0, yt, d], [x0, yt, d + 0.4]], sh([125, 135, 128], f));
          poly([[x0 - 0.03, yt, d], [x1 + 0.03, yt, d], [x1 + 0.03, yt + 0.07, d], [x0 - 0.03, yt + 0.07, d]], sh([40, 110, 70], f));
          poly([[x0, yb, d - 0.01], [x1, yb, d - 0.01], [x1, yb + 0.25, d - 0.01], [x0, yb + 0.25, d - 0.01]], 'rgba(0,0,0,0.12)');
        } else {                // distributeur rouge éclairé
          const x0 = 5.7, x1 = 6.48, yb = yp, yt = yp + 1.85, z1 = d + 0.75;
          poly([[x0, yb, z1], [x0, yb, d], [x0, yt, d], [x0, yt, z1]], sh([150, 25, 30], f));
          poly([[x0, yb, d], [x1, yb, d], [x1, yt, d], [x0, yt, d]], sh([196, 32, 38], f));
          poly([[x0 + 0.08, yb + 0.75, d - 0.01], [x1 - 0.22, yb + 0.75, d - 0.01], [x1 - 0.22, yt - 0.12, d - 0.01], [x0 + 0.08, yt - 0.12, d - 0.01]], '#dff4ff');
          for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const yy = yb + 0.85 + r * 0.22, xx = x0 + 0.13 + c * 0.14; poly([[xx, yy, d - 0.02], [xx + 0.08, yy, d - 0.02], [xx + 0.08, yy + 0.14, d - 0.02], [xx, yy + 0.14, d - 0.02]], ['#e74c3c', '#2e86c1', '#f1c40f', '#27ae60'][(r + c) % 4]); }
          poly([[x1 - 0.18, yb + 1.0, d - 0.01], [x1 - 0.06, yb + 1.0, d - 0.01], [x1 - 0.06, yb + 1.3, d - 0.01], [x1 - 0.18, yb + 1.3, d - 0.01]], '#222');
          poly([[x0, yb, d - 0.01], [x1, yb, d - 0.01], [x1, yb + 0.4, d - 0.01], [x0, yb + 0.4, d - 0.01]], sh([60, 10, 14], f));
          const [gx, gy] = P((x0 + x1) / 2, yb + 1.3, d); glow(gx, gy, Math.min(50, 1.2 * F / d), '200,235,255', 0.25);
        }
      } });
    });
    // panneaux suspendus « Sortie » / « Correspondance »
    const signs = [[-40, 'Sortie', '#1d3c8f', '#ffffff']];
    if (s.aff >= 1.3) signs.push([-8, 'Correspondances', '#e07a1a', '#ffffff']);
    signs.forEach(([off, label, bg, fg]) => {
      const d = s.pos + off - S.pos;
      if (d > NEAR + 1 && d < DMAX) list.push({ d, draw: d => {
        const [x0, y0] = P(3.0, 2.55, d), [x1, y1] = P(5.6, 2.1, d), [cx, cy] = P(4.3, 2.55, d), [, ty] = P(4.3, 3.6, d);
        g.fillStyle = '#555'; g.fillRect(Math.round(cx - 0.5), Math.round(ty), 1, Math.max(1, Math.round(y0 - ty)));
        g.fillStyle = '#e8e8e8'; g.fillRect(Math.round(x0) - 1, Math.round(y0) - 1, Math.round(x1 - x0) + 2, Math.round(y1 - y0) + 2);
        g.fillStyle = bg; g.fillRect(Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0));
        const hp = y1 - y0;
        if (x1 - x0 > 16 && hp > 3) { g.fillStyle = fg; g.textAlign = 'center'; g.font = `bold ${Math.max(5, Math.min(22, Math.round(hp * 0.75)))}px "Helvetica Neue", Arial, sans-serif`; g.fillText(label, cx, y0 + hp * 0.78, x1 - x0 - 2); }
      }});
    });
    const crowded = s.crowd || s.people.length > 45;
    s.people.forEach(pp => {
      const d = pp.p - S.pos;
      if (d > NEAR + 0.3 && d < DMAX) list.push({ d, draw: d => {
        const [sx, sy] = P(pp.x, yp, d);
        PL_F = Math.max(0.35, 1 - d / 260); PL_FOG = FOG_ST; JOSTLE = crowded ? 1 : 0;
        drawPerson(sx, sy, F / d, pp);
        PL_F = 1; JOSTLE = 0;
      } });
    });
  });
  bendSprites(list);
  return list.sort((a, b) => b.d - a.d);
}

function drawScene() {
  SIG_FLARES.length = 0;
  g.save();
  g.beginPath(); g.rect(0, 0, W, VIEW_H); g.clip();
  g.fillStyle = '#050507'; g.fillRect(0, 0, W, VIEW_H);
  CY = 72 + Math.round(Math.sin(S.t * 23) * Math.min(1, S.v / 14));
  // murs de fin de station vus depuis le quai
  STATIONS.forEach(s => {
    const d = s.pos + PE - S.pos;
    if (d > NEAR && d < DMAX) {
      const f = Math.max(0.35, 1 - d / 260);
      poly(ST_PROF.map(([x, y]) => [x, y, d]), sh(C.endWall, f));
    }
  });
  BZ = null;
  if (false) {
    const sp = STATIONS[S.next].pos, bd = S.v * S.v / (2 * 2.0);
    const inZone = sp - S.pos <= bd + 0.5;
    BZ = { from: sp - bd, to: sp, col: inZone ? [230, 70, 50] : [230, 140, 40], inZone };
  }
  buildCurv();
  const sprites = collectSprites(); let si = 0;
  const SV = swView(), GHw = SV && swGhost(), GH = GHw && { zB: zBof(GHw), off: GHw.set === 'G' ? BR : 0 };
  const xo = sp => !SV ? 0 : sp.gh ? SV.b : sp.cs || sp.d + S.pos < SV.zB - 0.01 ? SV.a : GH && sp.d + S.pos >= GH.zB - 0.01 ? SV.b + GH.off : SV.b;
  const pTop = Math.floor((S.pos + DMAX) / STEP) * STEP;
  for (let p1 = pTop; p1 - S.pos > NEAR; p1 -= STEP) {
    const p0 = p1 - STEP;
    const d1 = p1 - S.pos + 0.12, d0 = Math.max(p0 - S.pos, NEAR);
    const s = stationAt((p0 + p1) / 2);
    XOFF = SV ? (p0 >= SV.zB - 0.01 ? (GH && p0 >= GH.zB - 0.01 ? SV.b + GH.off : SV.b) : SV.a) : 0;
    if (s) { FOG = FOG_ST; stationSlice(s, p0, d0, d1, Math.max(0.35, 1 - d0 / 260)); }
    else { FOG = FOG_TUN; tunnelSlice(p0, d0, d1, Math.max(0.06, 1 - d0 / 150)); }
    while (si < sprites.length && sprites[si].d >= d0) { XOFF = xo(sprites[si]); sprites[si].draw(sprites[si].d); si++; }
  }
  while (si < sprites.length) { XOFF = xo(sprites[si]); sprites[si].draw(sprites[si].d); si++; }
  XOFF = 0;
  FOG = FOG_TUN;
  drawHeadlights();
  // feux des signaux par-dessus le halo des phares
  SIG_FLARES.forEach(([x, y, r, rgb, col]) => {
    glow(x, y, Math.max(7, r * 5), rgb, 0.55);
    g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(1.1, r), 0, 7); g.fill();
  });
  SIG_FLARES.length = 0;
  if (S.blackout && S.mode === 'running') {
    const flick = S.blackT < 1.4 ? (Math.random() < 0.55 ? 1 : 0.15) : 1;
    const dk = g.createRadialGradient(CX, CY + 46, 18, CX, CY + 30, 210);
    dk.addColorStop(0, `rgba(0,0,0,${0.25 * flick})`); dk.addColorStop(0.35, `rgba(0,0,0,${0.78 * flick})`); dk.addColorStop(1, `rgba(0,0,0,${0.93 * flick})`);
    g.fillStyle = dk; g.fillRect(0, 0, W, VIEW_H);
  }
  g.restore();
}

const FOG_TUN = [7, 8, 14], FOG_ST = [34, 30, 26];
// poussières en suspension éclairées par les phares (défilent avec la vitesse)
const DUST = Array.from({ length: 40 }, () => ({ x: Math.random() * 4.4 - 2.2, y: Math.random() * 3.6 - 1.8, z: 1 + Math.random() * 30 }));
let dustPos = 0;
function drawHeadlights() {
  const inSt = !!stationAt(S.pos + 6);
  // cône des phares : halo chaud au point de fuite de la voie
  if (!inSt) {
    const [vx, vy] = P(0, -1.2, 14);
    const gr = g.createRadialGradient(vx, vy + 10, 4, vx, vy + 30, 150);
    gr.addColorStop(0, 'rgba(255,232,180,0.10)'); gr.addColorStop(1, 'rgba(255,232,180,0)');
    const op = g.globalCompositeOperation; g.globalCompositeOperation = 'lighter';
    g.fillStyle = gr; g.fillRect(0, 0, W, VIEW_H);
    g.globalCompositeOperation = op;
  }
  // poussières
  const dz = S.pos - dustPos; dustPos = S.pos;
  g.fillStyle = inSt ? 'rgba(255,250,235,0.35)' : 'rgba(255,236,190,0.55)';
  DUST.forEach(p => {
    p.z -= dz; p.y -= 0.003; p.x += Math.sin(S.t * 0.7 + p.z) * 0.002;
    if (p.z < NEAR || p.y < -2 || dz < -5 || dz > 30) { p.z = 25 + Math.random() * 8; p.x = Math.random() * 4.4 - 2.2; p.y = Math.random() * 3.6 - 1.8; }
    const [sx, sy] = P(p.x, p.y, p.z), sz = Math.max(1 / RES, Math.min(1.5, 0.05 * F / p.z));
    const streak = Math.min(8, S.v * 0.04 * F / (p.z * p.z));   // traînée à grande vitesse
    const dx = (sx - CX) / Math.max(1, Math.hypot(sx - CX, sy - CY)), dy = (sy - CY) / Math.max(1, Math.hypot(sx - CX, sy - CY));
    if (streak > 0.8) { g.fillRect(sx, sy, sz, sz); g.fillRect(sx + dx * streak * 0.5, sy + dy * streak * 0.5, sz, sz); }
    else g.fillRect(sx, sy, sz, sz);
  });
}
