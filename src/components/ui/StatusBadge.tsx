import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  type: 'success' | 'error' | 'warning' | 'info';
  label: string;
  className?: string;
}

/**
 * Status Badge Component - Renders inline tactical micro-feedback alerts.
 */
export function StatusBadge({ type, label, className }: StatusBadgeProps) {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
          styles[type]
        ),
        className
      )}
    >
      {label}
    </span>
  );
}
