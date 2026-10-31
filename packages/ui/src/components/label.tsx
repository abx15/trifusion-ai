'use client';

import { Typography } from '@mui/material';

export interface LabelProps {
  children?: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function Label({ children, htmlFor, className }: LabelProps) {
  return (
    <Typography
      variant="body2"
      component="label"
      htmlFor={htmlFor}
      sx={{ fontWeight: 500, mb: 0.5, color: 'text.primary', ...(className ? { className } : {}) }}
    >
      {children}
    </Typography>
  );
}
Label.displayName = 'Label';
