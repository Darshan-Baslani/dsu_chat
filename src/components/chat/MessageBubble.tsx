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

/* ─── Assignment Card ─── */
function AssignmentCard({
  metadata,
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

  const fileUrl = typeof metadata.file_url === "string" ? metadata.file_url : null;

  return (
    <>
      <div className="mt-2.5 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-emerald-600">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-slate-800">
            {typeof metadata.title === "string" ? metadata.title : "Assignment"}
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-3 space-y-2.5">
          {typeof metadata.description === "string" && metadata.description && (
            <p className="text-xs text-slate-500 leading-relaxed">{metadata.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {dueDate && (
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {dueDate}
              </span>
            )}
            {metadata.max_score != null && (
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {String(metadata.max_score)} pts
              </span>
            )}
          </div>

          {/* Attachment */}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-100"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-400">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Download Attachment
            </a>
          )}

          {/* Submit button for students */}
          {role === "student" && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white py-2.5 px-3 text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm"
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

/* ─── Submission Card ─── */
function SubmissionCard({
  metadata,
}: {
  metadata: Record<string, unknown>;
  isMine: boolean;
}) {
  const link = typeof metadata.link === "string" ? metadata.link : null;
  const comment = typeof metadata.comment === "string" && metadata.comment ? metadata.comment : null;
  const fileUrl = typeof metadata.file_url === "string" ? metadata.file_url : null;

  return (
    <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-600">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-xs font-semibold text-slate-700">Submission</p>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-emerald-600 hover:text-emerald-700 truncate underline underline-offset-2"
          >
            {link}
          </a>
        )}

        {comment && (
          <p className="text-xs text-slate-500 italic">{comment}</p>
        )}

        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white rounded-md px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 text-slate-400">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Download File
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Bubble ─── */
export default function MessageBubble({
  message,
  isMine,
  showSender,
  role,
  roomId,
}: MessageBubbleProps) {
  const isRich = message.message_type === "assignment" || message.message_type === "submission";

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[70%] ${
          isRich
            ? "w-full max-w-md"
            : ""
        } ${
          isMine
            ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm shadow-sm"
            : "bg-white text-slate-900 border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm"
        } px-3.5 py-2.5`}
      >
        {/* Sender name for group chats */}
        {showSender && !isMine && (
          <p className="text-xs font-semibold text-emerald-600 mb-1">
            {message.sender_name}
          </p>
        )}

        {/* Message content — hide raw text for rich messages */}
        {!isRich && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Assignment / Submission card */}
        {message.message_type === "assignment" && (
          <>
            {isMine && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed mb-0.5">
                {message.content}
              </p>
            )}
            {!isMine && (
              <p className="text-sm font-medium text-slate-700 mb-0.5">
                {message.content}
              </p>
            )}
            <AssignmentCard
              metadata={message.metadata}
              isMine={isMine}
              role={role}
              messageId={message.id}
              roomId={roomId}
            />
          </>
        )}
        {message.message_type === "submission" && (
          <>
            {isMine && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed mb-0.5">
                {message.content}
              </p>
            )}
            {!isMine && (
              <p className="text-sm text-slate-700 mb-0.5">
                {message.content}
              </p>
            )}
            <SubmissionCard metadata={message.metadata} isMine={isMine} />
          </>
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1.5 text-right ${
            isMine ? "text-emerald-200" : "text-slate-400"
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
