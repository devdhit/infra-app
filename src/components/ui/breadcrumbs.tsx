'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {

  return (
    <nav className="flex items-center mb-4 text-sm" aria-label="Breadcrumbs">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
              
              <Link
                href={item.href}
                className={`flex items-center hover:text-blue-600 ${
                  isLast 
                    ? 'font-medium text-foreground pointer-events-none' 
                    : 'text-muted-foreground'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}