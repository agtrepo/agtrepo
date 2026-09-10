import express, { type Express } from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createPaymentWrapper } from "@x402/mcp";
import type { PaymentPayload } from "@x402/core/types";
import { resourceServer, buildAccepts, getPayerFromPaymentPayload } from "../x402.js";
import { updatePaymentTxHash, deletePayment, deleteMemory, decrementReadCount, debitCreator, revertExtend } from "../db.js";
import {
  storeMemory,
  readMemory,
  extendMemoryTtl,
  registerKeyRelease,
  shareMemoryKey,
  MemoryServiceError,
  EXTEND_MS,
  MAX_TOTAL_TTL_MS,
} from "../memoryService.js";
import { MAX_MEMORY_BYTES, STORE_FLAT_PRICE_USD, EXTEND_FLAT_PRICE_USD, readPriceUsd, READ_CREATOR_SHARE } from "../pricing.js";
import { sendFeedbackEmail, MAX_FEEDBACK_MESSAGE_LENGTH } from "../email.js";

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

type ToolCallback<TArgs> = (args: TArgs, extra: unknown) => Promise<ToolResult> | ToolResult;

function toToolError(err: unknown): ToolResult {
  const message = err instanceof MemoryServiceError ? err.message : "Internal error";
  return { content: [{ type: "text", text: message }], isError: true };
}

// createPaymentWrapper's handler(args, context) does not receive the
// verified payment payload directly; the onBeforeExecution hook does. We
// stash the derived payer onto the shared `args` object reference (the same
// object the SDK passes to both the hook and the handler for one call).
// Settlement (and the real on-chain tx hash) similarly only happens AFTER
// the handler returns, via onAfterSettlement — so the handler stashes the
// payment ledger row's id onto the same `args` object, and the settlement
// hook reads it back to backfill the tx hash once known.
function withPayerHook<TArgs extends Record<string, unknown>>() {
  return {
    onBeforeExecution: async (ctx: { paymentPayload: PaymentPayload; arguments: TArgs }) => {
      const payer = getPayerFromPaymentPayload(ctx.paymentPayload);
      (ctx.arguments as Record<string, unknown>).__payer = payer;
    },
    onAfterSettlement: async (ctx: {
      arguments: TArgs;
      settlement: { transaction?: string };
    }) => {
      const paymentId = (ctx.arguments as Record<string, unknown>).__paymentId;
      if (typeof paymentId === "string" && typeof ctx.settlement.transaction === "string") {
        await updatePaymentTxHash(paymentId, ctx.settlement.transaction).catch((err: unknown) =>
          console.error(`Failed to backfill tx_hash for payment ${paymentId}:`, err)
        );
      }
    },
  };
}

function payerOf(args: Record<string, unknown>): `0x${string}` | null {
  const p = args.__payer;
  return typeof p === "string" ? (p as `0x${string}`) : null;
}

function stashPaymentId(args: Record<string, unknown>, paymentId: string | null | undefined) {
  if (paymentId) args.__paymentId = paymentId;
}

// createPaymentWrapper has no hook for a FAILED settlement (only
// onAfterSettlement, called on success) — a settlement failure instead
// surfaces as `isError: true` on the callback's own return value, with no
// hook invoked at all. Our handler already ran and applied its DB side
// effects by the time that's known, and never itself returns isError after
// having stashed a paymentId (our own errors are always thrown before that
// point) — so seeing isError:true with a stashed paymentId can only mean
// the SDK's post-handler settlement failed, and it's safe to roll back here.
function withSettlementRollback<TArgs extends Record<string, unknown>>(
  wrapped: ToolCallback<TArgs>,
  rollback: (args: TArgs) => Promise<void>
): ToolCallback<TArgs> {
  return async (args: TArgs, extra: unknown) => {
    const result = await wrapped(args, extra);
    const paymentId = (args as Record<string, unknown>).__paymentId;
    if (result.isError && typeof paymentId === "string") {
      try {
        await deletePayment(paymentId);
        await rollback(args);
      } catch (err) {
        console.error(`Failed to roll back MCP payment ${paymentId}:`, err);
      }
    }
    return result;
  };
}

