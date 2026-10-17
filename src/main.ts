import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundMaterial: "acrylic",
    backgroundColor: "#00000000",
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  mainWindow.removeMenu();

  const sendMaximizedState = () => {
    mainWindow.webContents.send("window:maximized-changed", mainWindow.isMaximized());
  };

  mainWindow.on("maximize", sendMaximizedState);
  mainWindow.on("unmaximize", sendMaximizedState);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL).then();
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)).then();
  }
};

ipcMain.on("window:minimize", event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});
ipcMain.on("window:maximize", event => {
  const window = BrowserWindow.fromWebContents(event.sender);

  if (window?.isMaximized()) {
    window.unmaximize();
  } else {
    window?.maximize();
  }
});
ipcMain.on("window:close", event => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

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
