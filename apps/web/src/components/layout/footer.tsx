import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-8 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">TriFusion AI</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-xs">
          <Link href="/#privacy" className="hover:text-foreground transition-colors">
            Privacy by Default
          </Link>
          <Link href="/#security" className="hover:text-foreground transition-colors">
            Tenant Isolation
          </Link>
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Swagger / OpenAPI
          </a>
        </div>
      </div>
    </footer>
  );
}

