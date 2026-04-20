'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import PatronDashboard from '@/components/patron/PatronDashboard';

export default function PatronPaymentsPage() {
  const { setUserRole } = useStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        router.replace('/');
      } else {
        setUserRole('PATRON');
      }
    }
  }, [mounted, loading, user, setUserRole, router]);

  if (!mounted || loading || !user) return null;

  return <PatronDashboard />;
}
