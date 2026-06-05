import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, ImagePlus, X, Loader2 } from 'lucide-react'
import api from '../../api/axiosInstance'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Switch } from '../../components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id?: number
  name: string
  description?: string
  price: number
  imageUrl?: string
  imageFile?: File
  imagePreview?: string
  isBestSeller: boolean
  isNew: boolean
}

interface MenuCategory {
  name: string
  items: MenuItem[]
}

interface Restaurant {
  id: number
  name: string
  address: string
  phone?: string
  cuisineType: string
  openTime: string
  closeTime: string
  maxTables: number
  description?: string
  imageUrls: string[]
  status: 'ACTIVE' | 'INACTIVE'
  menuCategories?: MenuCategory[]
  rating?: number
}

interface PagedRestaurants { content: Restaurant[]; totalPages: number; totalElements: number }

interface RestaurantForm {
  name: string; address: string; phone: string; cuisineType: string
  openTime: string; closeTime: string; maxTables: string; description: string
  menuCategories: MenuCategory[]
}

const CUISINE_TYPES: Array<{ value: string; label: string }> = [
  { value: 'VIETNAMESE', label: 'Việt Nam' },
  { value: 'ASIAN',      label: 'Châu Á' },
  { value: 'WESTERN',    label: 'Châu Âu / Âu Mỹ' },
  { value: 'SEAFOOD',    label: 'Hải sản' },
  { value: 'BBQ',        label: 'BBQ' },
  { value: 'VEGETARIAN', label: 'Chay' },
  { value: 'FUSION',     label: 'Fusion' },
  { value: 'OTHER',      label: 'Khác' },
]
const MENU_CATS = ['Khai vị', 'Món chính', 'Tráng miệng', 'Đồ uống']
const PLACEHOLDER = 'https://placehold.co/56x56/e2e8f0/94a3b8?text=Res'

const EMPTY_ITEM: MenuItem = { name: '', description: '', price: 0, isBestSeller: false, isNew: false }

const INIT_FORM: RestaurantForm = {
  name: '', address: '', phone: '', cuisineType: '',
  openTime: '08:00', closeTime: '22:00', maxTables: '20', description: '',
  menuCategories: MENU_CATS.map(name => ({ name, items: [] })),
}

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + '₫'

// ─── Multi Image Upload ───────────────────────────────────────────────────────

