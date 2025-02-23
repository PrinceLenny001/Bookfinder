"use client";

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <div 
      className={`
        flex items-center gap-2 p-4 rounded-lg
        bg-red-50 dark:bg-red-900/20
        text-red-600 dark:text-red-400
        ${className}
      `}
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
} 