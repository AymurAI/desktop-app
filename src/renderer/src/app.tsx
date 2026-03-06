import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";

import { ThemeProvider } from "@/components";
import { TooltipProvider } from "@/components/ui/tooltip";
import * as TanstackReactQuery from "@/features/ReactQueryProvider";

// Import the generated route tree
import { Toaster, resolveValue, toast } from "react-hot-toast";
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
          <Toaster
            position="bottom-center"
            containerStyle={{
              bottom: 120,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                maxWidth: "1000px",
                width: "fit-content",
                minWidth: "400px",
                background: "#DDFCED",
                color: "#1B5E20",
                border: "1px solid #C8E6C9",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.05)",
                borderRadius: "8px",
              },
            }}
          >
            {(t) => (
              <div
                style={{
                  ...t.style,
                  opacity: t.visible ? 1 : 0,
                  transform: t.visible ? "translateY(0)" : "translateY(10px)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  {t.type === "success" && (
                    <div
                      style={{
                        color: "#2E7D32",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>
                    {resolveValue(t.message, t)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2E7D32",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                    opacity: 0.6,
                    transition: "opacity 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.opacity = "0.6";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.opacity = "0.6";
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
          </Toaster>
        </TooltipProvider>
      </ThemeProvider>
    </TanstackReactQuery.Provider>
  );
}
