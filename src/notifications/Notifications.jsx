import React, { useEffect, useState, useRef } from 'react';

export default function Notifications({ user }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifications') || '[]'); } catch (e) { return []; }
  });
  const [unread, setUnread] = useState(() => items.filter(i => !i.read).length);
  const wsRef = useRef(null);

  useEffect(() => {
    setUnread(items.filter(i => !i.read).length);
    try { localStorage.setItem('notifications', JSON.stringify(items)); } catch (e) {}
  }, [items]);

  useEffect(() => {
    // only open WS when user is present
    if (!user || !user.id) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      console.log('notifications ws open');
    });
    ws.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data);
        // server sends wrapper { type: 'notification', payload, time }
        if (data && data.type === 'notification') {
          const payload = data.payload || {};
          const time = data.time || new Date().toISOString();
          const entry = { id: `${Date.now()}-${Math.floor(Math.random()*10000)}`, payload, time, read: false };
          setItems(prev => [entry, ...prev].slice(0, 100));
        }
      } catch (err) { console.warn('invalid ws msg', err); }
    });
    ws.addEventListener('close', () => console.log('notifications ws closed'));
    ws.addEventListener('error', (e) => console.warn('notifications ws error', e));

    return () => { try { ws.close(); } catch (e) {} };
  }, [user && user.id]);

  function toggle() {
    setOpen(o => !o);
    if (!open) {
      // mark all as read when opening
      setItems(prev => prev.map(i => ({ ...i, read: true })));
      setUnread(0);
    }
  }

  function clearAll() {
    setItems([]);
    setUnread(0);
  }

  return (
    <div className="notifications-root">
      <button className="btn btn-outline-secondary notifications-button" onClick={toggle} aria-expanded={open} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-popup">
          <div className="notif-header">
            <strong>Notifications</strong>
            <button className="btn btn-sm btn-link" onClick={clearAll}>Clear</button>
          </div>
          <div className="notif-list">
            {items.length === 0 && <div className="notif-empty">No notifications</div>}
            {items.map(n => (
              <div className={`notif-item ${n.read ? 'read' : 'unread'}`} key={n.id}>
                <div className="notif-time">{new Date(n.time).toLocaleString()}</div>
                <div className="notif-body">{n.payload && n.payload.message ? n.payload.message : (n.payload && n.payload.title) || JSON.stringify(n.payload)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
