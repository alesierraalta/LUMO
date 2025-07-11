'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      <ol className="flex items-center space-x-2" role="list">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight 
                className="h-4 w-4 text-gray-400 mx-2" 
                aria-hidden="true"
              />
            )}
            {item.active ? (
              <span 
                className="font-medium text-gray-900"
                aria-current="page"
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center"
                aria-label={`Ir a ${item.label}`}
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Breadcrumbs;