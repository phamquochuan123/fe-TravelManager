import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, X, Loader2, CalendarDays, Users } from 'lucide-react'
import api from '../../api/axiosInstance'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Progress } from '../../components/ui/progress'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourOption { id: number; name: string }
interface StaffOption { id: number; name: string; avatar?: string }
interface Schedule {
  id: number
  tourId: number
  departureDate: string
  maxSlots: number
  bookedSlots: number
  staffId?: number
  staffName?: string
  staffAvatar?: string
  status: string
}
interface PagedSchedules { content: Schedule[]; totalPages: number; totalElements: number }

interface SchedForm {
  departureDate: string
  maxSlots: string
  staffId: string
  status: string
}

const INIT_FORM: SchedForm = { departureDate: '', maxSlots: '20', staffId: '', status: 'SCHEDULED' }

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  SCHEDULED:   { label: 'Sắp khởi hành', cls: 'bg-blue-100 text-blue-700'   },
  UPCOMING:    { label: 'Sắp tới',        cls: 'bg-blue-100 text-blue-700'   },
  CONFIRMED:   { label: 'Đã xác nhận',   cls: 'bg-blue-100 text-blue-700'   },
  ONGOING:     { label: 'Đang diễn ra',  cls: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'Đang diễn ra',  cls: 'bg-amber-100 text-amber-700' },
  COMPLETED:   { label: 'Hoàn thành',    cls: 'bg-green-100 text-green-700' },
  CANCELLED:   { label: 'Đã hủy',        cls: 'bg-red-100 text-red-600'     },
}
const DEFAULT_SC = { label: 'Không rõ', cls: 'bg-gray-100 text-gray-600' }

// ─── TourCombobox ─────────────────────────────────────────────────────────────

