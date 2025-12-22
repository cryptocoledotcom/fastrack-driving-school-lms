import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import MainLayout from '../MainLayout';

// Mock Child Components
vi.mock('../Header/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../Footer/Footer', () => ({
    default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children }) => <a href="#">{children}</a>,
}));

describe('MainLayout', () => {
    it('should render children content', () => {
        render(
            <MainLayout>
                <div data-testid="child-content">Test Content</div>
            </MainLayout>
        );

        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render Header and Footer', () => {
        render(<MainLayout>Content</MainLayout>);

        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });

    it('should wrap content in main tag', () => {
        const { container } = render(<MainLayout>Content</MainLayout>);
        const mainElement = container.querySelector('main');
        expect(mainElement).toBeInTheDocument();
        expect(mainElement).toHaveTextContent('Content');
    });
});
