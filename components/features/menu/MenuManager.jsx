"use client";

import { useMenu } from "@/hooks/useMenu";
import { groupByCategory } from "@/lib/services";
import CategoryColumn from "./CategoryColumn";

const MenuManager = () => {
  const { menu, error, addItem, renameItem, removeItem } = useMenu();

  return (
    <main className="mx-auto max-w-4xl px-4 py-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Service menu</h1>
          <p className="text-slate-600">Customers choose from these services when they check in.</p>
        </div>
        <a href="/dashboard" className="text-pink-700 underline">← Back to dashboard</a>
      </header>

      {error && <p className="mb-3 rounded-lg bg-amber-100 p-2 text-amber-900">{error}</p>}
      {menu === null ? (
        <p className="py-10 text-center text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupByCategory(menu).map((category) => (
            <CategoryColumn
              key={category.id}
              category={category}
              onAdd={(name) => addItem(category.id, name)}
              onRename={renameItem}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default MenuManager;
