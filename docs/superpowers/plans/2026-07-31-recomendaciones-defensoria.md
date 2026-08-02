# Recomendaciones (Defensoría del Pueblo CABA) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth feature flow — *Recomendaciones* — that runs `POST /llm/data-extraction` over a Defensoría recommendation document, lets the user validate the structured result side-by-side with the original text, persists the validation, and exports the accumulated base to Excel.

**Architecture:** New `FeatureFlowEnum.Recomendaciones` branch inside the existing `/app/$feature/*` route tree (exactly the pattern `VOICE_TO_TEXT` already uses). Reuses the file reducer, `useFileParse`, `FileAnnotator`, the tab primitive and the exceljs filesystem service unchanged. Adds one controlled form-state hook (the legacy ref-based `useForm` is hard-wired to the datapublic label enums and is **not** reusable), one frontend fuzzy-locator that converts extracted values into the annotator's existing `start/end` offsets, and one Excel structure.

**Tech Stack:** React 19 + TanStack Router (file-based) + TanStack Query, Panda CSS, `@aymurai/ui` (TextField / Select / Radio / Button / Card / Callout), zod v4, exceljs, vitest, i18next (es).

## Global Constraints

- Package manager is **pnpm**. `npm install` is unsupported.
- Styling: **Panda CSS** only in new code (`@/styled/css`, `@/styled/jsx`). `strictTokens: true` — arbitrary values need `[bracket]` escapes. Do **not** import `@stitches/react` or `@/styles/stitches.config` in any new file.
- Radix primitives are only consumed through `src/renderer/src/components/ui/*`, never directly.
- UI strings live in `src/renderer/src/constants/i18n/locales/es/`. No hardcoded Spanish in components except where the existing dataset flow already does so (prefer i18n for all new copy).
- Pre-commit gate: biome + panda codegen + forbidden-pattern grep (`console.log`, `debugger`, merge markers, `.only(`). Pre-push gate: `pnpm typecheck` && `pnpm knip` (knip fails on unused exports — export only what is consumed).
- Tests: `pnpm test` (vitest run). Co-locate `*.test.ts(x)` next to the unit under test, as the repo already does.
- Backend base URL comes from `services/api.ts` (`api.defaults.baseURL`, patched by the server-selection page). Always go through `api`, never `fetch`.
- Feature branch off `develop`.

---

## 1. Estado actual relevante

### 1.1 Cómo está construido hoy el Set de Datos

**Ruta y esqueleto.** El flujo vive en [routes/app.$feature/](../../../src/renderer/src/routes/app.$feature/), con una ruta por paso: `onboarding` → `preview` → `process` → `validation` → `finish`. [route.tsx](../../../src/renderer/src/routes/app.$feature/route.tsx) valida el parámetro `feature` contra un `z.enum` de `FeatureFlowEnum` y monta `FileProvider` (y `TranscriptionProvider` sólo para voz). **Cada paso hace `if (feature === FeatureFlowEnum.VoiceToText) return <VoiceX />`** y cae al componente documental por defecto — ése es el punto de extensión exacto para Recomendaciones.

**Estado de archivos.** `DocFile` ([types/file.ts](../../../src/renderer/src/types/file.ts)) guarda `data: File`, `paragraphs?: Paragraph[]`, `predictions?: PredictLabel[]`, `validated?: boolean` y `validationObject: FormData`. Lo maneja el reducer [reducers/file/index.ts](../../../src/renderer/src/reducers/file/index.ts) vía `useFiles()` / `useFileDispatch()`.

**Procesamiento.** [process.tsx](../../../src/renderer/src/routes/app.$feature/process.tsx) encadena `useFileParse` (→ `POST /misc/document-extract`, guarda `paragraphs` con `id = "${document_id}:${index}"`) y `usePredict` (→ NER por párrafo). El progreso es una suma ponderada por etapa.

**Validación.** [components/validate-dataset/index.tsx](../../../src/renderer/src/components/validate-dataset/index.tsx) es un `Grid` de 2 columnas: izquierda `FileAnnotator`, derecha `FormGroup` scrolleable + `Footer` con "Validar documento". [form-group/index.tsx](../../../src/renderer/src/components/validate-dataset/form-group/index.tsx) instancia cinco sub-formularios y las solapas `DecisionTabs`.

**Estado del formulario.** [hooks/useForm/index.ts](../../../src/renderer/src/hooks/useForm/index.ts) es **no controlado**: `register(name, decision)` devuelve un callback de `ref` y escribe en un `useRef<FormData>`; `submit()` lee el ref completo. Está acoplado a los enums `LabelType` / `LabelDecisiones` (`if (name in LabelDecisiones)`).

**Suggestions.** [utils/predictions/suggestions/index.ts](../../../src/renderer/src/utils/predictions/suggestions/index.ts) — clase `Suggester` que reduce `PredictLabel[]` a `{ [label]: valor }` y expone `.text(label) → { suggestion }`, `.select(label) → { suggestion, priorityOrder }`, más *ad hoc* (`violencia_genero`, `art_infringido`, …). Los componentes de `@aymurai/ui` consumen esas props tal cual.

**Documento + highlighting.** [components/file-annotator/index.tsx](../../../src/renderer/src/components/file-annotator/index.tsx) renderiza cada párrafo pasándolo por [generateSplits.ts](../../../src/renderer/src/components/file-annotator/generateSplits.ts), que corta el string en `Split`s a partir de `Annotation[]` (`{ type: "tag" | "search" | "text", start, end, … }` — ver [annotations.ts](../../../src/renderer/src/components/file-annotator/annotations.ts) y [types.ts](../../../src/renderer/src/components/file-annotator/types.ts)). **El sistema de highlights no sabe nada de NER: sólo consume offsets `start`/`end` por párrafo.** Ya hay dos productores de anotaciones (`labelToAnnotation` desde predicciones, `createSearchMatches` desde la búsqueda de texto); nosotros agregamos un tercero.

**Exportación.** [services/filesystem/excel/](../../../src/renderer/src/services/filesystem/excel/) (`create` / `read` / `write` / `open`, exceljs, vía `filesystemAPI()` del preload). [utils/file/excelStructure.ts](../../../src/renderer/src/utils/file/excelStructure.ts) es el array ordenado de columnas; [utils/file/submitValidations/offline.ts](../../../src/renderer/src/utils/file/submitValidations/offline.ts) abre-o-crea el workbook y hace `worksheet.addRows(...)`. [finish-dataset.tsx](../../../src/renderer/src/components/finish/finish-dataset.tsx) dispara el submit al montar.

### 1.2 Qué podemos reutilizar

| Pieza | Ruta | Uso |
|---|---|---|
| Ramificación por feature | `routes/app.$feature/*.tsx` | Sin cambios estructurales: sumar un `if` por paso |
| `FileProvider` + reducer | `context/File`, `reducers/file/` | Sin cambios |
| `useFileParse` | `hooks/useFileParse.ts` | Sin cambios — ya produce `paragraphs` y el `document_id` |
| `fileParser` query | `services/aymurai/queries.ts:256` | Sin cambios |
| `FileAnnotator` + `generateSplits` | `components/file-annotator/` | Extender con una fuente de anotaciones extra |
| `Tab` / `TabName` | `components/tabs/index.ts` | Reutilizar (ojo: Stitches, ver §9) |
| `FileProcessing`, `FileCheck`, `Header`, `Footer`, `MainContent`, `SectionTitle`, `BackButton`, `RequireFile`, `HowItWorks`, `FileDropZone` | varios | Sin cambios |
| `filesystem.excel` | `services/filesystem/excel/` | Sin cambios |
| `TextField`, `Select`, `Radio`, `Button`, `Card`, `Callout`, `Suggestion` | `@aymurai/ui` | Sin cambios |
| Patrón de persistencia | backend `datapublic` / `asr` | Modelo a copiar (§4) |

### 1.3 Qué necesita variante propia

1. **Estado del formulario.** `useForm` no sirve: es no controlado y está acoplado a los enums de datapublic, mientras que `TextField`/`Select` de `@aymurai/ui` son **controlados** (`value` es prop requerida en `TextFieldProps`). Hook nuevo.
2. **`Suggester`.** Reduce `PredictLabel[]`; nuestra inferencia no son labels con offsets sino un objeto plano. La "suggestion" sale directo del objeto inferido — no hace falta la clase.
3. **Productor de anotaciones.** No hay offsets: hay que localizarlos (§5).
4. **Taxonomía tema→subtema.** No existe en el frontend.
5. **Estructura de Excel.** `excelStructure` es del dataset judicial.
6. **Textarea.** `@aymurai/ui` no exporta multiline (`TextFieldProps.type` sólo admite `"text" | "number"`), y `RichTextEditor` (tiptap) es desproporcionado para `contenido_para_publicar`.
7. **RadioGroup.** `@aymurai/ui` exporta `Radio` pero **no** `RadioGroup`; el `RadioGroup` local (`components/radio/radio-group`) es Stitches y no se puede usar en código nuevo.

### 1.4 Discrepancias detectadas entre el enunciado y el código real

| Enunciado | Código real | Consecuencia |
|---|---|---|
| "`llm/data-extraction` recibe el PDF" | `DataExtractionRequest.document: Document` — **recibe el resultado de `/misc/document-extract`**, no el archivo (`router.py`, `schemas.py`) | El frontend encadena `fileParser` → `dataExtraction`; no hay multipart. Ventaja: `document_id` sale gratis. |
| `DestinatarioExtraction` sin candidatos en el resumen | Tiene `candidatos_nombre` / `candidatos_cargo: list[OrganigramCandidate]` con `{nombre, cargo, sigla, depende_de_cargo, ruta_cargos, score}` | Hay que modelar `OrganigramCandidate` completo. |
| — | `score` **cambia de escala** según `search_backend`: 0–100 en `fuzzy`, ~0–1 en `embeddings`/`hybrid` (`schemas.py`) | Nunca mostrar el score crudo ni umbralarlo en el frontend. |
| — | Los candidatos vienen **vacíos** salvo `sector == "GCBA"` | La UI de candidatos debe degradar a TextField puro. |
| — | El endpoint devuelve `DataExtractionResult` **sin `document_id`** | El frontend correlaciona por el `document_id` que ya tiene de `fileParser`. |
| "existe una jerarquía tema → subtema" | Vive sólo en `resources/llm/defensoria_extractor.yml` (clave `taxonomy`, YAML embebido como string) en el backend | Hay que portarla a un JSON del frontend (§9, riesgo de drift). |
| "persistencia … todavía no implementada" | Confirmado: no hay router de persistencia para recomendaciones. Pero `datapublic` y `asr` ya exponen `GET/POST /validation/document/{document_id}` con columnas `prediction` + `validation` | El contrato a pedir es una copia literal (§4). |

---

## 2. Arquitectura propuesta

### Reutilizar sin cambios

- Árbol de rutas `/app/$feature/*`, `FileProvider`, reducer de archivos, `useFileParse`, `fileParser`.
- `services/filesystem/excel/*` y `filesystemAPI()`.
- Layout (`Header`, `Footer`, `MainContent`, `SectionTitle`, `RequireFile`, `BackButton`), `FileProcessing`, `FileCheck`, `HowItWorks`.
- `@aymurai/ui`: `TextField`, `Select`, `Radio`, `Button`, `Card`, `Callout`, `FileDropZone`.

### Extender

- **`FeatureFlowEnum`** + `featureNamespace` + `FEATURE_ICON` + `z.enum` de `route.tsx` + tarjeta en `routes/home/features.tsx`.
- **Cada paso del flujo** (`onboarding`, `preview`, `process`, `validation`, `finish`): un `if (feature === FeatureFlowEnum.Recomendaciones) return <RecomendacionesX />` idéntico al de voz.
- **`FileAnnotator`**: prop opcional `extraAnnotations?: Map<string, ExtraAnnotation[]>` (clave = `paragraphId`). Cuando llega, se concatena a lo que ya produce `createAnnotationsWithSearch`. Cambio aditivo, sin tocar el flujo del anonimizador.
- **`DocFile`**: campo opcional `recomendacion?: RecomendacionState` (mismo criterio con el que `durationMs` se sumó para voz).

### Parametrizar / generalizar

- **`components/decision-tabs`** → aceptar `label: string` (default `"Decisión"`) y `onRemove?: (n: number) => void`. Así sirve para "Destinatario 1..N" sin duplicar el componente. Es el único refactor transversal y es de ~15 líneas.

### Componentes nuevos realmente necesarios

