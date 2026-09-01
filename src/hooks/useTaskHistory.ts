"use client";

import { useState, useEffect } from "react";

export interface TaskItem {
  id: string;
  fileName: string;
  fileType: string;
  originalSize: number;
  compressedSize: number;
  timestamp: number;
}

/**
 * Custom hook to track local tasks over a rolling 24-hour retention window.
 */
export function useTaskHistory() {
  const [history, setHistory] = useState<TaskItem[]>([]);

  // Load and automatically clean up expired items older than 24 hours
//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem("uc_task_history");
//       if (stored) {
//         const parsed: TaskItem[] = JSON.parse(stored);
//         const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

//         // Rolling retention filter
//         const validTasks = parsed.filter((task) => task.timestamp > oneDayAgo);
//         // setHistory(validTasks);
//         setHistory(() => validTasks);

//         if (validTasks.length !== parsed.length) {
//           localStorage.setItem("uc_task_history", JSON.stringify(validTasks));
//         }
//       }
//     } catch (error) {
//       console.error("Failed to parse local task history:", error);
//     }
//   }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('uc_task_history');
      if (stored) {
        const parsed: TaskItem[] = JSON.parse(stored);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const validTasks = parsed.filter((task) => task.timestamp > oneDayAgo);
        
        // Pushing execution to the macro-task queue to completely bypass synchronous render alerts
        setTimeout(() => {
          setHistory(validTasks);
        }, 0);
        
        if (validTasks.length !== parsed.length) {
          localStorage.setItem('uc_task_history', JSON.stringify(validTasks));
        }
      }
    } catch (error) {
      console.error('Failed to parse local task history:', error);
    }
  }, []);


  const addTaskLog = (task: Omit<TaskItem, "id" | "timestamp">) => {
    const newLog: TaskItem = {
      ...task,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem("uc_task_history", JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to append task log:", error);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("uc_task_history");
    } catch (error) {
      console.error("Failed to clear task history repository:", error);
    }
  };

  return {
    history,
    addTaskLog,
    clearHistory,
  };
}
