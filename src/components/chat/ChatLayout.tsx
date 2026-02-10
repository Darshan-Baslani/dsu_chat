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
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">
          Please sign in to access the chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
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
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-emerald-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">
                {role === "teacher"
                  ? "Create a room to get started."
                  : "Waiting for a teacher to add you to a room."}
              </p>
            </div>
          </div>
        )}
      </main>

      <ClassworkSidebar
        open={classworkOpen}
        onClose={() => setClassworkOpen(false)}
        messages={messages}
        role={role}
        roomId={effectiveRoomId}
        roomName={activeRoom?.name ?? ""}
      />
    </div>
  );
}
