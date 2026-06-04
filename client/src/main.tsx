import { StrictMode, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n, { applyDocumentDirection } from "./i18n/i18n";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import App from "./App";
import "./index.css";

function Root() {
  useEffect(() => {
    applyDocumentDirection(i18n.language);
    const handler = (lng: string) => applyDocumentDirection(lng);
    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

const container = document.getElementById("root")!;
const g = globalThis as unknown as { __averdaAppRoot?: Root };
let root = g.__averdaAppRoot;
if (!root) {
  root = createRoot(container);
  g.__averdaAppRoot = root;
}
root.render(
  <StrictMode>
    <Root />
  </StrictMode>
);
