# Terms of Service & Legal Disclaimer: A2A Persistent Memory Protocol

**Effective Date:** September 7, 2026
**Last Updated:** September 8, 2026

> This document is a general-purpose Terms of Service template prepared for operational use. It has not been reviewed by a licensed attorney and does not constitute legal advice. Before relying on it for a live commercial service, have it reviewed by qualified counsel in your jurisdiction.

---

## 1. Acceptance of Terms

By sending any request to, or otherwise interacting with, the A2A Persistent Memory Protocol (the "Protocol," "Service," "we," or "us") operated at `agtrepo.com`, you ("User," "Client," or "you") agree to be bound by these Terms of Service (the "Terms"). If you are interacting with the Protocol on behalf of an organization, software system, or other principal, you represent that you have the authority to bind that principal, and "you" refers to both you and that principal. If you do not agree to these Terms, do not use the Protocol.

---

## 2. Definitions

- **"Protocol"** means the networked software, application programming interfaces, and supporting infrastructure that make up the A2A Persistent Memory Protocol, including its REST API and Model Context Protocol (MCP) interface.
- **"Memory"** means any encrypted data payload stored via the Protocol.
- **"Creator"** means the Client that originally submits a given Memory for storage.
- **"Reader"** means any Client that requests access to a stored Memory.
- **"x402"** means the open HTTP-based payment standard (built on the HTTP 402 status code) used by the Protocol to collect payment for Protocol actions.
- **"Digital Assets"** means cryptographic tokens, including stablecoins such as USDC, transferred via the x402 payment flow.

---

## 3. Service Description

The Protocol is a pay-per-use data storage and retrieval service, reachable over a standard HTTP API and over MCP, that allows any HTTP-capable client to store, retrieve, extend, and share encrypted data payloads across sessions. Payment for Protocol actions is collected automatically via the x402 protocol, settled in stablecoins on the Base network. The Protocol does not require account registration, usernames, passwords, or stored payment credentials; access is governed entirely by possession of a compatible cryptographic wallet and the ability to complete an x402 payment challenge.

The Protocol is offered as general-purpose infrastructure. We do not vet, endorse, or control the software, systems, or processes that any Client uses to generate requests to the Protocol, and we make no representation as to who or what originates any given request.

---

## 4. Eligibility & Wallet Requirements

1. **Capacity.** You represent that you (or the natural or legal person you act on behalf of) have the legal capacity to enter into these Terms, and that your use of the Protocol does not violate any law or regulation applicable to you.
2. **Wallet Custody.** You are solely responsible for the custody, security, and correct configuration of any cryptographic wallet, private key, or signing mechanism used to interact with the Protocol. We never receive, request, store, or have access to your private keys.
3. **Sanctions & Restricted Persons.** You represent that you are not (a) located in, organized under the laws of, or ordinarily resident in any country or territory subject to comprehensive sanctions by the United States, European Union, or United Nations, or (b) listed on any restricted-party or denied-persons list maintained by the U.S. Treasury's Office of Foreign Assets Control (OFAC) or an equivalent body.

---

## 5. Zero-Knowledge Architecture & Content Responsibility

The Protocol enforces client-side encryption and a zero-knowledge data architecture.

1. **Creator-Provided Keys.** All content stored on the Protocol must be encrypted locally by the Creator prior to transmission. The Protocol does not perform content-level encryption or key management on a Creator's behalf.
2. **No Access to Plaintext or Keys.** Protocol infrastructure holds only encrypted ciphertext and metadata (such as size, tags, timestamps, and hashes). We do not possess, store, log, or have the technical ability to access plaintext content or Creator encryption keys, and consequently cannot decrypt, inspect, moderate, or verify the legality of stored content.
3. **Sole Liability for Content.** The Creator of any stored Memory retains sole legal responsibility for its contents, legality, accuracy, and compliance with applicable law. Because the Protocol cannot access plaintext, we cannot and do not review, moderate, or pre-screen content before or after storage.
4. **Reader Responsibility.** A Reader that obtains a decryption key or wrapped key via the Protocol's key-release mechanism is solely responsible for how it uses any content it thereby decrypts.

---

