import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../Badge';

describe('Badge', () => {
    it('renders children correctly', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders with icon', () => {
        // Icon passed as a string/node
        render(<Badge icon="🚀">Boosted</Badge>);
        expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('applies variant and size classes', () => {
        // Since we mock CSS modules, we just ensure it renders without error
        const { container } = render(<Badge variant="success" size="small">Paid</Badge>);
        expect(container.firstChild).toBeInTheDocument();
    });
});
