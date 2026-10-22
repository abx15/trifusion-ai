'use client';

import { useEffect, useState } from 'react';

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/backend/files')
      .then((r) => r.json())
      .then((data) => setFiles(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading files...</div>;
  if (error) return <div>Error: {error}</div>;
  if (files.length === 0) return <div>No files.</div>;

  return (
    <ul>
      {files.map((f) => (
        <li key={f.id}>{f.originalName} ({f.scanStatus})</li>
      ))}
    </ul>
  );
}
