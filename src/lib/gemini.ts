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