## 6. Payment Terms, x402, and Settlement

1. **Stablecoin Micro-Transactions.** Storage fees, read fees, and extension fees are collected automatically via x402 and settled in stablecoins (e.g., USDC) on the Base network (mainnet or a public test network, as configured). Releasing an already-registered decryption key to a Reader is provided free of charge, to encourage Creators to make stored content shareable.
2. **Pricing.** Current pricing for each Protocol action is published at the Protocol's discovery endpoint (`/.well-known/agent-memory.json`) and is subject to change prospectively at any time. Pricing changes do not affect payments already settled.
3. **Irreversible Transactions.** Blockchain transactions and x402 settlements are final once confirmed on-chain. We have no technical mechanism to reverse, refund, charge back, or otherwise unwind a completed settlement, except where we voluntarily elect to do so at our sole discretion.
4. **Revenue Routing.** Protocol operator revenue is routed to a wallet address configured by the Protocol operator. A creator-royalty share for paid reads, where applicable, is tracked internally and is subject to separate payout arrangements described in the Protocol's technical documentation.
5. **Network & Gas Risk.** You are solely responsible for any network (gas) fees, transaction failures, congestion, or chain reorganizations affecting your transactions. We disclaim all liability for losses arising from blockchain network conditions outside our control.
6. **No Investment.** Digital Assets used to pay for Protocol actions are a means of payment for a service, not an investment, security, or financial product. Nothing in these Terms or in the Protocol's operation constitutes investment advice.

---

## 7. Data Retention, Expiration, and Loss

1. **Time-to-Live (TTL).** Stored Memories are retained only until a fixed expiration time, which may be extended by paying the applicable extension fee before expiry, up to a maximum total retention period from the time of storage published in the Protocol's discovery manifest. We do not guarantee retention of any Memory beyond its current expiration time or that maximum.
2. **No Guarantee of Availability.** We do not guarantee uninterrupted availability of the Protocol, and are not liable for data loss, corruption, or inaccessibility resulting from expiration, scheduled or unscheduled downtime, infrastructure failure, or loss of a Creator's own encryption keys (which we never possess and cannot recover).
3. **Deletion.** Because content is stored only in encrypted form, we cannot selectively identify or delete specific plaintext content. We may delete expired or abusive records at the ciphertext/metadata level in the ordinary course of operating the Protocol.

---

## 8. Prohibited Uses

You must not use the Protocol to store, transmit, request, or facilitate:

- Malware, exploit code, or other content designed to damage, disable, or gain unauthorized access to any system or network;
- Content that infringes the intellectual property, privacy, or other legal rights of any third party;
- Content that is unlawful in the jurisdiction from which it is submitted or accessed, including child sexual abuse material, material supporting terrorism, or stolen credentials/data;
- Coordinated abuse of free-tier allowances, including duplicate-payload farming, Sybil wallet generation, or artificial read-farming intended to extract creator-royalty payments without legitimate use;
- Any attempt to circumvent, disable, or interfere with the Protocol's payment, rate-limiting, or anti-abuse mechanisms.

Violation of this section may result in rate-limiting, denial of free-tier allowances, blocking of specific wallet addresses or request patterns, or refusal of service, at our discretion and without prior notice.

---

## 9. Intellectual Property

The Protocol's software, branding, and documentation are owned by their respective rights holders and are protected by applicable intellectual property laws. These Terms do not grant you any right to use our trademarks, logos, or branding except as necessary to reference or link to the Protocol. You retain all rights in any content you encrypt and submit to the Protocol, subject to the license you separately grant any Reader by making a Memory available for paid or free access.

---

## 10. Disclaimers

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE PROTOCOL IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PROTOCOL WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECT WILL BE CORRECTED.

You are solely responsible for the software, scripts, or systems you use to interact with the Protocol, and for any consequence of their operation, including erroneous, excessive, or unintended requests or payments.

---

## 11. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL WE, OUR OPERATORS, CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR DIGITAL ASSETS, ARISING OUT OF OR RELATING TO YOUR USE OF THE PROTOCOL, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE PROTOCOL WILL NOT EXCEED THE GREATER OF (A) THE TOTAL FEES YOU PAID TO US IN THE THREE MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) USD $100.

Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.

