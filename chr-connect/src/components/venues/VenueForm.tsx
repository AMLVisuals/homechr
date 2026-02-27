'use client';

import { useState } from 'react';
import { Venue, VenueFormData, VenuePhoto } from '@/types/venue';
import { X, Lock, Eye, EyeOff, Zap, Layout, Users, Ruler, Box, Clock } from 'lucide-react';
import { useVenuesStore } from '@/store/useVenuesStore';
import VenuePhotoUploader from './VenuePhotoUploader';

interface VenueFormProps {
  initialData?: Partial<Venue>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VenueForm({ initialData, onClose, onSuccess }: VenueFormProps) {
  const { addVenue, updateVenue } = useVenuesStore();
  
  const [formData, setFormData] = useState<VenueFormData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    zipCode: initialData?.zipCode || '',
    category: initialData?.category || 'Restaurant',
    photos: initialData?.photos || [],
    teamSize: initialData?.teamSize || 0,
    surface: initialData?.surface || 0,
    capacity: initialData?.capacity || 0,
    access: {
      digicode: initialData?.access?.digicode || '',
      contactName: initialData?.access?.contactName || '',
      instructions: initialData?.access?.instructions || '',
      wifiSSID: initialData?.access?.wifiSSID || '',
      wifiPassword: initialData?.access?.wifiPassword || ''
    },
    technical: {
      elecType: initialData?.technical?.elecType || 'UNKNOWN',
      gasType: initialData?.technical?.gasType || 'NONE',
      hasFreightElevator: initialData?.technical?.hasFreightElevator || false,
      hasElevator: initialData?.technical?.hasElevator || false,
      deliveryAccess: initialData?.technical?.deliveryAccess || 'STREET',
      hasVentilation: initialData?.technical?.hasVentilation || false,
      hasAirConditioning: initialData?.technical?.hasAirConditioning || false
    },
    equipment: {
      posSystem: initialData?.equipment?.posSystem || '',
      hasTerrace: initialData?.equipment?.hasTerrace || false,
      hasPrivateRooms: initialData?.equipment?.hasPrivateRooms || false,
      hasBar: initialData?.equipment?.hasBar || false
    },
    openingHours: initialData?.openingHours || {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '23:00', closed: false },
      saturday: { open: '08:00', close: '23:00', closed: false },
      sunday: { open: '08:00', close: '22:00', closed: true }
    }
  });

  const [sections, setSections] = useState({
    general: true,
    access: true,
    technical: false,
    equipment: false,
    hours: false
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure photoUrl is set for backward compatibility (use first photo)
    const submissionData = {
      ...formData,
      photoUrl: formData.photos && formData.photos.length > 0 ? formData.photos[0].url : undefined
    };

    if (initialData?.id) {
      updateVenue(initialData.id, submissionData);
    } else {
      addVenue(submissionData);
    }
    onSuccess();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--bg-card)] z-10 sticky top-0">
        <h2 className="text-xl font-bold">
          {initialData?.id ? 'Modifier l\'établissement' : 'Ajouter un établissement'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* Photos */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-secondary)] ml-1">Photos du lieu</label>
          <VenuePhotoUploader 
            photos={formData.photos || []} 
            onChange={(photos) => setFormData(prev => ({ ...prev, photos }))} 
          />
        </div>

        {/* General Info */}
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <button 
            onClick={() => toggleSection('general')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-500" />
              Informations Générales
            </h3>
            {sections.general ? <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> : <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
          
          {sections.general && (
            <div className="p-4 border-t border-[var(--border)] space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Nom de l'établissement</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Le Fouquet's"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option>Restaurant</option>
                    <option>Bar / Café</option>
                    <option>Hôtel</option>
                    <option>Boîte de nuit</option>
                    <option>Traiteur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Effectif (nombre)</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="number" 
                      value={formData.teamSize || ''}
                      onChange={e => setFormData({...formData, teamSize: parseInt(e.target.value) || 0})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 pl-10 focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Adresse</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 focus:ring-1 focus:ring-blue-500"
                  placeholder="Adresse complète"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Code Postal</label>
                    <input 
                      type="text" 
                      value={formData.zipCode}
                      onChange={e => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 focus:ring-1 focus:ring-blue-500"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Ville</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 focus:ring-1 focus:ring-blue-500"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Surface (m²)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="number" 
                      value={formData.surface || ''}
                      onChange={e => setFormData({...formData, surface: parseInt(e.target.value) || 0})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 pl-10 focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Capacité (pers.)</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="number" 
                      value={formData.capacity || ''}
                      onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 pl-10 focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Access Info */}
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <button 
            onClick={() => toggleSection('access')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-500" />
              Infos d'accès
            </h3>
            {sections.access ? <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> : <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
          
          {sections.access && (
            <div className="p-4 border-t border-[var(--border)] space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Digicode</label>
                    <input 
                      type="text" 
                      value={formData.access?.digicode || ''}
                      onChange={e => setFormData({...formData, access: {...formData.access, digicode: e.target.value}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                      placeholder="Ex: 1234A"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Responsable</label>
                    <input 
                      type="text" 
                      value={formData.access?.contactName || ''}
                      onChange={e => setFormData({...formData, access: {...formData.access, contactName: e.target.value}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                      placeholder="Nom Prénom"
                    />
                 </div>
               </div>

               <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Instructions d'accès</label>
                  <textarea 
                    value={formData.access?.instructions || ''}
                    onChange={e => setFormData({...formData, access: {...formData.access, instructions: e.target.value}})}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm min-h-[80px]"
                    placeholder="Entrée fournisseurs, étage, code ascenseur..."
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">WiFi SSID</label>
                    <input 
                      type="text" 
                      value={formData.access?.wifiSSID || ''}
                      onChange={e => setFormData({...formData, access: {...formData.access, wifiSSID: e.target.value}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">WiFi Password</label>
                    <input 
                      type="text" 
                      value={formData.access?.wifiPassword || ''}
                      onChange={e => setFormData({...formData, access: {...formData.access, wifiPassword: e.target.value}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                    />
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Technical Info */}
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <button 
            onClick={() => toggleSection('technical')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Technique & Livraison
            </h3>
            {sections.technical ? <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> : <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
          
          {sections.technical && (
            <div className="p-4 border-t border-[var(--border)] space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type Électrique</label>
                    <select 
                      value={formData.technical?.elecType}
                      onChange={e => setFormData({...formData, technical: {...formData.technical!, elecType: e.target.value as any}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                    >
                      <option value="UNKNOWN">Inconnu</option>
                      <option value="SINGLE_PHASE">Monophasé</option>
                      <option value="THREE_PHASE">Triphasé</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type Gaz</label>
                    <select 
                      value={formData.technical?.gasType}
                      onChange={e => setFormData({...formData, technical: {...formData.technical!, gasType: e.target.value as any}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                    >
                      <option value="NONE">Aucun</option>
                      <option value="CITY">Gaz de ville</option>
                      <option value="BOTTLE">Bouteille</option>
                    </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Accès Livraison</label>
                    <select 
                      value={formData.technical?.deliveryAccess}
                      onChange={e => setFormData({...formData, technical: {...formData.technical!, deliveryAccess: e.target.value as any}})}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm"
                    >
                      <option value="STREET">Rue</option>
                      <option value="COURTYARD">Cour intérieure</option>
                      <option value="DOCK">Quai de livraison</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-4 pt-6">
                   <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                     <input 
                       type="checkbox"
                       checked={formData.technical?.hasFreightElevator}
                       onChange={e => setFormData({...formData, technical: {...formData.technical!, hasFreightElevator: e.target.checked}})}
                       className="rounded border-[var(--border)] bg-[var(--bg-input)] text-blue-500"
                     />
                     Monte-charge
                   </label>
                 </div>
               </div>
               
               <div className="flex items-center gap-6 pt-2 border-t border-[var(--border)]">
                   <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                     <input 
                       type="checkbox"
                       checked={formData.technical?.hasAirConditioning}
                       onChange={e => setFormData({...formData, technical: {...formData.technical!, hasAirConditioning: e.target.checked}})}
                       className="rounded border-[var(--border)] bg-[var(--bg-input)] text-blue-500"
                     />
                     Climatisation
                   </label>
                   <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                     <input 
                       type="checkbox"
                       checked={formData.technical?.hasVentilation}
                       onChange={e => setFormData({...formData, technical: {...formData.technical!, hasVentilation: e.target.checked}})}
                       className="rounded border-[var(--border)] bg-[var(--bg-input)] text-blue-500"
                     />
                     Extraction
                   </label>
               </div>
            </div>
          )}
        </div>

        {/* Equipment Info */}
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <button 
            onClick={() => toggleSection('equipment')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Box className="w-4 h-4 text-green-500" />
              Installations
            </h3>
            {sections.equipment ? <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> : <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
          
          {sections.equipment && (
            <div className="p-4 border-t border-[var(--border)] space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Système de Caisse (POS)</label>
                <input 
                  type="text" 
                  value={formData.equipment?.posSystem || ''}
                  onChange={e => setFormData({...formData, equipment: {...formData.equipment!, posSystem: e.target.value}})}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-3 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Lightspeed, Tiller..."
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.equipment?.hasTerrace}
                      onChange={e => setFormData({...formData, equipment: {...formData.equipment!, hasTerrace: e.target.checked}})}
                      className="rounded border-[var(--border)] bg-[var(--bg-input)] text-blue-500"
                    />
                    Terrasse
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.equipment?.hasPrivateRooms}
                      onChange={e => setFormData({...formData, equipment: {...formData.equipment!, hasPrivateRooms: e.target.checked}})}
                      className="rounded border-[var(--border)] bg-[var(--bg-input)] text-blue-500"
                    />
                    Salons Privés
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.equipment?.hasBar}
                      onChange={e => setFormData({...formData, equipment: {...formData.equipment!, hasBar: e.target.checked}})}
                      className="rounded border-[var(--border)] bg-[var(--bg-input)] text-blue-500"
                    />
                    Bar
                  </label>
              </div>
            </div>
          )}
        </div>

        {/* Opening Hours */}
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <button 
            onClick={() => toggleSection('hours')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Horaires d'ouverture
            </h3>
            {sections.hours ? <Eye className="w-4 h-4 text-[var(--text-secondary)]" /> : <EyeOff className="w-4 h-4 text-[var(--text-secondary)]" />}
          </button>
          
          {sections.hours && (
            <div className="p-4 border-t border-[var(--border)] space-y-2 animate-in fade-in slide-in-from-top-2">
              {Object.entries(formData.openingHours || {}).map(([day, hours]) => {
                const dayLabels: any = { monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche' };
                return (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                    <div className="w-24 font-medium text-[var(--text-secondary)]">{dayLabels[day]}</div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={hours.closed}
                          onChange={e => setFormData({
                            ...formData, 
                            openingHours: {
                              ...formData.openingHours!,
                              [day]: { ...hours, closed: e.target.checked }
                            }
                          })}
                          className="rounded border-[var(--border)] bg-[var(--bg-input)] text-red-500"
                        />
                        Fermé
                      </label>
                      
                      {!hours.closed && (
                        <>
                          <input 
                            type="time" 
                            value={hours.open}
                            onChange={e => setFormData({
                              ...formData, 
                              openingHours: {
                                ...formData.openingHours!,
                                [day]: { ...hours, open: e.target.value }
                              }
                            })}
                            className="bg-[var(--bg-input)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                          />
                          <span className="text-[var(--text-muted)]">-</span>
                          <input 
                            type="time" 
                            value={hours.close}
                            onChange={e => setFormData({
                              ...formData, 
                              openingHours: {
                                ...formData.openingHours!,
                                [day]: { ...hours, close: e.target.value }
                              }
                            })}
                            className="bg-[var(--bg-input)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <div className="p-6 border-t border-[var(--border)] flex gap-4 bg-[var(--bg-input)] shrink-0 z-10">
        <button 
          onClick={onClose}
          className="flex-1 py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          Annuler
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 py-3 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-lg shadow-blue-500/20"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
