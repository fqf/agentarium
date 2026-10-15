import path from "node:path";
import started from "electron-squirrel-startup";
import { app, BrowserWindow, ipcMain } from "electron";
import { deleteApiKey, getApiKey, hasApiKey, saveApiKey } from "@/services/api-key-storage";
import { streamChat, validateApiKey } from "@/services/ai-api";
import type TChatMessage from "@/types/chat-message";
import agents from "@/config/agents";
import { runRoom } from "@/services/room-orchestrator";

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 610,
    minWidth: 400,
    minHeight: 610,
    resizable: false,
    maximizable: false,
    frame: false,
    autoHideMenuBar: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximized");
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:unmaximized");
  });
  mainWindow.webContents.on("destroyed", () => {
    activeRooms.get(mainWindow.webContents.id)?.abort();
    activeRooms.delete(mainWindow.webContents.id);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};
const switchWindowMode = (window: BrowserWindow, mode: "auth" | "dashboard") => {
  if (mode === "dashboard") {
    window.setResizable(true);
    window.setMinimumSize(900, 600);
    window.setSize(1200, 800, true);
  } else {
    window.setMinimumSize(400, 610);
    window.setSize(400, 610, true);
    window.setResizable(false);
  }

  window.center();
};
const activeChats = new Map<
  string,
  {
    controller: AbortController;
    senderId: number;
  }
>();
const activeRooms = new Map<number, AbortController>();

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.on("window:maximize", event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.maximize();
});
ipcMain.on("window:unmaximize", event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.unmaximize();
});
ipcMain.handle("window:is-maximized", event => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
});
ipcMain.on("window:close", event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});
ipcMain.handle("credentials:exists", () => {
  return hasApiKey();
});
ipcMain.handle("credentials:delete", () => {
  deleteApiKey();
  return true;
});
ipcMain.handle("credentials:save", async (_event, apiKey: string) => {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Введите API-ключ");
  }

  const key = apiKey.trim();

  await validateApiKey(key);
  saveApiKey(key);

  return true;
});
ipcMain.handle("window:dashboard", event => {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (!window) {
    throw new Error("Окно не найдено");
  }

  if (!hasApiKey()) {
    throw new Error("API-ключ отсутствует");
  }

  switchWindowMode(window, "dashboard");

  return true;
});
ipcMain.handle("chat:start", async (event, requestId: string, messages: TChatMessage[]) => {
  if (typeof requestId !== "string" || !requestId) {
    throw new Error("Некорректный ID запроса");
  }

  if (activeChats.has(requestId)) {
    throw new Error("Запрос с таким ID уже выполняется");
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.some(
      message =>
        !message || !["system", "user", "assistant"].includes(message.role) || typeof message.content !== "string",
    )
  ) {
    throw new Error("Некорректный формат сообщений");
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("API-ключ не найден");
  }

  const controller = new AbortController();
  const sender = event.sender;

  activeChats.set(requestId, {
    controller,
    senderId: sender.id,
  });

  const sendEvent = (channel: string, payload?: unknown) => {
    if (!sender.isDestroyed()) {
      sender.send(channel, requestId, payload);
    }
  };

  try {
    await streamChat({
      apiKey,
      messages,
      signal: controller.signal,
      onChunk: chunk => {
        sendEvent("chat:chunk", chunk);
      },
    });

    sendEvent("chat:done");
  } catch (error) {
    if (controller.signal.aborted) {
      sendEvent("chat:cancelled");
    } else {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      sendEvent("chat:error", message);
    }
  } finally {
    activeChats.delete(requestId);
  }
});
ipcMain.handle("chat:cancel", (event, requestId: string) => {
  const chat = activeChats.get(requestId);

  if (!chat || chat.senderId !== event.sender.id) {
    return false;
  }

  chat.controller.abort();

  return true;
});
ipcMain.handle("room:start", async (event, topic: string, maxTurns: number) => {
  if (typeof topic !== "string" || !topic.trim()) {
    throw new Error("Укажите тему дискуссии");
  }

  if (!Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 50) {
    throw new Error("Количество ходов должно быть от 1 до 50");
  }

  const sender = event.sender;

  if (activeRooms.has(sender.id)) {
    throw new Error("Дискуссия уже запущена");
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("API-ключ не найден");
  }

  const controller = new AbortController();

  activeRooms.set(sender.id, controller);

  const sendEvent = (channel: string, ...args: unknown[]) => {
    if (!sender.isDestroyed()) {
      sender.send(channel, ...args);
    }
  };

  try {
    await runRoom({
      apiKey,
      agents: [agents[0], agents[1]],
      topic: topic.trim(),
      maxTurns,
      signal: controller.signal,
      onTurnStart: (agent, turn) => {
        sendEvent("room:turn-start", {
          agentId: agent.id,
          agentName: agent.name,
          turn,
        });
      },
      onChunk: (agent, chunk) => {
        sendEvent("room:chunk", {
          agentId: agent.id,
          chunk,
        });
      },
      onTurnEnd: (agent, content) => {
        sendEvent("room:turn-end", {
          agentId: agent.id,
          content,
        });
      },
    });

    sendEvent(controller.signal.aborted ? "room:cancelled" : "room:done");
  } catch (error) {
    if (controller.signal.aborted) {
      sendEvent("room:cancelled");
    } else {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";

      sendEvent("room:error", message);
    }
  } finally {
    activeRooms.delete(sender.id);
  }
});
ipcMain.handle("room:cancel", event => {
  const controller = activeRooms.get(event.sender.id);

  if (!controller) {
    return false;
  }

  controller.abort();

  return true;
});
