# Chat LMS — Current Progress

## Tech Stack

| Layer    | Technology                  |
| -------- | --------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript |
| Styling  | Tailwind CSS v4 (Emerald/Slate palette) |
| Backend  | Supabase (Postgres, Auth, Realtime, Storage) |
| Auth     | Supabase Auth + @supabase/ssr (cookie-based sessions everywhere) |
| Hosting  | Not yet deployed            |

---

## Current State

**RLS is currently DISABLED** on rooms, room_members, and messages tables (temporary workaround during development due to a persistent RLS policy evaluation issue with the rooms INSERT policy). Profiles RLS remains enabled.

**Core messaging is functional** — teachers and students can send and receive messages in both direct and group rooms, with real-time updates via Supabase Realtime.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Geist font, global CSS)
│   ├── page.tsx                # Entry point — renders ChatLayout (force-dynamic)
│   ├── globals.css             # Tailwind imports + scrollbar styling
│   └── login/
│       └── page.tsx            # Login / Sign Up page with tabs and role selection
├── components/chat/
│   ├── ChatLayout.tsx          # Top-level shell: sidebar + main chat area, state management
│   ├── RoomList.tsx            # Left sidebar — room list, create room button (teachers), logout
│   ├── ChatHeader.tsx          # Active room header bar (name, type badge, classwork + add member buttons)
│   ├── MessageList.tsx         # Scrollable message feed with date dividers + auto-scroll
│   ├── MessageBubble.tsx       # Individual bubble — text, AssignmentCard, SubmissionCard
│   ├── MessageInput.tsx        # Bottom input bar + "+" button for teachers to create assignments
│   ├── CreateRoomModal.tsx     # Modal for creating rooms (name, type: group/announcement)
│   ├── AddMemberModal.tsx      # Modal for adding students to rooms by email lookup
│   ├── CreateAssignmentModal.tsx # Modal for assignments (title, desc, score, due date, file upload)
│   ├── SubmitAssignmentModal.tsx # Modal for student submissions (file upload + link + comments)
│   └── ClassworkSidebar.tsx     # Slide-in sidebar: assignment list, submission counts, deadline check
├── hooks/
│   ├── use-chat.ts             # useChat(roomId) — fetch messages + Realtime subscription + addMessage
│   ├── use-rooms.ts            # useRooms() — fetch rooms user belongs to
│   └── use-current-user.ts     # useCurrentUser() — Supabase auth state + auth change listener
├── lib/
│   ├── supabase.ts             # Browser-side Supabase client (createBrowserClient from @supabase/ssr)
│   ├── supabase-server.ts      # Server Component Supabase client (cookie-based)
│   ├── supabase-middleware.ts   # Middleware Supabase client (session refresh + redirects)
│   └── messages.ts             # sendMessage() — inserts message + returns row with sender profile
├── types/
│   └── chat.ts                 # TypeScript types, MessageRow → Message converter (toMessage)
└── middleware.ts               # Route protection — unauthenticated → /login, authenticated on /login → /

