/**
 * Tests pour le composant Applications
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Applications from '../Applications';
import * as authModule from '../../lib/auth';

// Mock de l'API
const mockApiGet = vi.fn();
const mockApiPatch = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    patch: (...args: any[]) => mockApiPatch(...args),
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

describe('Applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockApiGet.mockImplementation(() => new Promise(() => {})); // Never resolves
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    renderWithProviders(<Applications />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should display "Mes candidatures" for candidate', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    renderWithProviders(<Applications />);
    
    await waitFor(() => {
      expect(screen.getByText(/Mes candidatures/i)).toBeInTheDocument();
    });
  });

  it('should display "Toutes les candidatures" for HR', async () => {
    // Mock pour /job-posts/ (appelé si HR)
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    // Mock pour /applications/
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'hruser',
      role: 'HR',
    });

    renderWithProviders(<Applications />);
    
    await waitFor(() => {
      expect(screen.getByText(/Toutes les candidatures/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display applications list', async () => {
    const mockApplications = [
      {
        id: 1,
        candidate: {
          id: 1,
          username: 'candidate1',
          email: 'candidate1@test.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        job_post: {
          id: 1,
          title: 'Développeur Full Stack',
          status: 'PUBLISHED',
        },
        status: 'PENDING',
        compatibility_score: 85.5,
        source: 'WEBSITE',
        applied_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock pour /job-posts/ (appelé si HR)
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    // Mock pour /applications/
    mockApiGet.mockResolvedValueOnce({
      data: { results: mockApplications },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'hruser',
      role: 'HR',
    });

    renderWithProviders(<Applications />);
    
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Développeur Full Stack/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

