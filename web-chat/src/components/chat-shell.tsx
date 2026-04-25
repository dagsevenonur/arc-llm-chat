import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, PenSquare, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { recentChats } from "@/lib/chat-data";

type ChatShellProps = {
  title: string;
  subtitle?: string;
  currentChatId?: string;
  headerActions?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
};

const sidebarLinkClass = (active: boolean) =>
  cn(
    "h-auto w-full justify-start rounded-2xl border border-transparent px-3 py-3 text-left text-zinc-400 hover:border-white/8 hover:bg-white/6 hover:text-white",
    active && "border-white/10 bg-white/10 text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)]",
  );

function ChatShell({
  title,
  subtitle,
  currentChatId,
  headerActions,
  contentClassName,
  children,
}: ChatShellProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#111111] text-zinc-100">
      <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/8 bg-[#171717] md:border-r md:border-b-0">
          <div className="border-b border-white/8 p-3">
            <Link
              to="/"
              className="mb-3 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-3 py-3 transition hover:border-white/12 hover:bg-white/6"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/16 text-emerald-300">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">arc-llm-chat</p>
                <p className="text-xs text-zinc-400">Yerel yapay zeka asistani</p>
              </div>
            </Link>

            <Button
              asChild
              className="h-11 w-full justify-start rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200"
            >
              <Link to="/chat">
                <PenSquare className="size-4" />
                Yeni sohbet
              </Link>
            </Button>
          </div>

          <div className="space-y-2 border-b border-white/8 p-3">
            <Button asChild variant="ghost" className={sidebarLinkClass(location.pathname === "/")}>
              <Link to="/">
                <Home className="size-4" />
                Ana sayfa
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className={sidebarLinkClass(location.pathname.startsWith("/settings"))}
            >
              <Link to="/settings">
                <Settings2 className="size-4" />
                Ayarlar
              </Link>
            </Button>
          </div>

          <div className="px-3 pb-2 pt-3">
            <p className="px-2 text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
              Son sohbetler
            </p>
          </div>

          <ScrollArea className="h-[260px] px-2 md:h-[calc(100vh-290px)]">
            <div className="space-y-1.5 pb-4">
              {recentChats.map((chat) => {
                const isActive =
                  currentChatId === chat.id || location.pathname === chat.href;

                return (
                  <Button
                    key={chat.id}
                    asChild
                    variant="ghost"
                    className={sidebarLinkClass(isActive)}
                  >
                    <Link to={chat.href}>
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/6 text-zinc-300">
                          <MessageSquare className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-inherit">{chat.title}</p>
                          <p className="truncate text-xs text-zinc-500">{chat.preview}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-zinc-500">{chat.time}</span>
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t border-white/8 p-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3">
              <p className="text-sm font-medium text-emerald-200">Hazir baglanti durumu</p>
              <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                Yeni tasarim, `pages` yapisini koruyarak sohbet deneyimini tek kabukta toplar.
              </p>
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.08),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_24%),#212121]">
          <div className="sticky top-0 z-20 border-b border-white/8 bg-[#212121]/88 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-300/75">
                  AI Chat Workspace
                </p>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-1 max-w-2xl text-sm text-zinc-400">{subtitle}</p>
                  ) : null}
                </div>
              </div>

              {headerActions ? (
                <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
              ) : null}
            </div>
          </div>

          <main className={cn("mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:px-8 md:py-8", contentClassName)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default ChatShell;
