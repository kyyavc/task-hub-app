import { supabase } from '@/lib/supabaseClient';
import styles from './TaskCard.module.css';

export default function TaskCard({ task, onUpdate, onEdit }) {
    const statusClass = styles[`status_${task.status}`] || styles.status_todo;

    return (
        <div className={styles.card} onClick={onEdit} style={{ cursor: 'pointer' }}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>{task.title}</h3>
                </div>
            </div>
            <p className={styles.description}>{task.description}</p>

            <div className={styles.footer}>
                <select
                    className={`${styles.status} ${statusClass}`}
                    value={task.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={async (e) => {
                        const newStatus = e.target.value;
                        const updates = {
                            status: newStatus,
                            completed_at: newStatus === 'done' ? new Date().toISOString() : null
                        };
                        const { error } = await supabase
                            .from('tasks')
                            .update(updates)
                            .eq('id', task.id)
                            .select();
                        if (!error && onUpdate) onUpdate();
                    }}
                    style={{ border: 'none', cursor: 'pointer', appearance: 'none' }}
                >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                </select>

                {task.assignee_id && (
                    <div className={styles.assignee} title="Assignee">
                        A
                    </div>
                )}
            </div>
        </div>
    );
}
