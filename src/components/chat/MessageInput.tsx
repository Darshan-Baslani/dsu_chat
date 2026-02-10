"use client";

import { useState, FormEvent } from "react";
import type { UserRole } from "@/types/chat";
import CreateAssignmentModal from "./CreateAssignmentModal";

interface MessageInputProps {
  onSend: (text: string) => void;
  onSendAssignment: (data: {
    title: string;
    description: string;
    max_score: number;
    due_date: string;
    file_url?: string;
  }) => void;
  role: UserRole;
}

export default function MessageInput({
  onSend,
  onSendAssignment,
  role,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <>
      <div className="shrink-0 bg-slate-50 border-t border-slate-100 px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-center gap-2 bg-white shadow-lg border border-slate-100 rounded-full p-1.5 pl-2"
        >
          {/* Assignment button (teachers only) */}
          {role === "teacher" && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-9 h-9 shrink-0 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Create Assignment"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4.5 h-4.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm px-3 py-2 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          />

          <button
            type="submit"
            className="w-9 h-9 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-30 shadow-sm"
            disabled={!text.trim()}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>

      <CreateAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onSendAssignment}
      />
    </>
  );
}
