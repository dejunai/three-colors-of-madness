import prologue from '../content/prologue.json';
import witnesses from '../content/witnesses.json';
import locations from '../content/locations.json';
import clues from '../content/clues.json';
import {
  getState,
  setState,
  mutate,
  newGame,
  saveGame,
  loadGame,
  hasSave,
  addFacts,
  sipFlask,
  tryLink,
  presentationSeverity,
} from '../game/state';
import { playGlassShatter, startCoughMotif, stopCoughMotif } from '../game/audio';
import { applyDegradation } from './degradation';

type Witness = (typeof witnesses)[number];
type Location = (typeof locations)[number];

const factsData = clues.facts as Record<
  string,
  { id: string; title: string; stable: string; drift: string[] }
>;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (html != null) n.innerHTML = html;
  return n;
}

function glitchBrief(target: HTMLElement) {
  target.classList.add('ui-glitch');
  setTimeout(() => target.classList.remove('ui-glitch'), 420);
}

export function renderApp(app: HTMLElement) {
  const paint = () => {
    const s = getState();
    app.innerHTML = '';
    const shell = el('div', 'shell');
    applyDegradation(shell);

    const grain = el('div', 'grain-overlay');
    const vignette = el('div', 'vignette');
    shell.append(grain, vignette);

    switch (s.scene) {
      case 'title':
        shell.append(renderTitle());
        break;
      case 'accessibility':
        shell.append(renderAccessibility());
        break;
      case 'difficulty':
        shell.append(renderDifficulty());
        break;
      case 'prologue':
        shell.append(renderPrologue());
        break;
      case 'iris':
        shell.append(renderIris());
        break;
      case 'desk':
        shell.append(renderDesk());
        break;
      case 'location':
        shell.append(renderLocation());
        break;
      case 'witness':
        shell.append(renderWitness());
        break;
      case 'corkboard':
        shell.append(renderCorkboard());
        break;
      case 'ending':
        shell.append(renderEnding());
        break;
    }

    app.append(shell);
  };

  // Cough motif until glass shatter
  startCoughMotif(() => {
    const s = getState();
    return !s.glassShattered && s.scene !== 'title' && s.scene !== 'accessibility' && s.scene !== 'difficulty';
  });

  return paint;
}

function renderTitle(): HTMLElement {
  const wrap = el('section', 'screen title-screen');
  wrap.innerHTML = `
    <p class="eyebrow">Chapter One</p>
    <h1>THREE COLORS<br/>OF MADNESS</h1>
    <h2 class="subtitle">No Exit Wound</h2>
    <p class="tagline">Widow's Bight, 1923</p>
  `;
  const actions = el('div', 'actions');
  const start = el('button', 'btn primary', 'Continue');
  start.onclick = () => setState({ scene: 'accessibility' });
  actions.append(start);
  if (hasSave()) {
    const load = el('button', 'btn', 'Load Case File');
    load.onclick = () => {
      loadGame();
    };
    actions.append(load);
  }
  wrap.append(actions);
  return wrap;
}

function renderAccessibility(): HTMLElement {
  const s = getState();
  const wrap = el('section', 'screen menu-screen');
  wrap.innerHTML = `<h1>Accessibility</h1>
    <p class="menu-note">Configured before difficulty. Independent of challenge.</p>`;

  const form = el('div', 'form-stack');

  form.append(
    toggleRow('Flicker reduction', s.accessibility.flickerReduction, (v) =>
      mutate((st) => {
        st.accessibility.flickerReduction = v;
      }),
    ),
  );
  form.append(
    toggleRow('Reduce motion', s.accessibility.reduceMotion, (v) =>
      mutate((st) => {
        st.accessibility.reduceMotion = v;
      }),
    ),
  );

  const distLabel = el('label', 'field', 'Distortion intensity');
  const dist = el('input') as HTMLInputElement;
  dist.type = 'range';
  dist.min = '0';
  dist.max = '100';
  dist.value = String(Math.round(s.accessibility.distortionIntensity * 100));
  const distVal = el('span', 'field-val', `${dist.value}%`);
  dist.oninput = () => {
    distVal.textContent = `${dist.value}%`;
    mutate((st) => {
      st.accessibility.distortionIntensity = Number(dist.value) / 100;
    });
  };
  distLabel.append(dist, distVal);
  form.append(distLabel);

  const leg = el('label', 'field', 'Clue legibility');
  const sel = el('select') as HTMLSelectElement;
  sel.innerHTML = `<option value="standard">Standard</option><option value="high">High contrast</option>`;
  sel.value = s.accessibility.clueLegibility;
  sel.onchange = () =>
    mutate((st) => {
      st.accessibility.clueLegibility = sel.value as 'standard' | 'high';
    });
  leg.append(sel);
  form.append(leg);

  const next = el('button', 'btn primary', 'Confirm');
  next.onclick = () => setState({ scene: 'difficulty' });
  wrap.append(form, next);
  return wrap;
}

