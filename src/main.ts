import path from "node:path";
import started from "electron-squirrel-startup";
import { app, BrowserWindow, ipcMain } from "electron";
import { deleteApiKey, hasApiKey, saveApiKey } from "@/services/api-key-storage";
import { validateApiKey } from "@/services/ai-api";

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
