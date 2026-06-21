# Voz a Texto — Figma Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the renderer's "Voz a Texto" screens into alignment with the Figma "Speech to text WIP" section, consuming `@aymurai/ui` v0.2.1, with no library or backend changes.

**Architecture:** Audit-and-align polish pass in per-screen vertical slices. The shared chrome (Header, stepper, footer, layout primitives), i18n copy, and edit-mode side panel are already in place; each slice confirms a screen against its committed Figma reference, fixes only real deltas, and verifies via a live browser render plus typecheck/biome/tests.

**Tech Stack:** React 19, TanStack Router (file-based), Panda CSS (`strictTokens`), `@aymurai/ui` v0.2.1, react-i18next, Vitest, Biome, pnpm.

## Global Constraints

- **Package manager:** pnpm only. Never `npm install`.
- **`@aymurai/ui`:** pinned at `github:AymurAI/ui-components#v0.2.1`. Do NOT modify or upgrade it. Consume existing exports only.
- **Styling:** Panda CSS only (`@/styled/css`, `@/styled/jsx`). `strictTokens: true` — no raw hex except via `[bracket]` escape; prefer semantic tokens. No `@stitches/react` in new code.
- **Components:** import shared primitives from `@aymurai/ui`; Radix wrappers from `@/components/ui/*`; never `@radix-ui/*` directly. Do NOT add Tailwind as a dependency.
- **i18n:** all user-facing strings via the `voice-to-text` react-i18next namespace (`src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`). Add keys; don't inline. Prune orphans.
- **Out of scope:** `reducers/transcription/` logic, the transcription backend / `useTranscribe`, and any new feature beyond the Figma frames.
- **Figma source of truth:** file key `2BahKpebYzaccFih0ZB79y`, section `40001343:39472`. Committed PNG references under `docs/superpowers/specs/assets/voice-to-text/`. Re-pull a fresh frame via Figma MCP `get_screenshot` if the design may have drifted.
- **Pre-commit/push gates:** biome, panda codegen, forbidden-pattern grep (`console.log`, `debugger`, merge markers, `.only(`), then `pnpm typecheck` + `pnpm knip` on push. Every commit must pass these.
- **Don't paste Figma exports verbatim:** `get_design_context` output (Tailwind, absolute positioning, raw hex) is reference only — mine measurements + the appended hex→token map + asset URLs, then translate to Panda tokens + repo layout primitives.

## Route map (web dev server)

Run `pnpm dev:web` → server on `http://localhost:3000`. Feature slug is `voice-to-text`.

| Screen | URL | Figma node | Reference PNG |
|---|---|---|---|
| Dashboard | `/home/features` | `40001343:48674` | `01-dashboard.png` |
| Selección — drop | `/app/voice-to-text/onboarding` | `40001343:48853` | `02-seleccion-drop.png` |
| Selección — lista | `/app/voice-to-text/preview` | `40001343:48831` | `03-seleccion-lista.png` |
| Transcripción | `/app/voice-to-text/process` | `40001343:48816` / `40002050:56841` / `40002050:56340` | `04a/04b/04c` |
| Validación (read) | `/app/voice-to-text/validation` | `40002322:57335` | `05-validation-read.png` |
| Modo Edición | `/app/voice-to-text/validation` (toggle) | `40002322:57366` | `06-editor-edit.png` |
| Onboarding tutorial | `/app/voice-to-text/onboarding` (tutorial unseen) | `40002158:43235` | — (re-pull) |

**Baseline captures:** the repo's `screenshots/` dir already holds current-state renders (`001_onboarding.png`, `002_seleccion_de_archivos.png`, `003_proceso_de_archivos.png`, `editor.png`, `transcript-progress-100.png`, etc.) — use as the "before" reference.

---

### Task 0: Verification harness

Establish the render-and-diff loop every later task depends on. No source changes — this task's deliverable is a confirmed, documented way to render each screen and reach data-dependent ones.

