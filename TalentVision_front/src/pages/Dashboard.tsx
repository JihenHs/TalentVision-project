import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { authService } from '../lib/auth';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
  rejected_applications: number;
  average_compatibility_score: number;
  average_time_to_hire: number;
  applications_by_source: Record<string, number>;
  applications_by_status: Record<string, number>;
  top_skills_demand: Array<{ name: string; count: number }>;
  internal_matches_count: number;
}

export default function Dashboard() {
  const user = authService.getCurrentUser();
  const isHRorManager = user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats/');
      return response.data;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Récupérer les offres d'emploi pour les statistiques
  const { data: jobPosts } = useQuery({
    queryKey: ['job-posts-count'],
    queryFn: async () => {
      const response = await api.get('/job-posts/');
      return response.data.results || response.data;
    },
    enabled: isHRorManager,
  });

  // Récupérer les alertes non lues
  const { data: unreadAlerts } = useQuery<{ unread_count: number }>({
    queryKey: ['alerts-unread-count'],
    queryFn: async () => {
      const response = await api.get('/alerts/unread_count/');
      return response.data;
    },
    enabled: isHRorManager,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement des statistiques</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const statusData = Object.entries(stats?.applications_by_status || {}).map(([name, value]) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      REVIEWED: 'Examinée',
      SHORTLISTED: 'Pré-sélectionnée',
      INTERVIEW: 'Entretien',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
    };
    return {
      name: labels[name] || name,
      value: value as number,
    };
  });

  const sourceData = Object.entries(stats?.applications_by_source || {}).map(([name, value]) => {
    const labels: Record<string, string> = {
      WEBSITE: 'Site web',
      LINKEDIN: 'LinkedIn',
      REFERRAL: 'Recommandation',
      OTHER: 'Autre',
    };
    return {
      name: labels[name] || name,
      value: value as number,
    };
  });

  const publishedJobs = jobPosts?.filter((job: any) => job.status === 'PUBLISHED')?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard - {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'CANDIDATE' ? 'Vue d\'ensemble de vos candidatures' : 'Vue d\'ensemble du recrutement'}
            </p>
          </div>
          {isHRorManager && unreadAlerts && unreadAlerts.unread_count > 0 && (
            <Link
              to="/alerts"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center space-x-2"
            >
              <span>🔔</span>
              <span>{unreadAlerts.unread_count} alerte(s) non lue(s)</span>
            </Link>
          )}
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Candidatures</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_applications || 0}
                </p>
              </div>
              <div className="text-4xl text-blue-500">📊</div>
            </div>
            {isHRorManager && (
              <Link
                to="/applications"
                className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
              >
                Voir toutes →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">En attente</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats?.pending_applications || 0}
                </p>
              </div>
              <div className="text-4xl text-yellow-500">⏳</div>
            </div>
            {(stats?.pending_applications ?? 0) > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Nécessitent une action
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Acceptées</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats?.accepted_applications || 0}
                </p>
              </div>
              <div className="text-4xl text-green-500">✅</div>
            </div>
            {(stats?.total_applications ?? 0) > 0 && stats && (
              <p className="text-xs text-gray-500 mt-2">
                {((stats.accepted_applications / stats.total_applications) * 100).toFixed(1)}% du total
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Score moyen</h3>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {stats?.average_compatibility_score?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="text-4xl text-indigo-500">⭐</div>
            </div>
            {stats?.average_compatibility_score && (
              <p className="text-xs text-gray-500 mt-2">
                Compatibilité moyenne
              </p>
            )}
          </div>
        </div>

        {/* Statistiques supplémentaires pour HR/Manager */}
        {isHRorManager && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Offres publiées</h3>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {publishedJobs}
                  </p>
                </div>
                <div className="text-4xl text-purple-500">📋</div>
              </div>
              <Link
                to="/job-posts"
                className="text-sm text-purple-600 hover:text-purple-700 mt-4 inline-block"
              >
                Voir les offres →
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Temps moyen de recrutement</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {stats?.average_time_to_hire?.toFixed(1) || 0} jours
                  </p>
                </div>
                <div className="text-4xl text-orange-500">⏱️</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Délai moyen d'embauche
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Matching interne</h3>
                  <p className="text-3xl font-bold text-teal-600 mt-2">
                    {stats?.internal_matches_count || 0}
                  </p>
                </div>
                <div className="text-4xl text-teal-500">🔄</div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Talents disponibles
              </p>
            </div>
          </div>
        )}

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Candidatures par statut */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Candidatures par statut</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-300 text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>

          {/* Candidatures par source */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Candidatures par source</h3>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-300 text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Top compétences demandées */}
        {stats?.top_skills_demand && stats.top_skills_demand.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Top compétences demandées</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.top_skills_demand.slice(0, 10).map((skill: any, index: number) => (
                <div
                  key={index}
                  className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200"
                >
                  <p className="font-semibold text-indigo-900">{skill.name}</p>
                  <p className="text-sm text-indigo-600 mt-1">{skill.count} poste(s)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/job-posts/new"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">➕</div>
              <p className="font-medium text-gray-900">Créer une offre</p>
              <p className="text-sm text-gray-500">Publier une nouvelle offre d'emploi</p>
            </Link>
            <Link
              to="/applications"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📝</div>
              <p className="font-medium text-gray-900">Voir candidatures</p>
              <p className="text-sm text-gray-500">
                {stats?.pending_applications || 0} en attente
              </p>
            </Link>
            {isHRorManager && (
              <Link
                to="/alerts"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🔔</div>
                <p className="font-medium text-gray-900">Voir alertes</p>
                <p className="text-sm text-gray-500">
                  {unreadAlerts?.unread_count || 0} non lue(s)
                </p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
