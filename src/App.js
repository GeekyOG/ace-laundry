import { useState, useEffect, useCallback } from "react";
import {
  Shirt,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  WifiOff,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  ClipboardList,
  Banknote,
  BarChart2,
  Droplets,
  CheckCircle2,
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// ─── Storage ───────────────────────────────────────────────────────
const JOBS_KEY = "dc_jobs";
const TX_KEY = "dc_tx";
const load = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    return [];
  }
};
const persist = (k, d) => localStorage.setItem(k, JSON.stringify(d));
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().split("T")[0];
const fmt = (n) =>
  "₦" +
  (parseFloat(n) || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// ─── Service types & item catalogue ───────────────────────────────
const SERVICE_TYPES = [
  "Dry Clean",
  "Wash & Iron",
  "Iron Only",
  "Starch & Iron",
  "Wash Only",
  "Leather Clean",
  "Alteration",
];
const ITEM_CATALOGUE = [
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

// ─── Profit helpers ────────────────────────────────────────────────
const totalExtraCosts = (job) =>
  (job.extraCosts || []).reduce((s, c) => s + (parseFloat(c.value) || 0), 0);
const jobProfit = (job) =>
  (parseFloat(job.price) || 0) -
  (parseFloat(job.supplyCost) || 0) -
  totalExtraCosts(job);

// ─── Seed Data ─────────────────────────────────────────────────────
const SEED_JOBS = [];

const SEED_TX = [
  {
    id: uid(),
    type: "income",
    desc: "Adebayo — deposit",
    amount: 5000,
    date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    cat: "Deposit received",
    created: Date.now() - 86400000 * 1,
  },
  {
    id: uid(),
    type: "income",
    desc: "Chioma — full payment",
    amount: 8500,
    date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
    cat: "Payment received",
    created: Date.now() - 86400000 * 3,
  },
  {
    id: uid(),
    type: "expense",
    desc: "Dry-clean chemicals restock",
    amount: 12000,
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    cat: "Supplies",
    created: Date.now() - 86400000 * 5,
  },
  {
    id: uid(),
    type: "income",
    desc: "Emeka — full payment",
    amount: 4000,
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    cat: "Payment received",
    created: Date.now() - 86400000 * 5,
  },
  {
    id: uid(),
    type: "income",
    desc: "Funmi — full payment",
    amount: 5000,
    date: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0],
    cat: "Payment received",
    created: Date.now() - 86400000 * 7,
  },
  {
    id: uid(),
    type: "expense",
    desc: "Electricity bill",
    amount: 8000,
    date: new Date(Date.now() - 86400000 * 12).toISOString().split("T")[0],
    cat: "Utilities",
    created: Date.now() - 86400000 * 12,
  },
  {
    id: uid(),
    type: "income",
    desc: "Walk-in batch — 6 shirts",
    amount: 6000,
    date: new Date(Date.now() - 86400000 * 14).toISOString().split("T")[0],
    cat: "Payment received",
    created: Date.now() - 86400000 * 14,
  },
  {
    id: uid(),
    type: "expense",
    desc: "Machine maintenance",
    amount: 15000,
    date: new Date(Date.now() - 86400000 * 20).toISOString().split("T")[0],
    cat: "Equipment",
    created: Date.now() - 86400000 * 20,
  },
  {
    id: uid(),
    type: "income",
    desc: "Corporate laundry — weekly",
    amount: 45000,
    date: new Date(Date.now() - 86400000 * 25).toISOString().split("T")[0],
    cat: "Payment received",
    created: Date.now() - 86400000 * 25,
  },
  {
    id: uid(),
    type: "expense",
    desc: "Packaging bags & hangers",
    amount: 4500,
    date: new Date(Date.now() - 86400000 * 28).toISOString().split("T")[0],
    cat: "Supplies",
    created: Date.now() - 86400000 * 28,
  },
];

// ─── Date Helpers ──────────────────────────────────────────────────
const getPresetRange = (preset) => {
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
const inRange = (ds, from, to) => {
  if (!from && !to) return true;
  if (!ds) return false;
  if (from && ds < from) return false;
  if (to && ds > to) return false;
  return true;
};

// ─── Styles ────────────────────────────────────────────────────────
const ACCENT = "#1565C0"; // blue theme for dry-clean
const ACCENT_LIGHT = "#E3F0FF";

const S = {
  app: {
    fontFamily: "'Georgia', serif",
    background: "#F5F8FF",
    minHeight: "100vh",
    color: "#1A1A1A",
    maxWidth: 480,
    margin: "0 auto",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#0D1F3C",
    borderBottom: `2px solid ${ACCENT}`,
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
  },
  navBrand: {
    color: "#90CAF9",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
    padding: "13px 0",
    marginRight: "auto",
    lineHeight: 1.2,
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  navBrandSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontFamily: "sans-serif",
    letterSpacing: 1,
    fontWeight: "normal",
    display: "block",
    marginTop: 1,
  },
  navTab: (a) => ({
    color: a ? "#90CAF9" : "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "sans-serif",
    padding: "14px 12px",
    cursor: "pointer",
    border: "none",
    background: "none",
    borderBottom: a ? `2px solid #90CAF9` : "2px solid transparent",
    marginBottom: -2,
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  }),
  offlineBar: {
    background: ACCENT_LIGHT,
    borderBottom: `1px solid rgba(21,101,192,0.3)`,
    padding: "6px 16px",
    fontFamily: "sans-serif",
    fontSize: 11,
    color: ACCENT,
    display: "flex",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  page: { padding: 16 },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 10,
    marginBottom: 16,
  },
  metric: (v) => {
    const bg =
      {
        blue: ACCENT_LIGHT,
        green: "#EAF5EE",
        danger: "#FDECEA",
        default: "#FFFFFF",
      }[v] || "#FFFFFF";
    const bdr =
      {
        blue: "rgba(21,101,192,0.2)",
        green: "rgba(45,125,70,0.2)",
        danger: "rgba(192,57,43,0.2)",
        default: "rgba(0,0,0,0.08)",
      }[v] || "rgba(0,0,0,0.08)";
    return {
      background: bg,
      border: `0.5px solid ${bdr}`,
      borderRadius: 10,
      padding: "12px 14px",
    };
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "sans-serif",
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  metricValue: (v) => ({
    fontSize: 19,
    fontWeight: "bold",
    color:
      { blue: ACCENT, green: "#2D7D46", danger: "#C0392B", default: "#1A1A1A" }[
        v
      ] || "#1A1A1A",
    letterSpacing: -0.5,
  }),
  metricSub: {
    fontSize: 10,
    fontFamily: "sans-serif",
    color: "#6B6B6B",
    marginTop: 2,
  },
  secHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  secTitle: { fontSize: 17, color: "#1A1A1A", letterSpacing: -0.3 },
  btnPrimary: {
    background: "#0D1F3C",
    color: "#90CAF9",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    letterSpacing: 0.3,
  },
  btnSm: { padding: "6px 10px", fontSize: 11, borderRadius: 8 },
  btnDanger: {
    background: "#FDECEA",
    color: "#C0392B",
    border: "1px solid rgba(192,57,43,0.2)",
  },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    fontFamily: "sans-serif",
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#F5F8FF",
    color: "#6B6B6B",
    fontWeight: 500,
  },
  btnSave: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    fontFamily: "sans-serif",
    fontSize: 13,
    cursor: "pointer",
    border: "none",
    background: "#0D1F3C",
    color: "#90CAF9",
    fontWeight: 500,
  },
  card: {
    background: "#FFFFFF",
    border: "0.5px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 10,
  },
  cardName: { fontSize: 15, fontWeight: "bold", color: "#1A1A1A" },
  cardSub: {
    fontSize: 12,
    fontFamily: "sans-serif",
    color: "#6B6B6B",
    marginTop: 1,
  },
  cardMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 6,
    marginTop: 10,
  },
  metaItem: { fontFamily: "sans-serif", fontSize: 11 },
  metaLabel: { color: "#6B6B6B", marginBottom: 1 },
  metaVal: { color: "#1A1A1A", fontWeight: 500 },
  cardActions: {
    display: "flex",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTop: "0.5px solid rgba(0,0,0,0.08)",
  },
  badge: (variant) => {
    const map = {
      Pending: { bg: "#FFF3CD", color: "#856404" },
      "In Progress": { bg: "#E3F0FF", color: "#1565C0" },
      Ready: { bg: "#E8F5E9", color: "#2E7D32" },
      Collected: { bg: "#EAF5EE", color: "#2D7D46" },
      paid: { bg: "#EAF5EE", color: "#2D7D46" },
      partial: { bg: "#FFF3CD", color: "#856404" },
      unpaid: { bg: "#FDECEA", color: "#C0392B" },
      pickup: { bg: "#F3E5F5", color: "#7B1FA2" },
      delivery: { bg: "#E3F0FF", color: "#1565C0" },
    };
    const v = map[variant] || { bg: "#F1F3F5", color: "#555" };
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontFamily: "sans-serif",
      fontSize: 10,
      padding: "3px 8px",
      borderRadius: 20,
      fontWeight: 600,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      background: v.bg,
      color: v.color,
    };
  },
  searchWrap: { position: "relative", marginBottom: 12 },
  searchInput: {
    width: "100%",
    paddingLeft: 34,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 10,
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "sans-serif",
    color: "#1A1A1A",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  searchIconWrap: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9B9B9B",
    display: "flex",
  },
  filterRow: {
    display: "flex",
    gap: 6,
    marginBottom: 14,
    overflowX: "auto",
    paddingBottom: 4,
  },
  chip: (a) => ({
    fontFamily: "sans-serif",
    fontSize: 11,
    padding: "5px 12px",
    borderRadius: 20,
    border: a ? `1px solid ${ACCENT}` : "1px solid rgba(0,0,0,0.12)",
    background: a ? ACCENT_LIGHT : "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
    color: a ? ACCENT : "#6B6B6B",
    letterSpacing: 0.3,
    fontWeight: a ? 600 : 400,
  }),
  divider: {
    fontFamily: "sans-serif",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6B6B6B",
    margin: "16px 0 8px",
    paddingBottom: 4,
    borderBottom: "0.5px solid rgba(0,0,0,0.08)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modal: {
    background: "#fff",
    borderRadius: "14px 14px 0 0",
    width: "100%",
    maxWidth: 480,
    maxHeight: "92vh",
    overflowY: "auto",
    padding: "20px 18px 30px",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "0.5px solid rgba(0,0,0,0.08)",
  },
  formGroup: { marginBottom: 14 },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 10,
  },
  label: {
    fontFamily: "sans-serif",
    fontSize: 11,
    color: "#6B6B6B",
    display: "block",
    marginBottom: 5,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "sans-serif",
    color: "#1A1A1A",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "sans-serif",
    color: "#1A1A1A",
    background: "#fff",
    outline: "none",
    resize: "vertical",
    minHeight: 70,
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "sans-serif",
    color: "#1A1A1A",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  },
  modalActions: { display: "flex", gap: 8, marginTop: 18 },
  txAmount: (t) => ({
    fontFamily: "sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: t === "income" ? "#2D7D46" : "#C0392B",
  }),
  chartWrap: {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 14,
  },
  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#9B9B9B",
    fontFamily: "sans-serif",
    fontSize: 13,
  },
};

