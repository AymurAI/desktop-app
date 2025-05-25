import React from "react";
import ReactDOM from "react-dom/client";
import {
	RouterProvider,
	createMemoryRouter as createRouter,
} from "react-router-dom";

import { ThemeProvider } from "components";
import AuthProvider from "context/Authentication";
import UrlProvider from "context/ServerUrl";
import MainLayout from "layout/main";
import {
	FinishAnonymizer,
	FinishDataset,
	Login,
	Onboarding,
	Preview,
	Process,
	ValidateAnonymization,
	ValidateDataset,
} from "pages";
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
		path: "/login",
		element: <Login />,
	},
]);

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
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
	</React.StrictMode>,
);
