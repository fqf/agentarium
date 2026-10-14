import type { FC } from "react";
import { Bot, MessagesSquare, Settings2 } from "lucide-react";

const DashboardScreen: FC = () => {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="window-drag flex h-12 items-center justify-between border-b px-5">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">Agentarium</span>
        </div>
        <div className="window-no-drag flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 border-r p-5">
          <h2 className="mb-4 text-sm font-semibold">Agents</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="rounded-md border p-3">Agent A</div>
            <div className="rounded-md border p-3">Agent B</div>
          </div>
        </aside>
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <MessagesSquare className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Conversation Arena</h1>
          <p className="text-sm text-muted-foreground">Здесь скоро начнут общаться наши агенты.</p>
        </main>
      </div>
    </div>
  );
};

export default DashboardScreen;