// ─── Date Filter ───────────────────────────────────────────────────
const PRESETS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "last30", label: "Last 30 days" },
  { key: "custom", label: "Custom" },
];

function DateFilter({
  dateRange,
  setDateRange,
  dateField,
  setDateField,
  showFieldToggle,
}) {
  const [activePreset, setActivePreset] = useState("all");
  const [showCustom, setShowCustom] = useState(false);
  const applyPreset = (key) => {
    setActivePreset(key);
    if (key === "all") {
      setDateRange({ from: "", to: "" });
      setShowCustom(false);
      return;
    }
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setDateRange(getPresetRange(key));
  };
  const clear = () => {
    setDateRange({ from: "", to: "" });
    setActivePreset("all");
    setShowCustom(false);
  };
  const si = {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 8,
    padding: "7px 8px",
    fontSize: 12,
    fontFamily: "sans-serif",
    color: "#1A1A1A",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };
  return (
    <div
      style={{
        marginBottom: 14,
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 10,
          gap: 6,
        }}
      >
        <Calendar size={13} color={ACCENT} />
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: 11,
            color: ACCENT,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Filter by date
        </span>
        {showFieldToggle && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {[
              ["due", "Due date"],
              ["pickup", "Pickup"],
            ].map(([v, lbl]) => (
              <button
                key={v}
                onClick={() => setDateField(v)}
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 20,
                  border:
                    dateField === v
                      ? `1px solid ${ACCENT}`
                      : "1px solid rgba(0,0,0,0.12)",
                  background: dateField === v ? ACCENT_LIGHT : "#fff",
                  color: dateField === v ? ACCENT : "#6B6B6B",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontWeight: dateField === v ? 600 : 400,
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => applyPreset(p.key)}
            style={{
              fontFamily: "sans-serif",
              fontSize: 11,
              padding: "5px 10px",
              borderRadius: 20,
              border:
                activePreset === p.key
                  ? `1px solid ${ACCENT}`
                  : "1px solid rgba(0,0,0,0.12)",
              background: activePreset === p.key ? ACCENT_LIGHT : "#F5F8FF",
              color: activePreset === p.key ? ACCENT : "#6B6B6B",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: activePreset === p.key ? 600 : 400,
              flexShrink: 0,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 10,
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              From
            </div>
            <input
              type="date"
              value={dateRange.from}
              style={si}
              onChange={(e) =>
                setDateRange((r) => ({ ...r, from: e.target.value }))
              }
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 10,
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              To
            </div>
            <input
              type="date"
              value={dateRange.to}
              style={si}
              onChange={(e) =>
                setDateRange((r) => ({ ...r, to: e.target.value }))
              }
            />
          </div>
        </div>
      )}
      {(dateRange.from || dateRange.to) && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "sans-serif",
            fontSize: 11,
          }}
        >
          <span style={{ color: ACCENT }}>
            {dateRange.from || "start"} → {dateRange.to || "end"}
          </span>
          <button
            onClick={clear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#C0392B",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontFamily: "sans-serif",
              fontSize: 11,
            }}
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Revenue Chart ─────────────────────────────────────────────────
function RevenueChart({ txs, dateRange }) {
  const buildBuckets = () => {
    const now = new Date();
    if (!dateRange.from && !dateRange.to) {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label:
            d.toLocaleString("default", { month: "short" }) +
            " " +
            d.getFullYear(),
          test: (t) => {
            const dt = new Date(t.date);
            return (
              dt.getMonth() === d.getMonth() &&
              dt.getFullYear() === d.getFullYear()
            );
          },
        });
      }
      return months;
    }
    const from = dateRange.from
      ? new Date(dateRange.from)
      : new Date(Math.min(...txs.map((t) => new Date(t.date))));
    const to = dateRange.to ? new Date(dateRange.to) : now;
    const diff = Math.round((to - from) / 86400000);
    if (diff <= 31) {
      const days = [];
      for (let i = 0; i <= diff; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        const ds = d.toISOString().split("T")[0];
        days.push({
          label: d.toLocaleDateString("default", {
            day: "2-digit",
            month: "short",
          }),
          test: (t) => t.date === ds,
        });
      }
      return days;
    } else if (diff <= 92) {
      const weeks = [];
      let cur = new Date(from);
      while (cur <= to) {
        const ws = new Date(cur);
        const we = new Date(cur);
        we.setDate(cur.getDate() + 6);
        const wss = ws.toISOString().split("T")[0];
        const wes = (we > to ? to : we).toISOString().split("T")[0];
        weeks.push({
          label: ws.toLocaleDateString("default", {
            day: "2-digit",
            month: "short",
          }),
          test: (t) => t.date >= wss && t.date <= wes,
        });
        cur.setDate(cur.getDate() + 7);
      }
      return weeks;
    } else {
      const months = [];
      let cur = new Date(from.getFullYear(), from.getMonth(), 1);
      while (cur <= to) {
        const mo = cur.getMonth(),
          yr = cur.getFullYear();
        months.push({
          label: cur.toLocaleString("default", { month: "short" }) + " " + yr,
          test: (t) => {
            const dt = new Date(t.date);
            return dt.getMonth() === mo && dt.getFullYear() === yr;
          },
        });
        cur.setMonth(cur.getMonth() + 1);
      }
      return months;
    }
  };
  const buckets = buildBuckets();
  const filtered = txs.filter((t) =>
    inRange(t.date, dateRange.from, dateRange.to),
  );
  const incData = buckets.map((b) =>
    filtered
      .filter((t) => t.type === "income" && b.test(t))
      .reduce((s, t) => s + t.amount, 0),
  );
  const expData = buckets.map((b) =>
    filtered
      .filter((t) => t.type === "expense" && b.test(t))
      .reduce((s, t) => s + t.amount, 0),
  );
  const data = {
    labels: buckets.map((b) => b.label),
    datasets: [
      {
        label: "Income",
        data: incData,
        backgroundColor: "rgba(21,101,192,0.7)",
        borderColor: ACCENT,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Expenses",
        data: expData,
        backgroundColor: "rgba(192,57,43,0.65)",
        borderColor: "#C0392B",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { family: "sans-serif", size: 11 },
          color: "#6B6B6B",
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (c) => " " + c.dataset.label + ": " + fmt(c.parsed.y),
        },
        bodyFont: { family: "sans-serif" },
        titleFont: { family: "sans-serif" },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "sans-serif", size: 10 },
          color: "#9B9B9B",
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { family: "sans-serif", size: 10 },
          color: "#9B9B9B",
          callback: (v) => "₦" + (v / 1000).toFixed(0) + "k",
        },
        beginAtZero: true,
      },
    },
  };
  const isFiltered = !!(dateRange.from || dateRange.to);
  return (
    <div style={S.chartWrap}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BarChart2 size={14} color="#6B6B6B" />
          <span
            style={{
              fontFamily: "sans-serif",
              fontSize: 11,
              color: "#6B6B6B",
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Revenue vs Expenses
          </span>
        </div>
        {isFiltered && (
          <span
            style={{
              fontFamily: "sans-serif",
              fontSize: 10,
              color: ACCENT,
              background: ACCENT_LIGHT,
              padding: "2px 8px",
              borderRadius: 20,
              border: `1px solid rgba(21,101,192,0.2)`,
            }}
          >
            Filtered
          </span>
        )}
      </div>
      <div style={{ height: 180 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

// ─── Shared: MetricCard & Badge ────────────────────────────────────
function MetricCard({ label, value, sub, variant = "default", icon: Icon }) {
  const ic =
    { blue: ACCENT, green: "#2D7D46", danger: "#C0392B", default: "#9B9B9B" }[
      variant
    ] || "#9B9B9B";
  return (
    <div style={S.metric(variant)}>
      <div style={S.metricLabel}>
        {Icon && <Icon size={11} color={ic} />}
        {label}
      </div>
      <div style={S.metricValue(variant)}>{value}</div>
      {sub && <div style={S.metricSub}>{sub}</div>}
    </div>
  );
}

function Badge({ status }) {
  return <span style={S.badge(status)}>{status}</span>;
}

// ─── Items Editor (used in JobModal) ──────────────────────────────
function ItemsEditor({ items, setItems }) {
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        name: ITEM_CATALOGUE[0],
        qty: 1,
        unitPrice: 0,
        deliveredQty: 0,
      },
    ]);
  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id, field, val) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    );
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={S.label}>Items</span>
        <button
          onClick={addItem}
          style={{
            background: "none",
            border: `1px solid rgba(0,0,0,0.12)`,
            borderRadius: 8,
            cursor: "pointer",
            padding: "4px 10px",
            fontFamily: "sans-serif",
            fontSize: 11,
            color: "#1A1A1A",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Plus size={12} />
          Add item
        </button>
      </div>
      {items.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 58px 80px 32px",
            gap: 6,
            marginBottom: 4,
          }}
        >
          {["Item", "Qty", "₦ / pc", ""].map((h) => (
            <div
              key={h}
              style={{
                fontFamily: "sans-serif",
                fontSize: 10,
                color: "#9B9B9B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {h}
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 12,
            color: "#9B9B9B",
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          No items — click "Add item"
        </div>
      )}
      {items.map((it) => {
        const lineTotal =
          (parseFloat(it.unitPrice) || 0) * (parseInt(it.qty) || 0);
        return (
          <div key={it.id} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 58px 80px 32px",
                gap: 6,
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <select
                value={it.name}
                onChange={(e) => updateItem(it.id, "name", e.target.value)}
                style={{ ...S.select, fontSize: 13, padding: "8px 10px" }}
              >
                {ITEM_CATALOGUE.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={it.qty}
                onChange={(e) =>
                  updateItem(
                    it.id,
                    "qty",
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                style={{
                  ...S.input,
                  fontSize: 13,
                  padding: "8px 10px",
                  textAlign: "center",
                }}
                placeholder="Qty"
              />
              <input
                type="number"
                min="0"
                value={it.unitPrice || ""}
                onChange={(e) =>
                  updateItem(
                    it.id,
                    "unitPrice",
                    parseFloat(e.target.value) || 0,
                  )
                }
                style={{ ...S.input, fontSize: 13, padding: "8px 10px" }}
                placeholder="₦/pc"
              />
              <button
                onClick={() => removeItem(it.id)}
                style={{
                  background: "#FDECEA",
                  border: "1px solid rgba(192,57,43,0.2)",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                  color: "#C0392B",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
            {lineTotal > 0 && (
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 10,
                  color: "#9B9B9B",
                  textAlign: "right",
                  paddingRight: 38,
                }}
              >
                {it.qty} × {fmt(it.unitPrice)} = {fmt(lineTotal)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Job Modal (Add / Edit) ────────────────────────────────────────
const BLANK_JOB = {
  name: "",
  phone: "",
  service: SERVICE_TYPES[0],
  items: [],
  price: "",
  deposit: "",
  supplyCost: "",
  extraCosts: [],
  pickupDate: today(),
  dueDate: "",
  status: "Pending",
  delivery: "pickup",
  notes: "",
};

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_JOB,
    ...(job || {}),
    items: (job?.items || []).map((i) => ({ ...i })),
    extraCosts: (job?.extraCosts || []).map((c) => ({ ...c })),
  }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addExtra = () =>
    setForm((f) => ({
      ...f,
      extraCosts: [...(f.extraCosts || []), { id: uid(), name: "", value: "" }],
    }));
  const removeExtra = (id) =>
    setForm((f) => ({
      ...f,
      extraCosts: f.extraCosts.filter((c) => c.id !== id),
    }));
  const setExtra = (id, field, val) =>
    setForm((f) => ({
      ...f,
      extraCosts: f.extraCosts.map((c) =>
        c.id === id ? { ...c, [field]: val } : c,
      ),
    }));

  const extraTotal = (form.extraCosts || []).reduce(
    (s, c) => s + (parseFloat(c.value) || 0),
    0,
  );
  const totalCosts = (parseFloat(form.supplyCost) || 0) + extraTotal;
  const liveProfit = (parseFloat(form.price) || 0) - totalCosts;

  const handleSave = () => {
    if (!form.name.trim()) {
      alert("Enter customer name");
      return;
    }
    onSave(form);
  };

  return (
    <div
      style={S.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={S.modal}>
        <div style={S.modalTitle}>{job?.id ? "Edit Job" : "New Job"}</div>

        {/* Customer */}
        <div style={S.formGroup}>
          <label style={S.label}>Customer Name</label>
          <input
            style={S.input}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Phone</label>
            <input
              style={S.input}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+234..."
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Service Type</label>
            <select
              style={S.select}
              value={form.service}
              onChange={(e) => set("service", e.target.value)}
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items */}
        <div style={S.divider}>Items</div>
        <ItemsEditor
          items={form.items}
          setItems={(updater) => {
            setForm((f) => {
              const resolved =
                typeof updater === "function" ? updater(f.items) : updater;
              const computed = resolved.reduce(
                (s, i) =>
                  s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.qty) || 0),
                0,
              );
              return {
                ...f,
                items: resolved,
                ...(computed > 0 ? { price: computed } : {}),
              };
            });
          }}
        />

        {/* Schedule */}
        <div style={S.divider}>Schedule & Delivery</div>
        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Pickup Date</label>
            <input
              style={S.input}
              type="date"
              value={form.pickupDate}
              onChange={(e) => set("pickupDate", e.target.value)}
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Ready By</label>
            <input
              style={S.input}
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>
        </div>
        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Status</label>
            <select
              style={S.select}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["Pending", "In Progress", "Ready", "Collected"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Delivery Method</label>
            <select
              style={S.select}
              value={form.delivery}
              onChange={(e) => set("delivery", e.target.value)}
            >
              <option value="pickup">Customer Pickup</option>
              <option value="delivery">Home Delivery</option>
            </select>
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Notes</label>
          <textarea
            style={S.textarea}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Special instructions, stain locations, allergies..."
          />
        </div>

        {/* Payment */}
        <div style={S.divider}>Payment</div>
        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>
              Total Price (₦){" "}
              <span style={{ color: "#9B9B9B", fontWeight: 400 }}>auto</span>
            </label>
            <input
              style={S.input}
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="0"
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Deposit Paid (₦)</label>
            <input
              style={S.input}
              type="number"
              value={form.deposit}
              onChange={(e) => set("deposit", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Costs */}
        <div style={S.divider}>Costs</div>
        <div style={S.formGroup}>
          <label style={S.label}>Supply / Chemical Cost (₦)</label>
          <input
            style={S.input}
            type="number"
            value={form.supplyCost}
            onChange={(e) => set("supplyCost", e.target.value)}
            placeholder="Chemicals, bags, hangers..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "sans-serif",
                fontSize: 11,
                color: "#6B6B6B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Additional Costs
            </span>
            <button
              onClick={addExtra}
              style={{
                background: "none",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                cursor: "pointer",
                padding: "4px 10px",
                fontFamily: "sans-serif",
                fontSize: 11,
                color: "#1A1A1A",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Plus size={12} />
              Add cost
            </button>
          </div>
          {(form.extraCosts || []).length === 0 && (
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 12,
                color: "#9B9B9B",
                textAlign: "center",
                padding: "8px 0",
              }}
            >
              No additional costs — e.g. express fee, delivery, stain treatment
            </div>
          )}
          {(form.extraCosts || []).map((c) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 32px",
                gap: 6,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <input
                style={{ ...S.input, fontSize: 13, padding: "8px 10px" }}
                placeholder="e.g. Express fee, Delivery"
                value={c.name}
                onChange={(e) => setExtra(c.id, "name", e.target.value)}
              />
              <input
                style={{ ...S.input, fontSize: 13, padding: "8px 10px" }}
                type="number"
                placeholder="₦ amount"
                value={c.value}
                onChange={(e) => setExtra(c.id, "value", e.target.value)}
              />
              <button
                onClick={() => removeExtra(c.id)}
                style={{
                  background: "#FDECEA",
                  border: "1px solid rgba(192,57,43,0.2)",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                  color: "#C0392B",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Live profit preview */}
        <div
          style={{
            background: liveProfit >= 0 ? "#EAF5EE" : "#FDECEA",
            border: `0.5px solid ${liveProfit >= 0 ? "rgba(45,125,70,0.2)" : "rgba(192,57,43,0.2)"}`,
            borderRadius: 10,
            padding: "10px 14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div style={{ fontFamily: "sans-serif", fontSize: 11 }}>
            <div style={{ color: "#6B6B6B", marginBottom: 2 }}>Total costs</div>
            <div style={{ fontWeight: 600, color: "#C0392B" }}>
              {fmt(totalCosts)}
            </div>
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 11 }}>
            <div style={{ color: "#6B6B6B", marginBottom: 2 }}>Price</div>
            <div style={{ fontWeight: 600, color: "#1A1A1A" }}>
              {fmt(form.price)}
            </div>
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 11 }}>
            <div style={{ color: "#6B6B6B", marginBottom: 2 }}>Est. profit</div>
            <div
              style={{
                fontWeight: 700,
                color: liveProfit >= 0 ? "#2D7D46" : "#C0392B",
              }}
            >
              {fmt(liveProfit)}
            </div>
          </div>
        </div>

        <div style={S.modalActions}>
          <button style={S.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button style={S.btnSave} onClick={handleSave}>
            Save Job
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Modal ────────────────────────────────────────────────────
function ViewModal({ job, onClose, onEdit, onSave }) {
  const [items, setItems] = useState(() =>
    (job.items || []).map((i) => ({ ...i })),
  );

  const stepDelivered = (id, delta) => {
    const updated = items.map((i) => {
      if (i.id !== id) return i;
      const max = parseInt(i.qty) || 0;
      const cur = parseInt(i.deliveredQty) || 0;
      return { ...i, deliveredQty: Math.min(max, Math.max(0, cur + delta)) };
    });
    setItems(updated);
    onSave({ ...job, items: updated });
  };

  const deliveredCount = items.reduce(
    (s, i) => s + (parseInt(i.deliveredQty) || 0),
    0,
  );

  const bal = (parseFloat(job.price) || 0) - (parseFloat(job.deposit) || 0);
  const extraCosts = job.extraCosts || [];
  const extraTotal = totalExtraCosts(job);
  const allCosts = (parseFloat(job.supplyCost) || 0) + extraTotal;
  const profit = jobProfit(job);
  const totalPieces = items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
  return (
    <div
      style={S.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={S.modal}>
        <div style={S.modalTitle}>{job.name}</div>

        <div style={S.divider}>Job Info</div>
        <div style={S.cardMeta}>
          {[
            ["Phone", job.phone || "—"],
            ["Service", job.service],
            ["Status", job.status],
            [
              "Delivery",
              job.delivery === "pickup" ? "Customer Pickup" : "Home Delivery",
            ],
            ["Pickup", job.pickupDate || "—"],
            ["Ready By", job.dueDate || "—"],
          ].map(([l, v]) => (
            <div key={l} style={S.metaItem}>
              <div style={S.metaLabel}>{l}</div>
              <div style={S.metaVal}>{v}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            ...S.divider,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            Items ({totalPieces} piece{totalPieces !== 1 ? "s" : ""})
          </span>
          {items.length > 0 && (
            <span
              style={{
                fontFamily: "sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: deliveredCount === items.length ? "#2D7D46" : ACCENT,
                background:
                  deliveredCount === items.length ? "#EAF5EE" : ACCENT_LIGHT,
                padding: "2px 8px",
                borderRadius: 20,
                border: `1px solid ${deliveredCount === items.length ? "rgba(45,125,70,0.2)" : "rgba(21,101,192,0.2)"}`,
              }}
            >
              {deliveredCount}/{items.length} delivered
            </span>
          )}
        </div>
        <div
          style={{
            background: "#F5F8FF",
            borderRadius: 10,
            border: "0.5px solid rgba(0,0,0,0.08)",
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          {items.length === 0 && (
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 12,
                color: "#9B9B9B",
                textAlign: "center",
                padding: 12,
              }}
            >
              No items recorded
            </div>
          )}
          {items.map((it, i) => {
            const dqty = parseInt(it.deliveredQty) || 0;
            const totalQty = parseInt(it.qty) || 0;
            const full = dqty >= totalQty && totalQty > 0;
            return (
              <div
                key={it.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom:
                    i < items.length - 1
                      ? "0.5px solid rgba(0,0,0,0.06)"
                      : "none",
                  opacity: full ? 0.65 : 1,
                  background: full ? "#F0FFF4" : "transparent",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 12,
                      color: "#1A1A1A",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {full && <CheckCircle2 size={12} color="#2D7D46" />}
                    <span
                      style={{ textDecoration: full ? "line-through" : "none" }}
                    >
                      {it.name}
                    </span>
                  </div>
                  {(parseFloat(it.unitPrice) || 0) > 0 && (
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: 10,
                        color: "#9B9B9B",
                        marginTop: 1,
                      }}
                    >
                      {fmt(it.unitPrice)} × {totalQty} ={" "}
                      {fmt((parseFloat(it.unitPrice) || 0) * totalQty)}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => stepDelivered(it.id, -1)}
                    disabled={dqty <= 0}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: dqty <= 0 ? "#F5F8FF" : "#fff",
                      cursor: dqty <= 0 ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "sans-serif",
                      fontSize: 16,
                      color: dqty <= 0 ? "#ccc" : "#1A1A1A",
                      lineHeight: 1,
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      minWidth: 38,
                      textAlign: "center",
                      color: full ? "#2D7D46" : dqty > 0 ? ACCENT : "#9B9B9B",
                    }}
                  >
                    {dqty}/{totalQty}
                  </span>
                  <button
                    onClick={() => stepDelivered(it.id, 1)}
                    disabled={dqty >= totalQty}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: dqty >= totalQty ? "#F5F8FF" : "#fff",
                      cursor: dqty >= totalQty ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "sans-serif",
                      fontSize: 16,
                      color: dqty >= totalQty ? "#ccc" : "#1A1A1A",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {job.notes && (
          <div
            style={{
              fontSize: 12,
              color: "#6B6B6B",
              fontFamily: "sans-serif",
              margin: "10px 0",
              padding: 8,
              background: "#F5F8FF",
              borderRadius: 8,
            }}
          >
            {job.notes}
          </div>
        )}

        <div style={S.divider}>Payment</div>
        <div style={S.cardMeta}>
          {[
            ["Total Price", fmt(job.price), null],
            ["Deposit", fmt(job.deposit), null],
            ["Balance Due", fmt(bal), bal > 0 ? "#C0392B" : "#2D7D46"],
            ["Supply Cost", fmt(job.supplyCost), null],
          ].map(([l, v, c]) => (
            <div key={l} style={S.metaItem}>
              <div style={S.metaLabel}>{l}</div>
              <div style={{ ...S.metaVal, ...(c ? { color: c } : {}) }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {extraCosts.length > 0 && (
          <>
            <div
              style={{
                fontFamily: "sans-serif",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#6B6B6B",
                margin: "12px 0 8px",
                paddingBottom: 4,
                borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              }}
            >
              Additional Costs
            </div>
            <div
              style={{
                background: "#F5F8FF",
                borderRadius: 10,
                border: "0.5px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              {extraCosts.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderBottom:
                      i < extraCosts.length - 1
                        ? "0.5px solid rgba(0,0,0,0.06)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 12,
                      color: "#1A1A1A",
                    }}
                  >
                    {c.name || "Unnamed cost"}
                  </span>
                  <span
                    style={{
                      fontFamily: "sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#C0392B",
                    }}
                  >
                    −{fmt(c.value)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#EDF2FF",
                  borderTop: "0.5px solid rgba(0,0,0,0.08)",
                }}
              >
                <span
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: 11,
                    color: "#6B6B6B",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Extra costs subtotal
                </span>
                <span
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#C0392B",
                  }}
                >
                  −{fmt(extraTotal)}
                </span>
              </div>
            </div>
          </>
        )}

        <div
          style={{
            background: profit >= 0 ? "#EAF5EE" : "#FDECEA",
            border: `0.5px solid ${profit >= 0 ? "rgba(45,125,70,0.2)" : "rgba(192,57,43,0.2)"}`,
            borderRadius: 10,
            padding: "12px 14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div style={{ fontFamily: "sans-serif", fontSize: 11 }}>
            <div style={{ color: "#6B6B6B", marginBottom: 3 }}>Total costs</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#C0392B" }}>
              {fmt(allCosts)}
            </div>
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 11 }}>
            <div style={{ color: "#6B6B6B", marginBottom: 3 }}>
              Estimated profit
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: profit >= 0 ? "#2D7D46" : "#C0392B",
              }}
            >
              {fmt(profit)}
            </div>
          </div>
        </div>

        <div style={S.modalActions}>
          <button style={S.btnCancel} onClick={onClose}>
            Close
          </button>
          <button style={S.btnSave} onClick={onEdit}>
            Edit Job
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transaction Modal ─────────────────────────────────────────────
function TxModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    type: "income",
    desc: "",
    amount: "",
    date: today(),
    cat: "Payment received",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cats = [
    "Payment received",
    "Deposit received",
    "Supplies",
    "Chemicals",
    "Packaging",
    "Salary / labour",
    "Utilities",
    "Equipment",
    "Delivery cost",
    "Other income",
    "Other expense",
  ];
  return (
    <div
      style={S.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={S.modal}>
        <div style={S.modalTitle}>Add Transaction</div>
        <div style={S.formGroup}>
          <label style={S.label}>Type</label>
          <select
            style={S.select}
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Description</label>
          <input
            style={S.input}
            value={form.desc}
            onChange={(e) => set("desc", e.target.value)}
            placeholder="e.g. Chemical restock, walk-in payment"
          />
        </div>
        <div style={S.formRow}>
          <div style={S.formGroup}>
            <label style={S.label}>Amount (₦)</label>
            <input
              style={S.input}
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0"
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Date</label>
            <input
              style={S.input}
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Category</label>
          <select
            style={S.select}
            value={form.cat}
            onChange={(e) => set("cat", e.target.value)}
          >
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={S.modalActions}>
          <button style={S.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button
            style={S.btnSave}
            onClick={() => {
              if (!form.desc.trim()) {
                alert("Add a description");
                return;
              }
              onSave({
                ...form,
                id: uid(),
                amount: parseFloat(form.amount) || 0,
                created: Date.now(),
              });
            }}
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Jobs Page ─────────────────────────────────────────────────────
function JobsPage() {
  const [jobs, setJobs] = useState(() => {
    const d = load(JOBS_KEY);
    return d.length ? d : SEED_JOBS;
  });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [dateField, setDateField] = useState("due");

  useEffect(() => {
    persist(JOBS_KEY, jobs);
  }, [jobs]);

  const saveJob = useCallback((form) => {
    setJobs((prev) => {
      if (form.id) return prev.map((j) => (j.id === form.id ? { ...form } : j));
      return [{ ...form, id: uid(), created: Date.now() }, ...prev];
    });
    setModal(null);
  }, []);

  const saveJobItems = useCallback((updatedJob) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)),
    );
    setViewing(updatedJob);
  }, []);

  const deleteJob = (id) => {
    if (window.confirm("Delete this job?"))
      setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const filtered = jobs
    .filter((j) => {
      const q = search.toLowerCase();
      const mQ =
        !q || j.name.toLowerCase().includes(q) || (j.phone || "").includes(q);
      const mS = filter === "all" || j.status === filter;
      const ds = dateField === "due" ? j.dueDate || "" : j.pickupDate || "";
      return mQ && mS && inRange(ds, dateRange.from, dateRange.to);
    })
    .sort((a, b) => b.created - a.created);

  const isFiltered = !!(dateRange.from || dateRange.to);
  const metricSet = isFiltered ? filtered : jobs;
  const totalRev = metricSet.reduce(
    (s, j) => s + (parseFloat(j.price) || 0),
    0,
  );
  const totalBal = metricSet.reduce(
    (s, j) => s + (parseFloat(j.price) || 0) - (parseFloat(j.deposit) || 0),
    0,
  );
  const totalPieces = metricSet.reduce(
    (s, j) =>
      s + (j.items || []).reduce((a, i) => a + (parseInt(i.qty) || 0), 0),
    0,
  );

  return (
    <div style={S.page}>
      <div style={S.metricsGrid}>
        <MetricCard
          icon={ClipboardList}
          label="Total Jobs"
          value={metricSet.length}
          sub={`${metricSet.filter((j) => j.status !== "Collected").length} active`}
        />
        <MetricCard
          icon={Banknote}
          label="Revenue"
          value={fmt(totalRev)}
          sub={isFiltered ? "filtered period" : "all jobs"}
          variant="blue"
        />
        <MetricCard
          icon={Shirt}
          label="Total Pieces"
          value={totalPieces}
          sub="items in period"
          variant="green"
        />
        <MetricCard
          icon={AlertCircle}
          label="Outstanding"
          value={fmt(totalBal)}
          sub="balance due"
          variant="danger"
        />
      </div>

      <div style={S.secHeader}>
        <div style={S.secTitle}>Jobs</div>
        <button style={S.btnPrimary} onClick={() => setModal({ job: null })}>
          <Plus size={14} /> New Job
        </button>
      </div>

      <div style={S.searchWrap}>
        <span style={S.searchIconWrap}>
          <Search size={15} />
        </span>
        <input
          style={S.searchInput}
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DateFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        dateField={dateField}
        setDateField={setDateField}
        showFieldToggle={true}
      />

      <div style={S.filterRow}>
        {["all", "Pending", "In Progress", "Ready", "Collected"].map((f) => (
          <button
            key={f}
            style={S.chip(filter === f)}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {!filtered.length && (
        <div style={S.empty}>
          <ClipboardList
            size={36}
            style={{ opacity: 0.2, display: "block", margin: "0 auto 8px" }}
          />{" "}
          No jobs found{isFiltered ? " in this date range" : ""}
        </div>
      )}

      {filtered.map((j) => {
        const bal = (parseFloat(j.price) || 0) - (parseFloat(j.deposit) || 0);
        const payStatus =
          bal <= 0 ? "paid" : j.deposit > 0 ? "partial" : "unpaid";
        const isOverdue =
          j.dueDate && j.dueDate < today() && j.status !== "Collected";
        const profit = jobProfit(j);
        const pieces = (j.items || []).reduce(
          (s, i) => s + (parseInt(i.qty) || 0),
          0,
        );
        const extraCount = (j.extraCosts || []).length;
        const deliveredPieces = (j.items || []).reduce(
          (s, i) => s + (parseInt(i.deliveredQty) || 0),
          0,
        );
        return (
          <div key={j.id} style={S.card}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div>
                <div style={S.cardName}>{j.name}</div>
                <div style={S.cardSub}>
                  {j.service} · {j.phone || "—"}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                }}
              >
                <Badge status={j.status} />
                <Badge status={j.delivery} />
              </div>
            </div>

            {/* Items preview */}
            {(j.items || []).length > 0 && (
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 11,
                  color: "#6B6B6B",
                  marginBottom: 6,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                {j.items.slice(0, 3).map((it) => (
                  <span
                    key={it.id}
                    style={{
                      background: "#EDF2FF",
                      color: ACCENT,
                      borderRadius: 12,
                      padding: "2px 8px",
                      fontSize: 10,
                    }}
                  >
                    {it.qty}× {it.name}
                  </span>
                ))}
                {j.items.length > 3 && (
                  <span
                    style={{
                      background: "#F5F8FF",
                      color: "#9B9B9B",
                      borderRadius: 12,
                      padding: "2px 8px",
                      fontSize: 10,
                    }}
                  >
                    +{j.items.length - 3} more
                  </span>
                )}
                <span
                  style={{
                    background: "#F5F8FF",
                    color: "#9B9B9B",
                    borderRadius: 12,
                    padding: "2px 8px",
                    fontSize: 10,
                  }}
                >
                  {pieces} pc{pieces !== 1 ? "s" : ""} total
                </span>
                {deliveredPieces > 0 && (
                  <span
                    style={{
                      background:
                        deliveredPieces === pieces ? "#EAF5EE" : ACCENT_LIGHT,
                      color: deliveredPieces === pieces ? "#2D7D46" : ACCENT,
                      borderRadius: 12,
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {deliveredPieces}/{pieces} pcs delivered
                  </span>
                )}
              </div>
            )}

            <div style={S.cardMeta}>
              <div style={S.metaItem}>
                <div style={S.metaLabel}>Price</div>
                <div style={S.metaVal}>{fmt(j.price)}</div>
              </div>
              <div style={S.metaItem}>
                <div style={S.metaLabel}>Balance</div>
                <div style={S.metaVal}>{fmt(bal)}</div>
              </div>
              <div style={S.metaItem}>
                <div style={S.metaLabel}>Ready By</div>
                <div
                  style={{
                    ...S.metaVal,
                    ...(isOverdue ? { color: "#C0392B" } : {}),
                  }}
                >
                  {j.dueDate || "—"}
                </div>
              </div>
              <div style={S.metaItem}>
                <div style={S.metaLabel}>Payment</div>
                <div style={S.metaVal}>
                  <Badge status={payStatus} />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: profit >= 0 ? "#EAF5EE" : "#FDECEA",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontFamily: "sans-serif", fontSize: 11 }}>
                <span style={{ color: "#6B6B6B" }}>Est. profit</span>
                {extraCount > 0 && (
                  <span
                    style={{ marginLeft: 6, color: "#9B9B9B", fontSize: 10 }}
                  >
                    {extraCount} extra cost{extraCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: profit >= 0 ? "#2D7D46" : "#C0392B",
                }}
              >
                {fmt(profit)}
              </span>
            </div>

            <div style={S.cardActions}>
              <button
                style={{ ...S.btnPrimary, ...S.btnSm }}
                onClick={() => setViewing(j)}
              >
                <Eye size={12} /> View
              </button>
              <button
                style={{ ...S.btnPrimary, ...S.btnSm }}
                onClick={() => setModal({ job: j })}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                style={{ ...S.btnPrimary, ...S.btnSm, ...S.btnDanger }}
                onClick={() => deleteJob(j.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}

      {modal && (
        <JobModal
          job={modal.job}
          onClose={() => setModal(null)}
          onSave={saveJob}
        />
      )}
      {viewing && (
        <ViewModal
          job={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setModal({ job: viewing });
            setViewing(null);
          }}
          onSave={saveJobItems}
        />
      )}
    </div>
  );
}

// ─── Profit Page ───────────────────────────────────────────────────
function ProfitPage() {
  const [txs, setTxs] = useState(() => {
    const d = load(TX_KEY);
    return d.length ? d : SEED_TX;
  });
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [txTypeFilter, setTxType] = useState("all");

  useEffect(() => {
    persist(TX_KEY, txs);
  }, [txs]);

  const saveTx = (tx) => {
    setTxs((prev) => [tx, ...prev]);
    setShowModal(false);
  };
  const deleteTx = (id) => {
    if (window.confirm("Delete transaction?"))
      setTxs((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTxs = txs.filter(
    (t) =>
      inRange(t.date, dateRange.from, dateRange.to) &&
      (txTypeFilter === "all" || t.type === txTypeFilter),
  );
  const isFiltered = !!(dateRange.from || dateRange.to);
  const metricSet = isFiltered ? filteredTxs : txs;
  const totalIncome = metricSet
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = metricSet
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const jobs = load(JOBS_KEY);
  const supplyCost = jobs.reduce(
    (s, j) => s + (parseFloat(j.supplyCost) || 0) + totalExtraCosts(j),
    0,
  );

  return (
    <div style={S.page}>
      <div style={S.metricsGrid}>
        <MetricCard
          icon={ArrowUpCircle}
          label="Total Income"
          value={fmt(totalIncome)}
          sub={
            isFiltered
              ? "filtered period"
              : `${txs.filter((t) => t.type === "income").length} entries`
          }
          variant="green"
        />
        <MetricCard
          icon={ArrowDownCircle}
          label="Total Expenses"
          value={fmt(totalExpense)}
          sub={
            isFiltered
              ? "filtered period"
              : `${txs.filter((t) => t.type === "expense").length} entries`
          }
          variant="danger"
        />
        <MetricCard
          icon={TrendingUp}
          label="Net Profit"
          value={fmt(totalIncome - totalExpense)}
          sub={isFiltered ? "filtered period" : "income − expenses"}
          variant="blue"
        />
        <MetricCard
          icon={Droplets}
          label="Supply Costs"
          value={fmt(supplyCost)}
          sub="from all jobs"
        />
      </div>

      <DateFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        showFieldToggle={false}
        dateField="date"
        setDateField={() => {}}
      />
      <RevenueChart txs={txs} dateRange={dateRange} />

      <div style={S.secHeader}>
        <div style={S.secTitle}>Transactions</div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          ["all", "All"],
          ["income", "Income only"],
          ["expense", "Expenses only"],
        ].map(([v, lbl]) => (
          <button
            key={v}
            onClick={() => setTxType(v)}
            style={{
              fontFamily: "sans-serif",
              fontSize: 11,
              padding: "5px 12px",
              borderRadius: 20,
              border:
                txTypeFilter === v
                  ? `1px solid ${ACCENT}`
                  : "1px solid rgba(0,0,0,0.12)",
              background: txTypeFilter === v ? ACCENT_LIGHT : "#fff",
              color: txTypeFilter === v ? ACCENT : "#6B6B6B",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {!filteredTxs.length && (
        <div style={S.empty}>
          <Receipt
            size={36}
            style={{ opacity: 0.2, display: "block", margin: "0 auto 8px" }}
          />{" "}
          No transactions{isFiltered ? " in this date range" : " yet"}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "0.5px solid rgba(0,0,0,0.08)",
          padding: "4px 16px",
        }}
      >
        {filteredTxs.map((t, i) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom:
                i < filteredTxs.length - 1
                  ? "0.5px solid rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            {t.type === "income" ? (
              <ArrowUpCircle
                size={16}
                color="#2D7D46"
                style={{ flexShrink: 0 }}
              />
            ) : (
              <ArrowDownCircle
                size={16}
                color="#C0392B"
                style={{ flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#1A1A1A" }}>{t.desc}</div>
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 10,
                  color: "#9B9B9B",
                  marginTop: 1,
                }}
              >
                {t.cat} · {t.date}
              </div>
            </div>
            <div style={S.txAmount(t.type)}>
              {t.type === "income" ? "+" : "−"}
              {fmt(t.amount)}
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#C0392B",
                padding: 4,
                marginLeft: 2,
                display: "flex",
              }}
              onClick={() => deleteTx(t.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {showModal && (
        <TxModal onClose={() => setShowModal(false)} onSave={saveTx} />
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("jobs");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!load(JOBS_KEY).length) persist(JOBS_KEY, SEED_JOBS);
    if (!load(TX_KEY).length) persist(TX_KEY, SEED_TX);
  }, []);

  return (
    <div style={S.app}>
      {!online && (
        <div style={S.offlineBar}>
          <WifiOff size={13} /> Working offline — all data saved locally
        </div>
      )}
      <nav style={S.nav}>
        <div style={S.navBrand}>
          <Droplets size={16} color="#90CAF9" />
          <div>
            Ace Laundry<span style={S.navBrandSub}>DRY CLEAN MANAGER</span>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {[
            ["jobs", "Jobs"],
            ["profit", "Profit"],
          ].map(([key, label]) => (
            <button
              key={key}
              style={S.navTab(tab === key)}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
      {tab === "jobs" && <JobsPage />}
      {tab === "profit" && <ProfitPage />}
    </div>
  );
}
