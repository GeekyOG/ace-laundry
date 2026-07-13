import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, createWorkerAuthAccount } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { S, ACCENT } from "../styles";

export default function ManageWorkers() {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [canEditJobs, setCanEditJobs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "worker"));
    return onSnapshot(q, (snap) =>
      setWorkers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    );
  }, []);

  const addWorker = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const uid = await createWorkerAuthAccount(email.trim(), password);
      await setDoc(doc(db, "users", uid), {
        email: email.trim(),
        role: "worker",
        canEditJobs,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setEmail("");
      setPassword("");
      setCanEditJobs(false);
    } catch (err) {
      setError(err?.message || "Could not create worker account.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (uid, field, current) =>
    updateDoc(doc(db, "users", uid), { [field]: !current });

  return (
    <div style={S.page}>
      <div style={S.secHeader}>
        <div style={S.secTitle}>
          <Users
            size={16}
            style={{ verticalAlign: -3, marginRight: 6 }}
            color={ACCENT}
          />
          Manage Workers
        </div>
      </div>

      <form
        onSubmit={addWorker}
        style={{
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div style={S.formGroup}>
          <label style={S.label}>Worker Email</label>
          <input
            style={S.input}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="worker@example.com"
          />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Temporary Password</label>
          <input
            style={S.input}
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "sans-serif",
            fontSize: 12,
            color: "#1A1A1A",
            marginBottom: 14,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={canEditJobs}
            onChange={(e) => setCanEditJobs(e.target.checked)}
          />
          Allow this worker to add/update job records
        </label>
        {error && (
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 12,
              color: "#C0392B",
              background: "#FDECEA",
              border: "1px solid rgba(192,57,43,0.2)",
              borderRadius: 8,
              padding: "8px 10px",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{
            ...S.btnPrimary,
            justifyContent: "center",
            width: "100%",
          }}
        >
          <UserPlus size={14} /> {busy ? "Creating…" : "Add Worker"}
        </button>
      </form>

      {workers.length === 0 && (
        <div style={S.empty}>No workers added yet</div>
      )}

      {workers.map((w) => (
        <div key={w.uid} style={S.card}>
          <div style={S.cardName}>{w.email}</div>
          <div style={S.cardSub}>{w.active ? "Active" : "Deactivated"}</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 10,
              paddingTop: 10,
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={!!w.canEditJobs}
                onChange={() => toggle(w.uid, "canEditJobs", w.canEditJobs)}
              />
              Can add/update job records
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={!!w.active}
                onChange={() => toggle(w.uid, "active", w.active)}
              />
              Account active
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
