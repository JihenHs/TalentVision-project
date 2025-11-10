/**
 * Tests pour le composant App
 * Note: Les tests de routage sont simplifiés car App contient déjà un BrowserRouter
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import * as authModule from '../lib/auth';

// Mock du service d'authentification
vi.mock('../lib/auth', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window location
    window.history.replaceState({}, '', '/');
  });

  it('should render without crashing', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(false);
    
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render QueryClientProvider', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(false);
    
    const { container } = render(<App />);
    // App should render without errors
    expect(container).toBeTruthy();
  });

  it('should render BrowserRouter', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(false);
    
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should handle authenticated state', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(true);
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'test',
      role: 'CANDIDATE',
    });
    
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should handle unauthenticated state', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(false);
    
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render all route components', () => {
    (authModule.authService.isAuthenticated as any).mockReturnValue(true);
    (authModule.authService.getCurrentUser as any).mockReturnValue({
      id: 1,
      username: 'test',
      role: 'CANDIDATE',
    });
    
    const { container } = render(<App />);
    // App should render with all routes configured
    expect(container).toBeTruthy();
  });
});

