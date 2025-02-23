import { LexileRangeInput } from "@/components/LexileRangeInput";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Book Finder
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Enter a Lexile range to find books that match your reading level.
      </p>
      <LexileRangeInput />
    </main>
  );
}
