'use client';

import { Alert as MuiAlert, AlertTitle as MuiAlertTitle } from '@mui/material';

export interface AlertDescriptionProps {
  children?: React.ReactNode;
}

export function AlertDescription({ children }: AlertDescriptionProps) {
  return <span>{children}</span>;
}
AlertDescription.displayName = 'AlertDescription';

export interface AlertTitleProps {
  children?: React.ReactNode;
}

export function AlertTitle({ children }: AlertTitleProps) {
  return <MuiAlertTitle>{children}</MuiAlertTitle>;
}
AlertTitle.displayName = 'AlertTitle';

export interface AlertProps {
  severity?: 'error' | 'warning' | 'info' | 'success';
  variant?: 'destructive' | 'default' | 'success' | 'error' | 'warning' | 'info';
  role?: string;
  children?: React.ReactNode;
}

export function Alert({ severity = 'info', variant, role, children, ...rest }: AlertProps) {
  const mappedSeverity = variant ? (variant as any) : severity;
  return <MuiAlert severity={mappedSeverity} role={role} {...rest}>{children}</MuiAlert>;
}
Alert.displayName = 'Alert';
