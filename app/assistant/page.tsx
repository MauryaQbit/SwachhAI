"use client";

import { useState } from "react";
import { Button, Card, Eyebrow, Shell } from "@/components/ui";
import { PageShell } from "@/components/layout";

interface Msg { role: "user" | "assistant"; text: string }

const SUGGESTIONS = [
  "Which area needs the most attention?",
  "What type of waste appears most frequently?",
  "How many critical reports are there?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Namaste — I'm the desk assistant for this ward's waste data. I answer only from filed reports, and I'll say so plainly when the data can't support an answer." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: data.answer ?? data.message ?? "Sorry, try again." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Assistant is temporarily unavailable. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <Shell>
        <Eyebrow>Ask the register</Eyebrow>
        <h1 className="font-display mt-2 text-3xl font-black sm:text-4xl">Waste desk assistant</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Grounded in filed reports — counts it can show, silence where it can&apos;t.
          If the register is thin, it will tell you.
        </p>
        <Card className="mt-5">
          <div className="space-y-3" role="log" aria-live="polite" aria-label="Conversation">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-3xl rounded-lg rounded-br-none border-2 border-ink bg-leaf-950 p-3 text-sm font-medium text-paper"
                    : "max-w-3xl rounded-lg rounded-bl-none border-2 border-line bg-paper p-3 text-sm leading-relaxed"
                }
              >
                {m.role === "assistant" ? (
                  <p className="mb-1 font-mono text-[10px] tracking-[0.18em] text-ink-faint uppercase">Desk</p>
                ) : null}
                {m.text}
              </div>
            ))}
            {loading ? <p className="font-mono text-[13px] text-ink-faint">Checking the register…</p> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            {SUGGESTIONS.map((sg) => (
              <button
                key={sg}
                onClick={() => ask(sg)}
                className="rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-xs font-bold hover:bg-parchment"
              >
                {sg}
              </button>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <label htmlFor="assistant-input" className="sr-only">Ask about waste intelligence</label>
            <input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Which ward needs a crew first?"
              className="min-w-0 flex-1 rounded-lg border-2 border-ink bg-paper p-2.5 text-sm placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-leaf-700"
            />
            <Button type="submit" disabled={loading || !input.trim()}>Ask</Button>
          </form>
        </Card>
      </Shell>
    </PageShell>
  );
}
