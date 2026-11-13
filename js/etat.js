// Dernier Métro · État de la partie, missions, barème et médailles
// ---------- État ----------
let S;
let BEST = 0, STARS = 0;
function loadBest() { try { BEST = +localStorage.getItem('dm_best_' + modeId(LN().id)) || 0; STARS = +localStorage.getItem('dm_stars') || 0; } catch (e) {} }
function saveBest() { try { localStorage.setItem('dm_best_' + modeId(LN().id), String(BEST)); localStorage.setItem('dm_mode', GM); localStorage.setItem('dm_stars', String(STARS)); localStorage.setItem('dm_line', String(LINE)); } catch (e) {} }
loadBest();

// ===== missions =====
const MISSION_POOL = [
  { id: 'combo3', label: "3 arrêts PARFAIT d'affilée", short: '3 PARFAIT de suite' },
  { id: 'retard0', label: 'Aucune arrivée avec plus de 5 s de retard', short: 'Zéro retard' },
  { id: 'vide', label: 'Vider le quai de {ST}', short: 'Quai vidé : {ST}' },
  { id: 'pax', label: 'Transporter N voyageurs', short: 'N voyageurs' },
  { id: 'clean', label: 'Aucune pénalité de toute la partie', short: 'Zéro pénalité' },
  { id: 'fluide', label: 'Trafic moyen sous 30 %', short: 'Trafic < 30 %' },
  { id: 'police', label: 'Faire descendre tous les individus suspects', short: 'Zéro pickpocket' },
  { id: 'precision5', label: '5 arrêts à moins de 1,5 m', short: '5 arrêts précis' },
];
function pickMissions() {
  const P = PERIODS[PER], pool = MISSION_POOL.filter(m => !(P.id === 'nuit' && m.id === 'police'));
  const out = P.id === 'nuit' ? [MISSION_POOL.find(m => m.id === 'police')] : [];
  while (out.length < 3) { const m = pick(pool); if (!out.includes(m)) out.push(m); }
  const pax = LN().pax, st = busiestStation();
  return out.map(m => ({ id: m.id, label: m.label.replace('N', pax).replace('{ST}', st), short: m.short.replace('N', pax).replace('{ST}', st), state: 'pending' }));
}
function mDone(id) {
  const m = S.missions.find(x => x.id === id); if (!m || m.state !== 'pending') return;
  m.state = 'done'; S.score += 150;
  [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.16, 'square', 0.04, i * 0.09));
}
function mFail(id) {
  const m = S.missions.find(x => x.id === id); if (!m || m.state !== 'pending') return;
  m.state = 'fail';
}
const keys = {};
function reset(mode) {
  speak(null);
  T0 = PERIODS[PER].t0; loadBest();
  buildLine();
  S = { mode, pos: 0, v: 0, clock: T0, cur: 0, next: 1, phase: 'dwell', doors: 1,
        alerted: false, buzzT: 0, msgs: [], score: 0, mp: [], t: 0, warnT: 0, hintT: 0, endT: -1,
        combo: 0, base: 0, pax: 0, paxOffer: 0, load: 0, cars: [0, 0, 0, 0, 0], blockers: [0, 1, 2, 3, 4].map(() => mkPerson(0, 0)), out: 0, trafSum: 0, trafT: 0, trafBonus: 0, trafShow: 0, trafDown: 0, trafLvl: -1, trafMsgT: 0, fullWarn: false, pops: [], fx: null, inc: null, limit: 0, overT: 0, sigPos: null, sigRed: 0, alarm: null, alarmAt: 0, newRecord: false, vacT: 35, vacAlert: 0, vacBeep: 0, radioT: 30, runners: 0, waves: 0, waveT: 0, over: null, missed: 0, trafWarn: false, trace: [], brakeF: 0, schedShow: 0, entryDelta: null, tickT: 0, tickHi: false, gap: 999, vperm: 99, gapT: 0, gapArmed: true, ebrake: false, person: null, dog: null, malaise: null, cab: null, dirtyCar: -1, dirtyKeep: false, cleanT: 0, medicT: 0, medicCar: 0, medicKind: 'medic', blackout: 0, blackT: 0, beepT: 0, secLost: 0, legPen: 0, rConfirm: 0, help: false, tuto: -1, tutoT: 0,
        missions: FIRE() ? [] : pickMissions(), missionShow: 0, fire: null, saved: 0, lost: 0, pstreak: 0, precCount: 0, suspects: [], caught: 0, suspectAt: -1, holderAt: -1, holderPending: false, radio: 0, holdT: 0, annonce: 0, annCd: 0, theft: null, unload: null, note: 0 };
  CAP = FIRE() ? 1e6 : 200; CAR_CAP = CAP / 5;   // fuite : aucune limite, on s'entasse ; seul le poids freine la rame
  if (FIRE()) S.fire = { z: -FIRE_START, v: 0, surge: false, safe: false, warn: 0, rumbleT: 0 };
  STATIONS[0].served = true;
  setupMirror(STATIONS[0]);
  planEvents(STATIONS[0]);
}

