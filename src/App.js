import { useState, useEffect, useCallback, useRef } from "react";
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
  Printer,
  LogOut,
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
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import ManageWorkers from "./components/ManageWorkers";
import NotificationsPanel from "./components/NotificationsPanel";
import ReceiptView from "./components/ReceiptView";
import { S, ACCENT, ACCENT_LIGHT } from "./styles";
import {
  uid,
  today,
  fmt,
  SERVICE_TYPES,
  ITEM_CATALOGUE,
  totalExtraCosts,
  jobProfit,
  inRange,
  getPresetRange,
} from "./utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

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

// ─── Item Name Field (type custom or pick from catalogue) ─────────
function ItemNameField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const matches = ITEM_CATALOGUE.filter((c) =>
    c.toLowerCase().includes(value.trim().toLowerCase()),
  );

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        style={{ ...S.input, fontSize: 13, padding: "8px 10px" }}
        placeholder="Item name"
      />
      {open && matches.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.15)",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {matches.map((c) => (
            <div
              key={c}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(c);
                setOpen(false);
              }}
              style={{
                padding: "8px 10px",
                fontSize: 13,
                fontFamily: "sans-serif",
                color: "#1A1A1A",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Items Editor (used in JobModal) ──────────────────────────────
function ItemsEditor({ items, setItems }) {
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        name: "",
        qty: 1,
        unitPrice: 0,
        deliveredQty: 0,
        note: "",
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
              <ItemNameField
                value={it.name}
                onChange={(v) => updateItem(it.id, "name", v)}
              />
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
                  marginBottom: 4,
                }}
              >
                {it.qty} × {fmt(it.unitPrice)} = {fmt(lineTotal)}
              </div>
            )}
            <input
              value={it.note || ""}
              onChange={(e) => updateItem(it.id, "note", e.target.value)}
              placeholder="Special request for this item, e.g. extra starch, stain on collar"
              style={{
                ...S.input,
                fontSize: 12,
                padding: "6px 10px",
              }}
            />
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

