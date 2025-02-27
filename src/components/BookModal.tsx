"use client";

import { useState, useEffect } from "react";
import { X, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { type Book } from "@/lib/db/books";
import { generateBookDescription, getBookMetadata, getSimilarBooks, type BookMetadata, type BookRecommendation } from "@/lib/gemini";
import { BookCover } from "./BookCover";
import { api } from "@/lib/trpc/react";

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
  const [similarBooks, setSimilarBooks] = useState<BookRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [currentBook, setCurrentBook] = useState<Book>(book);
  const [currentIsBookmarked, setCurrentIsBookmarked] = useState<boolean>(isBookmarked);
  const [bookshelfBooks, setBookshelfBooks] = useState<Book[]>([]);
  
  // Initialize the tRPC mutation
  const findOrCreateBookMutation = api.books.findOrCreateBook.useMutation();
  
  const coverOptions = currentBook.coverOptions as { description: string; style: string; }[] | undefined;
  const hasMultipleCovers = coverOptions && coverOptions.length > 1;

  // Load bookshelf books from localStorage
  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem("bookshelf");
      if (savedBooks) {
        setBookshelfBooks(JSON.parse(savedBooks));
      }
    } catch (error) {
      console.error("Error loading bookshelf:", error);
    }
  }, []);

  // Check if a book is bookmarked
  const checkIsBookmarked = (bookToCheck: Book): boolean => {
    return bookshelfBooks.some(b => b.id === bookToCheck.id);
  };

  useEffect(() => {
    async function fetchBookDetails() {
      if (!currentBook) return;
      
      setLoading(true);
      
      try {
        // If we don't have a description, fetch one
        if (!currentBook.description) {
          const bookDescription = await generateBookDescription(currentBook.title, currentBook.author);
          setDescription(bookDescription);
        } else {
          setDescription(currentBook.description);
        }
        
        // Fetch metadata
        const bookMetadata = await getBookMetadata(currentBook.title, currentBook.author);
        console.log("Fetched metadata:", bookMetadata);
        setMetadata(bookMetadata);
        
        // Fetch similar books only if metadata doesn't have them
        if (!bookMetadata.similarBooks || bookMetadata.similarBooks.length === 0) {
          const recommendations = await getSimilarBooks(currentBook.title);
          console.log("Fetched similar books:", recommendations);
          setSimilarBooks(recommendations);
        } else {
          // Convert metadata similar books to BookRecommendation format
          const metadataSimilarBooks: BookRecommendation[] = bookMetadata.similarBooks.map(book => ({
            title: book.title,
            author: book.author,
            lexileScore: typeof book.lexileScore === 'number' ? book.lexileScore : 0,
            description: book.description
          }));
          setSimilarBooks(metadataSimilarBooks);
        }
      } catch (error) {
        console.error("Error fetching book details:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookDetails();
  }, [currentBook]);

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

  // Handle clicking on a similar book
  const handleSimilarBookClick = async (similarBook: any) => {
    try {
      setLoading(true);
      // Find or create the book using tRPC mutation
      const book = await findOrCreateBookMutation.mutateAsync({
        title: similarBook.title,
        author: similarBook.author,
        lexileScore: typeof similarBook.lexileScore === 'number' ? similarBook.lexileScore : 0,
        description: similarBook.description || null
      });
      
      // Update the current book and reset state
      setCurrentBook(book);
      setSelectedCoverIndex(0);
      setCurrentIsBookmarked(checkIsBookmarked(book));
      
      // Reset metadata and similar books to trigger a fresh fetch
      setMetadata(null);
      setSimilarBooks([]);
    } catch (error) {
      console.error("Error loading similar book:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle bookmarking a similar book
  const handleSimilarBookBookmark = async (similarBook: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Find or create the book using tRPC mutation
      const book = await findOrCreateBookMutation.mutateAsync({
        title: similarBook.title,
        author: similarBook.author,
        lexileScore: typeof similarBook.lexileScore === 'number' ? similarBook.lexileScore : 0,
        description: similarBook.description || null
      });
      
      // Add to bookshelf
      const updatedBooks = [...bookshelfBooks, book];
      localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
      setBookshelfBooks(updatedBooks);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
    } catch (error) {
      console.error("Error bookmarking similar book:", error);
    }
  };

  // Handle toggling bookmark for current book
  const handleBookmarkToggle = () => {
    if (!currentBook) return;
    
    try {
      if (currentIsBookmarked) {
        // Remove from bookshelf
        const updatedBooks = bookshelfBooks.filter(b => b.id !== currentBook.id);
        localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
        setBookshelfBooks(updatedBooks);
        setCurrentIsBookmarked(false);
      } else {
        // Add to bookshelf
        const updatedBooks = [...bookshelfBooks, currentBook];
        localStorage.setItem("bookshelf", JSON.stringify(updatedBooks));
        setBookshelfBooks(updatedBooks);
        setCurrentIsBookmarked(true);
      }
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('bookshelfUpdate'));
      
      // Call the parent's onBookmarkToggle if provided
      if (onBookmarkToggle) {
        onBookmarkToggle(currentBook);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
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
            {currentBook.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmarkToggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={currentIsBookmarked ? "Remove from bookshelf" : "Add to bookshelf"}
            >
              {currentIsBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-blue-500" />
              ) : (
                <Bookmark className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
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
                  title={currentBook.title}
                  author={currentBook.author}
                  coverOptions={coverOptions}
                  externalCoverUrl={currentBook.externalCoverUrl}
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
              
              {coverOptions && selectedCoverIndex < coverOptions.length && !currentBook.externalCoverUrl && (
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
                  {currentBook.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  by {currentBook.author}
                </p>
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {currentBook.lexileScore}L
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
              
              {/* Similar Books */}
              {(similarBooks.length > 0 || (metadata?.similarBooks && metadata.similarBooks.length > 0)) && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Similar Books You Might Enjoy
                  </h4>
                  {loading ? (
                    <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {/* Show metadata similar books first if available */}
                      {metadata?.similarBooks && metadata.similarBooks.length > 0 ? (
                        metadata.similarBooks.map((similarBook, index) => {
                          const isInBookshelf = bookshelfBooks.some(
                            b => b.title.toLowerCase() === similarBook.title.toLowerCase() && 
                                 b.author.toLowerCase() === similarBook.author.toLowerCase()
                          );
                          
                          return (
                            <div 
                              key={`metadata-${index}`}
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative"
                              onClick={() => handleSimilarBookClick(similarBook)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {similarBook.title}
                                  </h5>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    by {similarBook.author}
                                  </p>
                                  {similarBook.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                      {similarBook.description}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0 flex flex-col gap-2 items-end">
                                  {similarBook.lexileScore && similarBook.lexileScore > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {similarBook.lexileScore}L
                                    </span>
                                  )}
                                  {!isInBookshelf && (
                                    <button
                                      onClick={(e) => handleSimilarBookBookmark(similarBook, e)}
                                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      aria-label="Add to bookshelf"
                                    >
                                      <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Fall back to similar books from API
                        similarBooks.map((similarBook, index) => {
                          const isInBookshelf = bookshelfBooks.some(
                            b => b.title.toLowerCase() === similarBook.title.toLowerCase() && 
                                 b.author.toLowerCase() === similarBook.author.toLowerCase()
                          );
                          
                          return (
                            <div 
                              key={`api-${index}`}
                              className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative"
                              onClick={() => handleSimilarBookClick(similarBook)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {similarBook.title}
                                  </h5>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    by {similarBook.author}
                                  </p>
                                  {similarBook.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                      {similarBook.description}
                                    </p>
                                  )}
                                  {similarBook.lexileScore > 0 && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {similarBook.lexileScore}L
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {!isInBookshelf && (
                                  <button
                                    onClick={(e) => handleSimilarBookBookmark(similarBook, e)}
                                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="Add to bookshelf"
                                  >
                                    <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 