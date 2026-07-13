import { Droplets, ArrowLeft } from "lucide-react";
import SHOP_INFO from "../config/shopInfo";
import { fmt } from "../utils";

export default function ReceiptView({ job, onBack }) {
  const bal = (parseFloat(job.price) || 0) - (parseFloat(job.deposit) || 0);
  const items = job.items || [];
  const totalPieces = items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F8FF",
        padding: 20,
        fontFamily: "sans-serif",
      }}
    >
      <button
        className="no-print"
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "1px solid rgba(0,0,0,0.15)",
          borderRadius: 10,
          padding: "8px 14px",
          cursor: "pointer",
          marginBottom: 16,
          fontFamily: "sans-serif",
          fontSize: 13,
          color: "#1A1A1A",
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div
        style={{
          background: "#fff",
          maxWidth: 480,
          margin: "0 auto",
          borderRadius: 14,
          border: "0.5px solid rgba(0,0,0,0.08)",
          padding: "24px 22px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Droplets size={18} color="#1565C0" />
            <span
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 19,
                fontWeight: "bold",
                color: "#1A1A1A",
              }}
            >
              {SHOP_INFO.name}
            </span>
          </div>
          {SHOP_INFO.address && (
            <div style={{ fontSize: 11, color: "#6B6B6B" }}>
              {SHOP_INFO.address}
            </div>
          )}
          {SHOP_INFO.phone && (
            <div style={{ fontSize: 11, color: "#6B6B6B" }}>
              {SHOP_INFO.phone}
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              color: "#9B9B9B",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 6,
            }}
          >
            Receipt
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            fontSize: 12,
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: "1px dashed rgba(0,0,0,0.15)",
          }}
        >
          <div>
            <div style={{ color: "#9B9B9B", fontSize: 10 }}>Customer</div>
            <div style={{ color: "#1A1A1A", fontWeight: 600 }}>{job.name}</div>
          </div>
          <div>
            <div style={{ color: "#9B9B9B", fontSize: 10 }}>Phone</div>
            <div style={{ color: "#1A1A1A" }}>{job.phone || "—"}</div>
          </div>
          <div>
            <div style={{ color: "#9B9B9B", fontSize: 10 }}>Service</div>
            <div style={{ color: "#1A1A1A" }}>{job.service}</div>
          </div>
          <div>
            <div style={{ color: "#9B9B9B", fontSize: 10 }}>Status</div>
            <div style={{ color: "#1A1A1A" }}>{job.status}</div>
          </div>
          <div>
            <div style={{ color: "#9B9B9B", fontSize: 10 }}>Pickup</div>
            <div style={{ color: "#1A1A1A" }}>{job.pickupDate || "—"}</div>
          </div>
          <div>
            <div style={{ color: "#9B9B9B", fontSize: 10 }}>Ready By</div>
            <div style={{ color: "#1A1A1A" }}>{job.dueDate || "—"}</div>
          </div>
        </div>

        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "#9B9B9B",
            marginBottom: 8,
          }}
        >
          Items ({totalPieces} piece{totalPieces !== 1 ? "s" : ""})
        </div>
        <div style={{ marginBottom: 16 }}>
          {items.length === 0 && (
            <div style={{ fontSize: 12, color: "#9B9B9B" }}>
              No items recorded
            </div>
          )}
          {items.map((it, i) => (
            <div
              key={it.id || i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "6px 0",
                borderBottom:
                  i < items.length - 1 ? "1px dotted rgba(0,0,0,0.1)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#1A1A1A" }}>
                  {it.qty} × {it.name}
                </div>
                {it.note && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#1565C0",
                      fontStyle: "italic",
                      marginTop: 1,
                    }}
                  >
                    Note: {it.note}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#1A1A1A", flexShrink: 0 }}>
                {fmt((parseFloat(it.unitPrice) || 0) * (parseInt(it.qty) || 0))}
              </div>
            </div>
          ))}
        </div>

        {job.notes && (
          <div
            style={{
              fontSize: 11,
              color: "#6B6B6B",
              background: "#F5F8FF",
              borderRadius: 8,
              padding: 10,
              marginBottom: 16,
            }}
          >
            {job.notes}
          </div>
        )}

        <div style={{ borderTop: "1px dashed rgba(0,0,0,0.15)", paddingTop: 12 }}>
          {[
            ["Total Price", fmt(job.price)],
            ["Deposit Paid", fmt(job.deposit)],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                padding: "3px 0",
                color: "#1A1A1A",
              }}
            >
              <span>{l}</span>
              <span>{v}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 15,
              fontWeight: 700,
              padding: "8px 0 0",
              marginTop: 4,
              borderTop: "1px solid rgba(0,0,0,0.1)",
              color: bal > 0 ? "#C0392B" : "#2D7D46",
            }}
          >
            <span>Balance Due</span>
            <span>{fmt(bal)}</span>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#9B9B9B",
            marginTop: 20,
          }}
        >
          Thank you for your business!
        </div>
      </div>
    </div>
  );
}
