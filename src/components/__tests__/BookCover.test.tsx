import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders with image', () => {
    render(<BookCover {...defaultProps} />);
    const image = screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`);
    expect(image).toBeInTheDocument();
  });

  it('renders fallback when image fails to load', () => {
    render(<BookCover {...defaultProps} />);
    const image = screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`);
    fireEvent.error(image);
    
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.author)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<BookCover {...defaultProps} onClick={handleClick} />);
    
    const image = screen.getByAltText(`Cover of ${defaultProps.title} by ${defaultProps.author}`);
    fireEvent.click(image);
    expect(handleClick).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<BookCover {...defaultProps} className="test-class" />);
    const container = screen.getByTestId('book-cover');
    expect(container).toHaveClass('test-class');
  });
}); 