"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types/chat";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    // Explicitly join through room_members so only rooms the current
    // user belongs to are returned (works even if RLS isn't applied).
    const { data, error } = await supabase
      .from("room_members")
      .select("rooms(*)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch rooms:", error.message);
      setRooms([]);
    } else {
      const list = (data ?? [])
        .map((row) => (row as unknown as { rooms: Room }).rooms)
        .filter(Boolean);
      setRooms(list);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, refresh: fetchRooms };
}
