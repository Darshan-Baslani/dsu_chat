"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Message, UserRole } from "@/types/chat";

interface ClassworkSidebarProps {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  role: UserRole;
  roomId: string;
  roomName: string;
}

export default function ClassworkSidebar({
  open,
  onClose,
  messages,
  role,
  roomId,
  roomName,
}: ClassworkSidebarProps) {
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const assignments = messages.filter((m) => m.message_type === "assignment");
  const submissions = messages.filter((m) => m.message_type === "submission");

  function submissionCount(assignmentId: string): number {
    return submissions.filter(
      (s) => s.metadata.ref_assignment_id === assignmentId
    ).length;
  }

  function formatDue(iso: unknown): string {
    if (typeof iso !== "string") return "No due date";
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isOverdue(iso: unknown): boolean {
    if (typeof iso !== "string") return false;
    return new Date(iso) < new Date();
  }

  async function runDeadlineCheck() {
    setChecking(true);
    setToast(null);

    try {
      // 1. Overdue assignments
      const overdue = assignments.filter((a) => isOverdue(a.metadata.due_date));

      if (overdue.length === 0) {
        setToast("No overdue assignments found.");
        return;
      }

      // 2. Fetch room members (students only)
      const { data: members, error: membersErr } = await supabase
        .from("room_members")
        .select("user_id, profiles:user_id(id, full_name, role)")
        .eq("room_id", roomId);

      if (membersErr) throw membersErr;

      const students: { user_id: string; name: string }[] = [];
      for (const m of members ?? []) {
        // Supabase returns the joined row as an object (or array for ambiguous FKs)
        const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        if (p && p.role === "student") {
          students.push({ user_id: m.user_id, name: p.full_name });
        }
      }

      if (students.length === 0) {
        setToast("No students in this room.");
        return;
      }

      // 3. Build set of (student_id) who submitted for each assignment
      // submissions have metadata.ref_assignment_id and sender_id
      const submissionMap = new Map<string, Set<string>>();
      for (const s of submissions) {
        const refId = s.metadata.ref_assignment_id as string | undefined;
        if (!refId) continue;
        if (!submissionMap.has(refId)) submissionMap.set(refId, new Set());
        submissionMap.get(refId)!.add(s.sender_id);
      }

      // 4. Find late students and send private bot notifications
      let notified = 0;

      for (const assignment of overdue) {
        const submitters = submissionMap.get(assignment.id) ?? new Set();
        const title =
          typeof assignment.metadata.title === "string"
            ? assignment.metadata.title
            : "Untitled Assignment";

        for (const student of students) {
          if (submitters.has(student.user_id)) continue;

          const res = await fetch("/api/bot/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: student.user_id,
              studentName: student.name,
              assignmentTitle: title,
              roomName,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            let detail: string;
            try {
              detail = JSON.parse(text).error ?? text;
            } catch {
              detail = text;
            }
            console.error("Bot notify failed:", res.status, detail);
            throw new Error(detail || `Bot API returned ${res.status}`);
          } else {
            notified++;
          }
        }
      }

      setToast(
        notified > 0
          ? `Notifications sent to ${notified} student${notified === 1 ? "" : "s"}.`
          : "All students have submitted on time!"
      );
    } catch (err) {
      console.error("Deadline check failed:", err);
      setToast(
        `Error: ${err instanceof Error ? err.message : "Deadline check failed"}`
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-40 h-full w-80 bg-white border-l border-gray-200 shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-green-600"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Classwork
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Teacher: Deadline Check */}
        {role === "teacher" && assignments.length > 0 && (
          <div className="px-4 pt-3 pb-1 shrink-0">
            <button
              onClick={runDeadlineCheck}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-white text-xs font-medium py-2.5 px-3 hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {checking ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Run Deadline Check
                </>
              )}
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="mx-4 mt-2 shrink-0">
            <div
              className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                toast.startsWith("Error")
                  ? "bg-red-50 text-red-700"
                  : toast.includes("Notifications sent")
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              <span className="shrink-0 mt-px">
                {toast.startsWith("Error") ? "❌" : toast.includes("Notifications sent") ? "✅" : "ℹ️"}
              </span>
              <span>{toast}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-auto shrink-0 opacity-60 hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-10 h-10 text-gray-300 mb-3"
              >
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              <p className="text-sm text-gray-400">No assignments yet</p>
            </div>
          ) : (
            assignments.map((a) => {
              const count = submissionCount(a.id);
              const overdue = isOverdue(a.metadata.due_date);
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border p-3.5 space-y-2 transition-colors ${
                    overdue
                      ? "border-red-200 bg-red-50/60 hover:border-red-300"
                      : "border-gray-200 bg-gray-50 hover:border-green-300"
                  }`}
                >
                  {/* Title */}
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5">📋</span>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                      {typeof a.metadata.title === "string"
                        ? a.metadata.title
                        : "Untitled Assignment"}
                    </h3>
                  </div>

                  {/* Description */}
                  {typeof a.metadata.description === "string" &&
                    a.metadata.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 pl-6">
                        {a.metadata.description}
                      </p>
                    )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 pl-6">
                    <span
                      className={`flex items-center gap-1 ${
                        overdue ? "text-red-600 font-medium" : ""
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-3.5 h-3.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatDue(a.metadata.due_date)}
                      {overdue && " (Overdue)"}
                    </span>
                    {a.metadata.max_score != null && (
                      <span className="flex items-center gap-1">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="w-3.5 h-3.5"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {String(a.metadata.max_score)} pts
                      </span>
                    )}
                  </div>

                  {/* Submission count */}
                  <div className="pl-6">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        count > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="w-3 h-3"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {count} {count === 1 ? "Submission" : "Submissions"}
                    </span>
                  </div>

                  {/* Posted by */}
                  <p className="text-[10px] text-gray-400 pl-6">
                    Posted by {a.sender_name}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
