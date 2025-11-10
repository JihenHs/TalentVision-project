import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface Application {
  id: number;
  candidate: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  job_post: {
    id: number;
    title: string;
  };
  status: string;
  compatibility_score: number | null;
  applied_at: string;
  candidate_profile: {
    id: number;
    experience_years: number;
    current_position: string;
    extracted_skills: Array<{ id: number; name: string }>;
    cv_analysis_result: {
      skills: string[];
      experience: {
        years: number;
        positions: string[];
      };
      education: string[];
    } | null;
  } | null;
}

interface BestMatchesResponse {
  job_post: {
    id: number;
    title: string;
    required_skills: string[];
  };
  applications: Application[];
  total: number;
  with_score: number;
}

export default function JobPostBestMatches() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<BestMatchesResponse>({
    queryKey: ['job-post-best-matches', id],
    queryFn: async () => {
      const response = await api.get(`/job-posts/${id}/best_matches/`);
      return response.data;
    },
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-yellow-100 text-yellow-800',
      INTERVIEW: 'bg-purple-100 text-purple-800',
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement des candidatures</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { job_post, applications, total, with_score } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            <span>←</span>
            <span>Retour</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Candidatures les plus compatibles
          </h1>
          <p className="text-lg text-gray-600">
            Pour l'offre : <span className="font-semibold">{job_post.title}</span>
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total de candidatures</div>
            <div className="text-3xl font-bold text-gray-900">{total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Avec score calculé</div>
            <div className="text-3xl font-bold text-indigo-600">{with_score}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Compétences requises</div>
            <div className="text-lg font-semibold text-gray-900">
              {job_post.required_skills.length} compétence{job_post.required_skills.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Compétences requises */}
        {job_post.required_skills.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Compétences requises</h2>
            <div className="flex flex-wrap gap-2">
              {job_post.required_skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Liste des candidatures */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">Aucune candidature pour cette offre</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const profile = application.candidate_profile;
              const analysisResult = profile?.cv_analysis_result;
              const candidateSkills = profile?.extracted_skills || [];
              const analysisSkills = analysisResult?.skills || [];

              // Compétences correspondantes
              const matchingSkills = job_post.required_skills.filter((reqSkill) => {
                const reqLower = reqSkill.toLowerCase();
                return (
                  candidateSkills.some((s) => s.name.toLowerCase() === reqLower) ||
                  analysisSkills.some((s) => s.toLowerCase() === reqLower)
                );
              });

              return (
                <div
                  key={application.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {application.candidate.first_name} {application.candidate.last_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                      <p className="text-gray-600">{application.candidate.email}</p>
                      {profile?.current_position && (
                        <p className="text-sm text-gray-500 mt-1">
                          Poste actuel : {profile.current_position}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {application.compatibility_score !== null ? (
                        <div className="flex flex-col items-end">
                          <span className={`text-3xl font-bold ${getScoreColor(application.compatibility_score)}`}>
                            {application.compatibility_score}%
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getScoreBadgeColor(application.compatibility_score)}`}>
                            Compatibilité
                          </span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">Score non calculé</div>
                      )}
                    </div>
                  </div>

                  {/* Informations du candidat */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Expérience */}
                    {profile && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Expérience</h4>
                        <p className="text-sm text-gray-600">
                          {profile.experience_years || analysisResult?.experience?.years || 0} ans
                          {analysisResult?.experience?.positions && analysisResult.experience.positions.length > 0 && (
                            <span className="ml-2">
                              • {analysisResult.experience.positions[0]}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Compétences correspondantes */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Compétences correspondantes ({matchingSkills.length}/{job_post.required_skills.length})
                      </h4>
                      {matchingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {matchingSkills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {matchingSkills.length > 5 && (
                            <span className="px-2 py-1 text-gray-500 text-xs">
                              +{matchingSkills.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Aucune correspondance</p>
                      )}
                    </div>
                  </div>

                  {/* Compétences du candidat */}
                  {(candidateSkills.length > 0 || analysisSkills.length > 0) && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Compétences du candidat</h4>
                      <div className="flex flex-wrap gap-2">
                        {candidateSkills.slice(0, 10).map((skill) => (
                          <span
                            key={skill.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {analysisSkills.slice(0, 10).map((skill, index) => (
                          <span
                            key={`analysis-${index}`}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {(candidateSkills.length + analysisSkills.length) > 10 && (
                          <span className="px-2 py-1 text-gray-500 text-xs">
                            +{candidateSkills.length + analysisSkills.length - 10} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formation */}
                  {analysisResult?.education && analysisResult.education.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Formation</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {analysisResult.education.slice(0, 3).map((edu, index) => (
                          <li key={index}>{edu}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Candidature du {new Date(application.applied_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <Link
                      to={`/applications/${application.id}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

