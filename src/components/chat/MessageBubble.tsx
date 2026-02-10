"use client";

import { useState } from "react";
import { Message, UserRole } from "@/types/chat";
import SubmitAssignmentModal from "./SubmitAssignmentModal";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showSender: boolean;
  role: UserRole;
  roomId: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AssignmentCard({
  metadata,
  isMine,
  role,
  messageId,
  roomId,
}: {
  metadata: Record<string, unknown>;
  isMine: boolean;
  role: UserRole;
  messageId: string;
  roomId: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const dueDate = metadata.due_date
    ? new Date(metadata.due_date as string).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <div
        className={`mt-2 rounded-lg border p-3 text-xs space-y-1.5 ${
          isMine
            ? "bg-green-700/40 border-green-400/30"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold text-[13px]">
          <span>📋</span>
          <span>{typeof metadata.title === "string" ? metadata.title : "Assignment"}</span>
        </div>
        {typeof metadata.description === "string" && metadata.description && (
          <p className="opacity-90">{metadata.description}</p>
        )}
        <div className="flex items-center gap-3 pt-0.5">
          {dueDate && (
            <span className="flex items-center gap-1">
              <span>🕐</span> {dueDate}
            </span>
          )}
          {metadata.max_score != null && (
            <span className="flex items-center gap-1">
              <span>🏆</span> {String(metadata.max_score)} pts
            </span>
          )}
        </div>

        {/* Submit button for students */}
        {role === "student" && !isMine && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md bg-green-600 text-white py-1.5 px-3 text-xs font-medium hover:bg-green-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Submit Work
          </button>
        )}
      </div>

      <SubmitAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        assignmentId={messageId}
        roomId={roomId}
      />
    </>
  );
}

function SubmissionCard({
  metadata,
  isMine,
}: {
  metadata: Record<string, unknown>;
  isMine: boolean;
}) {
  const link = typeof metadata.link === "string" ? metadata.link : null;
  const comment = typeof metadata.comment === "string" && metadata.comment ? metadata.comment : null;

  return (
    <div
      className={`mt-2 rounded-lg border p-3 text-xs space-y-1.5 ${
        isMine
          ? "bg-green-700/40 border-green-400/30"
          : "bg-emerald-50 border-emerald-200"
      }`}
    >
      <div className="flex items-center gap-1.5 font-bold text-[13px]">
        <span>✅</span>
        <span>Submission</span>
      </div>
      {link && (
        <p className="truncate">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${isMine ? "text-green-100" : "text-emerald-700"}`}
          >
            {link}
          </a>
        </p>
      )}
      {comment && (
        <p className="opacity-80 italic">{comment}</p>
      )}
    </div>
  );
}

export default function MessageBubble({
  message,
  isMine,
  showSender,
  role,
  roomId,
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
          <AssignmentCard
            metadata={message.metadata}
            isMine={isMine}
            role={role}
            messageId={message.id}
            roomId={roomId}
          />
        )}
        {message.message_type === "submission" && (
          <SubmissionCard metadata={message.metadata} isMine={isMine} />
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
