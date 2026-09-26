"use client";

import { useState } from "react";
import { groupByCategory } from "@/lib/services";

const CheckInForm = ({ menu, onCheckedIn, onScanNeeded }) => {
  const [name, setName] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleItem = (id) =>
    setItems((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!items.length) {
      setError("Please choose at least one service.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), items }),
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
      {!menu.length && (
        <p className="mb-6 text-slate-500">No services available right now. Please ask the front desk.</p>
      )}
      {groupByCategory(menu)
        .filter((category) => category.items.length)
        .map((category) => (
          <fieldset key={category.id} className="mb-5">
            <legend className="mb-2 text-sm font-bold uppercase tracking-wide text-pink-700">
              {category.label}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((item) => {
                const isSelected = items.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleItem(item.id)}
                    className={`rounded-xl border-2 px-2 py-4 text-lg font-semibold transition ${
                      isSelected
                        ? "border-pink-600 bg-pink-600 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {isSelected ? "✓ " : ""}
                    {item.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

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
