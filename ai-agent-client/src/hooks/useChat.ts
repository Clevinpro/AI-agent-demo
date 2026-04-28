"use client";

import { chatApi } from "@/src/lib/api/chatApi";
import { useChatStore } from "@/src/store/chatStore";
import { useCallback, useRef } from "react";

type ParsedStreamEvent = {
  done: boolean;
  delta: string;
};

const parseStreamEvent = (rawData: string): ParsedStreamEvent => {
  if (!rawData) {
    return { done: false, delta: "" };
  }

  if (rawData === "[DONE]") {
    return { done: true, delta: "" };
  }

  try {
    const parsed = JSON.parse(rawData) as {
      done?: boolean;
      type?: string;
      delta?: string;
      text?: string;
      content?: string;
    };

    if (parsed.done || parsed.type === "done") {
      return { done: true, delta: "" };
    }

    // TODO: Align this parser with exact backend SSE payload format.
    return {
      done: false,
      delta: parsed.delta ?? parsed.text ?? parsed.content ?? "",
    };
  } catch {
    return { done: false, delta: rawData };
  }
};

export function useChat() {
  const {
    messages,
    loading,
    error,
    addUserMessage,
    createAssistantMessage,
    appendToMessage,
    setLoading,
    setError,
  } = useChatStore();

  const assistantMessageIdRef = useRef<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const conversationIdRef = useRef<string>(crypto.randomUUID());

  const sendMessage = useCallback(
    async (rawText: string) => {
      const message = rawText.trim();
      if (!message) {
        return;
      }

      addUserMessage(message);
      setError(null);
      setLoading(true);
      assistantMessageIdRef.current = null;

      if (!assistantMessageIdRef.current) {
        assistantMessageIdRef.current = createAssistantMessage();
      }

      try {
        const response = await chatApi.sendMessage({
          message,
          conversationId: conversationIdRef.current,
        });

        streamRef.current?.close();

        console.log("response", response)
        const stream = chatApi.createStream(response.conversationId);
        console.log("stream", stream)
        streamRef.current = stream;

        stream.onmessage = (event) => {
          const { done, delta } = parseStreamEvent(event.data);

          if (done) {
            setLoading(false);
            assistantMessageIdRef.current = null;
            stream.close();
            return;
          }

          if (!delta) {
            return;
          }

          if (!assistantMessageIdRef.current) {
            assistantMessageIdRef.current = createAssistantMessage();
          }

          appendToMessage(assistantMessageIdRef.current, delta);
        };

        stream.onerror = () => {
          setLoading(false);
          setError("SSE connection error. Please refresh and try again.");
          stream.close();
        };
      } catch (requestError) {
        setLoading(false);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to send message.",
        );
      }
    },
    [addUserMessage, createAssistantMessage, appendToMessage, setError, setLoading],
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}
