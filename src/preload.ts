import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  closeWindow: () => ipcRenderer.send("window:close"),
  saveApiKey: (apiKey: string): Promise<boolean> => ipcRenderer.invoke("credentials:save", apiKey),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke("credentials:exists"),
  deleteApiKey: (): Promise<boolean> => ipcRenderer.invoke("credentials:delete"),
  openDashboard: (): Promise<boolean> => ipcRenderer.invoke("window:dashboard"),
});
