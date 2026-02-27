'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, User, Briefcase, Building, Mail, Phone, Tag, Camera, Upload } from 'lucide-react';
import { TeamMember } from '@/types/missions';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';

interface TeamMemberModalProps {
  member?: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  venueId?: string;
}

export default function TeamMemberModal({ member, isOpen, onClose, venueId }: TeamMemberModalProps) {
  const { addTeamMember, updateTeamMember } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();
  
  const targetVenueId = venueId || activeVenueId;
  
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    tags: [],
    status: 'AVAILABLE'
  });

  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
      setFormData({
        name: '',
        role: '',
        company: '',
        email: '',
        phone: '',
        tags: [],
        status: 'AVAILABLE',
        avatar: '' // Empty by default to show placeholder/upload option
      });
    }
  }, [member, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (member) {
      updateTeamMember(member.id, formData);
    } else {
      addTeamMember({
        ...formData,
        id: `t-${Date.now()}`,
        missions: 0,
        rating: 5.0,
        joinedAt: new Date().toISOString(),
        venueId: targetVenueId || undefined
      } as TeamMember);
    }
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--bg-card)] w-full max-w-lg rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {member ? 'Modifier le profil' : 'Nouveau membre'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-active)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex gap-6 items-center mb-8 p-4 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border)]">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--bg-sidebar)] bg-[var(--bg-card)] shadow-xl relative">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-card)]">
                    <User className="w-10 h-10" />
                  </div>
                )}
                
                {/* Overlay for hover effect */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5 border-4 border-[var(--bg-card)] cursor-pointer hover:bg-blue-500 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Photo de profil</h3>
              <p className="text-[var(--text-secondary)] text-xs mb-3">Cliquez sur l'image pour importer une photo. <br/>Format recommandé : Carré, JPG ou PNG.</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] text-xs font-bold rounded-lg border border-[var(--border)] transition-colors flex items-center gap-2"
              >
                <Upload className="w-3 h-3" />
                Choisir un fichier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom complet</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rôle</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  required
                  type="text" 
                  value={formData.role || ''}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  placeholder="Manager"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Entreprise</label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={formData.company || ''}
                onChange={e => setFormData({...formData, company: e.target.value})}
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                placeholder="Freelance, StaffPro..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="email" 
                  value={formData.email || ''}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  placeholder="jean@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Téléphone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input 
                  type="tel" 
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  placeholder="+33 6..."
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Compétences / Tags</label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                placeholder="Appuyez sur Entrée pour ajouter..."
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-[var(--text-primary)]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] transition-colors text-sm font-bold"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm font-bold shadow-lg shadow-blue-900/20"
            >
              {member ? 'Enregistrer' : 'Créer le profil'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
