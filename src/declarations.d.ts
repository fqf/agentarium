/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
declare module "*.css";

interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
  closeWindow: () => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
