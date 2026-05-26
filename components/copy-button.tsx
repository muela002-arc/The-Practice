"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy system prompt",
}: {
  value: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  const text =
    state === "copied"
      ? "Copied to clipboard"
      : state === "error"
        ? "Copy failed — select the text and copy manually"
        : label;

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      {text}
    </button>
  );
}
