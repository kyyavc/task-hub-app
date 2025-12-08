'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const { logout, user } = useAuth();
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span>TaskHub</span>
            </div>

            <nav className={styles.nav}>
                <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>
                    <span>Dashboard</span>
                </Link>
                <Link href="/tasks" className={`${styles.navLink} ${isActive('/tasks') ? styles.active : ''}`}>
                    <span>My Tasks</span>
                </Link>
                <Link href="/team" className={`${styles.navLink} ${isActive('/team') ? styles.active : ''}`}>
                    <span>Team</span>
                </Link>
                <Link href="/settings" className={`${styles.navLink} ${isActive('/settings') ? styles.active : ''}`}>
                    <span>Settings</span>
                </Link>
            </nav>

            <div className={styles.userProfile}>
                <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{user?.username || 'User'}</div>
                    <button
                        onClick={logout}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            width: '100%',
                            textAlign: 'center',
                            fontWeight: 500,
                            marginTop: '8px'
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
