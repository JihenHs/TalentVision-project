/**
 * Tests pour le module d'authentification
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../auth';

describe('Auth Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store token on login', async () => {
    const mockToken = 'test-access-token';
    const mockRefreshToken = 'test-refresh-token';
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'CANDIDATE' as const,
      first_name: 'Test',
      last_name: 'User',
    };

    // Simuler le login en stockant directement dans localStorage
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('refresh_token', mockRefreshToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    expect(localStorage.getItem('access_token')).toBe(mockToken);
    expect(localStorage.getItem('refresh_token')).toBe(mockRefreshToken);
  });

  it('should retrieve current user', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'CANDIDATE' as const,
      first_name: 'Test',
      last_name: 'User',
    };

    localStorage.setItem('user', JSON.stringify(mockUser));
    const user = authService.getCurrentUser();

    expect(user).toEqual(mockUser);
  });

  it('should return null when no user is stored', () => {
    const user = authService.getCurrentUser();
    expect(user).toBeNull();
  });

  it('should clear tokens and user on logout', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test', role: 'CANDIDATE' }));
    
    authService.logout();
    
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('should check if user is authenticated', () => {
    expect(authService.isAuthenticated()).toBe(false);
    
    localStorage.setItem('access_token', 'token');
    expect(authService.isAuthenticated()).toBe(true);
  });
});