```
src/renderer/src/
├── types/recomendaciones.ts                       # tipos del dominio
├── schema/recomendaciones.ts                      # zod del response de data-extraction
├── constants/recomendaciones/
│   ├── taxonomy.ts                                # tema → subtema[]
│   └── sectores.ts                                # SelectOption[] de sector
├── services/aymurai/recomendaciones.ts            # llamadas HTTP crudas
├── hooks/useRecomendacionForm.ts                  # estado controlado del formulario
├── hooks/useDataExtraction.ts                     # orquestación por archivo (parse→extract→load)
├── utils/recomendaciones/
│   ├── locate-value.ts                            # exact + fuzzy → offsets
│   ├── build-annotations.ts                       # RecomendacionValues → Map<paragraphId, ExtraAnnotation[]>
│   └── to-excel-rows.ts                           # validación → filas
├── components/ui/textarea.tsx                     # multiline Panda (mismos visuales que TextField)
├── components/ui/radio-group.tsx                  # group + label Panda sobre @aymurai/ui Radio
└── components/recomendaciones/
    ├── onboarding.tsx  preview.tsx  process.tsx  validation.tsx  finish.tsx
    ├── recomendacion-form.tsx                     # panel derecho
    ├── destinatario-fields.tsx                    # campos de un destinatario
    └── organigram-picker.tsx                      # Select de candidatos → escribe en el TextField
```

Preferimos añadir un directorio `components/recomendaciones/` (espejo de `components/voice-to-text/`) antes que meter variantes dentro de `validate-dataset/`: el formulario no comparte ni un campo con el judicial.

---

## 3. Modelo de datos y estado del frontend

### 3.1 Tipos — `src/renderer/src/types/recomendaciones.ts`

```ts
/** Un renglón del organigrama GCBA propuesto por el backend. */
export interface OrganigramCandidate {
  nombre: string;
  cargo: string;
  sigla: string;
  depende_de_cargo: string | null;
  ruta_cargos: string;
  /** Escala dependiente del backend de búsqueda (0-100 fuzzy, ~0-1 embeddings/hybrid).
   *  NO comparar contra umbrales fijos ni mostrar crudo: sólo respetar el orden. */
  score: number;
}

export interface DestinatarioExtraction {
  nombre: string | null;
  cargo: string | null;
  destinatario_principal: boolean;
  sector: string | null;
  candidatos_nombre: OrganigramCandidate[];
  candidatos_cargo: OrganigramCandidate[];
}

/** Respuesta cruda de POST /llm/data-extraction. */
export interface DataExtractionResult {
  numero_recomendacion: string | null;
  fecha_recomendacion: string | null;
  destinatarios: DestinatarioExtraction[];
  tema: string | null;
  subtema: string | null;
  datos_personales: boolean;
  contenido_para_publicar: string;
}

/** Un destinatario tal como lo edita el usuario. `id` es local y estable
 *  (crypto.randomUUID) para poder usarlo como key de React y de las tabs. */
export interface DestinatarioValue {
  id: string;
  nombre: string;
  cargo: string;
  destinatario_principal: boolean;
  sector: string;
}

/** Los valores editables del formulario. Strings vacíos, nunca null:
 *  TextField/Select son controlados y `null` rompería el binding. */
export interface RecomendacionValues {
  numero_recomendacion: string;
  fecha_recomendacion: string;
  destinatarios: DestinatarioValue[];
  tema: string;
  subtema: string;
  datos_personales: boolean | null;
  contenido_para_publicar: string;
}

/** Sugerencias = inferencia original congelada, en el mismo shape que los valores.
 *  Se conserva aparte para (a) alimentar `suggestion` de TextField/Select y
 *  (b) poder diffear inferencia vs validación al persistir. */
export type RecomendacionSuggestions = RecomendacionValues;

export type RecomendacionOrigin = "inference" | "stored-inference" | "validation";

export interface RecomendacionState {
  /** UUID5 del contenido del archivo, devuelto por /misc/document-extract. */
  documentId: string;
  origin: RecomendacionOrigin;
  /** Inferencia cruda, incluidos los candidatos de organigrama. */
  inference: DataExtractionResult;
  suggestions: RecomendacionSuggestions;
  values: RecomendacionValues;
  /** Candidatos indexados por `DestinatarioValue.id`. Fuera de `values` porque
   *  no son datos editables ni se persisten como validación. */
  candidates: Record<
    string,
    { nombre: OrganigramCandidate[]; cargo: OrganigramCandidate[] }
  >;
}
```

### 3.2 Inferido vs validado

Se guardan los dos, siempre:

- `suggestions` — snapshot inmutable de la inferencia normalizada. Alimenta `TextField.suggestion` / `Select.suggestion` y **nunca** se muta.
- `values` — lo que el usuario ve y edita. Se inicializa como copia de `suggestions`.

Un campo "quedó como lo infirió el modelo" ⇔ `values[k] === suggestions[k]`. Eso da métricas de corrección gratis y es lo que se manda como `validation` al backend.

### 3.3 Normalización inferencia → valores

`null` → `""` para strings; `datos_personales` (bool no-nullable en el backend) se mapea a `boolean` directo; cada destinatario recibe `id: crypto.randomUUID()`. Si `destinatarios` viene vacío, se siembra **un** destinatario vacío para que el usuario tenga dónde escribir.

### 3.4 Destinatarios: agregar / eliminar / cambiar

- Tabs "Destinatario 1..N" con `DecisionTabs` parametrizado (`label="Destinatario"`).
- **Agregar** (`+`): push de `{ id: crypto.randomUUID(), nombre: "", cargo: "", destinatario_principal: false, sector: "" }`, sin candidatos → los `Select` de organigrama no se renderizan. Selecciona la nueva tab.
- **Eliminar**: sólo si `destinatarios.length > 1`. Borra la entrada y su clave en `candidates`, y clampa el índice seleccionado a `length - 1`.
- **`destinatario_principal`** es un Radio Sí/No **por destinatario** (no un radio exclusivo global): el backend permite varios principales y la sección RESUELVE puede dirigirse a más de uno.
- La UI **no** fuerza que haya al menos un principal; si no hay ninguno, el footer muestra un `Callout variant="warning"` no bloqueante.

### 3.5 Relación tema → subtema

`constants/recomendaciones/taxonomy.ts` exporta:

```ts
export const TAXONOMY: Record<string, string[]> = { /* portado del YAML */ };
export const TEMA_OPTIONS: SelectOption[] =
  Object.keys(TAXONOMY).map((t) => ({ id: t, text: t }));
export const subtemaOptions = (tema: string): SelectOption[] =>
  (TAXONOMY[tema] ?? []).map((s) => ({ id: s, text: s }));
```

Reglas:
- Cambiar `tema` **limpia** `subtema` salvo que el subtema actual siga siendo válido bajo el nuevo tema.
- Si el LLM devuelve un `subtema` que no pertenece al `tema` devuelto, se conserva el valor (no se descarta información) y se inyecta como opción extra marcada, más un `error` en el `Select` con el texto "Subtema fuera de la taxonomía del tema seleccionado".
- Si `tema` no está en la taxonomía, misma estrategia sobre `TEMA_OPTIONS`.

### 3.6 Estados de carga / error / procesado / validado

Por archivo, derivados igual que en `process.tsx`:

| Estado | Origen |
|---|---|
| `parsing` | `useFileParse` |
| `loading-stored` | `GET .../validation/document/{id}` en vuelo |
| `extracting` | mutación `data-extraction` en vuelo |
| `ready` | `file.recomendacion !== undefined` |
| `error` | cualquiera de las tres falla → `Callout variant="error"` + botón "Reintentar" |

`file.validated` (ya existente en el reducer, acción `validate`) marca el documento como validado en la sesión; `isValidationCompleted(files)` habilita "Continuar". Se reutiliza tal cual.

---

## 4. Integración con el backend

### 4.1 Lo que ya existe

```
POST /misc/document-extract   (multipart)  → { document_id, document: string[], header, footer }
POST /llm/data-extraction     (json)       → DataExtractionResult
```

`document_id` es un **UUID5 derivado de los bytes del archivo** (`data_to_uuid(data)` en `misc/document_extract.py:157`). Eso resuelve la pregunta abierta de "identificación inequívoca de una Recomendación": el mismo PDF byte-a-byte da el mismo id; una re-exportación del PDF, no. Se documenta como limitación aceptada para el MVP.

Cuerpo de la extracción (los overrides quedan sin enviar; el backend usa sus defaults):

```ts
await api.post<unknown>("/llm/data-extraction", {
  document: { document_id: documentId, document: paragraphs.map((p) => p.value) },
});
```

Respuesta validada con zod (`schema/recomendaciones.ts`) antes de tocar el estado, igual que `documentExtractSchema`.

> Nota de rendimiento: es un LLM local, single-shot por documento y sin streaming. El flujo de Recomendaciones se limita a **un archivo** (como voz), y `process.tsx` muestra progreso indeterminado — no hay ratio por párrafo que ponderar.

### 4.2 Contrato pendiente (backend por implementar)

Copia literal del par que ya existe en `datapublic` y `asr`:

```
GET  /llm/recomendaciones/validation/document/{document_id}
  200 → { document_id, prediction: DataExtractionResult | null,
          validation: RecomendacionValidation | null,
          created_at, updated_at }
  404 → documento nunca procesado

POST /llm/recomendaciones/validation/document/{document_id}
  body: RecomendacionValidation
  204
```

Con `RecomendacionValidation`:

```jsonc
{
  "numero_recomendacion": "1440/22",
  "fecha_recomendacion": "30 de Mayo de 2022",
  "destinatarios": [
    { "nombre": "…", "cargo": "…", "destinatario_principal": true, "sector": "GCBA" }
  ],
  "tema": "…",
  "subtema": "…",
  "datos_personales": true,
  "contenido_para_publicar": "…"
}
```

Es decir: **`validation` tiene el mismo shape que `DataExtractionResult` menos los `candidatos_*`** (los candidatos son andamiaje de la inferencia, no dato validado). El backend debería además guardar la inferencia cruda en `prediction` la primera vez que corre la extracción, replicando `DataPublicDocumentBase` (`aymurai/database/meta/datapublic/document.py`):

```python
class RecomendacionDocumentBase(SQLModel):
    prediction: DataExtractionResult | None = Field(None, sa_column=Column(JSON))
    validation: RecomendacionValidation | None = Field(None, sa_column=Column(JSON))
```

**Cómo se distingue inferencia de validación:** por columna, no por heurística. `validation != null` ⇒ el documento fue validado a mano. `validation == null && prediction != null` ⇒ procesado sin validar. `404` ⇒ nunca procesado.

Endpoint opcional (nice-to-have, evita el drift de la taxonomía — §9):

```
GET /llm/data-extraction/taxonomy → { "TEMA": ["subtema", …], … }
```

### 4.3 Qué se reutiliza del flujo de Voz a Texto

- La **forma** del contrato (`/validation/document/{document_id}`, GET+POST, `document_id` como UUID5).
- El patrón cliente de [services/aymurai/asrValidation.ts](../../../src/renderer/src/services/aymurai/asrValidation.ts): funciones `saveValidation` / `loadValidation` planas con `signal`, envueltas en `mutationOptions` desde `queries.ts` y consumidas con `useMutation`.
- El patrón de UX de guardado de [components/voice-to-text/validation.tsx](../../../src/renderer/src/components/voice-to-text/validation.tsx): `await mutateAsync` antes de navegar, `catch` → `showToast(…, "warning")`, la navegación **nunca** se bloquea por un fallo de persistencia.

Lo que **no** se reutiliza: `TranscriptionProvider`/`TranscriptionContext` (estado propio del dominio ASR) ni `asrMapper`.

### 4.4 Degradación mientras el backend no exista

`useDataExtraction` trata cualquier error de `GET` distinto de 404 como 404 (log + seguir a extracción) y cualquier error de `POST` como warning no bloqueante. Con eso las etapas 1–7 del §8 son desarrollables y demostrables **sin backend nuevo**.

---

## 5. Highlighting de valores extraídos

### 5.1 Dónde vive la lógica y por qué

**En el frontend**, en `utils/recomendaciones/locate-value.ts`.

Razones concretas:
1. El sistema de highlights ya existente (`generateSplits`) consume **offsets relativos a `paragraph.value`**, y esos párrafos son un artefacto del frontend (`useFileParse` los construye con `id = "${document_id}:${index}"`). Devolver offsets desde el backend obligaría a fijar ese contrato de particionado.
2. El highlight tiene que **recalcularse mientras el usuario edita** (si corrige `cargo`, el resaltado debe seguir al nuevo texto). Un round-trip por pulsación es inviable; en frontend es un `useMemo`.
3. El backend actual no expone ningún endpoint de alineación y agregarlo sería trabajo nuevo para un problema que en frontend son ~120 líneas testeables.
4. Reutiliza el mismo camino que la búsqueda de texto, que ya calcula matches en cliente (`createSearchMatches`).

Contra: duplicaríamos el matcher si en el futuro hiciera falta server-side. Se acepta — está aislado en un módulo puro con tests.

### 5.2 Algoritmo

```ts
export interface LocatedRange {
  paragraphId: string;
  start: number;
  end: number;
  score: number;      // 1 = exacto
  exact: boolean;
}

export interface LocateOptions {
  /** Similitud mínima para aceptar un match difuso. */
  threshold?: number;   // default 0.9
  /** Longitud mínima del valor para intentar match. */
  minLength?: number;   // default 4
  /** Máximo de ocurrencias a devolver. */
  maxMatches?: number;  // default 3
}
```

