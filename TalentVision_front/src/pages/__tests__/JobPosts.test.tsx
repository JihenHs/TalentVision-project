/**
 * Tests pour le composant JobPosts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import JobPosts from '../JobPosts';
import * as authModule from '../../lib/auth';
import api from '../../lib/api';

// Mock de l'API
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

// Mock du service d'authentification
vi.mock('../../lib/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

// Mock de window.alert
global.alert = vi.fn();

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

describe('JobPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should display job posts list', async () => {
    const mockJobPosts = [
      {
        id: 1,
        title: 'Développeur Full Stack',
        description: 'Description de l\'offre',
        status: 'PUBLISHED',
        applications_count: 5,
        required_skills: [
          { id: 1, name: 'React' },
          { id: 2, name: 'Node.js' },
        ],
      },
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { results: mockJobPosts },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Développeur Full Stack/i)).toBeInTheDocument();
      expect(screen.getByText(/Description de l'offre/i)).toBeInTheDocument();
    });
  });

  it('should show "Créer une offre" button for HR', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'hruser',
      role: 'HR',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Créer une offre/i)).toBeInTheDocument();
    });
  });

  it('should show "Créer une offre" button for Manager', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'manager',
      role: 'MANAGER',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Créer une offre/i)).toBeInTheDocument();
    });
  });

  it('should not show "Créer une offre" button for Candidate', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'candidate',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.queryByText(/Créer une offre/i)).not.toBeInTheDocument();
    });
  });

  it('should show "Postuler" button for published jobs when user is candidate', async () => {
    const mockJobPosts = [
      {
        id: 1,
        title: 'Développeur Full Stack',
        description: 'Description',
        status: 'PUBLISHED',
        applications_count: 0,
        required_skills: [],
      },
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { results: mockJobPosts },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'candidate',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Postuler/i)).toBeInTheDocument();
    });
  });

  it('should handle job application', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const mockJobPosts = [
      {
        id: 1,
        title: 'Développeur Full Stack',
        description: 'Description',
        status: 'PUBLISHED',
        applications_count: 0,
        required_skills: [],
      },
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { results: mockJobPosts },
    });
    mockApiPost.mockResolvedValueOnce({
      data: { success: true },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'candidate',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Postuler/i)).toBeInTheDocument();
    });

    const applyButton = screen.getByText(/Postuler/i);
    await userEvent.click(applyButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/job-posts/1/apply/', {
        cover_letter: '',
        source: 'WEBSITE',
      });
    });
  });

  it('should display empty state when no job posts', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/Aucune offre d'emploi disponible/i)).toBeInTheDocument();
    });
  });

  it('should display skills for job posts', async () => {
    const mockJobPosts = [
      {
        id: 1,
        title: 'Développeur Full Stack',
        description: 'Description',
        status: 'PUBLISHED',
        applications_count: 0,
        required_skills: [
          { id: 1, name: 'React' },
          { id: 2, name: 'Node.js' },
          { id: 3, name: 'TypeScript' },
          { id: 4, name: 'Python' },
        ],
      },
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { results: mockJobPosts },
    });
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'CANDIDATE',
    });

    renderWithProviders(<JobPosts />);

    await waitFor(() => {
      expect(screen.getByText(/React/i)).toBeInTheDocument();
      expect(screen.getByText(/Node.js/i)).toBeInTheDocument();
      expect(screen.getByText(/\+1/i)).toBeInTheDocument(); // +1 pour les compétences au-delà de 3
    });
  });
});

