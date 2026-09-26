"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const send = (method, body) =>
  fetch("/api/staff/menu", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// The staff-editable service menu.
export const useMenu = () => {
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/menu", { cache: "no-store" });
    if (res.status === 401) return router.refresh();
    if (res.ok) setMenu((await res.json()).menu);
  }, [router]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  // Returns true on success so forms can reset themselves.
  const run = async (method, body) => {
    setError(null);
    const res = await send(method, body);
    if (res.status === 401) {
      router.refresh();
      return false;
    }
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || "Could not save. Try again.");
    await load();
    return res.ok;
  };

  return {
    menu,
    error,
    addItem: (category, name) => run("POST", { category, name }),
    renameItem: (id, name) => run("PATCH", { id, name }),
    removeItem: (id) => run("DELETE", { id }),
  };
};
