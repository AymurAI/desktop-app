# Backend contract: persistencia de Recomendaciones

> Issue para el equipo de backend. Copiar/pegar tal cual en GitHub. No requiere
> haber leído la rama de frontend `feat/recomendaciones-defensoria`; todo lo
> necesario está en este documento.

## 1. Resumen

El frontend (Electron) tiene un cuarto flujo, *Recomendaciones*, que sube un
PDF de una Recomendación de la Defensoría del Pueblo de CABA, lo manda a
`POST /misc/document-extract` (ya existe) y después a `POST /llm/data-extraction`
(ya existe) para obtener un `DataExtractionResult` estructurado. El usuario
valida/corrige ese resultado a mano en pantalla, contra el texto original
resaltado, y al confirmar exporta la base acumulada a un `.xlsx` local.

Lo que **no existe todavía** es persistencia server-side de esa validación.
El frontend ya está integrado contra el contrato que describe este documento
(`GET`/`POST /llm/recomendaciones/validation/document/{document_id}`), pero
como el backend no lo expone aún, el cliente **degrada de forma silenciosa**:
`loadRecomendacion()` devuelve `null` para 404, 405, 501 y para cualquier
error de red, y el flujo simplemente vuelve a correr `POST /llm/data-extraction`
desde cero. Es decir: **hoy nada se rompe por la ausencia de estos endpoints**,
el usuario sólo pierde la ventaja de no tener que re-extraer y de retomar una
validación previa. Este issue es para cerrar esa brecha.

## 2. Endpoints requeridos

Mismo patrón exacto que ya existe para `datapublic` y `asr`
(`GET`/`POST /validation/document/{document_id}`), montado bajo el prefijo
`/llm` que ya usa `data-extraction`. Los paths están tomados **literal** del
cliente HTTP del frontend
(`src/renderer/src/services/aymurai/recomendaciones.ts`, línea 12:
`const VALIDATION_PATH = "/llm/recomendaciones/validation/document"`), no del
plan de diseño original, por si divergieron durante la implementación.

```
GET  /llm/recomendaciones/validation/document/{document_id}
POST /llm/recomendaciones/validation/document/{document_id}
```

### 2.1 `GET /llm/recomendaciones/validation/document/{document_id}`

`document_id` es un UUID5 (path param).

**200** — documento conocido (procesado y/o validado):

```jsonc
{
  "document_id": "5d41402a-bc4b-2a76-b971-9d911017c592",
  "prediction": {
    "numero_recomendacion": "1440/22",
    "fecha_recomendacion": "30 de Mayo de 2022",
    "destinatarios": [
      {
        "nombre": "Valeria Romina Focaraccio",
        "cargo": "Directora General de Fiscalización Urbana",
        "destinatario_principal": true,
        "sector": "GCBA",
        "candidatos_nombre": [
          {
            "nombre": "Valeria R. Focaraccio",
            "cargo": "Directora General de Fiscalización Urbana",
            "sigla": "DGFU",
            "depende_de_cargo": null,
            "ruta_cargos": "MEPHU > SSMU > DGFU",
            "score": 0.91
          }
        ],
        "candidatos_cargo": []
      }
    ],
    "tema": "DERECHOS URBANOS, ESPACIO PÚBLICO Y CONTROL COMUNAL",
    "subtema": "Cartelería y publicidad en vía pública",
    "datos_personales": true,
    "contenido_para_publicar": "Se recomienda el retiro de estructuras publicitarias."
  },
  "validation": null,
  "updated_at": "2026-08-01T14:32:00Z"
}
```

`prediction` and/or `validation` may independently be `null` (see the three
states in §3). Both are optional-with-default on the client (see §3), so a
response missing either key does not break the frontend, but `document_id`
must always be present.

**404** — documento nunca procesado. The frontend treats any `GET` error other
than a request cancellation the same way — it falls back to a fresh
extraction — but 404 is the only status it does **not** log a warning for
(§5); everything else (500, network error, etc.) is treated as "something
went wrong reading storage" and is logged loudly. Please return a real 404,
not a 200 with nulls, when the document has never been processed.

