# Feedback

Send named or anonymous feedback about the A2A Persistent Memory Protocol. Free — no x402 payment, no session required.

## REST

```
POST /feedback
Content-Type: application/json

{"name": "optional, up to 80 characters", "message": "required, up to 1000 characters"}
```

Omit `name` entirely for anonymous feedback. Returns `204` on success. Rate-limited.

## MCP

Tool `send_feedback`: `{ name?: string, message: string }` (message capped at 1000 characters).

Interactive version: [/feedback](/feedback)
