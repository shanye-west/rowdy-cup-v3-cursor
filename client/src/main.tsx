import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable service worker for now to avoid the error
// We'll implement it properly later when needed

createRoot(document.getElementById("root")!).render(<App />);
