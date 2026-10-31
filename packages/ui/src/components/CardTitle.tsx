'use client';

import { Typography } from '@mui/material';

export interface CardTitleProps {
  children?: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <Typography variant="h6" component="h6" sx={{ fontWeight: 600, ...(className ? { className } : {}) }}>{children}</Typography>;
}
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return <Typography variant="body2" color="text.secondary" sx={{ ...(className ? { className } : {}) }}>{children}</Typography>;
}
CardDescription.displayName = 'CardDescription';
