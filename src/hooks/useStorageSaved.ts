'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook tracking localized client-side bandwidth and infrastructure capacity saved.
 */
export function useStorageSaved() {
  const [totalBytesSaved, setTotalBytesSaved] = useState<number>(0);

//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem('uc_total_bytes_saved');
//       if (stored) {
//         // setTotalBytesSaved(Number(stored));
//                 setTotalBytesSaved(() => Number(stored));
//       }
//     } catch (error) {
//       console.error('Failed to synchronize memory storage aggregation metrics:', error);
//     }
//   }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('uc_total_bytes_saved');
      if (stored) {
        // Pushing execution to the macro-task queue to completely bypass synchronous render alerts
        setTimeout(() => {
          setTotalBytesSaved(Number(stored));
        }, 0);
      }
    } catch (error) {
      console.error('Failed to synchronize memory storage aggregation metrics:', error);
    }
  }, []);


  const recordSavings = (originalSize: number, compressedSize: number) => {
    const savings = originalSize - compressedSize;
    if (savings <= 0) return;

    setTotalBytesSaved((prev) => {
      const newTotal = prev + savings;
      try {
        localStorage.setItem('uc_total_bytes_saved', newTotal.toString());
      } catch (error) {
        console.error('Failed to store cumulative allocation calculations:', error);
      }
      return newTotal;
    });
  };

  const resetSavingsCounter = () => {
    setTotalBytesSaved(0);
    try {
      localStorage.setItem('uc_total_bytes_saved', '0');
    } catch (error) {
      console.error('Failed to wipe data usage metrics:', error);
    }
  };

  // Human-readable formatting helper nested strictly inside the hook context
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return {
    totalBytesSaved,
    formattedSavings: formatBytes(totalBytesSaved),
    recordSavings,
    resetSavingsCounter,
  };
}
