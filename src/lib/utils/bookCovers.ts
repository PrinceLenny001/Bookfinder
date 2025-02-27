/**
 * Utility functions for fetching book covers from external APIs
 */

// Cache for book cover URLs to avoid redundant API calls
const coverCache = new Map<string, string>();

/**
 * Fetch a book cover from Open Library and Google Books APIs
 * @param title Book title
 * @param author Book author
 * @returns URL to the book cover or null if not found
 */
export async function fetchBookCover(title: string, author: string): Promise<string | null> {
  const cacheKey = `${title}:${author}`.toLowerCase();
  
  // Check cache first
  if (coverCache.has(cacheKey)) {
    return coverCache.get(cacheKey) || null;
  }
  
  try {
    // Try Open Library first
    const openLibraryCover = await fetchOpenLibraryCover(title, author);
    if (openLibraryCover) {
      coverCache.set(cacheKey, openLibraryCover);
      return openLibraryCover;
    }
    
    // Fall back to Google Books
    const googleBooksCover = await fetchGoogleBooksCover(title, author);
    if (googleBooksCover) {
      coverCache.set(cacheKey, googleBooksCover);
      return googleBooksCover;
    }
    
    // No cover found
    return null;
  } catch (error) {
    console.error(`Error fetching cover for ${title} by ${author}:`, error);
    return null;
  }
}

/**
 * Fetch a book cover from Open Library
 * @param title Book title
 * @param author Book author
 * @returns URL to the book cover or null if not found
 */
async function fetchOpenLibraryCover(title: string, author: string): Promise<string | null> {
  try {
    // Encode the title and author for the URL
    const encodedTitle = encodeURIComponent(title);
    const encodedAuthor = encodeURIComponent(author);
    
    // Search Open Library for the book
    const response = await fetch(`https://openlibrary.org/search.json?title=${encodedTitle}&author=${encodedAuthor}`);
    
    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have any results
    if (data.docs && data.docs.length > 0) {
      // Get the first result
      const book = data.docs[0];
      
      // Check if the book has a cover ID
      if (book.cover_i) {
        // Return the URL to the cover image (medium size)
        return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
      }
      
      // Check if the book has an ISBN
      if (book.isbn && book.isbn.length > 0) {
        // Return the URL to the cover image using the ISBN
        return `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-M.jpg`;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Open Library cover for ${title} by ${author}:`, error);
    return null;
  }
}

/**
 * Fetch a book cover from Google Books
 * @param title Book title
 * @param author Book author
 * @returns URL to the book cover or null if not found
 */
async function fetchGoogleBooksCover(title: string, author: string): Promise<string | null> {
  try {
    // Encode the title and author for the URL
    const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
    
    // Search Google Books for the book
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have any results
    if (data.items && data.items.length > 0) {
      // Get the first result
      const book = data.items[0];
      
      // Check if the book has a thumbnail
      if (book.volumeInfo && book.volumeInfo.imageLinks && book.volumeInfo.imageLinks.thumbnail) {
        // Return the URL to the thumbnail
        // Replace http with https and remove zoom parameter for better quality
        return book.volumeInfo.imageLinks.thumbnail
          .replace('http://', 'https://')
          .replace('&zoom=1', '');
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Google Books cover for ${title} by ${author}:`, error);
    return null;
  }
} 