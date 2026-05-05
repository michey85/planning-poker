import { render, screen } from '@testing-library/react';
import ConnectionAlert from '../ConnectionAlert';

describe('ConnectionAlert', () => {
  it('renders nothing when status is not error', () => {
    const { container } = render(<ConnectionAlert status="connected" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when status is empty string', () => {
    const { container } = render(<ConnectionAlert status="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders alert message when status is error', () => {
    render(<ConnectionAlert status="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Realtime connection lost. Updates may be delayed.')).toBeInTheDocument();
  });

  it('has assertive aria-live when shown', () => {
    render(<ConnectionAlert status="error" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});
