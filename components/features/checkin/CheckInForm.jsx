"use client";

import { useState } from "react";
import { SERVICES } from "@/lib/services";

const CheckInForm = ({ onCheckedIn, onScanNeeded }) => {
  const [name, setName] = useState("");
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleService = (id) =>
    setServices((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!services.length) {
      setError("Please choose at least one service.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), services }),
      });
      const body = await res.json();
      if (body.code === "scan") {
        onScanNeeded();
        return;
      }
      if (!res.ok) throw new Error(body.error || "Could not check in.");
      onCheckedIn(body.ticket);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-5 text-2xl font-bold">Check in</h2>

      <label htmlFor="name" className="mb-1 block font-medium">
        Your name <span className="font-normal text-slate-400">(optional)</span>
      </label>
      <input
        id="name"
        value={name}
        maxLength={40}
        autoComplete="given-name"
        onChange={(e) => setName(e.target.value)}
        className="mb-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg focus:border-pink-500 focus:outline-none"
      />

      <p className="mb-2 font-medium">Choose your service</p>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {SERVICES.map((service) => {
          const isSelected = services.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleService(service.id)}
              className={`rounded-xl border-2 py-5 text-lg font-semibold transition ${
                isSelected
                  ? "border-pink-600 bg-pink-600 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {isSelected ? "✓ " : ""}
              {service.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mb-3 text-center text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-pink-600 py-4 text-xl font-bold text-white disabled:opacity-50"
      >
        {isLoading ? "Checking in…" : "Check in"}
      </button>
    </form>
  );
};

export default CheckInForm;
