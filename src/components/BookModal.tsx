"use client";

import { useState, useEffect } from "react";
import { X, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { type Book } from "@/lib/db/books";
import { generateBookDescription, getBookMetadata, type BookMetadata } from "@/lib/gemini";
import { BookCover } from "./BookCover";

interface BookModalProps {
  book: Book;
  onClose: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: (book: Book) => void;
}

export function BookModal({ 
  book, 
  onClose, 
  isBookmarked = false,
  onBookmarkToggle
}: BookModalProps) {
  const [description, setDescription] = useState<string | null>(book.description);
  const [metadata, setMetadata] = useState<BookMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  
  const coverOptions = book.coverOptions as { description: string; style: string; }[] | undefined;
  const hasMultipleCovers = coverOptions && coverOptions.length > 1;

  useEffect(() => {
    async function fetchBookDetails() {
      if (!book) return;
      
      setLoading(true);
      
      try {
        // If we don't have a description, fetch one
        if (!book.description) {
          const bookDescription = await generateBookDescription(book.title, book.author);
          setDescription(bookDescription);
        }
        
        // Fetch metadata
        const bookMetadata = await getBookMetadata(book.title, book.author);
        setMetadata(bookMetadata);
      } catch (error) {
        console.error("Error fetching book details:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookDetails();
  }, [book]);

  const handleCoverChange = (direction: 'next' | 'prev') => {
    if (!hasMultipleCovers) return;
    
    setSelectedCoverIndex(prev => {
      const maxIndex = (coverOptions?.length || 1) - 1;
      
      if (direction === 'next') {
        return prev >= maxIndex ? 0 : prev + 1;
      } else {
        return prev <= 0 ? maxIndex : prev - 1;
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {book.title}
          </h2>
          <div className="flex items-center gap-2">
            {onBookmarkToggle && (
              <button
                onClick={() => onBookmarkToggle(book)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isBookmarked ? "Remove from bookshelf" : "Add to bookshelf"}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5 text-blue-500" />
                ) : (
                  <Bookmark className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Book Cover */}
            <div className="relative aspect-[2/3] md:col-span-1">
              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
                <BookCover 
                  title={book.title}
                  author={book.author}
                  coverOptions={coverOptions}
                  selectedCoverIndex={selectedCoverIndex}
                  className="w-full h-full"
                />
                
                {hasMultipleCovers && (
                  <>
                    <button
                      onClick={() => handleCoverChange('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full p-2 hover:bg-white dark:hover:bg-gray-700"
                      aria-label="Previous cover"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleCoverChange('next')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full p-2 hover:bg-white dark:hover:bg-gray-700"
                      aria-label="Next cover"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              
              {coverOptions && selectedCoverIndex < coverOptions.length && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Style: {coverOptions[selectedCoverIndex].style}
                  </p>
                </div>
              )}
            </div>
            
            {/* Book Details */}
            <div className="md:col-span-2 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {book.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  by {book.author}
                </p>
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {book.lexileScore}L
                  </span>
                  {metadata?.ageRange && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {metadata.ageRange}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </h4>
                {loading ? (
                  <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : description ? (
                  <p className="text-gray-600 dark:text-gray-300">
                    {description}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No description available.
                  </p>
                )}
              </div>
              
              {/* Themes */}
              {metadata?.themes && metadata.themes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Themes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {metadata.themes.map((theme, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Content Warnings */}
              {metadata?.contentWarnings && metadata.contentWarnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Content Warnings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {metadata.contentWarnings.map((warning, index) => (
                      <span 
                        key={index}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      >
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 