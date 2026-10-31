import { PaletteMode, ThemeOptions, createTheme, alpha } from '@mui/material/styles';

export const TRIFUSION_PALETTE = {
  navy: '#003F5C',
  darkPurple: '#58508D',
  purple: '#8A508F',
  magenta: '#BC5090',
  rose: '#DE5A79',
  coral: '#FF6361',
  orange: '#FF8531',
  amber: '#FFA600',
  primary: '#003F5C',
  secondary: '#58508D',
} as const;

export const TRIFUSION_BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

function basePalette(mode: PaletteMode) {
  const isDark = mode === 'dark';
  return {
    primary: {
      main: TRIFUSION_PALETTE.primary,
      light: '#1A5372',
      dark: '#002B40',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: TRIFUSION_PALETTE.secondary,
      light: '#726B9F',
      dark: '#423B70',
      contrastText: '#FFFFFF',
    },
    error: {
      main: TRIFUSION_PALETTE.coral,
      light: '#FF8583',
      dark: '#D94341',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: TRIFUSION_PALETTE.amber,
      light: '#FFBA33',
      dark: '#CC8500',
      contrastText: '#000000',
    },
    info: {
      main: TRIFUSION_PALETTE.purple,
      light: '#A56FA9',
      dark: '#6E3C73',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    background: {
      default: isDark ? '#0B0F19' : '#F8FAFC',
      paper: isDark ? '#111827' : '#FFFFFF',
    },
    text: {
      primary: isDark ? '#F8FAFC' : '#0F172A',
      secondary: isDark ? '#94A3B8' : '#475569',
      disabled: isDark ? '#475569' : '#94A3B8',
    },
    divider: isDark ? alpha('#94A3B8', 0.15) : '#E2E8F0',
  };
}

export function createTrifusionTheme(mode: PaletteMode = 'light') {
  const palette = basePalette(mode);
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      ...palette,
    },
    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      button: {
        fontSize: '0.9375rem',
        fontWeight: 600,
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.4,
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      },
    },
    shape: {
      borderRadius: 10,
    },
    spacing: 8,
    breakpoints: {
      values: TRIFUSION_BREAKPOINTS,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            fontFamily:
              '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 18px',
            transition: 'all 0.15s ease-in-out',
          },
          containedPrimary: {
            backgroundColor: TRIFUSION_PALETTE.primary,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#002B40',
            },
          },
          containedSecondary: {
            backgroundColor: TRIFUSION_PALETTE.secondary,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#423B70',
            },
          },
          outlined: {
            borderColor: palette.divider,
            color: palette.text.primary,
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: isDark ? alpha('#FFFFFF', 0.05) : alpha(TRIFUSION_PALETTE.primary, 0.04),
              borderColor: palette.primary.main,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${palette.divider}`,
            backgroundColor: palette.background.paper,
            boxShadow: isDark
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: palette.background.paper,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: isDark ? alpha('#FFFFFF', 0.03) : '#FFFFFF',
              '& fieldset': {
                borderColor: palette.divider,
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: palette.text.secondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: palette.primary.main,
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? alpha('#FFFFFF', 0.03) : '#FFFFFF',
            '& fieldset': {
              borderColor: palette.divider,
            },
            '&:hover fieldset': {
              borderColor: palette.text.secondary,
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.primary.main,
              borderWidth: '2px',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.divider}`,
            padding: '14px 18px',
          },
          head: {
            fontWeight: 600,
            color: palette.text.secondary,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: isDark ? alpha('#000000', 0.2) : alpha('#000000', 0.02),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${palette.divider}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            borderRight: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: 6,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? alpha('#111827', 0.9) : alpha('#FFFFFF', 0.9),
            backdropFilter: 'blur(12px)',
            color: palette.text.primary,
            borderBottom: `1px solid ${palette.divider}`,
            boxShadow: 'none',
          },
        },
      },
    },
  } as ThemeOptions);
}

export type TrifusionTheme = ReturnType<typeof createTrifusionTheme>;
