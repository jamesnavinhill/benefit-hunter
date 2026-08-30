import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyAccents, loadLocalAccents, mergeAccents } from "./lib/accents";
import "./styles/global.css";

// Apply a saved theme before React mounts so light mode never flashes dark.
applyAccents(mergeAccents(loadLocalAccents()));

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);
