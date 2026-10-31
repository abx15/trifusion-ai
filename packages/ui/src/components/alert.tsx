'use client';

import { Alert as MuiAlert } from '@mui/material';

export interface AlertProps {
  severity?: 'error' | 'warning' | 'info' | 'success';
  children?: React.ReactNode;
}

export function Alert({ severity = 'info', children, ...rest }: AlertProps) {
  return <MuiAlert severity={severity as any} {...rest}>{children}</MuiAlert>;
}
Alert.displayName = 'Alert';