**Paso 0 — descarte.** Si `value.trim().length < minLength` → `[]`. Evita resaltar `"22"`, `"NO"`, siglas de 2 letras.

**Paso 1 — normalización.** `normalize(s)` = minúsculas + `NFD` + quitar diacríticos + colapsar todo run de whitespace a un espacio simple. Se construye en paralelo un **mapa índice-normalizado → índice-original** por párrafo, para poder devolver offsets sobre el texto crudo (el annotator hace `children.slice(s.start, s.end)` sobre el original).

**Paso 2 — exacto.** `indexOf` sobre el texto normalizado, en bucle, recogiendo **todas** las ocurrencias. Si hay al menos una → devolver ésas con `score = 1, exact = true`. No se corre fuzzy.

**Paso 3 — fuzzy (fallback).** Ventana deslizante sobre el párrafo normalizado de longitud `|v|`, con paso `max(1, floor(|v| / 8))`, y similitud

```
sim(a, b) = 1 - levenshtein(a, b) / max(|a|, |b|)
```

usando `fastest-levenshtein` (≈1 KB, sin dependencias transitivas). Se conserva la mejor ventana por párrafo; si `sim >= threshold`, se refina con una búsqueda local de ±paso sobre los bordes para ajustar el rango. Corte temprano: si `abs(|párrafo| - |v|)` hace imposible superar el umbral, se saltea el párrafo entero.

**Paso 4 — selección y múltiples ocurrencias.**
- Exactos: se devuelven **todos** (hasta `maxMatches`), ordenados por aparición. Un número de recomendación que aparece en el encabezado y en el pie debe resaltarse dos veces.
- Fuzzy: se devuelve **sólo el mejor** (`maxMatches` se ignora). Varios matches aproximados casi siempre son ruido.
- Empate de score en fuzzy → gana el de menor `(paragraphIndex, start)`, para que el resultado sea determinista y testeable.

**Paso 5 — sin match confiable.** Se devuelve `[]`. Ningún highlight y ningún placeholder: preferimos ausencia a un resaltado engañoso. El campo del formulario muestra un ícono discreto "sin ubicar en el documento" (tooltip), para que el usuario sepa que la falta de highlight no es un bug.

### 5.3 Campos: qué se resalta y qué no

| Campo | Estrategia | Motivo |
|---|---|---|
| `numero_recomendacion` | exacto + fuzzy, **todas** las ocurrencias | Aparece en pie de página y a veces en el cuerpo |
| `fecha_recomendacion` | exacto + fuzzy | El LLM normaliza `"30 de Mayo de 2022"` vs `"30 de mayo de 2022"` — lo cubre la normalización de caso |
| `destinatario.nombre` | exacto + fuzzy | Nombres propios, alta tasa de match exacto |
| `destinatario.cargo` | exacto + fuzzy con `threshold` 0.9 | El LLM **reconstruye** el cargo completo agregando el organismo; muchas veces no habrá match y está bien |
| `destinatario.sector` | **no se resalta** | Es una clasificación (`GCBA`, `Empresa`…), no una cita |
| `tema` | **no se resalta** | Taxonomía cerrada, no literal del documento |
| `subtema` | **no se resalta** | Idem |
| `datos_personales` | **no se resalta** | Booleano derivado |
| `contenido_para_publicar` | **no se resalta como bloque** | Es una síntesis de 1-2 líneas del LLM, no una cita: un fuzzy sobre el documento entero daría un match arbitrario. Ver abajo. |

`contenido_para_publicar` **sí** se resalta en modo "párrafos de apoyo": se calcula la similitud del contenido contra cada párrafo con un score de solapamiento de tokens (Jaccard sobre palabras de ≥4 letras, sin stopwords), y se marcan hasta 2 párrafos con `>= 0.35` con un highlight **de párrafo completo y estilo tenue** distinto del de valor. Si ninguno supera el umbral, no se marca nada. Esto se implementa en la Etapa 9 y es explícitamente opcional: si en QA resulta ruidoso, se apaga con una constante.

### 5.4 Representación en el sistema existente

Se agrega un tipo de anotación al union de [file-annotator/types.ts](../../../src/renderer/src/components/file-annotator/types.ts):

```ts
export interface ExtractedValueAnnotation extends BaseAnnotation {
  type: "extracted";
  paragraphId: string;
  /** Clave del campo, p. ej. "numero_recomendacion" o "destinatario:<id>:cargo". */
  field: string;
  /** Highlight tenue reservado a contenido_para_publicar. */
  variant?: "value" | "support";
  isActive?: boolean;
}
```

`generateSplits` ya es agnóstico al tipo (parte por `start`/`end`); sólo hay que renderizar el caso `"extracted"` en `Paragraph` con un `<mark>` Panda nuevo (`components/file/extracted-annotation.tsx`). `isActive` se enciende cuando el campo correspondiente tiene el foco, reutilizando el mismo scroll-into-view que ya usa la búsqueda (`[data-search-match-id]` → nuevo `[data-extracted-field]`).

**Solapamientos**: `generateSplits` debe verificarse contra rangos superpuestos (p. ej. `nombre` dentro de `cargo`). Si no los soporta, la capa de construcción (`build-annotations.ts`) resuelve el conflicto **antes**: ordena por `(start, -length)` y descarta cualquier anotación que se solape con una ya aceptada, prefiriendo la más larga. Esto se decide en la Etapa 8, Paso 1, leyendo `generateSplits.ts`.

---

## 6. Persistencia y reapertura

`useDataExtraction(file)`, al montar el paso `process`:

```
1. useFileParse ya dejó paragraphs + document_id
2. GET /llm/recomendaciones/validation/document/{document_id}
   ├─ 404 ────────────────► POST /llm/data-extraction
   │                        origin = "inference"
   │                        suggestions = values = normalize(result)
   ├─ 200, validation != null ─► origin = "validation"
   │                        suggestions = normalize(prediction ?? validation)
   │                        values      = normalize(validation)
   │                        candidates  = de prediction (si hay), si no {}
   └─ 200, validation == null, prediction != null ─► origin = "stored-inference"
                            suggestions = values = normalize(prediction)
                            candidates  = de prediction
3. dispatch(setRecomendacion(fileName, state))
```

| Caso | Qué ve el usuario |
|---|---|
| **Nunca procesado** | Barra de progreso "AymurAI está extrayendo los datos", luego el formulario con los valores inferidos y todas las suggestions marcadas |
| **Procesado, no validado** | Sin llamada al LLM (rápido). Mismo formulario. `Callout variant="info"`: "Se recuperó una extracción previa de este documento." |
| **Validado previamente** | Sin llamada al LLM. Los campos muestran **lo validado**; las suggestions siguen mostrando **la inferencia original**, de modo que se ve qué se corrigió. `Callout variant="success"`: "Este documento ya fue validado el {fecha}. Podés editarlo y volver a guardar." |
| **Edición posterior** | El `POST` es un **upsert**: pisa `validation` completo. No hay versionado en el MVP; `updated_at` del backend registra la última edición. |

Notas:
- Al **reabrir un documento validado**, si `prediction` es `null` en el backend (validación guardada por una versión anterior sin `prediction`), `suggestions` cae a `values` y sencillamente no se marca nada como sugerido. Sin error.
- Los **candidatos de organigrama sí se persisten** (DECIDIDO, §9.2): el backend guarda el `DataExtractionResult` completo en `prediction`, incluidos `candidatos_nombre` y `candidatos_cargo`. Al reabrir un documento validado, los candidatos se leen de `prediction` y los `Select` de organigrama se renderizan igual que en la primera pasada. **Esto es un requisito del issue de backend, no algo opcional.** Si `prediction` viniera `null` (validación guardada por una versión anterior), `candidates` cae a `{}` y los `Select` de organigrama sencillamente no se renderizan — el usuario edita `nombre`/`cargo` como texto libre. Sin error.
- El guardado ocurre en el handler de "Validar documento" (antes de `dispatch(validate(...))` y de navegar), replicando `voice-to-text/validation.tsx`.

---

## 7. Base interna y exportación a Excel

### De dónde vienen los registros

Fuente de verdad = tabla `recomendacion_document` del backend (columna `validation`). El **frontend no mantiene una base propia**; escribe al `.xlsx` local en el paso `finish`, exactamente como `finish-dataset.tsx`, y ese `.xlsx` acumulativo *es* la base interna del MVP.

Cuando exista el backend, la exportación completa debería moverse a un `GET /llm/recomendaciones/export?format=xlsx` análogo al `database_export` que `datapublic` ya tiene (`pandas.to_csv` sobre un `select(...)`). **Responsabilidad recomendada:**

- **MVP (Etapa 10):** frontend. Cero backend nuevo, reutiliza `services/filesystem/excel` y el preload existente, y el usuario ya tiene el archivo en su máquina.
- **Objetivo:** backend, porque la base tiene que sobrevivir a un cambio de máquina y consolidar validaciones de varios operadores. El frontend queda como un botón "Exportar base completa" que descarga el blob (patrón ya usado en `anonymize` → `responseType: "blob"`).

Ambas convergen si el frontend y el backend comparten el mismo orden de columnas — por eso el array de columnas se define una sola vez y se documenta como contrato.

### Columnas (hoja `recomendaciones`, una fila por Recomendación)

```ts
export const RECOMENDACIONES_COLUMNS = [
  "NUMERO_RECOMENDACION",
  "FECHA_RECOMENDACION",
  "TEMA",
  "SUBTEMA",
  "DATOS_PERSONALES",              // "si" | "no"
  "CONTENIDO_PARA_PUBLICAR",
  "DESTINATARIO_PRINCIPAL_NOMBRE", // primer principal
  "DESTINATARIO_PRINCIPAL_CARGO",
  "DESTINATARIO_PRINCIPAL_SECTOR",
  "DESTINATARIOS",                 // todos, "nombre — cargo (sector) [principal]" unidos por " | "
  "CANTIDAD_DESTINATARIOS",
  "DOCUMENTO",                     // nombre de archivo
  "DOCUMENT_ID",                   // UUID5, clave de deduplicación
  "FECHA_VALIDACION",              // ISO date local
] as const;
```

### Múltiples destinatarios

**DECIDIDO (ver §9.3): una sola hoja `recomendaciones`, una fila por recomendación.** Es lo que se copia a defensoria.org.ar, que publica una entrada por recomendación. Los destinatarios se aplanan en la columna `DESTINATARIOS` y el principal se promueve a columnas propias. Si hay más de un principal, se toma el primero y `DESTINATARIOS` conserva todos con la marca `[principal]`.

La hoja relacional `destinatarios` (una fila por destinatario) queda **fuera del MVP**: es útil para análisis pero no es crítica. No implementarla.

**DECIDIDO (ver §9.4): un único archivo `.xlsx` compartido con el Set de Datos.** No se agrega ningún canal al preload ni se toca `src/main`/`src/preload`. Las dos features conviven en el mismo workbook, separadas por worksheet:

- `set_de_datos` — la crea `excel/create.ts` (sin cambios).
- `recomendaciones` — la crea, si falta, `ensureRecomendacionesSheet(workbook)` en `services/filesystem/excel/recomendaciones-sheet.ts`.

Es decir: **no** hay `create-recomendaciones.ts` ni un workbook aparte. El writer hace `read() ?? create()` y después se asegura la hoja. **No se toca `create.ts`.**

> Deduplicación: `offline.ts` hoy hace `addRows` a ciegas. Para recomendaciones, el writer nuevo busca primero una fila con el mismo `DOCUMENT_ID` y la **reemplaza** si existe; así re-validar un documento no duplica el renglón.

---

## 8. Etapas de implementación

Cada etapa es commiteable y verificable por separado. Las etapas 1–7 y 9–11 **no dependen de backend nuevo**; la 8 sí (y degrada, ver §4.4).

---

### Etapa 1 — Registrar la feature en el shell de la app

**Archivos:**
- Modificar: `src/renderer/src/types/features.ts`
- Modificar: `src/renderer/src/constants/config.ts`
- Modificar: `src/renderer/src/routes/app.$feature/route.tsx`
- Modificar: `src/renderer/src/routes/home/features.tsx`
- Crear: `src/renderer/src/constants/i18n/locales/es/recomendaciones.ts`
- Modificar: `src/renderer/src/constants/i18n/locales/es/index.ts`

**Interfaces producidas:** `FeatureFlowEnum.Recomendaciones = "RECOMENDACIONES"`, namespace i18n `"recomendaciones"`.

- [ ] **Paso 1: Test que falla** — crear `src/renderer/src/types/features.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FeatureFlowEnum, featureNamespace } from "./features";

describe("FeatureFlowEnum", () => {
  it("includes the Recomendaciones flow with its i18n namespace", () => {
    expect(FeatureFlowEnum.Recomendaciones).toBe("RECOMENDACIONES");
    expect(featureNamespace[FeatureFlowEnum.Recomendaciones]).toBe("recomendaciones");
  });
});
```

- [ ] **Paso 2: Correr y ver fallar** — `pnpm test src/renderer/src/types/features.test.ts`. Esperado: FAIL, `Recomendaciones` es `undefined`.

