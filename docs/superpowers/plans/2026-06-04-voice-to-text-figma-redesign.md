# Voice-to-Text Figma Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Voice-to-Text (VTT) flow in the Electron renderer in line with the new Figma designs across all seven screens (onboarding gating, help modal, file selector, file preview with 10s play, transcription progress states, transcript results, and edit mode).

**Architecture:** All work lives under `src/renderer/src/components/voice-to-text/` plus shared layout/i18n. We reuse the existing route-dispatch pattern (each `routes/app.$feature/*.tsx` early-returns the `Voice*` component when `feature === VoiceToText`), the existing `Transcription` reducer/context, the `useTranscribe` hook (which already exposes `abort()`), and Panda CSS recipes. Two pieces of genuinely new logic — a `renameTranscription` reducer action and an audio-metadata/snippet hook — are added with unit tests; everything else is visual and verified by running the app against the Figma screenshots.

**Tech Stack:** React 18, TanStack Router, TanStack Query, Zustand (`useLocal` persisted store), Panda CSS (`strictTokens: true`), Radix UI wrappers (`@/components/ui/*`), phosphor-react icons, i18next (`voice-to-text` namespace), pnpm.

---

## Testing reality (read before starting)

This repo currently has **no test runner** (no vitest / testing-library / jsdom). The enforced gates are:

- Pre-commit (lefthook): biome autoformat+lint, panda codegen, forbidden-pattern grep (`console.log`, `debugger`, merge markers, `.only(`, `@stitches/react`).
- Pre-push: `pnpm typecheck` (runs `typecheck:node` + `typecheck:web`) and `pnpm knip`.

Because of that, this plan:

- **Task 1 (recommended)** adds a minimal Vitest setup so the two logic units (Tasks 3 & 4) get real red-green tests. If you skip Task 1, convert Tasks 3 & 4 verification to `pnpm typecheck` + a manual reducer/console check, and ignore their `pnpm test` steps.
- All **visual** tasks are verified with `pnpm typecheck && pnpm lint`, then `pnpm dev` (or `pnpm dev:web`) and a side-by-side comparison against the named screenshot in `screenshots/`.

**Panda reminders:** `strictTokens: true` — any raw value must be bracketed (`bg: "[#F3F3F3]"`, `width: "[36px]"`). Prefer semantic tokens (`color: "text.default"`, `bg: "bg.secondary"`) and `@/styled/jsx` primitives (`Stack`, `HStack`, `styled.*`). After editing components you do **not** need to re-run codegen, but after editing `panda.config.ts` run `pnpm panda codegen`.

---

## File map

**New files**

- `src/renderer/src/components/voice-to-text/stepper.tsx` — shared 4-step progress indicator for the header center slot.
- `src/renderer/src/components/voice-to-text/how-it-works.tsx` — shared 4-card "¿Cómo funciona?" grid + a `?`-triggered modal, voice-specific copy and illustrations.
- `src/renderer/src/components/voice-to-text/file-drop.tsx` — audio-only drop zone matching screenshot 002.
- `src/renderer/src/components/voice-to-text/use-audio-snippet.ts` — hook that, given a `File`, exposes duration + a "play 10s then pause" toggle.
- `vitest.config.ts`, `src/renderer/src/test/setup.ts` — only if Task 1 is done.

**Modified files**

- `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts` — all new/changed copy (Task 2).
- `src/renderer/src/reducers/transcription/actions.ts` + `index.ts` — `renameTranscription` (Task 3).
- `src/renderer/src/components/layout/header.tsx` — render the voice modal unconditionally for VTT; keep document behavior (Task 6).
- `src/renderer/src/components/voice-to-text/onboarding.tsx` — gate first-visit grid vs file-selection drop area (Task 7).
- `src/renderer/src/components/voice-to-text/preview.tsx` — restyle + 10s play button (Task 8).
- `src/renderer/src/components/voice-to-text/process.tsx` — Detener / Reemplazar / states / callout / striped bar (Task 9).
- `src/renderer/src/components/voice-to-text/audio-player.tsx` — optional `rightSlot` for the unified footer (Task 10).
- `src/renderer/src/components/voice-to-text/transcription-editor/index.tsx` — search/title reorder, editable title, edit-mode banner, forward footer actions (Tasks 10 & 11).
- `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx` — align turn text with speaker name (Task 10).
- `src/renderer/src/components/voice-to-text/validation.tsx` — drop standalone footer, pass Finalizar into the audio bar (Task 10).
- The five voice route screens get `center={<VoiceStepper current={n} />}` on their `<Header>` (Task 5).

**Spec → Task coverage**

| Figma point | Task(s) |
|---|---|
| 1. First-visit grid, later → file selection | 7 (with 6 for shared grid) |
| 2. `?` in nav shows how-it-works modal | 6 |
| 3. File selector restyle (002) | 7 |
| 4. Selected-file screen: frame, type, 10s play (002_A) | 8 |
| 5. Progress states (003_progress / with-text / 100 / error) | 9 |
| 6. Transcript results (search, editable title, unified bar, text alignment) | 10 |
| 7. Edit mode (editor.png) | 11 |
| (inferred from all screenshots) header stepper | 5 |

---

### Task 1 (RECOMMENDED): Add a minimal Vitest setup

