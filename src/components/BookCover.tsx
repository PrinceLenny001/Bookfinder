"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface BookCoverProps {
  title: string;
  author: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

export function BookCover({ 
  title, 
  author, 
  onClick, 
  className = "",
  priority = false 
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const fetchCoverUrl = async () => {
      try {
        setIsLoading(true);
        setImageError(false);
        
        // Try to get OLID first
        const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`;
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to fetch book data');
        
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          const book = data.docs[0];
          
          // Try ISBN first
          if (book.isbn && book.isbn.length > 0) {
            const isbnUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
            const isbnResponse = await fetch(isbnUrl);
            if (isbnResponse.ok && isbnResponse.headers.get('content-type')?.includes('image')) {
              setCoverUrl(isbnUrl);
              setIsLoading(false);
              return;
            }
          }
          
          // Then try OLID
          if (book.key) {
            const olid = book.key.split('/')[2];
            const olidUrl = `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`;
            const olidResponse = await fetch(olidUrl);
            if (olidResponse.ok && olidResponse.headers.get('content-type')?.includes('image')) {
              setCoverUrl(olidUrl);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // Fallback to Google Books API
        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1`;
        const googleResponse = await fetch(googleUrl);
        if (!googleResponse.ok) throw new Error('Failed to fetch from Google Books');
        
        const googleData = await googleResponse.json();
        if (googleData.items && googleData.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
          // Convert from http to https and get larger image
          const googleCoverUrl = googleData.items[0].volumeInfo.imageLinks.thumbnail
            .replace('http://', 'https://')
            .replace('zoom=1', 'zoom=2');
          setCoverUrl(googleCoverUrl);
          setIsLoading(false);
          return;
        }
        
        throw new Error('No cover found');
      } catch (error) {
        console.error('Error fetching book cover:', error);
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchCoverUrl(), 1000 * (retryCount + 1));
        } else {
          setImageError(true);
          setIsLoading(false);
        }
      }
    };
    
    fetchCoverUrl();
  }, [title, author, retryCount]);
  
  // Fallback cover with title and author
  const FallbackCover = () => (
    <div 
      className="
        w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 
        dark:from-gray-800 dark:to-gray-700 rounded-lg 
        flex flex-col items-center justify-center p-4 text-center
        cursor-pointer hover:from-gray-200 hover:to-gray-300 
        dark:hover:from-gray-700 dark:hover:to-gray-600 
        transition-all duration-300
      "
      onClick={onClick}
    >
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{author}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div 
        data-testid="book-cover"
        className={`
          relative aspect-[2/3] rounded-lg overflow-hidden
          bg-gray-100 dark:bg-gray-800
          flex items-center justify-center
          ${className}
        `}
      >
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (imageError || !coverUrl) {
    return (
      <div 
        data-testid="book-cover"
        className={`relative aspect-[2/3] rounded-lg overflow-hidden shadow-md ${className}`}
      >
        <FallbackCover />
      </div>
    );
  }

  return (
    <div 
      data-testid="book-cover"
      className={`
        relative aspect-[2/3] rounded-lg overflow-hidden
        shadow-md hover:shadow-lg transition-all
        group cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      <Image
        src={coverUrl}
        alt={`Cover of ${title} by ${author}`}
        fill
        priority={priority}
        className="
          object-cover
          group-hover:scale-105 transition-transform duration-300
        "
        onError={() => setImageError(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />
      <div 
        className="
          absolute inset-0 bg-black/0 group-hover:bg-black/20
          transition-colors duration-300
        "
      />
    </div>
  );
} 