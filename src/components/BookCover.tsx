"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { fetchBookCover } from "@/lib/utils/bookCovers";

interface BookCoverProps {
  title: string;
  author: string;
  coverOptions?: {
    description: string;
    style: string;
  }[];
  externalCoverUrl?: string | null;
  selectedCoverIndex?: number;
  className?: string;
}

export function BookCover({ 
  title, 
  author, 
  coverOptions, 
  externalCoverUrl: initialExternalCoverUrl,
  selectedCoverIndex = 0,
  className = "" 
}: BookCoverProps) {
  const [externalCoverUrl, setExternalCoverUrl] = useState<string | null>(initialExternalCoverUrl || null);
  const [imageError, setImageError] = useState(false);
  
  // Reset states when title or author changes
  useEffect(() => {
    setExternalCoverUrl(initialExternalCoverUrl || null);
    setImageError(false);
  }, [title, author, initialExternalCoverUrl]);
  
  // Fetch external cover if not provided
  useEffect(() => {
    if (!initialExternalCoverUrl && !externalCoverUrl && !imageError) {
      const fetchCover = async () => {
        try {
          const coverUrl = await fetchBookCover(title, author);
          setExternalCoverUrl(coverUrl);
        } catch (error) {
          console.error("Error fetching book cover:", error);
          setImageError(true);
        }
      };
      
      fetchCover();
    }
  }, [title, author, initialExternalCoverUrl, externalCoverUrl, imageError]);
  
  // Generate a fallback cover style
  const coverStyle = useMemo(() => {
    const selectedCover = coverOptions?.[selectedCoverIndex];
    
    if (!selectedCover) {
      // Generate a consistent color based on title and author
      const hash = (title + author).split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      const hue1 = Math.abs(hash % 360);
      const hue2 = (hue1 + 40) % 360;
      
      return {
        background: `linear-gradient(135deg, hsl(${hue1}, 70%, 85%), hsl(${hue2}, 70%, 75%))`,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      };
    }
    
    // Create a unique but consistent background based on the cover description
    const colors = getColorsFromDescription(selectedCover.description);
    
    return {
      background: selectedCover.style.includes('gradient') 
        ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
        : colors[0],
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
    };
  }, [title, author, coverOptions, selectedCoverIndex]);

  // Generate a pattern for the cover background
  const patternStyle = useMemo(() => {
    const hash = (title + author).split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const patternType = Math.abs(hash) % 5;
    
    switch (patternType) {
      case 0:
        return { backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.2) 1%, transparent 1%), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 1%, transparent 1%)' };
      case 1:
        return { backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.1) 75%, transparent 75%, transparent)' };
      case 2:
        return { backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px)' };
      case 3:
        return { backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 8%, transparent 8%)' };
      case 4:
      default:
        return { backgroundImage: 'none' };
    }
  }, [title, author]);

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  // If we have an external cover URL and no error, show the image
  if (externalCoverUrl && !imageError) {
    return (
      <div className={`relative w-full h-full overflow-hidden rounded-md ${className}`}>
        <Image
          src={externalCoverUrl}
          alt={`Cover for ${title} by ${author}`}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover"
          onError={handleImageError}
        />
      </div>
    );
  }

  // Otherwise, show the generated cover
  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-md ${className}`}
      style={{...coverStyle, ...patternStyle, backgroundSize: '20px 20px'}}
    >
      {/* Book spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-black/10 dark:bg-white/10"></div>
      
      {/* Book title and author */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-md w-full shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-3">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {author}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function for generating consistent colors
function getColorsFromDescription(description: string): [string, string] {
  // Generate consistent colors based on the description
  const hash = description.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;

  return [
    `hsl(${hue1}, 70%, 90%)`,
    `hsl(${hue2}, 70%, 85%)`
  ];
} 