const ITEMS = [
  { label: "Waiting", className: "bg-white border border-slate-300" },
  { label: "Doing", className: "bg-red-500" },
  { label: "Next service (priority)", className: "bg-green-500" },
  { label: "All done", className: "bg-blue-500" },
];

const Legend = () => (
  <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
    {ITEMS.map((item) => (
      <li key={item.label} className="flex items-center gap-1.5">
        <span className={`inline-block h-3 w-3 rounded-full ${item.className}`} />
        {item.label}
      </li>
    ))}
  </ul>
);

export default Legend;
