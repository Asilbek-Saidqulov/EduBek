"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Trash2 } from "lucide-react";

type ChatMessage = {
  id: string;
  classroomId?: string;
  authorId: string;
  body: string | null;
  createdAt: string;
  deletedAt?: string | null;
  author?: { name?: string | null; username?: string | null };
};

type Props = {
  classroomId: string;
  classroomName: string;
  currentUserId: string;
  isTeacher: boolean;
};

const ERROR_TEXT: Record<string, string> = {
  not_found: "Bu sinf chatiga kirish huquqingiz yo'q",
  invalid_body: "Xabar bo'sh yoki 500 belgidan uzun",
  rate_limited: "Juda tez yozyapsiz, bir oz kuting",
};

export function ClassroomChat({ classroomId, classroomName, currentUserId, isTeacher }: Props) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/classrooms/${classroomId}/messages`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setMessages(d.messages || []);
        setNextCursor(d.nextCursor);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  React.useEffect(() => {
    const socket = io({
      path: "/api/socket/io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const join = () => {
      socket.emit("classroom:join", classroomId, (r: { error?: string }) => {
        if (r?.error) setError(ERROR_TEXT[r.error] ?? "Ulanishda xatolik");
      });
    };

    const onMessage = (msg: ChatMessage) => {
      if (msg.classroomId && msg.classroomId !== classroomId) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };

    const onDeleted = ({ id }: { id: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, body: null, deletedAt: new Date().toISOString() } : m))
      );
    };

    socket.on("connect", join);
    socket.on("classroom:message", onMessage);
    socket.on("classroom:deleted", onDeleted);
    if (socket.connected) join();

    return () => {
      socket.emit("classroom:leave", classroomId);
      socket.off("connect", join);
      socket.off("classroom:message", onMessage);
      socket.off("classroom:deleted", onDeleted);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classroomId]);

  const lastId = messages[messages.length - 1]?.id;
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lastId]);

  const loadOlder = async () => {
    if (!nextCursor) return;
    const r = await fetch(`/api/classrooms/${classroomId}/messages?cursor=${nextCursor}`, {
      credentials: "include",
    });
    if (!r.ok) return;
    const d = await r.json();
    setMessages((prev) => [
      ...d.messages.filter((m: ChatMessage) => !prev.some((p) => p.id === m.id)),
      ...prev,
    ]);
    setNextCursor(d.nextCursor);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("classroom:send", { classroomId, body: text }, (r: { error?: string }) => {
      if (r?.error) {
        setError(ERROR_TEXT[r.error] ?? "Yuborilmadi");
        return;
      }
      setError(null);
      setInput("");
    });
  };

  const remove = (messageId: string) => {
    socketRef.current?.emit("classroom:delete", { messageId }, (r: { error?: string }) => {
      if (r?.error) setError(ERROR_TEXT[r.error] ?? "O'chirilmadi");
    });
  };

  return (
    <div className="flex flex-col h-[420px] border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
        <MessageCircle className="size-4 text-primary" />
        <span className="font-semibold text-sm">{classroomName} — sinf chati</span>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {nextCursor && (
          <div className="text-center">
            <Button size="sm" variant="ghost" onClick={loadOlder}>
              Oldingi xabarlar
            </Button>
          </div>
        )}

        {status === "loading" && <p className="text-xs text-muted-foreground">Yuklanmoqda...</p>}
        {status === "error" && <p className="text-xs text-destructive">Xabarlarni yuklab bo'lmadi</p>}

        {messages.map((msg) => {
          const own = msg.authorId === currentUserId;
          const canDelete = !msg.deletedAt && (own || isTeacher);
          const name = own ? "Siz" : msg.author?.name || msg.author?.username || "Ishtirokchi";
          return (
            <div key={msg.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div className="text-[10px] opacity-70 mb-0.5">{name}</div>
                {msg.deletedAt ? <span className="italic opacity-70">Xabar o'chirildi</span> : msg.body}
                <div className="flex items-center justify-end gap-2 text-[10px] opacity-60 mt-0.5">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {canDelete && (
                    <button onClick={() => remove(msg.id)} aria-label="O'chirish">
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="px-3 text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 p-3 border-t">
        <Input
          placeholder="Xabar yozing..."
          value={input}
          maxLength={500}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button size="icon" onClick={send} aria-label="Yuborish">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
