// The two service categories. Staff manage the actual services (the menu)
// under these on /dashboard/services.
export const CATEGORIES = [
  { id: "pedicure", label: "Pedicure" },
  { id: "nails", label: "Nails" },
];

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const groupByCategory = (items) =>
  CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => item.category === category.id),
  }));
