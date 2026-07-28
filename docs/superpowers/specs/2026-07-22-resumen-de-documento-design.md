# Resumen de Documento — technical plan (ui-components + desktop-app)

**Date:** 2026-07-22
**Status:** Design — awaiting review

## Goal

Plan the implementation of the "Resumen de Documento" (document summarization) flow
across two repos — `ui-components` (`@aymurai/ui`) and `desktop-app` — against the
Figma section **"Resumen de documento"** (`node 40002572:59713`, file
`2BahKpebYzaccFih0ZB79y`). This is a **planning pass**: identify what's new, what's
reused, and what's out of scope, so an implementation plan can be written next. No
code changes happen as part of this document.

Reference material: a throwaway, non-final prototype exists on branch
`feature/summarization-ui` in the `backend` repo (frontend-only diff — no real backend
code). It is used here only as a source for the assumed streaming contract and export
approach, never as an architecture to copy wholesale.

## Scope decisions (confirmed with stakeholder)

- **"Acortar"/"Alargar" (AI shorten/lengthen) toolbar actions**: excluded entirely from
  this iteration, including visually. No backend endpoint exists for this and none is
  designed here. Documented as a known gap vs. Figma and as future work, blocked on a
  new backend endpoint.
- **Entity-tag pills (`PERSONA_1`/`PERSONA_2`) over the summary text**: excluded
  entirely. Confirmed as a design inconsistency — this flow has no
  Anonimizador-style tag/annotation system and should not grow one.
- **Step 2 ("Resumiendo documento") has no progress bar/percentage.** The Figma
  frame's progress row is also a design inconsistency: summary generation time can't
  be predicted the way per-paragraph prediction or transcription duration can. The
  processing screen shows only an indeterminate loading state + streamed partial text
  + an info banner.
- **Dashboard/FeaturesMenu entries already exist, disabled** — this plan enables them
  rather than creating new ones (see "Dashboard/FeaturesMenu" below).
- **Rich text formatting (bold/italic/underline/highlight+color) is real and
  persisted**, not cosmetic, and must be compatible with the existing export
  pipeline: ODT generation (frontend, preserving formatting), PDF (existing
  `/convert/odt/pdf` backend endpoint), TXT (frontend, plain, no formatting).
- **Editor implementation: custom-built**, not a third-party library. A
  `contentEditable` surface driven by an in-house serializable marks model, so it maps
  directly onto ODT generation and doesn't add the first heavy editor dependency to
  `ui-components` (which today only depends on `@radix-ui/*`, `phosphor-react`,
  `react-hot-toast`).
- **Persistence**: mirrors Voice-to-Text's `asr_validation` pattern — one backend table
  keyed by document id holding file metadata, the generated summary, the edited
  summary, and timestamps. The backend endpoint does not exist yet; see "Persistence"
  below for how the frontend is built against it anyway without dead/commented code.

## Screen-by-screen map

