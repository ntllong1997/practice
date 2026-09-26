"use client";

import { useState } from "react";

const MenuItemRow = ({ item, onRename, onRemove }) => {
  const [draft, setDraft] = useState(null);
  const isEditing = draft !== null;

  const handleSave = async (event) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name || name === item.name || (await onRename(item.id, name))) setDraft(null);
  };

  const handleRemove = () => {
    if (window.confirm(`Remove "${item.name}" from the menu?`)) onRemove(item.id);
  };

  if (isEditing) {
    return (
      <li>
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            value={draft}
            maxLength={40}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            aria-label={`Rename ${item.name}`}
            className="min-w-0 flex-1 rounded-xl border border-pink-400 px-3 py-2 focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-pink-600 px-3 py-2 font-semibold text-white">
            Save
          </button>
          <button type="button" onClick={() => setDraft(null)} className="px-2 text-slate-500 underline">
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-lg font-medium">{item.name}</span>
      <span className="flex gap-3 text-sm">
        <button type="button" onClick={() => setDraft(item.name)} className="text-pink-700 underline">
          Rename
        </button>
        <button type="button" onClick={handleRemove} className="text-slate-500 underline">
          Remove
        </button>
      </span>
    </li>
  );
};

export default MenuItemRow;
