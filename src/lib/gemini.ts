import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

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

export async function getBookRecommendations(minLexile: number, maxLexile: number): Promise<BookRecommendation[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Please recommend 5-10 book titles suitable for middle school students with a Lexile range between ${minLexile}L and ${maxLexile}L. 
  For each book, provide the title and author. Format your response as a JSON array with objects containing 'title' and 'author' properties.
  Only include books that are appropriate for middle school students and fall within the specified Lexile range.
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
    console.error("Error getting book recommendations:", error);
    throw error;
  }
}

export async function getSimilarBooks(bookTitle: string): Promise<BookRecommendation[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Please recommend 5-10 book titles that middle school students who enjoyed "${bookTitle}" might also like.
  Consider similar themes, writing style, and reading level.
  For each book, provide the title and author. Format your response as a JSON array with objects containing 'title' and 'author' properties.
  Only include books that are appropriate for middle school students.
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
    console.error("Error getting similar book recommendations:", error);
    throw error;
  }
}

export async function generateBookDescription(title: string, author: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Write a short, engaging book description for a middle school student for the book "${title}" by ${author}. 
  The description should be concise (2-3 sentences) and highlight what makes the book interesting and appealing to middle school readers.
  Focus on the main themes, characters, or plot elements that would grab a young reader's attention.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating book description:", error);
    throw error;
  }
}

export async function getBookMetadata(title: string, author: string): Promise<BookMetadata> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `For the book "${title}" by ${author}, provide the following information in JSON format:
  1. Age Range: A suitable age range for middle school readers (e.g., "11-14 years")
  2. Content Warnings: A list of any content that parents or teachers should be aware of (e.g., mild violence, complex themes)
  3. Themes: A list of main themes in the book

  Format your response as a JSON object with the following structure:
  {
    "ageRange": "string",
    "contentWarnings": ["string"],
    "themes": ["string"]
  }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse book metadata from AI response");
    }
    
    const metadata = JSON.parse(jsonMatch[0]) as BookMetadata;
    return metadata;
  } catch (error) {
    console.error("Error getting book metadata:", error);
    throw error;
  }
} 