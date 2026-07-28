# Resumen de Documento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the "Resumen de Documento" flow to `desktop-app` — enable the
existing disabled dashboard/menu entries, add a streaming summarization step, and
a rich-text validation + export flow — per
`docs/superpowers/specs/2026-07-22-resumen-de-documento-design.md`.

**Architecture:** Onboarding/Previsualización need **no new code** — they already
run through the shared, feature-agnostic `DocumentOnboarding`/`DocumentPreview`
components, so Summarizer joins for free once the enum/i18n exist. Everything
else is new: a mock-first streaming summarization service (mirrors
`transcribe.ts`/`transcribeStream.ts`), a `Summary` context+reducer (mirrors
`context/Transcription.tsx`), a `useSummarize` hook (mirrors `useTranscribe`), a
`RichTextEditor`-based validation screen, an adapter-based persistence client (real
implementation written now, backed by a no-op until the backend endpoint exists),
and an export pipeline (ODT/TXT client-side, PDF via the existing
`/convert/odt/pdf` endpoint).

**Tech Stack:** React 19, TypeScript, TanStack Router/Query, Panda CSS, i18next,
Vitest + React Testing Library, `@aymurai/ui`'s `RichTextEditor` (see the
companion `ui-components` plan, `docs/superpowers/plans/2026-07-22-rich-text-editor.md`).

## Global Constraints

- Package manager is pnpm; do not run `npm install`.
- **This plan depends on the `ui-components` `RichTextEditor` plan having landed
  and been built** (`cd ../ui-components && pnpm build`) before Task 10 — `@aymurai/ui`
  resolves live from source via a workspace symlink in this repo (confirmed:
  `node_modules/@aymurai/ui` → `../../../ui-components`), so a fresh
  `ui-components` build is required any time this repo's code starts importing
  new `@aymurai/ui` exports. Tasks 1–9 have no such dependency and can proceed
  immediately.
- Panda `strictTokens: true` — any arbitrary value needs the `[bracket]` escape.
- Radix primitives come from `@aymurai/ui`, never `@radix-ui/*` directly.
- All user-facing strings go through i18next (`useTranslation`) — no hardcoded
  Spanish in components.
- Existing tests mock `react-i18next`'s `useTranslation` as `(key) => key` — new
  tests in this plan follow the same convention.
- Every task ends green on `pnpm test <changed test files>`, `pnpm lint`, and
  `pnpm typecheck` before moving to the next task.
- **Excluded from this plan** (per the design doc): "Acortar"/"Alargar" AI
  rewrite actions and their backend endpoint; entity-tag pills; a numeric
  progress indicator for the processing screen; a real PDF/DOCX rendering
  engine.

---

## Task 1: `FeatureFlowEnum.Summarizer` + i18n

**Files:**
- Modify: `src/renderer/src/types/features.ts`
- Modify: `src/renderer/src/routes/app.$feature/route.tsx:16-21`
- Create: `src/renderer/src/constants/i18n/locales/es/summarizer.ts`
- Modify: `src/renderer/src/constants/i18n/locales/es/index.ts`
- Modify: `src/renderer/src/constants/i18n/locales/es/common.ts:17`
- Modify: `src/renderer/src/constants/config.ts` (FEATURE_ICON)

**Interfaces:**
- Produces: `FeatureFlowEnum.Summarizer = "SUMMARIZER"`,
  `featureNamespace[FeatureFlowEnum.Summarizer] === "summarizer"`,
  `FEATURE_ICON[FeatureFlowEnum.Summarizer]` (an `Icon` from `phosphor-react`).
  Every later task that branches on `feature` relies on this exact enum member.

**Context:** This is the root of every later branch (`if (feature === FeatureFlowEnum.Summarizer)`).
The route's zod schema whitelists valid `feature` values — omitting the new
member there means `/app/SUMMARIZER/...` 404s via redirect, even after every
other piece of this plan is done. The dashboard rename ("Resumen de Documentos"
→ "Resumen de Documento", singular, per the Figma design) also happens here since
it's a one-line copy change in the same file family.

- [ ] **Step 1: Add the enum member and namespace mapping**

In `src/renderer/src/types/features.ts`:

```ts
export enum FeatureFlowEnum {
  Dataset = "DATA_SET",
  Anonymizer = "ANONYMIZER",
  VoiceToText = "VOICE_TO_TEXT",
  Summarizer = "SUMMARIZER",
}

export const featureNamespace = {
  [FeatureFlowEnum.Dataset]: "dataset",
  [FeatureFlowEnum.Anonymizer]: "anonymizer",
  [FeatureFlowEnum.VoiceToText]: "voice-to-text",
  [FeatureFlowEnum.Summarizer]: "summarizer",
} as const satisfies Record<FeatureFlowEnum, string>;
```

- [ ] **Step 2: Whitelist it in the route's param schema**

In `src/renderer/src/routes/app.$feature/route.tsx`, replace:

```ts
const featureParamSchema = z.object({
  feature: z.enum([
    FeatureFlowEnum.Dataset,
    FeatureFlowEnum.Anonymizer,
    FeatureFlowEnum.VoiceToText,
  ]),
});
```

with:

```ts
const featureParamSchema = z.object({
  feature: z.enum([
    FeatureFlowEnum.Dataset,
    FeatureFlowEnum.Anonymizer,
    FeatureFlowEnum.VoiceToText,
    FeatureFlowEnum.Summarizer,
  ]),
});
```

- [ ] **Step 3: Add the `summarizer` i18n locale**

Create `src/renderer/src/constants/i18n/locales/es/summarizer.ts`, mirroring
`dataset.ts`'s shape exactly (these keys are what `DocumentOnboarding`/
`DocumentPreview` already read via `featureNamespace`):

```ts
import { DOCUMENT_EXTENSIONS } from "@/constants/config";

const documentFormats = `Formatos válidos: ${DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(", ")}`;

const summarizer = {
  title: "Resumen de Documento",
  subtitle: "Genera síntesis claras de resoluciones judiciales extensas",
  onboarding: {
    sectionTitle: "1. Selección de archivo",
    validFormats: documentFormats,
    loadDocuments: "Cargar documento",
    dropAreaTitle: "Selecciona el archivo para resumir",
    dropAreaFormats: documentFormats,
  },
  preview: {
    sectionTitle: "Previsualización",
    filesLabel: "Vista previa del documento",
    validFormats: documentFormats,
    continue: "Continuar",
  },
  howItWorks: {
    step1: {
      alt: "Interfaz web con selector y cursor",
      title: "Sube tu documento",
      subtitle: "Carga un archivo en formato .doc, .docx",
    },
    step2: {
      alt: "Barra de progreso cargando",
      title: "La inteligencia artificial lo resume",
      subtitle: "Extrae la información relevante del documento.",
    },
    step3: {
      alt: "Visor de documentos con emoticones",
      title: "Revisa y edita el resultado",
      subtitle: "Revisa el resumen y edita el texto antes de exportar el archivo.",
    },
    step4: {
      alt: "Binoculares con globo terráqueo",
      title: "Descarga tu archivo",
      subtitle: "El archivo queda listo para descargar en formato de texto.",
    },
  },
  process: {
    sectionTitle: "2. Resumiendo documento",
    processingTitle: "AymurAI está resumiendo el archivo.",
    processingSubtitle: "Este proceso puede tardar algunos minutos.",
    waitingForWords: "Esperando las primeras palabras…",
    previewAriaLabel: "Vista previa del resumen",
    callout:
      "Resumiendo texto. Puede demorar unos minutos. Aparecerá aquí cuando esté listo.",
    back: "Volver",
    next: "Siguiente",
  },
  validation: {
    sectionTitle: "3. Validación",
    back: "Volver",
    finish: "Finalizar",
    saving: "Guardando...",
    saveFailed:
      "No se pudo guardar la validación. Podés continuar, pero los cambios podrían no quedar persistidos.",
    missingSummary: "No se encontró ningún resumen generado.",
    originalDocumentLabel: "Documento original",
  },
  finish: {
    sectionTitle: "4. Finalización",
    description: "El resumen del documento ya esta listo.",
    previewLabel: "Pre-visualización",
    exportOptionsLabel: "Opciones de exportación",
    formatLabel: "Formato de archivo",
    back: "Volver",
    export: "Exportar",
  },
};

export default summarizer;
```

- [ ] **Step 4: Register the new locale**

In `src/renderer/src/constants/i18n/locales/es/index.ts`:

```ts
import anonymizer from "./anonymizer";
import common from "./common";
import dataset from "./dataset";
import summarizer from "./summarizer";
import voiceToText from "./voice-to-text";

const es = {
  common,
  dataset,
  anonymizer,
  "voice-to-text": voiceToText,
  summarizer,
};

export default es;
```

- [ ] **Step 5: Rename the dashboard title copy (singular)**

In `src/renderer/src/constants/i18n/locales/es/common.ts:17`, replace:

```ts
      summaryTitle: "Resumen de Documentos",
```

with:

```ts
      summaryTitle: "Resumen de Documento",
```

