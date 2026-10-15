import { streamChat } from "@/services/ai-api";
import type TChatMessage from "@/types/chat-message";
import TAgent from "@/types/agent";

type RoomOptions = {
  apiKey: string;
  agents: [TAgent, TAgent];
  topic: string;
  maxTurns: number;
  signal?: AbortSignal;
  onTurnStart: (agent: TAgent, turn: number) => void;
  onChunk: (agent: TAgent, chunk: string) => void;
  onTurnEnd: (agent: TAgent, content: string) => void;
};

export const runRoom = async ({
  apiKey,
  agents,
  topic,
  maxTurns,
  signal,
  onTurnStart,
  onChunk,
  onTurnEnd,
}: RoomOptions): Promise<void> => {
  const history: { agentId: string; content: string }[] = [];

  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal?.aborted) {
      break;
    }

    const agent = agents[turn % agents.length];
    const messages: TChatMessage[] = [
      {
        role: "system",
        content: agent.systemPrompt,
      },
      {
        role: "user",
        content: [
          `Тема дискуссии: ${topic}`,
          "",
          "История разговора:",
          ...history.map(entry => {
            const speaker = agents.find(item => item.id === entry.agentId);
            return `${speaker?.name ?? entry.agentId}: ${entry.content}`;
          }),
          "",
          "Теперь твоя очередь. Ответь собеседнику.",
        ].join("\n"),
      },
    ];
    let answer = "";

    onTurnStart(agent, turn + 1);

    await streamChat({
      apiKey,
      messages,
      signal,
      onChunk: chunk => {
        answer += chunk;
        onChunk(agent, chunk);
      },
    });

    if (signal?.aborted) {
      break;
    }

    history.push({
      agentId: agent.id,
      content: answer,
    });

    onTurnEnd(agent, answer);
  }
};
