// src/components/messages/SavedMessagesSection.jsx
/**
 * SavedMessagesSection
 *
 * Self-contained: fetches, creates, edits, and deletes saved messages.
 *
 * Each card exposes:
 *   • Copy button — copies the text to clipboard; shows "Copied!" for 1.6 s.
 *   • Edit button — turns the card into an inline textarea; Save / Cancel.
 *   • Delete button — shows a compact inline confirm step before deleting.
 *
 * Displayed only inside PMDashboard (process manager role).
 */
import { useState, useCallback, useEffect } from "react";
import { T, inputSx } from "../../constants/theme.js";
import GoldBtn from "../common/GoldBtn.jsx";
import Field   from "../common/Field.jsx";
import api     from "../../api/axios.js";

// ── API helpers ───────────────────────────────────────────────────────────────

const fetchAll = async () => {
  const res = await api.get("/saved-messages/list");
  return res.data?.data ?? [];
};

const apiCreate = async (message) => {
  const res = await api.post("/saved-messages/create", { message });
  return res.data?.data;
};

const apiUpdate = async (id, message) => {
  const res = await api.post("/saved-messages/update", { id, message });
  return res.data?.data;
};

const apiDelete = async (id) => {
  await api.post("/saved-messages/delete", { id });
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

// ── Single message card ───────────────────────────────────────────────────────

function MessageCard({ msg, onUpdated, onDeleted }) {
  const [editing,     setEditing]     = useState(false);
  const [editText,    setEditText]    = useState(msg.message);
  const [saving,      setSaving]      = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [editError,   setEditError]   = useState("");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(msg.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = msg.message;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }, [msg.message]);

  const handleSave = useCallback(async () => {
    setEditError("");
    if (!editText.trim()) { setEditError("Message cannot be empty."); return; }
    if (editText.trim() === msg.message) { setEditing(false); return; }
    setSaving(true);
    try {
      const updated = await apiUpdate(msg._id, editText.trim());
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }, [editText, msg._id, msg.message, onUpdated]);

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(msg.message);
    setEditError("");
  };

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await apiDelete(msg._id);
      onDeleted(msg._id);
    } catch {
      setDeleting(false);
      setDelConfirm(false);
    }
  }, [msg._id, onDeleted]);

  const cardBorder = editing ? T.gold : T.goldBorder;

  return (
    <div
      style={{
        background:    T.bgCard,
        border:        `1px solid ${cardBorder}`,
        borderRadius:  8,
        padding:       "16px 18px",
        transition:    "border-color .2s, box-shadow .2s",
        animation:     "opsFadeUp .22s ease both",
      }}
      onMouseEnter={e => {
        if (!editing) {
          e.currentTarget.style.borderColor = `${T.gold}55`;
          e.currentTarget.style.boxShadow   = "0 4px 20px rgba(0,0,0,.4)";
        }
      }}
      onMouseLeave={e => {
        if (!editing) {
          e.currentTarget.style.borderColor = T.goldBorder;
          e.currentTarget.style.boxShadow   = "none";
        }
      }}
    >
      {/* ── Message body ── */}
      {editing ? (
        <>
          <textarea
            className="ops-focus"
            value={editText}
            onChange={e => { setEditText(e.target.value); setEditError(""); }}
            rows={4}
            style={{
              ...inputSx,
              width:      "100%",
              borderRadius: 6,
              resize:     "vertical",
              lineHeight: 1.65,
              marginBottom: 10,
            }}
            autoFocus
          />
          {editError && (
            <p style={{ margin:"0 0 10px", fontSize:11, color:T.red }}>{editError}</p>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <GoldBtn
              onClick={handleSave}
              disabled={saving}
              style={{ flex:1, padding:"8px" }}
            >
              {saving ? "Saving…" : "Save"}
            </GoldBtn>
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              style={{
                flex:1, padding:"8px", borderRadius:7, cursor:"pointer",
                background:"transparent", border:`1px solid ${T.subtle}`,
                color:T.muted, fontSize:11, fontWeight:600,
                letterSpacing:"0.1em", fontFamily:"'Cinzel',serif",
                textTransform:"uppercase", transition:"all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.color = T.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.subtle; e.currentTarget.style.color = T.muted; }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Message text */}
          <p style={{
            margin:     "0 0 14px",
            fontSize:   13,
            color:      T.text,
            lineHeight: 1.7,
            wordBreak:  "break-word",
            whiteSpace: "pre-wrap",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {msg.message}
          </p>

          {/* Action row */}
          {delConfirm ? (
            /* Inline delete confirm */
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              padding:      "9px 12px",
              borderRadius: 6,
              background:   T.redBg,
              border:       `1px solid ${T.red}33`,
            }}>
              <span style={{ flex:1, fontSize:11, color:T.red, fontFamily:"'DM Sans',sans-serif" }}>
                Delete this message?
              </span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding:"4px 12px", borderRadius:4, cursor: deleting ? "not-allowed" : "pointer",
                  background:T.red, border:"none", color:"#fff",
                  fontSize:10, fontWeight:700, letterSpacing:"0.1em",
                  fontFamily:"'Cinzel',serif", opacity: deleting ? 0.6 : 1,
                  transition:"opacity .15s",
                }}
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setDelConfirm(false)}
                disabled={deleting}
                style={{
                  padding:"4px 12px", borderRadius:4, cursor:"pointer",
                  background:"transparent", border:`1px solid ${T.subtle}`,
                  color:T.muted, fontSize:10, fontWeight:600,
                  fontFamily:"'Cinzel',serif", transition:"all .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.gold; e.currentTarget.style.borderColor = T.goldBorder; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.subtle; }}
              >
                No
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              {/* Copy */}
              <button
                onClick={handleCopy}
                style={{
                  display:       "inline-flex",
                  alignItems:    "center",
                  gap:           5,
                  padding:       "5px 13px",
                  borderRadius:  99,
                  cursor:        "pointer",
                  border:        `1px solid ${copied ? T.green+"55" : T.goldBorder}`,
                  background:    copied ? T.greenBg : T.goldDim,
                  color:         copied ? T.green   : T.gold,
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: "0.1em",
                  fontFamily:    "'Cinzel', serif",
                  textTransform: "uppercase",
                  transition:    "all .15s ease",
                  flexShrink:    0,
                }}
                onMouseEnter={e => {
                  if (!copied) {
                    e.currentTarget.style.background   = `${T.gold}22`;
                    e.currentTarget.style.borderColor  = T.gold;
                  }
                }}
                onMouseLeave={e => {
                  if (!copied) {
                    e.currentTarget.style.background   = T.goldDim;
                    e.currentTarget.style.borderColor  = T.goldBorder;
                  }
                }}
                title="Copy to clipboard"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied!" : "Copy"}
              </button>

              {/* Spacer */}
              <span style={{ flex:1 }}/>

              {/* Edit */}
              <button
                className="ops-upd"
                onClick={() => { setEditing(true); setEditText(msg.message); }}
                style={{
                  display:    "inline-flex",
                  alignItems: "center",
                  gap:        5,
                  padding:    "5px 12px",
                  borderRadius: 4,
                  cursor:     "pointer",
                  background: T.amberBg,
                  border:     `1px solid ${T.amber}44`,
                  color:      T.amber,
                  fontSize:   9,
                  fontWeight: 700,
                  letterSpacing:"0.1em",
                  fontFamily: "'Cinzel', serif",
                  textTransform:"uppercase",
                }}
                title="Edit message"
              >
                <EditIcon /> Edit
              </button>

              {/* Delete */}
              <button
                className="ops-del"
                onClick={() => setDelConfirm(true)}
                style={{
                  display:    "inline-flex",
                  alignItems: "center",
                  gap:        5,
                  padding:    "5px 12px",
                  borderRadius: 4,
                  cursor:     "pointer",
                  background: T.redBg,
                  border:     `1px solid ${T.red}33`,
                  color:      T.muted,
                  fontSize:   9,
                  fontWeight: 700,
                  letterSpacing:"0.1em",
                  fontFamily: "'Cinzel', serif",
                  textTransform:"uppercase",
                }}
                title="Delete message"
              >
                <TrashIcon /> Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main exported section ─────────────────────────────────────────────────────

export default function SavedMessagesSection({ isMobile }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newText,  setNewText]  = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr,setCreateErr]= useState("");
  const [createOk, setCreateOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try   { setMessages(await fetchAll()); }
    catch { /* silent — list stays empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    setCreateErr(""); setCreateOk(false);
    if (!newText.trim()) { setCreateErr("Message cannot be empty."); return; }
    setCreating(true);
    try {
      const created = await apiCreate(newText.trim());
      setMessages(prev => [created, ...prev]);
      setNewText("");
      setCreateOk(true);
      setTimeout(() => setCreateOk(false), 2500);
    } catch (err) {
      setCreateErr(err?.response?.data?.message || "Failed to save message.");
    } finally {
      setCreating(false);
    }
  }, [newText]);

  const handleUpdated = useCallback((updated) => {
    setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
  }, []);

  const handleDeleted = useCallback((id) => {
    setMessages(prev => prev.filter(m => m._id !== id));
  }, []);

  const pad = isMobile ? "16px 14px" : "22px 28px";

  return (
    <div style={{ padding: pad, flex:1, overflowY:"auto" }}>

      {/* ── Info bar ── */}
      <div style={{
        display:      "flex",
        gap:          12,
        alignItems:   "center",
        marginBottom: 24,
        padding:      "12px 18px",
        background:   T.bgCard,
        border:       `1px solid ${T.gold}25`,
        borderRadius: 8,
        flexShrink:   0,
      }}>
        <span style={{ width:7, height:7, borderRadius:"50%", background:T.gold, flexShrink:0, boxShadow:`0 0 8px ${T.gold}` }}/>
        <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.6 }}>
          Save frequently-used messages here. Use the <strong style={{ color:T.gold }}>Copy</strong> button on any card to instantly copy it to your clipboard.
        </p>
      </div>

      <div style={{
        display:             "grid",
        gridTemplateColumns: isMobile ? "1fr" : "380px 1fr",
        gap:                 24,
        alignItems:          "start",
      }}>

        {/* ── Create form ── */}
        <div style={{
          background:  T.bgCard,
          border:      `1px solid ${T.subtle}`,
          borderRadius:10,
          padding:     "24px 22px",
          boxShadow:   "0 2px 12px rgba(0,0,0,0.3)",
          position:    isMobile ? "static" : "sticky",
          top:         80,
        }}>
          <p style={{ margin:"0 0 4px", fontSize:8, letterSpacing:"0.22em", color:"rgba(200,168,74,0.6)", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
            New Entry
          </p>
          <h2 style={{ margin:"0 0 20px", fontSize:16, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>
            Save a Message
          </h2>

          {createErr && (
            <div style={{ padding:"10px 14px", borderRadius:6, marginBottom:16, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:12 }}>
              {createErr}
            </div>
          )}
          {createOk && (
            <div style={{ padding:"10px 14px", borderRadius:6, marginBottom:16, background:T.greenBg, border:`1px solid ${T.green}44`, color:T.green, fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Message saved successfully
            </div>
          )}

          <form onSubmit={handleCreate}>
            <Field label="Message" hint="required">
              <textarea
                className="ops-focus"
                value={newText}
                onChange={e => { setNewText(e.target.value); setCreateErr(""); }}
                placeholder="Type a reusable message template…"
                rows={5}
                required
                style={{
                  ...inputSx,
                  borderRadius: 8,
                  resize:       "vertical",
                  lineHeight:   1.65,
                }}
              />
            </Field>
            <div style={{ borderTop:`1px solid ${T.subtle}`, paddingTop:18, marginTop:4 }}>
              <GoldBtn
                type="submit"
                disabled={creating}
                style={{ width:"100%", padding:"12px" }}
              >
                {creating ? "Saving…" : "Save Message"}
              </GoldBtn>
            </div>
          </form>
        </div>

        {/* ── Message list ── */}
        <div>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ margin:0, fontSize:8, color:T.muted, letterSpacing:"0.2em", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
              Saved Messages
            </p>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{
                padding:     "2px 9px",
                borderRadius:99,
                background:  T.goldDim,
                border:      `1px solid ${T.goldBorder}`,
                fontSize:    9,
                color:       T.gold,
                fontFamily:  "'JetBrains Mono',monospace",
                fontWeight:  600,
              }}>
                {messages.length}
              </span>
              <GoldBtn variant="outline" onClick={load} style={{ padding:"5px 12px", fontSize:9 }}>
                Refresh
              </GoldBtn>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ padding:"52px 20px", textAlign:"center", color:T.muted }}>
              <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${T.subtle}`, borderTopColor:T.gold, margin:"0 auto 12px", animation:"opsSpinner .8s linear infinite" }}/>
              Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              padding:"52px 20px", textAlign:"center",
              background:   T.bgCard,
              border:       `1px solid ${T.subtle}`,
              borderRadius: 10,
            }}>
              <div style={{
                width:46, height:46, borderRadius:12,
                background:     T.goldDim,
                border:         `1px solid ${T.goldBorder}`,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                margin:         "0 auto 14px",
              }}>
                <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                  <polygon points="18,4 32,18 18,32 4,18" fill="none" stroke="rgba(200,168,74,0.4)" strokeWidth="1.5"/>
                </svg>
              </div>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>
                No Messages Yet
              </p>
              <p style={{ margin:"8px 0 0", fontSize:13, color:T.muted }}>
                Save your first message using the form.
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {messages.map(msg => (
                <MessageCard
                  key={msg._id}
                  msg={msg}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
