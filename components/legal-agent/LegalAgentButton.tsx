"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { LegalAgentModal } from "./LegalAgentModal";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function LegalAgentButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          flex h-14 w-14 items-center justify-center
          rounded-full
          bg-black text-white
          shadow-xl
          transition hover:scale-105
        "
        aria-label="Abrir asistente legal IA"
      >
        <Scale className="h-6 w-6" />
      </button>

      <LegalAgentModal
        open={open}
        onOpenChange={setOpen}
        messages={messages}
        setMessages={setMessages}
        loading={loading}
        setLoading={setLoading}
      />
    </>
  );
}