**Files:**
- Modify: none (investigation + notes appended to this task's commit message / a scratch note if desired).

**Interfaces:**
- Produces: a known-good procedure for rendering each route and seeding files/transcription data, referenced by Tasks 1–7.

- [ ] **Step 1: Start the web dev server**

Run: `pnpm dev:web`
Expected: Vite serves on `http://localhost:3000`. Leave running in a background shell.

- [ ] **Step 2: Confirm static screens render**

Open `http://localhost:3000/home/features` and `http://localhost:3000/app/voice-to-text/onboarding`.
Expected: Dashboard and the drop screen render. If `/home/features` blocks on `APIProtected` (backend health), record exactly what is required to get past it (backend running, env var, or mock) — Tasks 4–6 need real data.

- [ ] **Step 3: Determine how to reach data-dependent screens**

The flow seeds state: onboarding (drop a file) → preview → process (transcribe) → validation. The repo has a sample audio file at the repo root (`Simulación de juicio oral - Robo y lesiones [KmLZnadGVbA].mp3`) and `sample_transcript_deepgram.json`.
Walk the flow with the sample audio and record: the exact steps to land on `/preview`, `/process` (each of waiting / streaming / completed), and `/validation` with data. If the backend is unavailable, document the fixture/mock path used instead.
Expected: a written sequence to render each of the three process states and the validation/editor screens.

- [ ] **Step 4: Capture the current baseline**

For each screen, capture the current render (browser screenshot) and place it beside the matching Figma PNG from `docs/superpowers/specs/assets/voice-to-text/`. The existing `screenshots/` dir is the starting baseline.
Expected: a side-by-side for every screen, ready to read deltas in Tasks 1–7.

- [ ] **Step 5: Record the procedure**

Note the route URLs, the data-seeding sequence, and any backend/mocking requirement (in the PR description or a scratch file). No commit required if no files changed.

---

### Task 1: Dashboard (audit-only)

**Files:**
- Modify: `src/renderer/src/routes/home/features.tsx`
- Reference: Figma `40001343:48674` (full screen) and `40001343:48682` (Card Tool), `docs/superpowers/specs/assets/voice-to-text/01-dashboard.png`

**Interfaces:**
- Consumes: `Card` (`@/components/ui/card`), `FeatureIcon`, `Header`, `MainContent`, `BuiltBy`, Panda `Grid`/`Stack`/`styled`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Pull the Figma reference**

Use Figma MCP `get_design_context` on node `40001343:48674` (and `40001343:48682` for the tile) with `excludeScreenshot: true`. Note the grid layout (2 columns × 2 rows), tile measurements (padding 32, gap 16, radius 4, icon box padding 14 / radius 14, icon 42), and the hex→token map (`bg/primary-alternative #E5E8FF`, `border/primary #BCBAB8`, `text/default #110041`, `text/lighter #625C68`).

- [ ] **Step 2: Diff current vs Figma**

Render `/home/features` and compare to `01-dashboard.png`. Confirmed delta: `features.tsx` uses `<Grid columns={3}>` but Figma is a **2×2** grid. Record any other deltas (tile padding/radius, icon container, heading spacing). Only act on confirmed deltas.

- [ ] **Step 3: Apply the grid fix (and any confirmed tile deltas)**

Change the grid to two columns, preserving the existing `rowGap`/`columnGap` and `CardTool` markup:

```tsx
<Grid columns={2} rowGap="6" columnGap="6">
```

Apply only other deltas you visually confirmed in Step 2 (e.g. tile padding/radius via the `Card`/`css` already in use), using semantic tokens — no raw hex. Do not restructure `CardTool` or touch other features' cards.

- [ ] **Step 4: Verify render**

Re-render `/home/features`. Expected: 2×2 tiles matching `01-dashboard.png`; Voz a Texto and the other three tiles unaffected functionally.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/routes/home/features.tsx
git commit -m "fix(vtt): dashboard tool grid 2x2 to match Figma"
```

---

### Task 2: Selección de archivo — drop zone

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/file-drop.tsx`, and `onboarding.tsx` only if the footer/title placement needs it.
- Reference: Figma `40001343:48853`, `docs/superpowers/specs/assets/voice-to-text/02-seleccion-drop.png`

**Interfaces:**
- Consumes: `VoiceFileDrop` (drop card), `Header`, `Footer`, `MainContent`, `BackButton`, `SectionTitle`, `Button` (`@aymurai/ui`), i18n `onboarding.*`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Pull the Figma reference**

`get_design_context` on `40001343:48853` (and the drop-card child node, read from `get_metadata` if needed), `excludeScreenshot: true`. Record drop-card size, border (dashed vs solid), radius, icon, internal spacing, and the token map.

- [ ] **Step 2: Diff current vs Figma**

Render `/app/voice-to-text/onboarding` with the tutorial already seen (drop view). Compare to `02-seleccion-drop.png`. List confirmed deltas (card height/border/icon, "Cargar archivo" button placement in footer). Copy is already in i18n (`onboarding.dropAreaTitle`, `onboarding.dropAreaFormats`, `onboarding.loadDocuments`).

- [ ] **Step 3: Apply confirmed deltas**

Edit `file-drop.tsx` with Panda tokens (translate the Figma measurements; use `border.primary`/`bg.*` tokens, `[bracket]` only for one-off pixel values). Keep the drag/drop behaviour and `HiddenInput` wiring intact.

- [ ] **Step 4: Verify render**

Re-render the drop view. Expected: matches `02-seleccion-drop.png`; file selection still works (clicking opens the picker; drag-drop still adds files).

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/voice-to-text/file-drop.tsx src/renderer/src/components/voice-to-text/onboarding.tsx
git commit -m "fix(vtt): align file drop zone to Figma"
```

---

### Task 3: Selección de archivo — lista

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/preview.tsx`
- Reference: Figma `40001343:48831`, `docs/superpowers/specs/assets/voice-to-text/03-seleccion-lista.png`

**Interfaces:**
- Consumes: `Card`, `Button` (`@aymurai/ui`), `useAudioSnippet`, `formatDuration`, i18n `preview.*`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Pull the Figma reference**

`get_design_context` on `40001343:48831` (and the file-row node), `excludeScreenshot: true`. Record the square play button (size, bg `bg/secondary-highlight`, radius), file-row border/spacing, and trash icon.

- [ ] **Step 2: Diff current vs Figma**

Render `/app/voice-to-text/preview` (with a file selected — see Task 0 procedure). Compare to `03-seleccion-lista.png`. The component is already close; list only confirmed deltas (play-button styling, row border width/colour, spacing).

- [ ] **Step 3: Apply confirmed deltas**

Edit `preview.tsx` `playButton`/`fileRow`/`removeButton` Panda recipes to the Figma values, using semantic tokens. Keep `useAudioSnippet` play/pause behaviour and remove-file wiring intact.

- [ ] **Step 4: Verify render**

Re-render `/preview`. Expected: matches `03-seleccion-lista.png`; play/pause snippet and trash still work; "Siguiente" disabled when no files.

- [ ] **Step 5: Run unit tests + typecheck + lint**

Run: `pnpm test src/renderer/src/components/voice-to-text/format-duration.test.ts && pnpm typecheck && pnpm lint`
Expected: PASS, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/voice-to-text/preview.tsx
git commit -m "fix(vtt): align selected-files list to Figma"
```

---

### Task 4: Transcripción (process) — three states

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/process.tsx`
- Reference: Figma `40001343:48816` (waiting), `40002050:56841` (streaming), `40002050:56340` (completed); `04a/04b/04c` PNGs.

**Interfaces:**
- Consumes: `Card`, `Button` (`@aymurai/ui`), `useTranscribe`, i18n `process.*` (incl. `completedLabel: "Carga finalizada 100%"`, `waitingForWords`, `callout`, `stop`, `replace`). Evaluate `@aymurai/ui` `Callout` / `CheckCircle` for the callout + completed check.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Pull the Figma reference**

`get_design_context` on the three process nodes (`excludeScreenshot: true`). Record: title/subtitle, the filename + `%` + `Detener` row, striped progress-bar colours, the scrollable partial-text container, the info callout, and the completed state's check icon + "Carga finalizada 100%".

- [ ] **Step 2: Diff current vs Figma for each state**

Render `/app/voice-to-text/process` and reach each state (Task 0 procedure): waiting → streaming → completed. Compare to `04a/04b/04c`. List confirmed deltas per state (e.g. completed-state check icon + label, bar styling, partial-text scroll area).

- [ ] **Step 3: Apply confirmed deltas**

Edit `process.tsx` with Panda tokens. If `@aymurai/ui` `Callout` and/or `CheckCircle` match the Figma callout/completed icon cleanly, adopt them; otherwise keep the existing markup aligned to tokens. Preserve `useTranscribe` status handling (`processing`/`completed`/`error`/`stopped`) and the abort/stop + replace flows.

- [ ] **Step 4: Verify each state**

Re-render and step through waiting → streaming → completed (and trigger error/stopped if reachable). Expected: each matches its PNG; Detener aborts; Reemplazar returns to selection.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/voice-to-text/process.tsx
git commit -m "fix(vtt): align transcription process states to Figma"
```

---

### Task 5: Validación (read mode) — verify, fix only confirmed deltas

**Files:**
- Modify (only if a delta is confirmed): `src/renderer/src/components/voice-to-text/validation.tsx`, `transcription-editor/index.tsx`, `turn-block.tsx`.
- Reference: Figma `40002322:57335`, `05-validation-read.png`.

**Interfaces:**
- Consumes: `Switch` (`@aymurai/ui`), `Player` via `AudioPlayer`, `Button`, i18n `editor.*` / `validation.*`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Diff current vs Figma**

Render `/app/voice-to-text/validation` in read mode (Modo Edición off) with transcription data. Compare to `05-validation-read.png`: search bar, "Modo Edición" switch, transcript turns, Player + "Finalizar". List any confirmed deltas; expect none/minor.

- [ ] **Step 2: Pull Figma reference only if a delta is found**

If Step 1 found a delta, `get_design_context` on `40002322:57335` for the exact values; otherwise skip to Step 5.

- [ ] **Step 3: Apply confirmed deltas (if any)**

Edit with Panda tokens, preserving search/highlight, edit-mode toggle, and Player wiring.

- [ ] **Step 4: Verify render**

Re-render read mode. Expected: matches `05-validation-read.png`; search highlights + navigation work; toggling Modo Edición opens edit mode.

- [ ] **Step 5: Typecheck + lint + tests**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS, no errors.

- [ ] **Step 6: Commit (skip if no changes)**

```bash
git add -A && git commit -m "fix(vtt): align validation read mode to Figma"
```

---

### Task 6: Modo Edición (edit mode) — verify, fix only confirmed deltas

**Files:**
- Modify (only if a delta is confirmed): `transcription-editor/turn-side-panel.tsx`, `index.tsx`, `turn-block.tsx`, `speaker-picker.tsx`, `selection-toolbar.tsx`.
- Reference: Figma `40002322:57366`, `06-editor-edit.png`.

**Interfaces:**
- Consumes: side-panel components, `SpeakerAvatar` (`Avatar`), i18n `sidePanel.*` / `speakerPicker.*` / `selectionToolbar.*`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Diff current vs Figma**

Render `/app/voice-to-text/validation` with Modo Edición on and a turn selected. Compare to `06-editor-edit.png`: Turno seleccionado, Personas sugeridas chips, Marca de tiempo, Acciones, empty state. List confirmed deltas; expect none/minor (built in Variant C).

- [ ] **Step 2: Pull Figma reference only if a delta is found**

If Step 1 found a delta, `get_design_context` on `40002322:57366` (and the side-panel child nodes) for exact values; otherwise skip to Step 5.

- [ ] **Step 3: Apply confirmed deltas (if any)**

Edit with Panda tokens, preserving chip reassignment, inline rename (`renameSpeakerGlobal`), timestamp commit (`updateTurnStartMs`), and the action buttons (merge/insert/remove) wiring.

- [ ] **Step 4: Verify render**

Re-render edit mode. Expected: matches `06-editor-edit.png`; selecting a turn drives the panel; chips/rename/timestamp/actions all function; selection-toolbar split still works.

- [ ] **Step 5: Typecheck + lint + tests**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: PASS (incl. `parse-timestamp.test.ts`, reducer tests), no errors.

- [ ] **Step 6: Commit (skip if no changes)**

```bash
git add -A && git commit -m "fix(vtt): align edit-mode side panel to Figma"
```

---

### Task 7: Onboarding / "¿Cómo funciona?"

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/how-it-works.tsx`
- Reference: Figma `40002158:43235` and the tutorial grid/modal in the section overview.

**Interfaces:**
- Consumes: `Dialog*`, `Button` (`@aymurai/ui`), i18n `howItWorks.*` (`pageTitle`, `modalTitle`, `gotIt`, `cards.card1..4`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Pull the Figma reference**

`get_metadata` on `40002158:43235` to find the tutorial-grid/modal nodes, then `get_design_context` on them (`excludeScreenshot: true`). Record the 4-step card grid layout and the modal trigger styling.

- [ ] **Step 2: Diff current vs Figma**

Render the onboarding tutorial (clear `tutorialSeen` for voice-to-text in local store so `VoiceHowItWorksGrid` shows) and open `VoiceHowItWorksModal`. Compare to the Figma frames. List confirmed deltas.

- [ ] **Step 3: Apply confirmed deltas**

Edit `how-it-works.tsx` with Panda tokens, keeping `Dialog` wiring and the grid/modal split (`VoiceHowItWorksGrid` + `VoiceHowItWorksModal`).

- [ ] **Step 4: Verify render**

Re-render the grid and modal. Expected: match Figma; modal opens/closes; "Entendido" dismisses.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/voice-to-text/how-it-works.tsx
git commit -m "fix(vtt): align how-it-works tutorial to Figma"
```

---

### Task 8: Final verification pass

**Files:**
- Modify: i18n file only if orphaned keys are found.

- [ ] **Step 1: Full flow walkthrough**

With `pnpm dev:web` running, walk the entire flow: Dashboard → onboarding (drop) → preview → process (all states) → validation (read) → edit mode → finish. Compare each against its Figma PNG. No unaddressed deltas.

- [ ] **Step 2: Prune orphaned i18n keys**

Check `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts` for keys no longer referenced after the edits. Remove any orphans.

Run: `pnpm knip`
Expected: no new unused exports/keys introduced.

- [ ] **Step 3: Full gate**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm knip`
Expected: all PASS.

- [ ] **Step 4: Commit any cleanup**

```bash
git add -A && git commit -m "chore(vtt): prune orphaned i18n keys after Figma alignment"
```

---

## Self-review notes

- **Spec coverage:** Slices 0–7 of the spec map to Tasks 0–7; final verification is Task 8. Dashboard is audit-only (Task 1). Figma-export-as-aid is embedded in each task's Step 1.
- **Data dependency risk:** Tasks 4–6 need transcription data; Task 0 Step 3 resolves the seeding/mock path before they run. If the backend is unreachable, the implementer documents the fixture path (`sample_transcript_deepgram.json`) used.
- **No library changes:** every task consumes existing `@aymurai/ui` v0.2.1 exports only.
- **Verification is visual + automated:** UI alignment is confirmed by side-by-side render vs the committed Figma PNG; correctness/regression by `pnpm test`/`typecheck`/`lint`/`knip`.
