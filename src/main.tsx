import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const favPath = "/favicon.png"; // coloque public/favicon.png
let link = document.querySelector(
  "link[rel~='icon']"
) as HTMLLinkElement | null;
if (!link) {
  link = document.createElement("link");
  link.rel = "icon";
  document.head.appendChild(link);
}
link.type = "image/png";
link.href = favPath;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
