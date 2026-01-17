import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, printersApi, reservationsApi, auditApi } from '../services/api'

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

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  userId: string
  userEmail?: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  createdAt: string
  user?: { firstName: string; lastName: string; email: string }
}

export default function AdminPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'users' | 'printers' | 'reservations' | 'audit'>('users')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('')
  const [auditActionFilter, setAuditActionFilter] = useState<string>('')

  // Tulostimen hallinta
  const [showPrinterModal, setShowPrinterModal] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null)
  const [printerForm, setPrinterForm] = useState({ name: '', description: '', location: '' })

  const locale = i18n.language === 'sv' ? 'sv-SE' : i18n.language === 'en' ? 'en-US' : 'fi-FI'

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

  // Hae audit-lokit
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-audit', auditEntityFilter, auditActionFilter],
    queryFn: () => auditApi.getAll({
      entityType: auditEntityFilter || undefined,
      action: auditActionFilter || undefined,
      limit: 100,
    }),
    enabled: activeTab === 'audit',
  })

  const users: User[] = usersData?.data?.data || []
  const printers: Printer[] = printersData?.data?.data || []
  const reservations: Reservation[] = reservationsData?.data?.data || []
  const auditLogs: AuditLog[] = auditData?.data?.data || []

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

  // Luo tulostin
  const createPrinterMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; location?: string }) =>
      printersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
      closePrinterModal()
    },
  })

  // Muokkaa tulostinta
  const editPrinterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; location?: string } }) =>
      printersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printers'] })
      closePrinterModal()
    },
  })

  // Poista tulostin
  const deletePrinterMutation = useMutation({
    mutationFn: (id: string) => printersApi.delete(id),
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

  // Tulostimen hallinta funktiot
  const openAddPrinterModal = () => {
    setEditingPrinter(null)
    setPrinterForm({ name: '', description: '', location: '' })
    setShowPrinterModal(true)
  }

  const openEditPrinterModal = (printer: Printer) => {
    setEditingPrinter(printer)
    setPrinterForm({
      name: printer.name,
      description: printer.description || '',
      location: printer.location || '',
    })
    setShowPrinterModal(true)
  }

  const closePrinterModal = () => {
    setShowPrinterModal(false)
    setEditingPrinter(null)
    setPrinterForm({ name: '', description: '', location: '' })
  }

  const handlePrinterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPrinter) {
      editPrinterMutation.mutate({
        id: editingPrinter.id,
        data: printerForm,
      })
    } else {
      createPrinterMutation.mutate(printerForm)
    }
  }

  const handleDeletePrinter = (printer: Printer) => {
    if (confirm(t('admin.deletePrinterConfirm', { name: printer.name }))) {
      deletePrinterMutation.mutate(printer.id)
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
        <button onClick={() => setActiveTab('audit')} className={tabClass('audit')}>
          {t('admin.auditLogs')}
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
        <div className="space-y-4">
          {/* Lisää tulostin -nappi */}
          <div className="flex justify-end">
            <button
              onClick={openAddPrinterModal}
              className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              + {t('admin.addPrinter')}
            </button>
          </div>

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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      {t('common.edit')}
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
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditPrinterModal(printer)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDeletePrinter(printer)}
                            disabled={deletePrinterMutation.isPending}
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

      {/* Tulostimen lisäys/muokkaus modaali */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingPrinter ? t('admin.editPrinter') : t('admin.addPrinter')}
            </h3>
            <form onSubmit={handlePrinterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('printers.name')} *
                </label>
                <input
                  type="text"
                  value={printerForm.name}
                  onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ultimaker S5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('printers.description')}
                </label>
                <input
                  type="text"
                  value={printerForm.description}
                  onChange={(e) => setPrinterForm({ ...printerForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder={t('admin.printerDescriptionPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('printers.location')}
                </label>
                <input
                  type="text"
                  value={printerForm.location}
                  onChange={(e) => setPrinterForm({ ...printerForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Technobothnia"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePrinterModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createPrinterMutation.isPending || editPrinterMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {editingPrinter ? t('common.save') : t('admin.addPrinter')}
                </button>
              </div>
            </form>
          </div>
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

      {/* Audit logs tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                {t('admin.entityType')}:
              </label>
              <select
                value={auditEntityFilter}
                onChange={(e) => setAuditEntityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('admin.allTypes')}</option>
                <option value="USER">{t('admin.users')}</option>
                <option value="RESERVATION">{t('admin.reservations')}</option>
                <option value="PRINTER">{t('admin.printers')}</option>
                <option value="SYSTEM">{t('admin.system')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">
                {t('admin.action')}:
              </label>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('admin.allActions')}</option>
                <option value="CREATE">{t('admin.actionCreate')}</option>
                <option value="UPDATE">{t('admin.actionUpdate')}</option>
                <option value="DELETE">{t('admin.actionDelete')}</option>
                <option value="LOGIN">{t('admin.actionLogin')}</option>
                <option value="LOGOUT">{t('admin.actionLogout')}</option>
                <option value="LOGIN_FAILED">{t('admin.actionLoginFailed')}</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {auditLoading ? (
              <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('admin.noAuditLogs')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {t('admin.timestamp')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {t('admin.user')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {t('admin.action')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {t('admin.entityType')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {t('admin.details')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleString(locale)}
                        </td>
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div>
                              <span className="font-medium text-gray-800">
                                {log.user.firstName} {log.user.lastName}
                              </span>
                              <p className="text-xs text-gray-500">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">{log.userEmail || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                            log.action === 'LOGIN' ? 'bg-purple-100 text-purple-700' :
                            log.action === 'LOGIN_FAILED' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.entityType}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                          {log.newValue ? (
                            <span title={log.newValue}>{log.newValue.substring(0, 50)}...</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