**Why:** Tasks 3 and 4 add real logic; the repo has no test runner. This adds one. Skip only if the user declines — then drop the `pnpm test` steps in Tasks 3 & 4.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/renderer/src/test/setup.ts`
- Modify: `package.json` (scripts + devDeps)
- Check: `knip.json` / `knip` config (so vitest config isn't flagged as unused)

- [ ] **Step 1: Install dev dependencies**

```bash
pnpm add -D vitest@^2 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
```

- [ ] **Step 2: Add the test script**

Edit `package.json` `scripts`, add after `"knip"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer/src"),
      "@/styled": resolve(__dirname, "src/renderer/src/styled"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/renderer/src/test/setup.ts"],
    include: ["src/renderer/src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

- [ ] **Step 4: Create `src/renderer/src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add a smoke test to prove the runner works**

Create `src/renderer/src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run it**

Run: `pnpm test`
Expected: PASS, 1 test passed.

- [ ] **Step 7: Make sure typecheck and knip still pass**

Run: `pnpm typecheck && pnpm knip`
Expected: no new errors. If knip flags `vitest.config.ts` or the smoke test, add `vitest.config.ts` to the `entry` array and `**/*.test.ts` to `project`/ignore in the knip config (mirror how other configs are listed in commit `6649a7d`).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/renderer/src/test/
git commit -m "test: add minimal vitest setup for renderer logic"
```

---

### Task 2: Add all new/updated i18n copy

**Files:**
- Modify: `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`

These keys are referenced by every later task. Adding them first keeps each UI task focused on markup.

- [ ] **Step 1: Replace the `onboarding`, `preview`, `process`, `editor` blocks and add `stepper` + `howItWorksCards`**

Edit `src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`. Replace the existing object so it reads exactly:

```ts
const voiceToText = {
  title: "Voz a Texto",
  subtitle: "Transcribí audios a documentos de texto editables",
  stepper: {
    step1: "Selección",
    step2: "Transcripción",
    step3: "Edición",
    step4: "Descarga",
  },
  howItWorks: {
    pageTitle: "¿Cómo funciona?",
    modalTitle: "¿Cómo funciona de Voz a Texto?",
    gotIt: "Entendido",
    helpAria: "Cómo funciona la transcripción de voz a texto",
    cards: {
      card1: {
        title: "Subí el archivo de audio",
        subtitle: "Cargá un archivo en formato .mp3, .wav, .m4a o .webm.",
      },
      card2: {
        title: "La inteligencia artificial analiza el audio",
        subtitle: "Extrae la información relevante de cada documento.",
      },
      card3: {
        title: "Revisión y validación humana",
        subtitle:
          "Revisá la transcripción, editá el texto y renombrá a los locutores antes de exportar el archivo.",
      },
      card4: {
        title: "Descargá la transcripción",
        subtitle: "El archivo queda listo para exportar en formato de texto.",
      },
    },
  },
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    loadDocuments: "Cargar archivo",
    dropAreaTitle: "Selecciona el archivo que desea transcribir o arrástralo y suéltalo",
    dropAreaFormats: "Formatos válidos: .mp3, .wav, .m4a o .webm",
  },
  preview: {
    sectionTitle: "1. Selección de archivo",
    selectedCount_one: "{{count}} archivo seleccionado",
    selectedCount_other: "{{count}} archivos seleccionados",
    loadMore: "Cargar más audios",
    continue: "Siguiente",
    removeAria: "Eliminar {{name}}",
    playAria: "Reproducir 10 segundos de {{name}}",
    pauseAria: "Pausar {{name}}",
    // "46 min. 34 seg. - 21.5 mb"
    meta: "{{duration}} - {{size}}",
  },
  process: {
    sectionTitle: "2. Transcripción de voz a texto",
    processingTitle: "AymurAI está transcribiendo el archivo.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    progressLabel: "{{percent}}%",
    completedLabel: "Carga finalizada 100%",
    errorLabel: "Error en la transcripción del archivo. Volvelo a intentar",
    stop: "Detener",
    replace: "Reemplazar",
    waitingForWords: "Esperando las primeras palabras…",
    previewAriaLabel: "Vista previa de la transcripción",
    callout:
      "Transcribiendo audio. Puede demorar unos segundos. Aparecerá aquí cuando esté listo.",
    back: "Volver",
    next: "Siguiente",
  },
  validation: {
    back: "Volver",
    finish: "Finalizar",
    saving: "Guardando...",
    missingTranscription: "No se encontró ninguna transcripción.",
  },
  finish: {
    sectionTitle: "4. Finalización",
    description:
      "La transcripción ha sido completada y revisada. Podés descargarla como archivo de texto.",
    summaryTitle: "Resumen de la transcripción",
    titleLabel: "Título",
    fileLabel: "Archivo",
    speakersLabel: "Locutores",
    turnsLabel: "Turnos",
    download: "Descargar .txt",
    back: "Volver",
    missing: "No se encontró ninguna transcripción.",
  },
  editor: {
    searchPlaceholder: "Buscar",
    searchAria: "Buscar en la transcripción",
    editMode: "Modo Edición",
    editModeBanner: "Modo edición activo. Seleccioná el texto para modificarlo.",
    editTitleAria: "Editar título de la transcripción",
    titleInputAria: "Título de la transcripción",
    prevResult: "Resultado anterior",
    nextResult: "Resultado siguiente",
    addTurn: "+ Agregar turno",
    addTurnAria: "Agregar turno",
    removeTurnAria: "Eliminar turno",
    turnTextAria: "Texto del turno",
    finish: "Finalizar",
    rewind5s: "Retroceder 5 segundos",
    forward5s: "Adelantar 5 segundos",
    play: "Reproducir",
    pause: "Pausar",
    speedAria: "Cambiar velocidad de reproducción",
  },
  speakerDialog: {
    title: "Editar locutor",
    renameSection: "Renombrar globalmente",
    renamePlaceholder: "Nombre del locutor",
    renameAria: "Nuevo nombre del locutor",
    renameButton: "Renombrar",
    renameHelper: "Cambia el nombre en todos los turnos",
    timestampSection: "Marca de tiempo",
    timestampPlaceholder: "mm:ss",
    timestampAria: "Marca de tiempo del turno",
    timestampSave: "Guardar",
    timestampInvalid: "Formato inválido. Usá mm:ss o hh:mm:ss.",
    timestampHelper:
      "Formato mm:ss o hh:mm:ss. Cambia el inicio de este turno.",
    changeSection: "Cambiar este turno",
    newSpeaker: "Nuevo locutor",
    newSpeakerPlaceholder: "Nombre del nuevo locutor",
    newSpeakerAria: "Nombre del nuevo locutor",
    newSpeakerAdd: "Agregar",
  },
  suggestedPanel: {
    title: "Speakers sugeridos",
    empty: "Seleccioná un turno para asignar un speaker sugerido.",
  },
};

export default voiceToText;
```

Notes:
- The old `onboarding.steps.*`, `onboarding.validFormats`, `onboarding.description`, `preview.filesLabel`, `preview.validFormats`, `process.finishText`, `process.nFiles`, `process.errorLabel` (old wording) keys are intentionally removed/renamed. The components that referenced them are all rewritten in later tasks. After this task they will not typecheck yet — that's expected; later tasks fix the call sites. Run the full validation only at Task 12.
- `selectedCount_one` / `selectedCount_other` use i18next plural suffixes; call as `t("preview.selectedCount", { count })`.

- [ ] **Step 2: Verify the file parses**

Run: `pnpm exec biome check src/renderer/src/constants/i18n/locales/es/voice-to-text.ts`
Expected: no syntax errors (typecheck of call sites is deferred to later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/constants/i18n/locales/es/voice-to-text.ts
git commit -m "i18n(voice-to-text): add redesigned copy keys"
```

---

### Task 3: Add `renameTranscription` reducer action

Needed for the editable transcript title (Task 10). No existing action mutates `Transcription.title`.

**Files:**
- Modify: `src/renderer/src/reducers/transcription/actions.ts`
- Modify: `src/renderer/src/reducers/transcription/index.ts`
- Test: `src/renderer/src/reducers/transcription/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/reducers/transcription/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Transcription } from "@/types/transcription";
import { renameTranscription } from "./actions";
import reducer from "./index";

function makeTranscription(overrides: Partial<Transcription> = {}): Transcription {
  return {
    id: "t1",
    title: "Audiencia 10/04/2025",
    audioFileName: "a.mp3",
    audioDurationMs: 1000,
    audioObjectUrl: "blob:x",
    speakers: [],
    turns: [],
    createdAt: "2026-06-04T00:00:00.000Z",
    ...overrides,
  };
}

describe("renameTranscription", () => {
  it("renames the matching transcription's title", () => {
    const state = [makeTranscription()];
    const next = reducer(state, renameTranscription("t1", "Nuevo título"));
    expect(next[0].title).toBe("Nuevo título");
  });

  it("leaves other transcriptions untouched and does not mutate input", () => {
    const state = [makeTranscription(), makeTranscription({ id: "t2", title: "Otro" })];
    const next = reducer(state, renameTranscription("t1", "Cambiado"));
    expect(next[1].title).toBe("Otro");
    expect(state[0].title).toBe("Audiencia 10/04/2025");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/renderer/src/reducers/transcription/index.test.ts`
Expected: FAIL — `renameTranscription` is not exported.

- [ ] **Step 3: Add the action creator**

In `src/renderer/src/reducers/transcription/actions.ts`, add `RENAME_TRANSCRIPTION = "RENAME_TRANSCRIPTION",` to the `ActionTypes` enum (right after `REMOVE_TRANSCRIPTION`), then add at the end of the file (before the final closing line):

```ts
export type RenameTranscriptionAction = Action<
  ActionTypes.RENAME_TRANSCRIPTION,
  { transcriptionId: string; title: string }
>;
/**
 * Renames a transcription's title
 * @param transcriptionId ID of the transcription to rename
 * @param title New title
 */
export function renameTranscription(
  transcriptionId: string,
  title: string,
): RenameTranscriptionAction {
  return {
    type: ActionTypes.RENAME_TRANSCRIPTION,
    payload: { transcriptionId, title },
  };
}
```

- [ ] **Step 4: Wire it into the reducer**

In `src/renderer/src/reducers/transcription/index.ts`:

Add the import to the `from "./actions"` block:

```ts
  type RenameTranscriptionAction,
```

Add it to the `TranscriptionAction` union (after `RemoveTranscriptionAction`):

```ts
  | RenameTranscriptionAction
```

Add the case in the `switch`, after the `REMOVE_TRANSCRIPTION` case:

```ts
    // ----------------
    // RENAME TRANSCRIPTION
    // ----------------
    case ActionTypes.RENAME_TRANSCRIPTION: {
      const { transcriptionId, title } = payload;
      return updateTranscription(state, transcriptionId, (t) => ({
        ...t,
        title,
      }));
    }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test src/renderer/src/reducers/transcription/index.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors from these two files.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/reducers/transcription/
git commit -m "feat(voice-to-text): add renameTranscription reducer action"
```

---

### Task 4: Audio metadata + 10s snippet hook

Powers the preview screen's duration label and "play 10 seconds then pause" button (Task 8). Raw `File` objects in the preview step have no object URL or duration yet (those are created later in `transcribeStream`), so this hook owns its own `<audio>` element and object URL with cleanup.

**Files:**
- Create: `src/renderer/src/components/voice-to-text/use-audio-snippet.ts`
- Test: `src/renderer/src/components/voice-to-text/format-duration.test.ts`

We also add a pure formatter `formatDuration` (e.g. `46 min. 34 seg.`) that is easy to unit test, and keep the hook thin around the audio element.

- [ ] **Step 1: Write the failing test for the pure formatter**

Create `src/renderer/src/components/voice-to-text/format-duration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatDuration } from "./use-audio-snippet";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(46 * 60_000 + 34_000)).toBe("46 min. 34 seg.");
  });

  it("formats sub-minute durations as seconds only", () => {
    expect(formatDuration(9_000)).toBe("9 seg.");
  });

  it("treats 0 / NaN as 0 seconds", () => {
    expect(formatDuration(0)).toBe("0 seg.");
    expect(formatDuration(Number.NaN)).toBe("0 seg.");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/renderer/src/components/voice-to-text/format-duration.test.ts`
Expected: FAIL — module/function not found.

- [ ] **Step 3: Implement the hook + formatter**

Create `src/renderer/src/components/voice-to-text/use-audio-snippet.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";

/** Human-readable duration: "46 min. 34 seg." or "9 seg." */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 seg.";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} seg.`;
  return `${minutes} min. ${seconds} seg.`;
}

