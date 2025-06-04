import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto', className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  className?: string;
  title?: string;
  description?: string;
  header?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  size?: '1x1' | '1x2' | '2x1' | '2x2' | '2x3' | '3x2';
}

export function BentoCard({
  className,
  title,
  description,
  header,
  icon,
  children,
  size = '1x1',
}: BentoCardProps) {
  const sizeClasses = {
    '1x1': 'col-span-1 row-span-1',
    '1x2': 'col-span-1 row-span-2',
    '2x1': 'col-span-2 row-span-1',
    '2x2': 'col-span-2 row-span-2',
    '2x3': 'col-span-2 row-span-3',
    '3x2': 'col-span-3 row-span-2',
  };

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow',
        sizeClasses[size],
        className
      )}
    >
      {header && <div className="w-full">{header}</div>}
      <div className="p-4 h-full flex flex-col">
        {(title || icon) && (
          <div className="flex items-center justify-between mb-2">
            {title && <h3 className="font-medium text-lg">{title}</h3>}
            {icon && <div className="text-emerald-600">{icon}</div>}
          </div>
        )}
        {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );
}

interface BentoSectionProps {
  className?: string;
  title?: string;
  description?: string;
  children: ReactNode;
}

export function BentoSection({ className, title, description, children }: BentoSectionProps) {
  return (
    <div className={cn('mb-8', className)}>
      {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}
