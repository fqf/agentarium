/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
declare module "*.css";
declare module "*.png" {
  const src: string;
  export default src;
}

interface Window {
  electronAPI: {
    closeWindow: () => void;
    saveApiKey: (apiKey: string) => Promise<boolean>;
    hasApiKey: () => Promise<boolean>;
    deleteApiKey: () => Promise<boolean>;
    openDashboard: () => Promise<boolean>;
  };
}
