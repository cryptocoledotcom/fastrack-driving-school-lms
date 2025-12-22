import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import AuthLayout from '../AuthLayout';

// Mock constants
vi.mock('../../constants/routes', () => ({
    PUBLIC_ROUTES: {
        HOME: '/'
    }
}));

describe('AuthLayout', () => {
    it('should render children content', () => {
        render(
            <MemoryRouter>
                <AuthLayout>
                    <div data-testid="auth-content">Login Form</div>
                </AuthLayout>
            </MemoryRouter>
        );

        expect(screen.getByTestId('auth-content')).toBeInTheDocument();
        expect(screen.getByText('Login Form')).toBeInTheDocument();
    });

    it('should render logo link', () => {
        render(
            <MemoryRouter>
                <AuthLayout>Content</AuthLayout>
            </MemoryRouter>
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/');
        expect(screen.getByText('Fastrack Driving School')).toBeInTheDocument();
    });

    it('should render footer copyright', () => {
        render(
            <MemoryRouter>
                <AuthLayout>Content</AuthLayout>
            </MemoryRouter>
        );

        expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });
});
