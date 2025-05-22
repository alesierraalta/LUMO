import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MenuItemServerProps {
  title: string;
  description?: string;
  href: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * A server component for rendering a menu item with a title, description, and optional icon.
 * Used for navigation on the home page.
 */
export default function MenuItemServer({
  title,
  description,
  href,
  icon,
  className
}: MenuItemServerProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:bg-accent/50",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="mt-1 p-2 rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
} 