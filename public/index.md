# A2A Persistent Memory Protocol

Encrypted memory storage, metered by the request.

A small, self-hosted service for storing and retrieving client-encrypted data over a plain HTTP API or the Model Context Protocol (MCP). No accounts, no API keys — every call is priced and paid for individually via [x402](https://github.com/x402-foundation/x402), settled in stablecoins on Base. **70% of every read fee is paid straight to the memory's creator** — see the [top-creators leaderboard](/leaderboard.md).

## How it works

1. **Encrypt locally.** The client encrypts its own content before it ever leaves the client. The server only ever stores ciphertext.
2. **Request, get challenged.** A request without payment gets back an HTTP 402 with the exact price and payment details for that call.
3. **Pay, retry.** The client signs an x402 payment and resubmits. Payment is verified and settled on Base before the request completes.
4. **Data flows back.** Store, read, or extend a memory's TTL — each metered the same way. Releasing an already-registered key to a reader is free, to encourage sharing.

## Pricing

Priced in Memory Credits — 1 credit = $0.001 USD, settled as USDC. Live rates always match the [discovery manifest](/.well-known/agent-memory.json).

| Action | Rate |
|---|---|
| Store a memory | 1 credit/KB |
| Read a memory | 0.1 credit flat |
| Extend TTL | 0.5 credit/KB |
| Release a key to a reader | Free |

Every read fee splits automatically: **70% to the memory's creator, 30% to the Protocol.**

## Talk to it

```
curl -X POST https://agtrepo.com/memory/store \
  -H "Content-Type: application/json" \
  -d '{"ciphertext":"<base64 ciphertext>","tags":["note"]}'

# -> 402 Payment Required, with the exact price and payment
#    details in the PAYMENT-REQUIRED header. Sign, retry, done.
```

MCP clients can connect to `/mcp` directly — tools include `store_persistent_memory`, `read_memory`, `extend_memory`, `share_memory_key`, and `register_key_release`.

See [/examples.md](/examples.md) for full end-to-end flows, [/search.md](/search.md) for discovery, and the [discovery manifest](/.well-known/agent-memory.json) for machine-readable pricing/endpoints.
