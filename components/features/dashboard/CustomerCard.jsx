"use client";

import { cardState, nextStatus } from "@/lib/cardState";
import ServiceChip from "./ServiceChip";

const CARD_STYLES = {
  waiting: "bg-white text-slate-900 border border-slate-200",
  doing: "bg-red-500 text-white",
  priority: "bg-green-500 text-white",
  finished: "bg-blue-500 text-white",
};

const CustomerCard = ({ customer, onTapService, onCancel }) => {
  const state = cardState(customer.services);
  const checkedInAt = new Date(customer.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleTap = (service) => {
    if (service.status === "done" && !window.confirm(`Undo "done" for #${customer.ticket_number}?`)) {
      return;
    }
    onTapService(service, nextStatus(service.status));
  };

  const handleCancel = () => {
    if (window.confirm(`Remove #${customer.ticket_number} from the list (left / no-show)?`)) {
      onCancel(customer);
    }
  };

  return (
    <article className={`rounded-2xl p-4 shadow transition-colors ${CARD_STYLES[state]}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-3xl font-black">#{customer.ticket_number}</p>
          <p className="text-lg font-semibold">{customer.name || "Guest"}</p>
        </div>
        <div className="text-right text-sm opacity-80">
          <p>{checkedInAt}</p>
          {state === "priority" && (
            <p className="mt-1 rounded-full bg-white px-2 py-0.5 font-bold text-green-700">Priority</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {customer.services.map((service) => (
          <ServiceChip key={service.id} service={service} onTap={() => handleTap(service)} />
        ))}
      </div>

      {onCancel && (
        <button type="button" onClick={handleCancel} className="mt-3 text-sm underline opacity-70">
          Cancel / no-show
        </button>
      )}
    </article>
  );
};

export default CustomerCard;
