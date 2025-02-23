"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface BookCoverProps {
  title: string;
  author: string;
  onClick?: () => void;
  className?: string;
}

export function BookCover({ title, author, onClick, className = "" }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCoverUrl = async () => {
      try {
        // Try to get OLID first
        const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0) {
          const book = data.docs[0];
          
          // Try ISBN first
          if (book.isbn && book.isbn.length > 0) {
            setCoverUrl(`https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`);
            return;
          }
          
          // Then try OLID
          if (book.key) {
            const olid = book.key.split('/')[2];
            setCoverUrl(`https://covers.openlibrary.org/b/olid/${olid}-L.jpg`);
            return;
          }
        }
        
        // Fallback to title-based URL
        setCoverUrl(`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-L.jpg`);
      } catch (error) {
        console.error('Error fetching book cover:', error);
        setImageError(true);
      }
    };
    
    fetchCoverUrl();
  }, [title, author]);
  
  // Fallback cover with title and author
  const FallbackCover = () => (
    <div 
      className="
        w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg 
        flex flex-col items-center justify-center p-4 text-center
        cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors
      "
      onClick={onClick}
    >
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{author}</p>
    </div>
  );

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
    >
      <Image
        src={coverUrl}
        alt={`Cover of ${title} by ${author}`}
        fill
        className="
          object-cover
          group-hover:scale-105 transition-transform duration-300
        "
        onClick={onClick}
        onError={() => setImageError(true)}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />
      <div 
        className="
          absolute inset-0 bg-black/0 group-hover:bg-black/20
          transition-colors duration-300
        "
        onClick={onClick}
      />
    </div>
  );
} 