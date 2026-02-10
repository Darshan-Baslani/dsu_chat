# Chat LMS — Functionality Guide

A WhatsApp-style Learning Management System where teachers and students interact through real-time chat, assignments, submissions, and file uploads.

---

## 1. Getting Started

### Sign Up

1. Open the app — you'll land on the **Login** page.
2. Click the **Sign Up** tab.
3. Fill in:
   - **Full Name** — your display name in chats.
   - **Role** — choose **Student** or **Teacher**. This determines what actions you can perform.
   - **Email** and **Password** (min 6 characters).
4. Click **Create Account** — you're redirected to the main chat screen.

### Log In

1. Click the **Login** tab (default).
2. Enter your email and password.
3. Click **Log In** — you're redirected to the main chat screen.

### Log Out

- Click the **Logout** button at the top of the left sidebar (room list).

---

## 2. Rooms (Teacher Only — Creation & Management)

### Create a Room

1. In the left sidebar, click **+ New Room** (visible to teachers only).
2. Enter a **Room Name** (e.g., "CS 101 — Data Structures").
3. Select the **Room Type**:
   - **Group Chat** — all members can send messages.
   - **Announcements** — only teachers can post; students can only read.
4. Click **Create** — the room appears in your sidebar.

### Add Members to a Room

1. Open a room you created.
2. In the top header bar, click **Add Member** (visible to teachers only).
3. Enter the student's **email address**.
4. Click **Add** — the student is looked up and added. Duplicate members are prevented.
5. The student will now see this room in their sidebar.

### Switch Between Rooms

- Click any room in the left sidebar to switch. Messages load instantly and real-time updates begin.

---

## 3. Messaging

### Send a Text Message

1. Select a room from the sidebar.
2. Type your message in the input bar at the bottom.
3. Press **Enter** or click the **Send** button (arrow icon).
4. Your message appears immediately (optimistic update). Other room members receive it in real-time.

### Message Features

- **Sender Names** — shown above messages in group chats (hidden in direct messages).
- **Timestamps** — displayed on every message bubble.
- **Date Dividers** — "Today", "Yesterday", or a formatted date separates messages from different days.
- **Auto-scroll** — the chat automatically scrolls to the latest message.

---

## 4. Assignments (Teacher to Students)

### Create an Assignment (Teacher Only)

1. In any room, click the **+** button next to the message input bar.
2. The **Create Assignment** modal opens. Fill in:
   - **Title** — name of the assignment (required).
   - **Description** — detailed instructions, requirements, resources.
   - **Max Score** — point value (default: 100).
   - **Due Date** — deadline as date + time (required).
   - **Attachment** (optional) — click "Choose a file..." to upload a PDF, document, or any file. The file is uploaded to Supabase Storage.
3. Click **Post** — the assignment is sent as a special message in the chat.

### How Assignments Appear

- Assignments render as a **card** inside the chat with:
  - Title (bold, with clipboard icon)
  - Description
  - Due date and time
  - Max score (points)
  - **Download Attachment** link (if a file was uploaded)
  - **Submit Work** button (visible to students only)

---

## 5. Submissions (Student to Teacher)

### Submit Work (Student Only)

1. Find an assignment card in the chat.
2. Click **Submit Work** on the card.
3. The **Submit Work** modal opens. You can:
   - **Upload a File** — click "Choose a file..." to upload your work directly. The file is stored in Supabase Storage.
   - **Paste a Link** — enter a URL (GitHub repo, Google Drive, etc.). This is optional if you uploaded a file.
   - **Add Comments** (optional) — notes for the teacher.
4. Click **Submit** — your submission appears as a message in the chat.

### How Submissions Appear

- Submissions render as a **card** with emerald-green styling:
  - Checkmark icon + "Submission" label
  - Clickable link (if provided)
  - Comments (if provided)
  - **Download Attachment** link (if a file was uploaded)

---

## 6. Classwork Sidebar

### Open the Sidebar

1. Click the **Classwork** button in the top header bar of any room (visible to all roles).
2. A panel slides in from the right.

### What It Shows

- A **list of all assignments** in the current room, each displayed as a card with:
  - Title, description, due date, max score
  - **Submission count** badge — e.g., "3 Submissions" (counts how many students submitted for that assignment)
  - "Posted by" teacher name
  - **Overdue indicator** — cards with past due dates have a red background and "(Overdue)" label

### Close the Sidebar

- Click the **X** button in the sidebar header, or click the backdrop overlay (on mobile).

---

## 7. Late Assignment Notifications (Teacher Only)

### Run a Deadline Check

1. Open the **Classwork** sidebar (click "Classwork" in the header).
2. Click the amber **Run Deadline Check** button at the top of the sidebar (visible to teachers only, shown when assignments exist).
3. The system automatically:
   - Finds all **overdue assignments** (due date is in the past).
   - Fetches all **students** in the room.
   - Checks which students have **not submitted** for each overdue assignment.
   - Sends an automated warning message for each late student:
     > ⚠️ @StudentName, you missed the deadline for assignment: AssignmentTitle. Please submit immediately.
4. A **toast notification** appears in the sidebar:
   - Green: "Notifications sent to X students."
   - Amber: "All students have submitted on time!" or "No overdue assignments found."
   - Red: Error message if something went wrong.

---

## 8. File Uploads

### Where Files Can Be Uploaded

| Context | Who Can Upload | Storage Path |
| ------- | -------------- | ------------ |
| Assignment creation | Teachers | `lms-files/assignments/` |
| Submission | Students | `lms-files/submissions/` |

### How It Works

1. Select a file using the file picker in the modal.
2. The file name appears with a **Remove file** option.
3. On submit, the file is uploaded to the **lms-files** Supabase Storage bucket.
4. The public URL is saved in the message metadata (`file_url`).
5. A **Download Attachment** link appears on the card in the chat.

---

## 9. Real-time Updates

All messages (text, assignments, submissions, notifications) are delivered in **real-time** via Supabase Realtime. When another user sends a message in a room you're viewing, it appears instantly without refreshing the page.

---

## Role Comparison

| Feature | Teacher | Student |
| ------- | ------- | ------- |
| Sign up / Log in | Yes | Yes |
| Create rooms | Yes | No |
| Add members to rooms | Yes | No |
| Send text messages | Yes (all rooms) | Yes (group rooms only; read-only in announcements) |
| Create assignments | Yes | No |
| Upload assignment files | Yes | No |
| Submit work | No | Yes |
| Upload submission files | No | Yes |
| View classwork sidebar | Yes | Yes |
| Run deadline check | Yes | No |
| Receive late notifications | No | Yes (as chat messages) |

---

## Keyboard Shortcuts

| Shortcut | Action |
| -------- | ------ |
| `Enter` | Send message |
| `Escape` | Close any open modal |

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Auth | Supabase Auth with cookie-based sessions (`@supabase/ssr`) |
| File Storage | Supabase Storage (`lms-files` bucket) |
| Real-time | Supabase Realtime (Postgres Changes) |