### 2.2 `POST /llm/recomendaciones/validation/document/{document_id}`

Request body — `RecomendacionValidation` (see §3 for the exact zod-validated
shape; it is `DataExtractionResult` minus the two `candidatos_*` arrays per
destinatario):

```jsonc
{
  "numero_recomendacion": "1440/22",
  "fecha_recomendacion": "30 de Mayo de 2022",
  "destinatarios": [
    {
      "nombre": "Valeria Romina Focaraccio",
      "cargo": "Directora General de Fiscalización Urbana",
      "destinatario_principal": true,
      "sector": "GCBA"
    }
  ],
  "tema": "DERECHOS URBANOS, ESPACIO PÚBLICO Y CONTROL COMUNAL",
  "subtema": "Cartelería y publicidad en vía pública",
  "datos_personales": true,
  "contenido_para_publicar": "Se recomienda el retiro de estructuras publicitarias."
}
```

Response: `204 No Content` (the client, `saveRecomendacion()` in
`services/aymurai/recomendaciones.ts`, ignores the response body).

This is an **upsert**: if no row exists yet for `document_id`, create one; if
one exists, overwrite `validation` and bump `updated_at`. No versioning, no
history (§4.f).

## 3. Modelo de datos

Mirror the existing `DataPublicDocumentBase` pattern
(`aymurai/database/meta/datapublic/document.py`), which stores `prediction`
and `validation` as JSON columns keyed by the document's primary key:

```python
class RecomendacionDocumentBase(SQLModel):
    prediction: DataExtractionResult | None = Field(None, sa_column=Column(JSON))
    validation: RecomendacionValidation | None = Field(None, sa_column=Column(JSON))


class RecomendacionDocument(RecomendacionDocumentBase, table=True):
    __tablename__ = "recomendacion_document"
    id: uuid.UUID | None = Field(None, primary_key=True)  # = document_id, the UUID5
    created_at: datetime = Field(
        sa_column_kwargs={"server_default": text("CURRENT_TIMESTAMP")}
    )
    updated_at: datetime | None = Field(
        sa_column=Column(DateTime(), onupdate=func.now())
    )
```

`DataExtractionResult` and `OrganigramCandidate` already exist as pydantic
models — see `git show 013e86ea:aymurai/api/endpoints/routers/llm/data_extraction/schemas.py`
(that commit is not on `main` yet; the endpoint itself is assumed to already
exist wherever this issue is implemented). `RecomendacionValidation` is a new
pydantic model: same shape as `DataExtractionResult`, but each
`destinatario` entry omits `candidatos_nombre`/`candidatos_cargo` (those are
inference scaffolding, not user-validated data — see the zod mirror in §3
below).

**Important divergence from the datapublic/asr precedent's response shape:**
`datapublic_read_document_validation` (`datapublic.py:124`) returns only the
bare `validation` annotations object (or 200/`null`), and `asr_read_document_validation`
returns a reshaped `ASRDocument`. Neither returns `{document_id, prediction,
validation, updated_at}` as one envelope. The frontend's zod schema
(`schema/recomendaciones.ts`, `recomendacionDocumentSchema`) requires exactly
that envelope on `GET`:

```ts
export const recomendacionDocumentSchema = z.object({
  document_id: z.string(),
  prediction: dataExtractionResultSchema.nullable().default(null),
  validation: recomendacionValidationSchema.nullable().default(null),
  updated_at: z.string().nullable().default(null),
});
```

So: reuse the *table* pattern and the *path* pattern verbatim from
`datapublic`/`asr`, but the `GET` response body must be the full envelope
above, not the bare annotations object the two precedents return. This is a
case where the plan's "copia literal" note (§4.2 of the design plan) was
right about the path/table shape but the actual response envelope had to be
widened — the zod schema is the up-to-date source of truth.

### Los tres estados que distingue el frontend

The client (`useDataExtraction`, described in the design plan §6) branches on
this response to decide what the user sees, purely by column, never by
heuristics on content:

