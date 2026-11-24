# CollabSpace - Real-Time Collaborative Document Editor

CollabSpace is a real-time collaborative Notion/Figma-style document editor built with Next.js 15, TipTap v3, Yjs (CRDTs), a custom Node.js WebSocket relay server, and PostgreSQL managed via Prisma ORM.

## 🚀 Key Features

- **Real-Time Collaboration**: Instant bidirectional document sync powered by Yjs Conflict-Free Replicated Data Types (CRDTs) and WebSockets.
- **Awareness & Presence**: Multi-user online indicators, colored selection carets, and dynamic user avatar stacks.
- **Rich-Text Editing**: TipTap v3 editor supporting Headings, Bold, Italic, Bullet Lists, and custom formatting.
- **Auto-Persistence**: Debounced automatic auto-save sync directly to PostgreSQL via RESTful Next.js API routes.
- **Version History & Snapshots**: Dedicated snapshot tracking model to capture page revisions over time.
- **Document Export**: One-click export to Markdown (`.md`) format directly from the editor toolbar.

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 15 (App Router), React, TipTap v3
- **CRDT Engine**: Yjs (`y-websocket`, `y-prosemirror`)
- **WebSocket Gateway**: Custom Node.js WebSocket relay server (`y-websocket/bin/utils`)
- **Database**: PostgreSQL
- **ORM**: Prisma (v5)
- **Styling**: Tailwind CSS & Custom CSS

---

## ⚙️ Getting Started & Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL running locally or via a cloud instance (e.g., Supabase / Neon)

---

### 1. Environment Setup

Clone the repository and install all required dependencies:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd collab-workspace
npm install