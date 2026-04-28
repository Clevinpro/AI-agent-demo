"use client";

import { useChat } from "@/src/hooks/useChat";
import { FormEvent, useState } from "react";

export function Chat() {
  const [inputValue, setInputValue] = useState("");
  const { messages, loading, error, sendMessage } = useChat();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentText = inputValue;
    setInputValue("");
    await sendMessage(currentText);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-semibold">Claude Chat</h1>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Start conversation by sending your first message.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${message.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-900"
                }`}
            >
              <p className="mb-1 text-[10px] uppercase opacity-70">
                {message.role}
              </p>
              <p>{message.content || (loading ? "..." : "")}</p>
            </div>
          ))
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Claude is typing..." : "Send"}
        </button>
      </form>
    </div>
  );
}
