import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { useAuth } from '../../../../context/AuthContext';

// Mock Auth Context
vi.mock('../../../../context/AuthContext');

describe('Header', () => {
    it('renders navigation links', () => {
        useAuth.mockReturnValue({ user: null });
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Courses')).toBeInTheDocument();
    });

    it('renders login/signup buttons when logged out', () => {
        useAuth.mockReturnValue({ user: null });
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
        expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    it('renders dashboard/logout when logged in', () => {
        useAuth.mockReturnValue({
            user: { uid: '123' },
            getUserFullName: () => 'John Doe',
            logout: vi.fn()
        });

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('calls logout function on click', async () => {
        const mockLogout = vi.fn();
        useAuth.mockReturnValue({
            user: { uid: '123' },
            getUserFullName: () => 'John Doe',
            logout: mockLogout
        });

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalled();
    });
});
