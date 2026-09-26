"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Printable check-in QR code for the front desk.
const QrDisplay = ({ salonName }) => {
  const router = useRouter();
  const [qr, setQr] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/staff/qr", { cache: "no-store" });
        if (res.status === 401) return router.refresh();
        if (!res.ok) throw new Error();
        setQr(await res.json());
      } catch {
        setError("Could not load the QR code. Reload the page to try again.");
      }
    };
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 py-8 text-center print:min-h-0 print:py-0">
      <h1 className="text-4xl font-bold text-pink-700 print:text-6xl">{salonName}</h1>
      <p className="text-2xl font-semibold print:text-4xl">Scan with your phone camera to check in</p>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr.image} alt="Check-in QR code" className="aspect-square w-full max-w-md print:max-w-[70%]" />
      ) : (
        <div className="aspect-square w-full max-w-md animate-pulse rounded-2xl bg-slate-100" />
      )}
      {error && <p className="text-amber-700">{error}</p>}
      <p className="hidden text-xl text-slate-600 print:block">
        One scan = one check-in. Please take a screenshot of your number.
      </p>

      <div className="flex flex-col items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!qr}
          className="rounded-xl bg-pink-600 px-6 py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          🖨️ Print
        </button>
        <a href="/dashboard" className="text-sm text-slate-400 underline">Dashboard</a>
      </div>
    </main>
  );
};

export default QrDisplay;
