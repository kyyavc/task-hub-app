import TaskCard from './TaskCard';
import styles from './TaskBoard.module.css';

const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
];

export default function TaskBoard({ tasks, onTaskUpdate, onEditTask }) {
    const getTasksByStatus = (status) => {
        return tasks.filter(task => task.status === status);
    };

    return (
        <div className={styles.board}>
            {columns.map(column => {
                const columnTasks = getTasksByStatus(column.id);

                return (
                    <div key={column.id} className={styles.column}>
                        <div className={styles.columnHeader}>
                            <h3 className={styles.columnTitle}>
                                {column.title}
                                <span className={styles.count}>{columnTasks.length}</span>
                            </h3>
                        </div>

                        <div className={styles.taskList}>
                            {columnTasks.map(task => (
                                <TaskCard key={task.id} task={task} onUpdate={onTaskUpdate} onEdit={() => onEditTask && onEditTask(task)} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