function toggleRow(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
  const row = el('label', 'field check');
  const cb = el('input') as HTMLInputElement;
  cb.type = 'checkbox';
  cb.checked = value;
  cb.onchange = () => onChange(cb.checked);
  row.append(cb, document.createTextNode(' ' + label));
  return row;
}

function renderDifficulty(): HTMLElement {
  const wrap = el('section', 'screen menu-screen');
  wrap.innerHTML = `<h1>Difficulty</h1>
    <p class="menu-note">Competence delays the end. It never prevents it.</p>`;
  const list = el('div', 'diff-list');
  for (const name of ['Easy', 'Normal', 'Hard'] as const) {
    const b = el('button', 'btn ghost disabled', name);
    b.onclick = () => glitchBrief(wrap);
    list.append(b);
  }
  const imp = el('button', 'btn primary', 'Impossible');
  imp.onclick = () => {
    newGame();
    setState({ scene: 'prologue' });
  };
  list.append(imp);
  wrap.append(list);
  const back = el('button', 'btn linkish', '← Accessibility');
  back.onclick = () => setState({ scene: 'accessibility' });
  wrap.append(back);
  return wrap;
}

function renderPrologue(): HTMLElement {
  const s = getState();
  const frames = prologue.frames;
  const frame = frames[Math.min(s.prologueFrame, frames.length - 1)];
  const wrap = el('section', 'screen prologue-screen');
  wrap.innerHTML = `
    <p class="eyebrow">${prologue.title}</p>
    <div class="reel-frame">
      <h2>${frame.caption}</h2>
      <p>${frame.body}</p>
    </div>
  `;
  const next = el('button', 'btn primary', s.prologueFrame >= frames.length - 1 ? 'Open the iris' : 'Next');
  next.onclick = () => {
    if (s.prologueFrame >= frames.length - 1) {
      setState({ scene: 'iris', irisOpen: 0 });
      animateIris();
    } else {
      setState({ prologueFrame: s.prologueFrame + 1 });
    }
  };
  wrap.append(next);
  return wrap;
}

function animateIris() {
  let t = 0;
  const step = () => {
    t += 0.02;
    const open = Math.min(1, t);
    setState({ irisOpen: open });
    if (open < 1) requestAnimationFrame(step);
    else setState({ scene: 'desk', locationId: 'rose_garden' });
  };
  requestAnimationFrame(step);
}

function renderIris(): HTMLElement {
  const s = getState();
  const wrap = el('section', 'screen iris-screen');
  const iris = el('div', 'iris');
  iris.style.setProperty('--open', String(s.irisOpen));
  iris.innerHTML = `
    <div class="iris-inner">
      <p class="card-line">THEY'RE IN THE ROSE GARDEN, OFFICER.</p>
      <p class="card-line muted">WHAT'S LEFT OF THEM.</p>
    </div>
  `;
  wrap.append(iris);
  return wrap;
}

function flaskHud(): HTMLElement {
  const s = getState();
  const f = el('div', 'flask-hud');
  const fill = (s.flask.sips / s.flask.maxSips) * 100;
  f.innerHTML = `
    <div class="flask-icon" title="Flask — honest coping. Not a sanity meter.">
      <div class="flask-fill" style="height:${fill}%"></div>
    </div>
    <button class="btn tiny" type="button" data-sip>Sip</button>
  `;
  f.querySelector('[data-sip]')!.addEventListener('click', () => {
    const msg = sipFlask();
    saveGame();
    const toast = document.querySelector('.toast');
    if (toast) toast.textContent = msg;
    // force repaint via mutate already emitted — parent subscribe handles
  });
  return f;
}

