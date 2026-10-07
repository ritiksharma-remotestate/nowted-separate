import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import ThemeProvider from "./context/themeContext";
import RouteProvider from "./context/routeContext";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
      <RouteProvider>
        <App />
      </RouteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);