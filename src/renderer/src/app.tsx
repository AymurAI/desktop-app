import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Navigate,
  RouterProvider,
  createMemoryRouter as createRouter,
} from "react-router-dom";

import { ThemeProvider } from "@/components";
import LoginLayout from "@/layout/login";
import MainLayout from "@/layout/main";
import {
  Finish,
  LoginFeatures,
  LoginHost,
  Onboarding,
  Preview,
  Process,
  Validation,
} from "@/pages";

const router = createRouter([
  {
    path: "/",
    element: <Navigate to="/login" />,
  },
  {
    path: "/login",
    element: <LoginLayout />,
    children: [
      { index: true, element: <LoginHost /> },
      { path: "host", element: <LoginHost /> },
      { path: "features", element: <LoginFeatures /> },
    ],
  },
  {
    // Main as a layout element
    path: "app/:feature",
    element: <MainLayout />,
    children: [
      // 1. Onboarding. Explanation of the workflow to process files
      { path: "onboarding", element: <Onboarding /> },
      // 2. Preview. Process the file to get its text contents
      { path: "preview", element: <Preview /> },
      // 3. Process. Passes the text contents to the AI to extract predictions
      { path: "process", element: <Process /> },
      // 4. Validation. Validate the predictions/anonymize the file
      { path: "validation", element: <Validation /> },
      // 5. Finish. Show the results and download output files
      { path: "finish", element: <Finish /> },
    ],
  },
]);

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Stitches global styles */}
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
