import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import LanguageSelector from './LanguageSelector'

export default function Layout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-500 text-white'
        : 'text-gray-700 hover:bg-primary-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">
                3D-tulostinvaraus
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink to="/dashboard" className={navLinkClass}>
                {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/reservations" className={navLinkClass}>
                {t('nav.reservations')}
              </NavLink>
              <NavLink to="/calendar" className={navLinkClass}>
                {t('nav.calendar')}
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className={navLinkClass}>
                  {t('nav.admin')}
                </NavLink>
              )}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <div className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Technobothnia - 3D-tulostinvaraus
          </p>
        </div>
      </footer>
    </div>
  )
}
