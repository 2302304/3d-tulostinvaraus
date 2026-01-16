import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, printersApi, reservationsApi } from '../services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  _count?: { reservations: number }
}

interface Printer {
  id: string
  name: string
  description?: string
  location: string
  status: string
}

interface Reservation {
  id: string
  startTime: string
  endTime: string
  description?: string
  status: string
  user: { id: string; firstName: string; lastName: string; email: string }
  printer: { id: string; name: string; location: string }
}

export default function AdminPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'users' | 'printers' | 'reservations'>('users')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Hae käyttäjät
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getAll(),
  })

  // Hae tulostimet
  const { data: printersData, isLoading: printersLoading } = useQuery({
    queryKey: ['printers'],
    queryFn: () => printersApi.getAll(),
  })

  // Hae kaikki varaukset
  const { data: reservationsData, isLoading: reservationsLoading } = useQuery({
    queryKey: ['admin-reservations', statusFilter],
    queryFn: () => reservationsApi.getAll(statusFilter ? { status: statusFilter } : undefined),
  })

  const users: User[] = usersData?.data?.data || []
  const printers: Printer[] = printersData?.data?.data || []
  const reservations: Reservation[] = reservationsData?.data?.data || []

  // Päivitä käyttäjän rooli
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  // Aktivoi/deaktivoi käyttäjä
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.setActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  // Päivitä tulostimen tila
  const updatePrinterMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      printersApi.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['printers'] }),
  })

  // Peruuta varaus
  const cancelReservationMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reservations'] }),
  })

  // Poista varaus
  const deleteReservationMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reservations'] }),
  })

  const handleCancelReservation = (id: string) => {
    if (confirm(t('reservations.cancelReservation') + '?')) {
      cancelReservationMutation.mutate(id)
    }
  }

  const handleDeleteReservation = (id: string) => {
    if (confirm(t('admin.deleteConfirm'))) {
      deleteReservationMutation.mutate(id)
    }
  }

  const tabClass = (tab: string) =>
    `px-4 py-2 font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-primary-500 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  const getStatusBadge = (status: string) => {
    const classes = {
      CONFIRMED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
    }
    const labels = {
      CONFIRMED: t('reservations.confirmed'),
      PENDING: t('reservations.pending'),
      CANCELLED: t('reservations.cancelled'),
      COMPLETED: t('reservations.completed'),
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800">{t('admin.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
          {t('admin.users')}
        </button>
        <button onClick={() => setActiveTab('printers')} className={tabClass('printers')}>
          {t('admin.printers')}
        </button>
        <button onClick={() => setActiveTab('reservations')} className={tabClass('reservations')}>
          {t('admin.reservations')}
        </button>
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {usersLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('auth.firstName')} {t('auth.lastName')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('auth.email')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('admin.role')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('admin.reservations')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('admin.active')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">
                        {user.firstName} {user.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({ id: user.id, role: e.target.value })
                        }
                        className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="STUDENT">{t('admin.student')}</option>
                        <option value="STAFF">{t('admin.staff')}</option>
                        <option value="ADMIN">{t('admin.adminRole')}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user._count?.reservations || 0}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })
                        }
                        className={`px-3 py-1 text-sm rounded-full font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? t('admin.active') : t('common.no')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Printers tab */}
      {activeTab === 'printers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {printersLoading ? (
            <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('printers.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('printers.location')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    {t('printers.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {printers.map((printer) => (
                  <tr key={printer.id}>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-800">{printer.name}</span>
                        {printer.description && (
                          <p className="text-sm text-gray-500">{printer.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{printer.location}</td>
                    <td className="px-4 py-3">
                      <select
                        value={printer.status}
                        onChange={(e) =>
                          updatePrinterMutation.mutate({ id: printer.id, status: e.target.value })
                        }
                        className={`px-3 py-1 text-sm rounded-lg border-0 font-medium ${
                          printer.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-700'
                            : printer.status === 'MAINTENANCE'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="AVAILABLE">{t('printers.available')}</option>
                        <option value="MAINTENANCE">{t('printers.maintenance')}</option>
                        <option value="OUT_OF_ORDER">{t('printers.outOfOrder')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reservations tab */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              {t('admin.filterByStatus')}:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{t('admin.allStatuses')}</option>
              <option value="CONFIRMED">{t('reservations.confirmed')}</option>
              <option value="PENDING">{t('reservations.pending')}</option>
              <option value="CANCELLED">{t('reservations.cancelled')}</option>
              <option value="COMPLETED">{t('reservations.completed')}</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {reservationsLoading ? (
              <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
            ) : reservations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('reservations.noReservations')}</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('admin.user')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('reservations.printer')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('reservations.startTime')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('reservations.endTime')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('reservations.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('common.edit')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-800">
                            {reservation.user.firstName} {reservation.user.lastName}
                          </span>
                          <p className="text-xs text-gray-500">{reservation.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{reservation.printer.name}</span>
                        {reservation.printer.location && (
                          <p className="text-xs text-gray-500">{reservation.printer.location}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(reservation.startTime).toLocaleString('fi-FI')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(reservation.endTime).toLocaleString('fi-FI')}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(reservation.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {(reservation.status === 'CONFIRMED' || reservation.status === 'PENDING') && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={cancelReservationMutation.isPending}
                              className="px-2 py-1 text-xs text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            >
                              {t('reservations.cancelReservation')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            disabled={deleteReservationMutation.isPending}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
