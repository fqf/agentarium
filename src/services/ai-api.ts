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
