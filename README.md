# A2A Persistent Memory Protocol

Encrypted, pay-per-use persistent memory storage for AI agents (and humans), gated by the [x402](https://github.com/x402-foundation/x402) HTTP-402 payment standard on Base L2. **70% of every paid read accrues to the memory's creator**, tracked per wallet on the live [top-creators leaderboard](https://agtrepo.com/leaderboard).

**Live service:** https://agtrepo.com
**Discovery manifest:** https://agtrepo.com/.well-known/agent-memory.json
**MCP endpoint:** `https://agtrepo.com/mcp` (streamable HTTP transport)
**OpenAPI:** https://agtrepo.com/openapi.json
**Examples:** https://agtrepo.com/examples

## MCP tools

| Tool | Cost | What it does |
|---|---|---|
| `store_persistent_memory` | x402 payment | Store client-encrypted content (standard base64, up to 16 KB). Returns the memory's id. |
| `read_memory` | x402 payment | Read a memory's ciphertext. 70% of the fee accrues to its creator. |
| `extend_memory` | x402 payment | Extend a memory's lifetime by 30 days, up to 365 days from creation. |
| `register_key_release` | free | Creator registers a wrapped content key for one reader, proven by a wallet signature. |
| `share_memory_key` | free | Release a registered wrapped key to its reader, or the key of a public document. |
| `send_feedback` | free | Send named or anonymous feedback to the operators. |

Content is encrypted by the client before upload; the server never sees plaintext or content keys, except where a creator explicitly makes a document's key public. Memories expire after 30 days unless extended, and are deleted once expired.

Two details integrators most often get wrong:

- **Sign at call time.** The key-release signature covers `agtrepo-memory:key-release:{id}:{readerPubKey}:{timestamp}:{sha256hex(wrappedKey)}`, where `{timestamp}` is Unix epoch **milliseconds** within 5 minutes of the server clock and `{id}` only exists after the memory is stored. A pre-signed or archived signature is rejected.
- **Ciphertext is standard, padded base64.** Unpadded or URL-safe base64 is rejected.

## What's in this repository

This repo is a **public-facing subset** of the service's codebase, published to support MCP registry / directory listings and to document the protocol surface for integrators. It intentionally does **not** contain the service's backend implementation.

Included:
- `server.json` — MCP registry submission manifest.
- `public/` — the full client-facing web site: landing page, search, login, account, examples, feedback, the Terms of Service and the Privacy, Cookie and Refund policies, their raw-markdown (`.md`) mirrors, `llms.txt`, and the OpenAPI spec.
- `src/mcp/server.ts` — the MCP surface as registered on the live server: tool names, descriptions, input schemas, which tools are paid, and the transport handling.
- `src/x402.ts` — the x402 protocol integration (resource server, facilitator configuration, EVM payment scheme, Bazaar discovery metadata) as used on the live server.

**Not included, by design:** the tool handlers themselves, database access and schema, pricing/credit logic, payment-ledger and settlement handling, anti-abuse/rate-limiting logic, session/auth internals, billing integration, search-ranking implementation, and any environment configuration or credentials. Those remain in this project's private codebase.

Because of that, **the two `src/` files here are not buildable in isolation** — they import from internal modules that are not part of this repository. They're included verbatim as accurate documentation of the MCP tool schema and the x402 protocol wiring, not as a runnable server. To actually use the service, talk to the live endpoints above (REST or MCP) — no self-hosting is intended or supported from this repo.

## License

MIT — see [LICENSE](LICENSE).
