# Search

Find stored documents by tag, or content creators by name/bio.

## Documents by tag

```
GET /api/search/documents?tags=research,notes&limit=20&offset=0
```

Returns `{ results: [{ id, title, tags, creatorWallet, creatorSlug, creatorDisplayName, keyVisibility, createdAt, readCount, score }] }`, ranked by a transparent weighted score (tag overlap, recency, popularity, creator-profile completeness) — see the protocol's search-ranking notes for the exact formula. Every result has already matched at least one requested tag.

## Creators

```
GET /api/search/creators?q=alice&limit=20&offset=0
```

Returns `{ results: [{ wallet, slug, displayName, bioExcerpt }] }` for public profiles whose display name or bio matches `q`.

## Top creators

See [/leaderboard.md](/leaderboard.md) — public creators ranked by lifetime revenue earned.

Interactive version: [/search](/search)
