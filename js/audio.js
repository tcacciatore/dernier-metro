// Dernier Métro · Sons et musique
// ---------- Audio ----------
let AC = null, motor, motorGain, squeal, squealGain, rumbleGain, rumbleFilt, crowdGain, hissGain, whine, whineGain, railAcc = 0;
function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    motor = AC.createOscillator(); motor.type = 'sawtooth';
    const filt = AC.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
    motorGain = AC.createGain(); motorGain.gain.value = 0;
    motor.connect(filt).connect(motorGain).connect(AC.destination); motor.start();
    squeal = AC.createOscillator(); squeal.type = 'sine'; squeal.frequency.value = 1900;
    squealGain = AC.createGain(); squealGain.gain.value = 0;
    squeal.connect(squealGain).connect(AC.destination); squeal.start();
    // sifflement des moteurs de traction (rames sur pneus), qui monte avec la vitesse
    whine = AC.createOscillator(); whine.type = 'triangle'; whine.frequency.value = 200;
    const wf = AC.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 900; wf.Q.value = 0.8;
    whineGain = AC.createGain(); whineGain.gain.value = 0;
    whine.connect(wf).connect(whineGain).connect(AC.destination); whine.start();
    // bruits de fond en boucle : roulement dans le tunnel + brouhaha de quai
    const nb = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = (type, f, q) => { const src = AC.createBufferSource(); src.buffer = nb; src.loop = true; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gn = AC.createGain(); gn.gain.value = 0; src.connect(fl).connect(gn).connect(AC.destination); src.start(); return [gn, fl]; };
    [rumbleGain, rumbleFilt] = loop('lowpass', 160, 0.7);
    [crowdGain] = loop('bandpass', 650, 0.6);
    [hissGain] = loop('highpass', 3500, 0.5);
  } catch (e) { AC = null; }
}
// musique de l'écran d'accueil : boucle chiptune générée (basse qui roule, arpèges, batterie 8 bits)
let MUS = null;
function startMusic() {
  if (!AC || MUS) return;
  const out = AC.createGain(); out.gain.value = 0.0001; out.connect(AC.destination);
  out.gain.setTargetAtTime(0.55, AC.currentTime, 0.4);
  MUS = { out, step: 0, next: AC.currentTime + 0.12, timer: null };
  const sx = 60 / 140 / 4;                                       // une double croche à 140 BPM
  const f = n => 440 * Math.pow(2, (n - 69) / 12);
  const PROG = [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]];   // la m · fa · do · sol
  const MEL = [69, -1, 72, -1, 76, -1, 74, 72, 74, -1, 72, -1, 69, -1, -1, -1,
               65, -1, 69, -1, 72, -1, 74, 72, 69, -1, 65, -1, 67, -1, 69, -1,
               72, -1, 76, -1, 79, -1, 77, 76, 74, -1, 72, -1, 76, -1, -1, -1,
               74, -1, 71, -1, 67, -1, 71, 74, 79, -1, 77, -1, 76, -1, 74, -1];
  const tone = (fr, t, dur, type, vol, slide) => {
    const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(fr, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.02);
  };
  const hiss = (t, dur, vol, fr, type) => {
    if (!NOISE) { NOISE = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = AC.createBufferSource(); src.buffer = NOISE; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = fr;
    const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl).connect(gn).connect(out); src.start(t, Math.random()); src.stop(t + dur + 0.02);
  };
  const play = (i, t) => {
    const s16 = i % 16, ch = PROG[Math.floor(i / 16) % 4];
    if (s16 % 2 === 0) tone(f(ch[0] + (s16 % 4 === 2 ? 12 : 0)), t, sx * 1.7, 'triangle', 0.32);    // basse « roulement »
    if (s16 % 2 === 0) tone(f(ch[0] - 12 + (s16 % 4 === 2 ? 12 : 0)), t, sx * 1.2, 'square', 0.035);
    tone(f(ch[1 + s16 % 3] + 12), t, sx * 0.8, 'square', 0.018);                                       // arpège
    if (MEL[i] > 0) tone(f(MEL[i]), t, sx * 1.9, 'square', 0.05);                                      // mélodie
    if (s16 % 4 === 0) tone(150, t, 0.13, 'sine', 0.5, 40);                                            // grosse caisse
    if (s16 === 4 || s16 === 12) hiss(t, 0.12, 0.18, 1800, 'bandpass');                                // caisse claire
    if (s16 % 2 === 1) hiss(t, 0.035, 0.06, 7000, 'highpass');                                         // charleston
  };
  const tick = () => { if (!MUS) return; while (MUS.next < AC.currentTime + 0.15) { play(MUS.step, MUS.next); MUS.next += sx; MUS.step = (MUS.step + 1) % 64; } };
  MUS.timer = setInterval(tick, 25); tick();
}
function stopMusic() {
  if (!MUS) return;
  const m = MUS; MUS = null;
  m.out.gain.setTargetAtTime(0.0001, AC.currentTime, 0.15);
  setTimeout(() => { clearInterval(m.timer); m.out.disconnect(); }, 700);
}
function beep(freq, dur, type = 'square', vol = 0.05, delay = 0) {
  if (!AC) return;
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type; o.frequency.value = freq;
  const t = AC.currentTime + delay;
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn).connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
// sonnerie de départ : timbre électrique (marteau qui frappe ~25 fois/s)
function sfxBuzzer() {
  if (!AC) return;
  const t = AC.currentTime, dur = 2.0;
  [1180, 2360, 3540].forEach((f, k) => {
    const o = AC.createOscillator(); o.type = k ? 'sine' : 'square'; o.frequency.value = f;
    const am = AC.createGain(); am.gain.value = 0;
    const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 24;
    const lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg).connect(am.gain);
    const out = AC.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(k ? 0.025 : 0.05, t + 0.03);
    out.gain.setValueAtTime(k ? 0.025 : 0.05, t + dur - 0.05); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(am).connect(out).connect(AC.destination); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  });
}
// sirène d'alarme deux tons (aiguë / grave, 3 alternances par seconde) jouée avec la sonnerie de fermeture
function sfxDoorAlarm(dur = 2.0) {
  if (!AC) return;
  const t = AC.currentTime, o = AC.createOscillator(), out = AC.createGain();
  o.type = 'sawtooth';
  for (let k = 0; k * 0.17 < dur; k++) o.frequency.setValueAtTime(k % 2 ? 660 : 880, t + k * 0.17);
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
  out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.035, t + 0.03);
  out.gain.setValueAtTime(0.035, t + dur - 0.08); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(out).connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
