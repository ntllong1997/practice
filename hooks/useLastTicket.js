"use client";

import { useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "salon_last_ticket";
const CHANGE_EVENT = "salon-ticket-change";
const MAX_AGE_MS = 18 * 60 * 60 * 1000;

const subscribe = (onChange) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

const getSnapshot = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

// undefined on the server = "not read yet"
const getServerSnapshot = () => undefined;

const parseTicket = (raw) => {
  try {
    const ticket = JSON.parse(raw);
    if (ticket && Date.now() - new Date(ticket.created_at).getTime() < MAX_AGE_MS) return ticket;
  } catch {
    // corrupt value: behave as if there is no ticket
  }
  return null;
};

// The customer's most recent ticket, remembered on this phone so a refresh
// still shows their number.
export const useLastTicket = () => {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ticket = useMemo(() => (raw ? parseTicket(raw) : null), [raw]);

  const saveTicket = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // storage blocked (private mode): nothing else we can do
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { ticket, saveTicket, isReady: raw !== undefined };
};
