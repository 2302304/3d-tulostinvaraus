import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, printersApi } from '../services/api'

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

export default function AdminPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'users' | 'printers'>('users')

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

  const users: User[] = usersData?.data?.data || []
  const printers: Printer[] = printersData?.data?.data || []

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

  const tabClass = (tab: string) =>
    `px-4 py-2 font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-primary-500 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

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
                    Varauksia
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
                        {user.isActive ? 'Aktiivinen' : 'Ei aktiivinen'}
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
    </div>
  )
}
