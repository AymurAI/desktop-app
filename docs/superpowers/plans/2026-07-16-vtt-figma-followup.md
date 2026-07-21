# VTT Figma Follow-up (desktop-app) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the current Voz a Texto (VTT) implementation and the Figma spec: fix three small visual/behavioral bugs, add bulk speaker-rename-with-scope + automatic "Persona N" renumbering, and rebuild the Finalización screen to match Figma (format select + content toggles wired to the export pipeline that already supports them).

**Architecture:** Six independent, sequential tasks touching existing files only — no new top-level modules. The UI bugs (Tasks 1, 2, 6) are one-line/one-block fixes. The bulk-rename feature (Task 4) adds a small local confirm dialog inside `turn-side-panel.tsx` plus a pure renumbering helper (Task 3) in the transcription reducer. The Finalización rewrite (Task 5) is a straight UI rebuild on top of the export pipeline (`ExportOptions`/`buildExportDocument`), which already supports everything the new UI needs — no changes to `services/export/*`.

**Tech Stack:** React + TypeScript, Panda CSS (`@/styled/css`, `@/styled/jsx`), Radix UI primitives wrapped under `@/components/ui/*`, `@aymurai/ui` v0.4.1, i18next, Vitest + React Testing Library.

## Global Constraints

- Package manager is pnpm; do not run `npm install`.
- Panda `strictTokens: true` — any arbitrary value (e.g. an exact pixel width) must use the `[bracket]` escape syntax.
- Feature code imports Radix primitives only via `@/components/ui/*`, never `@radix-ui/*` directly.
- All new user-facing strings go in `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`, referenced via `useTranslation("voice-to-text")` — no hardcoded Spanish strings in components.
- Do not touch `src/renderer/src/services/export/**` — the `ExportOptions`/`buildExportDocument` pipeline already implements everything Task 5 needs (`includeSpeakers`/`includeTimestamps` default `true`, prefix stripped correctly when off).
- Every task ends green on `pnpm vitest run <changed test files>` before moving to the next task.
- Follow the existing test convention in this codebase: `useTranslation` is mocked as `(key) => key` in component tests (see `turn-side-panel.test.tsx`), so assertions match i18n **keys**, not Spanish copy.

---

## Task 1: Voz a Texto home icon

**Files:**
- Modify: `src/renderer/src/constants/config.ts:1-2,41`

**Interfaces:** None — pure constant swap, no new interfaces.

- [ ] **Step 1: Swap the icon import and mapping**

In `src/renderer/src/constants/config.ts`, change the import and the `FEATURE_ICON` entry:

```ts
import { Database, Detective, FileAudio, type Icon } from "phosphor-react";
```

```ts
export const FEATURE_ICON: Record<FeatureFlowEnum, Icon> = {
  [FeatureFlowEnum.Dataset]: Database,
  [FeatureFlowEnum.Anonymizer]: Detective,
  [FeatureFlowEnum.VoiceToText]: FileAudio,
};
```

(`Microphone` import is removed entirely — nothing else in this file uses it.)

- [ ] **Step 2: Verify visually**

