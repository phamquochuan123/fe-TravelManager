import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, ImagePlus, X, Loader2 } from 'lucide-react'
import api from '../../api/axiosInstance'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import GooglePlacePicker from '../../components/admin/GooglePlacePicker'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomType {
  id?: number
  name: string
  area: number
  capacity: number
  pricePerNight: number
  imageUrl?: string
  imageFile?: File
  imagePreview?: string
}

interface Hotel {
  id: number
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  phone?: string
  email?: string
  stars: 1 | 2 | 3 | 4 | 5
  description?: string
  amenities: string[]
  roomTypes: RoomType[]
  imageUrls: string[]
  status: 'ACTIVE' | 'INACTIVE'
  roomTypeCount?: number
}

interface PagedHotels { content: Hotel[]; totalPages: number; totalElements: number }

interface HotelForm {
  name: string; address: string; phone: string; email: string
  stars: string; description: string; amenities: string[]
  roomTypes: RoomType[]
  latitude: number | null; longitude: number | null
}

const AMENITIES = ['Wifi', 'Bể bơi', 'Gym', 'Spa', 'Bãi đỗ xe', 'Nhà hàng', 'Bar', 'Phòng hội nghị', 'Giặt ủi', 'Lễ tân 24h']

const INIT_FORM: HotelForm = {
  name: '', address: '', phone: '', email: '',
  stars: '3', description: '', amenities: [], roomTypes: [],
  latitude: null, longitude: null,
}

const EMPTY_ROOM: RoomType = { name: '', area: 20, capacity: 2, pricePerNight: 0 }

// ─── Single Image Upload ──────────────────────────────────────────────────────

function SingleImageUpload({ preview, onChange }: {
  preview?: string; onChange: (file: File, preview: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="relative w-16 h-16 rounded overflow-hidden border-2 border-dashed border-gray-200 cursor-pointer hover:border-blue-400 transition-colors bg-[#f8f5ee]"
      onClick={() => ref.current?.click()}>
      {preview
        ? <img src={preview} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center"><ImagePlus size={18} className="text-gray-400" /></div>
      }
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]; if (!f) return
          onChange(f, URL.createObjectURL(f))
        }} />
    </div>
  )
}

// ─── Multi Image Upload ───────────────────────────────────────────────────────

function MultiImageUpload({ previews, onChange }: {
  previews: string[]
  onChange: (files: File[], previews: string[]) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const add = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    const newFiles = [...files, ...valid].slice(0, 20)
    const newPreviews = newFiles.map((f, i) => i < files.length ? previews[i] : URL.createObjectURL(f))
    setFiles(newFiles); onChange(newFiles, newPreviews)
  }

  const remove = (i: number) => {
    const nf = files.filter((_, j) => j !== i)
    const np = previews.filter((_, j) => j !== i)
    setFiles(nf); onChange(nf, np)
  }

  return (
    <div className="space-y-3">
      <div className={`border-2 border-dashed rounded py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors
        ${drag ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-[#f8f5ee]'}`}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
        onClick={() => ref.current?.click()}>
        <ImagePlus size={24} className="text-gray-400" />
        <p className="text-sm text-gray-500">Kéo thả hoặc click để chọn ảnh (tối đa 20)</p>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => add(e.target.files)} />
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded overflow-hidden border border-gray-100">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-accent">Chính</span>}
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

// ─── HotelSheet ───────────────────────────────────────────────────────────────

