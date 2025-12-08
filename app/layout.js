import './globals.css'
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Task Hub',
  description: 'Manage your tasks efficiently',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
