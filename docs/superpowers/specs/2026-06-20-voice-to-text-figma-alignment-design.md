# Voz a Texto — Figma "Speech to text WIP" alignment

**Date:** 2026-06-20
**Branch base:** `feature/vtt-edit-variant-c`
**Status:** Design — awaiting review

## Goal

Bring the Electron renderer's "Voz a Texto" (voice-to-text) screens into pixel/behaviour
alignment with the latest Figma design, section **"Speech to text WIP"**
(`figma node 40001343:39472` in file `UI AymurAI`, key `2BahKpebYzaccFih0ZB79y`).

This is an **audit-and-align polish pass**, not a rebuild. Exploration established that the
implementation is already ~80–90% aligned: the shared chrome, stepper, footer, layout
primitives, i18n strings, and the edit-mode side panel are all in place and already consume
`@aymurai/ui` components.

## Scope decisions (confirmed with stakeholder)

- **Repo scope: desktop-app only.** No changes to the `@aymurai/ui` library. It stays pinned
  at `github:AymurAI/ui-components#v0.2.1`; v0.2.1 is the source of truth for available
  components. See [[aymurai-ui-git-dep]].
- **Screen scope: all screens** in the Figma flow.
- **Approach: per-screen vertical slices** — each screen is audited, aligned, i18n-checked,
  and verified independently and is independently shippable.
- **Dashboard slice is audit-only** — the feature-selection home is shared across all
  features (Set de Datos, Anonimizador, Voz a Texto, PDF a Word), so any change there is
  kept minimal and must not regress the other features.

### Out of scope

- Any change to the `@aymurai/ui` library or its version.
- Transcription reducer / state-machine logic (`reducers/transcription/`).
- The transcription backend and `useTranscribe` data flow.
- New features beyond what the Figma frames show.

## Source of truth

The eight Figma frames are committed as PNGs under
`docs/superpowers/specs/assets/voice-to-text/`:

| File | Figma node | Screen |
|---|---|---|
| `00-overview.png` | `40001343:39472` | Whole "Speech to text WIP" section |
| `01-dashboard.png` | `40001343:48674` | Dashboard / tool selection |
| `02-seleccion-drop.png` | `40001343:48853` | Selección — empty drop zone |
| `03-seleccion-lista.png` | `40001343:48831` | Selección — selected-files list |
| `04a-process-waiting.png` | `40001343:48816` | Transcripción — waiting for first words |
| `04b-process-streaming.png` | `40002050:56841` | Transcripción — partial text streaming |
| `04c-process-completed.png` | `40002050:56340` | Transcripción — "Carga finalizada 100%" |
| `05-validation-read.png` | `40002322:57335` | Validación — read mode |
| `06-editor-edit.png` | `40002322:57366` | Modo Edición — edit mode + side panel |

When in doubt during implementation, re-pull a fresh frame via the Figma MCP
(`get_screenshot`) rather than trusting these snapshots, in case the design moved.

## Current architecture (relevant pieces)

- **Routing:** `routes/app.$feature/route.tsx` is the shared layout; each step is a file
  route (`onboarding`, `preview`, `process`, `validation`, `finish`). VTT components live in
  `components/voice-to-text/`.
- **Shared chrome (already Figma-aligned):**
  - `components/layout/header.tsx` — iso-logo + `| Voz a Texto` title, center stepper slot,
    right slot with `VoiceHowItWorksModal` (the `?` help) + `FeaturesMenu` (app-grid icon).
  - `components/voice-to-text/stepper.tsx` (`VoiceStepper`) — numbered circles, active-step
    label only, complete/active/future states matching the `@aymurai/ui` Stepper palette.
  - `components/layout/footer.tsx` (`Footer withBuiltBy`) — the "Plataforma hecha por
    datagéner" branding + a slot for the primary action.
  - `components/layout/main-content.tsx`, `ui/back-button`, `layout/section-title`.
- **i18n:** `constants/i18n/locales/es/voice-to-text.ts` — already complete and matching the
  Figma copy (including `completedLabel: "Carga finalizada 100%"`, drop-area copy, etc.).
- **`@aymurai/ui` already consumed:** `Button`, `Card`, `Player`, `Avatar`, `Switch`,
  `Dialog*`. v0.2.1 additionally ships unused primitives that may simplify a screen:
  `ArchiveProgress`, `ArchiveView`, `Stepper`, `Toolbar`, `Tag`, `Logo`, `StatusBar`,
  `BigIconButton`, `Callout`, `CheckCircle`, `Spinner`.

## Per-screen plan

Each screen is one vertical slice. The **delta lists below are working hypotheses** derived
from comparing the Figma frames to the current source; every one must be **confirmed against
a live screenshot** before editing, and re-confirmed after.

### Slice 0 — Verification harness (prerequisite)

Establish the loop used by every later slice:

1. Run the Electron renderer so each VTT route is reachable.
2. Capture the current render of each screen (and its sub-states).
3. Place current vs Figma side by side to read deltas.

Deliverable: a documented, repeatable command/route map for capturing each screen. If a
screen needs backend/transcription data to render (process, validation), document how to
reach it (fixtures / mock / sample transcript already present in repo:
`sample_transcript_deepgram.json`).

