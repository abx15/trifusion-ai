'use client';

import * as React from 'react';
import { Card, Typography, Box } from '@mui/material';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider' }}>
      <Box sx={{ mx: 'auto', mb: 3, opacity: 0.5, width: 48, height: 48 }}>{icon}</Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ textAlign: 'center' }}>{action}</Box>}
    </Card>
  );
}
EmptyState.displayName = 'EmptyState';
