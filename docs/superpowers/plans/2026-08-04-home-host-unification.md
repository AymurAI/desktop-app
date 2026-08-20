# Home/Host Unification & Web/Desktop Boot Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the deprecated `Local` connection option from `/home/host`, collapse the screen down to the existing `Servidor` form, fix a navigation race that sends the `FeatureMenu` gear icon to onboarding instead of `/home/host`, and make the web build boot straight into `/home/features` (auto-connecting to its own origin) while leaving the desktop boot flow untouched.

**Architecture:** Reuse the project's existing `VITE_APP_MODE` build-time signal (`"electron" | "web"`, already read once in `app.tsx`) behind a new small `@/utils/app-mode` helper (`isElectronApp()` / `isWebApp()`), and thread it through the three places that need mode-aware behavior: the API client's initial `baseURL`, the `/home/host` server-form's prefilled value, and the landing page's redirect target. `/home/host` becomes a single unconditional render of the (lightly modified) `ConnectToHost` component — the `ChooseHost` step, `useRunLocalServer` hook, and their schema/i18n strings are deleted outright since nothing else references them. The `FeatureMenu` gear icon bug is fixed by awaiting the navigation to `/home/host` before dispatching `removeAllFiles()`, so the file-guard (`RequireFile`) on the route being left can no longer race the navigation and win.

**Tech Stack:** React 18, TanStack Router (file-based routes, code-split), TanStack Query, Zustand (`persist` middleware), Vite/`electron-vite` with `VITE_APP_MODE` define, Vitest + Testing Library, i18next, Panda CSS, Radix UI, `@aymurai/ui`.

## Global Constraints

- Reuse the existing `Servidor` screen's components, validation, and connection logic instead of duplicating it — `/home/host` renders (a lightly modified) `ConnectToHost` directly, no new form.
- The `FeatureMenu` gear icon must always end up at `/home/host`, independent of the current step or any in-flight redirect from the flow it's leaving.
- Web app: landing page (`/`) redirects directly to `/home/features`; `/home/host` must never appear as a mandatory first step; no manual server URL entry is required before reaching the features grid.
- Web app: the gear icon still opens `/home/host`.
- Web app: `/home/host`'s server-address field is prefilled with the app's own origin (`window.location.origin` — scheme + host + port, no path), stays editable, and remains savable via "Guardar y conectar".
- Desktop app: no change to the existing boot flow or connection logic beyond the `/home/host` redesign (dropping `Local`).
- Reuse the existing runtime signal (`VITE_APP_MODE`) for web/desktop detection instead of a new or URL/browser-based check; centralize it in one small reusable module instead of duplicating the check per component.
- Don't delete shared code without first checking it has no other callers.
- Preserve current server-address validation and persistence behavior (Zustand `persist`, `useConnectToHost` healthcheck flow).
- Avoid redirect loops across `/`, `/home/features`, `/home/host`.
- Preserve a user's requested destination where applicable, except the web app's initial boot, which must always land on `/home/features`.
- Preserve existing visual style and component patterns (Panda CSS recipes, `@aymurai/ui` primitives).
- Add or update automated tests covering at minimum: the initial web redirect, the initial desktop behavior, the prefilled URL in `/home/host` for web, gear-icon navigation from an intermediate step, and the absence of the `Local` option.
- Run the project's available validations (`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm knip`) before declaring the work done.

---

## Task 1: Centralize web/desktop detection in `@/utils/app-mode`

**Files:**
- Create: `src/renderer/src/utils/app-mode.ts`
- Create: `src/renderer/src/utils/app-mode.test.ts`
- Modify: `src/renderer/src/app.tsx:17-20`

**Interfaces:**
- Produces: `isElectronApp(): boolean`, `isWebApp(): boolean` — exported functions (not frozen consts) so later tasks and tests can read the live `import.meta.env.VITE_APP_MODE` at call time, per-render/per-test, instead of a value frozen at first module evaluation.

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/utils/app-mode.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { isElectronApp, isWebApp } from "./app-mode";

