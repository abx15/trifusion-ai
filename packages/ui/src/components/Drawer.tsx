'use client';

import * as React from 'react';
import {
  Drawer as MuiDrawer,
  DrawerProps as MuiDrawerProps,
} from '@mui/material';

export interface DrawerProps extends Omit<MuiDrawerProps, 'anchor'> {
  open: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  width?: number | string;
  children?: React.ReactNode;
}

export function Drawer(props: DrawerProps) {
  const { open, onClose, anchor = 'left', width = 280, children, ...rest } = props;
  return (
    <MuiDrawer
      open={open}
      onClose={onClose}
      anchor={anchor as any}
      sx={{
        width: typeof width === 'number' ? width : 'auto',
        '& .MuiDrawer-paper': {
          width: typeof width === 'number' ? width : 'auto',
          boxSizing: 'border-box',
        },
      }}
      {...rest}
    >
      {children}
    </MuiDrawer>
  );
}
Drawer.displayName = 'Drawer';
