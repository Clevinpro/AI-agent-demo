import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("chatApi", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends message payload and returns parsed response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ conversationId: "conv-123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { chatApi } = await import("./chatApi");
    const result = await chatApi.sendMessage({
      message: "Hello",
      conversationId: "conv-123",
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello",
        conversationId: "conv-123",
      }),
    });
    expect(result).toEqual({ conversationId: "conv-123" });
  });

  it("throws readable error when request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { chatApi } = await import("./chatApi");

    await expect(
      chatApi.sendMessage({
        message: "Hello",
        conversationId: "conv-123",
      }),
    ).rejects.toThrow("Chat request failed with status 500");
  });

  it("creates EventSource for chat stream endpoint", async () => {
    const eventSourceMock = vi.fn();
    class MockEventSource {
      close = vi.fn();

      constructor(url: string) {
        eventSourceMock(url);
      }
    }
    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);

    const { chatApi } = await import("./chatApi");

    chatApi.createStream("conv-123");

    expect(eventSourceMock).toHaveBeenCalledWith("http://localhost:4000/chat/stream");
  });
});
