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
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {books.map((book, index) => (
        <BookCover
          key={`${book.title}-${book.author}-${index}`}
          title={book.title}
          author={book.author}
          onClick={() => onBookClick?.(book)}
        />
      ))}
    </div>
  );
} 