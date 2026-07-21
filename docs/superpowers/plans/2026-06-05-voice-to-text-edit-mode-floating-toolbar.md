# Voice-to-Text Edit Mode — Floating Toolbar (Variant B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Voice-to-Text *edit mode* (textarea swap + `SpeakerDialog` modal + `SuggestedSpeakersPanel`) with the **floating contextual toolbar** design ("Variant B") from the standalone prototype: in-place editable text, a per-turn floating toolbar (speaker control + timestamp / add / merge / delete) pinned to the active turn, and split-turn-by-text-selection.

**Architecture:** Edit mode is rendered by `transcription-editor/index.tsx` (gated by the existing `isEditMode` toggle). The READING (non-edit) view stays as-is. We add two reducer actions (`splitTurn`, `mergeTurnWithPrevious`), swap the turn body to `contentEditable`, add a text-selection→assign floating toolbar (split), and add a per-turn `TurnFloatingToolbar` (anchored top-right of the active turn) that consolidates speaker change, timestamp edit, add-below, merge-previous, and delete. There is **no right-hand panel** — the transcript uses full width. Everything reuses existing reducer actions, the `Transcription`/`Turn`/`Speaker` types, `SpeakerAvatar`, `AudioPlayer`, the `SUGGESTED_SPEAKERS` fixture, and Panda tokens.

**Tech Stack:** React 18, Panda CSS (`strictTokens`), Radix wrappers, i18next (`voice-to-text`), Zustand reducer context, Vitest. Design source of truth: `Voz a Texto - Editor (standalone).html` — the `__bundler/template` CSS (esp. the `variant B — floating contextual toolbar` block: `.vat-floatbar`, `.vat-floatbar .spk`, `.vat-fb`, `.vat-timepop`, `.vat-spkwrap`, `.vat-editbanner`) and the shared atoms in `core.jsx` (`useTranscript`, `SpeakerPicker`, `EditableText`, `SelectionToolbar`, `charOffset`). NOTE: the standalone app only rendered Variant C, so Variant B has CSS + shared atoms but **no reference JSX** — its behavior is reconstructed below from the CSS and icon set.

---

## Confirmed decisions (from product owner)

