import { getBookRecommendations, getSimilarBooks, generateBookDescription, getBookMetadata } from '../gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the Google Generative AI client
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

describe('Gemini AI Integration', () => {
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));
  });

  describe('getBookRecommendations', () => {
    const mockResponse = [
      { title: 'Book 1', author: 'Author 1' },
      { title: 'Book 2', author: 'Author 2' },
    ];

    it('returns book recommendations within Lexile range', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await getBookRecommendations(600, 800);
      expect(result).toEqual(mockResponse);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('600L and 800L'));
    });

    it('handles API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      await expect(getBookRecommendations(600, 800)).rejects.toThrow('API Error');
    });
  });

  describe('getSimilarBooks', () => {
    const mockResponse = [
      { title: 'Similar Book 1', author: 'Author 1' },
      { title: 'Similar Book 2', author: 'Author 2' },
    ];

    it('returns similar books for a given title', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await getSimilarBooks('The Hobbit');
      expect(result).toEqual(mockResponse);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('The Hobbit'));
    });

    it('handles API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      await expect(getSimilarBooks('The Hobbit')).rejects.toThrow('API Error');
    });
  });

  describe('generateBookDescription', () => {
    const mockDescription = 'A fantastic book about adventure and friendship.';

    it('generates a description for a given book', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockDescription,
        },
      });

      const result = await generateBookDescription('The Hobbit', 'J.R.R. Tolkien');
      expect(result).toBe(mockDescription);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('The Hobbit'));
    });

    it('handles API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      await expect(generateBookDescription('The Hobbit', 'J.R.R. Tolkien')).rejects.toThrow('API Error');
    });
  });

  describe('getBookMetadata', () => {
    const mockMetadata = {
      ageRange: '12-14 years',
      contentWarnings: ['Mild violence'],
      themes: ['Adventure', 'Friendship'],
    };

    it('returns metadata for a given book', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockMetadata),
        },
      });

      const result = await getBookMetadata('The Hobbit', 'J.R.R. Tolkien');
      expect(result).toEqual(mockMetadata);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('The Hobbit'));
    });

    it('handles API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      await expect(getBookMetadata('The Hobbit', 'J.R.R. Tolkien')).rejects.toThrow('API Error');
    });
  });
}); 