function renderDesk(): HTMLElement {
  const s = getState();
  const wrap = el('section', 'screen desk-screen');
  const header = el('header', 'desk-header');
  header.innerHTML = `<div>
      <p class="eyebrow">Walter Corwin — Beat Cop</p>
      <h1>Case File</h1>
    </div>`;
  header.append(flaskHud());

  const toast = el('div', 'toast');
  if (s.flask.lastSpillMessage) toast.textContent = s.flask.lastSpillMessage;

  const coat = el('div', 'coat-row');
  coat.innerHTML = `<span>Coat:</span>`;
  const badge = el('button', `btn tiny ${s.coat === 'badge' ? 'active' : ''}`, 'Police coat');
  const plain = el('button', `btn tiny ${s.coat === 'plain' ? 'active' : ''}`, 'Plain wool');
  badge.onclick = () => {
    setState({ coat: 'badge' });
    saveGame();
  };
  plain.onclick = () => {
    setState({ coat: 'plain' });
    saveGame();
  };
  coat.append(badge, plain);

  const cols = el('div', 'desk-cols');
  cols.append(renderCaseFilePanel(), renderVerbPanel(), renderPlacesPanel());

  const footer = el('footer', 'desk-footer');
  const cork = el('button', 'btn', 'Corkboard (optional)');
  cork.onclick = () => setState({ scene: 'corkboard' });
  const save = el('button', 'btn', 'Save');
  save.onclick = () => {
    saveGame();
    toast.textContent = 'Case file secured.';
  };
  footer.append(cork, save);

  // First glass shatter when comprehension first crosses ~25
  if (!s.glassShattered && s.comprehension >= 22) {
    mutate((st) => {
      st.glassShattered = true;
    });
    stopCoughMotif();
    playGlassShatter();
    toast.textContent = 'Somewhere a glass goes. Not metaphor. A crack in what holds.';
  }

  wrap.append(header, toast, coat, cols, footer);
  return wrap;
}

function factPresentation(id: string): { title: string; body: string } {
  const f = factsData[id];
  if (!f) return { title: id, body: '' };
  const sev = presentationSeverity();
  const s = getState();
  // Presentation can lie (drift wording) but stable spine recoverable; high legibility prefers stable
  if (s.accessibility.clueLegibility === 'high' || sev < 0.35 || !f.drift.length) {
    return { title: f.title, body: f.stable };
  }
  const idx = Math.min(f.drift.length - 1, Math.floor(sev * f.drift.length));
  // Occasionally flash stable under drift so facts remain recoverable
  if (Math.random() < 0.25) return { title: f.title, body: f.stable };
  return { title: f.title, body: f.drift[idx] };
}

function renderCaseFilePanel(): HTMLElement {
  const s = getState();
  const panel = el('div', 'panel case-file');
  const sev = presentationSeverity();
  panel.classList.toggle('file-warped', sev > 0.4);
  panel.innerHTML = `<h2>File</h2>`;
  if (!s.facts.length) {
    panel.append(el('p', 'muted', 'Empty of conclusions. Not empty of bodies.'));
  } else {
    const list = el('ul', 'fact-list');
    for (const id of s.facts) {
      const { title, body } = factPresentation(id);
      const li = el('li');
      li.innerHTML = `<strong>${title}</strong><span>${body}</span>`;
      list.append(li);
    }
    panel.append(list);
  }
  if (s.linksMade.length) {
    const links = el('div', 'links-made');
    links.innerHTML = `<h3>Connections</h3>`;
    for (const id of s.linksMade) {
      const L = clues.links.find((l) => l.id === id);
      if (L) links.append(el('p', 'link-card', `<strong>${L.title}</strong> — ${L.text}`));
    }
    panel.append(links);
  }
  // Strength is diegetic carry — shown only as coat/load flavor, not coping meter
  panel.append(
    el(
      'p',
      'stat-whisper',
      `Strength holds what you carry. Perception fills the board. Neither is a morality. Neither is insanity.`,
    ),
  );
  return panel;
}

