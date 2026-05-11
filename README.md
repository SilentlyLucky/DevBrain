# DevBrain

A **Second Brain** web application powered by AI. DevBrain helps you store, organize, and retrieve your study materials, then lets you have conversations with an AI that has full context of everything you've saved.

## Table of Contents

- [Requirement Analysis](#requirement-analysis)
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

## Requirement Analysis

### Problem Statement

Students and knowledge workers often struggle to organize their study materials across multiple formats (PDF, docs, md) and lack a way to query that knowledge conversationally. Existing tools either organize documents without AI retrieval, or provide AI chat without personal knowledge integration.

### Core Requirements

| Feature | Description |
|---|---|
| Knowledge Base | Upload PDFs, paste URLs, store text files with automatic text extraction |
| AI Chat | Conversational AI with access to the user's own documents |
| Schedule Management | Create, edit, and track study sessions with reminders |
| Google Calendar Sync | Bi-directional sync with Google Calendar |
| Smart Folders | AI-suggested folder categorization on document upload |
| Notifications | Browser-based reminders for upcoming sessions |
| Persistent Chat History | Last 50 messages stored per user across sessions |

### User Flow

```
Landing Page -> Register/Login -> Dashboard
                                    ├── Knowledge Base (upload & organize docs)
                                    ├── Schedule (manage sessions)
                                    ├── Tasks (kanban-style task view)
                                    ├── Home (stats & AI insights)
                                    ├── Chat History (past AI conversations)
                                    └── AI Widget (floating chat, available everywhere)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (custom design system in `globals.css`) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google OAuth) |
| Storage | Supabase Storage (for PDF/binary files) |
| AI Model | Google Gemini 2.5 Flash (`@ai-sdk/google`) |
| Embedding Model | `gemini-embedding-2` (768-dimensional vectors) |
| AI SDK | Vercel AI SDK (`ai` package) |
| Vector Search | pgvector (PostgreSQL extension) |
| External API | Google Calendar API (`googleapis`) |
| Deployment | Vercel |

---

## Architecture Overview

```
Browser (Client)
    │
    ├── Next.js Pages (React Server Components)
    │       │
    │       └── Server Actions (mutations)
    │
    ├── API Routes (streaming/external)
    │       ├── /api/chat            -> AI streaming chat
    │       ├── /api/describe-images -> Gemini Vision for PDF images
    │       ├── /api/suggest-folder  -> AI folder suggestion
    │       └── /api/calendar        -> Google Calendar sync
    │
    └── Supabase (BaaS)
            ├── PostgreSQL (main data)
            ├── pgvector (embeddings for RAG)
            ├── Row Level Security (per-user data isolation)
            └── Storage Bucket (binary files: PDFs, DOCX)
```

DevBrain uses **Next.js Server Actions** for all standard CRUD operations and **API Routes** only for streaming responses (AI chat) and complex external integrations (Google Calendar).

---

## Frontend

### Routing Structure

```
src/app/
├── page.tsx                    # Landing page (public)
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
└── (dashboard)/
    ├── layout.tsx              # Shared sidebar + AI widget
    ├── home/page.tsx           # Stats & AI insights
    ├── knowledge/page.tsx      # Document library
    ├── schedule/page.tsx       # Calendar view
    ├── tasks/page.tsx          # Task list view
    ├── chat-history/page.tsx   # Persistent chat log
    └── settings/page.tsx       # Profile & integrations
```

### Design System

All design tokens are declared in `src/app/globals.css` using CSS custom properties:

```css
--color-primary: #00E5FF;
--color-surface: #020817;
--color-surface-2: #0B1324;
--color-muted: #132238;
--color-foreground: #FFFFFF;
```

The landing page features animated hero visuals built purely in CSS and SVG - no external animation libraries. Key animations include orbital rings, floating icon plates, lightning strikes, and a custom cursor layer system (`LandingCursor.tsx`).

### Component Architecture

```
src/components/
├── ai-widget/          # Floating AI chat panel (draggable, resizable)
│   ├── AiWidget.tsx    # Main wrapper with drag/resize logic
│   ├── ChatWindow.tsx  # Active chat UI
│   ├── ChatHistoryClient.tsx
│   └── MessageBubble.tsx
│
├── knowledge/          # Document library
│   ├── KnowledgeBase.tsx     # Page root, groups docs by folder
│   ├── FolderSection.tsx     # Collapsible folder with doc list
│   ├── DropZone.tsx          # File upload + AI folder suggestion
│   ├── DocumentTable.tsx     # Flat table view for uncategorized docs
│   └── FolderManagerDropdown.tsx
│
├── schedule/           # Schedule management
│   ├── ScheduleDashboard.tsx # Calendar grid + upcoming panel
│   ├── ScheduleList.tsx      # Filterable list (All/Unfinished/Finished/Overdue)
│   ├── TaskListView.tsx      # Grouped task view (Today/Tomorrow/This Week)
│   ├── LocalTimeRange.tsx    # Get local time
│   └── EventDetailModal.tsx  # View/edit modal for single event
│
├── landing/            # Landing page components
│   ├── BrainHeroVisual.tsx   # SVG animated brain diagram
│   └── LandingCursor.tsx     # Three-layer custom cursor
│
├── layout/             # App chrome
│   ├── Sidebar.tsx
│   └── NotificationBell.tsx  # Reminder dropdown
│
├── auth/               # Auth forms
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
│
├── settings/
│   └── SettingsClientSection.tsx
│
└── ui/                 # Shared primitives
    ├── button.tsx
    └── toast-notification.tsx
```

### State Management

DevBrain uses **React Context** (no external state library) for cross-component shared state:

| Context | Location | Purpose |
|---|---|---|
| `AiChatContext` | `src/lib/context/AiChatContext.tsx` | Shares AI message stream state between `AiWidget` and `ChatHistoryClient` |
| `StorageContext` | `src/lib/context/StorageContext.tsx` | Tracks Supabase Storage usage for the sidebar storage bar |
| `NotificationContext` | `src/lib/context/NotificationContext.tsx` | Manages scheduled reminders using `setTimeout` |

---

## Backend & Server Actions

### Server Actions (CRUD)

Server Actions run on the server and are called directly from client components using `'use server'`. They always validate the authenticated user via `supabase.auth.getUser()` before touching the database.

**`src/actions/schedules.ts`**

```typescript
createSchedule(formData)         // Validate with Zod, insert to DB
updateSchedule(id, data)         // Update title/time/reminder
updateScheduleStatus(id, status) // Mark as Completed/Missed/Upcoming
deleteSchedule(id)               // Also deletes from Google Calendar if synced
importSchedulesFromGcal(events)  // Deduplicated import from Google
```

**`src/actions/folders.ts`**

```typescript
createFolder(formData)                           // Create named + colored folder
renameFolder(id, name)
deleteFolder(id)                                 // Cascades to document_folders
setDocumentFolders(documentId, folderIds[])      // Replace all folder assignments atomically
addDocumentToFolder(documentId, folderId)
removeDocumentFromFolder(documentId, folderId)
```

**`src/actions/documents.ts`** (document save + embed pipeline)

When a document is saved, it triggers:
1. Insert document record to `documents` table
2. Chunk the text with `chunkText()`
3. Embed each chunk via `embedChunks()` using Gemini
4. Batch-insert all chunks with vectors to `document_chunks`

### API Routes

**`POST /api/chat`** - Streaming AI chat
- Authenticates user via Supabase session
- Passes last 20 messages to `streamText()` with 5 AI tools available
- Streams the response back to the browser using Vercel AI SDK's `UIMessageStreamResponse`

**`POST /api/describe-images`** - PDF image analysis
- Receives base64-encoded page images from the client
- Calls Gemini Vision to generate text descriptions
- Returns descriptions to be merged into the document's text content

**`POST /api/suggest-folder`** - AI folder suggestion
- Receives document title, content preview, and list of existing folder names
- Calls Gemini to pick the best matching folder
- Returns `{ suggestion: string | null }`

**`POST /api/calendar`** - Google Calendar sync
- Uses the OAuth `provider_token` from the user's Supabase session
- Pushes DevBrain schedules to Google Calendar
- Pulls new Google Calendar events back into DevBrain (deduplication by `gcal_event_id`)

### Data Access Layer

`src/lib/dal.ts` centralizes all read queries. React's `cache()` wrapper is used on frequently-called functions to deduplicate requests within a single render pass (important for React Server Components).

```typescript
getDocuments()             // List docs (no content field for performance)
getDocumentById(id)        // Single doc with full content
getSchedules()             // All schedules ordered by start_time
getChatMessages()          // Last 50 messages
getFolders()               // All folders
getDocumentsWithFolders()  // Docs with their folder assignments joined
retrieveRelevantChunks(query) // Hybrid RAG search (see AI section)
```

---

## AI Implementation

### RAG Pipeline (Retrieval-Augmented Generation)

DevBrain uses a **Hybrid RAG** system that combines two retrieval methods, fused with **Reciprocal Rank Fusion (RRF)**:

```
User Query
    │
    ├── Semantic Search (pgvector cosine similarity)
    │       Query -> Embed with gemini-embedding-2 -> vector(768)
    │       Compare against stored chunk embeddings
    │
    └── Keyword Search (PostgreSQL full-text search)
            Query -> plainto_tsquery('simple', query)
            Match against tsvector GIN index on chunks
    │
    └── RRF Fusion: score = 1/(k + rank_semantic) + 1/(k + rank_keyword)
            where k = 60
    │
    └── Top 15 chunks returned, grouped by document title
```

**Text Chunking** (`src/lib/chunker.ts`):
- Max chunk size: 1500 characters
- Overlap between chunks: 150 characters
- Splits on paragraph boundaries (`\n\n`) before hard-cutting
- Overlap preserves context across chunk boundaries

**Embedding** (`src/lib/embeddings.ts`):
- Model: `gemini-embedding-2`
- Dimensions: 768 (truncated to fit pgvector index)
- `embedChunks()`: batch embed at document save time
- `embedQuery()`: embed user query at search time

**Database function** (`supabase/migrations/init.sql`):

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

### AI Chat with Tools (`/api/chat`)

The AI model (`gemini-2.5-flash`) is given a detailed system prompt and 5 callable tools:

| Tool | When Used |
|---|---|
| `retrieveContext` | Any question about document content - called first before answering |
| `listDocuments` | When user asks what's in their knowledge base |
| `getDocumentContent` | When user explicitly wants to read a full document |
| `listSchedules` | Any question about schedules or tasks |
| `createSchedule` | After confirming all details with the user |

The AI follows a strict **reasoning chain** defined in `SYSTEM_PROMPT`:
1. For document questions -> `retrieveContext` first, then answer with source attribution
2. For schedule questions -> `listSchedules`, answer from real data
3. For schedule creation -> collect all fields in one message, confirm, then `createSchedule`
4. Never gives up without trying at least one follow-up strategy

Multi-step tool calling is capped at **8 steps** (`stopWhen: stepCountIs(8)`) to prevent infinite loops.

### PDF Image Analysis

For scanned PDFs or image-heavy pages, DevBrain uses Gemini Vision:

1. `src/lib/pdf-parser.ts` detects image-heavy pages (text-to-image ratio)
2. Those pages are rendered to canvas at 2x resolution
3. Canvas data is base64-encoded and sent to `/api/describe-images`
4. Gemini Vision generates text descriptions
5. Descriptions are appended to the document's text content before indexing

### Smart Folder Suggestion

When a file is uploaded, `DropZone.tsx` fires a background request to `/api/suggest-folder` with the document title and first 500 characters of content. Gemini picks the best matching folder name from the user's existing folders, or returns `null` if none match. If `null`, the UI shows a nudge to create a new folder.

---

## Database Schema

All tables use Row Level Security (RLS) - every query is automatically scoped to the authenticated user.

```sql
profiles          -- Extends auth.users; auto-created on signup via trigger
documents         -- User documents (text content + metadata)
document_chunks   -- Text chunks with vector(768) embeddings for RAG
document_folders  -- Junction table: many-to-many documents <-> folders
folders           -- Named, colored folders for document organization
schedules         -- Study sessions with status tracking + Google Calendar link
chat_messages     -- Persistent AI conversation history (last 50 per user)
```

**Key indexes:**
- `document_chunks_embedding_idx` - HNSW index for fast cosine similarity search
- `document_chunks_fts_idx` - GIN index on `tsvector` for full-text search
- `schedules_start_time_idx` - For chronological schedule queries

**Realtime:**
- `schedules` table is added to `supabase_realtime` for live status updates

---

## Project Structure

```
devbrain/
├── src/
│   ├── app/                  # Next.js App Router pages + API routes
│   ├── actions/              # Next.js Server Actions (CRUD)
│   ├── components/           # React components
│   ├── lib/
│   │   ├── chunker.ts        # Text splitting for RAG
│   │   ├── dal.ts            # Data access layer (all read queries)
│   │   ├── embeddings.ts     # Gemini embedding wrappers
│   │   ├── gemini.ts         # AI model config + system prompt
│   │   ├── pdf-parser.ts     # PDF text extraction + image detection
│   │   ├── file-parser.ts    # Multi-format file parser dispatcher
│   │   ├── pdf-export.ts     # PDF download from document content
│   │   ├── utils.ts          # Date formatting, className helpers
│   │   ├── context/          # React Context providers
│   │   └── supabase/         # Supabase client factory (server + browser)
│   └── types/
│       └── index.ts          # Shared TypeScript interfaces
├── supabase/
│   └── migrations/
│       └── init.sql          # Complete DB schema (safe to run multiple times)
├── public/
│   └── pdf.worker.min.mjs    # PDF.js worker (required for client-side PDF parsing)
└── src/__tests__/
    └── chunker.test.ts       # Unit tests for text chunking logic
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A Google Cloud project with **Generative AI API** and **Google Calendar API** enabled

### Installation

```bash
git clone https://github.com/your-username/devbrain.git
cd devbrain
npm install
```

### Database Setup

Run the migration file once on your Supabase project:

1. Open your Supabase project -> SQL Editor
2. Paste and run the contents of `supabase/migrations/init.sql`

This creates all tables, RLS policies, indexes, the `match_chunks_hybrid` function, and the storage bucket.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
npm test
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

**Google OAuth** (for Google Calendar integration) must be configured in your Supabase project under Authentication -> Providers -> Google. The Calendar API scope (`https://www.googleapis.com/auth/calendar`) must be added there.
