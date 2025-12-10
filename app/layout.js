
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Task Hub',
  description: 'Team Task Management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
            v1.3-Debug-NoConfirm
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
