/**
 * ResetPassword — password change form.
 * Extracted from ITDashboard where it was a ~90-line inline component.
 * Now uses the authService layer instead of calling api.post() directly.
 */
import { useState } from "react";
import { changePassword } from "../../services/authService.js";

export default function ResetPassword() {
  const [form,    setForm]    = useState({ old: "", newP: "", confirm: "" });
  const [show,    setShow]    = useState({ old: false, newP: false, confirm: false });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Password strength: 0 | 1 | 2 | 3 */
  const strength = p => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const s      = strength(form.newP);
  const sLabel = ["", "Weak", "Medium", "Strong"][s];

  const handleChange = key => e => {
    setError("");
    setSuccess(false);
    setForm(p => ({ ...p, [key]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.old || !form.newP || !form.confirm) {
      setError("Please fill all fields.");
      return;
    }
    if (form.newP !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (form.newP.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await changePassword({ oldPassword: form.old, newPassword: form.newP });
      setSuccess(true);
      setForm({ old: "", newP: "", confirm: "" });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const EyeToggle = ({ field }) => (
    <button
      type="button"
      className="eye-btn"
      onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
    >
      {show[field] ? "🙈" : "👁"}
    </button>
  );

  const FIELDS = [
    { key: "old",     label: "Current Password",    ph: "Enter current password" },
    { key: "newP",    label: "New Password",         ph: "Min 8 characters"       },
    { key: "confirm", label: "Confirm New Password", ph: "Repeat new password"    },
  ];

  return (
    <div className="form-card">
      <div className="form-title">Reset Password</div>
      <div className="form-sub">Update your account password. Choose a strong, unique password.</div>

      {success && (
        <div className="form-success" style={{ marginBottom: 16 }}>
          ✓ Password changed successfully.
        </div>
      )}

      <form className="form-fields" onSubmit={handleSubmit}>
        {FIELDS.map(({ key, label, ph }) => (
          <div className="field-group" key={key}>
            <label className="field-label">{label}</label>
            <div className="input-wrap">
              <input
                type={show[key] ? "text" : "password"}
                placeholder={ph}
                value={form[key]}
                onChange={handleChange(key)}
              />
              <EyeToggle field={key} />
            </div>

            {/* Strength meter — only for new password field */}
            {key === "newP" && form.newP && (
              <>
                <div className="pass-strength">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`pass-bar ${
                        s > i ? (s === 1 ? "weak" : s === 2 ? "medium" : "strong") : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="pass-label">{sLabel}</span>
              </>
            )}
          </div>
        ))}

        {error && <div className="form-error">⚠ {error}</div>}

        <button
          className="btn-primary-full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
