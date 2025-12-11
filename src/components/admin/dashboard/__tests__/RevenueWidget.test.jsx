import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RevenueWidget from '../RevenueWidget';

describe('RevenueWidget', () => {
    it('renders loading state correctly', () => {
        render(<RevenueWidget amount={0} loading={true} />);
        // Check absence of amount
        expect(screen.queryByText('$0.00')).not.toBeInTheDocument();
    });

    it('formats and renders amount correctly', () => {
        // 5000 cents = $50.00
        render(<RevenueWidget amount={5000} loading={false} />);

        // We expect the formatted string. Note: formatting might depend on locale.
        // The component hardcodes en-US USD.
        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    it('handles zero amount', () => {
        render(<RevenueWidget amount={0} loading={false} />);
        expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
});
