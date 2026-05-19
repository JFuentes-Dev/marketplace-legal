"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-y-auto overflow-x-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export { ScrollArea };