function renderVerbPanel(): HTMLElement {
  const panel = el('div', 'panel verbs');
  panel.innerHTML = `<h2>Verbs</h2>
    <p class="muted">Examine · Collect · Link · Consult</p>`;
  const s = getState();

  const linkBox = el('div', 'link-box');
  linkBox.innerHTML = `<h3>Link</h3>`;
  for (const L of clues.links) {
    if (s.linksMade.includes(L.id)) continue;
    const ready = L.requires.every((r) => s.facts.includes(r));
    const b = el('button', `btn block ${ready ? '' : 'ghost'}`, ready ? L.title : `… ${L.title}`);
    b.disabled = !ready;
    b.onclick = () => {
      const res = tryLink(L.id);
      saveGame();
      const toast = document.querySelector('.toast');
      if (toast) toast.textContent = res.message;
    };
    linkBox.append(b);
  }
  if (![...clues.links].some((L) => !s.linksMade.includes(L.id))) {
    linkBox.append(el('p', 'muted', 'The spine is drawn.'));
  }
  panel.append(linkBox);
  return panel;
}

function renderPlacesPanel(): HTMLElement {
  const panel = el('div', 'panel places');
  panel.innerHTML = `<h2>Locations &amp; Witnesses</h2>`;
  const locList = el('div', 'place-list');
  for (const loc of locations as Location[]) {
    const b = el('button', 'btn block', loc.name);
    b.onclick = () => setState({ scene: 'location', locationId: loc.id });
    locList.append(b);
  }
  panel.append(locList);
  panel.append(el('h3', '', 'Witnesses'));
  const wList = el('div', 'place-list');
  for (const w of witnesses as Witness[]) {
    const b = el('button', 'btn block', `${w.name} — ${w.role}`);
    b.onclick = () => setState({ scene: 'witness', witnessId: w.id });
    wList.append(b);
  }
  panel.append(wList);
  return panel;
}

function renderLocation(): HTMLElement {
  const s = getState();
  const loc = (locations as Location[]).find((l) => l.id === s.locationId);
  const wrap = el('section', 'screen location-screen');
  if (!loc) {
    wrap.append(el('p', '', 'Nowhere.'));
    return wrap;
  }
  wrap.innerHTML = `<p class="eyebrow">Examine</p><h1>${loc.name}</h1><p class="blurb">${loc.blurb}</p>`;
  const list = el('div', 'examine-list');
  for (const ex of loc.examine) {
    const done = s.examined.includes(ex.id);
    const b = el('button', `btn block ${done ? 'done' : ''}`, done ? `✓ ${ex.label}` : ex.label);
    b.onclick = () => {
      const body = el('div', 'examine-result');
      body.innerHTML = `<p>${ex.text}</p>`;
      if (!done) {
        mutate((st) => {
          st.examined.push(ex.id);
          if (ex.collectible && !st.collected.includes(ex.collectible)) {
            st.collected.push(ex.collectible);
          }
        });
        addFacts(ex.facts, ex.perception);
        saveGame();
      }
      wrap.querySelector('.examine-result')?.remove();
      wrap.append(body);
    };
    list.append(b);
  }
  const back = el('button', 'btn', '← Desk');
  back.onclick = () => setState({ scene: 'desk', locationId: null });
  wrap.append(list, back, flaskHud());
  return wrap;
}

