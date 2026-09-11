import type { Request, Response, NextFunction } from "express";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { paymentMiddleware } from "@x402/express";
import type { RoutesConfig } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension, declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { createFacilitatorConfig } from "@coinbase/x402";
import { config } from "./config.js";

// Mainnet facilitators (e.g. Coinbase CDP) require CDP's own auth scheme: a
// short-lived EdDSA-signed Bearer JWT per request, not a static header pair.
// createFacilitatorConfig builds the correct createAuthHeaders (and the
// correct CDP facilitator URL, overriding config.facilitatorUrl) for that;
// the public testnet facilitator (x402.org) needs no auth at all.
const facilitatorOpts =
  config.cdpApiKeyId && config.cdpApiKeySecret
    ? createFacilitatorConfig(config.cdpApiKeyId, config.cdpApiKeySecret)
    : { url: config.facilitatorUrl };

// The actual facilitator URL in use — for the discovery manifest to report
// accurately, since it can differ from config.facilitatorUrl above.
export const facilitatorUrl = facilitatorOpts.url;

function facilitatorClient(): HTTPFacilitatorClient {
  return new HTTPFacilitatorClient(facilitatorOpts);
}

export const resourceServer = new x402ResourceServer(facilitatorClient())
  .register(config.caip2, new ExactEvmScheme())
  // Bazaar (https://docs.x402.org/extensions/bazaar): lets facilitators that
  // support it catalog our paid routes for agent discovery. Registering the
  // extension alone changes nothing about payment verification/settlement --
  // it only makes routes that opt in (via gatedRoute's `bazaar` param below)
  // eligible for cataloging.
  .registerExtension(bazaarResourceServerExtension);

// Static per-route pricing for @x402/express's paymentMiddleware — takes the
// simple, unresolved PaymentOption shape directly.
export function paymentOption(priceUsd: number) {
  return {
    scheme: "exact" as const,
    price: `$${priceUsd.toFixed(8)}`,
    network: config.caip2,
    payTo: config.merchantWallet,
  };
}

// Fully-resolved PaymentRequirements, needed by @x402/mcp's createPaymentWrapper.
export async function buildAccepts(priceUsd: number): Promise<PaymentRequirements[]> {
  return resourceServer.buildPaymentRequirements({
    scheme: "exact",
    network: config.caip2,
    payTo: config.merchantWallet,
    price: `$${priceUsd.toFixed(8)}`,
  });
}

// The x402-express middleware verifies and settles the payment before our
// route handler runs, but it does not attach the verified payer address to
// `req`. By the time our handler runs, the SDK has already cryptographically
// verified this exact header, so decoding it again here is safe — we are
// reading the same payload the middleware already authenticated, not
// re-trusting unverified client input.
export function getPayerFromRequest(req: Request): `0x${string}` | null {
  const header = req.header("payment-signature") || req.header("x-payment");
  if (!header) return null;
  try {
    const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf-8")) as PaymentPayload;
    const from = (decoded.payload as { authorization?: { from?: string } } | undefined)
      ?.authorization?.from;
    return typeof from === "string" && /^0x[0-9a-fA-F]{40}$/.test(from)
      ? (from as `0x${string}`)
      : null;
  } catch {
    return null;
  }
}

// Reads the on-chain settlement tx hash the SDK attaches to the response
// after a successful paid request, for our own payment-ledger record
// keeping. Safe to call any time after the response has started sending;
// returns null if the request wasn't paid (free/trial) or settlement
// hasn't completed yet.
export function getSettledTxHashFromResponse(res: Response): string | null {
  const header = res.getHeader("payment-response");
  if (typeof header !== "string") return null;
  try {
    const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf-8")) as {
      transaction?: string;
    };
    return typeof decoded.transaction === "string" ? decoded.transaction : null;
  } catch {
    return null;
  }
}

export function getPayerFromPaymentPayload(payload: PaymentPayload): `0x${string}` | null {
  const from = (payload.payload as { authorization?: { from?: string } } | undefined)
    ?.authorization?.from;
  return typeof from === "string" && /^0x[0-9a-fA-F]{40}$/.test(from)
    ? (from as `0x${string}`)
    : null;
}

declare module "express-serve-static-core" {
  interface Request {
    x402TrialUsed?: boolean;
    x402TrialPayer?: `0x${string}`;
  }
}

// Discovery metadata for the Bazaar extension (see resourceServer's
// .registerExtension above). `discovery`'s shape mirrors the real request:
// no `body`/`pathParams` field means the route takes none. `method` and the
// resource's URL/route-template are intentionally omitted here --
// bazaarResourceServerExtension fills those in itself from the actual route
// at declaration time (see @x402/extensions/bazaar's own doc comment: "set
// by bazaarResourceServerExtension.enrichDeclaration").
export interface BazaarDiscoveryConfig {
  serviceName: string;
  tags: string[];
  discovery: Parameters<typeof declareDiscoveryExtension>[0];
}

// Wraps a single x402-gated route. If a prior trialCreditsGate middleware
// already paid for this call out of the wallet's off-chain trial-credit
// balance (req.x402TrialUsed), the SDK's payment challenge is skipped
// entirely; otherwise the normal 402-challenge/verify/settle flow runs.
export function gatedRoute(
  routeKey: string,
  priceUsd: number,
  description: string,
  bazaar?: BazaarDiscoveryConfig
) {
  const routes: RoutesConfig = {
    [routeKey]: {
      accepts: [paymentOption(priceUsd)],
      description,
      mimeType: "application/json",
      ...(bazaar && {
        serviceName: bazaar.serviceName,
        tags: bazaar.tags,
        extensions: declareDiscoveryExtension(bazaar.discovery),
      }),
    },
  };
  const middleware = paymentMiddleware(routes, resourceServer);
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.x402TrialUsed) return next();
    return middleware(req, res, next);
  };
}
