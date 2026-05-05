/**
 * CreateUserForm — role-aware user creation form.
 */
import { useState } from "react";
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

  const inputCls = "ops-focus w-full box-border bg-[#0a0908] border border-[#2e2c22] rounded text-[#e8ddc8] text-[13px] px-[14px] py-[11px] outline-none font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="px-3.5 py-2.5 rounded mb-4 bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.27)] text-[#e05252] text-xs">
          {error}
        </div>
      )}

      {ok && (
        <div className="px-3.5 py-2.5 rounded mb-4 bg-[rgba(76,187,127,0.11)] border border-[rgba(76,187,127,0.27)] text-[#4cbb7f] text-[11px] font-['Cinzel',serif] tracking-[0.08em]">
          ✓ USER CREATED SUCCESSFULLY
        </div>
      )}

      <Field label="USERNAME" hint="required">
        <input
          className={inputCls}
          type="text"
          value={form.username}
          onChange={handleChange("username")}
          placeholder="e.g. john_doe"
          required
        />
      </Field>

      <Field label="EMAIL" hint="required — must be @satkartar.com or @skinrange.com">
        <input
          className={inputCls}
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="user@satkartar.com"
          required
        />
      </Field>

      <Field label="PASSWORD" hint="required">
        <input
          className={inputCls}
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="••••••••••"
          required
        />
      </Field>

      {allowedRoles.length > 1 && (
        <Field label="ROLE" hint="required">
          <select
            className={`${inputCls} cursor-pointer`}
            value={form.role}
            onChange={handleChange("role")}
          >
            {allowedRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="border-t border-[#2e2c22] pt-5 mt-1.5">
        <GoldBtn type="submit" disabled={loading} style={{ width: "100%", padding: "13px" }}>
          {loading ? "CREATING…" : "CREATE USER"}
        </GoldBtn>
      </div>
    </form>
  );
}