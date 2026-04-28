// src/components/common/ITNotifPanel.jsx
// White-themed notification panel for the IT dashboard.
// The main NotifPanel uses dark OPS SUITE tokens (T.bgCard = #141310).
// This wrapper overrides those CSS variables to white/light values
// matching the IT dashboard's light theme.

import { useEffect } from 'react';
import useNotifStore from '../../stores/useNotificationStore.js';
import { fmt } from '../../utils/formatters.js';

export default function ITNotifPanel({ open, width = 310 }) {
  const { notifications, markRead, clearNotifs } = useNotifStore();

  useEffect(() => {
    if (open) markRead();
  }, [open, markRead]);

  if (!open) return null;

  /* Light-theme values matching it.css tokens */
  const C = {
    bg:      '#ffffff',
    bg2:     '#f8f7f4',
    border:  '#e8e5de',
    text:    '#18170f',
    muted:   '#8a8475',
    accent:  '#2a6048',
    danger:  '#b83030',
    gold:    '#b89030',
    mono:    "'DM Mono', monospace",
    body:    "'DM Sans', sans-serif",
    display: "'Fraunces', Georgia, serif",
  };

  return (
    <div style={{
      position:     'absolute',
      top:          46,
      right:        0,
      width,
      zIndex:       600,
      background:   C.bg,
      border:       `1px solid ${C.border}`,
      borderRadius: 12,
      overflow:     'hidden',
      boxShadow:    '0 8px 32px rgba(24,23,15,0.12), 0 2px 8px rgba(24,23,15,0.06)',
      animation:    'slideUp 0.22s cubic-bezier(.22,1,.36,1) both',
    }}>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }`}</style>

      {/* Header */}
      <div style={{
        padding:        '12px 16px',
        borderBottom:   `1px solid ${C.border}`,
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        background:     C.bg2,
      }}>
        <span style={{
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: '0.14em',
          color:         C.accent,
          fontFamily:    C.mono,
          textTransform: 'uppercase',
        }}>
          Notifications
        </span>
        {notifications.length > 0 && (
          <button onClick={clearNotifs} style={{
            background: 'none', border: 'none',
            color: C.muted, fontSize: 11, cursor: 'pointer',
            padding: '2px 6px', borderRadius: 4,
            fontFamily: C.body, transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.danger}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted, fontFamily: C.body }}>
              No notifications
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div key={n.id} style={{
              padding:      '11px 16px',
              borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : 'none',
              cursor:       'default',
              transition:   'background .12s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.bg2}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <p style={{
                margin:     0,
                fontSize:   12,
                color:      C.text,
                lineHeight: 1.5,
                fontFamily: C.body,
              }}>
                {n.message}
              </p>
              <p style={{
                margin:     '4px 0 0',
                fontSize:   9,
                color:      C.muted,
                fontFamily: C.mono,
              }}>
                {fmt(n.time)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}