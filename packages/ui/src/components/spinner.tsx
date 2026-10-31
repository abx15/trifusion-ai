'use client';

import { CircularProgress, Box } from '@mui/material';

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'sm' | 'lg';
  className?: string;
}

export function Spinner({ size = 'medium', className }: SpinnerProps) {
  const sizeMap: Record<string, { width: number | string; height: number | string }> = {
    small: { width: 24, height: 24 },
    medium: { width: 36, height: 36 },
    large: { width: 48, height: 48 },
    sm: { width: 24, height: 24 },
    lg: { width: 48, height: 48 },
  };
  const s = sizeMap[size];
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...(className ? { className } : {}) }}>
      <CircularProgress size={s.width as any} thickness={4} sx={{ color: 'primary.main' }} />
    </Box>
  );
}
Spinner.displayName = 'Spinner';
