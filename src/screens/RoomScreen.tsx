import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { FaceNeutral, FaceSlightlySmiling, LoaderCircle, MessageCircle, Play, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type RoomMessage = {
  turn: number;
  agentId: string;
  agentName: string;
  content: string;
};
type RoomStatus = "idle" | "running" | "done" | "cancelled" | "error";

const RoomScreen: FC = () => {
  const [topic, setTopic] = useState("");
  const [maxTurns, setMaxTurns] = useState(10);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);
  const isRunning = status === "running";
  const startRoom = () => {
    if (runningRef.current || !topic.trim()) {
      return;
    }

    runningRef.current = true;
    setMessages([]);
    setError(null);
    setStatus("running");

    window.electronAPI.startRoom(topic.trim(), maxTurns).catch(err => {
      runningRef.current = false;
      setError(err instanceof Error ? err.message : "Ошибка запуска комнаты");
      setStatus("error");
    });
  };
  const cancelRoom = () => {
    void window.electronAPI.cancelRoom().catch(err => {
      setError(err instanceof Error ? err.message : "Ошибка остановки комнаты");
    });
  };

  useEffect(() => {
    const unsubscribeStart = window.electronAPI.onRoomTurnStart(data => {
      setMessages(prev => [
        ...prev,
        {
          turn: data.turn,
          agentId: data.agentId,
          agentName: data.agentName,
          content: "",
        },
      ]);
    });
    const unsubscribeChunk = window.electronAPI.onRoomChunk(data => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last?.agentId === data.agentId) {
          updated[updated.length - 1] = {
            ...last,
            content: last.content + data.chunk,
          };
        }

        return updated;
      });
    });
    const unsubscribeEnd = window.electronAPI.onRoomTurnEnd(data => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last?.agentId === data.agentId) {
          updated[updated.length - 1] = {
            ...last,
            content: data.content,
          };
        }

        return updated;
      });
    });
    const finish = (nextStatus: RoomStatus) => {
      runningRef.current = false;
      setStatus(nextStatus);
    };
    const unsubscribeDone = window.electronAPI.onRoomDone(() => {
      finish("done");
    });
    const unsubscribeCancelled = window.electronAPI.onRoomCancelled(() => {
      finish("cancelled");
    });
    const unsubscribeError = window.electronAPI.onRoomError(message => {
      setError(message);
      finish("error");
    });

    return () => {
      unsubscribeStart();
      unsubscribeChunk();
      unsubscribeEnd();
      unsubscribeDone();
      unsubscribeCancelled();
      unsubscribeError();
    };
  }, []);
  useEffect(() => {
    const container = scrollRef.current;

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div ref={scrollRef} className="min-h-0 flex flex-col flex-1 items-center overflow-y-auto">
        <div className="flex flex-1 w-full max-w-4xl flex-col gap-4 px-6 py-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <MessageCircle className="size-10 opacity-50" />
              <p className="text-sm">Запустите комнату, чтобы наблюдать разговор агентов</p>
            </div>
          ) : (
            messages.map(message => {
              const isOptimist = message.agentId === "optimist";
              const cleanedContent = message.content.replace(/^(?:[ \t]*\r?\n)+/, "");

              return (
                <div key={message.turn} className={`flex w-full ${isOptimist ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[60%] flex-col ${isOptimist ? "items-end" : "items-start"}`}>
                    <div className="flex flex-row items-center gap-1.5 mb-1 px-1 text-xs text-muted-foreground">
                      {isOptimist ? <FaceSlightlySmiling size={16} /> : <FaceNeutral size={16} />}
                      {message.agentName} · Ход {message.turn}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-5 whitespace-pre-wrap break-words shadow-sm ${
                        isOptimist
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-muted text-foreground"
                      }`}>
                      {cleanedContent ||
                        (isRunning && message.turn === messages.length ? (
                          <span className="inline-flex items-center gap-2 text-sm opacity-80">
                            <LoaderCircle className="size-4 animate-spin" />
                            Думает...
                          </span>
                        ) : null)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex flex-col items-center shrink-0 border-t bg-background py-5">
        <div className="flex flex-col items-center w-full max-w-4xl gap-3 px-6">
          <label className="text-xs font-medium text-muted-foreground">Тема обсуждения</label>
          <Textarea
            value={topic}
            onChange={event => setTopic(event.target.value)}
            disabled={isRunning}
            rows={2}
            placeholder="О чём будут говорить агенты?"
            className="w-full resize-none"
          />
          <div className="flex flex-1 w-full items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Количество ходов
              <Input
                type="number"
                min={1}
                max={50}
                value={maxTurns}
                disabled={isRunning}
                onChange={event => setMaxTurns(Number(event.target.value))}
                className="w-16 text-center"
              />
            </label>
            {isRunning ? (
              <button
                type="button"
                onClick={cancelRoom}
                className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
                <Square className="size-4" />
                Остановить
              </button>
            ) : (
              <button
                type="button"
                onClick={startRoom}
                disabled={!topic.trim() || maxTurns < 1 || maxTurns > 50}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
                <Play className="size-4" />
                Начать дискуссию
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomScreen;
