# Claude API with Tool Use - an AI that decides which of your functions to call, when to call them, and how to combine results

This project demonstrates an AI-powered chat application with a **Next.js frontend** and a **NestJS backend**.  
The assistant can answer general questions and call backend tools (for example, to retrieve clients and orders).

## App Example

The screenshot below shows a realistic interaction:

App Example image

- user asks for all data (clients + orders),
- assistant calls tools and returns structured results,
- user asks for filtering (`amount > 700`),
- assistant returns only matching records and a short summary.

This is a **tool-calling + streaming flow**: the frontend first sends `POST /chat`, then opens `GET /chat/stream`; the backend runs the Anthropic model, executes tools (`get_clients`, `get_orders`) when needed, and streams token deltas back to the UI until `[DONE]`.

App Example 1

## 1) Request Flow: Where the Request Goes and How It Is Processed

1. User writes a message in the frontend chat UI.
2. Frontend sends `POST /chat` to the backend with:
  - `message`
  - `conversationId` (UUID generated in FE and reused in the same conversation)
3. Backend stores the pending message by `conversationId` and returns `{ conversationId }`.
4. Frontend opens an SSE stream: `GET /chat/stream?conversationId=...`.
5. Backend reads the pending message and starts Anthropic streaming.
6. Anthropic can:
  - generate text tokens,
  - request tool calls (`get_clients`, `get_orders`).
7. Backend executes requested tools, sends tool results back to Anthropic, and continues generation.
8. Backend streams text deltas to FE via SSE and ends with `[DONE]`.
9. Frontend appends streamed deltas to the assistant message in real time.

## 2) What You Can Write in Prompts

You can use natural language. The assistant supports:

- data retrieval: "Get all clients and orders."
- filtering: "Show orders with amount > 700."
- contextual requests: "Only clients from Kyiv."
- date filtering style prompts: "Orders from 2026-02-01 and later."
- summary prompts: "Give me total amount and number of matching orders."

More filtering examples you can use:

- "Show orders with amount >= 1000."
- "Show orders with amount between 500 and 1200."
- "List orders below 400."
- "Show delivered orders with amount > 700."
- "Show pending or processing orders above 300."
- "Show orders for client `cli-1` with amount > 700."
- "Show orders from 2026-02-01 with amount > 500."
- "Return top 2 highest-value orders."
- "Group orders by status and show totals only for amounts > 700."
- "Filter orders to Kyiv clients and amount > 700."

Tip: You do not need to call tools manually. The model decides when to call `get_clients` / `get_orders`.

## 3) Frontend (FE) Details

Frontend folder: `ai-agent-client`

### Stack

- **Next.js 16** (React 19, TypeScript)
- **Zustand** for chat state management
- **EventSource (SSE)** for streaming assistant output
- **React Query** is installed and available for data workflows
- **Vitest + Testing Library** for tests

### How FE talks to BE

- Base URL is configured by `NEXT_PUBLIC_CHAT_API_URL` in `ai-agent-client/.env.local`
- Current default: `http://localhost:4000`
- FE sends:
  - `POST /chat` (message submit)
  - `GET /chat/stream` (streaming response)

### FE responsibilities

- render chat UI,
- store user/assistant messages,
- open and manage SSE connection,
- append token deltas as they arrive,
- show loading/error states.

## 4) Backend (BE) Details

Backend folder: `ai-agent-server`

### Stack

- **NestJS 11** (TypeScript)
- **@anthropic-ai/sdk** for model and tool-calling
- **RxJS** for stream orchestration
- **Jest** for tests

### How BE talks to FE

- Exposes HTTP API on port `4000` by default:
  - `POST /chat`
  - `GET /chat/stream` (SSE)
- CORS is enabled for `http://localhost:3000` (Next.js dev server).

### BE responsibilities

- receive chat requests from FE,
- manage `conversationId` and pending message state,
- stream model output token-by-token,
- execute backend tools when requested by the model,
- send tool results back to the model and continue generation.

### Current tools

- `get_clients` (optional city filter)
- `get_orders` (optional `clientId`, `dateFrom`)

Note: current tool implementation returns demo/mock data, which is perfect for local demos and UI validation.

## 5) Run Locally

## Prerequisites

- Node.js 20+
- pnpm
- Anthropic API key

## Step 1: Install dependencies

From project root:

```bash
pnpm install
```

## Step 2: Configure environment

### Backend env

Create `ai-agent-server/.env` with:

```bash
ANTHROPIC_API_KEY=your_api_key_here
PORT=4000
```

### Frontend env

`ai-agent-client/.env.local` should contain:

```bash
NEXT_PUBLIC_CHAT_API_URL=http://localhost:4000
```

## Step 3: Start backend

```bash
pnpm --dir ai-agent-server start:dev
```

Backend runs on `http://localhost:4000`.

## Step 4: Start frontend

In another terminal:

```bash
pnpm --dir ai-agent-client dev
```

Frontend runs on `http://localhost:3000`.

## Step 5: Try prompts

Open the app and try:

- "Get all clients and all orders."
- "Show only orders with amount > 700."
- "Get clients from Kyiv and summarize results."
- "Show orders with amount >= 1000."
- "List orders below 400 and explain why they were selected."
- "Show delivered orders only."
- "Show pending and processing orders with amount > 300."
- "Get orders for client `cli-1`."
- "Get orders from 2026-02-01 and later."
- "Show orders from 2026-01-01 with amount > 500."
- "Return top 2 highest-value orders."
- "Calculate total order amount for orders above 700."
- "Count how many orders exist per status."
- "Show clients from Lviv."
- "Show clients from Kyiv and their related orders."
- "Find clients that currently have pending orders."
- "First fetch all data, then keep only orders above 700 and provide a short summary."
- "Create a compact report: matching order IDs, total amount, and average amount for orders > 700."

## 6) Useful Scripts

From root:

```bash
pnpm lint
pnpm test
```

From FE:

```bash
pnpm --dir ai-agent-client test
```

From BE:

```bash
pnpm --dir ai-agent-server test
```

## 7) License

This project is licensed under the MIT License.  
See the `LICENSE` file for details.