const SNIPPET_MS = 10_000;

interface UseAudioSnippet {
  durationMs: number;
  isPlaying: boolean;
  /** Play a 10s snippet from the current position; toggles to pause if playing. */
  toggle: () => void;
}

/**
 * Owns an off-DOM <audio> element for `file`, reads its duration once metadata
 * loads, and plays a 10-second snippet (auto-pausing at +10s) on toggle.
 */
export function useAudioSnippet(file: File): UseAudioSnippet {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleMeta = () => {
      const d = audio.duration;
      setDurationMs(Number.isFinite(d) ? d * 1000 : 0);
    };
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", handleMeta);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleMeta);
      audio.removeEventListener("ended", handleEnded);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [file]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      setIsPlaying(false);
      return;
    }
    audio.play().then(
      () => {
        setIsPlaying(true);
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
        }, SNIPPET_MS);
      },
      () => setIsPlaying(false),
    );
  }, []);

  return { durationMs, isPlaying, toggle };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/renderer/src/components/voice-to-text/format-duration.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/voice-to-text/use-audio-snippet.ts src/renderer/src/components/voice-to-text/format-duration.test.ts
git commit -m "feat(voice-to-text): add audio snippet hook + duration formatter"
```

---

### Task 5: Shared header stepper

Screenshots 002/003/progress all show a 4-step indicator in the header center: a filled active circle with its label ("1 Selección", "2 Transcripción", …) and the remaining steps as light circles. The header already supports a `center` slot.

**Files:**
- Create: `src/renderer/src/components/voice-to-text/stepper.tsx`

- [ ] **Step 1: Create the stepper component**

```tsx
import { useTranslation } from "react-i18next";

import { css } from "@/styled/css";
import { HStack, styled } from "@/styled/jsx";

const circle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "8",
  height: "8",
  rounded: "full",
  fontWeight: "[600]",
  fontSize: "[14px]",
  flexShrink: "0",
});

const activeCircle = css({
  bg: "brand.primary",
  color: "text.onbutton-default",
});

const inactiveCircle = css({
  bg: "bg.secondary-highlight",
  color: "text.lighter",
});

interface VoiceStepperProps {
  current: 1 | 2 | 3 | 4;
}

export default function VoiceStepper({ current }: VoiceStepperProps) {
  const { t } = useTranslation("voice-to-text");
  const labels = [
    t("stepper.step1"),
    t("stepper.step2"),
    t("stepper.step3"),
    t("stepper.step4"),
  ];

  return (
    <HStack gap="3" alignItems="center">
      {labels.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3 | 4;
        const isActive = step === current;
        return (
          <HStack key={label} gap="2" alignItems="center">
            <span
              className={`${circle} ${isActive ? activeCircle : inactiveCircle}`}
            >
              {step}
            </span>
            {isActive && (
              <styled.span textStyle="label.md.strong" color="text.default">
                {label}
              </styled.span>
            )}
          </HStack>
        );
      })}
    </HStack>
  );
}
```

- [ ] **Step 2: Wire it into the five voice screens' headers**

Add `import VoiceStepper from "@/components/voice-to-text/stepper";` (adjust relative path inside the `voice-to-text/` folder to `./stepper`) and pass `center` on each `<Header>`:

- `components/voice-to-text/onboarding.tsx` → `center={<VoiceStepper current={1} />}`
- `components/voice-to-text/preview.tsx` → `center={<VoiceStepper current={1} />}`
- `components/voice-to-text/process.tsx` → `center={<VoiceStepper current={2} />}`
- `components/voice-to-text/validation.tsx` → `center={<VoiceStepper current={3} />}` (both the `<Header>` instances in the file)
- `components/voice-to-text/finish.tsx` → `center={<VoiceStepper current={4} />}`

Example for `process.tsx` (the `<Header>` currently at line 152):

```tsx
<Header
  title={t("title")}
  feature={FeatureFlowEnum.VoiceToText}
  center={<VoiceStepper current={2} />}
/>
```

Note: `HeaderProps` already allows `center` alongside `feature` (see `header.tsx:27-34`), so no header type change is needed for this task.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no errors from these files (other VTT files may still error from Task 2 renames — that's fine until their own task).

- [ ] **Step 4: Verify visually**

Run: `pnpm dev` (or `pnpm dev:web`), navigate to Voz a Texto. Confirm the header shows the stepper centered with the active step labeled, matching `screenshots/002_seleccion_de_archivos.png`.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/voice-to-text/stepper.tsx src/renderer/src/components/voice-to-text/*.tsx
git commit -m "feat(voice-to-text): add header step indicator across screens"
```

---

### Task 6: Shared "¿Cómo funciona?" grid + help modal (spec point 2)

Screenshots `001_onboarding.png` and `003_proceso_de_archivos.png` show the same 4-card content — once as a full page (first visit, Task 7), once inside a `?`-triggered modal. Build one shared component used in both places (DRY).

**Files:**
- Create: `src/renderer/src/components/voice-to-text/how-it-works.tsx`
- Modify: `src/renderer/src/components/layout/header.tsx`