| Figma screen | Reuse strategy |
|---|---|
| **Dashboard** (tool picker) | Existing, currently-disabled `CardTool` entry in `routes/home/features.tsx:124-130` becomes a `FeatureCardLink` like the other three. Rename `common:home.features.summaryTitle` from "Resumen de Documentos" (plural) to "Resumen de Documento" (singular, matches Figma). Requires adding `FeatureFlowEnum.Summarizer`. |
| **FeaturesMenu entry** | Existing, currently-disabled `FeaturesMenuItem` in `components/features-menu.tsx:75-79` moves into the `features.map` loop (enabled, wired to `goToFeature`). Label stays `common:featuresMenu.summary` = "Resumen" — intentionally short, unchanged. |
| **1. Selección de archivo** | Existing shared `DocumentOnboarding` (already branches Dataset/Anonimizador in `routes/app.$feature/onboarding.tsx`) gains a 3rd branch. No new component — converges with the in-flight `@aymurai/ui` v0.5.0 single-file redesign (`FileDropZone`, single-file enforcement). |
| **1bis. Previsualización** | Existing shared `DocumentPreview`/`FilePreview` (`ArchiveView` + `ArchiveRow`, single-file per the v0.5.0 redesign) gains the same 3rd branch. No new component. |
| **2. Resumiendo documento** | New `components/summarizer/summary-process.tsx`: indeterminate `Spinner` + live streaming text (`ScrollArea`) + info `Callout`. Structurally simpler than `voice-to-text/process.tsx` (no progress math), same streaming-mutation shape (`useSummarize` modeled on `useTranscribe`). |
| **3. Validación** | Left: read-only original document + search (new, small, trimmed-down — not `FileAnnotator`, see below). Right: new `RichTextEditor` (`ui-components`) hosting the editable summary + editable title. Biggest net-new surface in the plan. |
| **4. Finalización** | Two-column `Card`/`Grid`, closer to `finish-dataset`/`finish-anonimizador`'s shell than Voice-to-Text's finish. "Pre-visualización" reuses the same `RichTextEditor` in `readOnly` mode instead of a real PDF/DOCX rendering engine (none exists in the stack). Export options: single format `Select` (`.txt`/`.odt`/`.pdf`), no VTT-style switches. |
| ¿Cómo funciona? (1st/2nd time) | Existing `TutorialGrid`/`TutorialDialog`, unchanged. |

## Part 1 — `ui-components` (`@aymurai/ui`)

### `RichTextEditor` (new)

- **Responsibility**: editable rich-text surface — bold/italic/underline toggles plus
  a multi-color highlighter — backed by a small serializable marks model (blocks →
  runs of `{ text, marks }`), not raw HTML, so `desktop-app` can walk it to emit ODT
  and so a `readOnly` render can double as a document preview.
- **Screens**: Validación (editable), Finalización (`readOnly`, as the export preview).
- **Related existing components**: none directly — no rich-text/textarea/markdown
  component exists anywhere in the library or `desktop-app` today (verified). The
  closest analog is `voice-to-text/transcription-editor/editable-turn-text.tsx`, which
  solves a narrower per-turn `contentEditable` problem in `desktop-app`, not a
  reusable library primitive.
- **New vs. extension vs. composition**: new. Internally composes `Popover` (for the
  highlight color-swatch picker) and existing icon/button primitives; the
  `contentEditable` core and marks model are new.
- **Suggested API**: `value: RichTextDocument`, `onChange?(next: RichTextDocument)`,
  `readOnly?: boolean`, `highlightColors?: string[]` (token-mapped swatches),
  `title?`/`onTitleChange?` (the editable heading shown above the card in Figma).
- **Reuse consideration**: the same component instance covers both the editable
  Validación screen and the read-only Finalización preview — no second preview
  component needed, and this same idea is explicitly meant to extend later to Voice-to-
  Text's finish screen (which currently has no preview at all).
- **Dependencies/risks**: this is the single highest-risk item in the whole plan. The
  marks-model schema needs to be finalized once, carefully, before any downstream code
  (editor, ODT serializer, read-only preview) is written against it. `contentEditable`
  selection/undo/redo/paste handling has to be built by hand — flagged as real
  engineering effort, not boilerplate.

### Everything else: reused as-is, no `ui-components` changes needed

`Spinner`, `Callout`, `ScrollArea`, `Card`, `Select`, `Button`, `WorkflowStepLayout`,
`Stepper`, `ArchiveView`/`ArchiveRow`, `TutorialGrid`/`TutorialDialog`, `CardTool`,
`FeaturesMenuItem`, `Popover`.

### Explicitly not built

A generic `DocumentSearchPanel`/split-view primitive — the trimmed-down
original-document viewer (see Part 2) is thin enough to stay `desktop-app`-local for
now; promote it to `ui-components` only if a second consumer needs it later.

## Part 2 — `desktop-app`

### Routing

