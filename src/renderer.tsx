import { createRoot } from "react-dom/client";
import Header from "./components/header";
import "./index.css";

const App = () => {
  return (
    <div className="min-h-screen">
      <Header />
    </div>
  );
};

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<App />);
}
