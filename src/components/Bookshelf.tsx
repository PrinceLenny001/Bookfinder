"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { type Book } from "@/lib/db/books";
import { BookCover } from "./BookCover";
import { BookModal } from "./BookModal";

interface BookshelfProps {
  className?: string;
}

export function Bookshelf({ className = "" }: BookshelfProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load books from localStorage
    const loadBooks = () => {
      try {
        const savedBooks = localStorage.getItem("bookshelf");
        if (savedBooks) {
          setBooks(JSON.parse(savedBooks));
        }
      } catch (error) {
        console.error("Error loading bookshelf:", error);
      }
    };

    loadBooks();

    // Listen for bookshelf updates
    window.addEventListener("bookshelfUpdate", loadBooks);
    return () => window.removeEventListener("bookshelfUpdate", loadBooks);
  }, []);

  const handleRemoveBook = (bookToRemove: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const updatedBooks = books.filter(
        book => book.id !== bookToRemove.id
      );
      
      localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
    } catch (error) {
      console.error("Error removing book from bookshelf:", error);
    }
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  const handleBookmarkToggle = (book: Book) => {
    try {
      const updatedBooks = books.filter(b => b.id !== book.id);
      localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  if (books.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          Your bookshelf is empty. Add books by clicking the bookmark icon when viewing book details.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <div 
            key={book.id}
            className="group relative cursor-pointer"
            onClick={() => handleBookClick(book)}
          >
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleRemoveBook(book, e)}
                className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                aria-label="Remove from bookshelf"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden mb-2">
              <BookCover
                title={book.title}
                author={book.author}
                coverOptions={book.coverOptions as any}
                externalCoverUrl={book.externalCoverUrl}
                className="w-full h-full object-cover transform transition-transform group-hover:scale-105"
              />
            </div>
            
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {book.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
              {book.author}
            </p>
          </div>
        ))}
      </div>
      
      {isModalOpen && selectedBook && (
        <BookModal 
          book={selectedBook} 
          onClose={handleCloseModal} 
          isBookmarked={true}
          onBookmarkToggle={handleBookmarkToggle}
        />
      )}
    </div>
  );
} 