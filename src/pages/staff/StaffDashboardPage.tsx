import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import {
  Briefcase, CalendarCheck, Clock,
  ChevronLeft, ChevronRight, Users, Eye, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '../../components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { ScrollArea } from '../../components/ui/scroll-area'
import { useAuthStore } from '../../stores/authStore'
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

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  UPCOMING:    { label: 'Sắp tới',      bg: '#eaf4fb', color: '#1a5276' },
  CONFIRMED:   { label: 'Đã xác nhận',  bg: '#eaf4fb', color: '#1a5276' },
  IN_PROGRESS: { label: 'Đang diễn ra', bg: '#f3e8ff', color: '#7c3aed' },
  COMPLETED:   { label: 'Hoàn thành',   bg: '#dcfce7', color: '#16a34a' },
  CANCELLED:   { label: 'Đã hủy',       bg: '#fee2e2', color: '#dc2626' },
}

const NEXT_STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'Bắt đầu tour' },
  { value: 'COMPLETED',   label: 'Hoàn thành'   },
  { value: 'CANCELLED',   label: 'Hủy chuyến'   },
]

const VI_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMondayOfWeek = (base: dayjs.Dayjs): dayjs.Dayjs => {
  const dow = base.day()
  const diff = dow === 0 ? -6 : 1 - dow
  return base.add(diff, 'day').startOf('day')
}

