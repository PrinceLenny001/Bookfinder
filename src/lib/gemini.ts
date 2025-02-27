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
  coverOptions?: {
    description: string;
    style: string;
  }[];
}

export interface BookMetadata {
  ageRange: string;
  contentWarnings: string[];
  themes: string[];
  lexileScore?: number;
  similarBooks: {
    title: string;
    author: string;
    description?: string;
    lexileScore?: number;
  }[];
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
    console.error("Gemini model not configured");
    return [];
  }

  try {
    let prompt = "";
    if (title) {
      prompt = `Find books similar to "${title}" for middle school students. Return 5 books in JSON format with title, author, lexileScore, and coverOptions. Each book should be appropriate for middle school students.`;
    } else {
      prompt = `Recommend 5 different and varied books for middle school students with Lexile scores between ${minLexile} and ${maxLexile}${
        genre ? ` in the ${genre} genre` : ""
      }. Try to suggest a diverse mix of books with different themes and styles. Return the books in JSON format with title, author, lexileScore, and coverOptions.`;
    }

    prompt += `\nFormat the response as a JSON array of objects with these exact keys: title, author, lexileScore, description, coverOptions.
    \nEnsure all lexileScore values are numbers between ${minLexile} and ${maxLexile}.
    \nInclude a brief description for each book.
    \nFor coverOptions, include an array of 3 different cover design descriptions, each with:
      - description: A detailed description of what the cover looks like
      - style: The artistic style (e.g. "watercolor", "digital art", "photography")
    \nTry to suggest books that haven't been recommended before.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const books = JSON.parse(jsonMatch[0]) as BookRecommendation[];
      
      // Validate the books
      return books.filter(book => 
        book.title &&
        book.author &&
        typeof book.lexileScore === "number" &&
        book.lexileScore >= minLexile &&
        book.lexileScore <= maxLexile &&
        Array.isArray(book.coverOptions) &&
        book.coverOptions.length >= 1
      );
    } catch (error) {
      console.error("Error parsing book recommendations:", error);
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

    For each book, provide:
    - title
    - author
    - lexileScore (a number between 400-1500)
    - description (a brief 1-2 sentence description)
    - coverOptions (an array with at least 2 different cover design options)

    Each cover option should have:
    - description: a brief description of what's on the cover
    - style: the art style (e.g., "watercolor", "digital art", "minimalist", "gradient")

    Format the response as a JSON array of objects. Example format:
    [
      {
        "title": "Book Title",
        "author": "Author Name",
        "lexileScore": 850,
        "description": "Brief description of the book.",
        "coverOptions": [
          {
            "description": "A mountain landscape with a small figure",
            "style": "watercolor"
          },
          {
            "description": "Abstract geometric patterns in blue and green",
            "style": "minimalist gradient"
          }
        ]
      }
    ]`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await makeRateLimitedRequest(
      () => model.generateContent(prompt),
      cacheKey
    );
    const text = result.response.text();
    console.log("Raw Gemini response:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
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
    } else {
      console.error("No JSON array found in response");
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
      similarBooks: [],
    };
  }

  try {
    const cacheKey = `metadata:${title}:${author}`;
    const prompt = `For the book "${title}" by ${author}, provide the following metadata in JSON format:

    1. ageRange: A string indicating the appropriate age range (e.g., "12-14 years")
    2. contentWarnings: An array of strings for any content warnings (be specific and comprehensive)
    3. themes: An array of main themes in the book (provide at least 3-5 themes)
    4. lexileScore: A number representing the Lexile score if known (e.g., 800)
    5. similarBooks: An array of 5 similar books that readers would enjoy if they liked this book.
       Each similar book should include:
       - title: The book title
       - author: The author's name
       - description: A brief 1-2 sentence description of why it's similar
       - lexileScore: An estimated Lexile score (if known)

    Format example: 
    {
      "ageRange": "12-14 years", 
      "contentWarnings": ["Mild violence", "Brief mentions of death"], 
      "themes": ["Adventure", "Friendship", "Coming of age", "Courage", "Identity"],
      "lexileScore": 800,
      "similarBooks": [
        {
          "title": "Similar Book 1", 
          "author": "Author 1",
          "description": "Features similar themes of friendship and adventure with comparable reading level.",
          "lexileScore": 780
        },
        {
          "title": "Similar Book 2", 
          "author": "Author 2",
          "description": "Another book with similar themes and style that fans of the original would enjoy.",
          "lexileScore": 820
        }
      ]
    }
    
    If you don't know the exact Lexile score, provide your best estimate based on the book's complexity and target audience.
    For the similar books, focus on books that are truly similar in style, themes, and reading level - books that would genuinely appeal to someone who enjoyed "${title}".`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await makeRateLimitedRequest(
      () => model.generateContent(prompt),
      cacheKey
    );
    const text = result.response.text();
    console.log("Raw Gemini response:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const metadata = JSON.parse(jsonMatch[0]) as BookMetadata;
        return {
          ageRange: metadata.ageRange || "Not available",
          contentWarnings: Array.isArray(metadata.contentWarnings) ? metadata.contentWarnings : [],
          themes: Array.isArray(metadata.themes) ? metadata.themes : [],
          lexileScore: typeof metadata.lexileScore === "number" ? metadata.lexileScore : undefined,
          similarBooks: Array.isArray(metadata.similarBooks) ? metadata.similarBooks.map(book => ({
            title: book.title,
            author: book.author,
            description: book.description || "",
            lexileScore: typeof book.lexileScore === "number" ? book.lexileScore : 0
          })) : [],
        };
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        return {
          ageRange: "Not available",
          contentWarnings: [],
          themes: [],
          lexileScore: undefined,
          similarBooks: [],
        };
      }
    } else {
      console.error("No JSON object found in response");
      return {
        ageRange: "Not available",
        contentWarnings: [],
        themes: [],
        lexileScore: undefined,
        similarBooks: [],
      };
    }
  } catch (error) {
    console.error("Error getting book metadata:", error);
    return {
      ageRange: "Not available",
      contentWarnings: [],
      themes: [],
      lexileScore: undefined,
      similarBooks: [],
    };
  }
} 