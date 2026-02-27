import React, { useRef } from 'react';
import { 
  User, MapPin, Upload, X, ShieldCheck, Euro, Clock, Compass 
} from 'lucide-react';
import { ProviderProfile } from '@/types/provider';
import { JOB_TITLES } from '@/data/jobTitles';

const AVAILABILITY_OPTIONS = ['Matin', 'Après-midi', 'Soir', 'Week-end', 'Nuit'];

interface IdentityTabProps {
  profile: ProviderProfile;
  setProfile: (profile: ProviderProfile) => void;
}

export default function IdentityTab({ profile, setProfile }: IdentityTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAvailabilityBadge = (badge: string) => {
    const currentBadges = profile.preferences?.availabilityBadges || [];
    const newBadges = currentBadges.includes(badge)
      ? currentBadges.filter(b => b !== badge)
      : [...currentBadges, badge];
    
    setProfile({
      ...profile,
      preferences: { ...profile.preferences, availabilityBadges: newBadges }
    });
  };

  const addLanguage = (lang: string) => {
    if (lang && !profile.languages.includes(lang)) {
      setProfile({ ...profile, languages: [...profile.languages, lang] });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 p-6 bg-[var(--bg-sidebar)] rounded-2xl border border-[var(--border)]">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-800 bg-gray-800">
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-white font-medium text-xs cursor-pointer"
            >
              <Upload className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarChange}
            />
            {profile.badges.includes('VERIFIED') && (
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-4 border-[var(--bg-sidebar)]" title="Compte Vérifié">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Photo de profil</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-4">Une photo professionnelle rassure les clients et augmente vos chances.</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20">
                En attente de validation
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--bg-active)] hover:bg-[var(--bg-active)] rounded-lg text-sm text-[var(--text-primary)] transition-colors"
              >
                Changer
              </button>
              <button 
                onClick={() => setProfile({ ...profile, avatarUrl: 'https://i.pravatar.cc/150?u=default' })}
                className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Identity Fields */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Prénom</label>
            <input 
              type="text" 
              value={profile.firstName}
              onChange={(e) => setProfile({...profile, firstName: e.target.value})}
              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors"
              placeholder="Jean-Marc"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Nom</label>
            <input 
              type="text" 
              value={profile.lastName}
              onChange={(e) => setProfile({...profile, lastName: e.target.value})}
              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors"
              placeholder="Dupont"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Titre Professionnel</label>
            <input 
              type="text" 
              list="job-titles"
              value={profile.title}
              onChange={(e) => setProfile({...profile, title: e.target.value})}
              className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors"
              placeholder="Ex: Chef de Partie, Plombier, Électricien..."
            />
            <datalist id="job-titles">
              {JOB_TITLES.map(title => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Bio</label>
            <textarea 
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              className="w-full h-32 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors resize-none"
              placeholder="Décrivez votre parcours, vos spécialités et ce que vous recherchez..."
            />
            <div className="text-right text-xs text-[var(--text-muted)]">{profile.bio.length}/500 caractères</div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Ville</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={profile.location.city}
                onChange={(e) => setProfile({...profile, location: {...profile.location, city: e.target.value}})}
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors"
                placeholder="Paris, Lyon..."
              />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-[var(--text-secondary)]">Langues parlées</label>
             <div className="flex items-center gap-2 p-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl flex-wrap min-h-[50px]">
                {profile.languages.map(lang => (
                  <span key={lang} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-sm flex items-center gap-1">
                    {lang}
                    <button onClick={() => setProfile({...profile, languages: profile.languages.filter(l => l !== lang)})}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <select 
                  className="bg-transparent outline-none text-[var(--text-primary)] text-sm flex-1 p-1"
                  onChange={(e) => {
                    addLanguage(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="" className="bg-[var(--bg-sidebar)] text-[var(--text-muted)]">Ajouter une langue...</option>
                  <option value="Français" className="bg-[var(--bg-sidebar)]">Français</option>
                  <option value="Anglais" className="bg-[var(--bg-sidebar)]">Anglais</option>
                  <option value="Espagnol" className="bg-[var(--bg-sidebar)]">Espagnol</option>
                  <option value="Allemand" className="bg-[var(--bg-sidebar)]">Allemand</option>
                  <option value="Italien" className="bg-[var(--bg-sidebar)]">Italien</option>
                  <option value="Portugais" className="bg-[var(--bg-sidebar)]">Portugais</option>
                  <option value="Arabe" className="bg-[var(--bg-sidebar)]">Arabe</option>
                  <option value="Mandarin" className="bg-[var(--bg-sidebar)]">Mandarin</option>
                </select>
             </div>
          </div>
        </div>
      </div>

      {/* Sidebar Preferences */}
      <div className="space-y-6">
        <div className="bg-[var(--bg-sidebar)] p-6 rounded-2xl border border-[var(--border)] space-y-6 sticky top-6">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            Préférences
          </h3>

          {/* Radius Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Rayon d'action</label>
              <span className="text-blue-400 font-bold text-sm">{profile.preferences?.radius || 20} km</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={profile.preferences?.radius || 20}
              onChange={(e) => setProfile({
                ...profile, 
                preferences: { ...profile.preferences, radius: parseInt(e.target.value) }
              })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Min Hourly Rate */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Tarif Minimum /h</label>
            <div className="relative">
              <Euro className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="number" 
                value={profile.preferences?.minHourlyRate || 25}
                onChange={(e) => setProfile({
                  ...profile, 
                  preferences: { ...profile.preferences, minHourlyRate: parseInt(e.target.value) }
                })}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Availability Badges */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Disponibilité
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map(option => {
                const isSelected = profile.preferences?.availabilityBadges?.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleAvailabilityBadge(option)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                        : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-active)]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
