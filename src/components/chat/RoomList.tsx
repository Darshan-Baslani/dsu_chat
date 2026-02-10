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
      <aside className="w-[340px] shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/50">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-slate-800">Chat LMS</h1>
          </div>
          <div className="flex items-center gap-2">
            {role === "teacher" && (
              <button
                onClick={() => setModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                title="Create Room"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors border border-slate-200 shadow-sm"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full text-sm pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors text-slate-700 placeholder:text-slate-400"
              readOnly
            />
          </div>
        </div>

        {/* Room list */}
        <ul className="flex-1 overflow-y-auto px-3 space-y-1">
          {rooms.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-slate-400">
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
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left rounded-xl transition-all ${
                    active
                      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {/* Avatar circle */}
                  <div
                    className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {roomTypeIcon[room.type]}
                  </div>

                  {/* Room info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium truncate text-sm ${
                          active ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {room.name}
                      </span>
                      {room.last_message_at && (
                        <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                          {timeAgo(room.last_message_at)}
                        </span>
                      )}
                    </div>
                    {room.last_message && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
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
