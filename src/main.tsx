import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/ui";
import { LangProvider } from "@/lib/lang";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LangProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </LangProvider>
  </React.StrictMode>,
);
