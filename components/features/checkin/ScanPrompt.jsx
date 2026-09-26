const ScanPrompt = ({ expired }) => (
  <div className="rounded-2xl bg-white p-6 text-center shadow">
    <div className="mb-4 text-6xl" aria-hidden="true">📱</div>
    <h2 className="mb-2 text-2xl font-bold">Scan to check in</h2>
    <p className="text-lg text-slate-600">
      Please scan the QR code at the front desk to check in.
    </p>
    {expired && (
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-amber-800">
        That check-in link isn&apos;t valid. Please scan the QR code at the front desk.
      </p>
    )}
  </div>
);

export default ScanPrompt;
