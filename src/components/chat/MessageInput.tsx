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
      <form
        onSubmit={handleSubmit}
        className="h-16 flex items-center gap-3 px-4 bg-gray-100 border-t border-gray-200 shrink-0"
      >
        {/* Assignment button (teachers only) */}
        {role === "teacher" && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
            title="Create Assignment"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 text-sm px-4 py-2 rounded-full bg-white border border-gray-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-40"
          disabled={!text.trim()}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      <CreateAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onSendAssignment}
      />
    </>
  );
}
