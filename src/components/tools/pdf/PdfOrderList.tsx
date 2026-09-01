'use client';

import { UnifiedFileObject } from '@/shared/utils/dataAdapter';

interface PdfOrderListProps {
  files: UnifiedFileObject[];
  onReorder: (updatedFiles: UnifiedFileObject[]) => void;
  onRemove: (id: string) => void;
}

/**
 * PDF Order List Component - Manages layout ordering and sequence manipulation
 * for multi-stream PDF merging and extraction workflows.
 */
export default function PdfOrderList({ files, onReorder, onRemove }: PdfOrderListProps) {
  
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Boundary check guards
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const reorderedArray = [...files];
    // Swapping elements inside the array index layout
    const [movedItem] = reorderedArray.splice(index, 1);
    reorderedArray.splice(targetIndex, 0, movedItem);

    onReorder(reorderedArray);
  };

  // Helper inside the component to parse human readable storage sizing
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (files.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Document Merge Sequence ({files.length})
        </h3>
        <span className="text-[10px] text-slate-500 font-medium">Arrange order before compilation</span>
      </div>

      {/* Render Document Item List */}
      <ul className="space-y-2" aria-label="PDF file merger sequence">
        {files.map((file, index) => {
          const isFirst = index === 0;
          const isLast = index === files.length - 1;

          return (
            <li
              key={file.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm transition hover:border-slate-800"
            >
              {/* Left Side: Order Meta and Filename */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold font-mono text-slate-400 border border-slate-800">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
                  <p className="text-[11px] font-medium text-slate-500 font-mono">{formatFileSize(file.size)}</p>
                </div>
              </div>

              {/* Right Side: Action Control Sequence */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Move Up Button */}
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => moveItem(index, 'up')}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-indigo-400 disabled:opacity-20 disabled:pointer-events-none transition border border-transparent hover:border-slate-800"
                  aria-label={`Move ${file.name} up`}
                >
                  ▲
                </button>

                {/* Move Down Button */}
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => moveItem(index, 'down')}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-indigo-400 disabled:opacity-20 disabled:pointer-events-none transition border border-transparent hover:border-slate-800"
                  aria-label={`Move ${file.name} down`}
                >
                  ▼
                </button>

                {/* Vertical Divider line */}
                <div className="h-4 w-px bg-slate-900 mx-1" />

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-red-950/30 hover:text-red-400 transition border border-transparent hover:border-red-900/20"
                  aria-label={`Remove ${file.name} from list`}
                >
                  🗑️
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