- [ ] **Paso 3: Implementar** — en `types/features.ts` agregar `Recomendaciones = "RECOMENDACIONES"` al enum y `[FeatureFlowEnum.Recomendaciones]: "recomendaciones"` a `featureNamespace`. En `constants/config.ts` agregar `[FeatureFlowEnum.Recomendaciones]: Megaphone` a `FEATURE_ICON` (importar `Megaphone` de `phosphor-react`). En `route.tsx` agregar `FeatureFlowEnum.Recomendaciones` al `z.enum`.

- [ ] **Paso 4: Correr y ver pasar** — `pnpm test src/renderer/src/types/features.test.ts`. Esperado: PASS. `pnpm typecheck` debe fallar si algún `Record<FeatureFlowEnum, …>` quedó incompleto — completarlos.

- [ ] **Paso 5: i18n** — crear `locales/es/recomendaciones.ts` con la misma forma que `dataset.ts` (`title`, `subtitle`, `onboarding.*`, `preview.*`, `process.*`, `result.*`, `finish.*`, `howItWorks.step1..4`) y textos propios: `title: "Recomendaciones"`, `subtitle: "Registra las recomendaciones de la Defensoría en una base estructurada"`. Registrarlo en `locales/es/index.ts` como `recomendaciones`.

- [ ] **Paso 6: Tarjeta en el home** — agregar un cuarto `<FeatureCardLink>` en `routes/home/features.tsx` con `params={{ feature: FeatureFlowEnum.Recomendaciones }}`, `title={t("recomendaciones:title")}`, `subtitle={t("recomendaciones:subtitle")}`, `icon={FEATURE_ICON.RECOMENDACIONES}`, y sumar `"recomendaciones"` al array de `useTranslation([...])`.

- [ ] **Paso 7: Verificar a mano** — `pnpm dev`, entrar al home: se ven cuatro tarjetas; hacer click en Recomendaciones redirige a `/app/RECOMENDACIONES/onboarding` (404 de ruta aún no: `onboarding.tsx` cae al componente documental por defecto, que ya funciona).

- [ ] **Paso 8: Commit**

```bash
git add src/renderer/src/types/features.ts src/renderer/src/types/features.test.ts \
        src/renderer/src/constants/config.ts src/renderer/src/routes/app.\$feature/route.tsx \
        src/renderer/src/routes/home/features.tsx src/renderer/src/constants/i18n/locales/es/
git commit -m "feat(recomendaciones): register Recomendaciones feature flow"
```

---

### Etapa 2 — Tipos, schema zod y taxonomía

**Archivos:**
- Crear: `src/renderer/src/types/recomendaciones.ts`
- Crear: `src/renderer/src/schema/recomendaciones.ts`
- Crear: `src/renderer/src/schema/recomendaciones.test.ts`
- Crear: `src/renderer/src/constants/recomendaciones/taxonomy.ts`
- Crear: `src/renderer/src/constants/recomendaciones/taxonomy.test.ts`
- Crear: `src/renderer/src/constants/recomendaciones/sectores.ts`

**Interfaces producidas:** todos los tipos de §3.1; `dataExtractionResultSchema`; `TAXONOMY`, `TEMA_OPTIONS`, `subtemaOptions(tema)`; `SECTOR_OPTIONS`.

**Interfaces consumidas:** ninguna.

- [ ] **Paso 1: Tipos** — crear `types/recomendaciones.ts` con exactamente el contenido del bloque de §3.1.

- [ ] **Paso 2: Test del schema que falla** — crear `schema/recomendaciones.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dataExtractionResultSchema } from "./recomendaciones";

const FIXTURE = {
  numero_recomendacion: "1440/22",
  fecha_recomendacion: "30 de Mayo de 2022",
  destinatarios: [
    {
      nombre: "Valeria Romina Focaraccio",
      cargo: "Directora General de Fiscalización Urbana",
      destinatario_principal: true,
      sector: "GCBA",
      candidatos_nombre: [
        {
          nombre: "Valeria R. Focaraccio",
          cargo: "Directora General de Fiscalización Urbana",
          sigla: "DGFU",
          depende_de_cargo: null,
          ruta_cargos: "MEPHU > SSMU > DGFU",
          score: 0.91,
        },
      ],
      candidatos_cargo: [],
    },
  ],
  tema: "DERECHOS URBANOS, ESPACIO PÚBLICO Y CONTROL COMUNAL",
  subtema: "Cartelería y publicidad en vía pública",
  datos_personales: true,
  contenido_para_publicar: "Se recomienda el retiro de estructuras publicitarias.",
};

describe("dataExtractionResultSchema", () => {
  it("parses a full backend response", () => {
    const parsed = dataExtractionResultSchema.parse(FIXTURE);
    expect(parsed.destinatarios[0].candidatos_nombre[0].sigla).toBe("DGFU");
  });

  it("defaults the candidate lists to empty arrays when absent", () => {
    const parsed = dataExtractionResultSchema.parse({
      ...FIXTURE,
      destinatarios: [
        { nombre: null, cargo: null, destinatario_principal: false, sector: null },
      ],
    });
    expect(parsed.destinatarios[0].candidatos_nombre).toEqual([]);
    expect(parsed.destinatarios[0].candidatos_cargo).toEqual([]);
  });

  it("defaults destinatarios to an empty array", () => {
    const { destinatarios, ...rest } = FIXTURE;
    expect(dataExtractionResultSchema.parse(rest).destinatarios).toEqual([]);
  });
});
```

- [ ] **Paso 3: Correr y ver fallar** — `pnpm test src/renderer/src/schema/recomendaciones.test.ts`. Esperado: FAIL, el módulo no existe.

- [ ] **Paso 4: Implementar el schema** — crear `schema/recomendaciones.ts`:

```ts
import z from "zod";

export const organigramCandidateSchema = z.object({
  nombre: z.string(),
  cargo: z.string(),
  sigla: z.string(),
  depende_de_cargo: z.string().nullable().default(null),
  ruta_cargos: z.string(),
  score: z.number(),
});

export const destinatarioExtractionSchema = z.object({
  nombre: z.string().nullable().default(null),
  cargo: z.string().nullable().default(null),
  destinatario_principal: z.boolean(),
  sector: z.string().nullable().default(null),
  candidatos_nombre: z.array(organigramCandidateSchema).default([]),
  candidatos_cargo: z.array(organigramCandidateSchema).default([]),
});

export const dataExtractionResultSchema = z.object({
  numero_recomendacion: z.string().nullable().default(null),
  fecha_recomendacion: z.string().nullable().default(null),
  destinatarios: z.array(destinatarioExtractionSchema).default([]),
  tema: z.string().nullable().default(null),
  subtema: z.string().nullable().default(null),
  datos_personales: z.boolean(),
  contenido_para_publicar: z.string(),
});

/** Lo que se persiste como validación manual: el resultado sin los candidatos. */
export const recomendacionValidationSchema = dataExtractionResultSchema.extend({
  destinatarios: z.array(
    destinatarioExtractionSchema.omit({
      candidatos_nombre: true,
      candidatos_cargo: true,
    }),
  ),
});

export const recomendacionDocumentSchema = z.object({
  document_id: z.string(),
  prediction: dataExtractionResultSchema.nullable().default(null),
  validation: recomendacionValidationSchema.nullable().default(null),
  updated_at: z.string().nullable().default(null),
});

export type RecomendacionValidation = z.infer<typeof recomendacionValidationSchema>;
export type RecomendacionDocument = z.infer<typeof recomendacionDocumentSchema>;
```

- [ ] **Paso 5: Correr y ver pasar** — `pnpm test src/renderer/src/schema/recomendaciones.test.ts`. Esperado: 3 PASS.

- [ ] **Paso 6: Portar la taxonomía** — extraerla del backend a JSON con:

```bash
cd ../backend && git show 013e86ea:resources/llm/defensoria_extractor.yml \
  | python3 -c "import sys,yaml,json; print(json.dumps(yaml.safe_load(yaml.safe_load(sys.stdin)['taxonomy']), ensure_ascii=False, indent=2))"
```

El `taxonomy` del YAML es un **string que contiene otro YAML** (una lista de `{TEMA: [subtemas]}`) — de ahí el doble `safe_load`. Convertir esa lista de dicts a un único objeto y volcarlo en `constants/recomendaciones/taxonomy.ts` como el `TAXONOMY` de §3.5, junto a `TEMA_OPTIONS` y `subtemaOptions`. Agregar al encabezado del archivo:

```ts
// Generado desde backend resources/llm/defensoria_extractor.yml (commit 013e86ea).
// Si el backend cambia la taxonomía, este archivo queda desincronizado.
// Ver docs/superpowers/plans/2026-07-31-recomendaciones-defensoria.md §9.
```

- [ ] **Paso 7: Test de la taxonomía** — crear `constants/recomendaciones/taxonomy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TAXONOMY, TEMA_OPTIONS, subtemaOptions } from "./taxonomy";

describe("taxonomy", () => {
  it("exposes every tema as a select option", () => {
    expect(TEMA_OPTIONS).toHaveLength(Object.keys(TAXONOMY).length);
    expect(TEMA_OPTIONS.every((o) => o.id === o.text)).toBe(true);
  });

  it("returns the subtemas of a known tema", () => {
    expect(subtemaOptions("AMBIENTE y CAMBIO CLIMÁTICO")).toContainEqual({
      id: "Inundaciones",
      text: "Inundaciones",
    });
  });

  it("returns an empty list for an unknown tema", () => {
    expect(subtemaOptions("NO EXISTE")).toEqual([]);
  });

  it("has no tema with an empty subtema list", () => {
    for (const [tema, subtemas] of Object.entries(TAXONOMY)) {
      expect(subtemas.length, tema).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Paso 8: Correr** — `pnpm test src/renderer/src/constants/recomendaciones/`. Esperado: 4 PASS.

- [ ] **Paso 9: Sectores** — crear `constants/recomendaciones/sectores.ts`. Los valores salen de `defensoria_extractor.yml` (campo `destinatarios`):

```ts
import type { SelectOption } from "@/types/select";

export const SECTOR_OPTIONS = [
  { id: "GCBA", text: "GCBA" },
  { id: "Organismos Nacionales", text: "Organismos Nacionales" },
  { id: "Obra Social / Prepaga", text: "Obra Social / Prepaga" },
  { id: "Empresa", text: "Empresa" },
] as const satisfies SelectOption[];
```

- [ ] **Paso 10: Commit**

```bash
git add src/renderer/src/types/recomendaciones.ts src/renderer/src/schema/recomendaciones.ts \
        src/renderer/src/schema/recomendaciones.test.ts src/renderer/src/constants/recomendaciones/
git commit -m "feat(recomendaciones): add domain types, zod schema and taxonomy"
```

---

### Etapa 3 — Cliente HTTP de data-extraction

**Archivos:**
- Crear: `src/renderer/src/services/aymurai/recomendaciones.ts`
- Crear: `src/renderer/src/services/aymurai/recomendaciones.test.ts`
- Modificar: `src/renderer/src/services/aymurai/queries.ts`

**Interfaces producidas:**
```ts
extractRecomendacion(documentId: string, paragraphs: string[], signal?: AbortSignal): Promise<DataExtractionResult>
loadRecomendacion(documentId: string, signal?: AbortSignal): Promise<RecomendacionDocument | null>  // null en 404
saveRecomendacion(documentId: string, validation: RecomendacionValidation, signal?: AbortSignal): Promise<void>
// en queries.ts:
recomendacionValidationMutation(): MutationOptions<void, Error, { documentId: string; validation: RecomendacionValidation }>
```

**Interfaces consumidas:** Etapa 2 (`dataExtractionResultSchema`, `recomendacionDocumentSchema`, `RecomendacionValidation`).

- [ ] **Paso 1: Test que falla** — crear `services/aymurai/recomendaciones.test.ts`. Mockear `../api` con `vi.mock` (mismo patrón que `services/aymurai/__tests__/`):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const get = vi.fn();
vi.mock("../api", () => ({ default: { post: (...a: unknown[]) => post(...a), get: (...a: unknown[]) => get(...a) } }));

const { extractRecomendacion, loadRecomendacion } = await import("./recomendaciones");

beforeEach(() => { post.mockReset(); get.mockReset(); });

describe("extractRecomendacion", () => {
  it("posts the document envelope the backend expects", async () => {
    post.mockResolvedValue({ data: {
      numero_recomendacion: "1/24", fecha_recomendacion: null, destinatarios: [],
      tema: null, subtema: null, datos_personales: false, contenido_para_publicar: "x",
    }});
    const result = await extractRecomendacion("doc-1", ["p1", "p2"]);
    expect(post).toHaveBeenCalledWith(
      "/llm/data-extraction",
      { document: { document_id: "doc-1", document: ["p1", "p2"] } },
      expect.anything(),
    );
    expect(result.numero_recomendacion).toBe("1/24");
  });
});

describe("loadRecomendacion", () => {
  it("returns null on 404 instead of throwing", async () => {
    get.mockRejectedValue({ response: { status: 404 } });
    await expect(loadRecomendacion("doc-1")).resolves.toBeNull();
  });

  it("returns null when the endpoint does not exist yet", async () => {
    get.mockRejectedValue({ response: { status: 405 } });
    await expect(loadRecomendacion("doc-1")).resolves.toBeNull();
  });
});
```