supabase/
└── schema.sql                  # Full database schema + RLS policies + triggers
```

---

## Features — Detailed Breakdown

### 1. Authentication & Authorization

| Feature | Status | Details |
| ------- | ------ | ------- |
| Sign Up | ✅ Working | Email/password with full name and role selection (Student/Teacher) |
| Login | ✅ Working | Email/password via `signInWithPassword` |
| Logout | ✅ Working | Button in sidebar header, signs out + redirects to `/login` |
| Route Protection | ✅ Working | Middleware redirects unauthenticated users to `/login` |
| Session Management | ✅ Working | Cookie-based via `@supabase/ssr`, synced across browser/middleware/server |
| Auto Profile Creation | ✅ Working | Database trigger creates profile row on signup with role from metadata |
| Email Confirmation | ⏭️ Disabled | Turned off in Supabase dashboard for hackathon (avoids rate limits) |

**Auth Flow:**
1. Middleware runs on every request — checks auth, refreshes session cookies
2. Sign Up: collects email, password, full name, role → `supabase.auth.signUp` with `options.data: { full_name, role }` → trigger creates profile → redirect to `/`
3. Login: `signInWithPassword` → `router.refresh()` + `router.push("/")` to ensure cookies are set
4. Browser client uses `createBrowserClient` from `@supabase/ssr` (cookies, not localStorage)

### 2. Room Management

| Feature | Status | Details |
| ------- | ------ | ------- |
| Create Room | ✅ Working | Teachers only — name + type (group/announcement) via CreateRoomModal |
| Room Types | ✅ Working | `group` (everyone can post), `announcement` (teachers only post) |
| Add Members | ✅ Working | Teachers add students by email via AddMemberModal, with duplicate check |
| Room List | ✅ Working | Sidebar shows all rooms user belongs to, with last message preview |
| Room Switching | ✅ Working | Click room in sidebar → tears down old Realtime subscription, loads new room |
| Direct Messages | ✅ Working | Room type `direct` supported in schema and UI |

**Room Creation Flow (CreateRoomModal):**
1. Teacher enters room name, selects type (Group Chat / Announcements)
2. Inserts into `rooms` table with `created_by = user.id`
3. Inserts creator as first member in `room_members`
4. Sidebar auto-refreshes to show new room

**Add Member Flow (AddMemberModal):**
1. Teacher enters student email
2. Looks up profile by email in `profiles` table
3. Checks if user is already a member (prevents duplicates)
4. Inserts into `room_members`
5. Shows success/error feedback

### 3. Messaging

| Feature | Status | Details |
| ------- | ------ | ------- |
| Text Messages | ✅ Working | Standard chat messages with sender name + timestamp |
| Optimistic Updates | ✅ Working | Sent messages appear instantly (before Realtime confirmation) |
| Real-time Delivery | ✅ Working | New messages from other users arrive via Supabase Realtime `postgres_changes` |
| Message History | ✅ Working | Full history loaded on room select, ordered by `created_at` ascending |
| Duplicate Guard | ✅ Working | Both optimistic + Realtime paths check for duplicate message IDs |
| Date Dividers | ✅ Working | "Today", "Yesterday", or formatted date between message groups |
| Auto-scroll | ✅ Working | Scrolls to bottom on new messages |
| Sender Display | ✅ Working | Sender name shown in group chats (hidden in DMs) |

**Message Send Flow:**
1. User types message → `handleSend(text)` in ChatLayout
2. Calls `sendMessage()` which inserts into `messages` table and returns the row with joined profile
3. `addMessage(toMessage(row))` immediately adds to local state (optimistic)
4. Supabase Realtime subscription fires for other users in the room
5. Realtime handler fetches sender profile, creates Message object, adds to state (with duplicate guard)

**Realtime Architecture:**
- Each room gets its own Supabase channel: `room:${roomId}`
- Subscribes to `postgres_changes` INSERT events on `messages` table filtered by `room_id`
- Channel is torn down on room switch or component unmount
- Realtime publication enabled: `alter publication supabase_realtime add table public.messages;`

### 4. Assignments (Teacher → Students)

| Feature | Status | Details |
| ------- | ------ | ------- |
| Create Assignment | ✅ Working | Teachers see "+" button next to message input |
| Assignment Modal | ✅ Working | Fields: title, description, max score, due date |
| Assignment Card | ✅ Working | Rendered in message flow with title, description, due date, max score |
| Assignment Storage | ✅ Working | `message_type = 'assignment'`, JSONB metadata: `{ title, description, max_score, due_date }` |
| Teacher-only Access | ✅ Working | "+" button hidden for students |

**Assignment Flow:**
1. Teacher clicks "+" → CreateAssignmentModal opens
2. Fills in title, description, max score, due date
3. Message inserted with `message_type = 'assignment'` and metadata JSONB
4. AssignmentCard renders in message bubble with formatted fields

### 5. Submissions (Students → Teacher)

| Feature | Status | Details |
| ------- | ------ | ------- |
| Submit Work | ✅ Working | Students see "Submit Work" button inside AssignmentCards from other senders |
| Submission Modal | ✅ Working | Fields: submission link (URL), optional comments |
| Submission Card | ✅ Working | Checkmark icon, clickable link, optional comment, emerald-green styling |
| Submission Storage | ✅ Working | `message_type = 'submission'`, JSONB metadata: `{ ref_assignment_id, link, comment }` |

**Submission Flow:**
1. Student sees AssignmentCard from teacher → clicks "Submit Work"
2. SubmitAssignmentModal opens with link + comment fields
3. Message inserted with `message_type = 'submission'` and metadata referencing the assignment
4. SubmissionCard renders with distinct emerald styling

### 6. Classwork Sidebar

| Feature | Status | Details |
| ------- | ------ | ------- |
| Toggle Button | ✅ Working | "Classwork" button in ChatHeader (visible to all roles) |
| Slide-in Panel | ✅ Working | Fixed panel slides in from right with smooth CSS transition |
| Assignment List | ✅ Working | Filters room messages for `message_type = 'assignment'`, renders as cards |
| Card Display | ✅ Working | Each card shows title, description, due date, max score, posted by |
| Submission Count | ✅ Working | Counts submissions per assignment via `metadata.ref_assignment_id` match |
| Empty State | ✅ Working | Shows placeholder when no assignments exist |
| Mobile Backdrop | ✅ Working | Semi-transparent overlay on small screens, click to close |

**Classwork Flow:**
1. User clicks "Classwork" button in ChatHeader → sidebar slides in from right
2. Component filters current room's messages client-side (no extra queries)
3. Assignment cards rendered with metadata (title, due date, max score)
4. Submission count badge shown per assignment by matching `ref_assignment_id`
5. Click "X" or backdrop to close

### 7. UI/UX

| Feature | Status | Details |
| ------- | ------ | ------- |
| WhatsApp-style Layout | ✅ Working | Fixed sidebar (360px) + main chat area |
| Message Bubbles | ✅ Working | Green/right for sender, white/left for others |
| Role-based UI | ✅ Working | Teachers see create room, add member, create assignment buttons |
| Loading States | ✅ Working | Loading indicators for messages, rooms, user auth |
| Empty States | ✅ Working | "No messages yet", "Create a room to get started" / "Waiting for a teacher..." |
| Error Display | ✅ Working | Error messages shown in modals and forms |
| Modal Dialogs | ✅ Working | All modals: backdrop click to close, Escape key, form validation |

---

## Database Schema

### Tables

| Table          | Columns | Purpose |
| -------------- | ------- | ------- |
| `profiles`     | id, email, full_name, avatar_url, role, created_at, updated_at | 1:1 with auth.users |
| `rooms`        | id, name, type, created_by, created_at | Chat rooms |
| `room_members` | room_id, user_id, joined_at (PK: room_id, user_id) | Junction table |
| `messages`     | id, room_id, sender_id, content, message_type, metadata, created_at | All messages |

### Enums

- `user_role`: student, teacher
- `room_type`: direct, group, announcement
- `message_type`: text, assignment, submission

### Indexes

- `idx_messages_room_id` — (room_id, created_at desc)
- `idx_room_members_user_id` — (user_id)
- `idx_messages_sender_id` — (sender_id)

### Triggers

- `on_auth_user_created` → `handle_new_user()` — auto-creates profile row on signup with role from user metadata
- `profiles_updated_at` → `set_updated_at()` — keeps `updated_at` current on profile edits

### RLS Policies (in schema.sql, currently disabled on rooms/room_members/messages)

| Table | Policy | Rule |
| --- | --- | --- |
| `profiles` | SELECT | All authenticated users |
| `profiles` | UPDATE | Own profile only (`id = auth.uid()`) |
| `rooms` | SELECT | `is_room_member(id)` — only rooms user belongs to |
| `rooms` | INSERT | Teachers only, must be `created_by` |
| `room_members` | SELECT | `user_id = auth.uid()` — own memberships only |
| `room_members` | INSERT | Room creator only |
| `room_members` | DELETE | Own membership only (leave room) |
| `messages` | SELECT | `is_room_member(room_id)` |
| `messages` | INSERT | Must be sender + room member; announcement rooms: teachers only |

**Helper function:** `is_room_member(p_room_id uuid)` — SECURITY DEFINER function that bypasses RLS to check room membership without infinite recursion.

---

## Bugs Fixed

1. **Signup trigger crash** — `handle_new_user()` had `set search_path = ''` which caused enum type resolution failure. Fixed by changing to `set search_path = 'public'`.
2. **RLS infinite recursion** — `room_members` SELECT policy had a self-referencing subquery. Fixed with `is_room_member()` SECURITY DEFINER helper + simplified policies.
3. **Signup → chat redirect broken** — Browser client used localStorage while middleware read cookies. Fixed by switching to `createBrowserClient` from `@supabase/ssr`.
4. **Empty roomId UUID error** — `useChat("")` fired a query with empty string for UUID column. Fixed with early return guard.
5. **Email rate limit on signup** — Disabled email confirmation in Supabase dashboard.
6. **Messages not updating after send** — Added optimistic updates via `addMessage()` callback from `useChat` hook.
7. **Middleware crash on Supabase fetch failure** — Edge Runtime `getUser()` call would crash with `Error: fetch failed`. Fixed by wrapping in try-catch and falling through to client-side auth.

## Known Issues

1. **RLS disabled on rooms/room_members/messages** — Temporary workaround. The rooms INSERT policy (`to authenticated with check(...)`) was rejecting valid teacher inserts despite correct session and profile role. Root cause unresolved. Needs investigation before production.
2. **No unread indicators** — No unread message count or visual markers on rooms.
3. **No mobile responsive layout** — Sidebar is fixed 360px, no collapse on small screens.
4. **Search bar is placeholder** — Room search input in sidebar is non-functional.
5. **Error handling on send** — Message send errors only logged to console, not displayed to user.

---

## What's Done

- [x] Supabase SQL schema with tables, enums, indexes, RLS policies, and triggers
- [x] Next.js project with TypeScript + Tailwind CSS v4
- [x] WhatsApp-style chat UI (sidebar, message bubbles, input bar)
- [x] Authentication — signup with role selection, login, logout, middleware route protection
- [x] Cookie-based SSR sessions (browser, server, middleware clients)
- [x] Room creation modal (teachers only) — name + type selection
- [x] Add member modal (teachers only) — email lookup + duplicate prevention
- [x] Real-time messaging via Supabase Realtime (postgres_changes)
- [x] Optimistic message updates (sent messages appear instantly)
- [x] Message types: text, assignment, submission with JSONB metadata
- [x] Assignment creation modal (title, description, max score, due date)
- [x] Assignment card rendering in message flow
- [x] Student submission modal (link + comments)
- [x] Submission card rendering with distinct styling
- [x] Date dividers, auto-scroll, sender name display
- [x] Loading, empty, and error states throughout UI
- [x] Database triggers for auto profile creation and timestamp updates
- [x] Classwork sidebar — slide-in panel with assignment cards + submission counts
- [x] Middleware resilience — try-catch around `getUser()` to handle Supabase fetch failures gracefully

## What's Not Done Yet

### Important
- [ ] **Re-enable RLS** — Fix the rooms INSERT policy issue and re-enable RLS on all tables
- [ ] **File uploads** — Submission link is text URL; need Supabase Storage for actual files
- [ ] **User profile page** — Edit full_name, avatar_url

### Nice to Have
- [ ] **Search** — Room search bar is non-functional placeholder
- [ ] **Unread indicators** — No unread message count or visual markers
- [ ] **Mobile responsive layout** — Sidebar doesn't collapse on small screens
- [ ] **Deployment** — Not deployed anywhere yet

---

## Environment Setup

1. Copy `.env.local.example` to `.env.local` and fill in Supabase credentials
2. Run the schema: paste `supabase/schema.sql` into Supabase SQL Editor
3. Disable email confirmation: Supabase Dashboard → Authentication → Providers → Email → turn off "Confirm email"
4. Enable realtime: `alter publication supabase_realtime add table public.messages;`
5. Temporarily disable RLS (if needed): `alter table public.rooms disable row level security; alter table public.room_members disable row level security; alter table public.messages disable row level security;`
6. `npm install && npm run dev`
