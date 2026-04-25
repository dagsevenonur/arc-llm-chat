import {
  Bot,
  BrainCircuit,
  Cpu,
  type LucideIcon,
  PenSquare,
  Search,
  Settings2,
} from "lucide-react";

export type ModelOption = {
  value: string;
  label: string;
  description: string;
};

export type ChatHistoryItem = {
  id: string;
  title: string;
  preview: string;
  time: string;
  href: string;
};

export type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const modelOptions: ModelOption[] = [
  {
    value: "deepseek-r1:7b",
    label: "DeepSeek R1 (7B)",
    description: "Akil yurutme ve uzun cevaplar icin dengeli secenek.",
  },
  {
    value: "llama3.2:3b",
    label: "Llama 3.2 (3B)",
    description: "Hizli yanitlar ve dusuk kaynak tuketimi icin ideal.",
  },
  {
    value: "qwen2.5:7b",
    label: "Qwen 2.5 (7B)",
    description: "Kod ve genel amacli sohbetler icin guclu alternatif.",
  },
  {
    value: "gemma3:4b",
    label: "Gemma 3 (4B)",
    description: "Gundelik kullanim ve hafif gorevler icin kompakt model.",
  },
];

export const recentChats: ChatHistoryItem[] = [
  {
    id: "strategy-sync",
    title: "Urun stratejisi notlari",
    preview: "Bir haftalik lansman planini cikardik.",
    time: "12 dk once",
    href: "/chat/strategy-sync",
  },
  {
    id: "intel-arc-tuning",
    title: "Intel Arc optimizasyonu",
    preview: "Ollama ve IPEX-LLM ayarlari uzerinde calisiliyor.",
    time: "38 dk once",
    href: "/chat/intel-arc-tuning",
  },
  {
    id: "landing-copy",
    title: "Landing page metinleri",
    preview: "Hero, CTA ve sik sorulan sorular taslandi.",
    time: "Bugun",
    href: "/chat/landing-copy",
  },
  {
    id: "docker-help",
    title: "Docker compose yardimi",
    preview: "Port eslestirme ve volume sorunlari incelendi.",
    time: "Dun",
    href: "/chat/docker-help",
  },
];

export const homeFeatures: FeatureCard[] = [
  {
    title: "Hizli sohbet akisi",
    description: "Sidebar, yeni sohbet ve gecmis oturumlar tek yerde.",
    icon: PenSquare,
  },
  {
    title: "Yerel model kontrolu",
    description: "Model secimi ve Ollama host yonetimi arayuzun icinde.",
    icon: Cpu,
  },
  {
    title: "Arastirma odakli kullanim",
    description: "Fikir toplama, kod yardimi ve taslak cikarma icin uygun.",
    icon: Search,
  },
];

export const chatSuggestions = [
  "Bu repo icin onboarding dokumani hazirla.",
  "Intel Arc B580 icin performans ayarlarini ozetle.",
  "Bir SaaS ana sayfasi icin modern bir hero metni yaz.",
  "Docker uzerinde Ollama servisini test etmem icin adim listesi ver.",
];

export const settingsHighlights: FeatureCard[] = [
  {
    title: "Varsayilan model",
    description: "Yeni sohbetler acilirken otomatik secilen modeli yonet.",
    icon: BrainCircuit,
  },
  {
    title: "Sunucu baglantisi",
    description: "Yerel veya uzak Ollama endpoint adresini tanimla.",
    icon: Bot,
  },
  {
    title: "Sistem tercihleri",
    description: "GPU ve NPU kullanimi gibi tercihleri kaydet.",
    icon: Settings2,
  },
];

export const createChatId = () => `${Date.now()}`;

export const getModelLabel = (value: string) =>
  modelOptions.find((model) => model.value === value)?.label ?? value;

export const getChatTitle = (id?: string) =>
  recentChats.find((chat) => chat.id === id)?.title ??
  (id ? `Sohbet ${id.slice(-6)}` : "Yeni sohbet");
