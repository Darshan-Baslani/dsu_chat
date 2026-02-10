"use client";

import { useState } from "react";
import { Room, UserRole } from "@/types/chat";
import CreateRoomModal from "./CreateRoomModal";

interface RoomListProps {
  rooms: Room[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onLogout: () => void;
  role: UserRole;
  onRoomCreated: () => void;
}

const roomTypeIcon: Record<Room["type"], string> = {
  direct: "DM",
  group: "GR",
  announcement: "AN",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function RoomList({
  rooms,
  activeRoomId,
  onSelectRoom,
  onLogout,
  role,
  onRoomCreated,
}: RoomListProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <aside className="w-[360px] shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 bg-gray-100 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-800">Chats</h1>
          <div className="flex items-center gap-2">
            {role === "teacher" && (
              <button
                onClick={() => setModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                title="Create Room"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-red-600 bg-gray-200 hover:bg-red-50 rounded-full px-3 py-1 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Search (placeholder) */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full text-sm px-3 py-1.5 rounded-lg bg-white border border-gray-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
            readOnly
          />
        </div>

        {/* Room list */}
        <ul className="flex-1 overflow-y-auto">
          {rooms.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-400">
              {role === "teacher"
                ? "No rooms yet. Click + to create one."
                : "No rooms yet. Ask your teacher to add you."}
            </li>
          )}
          {rooms.map((room) => {
            const active = room.id === activeRoomId;
            return (
              <li key={room.id}>
                <button
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    active ? "bg-gray-100" : ""
                  }`}
                >
                  {/* Avatar circle */}
                  <div className="w-12 h-12 shrink-0 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                    {roomTypeIcon[room.type]}
                  </div>

                  {/* Room info */}
                  <div className="flex-1 min-w-0 border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 truncate text-sm">
                        {room.name}
                      </span>
                      {room.last_message_at && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {timeAgo(room.last_message_at)}
                        </span>
                      )}
                    </div>
                    {room.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {room.last_message}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <CreateRoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onRoomCreated}
      />
    </>
  );
}
