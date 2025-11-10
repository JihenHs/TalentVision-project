import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { authService } from '../lib/auth';

interface CandidateProfile {
  id: number;
  cv_file: string | null;
  cover_letter: string;
  extracted_skills: Array<{ id: number; name: string; category: string }>;
  experience_years: number;
  current_position: string;
  education_level: string;
  cv_analysis_status: string;
  cv_analysis_result: {
    skills?: string[];
    experience?: {
      years?: number;
      positions?: string[];
    };
    education?: string[];
    personal_info?: {
      email?: string;
      phone?: string;
      name?: string;
    };
    text_length?: number;
    extracted_text_preview?: string;
    error?: string;
  } | null;
}

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
  candidate_profile: CandidateProfile | null;
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();

  const { data: application, isLoading, error } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: async () => {
      const response = await api.get(`/applications/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch(`/applications/${id}/`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const analyzeCvMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('Profil candidat introuvable');
      }
      const response = await api.post(`/candidate-profiles/${profile.id}/analyze_cv/`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      if (data?.cv_analysis_status === 'COMPLETED') {
        alert('Analyse du CV relancée avec succès!');
      } else if (data?.cv_analysis_status === 'FAILED') {
        alert(`Analyse échouée: ${data?.cv_analysis_result?.error || 'Erreur inconnue'}`);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de l\'analyse du CV';
      console.error('Error analyzing CV:', error);
      alert(errorMessage);
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

  const getEducationLabel = (level: string) => {
    const labels: Record<string, string> = {
      BAC: 'Baccalauréat',
      'BAC+2': 'Bac+2',
      'BAC+3': 'Licence',
      'BAC+5': 'Master',
      PHD: 'Doctorat',
    };
    return labels[level] || level;
  };

  const getAnalysisStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      PROCESSING: 'En traitement',
      COMPLETED: 'Terminé',
      FAILED: 'Échoué',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Candidature introuvable</h2>
          <button
            onClick={() => navigate('/applications')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Retour aux candidatures
          </button>
        </div>
      </div>
    );
  }

  const isHRorManager = user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const profile = application.candidate_profile;
  const analysisResult = profile?.cv_analysis_result;

  // Debug: afficher les données reçues
  console.log('=== DEBUG APPLICATION DETAIL ===');
  console.log('Application data:', JSON.stringify(application, null, 2));
  console.log('Profile data:', JSON.stringify(profile, null, 2));
  console.log('Analysis result:', JSON.stringify(analysisResult, null, 2));
  console.log('Profile exists?', !!profile);
  console.log('Analysis result exists?', !!analysisResult);
  console.log('Analysis status:', profile?.cv_analysis_status);
  console.log('================================');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/applications')}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            ← Retour aux candidatures
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {application.candidate.first_name} {application.candidate.last_name}
                </h1>
                <p className="text-indigo-100">{application.candidate.email}</p>
                {application.candidate.phone && (
                  <p className="text-indigo-100">📞 {application.candidate.phone}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                  {getStatusLabel(application.status)}
                </span>
                {application.compatibility_score !== null && (
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-white text-indigo-600 rounded-full text-sm font-medium">
                      Score: {application.compatibility_score.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Offre</h3>
                <p className="text-lg font-semibold text-gray-900">{application.job_post.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Date de candidature</h3>
                <p className="text-lg font-semibold text-gray-900">{formatDate(application.applied_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Source</h3>
                <p className="text-lg font-semibold text-gray-900">{application.source}</p>
              </div>
              {application.interview_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date d'entretien</h3>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(application.interview_date)}</p>
                </div>
              )}
            </div>

            {/* Section: Informations extraites du CV */}
            {profile ? (
              <>
                {/* Debug info - toujours visible pour diagnostiquer */}
                <div className="pt-6 border-t mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs">
                    <strong>🔍 Debug Info:</strong>
                    <ul className="mt-2 space-y-1">
                      <li>Profile ID: {profile?.id || 'null'}</li>
                      <li>Status: {profile?.cv_analysis_status || 'null'}</li>
                      <li>Has CV file: {profile?.cv_file ? 'Yes' : 'No'}</li>
                      <li>Has analysis result: {analysisResult ? 'Yes' : 'No'}</li>
                      {analysisResult && (
                        <>
                          <li>Skills count: {analysisResult.skills?.length || 0}</li>
                          <li>Experience years: {analysisResult.experience?.years || 0}</li>
                          <li>Positions count: {analysisResult.experience?.positions?.length || 0}</li>
                          <li>Education count: {analysisResult.education?.length || 0}</li>
                          <li>Has personal info: {analysisResult.personal_info ? 'Yes' : 'No'}</li>
                          {analysisResult.error && (
                            <li className="text-red-600">Error: {analysisResult.error}</li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="pt-6 border-t">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    ⚠️ Profil candidat non trouvé
                  </h3>
                  <p className="text-sm text-red-800">
                    Le profil candidat n'existe pas. Cela peut arriver si le CV n'a pas encore été uploadé.
                  </p>
                </div>
              </div>
            )}
            
            {profile ? (
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">📄 Informations extraites du CV</h2>
                  <div className="flex gap-2">
                    {profile.cv_file && (
                      <a
                        href={profile.cv_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                      >
                        <span>📄</span>
                        <span>Télécharger le CV</span>
                      </a>
                    )}
                    {(profile.cv_analysis_status === 'PENDING' || profile.cv_analysis_status === 'FAILED') && (
                      <button
                        onClick={() => analyzeCvMutation.mutate()}
                        disabled={analyzeCvMutation.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <span>🔄</span>
                        <span>{analyzeCvMutation.isPending ? 'Analyse en cours...' : 'Relancer l\'analyse'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Debug info - à retirer en production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
                    <strong>Debug:</strong> Profile ID: {profile.id}, Status: {profile.cv_analysis_status}, 
                    Skills count: {profile.extracted_skills?.length || 0}, 
                    Analysis result keys: {analysisResult ? Object.keys(analysisResult).join(', ') : 'none'}
                  </div>
                )}

                {/* Statut de l'analyse */}
                <div className="mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                    profile.cv_analysis_status === 'COMPLETED' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : profile.cv_analysis_status === 'PROCESSING'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : profile.cv_analysis_status === 'FAILED'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-50 text-gray-800 border border-gray-200'
                  }`}>
                    <span className="text-sm font-medium">
                      Statut: {getAnalysisStatusLabel(profile.cv_analysis_status)}
                    </span>
                  </div>
                </div>

                {/* Grille principale des informations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Compétences */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>💼</span>
                      <span>Compétences</span>
                    </h3>
                    {(() => {
                      const hasExtractedSkills = profile.extracted_skills && profile.extracted_skills.length > 0;
                      const hasAnalysisSkills = analysisResult?.skills && analysisResult.skills.length > 0;
                      
                      if (hasExtractedSkills || hasAnalysisSkills) {
                        return (
                          <>
                            {hasExtractedSkills && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {profile.extracted_skills.map((skill) => (
                                  <span
                                    key={skill.id}
                                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                                  >
                                    {skill.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {hasAnalysisSkills && (
                              <div>
                                {hasExtractedSkills && (
                                  <p className="text-xs text-gray-500 mb-2">Compétences supplémentaires détectées par IA:</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {analysisResult.skills?.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      } else {
                        return (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">Aucune compétence détectée</p>
                            {profile.cv_analysis_status === 'PENDING' && (
                              <p className="text-xs text-gray-400 mt-1">Analyse en cours...</p>
                            )}
                            {profile.cv_analysis_status === 'FAILED' && (
                              <p className="text-xs text-red-400 mt-1">Erreur lors de l'analyse</p>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Expérience et Éducation */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🎓</span>
                      <span>Expérience & Formation</span>
                    </h3>
                    <div className="space-y-4">
                      {/* Années d'expérience */}
                      {(profile.experience_years > 0 || analysisResult?.experience?.years) && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Années d'expérience</span>
                          <span className="text-lg font-bold text-indigo-600">
                            {analysisResult?.experience?.years || profile.experience_years} ans
                          </span>
                        </div>
                      )}

                      {/* Poste actuel */}
                      {profile.current_position && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Poste actuel</p>
                          <p className="text-sm font-medium text-gray-900">{profile.current_position}</p>
                        </div>
                      )}

                      {/* Postes détectés */}
                      {analysisResult?.experience?.positions && analysisResult.experience.positions.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Postes détectés</p>
                          <ul className="space-y-1">
                            {analysisResult.experience.positions.map((position, index) => (
                              <li key={index} className="text-sm text-gray-700">• {position}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Niveau d'éducation */}
                      {profile.education_level && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Niveau d'éducation</p>
                          <p className="text-sm font-medium text-gray-900">
                            {getEducationLabel(profile.education_level)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formation/Éducation */}
                {analysisResult?.education && analysisResult.education.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🎓</span>
                      <span>Formation / Éducation détectée</span>
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.education.map((edu, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-indigo-600">•</span>
                          <span className="text-sm text-gray-700">{edu}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Informations personnelles extraites */}
                {analysisResult?.personal_info && (
                  (analysisResult.personal_info.email || analysisResult.personal_info.phone) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>👤</span>
                        <span>Informations de contact extraites</span>
                      </h3>
                      <div className="space-y-2">
                        {analysisResult.personal_info.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Email:</span>
                            <span className="text-sm text-gray-700">{analysisResult.personal_info.email}</span>
                          </div>
                        )}
                        {analysisResult.personal_info.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">Téléphone:</span>
                            <span className="text-sm text-gray-700">{analysisResult.personal_info.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Aperçu du texte extrait */}
                {analysisResult?.extracted_text_preview && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📝</span>
                      <span>Aperçu du CV extrait</span>
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {analysisResult.extracted_text_preview}
                        {analysisResult.text_length && analysisResult.text_length > 1000 && '...'}
                      </p>
                      {analysisResult.text_length && (
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                          Longueur totale du CV: {analysisResult.text_length.toLocaleString('fr-FR')} caractères
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-6 border-t">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    ⚠️ Profil candidat non disponible
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Le profil candidat n'a pas encore été créé ou le CV n'a pas été analysé.
                  </p>
                </div>
              </div>
            )}

            {/* Lettre de motivation */}
            {profile?.cover_letter && (
              <div className="pt-6 border-t">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Lettre de motivation</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-line">{profile.cover_letter}</p>
                </div>
              </div>
            )}

            {/* Notes d'entretien */}
            {application.interview_notes && (
              <div className="pt-6 border-t">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Notes d'entretien</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-line">{application.interview_notes}</p>
                </div>
              </div>
            )}

            {/* Actions pour HR/Manager */}
            {isHRorManager && (
              <div className="pt-6 border-t">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Modifier le statut
                    </label>
                    <select
                      id="status"
                      value={application.status}
                      onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

