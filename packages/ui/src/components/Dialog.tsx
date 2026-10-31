'use client';

import * as React from 'react';
import { Dialog as MuiDialog, DialogProps as MuiDialogProps, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export interface DialogProps extends Omit<MuiDialogProps, 'size'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
}

export function Dialog({ open, onClose, title, size = 'medium', children, confirmLabel = 'Save', onConfirm, ...rest }: DialogProps) {
  return (
    <MuiDialog open={open} onClose={onClose} maxWidth={size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md'} {...rest}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        {onConfirm && <Button onClick={onConfirm} color="primary" variant="contained">{confirmLabel}</Button>}
      </DialogActions>
    </MuiDialog>
  );
}
Dialog.displayName = 'Dialog';
