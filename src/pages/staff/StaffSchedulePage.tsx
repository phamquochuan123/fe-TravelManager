import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  ChevronLeft, ChevronRight, Clock, Users,
  Download, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '../../components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '../../components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { ScrollArea } from '../../components/ui/scroll-area'
import api from '../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Departure {
  departureId: number
  tourId: number
  tourName: string
  departureDate: string
  returnDate?: string
  availableSlots?: number
  maxSlots?: number
  status?: string
  destination?: string
  departureTime?: string
}

interface Passenger {
  id: number
  contactName: string
  contactEmail?: string
  contactPhone?: string
  numAdults: number
  numChildren: number
  finalPrice: number
  status: string
  notes?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  UPCOMING:    { label: 'Sắp tới',      bg: '#eaf4fb', color: '#1a5276', dot: '#2980b9' },
  CONFIRMED:   { label: 'Sắp tới',      bg: '#eaf4fb', color: '#1a5276', dot: '#2980b9' },
  IN_PROGRESS: { label: 'Đang diễn ra', bg: '#f3e8ff', color: '#7c3aed', dot: '#7c3aed' },
  COMPLETED:   { label: 'Hoàn thành',   bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' },
  CANCELLED:   { label: 'Đã hủy',       bg: '#fee2e2', color: '#dc2626', dot: '#dc2626' },
}

const NEXT_STATUS_OPTIONS = [
  { value: 'CONFIRMED',   label: 'Xác nhận' },
  { value: 'IN_PROGRESS', label: 'Bắt đầu tour' },
  { value: 'COMPLETED',   label: 'Hoàn thành' },
  { value: 'CANCELLED',   label: 'Hủy chuyến' },
]

const VI_SHORT_MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
const VI_DAY_HEADERS  = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCalendarDays = (month: dayjs.Dayjs): dayjs.Dayjs[] => {
  const start = month.startOf('month')
  const dow = start.day()
  const offset = dow === 0 ? 6 : dow - 1
  const calStart = start.subtract(offset, 'day')
  const totalDays = Math.ceil((month.daysInMonth() + offset) / 7) * 7
  return Array.from({ length: totalDays }, (_, i) => calStart.add(i, 'day'))
}

const StatusBadge = ({ status }: { status?: string }) => {
  const cfg = STATUS_CONFIG[status ?? ''] ?? { label: status ?? '—', bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Passenger Modal ──────────────────────────────────────────────────────────

const PassengerModal = ({
  departure, open, onClose,
}: { departure: Departure | null; open: boolean; onClose: () => void }) => {
  const [search, setSearch] = useState('')

  const { data: passengers = [], isLoading } = useQuery<Passenger[]>({
    queryKey: ['staff', 'passengers', departure?.departureId],
    queryFn: async () => {
      const res = await api.get(`/staff/my-tours/${departure!.departureId}/passengers`)
      return res.data
    },
    enabled: open && !!departure,
  })

  const filtered = passengers.filter(p =>
    p.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    (p.contactPhone ?? '').includes(search)
  )

  const handleExport = () => {
    if (!filtered.length) return
    const headers = ['STT', 'Họ tên', 'SĐT', 'Số người', 'Tổng tiền', 'Ghi chú']
    const rows = filtered.map((p, i) => [
      i + 1, p.contactName, p.contactPhone ?? '',
      `${p.numAdults}NL + ${p.numChildren}TE`,
      p.finalPrice.toLocaleString('vi-VN') + '₫',
      p.notes ?? '',
    ])
    const csv = '﻿' + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `HK-${departure?.tourName}.csv` })
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-900">
            {departure?.tourName}
            <span className="text-sm text-gray-400 font-normal ml-2">
              {departure?.departureDate ? dayjs(departure.departureDate).format('DD/MM/YYYY') : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm theo tên hoặc SĐT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all shrink-0"
            style={{ backgroundColor: '#1a5276' }}
          >
            <Download size={14} /> Xuất danh sách
          </button>
        </div>

        <ScrollArea className="h-72 mt-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="w-7 h-7 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(26,82,118,0.2)', borderTopColor: '#1a5276' }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">Không có hành khách</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Số người</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-gray-400 text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900 text-sm">{p.contactName}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{p.contactPhone ?? '—'}</TableCell>
                    <TableCell className="text-sm">{p.numAdults}NL + {p.numChildren}TE</TableCell>
                    <TableCell className="text-gray-400 text-xs truncate max-w-[120px]">{p.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ─── Status Update Popover ────────────────────────────────────────────────────

const StatusUpdatePopover = ({ departure }: { departure: Departure }) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: async () =>
      api.patch(`/staff/departures/${departure.departureId}/status`, {
        status: selectedStatus,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      queryClient.invalidateQueries({ queryKey: ['staff', 'my-tours'] })
      setOpen(false)
      setSelectedStatus('')
      setReason('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleConfirm = () => {
    if (selectedStatus === 'CANCELLED' && reason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do hủy (ít nhất 5 ký tự)')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex-1 text-center py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cập nhật TT
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="end">
          <p className="text-sm font-bold text-gray-900 mb-3">Chọn trạng thái mới</p>

          <div className="space-y-2 mb-3">
            {NEXT_STATUS_OPTIONS.map(opt => {
              const cfg = STATUS_CONFIG[opt.value]
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedStatus === opt.value ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`status-${departure.departureId}`}
                    value={opt.value}
                    checked={selectedStatus === opt.value}
                    onChange={() => setSelectedStatus(opt.value)}
                    className="accent-[#1a5276]"
                  />
                  <span className="flex items-center gap-1.5 text-sm">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cfg?.dot ?? '#9ca3af' }}
                    />
                    {opt.label}
                  </span>
                </label>
              )
            })}
          </div>

          {selectedStatus === 'CANCELLED' && (
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Lý do hủy <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Nhập lý do hủy chuyến..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!selectedStatus}
            className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1a5276' }}
          >
            Xác nhận
          </button>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi trạng thái?</AlertDialogTitle>
            <AlertDialogDescription>
              Chuyển tour <strong>{departure.tourName}</strong> sang trạng thái{' '}
              <strong>{NEXT_STATUS_OPTIONS.find(o => o.value === selectedStatus)?.label}</strong>.
              {reason && <> Lý do: {reason}</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => mutation.mutate()}
              style={{ backgroundColor: '#1a5276' }}
            >
              {mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Tour Schedule Card ───────────────────────────────────────────────────────

const TourScheduleCard = ({
  departure, onViewPassengers,
}: { departure: Departure; onViewPassengers: (dep: Departure) => void }) => {
  const cfg = STATUS_CONFIG[departure.status ?? 'UPCOMING'] ?? STATUS_CONFIG['UPCOMING']
  const filled  = (departure.maxSlots ?? 0) - (departure.availableSlots ?? 0)
  const total   = departure.maxSlots ?? 0
  const pct     = total > 0 ? Math.round((filled / total) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <img
          src={`https://picsum.photos/seed/tour-${departure.tourId}/160/160`}
          alt={departure.tourName}
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
              {departure.tourName}
            </h3>
            <StatusBadge status={departure.status} />
          </div>

          {departure.destination && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{departure.destination}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {departure.departureTime && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {departure.departureTime}
              </span>
            )}
            {total > 0 && (
              <span className="flex items-center gap-1">
                <Users size={11} /> {filled}/{total}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-2">
              <Progress value={pct} className="h-1.5" />
              <p className="text-[10px] text-gray-400 mt-0.5">{pct}% lấp đầy</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onViewPassengers(departure)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all"
          style={{ backgroundColor: '#1a5276' }}
        >
          <Users size={12} /> Danh sách HK
        </button>
        <StatusUpdatePopover departure={departure} />
      </div>
    </div>
  )
}

// ─── Calendar Legend ──────────────────────────────────────────────────────────

const CalendarLegend = () => (
  <div className="flex flex-wrap gap-3 mt-3">
    {[
      { dot: '#2980b9', label: 'Sắp tới' },
      { dot: '#7c3aed', label: 'Đang diễn ra' },
      { dot: '#16a34a', label: 'Hoàn thành' },
    ].map(({ dot, label }) => (
      <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
        {label}
      </div>
    ))}
  </div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

const StaffSchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'))
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [passengerDep, setPassengerDep] = useState<Departure | null>(null)
  const [passengerOpen, setPassengerOpen] = useState(false)

  const { data: departures = [], isLoading } = useQuery<Departure[]>({
    queryKey: ['staff', 'my-tours'],
    queryFn: async () => {
      const res = await api.get('/staff/my-tours')
      return res.data
    },
  })

  const toursByDate = useMemo(() => {
    const map: Record<string, Departure[]> = {}
    departures.forEach(d => {
      if (d.departureDate) {
        const key = dayjs(d.departureDate).format('YYYY-MM-DD')
        if (!map[key]) map[key] = []
        map[key].push(d)
      }
    })
    return map
  }, [departures])

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const toursForSelected = toursByDate[selectedDate] ?? []

  const today = dayjs().format('YYYY-MM-DD')

  const openPassengers = useCallback((dep: Departure) => {
    setPassengerDep(dep)
    setPassengerOpen(true)
  }, [])

  return (
    <div className="p-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* ── Calendar ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="font-bold text-gray-900 text-sm">
              {VI_SHORT_MONTHS[currentMonth.month()]} {currentMonth.year()}
            </p>
            <button
              onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {VI_DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map(day => {
              const key = day.format('YYYY-MM-DD')
              const isCurrentMonth = day.month() === currentMonth.month()
              const isToday = key === today
              const isSelected = key === selectedDate
              const tours = toursByDate[key] ?? []
              const hasTours = tours.length > 0

              const dominantStatus = tours[0]?.status ?? 'UPCOMING'
              const cfg = STATUS_CONFIG[dominantStatus] ?? STATUS_CONFIG['UPCOMING']

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`
                    relative flex flex-col items-center py-1.5 rounded-xl transition-all text-xs font-medium
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isSelected && !isToday ? 'ring-2 ring-[#1a5276]' : ''}
                    ${!isSelected ? 'hover:bg-gray-50' : ''}
                  `}
                  style={
                    isToday
                      ? { backgroundColor: '#1a5276', color: '#fff' }
                      : isSelected
                      ? { backgroundColor: '#eaf4fb', color: '#1a5276' }
                      : undefined
                  }
                >
                  {day.date()}
                  {hasTours && isCurrentMonth && (
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: isToday ? '#fff' : cfg.dot }}
                    />
                  )}
                  {hasTours && isCurrentMonth && tours.length > 1 && (
                    <span
                      className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: '#e67e22', color: '#fff' }}
                    >
                      {tours.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <CalendarLegend />
        </div>

        {/* ── Tour list for selected date ───────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">
              Tour ngày{' '}
              <span style={{ color: '#1a5276' }}>
                {dayjs(selectedDate).format('DD/MM/YYYY')}
              </span>
            </h2>
            {toursForSelected.length > 0 && (
              <span className="text-sm text-gray-400">{toursForSelected.length} tour</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <span className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(26,82,118,0.15)', borderTopColor: '#1a5276' }} />
            </div>
          ) : toursForSelected.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#f0f7ff' }}
              >
                <Clock size={28} style={{ color: '#1a5276' }} />
              </div>
              <p className="font-semibold text-gray-500 text-sm">
                Không có tour nào trong ngày này
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Chọn một ngày khác có tour được đánh dấu
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {toursForSelected.map(dep => (
                <TourScheduleCard
                  key={dep.departureId}
                  departure={dep}
                  onViewPassengers={openPassengers}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PassengerModal
        departure={passengerDep}
        open={passengerOpen}
        onClose={() => setPassengerOpen(false)}
      />
    </div>
  )
}

export default StaffSchedulePage