| Condición | Significado | Qué hace el frontend |
|---|---|---|
| `GET` → `404` | Documento nunca procesado | Llama `POST /llm/data-extraction`, muestra progreso de extracción, arranca desde inferencia fresca |
| `GET` → 200, `validation == null && prediction != null` | Procesado pero no validado a mano | No vuelve a llamar al LLM; carga el formulario desde `prediction`; muestra un `Callout` informativo ("se recuperó una extracción previa") |
| `GET` → 200, `validation != null` | Validado manualmente | No vuelve a llamar al LLM; los campos del formulario muestran `validation`; las "suggestions" (lo que se resalta como "esto sugirió el modelo") siguen mostrando `prediction`, para poder ver qué corrigió el humano; muestra un `Callout` de éxito con la fecha de validación |

## 4. Requisitos duros descubiertos durante la implementación del frontend

### a. `document_id` es el UUID5 que ya devuelve `/misc/document-extract`

No inventar un id nuevo. Es `data_to_uuid(data)` sobre los bytes crudos del
archivo (`aymurai/database/utils.py:5`, `blake2b` seguido de `uuid5` sobre el
hexdigest), ya expuesto por `/misc/document-extract` como `document_id`. El
frontend lo obtiene una sola vez de ahí y lo reusa para `GET`, `POST
/llm/data-extraction` y `POST` de validación. Es estable byte-a-byte del PDF;
una re-exportación del mismo documento produce un id distinto — limitación
aceptada para el MVP (§9 del plan de diseño), no algo que este issue deba
resolver.

### b. `prediction` DEBE guardar el `DataExtractionResult` completo, incluidos `candidatos_nombre` y `candidatos_cargo` por cada destinatario

Esta es una decisión explícita del usuario del producto (§9, punto 2 del plan
de diseño), no una preferencia técnica. El frontend recupera los selectores
de organigrama ("¿es esta persona del organigrama?") a partir de `prediction`
al reabrir un documento ya validado. Si el backend descarta o trunca
`candidatos_nombre`/`candidatos_cargo` antes de guardar, esos desplegables
desaparecen silenciosamente al reabrir — sin error visible — y el usuario
queda escribiendo nombre y cargo a mano, como texto libre, perdiendo la ayuda
que tuvo en la primera pasada. Guardar el objeto tal cual lo devolvió
`/llm/data-extraction`, sin recortar campos.

### c. El payload de `validation` DEBE poder ir y volver con un identificador estable por destinatario

**Esto es lo más importante de este contrato.** Hoy el frontend re-empareja
cada `validation.destinatarios[i]` almacenado con `prediction.destinatarios[i]`
**por posición** (mismo índice de array). Eso se rompe en cuanto el usuario
borra un destinatario antes de guardar: los índices se corren, y al reabrir:

- la marca de "esto lo sugirió el modelo, esto lo corrigió el humano" compara
  el destinatario equivocado contra otro,
- el resaltado en el documento (`FileAnnotator`) le atribuye a un destinatario
  el texto de otro,
- los candidatos de organigrama que se ofrecen para "editar" un destinatario
  salen del `prediction[i]` incorrecto.

Este bug **es latente hoy** (no se manifiesta porque no hay persistencia real
todavía) y **se activa el día que este contrato se implemente**. Pedimos al
backend una de estas dos soluciones, documentada explícitamente en la
respuesta de la API:

1. Persistir y devolver un `id` estable por destinatario dentro de
   `prediction.destinatarios[]` y `validation.destinatarios[]` (el frontend
   ya genera un `id` local con `crypto.randomUUID()` por destinatario en
   `RecomendacionValues`/`DestinatarioValue` — ver `types/recomendaciones.ts`
   — y podría enviarlo si el backend lo acepta y lo devuelve intacto), **o**
2. Documentar una regla de emparejamiento por contenido (p. ej. por
   `nombre`+`cargo` normalizados) que el backend garantice estable, para que
   el frontend deje de depender del orden del array.

La opción (1) es la más simple de implementar y verificar; se prefiere salvo
que haya una razón de esquema para no aceptar un campo `id` en el payload.

### d. `datos_personales` es `boolean | null`, nunca coaccionado a `false`

`null` significa "el humano/el modelo no contestó esto", y es distinto de un
`false` explícito ("no, no tiene datos personales"). El zod schema del
frontend lo modela así explícitamente:

```ts
// `null` means "unanswered" and must stay distinguishable from an explicit
// "No" all the way to the exported .xlsx (see `formatDatosPersonales`).
datos_personales: z.boolean().nullable().default(null),
```

(`schema/recomendaciones.ts:29`). El frontend exporta una celda vacía a Excel
cuando es `null` y no marca ningún radio button como seleccionado. Si el
backend coacciona un `null` entrante a `false` (por ejemplo, por una columna
`NOT NULL` con default `false`), se pierde esa distinción de forma
silenciosa e irreversible. La columna debe ser nullable de punta a punta.

Nota: el modelo pydantic actual de `data_extraction/schemas.py` (commit
`013e86ea`) tiene `datos_personales: bool` **no-nullable**. El schema zod del
frontend ya lo modela como nullable (probablemente adelantándose a un ajuste
pendiente en el backend, o para tolerar valores `null` que el LLM ya
devuelve en la práctica pese al tipo declarado). Si el pydantic model de
`DataExtractionResult`/`RecomendacionValidation` sigue siendo `bool` estricto
en el momento de implementar este issue, por favor relajarlo a `bool | None`
para que coincida con lo que el cliente realmente espera y persiste.

### e. Campos que el frontend tolera ausentes (trae sus propios defaults)

El zod schema (`schema/recomendaciones.ts`) tiene un `.default(...)` para
casi todo. Si el backend omite alguno de estos campos en la respuesta, **no**
rompe al cliente:

| Campo | Default del cliente si falta |
|---|---|
| `numero_recomendacion` | `null` |
| `fecha_recomendacion` | `null` |
| `destinatarios` | `[]` |
| `destinatarios[].nombre` | `null` |
| `destinatarios[].cargo` | `null` |
| `destinatarios[].destinatario_principal` | `false` |
| `destinatarios[].sector` | `null` |
| `destinatarios[].candidatos_nombre` | `[]` |
| `destinatarios[].candidatos_cargo` | `[]` |
| `candidatos_*[].sigla` | `""` |
| `candidatos_*[].depende_de_cargo` | `null` |
| `datos_personales` | `null` |
| `contenido_para_publicar` | `""` |
| `prediction` (en el documento completo) | `null` |
| `validation` (en el documento completo) | `null` |
| `updated_at` | `null` |

Campos **sin** default, es decir obligatorios si el objeto está presente:
`document_id` (a nivel documento), y dentro de cada `OrganigramCandidate`:
`nombre`, `cargo`, `ruta_cargos`, `score` (todos `z.string()`/`z.number()`
sin `.default(...)`). Si esos faltan, el `parse()` de zod tira y el cliente
lo trata como un error de `GET` genérico (fallback a re-extracción, con
`console.warn`).

### f. `POST` es un upsert sin versionado

Decisión de producto explícita (§9, punto 5 del plan de diseño): el MVP no
necesita historial ni auditoría. Basta con:

- `POST` sobrescribe `validation` completo (no hace merge parcial).
- `updated_at` se actualiza automáticamente en cada `POST` (server-side,
  vía `onupdate` en la columna, como ya hace `DataPublicDocument`).
- No se requiere tabla de historial, ni soft-versioning, ni endpoint de
  "versiones anteriores".

## 5. Riesgo conocido que el usuario del producto debe sopesar

Esto **no** es un pedido de cambio al backend — es una decisión de producto
para que quede documentada, porque interactúa con lo que este issue va a
habilitar.

Sin auditoría (§4.f) y con `loadRecomendacion()` fallando *open* a `null` ante
cualquier error que no sea 404 (`services/aymurai/recomendaciones.ts:52-84`),
una falla transitoria del `GET` **después** de que este contrato esté en
producción hará que el frontend crea que el documento nunca fue procesado, lo
vuelva a mandar a `/llm/data-extraction`, y el usuario termine sobre-escribiendo
una validación humana ya guardada con una inferencia fresca del LLM — sin que
quede rastro de qué pasó. La única mitigación hoy es un `console.warn` en la
consola de Electron (no visible para el usuario final):

