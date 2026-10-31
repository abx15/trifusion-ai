'use client';

import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'color' | 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'destructive';
  size?: 'small' | 'medium' | 'large' | 'sm' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  asChild?: boolean;
}

const VARIANT_STYLES: Record<string, any> = {
  primary: { bg: 'primary.main', color: 'primary.contrastText', '&:hover': { bg: 'primary.dark' } },
  secondary: { bg: 'secondary.main', color: 'secondary.contrastText', '&:hover': { bg: 'secondary.dark' } },
  outline: { border: '1.5px solid', borderColor: 'primary.main', color: 'primary.main', '&:hover': { bgcolor: 'rgba(0,63,92,0.08)' } },
  ghost: { color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } },
  danger: { bg: 'error.main', color: 'error.contrastText', '&:hover': { bg: 'error.dark' } },
  destructive: { bg: 'error.main', color: 'error.contrastText', '&:hover': { bg: 'error.dark' } },
  success: { bg: 'success.main', color: 'success.contrastText', '&:hover': { bg: 'success.dark' } },
};

const SIZE_STYLES: Record<string, any> = {
  small: { px: 1.5, py: 0.75, fontSize: '0.8125rem' },
  medium: { px: 2.5, py: 1, fontSize: '0.9375rem' },
  large: { px: 3.5, py: 1.25, fontSize: '1rem' },
  sm: { px: 1.5, py: 0.75, fontSize: '0.8125rem' },
  lg: { px: 3.5, py: 1.25, fontSize: '1rem' },
};

export function Button({
  variant = 'primary',
  size = 'medium',
  isLoading,
  children,
  onClick,
  disabled,
  fullWidth,
  asChild,
  ...rest
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
  const sizeKey = size === 'sm' ? 'small' : size === 'lg' ? 'large' : size;
  const sizeStyle = SIZE_STYLES[sizeKey] ?? SIZE_STYLES.medium;

  if (asChild) {
    return (
      <span
        {...(rest as any)}
        sx={{
          borderRadius: 2,
          fontWeight: 500,
          textTransform: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          cursor: 'pointer',
          ...variantStyle,
          ...sizeStyle,
        }}
        onClick={onClick}
      >
        {children}
      </span>
    );
  }

  return (
    <MuiButton
      variant="contained"
      size={sizeKey as any}
      disabled={disabled || isLoading}
      onClick={onClick}
      fullWidth={fullWidth}
      sx={{
        borderRadius: 2,
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
        '&:disabled': { opacity: 0.5, pointerEvents: 'none' },
        ...variantStyle,
        ...sizeStyle,
        ...(isLoading ? { pointerEvents: 'none', opacity: 0.7 } : {}),
      }}
      {...rest}
    >
      {isLoading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" className="animate-spin">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </MuiButton>
  );
}
Button.displayName = 'Button';
