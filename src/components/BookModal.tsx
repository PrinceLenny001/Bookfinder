"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc/react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookMetadata } from "./BookMetadata";
import { X, Bookmark, BookmarkCheck } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { BookCover } from "./BookCover";
import { type Book } from "@/lib/db/books";

interface BookModalProps {
  book: Book | null;
  onClose: () => void;
}

export function BookModal({ book, onClose }: BookModalProps) {
  const [currentBook, setCurrentBook] = useState<Book | null>(book);
  const [bookHistory, setBookHistory] = useState<Book[]>(book ? [book] : []);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!book || !currentBook) return null;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const checkBookmark = () => {
      const savedBooks = JSON.parse(localStorage.getItem("bookshelf") || "[]") as Book[];
      setIsBookmarked(
        savedBooks.some(
          saved => saved.title === currentBook.title && saved.author === currentBook.author
        )
      );
    };

    checkBookmark();
    window.addEventListener("bookshelfUpdate", checkBookmark);
    return () => window.removeEventListener("bookshelfUpdate", checkBookmark);
  }, [currentBook]);

  const similarBooksQuery = api.books.getSimilarBooks.useQuery(
    {
      title: currentBook.title,
      author: currentBook.author,
      lexileScore: currentBook.lexileScore
    },
    { enabled: true }
  );

  const descriptionQuery = api.books.generateDescription.useQuery(
    { title: currentBook.title, author: currentBook.author },
    { enabled: true }
  );

  const metadataQuery = api.books.getMetadata.useQuery(
    { title: currentBook.title, author: currentBook.author },
    { enabled: true }
  );

  const handleBookClick = (newBook: Book) => {
    setBookHistory(prev => [...prev, newBook]);
    setCurrentBook(newBook);
  };

  const handleBack = () => {
    if (bookHistory.length > 1) {
      const newHistory = bookHistory.slice(0, -1);
      setBookHistory(newHistory);
      setCurrentBook(newHistory[newHistory.length - 1]);
    }
  };

  const handleBookmarkClick = () => {
    const savedBooks = JSON.parse(localStorage.getItem("bookshelf") || "[]") as Book[];
    
    if (isBookmarked) {
      // Remove from bookshelf
      const updatedBooks = savedBooks.filter(
        saved => saved.title !== currentBook.title || saved.author !== currentBook.author
      );
      localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
    } else {
      // Add to bookshelf
      savedBooks.push(currentBook);
      localStorage.setItem("bookshelf", JSON.stringify(savedBooks));
    }

    // Update bookmark state and notify other components
    setIsBookmarked(!isBookmarked);
    window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-2">
                {bookHistory.length > 1 && (
                  <button
                    onClick={handleBack}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    ← Back
                  </button>
                )}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {currentBook.title}
                </h2>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600 dark:text-gray-400">
                  by {currentBook.author}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {currentBook.lexileScore}L
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmarkClick}
                className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title={isBookmarked ? "Remove from bookshelf" : "Add to bookshelf"}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <BookCover
                  title={currentBook.title}
                  author={currentBook.author}
                  priority={true}
                  className="w-full max-w-sm mx-auto"
                />
              </div>

              <div className="w-full md:w-2/3 space-y-6">
                <div>
                  <p className="text-lg mb-2">
                    By <span className="font-medium">{currentBook.author}</span>
                  </p>
                  {descriptionQuery.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : descriptionQuery.error ? (
                    <ErrorMessage 
                      message="Failed to load book description" 
                      className="mt-2"
                    />
                  ) : descriptionQuery.data ? (
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {descriptionQuery.data}
                    </p>
                  ) : null}
                </div>

                <BookMetadata title={currentBook.title} author={currentBook.author} />

                {similarBooksQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : similarBooksQuery.error ? (
                  <ErrorMessage 
                    message="Failed to load similar books" 
                    className="mt-2"
                  />
                ) : similarBooksQuery.data && similarBooksQuery.data.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Similar Books</h3>
                    <ul className="space-y-1">
                      {similarBooksQuery.data.map((similar: Book, index: number) => (
                        <li key={index}>
                          <button
                            onClick={() => handleBookClick(similar)}
                            className="text-sm text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                          >
                            <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                              {similar.title}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400"> by {similar.author}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <p>
                Tip: Click anywhere outside this window or press the Escape key to
                close
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
} 