import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookCover } from '../BookCover';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('BookCover', () => {
  const defaultProps = {
    title: 'Test Book',
    author: 'Test Author',
  };

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          docs: [{
            isbn: ['1234567890'],
            key: '/works/OL1234W',
          }],
        }),
      })
    ) as jest.Mock;
  });

  it('shows fallback while loading', () => {
    render(<BookCover {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.author)).toBeInTheDocument();
  });

  it('renders with ISBN cover when available', async () => {
    render(<BookCover {...defaultProps} />);
    
    await waitFor(() => {
      const image = screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`);
      expect(image).toHaveAttribute('src', expect.stringContaining('isbn/1234567890-L.jpg'));
    });
  });

  it('falls back to OLID when ISBN is not available', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          docs: [{
            key: '/works/OL1234W',
          }],
        }),
      })
    ) as jest.Mock;

    render(<BookCover {...defaultProps} />);
    
    await waitFor(() => {
      const image = screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`);
      expect(image).toHaveAttribute('src', expect.stringContaining('olid/OL1234W-L.jpg'));
    });
  });

  it('falls back to title search when no ISBN or OLID is available', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          docs: [],
        }),
      })
    ) as jest.Mock;

    render(<BookCover {...defaultProps} />);
    
    await waitFor(() => {
      const image = screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`);
      expect(image).toHaveAttribute('src', expect.stringContaining('title/Test%20Book-L.jpg'));
    });
  });

  it('shows fallback on API error', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('API Error'))) as jest.Mock;

    render(<BookCover {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
      expect(screen.getByText(defaultProps.author)).toBeInTheDocument();
    });
  });

  it('shows fallback when image fails to load', async () => {
    render(<BookCover {...defaultProps} />);
    
    const image = await waitFor(() => 
      screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`)
    );
    
    fireEvent.error(image);
    
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.author)).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<BookCover {...defaultProps} onClick={handleClick} />);
    
    const image = await waitFor(() => 
      screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`)
    );
    
    fireEvent.click(image);
    expect(handleClick).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<BookCover {...defaultProps} className="test-class" />);
    const container = screen.getByTestId('book-cover');
    expect(container).toHaveClass('test-class');
  });
}); 