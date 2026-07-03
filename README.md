# DevTrace — Cross-Repository Semantic Intelligence Dashboard

DevTrace is a professional, formal developer cockpit dashboard modeled after the GitHub dark UI interface. It demonstrates how a local LLM and semantic vector indexing system can instantly map cross-repository code impact and dependencies in an air-gapped environment.

## 🚀 Key Features

### 1. GitHub-Inspired Dashboard UI
- Clean, formal layout with top repository navigation bar (`shravankulal13-collab / devtracers`).
- Layout structure features full navigation tabs (Code, Pull Requests, Security).
- Active sprint roadmap tracking styled as Git commits & milestones.

### 2. Interactive Topology Impact Graph
- Powered by `react-flow`, rendering live dependencies and file structures.
- Hovering/searching highlights dependent nodes using high-contrast borders and glows.
- **Dynamic File Selection**: Click any node in the topology canvas to load and inspect its contents directly inside the code viewer.

### 3. Local SQLite & Vector Search Engine
- **Local SQLite DB**: Seeded with workspace files (`payment-gateway.ts`, `CheckoutButton.tsx`, `order-controller.js`, `auth-middleware.ts`, `UserProfile.jsx`) and stage-based node relations.
- **Offline Embeddings Engine**: Implements a pure JS/TS unit-normalized TF-IDF vectorizer and Cosine Similarity metric to compute real-time search impacts without external cloud endpoints.
- Semantic queries (e.g. searching "payment") trace indirect impacts (like changes to payment-gateway updating frontend keys) and feed detailed LLM diagnostics warnings to the output log.

### 4. Interactive Committing & Indexing
- Code editor is fully editable in real-time.
- Modify files and click **Commit & Index** to save content updates back to the SQLite database and trigger vector re-indexing instantly.

### 5. Automated Security Advisory Drawer
- Real-time linting of code lines to highlight vulnerabilities (e.g., hardcoded currency constraints or mock auth-token bypasses) and alert users in a GitHub Advisory-styled widget.

---

## 🏗️ System Architecture

The following diagram illustrates the data flow and execution boundaries of the air-gapped DevTrace system:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER UI                                │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌─────────────┐  │
│  │   Interactive Graph   │  │ Editable Code Editor │  │ Search Box  │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────┬──────┘  │
└──────────────┼─────────────────────────┼─────────────────────┼─────────┘
               │ (Node Clicks)           │ (Commit / Save)     │ (Query)
               ▼                         ▼                     ▼
┌──────────────┼─────────────────────────┼─────────────────────┼─────────┐
│              │                         │                     │         │
│  ┌───────────▼───────────┐  ┌──────────▼───────────┐  ┌──────▼──────┐  │
│  │     GET /api/graph    │  │    POST /api/save    │  │ GET /api/ser│  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────┬──────┘  │
│              │                         │                     │         │
│              │                         │ (Update Code)       │ (Cosine │
│              │                         │ & Recompute Embeds  │ Matcher)│
│              ▼                         ▼                     ▼         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                            SQLITE DB                             │  │
│  │                                                                  │  │
│  │  ┌───────────────┐   ┌───────────────────────┐   ┌─────────────┐ │  │
│  │  │  files Table  │   │ file_embeddings Table │   │ dependencies│ │  │
│  │  └───────────────┘   └───────────────────────┘   └─────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│                      NEXT.JS BACKEND (AIR-GAPPED)                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack
- **Framework**: Next.js (TypeScript)
- **Database**: SQLite (`sqlite3` / `sqlite`)
- **Graphing**: `@xyflow/react` (React Flow)
- **Styling**: Tailwind CSS & Vanilla CSS Design Tokens
- **Animations**: `framer-motion`
- **Icons**: `lucide-react`

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the workspace dashboard.

---

## 🔍 Evaluator Testing Guide

1. **Sprint Roadmap Navigation**:
   Click through the Sprint Stages (Stage 0, Hours 1-2, Hours 3-5, Hours 6-7) at the bottom to watch the dependency topology compile dynamically from SQLite records.
2. **Dynamic Inspector**:
   Click on the graph nodes like `UserProfile.jsx` or `order-controller.js` to see the code viewer swap content and apply language tokenized coloring.
3. **Commit & Index**:
   Modify any file in the text area (e.g. adding `// Test Comment` at the top), then click the green **Commit & Index** button. Reload the page to confirm updates persisted.
4. **Semantic Search Test**:
   Type `payment` into the semantic search box. The LLM console will output:
   `⚠️ [Ollama Audit]: Modifying 'services/payment-gateway.ts' directly impacts 'CheckoutButton.tsx' via implicit structural dependency...`
5. **Security Advisory check**:
   Select `middleware/auth-middleware.ts` to see high-severity mock token alerts appear in the Advisories panel.
