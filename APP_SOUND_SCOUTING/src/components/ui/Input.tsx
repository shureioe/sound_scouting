'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  errorText?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, errorText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex w-full flex-col gap-2xs">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wide text-foreground/70"
          >
            {label}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-11 rounded-md border border-border bg-background px-md text-base text-foreground shadow-soft-sm transition-colors placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
            errorText && 'border-danger focus:border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        />

        {errorText && (
          <p className="text-xs font-medium text-danger">{errorText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
