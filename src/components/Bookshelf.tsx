"use client";

import { useState, useEffect } from "react";
import { BookOpen, X, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookGrid } from "./BookGrid";
import { BookModal } from "./BookModal";
import { api } from "@/lib/trpc/react";

interface BookshelfProps {
  className?: string;
}

export function Bookshelf({ className = "" }: BookshelfProps) {
  const [savedBooks, setSavedBooks] = useState<BookRecommendation[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookRecommendation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadSavedBooks = () => {
    const saved = localStorage.getItem("bookshelf");
    if (saved) {
      setSavedBooks(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadSavedBooks();
    // Listen for bookshelf updates
    window.addEventListener('bookshelfUpdate', loadSavedBooks);
    return () => window.removeEventListener('bookshelfUpdate', loadSavedBooks);
  }, []);

  const removeFromBookshelf = (book: BookRecommendation) => {
    const newBooks = savedBooks.filter(
      (b) => !(b.title === book.title && b.author === book.author)
    );
    setSavedBooks(newBooks);
    localStorage.setItem("bookshelf", JSON.stringify(newBooks));
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
  };

  const bookMetadataQueries = api.useQueries(router => 
    savedBooks.map(book => 
      router.books.getMetadata({
        title: book.title,
        author: book.author,
      })
    )
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Your Bookshelf
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({savedBooks.length} {savedBooks.length === 1 ? "book" : "books"})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? "Hide" : "Show"} books
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {savedBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedBooks.map((book, index) => (
                <div
                  key={`${book.title}-${book.author}`}
                  className="relative group"
                >
                  <button
                    onClick={() => setSelectedBook(book)}
                    className="w-full text-left p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {book.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {book.author}
                      </p>
                      {bookMetadataQueries[index]?.data?.lexileScore && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {bookMetadataQueries[index].data.lexileScore}L
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => removeFromBookshelf(book)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Your bookshelf is empty
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Click the bookmark icon on any book to save it here
              </p>
            </div>
          )}
        </div>
      )}

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
} 