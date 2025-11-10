/**
 * Tests pour le composant Register
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';

// Mock du service d'authentification
vi.mock('../../lib/auth', () => {
  const mockRegister = vi.fn();
  return {
    authService: {
      register: mockRegister,
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

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByText(/TalentVision/i)).toBeInTheDocument();
    expect(screen.getByText(/Créez votre compte/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Au moins 8 caractères/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Répétez le mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type de compte/i)).toBeInTheDocument();
  });

  it('should show company field for HR role', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const roleSelect = screen.getByLabelText(/Type de compte/i);
    await userEvent.selectOptions(roleSelect, 'HR');

    await waitFor(() => {
      expect(screen.getByLabelText(/Entreprise/i)).toBeInTheDocument();
    });
  });

  it('should show company field for Manager role', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const roleSelect = screen.getByLabelText(/Type de compte/i);
    await userEvent.selectOptions(roleSelect, 'MANAGER');

    await waitFor(() => {
      expect(screen.getByLabelText(/Entreprise/i)).toBeInTheDocument();
    });
  });

  it('should not show company field for Candidate role', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.queryByLabelText(/Entreprise/i)).not.toBeInTheDocument();
  });

  it('should validate password mismatch', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Au moins 8 caractères/i);
    const password2Input = screen.getByPlaceholderText(/Répétez le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /S'inscrire/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(password2Input, 'different');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
    });

    const authModule = await import('../../lib/auth');
    expect(authModule.authService.register).not.toHaveBeenCalled();
  });

  it('should validate password length', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Au moins 8 caractères/i);
    const password2Input = screen.getByPlaceholderText(/Répétez le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /S'inscrire/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(password2Input, 'short');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Le mot de passe doit contenir au moins 8 caractères/i)).toBeInTheDocument();
    });

    const authModule = await import('../../lib/auth');
    expect(authModule.authService.register).not.toHaveBeenCalled();
  });

  it('should handle successful registration', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    (authModule.authService.register as any).mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Au moins 8 caractères/i);
    const password2Input = screen.getByPlaceholderText(/Répétez le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /S'inscrire/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(password2Input, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(authModule.authService.register).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display validation errors', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    const validationErrors = {
      username: ['Ce nom d\'utilisateur existe déjà'],
      email: ['Cet email est déjà utilisé'],
    };

    (authModule.authService.register as any).mockRejectedValueOnce({
      response: {
        data: validationErrors,
      },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Au moins 8 caractères/i);
    const password2Input = screen.getByPlaceholderText(/Répétez le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /S'inscrire/i });

    await userEvent.type(usernameInput, 'existinguser');
    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(password2Input, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Ce nom d'utilisateur existe déjà/i)).toBeInTheDocument();
      expect(screen.getByText(/Cet email est déjà utilisé/i)).toBeInTheDocument();
    });
  });

  it('should display error message on registration failure', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    (authModule.authService.register as any).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Registration failed',
        },
      },
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Au moins 8 caractères/i);
    const password2Input = screen.getByPlaceholderText(/Répétez le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /S'inscrire/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(password2Input, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during registration', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const authModule = await import('../../lib/auth');

    (authModule.authService.register as any).mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Au moins 8 caractères/i);
    const password2Input = screen.getByPlaceholderText(/Répétez le mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /S'inscrire/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(password2Input, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Inscription.../i)).toBeInTheDocument();
    });
    
    // Le bouton devrait être désactivé pendant le chargement
    const loadingButton = screen.getByRole('button');
    expect(loadingButton).toBeDisabled();
  });

  it('should have link to login page', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const loginLink = screen.getByText(/Se connecter/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });
});

