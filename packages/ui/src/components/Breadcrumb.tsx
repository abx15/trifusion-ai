'use client';

import { Breadcrumbs as MuiBreadcrumbs, Link } from '@mui/material';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <MuiBreadcrumbs sx={{ mx: 3, my: 1, gap: 0.5 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast) {
          return (
            <Link key={item.label} component="span" sx={{ typography: 'body2', color: 'text.primary', fontWeight: 600 }}>
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.label}
            component="a"
            href={item.href}
            sx={{ typography: 'body2', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
Breadcrumb.displayName = 'Breadcrumb';
