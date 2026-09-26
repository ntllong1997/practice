"use client";

import { useRouter } from "next/navigation";
import { useQueue } from "@/hooks/useQueue";
import { cardState } from "@/lib/cardState";
import CustomerCard from "./CustomerCard";
import Legend from "./Legend";

const Dashboard = () => {
  const router = useRouter();
  const { customers, error, setStatus, cancelCustomer } = useQueue();

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.refresh();
  };

  const active = customers?.filter((c) => cardState(c.services) !== "finished") ?? [];
  const finished = customers?.filter((c) => cardState(c.services) === "finished") ?? [];
  const notStarted = active.filter((c) => cardState(c.services) === "waiting").length;
  const inProgress = active.filter((c) => cardState(c.services) === "doing").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Today&apos;s customers</h1>
          <p className="text-slate-600">
            {notStarted} waiting · {inProgress} in service · {finished.length} finished
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard/services" className="text-pink-700 underline">Services</a>
          <a href="/qr" className="text-pink-700 underline">Print QR</a>
          <button type="button" onClick={handleLogout} className="text-slate-500 underline">
            Sign out
          </button>
        </div>
      </header>

      <Legend />
      {error && <p className="mb-3 rounded-lg bg-amber-100 p-2 text-amber-900">{error}</p>}
      {customers === null && <p className="py-10 text-center text-slate-500">Loading…</p>}
      {customers?.length === 0 && (
        <p className="py-10 text-center text-lg text-slate-500">No customers checked in yet today.</p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onTapService={setStatus}
            onCancel={cancelCustomer}
          />
        ))}
      </section>

      {finished.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl font-bold text-slate-600">Completed</h2>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {finished.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onTapService={setStatus} />
            ))}
          </section>
        </>
      )}
    </main>
  );
};

export default Dashboard;
