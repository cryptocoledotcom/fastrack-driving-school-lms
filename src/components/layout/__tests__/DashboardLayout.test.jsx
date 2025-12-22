import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import DashboardLayout from '../DashboardLayout';

// Mock Dependencies
vi.mock('../Header/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../Sidebar/Sidebar', () => ({
    default: () => <aside data-testid="mock-sidebar">Sidebar</aside>,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children }) => <a href="#">{children}</a>,
}));

describe('DashboardLayout', () => {
    it('should render children content', () => {
        render(
            <DashboardLayout>
                <div data-testid="child-content">Dashboard Content</div>
            </DashboardLayout>
        );

        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('should render Header and Sidebar', () => {
        render(<DashboardLayout>Content</DashboardLayout>);

        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    });

    it('should wrap content in main tag', () => {
        const { container } = render(<DashboardLayout>Content</DashboardLayout>);
        const mainElement = container.querySelector('main');
        expect(mainElement).toBeInTheDocument();
    });
});
