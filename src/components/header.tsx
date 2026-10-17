import { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Minus, Square, X } from "lucide-react";

const Header: FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    return window.electronAPI.onMaximizedChange(setIsMaximized);
  }, []);

  return (
    <header className="flex h-12 select-none items-center border-b border-white/5 px-3 [app-region:drag]">
      <span className="text-sm font-medium tracking-wide text-white/80">Agentarium</span>
      <div className="ml-auto flex items-center gap-1 [app-region:no-drag]">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Свернуть окно"
          className="text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => window.electronAPI.minimizeWindow()}>
          <Minus className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Развернуть окно"
          className="text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => window.electronAPI.maximizeWindow()}>
          {isMaximized ? <Copy className="size-3.5 -scale-x-100" /> : <Square className="size-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Закрыть окно"
          className="text-white/60 hover:bg-red-500/50! hover:text-white"
          onClick={() => window.electronAPI.closeWindow()}>
          <X className="size-3.5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
