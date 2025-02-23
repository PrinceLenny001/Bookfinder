"use client";

import { api } from "@/lib/trpc/react";
import { type BookMetadata } from "@/lib/gemini";
import { AlertTriangle, BookOpen, Tag } from "lucide-react";

interface BookMetadataProps {
  title: string;
  author: string;
}

export function BookMetadata({ title, author }: BookMetadataProps) {
  const { data: metadata, isLoading, error } = api.books.getMetadata.useQuery(
    { title, author },
    {
      enabled: true,
    }
  );

  return (
    <div className="mt-4 space-y-4 text-sm">
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ) : error ? (
        <div className="text-red-500">{error.message}</div>
      ) : metadata ? (
        <>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Age Range:</span> {metadata.ageRange}
          </div>
          
          {metadata.contentWarnings.length > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-1" />
              <div>
                <span className="font-medium">Content Warnings:</span>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {metadata.contentWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {metadata.themes.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 mt-1" />
              <div>
                <span className="font-medium">Themes:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {metadata.themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
} 