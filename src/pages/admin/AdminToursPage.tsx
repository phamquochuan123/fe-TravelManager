import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Search, MapPin, Pencil, Trash2, GripVertical,
  X, ImagePlus, ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw as RefreshCwIcon,
} from 'lucide-react'
import api from '../../api/axiosInstance'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Separator } from '../../components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItineraryDay { title: string; description: string }

interface Tour {
  id: number
  name: string
  destination: string
  durationDays: number
  durationNights: number
  priceAdult: number
  priceChild: number
  departureCount: number
  status: 'ACTIVE' | 'INACTIVE' | 'FULL'
  imageUrl?: string
  imageUrls?: string[]
  description?: string
  hotels?: number[]
  restaurants?: number[]
  itinerary?: ItineraryDay[]
}

interface Destination { id: number; name: string }
interface LinkedItem { id: number; name: string }
interface PagedResponse { content: Tour[]; totalPages: number; totalElements: number }

interface FormState {
  name: string
  destination: string
  durationDays: number
  durationNights: number
  priceAdult: string
  priceChild: string
  description: string
  itinerary: ItineraryDay[]
  hotels: LinkedItem[]
  restaurants: LinkedItem[]
}

const INIT: FormState = {
  name: '', destination: '', durationDays: 1, durationNights: 0,
  priceAdult: '', priceChild: '', description: '',
  itinerary: [{ title: '', description: '' }], hotels: [], restaurants: [],
}

const STATUS_CFG = {
  ACTIVE:   { label: 'Hoạt động', cls: 'bg-emerald-100 text-emerald-700' },
  INACTIVE: { label: 'Tạm dừng',  cls: 'bg-gray-100 text-gray-500' },
  FULL:     { label: 'Đã đầy',    cls: 'bg-red-100 text-red-600' },
} as const

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + '₫'
const parseNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0
const PLACEHOLDER = 'https://placehold.co/56x56/e2e8f0/94a3b8?text=Tour'

interface SeasonalPrice {
  id: number; name: string
  startDate: string; endDate: string
  priceAdult: number; priceChild: number
  isActive: boolean
}

interface SeasonalPriceForm {
  name: string; startDate: string; endDate: string
  priceAdult: string; priceChild: string
}

const SEASONAL_INIT: SeasonalPriceForm = { name: '', startDate: '', endDate: '', priceAdult: '', priceChild: '' }

// ─── ImageUploadZone ──────────────────────────────────────────────────────────

