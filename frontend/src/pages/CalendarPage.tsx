import { useState, useMemo } from 'react'
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

type ViewMode = 'day' | 'week'

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  // Locale for date formatting
  const locale = i18n.language === 'sv' ? 'sv-SE' : i18n.language === 'en' ? 'en-US' : 'fi-FI'

  // Hae tulostimet
  const { data: printersData } = useQuery({
    queryKey: ['printers'],
    queryFn: () => printersApi.getAll(),
  })

  // Laske viikon alku ja loppu
  const weekDates = useMemo(() => {
    const dates: Date[] = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? -6 : 1 - day // Maanantai = viikon alku
    startOfWeek.setDate(startOfWeek.getDate() + diff)
    startOfWeek.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [selectedDate])

  // Hae varaukset valitulle aikavälille
  const startDate = viewMode === 'week' ? weekDates[0] : new Date(selectedDate.setHours(0, 0, 0, 0))
  const endDate = viewMode === 'week'
    ? new Date(weekDates[6].getTime() + 24 * 60 * 60 * 1000 - 1)
    : new Date(new Date(selectedDate).setHours(23, 59, 59, 999))

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['reservations', startDate.toISOString(), endDate.toISOString(), selectedPrinter, viewMode],
    queryFn: () =>
      reservationsApi.getAll({
        printerId: selectedPrinter || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
  })

  const printers: Printer[] = printersData?.data?.data || []
  const reservations: Reservation[] = reservationsData?.data?.data || []

  // Luo tuntilista (8:00 - 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)

  // Navigointi
  const goToPrev = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setSelectedDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Tarkista onko tunti varattu (päivänäkymä)
  const getReservationsForHour = (hour: number, printerId?: string, date?: Date) => {
    const targetDate = date || selectedDate
    return reservations.filter((r) => {
      if (r.status === 'CANCELLED') return false
      if (printerId && r.printer.id !== printerId) return false

      const start = new Date(r.startTime)
      const end = new Date(r.endTime)
      const hourStart = new Date(targetDate)
      hourStart.setHours(hour, 0, 0, 0)
      const hourEnd = new Date(targetDate)
      hourEnd.setHours(hour + 1, 0, 0, 0)

      return start < hourEnd && end > hourStart
    })
  }

  // Tarkista onko päivä tänään
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Muotoile viikon otsikko
  const weekTitle = useMemo(() => {
    const startMonth = weekDates[0].toLocaleDateString(locale, { month: 'short' })
    const endMonth = weekDates[6].toLocaleDateString(locale, { month: 'short' })
    const startDay = weekDates[0].getDate()
    const endDay = weekDates[6].getDate()
    const year = weekDates[6].getFullYear()

    if (startMonth === endMonth) {
      return `${startDay}. - ${endDay}. ${startMonth} ${year}`
    }
    return `${startDay}. ${startMonth} - ${endDay}. ${endMonth} ${year}`
  }, [weekDates, locale])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('calendar.title')}</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('calendar.day')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('calendar.week')}
            </button>
          </div>

          {/* Printer filter */}
          <select
            value={selectedPrinter}
            onChange={(e) => setSelectedPrinter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('calendar.allPrinters')}</option>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrev}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            &larr; {t('calendar.previous')}
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {viewMode === 'week'
                ? weekTitle
                : selectedDate.toLocaleDateString(locale, {
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
            onClick={goToNext}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('calendar.next')} &rarr;
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : viewMode === 'week' ? (
          // Week view
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border-b border-gray-100 w-20">
                    {t('calendar.time')}
                  </th>
                  {weekDates.map((date) => (
                    <th
                      key={date.toISOString()}
                      className={`p-3 text-center text-sm font-medium border-b border-gray-100 ${
                        isToday(date) ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                      }`}
                    >
                      <div>{date.toLocaleDateString(locale, { weekday: 'short' })}</div>
                      <div className={`text-lg ${isToday(date) ? 'font-bold' : ''}`}>
                        {date.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour) => (
                  <tr key={hour} className="border-b border-gray-100">
                    <td className="p-2 text-sm font-medium text-gray-600 bg-gray-50 text-center">
                      {hour}:00
                    </td>
                    {weekDates.map((date) => {
                      const hourReservations = getReservationsForHour(hour, selectedPrinter || undefined, date)
                      const isBooked = hourReservations.length > 0

                      return (
                        <td
                          key={date.toISOString()}
                          className={`p-1 border-l border-gray-100 ${
                            isToday(date) ? 'bg-primary-50/30' : ''
                          }`}
                        >
                          {isBooked ? (
                            hourReservations.map((r) => (
                              <div
                                key={r.id}
                                className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs mb-1 truncate"
                                title={`${r.user.firstName} ${r.user.lastName} - ${r.printer.name}`}
                              >
                                <div className="font-medium truncate">
                                  {selectedPrinter ? r.user.firstName : r.printer.name}
                                </div>
                                <div className="text-primary-600 text-[10px]">
                                  {new Date(r.startTime).toLocaleTimeString(locale, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="h-8" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedPrinter ? (
          // Day view - Single printer
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
                            {new Date(r.startTime).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(r.endTime).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400">{t('calendar.free')}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Day view - All printers
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left text-sm font-medium text-gray-600 border-b border-gray-100">
                    {t('calendar.time')}
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
