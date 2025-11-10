import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface Skill {
  id: number;
  name: string;
  category: string;
}

export default function CreateJobPost() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_min: '',
    salary_max: '',
    status: 'DRAFT',
    required_skills_ids: [] as number[],
    closing_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Récupérer la liste des compétences
  const { data: skills, isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await api.get('/skills/');
      return response.data.results || response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/job-posts/', data);
      return response.data;
    },
    onSuccess: () => {
      navigate('/job-posts');
    },
    onError: (error: any) => {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const submitData = {
      ...formData,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      required_skills_ids: formData.required_skills_ids,
      closing_date: formData.closing_date || null,
    };

    createMutation.mutate(submitData);
  };

  const handleSkillToggle = (skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      required_skills_ids: prev.required_skills_ids.includes(skillId)
        ? prev.required_skills_ids.filter((id) => id !== skillId)
        : [...prev.required_skills_ids, skillId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Créer une offre d'emploi</h1>
          <p className="mt-2 text-gray-600">Remplissez les informations pour publier une nouvelle offre</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du poste *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Développeur Full Stack"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Décrivez le poste, les responsabilités principales..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Exigences */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
              Exigences et qualifications *
            </label>
            <textarea
              id="requirements"
              required
              rows={5}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Listez les compétences, expériences et qualifications requises..."
            />
            {errors.requirements && <p className="mt-1 text-sm text-red-600">{errors.requirements}</p>}
          </div>

          {/* Localisation */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Localisation
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Paris, France"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>

          {/* Salaire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-2">
                Salaire minimum
              </label>
              <input
                type="number"
                id="salary_min"
                min="0"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: 40000 dt"
              />
              {errors.salary_min && <p className="mt-1 text-sm text-red-600">{errors.salary_min}</p>}
            </div>
            <div>
              <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-2">
                Salaire maximum
              </label>
              <input
                type="number"
                id="salary_max"
                min="0"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: 60000 dt"
              />
              {errors.salary_max && <p className="mt-1 text-sm text-red-600">{errors.salary_max}</p>}
            </div>
          </div>

          {/* Date de clôture */}
          <div>
            <label htmlFor="closing_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date de clôture
            </label>
            <input
              type="date"
              id="closing_date"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.closing_date && <p className="mt-1 text-sm text-red-600">{errors.closing_date}</p>}
          </div>

          {/* Compétences requises */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compétences requises
            </label>
            {skillsLoading ? (
              <p className="text-gray-500">Chargement des compétences...</p>
            ) : (
              <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {skills?.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.required_skills_ids.includes(skill.id)}
                        onChange={() => handleSkillToggle(skill.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{skill.name}</span>
                    </label>
                  ))}
                </div>
                {(!skills || skills.length === 0) && (
                  <p className="text-gray-500 text-sm">Aucune compétence disponible</p>
                )}
              </div>
            )}
            {errors.required_skills_ids && (
              <p className="mt-1 text-sm text-red-600">{errors.required_skills_ids}</p>
            )}
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publiée</option>
              <option value="CLOSED">Fermée</option>
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/job-posts')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Création...' : 'Créer l\'offre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

