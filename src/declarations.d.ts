/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import type TChatMessage from "@/types/chat-message";

declare global {
  interface Window {
    electronAPI: {
      maximizeWindow: () => void;
      unmaximizeWindow: () => void;
      isWindowMaximized: () => Promise<boolean>;
      onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
      closeWindow: () => void;
      openDashboard: () => Promise<boolean>;
      saveApiKey: (apiKey: string) => Promise<boolean>;
      hasApiKey: () => Promise<boolean>;
      deleteApiKey: () => Promise<boolean>;
      startChat: (requestId: string, messages: TChatMessage[]) => Promise<void>;
      cancelChat: (requestId: string) => Promise<boolean>;
      onChatChunk: (callback: (requestId: string, chunk: string) => void) => () => void;
      onChatDone: (callback: (requestId: string) => void) => () => void;
      onChatError: (callback: (requestId: string, message: string) => void) => () => void;
      onChatCancelled: (callback: (requestId: string) => void) => () => void;
      startRoom: (topic: string, maxTurns: number) => Promise<void>;
      cancelRoom: () => Promise<boolean>;
      onRoomTurnStart: (callback: (data: { agentId: string; agentName: string; turn: number }) => void) => () => void;
      onRoomChunk: (callback: (data: { agentId: string; chunk: string }) => void) => () => void;
      onRoomTurnEnd: (callback: (data: { agentId: string; content: string }) => void) => () => void;
      onRoomDone: (callback: () => void) => () => void;
      onRoomCancelled: (callback: () => void) => () => void;
      onRoomError: (callback: (message: string) => void) => () => void;
    };
  }
}
