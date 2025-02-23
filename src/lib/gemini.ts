import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export interface BookRecommendation {
  title: string;
  author: string;
  description?: string;
}

export interface BookMetadata {
  ageRange: string;
  contentWarnings: string[];
  themes: string[];
}

export async function getBookRecommendations(
  minLexile: number,
  maxLexile: number,
  genre: string | null = null,
  title: string | undefined = undefined
): Promise<BookRecommendation[]> {
  try {
    let prompt = "";
    
    if (title) {
      prompt = `Find books similar to "${title}"`;
      if (genre) {
        prompt += ` in the ${genre} genre`;
      }
      prompt += `. The books should be suitable for middle school students with a Lexile range between ${minLexile}L and ${maxLexile}L.`;
    } else {
      prompt = `Recommend 5-10 books suitable for middle school students with a Lexile range between ${minLexile}L and ${maxLexile}L`;
      if (genre) {
        prompt += ` in the ${genre} genre`;
      }
    }
    
    prompt += ` Return the response as a JSON array of objects with 'title' and 'author' properties.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    console.error("Error getting book recommendations:", error);
    throw error;
  }
}

export async function getBooksByGenre(minLexile: number, maxLexile: number, genre: string): Promise<BookRecommendation[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Please recommend 5-10 ${genre} book titles suitable for middle school students with a Lexile range between ${minLexile}L and ${maxLexile}L. 
  For each book, provide the title and author. Format your response as a JSON array with objects containing 'title' and 'author' properties.
  Only include books that are appropriate for middle school students, fall within the specified Lexile range, and belong to the ${genre} genre.
  Example format:
  [
    {
      "title": "Book Title",
      "author": "Author Name"
    }
  ]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse book recommendations from AI response");
    }
    
    const recommendations = JSON.parse(jsonMatch[0]) as BookRecommendation[];
    return recommendations;
  } catch (error) {
    console.error("Error getting book recommendations by genre:", error);
    throw error;
  }
}

export async function getSimilarBooks(
  bookTitle: string,
  genre: string | null = null
): Promise<BookRecommendation[]> {
  try {
    let prompt = `Recommend 5 books similar to "${bookTitle}"`;
    if (genre) {
      prompt += ` in the ${genre} genre`;
    }
    prompt += `. Return the response as a JSON array of objects with 'title' and 'author' properties.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    console.error("Error getting similar books:", error);
    throw error;
  }
}

export async function generateBookDescription(
  title: string,
  author: string
): Promise<string> {
  try {
    const prompt = `Write a short, engaging description of the book "${title}" by ${author} that would interest a middle school student. Keep it concise and focus on what makes the book interesting.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating book description:", error);
    throw error;
  }
}

export async function getBookMetadata(
  title: string,
  author: string
): Promise<{
  ageRange: string;
  contentWarnings: string[];
  themes: string[];
}> {
  try {
    const prompt = `For the book "${title}" by ${author}, provide the following metadata in JSON format:
    1. ageRange: A string indicating the appropriate age range (e.g., "12-14 years")
    2. contentWarnings: An array of strings for any content warnings
    3. themes: An array of main themes in the book`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return JSON.parse(response);
  } catch (error) {
    console.error("Error getting book metadata:", error);
    throw error;
  }
} 