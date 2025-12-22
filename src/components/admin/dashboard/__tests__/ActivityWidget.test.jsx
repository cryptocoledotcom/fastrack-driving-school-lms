import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import ActivityWidget from '../ActivityWidget';

describe('ActivityWidget', () => {
    it('renders loading state', () => {
        render(<ActivityWidget activities={[]} loading={true} />);
        expect(screen.queryByText('Current Activity')).not.toBeInTheDocument();
    });

    it('renders empty state message when no activities', () => {
        render(<ActivityWidget activities={[]} loading={false} />);
        expect(screen.getByText('No recent logins')).toBeInTheDocument();
    });

    it('renders list of activities correctly', () => {
        const mockActivities = [
            { id: '1', userName: 'Alice', timestamp: new Date('2023-01-01T10:00:00').toISOString() },
            { id: '2', userName: 'Bob', timestamp: new Date('2023-01-01T11:00:00').toISOString() }
        ];

        render(<ActivityWidget activities={mockActivities} loading={false} />);

        // We check for the user names. 
        // If CSS modules are not mocked, styles object might be empty, but text should still render.
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();

        // Check count of items (assuming structure)
        // We can just verify names exist
    });
});