- [ ] **Paso 2: Correr y ver fallar** — `pnpm test src/renderer/src/services/aymurai/recomendaciones.test.ts`. Esperado: FAIL, módulo inexistente.

- [ ] **Paso 3: Implementar** — crear `services/aymurai/recomendaciones.ts`:

```ts
import {
  dataExtractionResultSchema,
  recomendacionDocumentSchema,
  type RecomendacionDocument,
  type RecomendacionValidation,
} from "@/schema/recomendaciones";
import type { DataExtractionResult } from "@/types/recomendaciones";
import api from "../api";

const VALIDATION_PATH = "/llm/recomendaciones/validation/document";

export async function extractRecomendacion(
  documentId: string,
  paragraphs: string[],
  signal?: AbortSignal,
): Promise<DataExtractionResult> {
  const response = await api.post(
    "/llm/data-extraction",
    { document: { document_id: documentId, document: paragraphs } },
    { signal },
  );
  return dataExtractionResultSchema.parse(response.data);
}

/**
 * Recupera lo persistido para el documento.
 * Devuelve `null` para 404 y para cualquier error que indique que el endpoint
 * todavía no existe (404/405/501), de modo que el flujo degrade a extracción.
 */
export async function loadRecomendacion(
  documentId: string,
  signal?: AbortSignal,
): Promise<RecomendacionDocument | null> {
  try {
    const response = await api.get(`${VALIDATION_PATH}/${documentId}`, { signal });
    if (!response.data) return null;
    return recomendacionDocumentSchema.parse(response.data);
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404 || status === 405 || status === 501) return null;
    throw error;
  }
}

export async function saveRecomendacion(
  documentId: string,
  validation: RecomendacionValidation,
  signal?: AbortSignal,
): Promise<void> {
  await api.post(`${VALIDATION_PATH}/${documentId}`, validation, { signal });
}
```

- [ ] **Paso 4: Correr y ver pasar** — `pnpm test src/renderer/src/services/aymurai/recomendaciones.test.ts`. Esperado: 3 PASS.

- [ ] **Paso 5: Factories de React Query** — en `services/aymurai/queries.ts` agregar al final:

```ts
export const recomendacionValidationMutation = () =>
  mutationOptions({
    mutationFn: ({
      documentId,
      validation,
    }: { documentId: string; validation: RecomendacionValidation }) =>
      saveRecomendacion(documentId, validation),
  });
```

con los imports `import { saveRecomendacion } from "./recomendaciones";` y el tipo desde `@/schema/recomendaciones`.

- [ ] **Paso 6: Verificar** — `pnpm typecheck && pnpm knip`. `knip` puede marcar `recomendacionValidationMutation` como no usado hasta la Etapa 8; si el gate corta, dejar esta factory para la Etapa 8 y commitear sólo el cliente.

- [ ] **Paso 7: Commit**

```bash
git add src/renderer/src/services/aymurai/recomendaciones.ts \
        src/renderer/src/services/aymurai/recomendaciones.test.ts \
        src/renderer/src/services/aymurai/queries.ts
git commit -m "feat(recomendaciones): add data-extraction and validation API client"
```

---

### Etapa 4 — Estado del formulario (`useRecomendacionForm`)

**Archivos:**
- Crear: `src/renderer/src/hooks/useRecomendacionForm.ts`
- Crear: `src/renderer/src/hooks/useRecomendacionForm.test.ts`

**Interfaces producidas:**
```ts
normalizeExtraction(result: DataExtractionResult): { values: RecomendacionValues; candidates: RecomendacionState["candidates"] }
toValidationPayload(values: RecomendacionValues): RecomendacionValidation
useRecomendacionForm(initial: RecomendacionState): {
  values: RecomendacionValues;
  suggestions: RecomendacionSuggestions;
  candidates: RecomendacionState["candidates"];
  setField<K extends keyof RecomendacionValues>(key: K, value: RecomendacionValues[K]): void;
  setDestinatarioField<K extends keyof DestinatarioValue>(id: string, key: K, value: DestinatarioValue[K]): void;
  addDestinatario(): string;          // devuelve el id creado
  removeDestinatario(id: string): void;
  isPristine(key: string): boolean;   // valor === sugerencia
}
```

**Interfaces consumidas:** Etapa 2 (tipos + `TAXONOMY`).

- [ ] **Paso 1: Test que falla** — crear `hooks/useRecomendacionForm.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DataExtractionResult } from "@/types/recomendaciones";
import { normalizeExtraction, toValidationPayload, useRecomendacionForm } from "./useRecomendacionForm";

const RESULT: DataExtractionResult = {
  numero_recomendacion: "1440/22",
  fecha_recomendacion: null,
  destinatarios: [
    {
      nombre: "Ana Pérez", cargo: null, destinatario_principal: true, sector: "GCBA",
      candidatos_nombre: [{ nombre: "Ana Perez", cargo: "DG", sigla: "DG", depende_de_cargo: null, ruta_cargos: "A>DG", score: 0.9 }],
      candidatos_cargo: [],
    },
  ],
  tema: "AMBIENTE y CAMBIO CLIMÁTICO",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Resumen.",
};

const state = () => {
  const { values, candidates } = normalizeExtraction(RESULT);
  return { documentId: "d1", origin: "inference" as const, inference: RESULT, suggestions: values, values, candidates };
};

describe("normalizeExtraction", () => {
  it("maps nulls to empty strings and assigns stable destinatario ids", () => {
    const { values } = normalizeExtraction(RESULT);
    expect(values.fecha_recomendacion).toBe("");
    expect(values.destinatarios[0].cargo).toBe("");
    expect(values.destinatarios[0].id).toMatch(/[0-9a-f-]{36}/);
  });

  it("indexes candidates by destinatario id", () => {
    const { values, candidates } = normalizeExtraction(RESULT);
    expect(candidates[values.destinatarios[0].id].nombre).toHaveLength(1);
    expect(candidates[values.destinatarios[0].id].cargo).toEqual([]);
  });

  it("seeds one empty destinatario when the LLM returned none", () => {
    const { values } = normalizeExtraction({ ...RESULT, destinatarios: [] });
    expect(values.destinatarios).toHaveLength(1);
    expect(values.destinatarios[0].nombre).toBe("");
  });
});

describe("useRecomendacionForm", () => {
  it("clears subtema when tema changes to one that does not contain it", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    act(() => result.current.setField("tema", "COMUNICACIONES"));
    expect(result.current.values.subtema).toBe("");
  });

  it("keeps subtema when it is still valid under the new tema", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    act(() => result.current.setField("subtema", "Inundaciones"));
    act(() => result.current.setField("tema", "AMBIENTE y CAMBIO CLIMÁTICO"));
    expect(result.current.values.subtema).toBe("Inundaciones");
  });

  it("adds and removes destinatarios, keeping at least one", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    let created = "";
    act(() => { created = result.current.addDestinatario(); });
    expect(result.current.values.destinatarios).toHaveLength(2);
    act(() => result.current.removeDestinatario(created));
    expect(result.current.values.destinatarios).toHaveLength(1);
    act(() => result.current.removeDestinatario(result.current.values.destinatarios[0].id));
    expect(result.current.values.destinatarios).toHaveLength(1);
  });

  it("reports pristine fields against the frozen suggestions", () => {
    const { result } = renderHook(() => useRecomendacionForm(state()));
    expect(result.current.isPristine("numero_recomendacion")).toBe(true);
    act(() => result.current.setField("numero_recomendacion", "9/25"));
    expect(result.current.isPristine("numero_recomendacion")).toBe(false);
  });
});

describe("toValidationPayload", () => {
  it("strips local ids and candidate lists", () => {
    const { values } = normalizeExtraction(RESULT);
    const payload = toValidationPayload(values);
    expect(payload.destinatarios[0]).toEqual({
      nombre: "Ana Pérez", cargo: "", destinatario_principal: true, sector: "GCBA",
    });
  });
});
```

- [ ] **Paso 2: Correr y ver fallar** — `pnpm test src/renderer/src/hooks/useRecomendacionForm.test.ts`. Esperado: FAIL, módulo inexistente. Si `@testing-library/react` no está instalado, `pnpm add -D @testing-library/react` (los tests existentes de `use-active-turn.test.tsx` ya lo usan, así que debería estar).

- [ ] **Paso 3: Implementar** — crear `hooks/useRecomendacionForm.ts` con `useState<RecomendacionValues>` (no `useReducer`: hay pocas transiciones y todas son locales). Puntos no obvios:
  - `normalizeExtraction` genera los `id` con `crypto.randomUUID()` y arma `candidates` en el mismo recorrido.
  - `setField("tema", v)` aplica la regla de §3.5: `subtema` se limpia salvo que `TAXONOMY[v]?.includes(subtemaActual)`.
  - `removeDestinatario` es no-op si `values.destinatarios.length <= 1`.
  - `isPristine(key)` compara `values[key]` con `suggestions[key]`; para claves de destinatario usa el formato `"destinatario:<id>:<campo>"` y busca por `id` en ambos arrays (si el `id` no existe en `suggestions`, devuelve `false` — es un destinatario agregado a mano).
  - `suggestions` se guarda en un `useRef` inicializado una sola vez: nunca debe reaccionar a los cambios de `values`.

- [ ] **Paso 4: Correr y ver pasar** — `pnpm test src/renderer/src/hooks/useRecomendacionForm.test.ts`. Esperado: 8 PASS.

- [ ] **Paso 5: Commit**

```bash
git add src/renderer/src/hooks/useRecomendacionForm.ts src/renderer/src/hooks/useRecomendacionForm.test.ts
git commit -m "feat(recomendaciones): add controlled form state hook"
```

---

### Etapa 5 — Localizador de valores (exact + fuzzy)

**Archivos:**
- Crear: `src/renderer/src/utils/recomendaciones/locate-value.ts`
- Crear: `src/renderer/src/utils/recomendaciones/locate-value.test.ts`
- Modificar: `package.json` (dep `fastest-levenshtein`)

**Interfaces producidas:**
```ts
normalizeForMatch(text: string): { normalized: string; map: number[] }  // map[i] = índice original
locateValue(value: string, paragraphs: Paragraph[], options?: LocateOptions): LocatedRange[]
```

**Interfaces consumidas:** `Paragraph` de `@/types/file`.

- [ ] **Paso 1: Instalar la dependencia** — `pnpm add fastest-levenshtein` (≈1 KB, sin transitivas, MIT).

- [ ] **Paso 2: Test que falla** — crear `utils/recomendaciones/locate-value.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Paragraph } from "@/types/file";
import { locateValue, normalizeForMatch } from "./locate-value";

const p = (id: string, value: string): Paragraph => ({ id, value, document_id: "d" });

describe("normalizeForMatch", () => {
  it("lowercases, strips diacritics and collapses whitespace", () => {
    const { normalized } = normalizeForMatch("  Fiscalización   Urbana ");
    expect(normalized).toBe(" fiscalizacion urbana ");
  });

  it("maps normalized indices back to original ones", () => {
    const { normalized, map } = normalizeForMatch("Añó   X");
    const i = normalized.indexOf("x");
    expect("Añó   X".slice(map[i], map[i] + 1)).toBe("X");
  });
});

describe("locateValue", () => {
  const paragraphs = [
    p("d:0", "Buenos Aires, 30 de mayo de 2022."),
    p("d:1", "Se recomienda a la Directora General de Fiscalización Urbana."),
    p("d:2", "Resolución Nro 1440/22"),
  ];

  it("finds an exact match ignoring case and accents", () => {
    const [match] = locateValue("30 de Mayo de 2022", paragraphs);
    expect(match.exact).toBe(true);
    expect(match.paragraphId).toBe("d:0");
    expect(paragraphs[0].value.slice(match.start, match.end)).toBe("30 de mayo de 2022");
  });

  it("returns every exact occurrence, in document order", () => {
    const repeated = [p("d:0", "1440/22"), p("d:1", "ref. 1440/22 y 1440/22")];
    const matches = locateValue("1440/22", repeated);
    expect(matches).toHaveLength(3);
    expect(matches.map((m) => m.paragraphId)).toEqual(["d:0", "d:1", "d:1"]);
  });

  it("falls back to a single best fuzzy match above the threshold", () => {
    const matches = locateValue("Directora General de Fiscalizacion Urbanaa", paragraphs);
    expect(matches).toHaveLength(1);
    expect(matches[0].exact).toBe(false);
    expect(matches[0].score).toBeGreaterThanOrEqual(0.9);
    expect(matches[0].paragraphId).toBe("d:1");
  });

  it("returns nothing when no candidate reaches the threshold", () => {
    expect(locateValue("Ministerio de Salud de la Nación", paragraphs)).toEqual([]);
  });

  it("ignores values shorter than minLength", () => {
    expect(locateValue("22", paragraphs)).toEqual([]);
  });

  it("ignores empty and whitespace-only values", () => {
    expect(locateValue("   ", paragraphs)).toEqual([]);
  });
});
```

