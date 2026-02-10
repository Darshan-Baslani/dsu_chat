-- ============================================================
-- Chat-based LMS Schema for Supabase
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Custom Enums
-- ============================================================

create type public.user_role as enum ('student', 'teacher');
create type public.room_type as enum ('direct', 'group', 'announcement');
create type public.message_type as enum ('text', 'assignment', 'submission');

-- 2. Profiles
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked 1:1 with auth.users.';

-- 3. Rooms
-- ============================================================

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.room_type not null default 'group',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.rooms is 'Chat rooms — direct messages, group chats, or announcement channels.';

-- 4. Room Members (junction table)
-- ============================================================

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

comment on table public.room_members is 'Maps which users belong to which rooms.';

-- 5. Messages
-- ============================================================

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  message_type public.message_type not null default 'text',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Chat messages. The metadata JSONB column stores extra data per message_type: '
  '• assignment → { "due_date": "ISO-8601", "max_score": 100 } '
  '• submission → { "file_url": "https://..." }';

-- 6. Indexes
-- ============================================================

create index idx_messages_room_id on public.messages (room_id, created_at desc);
create index idx_room_members_user_id on public.room_members (user_id);
create index idx_messages_sender_id on public.messages (sender_id);

-- 7. Auto-create profile on signup (trigger)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 8. Auto-update updated_at on profiles
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 9. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

-- ---------- profiles ----------

-- Anyone authenticated can read any profile (needed for displaying names/avatars).
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update only their own profile.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- rooms ----------

-- Users can see only rooms they are a member of.
create policy "Members can view their rooms"
  on public.rooms for select
  to authenticated
  using (
    id in (
      select room_id from public.room_members
      where user_id = auth.uid()
    )
  );

-- Teachers can create rooms.
create policy "Teachers can create rooms"
  on public.rooms for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'teacher'
    )
  );

-- ---------- room_members ----------

-- Users can see fellow members of rooms they belong to.
create policy "Members can see fellow room members"
  on public.room_members for select
  to authenticated
  using (
    room_id in (
      select room_id from public.room_members
      where user_id = auth.uid()
    )
  );

-- Teachers can add members to rooms they created.
create policy "Room creators can add members"
  on public.room_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.rooms
      where id = room_id and created_by = auth.uid()
    )
  );

-- Members can remove themselves from a room.
create policy "Members can leave rooms"
  on public.room_members for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------- messages ----------

-- Users can read messages only in rooms they belong to.
create policy "Members can read room messages"
  on public.messages for select
  to authenticated
  using (
    room_id in (
      select room_id from public.room_members
      where user_id = auth.uid()
    )
  );

-- Members can send messages to rooms they belong to.
create policy "Members can send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and room_id in (
      select room_id from public.room_members
      where user_id = auth.uid()
    )
  );

-- In announcement rooms, only teachers can post.
-- This replaces the above insert policy for announcement rooms specifically,
-- so we add a check: if the room type is 'announcement', sender must be a teacher.
create policy "Only teachers post in announcement rooms"
  on public.messages for insert
  to authenticated
  with check (
    not exists (
      select 1 from public.rooms
      where id = room_id and type = 'announcement'
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'teacher'
    )
  );