(`featuresMenu.summary` at line 8, "Resumen", stays unchanged — intentionally
short for the menu's limited space.)

- [ ] **Step 6: Add the feature icon**

In `src/renderer/src/constants/config.ts`, add an `Article` mapping (already
imported by `routes/home/features.tsx` for the disabled card, so this just
moves it into the shared config):

```ts
import { Article, Database, Detective, FileAudio } from "phosphor-react";
// ...
export const FEATURE_ICON: Record<FeatureFlowEnum, Icon> = {
  [FeatureFlowEnum.Dataset]: Database,
  [FeatureFlowEnum.Anonymizer]: Detective,
  [FeatureFlowEnum.VoiceToText]: FileAudio,
  [FeatureFlowEnum.Summarizer]: Article,
};
```

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: no errors — every `Record<FeatureFlowEnum, ...>` map (`featureNamespace`,
`FEATURE_ICON`) is statically checked to cover all enum members, so a missing
entry would fail here.

- [ ] **Step 8: Run the existing suite**

Run: `pnpm test`
Expected: same pass count as before (no behavior changed yet — Dashboard/
FeaturesMenu still show the old disabled entry until Tasks 2–3).

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/types/features.ts src/renderer/src/routes/app.\$feature/route.tsx src/renderer/src/constants/i18n/locales/es/summarizer.ts src/renderer/src/constants/i18n/locales/es/index.ts src/renderer/src/constants/i18n/locales/es/common.ts src/renderer/src/constants/config.ts
git commit -m "feat(summarizer): add FeatureFlowEnum.Summarizer and i18n locale"
```

---

## Task 2: Enable the Dashboard card

**Files:**
- Modify: `src/renderer/src/routes/home/features.tsx`

**Interfaces:** None — consumes Task 1's enum/i18n/icon.

**Context:** `routes/home/features.tsx:124-130` renders a bare, disabled
`CardTool` for Summarizer, outside the `FeatureCardLink` pattern the other three
features use. This task converts it to a real, routable card.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/routes/home/features.test.tsx` (no test file exists for
this route today):

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./features";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

describe("home/features — Summarizer card", () => {
  it("renders the Summarizer card as an enabled link to /app/SUMMARIZER", () => {
    const RouteComponent = Route.options.component;
    render(<RouteComponent />);

    const link = screen.getByText("home.features.summaryTitle").closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("SUMMARIZER"));
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/routes/home/features.test.tsx`
Expected: FAIL — today's card is a bare `<CardTool disabled>`, not wrapped in a
`<Link>`, so `closest("a")` is `null`.

- [ ] **Step 3: Convert the disabled card into a `FeatureCardLink`**

In `src/renderer/src/routes/home/features.tsx`, replace:

```tsx
                <CardTool
                  className={featureCard}
                  icon={<Article />}
                  title={t("home.features.summaryTitle")}
                  description={t("home.features.summarySubtitle")}
                  disabled
                />
```

with:

```tsx
                <FeatureCardLink
                  to="/app/$feature"
                  params={{ feature: FeatureFlowEnum.Summarizer }}
                  title={t("home.features.summaryTitle")}
                  subtitle={t("home.features.summarySubtitle")}
                  icon={FEATURE_ICON.SUMMARIZER}
                />
```

Remove the now-unused `Article` import and `CardTool` import if nothing else in
the file uses them:

Run: `grep -n "Article\|CardTool" src/renderer/src/routes/home/features.tsx`
If `CardTool` is only used by `FeatureCardLink`'s internals (it is — see
`FeatureCardLink`'s definition earlier in the same file, which still needs the
import), keep the `CardTool` import; only drop `Article` if this was its sole
use in the file.

- [ ] **Step 4: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/routes/home/features.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 6: Visual smoke check**

Run `pnpm dev:web`, open the dashboard, confirm the fourth card now reads
"Resumen de Documento" (singular), is not visually disabled, and clicking it
navigates to `/app/SUMMARIZER/onboarding`.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/routes/home/features.tsx src/renderer/src/routes/home/features.test.tsx
git commit -m "feat(summarizer): enable the Summarizer dashboard card"
```

---

## Task 3: Enable the FeaturesMenu entry

**Files:**
- Modify: `src/renderer/src/components/features-menu.tsx`
- Modify: `src/renderer/src/components/features-menu.test.tsx` (if it exists;
  otherwise create it)

**Interfaces:** None — consumes Task 1's enum/i18n/icon.

**Context:** `features-menu.tsx:75-79` renders a separate, disabled
`FeaturesMenuItem` for Summarizer, outside the `features.map` loop the other
three features go through. This task moves it into that loop so it's wired to
`goToFeature` like the rest.

- [ ] **Step 1: Check for an existing test file and read it first**

Run: `find src/renderer/src/components -maxdepth 1 -iname "features-menu.test.tsx"`
If it exists, read it before changing anything — it likely already asserts
navigation for Dataset/Anonimizador/Voz-a-Texto by iterating `FeatureFlowEnum`
values, in which case it needs no new assertions (Summarizer is now just another
value the existing loop-based test already covers). If it does NOT exist,
create it with the case below.

- [ ] **Step 2: Write/extend the test**

```tsx
// src/renderer/src/components/features-menu.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FeaturesMenu from "./features-menu";

const dispatch = vi.fn();
vi.mock("@/hooks/useFiles", () => ({
  useFileDispatch: () => dispatch,
}));

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

describe("FeaturesMenu — Summarizer", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockClear();
  });

  it("navigates to the Summarizer flow and clears files on click", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByText("summarizer:title"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/app/$feature",
        params: { feature: "SUMMARIZER" },
      }),
    );
  });

  it("no longer renders a separate disabled Summarizer entry", () => {
    render(<FeaturesMenu />);
    expect(screen.queryByText("common:featuresMenu.summary")).toBeNull();
  });
});
```

- [ ] **Step 3: Run it, confirm it fails**

Run: `pnpm test src/renderer/src/components/features-menu.test.tsx`
Expected: FAIL — today, clicking `t("title", { ns: "summarizer" })` finds
nothing (the item outside the loop uses `t("featuresMenu.summary")` as its
label instead), and the disabled entry is still present.

- [ ] **Step 4: Move the entry into the loop**

In `src/renderer/src/components/features-menu.tsx`, remove the standalone
disabled entry:

```tsx
          <FeaturesMenuItem
            icon={<Article size={24} />}
            label={t("featuresMenu.summary")}
            disabled
          />
```

Since `features = Object.values(FeatureFlowEnum)` already includes
`FeatureFlowEnum.Summarizer` after Task 1, the existing `features.map` loop
picks it up automatically — no loop changes needed. Remove the now-unused
`Article` import if nothing else in the file uses it:

Run: `grep -n "Article" src/renderer/src/components/features-menu.tsx`
If that was its only use, delete the import line.

- [ ] **Step 5: Run the test again, confirm it passes**

Run: `pnpm test src/renderer/src/components/features-menu.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 7: Visual smoke check**

Run `pnpm dev:web`, open the apps (dots) menu from any screen, confirm
"Resumen" appears as an enabled row alongside the other three and navigates
correctly.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/components/features-menu.tsx src/renderer/src/components/features-menu.test.tsx
git commit -m "feat(summarizer): enable the Summarizer FeaturesMenu entry"
```

---

## Task 4: Summarization SSE contract + mock stream

**Files:**
- Create: `src/renderer/src/services/aymurai/summarization.ts`
- Create: `src/renderer/src/services/aymurai/summarization.test.ts`
- Create: `src/renderer/src/services/aymurai/mockSummarize.ts`
- Create: `src/renderer/src/services/aymurai/summarize.ts`
- Modify: `src/renderer/src/constants/config.ts`

**Interfaces:**
- Produces: `SummarizationRequest`, `SummarizationStep`, `SummarizationResponse`,
  `SummaryStreamEvent` (types); `parseSseMessages(buffer: string): { events: SummaryStreamEvent[]; remainder: string }`;
  `summarizeStream(text: string, opts: { signal?: AbortSignal; onPartialText?: (text: string) => void }): Promise<SummarizationResponse>`;
  `summarize(text: string, signal?: AbortSignal): Promise<SummarizationResponse>`
  (all from `summarization.ts`); `mockSummarizeStream` (same shape, from
  `mockSummarize.ts`); `summarizeDocumentStream` (the dispatcher, from
  `summarize.ts`) — this is what Task 6's `useSummarize` hook calls.

**Context:** Neither `/llm/summarize` nor `/llm/summarize/stream` exist on the
backend yet — this is the external/blocking dependency called out in the design
doc. This task writes the real client against the anticipated contract (so it's
ready the moment the backend exists) plus a mock implementation
(`USE_MOCK_SUMMARIZE`, mirroring `USE_MOCK_STT`) so every later task can be
built and tested without a live backend.

- [ ] **Step 1: Write the failing tests for the SSE frame parser**

```ts
// src/renderer/src/services/aymurai/summarization.test.ts
import { describe, expect, it } from "vitest";
import { parseSseMessages } from "./summarization";

describe("parseSseMessages", () => {
  it("parses a single complete SSE frame", () => {
    const buffer = 'data: {"type":"meta","model":"gpt"}\n\n';
    const { events, remainder } = parseSseMessages(buffer);
    expect(events).toEqual([{ type: "meta", model: "gpt" }]);
    expect(remainder).toBe("");
  });

  it("parses multiple frames delivered in one chunk", () => {
    const buffer =
      'data: {"type":"token","text":"Hola"}\n\n' +
      'data: {"type":"token","text":" mundo"}\n\n';
    const { events } = parseSseMessages(buffer);
    expect(events).toEqual([
      { type: "token", text: "Hola" },
      { type: "token", text: " mundo" },
    ]);
  });

  it("keeps an incomplete trailing frame as the remainder", () => {
    const buffer =
      'data: {"type":"token","text":"Hola"}\n\n' + 'data: {"type":"tok';
    const { events, remainder } = parseSseMessages(buffer);
    expect(events).toEqual([{ type: "token", text: "Hola" }]);
    expect(remainder).toBe('data: {"type":"tok');
  });

  it("skips a malformed frame without throwing", () => {
    const buffer = "data: not json\n\n" + 'data: {"type":"meta"}\n\n';
    const { events } = parseSseMessages(buffer);
    expect(events).toEqual([{ type: "meta" }]);
  });

  it("returns an empty remainder and no events for an empty buffer", () => {
    expect(parseSseMessages("")).toEqual({ events: [], remainder: "" });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test src/renderer/src/services/aymurai/summarization.test.ts`
Expected: FAIL — `./summarization` doesn't exist yet.

- [ ] **Step 3: Implement `summarization.ts`**

```ts
// src/renderer/src/services/aymurai/summarization.ts
import api from "@/services/api";

export interface SummarizationRequest {
  text: string;
  model?: string;
}

export interface SummarizationStep {
  chunk_index: number;
  input_tokens: number;
  source: string;
}

export interface SummarizationResponse {
  summary: string;
  model: string;
  chunks_used: number;
  steps: SummarizationStep[];
}

export type SummaryStreamEvent =
  | { type: "meta"; model?: string }
  | { type: "token"; chunk_index?: number; source?: string; text: string }
  | {
      type: "summary";
      summary: string;
      chunks_used?: number;
      steps?: SummarizationStep[];
      model?: string;
    };

export function parseSseMessages(buffer: string): {
  events: SummaryStreamEvent[];
  remainder: string;
} {
  const frames = buffer.split("\n\n");
  const remainder = frames.pop() ?? "";
  const events: SummaryStreamEvent[] = [];

  for (const frame of frames) {
    const dataLines = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trim());
    if (dataLines.length === 0) continue;

    try {
      events.push(JSON.parse(dataLines.join("")) as SummaryStreamEvent);
    } catch {
      // Malformed frame — drop it and keep going.
    }
  }

  return { events, remainder };
}

class FatalStreamError extends Error {}

export interface SummarizeStreamOptions {
  signal?: AbortSignal;
  onPartialText?: (text: string) => void;
}

export async function summarizeStream(
  text: string,
  { signal, onPartialText }: SummarizeStreamOptions,
): Promise<SummarizationResponse> {
  const baseURL = api.defaults.baseURL?.replace(/\/$/, "");
  if (!baseURL) {
    throw new Error(
      "No server selected. Connect to a server from the login page first.",
    );
  }

  const response = await fetch(`${baseURL}/llm/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ text } satisfies SummarizationRequest),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new FatalStreamError(
      `Summarization stream failed: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const tokens: string[] = [];
  let finalResponse: SummarizationResponse | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseMessages(buffer);
    buffer = parsed.remainder;

    for (const event of parsed.events) {
      if (event.type === "token") {
        tokens.push(event.text);
        onPartialText?.(tokens.join(""));
      } else if (event.type === "summary") {
        finalResponse = {
          summary: event.summary,
          model: event.model ?? "",
          chunks_used: event.chunks_used ?? 0,
          steps: event.steps ?? [],
        };
      }
    }
  }

  if (!finalResponse) {
    throw new FatalStreamError(
      "Summarization stream ended without a final summary event",
    );
  }

  return finalResponse;
}

export async function summarize(
  text: string,
  signal?: AbortSignal,
): Promise<SummarizationResponse> {
  const response = await api.post<SummarizationResponse>(
    "/llm/summarize",
    { text } satisfies SummarizationRequest,
    { signal },
  );
  return response.data;
}
```

- [ ] **Step 4: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/services/aymurai/summarization.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the mock config flags**

In `src/renderer/src/constants/config.ts`, next to `USE_MOCK_STT`:

```ts
export const USE_MOCK_SUMMARIZE =
  import.meta.env.VITE_USE_MOCK_SUMMARIZE === "true";
export const SUMMARIZE_MOCK_DELAY_MS = Number(
  import.meta.env.VITE_SUMMARIZE_MOCK_DELAY_MS ?? 300,
);
```

- [ ] **Step 6: Implement the mock stream**

```ts
// src/renderer/src/services/aymurai/mockSummarize.ts
import { SUMMARIZE_MOCK_DELAY_MS } from "@/constants/config";
import type { SummarizationResponse, SummarizeStreamOptions } from "./summarization";

const MOCK_SUMMARY =
  "Este es un resumen de prueba generado localmente, sin backend, para " +
  "desarrollar y probar la pantalla de validación de extremo a extremo.";

export async function mockSummarizeStream(
  _text: string,
  { signal, onPartialText }: SummarizeStreamOptions,
): Promise<SummarizationResponse> {
  const words = MOCK_SUMMARY.split(" ");
  let acc = "";

  for (const word of words) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    await new Promise((resolve) => setTimeout(resolve, SUMMARIZE_MOCK_DELAY_MS));
    acc += (acc ? " " : "") + word;
    onPartialText?.(acc);
  }

  return { summary: acc, model: "mock", chunks_used: 1, steps: [] };
}
```

- [ ] **Step 7: Implement the dispatcher**

```ts
// src/renderer/src/services/aymurai/summarize.ts
import { USE_MOCK_SUMMARIZE } from "@/constants/config";
import { mockSummarizeStream } from "./mockSummarize";
import {
  type SummarizeStreamOptions,
  summarizeStream,
} from "./summarization";

export function summarizeDocumentStream(
  text: string,
  options: SummarizeStreamOptions,
) {
  return USE_MOCK_SUMMARIZE
    ? mockSummarizeStream(text, options)
    : summarizeStream(text, options);
}
```

- [ ] **Step 8: Typecheck**

Run: `pnpm typecheck`

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/services/aymurai/summarization.ts src/renderer/src/services/aymurai/summarization.test.ts src/renderer/src/services/aymurai/mockSummarize.ts src/renderer/src/services/aymurai/summarize.ts src/renderer/src/constants/config.ts
git commit -m "feat(summarizer): add summarization SSE client, mock stream, and dispatcher"
```

---

## Task 5: `Summary` context + reducer

**Files:**
- Create: `src/renderer/src/context/Summary.tsx`
- Create: `src/renderer/src/context/Summary.test.tsx`

**Interfaces:**
- Produces: `SummaryProvider` (component), `useSummary()` / `useSummaryDispatch()`
  (hooks), `SummaryState`, `SummaryAction`, `RichTextDocument`,
  `RichTextParagraph`, `TextRun`, `TextMark` (types), and action creators
  `reset()`, `start(fileName: string)`, `setPartialText(text: string)`,
  `finish(summary: string)`, `error(message: string)`, `stop()`,
  `edit(document: RichTextDocument)`, `editTitle(title: string)` — all exported
  from this one file (mirrors the reference branch's single-file
  `context/Summary.tsx`, simpler than `desktop-app`'s split
  `reducers/transcription/` convention since this state is much smaller).
- Consumes: `RichTextDocument`, `documentFromPlainText` — these come from
  `@aymurai/ui` (the companion `ui-components` plan exports them); until that
  plan lands, this task can proceed using a local placeholder type (see Step 3)
  and switch the import once `@aymurai/ui` is rebuilt — **do not** block this
  task on the other repo.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/renderer/src/context/Summary.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SummaryProvider, {
  edit,
  editTitle,
  error,
  finish,
  reset,
  setPartialText,
  start,
  stop,
  useSummary,
  useSummaryDispatch,
} from "./Summary";

function wrapper({ children }: { children: React.ReactNode }) {
  return <SummaryProvider>{children}</SummaryProvider>;
}

describe("Summary context", () => {
  it("starts in idle state", () => {
    const { result } = renderHook(() => useSummary(), { wrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.document).toBeNull();
  });

  it("start() sets status to streaming and derives a default title", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("acta.docx")));
    expect(result.current.state.status).toBe("streaming");
    expect(result.current.state.title).toBe("Resumen acta.docx");
  });

  it("setPartialText() replaces (not appends to) partialText", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(setPartialText("Hola")));
    act(() => result.current.dispatch(setPartialText("Hola mundo")));
    expect(result.current.state.partialText).toBe("Hola mundo");
  });

  it("finish() sets status to completed and parses the summary into a document", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(finish("Primer párrafo.\n\nSegundo párrafo.")));
    expect(result.current.state.status).toBe("completed");
    expect(result.current.state.document?.paragraphs).toHaveLength(2);
  });

  it("error()/stop() set the corresponding status", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(error("boom")));
    expect(result.current.state.status).toBe("error");
    expect(result.current.state.error).toBe("boom");

    act(() => result.current.dispatch(stop()));
    expect(result.current.state.status).toBe("stopped");
  });

  it("edit()/editTitle() update the document and title without touching status", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(finish("Texto.")));
    act(() =>
      result.current.dispatch(edit({ paragraphs: [{ id: "p0", runs: [] }] })),
    );
    act(() => result.current.dispatch(editTitle("Nuevo título")));
    expect(result.current.state.status).toBe("completed");
    expect(result.current.state.document).toEqual({
      paragraphs: [{ id: "p0", runs: [] }],
    });
    expect(result.current.state.title).toBe("Nuevo título");
  });

  it("reset() returns to the initial state", () => {
    const { result } = renderHook(
      () => ({ state: useSummary(), dispatch: useSummaryDispatch() }),
      { wrapper },
    );
    act(() => result.current.dispatch(start("a.docx")));
    act(() => result.current.dispatch(reset()));
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.title).toBe("");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test src/renderer/src/context/Summary.test.tsx`
Expected: FAIL — `./Summary` doesn't exist yet.

- [ ] **Step 3: Implement `Summary.tsx`**

Uses a minimal local `RichTextDocument`/`documentFromPlainText` shim so this
task has zero dependency on the `ui-components` plan landing first — swap the
import for `@aymurai/ui`'s real export once that plan ships (same shape, so no
other code in this file changes).

```tsx
// src/renderer/src/context/Summary.tsx
import { createContext, useContext, useReducer } from "react";

// TODO(ui-components): replace with
// `import { documentFromPlainText, type RichTextDocument, type RichTextParagraph, type TextRun, type TextMark } from "@aymurai/ui"`
// once the RichTextEditor plan (docs/superpowers/plans/2026-07-22-rich-text-editor.md
// in the ui-components repo) has landed — identical shape, drop-in swap.
export type MarkType = "bold" | "italic" | "underline" | "highlight";

export interface TextMark {
  type: MarkType;
  color?: string;
}

export interface TextRun {
  text: string;
  marks: TextMark[];
}

export interface RichTextParagraph {
  id: string;
  runs: TextRun[];
}

export interface RichTextDocument {
  paragraphs: RichTextParagraph[];
}

function documentFromPlainText(text: string): RichTextDocument {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return {
    paragraphs: blocks.map((block, index) => ({
      id: `p${index}`,
      runs: [{ text: block, marks: [] }],
    })),
  };
}

export type SummaryStatus =
  | "idle"
  | "streaming"
  | "completed"
  | "error"
  | "stopped";

export interface SummaryState {
  status: SummaryStatus;
  sourceFileName: string | null;
  title: string;
  partialText: string;
  document: RichTextDocument | null;
  error: string | null;
}

const initialState: SummaryState = {
  status: "idle",
  sourceFileName: null,
  title: "",
  partialText: "",
  document: null,
  error: null,
};

export type SummaryAction =
  | { type: "reset" }
  | { type: "start"; fileName: string }
  | { type: "setPartialText"; text: string }
  | { type: "finish"; summary: string }
  | { type: "error"; message: string }
  | { type: "stop" }
  | { type: "edit"; document: RichTextDocument }
  | { type: "editTitle"; title: string };

export const reset = (): SummaryAction => ({ type: "reset" });
export const start = (fileName: string): SummaryAction => ({
  type: "start",
  fileName,
});
export const setPartialText = (text: string): SummaryAction => ({
  type: "setPartialText",
  text,
});
export const finish = (summary: string): SummaryAction => ({
  type: "finish",
  summary,
});
export const error = (message: string): SummaryAction => ({
  type: "error",
  message,
});
export const stop = (): SummaryAction => ({ type: "stop" });
export const edit = (document: RichTextDocument): SummaryAction => ({
  type: "edit",
  document,
});
export const editTitle = (title: string): SummaryAction => ({
  type: "editTitle",
  title,
});

function summaryReducer(
  state: SummaryState,
  action: SummaryAction,
): SummaryState {
  switch (action.type) {
    case "reset":
      return initialState;
    case "start":
      return {
        ...initialState,
        status: "streaming",
        sourceFileName: action.fileName,
        title: `Resumen ${action.fileName}`,
      };
    case "setPartialText":
      return { ...state, partialText: action.text };
    case "finish":
      return {
        ...state,
        status: "completed",
        document: documentFromPlainText(action.summary),
      };
    case "error":
      return { ...state, status: "error", error: action.message };
    case "stop":
      return { ...state, status: "stopped" };
    case "edit":
      return { ...state, document: action.document };
    case "editTitle":
      return { ...state, title: action.title };
    default:
      return state;
  }
}

const SummaryContext = createContext<SummaryState>(initialState);
const SummaryDispatchContext = createContext<React.Dispatch<SummaryAction>>(
  () => {},
);

export default function SummaryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(summaryReducer, initialState);
  return (
    <SummaryContext.Provider value={state}>
      <SummaryDispatchContext.Provider value={dispatch}>
        {children}
      </SummaryDispatchContext.Provider>
    </SummaryContext.Provider>
  );
}

export function useSummary() {
  return useContext(SummaryContext);
}

export function useSummaryDispatch() {
  return useContext(SummaryDispatchContext);
}
```

- [ ] **Step 4: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/context/Summary.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/context/Summary.tsx src/renderer/src/context/Summary.test.tsx
git commit -m "feat(summarizer): add Summary context and reducer"
```

---

## Task 6: `useSummarize` hook

**Files:**
- Modify: `src/renderer/src/services/aymurai/queries.ts`
- Create: `src/renderer/src/hooks/useSummarize.ts`
- Create: `src/renderer/src/hooks/useSummarize.test.ts`

**Interfaces:**
- Consumes: `summarizeDocumentStream` (Task 4), `SummaryAction`, `start`,
  `setPartialText`, `finish`, `error`, `stop` (Task 5).
- Produces: `summarizeDocument(opts): mutationOptions` (added to `queries.ts`,
  same factory pattern as `transcribeBatch`); `useSummarize(file: DocFile | undefined, opts?: { dispatch?: React.Dispatch<SummaryAction> }): { status: "idle" | "processing" | "completed" | "error" | "stopped"; abort: () => void }`
  — this is what `summary-process.tsx` (Task 7) calls.

**Context:** Mirrors `useTranscribe`'s shape (stable key, deferred mutation
kickoff to dodge StrictMode double-mount, `abort()`), but for a single file with
no progress percentage — simpler than `useTranscribe` in that respect.

- [ ] **Step 1: Add the mutation factory to `queries.ts`**

In `src/renderer/src/services/aymurai/queries.ts`, add (near `transcribeBatch`):

```ts
import { summarizeDocumentStream } from "./summarize";
import type { SummarizationResponse } from "./summarization";

export const summarizeDocument = ({
  onPartialText,
}: {
  onPartialText?: (text: string) => void;
} = {}) =>
  mutationOptions({
    mutationFn: async ({
      text,
      signal,
    }: {
      text: string;
      signal: AbortSignal;
    }): Promise<SummarizationResponse> =>
      summarizeDocumentStream(text, { signal, onPartialText }),
  });
```

- [ ] **Step 2: Write the failing test for `useSummarize`**

```ts
// src/renderer/src/hooks/useSummarize.test.ts
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSummarize } from "./useSummarize";
import type { DocFile } from "@/types/file";

vi.mock("@/services/aymurai/summarize", () => ({
  summarizeDocumentStream: vi.fn(
    async (_text: string, { onPartialText }: { onPartialText?: (t: string) => void }) => {
      onPartialText?.("Hola");
      onPartialText?.("Hola mundo");
      return { summary: "Hola mundo", model: "mock", chunks_used: 1, steps: [] };
    },
  ),
}));

function makeFile(name: string, text: string): DocFile {
  return {
    data: new File(["x"], name),
    paragraphs: [{ id: "p0", document_id: "d0", value: text }],
    selected: true,
    validationObject: {},
  } as DocFile;
}

function renderWithClient(hook: () => ReturnType<typeof useSummarize>) {
  const queryClient = new QueryClient();
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useSummarize", () => {
  it("dispatches start, streamed partial text, and finish", async () => {
    const dispatch = vi.fn();
    const file = makeFile("acta.docx", "Texto original.");

    renderWithClient(() => useSummarize(file, { dispatch }));

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "finish", summary: "Hola mundo" }),
      ),
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start", fileName: "acta.docx" }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "setPartialText", text: "Hola mundo" }),
    );
  });

  it("does nothing when there is no file", () => {
    const dispatch = vi.fn();
    renderWithClient(() => useSummarize(undefined, { dispatch }));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("abort() marks status as stopped", async () => {
    const file = makeFile("acta.docx", "Texto original.");
    const { result } = renderWithClient(() => useSummarize(file));

    await waitFor(() => expect(result.current.status).not.toBe("idle"));
    act(() => result.current.abort());
    expect(result.current.status).toBe("stopped");
  });
});
```

- [ ] **Step 3: Run to confirm failure**

Run: `pnpm test src/renderer/src/hooks/useSummarize.test.ts`
Expected: FAIL — `./useSummarize` doesn't exist yet.

- [ ] **Step 4: Implement `useSummarize.ts`**

```ts
// src/renderer/src/hooks/useSummarize.ts
import { useMutation } from "@tanstack/react-query";
import { CanceledError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type SummaryAction,
  finish,
  setPartialText,
  start,
  stop,
  error as summaryError,
} from "@/context/Summary";
import { summarizeDocument } from "@/services/aymurai/queries";
import type { DocFile } from "@/types/file";

