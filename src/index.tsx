import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createMemoryRouter as createRouter,
  RouterProvider,
} from 'react-router-dom';

import { ThemeProvider } from 'components';
import {
  Login,
  Onboarding,
  Preview,
  Process,
  ValidateDataset,
  ValidateAnonymization,
  FinishDataset,
  FinishAnonymizer,
} from 'pages';
import MainLayout from 'layout/main';
import AuthProvider from 'context/Authentication';
import UrlProvider from 'context/ServerUrl';
const router = createRouter([
  {
    // Main as a layout element
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'preview', element: <Preview /> },
      { path: 'process', element: <Process /> },
      // Validation
      { path: 'validation/dataset', element: <ValidateDataset /> },
      { path: 'validation/anonymizer', element: <ValidateAnonymization /> },
      // Finish
      { path: 'finish/dataset', element: <FinishDataset /> },
      { path: 'finish/anonymizer', element: <FinishAnonymizer /> },
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
      {/* Provides the server URL into which the user will connect */}
      <UrlProvider>
        {/* Stitches global styles */}
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </UrlProvider>
    </AuthProvider>
  </React.StrictMode>
);
