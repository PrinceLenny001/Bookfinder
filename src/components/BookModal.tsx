"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc/react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookMetadata } from "./BookMetadata";
import { X } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { BookCover } from "./BookCover";

interface BookModalProps {
  book: BookRecommendation;
  onClose: () => void;
}

export function BookModal({ book: initialBook, onClose }: BookModalProps) {
  const [currentBook, setCurrentBook] = useState<BookRecommendation>(initialBook);
  const [bookHistory, setBookHistory] = useState<BookRecommendation[]>([initialBook]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const descriptionQuery = api.books.generateDescription.useQuery({
    title: currentBook.title,
    author: currentBook.author,
  });

  const similarBooksQuery = api.books.getSimilarBooks.useQuery({
    bookTitle: currentBook.title,
    genre: null,
  });

  const handleBookClick = (book: BookRecommendation) => {
    setBookHistory(prev => [...prev, book]);
    setCurrentBook(book);
  };

  const handleBack = () => {
    if (bookHistory.length > 1) {
      const newHistory = bookHistory.slice(0, -1);
      setBookHistory(newHistory);
      setCurrentBook(newHistory[newHistory.length - 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {bookHistory.length > 1 && (
              <button
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                ← Back
              </button>
            )}
            <h2 className="text-xl font-semibold">{currentBook.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
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
                <div>
                  <h3 className="text-lg font-medium mb-3">You Might Also Like</h3>
                  <ul className="space-y-2">
                    {similarBooksQuery.data.map((similar, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleBookClick(similar)}
                          className="text-sm text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                        >
                          <span className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {similar.title}
                          </span>{" "}
                          by {similar.author}
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
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
} 