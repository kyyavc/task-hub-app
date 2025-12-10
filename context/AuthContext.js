
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                // 1. Check if "Master Session" fallback exists
                if (localStorage.getItem('master_session')) {
                    if (mounted) {
                        setUser({ id: 'master', email: 'master@dummy.com', username: 'MasterDummy' });
                        setIsAdmin(true);
                        setLoading(false);
                    }
                    return;
                }

                // 2. Check Standard Supabase Session
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Fetch full profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (mounted) {
                        if (profile) {
                            setUser({ ...session.user, ...profile });
                            setIsAdmin(profile.role === 'admin');
                        } else {
                            // Fallback if profile not found
                            setUser(session.user);
                            setIsAdmin(false);
                        }
                    }
                } else {
                    if (mounted) {
                        setUser(null);
                        setIsAdmin(false);
                    }
                }
            } catch (err) {
                console.error('Auth Check Error:', err);
                if (mounted) {
                    setUser(null);
                    setIsAdmin(false);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        checkSession();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            // PROTECT MASTER SESSION: If we are in "Master Mode", ignore all auth events.
            // This prevents the app from switching to the newly created user context when "Add Member" is used.
            if (localStorage.getItem('master_session')) return;

            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setUser({ ...session.user, ...profile });
                setIsAdmin(profile?.role === 'admin');
            } else if (!localStorage.getItem('master_session')) {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const loginMaster = () => {
        localStorage.clear();
        localStorage.setItem('master_session', 'true');
        setUser({ id: 'master', email: 'master@dummy.com', username: 'MasterDummy' });
        setIsAdmin(true);
        router.push('/');
    };

    const logout = async () => {
        localStorage.removeItem('master_session');
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAdmin, loginMaster, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
