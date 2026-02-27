import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProviderProfile, Experience } from '@/types/provider';
import { Plus, Trash2, Calendar, Briefcase, Building2, Pencil, Check, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ModernDatePicker from '@/components/ui/ModernDatePicker';

interface ExperienceTabProps {
  profile: ProviderProfile;
  setProfile: (profile: ProviderProfile) => void;
}

const experienceSchema = z.object({
  role: z.string().min(2, "Le rôle est requis"),
  company: z.string().min(2, "L'entreprise est requise"),
  startDate: z.string().min(1, "Date de début requise"),
  isCurrent: z.boolean(),
  endDate: z.string().optional(),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
}).refine(data => data.isCurrent || (data.endDate && data.endDate.length > 0), {
  message: "La date de fin est requise pour les postes passés",
  path: ["endDate"],
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

export default function ExperienceTab({ profile, setProfile }: ExperienceTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset, setValue, control, formState: { errors } } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      isCurrent: false,
    }
  });

  const isCurrent = watch('isCurrent');

  const onSubmit = (data: ExperienceFormData) => {
    const newExperience: Experience = {
      id: editingId || Date.now().toString(),
      role: data.role,
      company: data.company,
      startDate: data.startDate,
      endDate: data.isCurrent ? undefined : data.endDate,
      description: data.description,
    };

    if (editingId) {
      setProfile({
        ...profile,
        experiences: profile.experiences.map(exp => exp.id === editingId ? newExperience : exp)
      });
      setEditingId(null);
    } else {
      setProfile({
        ...profile,
        experiences: [newExperience, ...profile.experiences]
      });
    }
    
    setIsAdding(false);
    reset();
  };

  const handleEdit = (exp: Experience) => {
    setValue('role', exp.role);
    setValue('company', exp.company);
    setValue('startDate', exp.startDate);
    setValue('description', exp.description);
    setValue('isCurrent', !exp.endDate);
    setValue('endDate', exp.endDate || '');
    setEditingId(exp.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setProfile({
      ...profile,
      experiences: profile.experiences.filter(exp => exp.id !== id)
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  // Sort experiences by date (newest first)
  const sortedExperiences = [...profile.experiences].sort((a, b) => {
    if (!a.endDate) return -1;
    if (!b.endDate) return 1;
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Parcours Professionnel</h3>
          <p className="text-sm text-[var(--text-secondary)]">Votre historique d'expérience</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter une expérience
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Intitulé du poste</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    {...register('role')}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: Chef de Partie"
                  />
                </div>
                {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Entreprise</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    {...register('company')}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg py-2.5 pl-10 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ex: Le Ritz Paris"
                  />
                </div>
                {errors.company && <p className="text-xs text-red-400">{errors.company.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <ModernDatePicker
                      label="Date de début"
                      value={field.value}
                      onChange={field.onChange}
                      type="date"
                    />
                  )}
                />
                {errors.startDate && <p className="text-xs text-red-400">{errors.startDate.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm text-[var(--text-secondary)]">Date de fin</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('isCurrent')}
                      className="hidden"
                    />
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${isCurrent ? 'bg-blue-600' : 'bg-[var(--text-muted)]'}`}>
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isCurrent ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Poste actuel</span>
                  </label>
                </div>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <ModernDatePicker
                      value={field.value || ''}
                      onChange={field.onChange}
                      disabled={isCurrent}
                      placeholder={isCurrent ? "Poste actuel" : "Sélectionner une date"}
                      type="date"
                    />
                  )}
                />
                {errors.endDate && <p className="text-xs text-red-400">{errors.endDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--text-secondary)]">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg py-2.5 px-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Décrivez vos missions, responsabilités et réalisations..."
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </motion.form>
        ) : (
          <div className="relative pl-8 border-l-2 border-[var(--border)] space-y-8">
            {sortedExperiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-[41px] top-1.5 w-5 h-5 rounded-full border-4 border-[var(--bg-main)] ${!exp.endDate ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[var(--text-muted)]'}`} />

                <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                        {exp.role}
                        {!exp.endDate && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                            Actuel
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{exp.company}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {exp.startDate} - {exp.endDate || "Aujourd'hui"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="p-2 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
                    {exp.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {profile.experiences.length === 0 && (
              <div className="text-center py-12 text-[var(--text-muted)] italic">
                Aucune expérience ajoutée pour le moment.
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
