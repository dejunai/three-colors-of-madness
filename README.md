# Three Colors of Madness — Chapter One: No Exit Wound

Playable browser vertical slice. Eldritch horror anti-CRPG. Thesis: **competence delays the end; never prevents it. Understanding is fatal.**

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Play loop

1. Title → **Accessibility** (before difficulty) → **Impossible** only (Easy/Normal/Hard greyed; clicking them glitches the UI on purpose)
2. Civic-reel prologue (fleet, contradictory accounts, insurance money — no bloodline)
3. Iris opens on the rose garden → Walter Corwin’s desk / case file
4. **Examine** locations, **consult** witnesses, **collect** evidence, **link** facts on the spine
5. Optional corkboard (Perception display — not a gate)
6. Diegetic **flask** (sip to cope; forced spill if hoarded — not a sanity bar)
7. Presentation degrades from hidden comprehension (aspect, hue, grain, vignette)
8. Ending: coroner’s note when understanding crosses the threshold — no decision screen; **case file survives**; reload OK

## Design Law compliance (brief)

| Law | How the slice honors it |
|-----|-------------------------|
| 1 Understanding is fatal | Hidden continuous comprehension ends the chapter; no “win by knowing less” meter |
| 2 No morality meter | Choices are procedural/investigative, not good/evil scored |
| 3 Coping honest | Flask is finite, visible as liquid, forced spill if hoarded |
| 4 Presentation can lie | Case-file wording drifts with severity; stable facts recoverable (esp. high legibility) |
| 5 Never explain own bits | No tutorial tooltips about “insanity systems” |
| 9 Accessibility first | Menu before difficulty; flicker, distortion intensity, clue legibility, reduce motion |
| 11 No hidden numeric coping meters in UI | No sanity/comprehension number; flask is diegetic fill only |
| 13 Optional play | Corkboard optional; completeness varies, ending still arrives |
| 14 Save/load | `localStorage` restore; reload from ending does not punish metaknowledge |

Insanity is **never** a UI meter — it is medium breakdown driven by a value the player never sees as a number.

## Stack

Vite + TypeScript + HTML/CSS (DOM UI). Content in `src/content/*.json`.

## Scope note

Vertical slice only: title → investigate → degrade → fatal understanding. No full town, combat, or tunnel depth.
