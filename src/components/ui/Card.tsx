import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

/**
 * Universal Card Wrapper - Handles structural containers across all dynamic route hubs.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-2xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm transition-all duration-300',
            hoverEffect && 'hover:border-indigo-500/30 hover:bg-slate-900/40 shadow-lg shadow-black/20',
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
