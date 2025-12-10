// Note: Ensure schema_v2.sql has been run to add 'status' column to profiles table.
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import AddMemberModal from '@/components/AddMemberModal';

export default function Team() {
    const { isAdmin } = useAuth();
    const [members, setMembers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    async function fetchMembers() {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username', { ascending: true });

        if (profiles) {
            // Hide MasterDummy
            setMembers(profiles.filter(p => p.username !== 'MasterDummy'));
        }
    }

    useEffect(() => {
        fetchMembers();

        const channel = supabase
            .channel('team_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchMembers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            const response = await fetch(`/api/admin/delete-user?id=${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                alert('FAILED: ' + (data.error || 'Unknown error'));
            } else {
                alert('SUCCESS: User deleted. Refreshing list...');
                fetchMembers();
            }

        } catch (error) {
            alert('ERROR: ' + error.message);
            console.error(error);
        }
    };

    const handleApprove = async (id) => {
        const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
        if (!error) fetchMembers();
    };

    return (
        <ProtectedRoute>
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ marginLeft: '250px', padding: '2rem', width: '100%' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Team Members
                        </h1>
                        {isAdmin && (
                            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                                + Add Member
                            </button>
                        )}
                    </header>




                    {/* Active Members Section */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Active Team Members
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {members.filter(m => m.status !== 'pending').map(member => (
                                <div key={member.id} style={{
                                    background: 'var(--surface-color)',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-color)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-color)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', margin: '0 auto 1rem auto'
                                    }}>
                                        {member.username ? member.username[0].toUpperCase() : 'U'}
                                    </div>
                                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.username || 'Unknown User'}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{member.role || 'Member'}</p>

                                    {isAdmin && (
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button onClick={() => handleDelete(member.id)} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {members.filter(m => m.status !== 'pending').length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active members found.</p>}
                        </div>
                    </div>

                    {isAddModalOpen && (
                        <AddMemberModal onClose={() => setIsAddModalOpen(false)} onMemberAdded={fetchMembers} />
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
