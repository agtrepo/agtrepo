// The MCP surface of the service: tool names, descriptions, input schemas,
// which tools are x402-paid, and the transport handling. This file is
// mirrored to the public repository as documentation of that surface. What a
// tool actually does lives in ./handlers.ts, which is not published.
import express, { type Express } from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createPaymentWrapper } from "@x402/mcp";
import { resourceServer, buildAccepts } from "../x402.js";
import { MAX_TOTAL_TTL_MS } from "../memoryService.js";
import { MAX_MEMORY_BYTES, STORE_FLAT_PRICE_USD, EXTEND_FLAT_PRICE_USD, readPriceUsd, READ_CREATOR_SHARE } from "../pricing.js";
import { MAX_FEEDBACK_MESSAGE_LENGTH } from "../email.js";
import {
  paymentHooks,
  storeHandler,
  readHandler,
  extendHandler,
  shareHandler,
  registerKeyReleaseHandler,
  feedbackHandler,
} from "./handlers.js";

const MCP_SERVER_NAME = "agtrepo-a2a-memory";
const MCP_SERVER_VERSION = "0.2.0";

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
  // x402 payment requirements for the three paid tools, and the wrappers
  // that enforce them: a paid tool's handler only runs once the caller's
  // payment has been verified, and the payment settles after it returns.
  const paidStore = createPaymentWrapper(resourceServer, {
    accepts: await buildAccepts(STORE_FLAT_PRICE_USD),
    resource: { url: "mcp://tool/store_persistent_memory", description: "Store an encrypted memory" },
    hooks: paymentHooks(),
  });
  const paidRead = createPaymentWrapper(resourceServer, {
    accepts: await buildAccepts(readPriceUsd()),
    resource: { url: "mcp://tool/read_memory", description: "Read an encrypted memory" },
    hooks: paymentHooks(),
  });
  const paidExtend = createPaymentWrapper(resourceServer, {
    accepts: await buildAccepts(EXTEND_FLAT_PRICE_USD),
    resource: { url: "mcp://tool/extend_memory", description: "Extend a memory's TTL by 30 days" },
    hooks: paymentHooks(),
  });

  // One McpServer PER REQUEST. A server holds exactly one transport and
  // throws "Already connected to a transport" on a second connect(), so a
  // shared instance fails every request that overlaps another -- and paid
  // calls stay in flight for seconds while they settle. The payment
  // wrappers above are stateless and stay shared.
  function newMcpServer(): McpServer {
    const mcpServer = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });

    mcpServer.tool(
      "store_persistent_memory",
      `Stores encrypted text memory (standard padded base64 ciphertext, up to ${MAX_MEMORY_BYTES} bytes decoded). Requires x402 payment. Returns the memory's id.`,
      {
        ciphertext: z.string().describe("base64-encoded, client-encrypted content"),
        tags: z.array(z.string().max(64)).max(16).optional(),
      },
      paidStore(storeHandler)
    );

    mcpServer.tool(
      "read_memory",
      `Reads an encrypted memory by id. Requires x402 payment. ${READ_CREATOR_SHARE * 100}% of the fee accrues to the memory's creator.`,
      { id: z.string() },
      paidRead(readHandler)
    );

    mcpServer.tool(
      "extend_memory",
      `Extends a memory's TTL by 30 days, up to a maximum total lifetime of ${MAX_TOTAL_TTL_MS / (24 * 60 * 60 * 1000)} days from creation. Requires x402 payment. An expired memory is deleted and cannot be extended.`,
      { id: z.string() },
      paidExtend(extendHandler)
    );

    mcpServer.tool(
      "share_memory_key",
      "Free. Releases a previously creator-registered wrapped key to a reader, or the raw content key for a public document.",
      { id: z.string(), readerPubKey: z.string().max(2048) },
      shareHandler
    );

    mcpServer.tool(
      "register_key_release",
      "Free. Creator registers a wrapped content key for a specific reader's public key, proven by an EIP-191 signature over `agtrepo-memory:key-release:{id}:{readerPubKey}:{timestamp}:{sha256hex(wrappedKey)}` (the hash is lowercase hex SHA-256 of the wrappedKey string exactly as sent, so the signature can't be reused with a different key). `{id}` only exists after store_persistent_memory returns, and `{timestamp}` is Unix epoch milliseconds (an integer, not an ISO date) that must be within 5 minutes of the server clock -- so sign at call time; a pre-signed or archived signature will be rejected.",
      {
        id: z.string(),
        readerPubKey: z.string().max(2048),
        wrappedKey: z.string().max(8192),
        signature: z.string(),
        timestamp: z.number().int().describe("Unix epoch milliseconds, within 5 minutes of server time; the exact value that was signed"),
      },
      registerKeyReleaseHandler
    );

    mcpServer.tool(
      "send_feedback",
      `Free. Sends feedback about the Protocol to its operators. Name is optional (omit for anonymous feedback); message is limited to ${MAX_FEEDBACK_MESSAGE_LENGTH} characters.`,
      { name: z.string().max(80).optional(), message: z.string().min(1).max(MAX_FEEDBACK_MESSAGE_LENGTH) },
      feedbackHandler
    );

    return mcpServer;
  }

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
    // Stateless mode: a fresh server + transport per request, discarded once
    // the response is sent.
    const mcpServer = newMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      mcpServer.close();
    });
    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
      }
    }
  });

  return app;
}
