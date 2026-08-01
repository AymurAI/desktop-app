import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";

import { ThemeProvider } from "@/components";
import AppToaster from "@/components/layout/app-toaster";
import * as TanstackReactQuery from "@/features/ReactQueryProvider";
import { TooltipProvider } from "@aymurai/ui";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const TanStackQueryProviderContext = TanstackReactQuery.getContext();

const history =
  import.meta.env.VITE_APP_MODE === "electron"
    ? createMemoryHistory({ initialEntries: ["/"] })
    : undefined;

export const routerOptions = {
  routeTree,
  history,
  context: { ...TanStackQueryProviderContext },
  // Keep TanStack's default View Transition off: router-core@1.171.14
  // discards the ViewTransition returned by document.startViewTransition(),
  // leaving Chromium's real `AbortError: Transition was skipped` `.ready`
  // rejection unhandled. Re-enable only after upstream catches it.
};
const router = createRouter(routerOptions);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <TanstackReactQuery.Provider {...TanStackQueryProviderContext}>
      {/* Stitches global styles */}
      <ThemeProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <AppToaster />
        </TooltipProvider>
      </ThemeProvider>
    </TanstackReactQuery.Provider>
  );
}
