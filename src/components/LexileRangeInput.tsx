"use client";

import { useState, type ChangeEvent } from "react";
import { api } from "@/lib/trpc/react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookGrid } from "./BookGrid";
import { BookModal } from "./BookModal";
import { GenreSearch } from "./GenreSearch";
import { HelpCircle, Search } from "lucide-react";
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

  const handleRangeChange = (value: number, isMin: boolean) => {
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
      title: searchTitle || undefined,
    },
    {
      enabled: Boolean((minLexile && maxLexile && !error) || searchTitle),
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
              <li>Search by title or adjust the Lexile range slider</li>
              <li>Choose a genre you enjoy (optional)</li>
              <li>Click on any book to learn more about it</li>
            </ol>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchTitle}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTitle(e.target.value)}
            placeholder="Search by title..."
            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 pl-10 pr-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
            >
              Lexile Range: {minLexile}L - {maxLexile}L
            </label>
            <div className="space-y-4">
              <div>
                <input
                  type="range"
                  min={MIN_LEXILE}
                  max={MAX_LEXILE}
                  value={minLexile}
                  onChange={(e) => handleRangeChange(parseInt(e.target.value), true)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
                />
              </div>
              <div>
                <input
                  type="range"
                  min={MIN_LEXILE}
                  max={MAX_LEXILE}
                  value={maxLexile}
                  onChange={(e) => handleRangeChange(parseInt(e.target.value), false)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
                />
              </div>
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
            {selectedGenre ? `${selectedGenre} Books` : searchTitle ? 'Search Results' : 'Recommended Books'} 
            {!searchTitle && ' for Your Level'}
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