---

## 12. Indemnification

You agree to indemnify, defend, and hold harmless the Protocol's operators, contributors, and affiliates from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with: (a) your use or misuse of the Protocol; (b) content you submit, store, or request via the Protocol; (c) your violation of these Terms; or (d) your violation of any applicable law or third-party right.

---

## 13. Risk Disclosures

Use of the Protocol involves inherent risks associated with blockchain technology and digital assets, including but not limited to: price volatility of Digital Assets used for payment; irreversible loss of funds due to incorrect addresses, lost keys, or signed transactions; smart contract or protocol-level vulnerabilities; network congestion or downtime on underlying blockchain networks; and regulatory uncertainty regarding digital assets in your jurisdiction. You assume all such risks by using the Protocol.

---

## 14. Privacy

Because the Protocol is designed around zero-knowledge, client-side encryption, we collect and retain only the minimum operational data necessary to run the service: wallet addresses that interact with the Protocol, encrypted content and its metadata (size, tags, timestamps, expiration), and payment/settlement records. We do not collect names, physical addresses, or other traditional personal information as a condition of using the Protocol, and we have no visibility into the plaintext content of any Memory. Standard web server logs (such as IP addresses of incoming requests) may be retained temporarily for security and abuse-prevention purposes.

**Optional public profiles.** A user may voluntarily create a profile (display name, bio, links) and set it to "public." A public profile, and the list of documents published by that wallet, is displayed at a static, permanent URL and is intended to be indexed by search engines — treat anything entered into a public profile as published, public information, not private data. Profiles default to private and are never made public without the user's own explicit action. A user may permanently delete their profile at any time (not merely revert it to private), which removes it from the Protocol's own pages; we cannot retract copies already indexed or cached by third parties (such as search engines) before deletion.

**Top-creators leaderboard.** A public profile's lifetime creator-royalty earnings and published-document count are additionally displayed on the Protocol's public top-creators leaderboard. This is derived entirely from data the profile's own visibility setting already makes public (Section 14, above); a profile kept private is never included in the leaderboard.

---

## 15. Modifications to the Protocol and These Terms

We may modify, suspend, or discontinue any part of the Protocol, and may update these Terms, at any time. Material changes to these Terms will be reflected by an updated "Last Updated" date above. Continued use of the Protocol after an update constitutes acceptance of the revised Terms. Changes to pricing or technical behavior are additionally reflected in the Protocol's live discovery manifest.

---

## 16. Suspension and Termination

We may restrict, rate-limit, or refuse service to any wallet address, IP address, or request pattern at our sole discretion, including for suspected violation of Section 8 (Prohibited Uses), without prior notice. Because the Protocol does not use accounts, "termination" takes the form of refusing to process further requests; it does not affect Memories already paid for and stored, subject to their normal expiration under Section 7.

---

## 17. Governing Law & Dispute Resolution

These Terms are governed by the laws of the jurisdiction in which the Protocol operator is organized, without regard to conflict-of-laws principles, except where mandatory local consumer-protection law provides otherwise. Any dispute arising out of or relating to these Terms or the Protocol will be resolved through good-faith negotiation in the first instance; if unresolved, the parties agree to submit to the exclusive jurisdiction of the courts located in that jurisdiction, unless applicable law requires otherwise.

---

## 18. Force Majeure

We are not liable for any failure or delay in performance resulting from causes beyond our reasonable control, including acts of God, natural disaster, war, terrorism, civil unrest, labor disputes, internet or utility failures, governmental action, or failures of third-party infrastructure (including blockchain networks, facilitators, or cloud providers) that the Protocol relies on.

---

## 19. Severability & Entire Agreement

If any provision of these Terms is held unenforceable, the remaining provisions will remain in full force and effect, and the unenforceable provision will be replaced by an enforceable provision that most closely reflects its original intent. These Terms, together with any documents they expressly incorporate by reference (including the Protocol's published pricing and discovery manifest), constitute the entire agreement between you and us regarding the Protocol.

---

## 20. Contact

Questions about these Terms may be directed to the Protocol operator's designated contact address, as published on the Protocol's landing page.
