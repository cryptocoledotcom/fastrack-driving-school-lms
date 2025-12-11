import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../../../context/AuthContext';

vi.mock('../../../../context/AuthContext');

describe('Sidebar', () => {
    it('renders standard navigation items', () => {
        useAuth.mockReturnValue({ isAdmin: false });
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('My Courses')).toBeInTheDocument();
        expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });

    it('renders admin panel when user is admin', () => {
        useAuth.mockReturnValue({ isAdmin: true });
        render(
            <MemoryRouter>
                <Sidebar />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
});