- [ ] **Paso 3: Correr y ver fallar** — `pnpm test src/renderer/src/utils/recomendaciones/locate-value.test.ts`. Esperado: FAIL, módulo inexistente.

- [ ] **Paso 4: Implementar** — crear `utils/recomendaciones/locate-value.ts` siguiendo el algoritmo de §5.2. Esqueleto:

```ts
import { distance } from "fastest-levenshtein";
import type { Paragraph } from "@/types/file";

export interface LocatedRange {
  paragraphId: string;
  start: number;
  end: number;
  score: number;
  exact: boolean;
}

export interface LocateOptions {
  threshold?: number;
  minLength?: number;
  maxMatches?: number;
}

export function normalizeForMatch(text: string): { normalized: string; map: number[] } {
  let normalized = "";
  const map: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < text.length; i++) {
    const raw = text[i];
    if (/\s/.test(raw)) {
      if (inWhitespace) continue;
      inWhitespace = true;
      normalized += " ";
      map.push(i);
      continue;
    }
    inWhitespace = false;
    // NFD + quitar marcas de combinación; un carácter puede normalizar a "" (p. ej. un acento suelto)
    const folded = raw.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
    for (const ch of folded) {
      normalized += ch;
      map.push(i);
    }
  }
  map.push(text.length); // centinela para poder resolver `end`
  return { normalized, map };
}

const similarity = (a: string, b: string) =>
  1 - distance(a, b) / Math.max(a.length, b.length);

export function locateValue(
  value: string,
  paragraphs: Paragraph[],
  { threshold = 0.9, minLength = 4, maxMatches = 3 }: LocateOptions = {},
): LocatedRange[] {
  const { normalized: needle } = normalizeForMatch(value);
  const trimmed = needle.trim();
  if (trimmed.length < minLength) return [];

  const len = trimmed.length;

  // Pasada 1 — exacto, sobre TODOS los párrafos.
  const exact: LocatedRange[] = [];
  for (const paragraph of paragraphs) {
    const { normalized, map } = normalizeForMatch(paragraph.value);
    let from = 0;
    for (;;) {
      const at = normalized.indexOf(trimmed, from);
      if (at === -1) break;
      exact.push({
        paragraphId: paragraph.id,
        start: map[at],
        end: map[at + len],
        score: 1,
        exact: true,
      });
      from = at + 1;
    }
  }
  if (exact.length > 0) return exact.slice(0, maxMatches);

  // Pasada 2 — fuzzy, sólo si no hubo NINGÚN exacto en todo el documento.
  let best: LocatedRange | null = null;
  const step = Math.max(1, Math.floor(len / 8));
  for (const paragraph of paragraphs) {
    const { normalized, map } = normalizeForMatch(paragraph.value);
    if (normalized.length < len * threshold) continue;
    for (let i = 0; i <= normalized.length - Math.ceil(len * threshold); i += step) {
      const end = Math.min(i + len, normalized.length);
      const score = similarity(trimmed, normalized.slice(i, end));
      // `>` y no `>=`: ante empate gana el primero, que es el de menor
      // (índice de párrafo, start) — determinismo exigido por §5.2 Paso 4.
      if (score >= threshold && (!best || score > best.score)) {
        best = { paragraphId: paragraph.id, start: map[i], end: map[end], score, exact: false };
      }
    }
  }
  return best ? [best] : [];
}
```

> **Nota de implementación (dos pasadas, no una).** Exacto y fuzzy son pasadas separadas sobre el documento completo, no ramas dentro de un mismo bucle. Con un solo bucle, un `continue` tras el primer párrafo con match exacto impediría encontrar las ocurrencias exactas de los párrafos siguientes — y el segundo test (`returns every exact occurrence, in document order`) lo detecta: espera **3** matches repartidos en 2 párrafos. La regla es global: si existe **algún** exacto en el documento, el fuzzy no corre en absoluto.

- [ ] **Paso 5: Correr y ver pasar** — `pnpm test src/renderer/src/utils/recomendaciones/locate-value.test.ts`. Esperado: 7 PASS. Ajustar el refinamiento de bordes si el tercer test devuelve un rango desplazado.

- [ ] **Paso 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/renderer/src/utils/recomendaciones/
git commit -m "feat(recomendaciones): add exact + fuzzy value locator"
```

---

### Etapa 6 — Anotaciones extra en el FileAnnotator

**Archivos:**
- Modificar: `src/renderer/src/components/file-annotator/types.ts`
- Modificar: `src/renderer/src/components/file-annotator/index.tsx`
- Crear: `src/renderer/src/components/file/extracted-annotation.tsx`
- Crear: `src/renderer/src/utils/recomendaciones/build-annotations.ts`
- Crear: `src/renderer/src/utils/recomendaciones/build-annotations.test.ts`

**Interfaces producidas:**
```ts
type ExtractedValueAnnotation      // ver §5.4
buildExtractedAnnotations(values: RecomendacionValues, paragraphs: Paragraph[]): Map<string, ExtractedValueAnnotation[]>
// FileAnnotator gana: extraAnnotations?: Map<string, ExtractedValueAnnotation[]>; activeField?: string | null
```

**Interfaces consumidas:** Etapa 4 (`RecomendacionValues`), Etapa 5 (`locateValue`).

- [ ] **Paso 1: Leer `generateSplits.ts`** y determinar si tolera rangos solapados. Anotar el hallazgo en el commit message. Si **no** los tolera, `buildExtractedAnnotations` debe deduplicar (ordenar por `start` asc, longitud desc, descartar solapados) — el test del Paso 2 lo cubre en ambos casos.

- [ ] **Paso 2: Test que falla** — crear `utils/recomendaciones/build-annotations.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Paragraph } from "@/types/file";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { buildExtractedAnnotations } from "./build-annotations";

const paragraphs: Paragraph[] = [
  { id: "d:0", document_id: "d", value: "Buenos Aires, 30 de mayo de 2022." },
  { id: "d:1", document_id: "d", value: "Se recomienda a Ana Pérez, Directora General." },
];

const values: RecomendacionValues = {
  numero_recomendacion: "",
  fecha_recomendacion: "30 de mayo de 2022",
  destinatarios: [
    { id: "x1", nombre: "Ana Pérez", cargo: "Directora General", destinatario_principal: true, sector: "GCBA" },
  ],
  tema: "AMBIENTE y CAMBIO CLIMÁTICO",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Un resumen que no está en el texto.",
};

describe("buildExtractedAnnotations", () => {
  it("annotates fecha, nombre and cargo, keyed by paragraph id", () => {
    const map = buildExtractedAnnotations(values, paragraphs);
    expect(map.get("d:0")?.map((a) => a.field)).toEqual(["fecha_recomendacion"]);
    expect(map.get("d:1")?.map((a) => a.field)).toEqual([
      "destinatario:x1:nombre",
      "destinatario:x1:cargo",
    ]);
  });

  it("never annotates tema, subtema, sector, datos_personales or contenido", () => {
    const fields = [...buildExtractedAnnotations(values, paragraphs).values()]
      .flat()
      .map((a) => a.field);
    expect(fields).not.toContain("tema");
    expect(fields).not.toContain("subtema");
    expect(fields).not.toContain("destinatario:x1:sector");
    expect(fields).not.toContain("contenido_para_publicar");
  });

  it("skips empty fields", () => {
    const fields = [...buildExtractedAnnotations(values, paragraphs).values()]
      .flat()
      .map((a) => a.field);
    expect(fields).not.toContain("numero_recomendacion");
  });

  it("returns non-overlapping ranges within a paragraph", () => {
    const overlapping = [{ id: "d:0", document_id: "d", value: "Directora General de Fiscalización" }];
    const annotations = buildExtractedAnnotations(
      { ...values, fecha_recomendacion: "", destinatarios: [
        { id: "x1", nombre: "Directora General", cargo: "Directora General de Fiscalización", destinatario_principal: true, sector: "" },
      ]},
      overlapping,
    ).get("d:0") ?? [];
    for (let i = 1; i < annotations.length; i++) {
      expect(annotations[i].start).toBeGreaterThanOrEqual(annotations[i - 1].end);
    }
  });
});
```

- [ ] **Paso 3: Correr y ver fallar** — `pnpm test src/renderer/src/utils/recomendaciones/build-annotations.test.ts`. Esperado: FAIL.

- [ ] **Paso 4: Implementar `build-annotations.ts`** — recorre los campos resaltables en el orden `numero_recomendacion`, `fecha_recomendacion`, y por cada destinatario `nombre` y luego `cargo`; llama a `locateValue`; convierte cada `LocatedRange` en `{ type: "extracted", paragraphId, start, end, field, variant: "value" }`; agrupa en un `Map`; dentro de cada párrafo ordena por `(start asc, longitud desc)` y descarta solapados.

- [ ] **Paso 5: Correr y ver pasar** — `pnpm test src/renderer/src/utils/recomendaciones/build-annotations.test.ts`. Esperado: 4 PASS.

- [ ] **Paso 6: Extender el tipo** — agregar `ExtractedValueAnnotation` (bloque de §5.4) a `file-annotator/types.ts` y sumarlo al union `Annotation`.

- [ ] **Paso 7: Renderizar** — crear `components/file/extracted-annotation.tsx`: un `<mark>` con `css()` de Panda, `data-extracted-field={annotation.field}`, fondo `bg.secondary-highlight` para `variant: "value"` y `bg.primary-highlight` para `"support"`, y un anillo `borders.primary-alt` cuando `isActive`. Agregar el `case "extracted"` en el `switch` de `Paragraph` dentro de `file-annotator/index.tsx`.

- [ ] **Paso 8: Cablear las props** — en `FileAnnotator`, agregar `extraAnnotations?: Map<string, ExtractedValueAnnotation[]>` y `activeField?: string | null`; pasarlas a `Paragraph`; dentro del `useMemo` de `annotations`, concatenar `extraAnnotations.get(paragraph.id) ?? []` marcando `isActive: a.field === activeField`. **Sin cambios de comportamiento cuando la prop no se pasa** — verificar que los tests existentes de anonimizador/dataset siguen verdes.

- [ ] **Paso 9: Regresión** — `pnpm test` completo. Esperado: todo verde (ver la nota del §9 sobre el entorno).

- [ ] **Paso 10: Commit**

```bash
git add src/renderer/src/components/file-annotator/ src/renderer/src/components/file/extracted-annotation.tsx \
        src/renderer/src/utils/recomendaciones/
git commit -m "feat(recomendaciones): render extracted-value highlights in FileAnnotator"
```

---

### Etapa 7 — Primitivas de UI faltantes

**Archivos:**
- Crear: `src/renderer/src/components/ui/textarea.tsx`
- Crear: `src/renderer/src/components/ui/radio-group.tsx`
- Modificar: `src/renderer/src/components/decision-tabs/index.tsx`

**Interfaces producidas:**
```ts
<Textarea label? value onChange suggestion? helper? error? rows? />   // firma alineada con TextFieldProps
<RadioGroup label name>{children}</RadioGroup>
// DecisionTabs gana: label?: string (default "Decisión"), onRemove?: (n: number) => void
```

- [ ] **Paso 1: `Textarea`** — Panda `cva()` replicando los visuales de `@aymurai/ui`'s TextField (label flotante, borde, estados `error`/`disabled`/`typed`) sobre un `<textarea rows={4}>`. Reutilizar el componente `Suggestion` de `@aymurai/ui` para la marca de sugerencia, mostrada **debajo** del textarea (no inline: no cabe). Agregar un TODO en el encabezado: `// TODO: subir un variant multiline a @aymurai/ui TextField y borrar este archivo.`

- [ ] **Paso 2: `RadioGroup`** — un `<fieldset>` Panda con `<legend>` (`textStyle="label.md.default"`) y `<HStack gap="4">` para los hijos. Envuelve `Radio` de `@aymurai/ui`. **No** replicar el `components/radio/radio-group` de Stitches.

- [ ] **Paso 3: Parametrizar `DecisionTabs`** — agregar `label = "Decisión"` y `onRemove?`. El texto de la tab pasa a `` `${label} ${dec + 1}` ``. Si `onRemove` está definido y hay más de una tab, renderizar una `X` dentro de la tab (`stopPropagation` en el click). Verificar que `FormGroup` sigue compilando sin cambios (default value).

- [ ] **Paso 4: Verificar** — `pnpm typecheck`. Levantar `pnpm dev` y entrar al Set de Datos: las solapas "Decisión N" se ven idénticas y sin botón de borrar.

- [ ] **Paso 5: Commit**

```bash
git add src/renderer/src/components/ui/textarea.tsx src/renderer/src/components/ui/radio-group.tsx \
        src/renderer/src/components/decision-tabs/index.tsx
git commit -m "feat(ui): add Panda Textarea + RadioGroup and parametrize DecisionTabs"
```

---

### Etapa 8 — Orquestación: procesamiento, recuperación y persistencia

