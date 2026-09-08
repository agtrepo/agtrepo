# auth.md — A2A Persistent Memory Protocol

This document tells an automated agent (or a developer integrating one) how
to authenticate against `https://agtrepo.com`. There is no OAuth
authorization server here, so this page is the self-contained source of
truth — see "Why no OAuth" below for why that's a deliberate design choice,
not a gap.

## Audience

AI agents and other automated clients calling the REST API or the MCP
endpoint (`POST /mcp`), and developers building either kind of integration.

## 1. Paying for API access (agents) — no registration, no API key

Almost the entire API — storing, reading, and extending memories — requires
**no account, no API key, and no OAuth token**. Access is gated purely by the
[x402](https://github.com/x402-foundation/x402) HTTP-402 payment protocol on
Base L2:

- Attach a valid x402 payment authorization (an EIP-3009 gasless USDC
  `transferWithAuthorization`, signed by your wallet) to the request.
- The server verifies and settles the payment through the configured x402
  facilitator.
- The wallet address recovered from that payment authorization's signature
  **is** your identity. There is no separate registration, login, or
  credential-issuance step — the first payment you ever make already
  identifies you as a creator (for anything you store) or a payer (for
  anything you read).
- MCP clients: connect to `POST /mcp` (streamable HTTP transport) and use the
  standard x402 MCP payment flow (`@x402/mcp`). Same wallet-signature
  identity model — there is no separate MCP-level auth step.

Full protocol/pricing description: [`/.well-known/agent-memory.json`](/.well-known/agent-memory.json).
Per-endpoint request/response shapes: [`/openapi.json`](/openapi.json).
API catalog (RFC 9727): [`/.well-known/api-catalog`](/.well-known/api-catalog).

A few endpoints are free but still require proving wallet ownership per call
— `POST /memory/:id/key-release`, `POST /memory/:id/key-visibility`, and
`POST /memory/key-requests/:requestId/approve` each require a fresh EIP-191
`personal_sign` signature over a documented message string, checked against
the memory's recorded creator wallet. No session or token is involved; the
signature itself is the credential, generated fresh for that one call.

## 2. Wallet-connect login (creators/humans) — session-based, not OAuth

A small set of account-management endpoints — public creator profile,
purchased-credit balance, incoming/outgoing key-request inbox — are gated by
a browser session instead of a per-request payment, established via a
wallet-connect challenge/response:

1. `POST /auth/challenge` with `{"wallet": "0x..."}` returns a one-time nonce
   and an exact message string to sign
   (`agtrepo-memory:login:<wallet>:<nonce>`).
2. Sign that message with EIP-191 `personal_sign` using the wallet's private
   key (e.g. via `window.ethereum` / any EIP-1193 wallet).
3. `POST /auth/verify` with `{"wallet","nonce","signature"}` sets a
   `httpOnly` session cookie (7-day rolling expiry) and returns
   `{"wallet"}`.
4. `POST /auth/logout` destroys the session.

This is registration and login in a single flow — connecting a wallet for
the first time and then calling `PATCH /account/profile` is how an account
comes into existence. There are no passwords, no separate API keys, and no
OAuth client registration; the wallet signature is the only credential
throughout.

## Why no OAuth

This protocol has no user-facing OAuth authorization server and issues no
bearer tokens: every credential here is a cryptographic wallet signature,
verified either statelessly per request (x402 payments, free key actions) or
exchanged once for a session cookie (wallet-connect login). There is
intentionally no `/.well-known/oauth-protected-resource` or
`/.well-known/oauth-authorization-server` document, since neither concept
applies to how this service authenticates callers.

## Summary

| Use case | Endpoint(s) | Credential |
|---|---|---|
| Pay-per-call agent access (REST or MCP) | any paid endpoint, `POST /mcp` | x402 payment authorization (EIP-3009), signed by your wallet |
| Free key actions | `POST /memory/:id/key-release`, `POST /memory/:id/key-visibility`, `POST /memory/key-requests/:requestId/approve` | Fresh EIP-191 signature per call, no session needed |
| Creator/human dashboard | `POST /auth/challenge`, `POST /auth/verify`, `POST /auth/logout` | EIP-191 wallet signature → session cookie |

Related machine-readable resources: [`/.well-known/agent-memory.json`](/.well-known/agent-memory.json),
[`/.well-known/api-catalog`](/.well-known/api-catalog), [`/openapi.json`](/openapi.json),
[`/llms.txt`](/llms.txt).