Illustrations: reuse the existing `/onboarding-steps/step{1..4}.png` assets (served from `public/`, used today by `components/how-it-works.tsx`). If design provides new voice-specific art later, drop replacements at the same paths — no code change needed.

- [ ] **Step 1: Create the shared grid + modal**

```tsx
import { Question, X } from "phosphor-react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Button from "@/components/ui/button";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { Grid, HStack, Stack, styled } from "@/styled/jsx";

const card = css({
  display: "flex",
  alignItems: "center",
  gap: "5",
  p: "6",
  rounded: "sm",
  border: "primary",
  bg: "bg.secondary",
});

const stepBadge = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "8",
  height: "8",
  rounded: "full",
  bg: "brand.primary",
  color: "text.onbutton-default",
  fontWeight: "[600]",
  fontSize: "[14px]",
  flexShrink: "0",
});

const cardImg = css({ height: "[110px]", flexShrink: "0" });

const helpButton = css({
  color: "text.lighter",
  p: "0.5",
  rounded: "sm",
  cursor: "pointer",
  transition: "colors",
  "&:hover": { bg: "action.hover", color: "text.onbutton-alternative" },
});

const modalContent = css({ minWidth: "[900px]" });
const closeButton = css({ cursor: "pointer", color: "text.lighter" });

const CARD_KEYS = ["card1", "card2", "card3", "card4"] as const;
const CARD_IMAGES: Record<(typeof CARD_KEYS)[number], string> = {
  card1: "/onboarding-steps/step1.png",
  card2: "/onboarding-steps/step2.png",
  card3: "/onboarding-steps/step3.png",
  card4: "/onboarding-steps/step4.png",
};

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
          <HStack gap="4" alignItems="flex-start">
            <span className={stepBadge}>{i + 1}</span>
            <Stack gap="1">
              <styled.h3 textStyle="paragraph.sm.strong">
                {t(`howItWorks.cards.${key}.title`)}
              </styled.h3>
              <styled.p textStyle="paragraph.sm.default" color="text.lighter">
                {t(`howItWorks.cards.${key}.subtitle`)}
              </styled.p>
            </Stack>
          </HStack>
        </div>
      ))}
    </Grid>
  );
}

export default function VoiceHowItWorksModal() {
  const { t } = useTranslation("voice-to-text");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={helpButton}
          aria-label={t("howItWorks.helpAria")}
        >
          <Question size={32} />
        </button>
      </DialogTrigger>
      <DialogContent className={modalContent}>
        <Stack gap="6">
          <HStack justify="space-between" alignItems="center">
            <SectionTitle>{t("howItWorks.modalTitle")}</SectionTitle>
            <DialogClose className={closeButton}>
              <X size={32} />
            </DialogClose>
          </HStack>
          <VoiceHowItWorksGrid />
          <HStack justify="flex-end">
            <DialogClose asChild>
              <Button>{t("howItWorks.gotIt")}</Button>
            </DialogClose>
          </HStack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
```

Confirm `@/components/ui/dialog` exports `Dialog`, `DialogClose`, `DialogContent`, `DialogTrigger` (it does — see the existing `how-it-works-modal.tsx` imports). If `DialogClose` does not accept `asChild`, wrap the button without `asChild` and call close via `onClick` is unnecessary — the existing modal uses `<DialogClose className=...>` directly, so the `asChild` Button variant is the only new usage; if it errors, replace the bottom `DialogClose asChild` block with a plain `<DialogClose className={css({ cursor: "pointer" })}>{t("howItWorks.gotIt")}</DialogClose>` styled as a button.

- [ ] **Step 2: Render the voice modal from the header**

In `src/renderer/src/components/layout/header.tsx`, import the enum and the modal at the top:

```ts
import { FeatureFlowEnum } from "@/types/features";
import VoiceHowItWorksModal from "@/components/voice-to-text/how-it-works";
```

Change the type import line `import type { FeatureFlowEnum } ...` to a value import (remove the `type` keyword) since we now compare against it.

Replace the `rightSlot` definition (header.tsx:43-50) with:

```tsx
  const rightSlot = feature ? (
    <HStack>
      {feature === FeatureFlowEnum.VoiceToText ? (
        <VoiceHowItWorksModal />
      ) : (
        tutorialSeen && <HowItWorksModal feature={feature} />
      )}
      <FeaturesMenu />
    </HStack>
  ) : (
    right
  );
```

This makes the `?` always available on VTT screens (matching 001/002/003) while leaving document features unchanged.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: no new errors from `how-it-works.tsx` or `header.tsx`.

- [ ] **Step 4: Verify visually**

Run app → Voz a Texto. Click the `?` icon in the nav. Confirm the modal matches `screenshots/003_proceso_de_archivos.png`: title "¿Cómo funciona de Voz a Texto?", four numbered illustrated cards, an "Entendido" button, and an X close.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/voice-to-text/how-it-works.tsx src/renderer/src/components/layout/header.tsx
git commit -m "feat(voice-to-text): shared how-it-works grid + always-on help modal"
```

---

### Task 7: Onboarding gating + file-selection drop area (spec points 1 & 3)

First visit → show the how-it-works grid (001). After the user has loaded a file once (`tutorialSeen` is set), the onboarding screen shows the audio file-selection drop area (002) directly.

**Files:**
- Create: `src/renderer/src/components/voice-to-text/file-drop.tsx`
- Modify: `src/renderer/src/components/voice-to-text/onboarding.tsx`

- [ ] **Step 1: Create the audio drop area (matches 002)**

```tsx
import { FileAudio } from "phosphor-react";
import { type DragEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { AUDIO_EXTENSIONS } from "@/constants/config";
import { css, cva } from "@/styled/css";
import { Stack, styled } from "@/styled/jsx";

const zone = cva({
  base: {
    display: "flex",
    flexDir: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4",
    width: "full",
    minHeight: "[320px]",
    rounded: "lg",
    borderWidth: "[1px]",
    borderStyle: "solid",
    cursor: "pointer",
    transition: "[background-color 150ms ease, border-color 150ms ease]",
  },
  variants: {
    dragging: {
      true: { bg: "bg.primary-highlight", borderColor: "brand.primary" },
      false: { bg: "bg.primary-alternative", borderColor: "[#BCBAB8]" },
    },
  },
  defaultVariants: { dragging: false },
});

const iconBox = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16",
  height: "16",
  rounded: "md",
  bg: "bg.secondary-highlight",
  color: "brand.primary",
});

interface VoiceFileDropProps {
  onDropFiles: (files: File[]) => void;
}

function hasAudioExtension(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.includes(ext);
}