function msg(text, col = '#ffffff', life = 2.8) {
  const same = S.msgs.find(m => m.text === text);   // déjà affiché : on le prolonge au lieu de le doubler
  if (same) { same.t = 0; same.life = Math.max(same.life, life); return; }
  S.msgs.push({ text, col, life, t: 0 });
  if (S.msgs.length > 3) S.msgs.shift();
}
function pen(pts, text) {
  S.score += pts; S.secLost = (S.secLost || 0) - pts; S.legPen = (S.legPen || 0) + pts;
  const r = STATIONS[S.cur].res; r.pen += pts; r.inc.push(text);
  S.combo = 0;
  if (S.missions) mFail('clean');
  msg(text + ' (' + pts + ')', '#ff6b5b');
  sfxBad();
}

// ---------- Barème : 3 étoiles par station, sécurité, médailles ----------
const MEDALS_C = [[2000, 'BRONZE', '#d08a4a'], [4500, 'ARGENT', '#c8d0dc'], [8000, 'OR', '#ffd75e']];
const MEDALS_F = [[6000, 'BRONZE', '#d08a4a'], [12000, 'ARGENT', '#c8d0dc'], [18000, 'OR', '#ffd75e']];
const MEDS = () => FIRE() ? MEDALS_F : MEDALS_C;
const medalOf = sc => { let m = null; MEDS().forEach(x => { if (sc >= x[0]) m = x; }); return m; };
const nextMedal = sc => MEDS().find(x => sc < x[0]) || null;
// médailles par catégorie : 0 aucune, 1 bronze, 2 argent, 3 or
const CAT = [['PONCTUALITÉ', 'à l\'heure'], ['AIGUILLAGES', 'sans faute'], ['VOYAGEURS', 'servis et en sécurité']];
const catLevel = r => r === null ? -1 : r >= 0.95 ? 3 : r >= 0.75 ? 2 : r >= 0.5 ? 1 : 0;
const LVL = [null, ['BRONZE', '#d08a4a'], ['ARGENT', '#c8d0dc'], ['OR', '#ffd75e']];
function loadTop(id) { try { const a = JSON.parse(localStorage.getItem('dm_top_' + id) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function loadCat(id) { try { const a = JSON.parse(localStorage.getItem('dm_cat_' + id) || '[0,0,0]'); return Array.isArray(a) && a.length === 3 ? a : [0, 0, 0]; } catch (e) { return [0, 0, 0]; } }
function medalDot(x, y, lv, r = 4) {
  if (lv < 0) { txt('—', x, y + 3, 10, '#4a5468', 'center'); return; }
  g.fillStyle = lv ? LVL[lv][1] : '#2a3040'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  if (lv) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, 7); g.fill(); }
}
const secPct = () => Math.max(0, Math.round(100 - (S.secLost || 0) / 5));