function HotelSheet({ open, onOpenChange, hotel, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void
  hotel: Hotel | null; onSuccess: () => void
}) {
  const isEdit = !!hotel
  const [form, setForm] = useState<HotelForm>(INIT_FORM)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [tab, setTab] = useState('info')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (hotel) {
      setForm({
        name: hotel.name, address: hotel.address,
        phone: hotel.phone ?? '', email: hotel.email ?? '',
        stars: String(hotel.stars), description: hotel.description ?? '',
        amenities: hotel.amenities ?? [],
        roomTypes: hotel.roomTypes ?? [],
        latitude: hotel.latitude ?? null, longitude: hotel.longitude ?? null,
      })
      setImages([]); setPreviews(hotel.imageUrls ?? [])
    } else {
      setForm(INIT_FORM); setImages([]); setPreviews([])
    }
    setTab('info')
  }, [open, hotel])

  const set = <K extends keyof HotelForm>(k: K, v: HotelForm[K]) => setForm(p => ({ ...p, [k]: v }))

  const toggleAmenity = (a: string) => set('amenities',
    form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]
  )

  const addRoom = () => set('roomTypes', [...form.roomTypes, { ...EMPTY_ROOM }])
  const removeRoom = (i: number) => set('roomTypes', form.roomTypes.filter((_, j) => j !== i))
  const updRoom = <K extends keyof RoomType>(i: number, k: K, v: RoomType[K]) =>
    set('roomTypes', form.roomTypes.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên khách sạn'); setTab('info'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name); fd.append('address', form.address)
      fd.append('phone', form.phone); fd.append('email', form.email)
      fd.append('stars', form.stars); fd.append('description', form.description)
      fd.append('amenities', JSON.stringify(form.amenities))
      if (form.latitude != null) fd.append('latitude', String(form.latitude))
      if (form.longitude != null) fd.append('longitude', String(form.longitude))
      const roomsData = form.roomTypes.map(r => ({ ...r, imageFile: undefined, imagePreview: undefined }))
      fd.append('roomTypes', JSON.stringify(roomsData))
      form.roomTypes.forEach((r, i) => { if (r.imageFile) fd.append(`roomImage_${i}`, r.imageFile) })
      images.forEach(f => fd.append('images', f))
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) await api.put(`/admin/hotels/${hotel!.id}`, fd, opts)
      else await api.post('/admin/hotels', fd, opts)
      toast.success(isEdit ? 'Cập nhật khách sạn thành công' : 'Thêm khách sạn thành công')
      onSuccess(); onOpenChange(false)
    } catch (e: unknown) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle >
            {isEdit ? 'Chỉnh sửa khách sạn' : 'Thêm khách sạn mới'}
          </SheetTitle>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="rooms">Loại phòng</TabsTrigger>
              <TabsTrigger value="images">Ảnh</TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="flex-1 px-6">
            <TabsContent value="info" className="mt-4 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tên khách sạn <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nhập tên..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Địa chỉ</Label>
                <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Địa chỉ..." />
              </div>
              <GooglePlacePicker
                defaultQuery={form.name}
                mode="full"
                onSelect={c => {
                  set('address', c.formattedAddress ?? form.address)
                  set('latitude', c.latitude ?? null)
                  set('longitude', c.longitude ?? null)
                }}
                onPhotoSelected={file => {
                  const url = URL.createObjectURL(file)
                  setImages(prev => [file, ...prev])
                  setPreviews(prev => [url, ...prev])
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Số điện thoại</Label>
                  <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0900..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="hotel@..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Hạng sao</Label>
                <Select value={form.stars} onValueChange={v => set('stars', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => (
                      <SelectItem key={n} value={String(n)}>{'★'.repeat(n)} ({n} sao)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Mô tả</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Mô tả khách sạn..." className="h-24 resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tiện ích</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <Checkbox checked={form.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-4 space-y-4">
              {form.roomTypes.map((r, i) => (
                <div key={i} className="border border-gray-200 rounded p-4 space-y-3 bg-[#f8f5ee]/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Loại phòng {i + 1}</span>
                    <button type="button" onClick={() => removeRoom(i)}
                      className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium">Tên loại phòng</Label>
                      <Input value={r.name} onChange={e => updRoom(i, 'name', e.target.value)}
                        placeholder="Deluxe / Suite..." className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Diện tích (m²)</Label>
                      <Input type="number" min={1} value={r.area}
                        onChange={e => updRoom(i, 'area', Number(e.target.value))} className="text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Sức chứa (người)</Label>
                      <Input type="number" min={1} value={r.capacity}
                        onChange={e => updRoom(i, 'capacity', Number(e.target.value))} className="text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium">Giá/đêm (₫)</Label>
                      <Input type="number" min={0} value={r.pricePerNight}
                        onChange={e => updRoom(i, 'pricePerNight', Number(e.target.value))} className="text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <SingleImageUpload preview={r.imagePreview ?? r.imageUrl}
                      onChange={(f, p) => { updRoom(i, 'imageFile', f); updRoom(i, 'imagePreview', p) }} />
                    <span className="text-xs text-gray-400">Ảnh đại diện phòng</span>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRoom}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={15} /> Thêm loại phòng
              </button>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <MultiImageUpload previews={previews}
                onChange={(f, p) => { setImages(f); setPreviews(p) }} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Hủy</Button>
          <Button onClick={submit} disabled={busy} className="text-white bg-primary">
            {busy && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {isEdit ? 'Cập nhật' : 'Thêm khách sạn'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminHotelsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editHotel, setEditHotel] = useState<Hotel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null)

  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput); setPage(0) }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const params = new URLSearchParams({
    page: String(page), size: '10',
    ...(search ? { search } : {}),
    ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
  }).toString()

  const { data: paged, isLoading } = useQuery<PagedHotels>({
    queryKey: ['admin', 'hotels', params],
    queryFn: async () => (await api.get(`/admin/hotels?${params}`)).data,
    placeholderData: prev => prev,
  })

  const hotels = paged?.content ?? []
  const totalPages = paged?.totalPages ?? 1

  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'hotels'] })

  const delMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/hotels/${id}`),
    onSuccess: () => { toast.success('Đã xóa khách sạn'); setDeleteTarget(null); inv() },
    onError: (e: Error) => toast.error(e.message),
  })

  const backfillMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/places/backfill/hotels')).data as {
      total: number; updated: number; skipped: number; notFound: number; failed: number
    },
    onSuccess: r => {
      toast.success(`Đã cập nhật ${r.updated}/${r.total} khách sạn từ Google Places` +
        (r.failed > 0 ? ` (${r.failed} lỗi)` : ''))
      inv()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-6 space-y-5" >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Khách sạn</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => backfillMutation.mutate()}
            disabled={backfillMutation.isPending}
            className="rounded font-semibold gap-2">
            <Loader2 size={16} className={backfillMutation.isPending ? 'animate-spin' : 'hidden'} />
            Làm giàu dữ liệu từ Google
          </Button>
          <Button onClick={() => { setEditHotel(null); setSheetOpen(true) }}
            className="text-white rounded font-semibold gap-2 bg-primary">
            <Plus size={16} /> Thêm khách sạn
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm..." className="pl-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f8f5ee]/70">
                {['Tên khách sạn', 'Địa chỉ', 'Hạng sao', 'Số loại phòng', 'Trạng thái', 'Thao tác'].map(h => (
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
                : hotels.length === 0
                ? <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">Không có khách sạn nào</td></tr>
                : hotels.map(h => (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-[#f8f5ee]/50 transition-colors">
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-semibold text-gray-900 truncate">{h.name}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px]">
                        <p className="truncate">{h.address}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-amber-400 font-medium">
                        {'★'.repeat(h.stars)}
                        <span className="text-gray-400 ml-1 text-xs">({h.stars})</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 font-medium">
                        {h.roomTypeCount ?? h.roomTypes?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                          ${h.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {h.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => { setEditHotel(h); setSheetOpen(true) }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(h)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Trang {page + 1}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40">← Trước</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      <HotelSheet open={sheetOpen} onOpenChange={setSheetOpen} hotel={editHotel} onSuccess={inv} />

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        title="Xóa khách sạn"
        description={`Xóa khách sạn "${deleteTarget?.name}"? Không thể hoàn tác.`}
        variant="danger"
        onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget.id)}
        loading={delMutation.isPending}
      />
    </div>
  )
}
