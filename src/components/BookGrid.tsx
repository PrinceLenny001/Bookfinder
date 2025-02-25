"use client";

import { useState } from "react";
import { type Book } from "@/lib/db/books";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookGridProps {
  books: Book[];
  onBookClick: (book: Book) => void;
}

export function BookGrid({ books, onBookClick }: BookGridProps) {
  const [selectedCovers, setSelectedCovers] = useState<Record<string, number>>({});

  const handleCoverChange = (bookId: string, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCovers(prev => {
      const currentIndex = prev[bookId] || 0;
      const book = books.find(b => b.id === bookId);
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

  const getCoverStyle = (book: Book) => {
    const coverOptions = book.coverOptions as { description: string; style: string; }[] | undefined;
    const selectedIndex = selectedCovers[book.id] || 0;
    const selectedCover = coverOptions?.[selectedIndex];

    if (!selectedCover) {
      return {
        background: `linear-gradient(to bottom right, ${getRandomColor()}, ${getRandomColor()})`,
      };
    }

    // Create a unique but consistent background based on the cover description
    const colors = getColorsFromDescription(selectedCover.description);
    
    return {
      background: selectedCover.style === 'gradient' 
        ? `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})`
        : colors[0],
      opacity: 0.9,
    };
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {books.map((book) => {
        const coverOptions = book.coverOptions as { description: string; style: string; }[] | undefined;
        const hasMultipleCovers = coverOptions && coverOptions.length > 1;
        const selectedCover = coverOptions?.[selectedCovers[book.id] || 0];

        return (
          <div
            key={book.id}
            className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
            onClick={() => onBookClick(book)}
          >
            <div className="relative aspect-[2/3] cursor-pointer">
              {/* Book Cover */}
              <div 
                className="absolute inset-0 transition-all duration-300"
                style={getCoverStyle(book)}
              >
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

              {/* Book Info */}
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-black/0 group-hover:bg-black/40 transition-all duration-200">
                <div className="opacity-100 group-hover:opacity-100 transition-opacity">
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white mb-1">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-200">
                    {book.author}
                  </p>
                  {book.lexileScore && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-300 mt-1">
                      {book.lexileScore}L
                    </p>
                  )}
                  {selectedCover && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-300 mt-2 italic">
                      Style: {selectedCover.style}
                    </p>
                  )}
                </div>
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