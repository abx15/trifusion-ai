'use client';

import * as React from 'react';
import { Badge as MuiBadge } from '@mui/material';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: { color: '#FFFFFF', backgroundColor: '#64748B' },
  primary: { color: '#FFFFFF', backgroundColor: '#003F5C' },
  secondary: { color: '#FFFFFF', backgroundColor: '#58508D' },
  success: { color: '#FFFFFF', backgroundColor: '#10B981' },
  warning: { color: '#000000', backgroundColor: '#FFA600' },
  error: { color: '#FFFFFF', backgroundColor: '#FF6361' },
  info: { color: '#FFFFFF', backgroundColor: '#8A508F' },
};

export function Badge({ variant = 'default', size = 'medium', children, className, ...rest }: BadgeProps) {
  const style = VARIANT_STYLES[variant];
  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { fontSize: '0.7rem', padding: '2px 6px' },
    medium: { fontSize: '0.75rem', padding: '4px 8px' },
    large: { fontSize: '0.875rem', padding: '6px 10px' },
  };

  return (
    <MuiBadge badgeContent={children} color="primary" sx={{ ...style, ...sizeStyles[size] }} {...rest} className={className} />
  );
}
Badge.displayName = 'Badge';
