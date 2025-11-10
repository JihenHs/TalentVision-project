/**
 * Tests pour le composant ProtectedRoute
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import * as authModule from '../../lib/auth';

// Mock du service d'authentification
vi.mock('../../lib/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user is authenticated', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(true);
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(false);
    (authModule.authService.getCurrentUser as any).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Le contenu protégé ne devrait pas être visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

