import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { QueryvaleApp } from "../src/app/QueryvaleApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Queryvale uygulama kökü bulunamadı.");
}

createRoot(root).render(
  <StrictMode>
    <QueryvaleApp />
  </StrictMode>,
);
