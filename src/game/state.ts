import { defaultState, GameState, SAVE_KEY } from './types';
import clues from '../content/clues.json';

type Listener = () => void;

let state: GameState = defaultState();
const listeners = new Set<Listener>();

export function getState(): GameState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function setState(partial: Partial<GameState>) {
  state = { ...state, ...partial };
  emit();
}

export function mutate(fn: (s: GameState) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  emit();
}

/** Raise perception + hidden comprehension. Perception is diegetic fuel; comprehension ends the chapter. */
export function gainUnderstanding(perceptionDelta: number, comprehensionMul = 1) {
  mutate((s) => {
    if (s.endingReached) return;
    s.perception += perceptionDelta;
    // Comprehension tracks understanding; flask temporarily softens presentation only via UI layer
    const raw = perceptionDelta * 0.85 * comprehensionMul;
    s.comprehension = Math.min(100, s.comprehension + raw);
    s.turn += 1;
    tickFlask(s);
    checkEnding(s);
  });
}

export function addFact(id: string, perception = 0) {
  mutate((s) => {
    if (!s.facts.includes(id)) {
      s.facts.push(id);
      if (perception > 0) {
        s.perception += perception;
        s.comprehension = Math.min(100, s.comprehension + perception * 0.85);
      }
      s.turn += 1;
      tickFlask(s);
      checkEnding(s);
    }
  });
}

export function addFacts(ids: string[], perception = 0) {
  mutate((s) => {
    let gained = false;
    for (const id of ids) {
      if (!s.facts.includes(id)) {
        s.facts.push(id);
        gained = true;
      }
    }
    if (gained && perception > 0) {
      s.perception += perception;
      s.comprehension = Math.min(100, s.comprehension + perception * 0.85);
      s.turn += 1;
      tickFlask(s);
      checkEnding(s);
    } else if (gained) {
      s.turn += 1;
      tickFlask(s);
    }
  });
}

function tickFlask(s: GameState) {
  s.flask.lastSpillMessage = null;
  if (s.flask.forcedSpillDone) return;
  // Hoarding: near-full flask unused for several investigative turns
  if (s.flask.sips >= 4) {
    s.flask.hoardTurns += 1;
  } else {
    s.flask.hoardTurns = 0;
  }
  if (s.flask.hoardTurns >= 5 && s.flask.sips >= 3) {
    const spill = Math.min(s.flask.sips, 2 + Math.floor(Math.random() * 2));
    s.flask.sips -= spill;
    s.flask.forcedSpillDone = true;
    s.flask.hoardTurns = 0;
    s.flask.lastSpillMessage =
      'The flask slips. Rye darkens the blotter. You did not choose this — the bottle did not outlast your thrift.';
  }
}

export function sipFlask(): string {
  let msg = '';
  mutate((s) => {
    if (s.flask.sips <= 0) {
      msg = 'Empty. The flask does not pretend otherwise.';
      return;
    }
    s.flask.sips -= 1;
    s.flask.hoardTurns = 0;
    // Honest coping: softens presentation pressure briefly by reducing effective distortion in UI;
    // does NOT reduce comprehension (understanding is not undone by drink).
    msg =
      s.flask.sips === 0
        ? 'Last swallow. Warmth without mercy. The file is still the file.'
        : 'A measured pull. Hands steadier. The facts do not soften.';
  });
  return msg;
}

function checkEnding(s: GameState) {
  const threshold = (clues as { endingThreshold: number }).endingThreshold;
  const spineReq = (clues as { spineRequired: string[] }).spineRequired;
  const spineHit = spineReq.filter((id) => s.linksMade.includes(id)).length;
  // Ending when comprehension crosses threshold OR spine is complete with high perception
  if (s.comprehension >= threshold || (spineHit >= 2 && s.perception >= 45 && s.comprehension >= threshold * 0.75)) {
    s.endingReached = true;
    s.caseFileSurvives = true;
    s.scene = 'ending';
  }
}

export function tryLink(linkId: string): { ok: boolean; message: string } {
  const link = (clues as { links: Array<{ id: string; requires: string[]; title: string; text: string; perception: number }> }).links.find(
    (l) => l.id === linkId,
  );
  if (!link) return { ok: false, message: 'Nothing connects.' };
  const s = getState();
  if (s.linksMade.includes(linkId)) return { ok: false, message: 'Already on the board.' };
  const missing = link.requires.filter((r) => !s.facts.includes(r));
  if (missing.length) return { ok: false, message: 'Not enough of the spine yet. The board waits.' };

  mutate((st) => {
    st.linksMade.push(linkId);
    st.perception += link.perception;
    st.comprehension = Math.min(100, st.comprehension + link.perception * 0.9);
    st.turn += 1;
    tickFlask(st);
    checkEnding(st);
  });
  return { ok: true, message: `${link.title}: ${link.text}` };
}

export function saveGame() {
  const s = getState();
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

export function loadGame(): boolean {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as GameState;
    state = { ...defaultState(), ...parsed };
    emit();
    return true;
  } catch {
    return false;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) != null;
}

export function newGame() {
  const accessibility = state.accessibility;
  state = { ...defaultState(), accessibility, scene: 'prologue' };
  emit();
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

/** Effective presentation degradation 0–1 — hidden comprehension × a11y intensity. Never shown as number. */
export function presentationSeverity(): number {
  const s = getState();
  const base = Math.min(1, s.comprehension / 100);
  const capped = base * s.accessibility.distortionIntensity;
  // Recent sip softens presentation only (last 2 turns after sip tracked via hoard reset — approximate with sips missing)
  const flaskEase = s.flask.sips < s.flask.maxSips && s.flask.hoardTurns === 0 ? 0.12 : 0;
  return Math.max(0, capped - flaskEase);
}
