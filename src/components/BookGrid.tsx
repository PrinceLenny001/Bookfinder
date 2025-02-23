"use client";

import { BookCover } from "./BookCover";
import type { BookRecommendation } from "@/lib/gemini";

interface BookGridProps {
  books: BookRecommendation[];
  onBookClick?: (book: BookRecommendation) => void;
  className?: string;
}

export function BookGrid({ books, onBookClick, className = "" }: BookGridProps) {
  if (!books?.length) {
    return null;
  }

  return (
    <div 
      className={`
        grid gap-4
        grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
        auto-rows-fr
        ${className}
      `}
    >
      {books.map((book, index) => (
        <div key={`${book.title}-${book.author}-${index}`} className="h-full">
          <BookCover
            title={book.title}
            author={book.author}
            onClick={() => onBookClick?.(book)}
            className="h-full"
          />
        </div>
      ))}
    </div>
  );
} 