'use client';

import { Skeleton as MuiSkeleton } from '@mui/material';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ variant = 'text', width, height }: SkeletonProps) {
  if (variant === 'circular') {
    return <MuiSkeleton variant="circular" width={width ?? 40} height={height ?? 40} />;
  }
  if (variant === 'rectangular') {
    return <MuiSkeleton variant="rectangular" width={width ?? '100%'} height={height ?? 16} />;
  }
  return <MuiSkeleton variant="text" width={width ?? '100%'} height={height ?? 16} />;
}
Skeleton.displayName = 'Skeleton';
