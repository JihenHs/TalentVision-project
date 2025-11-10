/**
 * Tests pour le composant Login
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import * as authModule from '../../lib/auth';

// Mock du service d'authentification
vi.mock('../../lib/auth', () => {
  const mockLogin = vi.fn();
  return {
    authService: {
      login: mockLogin,
    },
  };
});

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText(/TalentVision/i)).toBeInTheDocument();
    expect(screen.getByText(/Connectez-vous à votre compte/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('should update username input', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    await userEvent.type(usernameInput, 'testuser');

    expect(usernameInput).toHaveValue('testuser');
  });

  it('should update password input', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    await userEvent.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should handle successful login', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    (authModule.authService.login as any).mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authModule.authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on login failure', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    const errorMessage = 'Invalid credentials';
    (authModule.authService.login as any).mockRejectedValueOnce({
      response: {
        data: {
          error: errorMessage,
        },
      },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should display generic error message when error response is missing', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    (authModule.authService.login as any).mockRejectedValueOnce({});

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erreur de connexion/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    // Mock qui ne se résout jamais immédiatement
    (authModule.authService.login as any).mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    expect(screen.getByText(/Connexion.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should have link to register page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const registerLink = screen.getByText(/S'inscrire/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});

