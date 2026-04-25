import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

import ChatShell from "@/components/chat-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getStoredSettings } from "@/lib/app-settings";
import { chatSuggestions, getChatTitle, getModelLabel, modelOptions } from "@/lib/chat-data";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatRouteState = {
  model?: string;
  message?: string;
};

const createMessage = (role: Message["role"], content: string): Message => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
});

const buildPrompt = (messages: Message[]) =>
  messages
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n\n");

const ChatDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const routeState = (location.state as ChatRouteState | null) ?? null;
  const initialSettings = getStoredSettings();
  const initialModel = routeState?.model ?? initialSettings.defaultModel;

  const [model, setModel] = useState(initialModel);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bootstrapped = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const requestAssistantReply = async (conversation: Message[], selectedModel: string) => {
    setLoading(true);
    setError(null);

    try {
      const settings = getStoredSettings();
      const response = await fetch(`${settings.ollamaHost}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: buildPrompt(conversation),
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as { response?: string };
      const assistantReply =
        data.response?.trim() ||
        "Model bir yanit dondurmedi. Farkli bir istem veya model ile tekrar deneyebilirsin.";

      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", assistantReply),
      ]);
    } catch (requestError) {
      console.error("Ollama request failed:", requestError);
      const fallbackMessage =
        "Ollama sunucusuna ulasilamadi. Endpoint ayarini kontrol edip tekrar deneyebilirsin.";

      setError(fallbackMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", fallbackMessage),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent || loading) {
      return;
    }

    const userMessage = createMessage("user", trimmedContent);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");

    await requestAssistantReply(nextMessages, model);
  };

  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }

    bootstrapped.current = true;

    const initialMessage = routeState?.message?.trim();

    if (initialMessage) {
      const seededConversation = [createMessage("user", initialMessage)];
      setMessages(seededConversation);
      void requestAssistantReply(seededConversation, initialModel);
      return;
    }

    setMessages([
      createMessage(
        "assistant",
        "Merhaba. Yerel modelin hazir. Istedigin gorevi yaz, birlikte ilerleyelim.",
      ),
    ]);
  }, [initialModel, routeState?.message]);

  return (
    <ChatShell
      title={getChatTitle(id)}
      subtitle="Sidebarli, odakli ve koyu temali sohbet deneyimi. Mesajlari asagidaki composer uzerinden gonderebilirsin."
      currentChatId={id}
      contentClassName="flex-1 px-0 py-0 md:px-0 md:py-0"
      headerActions={
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="h-11 w-full rounded-2xl border-white/10 bg-white/4 text-white md:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="mx-auto flex h-[calc(100vh-241px)] w-full max-w-5xl flex-1 flex-col md:h-[calc(100vh-113px)]">
        <ScrollArea className="flex-1">
          <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" ? (
                  <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-200">
                    <Bot className="size-5" />
                  </div>
                ) : null}

                <div
                  className={cn(
                    "max-w-3xl rounded-3xl border px-5 py-4 text-[15px] leading-7 shadow-[0_24px_80px_-54px_rgba(0,0,0,0.9)]",
                    message.role === "assistant"
                      ? "border-white/8 bg-[#171717] text-zinc-100"
                      : "border-white/10 bg-[#2a2a2a] text-white",
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                    {message.role === "assistant" ? "Asistan" : "Sen"}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>

                {message.role === "user" ? (
                  <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-zinc-200">
                    <User className="size-5" />
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div className="flex gap-4">
                <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/14 text-emerald-200">
                  <Bot className="size-5" />
                </div>
                <Card className="w-fit rounded-3xl border-white/8 bg-[#171717] px-5 py-4 text-zinc-300">
                  <div className="flex gap-2">
                    <span className="size-2 rounded-full bg-emerald-300 animate-bounce" />
                    <span
                      className="size-2 rounded-full bg-emerald-300 animate-bounce"
                      style={{ animationDelay: "0.12s" }}
                    />
                    <span
                      className="size-2 rounded-full bg-emerald-300 animate-bounce"
                      style={{ animationDelay: "0.24s" }}
                    />
                  </div>
                </Card>
              </div>
            ) : null}

            {messages.length === 1 && messages[0]?.role === "assistant" ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {chatSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-3xl border border-white/8 bg-white/4 p-4 text-left transition hover:border-white/14 hover:bg-white/8"
                  >
                    <p className="text-sm font-medium text-white">{suggestion}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Hazir istem olarak kullan.</p>
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-white/8 bg-[#212121]/96 px-4 py-4 backdrop-blur md:px-8 md:py-6">
          <div className="rounded-[28px] border border-white/10 bg-[#171717] p-3 shadow-[0_24px_80px_-54px_rgba(0,0,0,0.95)]">
            <div className="mb-3 flex items-center justify-between gap-4 px-1">
              <div>
                <p className="text-sm font-medium text-white">{getModelLabel(model)}</p>
                <p className="text-xs text-zinc-500">
                  Enter ile gonder, Shift + Enter ile alt satir.
                </p>
              </div>
              {error ? <p className="text-xs text-amber-300">{error}</p> : null}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Mesajini yaz. Ornek: Bu projeye uygun bir release notu hazirla."
                className="min-h-24 rounded-3xl border-white/8 bg-black/20 px-4 py-4 text-base text-white placeholder:text-zinc-500"
              />

              <Button
                onClick={() => void sendMessage(input)}
                disabled={loading || !input.trim()}
                className="h-12 rounded-2xl bg-white px-5 text-zinc-950 hover:bg-zinc-200 md:min-w-[132px]"
              >
                <Send className="size-4" />
                Gonder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ChatShell>
  );
};

export default ChatDetail;