const MCP_SERVER_NAME = "agtrepo-a2a-memory";
const MCP_SERVER_VERSION = "0.1.0";

// MCP Server Card, per SEP-2127 (https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127):
// https://github.com/modelcontextprotocol/experimental-ext-server-card is the
// ratified schema this conforms to ($schema/name/description/version are its
// required fields; name is reverse-DNS, matching this server's MCP registry
// and Smithery identity). Per that spec, cards deliberately do NOT enumerate
// tools/resources/prompts -- those stay a runtime "list" concern -- but a
// broader, still-emerging discovery convention (checked by third-party
// agent-readiness scanners) expects a `serverInfo`/`capabilities`/`endpoint`
// shape too. Both are included: `serverInfo` here is not a guess, it's the
// literal { name, version } this server reports at connection time (see
// `new McpServer(...)` below), so it can never drift from runtime reality,
// and `capabilities`/`endpoint` are additive fields the ratified schema
// permits (it does not set `additionalProperties: false`).
const MCP_SERVER_CARD = {
  $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  name: "io.github.agtrepo/agtrepo-memory",
  title: "A2A Persistent Memory Protocol",
  description: "Encrypted, pay-per-use persistent memory storage for AI agents, gated by x402 payments on Base.",
  version: MCP_SERVER_VERSION,
  websiteUrl: "https://agtrepo.com",
  repository: { source: "github", url: "https://github.com/agtrepo/agtrepo" },
  remotes: [{ type: "streamable-http", url: "https://agtrepo.com/mcp" }],
  serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
  endpoint: "https://agtrepo.com/mcp",
  capabilities: { tools: true, resources: false, prompts: false },
};

