import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message', () => {
    const message = 'Test error message';
    render(<ErrorMessage message={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders error icon', () => {
    render(<ErrorMessage message="Test message" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ErrorMessage message="Test message" className="test-class" />);
    const container = screen.getByRole('alert');
    expect(container).toHaveClass('test-class');
  });
}); 