"use client";

import { useState, type ChangeEvent, useEffect, useCallback } from "react";
import { api } from "@/lib/trpc/react";
import { type Book } from "@/lib/db/books";
import { BookGrid } from "./BookGrid";
import { BookModal } from "./BookModal";
import { GenreSearch } from "./GenreSearch";
import { HelpCircle, Search, BookOpen, Shuffle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { TRPCClientError } from '@trpc/client';
import { Bookshelf } from "./Bookshelf";

interface LexileRangeInputProps {
  onRangeChange?: (min: number, max: number) => void;
  className?: string;
}

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Adventure",
  "Realistic Fiction",
  "Historical Fiction",
  "Graphic Novels",
  "Horror",
  "Poetry",
  "Biography",
  "Sports",
  "Humor",
  "Informational",
  "Autobiography",
  "Memoir",
  "Novel in Verse",
  "Dystopian"
] as const;

type Genre = (typeof GENRES)[number];

// Middle school Lexile ranges typically fall between 600L and 1000L
const DEFAULT_MIN_LEXILE = 600;
const DEFAULT_MAX_LEXILE = 1000;
const MIN_LEXILE = 0;
const MAX_LEXILE = 1500;

// Debounce helper
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function LexileRangeInput({ onRangeChange, className = "" }: LexileRangeInputProps) {
  const [minLexile, setMinLexile] = useState(DEFAULT_MIN_LEXILE);
  const [maxLexile, setMaxLexile] = useState(DEFAULT_MAX_LEXILE);
  const [searchTitle, setSearchTitle] = useState("");
  const [error, setError] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [debouncedMinLexile, setDebouncedMinLexile] = useState(DEFAULT_MIN_LEXILE);
  const [debouncedMaxLexile, setDebouncedMaxLexile] = useState(DEFAULT_MAX_LEXILE);

  const handleRangeChange = (e: ChangeEvent<HTMLInputElement>, isMin: boolean) => {
    const value = parseInt(e.target.value);
    
    if (isMin) {
      // When moving min slider, ensure it stays at least 100 below max
      const newMin = Math.max(MIN_LEXILE, Math.min(value, maxLexile - 100));
      setMinLexile(newMin);
      if (onRangeChange) {
        onRangeChange(newMin, maxLexile);
      }
    } else {
      // When moving max slider, ensure it stays at least 100 above min
      const newMax = Math.min(MAX_LEXILE, Math.max(value, minLexile + 100));
      setMaxLexile(newMax);
      if (onRangeChange) {
        onRangeChange(minLexile, newMax);
      }
    }
  };

  const handleDirectInput = (value: string, isMin: boolean) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    if (isMin) {
      // When setting min value, ensure it stays at least 100 below max
      const newMin = Math.max(MIN_LEXILE, Math.min(numValue, maxLexile - 100));
      setMinLexile(newMin);
      if (onRangeChange) {
        onRangeChange(newMin, maxLexile);
      }
    } else {
      // When setting max value, ensure it stays at least 100 above min
      const newMax = Math.min(MAX_LEXILE, Math.max(numValue, minLexile + 100));
      setMaxLexile(newMax);
      if (onRangeChange) {
        onRangeChange(minLexile, newMax);
      }
    }
  };

  // Debounced updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinLexile(minLexile);
      setDebouncedMaxLexile(maxLexile);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [minLexile, maxLexile]);

  // Use debounced values for API calls
  const recommendationsQuery = api.books.getRecommendations.useQuery(
    {
      minLexile: searchTitle ? MIN_LEXILE : debouncedMinLexile,
      maxLexile: searchTitle ? MAX_LEXILE : debouncedMaxLexile,
      genre: searchTitle ? null : selectedGenre,
      title: searchTitle.trim() || undefined,
    },
    {
      enabled: Boolean((debouncedMinLexile && debouncedMaxLexile && !error) || searchTitle.trim()),
      retry: 2,
      retryDelay: 1000,
    }
  );

  // Handle errors in the UI
  useEffect(() => {
    if (recommendationsQuery.error) {
      console.error("Error fetching recommendations:", recommendationsQuery.error);
      setError("Failed to fetch book recommendations. Please try again.");
    }
  }, [recommendationsQuery.error]);

  const shouldShowResults = recommendationsQuery.data && recommendationsQuery.data.length > 0;
  const noResultsFound = recommendationsQuery.data && recommendationsQuery.data.length === 0;

  const handleShuffle = () => {
    // Invalidate the current query to force a refetch
    recommendationsQuery.refetch();
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl shadow-sm mb-4">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Find Your Perfect Book</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        {showHelp && (
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
            <p className="font-medium">Here's how to find books that are just right for you:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Search by title or adjust the Lexile range slider</li>
              <li>Choose a genre you enjoy (optional)</li>
              <li>Click on any book to learn more about it</li>
            </ol>
          </div>
        )}
      </div>

      <Bookshelf className="mb-4" />

      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={searchTitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchTitle(e.target.value);
              setError("");
            }}
            placeholder="Search by title..."
            className="block w-full rounded-lg border-2 border-gray-200 dark:border-gray-700 pl-12 pr-4 py-3 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 transition-colors"
          />
          <Search className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" />
        </div>

        <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Lexile Range
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minLexile}
                    onChange={(e) => handleDirectInput(e.target.value, true)}
                    className="w-20 px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min={MIN_LEXILE}
                    max={maxLexile - 100}
                    step={10}
                  />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">L</span>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">to</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxLexile}
                    onChange={(e) => handleDirectInput(e.target.value, false)}
                    className="w-20 px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min={minLexile + 100}
                    max={MAX_LEXILE}
                    step={10}
                  />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">L</span>
                </div>
              </div>
            </div>
            <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-full transition-all duration-200 ease-out"
                style={{
                  left: `${(minLexile / MAX_LEXILE) * 100}%`,
                  right: `${100 - (maxLexile / MAX_LEXILE) * 100}%`,
                }}
              />
              <input
                type="range"
                min={MIN_LEXILE}
                max={MAX_LEXILE}
                value={minLexile}
                onChange={(e) => handleRangeChange(e, true)}
                className="absolute w-full h-4 bg-transparent appearance-none cursor-pointer z-20
                  pointer-events-none
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:w-6 
                  [&::-webkit-slider-thumb]:h-6 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-white 
                  [&::-webkit-slider-thumb]:border-2 
                  [&::-webkit-slider-thumb]:border-blue-500 
                  [&::-webkit-slider-thumb]:shadow-lg 
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:transition-transform 
                  [&::-webkit-slider-thumb]:duration-200 
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:hover:border-indigo-500
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:w-6 
                  [&::-moz-range-thumb]:h-6 
                  [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-white 
                  [&::-moz-range-thumb]:border-2 
                  [&::-moz-range-thumb]:border-blue-500 
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:transition-transform
                  [&::-moz-range-thumb]:duration-200
                  [&::-moz-range-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:hover:border-indigo-500"
              />
              <input
                type="range"
                min={MIN_LEXILE}
                max={MAX_LEXILE}
                value={maxLexile}
                onChange={(e) => handleRangeChange(e, false)}
                className="absolute w-full h-4 bg-transparent appearance-none cursor-pointer z-20
                  pointer-events-none
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:w-6 
                  [&::-webkit-slider-thumb]:h-6 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-white 
                  [&::-webkit-slider-thumb]:border-2 
                  [&::-webkit-slider-thumb]:border-blue-500 
                  [&::-webkit-slider-thumb]:shadow-lg 
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:transition-transform 
                  [&::-webkit-slider-thumb]:duration-200 
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:hover:border-indigo-500
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:w-6 
                  [&::-moz-range-thumb]:h-6 
                  [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-white 
                  [&::-moz-range-thumb]:border-2 
                  [&::-moz-range-thumb]:border-blue-500 
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:transition-transform
                  [&::-moz-range-thumb]:duration-200
                  [&::-moz-range-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:hover:border-indigo-500"
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{MIN_LEXILE}L</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{MAX_LEXILE}L</span>
            </div>
          </div>
        </div>

        <GenreSearch
          selectedGenre={selectedGenre}
          onGenreSelect={(genre) => {
            setSelectedGenre(genre);
            setError("");
          }}
        />
      </div>

      {error && (
        <ErrorMessage message={error} />
      )}

      {recommendationsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">
            Finding the perfect books for you...
          </p>
        </div>
      ) : recommendationsQuery.error ? (
        <ErrorMessage 
          message="Failed to fetch book recommendations. Please try again." 
          className="mt-6"
        />
      ) : shouldShowResults ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {selectedGenre ? `${selectedGenre} Books` : searchTitle ? 'Search Results' : 'Recommended Books'} 
              {!searchTitle && ' for Your Level'}
            </h3>
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Get new recommendations"
            >
              <Shuffle className="h-4 w-4" />
              <span>Shuffle</span>
            </button>
          </div>
          <BookGrid books={recommendationsQuery.data} onBookClick={setSelectedBook} />
        </div>
      ) : noResultsFound ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-lg text-gray-600 dark:text-gray-400">No books found matching your criteria.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Try adjusting your search terms or Lexile range.</p>
        </div>
      ) : null}

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
} 