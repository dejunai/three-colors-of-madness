import { getState, presentationSeverity } from '../game/state';

/** Apply medium breakdown from hidden comprehension — never a meter. */
export function applyDegradation(root: HTMLElement) {
  const sev = presentationSeverity();
  const s = getState();
  const a11y = s.accessibility;

  root.style.setProperty('--deg', String(sev));
  root.style.setProperty('--iris-vignette', String(0.15 + sev * 0.55));
  root.style.setProperty('--hue-shift', `${sev * (a11y.flickerReduction ? 8 : 25)}deg`);
  root.style.setProperty('--skew', a11y.reduceMotion ? '0deg' : `${sev * 1.2}deg`);
  root.style.setProperty('--grain', String(sev * (a11y.flickerReduction ? 0.15 : 0.45)));
  root.style.setProperty('--aspect-squeeze', String(1 - sev * 0.08));

  root.classList.toggle('deg-mild', sev > 0.15 && sev < 0.4);
  root.classList.toggle('deg-mid', sev >= 0.4 && sev < 0.7);
  root.classList.toggle('deg-hard', sev >= 0.7);
  root.classList.toggle('legibility-high', a11y.clueLegibility === 'high');
  root.classList.toggle('flicker-off', a11y.flickerReduction);
  root.classList.toggle('reduce-motion', a11y.reduceMotion);
}
