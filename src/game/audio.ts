/** Minimal Web Audio motifs — cough until first glass shatter, then silence of that motif. */

let ctx: AudioContext | null = null;
let coughTimer: number | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playCough() {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 120;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime;
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    o.start(t);
    o.stop(t + 0.2);
  } catch {
    /* audio optional */
  }
}

export function playGlassShatter() {
  try {
    const c = ac();
    const bufferSize = c.sampleRate * 0.4;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.value = 0.25;
    src.connect(g);
    g.connect(c.destination);
    src.start();
  } catch {
    /* optional */
  }
}

export function startCoughMotif(enabled: () => boolean) {
  stopCoughMotif();
  const tick = () => {
    if (enabled()) playCough();
    coughTimer = window.setTimeout(tick, 8000 + Math.random() * 9000);
  };
  coughTimer = window.setTimeout(tick, 4000);
}

export function stopCoughMotif() {
  if (coughTimer != null) {
    clearTimeout(coughTimer);
    coughTimer = null;
  }
}
