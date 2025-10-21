'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Card({
  title,
  description,
  header,
  footer,
  children,
  className,
  contentClassName,
}: CardProps) {
  return (
    <article
      className={cn(
        'rounded-xl border border-border/70 bg-card text-card-foreground shadow-soft-md',
        className
      )}
    >
      {(title || description || header) && (
        <div className="flex flex-col gap-2xs border-b border-border/60 px-lg py-md">
          {header}
          {title && (
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-foreground/70">{description}</p>
          )}
        </div>
      )}
      <div className={cn('px-lg py-lg', contentClassName)}>{children}</div>
      {footer && (
        <div className="border-t border-border/60 px-lg py-sm text-sm text-foreground/70">
          {footer}
        </div>
      )}
    </article>
  );
}
