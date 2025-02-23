"use client";

import { useState, type ChangeEvent } from "react";
import { api } from "@/lib/trpc/react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookGrid } from "./BookGrid";
import { BookModal } from "./BookModal";
import { GenreSearch } from "./GenreSearch";
import { HelpCircle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";

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
] as const;

type Genre = (typeof GENRES)[number];

export function LexileRangeInput({ onRangeChange, className = "" }: LexileRangeInputProps) {
  const [minLexile, setMinLexile] = useState("");
  const [maxLexile, setMaxLexile] = useState("");
  const [error, setError] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<BookRecommendation | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (value: string, isMin: boolean) => {
    const numValue = value.replace(/[^0-9]/g, "");
    if (isMin) {
      setMinLexile(numValue);
    } else {
      setMaxLexile(numValue);
    }

    if (numValue && (parseInt(numValue) < 0 || parseInt(numValue) > 2000)) {
      setError("Lexile range should be between 0 and 2000");
    } else {
      setError("");
    }

    if (onRangeChange) {
      onRangeChange(
        parseInt(isMin ? numValue : minLexile) || 0,
        parseInt(isMin ? maxLexile : numValue) || 0
      );
    }
  };

  const recommendationsQuery = api.books.getRecommendations.useQuery(
    {
      minLexile: parseInt(minLexile) || 0,
      maxLexile: parseInt(maxLexile) || 0,
      genre: selectedGenre,
    },
    {
      enabled: Boolean(minLexile && maxLexile && !error),
    }
  );

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
          Find Your Perfect Book
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </h2>
        {showHelp && (
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>Here's how to find books that are just right for you:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter your Lexile range (ask your teacher if you're not sure)</li>
              <li>Choose a genre you enjoy (optional)</li>
              <li>Click on any book to learn more about it</li>
            </ol>
          </div>
        )}
      </div>

      <div className="space-y-4">
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

        <GenreSearch
          selectedGenre={selectedGenre}
          onGenreSelect={setSelectedGenre}
        />
      </div>

      {error && (
        <ErrorMessage message={error} />
      )}

      {recommendationsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Finding the perfect books for you...
          </p>
        </div>
      ) : recommendationsQuery.error ? (
        <ErrorMessage 
          message={recommendationsQuery.error.message} 
          className="mt-4"
        />
      ) : recommendationsQuery.data ? (
        <>
          <h3 className="text-lg font-medium mb-4">
            {selectedGenre ? `${selectedGenre} Books` : 'Recommended Books'} for Your Level
          </h3>
          <BookGrid books={recommendationsQuery.data} onBookClick={setSelectedBook} />
        </>
      ) : null}

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
} 