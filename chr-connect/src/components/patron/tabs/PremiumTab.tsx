'use client';

import { motion } from 'framer-motion';
import { Zap, FileText, Download, Clock, Server, CheckCircle2, Crown } from 'lucide-react';
import { useStore } from '@/store/useStore';

const PREMIUM_FEATURES = [
  { icon: FileText, label: 'Création de bulletins de paie', desc: 'Générez des fiches de paie complètes en quelques clics' },
  { icon: Download, label: 'Export PDF professionnel', desc: 'Téléchargez des bulletins au format PDF officiel' },
  { icon: Clock, label: 'Historique complet', desc: 'Accédez à l\'historique illimité de tous vos bulletins' },
  { icon: Server, label: 'API externe', desc: 'Connectez PayFit, Silae ou tout autre fournisseur de paie' },
];

export default function PremiumTab() {
  const { setPremium } = useStore();

  const handleUpgrade = () => {
    setPremium(true);
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
           <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
             Passez à la vitesse supérieure
           </h1>
           <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
             Débloquez toutes les fonctionnalités premium pour gérer votre établissement comme un pro.
           </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-card)] border border-amber-500/30 rounded-3xl overflow-hidden shadow-xl shadow-amber-900/10 relative"
            >
              <div className="absolute top-0 right-0 p-4">
                 <div className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</div>
              </div>
              <div className="p-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">CHR Connect Premium</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold text-[var(--text-primary)]">29€</span>
                    <span className="text-[var(--text-secondary)]">/mois</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                  {PREMIUM_FEATURES.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)]">{feature.label}</h4>
                        <p className="text-xs text-[var(--text-secondary)]">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUpgrade}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Passer au Premium
                </button>
              </div>
            </motion.div>

             {/* Features Grid */}
             <div className="space-y-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Pourquoi passer Premium ?</h3>
                <div className="grid gap-4">
                   {PREMIUM_FEATURES.map((feature, i) => (
                      <div key={i} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] flex gap-4">
                         <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                            <feature.icon className="w-6 h-6 text-[var(--text-primary)]" />
                         </div>
                         <div>
                            <h4 className="font-bold text-[var(--text-primary)]">{feature.label}</h4>
                            <p className="text-sm text-[var(--text-secondary)]">{feature.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
