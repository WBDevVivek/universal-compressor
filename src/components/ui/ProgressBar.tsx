import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  progress: number; // Value between 0 and 100
  status?: 'processing' | 'success' | 'error';
  className?: string;
}

/**
 * Shared Progress Bar - Dynamically visually maps binary local compression flow.
 */
export function ProgressBar({ progress, status = 'processing', className }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const statusColors = {
    processing: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
  };

  return (
    <div className={twMerge('w-full space-y-1.5', className)}>
      {/* Percentage Track Label */}
      <div className="flex justify-between text-xs font-semibold text-slate-400">
        <span className="capitalize">{status}</span>
        <span>{clampedProgress}%</span>
      </div>
      
      {/* Progress Track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300 ease-out', statusColors[status])}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
