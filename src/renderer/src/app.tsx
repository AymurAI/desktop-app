import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";

import { ThemeProvider } from "@/components";
import { TooltipProvider } from "@/components/ui/tooltip";
import * as TanstackReactQuery from "@/features/ReactQueryProvider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const TanStackQueryProviderContext = TanstackReactQuery.getContext();

const history =
  import.meta.env.VITE_APP_MODE === "electron"
    ? createMemoryHistory({ initialEntries: ["/"] })
    : undefined;
const router = createRouter({
  routeTree,
  history,
  context: { ...TanStackQueryProviderContext },
  defaultViewTransition: true,
});

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
        </TooltipProvider>
      </ThemeProvider>
    </TanstackReactQuery.Provider>
  );
}
