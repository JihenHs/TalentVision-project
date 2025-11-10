import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { authService } from '../lib/auth';

export default function JobPosts() {
  const user = authService.getCurrentUser();
  const queryClient = useQueryClient();

  const { data: jobPosts, isLoading } = useQuery({
    queryKey: ['job-posts'],
    queryFn: async () => {
      const response = await api.get('/job-posts/');
      return response.data.results || response.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const response = await api.post(`/job-posts/${jobId}/apply/`, {
        cover_letter: '',
        source: 'WEBSITE',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-posts'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      alert('Candidature envoyée avec succès!');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offres d'emploi</h1>
          {(user?.role === 'HR' || user?.role === 'MANAGER') && (
            <Link
              to="/job-posts/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Créer une offre
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobPosts?.map((job: any) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>
              <div className="mb-4">
                <span
                  className={`inline-block px-2 py-1 rounded text-sm ${
                    job.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {job.status === 'PUBLISHED' ? 'Publiée' : job.status}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  {job.applications_count || 0} candidature(s)
                </p>
              </div>
              {job.required_skills && job.required_skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.slice(0, 3).map((skill: any) => (
                      <span
                        key={skill.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {job.required_skills.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{job.required_skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Link
                  to={`/job-posts/${job.id}`}
                  className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Voir détails
                </Link>
                {user?.role === 'CANDIDATE' && job.status === 'PUBLISHED' && (
                  <button
                    onClick={() => applyMutation.mutate(job.id)}
                    disabled={applyMutation.isPending}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {applyMutation.isPending ? 'Envoi...' : 'Postuler'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {(!jobPosts || jobPosts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune offre d'emploi disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}

