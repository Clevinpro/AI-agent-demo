const CHAT_API_BASE_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? "http://localhost:4000";

const CHAT_POST_ENDPOINT = `${CHAT_API_BASE_URL}/chat`;
const CHAT_STREAM_ENDPOINT = `${CHAT_API_BASE_URL}/chat/stream`;

export type SendChatMessagePayload = {
  message: string;
  conversationId: string;
};

export type SendChatMessageResponse = {
  conversationId: string;
};

export const chatApi = {
  createStream(conversationId: string) {
    const params = new URLSearchParams({ conversationId });
    console.log("params", params)
    return new EventSource(`${CHAT_STREAM_ENDPOINT}?${params.toString()}`);
  },

  async sendMessage(
    payload: SendChatMessagePayload,
  ): Promise<SendChatMessageResponse> {
    const response = await fetch(CHAT_POST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const fallbackError = `Chat request failed with status ${response.status}`;
      throw new Error(fallbackError);
    }

    return (await response.json()) as SendChatMessageResponse;
  },
};
