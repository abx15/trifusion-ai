'use client';

import * as React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
} from '@mui/material';

export interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, onMenuClick, actions }: TopbarProps) {
  return (
    <MuiAppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ px: 3, minHeight: 64 }}>
        {onMenuClick && (
          <IconButton
            size="large"
            onClick={onMenuClick}
            sx={{ mr: 2, color: 'text.primary' }}
          >
            {/* hamburger icon */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ height: 2, width: 24, bg: 'primary.main', borderRadius: 1 }} />
              ))}
            </Box>
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.25, mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ ml: 2 }}>{actions}</Box>}
      </Toolbar>
    </MuiAppBar>
  );
}
Topbar.displayName = 'Topbar';
