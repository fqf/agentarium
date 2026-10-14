import { useEffect, useState } from "react";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";

type AppScreen = "loading" | "auth" | "dashboard";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("loading");

  useEffect(() => {
    async function initialize() {
      try {
        const hasKey = await window.electronAPI.hasApiKey();

        if (hasKey) {
          await window.electronAPI.openDashboard();
          setScreen("dashboard");
        } else {
          setScreen("auth");
        }
      } catch {
        setScreen("auth");
      }
    }

    void initialize();
  }, []);

  if (screen === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Загрузка Agentarium...</p>
      </div>
    );
  }

  if (screen === "dashboard") {
    return <DashboardScreen />;
  }

  return (
    <AuthScreen
      onConnected={async () => {
        await window.electronAPI.openDashboard();
        setScreen("dashboard");
      }}
    />
  );
}
