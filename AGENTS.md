<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Directives & Constraints

## 1. Git Push Policy
- **DO NOT push to git automatically under any circumstances.**
- Only run `git push` when the user explicitly gives the command/permission to do so.

## 2. Strict Firebase Quota Conservation Policy
- **Always minimize Firestore/Firebase reads and writes to the absolute maximum.**
- Never perform unbounded scans or N+1 queries on collections or subcollections (e.g. `history`, `empire_tiles`).
- Always use `limit(...)`, single-document lookups, pre-aggregated counter fields, IndexedDB persistence, or session storage caches.
- Avoid redundant writes (e.g. repeated setDoc/deleteDoc per question).

## 3. Mandatory Firebase Quota Reporting
- **In every improvement report or summary, ALWAYS provide a quantitative breakdown of Firebase Quota calculations**:
  - Estimated Document Reads (Before vs. After)
  - Estimated Document Writes (Before vs. After)
  - Classroom Concurrency Impact (e.g. 50–100 students active simultaneously)
  - Caching & Data Transfer impact (IndexedDB persistence, delta-change skipping, client-side memoization).