**Depende de:** Etapas 2, 3, 4. **Degrada sin backend nuevo** (§4.4).

**Archivos:**
- Crear: `src/renderer/src/hooks/useDataExtraction.ts`
- Modificar: `src/renderer/src/types/file.ts` (campo `recomendacion?`)
- Modificar: `src/renderer/src/reducers/file/actions.ts` y `index.ts` (acción `SET_RECOMENDACION`)
- Crear: `src/renderer/src/reducers/file/recomendacion.test.ts`
- Crear: `src/renderer/src/components/recomendaciones/process.tsx`
- Modificar: `src/renderer/src/routes/app.$feature/{onboarding,preview,process,validation,finish}.tsx`
- Crear: `src/renderer/src/components/recomendaciones/{onboarding,preview}.tsx` (delegan al componente documental salvo por copy/extensiones)

**Interfaces producidas:**
```ts
setRecomendacion(fileName: string, state: RecomendacionState): SetRecomendacionAction
useDataExtraction(file: DocFile): { status: "idle" | "loading" | "ready" | "error"; error: Error | null; retry: () => void }
```

- [ ] **Paso 1: Test del reducer que falla** — crear `reducers/file/recomendacion.test.ts` siguiendo el estilo de `reducers/file/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import reducer from "./index";
import { setRecomendacion } from "./actions";
import type { DocFile } from "@/types/file";
import type { RecomendacionState } from "@/types/recomendaciones";

const file = (name: string): DocFile => ({
  data: new File(["x"], name), selected: true, validationObject: { DECISIONES: [{}] },
});

const state = { documentId: "d1", origin: "inference" } as unknown as RecomendacionState;

describe("SET_RECOMENDACION", () => {
  it("attaches the recomendacion state to the matching file", () => {
    const next = reducer([file("a.pdf"), file("b.pdf")], setRecomendacion("a.pdf", state));
    expect(next[0].recomendacion).toBe(state);
    expect(next[1].recomendacion).toBeUndefined();
  });

  it("replaces a previously attached state", () => {
    const once = reducer([file("a.pdf")], setRecomendacion("a.pdf", state));
    const twice = reducer(once, setRecomendacion("a.pdf", { ...state, origin: "validation" }));
    expect(twice[0].recomendacion?.origin).toBe("validation");
  });
});
```

- [ ] **Paso 2: Correr y ver fallar** — `pnpm test src/renderer/src/reducers/file/recomendacion.test.ts`. Esperado: FAIL.

- [ ] **Paso 3: Implementar el reducer** — agregar `recomendacion?: RecomendacionState` a `DocFile`; `ActionTypes.SET_RECOMENDACION`, el creador `setRecomendacion(fileName, recomendacion)`, el tipo `SetRecomendacionAction` en el union `Action`, y el `case` que hace `update(fileName, (cur) => ({ ...cur, recomendacion }))`.

- [ ] **Paso 4: Correr y ver pasar** — `pnpm test src/renderer/src/reducers/file/recomendacion.test.ts`. Esperado: 2 PASS.

- [ ] **Paso 5: `useDataExtraction`** — implementar la secuencia de §6 con `useQuery` + `useMutation`. Notas:
  - Guarda de idempotencia: si `file.recomendacion !== undefined`, no hace nada (mismo criterio que `useFileParse` usa con `file.paragraphs !== undefined`).
  - `queryKey: ["recomendacion", api.defaults.baseURL, documentId]`, `staleTime: Infinity`, `retry: false`.
  - La extracción es una `useMutation` disparada en un `useEffect` cuando el `GET` resolvió `null` — no un `useQuery` encadenado, para poder exponer `retry()`.
  - Al resolver, `dispatch(setRecomendacion(file.data.name, state))`.

- [ ] **Paso 6: `components/recomendaciones/process.tsx`** — copia reducida de `DocumentProcess`: `useFileParse([file])` + `useDataExtraction(file)`, `FileProcessing` con progreso indeterminado (`status`, sin `progress` numérico creíble → usar `0.5` mientras extrae, `1` al terminar), `Callout variant="error"` + botón "Reintentar" en error, `taskbar.notify()` al terminar, y el botón "Siguiente" deshabilitado mientras no esté `ready`.

- [ ] **Paso 7: Ramificar las rutas** — en `onboarding.tsx`, `preview.tsx`, `process.tsx`, `validation.tsx` y `finish.tsx`, agregar
  `if (feature === FeatureFlowEnum.Recomendaciones) return <RecomendacionesX />;`
  junto al `if` de VoiceToText. Para `onboarding` y `preview`, el componente de Recomendaciones puede ser un thin wrapper que reusa el documental (la única diferencia es el copy, que ya sale de `featureNamespace[feature]`); si al leerlos resulta que funcionan tal cual con el namespace nuevo, **no crear los wrappers** y dejar que caigan al default.

- [ ] **Paso 8: Verificar a mano** — `pnpm dev`, Recomendaciones → cargar un PDF → `process`. Con el backend LLM levantado debe aparecer el resultado en las devtools de React Query. Sin backend de persistencia, el `GET` devuelve `null` y se ejecuta la extracción; comprobarlo en la pestaña Network.

- [ ] **Paso 9: Commit**

```bash
git add src/renderer/src/hooks/useDataExtraction.ts src/renderer/src/types/file.ts \
        src/renderer/src/reducers/file/ src/renderer/src/components/recomendaciones/ \
        src/renderer/src/routes/app.\$feature/
git commit -m "feat(recomendaciones): wire extraction, retrieval and processing step"
```

---

### Etapa 9 — Pantalla de validación

**Depende de:** Etapas 4, 6, 7, 8.

**Archivos:**
- Crear: `src/renderer/src/components/recomendaciones/validation.tsx`
- Crear: `src/renderer/src/components/recomendaciones/recomendacion-form.tsx`
- Crear: `src/renderer/src/components/recomendaciones/destinatario-fields.tsx`
- Crear: `src/renderer/src/components/recomendaciones/organigram-picker.tsx`
- Crear: `src/renderer/src/components/recomendaciones/validation.test.tsx`
- Modificar: `src/renderer/src/constants/i18n/locales/es/recomendaciones.ts`

- [ ] **Paso 1: `organigram-picker.tsx`** — se renderiza sólo si `candidates.length > 0`:

```tsx
<Select
  label={t("validation.organigramCandidates")}
  options={candidates.map((c) => ({
    id: field === "nombre" ? c.nombre : c.cargo,
    text: field === "nombre" ? c.nombre : c.cargo,
    description: c.ruta_cargos,
  }))}
  value={undefined}
  clearable={false}
  size="sm"
  onChange={(option) => onPick(option.id)}
/>
```

Es un selector de **acción**, no de estado: escribe en el `TextField` de al lado y se queda vacío. `nombre` y `cargo` tienen cada uno el suyo, alimentados por `candidatos_nombre` y `candidatos_cargo` respectivamente — **nunca** enlazados (§1.4). El `score` no se muestra: su escala depende del backend de búsqueda. `ruta_cargos` va en `description`, que `SelectOption` ya soporta.

- [ ] **Paso 2: `destinatario-fields.tsx`** — para un `DestinatarioValue`:
  - `TextField` nombre (`suggestion` = sugerencia del mismo `id`, `onFocus` → `setActiveField("destinatario:<id>:nombre")`) + `OrganigramPicker field="nombre"`.
  - `TextField` cargo + `OrganigramPicker field="cargo"`.
  - `RadioGroup label={t("validation.principal")}` con dos `Radio` Sí/No, `name={`principal-${id}`}`.
  - `Select` sector con `SECTOR_OPTIONS` y `suggestion={{ id: sugerenciaSector }}`.

- [ ] **Paso 3: `recomendacion-form.tsx`** — usa `useRecomendacionForm`, renderiza en orden:
  `TextField numero_recomendacion` → `TextField fecha_recomendacion` → `DecisionTabs label="Destinatario"` + `DestinatarioFields` del seleccionado → `Select tema` (`TEMA_OPTIONS`) → `Select subtema` (`subtemaOptions(values.tema)`) → `RadioGroup datos_personales` → `Textarea contenido_para_publicar`.
  Expone hacia arriba `values` y `activeField` (lifting a `validation.tsx`).

- [ ] **Paso 4: `validation.tsx`** — `Grid` de dos columnas calcado de `validate-dataset/index.tsx` (mismas props de layout, incluido el comentario sobre `position: relative`), con:
  - Izquierda: `<FileAnnotator file={file} isAnnotable={false} extraAnnotations={annotations} activeField={activeField} />`, donde `annotations = useMemo(() => buildExtractedAnnotations(values, file.paragraphs ?? []), [values, file.paragraphs])`. **Debouncear 200 ms** los cambios de `values` antes de recalcular, para no correr el fuzzy en cada pulsación (`useDeferredValue` alcanza y evita una dep nueva).
  - Derecha: `SectionTitle` + `RecomendacionForm`.
  - `Callout` de origen según `origin` (`stored-inference` → info; `validation` → success), del §6.
  - Footer con "Validar documento": `await saveMutation.mutateAsync({ documentId, validation: toValidationPayload(values) })` en `try/catch` → `showToast(t("validation.saveFailed"), "warning")` en el catch, luego `dispatch(validate(file.data.name))` y navegar a `finish`. **La navegación nunca se bloquea por un fallo de guardado** (idéntico a `voice-to-text/validation.tsx`).

- [ ] **Paso 5: Test de la pantalla** — crear `validation.test.tsx` siguiendo el estilo de `routes/app.$feature/validation.test.tsx`. Casos mínimos:
  1. Renderiza un `TextField` por campo escalar y una tab por destinatario.
  2. Cambiar `tema` limpia el `Select` de `subtema`.
  3. Elegir un candidato de organigrama escribe el valor en el `TextField` de `nombre` y **no** toca `cargo`.
  4. "Validar documento" llama a la mutación con el payload sin `id` ni `candidatos_*`.
  5. Si la mutación rechaza, igual se navega a `finish`.

- [ ] **Paso 6: Correr** — `pnpm test src/renderer/src/components/recomendaciones/`. Esperado: 5 PASS.

- [ ] **Paso 7 (opcional): highlight de apoyo para `contenido_para_publicar`** — implementar el Jaccard de §5.3 como una **función separada**, `buildSupportAnnotations(contenido, paragraphs)`, en su propio archivo `utils/recomendaciones/build-support-annotations.ts`, con su test.

  **No** meterlo dentro de `buildExtractedAnnotations`: los tests de la Etapa 6 afirman explícitamente que esa función nunca emite el campo `contenido_para_publicar`, y fusionar las dos lógicas los rompería. `validation.tsx` compone los dos mapas antes de pasarlos a `FileAnnotator`:

```ts
const annotations = useMemo(() => {
  const base = buildExtractedAnnotations(deferredValues, paragraphs);
  if (!ENABLE_SUPPORT_HIGHLIGHTS) return base;
  return mergeAnnotationMaps(base, buildSupportAnnotations(deferredValues.contenido_para_publicar, paragraphs));
}, [deferredValues, paragraphs]);
```

  `ENABLE_SUPPORT_HIGHLIGHTS` vive junto a `buildSupportAnnotations`. Si en QA resulta ruidoso, poner la constante en `false` en vez de borrar código.

- [ ] **Paso 8: Commit**

```bash
git add src/renderer/src/components/recomendaciones/ src/renderer/src/constants/i18n/locales/es/recomendaciones.ts
git commit -m "feat(recomendaciones): add validation screen with document highlighting"
```

---

### Etapa 10 — Exportación a Excel

**Depende de:** Etapas 4, 9.

**Archivos:**
- Crear: `src/renderer/src/utils/recomendaciones/to-excel-rows.ts`
- Crear: `src/renderer/src/utils/recomendaciones/to-excel-rows.test.ts`
- Crear: `src/renderer/src/services/filesystem/excel/recomendaciones-sheet.ts`
- Crear: `src/renderer/src/utils/recomendaciones/submit-recomendacion.ts`
- Crear: `src/renderer/src/components/recomendaciones/finish.tsx`

**Interfaces producidas:**
```ts
RECOMENDACIONES_COLUMNS               // readonly string[], §7
RECOMENDACIONES_SHEET = "recomendaciones"
toExcelRow(input: {
  values: RecomendacionValues; documentId: string; fileName: string; validatedAt: string;
}): Record<string, string | number>   // UNA fila; no hay hoja de destinatarios
ensureRecomendacionesSheet(workbook: Workbook): Worksheet   // crea la hoja si falta, idempotente
submitRecomendacion(input): Promise<void>                   // upsert por DOCUMENT_ID
```

> **Alcance decidido (§9.3, §9.4):** una sola hoja `recomendaciones`, en el **mismo** `.xlsx` que el Set de Datos. No se crea un workbook aparte, no se toca el preload, y **no** existe la hoja `destinatarios`.

