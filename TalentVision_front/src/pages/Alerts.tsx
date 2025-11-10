import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Alert {
  id: number;
  alert_type: string;
  priority: string;
  title: string;
  message: string;
  recipient: {
    id: number;
    username: string;
  };
  related_application: {
    id: number;
    candidate: {
      first_name: string;
      last_name: string;
    };
    job_post: {
      id: number;
      title: string;
    };
  } | null;
  related_job_post: {
    id: number;
    title: string;
  } | null;
  is_read: boolean;
  created_at: string;
}

export default function Alerts() {
  const queryClient = useQueryClient();

  // Récupérer les alertes
  const { data: alerts, isLoading, error } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const response = await api.get('/alerts/');
        return response.data.results || response.data;
      } catch (err: any) {
        console.error('Erreur lors du chargement des alertes:', err);
        throw err;
      }
    },
  });

  // Compter les alertes non lues
  const { data: unreadCount } = useQuery<{ unread_count: number }>({
    queryKey: ['alerts-unread-count'],
    queryFn: async () => {
      const response = await api.get('/alerts/unread_count/');
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await api.patch(`/alerts/${alertId}/mark_as_read/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Marquer toutes les alertes non lues comme lues
      const unreadAlerts = alerts?.filter((alert) => !alert.is_read) || [];
      await Promise.all(
        unreadAlerts.map((alert) => api.patch(`/alerts/${alert.id}/mark_as_read/`))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      LOW: 'Faible',
      MEDIUM: 'Moyenne',
      HIGH: 'Haute',
      URGENT: 'Urgente',
    };
    return labels[priority] || priority;
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels: Record<string, string> = {
      CANDIDATE_MATCH: 'Candidat correspondant',
      INTERNAL_MATCH: 'Matching interne',
      HIGH_SCORE: 'Score élevé',
      NEW_APPLICATION: 'Nouvelle candidature',
      TURNOVER_RISK: 'Risque de départ',
    };
    return labels[alertType] || alertType;
  };

  const getAlertTypeIcon = (alertType: string) => {
    const icons: Record<string, string> = {
      CANDIDATE_MATCH: '👤',
      INTERNAL_MATCH: '🔄',
      HIGH_SCORE: '⭐',
      NEW_APPLICATION: '📝',
      TURNOVER_RISK: '⚠️',
    };
    return icons[alertType] || '🔔';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur lors du chargement</h2>
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement des alertes.'}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['alerts'] })}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unreadAlerts = alerts?.filter((alert) => !alert.is_read) || [];

  // Debug: afficher les données dans la console
  console.log('Alerts data:', alerts);
  console.log('Alerts count:', alerts?.length);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alertes</h1>
              <p className="text-gray-600 mt-2">
                {alerts?.length || 0} alerte(s) • {unreadCount?.unread_count || unreadAlerts.length} non lue(s)
              </p>
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-400 mt-1">
                  Debug: {alerts ? `${alerts.length} alertes chargées` : 'Aucune donnée'}
                </p>
              )}
            </div>
            {unreadAlerts.length > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {markAllAsReadMutation.isPending ? 'Traitement...' : 'Tout marquer comme lu'}
              </button>
            )}
          </div>
        </div>

        {/* Liste des alertes */}
        {alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
                  !alert.is_read ? 'border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getAlertTypeIcon(alert.alert_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-lg font-semibold ${!alert.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {alert.title}
                          </h3>
                          {!alert.is_read && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              Nouveau
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                            {getPriorityLabel(alert.priority)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 whitespace-pre-line">{alert.message}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {formatDate(alert.created_at)}</span>
                      {alert.related_job_post && (
                        <Link
                          to={`/job-posts/${alert.related_job_post.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          📋 Voir l'offre: {alert.related_job_post.title}
                        </Link>
                      )}
                      {alert.related_application && (
                        <Link
                          to={`/job-posts/${alert.related_application.job_post.id}/applications`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          👤 Voir candidature: {alert.related_application.candidate.first_name}{' '}
                          {alert.related_application.candidate.last_name}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsReadMutation.mutate(alert.id)}
                        disabled={markAsReadMutation.isPending}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm font-medium"
                      >
                        Marquer comme lu
                      </button>
                    )}
                    {alert.is_read && (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                        ✓ Lu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-gray-500 text-lg font-medium">Aucune alerte pour le moment</p>
            <p className="text-gray-400 text-sm mt-2 mb-4">
              Vous serez notifié lorsque de nouvelles alertes seront générées
            </p>
            <div className="text-xs text-gray-400 mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">💡 Pour tester les alertes :</p>
              <p>Les alertes sont créées automatiquement lorsque :</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-left max-w-md mx-auto">
                <li>Un candidat obtient un score de compatibilité ≥ 80%</li>
                <li>Une nouvelle candidature est soumise</li>
                <li>Un matching interne est détecté</li>
              </ul>
              <p className="mt-3 text-xs">
                Vous pouvez aussi créer des alertes de test avec la commande Django :
                <code className="block mt-1 bg-gray-200 px-2 py-1 rounded">python manage.py create_test_alerts</code>
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={async () => {
                  try {
                    const response = await api.post('/alerts/create_test_alerts/');
                    queryClient.invalidateQueries({ queryKey: ['alerts'] });
                    queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
                    alert(`✅ ${response.data.message}`);
                  } catch (error: any) {
                    alert(`Erreur: ${error.response?.data?.error || error.message}`);
                  }
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
              >
                🧪 Créer des alertes de test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