No new route files. `routes/app.$feature/{onboarding,preview,process,validation,finish}.tsx`
each gain a `FeatureFlowEnum.Summarizer` branch delegating to new
`components/summarizer/*` screen components — same shape the Dataset/Anonimizador/
Voice-to-Text branches already use.

### Original-document panel (Validación, left side)

Not a reuse of `FileAnnotator` — that component's whole reason for existing is
annotation/tag state this flow explicitly excludes. Extract just the
search/scroll-to-match behavior it depends on (`SearchBar` + match navigation) into a
small, new, read-only viewer. Kept `desktop-app`-local.

### State

New `context/Summary.tsx` (context + reducer), modeled on the reference branch's
version but built around `RichTextDocument` instead of markdown:

- `status: "idle" | "streaming" | "completed" | "error" | "stopped"`.
- `partialText: string` — raw streamed text for the live preview during step 2, before
  it's parsed into the marks model.
- `document: RichTextDocument` — the editable content once streaming completes,
  produced by parsing the LLM's final output into marks at the `token` → `summary`
  transition.
- `title: string`, editable, defaulting to `"Resumen {fileName}"`.

### `useSummarize` hook

Modeled on `useTranscribe` (stable key, deferred mutation kickoff to dodge StrictMode
double-mount, `abort()`), wrapping a new `summarizeStream` service function against
the SSE contract already defined frontend-side in the reference branch: one `meta`
event, many `token` events, one final `summary` event, over `POST
/llm/summarize/stream`. Same non-streaming fallback as the reference branch: fall back
to `POST /llm/summarize` only if the stream errors before any token arrived. SSE frame
parsing (`parseSseMessages`) ports from the reference branch's already-unit-tested
implementation.

**External/blocking dependency**: neither endpoint exists server-side today — only
this frontend-assumed contract does. This blocks real end-to-end testing of steps 2–3
until a backend track implements it (the `steps`/`chunks_used` shape implies
map-reduce chunking of long documents — a backend design question, not a frontend
one). The frontend can and should be built against a mock stream in the meantime
(same trick `USE_MOCK_STT` uses for transcription), so this is a parallelizable, not
strictly sequential, dependency.

### Persistence

