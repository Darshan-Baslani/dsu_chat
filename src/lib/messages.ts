import { supabase } from "./supabase";
import type { MessageType, MessageRow } from "@/types/chat";

export async function sendMessage(
  content: string,
  roomId: string,
  type: MessageType = "text",
  metadata: Record<string, unknown> = {}
): Promise<MessageRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      content,
      room_id: roomId,
      sender_id: user.id,
      message_type: type,
      metadata,
    })
    .select("*, profiles:sender_id(full_name)")
    .single();

  if (error) throw error;
  return data as MessageRow;
}
