'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { FileText, Clock } from 'lucide-react';

interface AIWeeklyReportProps {
  workspaceId: string;
}

export function AIWeeklyReport({ workspaceId }: AIWeeklyReportProps) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/backend/workspaces/${workspaceId}/ai/weekly-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: '',
          analytics: {},
          reporting_period: { start: start.toISOString(), end: end.toISOString() },
        }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate weekly report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ color: 'primary.main' }}>
          <FileText size={24} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Weekly Report
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate a weekly report from real analytics data.
      </Typography>

      <Button onClick={generate} disabled={loading} variant="outlined" startIcon={<Clock size={18} />}>
        {loading ? 'Generating...' : 'Generate Report'}
      </Button>

      {error && (
        <Box sx={{ mt: 2, p: 1.5, color: 'error.main', backgroundColor: 'error.light', borderRadius: 1 }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {result && (
        <Box sx={{ mt: 3, flex: 1, overflowY: 'auto' }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Report Output
          </Typography>
          <Box sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {result.output?.summary || JSON.stringify(result, null, 2)}
            </Typography>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Chip label={`Provider: ${result.provider || '—'}`} size="small" />
            <Chip label={`Model: ${result.model || '—'}`} size="small" />
            <Chip label={`Scope: ${result.source_scope || '—'}`} size="small" />
          </Box>
        </Box>
      )}
    </Paper>
  );
}
