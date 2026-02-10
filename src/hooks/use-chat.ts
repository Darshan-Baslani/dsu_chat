"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Message, MessageRow } from "@/types/chat";
import { toMessage } from "@/types/chat";

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing messages for this room
  const fetchMessages = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*, profiles:sender_id(full_name)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch messages:", error.message);
      setMessages([]);
    } else {
      setMessages((data as MessageRow[]).map(toMessage));
    }

    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    fetchMessages();

    // Subscribe to new inserts in this room via Realtime
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // The realtime payload doesn't include the joined profile,
          // so we fetch the sender name separately.
          const row = payload.new as MessageRow;

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", row.sender_id)
            .single();

          const msg = toMessage({
            ...row,
            profiles: profile ?? null,
          });

          setMessages((prev) => {
            // Guard against duplicates (our own insert may already be in state
            // from the initial fetch or a previous realtime event).
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchMessages]);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  return { messages, loading, addMessage };
}
