/**
 * CreateUserForm — role-aware user creation form.
 *
 * Manager version  : role is locked to "ppc", no selector shown.
 * PM version       : role is selectable (manager | process manager | it).
 *
 * Previously inlined separately in ManagerDashboard and PMDashboard with
 * duplicate field structure and submit logic. Now unified via `allowedRoles`.
 *
 * @prop {string[]}  allowedRoles  - roles to show in the selector; if length===1
 *                                   the selector is hidden and that role is used.
 * @prop {Function}  onSuccess     - called after successful creation; receives username.
 */
import { useState } from "react";
import { T, inputSx } from "../../constants/theme.js";
import Field from "../common/Field.jsx";
import GoldBtn from "../common/GoldBtn.jsx";
import { createUser } from "../../services/userService.js";

const ROLE_LABELS = {
  ppc:               "PPC",
  manager:           "Manager",
  "process manager": "Process Manager",
  it:                "IT",
};

export default function CreateUserForm({ allowedRoles = ["ppc"], onSuccess }) {
  const [form, setForm] = useState({
    username: "",
    email:    "",
    password: "",
    role:     allowedRoles[0],
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [ok,      setOk]      = useState(false);

  const handleChange = key => e => {
    setError("");
    setOk(false);
    setForm(f => ({ ...f, [key]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setOk(false);

    if (!form.username || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      await createUser(form);
      setOk(true);
      onSuccess?.(form.username);
      setForm({ username: "", email: "", password: "", role: allowedRoles[0] });
      setTimeout(() => setOk(false), 3000);
    } catch (ex) {
      setError(ex?.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const showSelector = allowedRoles.length > 1;

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 3, marginBottom: 16,
          background: T.redBg, border: `1px solid ${T.red}44`,
          color: T.red, fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {ok && (
        <div style={{
          padding: "10px 14px", borderRadius: 3, marginBottom: 16,
          background: T.greenBg, border: `1px solid ${T.green}44`,
          color: T.green, fontSize: 11, fontFamily: "'Cinzel', serif",
          letterSpacing: "0.08em",
        }}>
          ✓ USER CREATED SUCCESSFULLY
        </div>
      )}

      <Field label="USERNAME" hint="required">
        <input
          className="ops-focus"
          type="text"
          value={form.username}
          onChange={handleChange("username")}
          placeholder="e.g. john_doe"
          required
          style={inputSx}
        />
      </Field>

      <Field label="EMAIL" hint="required — must be @satkartar.com or @skinrange.com">
        <input
          className="ops-focus"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="user@satkartar.com"
          required
          style={inputSx}
        />
      </Field>

      <Field label="PASSWORD" hint="required">
        <input
          className="ops-focus"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="••••••••••"
          required
          style={inputSx}
        />
      </Field>

      {showSelector && (
        <Field label="ROLE" hint="required">
          <select
            className="ops-focus"
            value={form.role}
            onChange={handleChange("role")}
            style={{ ...inputSx, cursor: "pointer" }}
          >
            {allowedRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
            ))}
          </select>
        </Field>
      )}

      <div style={{ borderTop: `1px solid ${T.subtle}`, paddingTop: 20, marginTop: 6 }}>
        <GoldBtn type="submit" disabled={loading} style={{ width: "100%", padding: "13px" }}>
          {loading ? "CREATING…" : "CREATE USER"}
        </GoldBtn>
      </div>
    </form>
  );
}
