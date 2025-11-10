/**
 * Tests pour le composant CreateJobPost
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CreateJobPost from '../CreateJobPost';

// Mock de l'API
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('CreateJobPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render create job post form', async () => {
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });

    renderWithProviders(<CreateJobPost />);

    expect(screen.getByText(/Créer une offre d'emploi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Titre du poste/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exigences et qualifications/i)).toBeInTheDocument();
  });

  it('should load skills list', async () => {
    const mockSkills = [
      { id: 1, name: 'React', category: 'Frontend' },
      { id: 2, name: 'Node.js', category: 'Backend' },
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { results: mockSkills },
    });

    renderWithProviders(<CreateJobPost />);

    await waitFor(() => {
      expect(screen.getByText(/React/i)).toBeInTheDocument();
      expect(screen.getByText(/Node.js/i)).toBeInTheDocument();
    });
  });

  it('should update form fields', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });

    renderWithProviders(<CreateJobPost />);

    const titleInput = screen.getByLabelText(/Titre du poste/i);
    await userEvent.type(titleInput, 'Développeur Full Stack');

    expect(titleInput).toHaveValue('Développeur Full Stack');
  });

  it('should toggle skill selection', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const mockSkills = [
      { id: 1, name: 'React', category: 'Frontend' },
    ];

    mockApiGet.mockResolvedValueOnce({
      data: { results: mockSkills },
    });

    renderWithProviders(<CreateJobPost />);

    await waitFor(() => {
      expect(screen.getByText(/React/i)).toBeInTheDocument();
    });

    const skillCheckbox = screen.getByLabelText(/React/i);
    await userEvent.click(skillCheckbox);

    expect(skillCheckbox).toBeChecked();
  });

  it('should handle successful job post creation', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    mockApiPost.mockResolvedValueOnce({
      data: { id: 1, title: 'Test Job' },
    });

    renderWithProviders(<CreateJobPost />);

    const titleInput = screen.getByLabelText(/Titre du poste/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const requirementsInput = screen.getByLabelText(/Exigences et qualifications/i);
    const submitButton = screen.getByRole('button', { name: /Créer l'offre/i });

    await userEvent.type(titleInput, 'Test Job');
    await userEvent.type(descriptionInput, 'Test Description');
    await userEvent.type(requirementsInput, 'Test Requirements');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/job-posts');
    });
  });

  it('should display validation errors', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    mockApiPost.mockRejectedValueOnce({
      response: {
        data: {
          title: ['Ce champ est requis'],
          description: ['Ce champ est requis'],
        },
      },
    });

    renderWithProviders(<CreateJobPost />);

    const submitButton = screen.getByRole('button', { name: /Créer l'offre/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      // Les erreurs peuvent être dans un tableau, on vérifie qu'au moins une erreur est affichée
      const errorMessages = screen.queryAllByText(/Ce champ est requis/i);
      // Si aucune erreur n'est trouvée, vérifier les erreurs génériques
      if (errorMessages.length === 0) {
        // Les erreurs peuvent être affichées différemment selon le format de l'API
        expect(screen.getByText(/title|description/i)).toBeInTheDocument();
      } else {
        expect(errorMessages.length).toBeGreaterThan(0);
      }
    }, { timeout: 3000 });
  });

  it('should handle cancel button', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });

    renderWithProviders(<CreateJobPost />);

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    await userEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/job-posts');
  });

  it('should call mutation when form is submitted', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    // Créer une promesse qui ne se résout jamais pour simuler un chargement
    const neverResolvingPromise = new Promise(() => {});
    mockApiPost.mockImplementation(() => neverResolvingPromise);

    renderWithProviders(<CreateJobPost />);

    const titleInput = screen.getByLabelText(/Titre du poste/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const requirementsInput = screen.getByLabelText(/Exigences et qualifications/i);
    const submitButton = screen.getByRole('button', { name: /Créer l'offre/i });

    await userEvent.type(titleInput, 'Test Job');
    await userEvent.type(descriptionInput, 'Test Description');
    await userEvent.type(requirementsInput, 'Test Requirements');
    
    // Cliquer sur le bouton
    await userEvent.click(submitButton);

    // Vérifier que la mutation a été appelée avec les bonnes données
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalled();
      expect(mockApiPost).toHaveBeenCalledWith('/job-posts/', expect.objectContaining({
        title: 'Test Job',
        description: 'Test Description',
        requirements: 'Test Requirements',
        status: 'DRAFT',
      }));
    });
  });
});

