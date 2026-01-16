import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { printersApi, reservationsApi, usersApi } from '../services/api'

interface Printer {
  id: string
  name: string
  status: string
}

interface Reservation {
  id: string
  startTime: string
  endTime: string
  description?: string
  status: string
  printer: { id: string; name: string }
}

export default function ReservationsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    printerId: '',
    startTime: '',
    endTime: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Locale for date formatting
  const locale = i18n.language === 'sv' ? 'sv-SE' : i18n.language === 'en' ? 'en-US' : 'fi-FI'

  // Hae tulostimet
  const { data: printersData } = useQuery({
    queryKey: ['printers'],
    queryFn: () => printersApi.getAll(),
  })

  // Hae omat varaukset
  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => usersApi.getMyReservations(),
  })

  const printers: Printer[] = printersData?.data?.data || []
  const reservations: Reservation[] = reservationsData?.data?.data || []

  // Luo varaus
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => reservationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      setShowForm(false)
      setFormData({ printerId: '', startTime: '', endTime: '', description: '' })
      setError('')
      setSuccess(t('reservations.createSuccess'))
      setTimeout(() => setSuccess(''), 5000)
    },
    onError: (err: { response?: { data?: { error?: string | { message?: string } } } }) => {
      const errorData = err.response?.data?.error
      const message = typeof errorData === 'string'
        ? errorData
        : errorData?.message || t('common.error')
      setError(message)
    },
  })

  // Peruuta varaus
  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
      setSuccess(t('reservations.cancelSuccess'))
      setTimeout(() => setSuccess(''), 5000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    createMutation.mutate(formData)
  }

  const handleCancel = (id: string) => {
    if (confirm(t('reservations.cancelReservation') + '?')) {
      cancelMutation.mutate(id)
    }
  }

  // Järjestä varaukset: aktiiviset ensin, sitten peruutetut
  const sortedReservations = [...reservations].sort((a, b) => {
    const statusOrder = { CONFIRMED: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3 }
    const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 4) -
                       (statusOrder[b.status as keyof typeof statusOrder] || 4)
    if (statusDiff !== 0) return statusDiff
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('reservations.title')}</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setError('')
            setSuccess('')
          }}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {showForm ? t('common.cancel') : t('reservations.newReservation')}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* New reservation form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t('reservations.newReservation')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reservations.printer')}
              </label>
              <select
                value={formData.printerId}
                onChange={(e) => setFormData({ ...formData, printerId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{t('reservations.selectPrinter')}</option>
                {printers
                  .filter((p) => p.status === 'AVAILABLE')
                  .map((printer) => (
                    <option key={printer.id} value={printer.id}>
                      {printer.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reservations.startTime')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reservations.endTime')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reservations.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('reservations.descriptionPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? t('common.loading') : t('common.create')}
            </button>
          </form>
        </div>
      )}

      {/* Reservations list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('reservations.myReservations')}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : sortedReservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('reservations.noReservations')}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedReservations.map((reservation) => (
              <div key={reservation.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-800">{reservation.printer.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        reservation.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : reservation.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : reservation.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {reservation.status === 'CONFIRMED'
                        ? t('reservations.confirmed')
                        : reservation.status === 'PENDING'
                        ? t('reservations.pending')
                        : reservation.status === 'CANCELLED'
                        ? t('reservations.cancelled')
                        : t('reservations.completed')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(reservation.startTime).toLocaleString(locale)} -{' '}
                    {new Date(reservation.endTime).toLocaleString(locale)}
                  </p>
                  {reservation.description && (
                    <p className="text-sm text-gray-400 mt-1">{reservation.description}</p>
                  )}
                </div>

                {(reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') && (
                  <button
                    onClick={() => handleCancel(reservation.id)}
                    disabled={cancelMutation.isPending}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start sm:self-auto"
                  >
                    {t('reservations.cancelReservation')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
