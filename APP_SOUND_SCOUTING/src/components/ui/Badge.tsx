'use client';

import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-2xs rounded-full px-sm py-1 text-xs font-semibold uppercase tracking-wide shadow-soft-sm',
  {
    variants: {
      tone: {
        success: 'bg-success/15 text-success-foreground ring-1 ring-inset ring-success/25',
        warn: 'bg-warning/15 text-warning-foreground ring-1 ring-inset ring-warning/25',
        danger: 'bg-danger/15 text-danger-foreground ring-1 ring-inset ring-danger/25',
        neutral: 'bg-neutral/20 text-neutral-foreground ring-1 ring-inset ring-neutral/30',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
