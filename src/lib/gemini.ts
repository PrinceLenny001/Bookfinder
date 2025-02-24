import { GoogleGenerativeAI } from "@google/generative-ai";

// Only initialize Gemini if API key is present
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const model = genAI?.getGenerativeModel({ model: "gemini-pro" });

// Rate limiting setup
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute
let requestCount = 0;
let windowStart = Date.now();

// Queue for pending requests
const requestQueue: (() => void)[] = [];
let isProcessingQueue = false;

// Cache implementation
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const requestCache = new RequestCache();

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    if (now - windowStart >= RATE_LIMIT_WINDOW) {
      // Reset window
      windowStart = now;
      requestCount = 0;
    }

    if (requestCount < MAX_REQUESTS) {
      const nextRequest = requestQueue.shift();
      if (nextRequest) {
        requestCount++;
        nextRequest();
      }
      await new Promise(resolve => setTimeout(resolve, Math.ceil(RATE_LIMIT_WINDOW / MAX_REQUESTS)));
    } else {
      // Wait for the next window
      await new Promise(resolve => setTimeout(resolve, windowStart + RATE_LIMIT_WINDOW - now));
      windowStart = Date.now();
      requestCount = 0;
    }
  }

  isProcessingQueue = false;
}

async function makeRateLimitedRequest<T>(request: () => Promise<T>, cacheKey?: string): Promise<T> {
  if (!model) {
    throw new Error("Gemini API is not configured. Please check your environment variables.");
  }

  // Check cache first if cacheKey is provided
  if (cacheKey) {
    const cachedResult = requestCache.get<T>(cacheKey);
    if (cachedResult) {
      console.log('Using cached result for:', cacheKey);
      return cachedResult;
    }
  }

  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      try {
        const result = await request();
        // Cache the result if cacheKey is provided
        if (cacheKey) {
          requestCache.set(cacheKey, result);
        }
        resolve(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes('429')) {
          console.log('Rate limit hit, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          requestQueue.push(executeRequest);
          processQueue();
        } else {
          reject(error);
        }
      }
    };

    requestQueue.push(executeRequest);
    processQueue();
  });
}

export interface BookRecommendation {
  title: string;
  author: string;
  description?: string;
  lexileScore: number;
}

export interface BookMetadata {
  ageRange: string;
  contentWarnings: string[];
  themes: string[];
  lexileScore?: number;
}

// Add new helper function for Lexile validation
function isInLexileRange(lexileScore: number | undefined, minLexile: number, maxLexile: number): boolean {
  if (lexileScore === undefined) return false;
  return lexileScore >= minLexile && lexileScore <= maxLexile;
}

export async function getBookRecommendations(
  minLexile: number,
  maxLexile: number,
  genre: string | null = null,
  title: string | undefined = undefined
): Promise<BookRecommendation[]> {
  if (!model) {
    console.error("Gemini API is not configured");
    return [];
  }

  try {
    const cacheKey = `recommendations:${minLexile}:${maxLexile}:${genre}:${title}`;
    
    let prompt = "";
    if (title) {
      // When searching by title, focus on finding similar books without strict Lexile constraints
      prompt = `Find books similar to or matching "${title}". Include books that are similar in theme, style, or content.`;
      if (genre) {
        prompt += ` You may consider books from the ${genre} genre, but don't limit to it.`;
      }
      prompt += ` For each book, provide a Lexile score if known, but don't exclude books just because they don't match specific Lexile criteria.`;
    } else {
      // When not searching by title, use strict Lexile range
      prompt = `Recommend 5-10 books with EXACT Lexile scores between ${minLexile}L and ${maxLexile}L`;
      if (genre) {
        prompt += ` in the ${genre} genre`;
      }
      prompt += `. CRITICAL: Only include books with VERIFIED Lexile scores within this EXACT range. Do not include books outside this range.`;
    }
    
    prompt += ` Format as JSON array: [{"title": "Book Title", "author": "Author Name", "lexileScore": 950}].`;
    if (!title) {
      prompt += ` The lexileScore MUST be between ${minLexile} and ${maxLexile}.`;
    }

    console.log("Sending prompt to Gemini:", prompt);
    const result = await makeRateLimitedRequest(
      () => model.generateContent(prompt),
      cacheKey
    );
    const text = result.response.text();
    console.log("Raw Gemini response:", text);

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response");
      return [];
    }

    try {
      const books = JSON.parse(jsonMatch[0]) as BookRecommendation[];
      if (!Array.isArray(books) || !books.length) {
        console.error("Parsed response is not a valid array of books");
        return [];
      }

      // Only apply Lexile filtering if not searching by title
      if (!title) {
        const filteredBooks = books.filter(book => {
          const isInRange = book.lexileScore >= minLexile && book.lexileScore <= maxLexile;
          if (!isInRange) {
            console.log(`Filtering out book "${book.title}" with Lexile score ${book.lexileScore} (outside range ${minLexile}-${maxLexile})`);
          }
          return isInRange;
        });
        
        // If we have too few books after filtering, make another request
        if (filteredBooks.length < 5) {
          console.log("Too few books in range, requesting more...");
          const moreBooks = await getBookRecommendations(minLexile, maxLexile, genre, title);
          const combinedBooks = [...filteredBooks, ...moreBooks];
          // Remove duplicates based on title and author
          return Array.from(new Set(combinedBooks.map(book => JSON.stringify({title: book.title, author: book.author}))))
            .map(str => JSON.parse(str))
            .map(({title, author}) => combinedBooks.find(book => book.title === title && book.author === author)!);
        }
        return filteredBooks;
      }

      // For title search, return all matches without filtering
      return books;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error getting book recommendations:", error);
    return [];
  }
}

