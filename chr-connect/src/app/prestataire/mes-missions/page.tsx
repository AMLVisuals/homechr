'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import Home from '@/app/page';

export default function WorkerMissionsPage() {
  const { setUserRole } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setUserRole('WORKER');
    }
  }, [mounted, setUserRole]);

  if (!mounted) return null;

  return <Home />;
}
