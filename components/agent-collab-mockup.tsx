import { ArrowLeft, ArrowRight, Bot, CheckCircle2, User } from "lucide-react";

/**
 * Visual showing an AI agent and a human filling the same GudForm form —
 * one via MCP, one via the conversational UI.
 */
export function AgentCollabMockup() {
  return (
    <div className="w-full max-w-5xl">
      <div className="grid gap-3 md:grid-cols-[1fr,148px,1fr] md:items-stretch">
        {/* ── Left: AI Agent terminal ─────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
          {/* Title bar */}
          <div className="flex items-center border-b border-zinc-800 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-500/50" />
              <div className="size-2.5 rounded-full bg-yellow-500/50" />
              <div className="size-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="mx-auto flex items-center gap-1.5">
              <Bot className="size-3.5 text-green-500" />
              <span className="text-xs font-medium text-zinc-400">
                AI Agent
              </span>
            </div>
          </div>

          {/* Code block */}
          <div className="p-5 font-mono text-xs leading-relaxed">
            <span className="text-zinc-600">{"// Fill form via MCP"}</span>
            <br />
            <span className="text-purple-400">const</span>
            <span className="text-zinc-300"> result </span>
            <span className="text-zinc-500">= </span>
            <span className="text-purple-400">await</span>
            <span className="text-zinc-500"> mcp</span>
            <span className="text-zinc-300">.call(</span>
            <br />
            <span className="text-zinc-500">{"  "}</span>
            <span className="text-green-400">"gudform/submit"</span>
            <span className="text-zinc-300">, {"{"}</span>
            <br />
            <span className="text-zinc-500">{"    "}</span>
            <span className="text-blue-400">formId</span>
            <span className="text-zinc-500">: </span>
            <span className="text-green-400">"intake-form"</span>
            <span className="text-zinc-500">,</span>
            <br />
            <span className="text-zinc-500">{"    "}</span>
            <span className="text-blue-400">name</span>
            <span className="text-zinc-500">: </span>
            <span className="text-green-400">"Research Agent"</span>
            <span className="text-zinc-500">,</span>
            <br />
            <span className="text-zinc-500">{"    "}</span>
            <span className="text-blue-400">request</span>
            <span className="text-zinc-500">: </span>
            <span className="text-green-400">"Q4 analysis"</span>
            <br />
            <span className="text-zinc-300">{"  })"}</span>
            <br />
            <br />
            {/* Success badge */}
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
              <span className="text-green-400">Submitted via MCP</span>
            </div>
          </div>
        </div>

        {/* ── Center: protocol hub ─────────────────────────────────── */}
        <div className="flex flex-row items-center justify-center gap-2 md:flex-col md:justify-center md:gap-3">
          {/* Arrows (desktop only) */}
          <div className="hidden md:flex md:flex-col md:items-center md:gap-1 md:text-zinc-600">
            <ArrowLeft className="size-4 text-green-500/50" />
            <span className="text-[10px] text-zinc-600">both ways</span>
            <ArrowRight className="size-4 text-green-500/50" />
          </div>

          {/* Protocol badges */}
          <div className="flex flex-row gap-2 md:flex-col md:gap-2">
            {["MCP", "REST API", "Webhooks"].map((p) => (
              <span
                key={p}
                className="rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-center text-[11px] font-semibold text-green-600 dark:text-green-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: Human conversational form ───────────────────────── */}
        <div className="overflow-hidden rounded-2xl border bg-background shadow-lg">
          {/* Title bar */}
          <div className="flex items-center border-b bg-muted/30 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-400/50" />
              <div className="size-2.5 rounded-full bg-yellow-400/50" />
              <div className="size-2.5 rounded-full bg-green-400/50" />
            </div>
            <div className="mx-auto flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Human
              </span>
            </div>
          </div>

          {/* Form UI */}
          <div className="p-5">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">1 of 3</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-green-500 to-teal-500" />
              </div>
            </div>

            {/* Question */}
            <p className="mt-5 text-base font-semibold leading-snug">
              What do you need help with?
            </p>

            {/* Answer */}
            <div className="mt-4 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-foreground">
              Q4 revenue analysis
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-green-500 align-middle" />
            </div>

            {/* Button */}
            <button className="mt-4 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 px-4 py-2 text-sm font-medium text-white">
              Continue
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer label */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        One form · Two paths in · Same structured data out
      </p>
    </div>
  );
}