export async function getBooksByGenre(minLexile: number, maxLexile: number, genre: string): Promise<BookRecommendation[]> {
  if (!model) {
    console.error("Gemini API is not configured");
    return [];
  }

  const prompt = `Please recommend 5-10 ${genre} books that MUST have Lexile scores between ${minLexile}L and ${maxLexile}L. 
  IMPORTANT: Only include books that have confirmed Lexile scores within this exact range.
  For each book, provide the title, author, and Lexile score. Format your response as a JSON array with objects containing 'title', 'author', and 'lexileScore' properties.
  Example format:
  [
    {
      "title": "Book Title",
      "author": "Author Name",
      "lexileScore": 950
    }
  ]`;

  try {
    const result = await makeRateLimitedRequest(() => model.generateContent(prompt));
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse book recommendations from AI response");
    }
    
    const recommendations = JSON.parse(jsonMatch[0]) as (BookRecommendation & { lexileScore?: number })[];
    
    // Filter books by Lexile range
    const filteredBooks = recommendations.filter(book => isInLexileRange(book.lexileScore, minLexile, maxLexile));
    
    // If we have too few books after filtering, make another request
    if (filteredBooks.length < 5) {
      console.log("Too few books in range, requesting more...");
      const moreBooks = await getBooksByGenre(minLexile, maxLexile, genre);
      return [...new Set([...filteredBooks, ...moreBooks])];
    }

    return filteredBooks;
  } catch (error) {
    console.error("Error getting book recommendations by genre:", error);
    throw error;
  }
}

export async function getSimilarBooks(
  bookTitle: string,
  genre: string | null = null
): Promise<BookRecommendation[]> {
  if (!model) {
    console.error("Gemini API is not configured");
    return [];
  }

  try {
    const cacheKey = `similar:${bookTitle}:${genre}`;
    let prompt = `Recommend 5 books that are very similar to "${bookTitle}"`;
    if (genre) {
      prompt += ` in the ${genre} genre`;
    }
    prompt += `. The recommendations should:
    1. Be appropriate for the same age range as the original book
    2. Have similar themes and content
    3. Be at a similar reading level
    4. Have similar writing style and complexity
    
    Format the response as a JSON array of objects, each with 'title' and 'author' properties. Example format: [{"title": "Book Title", "author": "Author Name"}]`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await makeRateLimitedRequest(
      () => model.generateContent(prompt),
      cacheKey
    );
    const text = result.response.text();
    console.log("Raw Gemini response:", text);

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response");
      return [];
    }

    try {
      const books = JSON.parse(jsonMatch[0]) as BookRecommendation[];
      if (!Array.isArray(books) || !books.length) {
        console.error("Parsed response is not a valid array of books");
        return [];
      }
      return books;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error getting similar books:", error);
    return [];
  }
}

export async function generateBookDescription(
  title: string,
  author: string
): Promise<string> {
  if (!model) {
    console.error("Gemini API is not configured");
    return "Description not available";
  }

  try {
    const cacheKey = `description:${title}:${author}`;
    const prompt = `Write a short, engaging description of the book "${title}" by ${author} that would interest a middle school student. Keep it concise and focus on what makes the book interesting.`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await makeRateLimitedRequest(
      () => model.generateContent(prompt),
      cacheKey
    );
    const text = result.response.text();
    console.log("Raw Gemini response:", text);
    return text.trim();
  } catch (error) {
    console.error("Error generating book description:", error);
    return "Description not available";
  }
}

export async function getBookMetadata(
  title: string,
  author: string
): Promise<BookMetadata> {
  if (!model) {
    console.error("Gemini API is not configured");
    return {
      ageRange: "Not available",
      contentWarnings: [],
      themes: [],
      lexileScore: undefined,
    };
  }

  try {
    const cacheKey = `metadata:${title}:${author}`;
    const prompt = `For the book "${title}" by ${author}, provide the following metadata in JSON format:
    1. ageRange: A string indicating the appropriate age range (e.g., "12-14 years")
    2. contentWarnings: An array of strings for any content warnings
    3. themes: An array of main themes in the book
    4. lexileScore: A number representing the Lexile score (e.g., 800)
    Format example: {"ageRange": "12-14 years", "contentWarnings": ["Mild violence"], "themes": ["Adventure", "Friendship"], "lexileScore": 800}`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await makeRateLimitedRequest(
      () => model.generateContent(prompt),
      cacheKey
    );
    const text = result.response.text();
    console.log("Raw Gemini response:", text);

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from response");
      return {
        ageRange: "Not available",
        contentWarnings: [],
        themes: [],
        lexileScore: undefined,
      };
    }

    try {
      const metadata = JSON.parse(jsonMatch[0]) as BookMetadata;
      return metadata;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      return {
        ageRange: "Not available",
        contentWarnings: [],
        themes: [],
        lexileScore: undefined,
      };
    }
  } catch (error) {
    console.error("Error getting book metadata:", error);
    return {
      ageRange: "Not available",
      contentWarnings: [],
      themes: [],
      lexileScore: undefined,
    };
  }
} 