"use client";

import { useState } from "react";
import { Message } from "@/types/chat";
import {
  CURRENT_USER_ID,
  rooms,
  messagesByRoom,
} from "@/lib/mock-data";
import RoomList from "./RoomList";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatLayout() {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id);
  const [localMessages, setLocalMessages] = useState<
    Record<string, Message[]>
  >(messagesByRoom);

  const activeRoom = rooms.find((r) => r.id === activeRoomId)!;
  const messages = localMessages[activeRoomId] ?? [];

  function handleSend(text: string) {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      room_id: activeRoomId,
      sender_id: CURRENT_USER_ID,
      sender_name: "You",
      content: text,
      message_type: "text",
      metadata: {},
      created_at: new Date().toISOString(),
    };

    setLocalMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] ?? []), newMsg],
    }));
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <RoomList
        rooms={rooms}
        activeRoomId={activeRoomId}
        onSelectRoom={setActiveRoomId}
      />

      {/* Main chat area */}
      <main className="flex flex-col flex-1 min-w-0">
        <ChatHeader room={activeRoom} />
        <MessageList messages={messages} roomType={activeRoom.type} />
        <MessageInput onSend={handleSend} />
      </main>
    </div>
  );
}