function MultiImageUpload({ previews, onChange }: {
  previews: string[]; onChange: (f: File[], p: string[]) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const add = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    const nf = [...files, ...valid].slice(0, 15)
    const np = nf.map((f, i) => i < files.length ? previews[i] : URL.createObjectURL(f))
    setFiles(nf); onChange(nf, np)
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
        <p className="text-sm text-gray-500">Kéo thả hoặc click (tối đa 15 ảnh)</p>
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

// ─── RestaurantSheet ──────────────────────────────────────────────────────────

function RestaurantSheet({ open, onOpenChange, restaurant, onSuccess }: {
  open: boolean; onOpenChange: (v: boolean) => void
  restaurant: Restaurant | null; onSuccess: () => void
}) {
  const isEdit = !!restaurant
  const [form, setForm] = useState<RestaurantForm>(INIT_FORM)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [tab, setTab] = useState('info')
  const [menuTab, setMenuTab] = useState(MENU_CATS[0])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (restaurant) {
      setForm({
        name: restaurant.name, address: restaurant.address,
        phone: restaurant.phone ?? '', cuisineType: restaurant.cuisineType,
        openTime: restaurant.openTime, closeTime: restaurant.closeTime,
        maxTables: String(restaurant.maxTables), description: restaurant.description ?? '',
        menuCategories: restaurant.menuCategories?.length
          ? restaurant.menuCategories
          : MENU_CATS.map(name => ({ name, items: [] })),
      })
      setImages([]); setPreviews(restaurant.imageUrls ?? [])
    } else {
      setForm(INIT_FORM); setImages([]); setPreviews([])
    }
    setTab('info'); setMenuTab(MENU_CATS[0])
  }, [open, restaurant])

  const set = <K extends keyof RestaurantForm>(k: K, v: RestaurantForm[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const addItem = (catName: string) =>
    set('menuCategories', form.menuCategories.map(c =>
      c.name === catName ? { ...c, items: [...c.items, { ...EMPTY_ITEM }] } : c
    ))

  const removeItem = (catName: string, idx: number) =>
    set('menuCategories', form.menuCategories.map(c =>
      c.name === catName ? { ...c, items: c.items.filter((_, i) => i !== idx) } : c
    ))

  const updItem = <K extends keyof MenuItem>(catName: string, idx: number, k: K, v: MenuItem[K]) =>
    set('menuCategories', form.menuCategories.map(c =>
      c.name === catName
        ? { ...c, items: c.items.map((it, i) => i === idx ? { ...it, [k]: v } : it) }
        : c
    ))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên nhà hàng'); setTab('info'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name); fd.append('address', form.address)
      fd.append('phone', form.phone); fd.append('cuisineType', form.cuisineType)
      fd.append('openTime', form.openTime); fd.append('closeTime', form.closeTime)
      fd.append('maxTables', form.maxTables); fd.append('description', form.description)
      const cats = form.menuCategories.map(c => ({
        ...c, items: c.items.map(it => ({ ...it, imageFile: undefined, imagePreview: undefined }))
      }))
      fd.append('menuCategories', JSON.stringify(cats))
      form.menuCategories.forEach(cat =>
        cat.items.forEach((it, i) => {
          if (it.imageFile) fd.append(`menuImage_${cat.name}_${i}`, it.imageFile)
        })
      )
      images.forEach(f => fd.append('images', f))
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) await api.put(`/admin/restaurants/${restaurant!.id}`, fd, opts)
      else await api.post('/admin/restaurants', fd, opts)
      toast.success(isEdit ? 'Cập nhật nhà hàng thành công' : 'Thêm nhà hàng thành công')
      onSuccess(); onOpenChange(false)
    } catch (e: unknown) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle >
            {isEdit ? 'Chỉnh sửa nhà hàng' : 'Thêm nhà hàng mới'}
          </SheetTitle>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="menu">Thực đơn</TabsTrigger>
              <TabsTrigger value="images">Ảnh</TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="flex-1 px-6">
            <TabsContent value="info" className="mt-4 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tên nhà hàng <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Tên nhà hàng..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Địa chỉ</Label>
                <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Địa chỉ..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Số điện thoại</Label>
                  <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0900..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Loại ẩm thực</Label>
                  <Select value={form.cuisineType} onValueChange={v => set('cuisineType', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                    <SelectContent>
                      {CUISINE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Giờ mở cửa</Label>
                  <Input type="time" value={form.openTime} onChange={e => set('openTime', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Giờ đóng cửa</Label>
                  <Input type="time" value={form.closeTime} onChange={e => set('closeTime', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Số bàn tối đa</Label>
                <Input type="number" min={1} value={form.maxTables}
                  onChange={e => set('maxTables', e.target.value)} className="w-32" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Mô tả</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Mô tả nhà hàng..." className="h-24 resize-none" />
              </div>
            </TabsContent>

            <TabsContent value="menu" className="mt-4">
              <Tabs value={menuTab} onValueChange={setMenuTab}>
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  {MENU_CATS.map(c => <TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>)}
                </TabsList>
                {MENU_CATS.map(catName => {
                  const cat = form.menuCategories.find(c => c.name === catName)
                  const items = cat?.items ?? []
                  return (
                    <TabsContent key={catName} value={catName} className="space-y-3">
                      {items.map((it, i) => (
                        <div key={i} className="border border-gray-200 rounded p-4 space-y-3 bg-[#f8f5ee]/40">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-600">Món {i + 1}</span>
                            <button type="button" onClick={() => removeItem(catName, i)}
                              className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Tên món</Label>
                              <Input value={it.name} onChange={e => updItem(catName, i, 'name', e.target.value)}
                                placeholder="Tên món ăn..." className="text-sm" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Giá (₫)</Label>
                              <Input type="number" min={0} value={it.price}
                                onChange={e => updItem(catName, i, 'price', Number(e.target.value))} className="text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Mô tả ngắn</Label>
                            <Textarea value={it.description} onChange={e => updItem(catName, i, 'description', e.target.value)}
                              placeholder="Mô tả..." className="h-14 text-sm resize-none" />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch checked={it.isBestSeller}
                                onCheckedChange={v => updItem(catName, i, 'isBestSeller', v)} />
                              <Label className="text-xs text-gray-600">Bán chạy</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={it.isNew}
                                onCheckedChange={v => updItem(catName, i, 'isNew', v)} />
                              <Label className="text-xs text-gray-600">Mới</Label>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addItem(catName)}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                        <Plus size={14} /> Thêm món
                      </button>
                    </TabsContent>
                  )
                })}
              </Tabs>
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
            {isEdit ? 'Cập nhật' : 'Thêm nhà hàng'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRestaurantsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterCuisine, setFilterCuisine] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editRest, setEditRest] = useState<Restaurant | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null)

  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput); setPage(0) }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const params = new URLSearchParams({
    page: String(page), size: '10',
    ...(search ? { search } : {}),
    ...(filterCuisine !== 'all' ? { cuisineType: filterCuisine } : {}),
    ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
  }).toString()

  const { data: paged, isLoading } = useQuery<PagedRestaurants>({
    queryKey: ['admin', 'restaurants', params],
    queryFn: async () => (await api.get(`/admin/restaurants?${params}`)).data,
    placeholderData: prev => prev,
  })

  const restaurants = paged?.content ?? []
  const totalPages = paged?.totalPages ?? 1

  const inv = () => qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] })

  const delMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/restaurants/${id}`),
    onSuccess: () => { toast.success('Đã xóa nhà hàng'); setDeleteTarget(null); inv() },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-6 space-y-5" >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Nhà hàng</h1>
        </div>
        <Button onClick={() => { setEditRest(null); setSheetOpen(true) }}
          className="text-white rounded font-semibold gap-2 bg-primary">
          <Plus size={16} /> Thêm nhà hàng
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm..." className="pl-9 text-sm" />
        </div>
        <Select value={filterCuisine} onValueChange={setFilterCuisine}>
          <SelectTrigger className="w-40 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ẩm thực</SelectItem>
            {CUISINE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
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
                {['Tên nhà hàng', 'Địa chỉ', 'Loại ẩm thực', 'Rating', 'Trạng thái', 'Thao tác'].map(h => (
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
                : restaurants.length === 0
                ? <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">Không có nhà hàng nào</td></tr>
                : restaurants.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-[#f8f5ee]/50 transition-colors">
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                        <p className="text-[11px] text-gray-400">{r.openTime}–{r.closeTime}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px]">
                        <p className="truncate">{r.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          {r.cuisineType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-medium whitespace-nowrap">
                        ★ {r.rating?.toFixed(1) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                          ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => { setEditRest(r); setSheetOpen(true) }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(r)}
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
          <div className="flex justify-between px-5 py-3 border-t border-gray-100">
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

      <RestaurantSheet open={sheetOpen} onOpenChange={setSheetOpen} restaurant={editRest} onSuccess={inv} />

      <ConfirmDialog
        open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        title="Xóa nhà hàng"
        description={`Xóa nhà hàng "${deleteTarget?.name}"? Không thể hoàn tác.`}
        variant="danger"
        onConfirm={() => deleteTarget && delMutation.mutate(deleteTarget.id)}
        loading={delMutation.isPending}
      />
    </div>
  )
}
