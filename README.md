# DevBrain

> DevBrain: Your personal productivity assistant for organizing documents, managing tasks, and turning information into action. 

---

Built with ❤️ for **FP Camin Alpro 2026**

## What DevBrain Can Do

| Capability | Summary |
|---|---|
| **Agentic RAG Chat** | The AI acts as an autonomous agent. It plans which tools to call, executes them in sequence (up to 8 steps), observes the results, and iterates before answering. It can retrieve document chunks, list schedules, read full documents, and even create new schedule entries, all in a single conversation turn. |
| **Hybrid RAG Retrieval** | Document retrieval combines semantic search (pgvector cosine similarity) and keyword search (PostgreSQL full-text), fused via Reciprocal Rank Fusion (RRF), so questions answered by exact terms and conceptual questions both get accurate results. |
| **Multi-format Knowledge Base** | Upload PDFs, DOCX, CSV, Markdown, and plain text files. Text is auto-extracted (including scanned pages via Gemini Vision), chunked, and indexed for AI retrieval. |
| **Smart Folder Organization** | Create colored folders. On upload, AI auto-suggests the best existing folder based on document content. |
| **Schedule & Task Management** | Create sessions, tasks, and events with reminders, status tracking, and calendar organization. |
| **Google Calendar Sync** | DevBrain can synchronize to your Google Calendar schedules automatically. |
| **Browser Notifications** | Scheduled reminders fire in the browser at the configured offset before each session. |
| **Persistent Chat History** | The last 50 AI messages are stored in the database and survive page refreshes. The rolling window sends the last 20 to Gemini to stay within context limits. |
| **AI Dashboard Insights** | Home page shows usage statistics and AI-generated productivity insights based on your documents. |
| **Math & Code Rendering** | AI responses and document previews render LaTeX math (KaTeX) and syntax-highlighted code blocks (Shiki). |
| **PDF Export** | Export any stored document back to a downloadable PDF from the browser. |

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Frontend](#frontend)
- [Backend & Server Actions](#backend--server-actions)
- [AI Implementation](#ai-implementation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Tech Stack

### Core Framework

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.5 |
| Language | TypeScript | ^5 |
| Runtime | React | 19 |
| Deployment | Vercel | - |

### Styling & UI

| Layer | Technology |
|---|---|
| CSS Framework | Tailwind CSS v4 (configured via `globals.css`) |
| Component Library | Shadcn UI (components in `src/components/ui/`) |
| Headless Primitives | Base UI (`@base-ui/react`) |
| Icons | Lucide React |
| Animation | tw-animate-css |

### Backend & Data

| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth - email + Google OAuth |
| File Storage | Supabase Storage (PDFs, DOCX binaries) |
| Vector Search | pgvector (PostgreSQL extension, HNSW index) |
| ORM / Query | Supabase JS client (typed, RLS-enforced) |

### AI & Document Processing

| Layer | Technology |
|---|---|
| AI Chat Model | Google Gemini 2.5 Flash |
| Embedding Model | `gemini-embedding-2` (768-dimensional vectors) |
| AI SDK | Vercel AI SDK |
| PDF Parsing | pdfjs-dist |
| DOCX Parsing | Mammoth |
| CSV Parsing | PapaParse |
| Math Rendering | KaTeX |
| Code Highlighting | Shiki |
| Markdown | react-markdown + remark-gfm |
| Charts | Recharts |
| PDF Export | jsPDF |

### External APIs

| API | Purpose |
|---|---|
| Google Calendar API (`googleapis`) | Bi-directiodnal schedule sync |
| Google Generative AI API | Gemini chat + embeddings + vision |

### Testing

| Tool | Purpose |
|---|---|
| Vitest | Unit test runner |
| @testing-library/react | Component testing utilities |
 
---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  React Server Components     Client Components                  │
│  (reads via DAL)             (forms, modals, AI widget)         │
└────────────┬────────────────────────┬───────────────────────────┘
             │ Server Actions (CRUD)  │ fetch() / useActionState
             ▼                        ▼
┌────────────────────────┐   ┌────────────────────────────────────┐
│   Next.js Server       │   │         API Routes                 │
│   Actions              │   │                                    │
│   src/actions/         │   │  POST /api/chat                    │
│   ├── schedules.ts     │   │    └─ Gemini stream via AI SDK     │
│   ├── folders.ts       │   │  POST /api/describe-images         │
│   ├── documents.ts     │   │    └─ Gemini Vision (scanned PDFs) │
│   └── chat.ts          │   │  POST /api/suggest-folder          │
│                        │   │    └─ AI folder classification     │
│   Data reads via       │   │  POST /api/calendar                │
│   src/lib/dal.ts       │   │    └─ Google Calendar OAuth sync   │
└────────────┬───────────┘   └───────────────┬────────────────────┘
             │                               │
             ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (BaaS)                              │
│                                                                 │
│  PostgreSQL           pgvector              Storage Bucket      │
│  ├── profiles         ├── document_chunks   └── PDFs, DOCX      │
│  ├── documents            (vector 768)                          │
│  ├── document_chunks  Realtime                                  │
│  ├── document_folders └── schedules table                       │
│  ├── folders          RLS                                       │
│  ├── schedules        └── all queries scoped to auth.uid()      │
│  └── chat_messages                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural rule:** Server Components read data directly through `lib/dal.ts`. All mutations go through Server Actions in `src/actions/`. API Routes are only used for streaming (AI chat) and complex external integrations (Google Calendar).

---

## Frontend

### Route Groups

```
src/app/
├── page.tsx                        # Landing page (public)
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
└── (dashboard)/
    ├── layout.tsx                  # Sidebar + floating AI widget (always mounted)
    ├── home/page.tsx               # Stats cards + AI-generated insights
    ├── knowledge/page.tsx          # Document library grouped by folder
    ├── schedule/page.tsx           # Calendar grid + upcoming sessions panel
    ├── tasks/page.tsx              # Task list (Today / Tomorrow / This Week)
    ├── chat-history/page.tsx       # Persistent AI conversation log
    └── settings/page.tsx           # Profile + Google Calendar integration
```

### Design System

Tailwind v4 tokens are declared as CSS custom properties inside `@theme {}` in `src/app/globals.css`:

```css
--color-primary:   #00E5FF;   /* cyan accent */
--color-surface:   #020817;   /* darkest background */
--color-surface-2: #0B1324;   /* card background */
--color-muted:     #132238;   /* subtle borders */
--color-foreground: #FFFFFF;
```

The landing page hero animations (orbital rings, floating icon plates, lightning strikes) are built purely in CSS and SVG - no external animation libraries.

### Component Map

```
src/components/
│
├── ai-widget/              # Floating AI chat panel (draggable + resizable)
│   ├── AiWidget.tsx        # Drag/resize state, panel show/hide
│   ├── ChatWindow.tsx      # Message list, input, streaming display
│   ├── ChatHistoryClient.tsx
│   └── MessageBubble.tsx   # Markdown + math + code rendering per message
│
├── knowledge/
│   ├── KnowledgeBase.tsx   # Groups docs by folder
│   ├── FolderSection.tsx   # Collapsible folder with document list
│   ├── DropZone.tsx        # Drag-and-drop upload + AI folder suggestion
│   ├── DocumentTable.tsx   # Flat table for uncategorized documents
│   └── FolderManagerDropdown.tsx
│
├── schedule/
│   ├── ScheduleDashboard.tsx   # Calendar grid + upcoming panel
│   ├── ScheduleList.tsx        # Filterable list (All / Unfinished / Finished / Overdue)
│   ├── TaskListView.tsx        # Grouped by Today / Tomorrow / This Week
│   ├── LocalTimeRange.tsx      # Formats times in user's local timezone
│   └── EventDetailModal.tsx    # View + inline-edit modal for a single event
│
├── landing/
│   ├── BrainHeroVisual.tsx     # Animated SVG brain diagram
│   └── LandingCursor.tsx       # Three-layer custom cursor effect
│
├── layout/
│   ├── Sidebar.tsx             # Navigation + storage usage bar
│   └── NotificationBell.tsx    # Reminder dropdown
│
├── auth/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
│
├── settings/
│   └── SettingsClientSection.tsx
│
└── ui/                         # Shared primitives (Shadcn-based)
    ├── button.tsx
    └── toast-notification.tsx
```

### State Management

React Context only:

| Context | File | Purpose |
|---|---|---|
| `AiChatContext` | `src/lib/context/AiChatContext.tsx` | Shares AI message stream between `AiWidget` and `ChatHistoryClient` |
| `StorageContext` | `src/lib/context/StorageContext.tsx` | Tracks Supabase Storage usage for the sidebar progress bar |
| `NotificationContext` | `src/lib/context/NotificationContext.tsx` | Drives browser reminders using `setTimeout` per schedule |

---

## Backend & Server Actions

### Server Actions (Mutations)

All actions authenticate the user via `supabase.auth.getUser()` before touching the database.

**`src/actions/schedules.ts`**
```typescript
createSchedule(formData)          // Zod-validated insert
updateSchedule(id, data)          // Update title / time / reminder offset
updateScheduleStatus(id, status)  // Completed | Missed | Upcoming
deleteSchedule(id)                // Also removes linked Google Calendar event
importSchedulesFromGcal(events)   // Deduplicated import (keyed on gcal_event_id)
```

**`src/actions/folders.ts`**
```typescript
createFolder(formData)                        // Named + colored folder
renameFolder(id, name)
deleteFolder(id)                              // Cascades to document_folders junction
setDocumentFolders(documentId, folderIds[])   // Atomically replaces all folder assignments
addDocumentToFolder(documentId, folderId)
removeDocumentFromFolder(documentId, folderId)
```

**`src/actions/documents.ts`** - Document save + embed pipeline

```
Upload
  └─ 1. Insert document record into `documents`
  └─ 2. chunkText()   -> split into 1500-char chunks with 150-char overlap
  └─ 3. embedChunks() -> Gemini embedding-2 -> vector(768) per chunk
  └─ 4. Batch insert chunks into `document_chunks`
```

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Streaming AI chat with up to 8 tool steps |
| `/api/describe-images` | POST | Gemini Vision analysis of base64-encoded PDF page images |
| `/api/suggest-folder` | POST | AI picks the best matching folder name` |
| `/api/calendar` | POST | Google Calendar OAuth sync schedules |

### Data Access Layer

`src/lib/dal.ts` centralizes all read queries. React's `cache()` deduplicates calls within a single server render pass.

```typescript
getDocuments()                  // List dcouments
getDocumentById(id)             // Single document with full text content
getSchedules()                  // All schedules, ordered by start_time
getChatMessages()               // Last 50 messages per user
getFolders()                    // List folder
getDocumentsWithFolders()       // Docs with folder assignments joined
retrieveRelevantChunks(query)   // Hybrid RAG: semantic + keyword -> RRF fusion
```

---

## AI Implementation

### Hybrid Agentic RAG Pipeline

**Illustration**

[RAG Pipeline](Assets/Pipeline AI.png)

```
User Query
    │
    ├─── Semantic Search ──────────────────────────────────┐
    │    embedQuery(query) -> vector(768)                  │
    │    pgvector cosine similarity vs stored chunks       │
    │                                                      │
    └─── Keyword Search ───────────────────────────────────┤
         plainto_tsquery('simple', query)                  │
         GIN index on tsvector column                      │
                                                           │
    ┌──────────────────────────────────────────────────────┘
    │
    └─── RRF Fusion
         score = 1/(60 + rank_semantic) + 1/(60 + rank_keyword)
         Top 15 chunks returned, grouped by document title
```

**Chunking** (`src/lib/chunker.ts`): 1500-char max, 150-char overlap, splits on paragraph boundaries before hard-cutting.

**Embedding** (`src/lib/embeddings.ts`): `gemini-embedding-2`, 768 dimensions. `embedChunks()` runs at save time; `embedQuery()` runs at search time.

**SQL function** in `supabase/migrations/init.sql`:
```sql
CREATE OR REPLACE FUNCTION match_chunks_hybrid(
  query_embedding vector(768),
  query_text      text,
  match_user_id   uuid,
  match_count     int DEFAULT 5,
  rrf_k           int DEFAULT 60
)
RETURNS TABLE (content text, document_title text, rrf_score double precision)
```

### AI Chat Tools (`/api/chat`)

The model (`gemini-2.5-flash`) receives a structured system prompt and 8 callable tools:

| Tool | Triggered when |
|---|---|
| `retrieveContext` | Any document question - called first, before answering |
| `listDocuments` | User asks what's in their knowledge base |
| `getDocumentContent` | User wants to read a full specific document |
| `listSchedules` | Any question about schedules or tasks |
| `createSchedule` | After confirming all details with the user |
| `updateSchedule` | User asks to change an existing schedule |
| `deleteSchedule` | After user confirms deleting a schedule |
| `deleteDocument` | After user confirms deleting a document |

Tool calling is capped at **8 steps** (`stopWhen: stepCountIs(8)`) to prevent loops. The rolling context window sends the **last 20 messages** to Gemini; the **last 50** are stored in the database.

### PDF Image Analysis (Gemini Vision)

For scanned or image-heavy PDFs:
1. `src/lib/pdf-parser.ts` detects pages where the text-to-image ratio is low
2. Those pages are rendered to canvas at 2× resolution
3. Canvas data is base64-encoded and posted to `/api/describe-images`
4. Gemini Vision returns text descriptions
5. Descriptions are appended to the document's text content before chunking and indexing

### Smart Folder Suggestion

On file upload, `DropZone.tsx` fires a background request to `/api/suggest-folder` with the document title and first 500 characters. Gemini selects the best existing folder name, or returns `null`. When `null`, the UI nudges the user to create a new folder.

---

## Database Schema

Every table is protected by **Row Level Security (RLS)** - all queries are automatically scoped to the authenticated user's `auth.uid()`.

```sql
profiles          -- Extends auth.users; auto-created on signup via trigger
documents         -- Stored documents (text content + metadata)
document_chunks   -- RAG chunks with vector(768) embeddings
document_folders  -- Junction: many-to-many documents <-> folders
folders           -- Named, colored folders
schedules         -- Study sessions with status + gcal_event_id
chat_messages     -- Persistent AI conversation history (last 50)
```

**Indexes:**

| Index | Type | Purpose |
|---|---|---|
| `document_chunks_embedding_idx` | HNSW (pgvector) | Fast cosine similarity search |
| `document_chunks_fts_idx` | GIN (tsvector) | Full-text keyword search |
| `schedules_start_time_idx` | B-tree | Chronological schedule queries |

**Realtime:** `schedules` table is published to `supabase_realtime` for live status updates.

---

## Project Structure

```
devbrain/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── (auth)/               # Login, register, password reset
│   │   ├── (dashboard)/          # Protected routes + shared layout
│   │   └── api/                  # chat, describe-images, suggest-folder, calendar
│   │
│   ├── actions/                  # Server Actions (all mutations)
│   │   ├── schedules.ts
│   │   ├── folders.ts
│   │   ├── documents.ts
│   │   └── chat.ts
│   │
│   ├── components/               # React components (see Component Map) [Component Map](#-Component-Map)
│   │
│   ├── lib/
│   │   ├── dal.ts                # All read queries (React cache-wrapped)
│   │   ├── chunker.ts            # Text splitting for RAG
│   │   ├── embeddings.ts         # Gemini embedding wrappers
│   │   ├── gemini.ts             # Model config + system prompt
│   │   ├── pdf-parser.ts         # PDF text extraction + image detection
│   │   ├── file-parser.ts        # Multi-format parser dispatcher (PDF/DOCX/CSV/MD/TXT)
│   │   ├── pdf-export.ts         # PDF download from document content (jsPDF)
│   │   ├── utils.ts              # Date formatting, className helpers
│   │   ├── context/              # AiChatContext, StorageContext, NotificationContext
│   │   └── supabase/             # Supabase client factory (server + browser variants)
│   │
│   ├── types/
│   │   └── index.ts              # Shared TypeScript interfaces
│   │
│   └── __tests__/
│       └── chunker.test.ts       # Vitest unit tests for text chunking
│
├── supabase/
│   └── migrations/
│       └── init.sql              # Full schema
│
└── public/
    └── pdf.worker.min.mjs        # PDF.js worker (required for client-side PDF parsing)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the `pgvector` extension enabled
- A Google Cloud project with **Generative AI API** and **Google Calendar API** enabled

### Installation

```bash
git clone https://github.com/your-username/devbrain.git
cd devbrain
npm install
```

### Database Setup

1. Open your Supabase project -> SQL Editor
2. Paste and run `supabase/migrations/init.sql`

This creates all tables, RLS policies, indexes, the `match_chunks_hybrid` stored function, and the storage bucket in one shot.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
npm test            # Run once
npm run test:watch  # Watch mode
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI (server-onl)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Public app URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Google OAuth** for Calendar sync must be configured in Supabase under Authentication -> Providers -> Google. Add the Calendar API scope (`https://www.googleapis.com/auth/calendar`) in the Google Cloud OAuth consent screen.

---

