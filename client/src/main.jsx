// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./Router";

// Add clear console log for debugging
console.log("Community Connect app starting...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
