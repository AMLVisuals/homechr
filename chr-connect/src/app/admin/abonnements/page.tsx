'use client';

import { useEffect, useState } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminSubscriptionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AdminDashboard />;
}
