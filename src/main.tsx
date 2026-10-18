import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { ModuleProvider } from "./app/context/ModuleContext";
import { LanguageProvider } from "./app/context/LanguageContext";
import { BhattaSettingsProvider } from "./app/context/BhattaSettingsContext";

createRoot(document.getElementById("root")!).render(
  <BhattaSettingsProvider>
    <LanguageProvider>
      <ModuleProvider>
        <App />
      </ModuleProvider>
    </LanguageProvider>
  </BhattaSettingsProvider>
);