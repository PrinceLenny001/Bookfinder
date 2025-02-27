"use client";

import { useMemo } from "react";

interface BookCoverProps {
  title: string;
  author: string;
  coverOptions?: {
    description: string;
    style: string;
  }[];
  selectedCoverIndex?: number;
  className?: string;
}

export function BookCover({ 
  title, 
  author, 
  coverOptions, 
  selectedCoverIndex = 0,
  className = "" 
}: BookCoverProps) {
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
        background: `linear-gradient(to bottom right, hsl(${hue1}, 70%, 85%), hsl(${hue2}, 70%, 75%))`,
      };
    }
    
    // Create a unique but consistent background based on the cover description
    const colors = getColorsFromDescription(selectedCover.description);
    
    return {
      background: selectedCover.style.includes('gradient') 
        ? `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})`
        : colors[0],
    };
  }, [title, author, coverOptions, selectedCoverIndex]);

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={coverStyle}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base mb-1 line-clamp-3">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {author}
        </p>
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