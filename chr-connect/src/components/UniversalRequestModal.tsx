'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Star, MapPin, Clock, ArrowLeft, Mic, CheckCircle } from 'lucide-react';
import { CATEGORIES, Category, SubCategory } from '@/data/categories';
import { useStore } from '@/store/useStore';
import MediaHub from './MediaHub';
import SmartTags from './SmartTags';
import LogisticsAccordion from './LogisticsAccordion';
import EpicLaunchButton from './EpicLaunchButton';
import SmartPricingCard from './SmartPricingCard';
import { clsx } from 'clsx';
import { PricingModel } from '@/config/pricingRules';
import { getMissionConfig } from '@/config/missions';
import DynamicForm from './DynamicForm';
import VenueSelector from './venues/VenueSelector';
import VenueDashboard from './venues/VenueDashboard';
import { useVenuesStore } from '@/store/useVenuesStore';
import { MOCK_PROVIDERS } from '@/data/mockProviders';
import { ProviderProfile } from '@/types/provider';
import ProviderProfileModal from './shared/ProviderProfileModal';
import { useMissionsStore } from '@/store/useMissionsStore';
import { Mission } from '@/types/missions';

export default function UniversalRequestModal() {
  const [step, setStep] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [pricingModel, setPricingModel] = useState<PricingModel | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [missionConfig, setMissionConfig] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [showVenueDashboard, setShowVenueDashboard] = useState(false);
  const [dashboardView, setDashboardView] = useState<'LIST' | 'SEARCH' | 'FORM'>('LIST');
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  
  const [requestStatus, setRequestStatus] = useState<'IDLE' | 'SENDING' | 'SENT'>('IDLE');
  
  const { addRequest } = useStore();
  const { addMission } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();

  const handleBook = (expertId?: string) => {
    setSelectedProvider(null);
    setRequestStatus('SENDING');
    setTimeout(() => {
      setRequestStatus('SENT');
      // Here we would actually send the request to the specific expert or the network
    }, 1500);
  };

  // Load mission config when subcategory changes
  useEffect(() => {
    if (selectedSub) {
      const config = getMissionConfig(selectedSub.id);
      setMissionConfig(config);
      setFormValues({}); // Reset form values
    } else {
      setMissionConfig(null);
    }
  }, [selectedSub]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setStep(1);
  };

  const handleSubSelect = (sub: SubCategory) => {
    setSelectedSub(sub);
    setStep(2);
  };

  const handleLaunch = () => {
    setRequestStatus('IDLE');
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setStep(3);
      
      const newMission: Mission = {
        id: `m-${Date.now()}`,
        title: selectedSub?.label || 'Mission',
        expert: 'Recherche en cours',
        status: 'SEARCHING',
        date: 'Aujourd\'hui',
        category: (selectedCategory?.id as any) || 'MAINTENANCE',
        iconName: 'Wrench',
        color: 'blue',
        price: estimatedPrice > 0 ? `${estimatedPrice}€ est.` : 'Sur devis',
        description: description,
        location: { lat: 48.8566, lng: 2.3522, address: 'Paris' },
        venueId: activeVenueId || undefined,
        venue: 'Mon Établissement',
        type: (selectedSub?.id as any) || 'cold',
        urgent: urgency === 'HIGH' || urgency === 'CRITICAL',
        distance: '0 km',
        matchScore: 0,
        attributes: {
          urgency: urgency === 'HIGH' || urgency === 'CRITICAL'
        }
      };
      addMission(newMission);

      addRequest({ 
        category: selectedCategory?.label, 
        sub: selectedSub?.label, 
        id: Math.random(),
        description,
        formValues,
        urgency,
        estimatedPrice,
        venueId: activeVenueId
      });
    }, 2000);
  };

  const reset = () => {
    setStep(0);
    setSelectedCategory(null);
    setSelectedSub(null);
    setDescription('');
    setFormValues({});
    setUrgency('NORMAL');
    setPricingModel(null);
    setRequestStatus('IDLE');
  };

  const handleVoiceInput = () => {
    if (isRecording) return;
    setIsRecording(true);
    
    // Simulate voice recording delay
    setTimeout(() => {
      setIsRecording(false);
      const simulatedText = " Le problème est survenu hier soir, ça fait un bruit étrange comme un claquement métallique.";
      setDescription(prev => prev + simulatedText);
    }, 2000);
  };

  const currentTags = missionConfig?.tags || [];

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Provider Profile Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <ProviderProfileModal 
            provider={selectedProvider}
            onClose={() => setSelectedProvider(null)}
            onBook={() => handleBook(selectedProvider.id)}
          />
        )}
      </AnimatePresence>

      {/* Venue Dashboard Modal */}
      <AnimatePresence>
        {showVenueDashboard && (
          <VenueDashboard 
            initialView={dashboardView}
            onClose={() => setShowVenueDashboard(false)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate flex-1">
          {step === 0 && "Nouvelle Demande"}
          {step === 1 && selectedCategory?.label}
          {step === 2 && selectedSub?.label}
          {step === 3 && "Experts Disponibles"}
        </h1>
        
        <VenueSelector 
          onAddVenue={() => {
            setDashboardView('SEARCH');
            setShowVenueDashboard(true);
          }}
          onManage={() => {
            setDashboardView('LIST');
            setShowVenueDashboard(true);
          }}
        />
      </div>

      <AnimatePresence mode='wait'>
        {step === 0 && (
          <motion.div 
            key="categories"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="glass p-6 rounded-2xl flex items-start gap-4 text-left hover:bg-white/10 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/20 transition-colors">
                  <cat.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{cat.label}</h3>
                  <p className="text-sm text-gray-400">{cat.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 ml-auto self-center text-gray-600 group-hover:text-white" />
              </button>
            ))}
          </motion.div>
        )}

        {step === 1 && selectedCategory && (
          <motion.div
            key="subcategories"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {selectedCategory.subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubSelect(sub)}
                className="glass p-4 rounded-xl flex flex-col items-center justify-center text-center gap-3 hover:bg-white/10 transition-colors h-32"
              >
                <sub.icon className="w-8 h-8 text-white" />
                <span className="font-medium">{sub.label}</span>
              </button>
            ))}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="cockpit"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-6 rounded-3xl flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar"
          >
            {/* Media Hub */}
            <section>
               <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Preuves & Symptômes</h3>
               <MediaHub onMediaAdd={(type, data) => console.log(type, data)} />
            </section>

            {/* Smart Tags & Description */}
            <section>
               {missionConfig && (
                 <div className="mb-6">
                   <DynamicForm 
                     fields={missionConfig.formFields} 
                     onChange={(values) => setFormValues(prev => ({ ...prev, ...values }))} 
                   />
                 </div>
               )}

               <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Tags & Précisions</h3>
               <SmartTags 
                 tags={currentTags} 
                 selectedTags={formValues.tags || []}
                 onToggle={(tag) => {
                   const current = formValues.tags || [];
                   const newTags = current.includes(tag) 
                     ? current.filter((t: string) => t !== tag) 
                     : [...current, tag];
                   setFormValues(prev => ({ ...prev, tags: newTags }));
                 }}
               />
               
               <div className="relative mt-4">
                 <textarea 
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Précisions supplémentaires ou dictée vocale..."
                   className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pr-12 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[80px]"
                 />
                 
                 <button 
                   onClick={handleVoiceInput}
                   className={clsx(
                     "absolute right-3 top-3 p-2 rounded-full transition-all",
                     isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-gray-400 hover:text-white"
                   )}
                   title="Dictée vocale"
                 >
                   <Mic className="w-5 h-5" />
                 </button>
               </div>
            </section>

            {/* Logistics */}
            <LogisticsAccordion />
            
            {/* Smart Pricing Card (Replaces PriceEstimator) */}
            <section>
              <SmartPricingCard 
                subCategoryId={selectedSub?.id || 'default'} 
                onOptionsChange={(price, options) => {
                  setEstimatedPrice(price);
                  setPricingModel(options.model);
                  
                  // Map options to urgency enum for backward compatibility
                  if (options.isUrgent) setUrgency('CRITICAL');
                  else setUrgency('NORMAL');
                }} 
              />
            </section>

            {/* Epic Launch */}
            <div className="mt-auto pt-4">
              <EpicLaunchButton 
                urgency={urgency} 
                onClick={handleLaunch} 
                isLoading={isSearching} 
                price={estimatedPrice}
                customLabel={pricingModel === 'PROJECT_VISIT' ? 'Réserver la Visite' : undefined}
              />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="h-full flex flex-col"
          >
            {requestStatus === 'SENT' ? (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                 <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                   <CheckCircle className="w-10 h-10 text-white" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">Demande Envoyée !</h2>
                 <p className="text-gray-400 mb-8">
                   Votre demande a été transmise aux experts concernés. Vous recevrez une notification dès qu'un expert acceptera la mission.
                 </p>
                 <button 
                   onClick={reset}
                   className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                 >
                   Retour à l'accueil
                 </button>
               </div>
            ) : requestStatus === 'SENDING' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-bold text-white">Envoi en cours...</h2>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {MOCK_PROVIDERS.map((provider) => (
                    <div 
                      key={provider.id} 
                      onClick={() => setSelectedProvider(provider)}
                      className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-colors">
                        <img src={provider.avatarUrl} alt={provider.firstName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{provider.firstName} {provider.lastName}</h3>
                          {provider.badges.includes('GOLD') && (
                            <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold">Gold Badge</span>
                          )}
                        </div>
                        <div className="text-sm text-blue-400 font-medium mb-1">{provider.title}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {provider.stats.rating}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.location.city}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {provider.availability.nextSlot}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{estimatedPrice}€</div>
                        <div className="text-xs text-gray-400">Forfait</div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBook(provider.id);
                          }}
                          className="mt-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Solliciter
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-4 rounded-xl border border-dashed border-white/20 text-center space-y-2">
                    <p className="text-gray-400">Aucun de ces experts ne vous convient ?</p>
                    <button 
                      onClick={() => handleBook()}
                      className="text-blue-400 hover:text-blue-300 font-bold text-sm hover:underline"
                    >
                      Diffuser l'offre à tout le réseau
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedProvider && (
        <ProviderProfileModal 
          provider={selectedProvider} 
          onClose={() => setSelectedProvider(null)}
          onBook={() => handleBook(selectedProvider.id)}
        />
      )}
    </div>
  );
}