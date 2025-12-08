import styles from './TaskCard.module.css';

export default function TaskCard({ task }) {
    const statusClass = styles[`status_${task.status}`] || styles.status_todo;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>{task.title}</h3>
                </div>
            </div>
            <p className={styles.description}>{task.description}</p>

            <div className={styles.footer}>
                <span className={`${styles.status} ${statusClass}`}>
                    {task.status.replace('_', ' ')}
                </span>
                {task.assignee_id && (
                    <div className={styles.assignee} title="Assignee">
                        A
                    </div>
                )}
            </div>
        </div>
    );
}
