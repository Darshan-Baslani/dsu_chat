"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { CURRENT_USER_ID } from "@/lib/mock-data";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  roomType: "direct" | "group" | "announcement";
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

export default function MessageList({ messages, roomType }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group messages by date for dividers
  let lastDate = "";

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-[#efeae2]">
      {messages.map((msg) => {
        const msgDate = dateDivider(msg.created_at);
        const showDate = msgDate !== lastDate;
        lastDate = msgDate;
        const isMine = msg.sender_id === CURRENT_USER_ID;
        const showSender = roomType !== "direct";

        return (
          <div key={msg.id}>
            {showDate && (
              <div className="flex justify-center my-3">
                <span className="text-[11px] bg-white/80 text-gray-500 px-3 py-1 rounded-lg shadow-sm">
                  {msgDate}
                </span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isMine={isMine}
              showSender={showSender}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