### Slice 1 — Dashboard (audit-only)

- Files: `routes/home/features.tsx` (+ whatever renders the tool cards).
- Figma: `01-dashboard.png` — four tiles (Set de Datos, Anonimizador, Voz a Texto,
  PDF a Word), each with icon, title, description; Voz a Texto tile shows the active/hover
  border. Centered `¡Hola! Selecciona la herramienta a utilizar` heading; datagéner footer.
- Hypothesis deltas: icon/copy/active-state parity only. **Do not** restructure; changes
  must not regress other features.

### Slice 2 — Selección de archivo (drop)

- Files: `components/voice-to-text/onboarding.tsx`, `file-drop.tsx`.
- Figma: `02-seleccion-drop.png` — `← 1. Selección de archivo`, large drop card with audio
  icon, copy "Selecciona el archivo que desea transcribir o arrástralo y suéltalo",
  formats line, primary "Cargar archivo" button in the footer.
- Hypothesis deltas: drop-card sizing/border, icon, footer button placement. Copy already
  in i18n (`onboarding.*`).

### Slice 3 — Selección de archivo (lista)

- Files: `components/voice-to-text/preview.tsx`.
- Figma: `03-seleccion-lista.png` — card "N archivo(s) seleccionado", file rows with square
  play button, name, `duration - size`, trash; footer "Siguiente".
- Hypothesis deltas: play-button styling (square highlighted), row border/spacing.
  Mostly aligned; likely smallest slice.

### Slice 4 — Transcripción (process)

- Files: `components/voice-to-text/process.tsx`.
- Figma: `04a/04b/04c` — title card "AymurAI está transcribiendo el archivo." + subtitle,
  filename + `%`/`Detener`, striped progress bar, scrollable partial-text area, info callout.
  Three states to verify: **waiting** ("Esperando las primeras palabras…"), **streaming**
  (text fills, `%`), **completed** ("Carga finalizada 100%" with check icon, full bar).
- Hypothesis deltas: completed-state check icon + label; bar styling; partial-text scroll
  container. Evaluate whether `@aymurai/ui` `ArchiveProgress` / `Callout` / `CheckCircle`
  cleanly replace the custom markup — adopt only if it matches Figma without contortions.

### Slice 5 — Validación (read mode) — verify-only

- Files: `components/voice-to-text/validation.tsx`, `transcription-editor/index.tsx` (read).
- Figma: `05-validation-read.png` — search bar, "Modo Edición" switch, transcript turns,
  Player + "Finalizar".
- Expectation: already aligned. Verify; fix only confirmed deltas.

### Slice 6 — Modo Edición (edit mode) — verify-only

- Files: `transcription-editor/` (`index.tsx`, `turn-block.tsx`, `turn-side-panel.tsx`,
  `editable-turn-text.tsx`, `selection-toolbar.tsx`, `speaker-picker.tsx`).
- Figma: `06-editor-edit.png` — side panel with Turno seleccionado, Personas sugeridas
  chips, Marca de tiempo, Acciones.
- Expectation: built in Variant C and aligned. Verify; fix only confirmed deltas.

### Slice 7 — Onboarding / "¿Cómo funciona?"

- Files: `components/voice-to-text/how-it-works.tsx` (`VoiceHowItWorksModal`,
  `VoiceHowItWorksGrid`).
- Figma: the two onboarding frames in the section (`40002158:43235` and the grid/modal
  shown bottom-left of the overview).
- Hypothesis deltas: the 4-step tutorial grid layout/cards and the modal trigger. Copy
  already in i18n (`howItWorks.*`).

## Cross-cutting conventions

- **Styling:** Panda CSS only (`@/styled/css`, `@/styled/jsx`); semantic tokens, no raw hex
  except via the `[bracket]` escape. No new Stitches usage. See `.claude/rules/panda-css.md`.
- **Components:** feature code imports `@aymurai/ui` for shared primitives and
  `@/components/ui/*` for Radix wrappers — never `@radix-ui/*` directly.
- **i18n:** all user-facing strings via `react-i18next` `voice-to-text` namespace; add keys
  rather than inlining; prune orphaned keys.
- **No scope creep:** touch only what a confirmed delta requires.

## Verification (per slice + final)

- Each slice: live screenshot before + after, diffed against the committed Figma PNG; the
  "after" must visibly match.
- `pnpm typecheck` and biome clean (pre-commit/pre-push gates: biome, panda codegen,
  forbidden-pattern grep, typecheck, knip).
- Existing tests still pass (`reducers/transcription/index.test.ts`,
  `transcription-editor/parse-timestamp.test.ts`,
  `voice-to-text/format-duration.test.ts`).
- No regression to non-VTT features from the Dashboard slice.

## Risks / open questions

- **Live rendering of process/validation** may need transcription data; the verification
  harness (Slice 0) must solve this before those slices, possibly via the existing
  `sample_transcript_deepgram.json` fixture.
- **Dashboard is shared** — kept audit-only to avoid cross-feature regressions; confirm
  whether stakeholder wants it in or fully out.
- **Figma drift** — committed PNGs are a 2026-06-20 snapshot; re-pull frames if the design
  may have changed.
