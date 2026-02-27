import React, { useState, useRef } from 'react';
import { 
  Award, Plus, X, Search, CheckCircle, FileText, Upload, Trash2 
} from 'lucide-react';
import { ProviderProfile, Certification } from '@/types/provider';
import { motion, AnimatePresence } from 'framer-motion';
import ModernDatePicker from '@/components/ui/ModernDatePicker';

// Mock skill suggestions (in a real app, this would come from an API/config)
const SKILL_SUGGESTIONS = [
  'HACCP', 'Cuisson basse température', 'Pâtisserie', 'Gestion des stocks', 
  'Management', 'Anglais technique', 'Service au plateau', 'Sommellerie', 
  'Mixologie', 'Latte Art', 'Cuisine Végétarienne', 'Cuisine Italienne',
  'Plomberie sanitaire', 'Électricité basse tension', 'Soudure', 'Climatisation'
];

interface SkillsTabProps {
  profile: ProviderProfile;
  setProfile: (profile: ProviderProfile) => void;
}

export default function SkillsTab({ profile, setProfile }: SkillsTabProps) {
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // New Certification State
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [newCertFile, setNewCertFile] = useState<string | null>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions
  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !profile.skills.includes(s)
  );

  const addSkill = (skill: string) => {
    if (skill && !profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] });
      setSkillInput('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const handleCertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCertFile(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCertification = () => {
    if (newCertName && newCertIssuer && newCertDate) {
      const newCert: Certification = {
        id: Date.now().toString(),
        name: newCertName,
        issuer: newCertIssuer,
        dateObtained: newCertDate,
        isVerified: false,
        documentUrl: newCertFile || undefined
      };
      setProfile({ ...profile, certifications: [newCert, ...profile.certifications] });
      
      // Reset form
      setNewCertName('');
      setNewCertIssuer('');
      setNewCertDate('');
      setNewCertFile(null);
      setIsAddingCert(false);
    }
  };

  const removeCertification = (id: string) => {
    setProfile({ ...profile, certifications: profile.certifications.filter(c => c.id !== id) });
  };

  const handleUpdateCertDoc = (certId: string, e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const docUrl = event.target?.result as string;
        setProfile({
          ...profile,
          certifications: profile.certifications.map(c => 
            c.id === certId ? { ...c, documentUrl: docUrl } : c
          )
        });
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Smart Tag Input Section */}
      <section>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Compétences Techniques</h3>
        <div className="bg-[var(--bg-sidebar)] p-6 rounded-2xl border border-[var(--border)] relative z-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.skills.map(skill => (
              <span key={skill} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-red-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Rechercher une compétence..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-blue-500 outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(skillInput.trim());
                  }
                }}
              />
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (skillInput.length > 0 || filteredSuggestions.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-20"
                >
                  {filteredSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onMouseDown={() => addSkill(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3 text-blue-400" />
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Certifications & Diplômes</h3>
            <p className="text-sm text-[var(--text-secondary)]">Prouvez votre expertise avec vos documents officiels.</p>
          </div>
          {!isAddingCert && (
            <button 
              onClick={() => setIsAddingCert(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add New Certification Form */}
          <AnimatePresence>
            {isAddingCert && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="col-span-1 md:col-span-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl p-6 space-y-4 relative"
              >
                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
                 <h4 className="font-medium text-[var(--text-primary)] mb-2">Nouvelle Certification</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs text-[var(--text-secondary)]">Nom du diplôme / certification</label>
                     <input 
                        type="text" 
                        value={newCertName}
                        onChange={(e) => setNewCertName(e.target.value)}
                        placeholder="Ex: CAP Cuisine"
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-blue-500 outline-none"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs text-[var(--text-secondary)]">Organisme délivreur</label>
                     <input 
                        type="text" 
                        value={newCertIssuer}
                        onChange={(e) => setNewCertIssuer(e.target.value)}
                        placeholder="Ex: École Ferrandi"
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-blue-500 outline-none"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <ModernDatePicker 
                        label="Date d'obtention"
                        value={newCertDate}
                        onChange={setNewCertDate}
                        placeholder="Sélectionner une date"
                        type="date"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-[var(--text-secondary)]">Preuve (Photo/PDF)</label>
                      <div 
                        onClick={() => certFileInputRef.current?.click()}
                        className={`w-full bg-[var(--bg-card)] border border-dashed ${newCertFile ? 'border-blue-500/50' : 'border-[var(--border-strong)]'} hover:border-blue-500/50 rounded-xl px-4 py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors h-[42px] relative overflow-hidden`}
                      >
                        {newCertFile && newCertFile.startsWith('data:image') ? (
                           <>
                             <img src={newCertFile} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                             <div className="relative z-10 flex items-center gap-2">
                               <CheckCircle className="w-4 h-4 text-green-500" />
                               <span className="text-green-400 font-medium">Photo ajoutée</span>
                             </div>
                           </>
                        ) : (
                          <>
                            <Upload className={`w-4 h-4 ${newCertFile ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`} />
                            <span className={`truncate max-w-[200px] ${newCertFile ? 'text-blue-400' : 'text-[var(--text-secondary)]'}`}>
                              {newCertFile ? "Document chargé" : "Uploader le document"}
                            </span>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={certFileInputRef}
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={handleCertFileUpload}
                        />
                      </div>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-2">
                   <button 
                     onClick={() => setIsAddingCert(false)}
                     className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm"
                   >
                     Annuler
                   </button>
                   <button 
                     onClick={handleAddCertification}
                     disabled={!newCertName || !newCertIssuer || !newCertDate}
                     className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium"
                   >
                     Enregistrer
                   </button>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Certification List */}
          {profile.certifications.map(cert => (
            <div key={cert.id} className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl p-5 relative group hover:border-[var(--border-strong)] transition-colors">
              <button 
                onClick={() => removeCertification(cert.id)}
                className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[var(--text-primary)] truncate pr-6">{cert.name}</h4>
                  <p className="text-sm text-[var(--text-secondary)] truncate">{cert.issuer}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)] px-2 py-1 rounded-md border border-[var(--border)]">
                      {new Date(cert.dateObtained).getFullYear()}
                    </span>
                    {cert.documentUrl ? (
                      <a 
                        href={cert.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20 hover:bg-green-500/20 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Preuve vérifiée
                      </a>
                    ) : (
                      <label className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Uploader preuve
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleUpdateCertDoc(cert.id, e)} 
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
