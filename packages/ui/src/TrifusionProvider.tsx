'use client';

import * as React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { createTrifusionTheme } from './theme';

export type ThemeMode = 'light' | 'dark';

interface TrifusionProviderProps {
  children: React.ReactNode;
  mode?: ThemeMode;
}

export function TrifusionProvider({ children, mode = 'light' }: TrifusionProviderProps) {
  const theme = React.useMemo(() => createTrifusionTheme(mode), [mode]);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: false }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}