1. **Variant B** — floating per-turn contextual toolbar (NOT the side panel C, NOT the inline row-actions A).
2. **Remove** the `SpeakerDialog` modal and `SuggestedSpeakersPanel` — their functions move into the floating toolbar + speaker picker.
3. **Include** the new capabilities: split-turn-by-selection and merge-adjacent-turns.
4. **Deletion via the floating toolbar** ("Eliminar turno") — no separate per-row trash icon (as the prototype).
5. **Use our palette tokens** (`brand.primary` #3F479D, `bg.*`, `action.*`, `system.*`, etc.). Assume the prototype's raw colors (`--brand:#4a45cf`, periwinkle `--btn`, `--brand-deep`…) are NOT authoritative — map every prototype color to the nearest existing semantic token. Keep the app's `startMs`-based timestamps (prototype uses string `time`).

---

## What the floating toolbar contains (reconstructed from CSS + icon set)

For the **active turn** (the last turn the user clicked/focused), a floating toolbar (`.vat-floatbar`) is absolutely positioned at the turn's top-right and contains, in order:

- **Speaker control** (`.spk`): `SpeakerAvatar` (sm) + speaker label + caret. Click → toggles a `SpeakerPicker` popover anchored below it → change the turn's speaker (existing speaker, suggested role, or create new).
- a vertical divider (`.div`).
- **Timestamp** (`.vat-fb`, clock icon): toggles a small `.vat-timepop` popover (mm:ss input + save) → `updateTurnStartMs`.
- **Add below** (`.vat-fb`, plus icon): `insertTurn` a new empty turn after this one (same speaker).
- **Merge with previous** (`.vat-fb`, merge icon): `mergeTurnWithPrevious(activeId)`; disabled unless the previous turn has the same speaker.
- **Delete** (`.vat-fb danger`, trash icon): `removeTurn`.

Splitting a turn is done via **text selection** (the shared `SelectionToolbar`), not a toolbar button.

---

## File map

**New files**
- `src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.tsx` — `contentEditable` in-place text (commit on blur).
- `src/renderer/src/components/voice-to-text/transcription-editor/speaker-picker.tsx` — shared popover: existing speakers + suggested roles + create-new.
- `src/renderer/src/components/voice-to-text/transcription-editor/selection-toolbar.tsx` — `useSelectionAssign` hook + char-offset helper + floating "Asignar a…" toolbar (→ `splitTurn`).
- `src/renderer/src/components/voice-to-text/transcription-editor/turn-floating-toolbar.tsx` — per-turn floating contextual toolbar + timestamp popover.

**Modified files**
- `src/renderer/src/reducers/transcription/actions.ts` + `index.ts` — `splitTurn`, `mergeTurnWithPrevious` (Tasks 1–2).
- `src/renderer/src/components/voice-to-text/transcription-editor/index.tsx` — active-turn state, full-width edit body, render editable turns + selection toolbar; no right panel (Task 6).
- `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx` — `EditableTurnText`, header/wrap click selects the turn, render `TurnFloatingToolbar` when active; remove per-row trash + `SpeakerDialog` open-on-click (Task 6).
- `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts` — new toolbar/picker copy (Task 7).

**Removed (Task 8)**
- `transcription-editor/speaker-dialog.tsx`
- `transcription-editor/suggested-speakers-panel.tsx`
- `transcription-editor/add-turn-button.tsx` (the toolbar's "add below" replaces the inter-turn `+`; confirm during Task 6).

**Spec → Task coverage**

| Variant-B capability | Task(s) |
|---|---|
| Split turn by text selection | 1 (reducer), 4 (selection toolbar), 6 (wire) |
| Merge adjacent turns | 2 (reducer), 5 (toolbar action) |
| In-place editable text | 3 |
| Per-turn floating toolbar (speaker / timestamp / add / merge / delete) | 5 |
| Active-turn selection + toolbar anchoring | 6 |
| Copy | 7 |
| Remove modal + suggested panel + inter-turn `+` | 8 |
| Verification | 9 |

---

### Task 1: Reducer — `splitTurn`

Splits a turn's `[startChar, endChar)` text range into a new speaker: `pre` (original speaker) / `mid` (new speaker) / `post` (original speaker). Adapted from `splitTurn` in the prototype `core.jsx` to the app's `startMs`/`endMs` model.

**Files:** `reducers/transcription/actions.ts`, `index.ts`; test `index.test.ts`

- [ ] **Step 1: Write failing tests** (append to `index.test.ts`)

```ts
import { splitTurn } from "./actions";

describe("splitTurn", () => {
  const base = () => [{
    id: "t1", title: "T", audioFileName: "a", audioDurationMs: 9, audioObjectUrl: "b",
    createdAt: "c",
    speakers: [{ id: "s1", label: "Persona 1", initials: "P1", color: "primary" as const },
               { id: "s2", label: "Juez", initials: "JU", color: "secondary" as const }],
    turns: [{ id: "ta", speakerId: "s1", text: "hola mundo cruel", startMs: 1000, endMs: 5000 }],
  }];

  it("splits the middle range into a new speaker, pre/post keep the original", () => {
    const next = reducer(base(), splitTurn("t1", "ta", 5, 10, "s2")); // "mundo"
    const t = next[0].turns;
    expect(t.map((x) => x.text)).toEqual(["hola", "mundo", "cruel"]);
    expect(t.map((x) => x.speakerId)).toEqual(["s1", "s2", "s1"]);
    expect(t[0].startMs).toBe(1000); // pre keeps original start
  });

  it("reassigns the whole turn when the range covers all text", () => {
    const next = reducer(base(), splitTurn("t1", "ta", 0, 16, "s2"));
    expect(next[0].turns).toHaveLength(1);
    expect(next[0].turns[0].speakerId).toBe("s2");
  });

  it("is a no-op when the trimmed selection is empty", () => {
    const next = reducer(base(), splitTurn("t1", "ta", 4, 5, "s2")); // a space
    expect(next[0].turns).toHaveLength(1);
  });
});
```

Run `pnpm test src/renderer/src/reducers/transcription/index.test.ts` → FAIL.

- [ ] **Step 2: Action creator** (`actions.ts`) — add `SPLIT_TURN = "SPLIT_TURN"` to `ActionTypes` (after `INSERT_TURN`), plus:

```ts
export type SplitTurnAction = Action<
  ActionTypes.SPLIT_TURN,
  { transcriptionId: string; turnId: string; startChar: number; endChar: number; newSpeakerId: string }
>;
/**
 * Splits a turn's [startChar,endChar) text range into a new speaker. Text before
 * and after the range stays with the original speaker. If the range covers the
 * whole (trimmed) text, the turn is just reassigned. No-op if the trimmed range
 * is empty.
 */
export function splitTurn(
  transcriptionId: string, turnId: string, startChar: number, endChar: number, newSpeakerId: string,
): SplitTurnAction {
  return { type: ActionTypes.SPLIT_TURN, payload: { transcriptionId, turnId, startChar, endChar, newSpeakerId } };
}
```

- [ ] **Step 3: Reducer case** (`index.ts`) — import `type SplitTurnAction`, add to the union, add the case (use `crypto.randomUUID()` for new ids, consistent with `add-turn-button.tsx`):

```ts
    case ActionTypes.SPLIT_TURN: {
      const { transcriptionId, turnId, startChar, endChar, newSpeakerId } = payload;
      return updateTranscription(state, transcriptionId, (tr) => {
        const idx = tr.turns.findIndex((t) => t.id === turnId);
        if (idx < 0) return tr;
        const turn = tr.turns[idx];
        const pre = turn.text.slice(0, startChar).trim();
        const mid = turn.text.slice(startChar, endChar).trim();
        const post = turn.text.slice(endChar).trim();
        if (!mid) return tr;
        if (!pre && !post) {
          return { ...tr, turns: tr.turns.map((t) => (t.id === turnId ? { ...t, speakerId: newSpeakerId } : t)) };
        }
        const pieces: typeof tr.turns = [];
        if (pre) pieces.push({ ...turn, text: pre });
        pieces.push({ ...turn, id: crypto.randomUUID(), speakerId: newSpeakerId, text: mid });
        if (post) pieces.push({ ...turn, id: crypto.randomUUID(), text: post });
        return { ...tr, turns: [...tr.turns.slice(0, idx), ...pieces, ...tr.turns.slice(idx + 1)] };
      });
    }
```

Run tests → PASS. `pnpm typecheck` → 0.

- [ ] **Step 4: Commit** — `feat(voice-to-text): splitTurn reducer action`

---

### Task 2: Reducer — `mergeTurnWithPrevious`

Same as the Variant-C plan. Merge turn `id` into the previous turn (text joined by a space; `endMs` extended). No-op for the first turn.

**Files:** `actions.ts`, `index.ts`, `index.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { mergeTurnWithPrevious } from "./actions";

describe("mergeTurnWithPrevious", () => {
  const base = () => [{
    id: "t1", title: "T", audioFileName: "a", audioDurationMs: 9, audioObjectUrl: "b", createdAt: "c",
    speakers: [{ id: "s1", label: "P1", initials: "P1", color: "primary" as const }],
    turns: [
      { id: "a", speakerId: "s1", text: "uno", startMs: 0, endMs: 1000 },
      { id: "b", speakerId: "s1", text: "dos", startMs: 1000, endMs: 2000 },
    ],
  }];
  it("merges into the previous turn keeping its speaker/start, extending end", () => {
    const next = reducer(base(), mergeTurnWithPrevious("t1", "b"));
    expect(next[0].turns).toHaveLength(1);
    expect(next[0].turns[0].text).toBe("uno dos");
    expect(next[0].turns[0].startMs).toBe(0);
    expect(next[0].turns[0].endMs).toBe(2000);
  });
  it("is a no-op for the first turn", () => {
    expect(reducer(base(), mergeTurnWithPrevious("t1", "a"))[0].turns).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Action creator** — `MERGE_TURN_WITH_PREVIOUS`, payload `{ transcriptionId, turnId }`, creator `mergeTurnWithPrevious(transcriptionId, turnId)`.

- [ ] **Step 3: Reducer case**

```ts
    case ActionTypes.MERGE_TURN_WITH_PREVIOUS: {
      const { transcriptionId, turnId } = payload;
      return updateTranscription(state, transcriptionId, (tr) => {
        const i = tr.turns.findIndex((t) => t.id === turnId);
        if (i <= 0) return tr;
        const prev = tr.turns[i - 1], cur = tr.turns[i];
        const merged = {
          ...prev,
          text: `${prev.text.replace(/\s+$/, "")} ${cur.text.replace(/^\s+/, "")}`.trim(),
          endMs: Math.max(prev.endMs, cur.endMs),
        };
        return { ...tr, turns: [...tr.turns.slice(0, i - 1), merged, ...tr.turns.slice(i + 1)] };
      });
    }
```

Run tests → PASS. `pnpm typecheck` → 0.

- [ ] **Step 4: Commit** — `feat(voice-to-text): mergeTurnWithPrevious reducer action`

---

### Task 3: In-place editable turn text

Same as the Variant-C plan. Create `transcription-editor/editable-turn-text.tsx`: a memoized `contentEditable` div that commits `updateTurnText` on blur and emits selection events; reading mode keeps the `<p>` with search highlight (in `turn-block`).

- [ ] **Step 1: Create `EditableTurnText`** (Panda; map prototype `.vat-text.editable` to tokens — `&:hover { bg: "bg.primary" }`, `&:focus { bg: "bg.secondary"; boxShadow: "[0 0 0 1.5px token(colors.action.default)]" }`). Props `{ turnId, text, onCommit(turnId, value), onSelect() }`. `memo` comparator on `text`+`turnId` to protect the caret.

```tsx
import { memo, useRef } from "react";
import { css } from "@/styled/css";

const base = css({ fontSize: "[16px]", lineHeight: "[26px]", fontWeight: "[300]", color: "text.default", m: "[0]" });
const editable = css({
  outline: "none", rounded: "[8px]", px: "2", py: "1", mx: "[-8px]", cursor: "text",
  transition: "[background 140ms, box-shadow 140ms]",
  "&:hover": { bg: "bg.primary" },
  "&:focus": { bg: "bg.secondary", boxShadow: "[0 0 0 1.5px token(colors.action.default)]" },
});

interface Props { turnId: string; text: string; onCommit: (id: string, v: string) => void; onSelect: () => void; }
export const EditableTurnText = memo(function EditableTurnText({ turnId, text, onCommit, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`${base} ${editable}`} contentEditable suppressContentEditableWarning
      spellCheck={false} data-turn-id={turnId} role="textbox" tabIndex={0} aria-label="Texto del turno"
      onBlur={(e) => onCommit(turnId, e.currentTarget.textContent ?? "")}
      onMouseUp={onSelect} onKeyUp={onSelect}>
      {text}
    </div>
  );
}, (a, b) => a.text === b.text && a.turnId === b.turnId);
```

- [ ] **Step 2: typecheck/lint/commit** — `feat(voice-to-text): in-place editable turn text`

---

### Task 4: Selection → assign toolbar + speaker picker

Same as the Variant-C plan (these are shared atoms). Create `selection-toolbar.tsx` (`charOffset` + `useSelectionAssign` + `SelectionToolbar`) and `speaker-picker.tsx`.

- [ ] **Step 1: `charOffset` + `useSelectionAssign`** — port from the prototype, typed. Signature `useSelectionAssign(scrollRef, transcription, dispatch) → { sel, onSelect, clear, assign(spid) }`; `assign` dispatches `splitTurn(transcription.id, sel.turnId, sel.start, sel.end, spid)` then clears.

```ts
export function charOffset(container: Node, node: Node, offset: number): number {
  const r = document.createRange();
  r.selectNodeContents(container);
  try { r.setEnd(node, offset); } catch { return 0; }
  return r.toString().length;
}
```

- [ ] **Step 2: `SpeakerPicker`** (shared, used by the selection toolbar AND the floating toolbar's speaker control): popover listing existing `transcription.speakers` (check on current), then unused `SUGGESTED_SPEAKERS` (by label), then a "Nueva persona" inline-create row. `onPick(speakerId)` callback. For suggested/new it dispatches `addSpeaker(transcription.id, {id: crypto.randomUUID(), label, initials, color})` (compute `initials` via the existing helper, `color` by `speakers.length % palette`) then returns the id; existing returns its id. Close on outside pointerdown. Style maps `.vat-pop*` to tokens.

- [ ] **Step 3: `SelectionToolbar`** — dark floating bar at `sel.x/sel.y` (map `.vat-seltool` `#26244a` to a dark token or `[#26244a]` bracketed if no token), button "Asignar a…" → opens `SpeakerPicker` → `assign(spid)`.

- [ ] **Step 4: typecheck/lint/commit** — `feat(voice-to-text): text-selection speaker-assign toolbar`

---

### Task 5: Per-turn floating contextual toolbar (`TurnFloatingToolbar`)

The defining piece of Variant B. Create `transcription-editor/turn-floating-toolbar.tsx`.

**Files:** Create `turn-floating-toolbar.tsx`

- [ ] **Step 1: Build the toolbar** — props `{ transcription, turn, index }`. Absolutely positioned (`position:absolute; top:[-14px]; right:0; zIndex:30`) inside the (relatively-positioned) turn wrap. Map `.vat-floatbar` to Panda: white bg (`bg.secondary`), `border` token, rounded `[12px]`, padding `[5px]`, subtle shadow (`boxShadow:"[0 10px 30px rgba(28,26,60,.14)]"`). Contents:
  - **Speaker control** (`.spk` → a `<button>`): `<SpeakerAvatar speaker size="sm"/>` + `<span>{speaker.label}</span>` + caret icon. `onClick` toggles a `SpeakerPicker` popover anchored below; `onPick` → `dispatch(reassignTurnSpeaker(transcription.id, turn.id, speakerId))` (or the picker's create+assign).
  - divider (`.div`: `width:[1px]; height:6; bg: border color`).
  - **Timestamp button** (clock icon): toggles a `TimePopover` (below) — input `mm:ss` prefilled from `formatTime(turn.startMs)`, Save parses to ms (reuse the parse helper from `speaker-dialog.tsx` BEFORE deleting it in Task 8 — copy the `parseTimestamp` function into this file or a small util) → `dispatch(updateTurnStartMs(transcription.id, turn.id, ms))`; invalid → show `editor`/`timestampInvalid` hint.
  - **Add-below button** (plus icon): `dispatch(insertTurn(transcription.id, turn.id, { id: crypto.randomUUID(), speakerId: turn.speakerId, text: "", startMs: turn.startMs, endMs: turn.startMs }))`.
  - **Merge-previous button** (merge icon): `disabled={index === 0 || transcription.turns[index-1]?.speakerId !== turn.speakerId}`; onClick `dispatch(mergeTurnWithPrevious(transcription.id, turn.id))`.
  - **Delete button** (trash, danger styling — `&:hover { bg: system.error-secondary; color: system.error }`): `dispatch(removeTurn(transcription.id, turn.id))`.
  - Each icon button maps `.vat-fb` (32×32, rounded `[8px]`, transparent, hover `bg.primary`/`brand.primary`). `pointerdown` stopPropagation so the toolbar doesn't deactivate the turn or clear text selection.

- [ ] **Step 2: `TimePopover`** (in the same file) — maps `.vat-timepop`: small popover (input + save button); reuse parse logic; close on outside pointerdown. Use `mm:ss`/`hh:mm:ss` parsing identical to the current `speaker-dialog.tsx` (port `parseTimestamp`/format-back so behavior is preserved).

- [ ] **Step 3: typecheck/lint/commit** — `feat(voice-to-text): per-turn floating edit toolbar`

---

### Task 6: Wire Variant B into `TranscriptionEditor` + `turn-block`

**Files:** `transcription-editor/index.tsx`, `turn-block.tsx`

- [ ] **Step 1: `index.tsx`** (edit mode):
  - Keep `activeTurnId` state (repurpose the existing `selectedTurnId`).
  - Add a `scrollRef` on the scroll body; instantiate `useSelectionAssign(scrollRef, transcription, dispatch)`.
  - Render `<SelectionToolbar sel={sa.sel} ... />` inside the scroll container.
  - **Remove** `<SuggestedSpeakersPanel/>` and the right `content`/panel split — the edit body is now full-width (drop the `content` row wrapper's second column; the scroll area spans the width).
  - Pass to each `TurnBlock`: `isEditMode`, `isActive={turn.id === activeTurnId}`, `onActivate={() => setActiveTurnId(turn.id)}`, `onSelect={sa.onSelect}` (selection handler), `index`.
  - Reading mode unchanged.

- [ ] **Step 2: `turn-block.tsx`** (edit mode):
  - Body uses `EditableTurnText` (`onCommit` → `updateTurnText`, `onSelect` → the passed selection handler).
  - Clicking the turn (wrap or header) calls `onActivate` (sets active) — it no longer opens `SpeakerDialog`.
  - When `isActive`, render `<TurnFloatingToolbar transcription turn index />` inside the (relatively positioned) wrap.
  - **Remove** the per-row trash button and the `SpeakerDialog` usage entirely (deletion now lives in the floating toolbar).
  - Keep the active/selected left-bar emphasis (`active` variant) mapped to `brand.primary`. Ensure `.vat-turn` top spacing so the `top:-14px` toolbar doesn't clip (add a bit of top padding/margin to active turns if needed).
  - Reading mode `<p>` + search highlight unchanged.

- [ ] **Step 3: Verify** `pnpm panda codegen && pnpm typecheck` → 0; `pnpm test` → green. Manual: click a turn → floating toolbar appears top-right; change speaker via popover; edit timestamp; add-below; merge-previous (enabled only when prev same speaker); delete; edit text in place; select text → "Asignar a…" → split. Reading mode unchanged; unified footer + Finalizar intact.

- [ ] **Step 4: Commit** — `feat(voice-to-text): floating-toolbar edit mode with in-place editing and split/merge`

---

### Task 7: i18n copy

**Files:** `constants/i18n/locales/es/voice-to-text.ts`

- [ ] Add a `floatingToolbar` / `speakerPicker` / `selectionToolbar` block and remove keys orphaned by Task 8:
  - `floatingToolbar.changeSpeaker`: "Cambiar persona", `floatingToolbar.editTime`: "Editar marca de tiempo", `floatingToolbar.addBelow`: "Agregar turno debajo", `floatingToolbar.mergePrev`: "Unir con el turno anterior", `floatingToolbar.delete`: "Eliminar turno"
  - `floatingToolbar.timePlaceholder`: "mm:ss", `floatingToolbar.timeSave`: "Guardar", `floatingToolbar.timeInvalid`: "Formato inválido. Usá mm:ss o hh:mm:ss."
  - `speakerPicker.people`: "Personas", `speakerPicker.suggested`: "Sugeridos para la audiencia", `speakerPicker.newPerson`: "Nueva persona", `speakerPicker.newPersonPlaceholder`: "Nombre de la persona", `speakerPicker.create`: "Crear"
  - `selectionToolbar.assignTo`: "Asignar a…"
  - Keep `editor.editModeBanner`. Remove `speakerDialog.*`, `suggestedPanel.*`, and `editor.addTurn*`/`editor.removeTurnAria` if no longer referenced (verify with typecheck after Task 8).
- [ ] Commit — `i18n(voice-to-text): floating-toolbar edit-mode copy`

---

### Task 8: Remove superseded components

**Files:** delete `speaker-dialog.tsx`, `suggested-speakers-panel.tsx`, `add-turn-button.tsx` (confirm the last one is unused after Task 6).

- [ ] Ensure the timestamp parse helper was preserved (copied into `turn-floating-toolbar.tsx` or a util) BEFORE deleting `speaker-dialog.tsx`. Remove imports/usages, delete the files, remove orphaned i18n keys. If `assignSuggestedSpeakerToTurn` reducer action is now unused, leave it (harmless) or remove with its handling — decide by `pnpm knip`.
- [ ] `pnpm typecheck && pnpm knip` → no NEW unused-export warnings; `pnpm lint`.
- [ ] Commit — `chore(voice-to-text): remove modal dialog, suggested panel, inter-turn add button`

---

### Task 9: Verification

- [ ] `pnpm test` (split/merge + existing) → green; `pnpm typecheck` → 0; `pnpm knip` → exit 0; `pnpm lint` → no new errors.
- [ ] Manual walkthrough vs the prototype's Variant-B CSS intent: floating toolbar anchors to the active turn at top-right; speaker control popover (existing + suggested roles + new); timestamp popover; add-below; merge-previous gating; delete; in-place edit; select-to-split; active-turn left bar; reading mode + footer intact; all colors are app tokens (no #4a45cf etc.).
- [ ] Confirm no regressions elsewhere in the VTT flow.

---

## Self-review notes
- **Variant B specifically:** no side panel; the per-turn `TurnFloatingToolbar` is the hub (speaker / timestamp / add / merge / delete). Delete lives only in the toolbar (decision 4). Tasks 1–4 (reducers, editable text, selection/split, speaker picker) are shared with the C design and unchanged.
- **Colors:** every prototype color is mapped to an existing semantic token (decision 5); the only bracketed raw values allowed are where no token exists (e.g. the dark selection-toolbar surface) — flag those.
- **Caveat:** Variant B had no reference JSX in the standalone (only CSS + shared atoms), so its interaction details are reconstructed; validate against the CSS during implementation and adjust spacing/anchoring as needed.
- **Type consistency:** `splitTurn(transcriptionId, turnId, startChar, endChar, newSpeakerId)`, `mergeTurnWithPrevious(transcriptionId, turnId)`, `EditableTurnText {turnId,text,onCommit,onSelect}`, and `TurnFloatingToolbar {transcription, turn, index}` are referenced consistently across tasks.
- **Timestamp parse helper** must be preserved from `speaker-dialog.tsx` before deletion (Task 8 ordering).
- **Tests:** Vitest already configured; reducer tasks are TDD; UI verified by typecheck + manual.
```
