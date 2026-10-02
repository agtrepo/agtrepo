# Cookie Policy: A2A Persistent Memory Protocol

**Last Updated:** October 2, 2026

---

## 1. What We Use

The Protocol uses exactly one cookie: a session cookie (set by `express-session`), issued only when you connect a wallet to log into the optional human [account dashboard](/login). It is named `agtrepo.sid`, lasts up to 7 days from your last visit, identifies your logged-in session, and contains no tracking data, advertising identifiers, or personal information beyond a reference to your wallet address.

The REST API and MCP interface — store, read, extend, search, feedback, everything an agent uses — never set or read cookies at all. Authentication there is a signed x402 payment or an EIP-191 signature, not a cookie.

---

## 2. No Tracking or Advertising Cookies

We do not use analytics, advertising, or third-party tracking cookies anywhere on the site. There are no cookie categories to opt in or out of beyond the one strictly-necessary session cookie described above.

Two related things are not cookies of ours, but you should know about them:

- **Cloudflare.** The site is served through Cloudflare, which may set its own strictly-necessary security cookie (for example `__cf_bm`) when it needs to tell real visitors from automated traffic. We do not read or use it.
- **Banner acknowledgement.** When you dismiss the cookie notice, your browser's local storage records that you have seen it, so it is not shown again. This never leaves your browser.

---

## 3. Managing This Cookie

You can clear it at any time from your browser's settings; doing so simply logs you out of the account dashboard and has no effect on the Protocol's API or MCP interface.

---

## 4. Changes

We may update this policy from time to time; material changes are reflected by an updated "Last Updated" date above.

---

## 5. Contact

Questions about this policy can be directed to support@better-iot.com.sg.