```ts
// Anything else means we may be discarding a STORED HUMAN VALIDATION and
// re-running the LLM with no trace — the flow has no audit trail and no
// user-visible signal, so a console warning is the minimum diagnostic.
```

Arreglarlo de verdad requiere una de estas dos cosas, y **no está decidido
cuál** — queda para que el dueño de producto lo resuelva, no para este issue:

1. Una señal visible para el usuario en el frontend cuando el `GET` falla de
   forma distinta a un 404 limpio (en vez de degradar en silencio), o
2. Historial/versionado en el backend, para poder recuperar una validación
   pisada por error (lo cual reabriría la decisión de §4.f / §9.5).

## 6. Nice to have, no requerido para el MVP

- **`GET /llm/data-extraction/taxonomy`** → `{ "TEMA": ["subtema", ...], ... }`.
  Hoy la taxonomía tema→subtema vive hardcodeada en el frontend
  (`constants/recomendaciones/taxonomy.ts`), portada a mano desde
  `resources/llm/defensoria_extractor.yml` del backend (commit `013e86ea`).
  Es un fork de datos que puede desincronizarse si el backend cambia la
  taxonomía. Explícitamente diferido post-MVP (§9, punto 1 del plan de
  diseño) porque requiere decisiones de diseño (¿quién la edita? ¿desde
  dónde?) que todavía no están tomadas.
- **`GET /llm/recomendaciones/export?format=xlsx`**, análogo al
  `database_export`/`/export` que `datapublic` ya expone (`pandas.to_csv`
  sobre un `select(...)`). El MVP exporta un `.xlsx` local desde el
  frontend (reutilizando `services/filesystem/excel/`), que vive y muere en
  la máquina del operador. Cuando la base deba sobrevivir a un cambio de
  máquina o consolidar validaciones de varios operadores, la exportación
  debería moverse al backend con esta forma.

## 7. Frontend touchpoints

Para que quien implemente esto en el backend sepa a quién preguntar o contra
qué correr pruebas de integración:

- `src/renderer/src/services/aymurai/recomendaciones.ts` — los tres clientes
  HTTP: `extractRecomendacion` (`POST /llm/data-extraction`, ya existe),
  `loadRecomendacion` (`GET` de este contrato, con la lógica de
  degradación 404/405/501/network→`null`), `saveRecomendacion` (`POST` de
  este contrato).
- `src/renderer/src/schema/recomendaciones.ts` — los zod schemas que
  validan cada respuesta antes de tocar el estado de React. Son el contrato
  real tal como lo aplica el cliente; si el plan de diseño original y este
  archivo difieren, este archivo gana (así está señalado en cada sección
  arriba donde aplica).
- `src/renderer/src/hooks/useDataExtraction.ts` — orquesta
  `GET` → (404 ? `POST /llm/data-extraction` : nada) → `dispatch` del
  estado del documento; es donde viven las reglas de los tres estados del
  §3 y la degradación del §5.

## Referencias

- Plan de diseño completo:
  `docs/superpowers/plans/2026-07-31-recomendaciones-defensoria.md`
  (§4 Integración con el backend, §6 Persistencia y reapertura, §9 puntos 2 y 5).
- Precedente a copiar (backend, repo `aymurai-projects/backend`):
  - `git show 013e86ea:aymurai/api/endpoints/routers/llm/data_extraction/schemas.py`
  - `aymurai/api/endpoints/routers/datapublic/datapublic.py` (`GET`/`POST
    /validation/document/{document_id}`, alrededor de las líneas 124 y 146)
  - `aymurai/database/meta/datapublic/document.py` (patrón de columnas JSON
    `prediction`/`validation`)
  - `aymurai/api/endpoints/routers/asr/transcribe.py` (`GET`/`POST
    /validation/document/{document_id}`, líneas ~390 y ~416) — segunda
    instancia del mismo patrón, útil para ver una variante de la forma de
    respuesta del `GET` (aunque, como se señala en §3, ninguna de las dos
    devuelve exactamente el envelope `{document_id, prediction, validation,
    updated_at}` que este contrato requiere).