const StatusBadge = ({ status }: { status?: string }) => {
  const cfg = STATUS_CONFIG[status ?? ''] ?? { label: status ?? '—', bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ─── Dark Metric Strip ────────────────────────────────────────────────────────

interface DarkMetricStripProps {
  total: number
  today: number
  upcoming: number
}

const DarkMetricStrip = ({ total, today, upcoming }: DarkMetricStripProps) => {
  const metrics = [
    { label: 'Tour phụ trách',       value: total,    icon: Briefcase,    pulse: false },
    { label: 'Tour hôm nay',         value: today,    icon: CalendarCheck, pulse: true  },
    { label: 'Tour sắp tới (7 ngày)',value: upcoming, icon: Clock,         pulse: false },
  ]

  return (
    <div className="bg-foreground rounded-2xl px-6 py-5">
      <div className="flex items-stretch divide-x divide-white/10">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex-1 min-w-0 ${i > 0 ? 'pl-6' : ''} ${i < metrics.length - 1 ? 'pr-6' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              {m.pulse && m.value > 0 && (
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              )}
              <p className="text-[32px] font-black leading-none tabular-nums tracking-tight text-background">
                {m.value}
              </p>
            </div>
            <p className="text-xs mt-2 leading-snug" style={{ color: 'oklch(0.708 0 0)' }}>
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </div>
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
    p.contactPhone?.includes(search)
  )

  const handleExport = () => {
    if (!filtered.length) return
    const headers = ['STT', 'Họ tên', 'SĐT', 'Số người', 'Tổng tiền', 'Trạng thái']
    const rows = filtered.map((p, i) => [
      i + 1,
      p.contactName,
      p.contactPhone ?? '',
      `${p.numAdults}NL + ${p.numChildren}TE`,
      p.finalPrice.toLocaleString('vi-VN') + '₫',
      p.status,
    ])
    const csv = '﻿' + [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `HK-${departure?.tourName ?? 'tour'}.csv` })
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            Hành khách — {departure?.tourName}
            <span className="text-sm text-muted-foreground font-normal ml-2">
              {departure?.departureDate ? dayjs(departure.departureDate).format('DD/MM/YYYY') : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-2">
          <Input
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary transition-all hover:opacity-90 shrink-0"
          >
            Xuất CSV
          </button>
        </div>

        <ScrollArea className="h-72 mt-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span
                className="w-7 h-7 border-2 rounded-full animate-spin"
                style={{ borderColor: 'oklch(0.355 0.093 233 / 15%)', borderTopColor: 'oklch(0.355 0.093 233)' }}
              />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Không có hành khách</p>
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
                    <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{p.contactName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.contactPhone ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.numAdults}NL + {p.numChildren}TE</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{p.notes ?? '—'}</TableCell>
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

// ─── Tour Detail Sheet ────────────────────────────────────────────────────────

const TourDetailSheet = ({
  departure, open, onClose,
}: { departure: Departure | null; open: boolean; onClose: () => void }) => {
  if (!departure) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-base font-bold text-foreground pr-8 leading-snug">
            {departure.tourName}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <img
            src={`https://picsum.photos/seed/tour-${departure.tourId}/400/200`}
            alt={departure.tourName}
            className="w-full h-40 object-cover rounded-xl"
          />

          <div className="space-y-3">
            {[
              { label: 'Ngày khởi hành', value: departure.departureDate ? dayjs(departure.departureDate).format('DD/MM/YYYY') : '—' },
              { label: 'Ngày về',        value: departure.returnDate    ? dayjs(departure.returnDate).format('DD/MM/YYYY')    : '—' },
              { label: 'Điểm đến',       value: departure.destination ?? '—' },
              { label: 'Chỗ còn lại',    value: departure.availableSlots != null ? `${departure.availableSlots} chỗ` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Trạng thái</span>
              <StatusBadge status={departure.status} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const StaffDashboardPage = () => {
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDep, setSelectedDep] = useState<Departure | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [passengerDep, setPassengerDep] = useState<Departure | null>(null)
  const [passengerOpen, setPassengerOpen] = useState(false)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: departures = [], isLoading } = useQuery<Departure[]>({
    queryKey: ['staff', 'my-tours'],
    queryFn: async () => {
      const res = await api.get('/staff/my-tours')
      return res.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      api.patch(`/staff/departures/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      queryClient.invalidateQueries({ queryKey: ['staff', 'my-tours'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Stats ─────────────────────────────────────────────────────────────────

  const today = dayjs().format('YYYY-MM-DD')

  const todayTours = useMemo(
    () => departures.filter(d => d.departureDate && dayjs(d.departureDate).format('YYYY-MM-DD') === today),
    [departures, today]
  )

  const next7Tours = useMemo(
    () => departures.filter(d => {
      if (!d.departureDate) return false
      const date = dayjs(d.departureDate)
      return date.isAfter(dayjs()) && date.isBefore(dayjs().add(7, 'day'))
    }),
    [departures]
  )

  // ── Week timeline ─────────────────────────────────────────────────────────

  const weekDays = useMemo(() => {
    const monday = getMondayOfWeek(dayjs().add(weekOffset * 7, 'day'))
    return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'))
  }, [weekOffset])

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

  // ── Upcoming tours ────────────────────────────────────────────────────────

  const upcomingTours = useMemo(
    () =>
      departures
        .filter(d => d.departureDate && !dayjs(d.departureDate).isBefore(dayjs().startOf('day')))
        .sort((a, b) => dayjs(a.departureDate).unix() - dayjs(b.departureDate).unix()),
    [departures]
  )

  const openSheet = useCallback((dep: Departure) => {
    setSelectedDep(dep)
    setSheetOpen(true)
  }, [])

  const openPassengers = useCallback((dep: Departure, e: React.MouseEvent) => {
    e.stopPropagation()
    setPassengerDep(dep)
    setPassengerOpen(true)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <span
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'oklch(0.355 0.093 233 / 15%)', borderTopColor: 'oklch(0.355 0.093 233)' }}
      />
    </div>
  )

  return (
    <div className="p-6 space-y-7">

      {/* ── Greeting ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-foreground">
          Xin chào, {user?.name?.split(' ').pop() ?? 'bạn'}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {dayjs().locale('vi').format('dddd, DD/MM/YYYY')}
        </p>
      </div>

      {/* ── Dark metric strip ─────────────────────────────── */}
      <DarkMetricStrip
        total={departures.length}
        today={todayTours.length}
        upcoming={next7Tours.length}
      />

      {/* ── Week timeline ─────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-foreground text-sm">Lịch tuần này</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(p => p - 1)}
              aria-label="Tuần trước"
              className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-muted-foreground px-2 font-medium">
              {weekDays[0].format('DD/MM')} – {weekDays[6].format('DD/MM/YYYY')}
            </span>
            <button
              onClick={() => setWeekOffset(p => p + 1)}
              aria-label="Tuần sau"
              className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 7-column grid */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {weekDays.map((day, idx) => {
              const key = day.format('YYYY-MM-DD')
              const isToday = key === today
              const tours = toursByDate[key] ?? []
              return (
                <div
                  key={key}
                  className={`border-r border-border last:border-r-0 p-3 min-h-[140px] ${
                    isToday ? 'bg-primary/8' : ''
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {VI_DAYS[idx]}
                    </span>
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {day.date()}
                    </span>
                  </div>

                  {/* Tour cards */}
                  <div className="space-y-1.5">
                    {tours.map(dep => {
                      const cfg = STATUS_CONFIG[dep.status ?? 'UPCOMING'] ?? STATUS_CONFIG['UPCOMING']
                      return (
                        <button
                          key={dep.departureId}
                          onClick={() => openSheet(dep)}
                          className="w-full text-left p-2 rounded-lg border hover:shadow-sm transition-all text-xs min-h-[36px]"
                          style={{ backgroundColor: cfg.bg + '80', borderColor: cfg.color + '40' }}
                        >
                          <p className="font-semibold text-foreground truncate leading-snug">
                            {dep.tourName}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                              <Users size={10} />
                              {dep.availableSlots ?? '—'}
                            </span>
                            <span className="font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Upcoming tours table ───────────────────────────── */}
      {upcomingTours.length > 0 && (
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-bold text-foreground text-sm">Danh sách tour sắp tới</h2>
            <span className="text-xs text-muted-foreground">{upcomingTours.length} tour</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên tour</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="hidden md:table-cell">Điểm đến</TableHead>
                  <TableHead className="hidden sm:table-cell">Chỗ còn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingTours.map(dep => (
                  <TableRow
                    key={dep.departureId}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openSheet(dep)}
                  >
                    <TableCell className="font-semibold text-foreground max-w-[180px] truncate">
                      {dep.tourName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {dep.departureDate ? dayjs(dep.departureDate).format('DD/MM/YYYY') : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {dep.destination ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      {dep.availableSlots != null ? `${dep.availableSlots} chỗ` : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dep.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={e => openPassengers(dep, e)}
                          className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-primary-foreground bg-primary transition-all hover:opacity-90"
                        >
                          <Eye size={12} /> Xem HK
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors">
                              <RefreshCw size={12} /> Cập nhật
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {NEXT_STATUS_OPTIONS.map(opt => (
                              <DropdownMenuItem
                                key={opt.value}
                                onClick={() => updateStatusMutation.mutate({ id: dep.departureId, status: opt.value })}
                                className={opt.value === 'CANCELLED' ? 'text-red-500' : ''}
                              >
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* ── Modals & sheets ───────────────────────────────── */}
      <TourDetailSheet departure={selectedDep} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <PassengerModal departure={passengerDep} open={passengerOpen} onClose={() => setPassengerOpen(false)} />
    </div>
  )
}

export default StaffDashboardPage
