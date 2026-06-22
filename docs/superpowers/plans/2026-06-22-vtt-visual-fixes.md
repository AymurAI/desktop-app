# Voz a Texto — ajustes visuales (alineación fina con Figma)

**Fecha:** 2026-06-22
**Branch:** feature/vtt-edit-variant-c (PR #89)
**Método de verificación:** Playwright + Chrome sobre `pnpm dev:web`
(`VITE_USE_MOCK_STT=true`, `VITE_DEV_HOST`), capturas en `/tmp/figma-stt/v-*.png`
comparadas contra las referencias canónicas en `screenshots/`.

## Resumen

La auditoría anterior comparó contra exports de Figma propios y declaró "alineado"
con demasiada ligereza. Esta pasada compara contra `screenshots/` (los frames de
diseño con el chrome del browser) y mide estilos computados reales. Aparecen
discrepancias concretas; abajo cada una con evidencia y clasificada como
**@aymurai/ui (librería)** o **desktop-app (este proyecto)**.

## Hallazgos (con evidencia)

### 1. Barra de carga (pantalla Transcripción) — bordes redondeados de más
- **Evidencia:** el fill de la barra tiene `border-radius: 9999px` (pill completo),
  `height: 10px`, gradiente `linear-gradient(135deg, #3F479D 37.5%, #C5CAFF …)`.
  Medido con Playwright (computed style) en `process.tsx`.
- **Diseño (ref `screenshots/transcript-progress-100.png`, `-with-text`, `-error`):**
  barra con esquinas **casi rectas** (~2px) y el estilo de rayas de la librería.
- **Causa raíz / clasificación:** **@aymurai/ui (librería).** El componente correcto
  vive en `@aymurai/ui` **v0.3.0**, que hoy existe en la rama
  `chore/release-v0.3.0` de `AymurAI/ui-components` pero **no está tagueada/publicada**
  (sólo hay tags `v0.2.0` y `v0.2.1`). La implementación actual del desktop-app es una
  **barra custom** en `process.tsx` (no usa el componente de la librería), con
  `rounded: "full"`.
- **Fix correcto:** publicar/taggear `v0.3.0` en `ui-components` → bumpear la dependencia
  → reemplazar la barra custom de `process.tsx` por el componente de la librería.

### 2. Fondo de la pantalla de transcript en modo NO edición — gris en vez de blanco
- **Evidencia:** el contenedor del transcript renderiza sobre `rgb(246,245,247)`
  = `#F6F5F7` = token `bg.primary` (gris). Medido con Playwright.
  En código: `transcription-editor/index.tsx` usa `bg: "bg.primary"` (líneas ~141 y ~160).
- **Diseño (ref `screenshots/transcrip-results.png` y `editor.png`):** el área del
  transcript es **blanca** (`#FFFFFF` = `bg.secondary`); en modo edición sólo el banner
  "Modo edición activo…" es una franja gris.
- **Clasificación:** **desktop-app (este proyecto).** Cambiar el fondo del contenedor del
  transcript de `bg.primary` → `bg.secondary` (blanco). Aplica a modo lectura; verificar
  que en modo edición el banner gris se mantenga y el resto sea blanco.

### 3. (Menor) Copy del modal "¿Cómo funciona?"
- **Evidencia:** card 3 dice "renombrá a **las personas**"; la ref
  (`screenshots/003_proceso_de_archivos.png`) dice "renombrá a **los locutores**".
- **Clasificación:** **desktop-app** (i18n `voice-to-text.howItWorks.cards.card3.subtitle`).
  A confirmar con diseño cuál es el término final (el resto de la app usa "Locutor N").

## Pantallas ya alineadas (sin cambios)
Dashboard, Selección (drop), Selección (lista), modal "¿Cómo funciona?" (ya arreglado en
`311bff5`), y el chrome (header + stepper + footer). Confirmado por captura vs referencia.

## Plan de trabajo

Dos tracks; el track de proyecto depende del de librería para el ítem #1.

### Track A — @aymurai/ui (repo AymurAI/ui-components) — LIBRERÍA
Fuera de este repo. Prerrequisito para el fix #1.
1. Revisar la rama `chore/release-v0.3.0`: confirmar que el componente de barra de
   progreso (ArchiveProgress / equivalente) tiene los bordes casi rectos y el estilo de
   rayas del diseño.
2. Finalizar y **taggear/publicar `v0.3.0`** (build de `dist`, igual que v0.2.1).
3. (Si hace falta antes del release) alternativa temporal: apuntar la dependencia al commit
   de la rama `chore/release-v0.3.0` para desbloquear el track B.

### Track B — desktop-app (este repo) — PROYECTO
1. **Fondo blanco en transcript (modo lectura).** `transcription-editor/index.tsx`:
   contenedor del transcript `bg.primary` → `bg.secondary`. Verificar lectura y edición
   con captura Playwright vs `transcrip-results.png` / `editor.png`.
2. **Barra de carga (depende de Track A).** Bumpear `@aymurai/ui` a `v0.3.0` en
   `package.json` + lockfile; reemplazar la barra custom de `process.tsx` por el
   componente de la librería; mantener el cableado de estados
   (waiting/streaming/completed/error/stopped) y `useTranscribe`. Verificar contra
   `transcript-progress-100/-with-text/-error.png`.
   - **Stopgap si v0.3.0 demora:** en `process.tsx` cambiar `rounded: "full"` → `[2px]`
     en el contenedor y el fill de la barra (deja los bordes casi rectos sin tocar la
     librería). Marcar con TODO para migrar al componente de 0.3.0.
3. **(Menor) Copy del modal.** Ajustar el string de card3 según defina diseño.
4. **Re-auditoría completa.** Recapturar todas las pantallas con Playwright y comparar
   1:1 contra `screenshots/` (no a ojo rápido) antes de declarar terminado.

## Verificación
Por cada cambio: captura Playwright de la pantalla afectada vs la referencia en
`screenshots/`; además `pnpm typecheck`, biome, knip y tests. La barra de progreso y el
fondo se validan con estilos computados (border-radius, background-color), no sólo visual.

## Notas de alcance
- El ítem #1 introduce un cambio de dependencia (`@aymurai/ui` 0.2.1 → 0.3.0); revisar que
  no rompa otros consumos de la librería (Player, Avatar, Card, Switch, Dialog, etc.).
- Playwright se usó como harness de verificación (instalado local, sin commitear).
