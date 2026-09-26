export const SERVICES = [
  { id: "pedicure", label: "Pedicure" },
  { id: "nails", label: "Nails" },
];

export const serviceLabel = (id) => SERVICES.find((s) => s.id === id)?.label ?? id;
