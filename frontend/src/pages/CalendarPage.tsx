import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { printersApi, reservationsApi } from '../services/api'

interface Printer {
  id: string
  name: string
  status: string
}

interface Reservation {
  id: string
  startTime: string
  endTime: string
  status: string
  user: { firstName: string; lastName: string }
  printer: { id: string; name: string }
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')

  // Hae tulostimet
  const { data: printersData } = useQuery({
    queryKey: ['printers'],
    queryFn: () => printersApi.getAll(),
  })

  // Hae varaukset valitulle päivälle
  const startOfDay = new Date(selectedDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(selectedDate)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['reservations', startOfDay.toISOString(), endOfDay.toISOString(), selectedPrinter],
    queryFn: () =>
      reservationsApi.getAll({
        printerId: selectedPrinter || undefined,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      }),
  })

  const printers: Printer[] = printersData?.data?.data || []
  const reservations: Reservation[] = reservationsData?.data?.data || []

  // Luo tuntilista (8:00 - 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)

  // Navigointi
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Tarkista onko tunti varattu
  const getReservationsForHour = (hour: number, printerId?: string) => {
    return reservations.filter((r) => {
      if (r.status === 'CANCELLED') return false
      if (printerId && r.printer.id !== printerId) return false

      const start = new Date(r.startTime)
      const end = new Date(r.endTime)
      const hourStart = new Date(selectedDate)
      hourStart.setHours(hour, 0, 0, 0)
      const hourEnd = new Date(selectedDate)
      hourEnd.setHours(hour + 1, 0, 0, 0)

      return start < hourEnd && end > hourStart
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('calendar.title')}</h1>

        {/* Printer filter */}
        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Kaikki tulostimet</option>
          {printers.map((printer) => (
            <option key={printer.id} value={printer.id}>
              {printer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            &larr; Edellinen
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedDate.toLocaleDateString('fi-FI', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
            >
              {t('calendar.today')}
            </button>
          </div>

          <button
            onClick={goToNextDay}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Seuraava &rarr;
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : selectedPrinter ? (
          // Single printer view
          <div className="divide-y divide-gray-100">
            {hours.map((hour) => {
              const hourReservations = getReservationsForHour(hour, selectedPrinter)
              const isBooked = hourReservations.length > 0

              return (
                <div key={hour} className="flex">
                  <div className="w-20 p-3 bg-gray-50 text-sm font-medium text-gray-600 border-r border-gray-100">
                    {hour}:00
                  </div>
                  <div className="flex-1 p-3">
                    {isBooked ? (
                      hourReservations.map((r) => (
                        <div
                          key={r.id}
                          className="bg-primary-100 text-primary-800 px-3 py-2 rounded-lg text-sm"
                        >
                          <span className="font-medium">
                            {r.user.firstName} {r.user.lastName}
                          </span>
                          <span className="text-primary-600 ml-2">
                            {new Date(r.startTime).toLocaleTimeString('fi-FI', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(r.endTime).toLocaleTimeString('fi-FI', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400">Vapaa</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // All printers view
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border-b border-gray-100">
                    Aika
                  </th>
                  {printers.map((printer) => (
                    <th
                      key={printer.id}
                      className="p-3 text-left text-sm font-medium text-gray-600 border-b border-gray-100"
                    >
                      {printer.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="border-b border-gray-100">
                    <td className="p-3 text-sm font-medium text-gray-600 bg-gray-50">
                      {hour}:00
                    </td>
                    {printers.map((printer) => {
                      const hourReservations = getReservationsForHour(hour, printer.id)
                      const isBooked = hourReservations.length > 0

                      return (
                        <td key={printer.id} className="p-2">
                          {isBooked ? (
                            <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                              {hourReservations[0].user.firstName}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-300">-</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