export type SummarizeHookStatus =
  | "idle"
  | "processing"
  | "completed"
  | "error"
  | "stopped";

interface UseSummarizeOptions {
  dispatch?: React.Dispatch<SummaryAction>;
}

export function useSummarize(
  file: DocFile | undefined,
  { dispatch }: UseSummarizeOptions = {},
) {
  const [stopped, setStopped] = useState(false);
  const userAbortedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const mutation = useMutation(
    summarizeDocument({
      onPartialText: (text) => dispatchRef.current?.(setPartialText(text)),
    }),
  );
  const { mutate, reset: resetMutation } = mutation;

  const text = useMemo(
    () => file?.paragraphs?.map((p) => p.value).join("\n\n") ?? "",
    [file],
  );
  const fileKey = file ? `${file.data.name}:${file.data.size}` : "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: fileKey is the intended trigger; mutate/text are stable per render
  useEffect(() => {
    if (!file || !text) return;

    userAbortedRef.current = false;
    setStopped(false);
    dispatchRef.current?.(start(file.data.name));

    let active = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    // Same StrictMode-double-mount workaround as useTranscribe.
    Promise.resolve().then(() => {
      if (!active) return;
      mutate(
        { text, signal: controller.signal },
        {
          onSuccess: (result) => {
            dispatchRef.current?.(finish(result.summary));
          },
          onError: (err) => {
            if (userAbortedRef.current) return;
            dispatchRef.current?.(
              summaryError(err instanceof Error ? err.message : "Unknown error"),
            );
          },
        },
      );
    });

    return () => {
      active = false;
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [fileKey]);

  const status: SummarizeHookStatus = useMemo(() => {
    if (stopped) return "stopped";
    if (mutation.isPending) return "processing";
    if (mutation.isSuccess) return "completed";
    if (mutation.isError) {
      return mutation.error instanceof CanceledError ? "stopped" : "error";
    }
    return "idle";
  }, [stopped, mutation.isPending, mutation.isSuccess, mutation.isError, mutation.error]);

  const abort = useCallback(() => {
    userAbortedRef.current = true;
    setStopped(true);
    controllerRef.current?.abort();
    resetMutation();
    dispatchRef.current?.(stop());
  }, [resetMutation]);

  return { status, abort };
}
```

- [ ] **Step 5: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/hooks/useSummarize.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/services/aymurai/queries.ts src/renderer/src/hooks/useSummarize.ts src/renderer/src/hooks/useSummarize.test.ts
git commit -m "feat(summarizer): add useSummarize hook and summarizeDocument mutation"
```

---

## Task 7: Procesamiento screen + route wiring

**Files:**
- Create: `src/renderer/src/components/summarizer/summary-process.tsx`
- Create: `src/renderer/src/components/summarizer/summary-process.test.tsx`
- Modify: `src/renderer/src/routes/app.$feature/process.tsx`
- Modify: `src/renderer/src/routes/app.$feature/route.tsx`

**Interfaces:**
- Consumes: `useSummary`, `useSummaryDispatch` (Task 5), `useSummarize` (Task 6).
- Produces: `SummaryProcess` component (default export), no props (reads
  `useFiles()`/`useSummary()` directly, same convention as `VoiceProcess`).

**Context:** Per the design doc correction, there is **no progress bar/percentage**
here (an indeterminate `Spinner` instead of `ArchiveProgress`) — the LLM's
completion time can't be predicted the way transcription duration can.

- [ ] **Step 1: Wrap the route tree in `SummaryProvider` when the feature is Summarizer**

In `src/renderer/src/routes/app.$feature/route.tsx`:

```tsx
import SummaryProvider from "@/context/Summary";
// ...
function AppLayoutRoute() {
  const { feature } = useParams({ from: "/app/$feature" });
  const isVoice = feature === FeatureFlowEnum.VoiceToText;
  const isSummarizer = feature === FeatureFlowEnum.Summarizer;
  const inner = (
    <Stack width="screen" height="screen" minHeight="0" gap="0" overflow="hidden">
      <FileProvider>
        <Outlet key={feature} />
      </FileProvider>
    </Stack>
  );
  const wrapped = isVoice ? (
    <TranscriptionProvider>{inner}</TranscriptionProvider>
  ) : isSummarizer ? (
    <SummaryProvider>{inner}</SummaryProvider>
  ) : (
    inner
  );
  return <APIProtected>{wrapped}</APIProtected>;
}
```

- [ ] **Step 2: Write the failing test for `SummaryProcess`**

```tsx
// src/renderer/src/components/summarizer/summary-process.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SummaryProcess from "./summary-process";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockFiles = [
  { data: new File(["x"], "acta.docx"), paragraphs: [{ id: "p0", document_id: "d0", value: "Texto." }], selected: true, validationObject: {} },
];
vi.mock("@/hooks", () => ({
  useFiles: () => mockFiles,
  useFileDispatch: () => vi.fn(),
}));

const mockSummaryState = { partialText: "", status: "streaming" };
vi.mock("@/context/Summary", () => ({
  useSummary: () => mockSummaryState,
  useSummaryDispatch: () => vi.fn(),
}));

vi.mock("@/hooks/useSummarize", () => ({
  useSummarize: () => ({ status: "processing", abort: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

describe("SummaryProcess", () => {
  it("shows the waiting placeholder before any partial text has streamed in", () => {
    render(<SummaryProcess />);
    expect(screen.getByText("process.waitingForWords")).toBeInTheDocument();
  });

  it("renders streamed partial text once it starts arriving", () => {
    mockSummaryState.partialText = "Primeras palabras del resumen";
    render(<SummaryProcess />);
    expect(
      screen.getByText("Primeras palabras del resumen"),
    ).toBeInTheDocument();
  });

  it("disables the next button until the summary is completed", () => {
    render(<SummaryProcess />);
    expect(screen.getByRole("button", { name: "process.next" })).toBeDisabled();
  });
});
```

- [ ] **Step 3: Run to confirm failure**

Run: `pnpm test src/renderer/src/components/summarizer/summary-process.test.tsx`
Expected: FAIL — component doesn't exist yet.

- [ ] **Step 4: Implement `summary-process.tsx`**

```tsx
// src/renderer/src/components/summarizer/summary-process.tsx
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import ScrollArea from "@/components/ui/scroll-area";
import { useSummary, useSummaryDispatch } from "@/context/Summary";
import RequireFile from "@/features/RequireFile";
import { useFiles } from "@/hooks";
import { useSummarize } from "@/hooks/useSummarize";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button, Callout, Card, Spinner } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { Info } from "phosphor-react";
import { useTranslation } from "react-i18next";

const previewFrame = css({
  alignSelf: "stretch",
  width: "full",
  height: "[200px]",
  borderLeft: "primary",
  borderRight: "primary",
  bg: "white",
  boxSizing: "border-box",
});

const previewContent = css({ width: "full", px: "6", py: "4", boxSizing: "border-box" });

const previewText = css({
  m: "[0]",
  fontWeight: "[300]",
  fontSize: "[18px]",
  lineHeight: "[30px]",
  color: "text.lighter",
  whiteSpace: "pre-wrap",
});

const previewPlaceholder = css({
  fontWeight: "[300]",
  fontSize: "[18px]",
  lineHeight: "[30px]",
  color: "[#9F99A5]",
  fontStyle: "italic",
});

export default function SummaryProcess() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const files = useFiles();
  const file = files[0];
  const dispatch = useSummaryDispatch();
  const summary = useSummary();
  const { status, abort } = useSummarize(file, { dispatch });

  const isCompleted = status === "completed";
  const isError = status === "error";
  const isStopped = status === "stopped";

  const handleStop = () => abort();

  const handlePrevious = () =>
    navigate({
      to: "/app/$feature/preview",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  const handleNext = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  return (
    <RequireFile>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={2} />
      <MainContent>
        <Stack gap="10">
          <HStack alignItems="center" gap="6">
            <BackButton
              to="/app/$feature/preview"
              params={{ feature: FeatureFlowEnum.Summarizer }}
            />
            <SectionTitle>{t("process.sectionTitle")}</SectionTitle>
          </HStack>
          <Card>
            <Stack gap="6">
              <Stack gap="1">
                <styled.h2 textStyle="subtitle.md.default">
                  {t("process.processingTitle")}
                </styled.h2>
                <styled.p textStyle="subtitle.sm.default" color="text.lighter">
                  {t("process.processingSubtitle")}
                </styled.p>
              </Stack>

              <Stack gap="3">
                {!isCompleted && !isError && !isStopped && <Spinner />}

                {!isError ? (
                  <ScrollArea
                    className={previewFrame}
                    aria-live="polite"
                    aria-label={t("process.previewAriaLabel")}
                  >
                    <div className={previewContent}>
                      {summary.partialText ? (
                        <p className={previewText}>{summary.partialText}</p>
                      ) : (
                        <span className={previewPlaceholder}>
                          {t("process.waitingForWords")}
                        </span>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className={previewFrame}>
                    <div className={previewContent}>
                      <span className={previewPlaceholder}>
                        {t("process.waitingForWords")}
                      </span>
                    </div>
                  </ScrollArea>
                )}

                {!isError && !isStopped && (
                  <Callout
                    message={t("process.callout")}
                    variant="info"
                    size="compact"
                    icon={Info}
                    noBorder
                  />
                )}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button variant="secondary" onClick={handlePrevious}>
            {t("process.back")}
          </Button>
          {!isCompleted && !isError && (
            <Button variant="secondary" onClick={handleStop}>
              {t("process.stop", { defaultValue: "Detener" })}
            </Button>
          )}
          <Button onClick={handleNext} disabled={!isCompleted}>
            {t("process.next")}
          </Button>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
```

- [ ] **Step 5: Wire the Summarizer branch into the route**

In `src/renderer/src/routes/app.$feature/process.tsx`, add the import and branch:

```tsx
import SummaryProcess from "@/components/summarizer/summary-process";
// ...
function RouteComponent() {
  const { feature } = useParams({ from: "/app/$feature/process" });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoiceProcess />;
  if (feature === FeatureFlowEnum.Summarizer) return <SummaryProcess />;
  return <DocumentProcess />;
}
```

- [ ] **Step 6: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/summarizer/summary-process.test.tsx`
Expected: PASS.

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/components/summarizer/summary-process.tsx src/renderer/src/components/summarizer/summary-process.test.tsx src/renderer/src/routes/app.\$feature/process.tsx src/renderer/src/routes/app.\$feature/route.tsx
git commit -m "feat(summarizer): add Procesamiento screen (no progress bar, per design)"
```

---

## Task 8: Persistence adapter (`SummaryValidationClient`)

**Files:**
- Create: `src/renderer/src/services/aymurai/summaryValidationClient.ts`
- Create: `src/renderer/src/services/aymurai/summaryValidationClient.test.ts`
- Create: `src/renderer/src/services/aymurai/summaryValidation.ts`
- Create: `src/renderer/src/services/aymurai/noopSummaryValidation.ts`

**Interfaces:**
- Produces: `SummaryValidation` (type: `{ documentId: string; title: string; generatedSummary: string; editedSummary: string }`),
  `SummaryValidationClient` (interface: `save(summary: SummaryValidation, signal?: AbortSignal): Promise<void>`,
  `load(documentId: string, signal?: AbortSignal): Promise<SummaryValidation | null>`),
  and the single active instance `summaryValidationClient` — this is what Task 10's
  Validación screen imports and calls.

**Context:** Mirrors `asrValidation.ts`'s `saveValidation`/`loadValidation`
functions exactly, but wrapped in a typed interface with two implementations so
flipping to the real backend later is a one-line change, not a
search-and-uncomment: a real implementation (`summaryValidation.ts`, written now
against the anticipated `/summary/validation/document/:id` route even though it
doesn't exist server-side yet) and a `localStorage`-backed no-op
(`noopSummaryValidation.ts`) good enough to develop/test the flow end-to-end.

- [ ] **Step 1: Write the failing tests**

```ts
// src/renderer/src/services/aymurai/summaryValidationClient.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { noopSummaryValidationClient } from "./noopSummaryValidation";

describe("noopSummaryValidationClient", () => {
  beforeEach(() => localStorage.clear());

  it("returns null for a document that was never saved", async () => {
    expect(await noopSummaryValidationClient.load("doc-1")).toBeNull();
  });

  it("round-trips a saved summary through localStorage", async () => {
    const summary = {
      documentId: "doc-1",
      title: "Resumen acta.docx",
      generatedSummary: "Original.",
      editedSummary: "Editado.",
    };
    await noopSummaryValidationClient.save(summary);
    expect(await noopSummaryValidationClient.load("doc-1")).toEqual(summary);
  });

  it("overwrites a previous save for the same documentId", async () => {
    await noopSummaryValidationClient.save({
      documentId: "doc-1",
      title: "A",
      generatedSummary: "A",
      editedSummary: "A",
    });
    await noopSummaryValidationClient.save({
      documentId: "doc-1",
      title: "B",
      generatedSummary: "B",
      editedSummary: "B",
    });
    expect(await noopSummaryValidationClient.load("doc-1")).toEqual({
      documentId: "doc-1",
      title: "B",
      generatedSummary: "B",
      editedSummary: "B",
    });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test src/renderer/src/services/aymurai/summaryValidationClient.test.ts`
Expected: FAIL — none of the referenced files exist yet.

- [ ] **Step 3: Implement the shared type + real (backend) implementation**

```ts
// src/renderer/src/services/aymurai/summaryValidation.ts
import api from "../api";

export interface SummaryValidation {
  documentId: string;
  title: string;
  generatedSummary: string;
  editedSummary: string;
}

export interface SummaryValidationClient {
  save(summary: SummaryValidation, signal?: AbortSignal): Promise<void>;
  load(
    documentId: string,
    signal?: AbortSignal,
  ): Promise<SummaryValidation | null>;
}

/**
 * Real backend-backed implementation, written against the anticipated
 * `/summary/validation/document/:id` route (mirrors asrValidation.ts's
 * `/asr/validation/document/:id`). The route does not exist server-side yet —
 * see docs/superpowers/specs/2026-07-22-resumen-de-documento-design.md.
 */
export const backendSummaryValidationClient: SummaryValidationClient = {
  async save(summary, signal) {
    await api.post(
      `/summary/validation/document/${summary.documentId}`,
      {
        title: summary.title,
        generated_summary: summary.generatedSummary,
        edited_summary: summary.editedSummary,
      },
      { signal },
    );
  },
  async load(documentId, signal) {
    const response = await api.get(
      `/summary/validation/document/${documentId}`,
      { signal },
    );
    return response.data ?? null;
  },
};
```

- [ ] **Step 4: Implement the no-op (local) implementation**

```ts
// src/renderer/src/services/aymurai/noopSummaryValidation.ts
import type { SummaryValidation, SummaryValidationClient } from "./summaryValidation";

const STORAGE_PREFIX = "summary-validation:";

export const noopSummaryValidationClient: SummaryValidationClient = {
  async save(summary) {
    localStorage.setItem(
      `${STORAGE_PREFIX}${summary.documentId}`,
      JSON.stringify(summary),
    );
  },
  async load(documentId) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${documentId}`);
    return raw ? (JSON.parse(raw) as SummaryValidation) : null;
  },
};
```

- [ ] **Step 5: Implement the single selection point**

```ts
// src/renderer/src/services/aymurai/summaryValidationClient.ts
import { noopSummaryValidationClient } from "./noopSummaryValidation";
import type { SummaryValidationClient } from "./summaryValidation";

