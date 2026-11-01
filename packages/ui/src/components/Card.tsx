'use client';

import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent as MuiCardContent,
  CardHeader as MuiCardHeader,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export interface CardProps extends Omit<MuiCardProps, 'variant'> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const CardRoot = styled(MuiCard, {
  shouldForwardProp: (prop) => !['variant', 'padding'].includes(prop as string),
})<{ variant?: CardProps['variant']; padding?: CardProps['padding'] }>(({ theme, variant, padding }) => {
  const paddings: Record<string, string> = {
    none: '0',
    small: '16px',
    medium: '24px',
    large: '32px',
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: 'none',
    padding: paddings[padding ?? 'medium'],
  };

  if (variant === 'outlined') {
    return { ...baseStyles, border: `1.5px solid ${theme.palette.primary.main}` };
  }
  if (variant === 'elevated') {
    return {
      ...baseStyles,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    };
  }
  return baseStyles;
});

export function Card(props: CardProps) {
  const { variant = 'default', padding = 'medium', children, ...rest } = props;
  const muiVariant = variant === 'outlined' ? ('outlined' as const) : undefined;
  return <CardRoot variant={muiVariant} padding={padding} {...rest}>{children}</CardRoot>;
}
Card.displayName = 'Card';

export function CardContent(props: React.ComponentPropsWithRef<typeof MuiCardContent>) {
  return <MuiCardContent {...props} />;
}
CardContent.displayName = 'CardContent';

export function CardHeader(props: React.ComponentPropsWithRef<typeof MuiCardHeader>) {
  return <MuiCardHeader {...props} />;
}
CardHeader.displayName = 'CardHeader';

export function CardFooter(props: React.ComponentPropsWithRef<typeof MuiCardContent>) {
  return <MuiCardContent {...props} />;
}
CardFooter.displayName = 'CardFooter';
