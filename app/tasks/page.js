'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import TaskBoard from '@/components/TaskBoard';
import GanttChart from '@/components/GanttChart';
import NewTaskModal from '@/components/NewTaskModal';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board'); // 'board' or 'gantt'

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
                console.warn('Supabase error:', error.message);
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

    const [editingTask, setEditingTask] = useState(null);

    const handleTaskCreated = (newTask) => {
        setTasks([newTask, ...tasks]);
    };

    const handleTaskUpdated = (updatedTask) => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskDeleted = (taskId) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    // Reset editing task when modal closes
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    return (
        <ProtectedRoute>
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
                                My Tasks
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Manage your personal and project tasks
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {/* View Toggles */}
                            <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                                <button
                                    onClick={() => setViewMode('board')}
                                    style={{
                                        padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                        background: viewMode === 'board' ? 'var(--primary-color)' : 'transparent',
                                        color: viewMode === 'board' ? 'white' : 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}
                                >
                                    Board
                                </button>
                                <button
                                    onClick={() => setViewMode('gantt')}
                                    style={{
                                        padding: '0.5rem 1rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                        background: viewMode === 'gantt' ? 'var(--primary-color)' : 'transparent',
                                        color: viewMode === 'gantt' ? 'white' : 'var(--text-secondary)',
                                        fontWeight: 500
                                    }}
                                >
                                    Gantt
                                </button>
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                            >
                                + New Task
                            </button>
                        </div>
                    </header>

                    {loading ? (
                        <div style={{ color: 'var(--text-secondary)' }}>Loading tasks...</div>
                    ) : (
                        viewMode === 'board' ?
                            <TaskBoard tasks={tasks} onTaskUpdate={fetchTasks} onEditTask={openEditModal} /> :
                            <GanttChart tasks={tasks} />
                    )}

                    {isModalOpen && (
                        <NewTaskModal
                            onClose={handleCloseModal}
                            onTaskCreated={handleTaskCreated}
                            task={editingTask}
                            onTaskUpdated={handleTaskUpdated}
                            onTaskDeleted={handleTaskDeleted}
                        />
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
