import styles from './GanttChart.module.css';

export default function GanttChart({ tasks }) {
    const timedTasks = tasks.filter(t => t.start_date && t.due_date);

    if (timedTasks.length === 0) {
        return <div className={styles.empty}>No tasks with dates scheduled.</div>; // Shortened msg
    }

    const dates = timedTasks.flatMap(t => [new Date(t.start_date), new Date(t.due_date)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

    const getGridColumn = (d) => {
        const date = new Date(d);
        const diff = Math.ceil((date - minDate) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    };

    const daysArray = Array.from({ length: totalDays }, (_, i) => {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div className={styles.container}>
            <div className={styles.chart} style={{ gridTemplateColumns: `200px repeat(${totalDays}, 50px)` }}>
                {/* Header Row (Row 1) */}
                <div className={`${styles.cell} ${styles.headerCell} ${styles.sticky}`} style={{ gridRow: 1 }}>Task</div>
                {daysArray.map((d, i) => (
                    <div key={i} className={`${styles.cell} ${styles.headerCell} ${styles.dateCell}`} style={{ gridRow: 1, gridColumn: i + 2 }}>
                        <div className={styles.dayNum}>{d.getDate()}</div>
                        <div className={styles.dayName}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                    </div>
                ))}

                {/* Task Rows (Row 2+) */}
                {timedTasks.map((task, index) => {
                    const rowIndex = index + 2; // header is 1
                    const startCol = getGridColumn(task.start_date);
                    const endCol = getGridColumn(task.due_date);
                    const duration = Math.max(1, endCol - startCol + 1);

                    return (
                        // Use React Fragment or return array if keys allow, but here we place directly in grid
                        <>
                            <div
                                key={`t-${task.id}`}
                                className={`${styles.cell} ${styles.taskTitle} ${styles.sticky}`}
                                style={{ gridRow: rowIndex, gridColumn: 1 }}
                            >
                                {task.title}
                            </div>

                            <div
                                key={`b-${task.id}`}
                                className={`${styles.taskBar} ${styles[`status_${task.status}`]}`}
                                style={{
                                    gridRow: rowIndex,
                                    gridColumn: `${startCol + 1} / span ${duration}` // +1 offset for title col
                                }}
                                title={`${task.title}`}
                            >
                                <span className={styles.barLabel}>{task.status.replace('_', ' ')}</span>
                            </div>

                            {/* Fill empty cells for visual grid lines (optional, skipped for perf/simplicity in V1) */}
                        </>
                    );
                })}
            </div>
        </div>
    );
}
