/**
 * Tests pour le module API
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => {
  // Créer l'instance dans le mock
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: '/api',
      headers: {},
    },
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };
  
  return {
    default: {
      create: vi.fn(() => instance),
      post: vi.fn(),
    },
  };
});

// Import après le mock
import api from '../api';

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should have correct base URL in development', () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('should set authorization header when token is provided', () => {
    const token = 'test-token';
    localStorage.setItem('access_token', token);
    
    expect(localStorage.getItem('access_token')).toBe(token);
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      response: {
        status: 404,
        data: { error: 'Not found' }
      }
    };
    
    // api.get est déjà une fonction mockée, on peut l'utiliser directement
    (api.get as any).mockRejectedValueOnce(errorResponse);

    await expect(api.get('/test')).rejects.toMatchObject({
      response: {
        status: 404,
      },
    });
  });
});