function JobModal({ job, financials, onClose, onSave }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [form, setForm] = useState(() => ({
    ...BLANK_JOB,
    ...(job || {}),
    ...(financials || {}),
    items: (job?.items || []).map((i) => ({ ...i, note: i.note || "" })),
    extraCosts: (financials?.extraCosts || []).map((c) => ({ ...c })),
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

        {/* Costs — admin only: workers never see or submit internal costs */}
        {isAdmin && (
          <>
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
          </>
        )}

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
function ViewModal({ job, financials, onClose, onEdit, onSave, onPrint }) {
  const { role, canEditJobs } = useAuth();
  const isAdmin = role === "admin";
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
  const extraCosts = financials?.extraCosts || [];
  const extraTotal = totalExtraCosts(financials);
  const allCosts = (parseFloat(financials?.supplyCost) || 0) + extraTotal;
  const profit = jobProfit(job, financials);
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
                  {it.note && (
                    <div
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: 10,
                        color: ACCENT,
                        marginTop: 2,
                        fontStyle: "italic",
                      }}
                    >
                      Note: {it.note}
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
                    disabled={dqty <= 0 || !canEditJobs}
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
                    disabled={dqty >= totalQty || !canEditJobs}
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
            ...(isAdmin ? [["Supply Cost", fmt(financials?.supplyCost), null]] : []),
          ].map(([l, v, c]) => (
            <div key={l} style={S.metaItem}>
              <div style={S.metaLabel}>{l}</div>
              <div style={{ ...S.metaVal, ...(c ? { color: c } : {}) }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {isAdmin && extraCosts.length > 0 && (
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

        {isAdmin && (
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
        )}

        <div style={S.modalActions}>
          <button style={S.btnCancel} onClick={onClose}>
            Close
          </button>
          <button
            style={{
              ...S.btnCancel,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
            onClick={() => onPrint(job)}
          >
            <Printer size={13} /> Receipt
          </button>
          {onEdit && (
            <button style={S.btnSave} onClick={onEdit}>
              Edit Job
            </button>
          )}
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
                amount: parseFloat(form.amount) || 0,
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
function JobsPage({ onPrintReceipt }) {
  const { user, role, canEditJobs } = useAuth();
  const isAdmin = role === "admin";
  const [jobs, setJobs] = useState([]);
  const [financialsMap, setFinancialsMap] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [dateField, setDateField] = useState("due");

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) =>
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setFinancialsMap({});
      return;
    }
    return onSnapshot(collection(db, "jobFinancials"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data()));
      setFinancialsMap(map);
    });
  }, [isAdmin]);

  const notifyAdmin = useCallback(
    async (jobId, jobName, type) => {
      await addDoc(collection(db, "notifications"), {
        type,
        jobId,
        jobName,
        workerUid: user.uid,
        workerEmail: user.email,
        message: `${user.email} ${type === "job_created" ? "added a new job for" : "updated the job for"} ${jobName}`,
        createdAt: serverTimestamp(),
        read: false,
      });
    },
    [user],
  );

  const saveJob = useCallback(
    async (form) => {
      const isNew = !form.id;
      const jobRef = form.id
        ? doc(db, "jobs", form.id)
        : doc(collection(db, "jobs"));
      const finRef = doc(db, "jobFinancials", jobRef.id);
      const { supplyCost, extraCosts, id, ...jobData } = form;

      const batch = writeBatch(db);
      batch.set(
        jobRef,
        {
          ...jobData,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          ...(isNew
            ? {
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                createdByEmail: user.email,
              }
            : {}),
        },
        { merge: true },
      );
      if (isAdmin) {
        batch.set(
          finRef,
          {
            supplyCost: parseFloat(supplyCost) || 0,
            extraCosts: extraCosts || [],
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          },
          { merge: true },
        );
      }
      await batch.commit();
      if (!isAdmin) {
        await notifyAdmin(jobRef.id, form.name, isNew ? "job_created" : "job_updated");
      }
      setModal(null);
    },
    [isAdmin, user, notifyAdmin],
  );

  const saveJobItems = useCallback(
    async (updatedJob) => {
      await updateDoc(doc(db, "jobs", updatedJob.id), {
        items: updatedJob.items,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      setViewing(updatedJob);
      if (!isAdmin) await notifyAdmin(updatedJob.id, updatedJob.name, "job_updated");
    },
    [isAdmin, user, notifyAdmin],
  );

  const deleteJob = async (id) => {
    if (!window.confirm("Delete this job?")) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "jobs", id));
    batch.delete(doc(db, "jobFinancials", id));
    await batch.commit();
  };

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const mQ =
      !q || j.name.toLowerCase().includes(q) || (j.phone || "").includes(q);
    const mS = filter === "all" || j.status === filter;
    const ds = dateField === "due" ? j.dueDate || "" : j.pickupDate || "";
    return mQ && mS && inRange(ds, dateRange.from, dateRange.to);
  });

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
  const activeCount = metricSet.filter((j) => j.status !== "Collected").length;
  const overdueCount = metricSet.filter(
    (j) => j.dueDate && j.dueDate < today() && j.status !== "Collected",
  ).length;

  return (
    <div style={S.page}>
      <div style={S.metricsGrid}>
        <MetricCard
          icon={ClipboardList}
          label="Total Jobs"
          value={metricSet.length}
          sub={`${activeCount} active`}
        />
        {isAdmin ? (
          <MetricCard
            icon={Banknote}
            label="Revenue"
            value={fmt(totalRev)}
            sub={isFiltered ? "filtered period" : "all jobs"}
            variant="blue"
          />
        ) : (
          <MetricCard
            icon={Banknote}
            label="Active Jobs"
            value={activeCount}
            sub="not yet collected"
            variant="blue"
          />
        )}
        <MetricCard
          icon={Shirt}
          label="Total Pieces"
          value={totalPieces}
          sub="items in period"
          variant="green"
        />
        {isAdmin ? (
          <MetricCard
            icon={AlertCircle}
            label="Outstanding"
            value={fmt(totalBal)}
            sub="balance due"
            variant="danger"
          />
        ) : (
          <MetricCard
            icon={AlertCircle}
            label="Overdue"
            value={overdueCount}
            sub="past ready-by date"
            variant="danger"
          />
        )}
      </div>

      <div style={S.secHeader}>
        <div style={S.secTitle}>Jobs</div>
        {canEditJobs && (
          <button style={S.btnPrimary} onClick={() => setModal({ job: null })}>
            <Plus size={14} /> New Job
          </button>
        )}
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
        const financials = financialsMap[j.id];
        const profit = jobProfit(j, financials);
        const pieces = (j.items || []).reduce(
          (s, i) => s + (parseInt(i.qty) || 0),
          0,
        );
        const extraCount = (financials?.extraCosts || []).length;
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

            {isAdmin && (
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
            )}

            <div style={S.cardActions}>
              <button
                style={{ ...S.btnPrimary, ...S.btnSm }}
                onClick={() => setViewing(j)}
              >
                <Eye size={12} /> View
              </button>
              {canEditJobs && (
                <button
                  style={{ ...S.btnPrimary, ...S.btnSm }}
                  onClick={() => setModal({ job: j })}
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
              {isAdmin && (
                <button
                  style={{ ...S.btnPrimary, ...S.btnSm, ...S.btnDanger }}
                  onClick={() => deleteJob(j.id)}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {modal && (
        <JobModal
          job={modal.job}
          financials={modal.job ? financialsMap[modal.job.id] : null}
          onClose={() => setModal(null)}
          onSave={saveJob}
        />
      )}
      {viewing && (
        <ViewModal
          job={viewing}
          financials={financialsMap[viewing.id]}
          onPrint={onPrintReceipt}
          onClose={() => setViewing(null)}
          onEdit={
            canEditJobs
              ? () => {
                  setModal({ job: viewing });
                  setViewing(null);
                }
              : null
          }
          onSave={saveJobItems}
        />
      )}
    </div>
  );
}

// ─── Profit Page ───────────────────────────────────────────────────
function ProfitPage() {
  const { user, role } = useAuth();
  const [txs, setTxs] = useState([]);
  const [financialsList, setFinancialsList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [txTypeFilter, setTxType] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    return onSnapshot(q, (snap) =>
      setTxs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "jobFinancials"), (snap) =>
      setFinancialsList(snap.docs.map((d) => d.data())),
    );
  }, []);

  const saveTx = async (tx) => {
    const { id, ...txData } = tx;
    await addDoc(collection(db, "transactions"), {
      ...txData,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });
    setShowModal(false);
  };
  const deleteTx = async (id) => {
    if (window.confirm("Delete transaction?"))
      await deleteDoc(doc(db, "transactions", id));
  };

  // Defense in depth: the nav never offers this tab to workers, but bail
  // out of rendering financial data even if this component is reached.
  if (role !== "admin") return null;

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
  const supplyCost = financialsList.reduce(
    (s, f) => s + (parseFloat(f.supplyCost) || 0) + totalExtraCosts(f),
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
  const { user, role, active, loading, connectionError, signOutUser } = useAuth();
  const [tab, setTab] = useState("jobs");
  const [online, setOnline] = useState(navigator.onLine);
  const [printJob, setPrintJob] = useState(null);
  const isAdmin = role === "admin";

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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#6B6B6B",
        }}
      >
        Loading…
      </div>
    );
  }

  if (user && connectionError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#6B6B6B",
          padding: 20,
          textAlign: "center",
          gap: 12,
        }}
      >
        <div style={{ color: "#C0392B", fontWeight: 600 }}>
          Couldn't connect to the database.
        </div>
        <div style={{ fontSize: 13, maxWidth: 320 }}>
          This usually means Firestore isn't set up yet in the Firebase
          project, or your connection is unstable. Check your internet
          connection, confirm Firestore is enabled in the Firebase Console,
          then try again.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ ...S.btnSave, padding: "8px 16px" }}
        >
          Retry
        </button>
        <button
          onClick={signOutUser}
          style={{
            background: "none",
            border: "none",
            color: ACCENT,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  if (!user || !active) return <Login />;

  if (printJob) return <ReceiptView job={printJob} onBack={() => setPrintJob(null)} />;

  const tabs = [
    ["jobs", "Jobs"],
    ...(isAdmin ? [["profit", "Profit"], ["workers", "Workers"]] : []),
  ];

  return (
    <div style={S.app}>
      {!online && (
        <div style={S.offlineBar}>
          <WifiOff size={13} /> You're offline — changes will sync once you're
          back online
        </div>
      )}
      <nav style={S.nav}>
        <div style={S.navBrand}>
          <Droplets size={16} color="#90CAF9" />
          <div>
            Ace Laundry<span style={S.navBrandSub}>DRY CLEAN MANAGER</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {tabs.map(([key, label]) => (
            <button
              key={key}
              style={S.navTab(tab === key)}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
          {isAdmin && <NotificationsPanel />}
          <button
            onClick={signOutUser}
            title="Sign out"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              padding: "0 6px 0 10px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </nav>
      {tab === "jobs" && <JobsPage onPrintReceipt={setPrintJob} />}
      {tab === "profit" && isAdmin && <ProfitPage />}
      {tab === "workers" && isAdmin && <ManageWorkers />}
    </div>
  );
}
