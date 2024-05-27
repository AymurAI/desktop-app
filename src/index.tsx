import React from "react";
import ReactDOM from "react-dom/client";
import {
  createMemoryRouter as createRouter,
  RouterProvider,
} from "react-router-dom";

import { ThemeProvider } from "components";
import { Login, Onboarding, Preview, Process, Validation, Finish } from "pages";
import MainLayout from "layout/main";
import AuthProvider from "context/Authentication";
import AnonymizerProvider from "context/Anonymizer";

const router = createRouter([
  {
    // Main as a layout element
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "onboarding", element: <Onboarding /> },
      { path: "preview", element: <Preview /> },
      { path: "process", element: <Process /> },
      { path: "validation", element: <Validation /> },
      { path: "finish", element: <Finish /> },
    ],
  },
  {
    path: "/login",
    element: <Login></Login>,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* Provides the Google OAuth2 token */}
    <AuthProvider>
      {/* Stitches global styles */}
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