function ImageUploadZone({ files, previews, onChange }: {
  files: File[]; previews: string[]
  onChange: (f: File[], p: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const add = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    // Số ảnh hiện có (data URLs không có File tương ứng)
    const existingCount = previews.length - files.length
    const maxNew = Math.max(0, 10 - existingCount - files.length)
    const newValid = valid.slice(0, maxNew)
    const combined = [...files, ...newValid]
    const existingPreviews = previews.slice(0, existingCount)
    const filePreviews = previews.slice(existingCount)
    const newPreviews = [
      ...existingPreviews,
      ...filePreviews,
      ...newValid.map(f => URL.createObjectURL(f)),
    ]
    onChange(combined, newPreviews)
  }, [files, previews, onChange])

  const remove = (idx: number) => {
    const existingCount = previews.length - files.length
    if (idx < existingCount) {
      // Xóa ảnh hiện có (data URL)
      onChange(files, previews.filter((_, i) => i !== idx))
    } else {
      // Xóa file mới
      const fileIdx = idx - existingCount
      URL.revokeObjectURL(previews[idx])
      onChange(files.filter((_, i) => i !== fileIdx), previews.filter((_, i) => i !== idx))
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded py-8 flex flex-col items-center gap-2 cursor-pointer transition-colors
          ${drag ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-[#f8f5ee]'}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={28} className="text-gray-400" />
        <p className="text-sm text-gray-500">Kéo thả ảnh hoặc click để chọn</p>
        <p className="text-xs text-gray-400">Tối đa 10 ảnh · JPG, PNG, WEBP</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => add(e.target.files)} />
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded overflow-hidden border border-gray-100">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-accent">Chính</span>
              )}
              <button type="button" onClick={e => { e.stopPropagation(); remove(i) }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LinkedItemCombobox ───────────────────────────────────────────────────────

function LinkedItemCombobox({ label, endpoint, selected, onAdd, onRemove }: {
  label: string; endpoint: string
  selected: LinkedItem[]
  onAdd: (item: LinkedItem) => void
  onRemove: (id: number) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<LinkedItem[]>([])
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    const id = setTimeout(async () => {
      setBusy(true)
      try {
        const res = await api.get(`${endpoint}?search=${encodeURIComponent(q)}&size=10`)
        const raw: LinkedItem[] = res.data?.content ?? res.data ?? []
        setResults(Array.isArray(raw) ? raw : [])
        setOpen(true)
      } catch { setResults([]) } finally { setBusy(false) }
    }, 300)
    return () => clearTimeout(id)
  }, [q, endpoint])

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(it => (
            <span key={it.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-primary">
              {it.name}
              <button type="button" onClick={() => onRemove(it.id)} className="hover:opacity-75"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={q} onChange={e => setQ(e.target.value)}
            placeholder={`Tìm ${label.toLowerCase()}...`} className="pl-8 text-sm" />
          {busy && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
        </div>
        {open && results.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
            <ScrollArea className="max-h-48">
              {results.map(it => {
                const sel = !!selected.find(s => s.id === it.id)
                return (
                  <button key={it.id} type="button" onClick={() => { if (!sel) { onAdd(it); setQ(''); setOpen(false) } }}
                    disabled={sel}
                    className={`w-full text-left px-3 py-2 text-sm flex justify-between transition-colors
                      ${sel ? 'text-gray-400 bg-[#f8f5ee] cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-700'}`}>
                    <span>{it.name}</span>
                    {sel && <span className="text-xs">Đã chọn</span>}
                  </button>
                )
              })}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SeasonalPriceDialog ──────────────────────────────────────────────────────

function SeasonalPriceDialog({ open, onOpenChange, tourId, price, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void
  tourId: number; price: SeasonalPrice | null; onSuccess: () => void
}) {
  const isEdit = !!price
  const [form, setForm] = useState<SeasonalPriceForm>(SEASONAL_INIT)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (price) {
      setForm({ name: price.name, startDate: price.startDate, endDate: price.endDate,
        priceAdult: String(price.priceAdult), priceChild: String(price.priceChild) })
    } else { setForm(SEASONAL_INIT) }
  }, [open, price])

  const set = <K extends keyof SeasonalPriceForm>(k: K, v: SeasonalPriceForm[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên mùa'); return }
    if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu'); return }
    if (!form.endDate) { toast.error('Vui lòng chọn ngày kết thúc'); return }
    if (form.endDate <= form.startDate) { toast.error('Ngày kết thúc phải sau ngày bắt đầu'); return }
    const pa = parseInt(form.priceAdult) || 0
    const pc = parseInt(form.priceChild) || 0
    if (pa < 0 || pc < 0) { toast.error('Giá không được âm'); return }
    setBusy(true)
    try {
      const body = { name: form.name, startDate: form.startDate, endDate: form.endDate, priceAdult: pa, priceChild: pc }
      if (isEdit) await api.put(`/tours/${tourId}/seasonal-prices/${price!.id}`, body)
      else await api.post(`/tours/${tourId}/seasonal-prices`, body)
      toast.success(isEdit ? 'Cập nhật giá theo mùa thành công' : 'Thêm giá theo mùa thành công')
      onSuccess(); onOpenChange(false)
    } catch (e: unknown) { toast.error((e as Error).message ?? 'Đã có lỗi xảy ra')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle >
            {isEdit ? 'Chỉnh sửa giá theo mùa' : 'Thêm giá theo mùa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tên mùa <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="VD: Hè 2025, Tết Nguyên Đán..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Ngày bắt đầu <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Ngày kết thúc <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Giá người lớn (₫)</Label>
              <Input value={form.priceAdult} onChange={e => set('priceAdult', e.target.value.replace(/\D/g, ''))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Giá trẻ em (₫)</Label>
              <Input value={form.priceChild} onChange={e => set('priceChild', e.target.value.replace(/\D/g, ''))} placeholder="0" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
          <Button onClick={submit} disabled={busy} className="text-white bg-primary">
            {busy && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {isEdit ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── SeasonalPricesTab ────────────────────────────────────────────────────────

function SeasonalPricesTab({ tourId, isTabActive }: { tourId: number; isTabActive: boolean }) {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPrice, setEditPrice] = useState<SeasonalPrice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SeasonalPrice | null>(null)

  const { data: prices = [], isLoading } = useQuery<SeasonalPrice[]>({
    queryKey: ['seasonal-prices', tourId],
    queryFn: async () => (await api.get(`/tours/${tourId}/seasonal-prices`)).data,
    enabled: isTabActive,
  })

  const inv = () => qc.invalidateQueries({ queryKey: ['seasonal-prices', tourId] })

  const delMutation = useMutation({
    mutationFn: (priceId: number) => api.delete(`/tours/${tourId}/seasonal-prices/${priceId}`),
    onSuccess: () => { toast.success('Đã xóa giá theo mùa'); setDeleteTarget(null); inv() },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Giá theo mùa</span>
        <Button size="sm" onClick={() => { setEditPrice(null); setDialogOpen(true) }}
          className="text-white gap-1.5 h-8 text-xs bg-primary">
          <Plus size={13} /> Thêm
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">Chưa có giá theo mùa nào</div>
      ) : (
        <div className="rounded border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f5ee]/70 border-b border-gray-100">
                {['Tên mùa', 'Từ ngày → Đến ngày', 'Giá NL', 'Giá TE', 'Trạng thái', ''].map(h => (
                  <th key={h} className={`px-3 py-2.5 text-xs font-semibold text-gray-500
                    ${h === 'Giá NL' || h === 'Giá TE' ? 'text-right' : h === 'Trạng thái' ? 'text-center' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-[#f8f5ee]/50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-gray-800">{p.name}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                    {p.startDate} → {p.endDate}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-xs text-accent">
                    {fmtVND(p.priceAdult)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-xs text-accent">
                    {fmtVND(p.priceChild)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.isActive
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Đang áp dụng</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Không áp dụng</span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button type="button" onClick={() => { setEditPrice(p); setDialogOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SeasonalPriceDialog open={dialogOpen} onOpenChange={setDialogOpen}
        tourId={tourId} price={editPrice} onSuccess={inv} />

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        title="Xóa giá theo mùa"
        description={`Bạn có chắc muốn xóa giá "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget.id)}
        loading={delMutation.isPending}
      />
    </div>
  )
}

// ─── TourSheet ────────────────────────────────────────────────────────────────

function TourSheet({ open, onOpenChange, tour, destinations, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void
  tour: Tour | null; destinations: Destination[]; onSuccess: () => void
}) {
  const isEdit = !!tour
  const [form, setForm] = useState<FormState>(INIT)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [tab, setTab] = useState('info')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (tour) {
      setForm({
        name: tour.name, destination: tour.destination,
        durationDays: tour.durationDays, durationNights: tour.durationNights,
        priceAdult: String(tour.priceAdult), priceChild: String(tour.priceChild),
        description: tour.description ?? '',
        itinerary: tour.itinerary?.length ? tour.itinerary : [{ title: '', description: '' }],
        hotels: (tour.hotels ?? []).map(id => ({ id, name: `Hotel #${id}` })),
        restaurants: (tour.restaurants ?? []).map(id => ({ id, name: `Restaurant #${id}` })),
      })
      setImages([])
      setPreviews(tour.imageUrls?.length ? tour.imageUrls : tour.imageUrl ? [tour.imageUrl] : [])
    } else {
      setForm(INIT); setImages([]); setPreviews([])
    }
    setTab('info')
  }, [open, tour])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleDays = (val: string) => {
    const d = Math.max(1, parseInt(val) || 1)
    setForm(p => ({ ...p, durationDays: d, durationNights: Math.max(0, d - 1) }))
  }

  const addDay = () => set('itinerary', [...form.itinerary, { title: '', description: '' }])
  const removeDay = (i: number) => set('itinerary', form.itinerary.filter((_, j) => j !== i))
  const updDay = (i: number, f: keyof ItineraryDay, v: string) =>
    set('itinerary', form.itinerary.map((d, j) => j === i ? { ...d, [f]: v } : d))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên tour'); setTab('info'); return }
    if (!form.destination) { toast.error('Vui lòng chọn điểm đến'); setTab('info'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('destination', form.destination)
      fd.append('durationDays', String(form.durationDays))
      fd.append('durationNights', String(form.durationNights))
      fd.append('priceAdult', String(parseNum(form.priceAdult)))
      fd.append('priceChild', String(parseNum(form.priceChild)))
      fd.append('description', form.description)
      fd.append('itinerary', JSON.stringify(form.itinerary))
      fd.append('hotels', JSON.stringify(form.hotels.map(h => h.id)))
      fd.append('restaurants', JSON.stringify(form.restaurants.map(r => r.id)))
      images.forEach(f => fd.append('images', f))
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) await api.put(`/admin/tours/${tour!.id}`, fd, opts)
      else await api.post('/admin/tours', fd, opts)
      toast.success(isEdit ? 'Cập nhật tour thành công' : 'Thêm tour thành công')
      onSuccess(); onOpenChange(false)
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Đã có lỗi xảy ra')
    } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle >
            {isEdit ? 'Chỉnh sửa tour' : 'Thêm tour mới'}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className={`w-full grid ${isEdit ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
              <TabsTrigger value="links">Liên kết</TabsTrigger>
              {isEdit && <TabsTrigger value="seasonal">Giá theo mùa</TabsTrigger>}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6">
            <TabsContent value="info" className="mt-4 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tên tour <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nhập tên tour..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Điểm đến <span className="text-red-500">*</span></Label>
                <Select value={form.destination} onValueChange={v => set('destination', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn điểm đến..." /></SelectTrigger>
                  <SelectContent>
                    {destinations.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Số ngày</Label>
                  <Input type="number" min={1} value={form.durationDays} onChange={e => handleDays(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Số đêm</Label>
                  <Input type="number" min={0} value={form.durationNights}
                    onChange={e => set('durationNights', Math.max(0, parseInt(e.target.value) || 0))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Giá người lớn (₫)</Label>
                  <Input value={form.priceAdult} onChange={e => set('priceAdult', e.target.value.replace(/\D/g, ''))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Giá trẻ em (₫)</Label>
                  <Input value={form.priceChild} onChange={e => set('priceChild', e.target.value.replace(/\D/g, ''))} placeholder="0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Mô tả</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Mô tả tour..." className="h-28 resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Hình ảnh</Label>
                <ImageUploadZone files={images} previews={previews}
                  onChange={(f, p) => { setImages(f); setPreviews(p) }} />
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="mt-4 space-y-4">
              {form.itinerary.map((day, i) => (
                <div key={i} className="border border-gray-200 rounded p-4 space-y-3 bg-[#f8f5ee]/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">Ngày {i + 1}</span>
                    </div>
                    {form.itinerary.length > 1 && (
                      <button type="button" onClick={() => removeDay(i)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Tiêu đề</Label>
                    <Input value={day.title} onChange={e => updDay(i, 'title', e.target.value)}
                      placeholder={`Tiêu đề ngày ${i + 1}...`} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Hoạt động</Label>
                    <Textarea value={day.description} onChange={e => updDay(i, 'description', e.target.value)}
                      placeholder="Mô tả hoạt động..." className="h-20 text-sm resize-none" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addDay}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={15} /> Thêm ngày
              </button>
            </TabsContent>

            <TabsContent value="links" className="mt-4 space-y-6">
              <LinkedItemCombobox label="Khách sạn liên kết" endpoint="/hotels"
                selected={form.hotels}
                onAdd={it => set('hotels', [...form.hotels, it])}
                onRemove={id => set('hotels', form.hotels.filter(h => h.id !== id))} />
              <Separator />
              <LinkedItemCombobox label="Nhà hàng liên kết" endpoint="/restaurants"
                selected={form.restaurants}
                onAdd={it => set('restaurants', [...form.restaurants, it])}
                onRemove={id => set('restaurants', form.restaurants.filter(r => r.id !== id))} />
            </TabsContent>

            {isEdit && tour && (
              <TabsContent value="seasonal" className="mt-4 pb-4">
                <SeasonalPricesTab tourId={tour.id} isTabActive={tab === 'seasonal'} />
              </TabsContent>
            )}
          </ScrollArea>
        </Tabs>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
          <Button onClick={submit} disabled={busy} className="text-white bg-primary">
            {busy && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {isEdit ? 'Cập nhật' : 'Thêm tour'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminToursPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterDest, setFilterDest] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTour, setEditTour] = useState<Tour | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput); setPage(0) }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => { setPage(0) }, [filterDest, filterStatus])

  const params = new URLSearchParams({
    page: String(page), size: '10',
    ...(search ? { search } : {}),
    ...(filterDest !== 'all' ? { destination: filterDest } : {}),
    ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
  }).toString()

  const { data: paged, isLoading, isFetching, isError, refetch } = useQuery<PagedResponse>({
    queryKey: ['admin', 'tours', params],
    queryFn: async () => (await api.get(`/admin/tours?${params}`)).data,
    placeholderData: prev => prev,
    retry: false,
  })

  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ['destinations'],
    queryFn: async () => {
      const res = await api.get('/destinations')
      return res.data?.content ?? res.data ?? []
    },
    staleTime: 5 * 60_000,
  })

  const tours = paged?.content ?? []
  const totalPages = paged?.totalPages ?? 1
  const totalElements = paged?.totalElements ?? 0

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'tours'] })
    qc.invalidateQueries({ queryKey: ['admin', 'tours-all'] })
  }

  const delMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/tours/${id}`),
    onSuccess: () => { toast.success('Đã xóa tour'); setDeleteTarget(null); inv() },
    onError: (e: Error) => toast.error(e.message),
  })

  const bulkMutation = useMutation({
    mutationFn: (ids: number[]) => api.delete('/admin/tours/bulk', { data: { ids } }),
    onSuccess: () => {
      toast.success(`Đã xóa ${selectedIds.size} tour`)
      setSelectedIds(new Set()); setBulkOpen(false); inv()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const allChecked = tours.length > 0 && tours.every(t => selectedIds.has(t.id))
  const someChecked = tours.some(t => selectedIds.has(t.id)) && !allChecked

  const toggleAll = () => {
    if (allChecked) setSelectedIds(new Set([...selectedIds].filter(id => !tours.map(t => t.id).includes(id))))
    else setSelectedIds(new Set([...selectedIds, ...tours.map(t => t.id)]))
  }

  const toggleRow = (id: number) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  return (
    <div className="p-6 space-y-5" >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Tour</h1>
        </div>
        <Button onClick={() => { setEditTour(null); setSheetOpen(true) }}
          className="text-white rounded font-semibold gap-2 bg-primary">
          <Plus size={16} /> Thêm Tour
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded border"
          style={{ backgroundColor: '#fff7ed', borderColor: '#fdba74' }}>
          <span className="text-sm font-medium" style={{ color: '#c2410c' }}>Đã chọn {selectedIds.size} tour</span>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setBulkOpen(true)}>
            <Trash2 size={13} /> Xóa đã chọn
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm tour..." className="pl-9 text-sm" />
        </div>
        <Select value={filterDest} onValueChange={setFilterDest}>
          <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Điểm đến" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả điểm đến</SelectItem>
            {destinations.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
            <SelectItem value="FULL">Đã đầy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center justify-between px-4 py-3 rounded border border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={14} /> Không tải được danh sách tour
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            <RefreshCwIcon size={13} /> Tải lại
          </button>
        </div>
      )}

      <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f8f5ee]/70">
                <th className="w-10 px-4 py-3">
                  <Checkbox checked={allChecked}
                    ref={el => { if (el) (el as unknown as HTMLInputElement).indeterminate = someChecked }}
                    onCheckedChange={toggleAll} aria-label="Chọn tất cả" />
                </th>
                {['Tên tour', 'Điểm đến', 'Thời gian', 'Giá người lớn', 'Số lịch', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : tours.length === 0
                ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin size={40} className="text-gray-200" />
                      <p className="text-sm text-gray-400 font-medium">Không có tour nào</p>
                    </div>
                  </td></tr>
                )
                : tours.map(t => {
                    const sc = STATUS_CFG[t.status]
                    const checked = selectedIds.has(t.id)
                    return (
                      <tr key={t.id}
                        className={`border-b border-gray-50 transition-colors ${checked ? 'bg-blue-50/40' : 'hover:bg-[#f8f5ee]/50'}`}>
                        <td className="px-4 py-3">
                          <Checkbox checked={checked} onCheckedChange={() => toggleRow(t.id)} />
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">#{t.id}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1 text-gray-600">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            {t.destination}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
                          {t.durationDays}N{t.durationNights}Đ
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-right text-accent">
                          {fmtVND(t.priceAdult)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 font-medium">{t.departureCount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-300 ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => { setEditTour(t); setSheetOpen(true) }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Sửa">
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(t)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Xóa">
                              <Trash2 size={14} />
                            </button>
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
            <p className="text-xs text-gray-400">Trang {page + 1}/{totalPages} — {totalElements.toLocaleString('vi-VN')} tour</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || isFetching}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40 transition-colors">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(0, Math.min(page - 2, totalPages - 5))
                const pn = start + i
                return (
                  <button key={pn} onClick={() => setPage(pn)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${pn === page ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-[#f8f5ee]'}`}
                    style={pn === page ? { backgroundColor: '#0a1628' } : {}}>
                    {pn + 1}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || isFetching}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TourSheet open={sheetOpen} onOpenChange={setSheetOpen}
        tour={editTour} destinations={destinations} onSuccess={inv} />

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        title="Xóa tour"
        description={`Bạn có chắc muốn xóa tour "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget.id)}
        loading={delMutation.isPending}
      />

      <ConfirmDialog
        open={bulkOpen} onOpenChange={setBulkOpen}
        title="Xóa nhiều tour"
        description={`Bạn có chắc muốn xóa ${selectedIds.size} tour đã chọn?`}
        variant="danger"
        onConfirm={() => bulkMutation.mutate(Array.from(selectedIds))}
        loading={bulkMutation.isPending}
      />
    </div>
  )
}
