import { useState } from "react";
import { Droplets, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { S, ACCENT } from "../styles";

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("wrong-password") || code.includes("invalid-credential"))
    return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account with that email.";
  if (code.includes("email-already-in-use"))
    return "An account with that email already exists.";
  if (code.includes("weak-password"))
    return "Password must be at least 6 characters.";
  if (code.includes("permission-denied"))
    return "That email isn't authorized to register as the admin.";
  return err?.message || "Something went wrong. Please try again.";
}

export default function Login() {
  const { signIn, registerFirstAdmin, resetPassword } = useAuth();
  const [mode, setMode] = useState("signin"); // signin | bootstrap
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBootstrap = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await registerFirstAdmin(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email above first, then tap 'Forgot password?'");
      return;
    }
    try {
      await resetPassword(email.trim());
      setInfo("Password reset email sent — check your inbox.");
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#F5F8FF",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Droplets size={22} color={ACCENT} />
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 20,
              fontWeight: "bold",
              color: "#1A1A1A",
            }}
          >
            Ace Laundry
          </span>
        </div>

        <div
          style={{
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div style={S.modalTitle}>
            {mode === "signin" ? "Sign In" : "First-Time Admin Setup"}
          </div>

          <form onSubmit={mode === "signin" ? handleSignIn : handleBootstrap}>
            <div style={S.formGroup}>
              <label style={S.label}>Email</label>
              <input
                style={S.input}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Password</label>
              <input
                style={S.input}
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

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
            {info && (
              <div
                style={{
                  fontFamily: "sans-serif",
                  fontSize: 12,
                  color: "#2D7D46",
                  background: "#EAF5EE",
                  border: "1px solid rgba(45,125,70,0.2)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 12,
                }}
              >
                {info}
              </div>
            )}

            <button
              type="submit"
              style={{ ...S.btnSave, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              disabled={busy}
            >
              {mode === "signin" ? <LogIn size={14} /> : <UserPlus size={14} />}
              {busy
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign In"
                  : "Create Admin Account"}
            </button>
          </form>

          {mode === "signin" && (
            <button
              onClick={handleForgotPassword}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: ACCENT,
                fontFamily: "sans-serif",
                fontSize: 12,
                padding: 0,
                display: "block",
                width: "100%",
                textAlign: "center",
              }}
            >
              Forgot password?
            </button>
          )}
        </div>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "bootstrap" : "signin");
            setError("");
            setInfo("");
          }}
          style={{
            marginTop: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B6B6B",
            fontFamily: "sans-serif",
            fontSize: 11,
            padding: 0,
            display: "block",
            width: "100%",
            textAlign: "center",
          }}
        >
          {mode === "signin"
            ? "Setting up this shop for the first time? First-time admin setup"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
