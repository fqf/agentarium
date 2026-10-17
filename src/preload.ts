import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  maximizeWindow: () => ipcRenderer.send("window:maximize"),
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, value: boolean) => {
      callback(value);
    };

    ipcRenderer.on("window:maximized-changed", listener);

    return () => {
      ipcRenderer.removeListener("window:maximized-changed", listener);
    };
  },
  closeWindow: () => ipcRenderer.send("window:close"),
});