describe("app-mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports electron mode when VITE_APP_MODE is 'electron'", () => {
    vi.stubEnv("VITE_APP_MODE", "electron");

    expect(isElectronApp()).toBe(true);
    expect(isWebApp()).toBe(false);
  });

  it("reports web mode when VITE_APP_MODE is 'web'", () => {
    vi.stubEnv("VITE_APP_MODE", "web");

    expect(isElectronApp()).toBe(false);
    expect(isWebApp()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/renderer/src/utils/app-mode.test.ts`
Expected: FAIL — `Cannot find module './app-mode'` (the module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/renderer/src/utils/app-mode.ts`:

```ts
/**
 * Centralized web/desktop runtime detection, backed by the `VITE_APP_MODE`
 * build-time flag already set by the `dev`/`dev:web`/`build`/`build:web`
 * scripts. Exported as functions (not frozen consts) so callers always read
 * the live value instead of one captured at first import.
 */
export function isElectronApp(): boolean {
  return import.meta.env.VITE_APP_MODE === "electron";
}

export function isWebApp(): boolean {
  return !isElectronApp();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/renderer/src/utils/app-mode.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Wire the helper into `app.tsx`**

In `src/renderer/src/app.tsx`, replace the inline `import.meta.env.VITE_APP_MODE === "electron"` check with the new helper. Current lines 1-20:

```tsx
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components";
import * as TanstackReactQuery from "@/features/ReactQueryProvider";
import { TooltipProvider } from "@aymurai/ui";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const TanStackQueryProviderContext = TanstackReactQuery.getContext();

const history =
  import.meta.env.VITE_APP_MODE === "electron"
    ? createMemoryHistory({ initialEntries: ["/"] })
    : undefined;
```

Replace with:

```tsx
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "@/components";
import * as TanstackReactQuery from "@/features/ReactQueryProvider";
import { isElectronApp } from "@/utils/app-mode";
import { TooltipProvider } from "@aymurai/ui";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const TanStackQueryProviderContext = TanstackReactQuery.getContext();

const history = isElectronApp()
  ? createMemoryHistory({ initialEntries: ["/"] })
  : undefined;
```

The rest of the file (`createRouter(...)` onward) is unchanged.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck:web`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/utils/app-mode.ts src/renderer/src/utils/app-mode.test.ts src/renderer/src/app.tsx
git commit -m "feat: centralize web/desktop runtime detection in app-mode util"
```

---

## Task 2: Auto-connect the web build to its own origin

**Files:**
- Modify: `src/renderer/src/store/useLocal.ts:65-76`
- Modify: `src/renderer/src/services/api.ts`
- Create: `src/renderer/src/services/api.test.ts`

**Interfaces:**
- Consumes: `isWebApp()` from Task 1 (`@/utils/app-mode`).
- Produces: `getServerHost(): string | null` — a non-hook accessor on the Zustand local store, exported from `@/store/useLocal`, for reading the persisted `serverHost` outside a React render (needed because `services/api.ts` sets its default at module-import time, not from a component).

- [ ] **Step 1: Add the non-hook `getServerHost` accessor**

In `src/renderer/src/store/useLocal.ts`, after the existing `useServerHost`/`useServerHostActions` exports (currently lines 67-76):

```ts
export const useServerHost = () => useLocalStore((state) => state.serverHost);
export const useServerHostActions = () => {
  const setServerHost = useLocalStore((state) => state.setServerHost);
  const clearServerHost = useLocalStore((state) => state.clearServerHost);

  return {
    setServerHost,
    clearServerHost,
  };
};
```

add directly below:

```ts
/** Non-hook read for use outside React (e.g. the axios client's module-load default). */
export const getServerHost = () => useLocalStore.getState().serverHost;
```

- [ ] **Step 2: Write the failing test**

Create `src/renderer/src/services/api.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("api — initial baseURL", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/store/useLocal");
  });

  it("defaults to the page's own origin in the web app when no host is saved", async () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    vi.doMock("@/store/useLocal", () => ({ getServerHost: () => null }));

    const { default: api } = await import("./api");

    expect(api.defaults.baseURL).toBe(window.location.origin);
  });

  it("prefers a previously saved server host over the page origin in the web app", async () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    vi.doMock("@/store/useLocal", () => ({
      getServerHost: () => "https://custom.example.com",
    }));

    const { default: api } = await import("./api");

    expect(api.defaults.baseURL).toBe("https://custom.example.com");
  });

  it("leaves baseURL unset in the desktop app", async () => {
    vi.stubEnv("VITE_APP_MODE", "electron");
    vi.doMock("@/store/useLocal", () => ({ getServerHost: () => null }));

    const { default: api } = await import("./api");

    expect(api.defaults.baseURL).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run src/renderer/src/services/api.test.ts`
Expected: FAIL — all three assertions fail because `api.ts` doesn't yet read `getServerHost`/`isWebApp` (current `baseURL` stays `undefined` in every case, so the first two tests fail).

- [ ] **Step 4: Write minimal implementation**

Replace `src/renderer/src/services/api.ts` entirely:

```ts
import { getServerHost } from "@/store/useLocal";
import { isWebApp } from "@/utils/app-mode";
import axios from "axios";

const api = axios.create();

// Dev-only convenience: pre-set the base URL from VITE_DEV_HOST so the
// APIProtected screens render under `pnpm dev:web` without manually walking
// the connect-to-host flow (useful with VITE_USE_MOCK_STT=true for offline UI
// work). Inert in production builds and when the var is unset.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_HOST) {
  api.defaults.baseURL = import.meta.env.VITE_DEV_HOST;
} else if (isWebApp()) {
  // The web build is always served by the same backend it talks to (either a
  // dedicated server or the bundled Docker image), so default to the page's
  // own origin instead of requiring a manual connect step. A previously
  // saved custom host (self-hosted setups with a separate API origin) wins.
  api.defaults.baseURL = getServerHost() ?? window.location.origin;
}

export default api;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run src/renderer/src/services/api.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck:web`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/src/store/useLocal.ts src/renderer/src/services/api.ts src/renderer/src/services/api.test.ts
git commit -m "feat: auto-connect the web build to its own origin on boot"
```

---

## Task 3: Redesign `/home/host` — drop the `Local` option entirely

**Files:**
- Modify: `src/renderer/src/components/home/connect-to-host.tsx`
- Modify: `src/renderer/src/routes/home/host.tsx`
- Modify: `src/renderer/src/services/aymurai/index.ts`
- Modify: `src/renderer/src/constants/i18n/locales/es/common.ts:18-34`
- Delete: `src/renderer/src/components/home/choose-host.tsx`
- Delete: `src/renderer/src/services/aymurai/useRunLocalServer.ts`
- Delete: `src/renderer/src/services/aymurai/schema.ts`
- Create: `src/renderer/src/components/home/connect-to-host.test.tsx`
- Create: `src/renderer/src/routes/home/host.test.tsx`

**Interfaces:**
- Consumes: `isElectronApp()` from Task 1 (`@/utils/app-mode`).
- Produces: `ConnectToHost` with no props (previously took `{ onBackClick }`) — Task 5's `FeaturesMenu` fix does not touch this component, but any future consumer must call it with no props.

- [ ] **Step 1: Write the failing tests**

Create `src/renderer/src/components/home/connect-to-host.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConnectToHost from "./connect-to-host";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/services/aymurai", () => ({
  useConnectToHost: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock("@/store/useLocal", () => ({
  useServerHost: () => null,
  useServerHostActions: () => ({ setServerHost: vi.fn() }),
}));

describe("ConnectToHost — default server address", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefills the field with the web app's own origin when no host is saved yet", () => {
    vi.stubEnv("VITE_APP_MODE", "web");

    render(<ConnectToHost />);

    expect(screen.getByRole("textbox")).toHaveValue(window.location.origin);
  });

  it("leaves the field empty on desktop when no host is saved yet", () => {
    vi.stubEnv("VITE_APP_MODE", "electron");

    render(<ConnectToHost />);

    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
```

Create `src/renderer/src/routes/home/host.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./host";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
  createFileRoute: () => (options: unknown) => ({ options }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/services/aymurai", () => ({
  useConnectToHost: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock("@/store/useLocal", () => ({
  useServerHost: () => null,
  useServerHostActions: () => ({ setServerHost: vi.fn() }),
}));

describe("/home/host — unified server screen", () => {
  it("shows the server-address form directly, with no Local/Servidor choice", () => {
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Host route has no component");

    render(<RouteComponent />);

    expect(
      screen.getByText("home.host.connectServerExplanation"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "home.host.connectServerSubmit" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/¿Cómo deseas conectarte/)).not.toBeInTheDocument();
    expect(screen.queryByText("Local")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/renderer/src/components/home/connect-to-host.test.tsx src/renderer/src/routes/home/host.test.tsx`
Expected: FAIL — `connect-to-host.test.tsx` fails because `ConnectToHost` still requires an `onBackClick` prop and its default value is always `""` regardless of mode; `host.test.tsx` fails because `host.tsx` still renders the `¿Cómo deseas conectarte?` chooser first.

- [ ] **Step 3: Rewrite `connect-to-host.tsx`**

Replace `src/renderer/src/components/home/connect-to-host.tsx` entirely:

```tsx
import { useConnectToHost } from "@/services/aymurai";
import * as localStore from "@/store/useLocal";
import { css } from "@/styled/css";
import { Stack } from "@/styled/jsx";
import { isElectronApp } from "@/utils/app-mode";
import { Button, TextField } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  type ChangeEventHandler,
  type SubmitEventHandler,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ZodError } from "zod";

export default function ConnectToHost() {
  const navigate = useNavigate();
  const defaultHost = isElectronApp() ? "" : window.location.origin;
  const remoteHost = localStore.useServerHost() ?? defaultHost;
  const { setServerHost } = localStore.useServerHostActions();
  const { t } = useTranslation();

  const [host, setHost] = useState(remoteHost);

  const { mutate: connectToHost, isPending, error, reset } = useConnectToHost();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHost(e.target.value);
    reset();
  };

  const tryConnection: SubmitEventHandler = (e) => {
    e.preventDefault();

    connectToHost(host, {
      onSuccess: () => {
        setServerHost(host);
        navigate({
          to: "/home/features",
        });
      },
    });
  };

  const errorMessage = (err: Error | null): string => {
    console.error(err);
    if (err instanceof AxiosError) {
      if (err.code === "ERR_NETWORK") return t("home.host.errors.network");
      return t("home.host.errors.connection");
    }

    if (err instanceof ZodError) {
      return t("home.host.errors.invalidResponse");
    }

    if (err instanceof TypeError) {
      return t("home.host.errors.invalidUrl");
    }

    return t("home.host.errors.unknown");
  };

  return (
    <form onSubmit={tryConnection}>
      <Stack justify="center" gap="3" width="[400px]">
        <h2 className={css({ textStyle: "subtitle.sm.strong" })}>
          {t("home.host.connectServerExplanation")}
        </h2>

        <TextField
          label={t("home.host.connectServerLabel")}
          placeholder="http://"
          value={host}
          onChange={handleChange}
          error={error ? errorMessage(error) : undefined}
        />

        <Button type="submit" isLoading={isPending}>
          {t("home.host.connectServerSubmit")}
        </Button>
      </Stack>
    </form>
  );
}
```

This drops the `ConnectToHostProps`/`onBackClick` prop, the `BackButton` component, and the `ArrowLeft` import (there is no longer a previous step to go back to), and computes the prefilled default from `isElectronApp()`.

- [ ] **Step 4: Rewrite `host.tsx`**

Replace `src/renderer/src/routes/home/host.tsx` entirely:

```tsx
import ConnectToHost from "@/components/home/connect-to-host";
import HomeLayout from "@/layout/home";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/home/host")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <HomeLayout>
      <ConnectToHost />
    </HomeLayout>
  );
}
```

- [ ] **Step 5: Delete the `Local`-only files**

```bash
rm src/renderer/src/components/home/choose-host.tsx
rm src/renderer/src/services/aymurai/useRunLocalServer.ts
rm src/renderer/src/services/aymurai/schema.ts
```

- [ ] **Step 6: Drop the dead re-export**

In `src/renderer/src/services/aymurai/index.ts`, remove the `useRunLocalServer` re-export. Current content:

```ts
import predict from "./predict";
export { predict };

export * from "./useConnectToHost";
export * from "./useRunLocalServer";

export * as aymuraiService from "./queries";
```

Replace with:

```ts
import predict from "./predict";
export { predict };

export * from "./useConnectToHost";

export * as aymuraiService from "./queries";
```

- [ ] **Step 7: Remove the now-unused i18n strings**

In `src/renderer/src/constants/i18n/locales/es/common.ts`, the `home.host` block currently reads (lines 18-34):

```ts
    host: {
      howToConnect: "¿Cómo deseas conectarte a Aymurai?",
      optionLocal: "Local",
      optionServer: "Servidor",
      optionOr: "o",
      connectServerExplanation:
        "Ingresa la dirección del servidor al que deseas conectarte",
      connectServerLabel: "Dirección del servidor",
      connectServerSubmit: "Guardar y conectar",
      errors: {
        network: "No se pudo conectar al servidor",
        connection: "Error de conexión",
        invalidResponse: "El servidor no respondió correctamente",
        invalidUrl: "El formato de la URL es incorrecto.",
        unknown: "Error desconocido",
      },
    },
```

Replace with:

```ts
    host: {
      connectServerExplanation:
        "Ingresa la dirección del servidor al que deseas conectarte",
      connectServerLabel: "Dirección del servidor",
      connectServerSubmit: "Guardar y conectar",
      errors: {
        network: "No se pudo conectar al servidor",
        connection: "Error de conexión",
        invalidResponse: "El servidor no respondió correctamente",
        invalidUrl: "El formato de la URL es incorrecto.",
        unknown: "Error desconocido",
      },
    },
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm vitest run src/renderer/src/components/home/connect-to-host.test.tsx src/renderer/src/routes/home/host.test.tsx`
Expected: PASS (3 tests total)

- [ ] **Step 9: Typecheck and knip**

Run: `pnpm typecheck:web && pnpm knip`
Expected: no new errors; `knip` reports no newly-unused files (the deleted files and the dropped re-export were their only references).

- [ ] **Step 10: Commit**

```bash
git add src/renderer/src/components/home/connect-to-host.tsx \
        src/renderer/src/components/home/connect-to-host.test.tsx \
        src/renderer/src/routes/home/host.tsx \
        src/renderer/src/routes/home/host.test.tsx \
        src/renderer/src/services/aymurai/index.ts \
        src/renderer/src/constants/i18n/locales/es/common.ts
git rm src/renderer/src/components/home/choose-host.tsx \
       src/renderer/src/services/aymurai/useRunLocalServer.ts \
       src/renderer/src/services/aymurai/schema.ts
git commit -m "feat: unify /home/host into a single server-connection screen"
```

---

## Task 4: Redirect the web app's landing page straight to `/home/features`

**Files:**
- Modify: `src/renderer/src/routes/index.tsx`
- Create: `src/renderer/src/routes/index.test.tsx`

**Interfaces:**
- Consumes: `isWebApp()` from Task 1 (`@/utils/app-mode`).

- [ ] **Step 1: Write the failing test**

Create `src/renderer/src/routes/index.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./index";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("Landing page initial redirect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("redirects straight to /home/features when running as the web app", () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Index route has no component");

    render(<RouteComponent />);
    vi.advanceTimersByTime(2000);

    expect(navigate).toHaveBeenCalledWith({ to: "/home/features" });
  });

  it("redirects to /home (host setup) when running as the desktop app", () => {
    vi.stubEnv("VITE_APP_MODE", "electron");
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Index route has no component");

    render(<RouteComponent />);
    vi.advanceTimersByTime(2000);

    expect(navigate).toHaveBeenCalledWith({ to: "/home" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/renderer/src/routes/index.test.tsx`
Expected: FAIL — the web-mode case fails because the route unconditionally navigates to `/home`.

- [ ] **Step 3: Write minimal implementation**

Replace `src/renderer/src/routes/index.tsx` entirely:

```tsx
import Loading from "@/layout/loading";
import { isWebApp } from "@/utils/app-mode";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

const TIMING = 2000;
function RouteComponent() {
  const navigate = useNavigate();
  const target = isWebApp() ? "/home/features" : "/home";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: target });
    }, TIMING);

    return () => clearTimeout(timer);
  }, [navigate, target]);

  return <Loading />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/renderer/src/routes/index.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck:web`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/routes/index.tsx src/renderer/src/routes/index.test.tsx
git commit -m "feat: send the web app's landing page straight to /home/features"
```

---

## Task 5: Fix the `FeatureMenu` gear icon navigation race

**Files:**
- Modify: `src/renderer/src/components/features-menu.tsx:37-40`
- Modify: `src/renderer/src/components/features-menu.test.tsx` (this file already exists on `develop`, with 4 passing tests — do not overwrite it; edit it in place per Step 1 below)

**Interfaces:**
- Consumes: nothing new — this task only reorders existing calls inside `FeaturesMenu`.

**Correction (discovered during execution, not in the original plan draft):** `src/renderer/src/components/features-menu.test.tsx` already exists on `develop` (introduced in an earlier, unrelated commit). It has no `@aymurai/ui` mock at all — its existing tests open the real Radix `Popover` via `fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }))` before clicking a menu item, and this works fine in this repo's jsdom setup. Its `react-i18next` mock is namespaced (`t: (key, options) => \`${options?.ns ?? namespace ?? "common"}:${key}\``), not the identity mock used elsewhere in this plan. One of its 4 existing tests, `"renders a full-width settings action"`, exercises `goToSettings` and asserts `dispatch`/`navigate` synchronously right after the click — with this task's fix, `dispatch` no longer happens synchronously, so that assertion breaks unless updated. The correct move is to edit this file in place, in its own established style, not create a second file or introduce a competing `@aymurai/ui` mock.

