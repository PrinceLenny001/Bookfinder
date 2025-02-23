"use client";

import Image from "next/image";
import { useState } from "react";

interface BookCoverProps {
  title: string;
  author: string;
  onClick?: () => void;
  className?: string;
}

export function BookCover({ title, author, onClick, className = "" }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  
  // Create a URL-safe identifier for the book
  const identifier = encodeURIComponent(`${title} ${author}`);
  
  // Open Library cover URL
  const coverUrl = `https://covers.openlibrary.org/b/title/${identifier}-L.jpg`;
  
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
      {!imageError ? (
        <>
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
        </>
      ) : (
        <FallbackCover />
      )}
    </div>
  );
} 