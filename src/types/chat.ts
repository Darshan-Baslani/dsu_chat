export type UserRole = "student" | "teacher";
export type RoomType = "direct" | "group" | "announcement";
export type MessageType = "text" | "assignment" | "submission";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  created_by: string;
  last_message?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** The raw shape Supabase returns when we select messages joined with profiles. */
export interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles: { full_name: string } | null;
}

/** Convert a Supabase row into our flat Message type. */
export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    room_id: row.room_id,
    sender_id: row.sender_id,
    sender_name: row.profiles?.full_name ?? "Unknown",
    content: row.content,
    message_type: row.message_type,
    metadata: row.metadata ?? {},
    created_at: row.created_at,
  };
}
