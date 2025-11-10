import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { authService } from '../lib/auth';

interface Application {
  id: number;
  candidate: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  job_post: {
    id: number;
    title: string;
    status: string;
  };
  status: string;
  compatibility_score: number | null;
  interview_notes: string;
  interview_date: string | null;
  source: string;
  applied_at: string;
  updated_at: string;
}

export default function Applications() {
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  
  // États pour le filtrage et le tri
  const [selectedJobPost, setSelectedJobPost] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  // Récupérer la liste des offres (pour le filtre)
  const { data: jobPosts } = useQuery({
    queryKey: ['job-posts-for-filter'],
    queryFn: async () => {
      const response = await api.get('/job-posts/');
      return response.data.results || response.data;
    },
    enabled: user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN',
  });

  // Récupérer les candidatures avec filtres et tri
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['applications', selectedJobPost, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedJobPost) {
        params.append('job_post', selectedJobPost);
      }
      if (sortBy) {
        params.append('ordering', sortBy);
      }
      const queryString = params.toString();
      const url = queryString ? `/applications/?${queryString}` : '/applications/';
      const response = await api.get(url);
      return response.data.results || response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const response = await api.patch(`/applications/${applicationId}/`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-posts'] });
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-purple-100 text-purple-800',
      INTERVIEW: 'bg-indigo-100 text-indigo-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      REVIEWED: 'Examinée',
      SHORTLISTED: 'Pré-sélectionnée',
      INTERVIEW: 'Entretien',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
    };
    return labels[status] || status;
  };

  const isHRorManager = user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isHRorManager ? 'Toutes les candidatures' : 'Mes candidatures'}
          </h1>
          <p className="text-gray-600 mt-2">
            {applications?.length || 0} candidature(s)
          </p>
        </div>

        {/* Filtres et tri */}
        {isHRorManager && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtre par offre */}
              <div>
                <label htmlFor="job-post-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par offre
                </label>
                <select
                  id="job-post-filter"
                  value={selectedJobPost}
                  onChange={(e) => setSelectedJobPost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Toutes les offres</option>
                  {jobPosts?.map((job: any) => (
                    <option key={job.id} value={job.id.toString()}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tri */}
              <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="date_desc">Date (plus récentes)</option>
                  <option value="date_asc">Date (plus anciennes)</option>
                  <option value="score_desc">Score (plus élevé)</option>
                  <option value="score_asc">Score (plus faible)</option>
                </select>
              </div>
            </div>

            {/* Bouton réinitialiser */}
            {(selectedJobPost || sortBy !== 'date_desc') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedJobPost('');
                    setSortBy('date_desc');
                  }}
                  className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Liste des candidatures */}
        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {isHRorManager ? (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {application.candidate.first_name} {application.candidate.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">{application.candidate.email}</p>
                            {application.candidate.phone && (
                              <p className="text-sm text-gray-500">📞 {application.candidate.phone}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {application.job_post.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Offre {application.job_post.status === 'PUBLISHED' ? 'publiée' : application.job_post.status.toLowerCase()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        {application.compatibility_score !== null ? (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            application.compatibility_score >= 80
                              ? 'bg-green-100 text-green-800'
                              : application.compatibility_score >= 60
                              ? 'bg-yellow-100 text-yellow-800'
                              : application.compatibility_score >= 40
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            🎯 {application.compatibility_score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            Score: N/A
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                      {isHRorManager && (
                        <div>
                          <p className="text-gray-500">Offre</p>
                          <Link
                            to={`/job-posts/${application.job_post.id}`}
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            {application.job_post.title}
                          </Link>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Date de candidature</p>
                        <p className="font-medium text-gray-900">{formatDate(application.applied_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Source</p>
                        <p className="font-medium text-gray-900">{application.source}</p>
                      </div>
                      {application.interview_date && (
                        <div>
                          <p className="text-gray-500">Date d'entretien</p>
                          <p className="font-medium text-gray-900">{formatDate(application.interview_date)}</p>
                        </div>
                      )}
                    </div>

                    {application.interview_notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Notes d'entretien</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{application.interview_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col space-y-2">
                    {isHRorManager && (
                      <select
                        value={application.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            applicationId: application.id,
                            status: e.target.value,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="PENDING">En attente</option>
                        <option value="REVIEWED">Examinée</option>
                        <option value="SHORTLISTED">Pré-sélectionnée</option>
                        <option value="INTERVIEW">Entretien</option>
                        <option value="ACCEPTED">Acceptée</option>
                        <option value="REJECTED">Refusée</option>
                      </select>
                    )}
                    <Link
                      to={`/applications/${application.id}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm text-center font-medium"
                    >
                      Voir détails
                    </Link>
                    <Link
                      to={`/job-posts/${application.job_post.id}`}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm text-center font-medium"
                    >
                      Voir l'offre
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              {isHRorManager ? 'Aucune candidature pour le moment' : 'Vous n\'avez pas encore postulé à une offre'}
            </p>
            {!isHRorManager && (
              <Link
                to="/job-posts"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Voir les offres disponibles
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