Mirrors Voice-to-Text's `asr_validation` table shape: one row per document with file
metadata (id, filename, possibly extracted text), `generated_summary` (untouched LLM
output), `edited_summary` (user's edited version), `created_at`/`updated_at`. Exact
column list is a backend-track decision.

Frontend contract, adapter-based, to avoid stale commented-out code while the backend
doesn't exist yet:

- A typed interface, `SummaryValidationClient`, with `save(summary, signal?):
  Promise<void>` and `load(documentId, signal?): Promise<SummaryValidation | null>` —
  the same shape as today's `asrValidation.ts`.
- A **real** implementation (`services/aymurai/summaryValidation.ts`) written now
  against the anticipated route (`/summary/validation/document/:id`), following
  `asrValidation.ts`'s pattern exactly, even though the route isn't live yet.
- A **local/no-op implementation** (`noopSummaryValidationClient`, in-memory or
  `localStorage`-backed) satisfying the same interface, sufficient to develop and test
  Validación → Finalización end-to-end without a backend.
- One single selection point picks which implementation is active — flipping to the
  real backend later is a one-line change, not a search-and-uncomment.
- `Summary` context calls `summaryValidationClient.save(...)` the same way
  `validation.tsx` already calls `saveValidation()` for VTT today — call sites don't
  change when the adapter is swapped.

### Export pipeline

- **ODT**: built client-side by walking the `RichTextDocument`'s marks
  (bold/italic/underline/highlight+color) into ODT run properties — extends the
  reference branch's hand-written `formatters/odt.ts` XML-templating approach, keyed
  off the marks model instead of markdown.
- **PDF**: unchanged existing path — build the ODT, then `POST /convert/odt/pdf`
  (existing endpoint, existing `convertOdtToPdf`/`odtToPdf()` helper) — zero new
  backend work.
- **TXT**: client-side, strips all marks to plain paragraph text (trivial port of the
  reference branch's `formatters/txt.ts`, since TXT never carried formatting anyway).

### Error handling & navigation edge cases

- Stream error before any token received → silent fallback to non-streaming
  `/llm/summarize`. Stream error after partial text received → surface an error
  `Callout`, no fallback (would risk duplicating/conflicting with partial content).
- "Stop" mid-stream → `abort()`, status → `stopped`, offer retry rather than silently
  dropping partial text.
- Empty/near-empty extracted text (e.g. unOCR'd scanned PDF) reuses whatever error
  state `fileParser`/`preview.tsx` already renders for Dataset/Anonimizador — no new
  error UI invented.
- **Back navigation from Validación goes to Onboarding, not to Procesamiento** — going
  back to re-stream would waste the LLM call and discard in-progress edits; this
  mirrors "one document per cycle" from the v0.5.0 redesign. The `BackButton`'s
  destination needs to encode this per-step, not assume "previous URL segment."
  "Volver" from Finalización goes back to Validación with edits preserved (still in
  the reducer) — this one *is* a simple previous-step link.
- `RequireFile` already blocks direct URL access without a selected file; Validación
  additionally needs a "no completed summary yet" guard (today's guard only checks
  file presence), otherwise a deep link can land on an empty editor.
- Export failures (ODT build throws, or `/convert/odt/pdf` fails) must not hang
  silently — Dataset's finish screen has this exact bug open as a separate fix
  (v0.5.0 plan, Task 11); Summarizer should launch already avoiding it, not inherit it.

## Order of implementation

1. **Backend `/llm/summarize` + `/llm/summarize/stream`** — external track, uses the
   reference branch's contract as its spec. Blocking for real end-to-end testing of
   steps 2–3, but parallelizable against a mock stream. *Complexity: external/unknown.*
2. **`RichTextEditor` in `ui-components`** — no backend dependency, start immediately.
   Highest-complexity single piece (marks model, `contentEditable` selection handling,
   ODT-compatible serialization contract). *Complexity: high.*
3. **Dashboard/FeaturesMenu enablement** (rename + un-disable) — trivial, no
   dependencies, good first PR. *Complexity: trivial.*
4. **Onboarding/Preview 3rd branch** — low complexity; independent of the v0.5.0
   migration's landing order. *Complexity: low.*
5. **`Summary` context + `useSummarize` + SSE parsing** — buildable/testable against a
   mock stream before the real backend exists. *Complexity: medium.*
6. **Procesamiento screen** — depends on 5. *Complexity: low.*
7. **Validación screen** — depends on 2 + 5 + the new trimmed-down search/preview
   panel. *Complexity: high (most product surface in the plan).*
8. **Persistence adapter** (`SummaryValidationClient` + real/no-op implementations) —
   independent of the backend being ready; wire the no-op in from the start.
   *Complexity: low.*
9. **Export pipeline** (ODT/TXT client-side, PDF via existing endpoint) — depends on
   2's marks model being final. *Complexity: medium-high.*
10. **Finalización screen** — depends on 2 (read-only reuse) + 9. *Complexity: low
    once 2 and 9 exist.*

## Architecture decisions to resolve before coding starts

- Exact shape of `RichTextDocument` (block/run/mark schema) — everything downstream
  depends on getting this right once.
- Exact backend column list for the summary-validation table (frontend only needs the
  id-keyed save/load contract, not the schema itself).
- Whether the trimmed-down search/preview panel ever needs to move into
  `ui-components` (proposed: no, until a second consumer appears).

## Explicitly out of scope

- "Acortar"/"Alargar" AI rewrite actions and their backend endpoint.
- Entity-tag pills / any Anonimizador-style annotation system in this flow.
- A numeric progress indicator for step 2.
- A real PDF/DOCX rendering engine (the Finalización preview reuses the
  `RichTextEditor` instead).
