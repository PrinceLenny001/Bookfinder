"use client";

import { useState, type ChangeEvent, useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookGrid } from "./BookGrid";
import { BookModal } from "./BookModal";
import { GenreSearch } from "./GenreSearch";
import { HelpCircle, Search, BookOpen } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { TRPCClientError } from '@trpc/client';

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

export function LexileRangeInput({ onRangeChange, className = "" }: LexileRangeInputProps) {
  const [minLexile, setMinLexile] = useState(DEFAULT_MIN_LEXILE);
  const [maxLexile, setMaxLexile] = useState(DEFAULT_MAX_LEXILE);
  const [searchTitle, setSearchTitle] = useState("");
  const [error, setError] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<BookRecommendation | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleRangeChange = (e: ChangeEvent<HTMLInputElement>, isMin: boolean) => {
    const value = parseInt(e.target.value);
    if (isMin) {
      setMinLexile(Math.min(value, maxLexile - 100));
    } else {
      setMaxLexile(Math.max(value, minLexile + 100));
    }

    if (onRangeChange) {
      onRangeChange(
        isMin ? value : minLexile,
        isMin ? maxLexile : value
      );
    }
  };

  const recommendationsQuery = api.books.getRecommendations.useQuery(
    {
      minLexile,
      maxLexile,
      genre: selectedGenre,
      title: searchTitle.trim() || undefined,
    },
    {
      enabled: Boolean((minLexile && maxLexile && !error) || searchTitle.trim()),
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
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Lexile Range
              </label>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {minLexile}L - {maxLexile}L
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="absolute h-full bg-blue-500 dark:bg-blue-600 rounded-full"
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
                className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500"
              />
              <input
                type="range"
                min={MIN_LEXILE}
                max={MAX_LEXILE}
                value={maxLexile}
                onChange={(e) => handleRangeChange(e, false)}
                className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500"
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{MIN_LEXILE}L</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{MAX_LEXILE}L</span>
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
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {selectedGenre ? `${selectedGenre} Books` : searchTitle ? 'Search Results' : 'Recommended Books'} 
            {!searchTitle && ' for Your Level'}
          </h3>
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