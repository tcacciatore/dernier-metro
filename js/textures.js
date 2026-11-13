// Dernier Métro · Textures procédurales (béton, carrelage, ballast, dallage)
// Chaque texture est un calque de détail semi-transparent (joints, grain, taches), généré une fois au démarrage,
// posé par-dessus la couleur éclairée de chaque face. On ne l'applique qu'aux tranches proches : au loin elle
// s'estompe (pas de scintillement, et le rendu reste fluide).
const TEX = {};
const TEX_FAR = 42;   // au-delà (m), plus de texture
function makeTex(name, w, h, mU, mV, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  TEX[name] = { pat: g.createPattern(c, 'repeat'), w, h, mU, mV };   // mU × mV : taille réelle (m) d'un motif
}
// petit générateur pseudo-aléatoire déterministe (mêmes textures à chaque partie)
function texRand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// dessine une forme en la répétant sur les bords, pour que le motif se raccorde sans couture
const wrap = (w, h, x, y, r, fn) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) if (x + dx > -r && x + dx < w + r && y + dy > -r && y + dy < h + r) fn(x + dx, y + dy); };
function buildTextures() {
  if (TEX.concrete) return;
  // béton du tunnel : marbrures, piqûres, lignes de coffrage, fissures fines
  makeTex('concrete', 256, 256, 2, 2, (x, w, h) => {
    const r = texRand(7);
    for (let i = 0; i < 900; i++) { const px = r() * w, py = r() * h, s = 2 + r() * 10, dark = r() < 0.6;
      x.fillStyle = dark ? `rgba(0,0,0,${0.03 + r() * 0.06})` : `rgba(255,255,255,${0.02 + r() * 0.04})`;
      wrap(w, h, px, py, s, (a, b) => x.fillRect(a, b, s, s * (0.5 + r()))); }
    for (let i = 0; i < 260; i++) { const px = r() * w, py = r() * h; x.fillStyle = `rgba(0,0,0,${0.18 + r() * 0.2})`; x.fillRect(px, py, 1.2, 1.2); }
    x.fillStyle = 'rgba(0,0,0,0.07)'; for (let k = 0; k < 4; k++) x.fillRect(0, k * h / 4, w, 1.5);   // banches de coffrage
    x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) { let px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 7; k++) { px += (r() - 0.5) * 14; py += r() * 9; x.lineTo(px, py); } x.stroke(); }
  });
  // carrelage biseauté des stations : carreaux 15 × 7,5 cm, joints sombres, biseau clair en haut, ombre en bas
  makeTex('tiles', 160, 160, 0.6, 0.6, (x, w, h) => {
    const r = texRand(3), cu = 8, cv2 = 4, tw = w / cu, th = h / cv2;   // u : le long de la voûte (7,5 cm), v : le long du quai (15 cm)
    for (let i = 0; i < cu; i++) for (let j = 0; j < cv2; j++) {
      const X0 = i * tw, Y0 = j * th;
      x.fillStyle = `rgba(${r() < 0.5 ? '255,250,235' : '120,110,90'},${0.03 + r() * 0.05})`; x.fillRect(X0, Y0, tw, th);   // nuance du carreau
      const gr = x.createLinearGradient(X0, Y0, X0 + tw, Y0);
      gr.addColorStop(0, 'rgba(255,255,255,0.32)'); gr.addColorStop(0.18, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      x.fillStyle = gr; x.fillRect(X0, Y0, tw, th);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(X0 + tw * 0.2, Y0 + 2, tw * 0.25, th - 4);   // reflet de la glaçure
    }
    x.fillStyle = 'rgba(70,62,50,0.55)';
    for (let i = 0; i <= cu; i++) x.fillRect(i * tw - 0.8, 0, 1.6, h);
    for (let j = 0; j <= cv2; j++) x.fillRect(0, j * th - 0.8, w, 1.6);
    for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(80,70,50,${0.05 + r() * 0.08})`; x.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 3); }   // petites salissures
  });
  // ballast : gravillons clairs et sombres, avec leur ombre
  makeTex('ballast', 128, 128, 1, 1, (x, w, h) => {
    const r = texRand(11);
    for (let i = 0; i < 420; i++) { const px = r() * w, py = r() * h, s = 1.5 + r() * 3.5, lt = r();
      wrap(w, h, px, py, s * 2, (a, b) => {
        x.fillStyle = 'rgba(0,0,0,0.28)'; x.beginPath(); x.ellipse(a + 0.8, b + 0.9, s, s * 0.75, r() * 3, 0, 7); x.fill();
        x.fillStyle = lt > 0.55 ? `rgba(220,210,195,${0.18 + r() * 0.2})` : `rgba(20,16,14,${0.2 + r() * 0.25})`; x.beginPath(); x.ellipse(a, b, s, s * 0.75, r() * 3, 0, 7); x.fill(); }); }
  });
  // dallage du quai : grandes dalles de 60 cm, joints, mouchetis
  makeTex('platform', 128, 128, 1.2, 1.2, (x, w, h) => {
    const r = texRand(19);
    for (let i = 0; i < 600; i++) { x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.06 + r() * 0.1})` : `rgba(255,255,255,${0.04 + r() * 0.08})`; x.fillRect(r() * w, r() * h, 1, 1); }
    x.fillStyle = 'rgba(30,28,32,0.35)'; for (const k of [0, w / 2]) { x.fillRect(k - 0.6, 0, 1.2, h); x.fillRect(0, k - 0.6, w, 1.2); }
    for (let i = 0; i < 6; i++) { const gx = r() * w, gy = r() * h, gs = 6 + r() * 14, gr = x.createRadialGradient(gx, gy, 0, gx, gy, gs); gr.addColorStop(0, 'rgba(0,0,0,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(gx - gs, gy - gs, gs * 2, gs * 2); }
  });
}
// pose une texture sur la face (a → b dans le profil) entre les profondeurs d0 et d1.
// uOff : position (m) du point a le long du profil ; z0 : position de la tranche le long de la ligne (raccord entre tranches)
function texFace(a, b, d0, d1, name, alpha, uOff = 0, z0 = 0) {
  if (alpha <= 0.02 || d0 > TEX_FAR) return;
  if (!TEX.concrete) buildTextures();
  const T = TEX[name]; if (!T) return;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.01) return;
  const n = d0 < 2.5 ? 3 : d0 < 5 ? 2 : 1, dd = (d1 - d0) / n;   // près de la caméra, on recoupe pour limiter la déformation
  g.globalAlpha = Math.min(1, alpha);
  g.fillStyle = T.pat;
  for (let k = 0; k < n; k++) {
    const e0 = d0 + k * dd, e1 = e0 + dd;
    if (e1 <= NEAR) continue;
    const s0 = Math.max(e0, NEAR);
    const [ax, ay] = P(a[0], a[1], s0), [bx, by] = P(b[0], b[1], s0), [cx, cy] = P(a[0], a[1], e1), [qx, qy] = P(b[0], b[1], e1);
    const Ux = bx - ax, Uy = by - ay, Vx = cx - ax, Vy = cy - ay, dv = e1 - s0;
    const su = T.mU / T.w / len, sv = T.mV / T.h / dv;
    const uo = ((uOff % T.mU) + T.mU) % T.mU, vo = (((z0 + (s0 - d0)) % T.mV) + T.mV) % T.mV;
    T.pat.setTransform(new DOMMatrix([su * Ux, su * Uy, sv * Vx, sv * Vy, ax - Ux * uo / len - Vx * vo / dv, ay - Uy * uo / len - Vy * vo / dv]));
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(qx, qy); g.lineTo(cx, cy); g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
}
// longueur cumulée le long d'un profil (pour que la texture se raccorde d'une face à l'autre)
const profLen = prof => { const L = [0]; for (let i = 1; i < prof.length; i++) L.push(L[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1])); return L; };
const texFade = d => Math.max(0, Math.min(1, (TEX_FAR - d) / 18));   // fondu vers le lointain
