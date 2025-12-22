import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import Card from '../Card';

describe('Card', () => {
    it('renders children', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('handles click when clickable', () => {
        const handleClick = vi.fn();
        render(<Card clickable onClick={handleClick}>Clickable Card</Card>);

        const card = screen.getByText('Clickable Card');
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has button role when clickable', () => {
        render(<Card clickable>Role Check</Card>);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
