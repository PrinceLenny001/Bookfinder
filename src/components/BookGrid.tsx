"use client";

import { type BookRecommendation } from "@/lib/gemini";
import { BookCover } from "./BookCover";

interface BookGridProps {
  books: BookRecommendation[];
  onBookClick?: (book: BookRecommendation) => void;
  className?: string;
}

export function BookGrid({ books, onBookClick, className = "" }: BookGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {books.map((book) => (
        <button
          key={`${book.title}-${book.author}`}
          onClick={() => onBookClick?.(book)}
          className="group relative flex flex-col items-center text-center hover:scale-105 transition-transform duration-200"
        >
          <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-200">
            <BookCover 
              title={book.title}
              author={book.author}
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="mt-2 w-full">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {book.title}
            </h3>
            <div className="flex flex-col items-center gap-1 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {book.author}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {book.lexileScore}L
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
} 