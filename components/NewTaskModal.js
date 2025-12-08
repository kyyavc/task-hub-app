'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './NewTaskModal.module.css';

export default function NewTaskModal({ onClose, onTaskCreated }) {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase.from('profiles').select('id, username');
            if (data) setMembers(data);
        };
        fetchMembers();
    }, []);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        assignee_id: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([formData])
                .select('*, profiles(username, avatar_url)')
                .single();

            if (error) throw error;

            onTaskCreated(data);
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Create New Task</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Title</label>
                        <input
                            className={styles.input}
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Redesign Dashboard"
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            className={styles.textarea}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Add details..."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Status</label>
                        <select
                            className={styles.select}
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Assignee</label>
                        <select
                            className={styles.select}
                            value={formData.assignee_id || ''}
                            onChange={e => setFormData({ ...formData, assignee_id: e.target.value || null })}
                        >
                            <option value="">Unassigned</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>{member.username}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
