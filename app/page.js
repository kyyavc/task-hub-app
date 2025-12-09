'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, todo: 0, in_progress: 0, done: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (tasks) {
          setStats({
            total: tasks.length,
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            done: tasks.filter(t => t.status === 'done').length
          });
          setRecentTasks(tasks.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }
    fetchDashboardData();

  const channel = supabase
    .channel('dashboard_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      fetchDashboardData();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

return (
  <ProtectedRoute>
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '250px', padding: '2rem', width: '100%' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)' }}>
          Dashboard
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <StatCard title="Total Tasks" value={stats.total} color="var(--primary-color)" />
          <StatCard title="To Do" value={stats.todo} color="#94a3b8" />
          <StatCard title="In Progress" value={stats.in_progress} color="#818cf8" />
          <StatCard title="Done" value={stats.done} color="#4ade80" />
        </div>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</h2>
            <Link href="/tasks" style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>View All</Link>
          </div>

          <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
            {recentTasks.map(task => (
              <div key={task.id} style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(task.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '99px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-secondary)'
                }}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {recentTasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No recent tasks.</p>}
          </div>
        </section>
      </main>
    </div>
  </ProtectedRoute>
);
}

function StatCard({ title, value, color }) {
  return (
    <div style={{
      background: 'var(--surface-color)',
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{title}</span>
      <span style={{ fontSize: '2rem', fontWeight: 700, color: color }}>{value}</span>
    </div>
  );
}
