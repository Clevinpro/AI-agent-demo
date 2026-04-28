import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Chat } from "./Chat";
import type { ChatMessage } from "@/src/store/chatStore";

const sendMessageMock = vi.fn();

const mockedState: {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
} = {
  messages: [],
  loading: false,
  error: null,
};

vi.mock("@/src/hooks/useChat", () => ({
  useChat: () => ({
    ...mockedState,
    sendMessage: sendMessageMock,
  }),
}));

describe("Chat", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    mockedState.messages = [];
    mockedState.loading = false;
    mockedState.error = null;
  });

  it("shows empty state when no messages exist", () => {
    render(<Chat />);

    expect(
      screen.getByText("Start conversation by sending your first message."),
    ).toBeInTheDocument();
  });

  it("renders messages and error text", () => {
    mockedState.messages = [
      { id: "1", role: "user", content: "Hello" },
      { id: "2", role: "assistant", content: "Hi there!" },
    ];
    mockedState.error = "Something went wrong";

    render(<Chat />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("submits input, clears field and sends message", async () => {
    const user = userEvent.setup();
    sendMessageMock.mockResolvedValue(undefined);

    render(<Chat />);

    const input = screen.getByPlaceholderText("Type your message...");
    const button = screen.getByRole("button", { name: "Send" });

    await user.type(input, "Hello Claude");
    await user.click(button);

    expect(sendMessageMock).toHaveBeenCalledWith("Hello Claude");
    expect(input).toHaveValue("");
  });

  it("disables form controls while loading", () => {
    mockedState.loading = true;

    render(<Chat />);

    expect(screen.getByPlaceholderText("Type your message...")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Claude is typing..." }),
    ).toBeDisabled();
  });
});
