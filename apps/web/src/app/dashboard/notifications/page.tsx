'use client';

import { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/backend/notifications')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;
  if (items.length === 0) return <div>No notifications.</div>;

  return (
    <ul>
      {items.map((n) => (
        <li key={n.id}>
          {n.type} - {n.readAt ? 'read' : 'unread'}
        </li>
      ))}
    </ul>
  );
}
