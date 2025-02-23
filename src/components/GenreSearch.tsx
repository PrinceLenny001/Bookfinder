"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

// List of genres suitable for middle schoolers
const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Adventure",
  "Realistic Fiction",
  "Historical Fiction",
  "Graphic Novels",
  "Horror",
  "Poetry",
  "Biography",
  "Sports",
  "Humor",
] as const;

type Genre = (typeof GENRES)[number];

interface GenreSearchProps {
  onGenreSelect: (genre: Genre | null) => void;
  selectedGenre: Genre | null;
}

export function GenreSearch({ onGenreSelect, selectedGenre }: GenreSearchProps) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-lg font-medium">Choose a Genre</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreSelect(genre === selectedGenre ? null : genre)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                genre === selectedGenre
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              }
            `}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
} 