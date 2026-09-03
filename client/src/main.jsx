import React from "react";
import ReactDOM from "react-dom/client";

import "leaflet/dist/leaflet.css";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/topbar.css";
import "./styles/sidebar.css";
import "./styles/dashboard.css";
import "./styles/map.css";
import "./styles/alerts.css";
import "./styles/tables.css";
import "./styles/forms.css";
import "./styles/responsive.css";

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);