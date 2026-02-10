"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "login" | "signup";
type Role = "student" | "teacher";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.refresh();
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? `Network error: ${err.message}` : "Network error — check your connection"
      );
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.refresh();
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? `Network error: ${err.message}` : "Network error — check your connection"
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-7 h-7">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Chat LMS</h1>
          <p className="text-sm text-slate-500 mt-1">
            Your classroom, in a chat
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setTab("login"); setError(null); }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                tab === "login"
                  ? "text-emerald-700 border-b-2 border-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                tab === "signup"
                  ? "text-emerald-700 border-b-2 border-emerald-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={tab === "login" ? handleLogin : handleSignUp}
            className="p-6 space-y-4"
          >
            {/* Sign-up only fields */}
            {tab === "signup" && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                {/* Role */}
                <fieldset>
                  <legend className="block text-sm font-medium text-slate-700 mb-2">
                    I am a...
                  </legend>
                  <div className="flex gap-3">
                    {(["student", "teacher"] as const).map((r) => (
                      <label
                        key={r}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 px-3 text-sm font-medium cursor-pointer transition-all ${
                          role === r
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r}
                          checked={role === r}
                          onChange={() => setRole(r)}
                          className="sr-only"
                        />
                        {r === "student" ? "Student" : "Teacher"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading
                ? "Please wait..."
                : tab === "login"
                  ? "Log In"
                  : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
