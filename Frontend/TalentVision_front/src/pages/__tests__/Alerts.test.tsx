/**
 * Tests pour le composant Alerts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Alerts from '../Alerts';

// Mock de l'API
const mockApiGet = vi.fn();
const mockApiPatch = vi.fn();
const mockApiPost = vi.fn();

vi.mock('../../lib/api', () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    patch: (...args: any[]) => mockApiPatch(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}));

// Mock de console.error pour éviter les logs dans les tests
vi.spyOn(console, 'error').mockImplementation(() => {});

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

describe('Alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockApiGet.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<Alerts />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('should display alerts list', async () => {
    const mockAlerts = [
      {
        id: 1,
        alert_type: 'NEW_APPLICATION',
        priority: 'MEDIUM',
        title: 'Nouvelle candidature',
        message: 'Un nouveau candidat a postulé',
        recipient: { id: 1, username: 'hr' },
        related_application: {
          id: 1,
          candidate: { first_name: 'John', last_name: 'Doe' },
          job_post: { id: 1, title: 'Développeur' },
        },
        related_job_post: null,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock pour /alerts/
    mockApiGet.mockResolvedValueOnce({
      data: { results: mockAlerts },
    });
    // Mock pour /alerts/unread_count/
    mockApiGet.mockResolvedValueOnce({
      data: { unread_count: 1 },
    });

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      // Utiliser getAllByText car le titre apparaît plusieurs fois (dans le h3 et dans le span)
      const titles = screen.getAllByText(/Nouvelle candidature/i);
      expect(titles.length).toBeGreaterThan(0);
      expect(screen.getByText(/Un nouveau candidat a postulé/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no alerts', async () => {
    // Mock pour /alerts/
    mockApiGet.mockResolvedValueOnce({
      data: { results: [] },
    });
    // Mock pour /alerts/unread_count/
    mockApiGet.mockResolvedValueOnce({
      data: { unread_count: 0 },
    });

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      expect(screen.getByText(/Aucune alerte pour le moment/i)).toBeInTheDocument();
    });
  });

  it('should mark alert as read', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const mockAlerts = [
      {
        id: 1,
        alert_type: 'NEW_APPLICATION',
        priority: 'MEDIUM',
        title: 'Nouvelle candidature',
        message: 'Message',
        recipient: { id: 1, username: 'hr' },
        related_application: null,
        related_job_post: null,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock pour /alerts/
    mockApiGet.mockResolvedValueOnce({
      data: { results: mockAlerts },
    });
    // Mock pour /alerts/unread_count/
    mockApiGet.mockResolvedValueOnce({
      data: { unread_count: 1 },
    });
    mockApiPatch.mockResolvedValueOnce({
      data: { success: true },
    });

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      // Il y a deux boutons "Marquer comme lu" (un pour tout marquer, un pour une alerte)
      // On utilise getAllByText et on prend le deuxième (celui de l'alerte individuelle)
      const buttons = screen.getAllByText(/Marquer comme lu/i);
      expect(buttons.length).toBeGreaterThan(0);
    });

    // Prendre le bouton de l'alerte individuelle (pas celui de "Tout marquer")
    const markAsReadButtons = screen.getAllByText(/Marquer comme lu/i);
    const markAsReadButton = markAsReadButtons.find(btn => 
      btn.textContent === 'Marquer comme lu' && 
      btn.className.includes('bg-gray-100')
    ) || markAsReadButtons[markAsReadButtons.length - 1];
    await userEvent.click(markAsReadButton);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/alerts/1/mark_as_read/');
    });
  });

  it('should mark all alerts as read', async () => {
    const userEvent = (await import('@testing-library/user-event')).default;
    const mockAlerts = [
      {
        id: 1,
        alert_type: 'NEW_APPLICATION',
        priority: 'MEDIUM',
        title: 'Alerte 1',
        message: 'Message 1',
        recipient: { id: 1, username: 'hr' },
        related_application: null,
        related_job_post: null,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        alert_type: 'HIGH_SCORE',
        priority: 'HIGH',
        title: 'Alerte 2',
        message: 'Message 2',
        recipient: { id: 1, username: 'hr' },
        related_application: null,
        related_job_post: null,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock pour /alerts/
    mockApiGet.mockResolvedValueOnce({
      data: { results: mockAlerts },
    });
    // Mock pour /alerts/unread_count/
    mockApiGet.mockResolvedValueOnce({
      data: { unread_count: 2 },
    });
    mockApiPatch.mockResolvedValue({ data: { success: true } });

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      expect(screen.getByText(/Tout marquer comme lu/i)).toBeInTheDocument();
    });

    const markAllButton = screen.getByText(/Tout marquer comme lu/i);
    await userEvent.click(markAllButton);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/alerts/1/mark_as_read/');
      expect(mockApiPatch).toHaveBeenCalledWith('/alerts/2/mark_as_read/');
    });
  });

  it('should display error state', async () => {
    const error = new Error('Failed to load alerts');
    mockApiGet.mockRejectedValueOnce(error);
    // Mock pour /alerts/unread_count/ (peut aussi échouer)
    mockApiGet.mockRejectedValueOnce(error);

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('should display unread count', async () => {
    const mockAlerts = [
      {
        id: 1,
        alert_type: 'NEW_APPLICATION',
        priority: 'MEDIUM',
        title: 'Alerte',
        message: 'Message',
        recipient: { id: 1, username: 'hr' },
        related_application: null,
        related_job_post: null,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock pour /alerts/
    mockApiGet.mockResolvedValueOnce({
      data: { results: mockAlerts },
    });
    // Mock pour /alerts/unread_count/
    mockApiGet.mockResolvedValueOnce({
      data: { unread_count: 1 },
    });

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      expect(screen.getByText(/1 non lue/i)).toBeInTheDocument();
    });
  });

  it('should display priority labels correctly', async () => {
    const mockAlerts = [
      {
        id: 1,
        alert_type: 'HIGH_SCORE',
        priority: 'HIGH',
        title: 'Alerte haute priorité',
        message: 'Message',
        recipient: { id: 1, username: 'hr' },
        related_application: null,
        related_job_post: null,
        is_read: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    // Mock pour /alerts/
    mockApiGet.mockResolvedValueOnce({
      data: { results: mockAlerts },
    });
    // Mock pour /alerts/unread_count/
    mockApiGet.mockResolvedValueOnce({
      data: { unread_count: 1 },
    });

    renderWithProviders(<Alerts />);

    await waitFor(() => {
      // "Haute" apparaît dans le titre et dans le badge de priorité
      // On vérifie le badge de priorité spécifiquement
      const priorityBadges = screen.getAllByText(/Haute/i);
      expect(priorityBadges.length).toBeGreaterThan(0);
      // Vérifier qu'il y a un badge avec la classe de priorité haute
      const highPriorityBadge = priorityBadges.find(badge => 
        badge.className.includes('bg-orange-100')
      );
      expect(highPriorityBadge).toBeInTheDocument();
    });
  });
});

