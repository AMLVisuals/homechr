'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import PatronDashboard from '@/components/patron/PatronDashboard';

export default function PatronDashboardPage() {
  const { setUserRole } = useStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted) {
      setUserRole('PATRON');
    }
  }, [mounted, setUserRole]);
  
  if (!mounted) return null;
  
  return <PatronDashboard />;
}
