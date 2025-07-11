import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryRouter as createRouter,
} from "react-router-dom";

import { ThemeProvider } from "@/components";
import AuthProvider from "@/context/Authentication";
import LoginLayout from "@/layout/login";
import MainLayout from "@/layout/main";
import {
  FinishAnonymizer,
  FinishDataset,
  LoginFeatures,
  LoginHost,
  Onboarding,
  Preview,
  Process,
  ValidateAnonymization,
  ValidateDataset,
} from "@/pages";

const router = createRouter([
  {
    // Main as a layout element
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "onboarding", element: <Onboarding /> },
      { path: "preview", element: <Preview /> },
      { path: "process", element: <Process /> },
      // Validation
      { path: "validation/dataset", element: <ValidateDataset /> },
      { path: "validation/anonymizer", element: <ValidateAnonymization /> },
      // Finish
      { path: "finish/dataset", element: <FinishDataset /> },
      { path: "finish/anonymizer", element: <FinishAnonymizer /> },
    ],
  },
  {
    path: "login",
    element: <LoginLayout />,
    children: [
      { index: true, element: <LoginHost /> },
      { path: "host", element: <LoginHost /> },
      { path: "features", element: <LoginFeatures /> },
    ],
  },
]);

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Stitches global styles */}
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
