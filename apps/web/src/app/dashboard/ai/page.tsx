'use client';

import { Box, Typography, Paper } from '@mui/material';
import { useParams } from 'next/navigation';
import { AIAssistant } from '../../../components/ai/AIAssistant';
import { AIProjectSummary } from '../../../components/ai/AIProjectSummary';
import { AIWeeklyReport } from '../../../components/ai/AIWeeklyReport';

export default function AIDashboardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI capabilities for workspace {workspaceId}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, flex: 1, minHeight: 0 }}>
        <Paper sx={{ p: 3, height: '100%', overflow: 'hidden' }}>
          <AIAssistant workspaceId={workspaceId} />
        </Paper>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <AIProjectSummary workspaceId={workspaceId} />
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mt: 2 }}>
        <Paper sx={{ p: 3, height: 400 }}>
          <AIWeeklyReport workspaceId={workspaceId} />
        </Paper>
      </Box>
    </Box>
  );
}
