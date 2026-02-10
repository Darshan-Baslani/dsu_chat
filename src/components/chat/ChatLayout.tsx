"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRooms } from "@/hooks/use-rooms";
import { useChat } from "@/hooks/use-chat";
import { sendMessage } from "@/lib/messages";
import type { UserRole } from "@/types/chat";
import { toMessage } from "@/types/chat";
import RoomList from "./RoomList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ClassworkSidebar from "./ClassworkSidebar";

export default function ChatLayout() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const { rooms, loading: roomsLoading, refresh: refreshRooms } = useRooms();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [classworkOpen, setClassworkOpen] = useState(false);

  const effectiveRoomId = activeRoomId ?? rooms[0]?.id ?? "";
  const { messages, loading: messagesLoading, addMessage } = useChat(effectiveRoomId);

  const activeRoom = rooms.find((r) => r.id === effectiveRoomId);
  const role = (user?.user_metadata?.role as UserRole) ?? "student";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleSend(text: string) {
    if (!effectiveRoomId) return;
    try {
      const row = await sendMessage(text, effectiveRoomId);
      if (row) addMessage(toMessage(row));
    } catch (err) {
      console.error("Send failed:", err);
    }
  }

  async function handleSendAssignment(data: {
    title: string;
    description: string;
    max_score: number;
    due_date: string;
    file_url?: string;
  }) {
    if (!effectiveRoomId) return;
    try {
      await sendMessage(
        `Assignment: ${data.title}`,
        effectiveRoomId,
        "assignment",
        {
          title: data.title,
          description: data.description,
          max_score: data.max_score,
          due_date: data.due_date,
          ...(data.file_url && { file_url: data.file_url }),
        }
      );
    } catch (err) {
      console.error("Assignment send failed:", err);
    }
  }

  if (userLoading || roomsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Please sign in to access the chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <RoomList
        rooms={rooms}
        activeRoomId={effectiveRoomId}
        onSelectRoom={setActiveRoomId}
        onLogout={handleLogout}
        role={role}
        onRoomCreated={refreshRooms}
      />

      <main className="flex flex-col flex-1 min-w-0">
        {activeRoom ? (
          <>
            <ChatHeader
              room={activeRoom}
              role={role}
              onToggleClasswork={() => setClassworkOpen((o) => !o)}
            />
            <MessageList
              messages={messages}
              roomType={activeRoom.type}
              currentUserId={user.id}
              role={role}
              roomId={effectiveRoomId}
              loading={messagesLoading}
            />
            <MessageInput
              onSend={handleSend}
              onSendAssignment={handleSendAssignment}
              role={role}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#efeae2]">
            <p className="text-sm text-gray-500">
              {role === "teacher"
                ? "Create a room to get started."
                : "Waiting for a teacher to add you to a room."}
            </p>
          </div>
        )}
      </main>

      <ClassworkSidebar
        open={classworkOpen}
        onClose={() => setClassworkOpen(false)}
        messages={messages}
        role={role}
        roomId={effectiveRoomId}
      />
    </div>
  );
}
