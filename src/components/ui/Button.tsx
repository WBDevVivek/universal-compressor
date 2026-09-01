import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

/**
 * Universal Button Component - Highly customizable, fully accessible, and type-safe.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    
    // Core structural styles mapping to prevent repetitive tailwind bloat
    const baseStyles = 'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40';
    
    const variants = {
      primary: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 focus-visible:outline-indigo-600',
      secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:outline-slate-800',
      outline: 'border border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-slate-100 focus-visible:outline-slate-700',
      danger: 'bg-red-600 text-white shadow-md shadow-red-600/10 hover:bg-red-500 focus-visible:outline-red-600',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], className))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
