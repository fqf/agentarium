import type { FC, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, LoaderCircle, Square } from "lucide-react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import type TChatMessage from "@/types/chat-message";

const ChatScreen: FC = () => {
  const [messages, setMessages] = useState<TChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const messagesRef = useRef<TChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = () => {
    const content = input.trim();

    if (!content || isGenerating) return;

    const requestId = crypto.randomUUID();
    const userMessage: TChatMessage = { role: "user", content };
    const assistantMessage: TChatMessage = {
      role: "assistant",
      content: "",
    };

    const history = [...messagesRef.current, userMessage];

    messagesRef.current = [...history, assistantMessage];
    requestIdRef.current = requestId;

    setMessages([...history, assistantMessage]);
    setInput("");
    setError(null);
    setIsGenerating(true);

    window.electronAPI.startChat(requestId, history).catch(err => {
      if (requestIdRef.current !== requestId) return;

      setError(err instanceof Error ? err.message : "Ошибка отправки");
      requestIdRef.current = null;
      setIsGenerating(false);
    });
  };
  const cancelGeneration = () => {
    if (requestIdRef.current) {
      void window.electronAPI.cancelChat(requestIdRef.current);
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const unsubscribeChunk = window.electronAPI.onChatChunk((requestId, chunk) => {
      if (requestId !== requestIdRef.current) return;

      const updated = [...messagesRef.current];
      const last = updated[updated.length - 1];

      if (last?.role === "assistant") {
        const content = last.content + chunk;

        updated[updated.length - 1] = {
          ...last,
          content: content.replace(/^(?:[ \t]*\r?\n)+/, ""),
        };
      }

      messagesRef.current = updated;
      setMessages(updated);
    });
    const finish = (requestId: string) => {
      if (requestId !== requestIdRef.current) return;

      requestIdRef.current = null;
      setIsGenerating(false);
    };
    const unsubscribeDone = window.electronAPI.onChatDone(finish);
    const unsubscribeCancelled = window.electronAPI.onChatCancelled(finish);
    const unsubscribeError = window.electronAPI.onChatError((requestId, message) => {
      if (requestId !== requestIdRef.current) return;

      setError(message);
      finish(requestId);
    });

    return () => {
      unsubscribeChunk();
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
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl border bg-muted/40">
                <Bot className="size-8 text-foreground" />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Добро пожаловать в Agentarium</h1>
                <p className="text-sm text-muted-foreground">Начните разговор с вашим AI-ассистентом</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {messages.map((message, index) => {
                const isUser = message.role === "user";
                const isLast = index === messages.length - 1;

                if (isUser) {
                  return (
                    <div key={index} className="flex justify-end">
                      <Bubble align="end" variant="tinted">
                        <BubbleContent className="rounded-br-sm">{message.content}</BubbleContent>
                      </Bubble>
                    </div>
                  );
                }

                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                      <Bot className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2 pt-1">
                      <div className="text-xs font-semibold text-muted-foreground">Agentarium</div>
                      <div className="whitespace-pre-wrap break-words text-sm leading-7">
                        {message.content ? (
                          message.content
                        ) : isGenerating && isLast ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" />
                            <span>Думаю...</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 bg-background px-6 pb-5 pt-3">
        <div className="mx-auto w-full max-w-3xl">
          {error && (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm transition-colors focus-within:border-ring/50">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спросите что-нибудь..."
              rows={1}
              disabled={isGenerating}
              className="block max-h-50 min-h-10 w-full resize-none overflow-y-auto bg-transparent p-0 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
            <div className="flex items-center justify-end pt-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={cancelGeneration}
                  aria-label="Остановить генерацию"
                  title="Остановить генерацию"
                  className="flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80">
                  <Square className="size-3 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  aria-label="Отправить сообщение"
                  title="Отправить сообщение"
                  className="flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30">
                  <ArrowUp className="size-5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground/70">
            Enter — отправить · Shift + Enter — новая строка
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
