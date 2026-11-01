'use client';

import { useEffect, useState } from 'react';
import { useWorkspace } from '../../../contexts/workspace-context';

export default function FilesPage() {
  const { workspace, isValidating } = useWorkspace();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace?.id) return;

    fetch(`/api/backend/workspaces/${workspace.id}/files`)
      .then((r) => r.json())
      .then((data) => setFiles(Array.isArray(data) ? data : []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [workspace?.id]);

  if (loading || isValidating) return <div>Loading files...</div>;
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
