import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

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
  };
  status: string;
  compatibility_score: number | null;
  interview_notes: string;
  interview_date: string | null;
  source: string;
  applied_at: string;
  updated_at: string;
}

interface JobPost {
  id: number;
  title: string;
  status: string;
}

export default function JobPostApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Récupérer les détails de l'offre
  const { data: jobPost, isLoading: jobPostLoading } = useQuery<JobPost>({
    queryKey: ['job-post', id],
    queryFn: async () => {
      const response = await api.get(`/job-posts/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  // Récupérer les candidatures
  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['job-post-applications', id],
    queryFn: async () => {
      const response = await api.get('/applications/', {
        params: { job_post: id },
      });
      return response.data.results || response.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const response = await api.patch(`/applications/${applicationId}/`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-post-applications', id] });
      queryClient.invalidateQueries({ queryKey: ['job-post', id] });
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

  if (jobPostLoading || applicationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!jobPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Offre introuvable</h2>
          <Link to="/job-posts" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Retour aux offres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/job-posts/${id}`)}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center mb-4"
          >
            ← Retour aux détails de l'offre
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidatures</h1>
              <p className="text-gray-600 mt-2">
                {jobPost.title} - {applications?.length || 0} candidature(s)
              </p>
            </div>
          </div>
        </div>

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
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.candidate.first_name} {application.candidate.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{application.candidate.email}</p>
                        {application.candidate.phone && (
                          <p className="text-sm text-gray-500">📞 {application.candidate.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        {application.compatibility_score !== null && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                            Score: {application.compatibility_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      <div>
                        <p className="text-gray-500">Dernière mise à jour</p>
                        <p className="font-medium text-gray-900">{formatDate(application.updated_at)}</p>
                      </div>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Aucune candidature pour cette offre</p>
            <Link
              to={`/job-posts/${id}`}
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Retour aux détails de l'offre
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

