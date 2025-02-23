import { render, screen } from '@testing-library/react';
import { BookMetadata } from '../BookMetadata';
import { api } from '@/lib/trpc/react';

// Mock the tRPC API
jest.mock('@/lib/trpc/react', () => ({
  api: {
    books: {
      getMetadata: {
        useQuery: jest.fn(),
      },
    },
  },
}));

describe('BookMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    (api.books.getMetadata.useQuery as jest.Mock).mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
    });

    render(<BookMetadata title="Test Book" author="Test Author" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders error state', () => {
    (api.books.getMetadata.useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: null,
      error: { message: 'Failed to load metadata' },
    });

    render(<BookMetadata title="Test Book" author="Test Author" />);
    expect(screen.getByText('Failed to load metadata')).toBeInTheDocument();
  });

  it('renders metadata when available', () => {
    const mockMetadata = {
      ageRange: '12-14 years',
      contentWarnings: ['Mild violence'],
      themes: ['Adventure', 'Friendship'],
    };

    (api.books.getMetadata.useQuery as jest.Mock).mockReturnValue({
      isLoading: false,
      data: mockMetadata,
      error: null,
    });

    render(<BookMetadata title="Test Book" author="Test Author" />);
    expect(screen.getByText('12-14 years')).toBeInTheDocument();
    expect(screen.getByText('Mild violence')).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
    expect(screen.getByText('Friendship')).toBeInTheDocument();
  });
}); 