export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const today = () => new Date().toISOString().split("T")[0];
export const fmt = (n) =>
  "₦" +
  (parseFloat(n) || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const SERVICE_TYPES = [
  "Dry Clean",
  "Wash & Iron",
  "Iron Only",
  "Starch & Iron",
  "Wash Only",
  "Leather Clean",
  "Alteration",
];

export const ITEM_CATALOGUE = [
  "Suit (2-piece)",
  "Suit (3-piece)",
  "Blazer",
  "Trousers",
  "Shirt",
  "Blouse",
  "Gown / Dress",
  "Agbada",
  "Senator / Kaftan",
  "Ankara Outfit",
  "Jeans",
  "Skirt",
  "Jacket / Coat",
  "Tie",
  "Bedsheet",
  "Duvet / Blanket",
  "Curtain (per panel)",
  "Towel",
  "Cap / Hat",
  "Bag",
  "Sneakers / Shoes",
  "Other",
];

export const totalExtraCosts = (financials) =>
  (financials?.extraCosts || []).reduce(
    (s, c) => s + (parseFloat(c.value) || 0),
    0,
  );

export const jobProfit = (job, financials) =>
  (parseFloat(job.price) || 0) -
  (parseFloat(financials?.supplyCost) || 0) -
  totalExtraCosts(financials);

export const inRange = (ds, from, to) => {
  if (!from && !to) return true;
  if (!ds) return false;
  if (from && ds < from) return false;
  if (to && ds > to) return false;
  return true;
};

export const getPresetRange = (preset) => {
  const now = new Date();
  const y = now.getFullYear(),
    mo = now.getMonth(),
    d = now.getDate();
  if (preset === "today") {
    const t = today();
    return { from: t, to: t };
  }
  if (preset === "week") {
    const day = now.getDay();
    const mon = new Date(y, mo, d - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      from: mon.toISOString().split("T")[0],
      to: sun.toISOString().split("T")[0],
    };
  }
  if (preset === "month")
    return {
      from: new Date(y, mo, 1).toISOString().split("T")[0],
      to: new Date(y, mo + 1, 0).toISOString().split("T")[0],
    };
  if (preset === "last30") {
    const f = new Date(y, mo, d - 29);
    return { from: f.toISOString().split("T")[0], to: today() };
  }
  return { from: "", to: "" };
};
