"use client";

import { Room } from "@/types/chat";

interface ChatHeaderProps {
  room: Room;
}

const roomTypeLabel: Record<Room["type"], string> = {
  direct: "Direct Message",
  group: "Group Chat",
  announcement: "Announcements",
};

export default function ChatHeader({ room }: ChatHeaderProps) {
  return (
    <div className="h-14 flex items-center gap-3 px-4 bg-gray-100 border-b border-gray-200 shrink-0">
      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
        {room.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 truncate">
          {room.name}
        </h2>
        <p className="text-xs text-gray-500">{roomTypeLabel[room.type]}</p>
      </div>
    </div>
  );
}
