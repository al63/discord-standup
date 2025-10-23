import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./fonts/ComicNeue-Regular.ttf";
import "./fonts/ComicNeue-Bold.ttf";
import "./fonts/PermanentMarker.ttf";

createRoot(document.getElementById("root")!).render(<App />);
