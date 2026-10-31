'use client';

import * as React from 'react';
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  items: SidebarItem[];
  brand?: React.ReactNode;
  width?: number;
}

export function Sidebar({ open, onClose, items, brand, width = 280 }: SidebarProps) {
  return (
    <MuiDrawer
      open={open}
      onClose={onClose}
      variant="permanent"
      sx={{
        width: open ? width : 0,
        '& .MuiDrawer-paper': {
          width: open ? width : 0,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.2s ease-in-out',
        },
      }}
    >
      <Toolbar sx={{ pr: 2 }}>
        {brand || <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
          TriFusion
        </Typography>}
      </Toolbar>
      <List dense>
        {items.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={item.active}
              disabled={item.disabled}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                '&:hover': { backgroundColor: 'action.hover' },
                ...(item.active && {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ pt: 2, px: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton onClick={onClose} sx={{ borderRadius: 2, mx: 1, color: 'text.secondary' }}>
          <ListItemIcon sx={{ minWidth: 32 }}>{/* logout icon */}</ListItemIcon>
          <ListItemText primary="Sign out" />
        </ListItemButton>
      </Box>
    </MuiDrawer>
  );
}
Sidebar.displayName = 'Sidebar';