// --- sons de portes (synthèse : air comprimé, glissement, claquement) ---
let NOISE = null;
function noise(dur, vol, type, freq, q = 1, delay = 0, attack = 0.01) {
  if (!AC) return;
  if (!NOISE) { NOISE = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const src = AC.createBufferSource(); src.buffer = NOISE;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const gn = AC.createGain(); const t = AC.currentTime + delay;
  gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + attack);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(gn).connect(AC.destination); src.start(t); src.stop(t + dur + 0.05);
  return f;
}
function sfxDoorsClosing() {
  noise(0.6, 0.3, 'highpass', 2500, 0.7);                   // "pschhh" pneumatique
  noise(0.35, 0.2, 'bandpass', 1200, 1.5, 0.05);
  const sl = noise(1.25, 0.16, 'bandpass', 420, 1.2, 0.1, 0.15); // glissement des vantaux
  if (sl) sl.frequency.linearRampToValueAtTime(260, AC.currentTime + 1.3);
  sfxDoorMelody();
}
// petite mélodie de fermeture des portes : carillon de trois notes descendantes, puis des bips doux
function bell(f, t, vol, dur = 0.9) {
  [[1, vol], [2.01, vol * 0.35], [3.0, vol * 0.12]].forEach(([m, v]) => {
    const o = AC.createOscillator(), gn = AC.createGain();
    o.type = 'sine'; o.frequency.value = f * m;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
    o.connect(gn).connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
  });
}
function sfxDoorMelody() {
  if (!AC) return;
  const t = AC.currentTime + 0.02;
  [[1175, 0], [988, 0.2], [784, 0.4], [988, 0.6]].forEach(([f, dt], i) => bell(f, t + dt, i === 3 ? 0.05 : 0.07, i === 3 ? 0.6 : 0.9));
  for (let i = 0; i < 3; i++) beep(1480, 0.06, 'sine', 0.025, 0.9 + i * 0.16);
}
const sfxDoor = () => {                                       // "ba-dam" des vantaux + verrouillage
  beep(85, 0.3, 'triangle', 0.35); noise(0.12, 0.45, 'lowpass', 900, 0.8);
  beep(70, 0.3, 'triangle', 0.3, 0.09); noise(0.1, 0.35, 'lowpass', 700, 0.8, 0.09);
  noise(0.18, 0.05, 'highpass', 4000, 0.7, 0.12);
};
function sfxDoorsOpening() {
  noise(0.5, 0.25, 'highpass', 2200, 0.7);
  noise(0.9, 0.14, 'bandpass', 360, 1.2, 0.08, 0.12);
  beep(70, 0.2, 'triangle', 0.15, 0.85);
}
function sfxDoorBump() { beep(95, 0.2, 'triangle', 0.25); noise(0.12, 0.3, 'lowpass', 700, 0.8); setTimeout(sfxDoorsOpening, 150); }
const sfxDing = () => { beep(660, 0.35, 'sine', 0.08); beep(880, 0.5, 'sine', 0.08, 0.18); };
const sfxBad = () => beep(130, 0.35, 'sawtooth', 0.06);
