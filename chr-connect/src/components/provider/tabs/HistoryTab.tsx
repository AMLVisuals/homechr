import React from 'react';
import { Calendar, MapPin, Clock, ArrowRight, CheckCircle, ChevronRight, Euro } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_HISTORY = [
  {
    id: 'M-1204',
    title: "Réparation Machine à Glaçons",
    venue: "Le Perchoir Marais",
    date: "Aujourd'hui, 10:30",
    duration: "1h 45min",
    amount: "145.00 €",
    status: "COMPLETED",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=300&auto=format&fit=crop",
    report: {
        text: "Remplacement de la pompe de vidange. Test de cycle complet OK.",
        before: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop",
        after: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop"
    }
  },
  {
    id: 'M-1198',
    title: "Installation Vitrine Réfrigérée",
    venue: "La Felicità",
    date: "Hier, 14:15",
    duration: "3h 00min",
    amount: "280.00 €",
    status: "COMPLETED",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=300&auto=format&fit=crop",
    report: {
        text: "Installation complète et raccordement électrique. Mise en service effectuée.",
        before: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop",
        after: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop"
    }
  },
  {
    id: 'M-1150',
    title: "Maintenance Préventive",
    venue: "Big Mamma",
    date: "05 Déc, 09:00",
    duration: "2h 30min",
    amount: "210.00 €",
    status: "COMPLETED",
    image: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=300&auto=format&fit=crop",
    report: {
        text: "Nettoyage des condenseurs et vérification des niveaux de gaz.",
        before: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=300&auto=format&fit=crop",
        after: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=300&auto=format&fit=crop"
    }
  }
];

export function HistoryTab() {
  const [selectedMission, setSelectedMission] = React.useState<typeof MOCK_HISTORY[0] | null>(null);

  if (selectedMission) {
      return (
          <div className="h-full flex flex-col">
              <button 
                onClick={() => setSelectedMission(null)}
                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
              >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Retour à l'historique
              </button>

              <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                      <div>
                          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{selectedMission.title}</h2>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                              <MapPin className="w-4 h-4" />
                              {selectedMission.venue}
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-xl font-bold text-green-400">{selectedMission.amount}</div>
                          <div className="text-sm text-[var(--text-muted)]">{selectedMission.date}</div>
                      </div>
                  </div>

                  {/* Before / After */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <span className="text-sm font-medium text-[var(--text-secondary)]">Avant</span>
                          <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)] relative group">
                              <img src={selectedMission.report.before} alt="Avant" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <span className="text-sm font-medium text-[var(--text-secondary)]">Après</span>
                          <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)] relative group">
                              <img src={selectedMission.report.after} alt="Après" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute bottom-2 right-2 bg-green-500/90 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Validé
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Report */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-5 border border-[var(--border)]">
                      <h3 className="font-bold text-[var(--text-primary)] mb-3">Rapport d'intervention</h3>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                          {selectedMission.report.text}
                      </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-center">
                          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-[var(--text-primary)]">{selectedMission.duration}</div>
                          <div className="text-xs text-[var(--text-muted)]">Durée</div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-center">
                          <Euro className="w-5 h-5 text-green-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-[var(--text-primary)]">{selectedMission.amount}</div>
                          <div className="text-xs text-[var(--text-muted)]">Facturé</div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-center">
                          <CheckCircle className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-[var(--text-primary)]">5.0</div>
                          <div className="text-xs text-[var(--text-muted)]">Note</div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-4">
      {MOCK_HISTORY.map((mission, index) => (
        <motion.div
          key={mission.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => setSelectedMission(mission)}
          className="bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-active)] shrink-0">
              <img src={mission.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-[var(--text-primary)] truncate pr-4">{mission.title}</h3>
                <span className="text-green-400 font-mono font-bold">{mission.amount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{mission.venue}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <span>{mission.date}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/20">
                    TERMINÉE
                 </span>
                 <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {mission.duration}
                 </span>
              </div>
            </div>
            <div className="flex items-center text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
