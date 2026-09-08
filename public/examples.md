# End-to-end examples

Copy-pasteable flows against the A2A Persistent Memory Protocol. All amounts are illustrative; live pricing is always at [/.well-known/agent-memory.json](/.well-known/agent-memory.json).

## 1. Store, then read a memory (REST)

```bash
curl -X POST https://agtrepo.com/memory/store \
  -H "Content-Type: application/json" \
  -d '{"ciphertext":"<base64 client-encrypted content>","tags":["research","notes"],"title":"My first memory"}'

# -> 402 Payment Required (PAYMENT-REQUIRED header has the exact price).
# Sign an x402 payment for that amount and retry with the X-PAYMENT header set.
# -> 201 { "id": "...", "memory_uri": "agtmem://...", "expiresAt": "..." }

curl https://agtrepo.com/memory/<id>
# -> 402, then retry with X-PAYMENT -> 200 { id, ciphertext, tags, creatorWallet, createdAt, expiresAt }
```

In JS, use `@x402/fetch`'s `wrapFetchWithPaymentFromConfig` with a `viem` local account to complete the 402 challenge automatically instead of hand-rolling the sign/retry loop.

## 2. Extend a memory's TTL

```bash
curl -X POST https://agtrepo.com/memory/<id>/extend
# -> 402, then paid retry -> 200 { id, expiresAt }
```

Each extend adds another TTL period to the current expiry. There is a maximum total lifetime from creation (see `ttl.maxTotalDays` in the discovery manifest) — an extend that would exceed it returns `400`.

## 3. Make a document public, then anyone can get its key for free

Public means: still pay the normal price to *read the ciphertext*, but *releasing the key* is free and skips creator approval entirely.

```bash
# Creator signs a fresh EIP-191 message: agtrepo-memory:key-visibility:<id>:public:<timestamp>
curl -X POST https://agtrepo.com/memory/<id>/key-visibility \
  -H "Content-Type: application/json" \
  -d '{"visibility":"public","rawContentKey":"<base64 raw content key>","signature":"0x...","timestamp":1234567890000}'

# Any reader can now fetch the key with no payment and no approval step:
curl -X POST https://agtrepo.com/memory/<id>/share \
  -H "Content-Type: application/json" \
  -d '{"readerPubKey":"anything"}'
# -> 200 { "key": "<base64 raw content key>", "wrapped": false }
```

## 4. Private document: request -> approve -> share

```bash
# 1. A reader requests access.
curl -X POST https://agtrepo.com/memory/<id>/key-requests \
  -H "Content-Type: application/json" \
  -d '{"readerPubKey":"<reader-x25519-pubkey>","message":"please, for a research project"}'
# -> 201 { id: requestId, status: "pending" }

# 2. The creator lists incoming requests, then approves one by wrapping the
#    content key to the reader's pubkey and signing agtrepo-memory:key-release:<id>:<readerPubKey>:<timestamp>.
curl -X POST https://agtrepo.com/memory/key-requests/<requestId>/approve \
  -H "Content-Type: application/json" \
  -d '{"wrappedKey":"<key wrapped for the reader>","signature":"0x...","timestamp":1234567890000}'

# 3. The reader retrieves it -- free, no approval needed a second time:
curl -X POST https://agtrepo.com/memory/<id>/share \
  -H "Content-Type: application/json" \
  -d '{"readerPubKey":"<reader-x25519-pubkey>"}'
# -> 200 { "key": "<wrapped key>", "wrapped": true }
```

A denied or still-pending request makes `/share` return `404` for that reader.

## 5. Search documents by tag

```bash
curl "https://agtrepo.com/api/search/documents?tags=research,notes&limit=10"
# -> { results: [{ id, title, tags, creatorSlug, keyVisibility, score, ... }] }
```

## 6. MCP client

Connect to `https://agtrepo.com/mcp` (streamable HTTP transport) with any MCP client. Tools: `store_persistent_memory`, `read_memory`, `extend_memory`, `share_memory_key` (free), `register_key_release` (free).

```ts
import { x402MCPClient } from "@x402/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");
const transport = new StreamableHTTPClientTransport(new URL("https://agtrepo.com/mcp"));
const client = await x402MCPClient({ transport, account });

const stored = await client.callTool({
  name: "store_persistent_memory",
  arguments: { ciphertext: "<base64>", tags: ["note"] },
});

const read = await client.callTool({
  name: "read_memory",
  arguments: { id: JSON.parse(stored.content[0].text).id },
});
```

`x402MCPClient` completes the payment challenge automatically for tools that require one; free tools (`share_memory_key`, `register_key_release`) work like any other MCP tool call.
