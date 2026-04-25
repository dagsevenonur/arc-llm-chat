import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cpu, Sparkles } from "lucide-react";

import ChatShell from "@/components/chat-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModelLabel, homeFeatures, recentChats } from "@/lib/chat-data";
import { getStoredSettings } from "@/lib/app-settings";

const Home = () => {
  const settings = useMemo(() => getStoredSettings(), []);

  return (
    <ChatShell
      title="Merkezi sohbet calisma alani"
      subtitle="ChatGPT benzeri bir akisla yeni oturum baslat, son konusmalara don ve model tercihlerini tek yerden yonet."
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <Card className="border-white/10 bg-[#171717]/82 text-zinc-100 shadow-[0_40px_120px_-72px_rgba(0,0,0,0.95)]">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Sparkles className="size-3.5" />
              Hazir AI sohbet deneyimi
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Bugun ne uretmek istiyorsun?
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-zinc-400">
                Bu arayuz yerel modellerle calisan, sidebar odakli bir AI chat deneyimi sunar.
                Yeni bir sohbet acabilir, devam eden gorusmeleri takip edebilir ve sistem
                ayarlarini bozmadan ayni proje yapisi icinde ilerleyebilirsin.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-2xl bg-white px-5 text-zinc-950 hover:bg-zinc-200"
              >
                <Link to="/chat">
                  Yeni sohbet baslat
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-2xl border-white/10 bg-white/4 px-5 text-white hover:bg-white/8"
              >
                <Link to="/settings">Ayarlar</Link>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {homeFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-3xl border border-white/8 bg-white/4 p-4"
                  >
                    <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/7 text-zinc-100">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-[#171717]/82 text-zinc-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cpu className="size-5 text-emerald-300" />
                Aktif yapilandirma
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Yeni oturumlar bu varsayilan ayarlarla aciliyor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Varsayilan model</p>
                <p className="mt-2 text-base font-medium text-white">
                  {getModelLabel(settings.defaultModel)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Ollama endpoint</p>
                <p className="mt-2 break-all text-sm text-zinc-300">{settings.ollamaHost}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">GPU</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {settings.useGPU ? "Acik" : "Kapali"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">NPU</p>
                  <p className="mt-2 text-base font-medium text-white">
                    {settings.useNPU ? "Acik" : "Kapali"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#171717]/82 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-white">Son acilan sohbetler</CardTitle>
              <CardDescription className="text-zinc-400">
                Sidebar ile senkron giden hizli erisim listesi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentChats.slice(0, 3).map((chat) => (
                <Link
                  key={chat.id}
                  to={chat.href}
                  className="block rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/14 hover:bg-white/6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{chat.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">{chat.preview}</p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">{chat.time}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ChatShell>
  );
};

export default Home;
