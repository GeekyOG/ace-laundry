import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { ACCENT } from "../styles";

function timeAgo(ts) {
  if (!ts?.toDate) return "";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) =>
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    notifications
      .filter((n) => !n.read)
      .forEach((n) => updateDoc(doc(db, "notifications", n.id), { read: true }));
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: unreadCount > 0 ? "#90CAF9" : "rgba(255,255,255,0.5)",
          padding: "0 8px",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 3,
              background: "#C0392B",
              color: "#fff",
              borderRadius: 20,
              fontSize: 9,
              fontFamily: "sans-serif",
              fontWeight: 700,
              minWidth: 14,
              height: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 150 }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 6,
              width: 300,
              maxHeight: 380,
              overflowY: "auto",
              background: "#fff",
              borderRadius: 12,
              border: "0.5px solid rgba(0,0,0,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              zIndex: 151,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              }}
            >
              <span
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#1A1A1A",
                }}
              >
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: ACCENT,
                    fontFamily: "sans-serif",
                    fontSize: 11,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#9B9B9B",
                  fontFamily: "sans-serif",
                  fontSize: 12,
                }}
              >
                No notifications yet
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "10px 14px",
                  borderBottom: "0.5px solid rgba(0,0,0,0.06)",
                  background: n.read ? "#fff" : "#F5F8FF",
                }}
              >
                <div
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: 12,
                    color: "#1A1A1A",
                  }}
                >
                  {n.message}
                </div>
                <div
                  style={{
                    fontFamily: "sans-serif",
                    fontSize: 10,
                    color: "#9B9B9B",
                    marginTop: 3,
                  }}
                >
                  {timeAgo(n.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
