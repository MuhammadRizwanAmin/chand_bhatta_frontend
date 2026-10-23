import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { ModuleProvider } from "./app/context/ModuleContext";
import { LanguageProvider } from "./app/context/LanguageContext";
import { BhattaSettingsProvider } from "./app/context/BhattaSettingsContext";

// Prevent accidental mouse wheel increment/decrement glitch on number inputs across the project
window.addEventListener("wheel", () => {
  const active = document.activeElement;
  if (active && (active as HTMLInputElement).type === "number") {
    (active as HTMLElement).blur();
  }
}, { passive: true });

createRoot(document.getElementById("root")!).render(
  <BhattaSettingsProvider>
    <LanguageProvider>
      <ModuleProvider>
        <App />
      </ModuleProvider>
    </LanguageProvider>
  </BhattaSettingsProvider>
);