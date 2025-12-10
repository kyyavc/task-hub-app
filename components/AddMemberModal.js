'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AddMemberModal({ onClose, onMemberAdded }) {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'member' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const dummyEmail = formData.username.toLowerCase().replace(/[^a-z0-9]/g, '') + '@taskhub.local';

        try {
            // Create auth user
            const { data, error: authError } = await supabase.auth.signUp({
                email: dummyEmail,
                password: formData.password,
                options: {
                    data: { username: formData.username }
                }
            });

            if (authError) throw authError;

            if (data.user) {
                // Create profile (or update if already exists from signup trigger)
                // We use upsert here to be safe
                const { error: profileError } = await supabase.from('profiles').upsert([
                    { id: data.user.id, username: formData.username, role: formData.role, status: 'active' }
                ]);
                if (profileError) throw profileError;

                // CRITICAL: Immediately sign out the new user so we don't switch context
                // The master_session in localStorage will keep the current user logged in as Master
                await supabase.auth.signOut();

                onMemberAdded();
                onClose();
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)',
                width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)'
            }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Add New Member</h2>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username</label>
                        <input type="text" required
                            value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input type="password" required
                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role</label>
                        <select
                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'white' }}
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
