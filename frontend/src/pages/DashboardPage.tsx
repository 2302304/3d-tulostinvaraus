import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { printersApi, usersApi } from '../services/api'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  // Hae tulostimet
  const { data: printersData } = useQuery({
    queryKey: ['printers'],
    queryFn: () => printersApi.getAll(),
  })

  // Hae omat varaukset
  const { data: reservationsData } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => usersApi.getMyReservations(),
  })

  const printers = printersData?.data?.data || []
  const reservations = reservationsData?.data?.data || []

  // Aktiiviset varaukset (tulevat ja käynnissä)
  const activeReservations = reservations.filter(
    (r: { status: string; endTime: string }) =>
      (r.status === 'PENDING' || r.status === 'CONFIRMED') &&
      new Date(r.endTime) > new Date()
  )

  // Vapaat tulostimet
  const availablePrinters = printers.filter(
    (p: { status: string }) => p.status === 'AVAILABLE'
  )

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {t('dashboard.title')}, {user?.firstName}!
        </h1>
        <p className="text-primary-100">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active reservations */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              {t('dashboard.myActiveReservations')}
            </h3>
            <span className="text-3xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {activeReservations.length}
          </p>
        </div>

        {/* Available printers */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              {t('dashboard.availablePrinters')}
            </h3>
            <span className="text-3xl">🖨️</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {availablePrinters.length} / {printers.length}
          </p>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            {t('dashboard.quickActions')}
          </h3>
          <div className="space-y-2">
            <Link
              to="/reservations"
              className="block w-full py-2 px-4 bg-primary-500 text-white text-center rounded-lg hover:bg-primary-600 transition-colors"
            >
              {t('dashboard.newReservation')}
            </Link>
            <Link
              to="/calendar"
              className="block w-full py-2 px-4 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('dashboard.viewCalendar')}
            </Link>
          </div>
        </div>
      </div>

      {/* Printers list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('printers.title')}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {printers.map((printer: { id: string; name: string; location: string; status: string }) => (
            <div key={printer.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{printer.name}</h3>
                <p className="text-sm text-gray-500">{printer.location}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  printer.status === 'AVAILABLE'
                    ? 'bg-green-100 text-green-700'
                    : printer.status === 'MAINTENANCE'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {printer.status === 'AVAILABLE'
                  ? t('printers.available')
                  : printer.status === 'MAINTENANCE'
                  ? t('printers.maintenance')
                  : t('printers.outOfOrder')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* My reservations */}
      {activeReservations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              {t('reservations.myReservations')}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {activeReservations.slice(0, 5).map((reservation: {
              id: string
              printer: { name: string }
              startTime: string
              endTime: string
              status: string
            }) => (
              <div key={reservation.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">
                    {reservation.printer.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(reservation.startTime).toLocaleString('fi-FI')} -{' '}
                    {new Date(reservation.endTime).toLocaleString('fi-FI')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reservation.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {reservation.status === 'CONFIRMED'
                    ? t('reservations.confirmed')
                    : t('reservations.pending')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