export async function buildMcpApp(): Promise<Express> {
  const mcpServer = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });

  const storeAccepts = await buildAccepts(STORE_FLAT_PRICE_USD);
  const readAccepts = await buildAccepts(readPriceUsd());
  const extendAccepts = await buildAccepts(EXTEND_FLAT_PRICE_USD);

  const paidStore = createPaymentWrapper(resourceServer, {
    accepts: storeAccepts,
    resource: { url: "mcp://tool/store_persistent_memory", description: "Store an encrypted memory" },
    hooks: withPayerHook(),
  });
  const paidRead = createPaymentWrapper(resourceServer, {
    accepts: readAccepts,
    resource: { url: "mcp://tool/read_memory", description: "Read an encrypted memory" },
    hooks: withPayerHook(),
  });
  const paidExtend = createPaymentWrapper(resourceServer, {
    accepts: extendAccepts,
    resource: { url: "mcp://tool/extend_memory", description: "Extend a memory's TTL by 30 days" },
    hooks: withPayerHook(),
  });

  mcpServer.tool(
    "store_persistent_memory",
    `Stores encrypted text memory (base64 ciphertext, up to ${MAX_MEMORY_BYTES} bytes). Automatically completes x402 payment challenges.`,
    { ciphertext: z.string().describe("base64-encoded, client-encrypted content"), tags: z.array(z.string()).optional() },
    paidStore(
      withSettlementRollback(
        async (args: { ciphertext: string; tags?: string[]; __memoryId?: string }) => {
          const payer = payerOf(args);
          if (!payer) return toToolError(new MemoryServiceError("no verified payer", 402));
          try {
            const { paymentId, ...result } = await storeMemory(payer, args.ciphertext, args.tags ?? []);
            stashPaymentId(args, paymentId);
            args.__memoryId = result.id;
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (err) {
            return toToolError(err);
          }
        },
        async (args) => {
          if (args.__memoryId) await deleteMemory(args.__memoryId);
        }
      )
    )
  );

  mcpServer.tool(
    "read_memory",
    `Reads an encrypted memory by id. Requires x402 payment. ${READ_CREATOR_SHARE * 100}% of the fee accrues to the memory's creator.`,
    { id: z.string() },
    paidRead(
      withSettlementRollback(
        async (args: { id: string; __creatorWallet?: string }) => {
          try {
            const { paymentId, ...result } = await readMemory(args.id, payerOf(args));
            stashPaymentId(args, paymentId);
            args.__creatorWallet = result.creatorWallet;
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (err) {
            return toToolError(err);
          }
        },
        async (args) => {
          await decrementReadCount(args.id);
          if (args.__creatorWallet) {
            await debitCreator(args.__creatorWallet, Math.round(readPriceUsd() * READ_CREATOR_SHARE * 1e8) / 1e8);
          }
        }
      )
    )
  );

  mcpServer.tool(
    "extend_memory",
    `Extends a memory's TTL by 30 days, up to a maximum total lifetime of ${MAX_TOTAL_TTL_MS / (24 * 60 * 60 * 1000)} days from creation. Requires x402 payment.`,
    { id: z.string() },
    paidExtend(
      withSettlementRollback(
        async (args: { id: string }) => {
          try {
            const { paymentId, ...result } = await extendMemoryTtl(args.id, payerOf(args));
            stashPaymentId(args, paymentId);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
          } catch (err) {
            return toToolError(err);
          }
        },
        async (args) => {
          await revertExtend(args.id, EXTEND_MS);
        }
      )
    )
  );

  mcpServer.tool(
    "share_memory_key",
    "Free. Releases a previously creator-registered wrapped key to a reader, or the raw content key for a public document.",
    { id: z.string(), readerPubKey: z.string() },
    async (args: { id: string; readerPubKey: string }) => {
      try {
        const result = await shareMemoryKey(args.id, args.readerPubKey);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
      } catch (err) {
        return toToolError(err);
      }
    }
  );

  mcpServer.tool(
    "register_key_release",
    "Free. Creator registers a wrapped content key for a specific reader's public key, proven by an EIP-191 signature over `agtrepo-memory:key-release:{id}:{readerPubKey}:{timestamp}`.",
    {
      id: z.string(),
      readerPubKey: z.string(),
      wrappedKey: z.string(),
      signature: z.string(),
      timestamp: z.number(),
    },
    async (args: {
      id: string;
      readerPubKey: string;
      wrappedKey: string;
      signature: string;
      timestamp: number;
    }) => {
      try {
        await registerKeyRelease(
          args.id,
          args.readerPubKey,
          args.wrappedKey,
          args.signature as `0x${string}`,
          args.timestamp
        );
        return { content: [{ type: "text" as const, text: "ok" }] };
      } catch (err) {
        return toToolError(err);
      }
    }
  );

  mcpServer.tool(
    "send_feedback",
    `Free. Sends feedback about the Protocol to its operators by email. Name is optional (omit for anonymous feedback); message is limited to ${MAX_FEEDBACK_MESSAGE_LENGTH} characters.`,
    { name: z.string().max(80).optional(), message: z.string().min(1).max(MAX_FEEDBACK_MESSAGE_LENGTH) },
    async (args: { name?: string; message: string }) => {
      try {
        await sendFeedbackEmail({ name: args.name ?? null, message: args.message });
        return { content: [{ type: "text" as const, text: "Feedback sent, thank you." }] };
      } catch (err) {
        return toToolError(err);
      }
    }
  );

  const app = express();

  // Served at both the ratified spec's recommended location
  // (GET <streamable-http-url>/server-card) and the well-known path a
  // generic agent-readiness scanner checks for.
  app.get("/mcp/server-card", (_req, res) => {
    res.type("application/mcp-server-card+json").json(MCP_SERVER_CARD);
  });
  app.get("/.well-known/mcp/server-card.json", (_req, res) => {
    res.type("application/mcp-server-card+json").json(MCP_SERVER_CARD);
  });

  app.post("/mcp", express.json(), async (req, res) => {
    // Stateless mode needs a fresh transport per request: the underlying
    // MCP Server rejects a second "initialize" handshake on a transport
    // that's already completed one, so a single shared transport instance
    // breaks every client after the first. The McpServer itself is cheap to
    // reconnect and holds no per-client state, so this is just a thin,
    // short-lived wrapper discarded once the response is sent.
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => transport.close());
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return app;
}
