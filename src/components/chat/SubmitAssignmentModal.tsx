"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { sendMessage } from "@/lib/messages";

interface SubmitAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
  roomId: string;
}

export default function SubmitAssignmentModal({
  open,
  onClose,
  assignmentId,
  roomId,
}: SubmitAssignmentModalProps) {
  const [link, setLink] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) linkRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function reset() {
    setLink("");
    setComment("");
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedLink = link.trim();
    if (!trimmedLink && !file) return;

    setLoading(true);
    setError(null);

    try {
      let file_url: string | undefined;

      if (file) {
        const path = `submissions/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("lms-files")
          .upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("lms-files")
          .getPublicUrl(path);
        file_url = urlData.publicUrl;
      }

      const contentLabel = file
        ? `Submission: ${file.name}`
        : `Submission: ${trimmedLink}`;

      await sendMessage(contentLabel, roomId, "submission", {
        ref_assignment_id: assignmentId,
        link: trimmedLink || undefined,
        comment: comment.trim(),
        ...(file_url && { file_url }),
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Submit Work
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <label className="flex items-center gap-2 w-full rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400 shrink-0">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span className="truncate text-gray-500">
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

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            or paste a link
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Submission Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Submission Link <span className="text-gray-400 font-normal">(optional if file uploaded)</span>
            </label>
            <input
              ref={linkRef}
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/you/project or Google Drive link"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any notes for the teacher..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!link.trim() && !file) || loading}
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40"
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
