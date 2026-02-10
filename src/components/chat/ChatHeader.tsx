"use client";

import { useState } from "react";
import { Room, UserRole } from "@/types/chat";
import AddMemberModal from "./AddMemberModal";

interface ChatHeaderProps {
  room: Room;
  role: UserRole;
}

const roomTypeLabel: Record<Room["type"], string> = {
  direct: "Direct Message",
  group: "Group Chat",
  announcement: "Announcements",
};

export default function ChatHeader({ room, role }: ChatHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="h-14 flex items-center justify-between px-4 bg-gray-100 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {room.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {room.name}
            </h2>
            <p className="text-xs text-gray-500">{roomTypeLabel[room.type]}</p>
          </div>
        </div>

        {role === "teacher" && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-green-700 bg-gray-200 hover:bg-green-50 rounded-full px-3 py-1.5 transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      <AddMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        roomId={room.id}
      />
    </>
  );
}
