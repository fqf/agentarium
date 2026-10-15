import type TChatMessage from "@/types/chat-message";

type TStreamChatOptions = {
  apiKey: string;
  messages: TChatMessage[];
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
};

const API_URL = "https://aiplatform.mosreg.ru/api/user-models/v1/chat/completions";

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3.8-27b-fp8",
      messages: [
        {
          role: "user",
          content: "Ответь одним словом: OK",
        },
      ],
      stream: false,
      max_tokens: 5,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("API-ключ недействителен или доступ запрещён");
  }

  if (!response.ok) {
    throw new Error(`Ошибка AI API: HTTP ${response.status}`);
  }

  return true;
};

export const streamChat = async ({ apiKey, messages, onChunk, signal }: TStreamChatOptions): Promise<void> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3.8-27b-fp8",
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Ошибка AI API: HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error("AI API не вернул поток данных");
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += value;

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";

      for (const event of events) {
        const data = event
          .split(/\r?\n/)
          .filter(line => line.startsWith("data:"))
          .map(line => line.slice(5).trimStart())
          .join("\n");

        if (!data || data === "[DONE]") {
          continue;
        }

        const payload = JSON.parse(data);

        if (payload.error) {
          throw new Error(
            typeof payload.error === "string" ? payload.error : (payload.error.message ?? "Ошибка генерации"),
          );
        }

        const content = payload.choices?.[0]?.delta?.content;

        if (typeof content === "string" && content.length > 0) {
          onChunk(content);
        }
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
};
