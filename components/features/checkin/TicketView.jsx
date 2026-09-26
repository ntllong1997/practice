"use client";

import { useEffect, useState } from "react";
import { serviceLabel } from "@/lib/services";

const POLL_MS = 15000;

const queueMessage = (status) => {
  if (!status) return null;
  if (status.cancelled) return "This check-in was cancelled. Please see the front desk.";
  if (status.started) return "Your service has started. Enjoy!";
  if (status.ahead === 0) return "You're next!";
  return `${status.ahead} ${status.ahead === 1 ? "person" : "people"} ahead of you`;
};

const TicketView = ({ ticket, onNewCheckIn }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/ticket/${ticket.id}`, { cache: "no-store" });
        if (res.ok && isActive) setStatus(await res.json());
      } catch {
        // keep the last known status
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, [ticket.id]);

  const checkedInAt = new Date(ticket.created_at);

  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow">
      <p className="text-lg font-medium text-slate-500">Your number</p>
      <p className="my-2 text-8xl font-black text-pink-600">#{ticket.ticket_number}</p>
      {ticket.name && <p className="text-2xl font-semibold">{ticket.name}</p>}
      <p className="mt-2 text-lg">{ticket.services.map(serviceLabel).join(" + ")}</p>
      <p className="mt-1 text-slate-500">
        {checkedInAt.toLocaleDateString()} · {checkedInAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </p>

      {status && (
        <p className="mt-5 rounded-xl bg-pink-50 p-3 text-xl font-semibold text-pink-800">
          {queueMessage(status)}
        </p>
      )}

      <p className="mt-6 rounded-xl border-2 border-dashed border-pink-300 p-4 text-lg font-semibold">
        📸 Please take a screenshot of this screen to keep your number.
      </p>

      {onNewCheckIn && (
        <button type="button" onClick={onNewCheckIn} className="mt-6 text-pink-700 underline">
          Check in another person
        </button>
      )}
    </div>
  );
};

export default TicketView;
