'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = ['admin@home-chr.fr', 'support@home-chr.fr'];

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdminStore();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/admin/tableau-de-bord');
    }
  }, [mounted, isAuthenticated, router]);

  const loginWithSupabase = async (loginEmail: string, loginPassword: string): Promise<boolean> => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (authError || !data.user) {
      setError('Email ou mot de passe incorrect');
      return false;
    }

    const userEmail = data.user.email?.toLowerCase() ?? '';

    if (!ADMIN_EMAILS.includes(userEmail)) {
      await supabase.auth.signOut();
      setError('Acces reserve aux administrateurs');
      return false;
    }

    // Fetch profile to get name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', data.user.id)
      .single();

    const name = profile
      ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || userEmail
      : userEmail;

    // Determine admin role from email
    const adminRole = userEmail === 'support@home-chr.fr' ? 'SUPPORT' as const : 'ADMIN' as const;

    // Set the admin store state
    useAdminStore.getState().login(email, password); // keep mock store in sync for guards
    useAdminStore.setState({
      isAuthenticated: true,
      adminUser: {
        id: data.user.id,
        email: userEmail,
        name,
        role: adminRole,
      },
    });

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await loginWithSupabase(email, password);
      if (success) {
        router.push('/admin/tableau-de-bord');
      } else {
        setLoading(false);
      }
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-10 border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mb-4 shadow-lg shadow-emerald-500/20">
              C
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Home CHR</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Espace Administration</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@home-chr.fr"
                  required
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-11 pr-12 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Dev quick login */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-5 border-t border-dashed border-[var(--border)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-center mb-3">Dev — Connexion rapide</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await loginWithSupabase('admin@home-chr.fr', 'admin123');
                    if (success) router.push('/admin/tableau-de-bord');
                  }}
                  className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const success = await loginWithSupabase('support@home-chr.fr', 'support123');
                    if (success) router.push('/admin/tableau-de-bord');
                  }}
                  className="flex-1 py-2 rounded-lg bg-teal-500/10 text-teal-500 text-xs font-bold border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
                >
                  Support
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
