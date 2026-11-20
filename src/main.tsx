import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installPrintShim } from "./lib/printShim";

installPrintShim();

createRoot(document.getElementById("root")!).render(<App />);
