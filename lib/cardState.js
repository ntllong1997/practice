// Card color rules for the dashboard:
//   red   – a service is being done right now
//   blue  – every service is done
//   green – some done, some still waiting (priority: finish this customer)
//   new   – nothing started yet
export const cardState = (services = []) => {
  if (services.some((s) => s.status === "in_progress")) return "doing";
  if (services.length && services.every((s) => s.status === "done")) return "finished";
  if (services.some((s) => s.status === "done")) return "priority";
  return "waiting";
};

// Next status when a technician taps a service chip.
export const nextStatus = (status) =>
  ({ waiting: "in_progress", in_progress: "done", done: "waiting" })[status];
