"use client";

import { useState, useEffect } from "react";
import { type Book } from "@/lib/db/books";
import { BookModal } from "./BookModal";
import { BookCover } from "./BookCover";
import { Bookmark, X } from "lucide-react";

interface BookshelfProps {
  className?: string;
}

export function Bookshelf({ className = "" }: BookshelfProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    const loadBooks = () => {
      const savedBooks = localStorage.getItem("bookshelf");
      if (savedBooks) {
        try {
          const parsedBooks = JSON.parse(savedBooks) as Book[];
          setBooks(parsedBooks);
        } catch (error) {
          console.error("Failed to parse bookshelf data:", error);
          setBooks([]);
        }
      }
    };

    loadBooks();
    window.addEventListener("bookshelfUpdate", loadBooks);
    return () => window.removeEventListener("bookshelfUpdate", loadBooks);
  }, []);

  const removeFromBookshelf = (bookToRemove: Book) => {
    const updatedBooks = books.filter(
      book => book.title !== bookToRemove.title || book.author !== bookToRemove.author
    );
    setBooks(updatedBooks);
    localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
  };

  if (books.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-center ${className}`}>
        <div className="flex items-center justify-center mb-4">
          <Bookmark className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Your Bookshelf is Empty</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Click the bookmark icon on any book to add it to your bookshelf
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Your Bookshelf</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <div key={`${book.title}-${book.author}`} className="relative group">
            <button
              onClick={() => setSelectedBook(book)}
              className="text-left w-full"
            >
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden mb-2">
                <BookCover
                  book={book}
                  className="w-full h-full object-cover transform transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {book.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{book.author}</p>
            </button>
            <button
              onClick={() => removeFromBookshelf(book)}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Remove from bookshelf"
            >
              <X className="h-4 w-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>

      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
} 