function TourCombobox({ selected, onSelect }: {
  selected: TourOption | null
  onSelect: (t: TourOption | null) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Endpoint nhẹ chỉ trả id + name, không load ảnh
  const { data, isFetching } = useQuery<TourOption[]>({
    queryKey: ['admin', 'tours-all'],
    queryFn: async () => {
      const res = await api.get('/admin/tours/names')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
  const allTours = data ?? []

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = q.trim()
    ? allTours.filter(t => t.name.toLowerCase().includes(q.toLowerCase()))
    : allTours

  if (selected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm font-medium text-primary max-w-sm">
        <CalendarDays size={15} />
        <span className="flex-1 truncate">{selected.name}</span>
        <button type="button" onClick={() => onSelect(null)} className="hover:opacity-70">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative max-w-sm">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          onClick={() => setOpen(true)}
          placeholder="Tìm và chọn tour..."
          className="pl-9 text-sm"
        />
        {isFetching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400 text-center">
              {isFetching ? 'Đang tải...' : 'Không có tour nào'}
            </p>
          ) : (
            <ScrollArea className="max-h-60">
              {filtered.map(t => (
                <button key={t.id} type="button"
                  onClick={() => { onSelect(t); setQ(''); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0">
                  {t.name}
                </button>
              ))}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}

// ─── StaffCombobox ────────────────────────────────────────────────────────────

function StaffCombobox({ value, onSelect }: {
  value: StaffOption | null
  onSelect: (s: StaffOption | null) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<StaffOption[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const fetchStaff = async (search: string) => {
    try {
      const res = await api.get(`/admin/staff?search=${encodeURIComponent(search)}&size=20`)
      const raw: { id: number; name?: string; fullName?: string; avatar?: string; avatarUrl?: string }[] =
        res.data?.content ?? res.data ?? []
      const mapped: StaffOption[] = Array.isArray(raw)
        ? raw.map(s => ({ id: s.id, name: s.name ?? s.fullName ?? '', avatar: s.avatar ?? s.avatarUrl }))
        : []
      setResults(mapped)
      setOpen(true)
    } catch { setResults([]) }
  }

  useEffect(() => {
    if (!q.trim()) return
    const id = setTimeout(() => fetchStaff(q), 300)
    return () => clearTimeout(id)
  }, [q])

  return (
    <div ref={ref} className="relative">
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded">
          <Avatar className="w-6 h-6">
            <AvatarImage src={value.avatar} />
            <AvatarFallback className="text-xs">{value.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm flex-1">{value.name}</span>
          <button type="button" onClick={() => onSelect(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={e => setQ(e.target.value)}
            onClick={() => fetchStaff(q)}
            placeholder="Tìm nhân viên..." className="pl-9 text-sm" />
        </div>
      )}
      {open && results.length > 0 && !value && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
          <ScrollArea className="max-h-48">
            {results.map(s => (
              <button key={s.id} type="button" onClick={() => { onSelect(s); setQ(''); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 transition-colors">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={s.avatar} />
                  <AvatarFallback className="text-xs">{s.name[0]}</AvatarFallback>
                </Avatar>
                {s.name}
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// ─── ScheduleDialog ───────────────────────────────────────────────────────────

function ScheduleDialog({ open, onOpenChange, schedule, tourId, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void
  schedule: Schedule | null; tourId: number | null; onSuccess: () => void
}) {
  const isEdit = !!schedule
  const [form, setForm] = useState<SchedForm>(INIT_FORM)
  const [staff, setStaff] = useState<StaffOption | null>(null)
  const [dialogTour, setDialogTour] = useState<TourOption | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (schedule) {
      setForm({
        departureDate: schedule.departureDate.slice(0, 10),
        maxSlots: String(schedule.maxSlots),
        staffId: String(schedule.staffId ?? ''),
        status: schedule.status,
      })
      setStaff(schedule.staffId ? { id: schedule.staffId, name: schedule.staffName ?? '', avatar: schedule.staffAvatar } : null)
    } else {
      setForm(INIT_FORM); setStaff(null); setDialogTour(null)
    }
  }, [open, schedule])

  const set = <K extends keyof SchedForm>(k: K, v: string) => setForm(p => ({ ...p, [k]: v }))

  const effectiveTourId = tourId ?? dialogTour?.id ?? null

  const submit = async () => {
    if (!effectiveTourId) { toast.error('Vui lòng chọn tour'); return }
    if (!form.departureDate) { toast.error('Chọn ngày khởi hành'); return }
    setBusy(true)
    try {
      const body = {
        tourId: effectiveTourId,
        departureDate: form.departureDate,
        maxSlots: parseInt(form.maxSlots) || 1,
        staffId: staff?.id ?? null,
        status: form.status,
      }
      if (isEdit) await api.put(`/admin/schedules/${schedule!.id}`, body)
      else await api.post('/admin/schedules', body)
      toast.success(isEdit ? 'Cập nhật lịch thành công' : 'Thêm lịch khởi hành thành công')
      onSuccess(); onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Đã có lỗi xảy ra')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa lịch khởi hành' : 'Thêm lịch khởi hành'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!tourId && !isEdit && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tour <span className="text-red-500">*</span></Label>
              <TourCombobox selected={dialogTour} onSelect={setDialogTour} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Ngày khởi hành <span className="text-red-500">*</span></Label>
            <Input type="date" value={form.departureDate} onChange={e => set('departureDate', e.target.value)}
              min={isEdit ? undefined : dayjs().format('YYYY-MM-DD')} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Số chỗ tối đa</Label>
            <Input type="number" min={1} value={form.maxSlots} onChange={e => set('maxSlots', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nhân viên phụ trách</Label>
            <StaffCombobox value={staff} onSelect={s => { setStaff(s); set('staffId', s ? String(s.id) : '') }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Trạng thái</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Sắp khởi hành</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
          <Button onClick={submit} disabled={busy} className="text-white bg-primary">
            {busy && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {isEdit ? 'Cập nhật' : 'Thêm lịch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSchedulesPage() {
  const qc = useQueryClient()
  const [selectedTour, setSelectedTour] = useState<TourOption | null>(() => {
    try {
      const stored = sessionStorage.getItem('admin-selected-tour')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

  const params = new URLSearchParams({
    page: String(page), size: '10',
    ...(selectedTour ? { tourId: String(selectedTour.id) } : {}),
  }).toString()

  const { data: paged, isLoading } = useQuery<PagedSchedules>({
    queryKey: ['admin', 'schedules', selectedTour?.id, page],
    queryFn: async () => (await api.get(`/admin/schedules?${params}`)).data,
    enabled: !!selectedTour,
    placeholderData: prev => prev,
  })

  const schedules = paged?.content ?? []
  const totalPages = paged?.totalPages ?? 1
  const totalElements = paged?.totalElements ?? 0

  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'schedules', selectedTour?.id] })

  const delMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/schedules/${id}`),
    onSuccess: () => { toast.success('Đã xóa lịch'); setDeleteTarget(null); inv() },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <TooltipProvider>
      <div className="p-6 space-y-5" >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Lịch khởi hành</h1>
            <p className="text-sm text-gray-400 mt-0.5">Quản lý lịch khởi hành theo tour</p>
          </div>
          <Button onClick={() => { setEditSchedule(null); setDialogOpen(true) }}
            className="text-white rounded font-semibold gap-2 bg-primary">
            <Plus size={16} /> Thêm lịch
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Chọn tour</Label>
          <TourCombobox selected={selectedTour} onSelect={t => {
            if (t) sessionStorage.setItem('admin-selected-tour', JSON.stringify(t))
            else sessionStorage.removeItem('admin-selected-tour')
            setSelectedTour(t); setPage(0)
          }} />
        </div>

        {!selectedTour ? (
          <div className="bg-white rounded border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
            <CalendarDays size={48} className="text-gray-200" />
            <p className="text-gray-400 font-medium text-sm">Chọn một tour để xem lịch khởi hành</p>
          </div>
        ) : (
          <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{selectedTour.name}</p>
              <span className="text-xs text-gray-400">{totalElements} lịch</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#f8f5ee]/70">
                    {['Ngày khởi hành', 'Số chỗ tối đa', 'Đã đặt', 'Nhân viên', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                          ))}
                        </tr>
                      ))
                    : schedules.length === 0
                    ? (
                      <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                        <CalendarDays size={32} className="text-gray-200 mx-auto mb-2" />
                        Chưa có lịch khởi hành
                      </td></tr>
                    )
                    : schedules.map(s => {
                        const pct = s.maxSlots > 0 ? (s.bookedSlots / s.maxSlots) * 100 : 0
                        const overloaded = pct > 80
                        const sc = STATUS_CFG[s.status] ?? DEFAULT_SC
                        const hasBookings = s.bookedSlots > 0
                        return (
                          <tr key={s.id} className="border-b border-gray-50 hover:bg-[#f8f5ee]/50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                              {dayjs(s.departureDate).format('DD/MM/YYYY')}
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Users size={13} className="text-gray-400" />
                                {s.maxSlots}
                              </div>
                            </td>
                            <td className="px-4 py-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium whitespace-nowrap ${overloaded ? 'text-red-600' : 'text-gray-700'}`}>
                                  {s.bookedSlots}/{s.maxSlots}
                                </span>
                                <Progress value={pct}
                                  className={`h-1.5 w-20 ${overloaded ? '[&>div]:bg-red-500' : ''}`} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {s.staffName ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-7 h-7">
                                    <AvatarImage src={s.staffAvatar} />
                                    <AvatarFallback className="text-xs bg-primary text-white">
                                      {s.staffName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-700">{s.staffName}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Chưa phân công</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${sc.cls}`}>{sc.label}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => { setEditSchedule(s); setDialogOpen(true) }}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Sửa">
                                  <Pencil size={14} />
                                </button>
                                {hasBookings ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed">
                                        <Trash2 size={14} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>Đã có đặt chỗ, không thể xóa</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <button type="button" onClick={() => setDeleteTarget(s)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Xóa">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Trang {page + 1}/{totalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40">← Trước</button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40">Tiếp →</button>
                </div>
              </div>
            )}
          </div>
        )}

        <ScheduleDialog open={dialogOpen} onOpenChange={setDialogOpen}
          schedule={editSchedule} tourId={selectedTour?.id ?? null} onSuccess={inv} />

        <ConfirmDialog
          open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}
          title="Xóa lịch khởi hành"
          description={`Xóa lịch ${deleteTarget ? dayjs(deleteTarget.departureDate).format('DD/MM/YYYY') : ''}? Không thể hoàn tác.`}
          variant="danger"
          onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget.id)}
          loading={delMutation.isPending}
        />
      </div>
    </TooltipProvider>
  )
}
