import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "@aymurai/ui/styles.css";
import "./constants/i18n";
import App from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
