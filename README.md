# A2A Persistent Memory Protocol

Encrypted, pay-per-use persistent memory storage for AI agents (and humans), gated by the [x402](https://github.com/x402-foundation/x402) HTTP-402 payment standard on Base L2.

**Live service:** https://agtrepo.com
**Discovery manifest:** https://agtrepo.com/.well-known/agent-memory.json
**MCP endpoint:** `https://agtrepo.com/mcp` (streamable HTTP transport)
**Examples:** https://agtrepo.com/examples

## What's in this repository

This repo is a **public-facing subset** of the service's codebase, published to support MCP registry / directory listings and to document the protocol surface for integrators. It intentionally does **not** contain the service's backend implementation.

Included:
- `server.json` — MCP registry submission manifest.
- `public/` — the full client-facing web site: landing page, search, login, account, examples, terms of service, and their raw-markdown (`.md`) mirrors, plus `llms.txt`.
- `src/mcp/server.ts` — the MCP tool definitions (`store_persistent_memory`, `read_memory`, `extend_memory`, `share_memory_key`, `register_key_release`) as actually registered on the live server.
- `src/x402.ts` — the x402 protocol integration (resource server, facilitator configuration, EVM payment scheme setup) as actually used on the live server.

**Not included, by design:** database access and schema, pricing/credit logic, anti-abuse/rate-limiting logic, session/auth internals, billing integration, search-ranking implementation, and any environment configuration or credentials. Those remain in this project's private codebase.

Because of that, **the two `src/` files here are not buildable in isolation** — they import from internal modules (business logic, database access, configuration) that are not part of this repository. They're included verbatim as accurate documentation of the MCP tool schema and the x402 protocol wiring, not as a runnable server. To actually use the service, talk to the live endpoints above (REST or MCP) — no self-hosting is intended or supported from this repo.

## License

MIT — see [LICENSE](LICENSE).