Run `pnpm dev`, open the home/features screen, confirm the Voz a Texto card now shows the file-audio glyph (matches `file-drop.tsx`'s icon, and Figma node `40000451-94565`).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/constants/config.ts
git commit -m "fix(home): use FileAudio icon for Voz a Texto, matching Figma"
```

---

## Task 2: "¿Cómo funciona de Voz a Texto?" badge alignment

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/how-it-works.tsx:70-96`

**Interfaces:** None — internal JSX restructure of `VoiceHowItWorksGrid`, same props/exports.

**Context:** In Figma (node `40002158:43364`, steps `40002158:43246`/`43254`/`43262`/`43270`), the numbered badge sits **above** the title+subtitle column — badge and text share the same left edge; the illustration is a separate element to their left. The current code puts the badge and the title/subtitle column side-by-side in an `HStack`, which is what reads as "desalineado" when a title wraps to two lines. The sibling **generic** `how-it-works.tsx` (used by Dataset/Anonymizer, at `src/renderer/src/components/how-it-works.tsx:46-56`) already uses the correct pattern — copy it.

- [ ] **Step 1: Restructure the card to stack the badge above the text column**

In `src/renderer/src/components/voice-to-text/how-it-works.tsx`, replace the `VoiceHowItWorksGrid` card body:

```tsx
export function VoiceHowItWorksGrid() {
  const { t } = useTranslation("voice-to-text");
  return (
    <Grid columns={2} rowGap="4" columnGap="4">
      {CARD_KEYS.map((key, i) => (
        <div key={key} className={card}>
          <img
            src={CARD_IMAGES[key]}
            alt={t(`howItWorks.cards.${key}.title`)}
            className={cardImg}
          />
          <Stack gap="4" minWidth="0">
            <span className={stepBadge}>{i + 1}</span>
            <Stack gap="1" minWidth="0">
              <styled.h3 textStyle="paragraph.sm.strong">
                {t(`howItWorks.cards.${key}.title`)}
              </styled.h3>
              <styled.p textStyle="paragraph.sm.default" color="text.lighter">
                {t(`howItWorks.cards.${key}.subtitle`)}
              </styled.p>
            </Stack>
          </Stack>
        </div>
      ))}
    </Grid>
  );
}
```

(Only the outer `HStack` → `Stack` swap and dropping `alignItems="flex-start"`/`flex="1"` — those were compensating for the side-by-side layout and no longer apply. `HStack` import in this file becomes unused if nothing else in the file uses it — check before removing the import.)

- [ ] **Step 2: Check the `HStack` import**

```bash
grep -n "HStack" src/renderer/src/components/voice-to-text/how-it-works.tsx
```

If the only remaining reference is the one inside the header `<HStack justify="space-between">` (title + close button), keep the import — it's still used there. Otherwise remove it from the `@/styled/jsx` import line.

- [ ] **Step 3: Verify visually**

Run `pnpm dev`, open the VTT "¿Cómo funciona?" modal (help `?` icon in `VoiceHeader`), confirm each of the 4 cards now shows the numbered badge directly above its title, both left-aligned under the badge — matching the Figma screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/voice-to-text/how-it-works.tsx
git commit -m "fix(vtt): stack step badge above title in how-it-works modal"
```

---

## Task 3: Renumber "Persona N" speakers after a global rename

**Files:**
- Modify: `src/renderer/src/reducers/transcription/index.ts:1-2,44-59,115-150`
- Test: `src/renderer/src/reducers/transcription/index.test.ts` (append)

**Interfaces:**
- Produces: `export function renumberPersonaSpeakers(speakers: Speaker[]): Speaker[]` from `src/renderer/src/reducers/transcription/index.ts` — pure function, no dependency on dispatch/transcriptionId. Consumed internally by the `RENAME_SPEAKER_GLOBAL` reducer case; Task 4 does **not** need to call this directly (it dispatches `renameSpeakerGlobal`, which already renumbers).

**Context:** `computeInitials` already exists in this file (`Persona 2` → `P2`). Auto-generated speaker labels always match `Persona \d+` (see `handleNewPerson` in `turn-side-panel.tsx` and `normalizeSpeakerLabel` in `asrMapper.ts`). After any rename that removes or relabels a `Persona N` speaker (either the plain-relabel branch or the collision-merge branch of `RENAME_SPEAKER_GLOBAL`), the remaining `Persona N` speakers must be renumbered so there's no gap — e.g. if `Persona 1` becomes `Jueza`, `Persona 2` becomes `Persona 1`. Custom-named speakers (`Jueza`, `Fiscal`, ...) are never touched.

- [ ] **Step 1: Write the failing tests**

Append to `src/renderer/src/reducers/transcription/index.test.ts`:

```ts
describe("renameSpeakerGlobal renumbering", () => {
  const baseSpeakers = () => [
    { id: "s1", label: "Persona 1", initials: "P1", color: "violet" as const },
    { id: "s2", label: "Persona 2", initials: "P2", color: "green" as const },
    { id: "s3", label: "Jueza", initials: "JU", color: "red" as const },
  ];
  const baseTurns = () => [
    { id: "turn1", speakerId: "s1", text: "a", startMs: 0, endMs: 100 },
    { id: "turn2", speakerId: "s2", text: "b", startMs: 100, endMs: 200 },
  ];

  it("renumbers remaining Persona speakers after a plain rename", () => {
    const state = [
      makeTranscription({ speakers: baseSpeakers(), turns: baseTurns() }),
    ];
    const next = reducer(state, renameSpeakerGlobal("t1", "s1", "Fiscal"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s2")).toMatchObject({
      label: "Persona 1",
      initials: "P1",
    });
    expect(speakers.find((s) => s.id === "s3")?.label).toBe("Jueza");
  });

  it("renumbers remaining Persona speakers after a merge-collision rename", () => {
    const state = [
      makeTranscription({
        speakers: [
          { id: "s1", label: "Persona 1", initials: "P1", color: "violet" as const },
          { id: "s2", label: "Persona 2", initials: "P2", color: "green" as const },
          { id: "s3", label: "Fiscal", initials: "FI", color: "red" as const },
        ],
        turns: baseTurns(),
      }),
    ];
    // "Persona 1" collides with the existing "Fiscal" speaker -> merges s1
    // into s3 and drops s1, leaving a gap that s2 must fill.
    const next = reducer(state, renameSpeakerGlobal("t1", "s1", "Fiscal"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s1")).toBeUndefined();
    expect(speakers.find((s) => s.id === "s2")?.label).toBe("Persona 1");
  });

  it("leaves numbering untouched when no gap is created", () => {
    const state = [
      makeTranscription({ speakers: baseSpeakers(), turns: baseTurns() }),
    ];
    const next = reducer(state, renameSpeakerGlobal("t1", "s3", "Defensor/a"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s1")?.label).toBe("Persona 1");
    expect(speakers.find((s) => s.id === "s2")?.label).toBe("Persona 2");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/renderer/src/reducers/transcription/index.test.ts`
Expected: FAIL — `s2` still shows `Persona 2` (no renumbering logic exists yet).

- [ ] **Step 3: Add the renumbering helper**

In `src/renderer/src/reducers/transcription/index.ts`, update the type-only import at the top to include `Speaker`:

```ts
import type { Speaker, Transcription } from "@/types/transcription";
```

Add this function right after `computeInitials` (after line 59):

```ts
const PERSONA_LABEL_RE = /^Persona (\d+)$/;

/**
 * Renumbers auto-generated "Persona N" labels so they stay contiguous
 * (1, 2, 3, ...) after a rename/merge relabels or drops one of them.
 * Speakers with a custom label (anything not matching "Persona N") are
 * left untouched.
 */
export function renumberPersonaSpeakers(speakers: Speaker[]): Speaker[] {
  const personaSpeakers = speakers
    .filter((s) => PERSONA_LABEL_RE.test(s.label))
    .sort((a, b) => {
      const aNum = Number(a.label.match(PERSONA_LABEL_RE)?.[1]);
      const bNum = Number(b.label.match(PERSONA_LABEL_RE)?.[1]);
      return aNum - bNum;
    });

  const nextLabelById = new Map(
    personaSpeakers.map((s, i) => [s.id, `Persona ${i + 1}`]),
  );

  return speakers.map((s) => {
    const nextLabel = nextLabelById.get(s.id);
    if (!nextLabel || nextLabel === s.label) return s;
    return { ...s, label: nextLabel, initials: computeInitials(nextLabel) };
  });
}
```

- [ ] **Step 4: Wire it into the `RENAME_SPEAKER_GLOBAL` case**

Replace the `RENAME_SPEAKER_GLOBAL` case body (lines 115-150):

```ts
    case ActionTypes.RENAME_SPEAKER_GLOBAL: {
      const { transcriptionId, speakerId, newLabel } = payload;
      return updateTranscription(state, transcriptionId, (t) => {
        const trimmed = newLabel.trim();
        if (!trimmed) return t;

        // If another speaker already uses this label (case-insensitive), merge
        // into it: reassign this speaker's turns to the existing one and drop
        // this speaker — avoids two distinct speakers sharing the same label.
        const existing = t.speakers.find(
          (s) =>
            s.id !== speakerId &&
            s.label.toLowerCase() === trimmed.toLowerCase(),
        );

        const renamed = existing
          ? {
              ...t,
              speakers: t.speakers.filter((s) => s.id !== speakerId),
              turns: t.turns.map((turn) =>
                turn.speakerId === speakerId
                  ? { ...turn, speakerId: existing.id }
                  : turn,
              ),
            }
          : {
              ...t,
              speakers: t.speakers.map((s) =>
                s.id === speakerId
                  ? { ...s, label: trimmed, initials: computeInitials(trimmed) }
                  : s,
              ),
            };

        return {
          ...renamed,
          speakers: renumberPersonaSpeakers(renamed.speakers),
        };
      });
    }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run src/renderer/src/reducers/transcription/index.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/reducers/transcription/index.ts src/renderer/src/reducers/transcription/index.test.ts
git commit -m "feat(vtt): renumber Persona N speakers after a global rename"
```

---

## Task 4: "Apply to this turn or all" scope prompt on pill click

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.tsx`
- Modify: `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts` (add `sidePanel.scopeDialog.*` keys)
- Test: `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx` (append)

**Interfaces:**
- Consumes: `renameSpeakerGlobal(transcriptionId, speakerId, newLabel)` and `reassignTurnSpeaker(transcriptionId, turnId, newSpeakerId)` from `@/reducers/transcription/actions` (both already exist, unchanged signatures). `renameSpeakerGlobal` already renumbers via Task 3 — this task does not call `renumberPersonaSpeakers` directly.
- Produces: no new exports — this is purely internal to `TurnSidePanel`.

**Context:** Today, clicking a person/suggested pill in the side panel reassigns **only the currently-selected turn** (`handleSelectPerson`). The only way to rename a speaker's identity across *all* their turns is the pencil-and-type flow on the avatar (`onRenamePerson`/`onMergePeople`, already global via `renameSpeakerGlobal`). This task adds a second path to that same global effect: clicking a pill that represents a different identity than the turn's current speaker, when that speaker has more than one turn, opens a confirm dialog asking "just this turn" vs. "all of \<speaker\>'s turns". Choosing "all" dispatches `renameSpeakerGlobal(transcriptionId, currentSpeaker.id, targetLabel)` — the exact same reducer path the pencil flow uses, so it already handles the merge-into-existing-speaker case (Task 3's collision branch) and renumbering. When the speaker has only one turn, there's no ambiguity — apply immediately, no prompt (this is the pre-existing behavior, unchanged).

- [ ] **Step 1: Write the failing tests**

Append to `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx`:

```ts
describe("TurnSidePanel bulk-apply scope prompt", () => {
  beforeEach(() => dispatch.mockClear());

  it("applies immediately with no prompt when the current speaker has only one turn", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="b" // "b" is s2's only turn
      />,
    );
    fireEvent.click(screen.getByText("Persona 1")); // pill for s1, a different speaker
    expect(screen.queryByText("sidePanel.scopeDialog.title")).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "REASSIGN_TURN_SPEAKER",
        payload: expect.objectContaining({ turnId: "b", newSpeakerId: "s1" }),
      }),
    );
  });

  it("prompts for scope when the current speaker has more than one turn, and applies to this turn only on choice", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a" // "a" is one of s1's two turns (a, c)
      />,
    );
    fireEvent.click(screen.getByText("Persona 2")); // pill for s2, a different speaker
    expect(screen.getByText("sidePanel.scopeDialog.title")).toBeTruthy();

    fireEvent.click(screen.getByText("sidePanel.scopeDialog.thisTurnOnly"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "REASSIGN_TURN_SPEAKER",
        payload: expect.objectContaining({ turnId: "a", newSpeakerId: "s2" }),
      }),
    );
    expect(screen.queryByText("sidePanel.scopeDialog.title")).toBeNull();
  });

  it("applies to all of the current speaker's turns when that scope is chosen", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );
    fireEvent.click(screen.getByText("Persona 2"));
    fireEvent.click(screen.getByText("sidePanel.scopeDialog.allTurns"));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RENAME_SPEAKER_GLOBAL",
        payload: expect.objectContaining({
          speakerId: "s1",
          newLabel: "Persona 2",
        }),
      }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "REASSIGN_TURN_SPEAKER" }),
    );
  });

  it("dismisses without dispatching on cancel", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );
    fireEvent.click(screen.getByText("Persona 2"));
    fireEvent.click(screen.getByText("sidePanel.scopeDialog.cancel"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx`
Expected: FAIL — clicking "Persona 2" from turn "a" dispatches `REASSIGN_TURN_SPEAKER` immediately today, no dialog exists.

- [ ] **Step 3: Add the i18n keys**

In `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`, inside the existing `sidePanel: { ... }` block (the same object that already has `empty` and `timestampOutOfRange`), add:

```ts
    scopeDialog: {
      title: "Aplicar cambio",
      description:
        '"{{current}}" tiene más de una intervención en esta transcripción. ¿Aplicás el cambio sólo a este turno o a todas las intervenciones de "{{current}}"?',
      thisTurnOnly: "Sólo este turno",
      allTurns: "Todas las de {{current}}",
      cancel: "Cancelar",
    },
```

- [ ] **Step 4: Add scope-decision state and the dialog to `TurnSidePanel`**

In `src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.tsx`:

Add to the imports:

```ts
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/button";
```

Add a small styled block near the other `css(...)` consts (after `emptyPanel`):

```ts
const dialogContent = css({
  width: "[min(420px,90vw)]",
  maxWidth: "[420px]",
});
```

Replace `handleSelectPerson` and add the supporting state/handlers (this whole block replaces the current `handleSelectPerson` definition):

```ts
  const [scopeChoice, setScopeChoice] = useState<{
    personIndex: number;
    targetLabel: string;
  } | null>(null);

  const applySelection = (i: number) => {
    const p = people[i];
    if (!p) return;
    if (p.kind === "existing") {
      dispatch(reassignTurnSpeaker(transcription.id, activeTurn.id, p.id));
      return;
    }
    const newSpeaker: Speaker = {
      id: crypto.randomUUID(),
      label: p.sg.label,
      initials: p.sg.initials,
      color: p.sg.color,
    };
    dispatch(addSpeaker(transcription.id, newSpeaker));
    dispatch(
      reassignTurnSpeaker(transcription.id, activeTurn.id, newSpeaker.id),
    );
  };

  const handleSelectPerson = (i: number) => {
    const p = people[i];
    if (!p || !currentSpeaker) return;

    const targetLabel = p.kind === "existing" ? p.name : p.sg.label;
    const isDifferentIdentity =
      p.kind === "suggested" || p.id !== currentSpeaker.id;
    const currentSpeakerTurnCount = turns.filter(
      (t) => t.speakerId === currentSpeaker.id,
    ).length;

    if (isDifferentIdentity && currentSpeakerTurnCount > 1) {
      setScopeChoice({ personIndex: i, targetLabel });
      return;
    }
    applySelection(i);
  };

  const handleApplyToThisTurnOnly = () => {
    if (!scopeChoice) return;
    applySelection(scopeChoice.personIndex);
    setScopeChoice(null);
  };

  const handleApplyToAllTurns = () => {
    if (!scopeChoice || !currentSpeaker) return;
    dispatch(
      renameSpeakerGlobal(
        transcription.id,
        currentSpeaker.id,
        scopeChoice.targetLabel,
      ),
    );
    setScopeChoice(null);
  };
```

(`handleNewPerson` stays as-is, right after these.)

Finally, render the dialog. Add this right before the closing `</div>` of the component's return (after the `<TooltipProvider>...</TooltipProvider>` block, still inside `<div className={panelColumn}>`):

```tsx
      <Dialog
        open={scopeChoice !== null}
        onOpenChange={(open) => {
          if (!open) setScopeChoice(null);
        }}
      >
        <DialogContent className={dialogContent}>
          <DialogTitle>{t("sidePanel.scopeDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("sidePanel.scopeDialog.description", {
              current: currentSpeaker?.label,
            })}
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={handleApplyToThisTurnOnly}>
              {t("sidePanel.scopeDialog.thisTurnOnly")}
            </Button>
            <Button onClick={handleApplyToAllTurns}>
              {t("sidePanel.scopeDialog.allTurns", {
                current: currentSpeaker?.label,
              })}
            </Button>
          </DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setScopeChoice(null)}
          >
            {t("sidePanel.scopeDialog.cancel")}
          </Button>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx`
Expected: PASS (all tests in the file, including pre-existing ones — note the pre-existing rename/merge tests don't touch pill-click flows, so they're unaffected).

- [ ] **Step 6: Verify visually**

Run `pnpm dev`, open a transcription with 2+ speakers where one has multiple turns, select a turn belonging to that speaker, click a different pill: confirm the dialog appears with both options and cancel; confirm "Todas las de ..." relabels every turn belonging to that speaker (transcript blocks + the pill in "Personas sugeridas" update together); confirm clicking a pill from a single-turn speaker applies immediately with no dialog.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.tsx \
       src/renderer/src/components/voice-to-text/transcription-editor/turn-side-panel.test.tsx \
       src/renderer/src/constants/i18n/locales/es/voice-to-text.ts
git commit -m "feat(vtt): prompt for this-turn-vs-all scope when reassigning a pill"
```

---

## Task 5: Rebuild the Finalización screen

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/finish.tsx` (full rewrite)
- Modify: `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts` (replace/extend `finish.*` keys)
- Test (new): `src/renderer/src/components/voice-to-text/finish.test.tsx`

**Interfaces:**
- Consumes: `useExportTranscription(transcription)` → `{ isExporting, download(format, options?) }` from `@/services/export/use-export-transcription` (unchanged). `ExportFormat = "txt" | "odt" | "pdf"` and `ExportOptions = { includeSpeakers, includeTimestamps, includeTitle }` from `@/services/export/types` (unchanged — `includeSpeakers`/`includeTimestamps` already default `true`). `Select` from `@/components/ui/select` (`options: {id,text}[]`, `value`, `onChange: (opt) => void`). `Switch` from `@/components/ui/switch` (`checked`, `onCheckedChange`). `Tooltip`/`TooltipContent`/`TooltipTrigger`/`TooltipProvider` from `@/components/ui/tooltip`. `Avatar` from `@aymurai/ui` (`initials`, `color`, `size="sm"`).
- Produces: no new exports — `VoiceFinish` keeps the same default export and zero props, so `routes/app.$feature/finish.tsx` needs no changes.

**Context:** The export pipeline already does everything the Figma "4. Finalización" screen needs — `DEFAULT_EXPORT_OPTIONS` is already `{ includeSpeakers: true, includeTimestamps: true, includeTitle: true }`, and `buildExportDocument`/`blockPrefix` already drop the speaker/timestamp prefix correctly when a flag is off. This task is UI-only: replace the popover-of-3-download-buttons with a single format `<Select>` (lowercase `.txt`/`.odt`/`.pdf`) plus two `Switch` rows for "Incluir oradores"/"Incluir marcas de tiempo" (both default **on** — this intentionally differs from the Figma mock, per explicit product decision), laid out as a two-column card (Resumen | Opciones de exportación) matching Figma node `40002384:38829`, with a single "Exportar" button.

- [ ] **Step 1: Replace the `finish.*` i18n keys**

In `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`, replace the existing `finish: { ... }` block (lines 87-103) with:

```ts
  finish: {
    sectionTitle: "4. Finalización",
    description: "La transcripción a sido completada y revisada.",
    summaryTitle: "Resumen de la transcripción",
    titleLabel: "Título",
    fileLabel: "Archivo",
    durationLabel: "Duración",
    turnsLabel: "Turnos",
    speakersLabel: "Personas",
    exportOptionsTitle: "Opciones de exportación",
    formatLabel: "Formato de archivo",
    formatHelpAria: "Diferencias entre formatos de archivo",
    formatHelp:
      ".txt: texto simple, sin formato. .odt: documento editable. .pdf: sólo lectura, ideal para archivar o compartir.",
    contentTitle: "Contenido",
    includeSpeakers: "Incluir oradores",
    includeTimestamps: "Incluir marcas de tiempo",
    export: "Exportar",
    exportFailed: "No se pudo generar el archivo. Intentá de nuevo.",
    back: "Volver",
    missing: "No se encontró ninguna transcripción.",
  },
```

(This drops `download`/`downloadTxt`/`downloadOdt`/`downloadPdf` — grep for them first to confirm nothing else references those keys.)

- [ ] **Step 2: Confirm no other file uses the removed keys**

```bash
grep -rn "finish\.download\b\|finish\.downloadTxt\|finish\.downloadOdt\|finish\.downloadPdf" src/renderer/src
```

Expected: no matches outside `finish.tsx` itself (which Step 4 rewrites).

- [ ] **Step 3: Write the failing tests**

Create `src/renderer/src/components/voice-to-text/finish.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Transcription } from "@/types/transcription";
import VoiceFinish from "./finish";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

// VoiceHeader itself renders `Link` (needs a real router context) — stub it
// out entirely, matching the convention already used in validation.test.tsx.
vi.mock("./header", () => ({
  default: () => <header />,
}));

vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const download = vi.fn();
vi.mock("@/services/export/use-export-transcription", () => ({
  useExportTranscription: () => ({ isExporting: false, download }),
}));

const transcription: Transcription = {
  id: "doc-1",
  title: "Audiencia 10/04/2025",
  audioFileName: "a.mp3",
  audioDurationMs: 60_000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "violet" },
    { id: "s2", label: "Jueza", initials: "JU", color: "red" },
  ],
  turns: [
    { id: "a", speakerId: "s1", text: "uno", startMs: 0, endMs: 1000 },
    { id: "b", speakerId: "s2", text: "dos", startMs: 1000, endMs: 2000 },
  ],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptions: () => [transcription],
}));

describe("VoiceFinish export options", () => {
  beforeEach(() => download.mockClear());

  it("exports with speakers and timestamps included by default", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "txt",
      expect.objectContaining({ includeSpeakers: true, includeTimestamps: true }),
    );
  });

  it("excludes speakers from the export when that switch is turned off", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByLabelText("finish.includeSpeakers"));
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "txt",
      expect.objectContaining({ includeSpeakers: false, includeTimestamps: true }),
    );
  });

  it("excludes timestamps from the export when that switch is turned off", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByLabelText("finish.includeTimestamps"));
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "txt",
      expect.objectContaining({ includeSpeakers: true, includeTimestamps: false }),
    );
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/finish.test.tsx`
Expected: FAIL — `finish.export` text doesn't exist yet (current UI says `finish.download` behind a popover with per-format buttons), and there are no switches.

- [ ] **Step 5: Rewrite `finish.tsx`**

Replace the full contents of `src/renderer/src/components/voice-to-text/finish.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Footer from "@/components/layout/footer";
import MainContent from "@/components/layout/main-content";
import Select, { type SelectOption } from "@/components/ui/select";
import Switch from "@/components/ui/switch";
import RequireFile from "@/features/RequireFile";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import type { ExportFormat } from "@/services/export/types";
import { useExportTranscription } from "@/services/export/use-export-transcription";
import { css } from "@/styled/css";
import { Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Avatar, Button, Card } from "@aymurai/ui";
import { Info } from "phosphor-react";
import VoiceHeader from "./header";

const formatLabel = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
});

const switchRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
});

const speakerPills = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const speakerPill = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  bg: "bg.secondary-highlight",
  rounded: "full",
  py: "1",
  px: "2",
});

const FORMAT_OPTIONS: SelectOption[] = [
  { id: "txt", text: ".txt" },
  { id: "odt", text: ".odt" },
  { id: "pdf", text: ".pdf" },
];

export default function VoiceFinish() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const transcription = transcriptions[0] ?? null;
  const { isExporting, download } = useExportTranscription(transcription);

  const [format, setFormat] = useState<ExportFormat>("txt");
  const [includeSpeakers, setIncludeSpeakers] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  const speakersSwitchId = "finish-include-speakers";
  const timestampsSwitchId = "finish-include-timestamps";

  return (
    <RequireFile>
      <VoiceHeader currentStep={4} />
      <MainContent>
        <Stack gap="6">
          <Stack gap="1">
            <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
            <styled.p textStyle="paragraph.md.default">
              {t("finish.description")}
            </styled.p>
          </Stack>

          {transcription ? (
            <Card>
              <Grid columns={2} columnGap="8" rowGap="6">
                <Stack gap="4">
                  <styled.h2 textStyle="subtitle.md.strong">
                    {t("finish.summaryTitle")}
                  </styled.h2>
                  <Stack gap="1">
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.titleLabel")}:</strong>{" "}
                      {transcription.title}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.fileLabel")}:</strong>{" "}
                      {transcription.audioFileName}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.turnsLabel")}:</strong>{" "}
                      {transcription.turns.length}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.speakersLabel")}:</strong>{" "}
                      {transcription.speakers.length}
                    </styled.p>
                  </Stack>
                  <div className={speakerPills}>
                    {transcription.speakers.map((speaker) => (
                      <div key={speaker.id} className={speakerPill}>
                        <Avatar
                          initials={speaker.initials}
                          color={speaker.color}
                          size="sm"
                        />
                        <styled.span textStyle="label.sm.default">
                          {speaker.label}
                        </styled.span>
                      </div>
                    ))}
                  </div>
                </Stack>

                <Stack gap="6">
                  <Stack gap="2">
                    <TooltipProvider>
                      <HStack className={formatLabel} gap="1">
                        <styled.span textStyle="label.sm.default" color="text.lighter">
                          {t("finish.formatLabel")}
                        </styled.span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={t("finish.formatHelpAria")}
                              className={css({
                                display: "inline-flex",
                                color: "text.lighter",
                                border: "[none]",
                                bg: "transparent",
                                cursor: "pointer",
                                p: "[0]",
                              })}
                            >
                              <Info size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("finish.formatHelp")}
                          </TooltipContent>
                        </Tooltip>
                      </HStack>
                    </TooltipProvider>
                    <Select
                      options={FORMAT_OPTIONS}
                      value={format}
                      onChange={(opt) => setFormat(opt.id as ExportFormat)}
                    />
                  </Stack>

                  <Stack gap="4">
                    <styled.h2 textStyle="subtitle.sm.strong">
                      {t("finish.contentTitle")}
                    </styled.h2>
                    <div className={switchRow}>
                      <label htmlFor={speakersSwitchId}>
                        {t("finish.includeSpeakers")}
                      </label>
                      <Switch
                        id={speakersSwitchId}
                        checked={includeSpeakers}
                        onCheckedChange={setIncludeSpeakers}
                      />
                    </div>
                    <div className={switchRow}>
                      <label htmlFor={timestampsSwitchId}>
                        {t("finish.includeTimestamps")}
                      </label>
                      <Switch
                        id={timestampsSwitchId}
                        checked={includeTimestamps}
                        onCheckedChange={setIncludeTimestamps}
                      />
                    </div>
                  </Stack>
                </Stack>
              </Grid>
            </Card>
          ) : (
            <styled.p textStyle="paragraph.md.default">
              {t("finish.missing")}
            </styled.p>
          )}
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button
            variant="secondary"
            onClick={() =>
              navigate({
                to: "/app/$feature/validation",
                params: { feature: FeatureFlowEnum.VoiceToText },
              })
            }
          >
            {t("finish.back")}
          </Button>
          <Button
            disabled={!transcription}
            isLoading={isExporting}
            onClick={() =>
              download(format, {
                includeSpeakers,
                includeTimestamps,
                includeTitle: true,
              })
            }
          >
            {t("finish.export")}
          </Button>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/finish.test.tsx`
Expected: PASS.

- [ ] **Step 7: Check for now-unused imports in the old file's dependents**

```bash
grep -rn "MenuButton\|Popover.*finish\|PopoverClose" src/renderer/src/components/voice-to-text/finish.tsx
```

Expected: no matches (the popover-of-buttons UI is fully removed).

- [ ] **Step 8: Run the full VTT test suite and typecheck**

```bash
pnpm vitest run src/renderer/src/components/voice-to-text
pnpm typecheck
```

Expected: PASS. Fix any type errors from the `Select`/`SelectOption` import path or `Avatar`/`Button`/`Card` props before proceeding.

- [ ] **Step 9: Verify visually**

Run `pnpm dev`, walk onboarding → preview → proceso → edición → finish. On the Finalización screen: confirm the two-column layout, the speaker pills with real colors, the format `<select>` (lowercased `.txt`/`.odt`/`.pdf`) with a working info tooltip, both switches default ON. Toggle "Incluir oradores" off and export a `.txt` — confirm the downloaded file has no speaker prefix but still has timestamps. Toggle "Incluir marcas de tiempo" off instead — confirm the opposite. Toggle both off — confirm plain text only (matches the four examples in the product spec).

- [ ] **Step 10: Commit**

```bash
git add src/renderer/src/components/voice-to-text/finish.tsx \
       src/renderer/src/components/voice-to-text/finish.test.tsx \
       src/renderer/src/constants/i18n/locales/es/voice-to-text.ts
git commit -m "feat(vtt): rebuild Finalización screen with format select and content switches"
```

---

## Task 6: Highlight search matches while in edit mode

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.tsx` (full rewrite)
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx:101-113,177-189` (thread `highlight` through)
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/index.tsx:436-451` (pass `highlight={searchQuery}`)
- Test (new): `src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.test.tsx`
- Test: `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.test.tsx` (append)

**Interfaces:**
- Produces: `EditableTurnText` gains an optional `highlight?: string` prop (backward compatible — existing callers with no `highlight` render unchanged). `TurnBlock` gains the same optional `highlight?: string` prop, forwarded as-is.
- Consumes: `searchQuery` — the same string already computed in `TranscriptionEditor` (`index.tsx`) and already passed as `highlight={searchQuery}` to the read-mode `TranscriptBlock`.

**Context:** In read mode, `TranscriptBlock` (from `@aymurai/ui`) already gets `highlight={searchQuery}` and highlights matches. In edit mode, `TurnBlock` renders `EditableTurnText` — a `contentEditable` div that is deliberately left "uncontrolled" (renders `{text}` once via JSX children, then never lets React touch its children again) specifically to avoid corrupting the caret while typing. Today it never receives the search query at all, so matches are silently not highlighted while Modo Edición is on — search still finds and navigates between matches (that logic lives in `TranscriptionEditor` against `transcription.turns`, independent of view mode), it's purely the visual highlight that's missing.

Fix: give `EditableTurnText` an optional `highlight` prop. Render highlighted markup (`<mark>` around case-insensitive matches, rest HTML-escaped) via a direct `el.innerHTML` write in a `useEffect` — never through React children, preserving the existing "uncontrolled" contract — and skip that effect entirely while the field is focused, so an in-progress edit is never rewritten out from under the caret. `onCommit` already reads `e.currentTarget.textContent`, which ignores markup regardless, so commits stay clean plain text whether or not the last paint had `<mark>` tags in it.

- [ ] **Step 1: Write the failing tests for `EditableTurnText`**

Create `src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTurnText } from "./editable-turn-text";

function renderText(
  overrides: Partial<React.ComponentProps<typeof EditableTurnText>> = {},
) {
  const onCommit = vi.fn();
  const onSelect = vi.fn();
  render(
    <EditableTurnText
      turnId="t1"
      text="hola mundo"
      ariaLabel="x"
      onCommit={onCommit}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onCommit, onSelect };
}

describe("EditableTurnText search highlighting", () => {
  it("wraps a matching substring in <mark>, case-insensitively", () => {
    renderText({ highlight: "MUNDO" });
    expect(screen.getByRole("textbox").innerHTML).toBe(
      "hola <mark>mundo</mark>",
    );
  });

  it("renders plain escaped text when there is no highlight query", () => {
    renderText();
    expect(screen.getByRole("textbox").innerHTML).toBe("hola mundo");
  });

  it("commits clean plain text on blur even when the last paint was highlighted", () => {
    const { onCommit } = renderText({ highlight: "mundo" });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onCommit).toHaveBeenCalledWith("t1", "hola mundo");
  });

  it("does not overwrite in-progress typing when props change while focused", () => {
    function Wrapper({
      text,
      highlight,
    }: {
      text: string;
      highlight?: string;
    }) {
      return (
        <EditableTurnText
          turnId="t1"
          text={text}
          highlight={highlight}
          ariaLabel="x"
          onCommit={vi.fn()}
          onSelect={vi.fn()}
        />
      );
    }

    const { rerender } = render(
      <Wrapper text="hola mundo" highlight="mundo" />,
    );
    const el = screen.getByRole("textbox");
    fireEvent.focus(el);
    el.textContent = "hola mundo nuevo"; // simulates the user typing
    rerender(<Wrapper text="hola mundo" highlight="otra" />); // parent re-renders mid-edit
    expect(el.textContent).toBe("hola mundo nuevo"); // untouched while focused
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.test.tsx`
Expected: FAIL — `highlight` isn't a prop yet, `innerHTML` is just the plain unescaped text with no `<mark>`.

- [ ] **Step 3: Rewrite `editable-turn-text.tsx`**

Replace the full contents of `src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.tsx`:

```tsx
import { memo, useEffect, useRef, useState } from "react";

import { css } from "@/styled/css";

const base = css({
  fontSize: "[16px]",
  lineHeight: "[26px]",
  fontWeight: "[300]",
  color: "text.default",
  m: "[0]",
});

const editable = css({
  outline: "none",
  rounded: "[8px]",
  px: "2",
  py: "1",
  mx: "[-8px]",
  cursor: "text",
  transition: "[background 140ms, box-shadow 140ms]",
  "&:hover": { bg: "bg.primary" },
  "&:focus": {
    bg: "bg.secondary",
    boxShadow: "[0 0 0 1.5px token(colors.action.default)]",
  },
});

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Wraps case-insensitive matches of `query` in `<mark>`, HTML-escaping
 * everything else. Splits on a capturing-group regex (rather than escaping
 * first, then matching) so matching stays correct even if `query` or `text`
 * contain HTML-sensitive characters.
 */
function highlightHtml(text: string, query?: string): string {
  if (!query) return escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text
    .split(regex)
    .map((part, i) =>
      i % 2 === 1 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part),
    )
    .join("");
}

interface EditableTurnTextProps {
  turnId: string;
  text: string;
  /** Current search query — matches are wrapped in `<mark>` while unfocused. */
  highlight?: string;
  ariaLabel: string;
  onCommit: (turnId: string, value: string) => void;
  onSelect: () => void;
  onFocusChange?: (turnId: string, isFocused: boolean) => void;
}

export const EditableTurnText = memo(
  function EditableTurnText({
    turnId,
    text,
    highlight,
    ariaLabel,
    onCommit,
    onSelect,
    onFocusChange,
  }: EditableTurnTextProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Search highlighting is painted as static <mark> markup via a direct
    // innerHTML write, never through React children — this div is
    // intentionally uncontrolled (see the contentEditable below) to preserve
    // caret position while typing. Skipped while focused so an in-progress
    // edit is never rewritten out from under the caret; onCommit already
    // reads textContent below, which ignores markup either way.
    useEffect(() => {
      const el = ref.current;
      if (!el || isFocused) return;
      el.innerHTML = highlightHtml(text, highlight);
    }, [text, highlight, isFocused]);

    return (
      <div
        ref={ref}
        className={`${base} ${editable}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-turn-id={turnId}
        // biome-ignore lint/a11y/useSemanticElements: contentEditable div is intentionally uncontrolled to preserve caret position; role="textbox" is correct ARIA for this pattern
        role="textbox"
        tabIndex={0}
        aria-label={ariaLabel}
        onFocus={() => {
          setIsFocused(true);
          onFocusChange?.(turnId, true);
        }}
        onBlur={(e) => {
          onCommit(turnId, e.currentTarget.textContent ?? "");
          setIsFocused(false);
          onFocusChange?.(turnId, false);
        }}
        onMouseUp={onSelect}
        onKeyUp={onSelect}
      >
        {text}
      </div>
    );
  },
  (a, b) =>
    a.text === b.text &&
    a.turnId === b.turnId &&
    a.ariaLabel === b.ariaLabel &&
    a.highlight === b.highlight,
);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.test.tsx`
Expected: PASS.

- [ ] **Step 5: Thread `highlight` through `TurnBlock`**

In `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx`, add to `TurnBlockProps` (after `turn: Turn;`):

```ts
  /** Current search query — forwarded to EditableTurnText for highlighting. */
  highlight?: string;
```

Add `highlight` to the destructured props of `TurnBlock`, and forward it to `EditableTurnText`:

```tsx
          <EditableTurnText
            turnId={turn.id}
            text={turn.text}
            highlight={highlight}
            ariaLabel={t("editor.turnTextAria", {
              speaker: speaker.label,
              time: formatTime(turn.startMs),
            })}
            onCommit={(id, value) =>
              dispatch(updateTurnText(transcription.id, id, value))
            }
            onSelect={onTextSelect}
            onFocusChange={onEditingFocusChange}
          />
```

- [ ] **Step 6: Add a `TurnBlock`-level test**

Append to `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.test.tsx`:

```ts
describe("TurnBlock search highlighting", () => {
  it("forwards the search query to the editable text as a highlight", () => {
    renderBlock({ highlight: "mundo" });
    expect(screen.getByRole("textbox").innerHTML).toContain(
      "<mark>mundo</mark>",
    );
  });
});
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm vitest run src/renderer/src/components/voice-to-text/transcription-editor/turn-block.test.tsx`
Expected: PASS (all tests in the file).

- [ ] **Step 8: Wire `searchQuery` into the edit-mode render in `TranscriptionEditor`**

In `src/renderer/src/components/voice-to-text/transcription-editor/index.tsx`, the edit-mode branch inside the `transcription.turns.map(...)` currently renders:

```tsx
            return (
              <TurnBlock
                key={turn.id}
                turn={turn}
                speaker={speaker}
                transcription={transcription}
                isActive={turn.id === activeTurnId}
                isSelected={turn.id === selectedTurnId}
                isEditing={turn.id === editingTurnId}
                onSeekTo={handleSeekTo}
                onSelect={handleTurnSelect}
                onTextSelect={sa.onSelect}
                onEditingFocusChange={handleEditingFocusChange}
                turnRef={setTurnRef(turn.id)}
              />
            );
```

Add `highlight={searchQuery}` (same variable already passed as `highlight={searchQuery}` to the read-mode `TranscriptBlock` a few lines above):

```tsx
            return (
              <TurnBlock
                key={turn.id}
                turn={turn}
                speaker={speaker}
                transcription={transcription}
                isActive={turn.id === activeTurnId}
                isSelected={turn.id === selectedTurnId}
                isEditing={turn.id === editingTurnId}
                highlight={searchQuery}
                onSeekTo={handleSeekTo}
                onSelect={handleTurnSelect}
                onTextSelect={sa.onSelect}
                onEditingFocusChange={handleEditingFocusChange}
                turnRef={setTurnRef(turn.id)}
              />
            );
```

- [ ] **Step 9: Run the full editor test suite and typecheck**

```bash
pnpm vitest run src/renderer/src/components/voice-to-text/transcription-editor
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 10: Verify visually**

Run `pnpm dev`, open a transcription, turn on Modo Edición, type a query into Buscar that matches text in one or more turns. Confirm the matches are highlighted (`<mark>`) inside the editable turns, exactly like they already are in read mode. Click into a highlighted turn to edit it — confirm the caret lands correctly and typing works normally (no jump/flicker). Blur it — confirm the edited text persists correctly and re-highlights if it still matches the query.

- [ ] **Step 11: Commit**

```bash
git add src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.tsx \
       src/renderer/src/components/voice-to-text/transcription-editor/editable-turn-text.test.tsx \
       src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx \
       src/renderer/src/components/voice-to-text/transcription-editor/turn-block.test.tsx \
       src/renderer/src/components/voice-to-text/transcription-editor/index.tsx
git commit -m "fix(vtt): highlight search matches in edit mode without breaking the caret"
```

---

## Final Verification

- [ ] `pnpm vitest run` (full suite) — PASS
- [ ] `pnpm typecheck` — PASS
- [ ] `pnpm lint` — PASS
- [ ] `pnpm knip` — no new unused exports/files flagged
- [ ] Manual smoke test: onboarding → preview → proceso → edición → finish, per the project's own smoke-test checklist (audio > 1h, keyboard nav, reduced window, all popovers/modals)