export default function VoiceFileDrop({ onDropFiles }: VoiceFileDropProps) {
  const { t } = useTranslation("voice-to-text");
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(hasAudioExtension);
    if (files.length) onDropFiles(files);
  };

  return (
    <button
      type="button"
      className={zone({ dragging })}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      // The footer "Cargar archivo" button opens the file picker; clicking the
      // zone is a no-op placeholder for keyboard users who tab to it.
    >
      <div className={iconBox}>
        <FileAudio size={32} weight="regular" />
      </div>
      <Stack gap="1" align="center">
        <styled.p textStyle="subtitle.md.default" color="text.default" textAlign="center">
          {t("onboarding.dropAreaTitle")}
        </styled.p>
        <styled.p textStyle="paragraph.sm.default" color="text.lighter">
          {t("onboarding.dropAreaFormats")}
        </styled.p>
      </Stack>
    </button>
  );
}
```

If `colors.bg.primary-alternative` / `bg.primary-highlight` / `bg.secondary-highlight` aren't a close enough match to the light-purple fill in 002, bracket the exact hex from Figma instead (e.g. `bg: "[#EEEDFB]"`) — but prefer the token first.

- [ ] **Step 2: Rewrite `onboarding.tsx` to gate on `tutorialSeen`**

Replace the body of `VoiceOnboarding` (`components/voice-to-text/onboarding.tsx`). Keep the existing imports for navigate/file dispatch/hidden input and add the new ones. The full new file:

```tsx
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { type ChangeEventHandler, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import VoiceFileDrop from "@/components/voice-to-text/file-drop";
import {
  VoiceHowItWorksGrid,
} from "@/components/voice-to-text/how-it-works";
import VoiceStepper from "@/components/voice-to-text/stepper";
import { AUDIO_EXTENSIONS } from "@/constants/config";
import { useFileDispatch } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { addFiles } from "@/reducers/file/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";

export default function VoiceOnboarding() {
  const { t } = useTranslation("voice-to-text");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const tutorialSeen = useTutorialSeen(FeatureFlowEnum.VoiceToText);
  const toggleTutorialSeen = useSetTutorialSeen();

  const handleAddFiles = async (files: File[]) => {
    dispatch(addFiles(files));
    await navigate({
      to: "/app/$feature/preview",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });
    toggleTutorialSeen(FeatureFlowEnum.VoiceToText);
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles) handleAddFiles(Array.from(rawFiles));
  };

  const handleOpenInput = () => inputRef.current?.click();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["transcribe"] });
  }, []);

  return (
    <>
      <Header
        title={t("title")}
        feature={FeatureFlowEnum.VoiceToText}
        center={tutorialSeen ? <VoiceStepper current={1} /> : undefined}
      />
      <MainContent>
        {tutorialSeen ? (
          <Stack gap="8">
            <HStack alignItems="center" gap="6">
              <BackButton to="/home/features" />
              <SectionTitle>{t("onboarding.sectionTitle")}</SectionTitle>
            </HStack>
            <VoiceFileDrop onDropFiles={handleAddFiles} />
          </Stack>
        ) : (
          <Stack gap="8">
            <SectionTitle>{t("howItWorks.pageTitle")}</SectionTitle>
            <VoiceHowItWorksGrid />
          </Stack>
        )}
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button onClick={handleOpenInput}>
            {t("onboarding.loadDocuments")}
          </Button>
        </HStack>
      </Footer>
      <HiddenInput
        ref={inputRef}
        onChange={handleInputChange}
        extensions={AUDIO_EXTENSIONS}
        multiple
      />
    </>
  );
}
```

Notes:
- First visit shows `¿Cómo funciona?` title + grid (matches 001); the `?` in the header (Task 6) opens the same content as a modal.
- After first load `tutorialSeen` is true → file-selection drop area (matches 002) with the stepper.
- The old text-only `StepCard`/`stepNumber` styles and `Grid`/`ReactNode` imports are gone (now provided by `VoiceHowItWorksGrid`).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors in `onboarding.tsx` / `file-drop.tsx`.

- [ ] **Step 4: Verify visually (both states)**

Run app. To see the first-visit state, clear the persisted flag: in DevTools console run `localStorage.removeItem("local-storage")` then reload, or open the Application tab and delete the `local-storage` key. Navigate to Voz a Texto:
- First visit → matches `screenshots/001_onboarding.png`.
- Load a file, go back to onboarding (via the stepper/home and re-enter) → matches `screenshots/002_seleccion_de_archivos.png`.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/voice-to-text/onboarding.tsx src/renderer/src/components/voice-to-text/file-drop.tsx
git commit -m "feat(voice-to-text): gate onboarding grid vs audio drop area"
```

---

### Task 8: Selected-file preview restyle + 10s play (spec point 4)

Match `screenshots/002_A_seleccion_de_archivos.png`: header "{n} archivo seleccionado", each file in a bordered row with a purple play button (plays 10s then auto-pauses), filename, "{duration} - {size}" meta, and a trash icon. Footer button "Siguiente".

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/preview.tsx`

- [ ] **Step 1: Add a per-row component with the snippet player**

At the top of `preview.tsx`, replace the icon imports and add the hook + the existing `formatFileSize`. New imports:

```tsx
import { Pause, Play, Trash } from "phosphor-react";
import { useAudioSnippet, formatDuration } from "@/components/voice-to-text/use-audio-snippet";
```

Add row styles (replace the existing `fileRow` / `removeButton` styles with these):

```ts
const fileRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
  width: "full",
  px: "4",
  py: "3",
  rounded: "md",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  bg: "bg.secondary",
});

const playButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "10",
  height: "10",
  rounded: "md",
  border: "[none]",
  cursor: "pointer",
  flexShrink: "0",
  bg: "bg.secondary-highlight",
  color: "brand.primary",
  "&:hover": { bg: "action.hover", color: "text.onbutton-alternative" },
});

