import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ThemeProvider } from 'components';
import { Login, Onboarding, Preview } from 'pages';
import MainLayout from 'layout/main';
import AuthProvider from 'context/Authentication';

const router = createBrowserRouter([
  {
    // Main as a layout element
    path: '/',
    element: <MainLayout></MainLayout>,
    children: [
      { path: 'onboarding', element: <Onboarding></Onboarding> },
      { path: 'preview', element: <Preview></Preview> },
    ],
  },
  {
    path: '/login',
    element: <Login></Login>,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
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
