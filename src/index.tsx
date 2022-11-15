import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { ThemeProvider } from 'components';
import { Home, Login } from 'pages';
import MainLayout from 'layout/main';

const router = createBrowserRouter([
  {
    // Main as a layout element
    element: <MainLayout></MainLayout>,
    children: [{ path: 'home', element: <Home></Home> }],
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
    {/* Stitches global styles */}
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
