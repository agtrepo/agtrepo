// WebMCP tool registration for in-browser agents, per
// https://webmachinelearning.github.io/webmcp/ (imperative API:
// document.modelContext.registerTool). This is a distinct surface from the
// site's own MCP server at /mcp -- that's a backend protocol for headless
// agents authenticating with x402 payments; this exposes safe, read-only
// browsing actions to an agent embedded in the visitor's own browser (e.g. a
// browser assistant), using no credentials of its own.
//
// Only free, read-only, non-mutating actions are exposed here on purpose:
// paid actions (store/read/extend a memory) require an x402 payment signed
// by a wallet, which isn't something a generic in-page script should be able
// to trigger on a visitor's behalf without their explicit, out-of-band
// consent -- those stay behind the REST API / MCP server, not this.
(function () {
  "use strict";

  // The spec's canonical namespace is document.modelContext; some earlier
  // drafts/polyfills exposed navigator.modelContext instead. Feature-detect
  // both and no-op entirely in browsers that support neither.
  var modelContext = (typeof document !== "undefined" && document.modelContext) ||
    (typeof navigator !== "undefined" && navigator.modelContext);
  if (!modelContext || typeof modelContext.registerTool !== "function") return;

  var controller = new AbortController();
  // Tools are page-scoped -- unregister them once this page is being torn
  // down, per the spec's guidance to use an AbortSignal for cleanup.
  window.addEventListener("pagehide", function () {
    controller.abort();
  });

  function toolResult(value) {
    return { content: [{ type: "text", text: JSON.stringify(value) }] };
  }

  async function getJson(path) {
    const res = await fetch(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Request failed: " + res.status);
    return res.json();
  }

  var NAVIGABLE_PATH_RE = /^\/(search|leaderboard|examples|legal|stats|documents\/[^/]+|creators\/[^/]+)$/;

  var register = modelContext.registerTool.bind(modelContext);
  var opts = { signal: controller.signal };

  register(
    {
      name: "search_documents",
      description:
        "Search agtrepo (the A2A Persistent Memory Protocol) for stored documents by tag overlap. Returns titles, tags, and metadata -- not the encrypted content itself.",
      inputSchema: {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" }, description: "Tags to search for (matched by overlap)." },
          limit: { type: "number", description: "Max results, up to 50.", default: 20 },
        },
        required: ["tags"],
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      async execute(input) {
        const tags = Array.isArray(input && input.tags) ? input.tags : [];
        if (tags.length === 0) return toolResult({ error: "at least one tag is required" });
        const qs = new URLSearchParams({ tags: tags.join(",") });
        if (input && input.limit) qs.set("limit", String(input.limit));
        return toolResult(await getJson("/api/search/documents?" + qs.toString()));
      },
    },
    opts
  );

  register(
    {
      name: "search_creators",
      description: "Search agtrepo for public creator profiles by name or bio text.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search query." },
          limit: { type: "number", description: "Max results, up to 50.", default: 20 },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      async execute(input) {
        const query = (input && input.query) || "";
        if (!query.trim()) return toolResult({ error: "query is required" });
        const qs = new URLSearchParams({ q: query });
        if (input && input.limit) qs.set("limit", String(input.limit));
        return toolResult(await getJson("/api/search/creators?" + qs.toString()));
      },
    },
    opts
  );

  register(
    {
      name: "get_top_creators",
      description: "Get agtrepo's top creators, ranked by lifetime revenue earned from paid reads of their stored memories.",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number", description: "Max results, up to 100.", default: 20 } },
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
      async execute(input) {
        const qs = new URLSearchParams();
        if (input && input.limit) qs.set("limit", String(input.limit));
        return toolResult(await getJson("/api/creators/leaderboard?" + qs.toString()));
      },
    },
    opts
  );

  register(
    {
      name: "get_live_stats",
      description: "Get agtrepo's live storage stats: how many memories are stored and how much data, in total.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      async execute() {
        return toolResult(await getJson("/stats.json"));
      },
    },
    opts
  );

  register(
    {
      name: "get_protocol_info",
      description:
        "Get agtrepo's machine-readable protocol description: pricing, TTL limits, network, and API endpoints for the A2A Persistent Memory Protocol.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: false, consequentialHint: false },
      async execute() {
        return toolResult(await getJson("/.well-known/agent-memory.json"));
      },
    },
    opts
  );

  register(
    {
      name: "navigate_to",
      description:
        "Navigate the current browser tab to a page within agtrepo (search, leaderboard, examples, legal, stats, or a specific document/creator page).",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Site-relative path, e.g. \"/search\", \"/leaderboard\", \"/documents/<id>\", \"/creators/<slug>\".",
          },
        },
        required: ["path"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false, consequentialHint: false },
      async execute(input) {
        const path = (input && input.path) || "";
        if (!NAVIGABLE_PATH_RE.test(path)) return toolResult({ error: "not a navigable path" });
        window.location.href = path;
        return toolResult({ navigatedTo: path });
      },
    },
    opts
  );
})();