- [ ] **Paso 1: Test que falla** — crear `to-excel-rows.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { RECOMENDACIONES_COLUMNS, toExcelRow } from "./to-excel-rows";

const values: RecomendacionValues = {
  numero_recomendacion: "1440/22",
  fecha_recomendacion: "30 de mayo de 2022",
  destinatarios: [
    { id: "a", nombre: "Ana Pérez", cargo: "Directora General", destinatario_principal: true, sector: "GCBA" },
    { id: "b", nombre: "Juan Gómez", cargo: "Subsecretario", destinatario_principal: false, sector: "Empresa" },
  ],
  tema: "AMBIENTE y CAMBIO CLIMÁTICO",
  subtema: "Inundaciones",
  datos_personales: true,
  contenido_para_publicar: "Resumen.",
};

const input = { values, documentId: "d1", fileName: "rec.pdf", validatedAt: "2026-07-31" };

describe("toExcelRow", () => {
  it("promotes the first principal destinatario to its own columns", () => {
    const row = toExcelRow(input);
    expect(row.DESTINATARIO_PRINCIPAL_NOMBRE).toBe("Ana Pérez");
    expect(row.DESTINATARIO_PRINCIPAL_CARGO).toBe("Directora General");
    expect(row.DESTINATARIO_PRINCIPAL_SECTOR).toBe("GCBA");
  });

  it("flattens every destinatario into one pipe-separated column", () => {
    expect(toExcelRow(input).DESTINATARIOS).toBe(
      "Ana Pérez — Directora General (GCBA) [principal] | Juan Gómez — Subsecretario (Empresa)",
    );
  });

  it("renders booleans as si/no and counts destinatarios", () => {
    expect(toExcelRow(input).DATOS_PERSONALES).toBe("si");
    expect(toExcelRow(input).CANTIDAD_DESTINATARIOS).toBe(2);
  });

  it("carries the identity columns", () => {
    expect(toExcelRow(input)).toMatchObject({
      DOCUMENT_ID: "d1",
      DOCUMENTO: "rec.pdf",
      FECHA_VALIDACION: "2026-07-31",
    });
  });

  it("leaves the principal columns empty when there is no principal", () => {
    const none = { ...input, values: { ...values, destinatarios: values.destinatarios.map((d) => ({ ...d, destinatario_principal: false })) } };
    expect(toExcelRow(none).DESTINATARIO_PRINCIPAL_NOMBRE).toBe("");
    expect(toExcelRow(none).DESTINATARIOS).toBe(
      "Ana Pérez — Directora General (GCBA) | Juan Gómez — Subsecretario (Empresa)",
    );
  });

  it("emits exactly one key per declared column", () => {
    expect(Object.keys(toExcelRow(input)).sort()).toEqual([...RECOMENDACIONES_COLUMNS].sort());
  });
});
```

- [ ] **Paso 2: Correr y ver fallar** — `pnpm test src/renderer/src/utils/recomendaciones/to-excel-rows.test.ts`. Esperado: FAIL, módulo inexistente.

- [ ] **Paso 3: Implementar** — `to-excel-rows.ts` exportando `RECOMENDACIONES_COLUMNS` (el array de §7, **sin** `DESTINATARIOS_COLUMNS`) y `toExcelRow`, que devuelve **un solo objeto fila** con exactamente una clave por columna declarada.

- [ ] **Paso 4: Correr y ver pasar** — 6 PASS.

- [ ] **Paso 5: La hoja** — crear `services/filesystem/excel/recomendaciones-sheet.ts`:

```ts
import type { Workbook, Worksheet } from "exceljs";
import { RECOMENDACIONES_COLUMNS } from "@/utils/recomendaciones/to-excel-rows";

export const RECOMENDACIONES_SHEET = "recomendaciones";

/**
 * Devuelve la hoja de recomendaciones del workbook compartido, creándola con
 * su header si todavía no existe. Idempotente: llamarla sobre un workbook que
 * ya la tiene no la reescribe ni duplica columnas.
 */
export function ensureRecomendacionesSheet(workbook: Workbook): Worksheet {
  const existing = workbook.getWorksheet(RECOMENDACIONES_SHEET);
  if (existing) return existing;

  const worksheet = workbook.addWorksheet(RECOMENDACIONES_SHEET, {
    properties: { tabColor: { argb: "FFE0B2" } },
  });
  worksheet.columns = RECOMENDACIONES_COLUMNS.map((label) => ({
    header: label,
    key: label,
  }));
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0B2" } };
  });
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  return worksheet;
}
```

Es un **añadido** al workbook compartido: `excel/create.ts` y su hoja `set_de_datos` no se tocan.

- [ ] **Paso 6: Test de la hoja** — crear `services/filesystem/excel/recomendaciones-sheet.test.ts`:

```ts
import { Workbook } from "exceljs";
import { describe, expect, it } from "vitest";
import { RECOMENDACIONES_COLUMNS } from "@/utils/recomendaciones/to-excel-rows";
import { RECOMENDACIONES_SHEET, ensureRecomendacionesSheet } from "./recomendaciones-sheet";

describe("ensureRecomendacionesSheet", () => {
  it("creates the sheet with the declared header on a bare workbook", () => {
    const sheet = ensureRecomendacionesSheet(new Workbook());
    expect(sheet.name).toBe(RECOMENDACIONES_SHEET);
    expect(sheet.columns.map((c) => c.key)).toEqual([...RECOMENDACIONES_COLUMNS]);
  });

  it("is idempotent and preserves existing rows", () => {
    const workbook = new Workbook();
    ensureRecomendacionesSheet(workbook).addRow({ DOCUMENT_ID: "d1" });
    const again = ensureRecomendacionesSheet(workbook);
    expect(workbook.worksheets.filter((w) => w.name === RECOMENDACIONES_SHEET)).toHaveLength(1);
    expect(again.getRow(2).getCell("DOCUMENT_ID").value).toBe("d1");
  });

  it("coexists with the set_de_datos sheet in the same workbook", () => {
    const workbook = new Workbook();
    workbook.addWorksheet("set_de_datos");
    ensureRecomendacionesSheet(workbook);
    expect(workbook.worksheets.map((w) => w.name)).toEqual(["set_de_datos", RECOMENDACIONES_SHEET]);
  });
});
```

Correr: `pnpm test src/renderer/src/services/filesystem/excel/recomendaciones-sheet.test.ts`. Esperado: 3 PASS.

- [ ] **Paso 7: Writer con upsert** — `utils/recomendaciones/submit-recomendacion.ts`:
  1. `const workbook = (await filesystem.excel.read()) ?? filesystem.excel.create();`
  2. `const sheet = ensureRecomendacionesSheet(workbook);`
  3. Buscar con `sheet.eachRow` (saltando la fila 1) una fila cuyo `DOCUMENT_ID` sea igual al del input.
  4. Si existe → asignar cada columna de `toExcelRow(input)` sobre esa fila y `row.commit()`. Si no → `sheet.addRow(toExcelRow(input))`.
  5. `await filesystem.excel.write(workbook);`

  Escribir su test con un `vi.mock("@/services/filesystem")` que devuelva un `Workbook` en memoria, cubriendo: (a) inserta cuando el `DOCUMENT_ID` es nuevo; (b) **reemplaza en vez de duplicar** cuando ya existe; (c) crea la hoja si el workbook venía sólo con `set_de_datos`.

- [ ] **Paso 8: `finish.tsx`** — copia de `finish-dataset.tsx` que en el `useEffect` inicial llama a `submitRecomendacion` por archivo, muestra `FileCheck` y ofrece "Ver resultado" → `filesystem.excel.open`. Ramificar `routes/app.$feature/finish.tsx` hacia este componente.

- [ ] **Paso 9: Verificar de punta a punta** — `pnpm dev`: cargar una recomendación, validarla, terminar, abrir el `.xlsx` y comprobar que están **las dos hojas** (`set_de_datos` intacta y `recomendaciones` con la fila nueva). Repetir con **el mismo archivo** y confirmar que la fila se reemplaza en vez de duplicarse.

- [ ] **Paso 10: Commit**

```bash
git add src/renderer/src/utils/recomendaciones/ src/renderer/src/services/filesystem/excel/ \
        src/renderer/src/components/recomendaciones/finish.tsx src/renderer/src/routes/app.\$feature/finish.tsx
git commit -m "feat(recomendaciones): export the validated base to Excel"
```

---

### Etapa 11 — Cierre

- [ ] **Paso 1:** `pnpm test` completo, `pnpm typecheck`, `pnpm knip`, `pnpm lint`. Los tres primeros son gates de pre-push.
- [ ] **Paso 2:** Recorrida manual de los cinco pasos del flujo con un PDF real de recomendación.
- [ ] **Paso 3:** Redactar el issue de backend con el contrato del §4.2 verbatim (endpoints, shapes, modelo SQLModel) y lincarlo desde este plan.
- [ ] **Paso 4:** PR contra `develop`.

---

## 9. Riesgos y decisiones abiertas

**Resueltas leyendo el código — no volver a discutirlas:**

| Pregunta | Resolución | Evidencia |
|---|---|---|
| ¿Dónde va el fuzzy matching? | Frontend, `utils/recomendaciones/locate-value.ts` | El sistema de highlights consume offsets sobre párrafos construidos en el cliente (`useFileParse`), y hay que recalcular en vivo mientras se edita (§5.1) |
| ¿Cómo se identifica una Recomendación? | `document_id` = UUID5 de los bytes del archivo, ya devuelto por `/misc/document-extract` | `misc/document_extract.py:157` (`data_to_uuid(data)`) |
| ¿Cómo se distingue inferencia de validación? | Dos columnas separadas, `prediction` y `validation`, como en `datapublic_document` | `aymurai/database/meta/datapublic/document.py` |
| ¿Qué forma tienen los endpoints de persistencia? | `GET/POST /…/validation/document/{document_id}` | Ya existe idéntico en `datapublic/datapublic.py:124,146` y `asr/transcribe.py:390,416` |
| ¿Se reutiliza `useForm`? | No: es no controlado y está acoplado a `LabelType`/`LabelDecisiones`, y `@aymurai/ui` TextField exige `value` | `hooks/useForm/index.ts:23` |
| ¿Se reutiliza `Suggester`? | No: reduce `PredictLabel[]`, que no existe en este flujo | `utils/predictions/suggestions/index.ts` |
| ¿Hay multiline en `@aymurai/ui`? | No (`type?: "text" \| "number"`) → `components/ui/textarea.tsx` local | `ui-components/src/components/text-field/TextField.tsx:186` |
| ¿Hay `RadioGroup` en `@aymurai/ui`? | No, sólo `Radio` → wrapper Panda local | `ui-components/src/components/radio/index.ts` |
| ¿El endpoint recibe el PDF? | No, recibe el `Document` ya extraído | `data_extraction/schemas.py` |

**Resueltas por el usuario el 2026-08-02 — decisiones firmes, no reabrir:**

1. **Drift de la taxonomía tema→subtema.** **RESUELTO: post-MVP.** El MVP lee la taxonomía de un archivo local (`constants/recomendaciones/taxonomy.ts`). Poder actualizar taxonomía y organigrama desde el frontend está contemplado, pero requiere decisiones de diseño (back y front) que todavía no están tomadas y no son críticas para el MVP. La mitigación de §3.5 (conservar el valor fuera de taxonomía como opción extra con `error`) **sí** se implementa.

2. **Persistencia de los candidatos de organigrama.** **RESUELTO: se persisten.** El backend guarda el `DataExtractionResult` completo en `prediction`, incluidos `candidatos_nombre` y `candidatos_cargo`, de modo que estén disponibles al reabrir un documento validado. **Es un requisito explícito del issue de backend** (§4.2). El frontend ya lee `candidates` desde `prediction` (§6).

3. **Representación de múltiples destinatarios en Excel.** **RESUELTO: sólo la hoja `recomendaciones`.** La hoja relacional `destinatarios` queda fuera del MVP: es útil para análisis pero no crítica. Una fila por recomendación, destinatarios aplanados en la columna `DESTINATARIOS` (§7).

4. **Archivo Excel compartido o separado.** **RESUELTO: un único `.xlsx` compartido.** Simplifica la implementación y evita tocar el preload. Recomendaciones vive como una worksheet más del workbook que ya usa el Set de Datos (§7, Etapa 10). Archivos separados quedan como opción futura si hiciera falta.

5. **Cambios entre inferencia y validación posterior.** **RESUELTO: sin auditoría.** El MVP no necesita historial detallado; el `POST` es un upsert y alcanza con `updated_at`.

6. **Umbral 0.9 y campos largos.** **RESUELTO: se recalibra en QA.** Se arranca en 0.9 y se evalúa la tasa de highlights con documentos reales antes de tocarlo. No cambiar el umbral durante la implementación.

7. **Entorno de tests.** **RESUELTO el 2026-08-02.** Se hizo cherry-pick de `d65434b` (PR #92, `fix/pnpm-v11-allowbuilds`) sobre la rama de trabajo y `pnpm install` desde cero. Baseline verificado en el worktree: `pnpm test` → 44 archivos / 223 tests en verde; `pnpm typecheck` → limpio. El problema de dual-React del symlink de `@aymurai/ui` ya no aplica.

**Abiertas — ninguna. Todas las decisiones de §9 están tomadas.**
