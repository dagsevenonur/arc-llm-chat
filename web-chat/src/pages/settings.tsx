import { useState } from "react";
import { Check, RotateCcw, Settings2 } from "lucide-react";

import ChatShell from "@/components/chat-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { defaultSettings, getStoredSettings, saveSettings } from "@/lib/app-settings";
import { modelOptions, settingsHighlights } from "@/lib/chat-data";

const Settings = () => {
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <ChatShell
      title="Ayarlar"
      subtitle="Varsayilan model, Ollama host ve hizlandirma tercihlerini mevcut proje yapisini bozmadan buradan yonet."
      headerActions={
        saved ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            <Check className="size-4" />
            Ayarlar kaydedildi
          </div>
        ) : null
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-white/10 bg-[#171717]/82 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-white">Model ve baglanti</CardTitle>
              <CardDescription className="text-zinc-400">
                Sohbet acilisinda kullanilan temel tercihleri belirle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Varsayilan model</label>
                <Select
                  value={settings.defaultModel}
                  onValueChange={(value) =>
                    setSettings((currentSettings) => ({
                      ...currentSettings,
                      defaultModel: value,
                    }))
                  }
                >
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Ollama host</label>
                <Input
                  value={settings.ollamaHost}
                  onChange={(event) =>
                    setSettings((currentSettings) => ({
                      ...currentSettings,
                      ollamaHost: event.target.value,
                    }))
                  }
                  placeholder="http://localhost:11434"
                  className="h-12 rounded-2xl border-white/10 bg-black/20 px-4 text-white placeholder:text-zinc-500"
                />
                <p className="text-sm leading-6 text-zinc-500">
                  Yerel veya ag uzerindeki Ollama servis adresini kullanabilirsin.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#171717]/82 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-white">Hizlandirma tercihleri</CardTitle>
              <CardDescription className="text-zinc-400">
                Donanim desteklerini acip kapatarak varsayilan davranisi ayarla.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div>
                  <p className="font-medium text-white">Intel Arc GPU</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Cevap uretiminde GPU kullanimini tercih et.
                  </p>
                </div>
                <Switch
                  checked={settings.useGPU}
                  onCheckedChange={(checked) =>
                    setSettings((currentSettings) => ({
                      ...currentSettings,
                      useGPU: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div>
                  <p className="font-medium text-white">Intel NPU</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Desteklenen akislarda ek hizlandirma tercihi.
                  </p>
                </div>
                <Switch
                  checked={settings.useNPU}
                  onCheckedChange={(checked) =>
                    setSettings((currentSettings) => ({
                      ...currentSettings,
                      useNPU: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSave}
              className="h-12 rounded-2xl bg-white px-5 text-zinc-950 hover:bg-zinc-200"
            >
              Ayarlari kaydet
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-12 rounded-2xl border-white/10 bg-white/4 px-5 text-white hover:bg-white/8"
            >
              <RotateCcw className="size-4" />
              Varsayilanlara don
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-[#171717]/82 text-zinc-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings2 className="size-5 text-emerald-300" />
                Neler degisti?
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Tasarima uygun ayar kartlari ve kalici tercih yonetimi eklendi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {settingsHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/7 text-zinc-100">
                      <Icon className="size-5" />
                    </div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#171717]/82 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-white">Kayit davranisi</CardTitle>
              <CardDescription className="text-zinc-400">
                Tercihler tarayici tarafinda saklanir ve yeni sohbetlerde okunur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-zinc-400">
              <p>
                `Yeni sohbet` ekraninda secilen varsayilan model otomatik olarak gelir.
              </p>
              <p>
                `Chat details` ekranindaki istekler, burada tanimlanan Ollama endpoint adresini
                kullanir.
              </p>
              <p>
                Proje yapisi korunur; sadece mevcut sayfalar ortak bir sohbet shell'i altinda
                guncellenir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ChatShell>
  );
};

export default Settings;
