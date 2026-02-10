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