// Single switch point: swap this one line for `backendSummaryValidationClient`
// once `/summary/validation/document/:id` exists server-side. No other file
// in this codebase should import summaryValidation.ts's implementations
// directly — always go through this module.
export const summaryValidationClient: SummaryValidationClient =
  noopSummaryValidationClient;

export type { SummaryValidation, SummaryValidationClient } from "./summaryValidation";
```

- [ ] **Step 6: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/services/aymurai/summaryValidationClient.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/services/aymurai/summaryValidationClient.ts src/renderer/src/services/aymurai/summaryValidationClient.test.ts src/renderer/src/services/aymurai/summaryValidation.ts src/renderer/src/services/aymurai/noopSummaryValidation.ts
git commit -m "feat(summarizer): add adapter-based summary validation persistence"
```

---

## Task 9: Original-document search panel

**Files:**
- Create: `src/renderer/src/components/summarizer/document-search-panel.tsx`
- Create: `src/renderer/src/components/summarizer/document-search-panel.test.tsx`

**Interfaces:**
- Consumes: `Paragraph` (`@/types/file`).
- Produces: `DocumentSearchPanel` component, props
  `{ paragraphs: Paragraph[] }` — used by Task 10's Validación screen as the
  left-hand original-document panel.

**Context:** Per the design doc, this is deliberately **not** `FileAnnotator` —
no tag/annotation state, just a search box + result count + prev/next + the
original paragraphs rendered with matches highlighted and the active match
scrolled into view.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/renderer/src/components/summarizer/document-search-panel.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocumentSearchPanel from "./document-search-panel";
import type { Paragraph } from "@/types/file";

