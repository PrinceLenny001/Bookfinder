"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import type { BookRecommendation } from "@/lib/gemini";
import { api } from "@/lib/trpc/react";

interface BookModalProps {
  book: BookRecommendation | null;
  onClose: () => void;
}

export function BookModal({ book, onClose }: BookModalProps) {
  const descriptionQuery = api.books.generateDescription.useQuery(
    {
      title: book?.title || "",
      author: book?.author || "",
    },
    {
      enabled: !!book && !book.description,
      retry: false,
    }
  );

  const description = book?.description || descriptionQuery.data;

  return (
    <Transition appear show={!!book} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    {book?.title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    By {book?.author}
                  </p>
                  {descriptionQuery.isLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Generating description...
                    </p>
                  ) : description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No description available
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 