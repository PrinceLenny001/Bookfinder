"use client";

import { useEffect } from "react";
import { api } from "@/lib/trpc/react";
import { type BookRecommendation } from "@/lib/gemini";
import { BookMetadata } from "./BookMetadata";
import { X } from "lucide-react";

interface BookModalProps {
  book: BookRecommendation;
  onClose: () => void;
}

export function BookModal({ book, onClose }: BookModalProps) {
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
    title: book.title,
    author: book.author,
  });

  const similarBooksQuery = api.books.getSimilarBooks.useQuery({
    bookTitle: book.title,
    genre: null,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{book.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <p className="text-lg mb-2">
              By <span className="font-medium">{book.author}</span>
            </p>
            {descriptionQuery.data && (
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {descriptionQuery.data}
              </p>
            )}
          </div>

          <BookMetadata title={book.title} author={book.author} />

          {similarBooksQuery.data && similarBooksQuery.data.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">You Might Also Like</h3>
              <ul className="space-y-2">
                {similarBooksQuery.data.map((similar, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{similar.title}</span> by{" "}
                    {similar.author}
                  </li>
                ))}
              </ul>
            </div>
          )}

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