const removeButton = css({
  background: "transparent",
  border: "[none]",
  cursor: "pointer",
  color: "text.lighter",
  p: "2",
  rounded: "md",
  flexShrink: "0",
  "&:hover": { color: "system.error" },
});
```

Add a `FileRow` component above `VoicePreview`:

```tsx
function FileRow({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const { t } = useTranslation("voice-to-text");
  const { durationMs, isPlaying, toggle } = useAudioSnippet(file);

  return (
    <div className={fileRow}>
      <HStack gap="3" alignItems="center" minWidth="0">
        <button
          type="button"
          className={playButton}
          onClick={toggle}
          aria-label={
            isPlaying
              ? t("preview.pauseAria", { name: file.name })
              : t("preview.playAria", { name: file.name })
          }
        >
          {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
        </button>
        <Stack gap="0" minWidth="0">
          <styled.span textStyle="paragraph.sm.strong" truncate>
            {file.name}
          </styled.span>
          <styled.span textStyle="paragraph.sm.default" color="text.lighter">
            {t("preview.meta", {
              duration: formatDuration(durationMs),
              size: formatFileSize(file.size),
            })}
          </styled.span>
        </Stack>
      </HStack>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("preview.removeAria", { name: file.name })}
        className={removeButton}
      >
        <Trash size={18} />
      </button>
    </div>
  );
}
```

`formatFileSize` already exists in the file (returns e.g. `21.5 MB`). To match Figma's lowercase "mb", change its return to lowercase: `return \`${(bytes / (1024 * 1024)).toFixed(1)} mb\`;` and `\`${Math.round(bytes / 1024)} kb\`;`. (Optional — confirm with design; default to keeping uppercase if unsure.)

- [ ] **Step 2: Use `FileRow` and update the heading + section title**

In `VoicePreview`'s JSX, replace the `<Card>` body's heading and file list with:

```tsx
          <Card>
            <Stack gap="4">
              <styled.h2 textStyle="subtitle.md.default">
                {t("preview.selectedCount", { count: files.length })}
              </styled.h2>
              <Stack gap="3">
                {files.map((file) => (
                  <FileRow
                    key={file.data.name}
                    file={file.data}
                    onRemove={handleRemoveFile(file.data.name)}
                  />
                ))}
              </Stack>
            </Stack>
          </Card>
```

Update the section title to `{t("preview.sectionTitle")}` (now "1. Selección de archivo"), keep the `BackButton` (to `/app/$feature/onboarding`), and add `center={<VoiceStepper current={1} />}` to the `<Header>` (from Task 5). Keep the footer "Cargar más audios" (secondary) + "Siguiente" buttons; "Siguiente" stays `disabled={files.length === 0}`.

`handleRemoveFile` already returns a handler — note we now call it as `handleRemoveFile(file.data.name)` (invoking to get the handler) and pass that as `onRemove`. Keep its definition `const handleRemoveFile = (fileName: string) => () => {...}`.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Verify visually + functionally**

Run app, load an audio file. Confirm against `screenshots/002_A_seleccion_de_archivos.png`: bordered row, purple play button, filename + "{duration} - {size}", trash icon, "Siguiente". Click play → audio plays and **auto-pauses after ~10 seconds**; clicking again before 10s pauses immediately; the icon toggles play/pause.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/voice-to-text/preview.tsx
git commit -m "feat(voice-to-text): restyle file preview with 10s snippet play"
```

---

### Task 9: Transcription progress states (spec point 5)

Match the four states in `screenshots/003_proceso_de_archivos_progress.png`, `transcript-progress-with-text.png`, `transcript-progress-100.png`, `transcript-progress-error.png`:

- Section title "2. Transcripción de voz a texto"; card title "AymurAI está transcribiendo el archivo." + subtitle.
- Row: filename · right side shows `{percent}%` **and a "Detener" button** while processing; "✓ Carga finalizada 100%" when complete; red "Error en la transcripción del archivo. Volvelo a intentar" + a "↻ Reemplazar" button on error.
- Striped/hatched progress bar (brand stripes), error bar in error tint.
- Text viewport below: placeholder "Esperando las primeras palabras…" or the streamed text with a bottom fade.
- Info callout at the bottom (present except in the error state).

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/process.tsx`

- [ ] **Step 1: Consume `abort` and add a replace input + retry key**

Replace the hook call and add state. Current line 95-97 becomes:

```tsx
  const [retryKey, setRetryKey] = useState(0);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();

  const { progress, status, partialText, abort } = useTranscribe(audioFiles, {
    dispatch: transcriptionDispatch,
  });
```

Add imports: `import { useFileDispatch } from "@/hooks";`, `import { removeAllFiles, addFiles } from "@/reducers/file/actions";`, `import HiddenInput from "@/components/hidden-input";`, `import { AUDIO_EXTENSIONS } from "@/constants/config";`, `import { CheckCircle, Info, ArrowsClockwise } from "phosphor-react";`, and `VoiceStepper`. Keep `useState`, add `useRef` if not already imported (it is).

Add handlers:

```tsx
  const handleStop = () => abort();

  const handleReplaceClick = () => replaceInputRef.current?.click();

  const handleReplaceFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.files;
    if (!raw || raw.length === 0) return;
    dispatch(removeAllFiles());
    dispatch(addFiles(Array.from(raw)));
    setRetryKey((k) => k + 1); // force a fresh transcription pass
  };
```

The `retryKey` is appended to the viewport `key`/used to re-mount is not necessary because `useTranscribe` re-runs when `audioFiles` identity changes (new files dispatched). `retryKey` is only needed if the user replaces with the *same* file object; keep it as a `key` on the outer `<Card>` to force a clean remount: `<Card key={retryKey}>`. Add `import type { ChangeEventHandler } from "react";`.

- [ ] **Step 2: Add striped-bar + state styles**

Replace the `bar`/`barContainer` styles and add new ones:

```ts
const barContainer = css({
  width: "full",
  height: "[10px]",
  bg: "bg.secondary-highlight",
  rounded: "full",
  overflow: "hidden",
});

const barProcessing = css({
  height: "full",
  rounded: "full",
  transition: "[width 200ms ease]",
  // diagonal brand stripes
  backgroundImage:
    "[repeating-linear-gradient(45deg, #3F479D, #3F479D 8px, #6B73C9 8px, #6B73C9 16px)]",
});

const barError = css({
  height: "full",
  width: "full",
  rounded: "full",
  bg: "system.error-secondary",
});

const calloutBox = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  px: "4",
  py: "3",
  rounded: "md",
  bg: "bg.secondary-highlight",
  color: "text.default",
});

const stopButton = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "4",
  py: "2",
  rounded: "md",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "brand.primary",
  bg: "bg.secondary",
  color: "brand.primary",
  cursor: "pointer",
  whiteSpace: "nowrap",
  "&:hover": { bg: "bg.secondary-highlight" },
});
```

If `#3F479D`/`#6B73C9` don't match the brand stripes, read the actual brand primary from `panda.config.ts` `colors.brand.primary` and use that hex; keep the lighter stripe ~30% lighter.

- [ ] **Step 3: Rewrite the status row + bar + callout JSX**

Replace the progress `<Stack gap="2">` block (process.tsx:173-224) with:

```tsx
              <Stack gap="3">
                <HStack justifyContent="space-between" alignItems="center" gap="4">
                  <styled.span
                    textStyle="label.md.default"
                    color={isError ? "system.error" : "text.default"}
                    truncate
                  >
                    {files[0]?.data.name}
                  </styled.span>

                  <HStack gap="3" alignItems="center" flexShrink="0">
                    {isError ? (
                      <styled.span textStyle="label.md.default" color="system.error" fontStyle="italic">
                        {t("process.errorLabel")}
                      </styled.span>
                    ) : isCompleted ? (
                      <HStack gap="2" alignItems="center">
                        <CheckCircle size={20} color="#3F479D" weight="fill" />
                        <styled.span textStyle="label.md.default" color="brand.primary">
                          {t("process.completedLabel")}
                        </styled.span>
                      </HStack>
                    ) : (
                      <styled.span textStyle="label.md.default" color="text.default">
                        {t("process.progressLabel", { percent: progressPercent })}
                      </styled.span>
                    )}

                    {isProcessing && (
                      <button type="button" className={stopButton} onClick={handleStop}>
                        <styled.span width="[14px]" height="[14px]" borderWidth="[2px]" borderStyle="solid" borderColor="brand.primary" rounded="[2px]" />
                        {t("process.stop")}
                      </button>
                    )}
                    {isError && (
                      <button type="button" className={stopButton} onClick={handleReplaceClick}>
                        <ArrowsClockwise size={16} />
                        {t("process.replace")}
                      </button>
                    )}
                  </HStack>
                </HStack>

                <div className={barContainer}>
                  {isError ? (
                    <div className={barError} />
                  ) : (
                    <div
                      className={barProcessing}
                      style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                    />
                  )}
                </div>

                {/* text viewport: show whenever not errored */}
                {!isError && (
                  <div
                    className={previewViewport}
                    aria-live="polite"
                    aria-label={t("process.previewAriaLabel")}
                  >
                    {displayedText ? (
                      <div
                        className={previewTrack}
                        style={{ animationDuration: `${previewDuration}s` }}
                        onAnimationIteration={handleTrackIteration}
                      >
                        {displayedText}
                      </div>
                    ) : (
                      <span className={previewPlaceholder}>
                        {t("process.waitingForWords")}
                      </span>
                    )}
                  </div>
                )}
                {isError && (
                  <div className={previewViewport}>
                    <span className={previewPlaceholder}>
                      {t("process.waitingForWords")}
                    </span>
                  </div>
                )}

                {!isError && (
                  <div className={calloutBox}>
                    <Info size={20} color="#3F479D" />
                    <styled.span textStyle="paragraph.sm.default">
                      {t("process.callout")}
                    </styled.span>
                  </div>
                )}
              </Stack>
```

Note: the completed (100%) screenshot still shows the streamed text and the callout — the `!isError` branch covers both processing and completed; the viewport is no longer gated on `isProcessing`. Adjust the `useEffect` that clears `displayedText` when `!isProcessing` (process.tsx:115-120) so completed text persists: change the condition to `if (status === "idle" || status === "stopped" || status === "error")`.

- [ ] **Step 4: Add the replace `HiddenInput` and stepper**

Add `center={<VoiceStepper current={2} />}` to `<Header>`. Before the closing `</RequireFile>`, add:

```tsx
      <HiddenInput
        ref={replaceInputRef}
        onChange={handleReplaceFiles}
        extensions={AUDIO_EXTENSIONS}
      />
```

Keep the existing footer (Volver/Siguiente) — it's how the user advances to validation when complete (the screenshots crop it out). Leave `Siguiente` `disabled={!isCompleted}`.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Verify all four states**

Run app with the mock STT so states are reachable: `VITE_USE_MOCK_STT=true VITE_STT_MOCK_DELAY_MS=8000 pnpm dev:web` (see `constants/config.ts`). Load a file, continue to the process screen:
- During processing → matches `003_proceso_de_archivos_progress.png` (percent + Detener, striped bar, "Esperando…", callout) and `transcript-progress-with-text.png` once text streams.
- At 100% → matches `transcript-progress-100.png` (✓ Carga finalizada 100%, full striped bar, text, callout).
- Click **Detener** mid-way → transcription aborts (status `stopped`).
- Error state → matches `transcript-progress-error.png` (red filename + message, Reemplazar button, error bar, no callout). To force an error, point at a non-mock backend that 500s, or temporarily throw in `transcribe.ts` to confirm styling, then revert.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/voice-to-text/process.tsx
git commit -m "feat(voice-to-text): progress states with stop, replace, and callout"
```

---

### Task 10: Transcript results restyle (spec point 6)

Match `screenshots/transcrip-results.png`:

- Search bar on top (full width) with the "Modo Edición" toggle on the right of that row; the editable title **below** the search row.
- Title editable via a pencil icon → inline input → dispatch `renameTranscription`.
- Turn body text **left-aligned with the speaker name** (indented past the avatar).
- Bottom bar unifies the audio player and the "Finalizar" button into one bar (the separate footer is removed).

**Files:**
- Modify: `src/renderer/src/components/voice-to-text/audio-player.tsx`
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/index.tsx`
- Modify: `src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx`
- Modify: `src/renderer/src/components/voice-to-text/validation.tsx`

- [ ] **Step 1: Give `AudioPlayer` an optional right slot**

In `audio-player.tsx`, extend the props and render the slot at the end of the bar.

Add to `AudioPlayerProps`:

```ts
  rightSlot?: React.ReactNode;
```

Add `import type { ReactNode } from "react";` (or use `React.ReactNode`). Destructure `rightSlot` in the component signature. After the `progressSection` div (audio-player.tsx:302), before closing `</div>` of `playerBar`, add:

```tsx
        {rightSlot}
```

- [ ] **Step 2: Forward footer actions through the editor + reorder header**

In `transcription-editor/index.tsx`:

Add `footerActions?: React.ReactNode` to `TranscriptionEditorProps` and destructure it. Pass to the player: `<AudioPlayer ... rightSlot={footerActions} />`.

Reorder the header so the search/toolbar row is first and the title is below it. Replace the `<div className={header}>` block (index.tsx:236-290) so the order is: toolbar (search + edit switch) first, then the editable title. Use this structure:

```tsx
      <div className={header}>
        <div className={toolBar}>
          <div className={searchWrapper}>
            {/* unchanged search input + counter + prev/next buttons */}
          </div>
          <label className={switchLabel} htmlFor={switchId}>
            <Switch id={switchId} checked={isEditMode} onCheckedChange={onEditModeChange} />
            <span>{t("editor.editMode")}</span>
          </label>
        </div>

        <EditableTitle
          title={transcription.title}
          onRename={(value) =>
            dispatch(renameTranscription(transcription.id, value))
          }
        />

        {isEditMode && (
          <div className={editBanner}>
            <Info size={20} color="#3F479D" />
            <span>{t("editor.editModeBanner")}</span>
          </div>
        )}
      </div>
```

Add `mt: "4"` spacing to the title and banner via the styles below. Add imports: `import { Info, PencilSimple } from "phosphor-react";`, `import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";`, `import { renameTranscription } from "@/reducers/transcription/actions";`. Get the dispatch in the component: `const dispatch = useTranscriptionDispatch();`.

Add styles:

```ts
const titleRow = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  mt: "4",
});

const titleInput = css({
  fontSize: "[32px]",
  lineHeight: "[38px]",
  fontWeight: "[600]",
  color: "text.default",
  border: "[none]",
  borderBottomWidth: "[2px]",
  borderBottomStyle: "solid",
  borderBottomColor: "brand.primary",
  outline: "none",
  bg: "transparent",
  m: "[0]",
  p: "[0]",
});

const editIconButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "[none]",
  bg: "transparent",
  cursor: "pointer",
  color: "text.lighter",
  p: "1",
  rounded: "[4px]",
  "&:hover": { color: "brand.primary" },
});

const editBanner = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  mt: "4",
  px: "4",
  py: "3",
  rounded: "md",
  bg: "bg.secondary-highlight",
  color: "text.default",
  fontSize: "[14px]",
});
```

Add the `EditableTitle` component in the same file (above `TranscriptionEditor`):

```tsx
function EditableTitle({
  title,
  onRename,
}: {
  title: string;
  onRename: (value: string) => void;
}) {
  const { t } = useTranslation("voice-to-text");
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const prevTitle = useRef(title);
  if (prevTitle.current !== title) {
    prevTitle.current = title;
    setValue(title);
  }

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setValue(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={titleRow}>
        {/* biome-ignore lint/a11y/noAutofocus: explicit user action to edit title */}
        <input
          ref={inputRef}
          autoFocus
          className={titleInput}
          value={value}
          aria-label={t("editor.titleInputAria")}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(title);
              setEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={titleRow}>
      <h1 className={title === "" ? titleInput : undefined} style={{ fontSize: 32, lineHeight: "38px", fontWeight: 600, margin: 0 }}>
        {title}
      </h1>
      <button
        type="button"
        className={editIconButton}
        onClick={() => setEditing(true)}
        aria-label={t("editor.editTitleAria")}
      >
        <PencilSimple size={20} />
      </button>
    </div>
  );
}
```

Note: this `autoFocus` is on a plain input inside the editor body (not a Radix dialog), so the radix-ui "no autoFocus in dialog inputs" rule does not apply. The biome-ignore is needed because biome's a11y rule flags autoFocus generally — keep the comment. Remove the now-unused standalone `const title = css({...})` style only if nothing else references it (the `EditableTitle` uses inline style for the `<h1>` to avoid clashing with the imported `title` css name; rename the old `title` css const to `titleText` and apply it to the `<h1>` instead of inline styles for cleanliness):

Cleaner alternative (preferred): keep the existing `const title = css({...})` recipe, rename it to `titleText`, and in `EditableTitle`'s display branch render `<h1 className={titleText}>{title}</h1>` — dropping the inline `style`. Update the reference accordingly.

- [ ] **Step 3: Align turn text with the speaker name**

In `turn-block.tsx`, restructure so the avatar sits in a left column and the label-row + text share a right column (so text lines up under the speaker name). Replace the render body (the `<button className={header}>` + text block) with:

```tsx
        <div className={row}>
          <button type="button" onClick={handleHeaderClick} className={avatarButton}>
            <SpeakerAvatar speaker={speaker} size="sm" />
          </button>
          <div className={rightCol}>
            <button type="button" onClick={handleHeaderClick} className={labelRow}>
              <span className={speakerLabel}>{speaker.label}</span>
              <span className={timestamp}>{formatTime(turn.startMs)}</span>
            </button>
            {isEditMode ? (
              <textarea
                ref={textareaRef}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleTextBlur}
                onInput={handleTextInput}
                rows={1}
                aria-label={t("editor.turnTextAria")}
                className={textarea}
              />
            ) : (
              <p className={text}>
                {searchQuery ? highlightText(turn.text, searchQuery) : turn.text}
              </p>
            )}
          </div>
        </div>
```

Add/replace styles:

```ts
const row = css({
  display: "flex",
  flexDir: "row",
  alignItems: "flex-start",
  gap: "2",
  width: "full",
});

const avatarButton = css({
  border: "[none]",
  bg: "transparent",
  p: "[0]",
  cursor: "pointer",
  flexShrink: "0",
  mt: "[2px]",
});

const rightCol = css({
  display: "flex",
  flexDir: "column",
  gap: "2",
  flex: "[1]",
  minWidth: "0",
});

const labelRow = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  gap: "2",
  bg: "transparent",
  border: "[none]",
  p: "[0]",
  textAlign: "left",
  cursor: "pointer",
  "&:hover": { opacity: "0.8" },
});
```

Remove the old `header` style usage. Keep `wrap`, `speakerLabel`, `timestamp`, `text`, `textarea`, `trashButton`, `highlightMark`. Because the text is now inside `rightCol` (which starts after the avatar+gap), it aligns with the speaker label. The wrap keeps `px: 8`; the avatar and text now share that left edge offset, with text indented by the avatar column.

- [ ] **Step 4: Move "Finalizar" into the audio bar; drop the standalone footer**

In `validation.tsx`, remove the `<Footer>` block and pass the action via `footerActions`. Replace the success-return JSX (validation.tsx:66-99) with:

```tsx
  return (
    <RequireFile>
      <Stack gap="0" height="screen" overflow="hidden">
        <Header
          title={t("title")}
          feature={FeatureFlowEnum.VoiceToText}
          center={<VoiceStepper current={3} />}
        />
        <div className={editorWrap}>
          <TranscriptionEditor
            transcription={transcription}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            footerActions={
              <Button onClick={handleFinish} disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? t("validation.saving")
                  : t("editor.finish")}
              </Button>
            }
          />
        </div>
      </Stack>
    </RequireFile>
  );
```

Add `import VoiceStepper from "@/components/voice-to-text/stepper";`. Remove the now-unused `Footer` import and the `BackButton`/`HStack` imports if they become unused (keep `HStack` only if still referenced in the early `if (!transcription)` return — that block still uses `Footer`/`BackButton`, so keep those imports; only the success branch loses its footer). The early `!transcription` return may keep its existing `Footer` + `BackButton`.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: no errors. Resolve any unused-import warnings biome flags.

- [ ] **Step 6: Verify visually + functionally**

Run app (mock STT), complete a transcription, go to the results screen. Compare to `screenshots/transcrip-results.png`:
- Search row on top, "Modo Edición" toggle right; editable title below with a pencil icon.
- Click the pencil → edit the title inline → Enter → title updates and persists (dispatch worked).
- Turn body text starts at the same left edge as the speaker name (not under the avatar).
- One bottom bar with audio controls + progress + time + a "Finalizar" button on the right; no separate footer.
- "Finalizar" navigates to the finish screen.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/components/voice-to-text/audio-player.tsx src/renderer/src/components/voice-to-text/transcription-editor/index.tsx src/renderer/src/components/voice-to-text/transcription-editor/turn-block.tsx src/renderer/src/components/voice-to-text/validation.tsx
git commit -m "feat(voice-to-text): results header reorder, editable title, unified footer, text alignment"
```

---

### Task 11: Edit-mode banner (spec point 7)

Match `screenshots/editor.png`: when "Modo Edición" is on, show the banner "Modo edición activo. Seleccioná el texto para modificarlo." below the title.

This was already wired in Task 10 Step 2 (the `{isEditMode && (<div className={editBanner}>…)}` block and the `editBanner` style). This task verifies it independently and covers the edit-mode visual diffs.

**Files:**
- (verification of `transcription-editor/index.tsx` from Task 10; no new file)

- [ ] **Step 1: Confirm the banner renders only in edit mode**

Re-read `transcription-editor/index.tsx` and confirm the banner block sits below `EditableTitle`, is guarded by `isEditMode`, uses `t("editor.editModeBanner")`, and the `editBanner` style exists.

- [ ] **Step 2: Verify visually**

Run app → results screen → toggle "Modo Edición" on. Compare to `screenshots/editor.png`:
- Toggle is filled/on.
- Banner "Modo edición activo. Seleccioná el texto para modificarlo." with the info icon appears below the title.
- Turn text becomes editable (textarea) and aligned with the speaker name; trash icon on each turn; "+ Agregar turno" between turns; suggested-speakers panel on the right.
- Toggle off → banner disappears.

- [ ] **Step 3: Commit (only if any tweak was needed)**

```bash
git add src/renderer/src/components/voice-to-text/transcription-editor/index.tsx
git commit -m "feat(voice-to-text): edit-mode banner"
```

If no change was needed beyond Task 10, skip this commit.

---

### Task 12: Full-flow verification + gates

**Files:** none (verification only)

- [ ] **Step 1: Run the full validation gate**

Run: `pnpm typecheck && pnpm lint && pnpm knip`
Expected: all pass. Fix any unused exports knip flags (e.g. if `formatDuration` or `VoiceHowItWorksGrid` is reported unused, confirm it's imported where expected).

- [ ] **Step 2: Run the logic tests (if Task 1 was done)**

Run: `pnpm test`
Expected: all pass (smoke + reducer + formatter).

- [ ] **Step 3: End-to-end manual walkthrough against every screenshot**

Run app with mock STT. Walk the whole flow and tick each screen against its screenshot:
- First-visit grid → `001_onboarding.png`
- `?` modal → `003_proceso_de_archivos.png`
- File selection (returning user) → `002_seleccion_de_archivos.png`
- Selected file + 10s play → `002_A_seleccion_de_archivos.png`
- Progress / with-text / 100% / error → `003_proceso_de_archivos_progress.png`, `transcript-progress-with-text.png`, `transcript-progress-100.png`, `transcript-progress-error.png`
- Results → `transcrip-results.png`
- Edit mode → `editor.png`

- [ ] **Step 4: Confirm no regressions for document features**

Open the Dataset/Anonymizer flows; confirm their onboarding, header `?` (gated, generic modal), and screens are unchanged.

- [ ] **Step 5: Final commit / branch is ready**

```bash
git status   # should be clean
git log --oneline feature/voice-to-text -12
```

Then use superpowers:finishing-a-development-branch to decide merge/PR.

---

## Self-review notes

- **Spec coverage:** all 7 Figma points map to Tasks 6–11 (table above), plus the inferred stepper (Task 5) and supporting logic (Tasks 1–4). If the user does **not** want the header stepper, drop Task 5 and the `center={<VoiceStepper .../>}` additions.
- **Decisions to confirm with the user:**
  1. Header stepper is inferred from screenshots, not explicitly requested.
  2. The progress screen keeps its Volver/Siguiente footer (screenshots crop the bottom); "Reemplazar" replaces the file and restarts, "Detener" calls `abort()`.
  3. File-size casing ("mb" vs "MB") and exact light-purple/brand hex values should be matched to Figma tokens; the plan prefers semantic tokens and flags where a bracketed hex may be needed.
  4. Reused `/onboarding-steps/step{1..4}.png` illustrations for the how-it-works cards; swap assets if design provides voice-specific art.
- **Type consistency:** `renameTranscription(transcriptionId, title)` is defined in Task 3 and called identically in Task 10. `useAudioSnippet(file)`/`formatDuration(ms)` defined in Task 4, consumed in Task 8. `VoiceStepper current` prop is `1|2|3|4` everywhere. `footerActions` prop added to `TranscriptionEditor` (Task 10) and `rightSlot` to `AudioPlayer` (Task 10) match.
- **No test runner caveat:** Tasks 3 & 4 assume Task 1 (vitest). If skipped, verify via `pnpm typecheck` and a manual reducer check.
