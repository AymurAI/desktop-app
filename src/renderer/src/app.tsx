import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import { ThemeProvider } from "@/components";
import * as TanstackReactQuery from "@/features/ReactQueryProvider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const TanStackQueryProviderContext = TanstackReactQuery.getContext();

// Create a new router instance
const memoryHistory = createMemoryHistory({
  initialEntries: ["/home/host"], // Pass your initial url
});
const router = createRouter({
  routeTree,
  history: memoryHistory,
  context: { ...TanStackQueryProviderContext },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// const router = createRouter([
//   {
//     path: "/",
//     element: <Navigate to="/login" />,
//   },
//   {
//     path: "/login",
//     element: <LoginLayout />,
//     children: [
//       { index: true, element: <LoginHost /> },
//       { path: "host", element: <LoginHost /> },
//       { path: "features", element: <LoginFeatures /> },
//     ],
//   },
//   {
//     // Main as a layout element
//     path: "app/:feature",
//     element: <MainLayout />,
//     children: [
//       // 1. Onboarding. Explanation of the workflow to process files
//       { path: "onboarding", element: <Onboarding /> },
//       // 2. Preview. Process the file to get its text contents
//       { path: "preview", element: <Preview /> },
//       // 3. Process. Passes the text contents to the AI to extract predictions
//       { path: "process", element: <Process /> },
//       // 4. Validation. Validate the predictions/anonymize the file
//       { path: "validation", element: <Validation /> },
//       // 5. Finish. Show the results and download output files
//       { path: "finish", element: <Finish /> },
//     ],
//   },
// ]);

export default function App() {
  return (
    <TanstackReactQuery.Provider {...TanStackQueryProviderContext}>
      {/* Stitches global styles */}
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </TanstackReactQuery.Provider>
  );
}
