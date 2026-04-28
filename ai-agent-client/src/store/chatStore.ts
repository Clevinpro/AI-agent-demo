"use client";

import { create } from "zustand";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  addUserMessage: (content: string) => void;
  createAssistantMessage: () => string;
  appendToMessage: (id: string, delta: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  loading: false,
  error: null,

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: createMessageId(),
          role: "user",
          content,
        },
      ],
    })),

  createAssistantMessage: () => {
    const id = createMessageId();

    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role: "assistant",
          content: "",
        },
      ],
    }));

    return id;
  },

  appendToMessage: (id, delta) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id
          ? { ...message, content: message.content + delta }
          : message,
      ),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      messages: [],
      loading: false,
      error: null,
    }),
}));