- [ ] **Step 1: Update the existing test file**

Replace `src/renderer/src/components/features-menu.test.tsx` entirely:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    t: (key: string, options?: { ns?: string }) =>
      `${options?.ns ?? namespace ?? "common"}:${key}`,
  }),
}));

describe("FeaturesMenu", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockReset();
  });

  it("clears files and navigates to the selected feature", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("dataset:title"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({
      to: "/app/$feature",
      params: { feature: "DATA_SET" },
    });
  });

  it("navigates to /home/host and clears files only after the navigation resolves", async () => {
    let resolveNavigate: () => void = () => {};
    navigate.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveNavigate = resolve;
        }),
    );

    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("common:settings"));

    expect(navigate).toHaveBeenCalledWith({ to: "/home/host" });
    expect(dispatch).not.toHaveBeenCalled();

    resolveNavigate();

    await waitFor(() => expect(dispatch).toHaveBeenCalledOnce());
  });
});

describe("FeaturesMenu — Summarizer", () => {
  beforeEach(() => {
    dispatch.mockClear();
    navigate.mockClear();
  });

  it("navigates to the Summarizer flow with the short label and clears files on click", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    fireEvent.click(screen.getByText("common:featuresMenu.summary"));

    expect(dispatch).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({
      to: "/app/$feature",
      params: { feature: "SUMMARIZER" },
    });
  });

  it("does not render the full Summarizer title in the menu", () => {
    render(<FeaturesMenu />);
    fireEvent.click(screen.getByRole("button", { name: "Ir al inicio" }));
    expect(screen.queryByText("summarizer:title")).toBeNull();
  });
});
```

This keeps the two untouched tests (feature navigation, both Summarizer tests) byte-for-byte equivalent in behavior, and replaces `"renders a full-width settings action"` with `"navigates to /home/host and clears files only after the navigation resolves"` — same assertions (navigates to `/home/host`, clears files) plus the new ordering guarantee, using `mockImplementationOnce` so only this one test gets a controllable, deferred `navigate` while every other test keeps the plain synchronous mock it already relied on.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/renderer/src/components/features-menu.test.tsx`
Expected: FAIL — in the new test, `expect(dispatch).not.toHaveBeenCalled()` fails because `goToSettings` currently dispatches `removeAllFiles()` *before* calling `navigate`.

