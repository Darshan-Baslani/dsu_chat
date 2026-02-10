"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface AssignmentData {
  title: string;
  description: string;
  max_score: number;
  due_date: string;
  file_url?: string;
}

interface CreateAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssignmentData) => void;
}

export default function CreateAssignmentModal({
  open,
  onClose,
  onSubmit,
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title input when modal opens
  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function reset() {
    setTitle("");
    setDescription("");
    setMaxScore(100);
    setDueDate("");
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setUploading(true);
    setError(null);

    try {
      let file_url: string | undefined;

      if (file) {
        const path = `assignments/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("lms-files")
          .upload(path, file);

        if (uploadErr) {
          console.error("Storage upload error:", uploadErr);
          throw new Error(`Upload failed: ${uploadErr.message}`);
        }

        console.log("Upload success:", uploadData);

        const { data: urlData } = supabase.storage
          .from("lms-files")
          .getPublicUrl(path);
        file_url = urlData.publicUrl;
      }

      onSubmit({
        title: title.trim(),
        description: description.trim(),
        max_score: maxScore,
        due_date: new Date(dueDate).toISOString(),
        ...(file_url && { file_url }),
      });
      reset();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("CreateAssignment error:", err);
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Create Assignment
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement a Binary Search Tree"
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Assignment details, requirements, resources..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Max Score */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Score
            </label>
            <input
              type="number"
              min={1}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700"
            />
          </div>

          {/* Due Date + Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Due Date & Time
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dueDate.split("T")[0] || ""}
                onChange={(e) => {
                  const time = dueDate.split("T")[1] || "23:59";
                  setDueDate(`${e.target.value}T${time}`);
                }}
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700"
              />
              <input
                type="time"
                value={dueDate.split("T")[1] || ""}
                onChange={(e) => {
                  const date = dueDate.split("T")[0] || "";
                  setDueDate(`${date}T${e.target.value}`);
                }}
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700"
              />
            </div>
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Attachment <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <label className="flex items-center gap-2 w-full rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 text-sm cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-slate-400 shrink-0">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="truncate text-slate-500">
                {file ? file.name : "Choose a file..."}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                Remove file
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !dueDate || uploading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-sm"
            >
              {uploading ? "Uploading..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
