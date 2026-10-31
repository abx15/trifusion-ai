'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
} from '@mui/material';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
}

export function KPICard({ title, value, subtitle, trend, icon }: KPICardProps) {
  return (
    <Card variant="elevation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack spacing={1} sx={{ height: '100%' }}>
          {icon && <Box sx={{ mb: 1 }}>{icon}</Box>}
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {value}
          </Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          {trend && (
            <Typography
              variant="caption"
              sx={{ color: trend.positive ? 'success.main' : 'error.main', fontWeight: 600 }}
            >
              {trend.value}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
KPICard.displayName = 'KPICard';
