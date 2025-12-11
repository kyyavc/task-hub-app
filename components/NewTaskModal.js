'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import styles from './NewTaskModal.module.css';

export default function NewTaskModal({ onClose, onTaskCreated, task = null, onTaskUpdated, onTaskDeleted }) {
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
        assignee_id: null,
        start_date: '',
        due_date: ''
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'todo',
                assignee_id: task.assignee_id || null,
                start_date: task.start_date ? task.start_date.split('T')[0] : '',
                due_date: task.due_date ? task.due_date.split('T')[0] : ''
            });
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Sanitize data: convert empty strings to null for dates and assignee
        const payload = {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            assignee_id: formData.assignee_id || null,
            start_date: formData.start_date || null,
            due_date: formData.due_date || null
        };
        console.log('Creating Task with Payload:', payload);

        try {
            let data, error;

            if (task) {
                // Update existing
                ({ data, error } = await supabase
                    .from('tasks')
                    .update(payload)
                    .eq('id', task.id)
                    .select('*, profiles(username, avatar_url)')
                    .single());
                if (!error && onTaskUpdated) onTaskUpdated(data);
            } else {
                // Create new
                ({ data, error } = await supabase
                    .from('tasks')
                    .insert([payload])
                    .select('*, profiles(username, avatar_url)')
                    .single());
                if (!error && onTaskCreated) onTaskCreated(data);
            }

            if (error) throw error;
            onClose();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset confirmation when task changes
    useEffect(() => {
        setShowDeleteConfirm(false);
    }, [task]);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            const { error, count } = await supabase.from('tasks').delete({ count: 'exact' }).eq('id', task.id);

            if (error) throw error;
            if (count === 0) throw new Error('RLS Blocked Delete (0 rows deleted)');

            if (onTaskDeleted) onTaskDeleted(task.id);
            onClose();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{task ? 'Edit Task' : 'Create New Task'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* ... (existing fields kept as is by context, but we are just replacing the header/footer wrapping) ... */}
                    {/* Wait, I can't replace just the function and the return if I don't match the middle. 
                        I will use the StartLine/EndLine to target specific blocks.
                        1. Add state.
                        2. Logic for handleDelete (remove confirm).
                        3. Update Footer to show conditional buttons.
                     */}
                    {/* I'll restart this tool call to do it in chunks properly. */}
                    {/* ABORTING THIS CALL to split it. */}
                    {/* ... (existing fields kept as is by context, but we are just replacing the header/footer wrapping) ... */}
                    {/* Actually, user wants replaced fields? No, just wrapping. 
                        Wait, replace_file_content replaces contiguous blocks. 
                        I can't replace header AND footer unless I include the whole body.
                        I will use multiple replacement chunks if using multi_replace...
                        But I'm using replace_file_content.
                        Let's act smarter. I will replace the Header first, then the Footer.
                     */}

                    {/* ... wait, I will use multi_replace for this to be safe in next step.
                         Let's just update the header now. */}

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
                            onChange={e => {
                                const newStatus = e.target.value;
                                setFormData({
                                    ...formData,
                                    status: newStatus
                                });
                            }}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Start Date</label>
                            <input
                                className={styles.input}
                                type="date"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Due Date</label>
                            <input
                                className={styles.input}
                                type="date"
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.footer} style={{ justifyContent: 'space-between' }}>
                        {showDeleteConfirm ? (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                                <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>Are you sure?</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                                        Cancel
                                    </button>
                                    <button type="button" onClick={confirmDelete} className="btn btn-primary" style={{ background: '#ef4444', border: 'none', fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    {task && (
                                        <button type="button" onClick={handleDeleteClick} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginRight: '1rem' }}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
