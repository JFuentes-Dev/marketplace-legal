"use client";

import { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LegalChat } from "./LegalChat";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export function LegalAgentModal({
  open,
  onOpenChange,
  messages,
  setMessages,
  loading,
  setLoading,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      <div className="absolute bottom-6 right-6 w-[400px] max-w-[calc(100vw-2rem)]">
        <Card className="flex h-[700px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="font-semibold">Asistente Legal IA</h2>
              <p className="text-xs text-muted-foreground">
                Respuestas informativas basadas en legislación chilena
              </p>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 hover:bg-gray-100"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1">
            <LegalChat
              messages={messages}
              setMessages={setMessages}
              loading={loading}
              setLoading={setLoading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}