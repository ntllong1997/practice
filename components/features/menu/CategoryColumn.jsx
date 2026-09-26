"use client";

import { useState } from "react";
import MenuItemRow from "./MenuItemRow";

const CategoryColumn = ({ category, onAdd, onRename, onRemove }) => {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    if (await onAdd(name.trim())) setName("");
    setIsSaving(false);
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow" aria-label={category.label}>
      <h2 className="mb-3 text-xl font-bold text-pink-700">{category.label}</h2>

      <ul className="mb-4 flex flex-col gap-2">
        {category.items.map((item) => (
          <MenuItemRow key={item.id} item={item} onRename={onRename} onRemove={onRemove} />
        ))}
        {!category.items.length && (
          <li className="text-slate-500">No {category.label.toLowerCase()} services yet.</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={`New ${category.label.toLowerCase()} service`}
          aria-label={`New ${category.label} service`}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="rounded-xl bg-pink-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </section>
  );
};

export default CategoryColumn;
