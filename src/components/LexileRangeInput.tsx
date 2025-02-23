"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { toast } from "react-toastify";
import type { BookRecommendation } from "@/lib/gemini";

interface LexileRangeInputProps {
  onRangeChange?: (min: number, max: number) => void;
  className?: string;
}

export function LexileRangeInput({ onRangeChange, className = "" }: LexileRangeInputProps) {
  const [minLexile, setMinLexile] = useState<string>("");
  const [maxLexile, setMaxLexile] = useState<string>("");
  const [error, setError] = useState<string>("");

  const recommendationsQuery = api.books.getRecommendations.useQuery(
    {
      minLexile: parseInt(minLexile) || 0,
      maxLexile: parseInt(maxLexile) || 0,
    },
    {
      enabled: Boolean(minLexile && maxLexile && !error),
      retry: false,
    }
  );

  useEffect(() => {
    if (recommendationsQuery.error) {
      toast.error("Failed to get book recommendations: " + recommendationsQuery.error.message);
    }
  }, [recommendationsQuery.error]);

  const handleChange = (value: string, isMin: boolean) => {
    // Remove non-numeric characters except minus sign
    const numericValue = value.replace(/[^\d-]/g, "");
    
    if (isMin) {
      setMinLexile(numericValue);
    } else {
      setMaxLexile(numericValue);
    }

    // Validate and update parent
    if (numericValue && !isMin && minLexile) {
      const min = parseInt(minLexile);
      const max = parseInt(numericValue);
      
      if (min > max) {
        setError("Minimum Lexile must be less than maximum");
      } else {
        setError("");
        onRangeChange?.(min, max);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label 
            htmlFor="min-lexile" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
          >
            Minimum Lexile
          </label>
          <div className="relative">
            <input
              id="min-lexile"
              type="text"
              value={minLexile}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, true)}
              placeholder="e.g. 600"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
            />
            <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">L</span>
          </div>
        </div>
        <div className="flex-1">
          <label 
            htmlFor="max-lexile" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
          >
            Maximum Lexile
          </label>
          <div className="relative">
            <input
              id="max-lexile"
              type="text"
              value={maxLexile}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(e.target.value, false)}
              placeholder="e.g. 800"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
            />
            <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">L</span>
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {recommendationsQuery.isLoading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading recommendations...</p>
      )}
      {recommendationsQuery.data && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recommended Books</h3>
          <ul className="space-y-2">
            {recommendationsQuery.data.map((book: BookRecommendation, index: number) => (
              <li key={index} className="text-sm">
                <span className="font-medium">{book.title}</span> by {book.author}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 