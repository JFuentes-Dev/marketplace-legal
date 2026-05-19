"use client";

import { cn } from "@/lib/utils";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: Props) {
  return (
    <div
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
          role === "user"
            ? "bg-black text-white"
            : "bg-gray-100 text-black"
        )}
      >
        {content}
      </div>
    </div>
  );
}