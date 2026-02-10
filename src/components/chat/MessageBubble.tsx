"use client";

import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showSender: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AssignmentCard({ metadata }: { metadata: Record<string, unknown> }) {
  const dueDate = metadata.due_date
    ? new Date(metadata.due_date as string).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mt-1.5 rounded-lg bg-white/20 border border-white/30 p-2.5 text-xs space-y-1">
      <div className="flex items-center gap-1.5 font-semibold">
        <span>📋</span>
        <span>Assignment</span>
      </div>
      {dueDate && <p>Due: {dueDate}</p>}
      {metadata.max_score != null && <p>Max Score: {String(metadata.max_score)}</p>}
    </div>
  );
}

function SubmissionCard({ metadata }: { metadata: Record<string, unknown> }) {
  return (
    <div className="mt-1.5 rounded-lg bg-white/20 border border-white/30 p-2.5 text-xs space-y-1">
      <div className="flex items-center gap-1.5 font-semibold">
        <span>📎</span>
        <span>Submission</span>
      </div>
      {typeof metadata.file_url === "string" && (
        <p className="truncate underline">{metadata.file_url}</p>
      )}
    </div>
  );
}

export default function MessageBubble({
  message,
  isMine,
  showSender,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
          isMine
            ? "bg-green-600 text-white rounded-tr-none"
            : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
        }`}
      >
        {/* Sender name for group chats */}
        {showSender && !isMine && (
          <p className="text-xs font-semibold text-green-700 mb-0.5">
            {message.sender_name}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Assignment / Submission card */}
        {message.message_type === "assignment" && (
          <AssignmentCard metadata={message.metadata} />
        )}
        {message.message_type === "submission" && (
          <SubmissionCard metadata={message.metadata} />
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 text-right ${
            isMine ? "text-green-200" : "text-gray-400"
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
