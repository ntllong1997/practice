"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 3000;

const postJson = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Today's customers, shared by every technician device (polls the server).
export const useQueue = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState(null);

  const handleUnauthorized = useCallback(
    (res) => {
      if (res.status === 401) router.refresh();
      return res.status === 401;
    },
    [router]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/today", { cache: "no-store" });
      if (handleUnauthorized(res)) return;
      if (!res.ok) throw new Error();
      setCustomers((await res.json()).customers);
      setError(null);
    } catch {
      setError("Connection problem, retrying…");
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, POLL_MS);
    const handleVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [refresh]);

  const setStatus = async (service, to) => {
    // Show the change right away; the next refresh confirms it.
    setCustomers((current) =>
      current?.map((c) => ({
        ...c,
        services: c.services.map((s) => (s.id === service.id ? { ...s, status: to } : s)),
      }))
    );
    const res = await postJson("/api/staff/status", { serviceId: service.id, from: service.status, to });
    if (!handleUnauthorized(res) && !res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Could not update. Try again.");
    }
    refresh();
  };

  const cancelCustomer = async (customer) => {
    setCustomers((current) => current?.filter((c) => c.id !== customer.id));
    const res = await postJson("/api/staff/cancel", { checkinId: customer.id });
    if (!handleUnauthorized(res) && !res.ok) setError("Could not cancel. Try again.");
    refresh();
  };

  return { customers, error, setStatus, cancelCustomer };
};