function renderWitness(): HTMLElement {
  const s = getState();
  const w = (witnesses as Witness[]).find((x) => x.id === s.witnessId);
  const wrap = el('section', 'screen witness-screen');
  if (!w) return wrap;
  wrap.innerHTML = `<p class="eyebrow">Consult</p><h1>${w.name}</h1><p class="muted">${w.role}</p>
    <p class="blurb">${w.examine}</p>`;

  const consult = w.consult;
  const needsCoat = 'requiresCoat' in consult && consult.requiresCoat;
  const coatOk = !needsCoat || s.coat === 'plain';

  const talk = el('button', 'btn primary', 'Consult');
  talk.onclick = () => {
    wrap.querySelector('.consult-result')?.remove();
    const box = el('div', 'consult-result');
    if (!coatOk) {
      box.innerHTML = `<p>In uniform he pours what you order and nothing more. The badge closes mouths.</p>`;
      wrap.append(box);
      return;
    }
    const lines = consult.lines.map((l) => `<p class="card-line">“${l}”</p>`).join('');
    box.innerHTML = lines;
    if ('observer' in consult && consult.observer) {
      box.innerHTML += `<p class="observer-note">Flat. Unbothered. Refusal of the tunnel mouth — staging without sermon.</p>`;
    }
    if (!s.consulted.includes(w.id)) {
      mutate((st) => {
        st.consulted.push(w.id);
      });
      addFacts(consult.facts, consult.perception);
      saveGame();
    }
    wrap.append(box);
  };

  const back = el('button', 'btn', '← Desk');
  back.onclick = () => setState({ scene: 'desk', witnessId: null });

  wrap.append(talk, back, flaskHud());
  if (needsCoat) {
    wrap.append(el('p', 'muted', 'Plain coat recommended.'));
  }
  return wrap;
}

function renderCorkboard(): HTMLElement {
  const s = getState();
  const wrap = el('section', 'screen cork-screen');
  wrap.innerHTML = `<p class="eyebrow">Optional</p><h1>Corkboard</h1>
    <p class="menu-note">Display of Perception — not a puzzle gate. Twine is memory, not a lock.</p>`;
  const board = el('div', 'corkboard');
  const names = ['WEXFORD', 'FENN', 'CORLISS', 'KESSLER', 'PRUITT', 'UNKNOWN MALE'];
  for (const n of names) {
    board.append(el('div', 'pin-card', n));
  }
  board.append(el('div', 'pin-card apart', 'UNIDENTIFIED FEMALE'));
  board.append(el('div', 'pin-card apart', 'UNIDENTIFIED MALE, MINOR'));
  for (const id of s.facts) {
    const f = factsData[id];
    if (f) board.append(el('div', 'pin-card fact', f.title));
  }
  for (const id of s.linksMade) {
    const L = clues.links.find((l) => l.id === id);
    if (L) board.append(el('div', 'pin-card link', L.title));
  }
  const back = el('button', 'btn primary', '← Desk');
  back.onclick = () => setState({ scene: 'desk' });
  wrap.append(board, back);
  return wrap;
}

function renderEnding(): HTMLElement {
  stopCoughMotif();
  const s = getState();
  const wrap = el('section', 'screen ending-screen');
  wrap.innerHTML = `
    <p class="eyebrow">Coroner's Note</p>
    <h1>No Exit Wound</h1>
    <div class="coroner-card">
      <p>Subject: Corwin, Walter — investigating officer.</p>
      <p>Cause: not for this office to name. The file does not end because the man did.</p>
      <p>He understood enough. Understanding is fatal. Competence only delayed the hour.</p>
      <p class="stamp">CASE FILE SURVIVES</p>
      <p class="muted">Eight dead were written. Six were published. The board remembers what the town filed away.</p>
      ${s.linksMade.includes('cult_six') ? '<p>They sought a mother. They found an ending.</p>' : ''}
      ${presentationSeverity() > 0.5 ? '<p class="distortion-stub">In the last frame the lens learns a face like Constance — not refuge. Distortion wearing care.</p>' : ''}
    </div>
  `;
  const actions = el('div', 'actions');
  const reload = el('button', 'btn primary', 'Reload case file');
  reload.onclick = () => {
    // Design Law 14: save/load restores state; don't punish metaknowledge
    if (hasSave()) loadGame();
    else {
      mutate((st) => {
        st.endingReached = false;
        st.scene = 'desk';
        st.comprehension = Math.min(st.comprehension, 40);
      });
    }
    // If save was ending, step back to desk with state intact (metaknowledge OK)
    mutate((st) => {
      if (st.endingReached) {
        st.endingReached = false;
        st.scene = 'desk';
      }
    });
    saveGame();
  };
  const title = el('button', 'btn', 'Title');
  title.onclick = () => setState({ scene: 'title' });
  const save = el('button', 'btn', 'Save surviving file');
  save.onclick = () => {
    saveGame();
  };
  actions.append(reload, save, title);
  wrap.append(actions);
  saveGame();
  return wrap;
}
