export type SceneId =
  | 'title'
  | 'accessibility'
  | 'difficulty'
  | 'prologue'
  | 'iris'
  | 'desk'
  | 'location'
  | 'witness'
  | 'corkboard'
  | 'ending';

export interface AccessibilitySettings {
  flickerReduction: boolean;
  distortionIntensity: number; // 0–1, player-facing intensity cap
  clueLegibility: 'standard' | 'high';
  reduceMotion: boolean;
}

export interface FlaskState {
  sips: number; // 0–5
  maxSips: number;
  hoardTurns: number; // consecutive turns without sipping while sips high
  forcedSpillDone: boolean;
  lastSpillMessage: string | null;
}

export interface GameState {
  scene: SceneId;
  locationId: string | null;
  witnessId: string | null;
  accessibility: AccessibilitySettings;
  difficultyLocked: true;
  /** Hidden continuous comprehension — NEVER shown as a number in UI */
  comprehension: number;
  perception: number;
  strength: number;
  facts: string[];
  collected: string[];
  linksMade: string[];
  examined: string[];
  consulted: string[];
  coat: 'badge' | 'plain';
  flask: FlaskState;
  coughHeard: boolean;
  glassShattered: boolean;
  prologueFrame: number;
  irisOpen: number; // 0–1
  endingReached: boolean;
  turn: number;
  caseFileSurvives: boolean;
}

export const SAVE_KEY = 'tcom-ch1-no-exit-wound';

export function defaultState(): GameState {
  return {
    scene: 'title',
    locationId: null,
    witnessId: null,
    accessibility: {
      flickerReduction: false,
      distortionIntensity: 0.7,
      clueLegibility: 'standard',
      reduceMotion: false,
    },
    difficultyLocked: true,
    comprehension: 0,
    perception: 0,
    strength: 3,
    facts: [],
    collected: [],
    linksMade: [],
    examined: [],
    consulted: [],
    coat: 'badge',
    flask: {
      sips: 5,
      maxSips: 5,
      hoardTurns: 0,
      forcedSpillDone: false,
      lastSpillMessage: null,
    },
    coughHeard: false,
    glassShattered: false,
    prologueFrame: 0,
    irisOpen: 0,
    endingReached: false,
    turn: 0,
    caseFileSurvives: true,
  };
}
