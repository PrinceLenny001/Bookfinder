import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-6 w-6'); // Default size is "md"
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-4 w-4');
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8 w-8');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="test-class" />);
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('test-class');
  });
}); 