"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PinLogin = ({ title }) => {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!pin.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not sign in.");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setPin("");
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-1 text-2xl font-bold">{title}</h1>
        <p className="mb-5 text-slate-500">Enter the staff PIN.</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          aria-label="Staff PIN"
          className="mb-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-pink-500 focus:outline-none"
        />
        {error && <p className="mb-3 text-center text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || !pin.trim()}
          className="w-full rounded-xl bg-pink-600 py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          {isLoading ? "Checking…" : "Enter"}
        </button>
      </form>
    </main>
  );
};

export default PinLogin;
