'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function Settings() {
    const { user, isAdmin, logout } = useAuth();
    const [profile, setProfile] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            if (user?.id === 'master') return; // Master dummy has no DB profile to edit
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) setProfile(data);
        }
        fetchProfile();
    }, [user]);

    useEffect(() => {
        async function fetchAllUsers() {
            if (isAdmin) {
                const { data } = await supabase.from('profiles').select('*').order('username', { ascending: true });
                if (data) setAllUsers(data);
            }
        }
        fetchAllUsers();
    }, [isAdmin]);
    return (
        <ProtectedRoute>
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ marginLeft: '250px', padding: '2rem', width: '100%' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)' }}>
                        Settings
                    </h1>

                    {/* Debug Status Message */}
                    {statusMessage && (
                        <div id="settings-status" style={{
                            padding: '1rem',
                            marginBottom: '2rem',
                            borderRadius: '8px',
                            background: statusMessage.startsWith('SUCCESS') ? '#dcfce7' : '#fee2e2',
                            color: statusMessage.startsWith('SUCCESS') ? '#166534' : '#991b1b',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            {statusMessage}
                        </div>
                    )}

                    {/* Profile Settings (Everyone) */}
                    {user?.id !== 'master' && (
                        <div style={{ maxWidth: '600px', background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Profile Settings</h2>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Display Name</label>
                                <input type="text" readOnly value={profile.username || ''} style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'white', opacity: 0.7
                                }} />
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Username updates disabled in this version.</div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>App Notifications</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={profile.settings?.notify_assignment ?? true}
                                            onChange={(e) => setProfile({
                                                ...profile,
                                                settings: { ...profile.settings, notify_assignment: e.target.checked }
                                            })}
                                        />
                                        <div>
                                            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Task Assignments</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>When someone assigns a new task to you</div>
                                        </div>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={profile.settings?.notify_completion ?? true}
                                            onChange={(e) => setProfile({
                                                ...profile,
                                                settings: { ...profile.settings, notify_completion: e.target.checked }
                                            })}
                                        />
                                        <div>
                                            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Task Completions</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>When a task you created is marked done</div>
                                        </div>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={profile.settings?.notify_due_date ?? true}
                                            onChange={(e) => setProfile({
                                                ...profile,
                                                settings: { ...profile.settings, notify_due_date: e.target.checked }
                                            })}
                                        />
                                        <div>
                                            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Due Date Reminders</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>24 hours before a task is due</div>
                                        </div>
                                    </label>

                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        const { error } = await supabase.from('profiles').update({ settings: profile.settings }).eq('id', user.id);
                                        if (error) {
                                            setStatusMessage('FAILED: ' + error.message);
                                        } else {
                                            setStatusMessage('SUCCESS: Preferences saved!');
                                            setTimeout(() => setStatusMessage(''), 3000);
                                        }
                                        setLoading(false);
                                    }}
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={logout}
                                    style={{
                                        padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid #ef4444',
                                        color: '#ef4444', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                    }}
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Data Management (Admin Only) */}
                    {isAdmin && (
                        <div style={{ maxWidth: '600px', background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Data Management</h2>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>Clear Task History</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Delete tasks completed more than 24 hours ago.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!confirm('Remove tasks completed more than 24 hours ago?')) return;
                                        setLoading(true);
                                        try {
                                            const res = await fetch('/api/admin/clear-tasks', { method: 'DELETE' });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error);
                                            setStatusMessage(`SUCCESS: Removed ${data.count} old tasks.`);
                                            setTimeout(() => setStatusMessage(''), 3000);
                                        } catch (e) {
                                            setStatusMessage('FAILED: ' + e.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--text-secondary)',
                                        color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                    }}
                                >
                                    Clear History
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>Clear Inactive Accounts</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Remove accounts that have no profile (e.g. deleted team members).</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!confirm('Remove all inactive (zombie) accounts?')) return;
                                        setLoading(true);
                                        try {
                                            const res = await fetch('/api/admin/clear-inactive', { method: 'DELETE' });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error);
                                            setStatusMessage(`SUCCESS: Removed ${data.count} inactive accounts.`);
                                            setTimeout(() => setStatusMessage(''), 3000);
                                        } catch (e) {
                                            setStatusMessage('FAILED: ' + e.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #eab308',
                                        color: '#eab308', borderRadius: 'var(--radius-md)', cursor: 'pointer'
                                    }}
                                >
                                    Clear Inactive
                                </button>
                                <div style={{ padding: '1rem', marginTop: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Troubleshoot</h3>
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            try {
                                                const res = await fetch('/api/admin/health-check');
                                                const data = await res.json();
                                                const msg = `Server Config Status:\n- Service Key Configured: ${data.key_configured}\n- Key Length: ${data.key_length}\n\n${data.message}`;
                                                alert(msg);
                                                setStatusMessage(data.status === 'ok' ? 'SUCCESS: Server Configured' : 'FAILED: Server Config Missing');
                                            } catch (e) {
                                                alert('Health check failed: ' + e.message);
                                            }
                                            setLoading(false);
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none',
                                            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.86rem'
                                        }}
                                    >
                                        Test Server Config
                                    </button>
                                </div>
                            </div>
                    )}

                            {/* Admin Section: Access Control */}
                            {isAdmin && (
                                <div style={{ maxWidth: '800px', background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--primary-color)' }}>
                                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin: Access Control</h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage user roles and permissions.</p>
                                    </div>

                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                    <th style={{ padding: '0.75rem' }}>User</th>
                                                    <th style={{ padding: '0.75rem' }}>Status</th>
                                                    <th style={{ padding: '0.75rem' }}>Role</th>
                                                    <th style={{ padding: '0.75rem' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allUsers.map(u => (
                                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '0.75rem' }}>{u.username}</td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            <span style={{
                                                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                                                                background: u.status === 'pending' ? '#eab308' : '#22c55e',
                                                                color: u.status === 'pending' ? 'black' : 'white',
                                                                fontWeight: 600
                                                            }}>
                                                                {u.status || 'active'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                style={{ padding: '0.25rem', background: 'var(--bg-color)', color: 'white', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                                                disabled={loading || u.status === 'pending'}
                                                            >
                                                                <option value="member">Member</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '0.75rem' }}>
                                                            {u.status === 'pending' ? (
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        onClick={async () => {
                                                                            setLoading(true);
                                                                            const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', u.id);
                                                                            if (!error) {
                                                                                const { data } = await supabase.from('profiles').select('*').order('username', { ascending: true });
                                                                                if (data) setAllUsers(data);
                                                                            }
                                                                            setLoading(false);
                                                                        }}
                                                                        style={{ padding: '0.25rem 0.75rem', background: '#22c55e', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (!confirm('Reject and delete application?')) return;
                                                                            setLoading(true);
                                                                            const { error } = await supabase.from('profiles').delete().eq('id', u.id);
                                                                            if (!error) {
                                                                                const { data } = await supabase.from('profiles').select('*').order('username', { ascending: true });
                                                                                if (data) setAllUsers(data);
                                                                            }
                                                                            setLoading(false);
                                                                        }}
                                                                        style={{ padding: '0.25rem 0.75rem', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!confirm('Remove this user?')) return;
                                                                        setLoading(true);
                                                                        try {
                                                                            const res = await fetch(`/api/admin/delete-user?id=${u.id}`, { method: 'DELETE' });
                                                                            if (!res.ok) {
                                                                                const d = await res.json();
                                                                                throw new Error(d.error);
                                                                            }
                                                                            // Refresh list
                                                                            const { data } = await supabase.from('profiles').select('*').order('username', { ascending: true });
                                                                            if (data) setAllUsers(data);
                                                                            setStatusMessage('SUCCESS: User removed');
                                                                            setTimeout(() => setStatusMessage(''), 3000);
                                                                        } catch (err) {
                                                                            setStatusMessage('FAILED: ' + err.message);
                                                                        }
                                                                        setLoading(false);
                                                                    }}
                                                                    style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </main>
            </div >
        </ProtectedRoute >
    );
}
