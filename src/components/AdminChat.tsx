import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Trash2, Bot, User as UserIcon, Wrench } from "lucide-react";

const STORAGE_KEY = "admin-chat-messages-v1";

const SUGGESTIONS = [
  "Sa kandidatë kam gjithsej?",
  "Trego të hyrat e këtij muaji.",
  "Cilët kandidatë kanë borxh?",
  "Regjistrimet e reja online.",
];

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

const AdminChat = () => {
  const [token, setToken] = useState<string | null>(null);
  const [initialMessages] = useState<UIMessage[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setToken(s?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const transport = token
    ? new DefaultChatTransport({
        api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat`,
        headers: { Authorization: `Bearer ${token}` },
      })
    : undefined;

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: "admin-chat",
    messages: initialMessages,
    transport: transport as any,
  });

  // Persist
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Focus composer
  useEffect(() => {
    if (status !== "streaming") textareaRef.current?.focus();
  }, [status]);

  const isBusy = status === "submitted" || status === "streaming";

  const send = async () => {
    const text = input.trim();
    if (!text || isBusy || !token) return;
    setInput("");
    await sendMessage({ text });
  };

  const clear = () => {
    setMessages([]);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="w-4 h-4 text-primary" />
          Asistenti i autoshkollës
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} className="text-xs">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Pastro
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border bg-background/40 p-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Pyet mbi të dhënat e autoshkollës</h3>
              <p className="text-sm text-muted-foreground">Kandidatët, pagesat, mjetet, regjistrimet — të gjitha në shqip.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "user";
          const text = (m.parts ?? []).map((p: any) => (p.type === "text" ? p.text : "")).join("");
          const toolParts = (m.parts ?? []).filter((p: any) => p.type?.startsWith("tool-"));
          return (
            <div key={m.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                isUser ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {toolParts.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs opacity-70 mb-1">
                    <Wrench className="w-3 h-3" />
                    <span>{String(p.type).replace("tool-", "")}</span>
                    {p.state === "input-streaming" || p.state === "input-available" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : null}
                  </div>
                ))}
                {text ? (
                  isUser ? (
                    <div className="whitespace-pre-wrap">{text}</div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  )
                ) : null}
              </div>
              {isUser && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Duke menduar…
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive text-center">
            Gabim: {error.message}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Shkruaj një pyetje…"
          rows={2}
          disabled={!token || isBusy}
          className="resize-none"
        />
        <Button onClick={send} disabled={!input.trim() || isBusy || !token} size="icon" className="h-auto">
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default AdminChat;
