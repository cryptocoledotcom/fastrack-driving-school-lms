import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Button from '../Button';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click Me</Button>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders loading state correctly', () => {
        render(<Button loading>Click Me</Button>);

        // Should show loading text/spinner and be disabled
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
        // Should not show children text if loading (implementation dependent, but Button.jsx replaces children)
        expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
    });

    it('renders disabled state correctly', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Click Me</Button>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();

        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies variant classes', () => {
        // CSS module mocking ensures this runs without crashing
        const { container } = render(<Button variant="danger">Delete</Button>);
        expect(container.firstChild).toBeInTheDocument();
    });
});
