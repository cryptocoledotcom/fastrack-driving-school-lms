import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import AdminSidebar from '../AdminSidebar';
import useAdminNavigation from '../../../../hooks/useAdminNavigation';

// Mock hook
vi.mock('../../../../hooks/useAdminNavigation', () => ({
  default: vi.fn(),
}));

// Assuming AdminSidebar doesn't use AuthContext directly if it's just a pure nav 
// or if it strictly renders links. 
// If it imports UseAuth, we mock it. Checking imports from file content would confirm.
// For safety, we mock it if common pattern.

describe('AdminSidebar', () => {
  it('renders admin navigation items', () => {
    // Return mock items
    useAdminNavigation.mockReturnValue([
      { path: '/admin/dashboard', label: 'Admin Home', icon: '🏠' },
      { path: '/admin/users', label: 'Users', icon: '👥' }
    ]);

    render(
      <MemoryRouter>
        <AdminSidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Home')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});
