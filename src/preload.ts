import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  maximizeWindow: () => ipcRenderer.send("window:maximize"),
  unmaximizeWindow: () => ipcRenderer.send("window:unmaximize"),
  isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke("window:is-maximized"),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const onMaximize = () => callback(true);
    const onUnmaximize = () => callback(false);

    ipcRenderer.on("window:maximized", onMaximize);
    ipcRenderer.on("window:unmaximized", onUnmaximize);

    return () => {
      ipcRenderer.removeListener("window:maximized", onMaximize);
      ipcRenderer.removeListener("window:unmaximized", onUnmaximize);
    };
  },
  closeWindow: () => ipcRenderer.send("window:close"),
  saveApiKey: (apiKey: string): Promise<boolean> => ipcRenderer.invoke("credentials:save", apiKey),
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke("credentials:exists"),
  deleteApiKey: (): Promise<boolean> => ipcRenderer.invoke("credentials:delete"),
  openDashboard: (): Promise<boolean> => ipcRenderer.invoke("window:dashboard"),
  startChat: (
    requestId: string,
    messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[],
  ): Promise<void> => ipcRenderer.invoke("chat:start", requestId, messages),
  cancelChat: (requestId: string): Promise<boolean> => ipcRenderer.invoke("chat:cancel", requestId),
  onChatChunk: (callback: (requestId: string, chunk: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, requestId: string, chunk: string) =>
      callback(requestId, chunk);
    ipcRenderer.on("chat:chunk", listener);
    return () => ipcRenderer.removeListener("chat:chunk", listener);
  },
  onChatDone: (callback: (requestId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, requestId: string) => callback(requestId);
    ipcRenderer.on("chat:done", listener);
    return () => ipcRenderer.removeListener("chat:done", listener);
  },
  onChatError: (callback: (requestId: string, message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, requestId: string, message: string) =>
      callback(requestId, message);
    ipcRenderer.on("chat:error", listener);
    return () => ipcRenderer.removeListener("chat:error", listener);
  },
  onChatCancelled: (callback: (requestId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, requestId: string) => callback(requestId);
    ipcRenderer.on("chat:cancelled", listener);
    return () => ipcRenderer.removeListener("chat:cancelled", listener);
  },
  startRoom: (topic: string, maxTurns: number): Promise<void> => ipcRenderer.invoke("room:start", topic, maxTurns),
  cancelRoom: (): Promise<boolean> => ipcRenderer.invoke("room:cancel"),
  onRoomTurnStart: (callback: (data: { agentId: string; agentName: string; turn: number }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: {
        agentId: string;
        agentName: string;
        turn: number;
      },
    ) => {
      callback(data);
    };
    ipcRenderer.on("room:turn-start", listener);
    return () => ipcRenderer.removeListener("room:turn-start", listener);
  },
  onRoomChunk: (callback: (data: { agentId: string; chunk: string }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: {
        agentId: string;
        chunk: string;
      },
    ) => callback(data);
    ipcRenderer.on("room:chunk", listener);
    return () => ipcRenderer.removeListener("room:chunk", listener);
  },
  onRoomTurnEnd: (callback: (data: { agentId: string; content: string }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: {
        agentId: string;
        content: string;
      },
    ) => callback(data);
    ipcRenderer.on("room:turn-end", listener);
    return () => ipcRenderer.removeListener("room:turn-end", listener);
  },
  onRoomDone: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("room:done", listener);
    return () => ipcRenderer.removeListener("room:done", listener);
  },
  onRoomCancelled: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("room:cancelled", listener);
    return () => ipcRenderer.removeListener("room:cancelled", listener);
  },
  onRoomError: (callback: (message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on("room:error", listener);
    return () => ipcRenderer.removeListener("room:error", listener);
  },
});
