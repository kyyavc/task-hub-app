'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import TaskBoard from '@/components/TaskBoard';
import NewTaskModal from '@/components/NewTaskModal';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase error potentially due to missing env vars or empty tables:', error.message);
      }

      if (data) {
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleTaskCreated = (newTask) => {
    setTasks([newTask, ...tasks]);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />

      <main style={{ marginLeft: '250px', padding: '2rem', width: '100%' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Project Tasks
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage and track your team's progress
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            + New Task
          </button>
        </header>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading tasks...</div>
        ) : (
          <TaskBoard tasks={tasks} />
        )}

        {isModalOpen && (
          <NewTaskModal
            onClose={() => setIsModalOpen(false)}
            onTaskCreated={handleTaskCreated}
          />
        )}
      </main>
    </div>
  );
}
