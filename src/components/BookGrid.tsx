"use client";

import { useState } from "react";
import { type Book } from "@/lib/db/books";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCover } from "./BookCover";

interface BookGridProps {
  books: Book[] | undefined;
  onBookClick?: (book: Book) => void;
  className?: string;
}

export function BookGrid({ books, onBookClick, className = "" }: BookGridProps) {
  const [selectedCovers, setSelectedCovers] = useState<Record<string, number>>({});

  const handleCoverChange = (bookId: string, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCovers(prev => {
      const currentIndex = prev[bookId] || 0;
      const book = books?.find(b => b.id === bookId);
      const coverOptions = book?.coverOptions as { description: string; style: string; }[] | undefined;
      const maxIndex = (coverOptions?.length || 1) - 1;
      
      let newIndex;
      if (direction === 'next') {
        newIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
      }
      
      return { ...prev, [bookId]: newIndex };
    });
  };

  if (!books || books.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No books found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {books.map((book) => {
        const coverOptions = book.coverOptions as { description: string; style: string; }[] | undefined;
        const hasMultipleCovers = coverOptions && coverOptions.length > 1;
        const selectedCoverIndex = selectedCovers[book.id] || 0;

        return (
          <div
            key={book.id}
            className="group relative flex flex-col items-center text-center hover:scale-105 transition-transform duration-200"
            onClick={() => onBookClick?.(book)}
          >
            <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-200 relative">
              <BookCover 
                title={book.title}
                author={book.author}
                coverOptions={coverOptions}
                externalCoverUrl={book.externalCoverUrl}
                selectedCoverIndex={selectedCoverIndex}
                className="w-full h-full object-cover"
              />
              
              {hasMultipleCovers && (
                <>
                  <button
                    onClick={(e) => handleCoverChange(book.id, 'prev', e)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white dark:hover:bg-gray-700"
                    aria-label="Previous cover"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleCoverChange(book.id, 'next', e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white dark:hover:bg-gray-700"
                    aria-label="Next cover"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
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
          </div>
        );
      })}
    </div>
  );
}

// Helper functions for generating consistent colors
function getRandomColor() {
  const colors = [
    '#E6F3FF', '#FFE6E6', '#E6FFE6', '#FFE6F3', '#F3E6FF',
    '#E6FFF3', '#FFF3E6', '#F3FFE6', '#FFE6FF', '#E6FFE6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getColorsFromDescription(description: string): [string, string] {
  // Generate consistent colors based on the description
  const hash = description.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;

  return [
    `hsl(${hue1}, 70%, 90%)`,
    `hsl(${hue2}, 70%, 85%)`
  ];
} 