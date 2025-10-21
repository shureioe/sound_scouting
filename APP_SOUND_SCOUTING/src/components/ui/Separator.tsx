'use client';

import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
};

export function Separator({
  className,
  orientation = 'horizontal',
  role = 'separator',
  ...props
}: SeparatorProps) {
  return (
    <div
      role={role}
      className={cn(
        'bg-border/80',
        orientation === 'vertical'
          ? 'mx-auto h-full w-px'
          : 'my-sm h-px w-full',
        className
      )}
      {...props}
    />
  );
}
