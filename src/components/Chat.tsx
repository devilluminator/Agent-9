import { DotmHex4 } from "@/components/ui/dotm-hex-4";
import { Textarea } from "@/components/ui/textarea";
import useStore from "@/store";
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
// ---------- Weather tool ----------
const getWeather = tool(
  (input) => {
    if (
      ["sf", "san francisco", "san francisco ca"].includes(
        input.location.toLowerCase(),
      )
    ) {
      return "It's 60°F and foggy in San Francisco.";
    } else if (
      ["ny", "nyc", "new york"].includes(input.location.toLowerCase())
    ) {
      return "It's 75°F and sunny in New York.";
    } else {
      return `Weather info for ${input.location} is not available. Try San Francisco or New York.`;
    }
  },
  {
    name: "get_weather",
    description: "Get current weather for a given location.",
    schema: z.object({
      location: z.string().describe("City name (e.g., San Francisco, NY)"),
    }),
  },
);

type Message = {
  role: "user" | "assistant";
  content: string; // final content for user, streaming content for assistant
  reasoning?: string; // only for assistant messages
  isStreaming?: boolean; // flag to indicate incomplete message
};

function Chat() {
  // Store
  const { currentProvider } = useStore();
  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);


  // Create agents (stable refs)
  const agentRefOpenAI = useRef(
    createAgent({
      model: new ChatOpenAI({
        apiKey: currentProvider?.api_key || "key",
        model: currentProvider?.model,
        temperature: 0,
        streaming: true, // required for streamEvents token emission
        configuration: {
          baseURL: currentProvider?.base_url,
        },
      }),
      tools: [getWeather],
      systemPrompt:
        "You are a helpful assistant that can answer questions and call the weather tool when needed.",
    }),
  );

  const agentRefOllama = useRef(
    new ChatOllama({
      model: currentProvider?.model,
      baseUrl:
        currentProvider?.base_url?.split("/v1")[0] || "http://localhost:11434",
      temperature: 0,
    }),
  );

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <Its OK>
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [messages]);

  // Abort generation on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading && abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsLoading(false);
        // Mark the last assistant message as finished (stop streaming)
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.isStreaming) {
            lastMsg.isStreaming = false;
          }
          return updated;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  const handleSend = async () => {
    const userInput = inputRef.current?.value.trim();
    if (!userInput || isLoading) return;

    // Clear input
    if (inputRef.current) inputRef.current.value = "";

    // Add user message
    const userMessage: Message = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder assistant message for streaming
    const assistantPlaceholder: Message = {
      role: "assistant",
      content: "",
      reasoning: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);
    setIsLoading(true);

    // Create AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const isOllama = currentProvider?.provider_name === "ollama";
      // biome-ignore lint/suspicious/noExplicitAny: <its any btw>
      let eventStream: AsyncIterable<any>;

      if (!isOllama) {
        // OpenAI‑compatible agent (LangGraph)
        eventStream = agentRefOpenAI.current.streamEvents(
          { messages: [...messages, userMessage] }, // full history
          { version: "v2", signal: abortController.signal },
        );
      } else {
        // Ollama direct (no agent wrapper, just model streaming)
        eventStream = agentRefOllama.current.streamEvents(
          [new HumanMessage(userInput)],
          { version: "v2", signal: abortController.signal },
        );
      }

      let accumulatedContent = "";
      let accumulatedReasoning = "";

      for await (const event of eventStream) {
        if (event.event === "on_chat_model_stream") {
          const chunk = event.data?.chunk;
          if (!chunk) continue;

          // Extract reasoning (DeepSeek / OpenAI o‑series style)
          const reasoningToken =
            chunk?.additional_kwargs?.reasoning_content ||
            chunk?.response_metadata?.reasoning_content ||
            chunk?.metadata?.reasoning_content;
          // Extract normal content token
          const contentToken =
            typeof chunk?.content === "string" ? chunk.content : "";

          if (reasoningToken) {
            accumulatedReasoning += reasoningToken;
            // Update the last assistant message with reasoning
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                last.reasoning = accumulatedReasoning;
              }
              return updated;
            });
          }

          if (contentToken) {
            accumulatedContent += contentToken;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") {
                last.content = accumulatedContent;
              }
              return updated;
            });
          }
        }
      }

      // Mark streaming as finished
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant") {
          last.isStreaming = false;
        }
        return updated;
      });
      // biome-ignore lint/suspicious/noExplicitAny: <any btw>
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Generation cancelled");
      } else {
        console.error("Stream error:", error);
        setMessages((prev) => [
          ...prev.slice(0, -1), // remove placeholder
          {
            role: "assistant",
            content: "An error occurred while streaming.",
            isStreaming: false,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col justify-start items-center p-3 w-full h-full">
      <div className="flex justify-between items-start w-full h-full">
        <div className="w-1/5">left</div>

        <div className="flex flex-col justify-between items-center w-full max-w-9/12 h-full">
          {/* Scrollable message area */}
          <div
            className="bg-zinc-900/30 shadow-md shadow-slate-900 rounded-md w-full h-[calc(100vh-9rem)] overflow-y-auto custom-scrollbar"
            ref={scrollViewportRef}
          >
            <div className="flex flex-col gap-4 p-2">
              {messages.map((msg, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <index as key>
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`min-w-full p-3 rounded-lg ${msg.role === "user"
                      ? "bg-zinc-900/10 text-white/60"
                      : "bg-zinc-900/10 text-zinc-100"
                      }`}
                  >
                    {msg.role === "assistant" && (
                      <>
                        {/* Reasoning component */}
                        {msg.reasoning && (
                          <div className="bg-yellow-900/30 mb-2 p-2 rounded min-w-full font-mono text-yellow-200 text-sm italic">
                            <span className="font-bold">🧠 Thoughts:</span>
                            <div className="whitespace-pre-wrap">
                              {msg.reasoning}
                            </div>
                          </div>
                        )}
                        {/* Content component */}
                        <div className="whitespace-pre-wrap">
                          {msg.content ||
                            (msg.isStreaming ? (
                              <span>
                                <DotmHex4
                                  size={32}
                                  dotSize={4}
                                  speed={1.2}
                                  bloom
                                />
                                Thinking
                              </span>
                            ) : (
                              ""
                            ))}
                        </div>
                      </>
                    )}
                    {msg.role === "user" && <div>{msg.content}</div>}
                  </div>
                </div>
              ))}
              {isLoading && !messages[messages.length - 1]?.isStreaming && (
                <div className="self-start bg-zinc-800 p-3 rounded-lg text-zinc-100">
                  ⏳ Thinking...
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <Textarea
            ref={inputRef}
            onKeyDown={handleKeyDown}
            className="bg-zinc-900/30 shadow-lg shadow-slate-900 mt-auto border-0 min-h-18 text-zinc-100 resize-none"
            placeholder="Your prompt... (Press Enter to send, Esc to cancel)"
            disabled={isLoading}
            autoFocus={true}
          />
          {isLoading && (
            <div className="mt-1 text-zinc-400 text-xs">
              Press <kbd className="bg-zinc-700 px-1 rounded">Esc</kbd> to
              cancel generation
            </div>
          )}
        </div>

        <div className="w-1/5">right</div>
      </div>
    </div>
  );
}

export default Chat;
