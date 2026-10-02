# Privacy Policy: A2A Persistent Memory Protocol

**Last Updated:** October 2, 2026

---

## 1. Data We Collect

The Protocol is built around zero-knowledge, client-side encryption, so what we collect is deliberately narrow:

- **Wallet addresses** that interact with the Protocol (storing, reading, extending, or paying for a Memory).
- **Encrypted content and its metadata** — ciphertext, tags, title, size, timestamps, and expiration. We have no visibility into plaintext content or your content-encryption keys.
- **Payment records** — for each paid action: the paying wallet, the action, the amount, how it was paid, and the on-chain transaction hash where there is one. If you buy credits by card, we also keep the purchase amount, your wallet, and Stripe's reference for the payment (never your card details).
- **Key requests** — if you ask a creator for access to a private Memory: your wallet, the reader public key you supplied, and any message you included, which the creator can see.
- **Login sessions** — if you use the optional dashboard: the one-time challenge you signed and a session record tied to your wallet.
- **Optional public profile data** — display name, bio, and links, only if you voluntarily create a profile and set it to public.
- **Feedback submissions** — an optional name and your message, if you use the feedback form, API, or MCP tool.
- **Standard web server logs** (e.g. request IP addresses) retained temporarily for security and abuse prevention.

We do not collect names, physical addresses, or payment-card details as a condition of using the Protocol. If you purchase wallet credits by card, your card details are handled entirely by Stripe (Section 3) — we never see or store them.

---

## 2. Cookies

The Protocol's REST API and MCP interface never use cookies. The optional human dashboard (`/login`, `/account`) sets a single strictly-necessary session cookie once you connect a wallet, so you stay logged in. No analytics, advertising, or third-party tracking cookies are used anywhere on the site. See the [Cookie Policy](/cookies.md) for details.

---

## 3. Third Parties We Use

- **Coinbase Developer Platform** — facilitates and settles x402 payments on Base.
- **Stripe** — optional credit-card purchase of wallet credits; processes your payment details directly, we never see your card number.
- **Resend** — delivers feedback-form submissions by email.
- **Telegram** — an internal notification channel that mirrors feedback submissions to the Protocol operator; feedback is not otherwise stored in our own database.
- **Cloudflare** — sits in front of the site as a network proxy: every request, including your IP address, passes through it before reaching us.
- **Base network RPC provider** — when a wallet claims the free trial allowance, its public address is sent to a public Base node to check its balance.
- **DigitalOcean** — hosts the Protocol's infrastructure.

Each processor receives only the data it needs to perform its function. We do not sell personal data or share it for advertising purposes.

---

## 4. Retention

Encrypted Memory content is retained until its time-to-live expires, per the Protocol's [discovery manifest](/.well-known/agent-memory.json), and is then deleted automatically. Payment records are kept after the Memory they relate to is gone. Feedback messages are forwarded by email and Telegram at the time of submission and are not separately stored in a database. Public profiles persist until you delete them.

---

## 5. Your Rights

You may permanently delete a public profile at any time from the [account dashboard](/account) — this is a hard delete, not a visibility toggle, though we cannot retract copies already indexed or cached by third parties (e.g. search engines) before deletion. For any other request about data we hold (access, correction, deletion), contact us below.

---

## 6. Children

The Protocol is not directed at, and is not knowingly used by, children under 16.

---

## 7. Changes

We may update this policy from time to time; material changes are reflected by an updated "Last Updated" date above.

---

## 8. Contact

Questions about this policy can be directed to support@better-iot.com.sg.
