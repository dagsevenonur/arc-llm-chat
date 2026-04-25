import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";

import ChatShell from "@/components/chat-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createChatId, modelOptions, chatSuggestions, getModelLabel } from "@/lib/chat-data";
import { getStoredSettings } from "@/lib/app-settings";

const Chat = () => {
  const navigate = useNavigate();
  const initialSettings = getStoredSettings();

  const [model, setModel] = useState(initialSettings.defaultModel);
  const [message, setMessage] = useState("");

  const startChat = (seedMessage = message) => {
    navigate(`/chat/${createChatId()}`, {
      state: {
        model,
        message: seedMessage.trim(),
      },
    });
  };

  return (
    <ChatShell
      title="Yeni sohbet"
      subtitle="ChatGPT benzeri giris alanindan modeli sec, istemini yaz ve ayni layout icinde yeni bir oturum baslat."
      headerActions={
        <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-2 text-sm text-zinc-300">
          Aktif model: <span className="font-medium text-white">{getModelLabel(model)}</span>
        </div>
      }
    >
      <div className="flex flex-1 flex-col justify-center">
        <Card className="border-white/10 bg-[#171717]/82 text-zinc-100 shadow-[0_40px_120px_-72px_rgba(0,0,0,0.95)]">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Sparkles className="size-3.5" />
              Hazir istem alanı
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Bir istemle basla
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-zinc-400">
                Tasarim, kod, belge veya arastirma fark etmeden sorunu yaz; secilen model ile
                yeni sohbet ekranina gecelim.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Model secimi</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-white">
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
                <p className="text-sm leading-6 text-zinc-500">
                  {modelOptions.find((option) => option.value === model)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Ilk mesaj</label>
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ornek: Bu repo icin modern bir AI chat onboarding akisi yaz."
                  className="min-h-36 rounded-3xl border-white/10 bg-black/20 px-4 py-4 text-base text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => startChat()}
                className="h-12 rounded-2xl bg-white px-5 text-zinc-950 hover:bg-zinc-200"
              >
                Sohbeti baslat
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage("")}
                className="h-12 rounded-2xl border-white/10 bg-white/4 px-5 text-white hover:bg-white/8"
              >
                Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {chatSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setMessage(suggestion)}
              className="rounded-3xl border border-white/8 bg-white/4 p-4 text-left transition hover:border-white/14 hover:bg-white/8"
            >
              <p className="text-sm font-medium text-white">{suggestion}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Tikla, duzenle ve sohbete gec.</p>
            </button>
          ))}
        </div>
      </div>
    </ChatShell>
  );
};

export default Chat;
