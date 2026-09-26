"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const RETRY_MS = 5000;

// Front-desk screen: shows the rotating check-in QR code.
const QrDisplay = ({ salonName }) => {
  const router = useRouter();
  const [qr, setQr] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [error, setError] = useState(null);
  const expiresAt = useRef(0);
  const isLoading = useRef(false);

  const load = useCallback(async () => {
    isLoading.current = true;
    try {
      const res = await fetch("/api/staff/qr", { cache: "no-store" });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error();
      const body = await res.json();
      expiresAt.current = Date.now() + body.secondsLeft * 1000;
      setQr(body);
      setSecondsLeft(body.secondsLeft);
      setError(null);
    } catch {
      expiresAt.current = Date.now() + RETRY_MS;
      setError("Connection problem, retrying…");
    } finally {
      isLoading.current = false;
    }
  }, [router]);

  useEffect(() => {
    const tick = () => {
      const left = Math.ceil((expiresAt.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(left, 0));
      if (left <= 0 && !isLoading.current) load();
    };
    const first = setTimeout(load, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 py-8 text-center">
      <h1 className="text-4xl font-bold text-pink-700">{salonName}</h1>
      <p className="text-2xl font-semibold">Scan with your phone camera to check in</p>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr.image} alt="Check-in QR code" className="aspect-square w-full max-w-md" />
      ) : (
        <div className="aspect-square w-full max-w-md animate-pulse rounded-2xl bg-slate-100" />
      )}
      {error ? (
        <p className="text-amber-700">{error}</p>
      ) : (
        secondsLeft !== null && <p className="text-slate-500">New code in {secondsLeft}s</p>
      )}
      <a href="/dashboard" className="text-sm text-slate-400 underline">Dashboard</a>
    </main>
  );
};

export default QrDisplay;