const paragraphs: Paragraph[] = [
  { id: "p0", document_id: "d0", value: "Primer párrafo con la palabra clave." },
  { id: "p1", document_id: "d0", value: "Segundo párrafo, sin coincidencias." },
  { id: "p2", document_id: "d0", value: "Tercer párrafo repite la palabra clave otra vez." },
];

describe("DocumentSearchPanel", () => {
  it("renders every paragraph's text", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    expect(screen.getByText(/Primer párrafo/)).toBeInTheDocument();
    expect(screen.getByText(/Segundo párrafo/)).toBeInTheDocument();
  });

  it("shows a match count once a query is typed", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "clave" },
    });
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });

  it("advances to the next match on 'Siguiente' and wraps around", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "clave" },
    });
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText("2 de 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(screen.getByText("1 de 2")).toBeInTheDocument();
  });

  it("shows no count for a query with zero matches", () => {
    render(<DocumentSearchPanel paragraphs={paragraphs} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inexistente" },
    });
    expect(screen.getByText("0 de 0")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test src/renderer/src/components/summarizer/document-search-panel.test.tsx`
Expected: FAIL — component doesn't exist yet.

- [ ] **Step 3: Implement the component**

```tsx
// src/renderer/src/components/summarizer/document-search-panel.tsx
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import type { Paragraph } from "@/types/file";
import { Button } from "@aymurai/ui";
import { useMemo, useRef, useState } from "react";

const searchInput = css({
  border: "primary",
  rounded: "full",
  px: "4",
  py: "3",
  width: "full",
  outline: "none",
  "&:focus-visible": { border: "primary-alt" },
});

const highlight = css({ bg: "category.yellow-light" });
const activeHighlight = css({ bg: "category.orange-light" });

interface Match {
  paragraphIndex: number;
  matchIndex: number;
}

function findMatches(paragraphs: Paragraph[], query: string): Match[] {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  const matches: Match[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lowerValue = paragraph.value.toLowerCase();
    let fromIndex = 0;
    for (;;) {
      const index = lowerValue.indexOf(lowerQuery, fromIndex);
      if (index === -1) break;
      matches.push({ paragraphIndex, matchIndex: index });
      fromIndex = index + lowerQuery.length;
    }
  });

  return matches;
}

function HighlightedParagraph({
  text,
  query,
  activeMatchIndex,
}: {
  text: string;
  query: string;
  activeMatchIndex: number | null;
}) {
  if (!query) return <styled.p textStyle="paragraph.md.default">{text}</styled.p>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let occurrence = 0;

  for (;;) {
    const index = lowerText.indexOf(lowerQuery, cursor);
    if (index === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    parts.push(text.slice(cursor, index));
    parts.push(
      <mark
        // biome-ignore lint/suspicious/noArrayIndexKey: occurrences within one paragraph have no stable id
        key={occurrence}
        className={occurrence === activeMatchIndex ? activeHighlight : highlight}
      >
        {text.slice(index, index + query.length)}
      </mark>,
    );
    cursor = index + query.length;
    occurrence++;
  }

  return <styled.p textStyle="paragraph.md.default">{parts}</styled.p>;
}

export interface DocumentSearchPanelProps {
  paragraphs: Paragraph[];
}

export default function DocumentSearchPanel({
  paragraphs,
}: DocumentSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => findMatches(paragraphs, query), [paragraphs, query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const goToMatch = (delta: number) => {
    if (matches.length === 0) return;
    setActiveIndex((prev) => (prev + delta + matches.length) % matches.length);
  };

  const activeMatch = matches[activeIndex];

  return (
    <Stack gap="4" p="6" overflowY="auto" height="full">
      <HStack gap="3">
        <input
          role="searchbox"
          aria-label="Buscar en el documento original"
          className={searchInput}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        {query && (
          <HStack gap="2">
            <styled.span textStyle="label.sm.default">
              {matches.length === 0 ? "0 de 0" : `${activeIndex + 1} de ${matches.length}`}
            </styled.span>
            <Button
              variant="none"
              size="icon-sm"
              aria-label="Anterior"
              onClick={() => goToMatch(-1)}
            >
              ‹
            </Button>
            <Button
              variant="none"
              size="icon-sm"
              aria-label="Siguiente"
              onClick={() => goToMatch(1)}
            >
              ›
            </Button>
          </HStack>
        )}
      </HStack>

      <div ref={containerRef}>
        {paragraphs.map((paragraph, index) => (
          <HighlightedParagraph
            key={paragraph.id}
            text={paragraph.value}
            query={query}
            activeMatchIndex={
              activeMatch?.paragraphIndex === index ? activeMatch.matchIndex : null
            }
          />
        ))}
      </div>
    </Stack>
  );
}
```

- [ ] **Step 4: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/summarizer/document-search-panel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/summarizer/document-search-panel.tsx src/renderer/src/components/summarizer/document-search-panel.test.tsx
git commit -m "feat(summarizer): add trimmed-down original-document search panel"
```

---

## Task 10: Validación screen + route wiring + guard

**Files:**
- Create: `src/renderer/src/components/summarizer/summary-validation.tsx`
- Create: `src/renderer/src/components/summarizer/summary-validation.test.tsx`
- Create: `src/renderer/src/features/RequireSummary.tsx`
- Modify: `src/renderer/src/routes/app.$feature/validation.tsx`

**Interfaces:**
- Consumes: `RichTextEditor` from `@aymurai/ui` (**requires the companion
  `ui-components` plan to have landed and been built** — see Global
  Constraints), `DocumentSearchPanel` (Task 9), `useSummary`/`useSummaryDispatch`
  (Task 5), `summaryValidationClient` (Task 8).
- Produces: `SummaryValidation` component (default export, no props);
  `RequireSummary` (guard component, same shape as `RequireFile`).

**Context:** Left panel: `DocumentSearchPanel` over the original paragraphs.
Right panel: `RichTextEditor` bound to `useSummary().document`/`.title`, saving
via the persistence adapter on every edit (debounced is out of scope for this
plan — save on blur/navigation is enough for a first version). "Volver" is a
plain previous-step link (edits are preserved in the reducer either way).

- [ ] **Step 1: Implement the guard**

```tsx
// src/renderer/src/features/RequireSummary.tsx
import { useSummary } from "@/context/Summary";
import { FeatureFlowEnum } from "@/types/features";
import { Navigate, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function RequireSummary({ children }: Props) {
  const summary = useSummary();
  const { feature } = useParams({ from: "/app/$feature" });

  if (summary.status !== "completed" || !summary.document) {
    return (
      <Navigate
        to="/app/$feature/process"
        params={{ feature: feature as FeatureFlowEnum }}
      />
    );
  }

  return children;
}
```

- [ ] **Step 2: Write the failing test for `SummaryValidation`**

```tsx
// src/renderer/src/components/summarizer/summary-validation.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SummaryValidation from "./summary-validation";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockFiles = [
  {
    data: new File(["x"], "acta.docx"),
    paragraphs: [{ id: "p0", document_id: "d0", value: "Texto original completo." }],
    selected: true,
    validationObject: {},
  },
];
vi.mock("@/hooks", () => ({ useFiles: () => mockFiles }));

const mockDocument = {
  paragraphs: [{ id: "p0", runs: [{ text: "Resumen generado.", marks: [] }] }],
};
const dispatch = vi.fn();
vi.mock("@/context/Summary", () => ({
  useSummary: () => ({
    status: "completed",
    document: mockDocument,
    title: "Resumen acta.docx",
    sourceFileName: "acta.docx",
  }),
  useSummaryDispatch: () => dispatch,
  edit: (document: unknown) => ({ type: "edit", document }),
  editTitle: (title: string) => ({ type: "editTitle", title }),
}));

const save = vi.fn().mockResolvedValue(undefined);
vi.mock("@/services/aymurai/summaryValidationClient", () => ({
  summaryValidationClient: { save, load: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

describe("SummaryValidation", () => {
  it("renders both the original document panel and the summary editor", () => {
    render(<SummaryValidation />);
    expect(screen.getByText(/Texto original completo/)).toBeInTheDocument();
    expect(screen.getByText("Resumen generado.")).toBeInTheDocument();
  });

  it("saves via the persistence adapter when the editor content changes", () => {
    render(<SummaryValidation />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "acta.docx",
        title: "Resumen acta.docx",
      }),
    );
  });
});
```

- [ ] **Step 3: Run to confirm failure**

Run: `pnpm test src/renderer/src/components/summarizer/summary-validation.test.tsx`
Expected: FAIL — component doesn't exist yet.

- [ ] **Step 4: Implement `summary-validation.tsx`**

```tsx
// src/renderer/src/components/summarizer/summary-validation.tsx
import DocumentSearchPanel from "@/components/summarizer/document-search-panel";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { edit, editTitle, useSummary, useSummaryDispatch } from "@/context/Summary";
import { useFiles } from "@/hooks";
import { summaryValidationClient } from "@/services/aymurai/summaryValidationClient";
import { serializeToPlainText } from "@/utils/rich-text/model";
import { Grid } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button, RichTextEditor } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function SummaryValidation() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const files = useFiles();
  const file = files[0];
  const summary = useSummary();
  const dispatch = useSummaryDispatch();

  const handleSave = () => {
    if (!file || !summary.document) return;
    summaryValidationClient.save({
      documentId: file.data.name,
      title: summary.title,
      generatedSummary: summary.partialText,
      editedSummary: serializeToPlainText(summary.document),
    });
  };

  const handleContinue = () => {
    handleSave();
    navigate({
      to: "/app/$feature/finish",
      params: { feature: FeatureFlowEnum.Summarizer },
    });
  };

  if (!summary.document || !file) return null;

  return (
    <>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={3} />
      <Grid
        columns={2}
        gap="0"
        flex="1"
        minHeight="0"
        overflow="hidden"
        justifyContent="stretch"
        alignItems="stretch"
      >
        <DocumentSearchPanel paragraphs={file.paragraphs ?? []} />
        <div onBlur={handleSave}>
          <RichTextEditor
            document={summary.document}
            onChange={(next) => dispatch(edit(next))}
            title={summary.title}
            onTitleChange={(next) => dispatch(editTitle(next))}
            aria-label={t("validation.originalDocumentLabel")}
          />
        </div>
      </Grid>
      <Footer withBuiltBy>
        <Button onClick={handleContinue}>{t("validation.finish")}</Button>
      </Footer>
    </>
  );
}
```

- [ ] **Step 5: Wire the Summarizer branch into the route, guarded by `RequireSummary`**

In `src/renderer/src/routes/app.$feature/validation.tsx`, add:

```tsx
import SummaryValidation from "@/components/summarizer/summary-validation";
import RequireSummary from "@/features/RequireSummary";
// ...
function RouteComponent() {
  const { feature } = useParams({ from: "/app/$feature/validation" });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoiceValidation />;
  if (feature === FeatureFlowEnum.Summarizer)
    return (
      <RequireFile>
        <RequireSummary>
          <SummaryValidation />
        </RequireSummary>
      </RequireFile>
    );
  return <DocumentValidation />;
}
```

- [ ] **Step 6: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/summarizer/summary-validation.test.tsx`
Expected: PASS. (This requires `@aymurai/ui`'s `RichTextEditor` to be built —
run `cd ../ui-components && pnpm build` first if this fails with a module
resolution error.)

- [ ] **Step 7: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 8: Visual smoke check**

Run `pnpm dev:web` with `VITE_USE_MOCK_SUMMARIZE=true`, walk through
Resumen de Documento onboarding → preview → process → validation. Confirm: the
left panel shows the original document with working search, the right panel
shows the editable summary with a working bold/italic/underline/highlight
toolbar, and back-button/"Finalizar" navigate correctly.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/components/summarizer/summary-validation.tsx src/renderer/src/components/summarizer/summary-validation.test.tsx src/renderer/src/features/RequireSummary.tsx src/renderer/src/routes/app.\$feature/validation.tsx
git commit -m "feat(summarizer): add Validación screen with RichTextEditor and original-document search"
```

---

## Task 11: Export pipeline (ODT/TXT/PDF)

**Files:**
- Create: `src/renderer/src/services/export/summary-formatters/odt.ts`
- Create: `src/renderer/src/services/export/summary-formatters/odt.test.ts`
- Create: `src/renderer/src/utils/rich-text/model.ts`
- Create: `src/renderer/src/services/export/summary-formatters/txt.ts`
- Create: `src/renderer/src/services/export/summary-formatters/txt.test.ts`
- Create: `src/renderer/src/services/export/export-summary.ts`
- Create: `src/renderer/src/services/export/export-summary.test.ts`

**Interfaces:**
- Consumes: `RichTextDocument`, `RichTextParagraph`, `TextRun`, `TextMark` (from
  `@aymurai/ui`, or the local shim type in `context/Summary.tsx` until that plan
  lands — same shape either way); `odtToPdf` (existing, `services/aymurai/queries.ts`).
- Produces: `paragraphToOdtXml(paragraph): string`, `documentToOdt(document, title): Blob`
  (`odt.ts`); `documentToPlainText(document): string` (`txt.ts` — thin wrapper
  over `serializeToPlainText`, kept as its own file so the export format list
  stays symmetric); `exportSummary(document, title, format): Promise<Blob>`
  (`export-summary.ts`) — this is what Task 12's Finalización screen calls.

**Context:** ODT is a zipped-XML format; a minimal valid `.odt` only needs
`content.xml`, `styles.xml`, `META-INF/manifest.xml`, and `mimetype`. This task
writes a hand-rolled, minimal ODT XML body (paragraphs → `<text:p>`, runs →
`<text:span>` with inline style attributes for bold/italic/underline/highlight)
rather than a full OpenDocument-compliant document — good enough for round-trip
through the existing `/convert/odt/pdf` endpoint, not a general-purpose ODT
writer.

- [ ] **Step 1: Write the failing tests for the ODT run serializer**

```ts
// src/renderer/src/services/export/summary-formatters/odt.test.ts
import { describe, expect, it } from "vitest";
import { paragraphToOdtXml } from "./odt";
import type { RichTextParagraph } from "@/context/Summary";

describe("paragraphToOdtXml", () => {
  it("wraps plain text in a text:p with no style attributes", () => {
    const p: RichTextParagraph = { id: "p0", runs: [{ text: "hola", marks: [] }] };
    expect(paragraphToOdtXml(p)).toBe("<text:p>hola</text:p>");
  });

  it("wraps a bold run in a text:span with font-weight:bold", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [{ type: "bold" }] }],
    };
    expect(paragraphToOdtXml(p)).toBe(
      '<text:p><text:span style="font-weight:bold;">hola</text:span></text:p>',
    );
  });

  it("combines multiple marks into one style attribute", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [{ type: "bold" }, { type: "italic" }] }],
    };
    expect(paragraphToOdtXml(p)).toBe(
      '<text:p><text:span style="font-weight:bold;font-style:italic;">hola</text:span></text:p>',
    );
  });

  it("renders a highlight mark's color as a background-color", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [
        {
          text: "hola",
          marks: [{ type: "highlight", color: "#FDE27B" }],
        },
      ],
    };
    expect(paragraphToOdtXml(p)).toBe(
      '<text:p><text:span style="background-color:#FDE27B;">hola</text:span></text:p>',
    );
  });

  it("escapes XML-sensitive characters in the run text", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "A & B < C", marks: [] }],
    };
    expect(paragraphToOdtXml(p)).toBe("<text:p>A &amp; B &lt; C</text:p>");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test src/renderer/src/services/export/summary-formatters/odt.test.ts`
Expected: FAIL — `./odt` doesn't exist yet.

- [ ] **Step 3: Implement `odt.ts`**

```ts
// src/renderer/src/services/export/summary-formatters/odt.ts
import type { RichTextDocument, RichTextParagraph, TextMark } from "@/context/Summary";

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markToStyle(mark: TextMark): string {
  if (mark.type === "bold") return "font-weight:bold;";
  if (mark.type === "italic") return "font-style:italic;";
  if (mark.type === "underline") return "text-decoration:underline;";
  return `background-color:${mark.color ?? "#FDE27B"};`;
}

export function paragraphToOdtXml(paragraph: RichTextParagraph): string {
  const spans = paragraph.runs
    .map((run) => {
      const text = escapeXml(run.text);
      if (run.marks.length === 0) return text;
      const style = run.marks.map(markToStyle).join("");
      return `<text:span style="${style}">${text}</text:span>`;
    })
    .join("");

  return `<text:p>${spans}</text:p>`;
}

const ODT_CONTENT_TEMPLATE = (bodyXml: string, title: string) => `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">${escapeXml(title)}</text:h>
      ${bodyXml}
    </office:text>
  </office:body>
</office:document-content>`;

export function documentToOdt(document: RichTextDocument, title: string): Blob {
  const bodyXml = document.paragraphs.map(paragraphToOdtXml).join("\n");
  const contentXml = ODT_CONTENT_TEMPLATE(bodyXml, title);
  return new Blob([contentXml], { type: "application/vnd.oasis.opendocument.text" });
}
```

- [ ] **Step 4: Run the ODT tests again, confirm they pass**

Run: `pnpm test src/renderer/src/services/export/summary-formatters/odt.test.ts`
Expected: PASS.

- [ ] **Step 5: Add a local `serializeToPlainText` shim, then the TXT formatter**

Same reasoning as `context/Summary.tsx`'s local type shim (Task 5): this
function also lives in the `ui-components` `RichTextEditor` plan
(`src/utils/rich-text/model.ts`). Rather than block this task on that plan
landing, add the same small, real implementation locally, and swap the import
for `@aymurai/ui`'s export once that plan ships.

```ts
// src/renderer/src/utils/rich-text/model.ts
// TODO(ui-components): replace this whole file's usage with
// `import { serializeToPlainText } from "@aymurai/ui"` once the RichTextEditor
// plan (docs/superpowers/plans/2026-07-22-rich-text-editor.md in the
// ui-components repo) has landed — identical implementation, drop-in swap.
import type { RichTextDocument, RichTextParagraph } from "@/context/Summary";

export function paragraphPlainText(paragraph: RichTextParagraph): string {
  return paragraph.runs.map((run) => run.text).join("");
}

export function serializeToPlainText(document: RichTextDocument): string {
  return document.paragraphs.map(paragraphPlainText).join("\n\n");
}
```

```ts
// src/renderer/src/services/export/summary-formatters/txt.test.ts
import { describe, expect, it } from "vitest";
import { documentToPlainText } from "./txt";
import type { RichTextDocument } from "@/context/Summary";

describe("documentToPlainText", () => {
  it("strips all marks, joining paragraphs with a blank line", () => {
    const doc: RichTextDocument = {
      paragraphs: [
        { id: "p0", runs: [{ text: "Uno.", marks: [{ type: "bold" }] }] },
        { id: "p1", runs: [{ text: "Dos.", marks: [] }] },
      ],
    };
    expect(documentToPlainText(doc)).toBe("Uno.\n\nDos.");
  });
});
```

```ts
// src/renderer/src/services/export/summary-formatters/txt.ts
import { serializeToPlainText } from "@/utils/rich-text/model";
import type { RichTextDocument } from "@/context/Summary";

export function documentToPlainText(document: RichTextDocument): string {
  return serializeToPlainText(document);
}
```

Run: `pnpm test src/renderer/src/services/export/summary-formatters/txt.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing test for the export dispatcher**

```ts
// src/renderer/src/services/export/export-summary.test.ts
import { describe, expect, it, vi } from "vitest";
import { exportSummary } from "./export-summary";
import type { RichTextDocument } from "@/context/Summary";

const doc: RichTextDocument = {
  paragraphs: [{ id: "p0", runs: [{ text: "Texto.", marks: [] }] }],
};

vi.mock("@/services/aymurai/queries", () => ({
  odtToPdf: vi.fn(async (_odt: Blob) => new Blob(["pdf"], { type: "application/pdf" })),
}));

describe("exportSummary", () => {
  it("returns a plain-text blob for the txt format", async () => {
    const blob = await exportSummary(doc, "Resumen", "txt");
    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("Texto.");
  });

  it("returns an ODT blob for the odt format", async () => {
    const blob = await exportSummary(doc, "Resumen", "odt");
    expect(blob.type).toBe("application/vnd.oasis.opendocument.text");
  });

  it("converts to PDF via the existing odtToPdf helper for the pdf format", async () => {
    const blob = await exportSummary(doc, "Resumen", "pdf");
    expect(blob.type).toBe("application/pdf");
  });
});
```

- [ ] **Step 7: Run to confirm failure**

Run: `pnpm test src/renderer/src/services/export/export-summary.test.ts`
Expected: FAIL — `./export-summary` doesn't exist yet.

- [ ] **Step 8: Implement `export-summary.ts`**

```ts
// src/renderer/src/services/export/export-summary.ts
import { odtToPdf } from "@/services/aymurai/queries";
import type { RichTextDocument } from "@/context/Summary";
import { documentToOdt } from "./summary-formatters/odt";
import { documentToPlainText } from "./summary-formatters/txt";

export type SummaryExportFormat = "txt" | "odt" | "pdf";

export async function exportSummary(
  document: RichTextDocument,
  title: string,
  format: SummaryExportFormat,
): Promise<Blob> {
  if (format === "txt") {
    return new Blob([documentToPlainText(document)], { type: "text/plain" });
  }

  const odtBlob = documentToOdt(document, title);
  if (format === "odt") return odtBlob;

  return odtToPdf(odtBlob);
}
```

Check the exact exported signature of `odtToPdf` before finalizing this import:

Run: `grep -n "export.*odtToPdf" src/renderer/src/services/aymurai/queries.ts`
If it takes additional required arguments beyond the blob (e.g. a filename),
adjust the call in Step 8 to match — do not guess, read the actual signature.

- [ ] **Step 9: Run all export tests again, confirm they pass**

Run: `pnpm test src/renderer/src/services/export/export-summary.test.ts src/renderer/src/services/export/summary-formatters`
Expected: PASS.

- [ ] **Step 10: Typecheck**

Run: `pnpm typecheck`

- [ ] **Step 11: Commit**

```bash
git add src/renderer/src/services/export/summary-formatters src/renderer/src/utils/rich-text/model.ts src/renderer/src/services/export/export-summary.ts src/renderer/src/services/export/export-summary.test.ts
git commit -m "feat(summarizer): add ODT/TXT/PDF export pipeline"
```

---

## Task 12: Finalización screen + route wiring

**Files:**
- Create: `src/renderer/src/components/summarizer/summary-finish.tsx`
- Create: `src/renderer/src/components/summarizer/summary-finish.test.tsx`
- Modify: `src/renderer/src/routes/app.$feature/finish.tsx`

**Interfaces:**
- Consumes: `RichTextEditor` (`@aymurai/ui`, `readOnly` mode), `useSummary`
  (Task 5), `exportSummary` (Task 11).
- Produces: `SummaryFinish` component (default export, no props).

**Context:** Two-column `Card` — left: `RichTextEditor` in `readOnly` mode as
the "Pre-visualización" (no real PDF/DOCX rendering engine, per the design
doc); right: a format `Select` (`.txt`/`.odt`/`.pdf`) + "Volver"/"Exportar".
"Volver" goes back to Validación (edits are preserved in the reducer, unlike
Validación's own back button).

- [ ] **Step 1: Write the failing test**

```tsx
// src/renderer/src/components/summarizer/summary-finish.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SummaryFinish from "./summary-finish";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockDocument = {
  paragraphs: [{ id: "p0", runs: [{ text: "Resumen final.", marks: [] }] }],
};
vi.mock("@/context/Summary", () => ({
  useSummary: () => ({ document: mockDocument, title: "Resumen acta.docx" }),
}));

const exportSummary = vi.fn().mockResolvedValue(new Blob(["x"]));
vi.mock("@/services/export/export-summary", () => ({ exportSummary }));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

describe("SummaryFinish", () => {
  it("shows the read-only summary as the preview", () => {
    render(<SummaryFinish />);
    expect(screen.getByText("Resumen final.")).toBeInTheDocument();
  });

  it("exports in the selected format when 'Exportar' is clicked", async () => {
    render(<SummaryFinish />);
    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    expect(exportSummary).toHaveBeenCalledWith(
      mockDocument,
      "Resumen acta.docx",
      "txt",
    );
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `pnpm test src/renderer/src/components/summarizer/summary-finish.test.tsx`
Expected: FAIL — component doesn't exist yet.

- [ ] **Step 3: Implement `summary-finish.tsx`**

```tsx
// src/renderer/src/components/summarizer/summary-finish.tsx
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useSummary } from "@/context/Summary";
import {
  type SummaryExportFormat,
  exportSummary,
} from "@/services/export/export-summary";
import { Grid, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button, Card, RichTextEditor, Select } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const FORMAT_OPTIONS: { value: SummaryExportFormat; label: string }[] = [
  { value: "txt", label: ".Txt" },
  { value: "odt", label: ".Odt" },
  { value: "pdf", label: ".Pdf" },
];

export default function SummaryFinish() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const summary = useSummary();
  const [format, setFormat] = useState<SummaryExportFormat>("txt");

  const handleBack = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  const handleExport = async () => {
    if (!summary.document) return;
    const blob = await exportSummary(summary.document, summary.title, format);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${summary.title}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!summary.document) return null;

  return (
    <>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={4} />
      <Stack gap="6" p="8">
        <styled.h1 textStyle="title.md.strong">
          {t("finish.sectionTitle")}
        </styled.h1>
        <styled.p textStyle="paragraph.md.default">
          {t("finish.description")}
        </styled.p>
        <Card>
          <Grid columns={2} gap="12">
            <Stack gap="4">
              <styled.h2 textStyle="subtitle.md.strong">
                {t("finish.previewLabel")}
              </styled.h2>
              <RichTextEditor document={summary.document} readOnly />
            </Stack>
            <Stack gap="6">
              <styled.h2 textStyle="subtitle.md.strong">
                {t("finish.exportOptionsLabel")}
              </styled.h2>
              <Select
                label={t("finish.formatLabel")}
                value={format}
                onValueChange={(value) => setFormat(value as SummaryExportFormat)}
                options={FORMAT_OPTIONS}
              />
            </Stack>
          </Grid>
        </Card>
      </Stack>
      <Footer withBuiltBy>
        <Button variant="secondary" onClick={handleBack}>
          {t("finish.back")}
        </Button>
        <Button onClick={handleExport}>{t("finish.export")}</Button>
      </Footer>
    </>
  );
}
```

Check `Select`'s exact prop names before finalizing this import:

Run: `grep -n "export interface SelectProps\|export function Select" ../ui-components/src/components/select/Select.tsx`
If its options/value/onChange prop names differ from `options`/`value`/
`onValueChange` above, adjust this component to match the real API — do not
guess.

- [ ] **Step 4: Wire the Summarizer branch into the route**

In `src/renderer/src/routes/app.$feature/finish.tsx`:

```tsx
import SummaryFinish from "@/components/summarizer/summary-finish";
// ...
function RouteComponent() {
  const params = useParams({ from: "/app/$feature/finish" });
  if (params.feature === FeatureFlowEnum.VoiceToText) return <VoiceFinish />;
  if (params.feature === FeatureFlowEnum.Summarizer) return <SummaryFinish />;
  return <DocumentFinish />;
}
```

- [ ] **Step 5: Run the tests again, confirm they pass**

Run: `pnpm test src/renderer/src/components/summarizer/summary-finish.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`

- [ ] **Step 7: Full-suite gate**

Run: `pnpm test && pnpm typecheck && pnpm knip`
Expected: all green — this is the last task in the plan, so this is the final
integration gate for the whole flow.

- [ ] **Step 8: Visual smoke check — full flow**

Run `pnpm dev:web` with `VITE_USE_MOCK_SUMMARIZE=true`. Walk the entire flow:
Dashboard → Resumen de Documento → seleccionar archivo → previsualización →
procesamiento (no progress bar, streamed text visible) → validación (search +
rich-text editing + highlight) → finalización (read-only preview + format
select) → exportar (file downloads). Confirm "Volver" from Finalización returns
to Validación with edits intact.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/components/summarizer/summary-finish.tsx src/renderer/src/components/summarizer/summary-finish.test.tsx src/renderer/src/routes/app.\$feature/finish.tsx
git commit -m "feat(summarizer): add Finalización screen with read-only preview and export"
```
