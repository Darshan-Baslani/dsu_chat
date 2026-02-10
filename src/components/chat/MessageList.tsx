"use client";

import { useEffect, useRef } from "react";
import { Message, UserRole } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  roomType: "direct" | "group" | "announcement";
  currentUserId: string;
  role: UserRole;
  roomId: string;
  loading?: boolean;
}

function dateDivider(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MessageList({
  messages,
  roomType,
  currentUserId,
  role,
  roomId,
  loading,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-slate-50">
      {loading && messages.length === 0 && (
        <div className="flex justify-center py-10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Loading messages...</span>
          </div>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-slate-300">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-sm text-slate-400">
            No messages yet. Say something!
          </span>
        </div>
      )}

      {messages.map((msg) => {
        const msgDate = dateDivider(msg.created_at);
        const showDate = msgDate !== lastDate;
        lastDate = msgDate;
        const isMine = msg.sender_id === currentUserId;
        const showSender = roomType !== "direct";

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="flex justify-center my-4">
                <span className="text-[11px] bg-white text-slate-500 px-3.5 py-1 rounded-full shadow-sm border border-slate-100 font-medium">
                  {msgDate}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={isMine}
              showSender={showSender}
              role={role}
              roomId={roomId}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
