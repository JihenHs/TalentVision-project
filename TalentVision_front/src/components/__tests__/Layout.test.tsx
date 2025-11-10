/**
 * Tests pour le composant Layout
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';
import * as authModule from '../../lib/auth';

// Mock du service d'authentification
vi.mock('../../lib/auth', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
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

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      role: 'CANDIDATE',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should display user information', () => {
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      first_name: 'John',
      last_name: 'Doe',
      role: 'CANDIDATE',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/CANDIDATE/i)).toBeInTheDocument();
  });

  it('should show candidate-specific navigation', () => {
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'candidate',
      first_name: 'Test',
      last_name: 'Candidate',
      role: 'CANDIDATE',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText(/Mes candidatures/i)).toBeInTheDocument();
    // Vérifier que le lien "Candidatures" (pour HR) n'est pas présent
    // en cherchant le texte exact, pas juste "candidatures" qui pourrait matcher "Mes candidatures"
    const allLinks = screen.getAllByRole('link');
    const candidaturesLink = allLinks.find(link => link.textContent === 'Candidatures');
    expect(candidaturesLink).toBeUndefined();
    expect(screen.queryByText(/Alertes/i)).not.toBeInTheDocument();
  });

  it('should show HR-specific navigation', () => {
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'hruser',
      first_name: 'Test',
      last_name: 'HR',
      role: 'HR',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText(/Candidatures/i)).toBeInTheDocument();
    expect(screen.getByText(/Alertes/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mes candidatures/i)).not.toBeInTheDocument();
  });

  it('should show Manager-specific navigation', () => {
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'manager',
      first_name: 'Test',
      last_name: 'Manager',
      role: 'MANAGER',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText(/Candidatures/i)).toBeInTheDocument();
    expect(screen.getByText(/Alertes/i)).toBeInTheDocument();
  });

  it('should handle logout', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      role: 'CANDIDATE',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    const logoutButton = screen.getByText(/Déconnexion/i);
    await userEvent.click(logoutButton);

    expect(authModule.authService.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should render TalentVision logo link', () => {
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      role: 'CANDIDATE',
    });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );

    const logoLink = screen.getByText('TalentVision');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });
});

