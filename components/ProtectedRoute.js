'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (requireAdmin && !isAdmin) {
                // If admin required but not admin, maybe redirect to home or show error
                // For now, let's just allow viewing but disable actions in the UI
            }
        }
    }, [user, loading, router, requireAdmin, isAdmin]);

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading access...</div>;
    }

    if (!user) {
        return null;
    }

    return children;
}
