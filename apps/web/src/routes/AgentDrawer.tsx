import { useState, useRef, useEffect } from "react";
import { authenticatedFetch } from "../lib/api";
import { Sparkles, X, Send, Loader2, User, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string | null;
}

export function AgentDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    
    const updatedHistory: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const data = await authenticatedFetch("/agent/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userText,
          history: messages.filter((m) => m.content !== null),
        }),
      });

      setMessages(data.updatedHistory);
    } catch (err) {
      console.error("Agent gateway sync interrupted:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I ran into a connection glitch talking to our system controllers. Let's try that prompt again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Badge Bottom Right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        <span>Ask Kumpas AI</span>
      </button>

      {/* Slide-out Backdrop Sheet Container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/40 backdrop-blur-sm">
          <section className="flex h-full w-full flex-col border-l border-border bg-surface shadow-2xl sm:max-w-md">
            
            {/* Drawer Header Block */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-medium tracking-tight">Kumpas Companion Agent</h3>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Autonomous Account System Layer</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message Stream Segment */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/20">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-xs text-muted-foreground max-w-[240px] mx-auto space-y-2">
                  <Bot className="h-6 w-6 opacity-60 text-primary" />
                  <p className="font-medium text-foreground">Hi! I am directly integrated with your wallet stack.</p>
                  <p>Try saying things like:</p>
                  <div className="w-full space-y-1 pt-2 font-mono text-[10px] text-left">
                    <div className="bg-surface border border-border rounded-md px-2 py-1 text-muted-foreground">"Check my current runway health"</div>
                    <div className="bg-surface border border-border rounded-md px-2 py-1 text-muted-foreground">"Can I afford a ₱1,200 mouse?"</div>
                    <div className="bg-surface border border-border rounded-md px-2 py-1 text-muted-foreground">"Log ₱150 for lunch under FOOD"</div>
                  </div>
                </div>
              )}

              {/* Loop Messages Map */}
              {messages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={index} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-surface border border-border text-foreground rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                      {isUser && (
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Waiting Intermittent Loader Bubble */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-surface border border-border text-muted-foreground rounded-2xl rounded-tl-none px-4 py-2.5 text-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Agent is thinking and executing tool operations...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Action Form Footer */}
            <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-surface flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to simulate shocks or write ledger rows..."
                disabled={loading}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

          </section>
        </div>
      )}
    </>
  );
}