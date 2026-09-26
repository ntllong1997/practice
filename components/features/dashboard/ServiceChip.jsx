import { categoryLabel } from "@/lib/services";

const CHIP = {
  waiting: { style: "bg-slate-100 text-slate-900 border-2 border-slate-300", hint: "Tap to start" },
  in_progress: { style: "bg-red-700 text-white border-2 border-white", hint: "Doing · tap when done" },
  done: { style: "bg-white/25 text-white border-2 border-white/60", hint: "Done ✓" },
};

const ServiceChip = ({ service, onTap }) => {
  const chip = CHIP[service.status];
  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-semibold ${chip.style}`}
    >
      <span>
        {service.name}
        <span className="ml-2 text-xs font-medium uppercase opacity-70">{categoryLabel(service.category)}</span>
      </span>
      <span className="shrink-0 whitespace-nowrap text-sm font-medium">{chip.hint}</span>
    </button>
  );
};

export default ServiceChip;
