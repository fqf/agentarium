import { type FC, useEffect, useState } from "react";
import { Bot, Maximize, Minimize, X } from "lucide-react";
import RoomScreen from "@/screens/RoomScreen";
import { Button } from "@/components/ui/button";

const DashboardScreen: FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    void window.electronAPI.isWindowMaximized().then(setIsMaximized);
    return window.electronAPI.onWindowMaximizedChange(setIsMaximized);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background! text-foreground">
      <header className="window-drag flex h-12 items-center justify-between border-b px-5">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">Agentarium</span>
        </div>
        <div className="window-no-drag flex items-center gap-2">
          {isMaximized ? (
            <Button variant="ghost" onClick={() => window.electronAPI.unmaximizeWindow()}>
              <Minimize />
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => window.electronAPI.maximizeWindow()}>
              <Maximize />
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.electronAPI.closeWindow()}>
            <X />
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/*<ChatScreen />*/}
          <RoomScreen />
        </main>
      </div>
    </div>
  );
};

export default DashboardScreen;
