/**
 * Tests pour le composant Dashboard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Dashboard from '../Dashboard';
import * as authModule from '../../lib/auth';
import api from '../../lib/api';

// Mock de l'API
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock du service d'authentification
vi.mock('../../lib/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'HR',
      first_name: 'Test',
      last_name: 'User',
    });
  });

  it('should render loading state', () => {
    (api.get as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should display user name in header', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        total_applications: 10,
        pending_applications: 5,
        accepted_applications: 3,
        rejected_applications: 2,
        average_compatibility_score: 75.5,
        average_time_to_hire: 15.5,
        applications_by_source: {},
        applications_by_status: {},
        top_skills_demand: [],
        internal_matches_count: 0,
      },
    });
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });

  it('should display dashboard title', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        total_applications: 10,
        pending_applications: 5,
        accepted_applications: 3,
        rejected_applications: 2,
        average_compatibility_score: 75.5,
        average_time_to_hire: 15.5,
        applications_by_source: {},
        applications_by_status: {},
        top_skills_demand: [],
        internal_matches_count: 0,
      },
    });
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });
});

