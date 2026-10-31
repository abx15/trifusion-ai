'use client';

import { TextField as MuiTextField, FormControl, FormHelperText } from '@mui/material';

export interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  [key: string]: unknown;
}

export function Input({ label, error, helperText, size = 'medium', fullWidth = true, ...rest }: InputProps) {
  return (
    <FormControl fullWidth={fullWidth} size={size as 'small' | 'medium'}>
      {label ? <MuiTextField label={label} fullWidth size={size as 'small' | 'medium'} {...rest} /> : <MuiTextField fullWidth size={size as 'small' | 'medium'} {...rest} />}
      {error && <FormHelperText sx={{ color: 'error.main' }}>{error}</FormHelperText>}
      {!error && helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
Input.displayName = 'Input';