- [ ] **Step 3: Write minimal implementation**

In `src/renderer/src/components/features-menu.tsx`, the current `goToSettings` (lines 37-40) is:

```tsx
  const goToSettings = () => {
    handleClearFiles();
    navigate({ to: "/home/host" });
  };
```

Replace with:

```tsx
  const goToSettings = async () => {
    await navigate({ to: "/home/host" });
    handleClearFiles();
  };
```

This is the actual bug fix: on an intermediate step (`preview`/`process`/`validation`/`finish`), those routes are wrapped in `RequireFile`, which renders `<Navigate to=".../onboarding">` as soon as `files.length` drops to `0`. Dispatching `removeAllFiles()` before the navigation to `/home/host` commits let that guard's redirect race the intended navigation and sometimes win. Awaiting `navigate()` first guarantees the guarded route has already been unmounted by the time the files are cleared, so the guard can never fire.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/renderer/src/components/features-menu.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck:web`
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/features-menu.tsx src/renderer/src/components/features-menu.test.tsx
git commit -m "fix: navigate to /home/host before clearing files from the gear icon"
```

---

## Task 6: Full validation pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including the new ones from Tasks 1-5.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: no errors. If biome flags formatting-only issues, run `pnpm lint:fix` and re-check the diff before committing.

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors (covers both `typecheck:node` and `typecheck:web`).

- [ ] **Step 4: Run knip**

Run: `pnpm knip`
Expected: no newly-unused files/exports (in particular, confirms the deleted `choose-host.tsx`, `useRunLocalServer.ts`, and `schema.ts` left no dangling references, and that the dropped i18n keys aren't referenced elsewhere).

- [ ] **Step 5: Manual smoke check (desktop)**

Run: `pnpm dev`
Expected: app boots to `/home/host`, shows only the server-address form (no `Local`/`Servidor` chooser), "Guardar y conectar" still validates and connects as before. From inside any feature flow, open the gear-icon menu from an intermediate step (e.g. mid-`process`) and confirm it lands on `/home/host`, not onboarding.

- [ ] **Step 6: Manual smoke check (web)**

Run: `pnpm dev:web`
Expected: landing page redirects to `/home/features` without visiting `/home/host` first. Opening `/home/host` via the gear icon shows the address field prefilled with the dev server's own origin (e.g. `http://localhost:3000`).

- [ ] **Step 7: Commit (only if Step 2 required fixes)**

```bash
git add -A
git commit -m "chore: apply lint fixes"
```

Skip this step if `pnpm lint` was already clean in Step 2.
