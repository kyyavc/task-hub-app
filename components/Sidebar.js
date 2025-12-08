import styles from './Sidebar.module.css';

export default function Sidebar() {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span>TaskHub</span>
            </div>

            <nav className={styles.nav}>
                <a href="#" className={`${styles.navLink} ${styles.active}`}>
                    <span>Dashboard</span>
                </a>
                <a href="#" className={styles.navLink}>
                    <span>My Tasks</span>
                </a>
                <a href="#" className={styles.navLink}>
                    <span>Team</span>
                </a>
                <a href="#" className={styles.navLink}>
                    <span>Settings</span>
                </a>
            </nav>

            <div className={styles.userProfile}>
                <div className={styles.avatar}>JD</div>
                <div>
                    <div style={{ fontWeight: 500 }}>John Doe</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Product Designer</div>
                </div>
            </div>
        </aside>
    );
}
