"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
}

export function ClassroomChat({ classroomId, classroomName }: { classroomId: string; classroomName: string }) {
  const [messages, setMessages] = React.useState<Message[]>([
    { id: "1", user: "Teacher", text: "Welcome to the class chat!", time: "10:00" },
    { id: "2", user: "Student", text: "Assalomu alaykum!", time: "10:01" },
  ]);
  const [input, setInput] = React.useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { id: Date.now().toString(), user: "You", text: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-xl overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40">
        <MessageCircle className="size-4 text-primary" />
        <span className="font-semibold text-sm">{classroomName} — Group Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.user === "You" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${msg.user === "You" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <div className="text-[10px] opacity-70 mb-0.5">{msg.user}</div>
              {msg.text}
              <div className="text-[10px] opacity-60 text-right mt-0.5">{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-3 border-t">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button size="icon" onClick={send}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
