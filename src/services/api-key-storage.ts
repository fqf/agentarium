import { app, safeStorage } from "electron";
import fs from "node:fs";
import path from "node:path";

const getStoragePath = () => path.join(app.getPath("userData"), "credentials.json");

export const saveApiKey = (apiKey: string): void => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Безопасное хранилище недоступно");
  }

  const encrypted = safeStorage.encryptString(apiKey.trim());

  fs.writeFileSync(
    getStoragePath(),
    JSON.stringify({
      apiKey: encrypted.toString("base64"),
    }),
    { encoding: "utf8", mode: 0o600 },
  );
};

export const getApiKey = (): string | null => {
  const storagePath = getStoragePath();

  if (!fs.existsSync(storagePath)) {
    return null;
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Безопасное хранилище недоступно");
  }

  const data = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  const encrypted = Buffer.from(data.apiKey, "base64");

  return safeStorage.decryptString(encrypted);
};

export const hasApiKey = (): boolean => {
  return getApiKey() !== null;
};

export const deleteApiKey = (): void => {
  const storagePath = getStoragePath();

  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }
};
