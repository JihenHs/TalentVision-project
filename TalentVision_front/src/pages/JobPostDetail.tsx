import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { authService } from '../lib/auth';

interface JobPost {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  required_skills: Array<{ id: number; name: string; category: string }>;
  created_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  closing_date: string | null;
  applications_count: number;
}

export default function JobPostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = authService.getCurrentUser();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    cover_letter: '',
    cv_file: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: jobPost, isLoading, error } = useQuery<JobPost>({
    queryKey: ['job-post', id],
    queryFn: async () => {
      const response = await api.get(`/job-posts/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  // Vérifier si l'utilisateur a déjà postulé
  const { data: userApplications } = useQuery({
    queryKey: ['user-applications', user?.id],
    queryFn: async () => {
      const response = await api.get('/applications/');
      return response.data.results || response.data;
    },
    enabled: !!user && user.role === 'CANDIDATE',
  });

  const hasApplied = Array.isArray(userApplications) && userApplications.some(
    (app: any) => app.job_post?.id === parseInt(id || '0')
  );

  const applyMutation = useMutation({
    mutationFn: async (data: { cover_letter: string; cv_file: File | null }) => {
      const formDataToSend = new FormData();
      formDataToSend.append('cover_letter', data.cover_letter);
      if (data.cv_file) {
        formDataToSend.append('cv_file', data.cv_file);
      }
      
      const response = await api.post(`/job-posts/${id}/apply/`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-post', id] });
      queryClient.invalidateQueries({ queryKey: ['job-posts'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      setShowApplyModal(false);
      setFormData({ cover_letter: '', cv_file: null });
      setErrors({});
      alert('Candidature envoyée avec succès!');
    },
    onError: (error: any) => {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        alert(error.response?.data?.error || 'Erreur lors de la candidature');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    if (!formData.cv_file) {
      setErrors({ cv_file: 'Le CV est obligatoire' });
      return;
    }
    
    applyMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ cv_file: 'Le fichier est trop volumineux (max 10MB)' });
        return;
      }
      // Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ cv_file: 'Format de fichier non supporté. Utilisez PDF ou DOCX' });
        return;
      }
      setFormData({ ...formData, cv_file: file });
      setErrors({ ...errors, cv_file: '' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error || !jobPost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Offre introuvable</h2>
          <p className="text-gray-600 mb-4">L'offre d'emploi que vous recherchez n'existe pas.</p>
          <Link
            to="/job-posts"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Retour aux offres
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (min && max) {
      return `${min.toLocaleString('fr-FR')} dt - ${max.toLocaleString('fr-FR')} dt`;
    } else if (min) {
      return `À partir de ${min.toLocaleString('fr-FR')} dt`;
    } else if (max) {
      return `Jusqu'à ${max.toLocaleString('fr-FR')} dt`;
    }
    return 'Non spécifié';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/job-posts')}
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            ← Retour aux offres
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{jobPost.title}</h1>
                <div className="flex items-center space-x-4 text-indigo-100">
                  {jobPost.location && (
                    <span className="flex items-center">
                      📍 {jobPost.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    📅 Publiée le {formatDate(jobPost.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    jobPost.status === 'PUBLISHED'
                      ? 'bg-green-500 text-white'
                      : jobPost.status === 'CLOSED'
                      ? 'bg-gray-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {jobPost.status === 'PUBLISHED'
                    ? 'Publiée'
                    : jobPost.status === 'CLOSED'
                    ? 'Fermée'
                    : 'Brouillon'}
                </span>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-8 py-6 space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Salaire</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatSalary(jobPost.salary_min, jobPost.salary_max)}
                </p>
              </div>
              {jobPost.closing_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date de clôture</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(jobPost.closing_date)}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Créée par</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {jobPost.created_by.first_name} {jobPost.created_by.last_name}
                </p>
              </div>
              {(user?.role === 'HR' || user?.role === 'MANAGER') && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Candidatures</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {jobPost.applications_count || 0} candidature(s)
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Description du poste</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{jobPost.description}</p>
              </div>
            </div>

            {/* Exigences */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Exigences et qualifications</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{jobPost.requirements}</p>
              </div>
            </div>

            {/* Compétences requises */}
            {jobPost.required_skills && jobPost.required_skills.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Compétences requises</h2>
                <div className="flex flex-wrap gap-2">
                  {jobPost.required_skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Dernière mise à jour : {formatDate(jobPost.updated_at)}
              </div>
              <div className="flex gap-3">
                {(user?.role === 'HR' || user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                  <>
                    <Link
                      to={`/job-posts/${jobPost.id}/best-matches`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                    >
                      <span>🎯</span>
                      <span>Meilleurs matches</span>
                    </Link>
                    <Link
                      to={`/job-posts/${jobPost.id}/applications`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Voir candidatures
                    </Link>
                  </>
                )}
                {user?.role === 'CANDIDATE' && jobPost.status === 'PUBLISHED' && (
                  <>
                    {hasApplied ? (
                      <div className="px-6 py-2 bg-green-100 text-green-800 rounded-md font-medium">
                        ✓ Vous avez déjà postulé à cette offre
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowApplyModal(true)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                      >
                        Postuler maintenant
                      </button>
                    )}
                  </>
                )}
                {(user?.role === 'HR' || user?.role === 'MANAGER') && (
                  <Link
                    to={`/job-posts/${jobPost.id}/applications`}
                    className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                  >
                    Voir candidatures
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de candidature */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Postuler à cette offre</h2>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setFormData({ cover_letter: '', cv_file: null });
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Titre du poste (read-only) */}
                <div>
                  <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                    Poste *
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    readOnly
                    value={jobPost.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Upload CV */}
                <div>
                  <label htmlFor="cv_file" className="block text-sm font-medium text-gray-700 mb-2">
                    CV (PDF ou DOCX) *
                  </label>
                  <input
                    type="file"
                    id="cv_file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {errors.cv_file && (
                    <p className="mt-1 text-sm text-red-600">{errors.cv_file}</p>
                  )}
                  {formData.cv_file && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ Fichier sélectionné : {formData.cv_file.name} ({(formData.cv_file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Formats acceptés : PDF, DOC, DOCX (max 10MB)
                  </p>
                </div>

                {/* Lettre de motivation */}
                <div>
                  <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-2">
                    Lettre de motivation *
                  </label>
                  <textarea
                    id="cover_letter"
                    required
                    rows={8}
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Rédigez votre lettre de motivation ici. Présentez-vous, expliquez pourquoi vous êtes intéressé par ce poste et ce que vous pouvez apporter à l'entreprise..."
                  />
                  {errors.cover_letter && (
                    <p className="mt-1 text-sm text-red-600">{errors.cover_letter}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.cover_letter.length} caractères
                  </p>
                </div>


                {/* Boutons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setFormData({ cover_letter: '', cv_file: null });
                      setErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={applyMutation.isPending}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {applyMutation.isPending ? 'Envoi en cours...' : 'Envoyer ma candidature'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

