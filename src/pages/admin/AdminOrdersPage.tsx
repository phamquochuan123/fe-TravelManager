import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { toast } from 'sonner'
import { Eye, RefreshCw, ChevronDown, ChevronUp, Loader2, ShoppingCart } from 'lucide-react'
import api from '../../api/axiosInstance'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Separator } from '../../components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'

dayjs.extend(relativeTime)
dayjs.locale('vi')

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusHistory { status: string; note?: string; changedAt: string }
interface BreakdownItem { label: string; amount: number }

interface Order {
  id: string | number
  customerName: string
  customerEmail: string
  customerAvatar?: string
  customerPhone?: string
  serviceType: 'TOUR' | 'HOTEL' | 'RESTAURANT'
  serviceName: string
  serviceImage?: string
  useDate: string
  totalAmount: number
  status: string
  createdAt: string
  statusHistory?: StatusHistory[]
  breakdown?: BreakdownItem[]
  // Tour package
  hotelName?: string
  roomType?: string
  checkInDate?: string
  checkOutDate?: string
  packageHotelPrice?: number
  // Danh sách vì một đơn tour kèm được nhiều bữa (mỗi ngày tối đa sáng/trưa/tối)
  restaurants?: {
    restaurantName?: string
    bookingDate?: string
    bookingTime?: string
    mealSlotLabel?: string
    guestCount?: number
  }[]
  packageRestaurantPrice?: number
  packageDiscountPercent?: number
}

interface OrderCounts { PENDING: number; CONFIRMED: number; COMPLETED: number; CANCELLED: number; total: number }
interface PagedOrders { content: Order[]; totalPages: number; totalElements: number }

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:     { label: 'Chờ xác nhận',  cls: 'bg-amber-100 text-amber-700',   dot: '#f59e0b' },
  CONFIRMED:   { label: 'Đã xác nhận',   cls: 'bg-blue-100 text-blue-700',     dot: '#3b82f6' },
  IN_PROGRESS: { label: 'Đang diễn ra',  cls: 'bg-purple-100 text-purple-700', dot: '#8b5cf6' },
  COMPLETED:   { label: 'Hoàn thành',    cls: 'bg-green-100 text-green-700',   dot: '#10b981' },
  CANCELLED:   { label: 'Đã hủy',        cls: 'bg-red-100 text-red-600',       dot: '#ef4444' },
}

const STATUS_BY_TYPE: Record<string, string[]> = {
  HOTEL:      ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
  TOUR:       ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  RESTAURANT: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
}

const SERVICE_CFG: Record<string, { label: string; cls: string }> = {
  TOUR:       { label: 'Tour',      cls: 'bg-blue-100 text-blue-700' },
  HOTEL:      { label: 'Khách sạn', cls: 'bg-purple-100 text-purple-700' },
  RESTAURANT: { label: 'Nhà hàng',  cls: 'bg-orange-100 text-orange-700' },
}

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + '₫'

const TABS = [
  { value: 'all',       label: 'Tất cả' },
  { value: 'PENDING',   label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

// ─── OrderSheet ───────────────────────────────────────────────────────────────

function OrderSheet({ order, open, onOpenChange, onSuccess }: {
  order: Order | null; open: boolean
  onOpenChange: (v: boolean) => void; onSuccess: () => void
}) {
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (order) { setNewStatus(order.status); setNote('') }
  }, [order])

  const submit = async () => {
    if (!order) return
    if (newStatus === 'CANCELLED' && !note.trim()) { toast.error('Vui lòng nhập lý do hủy'); return }
    setBusy(true)
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus, note })
      toast.success('Cập nhật trạng thái thành công')
      onSuccess(); onOpenChange(false)
    } catch (e: unknown) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  if (!order) return null

  const initials = order.customerName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
  const total = order.breakdown?.reduce((s, b) => s + b.amount, 0) ?? order.totalAmount

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle >
            Chi tiết đơn #{String(order.id).slice(-6).toUpperCase()}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">

            {/* Status timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Lịch sử trạng thái</h4>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-100" />
                  {order.statusHistory.map((h, i) => {
                    const cfg = STATUS_CFG[h.status] ?? STATUS_CFG.PENDING
                    return (
                      <div key={i} className="relative mb-4 last:mb-0">
                        <span className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white"
                          style={{ backgroundColor: cfg.dot }} />
                        <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${cfg.cls}`}>{cfg.label}</p>
                        {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                        <p className="text-[10px] text-gray-400 mt-0.5">{dayjs(h.changedAt).fromNow()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Customer info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Thông tin khách hàng</h4>
              <div className="flex items-center gap-3 p-3 bg-[#f8f5ee] rounded">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={order.customerAvatar} />
                  <AvatarFallback className="bg-primary text-sm font-bold text-white">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.customerEmail}</p>
                  {order.customerPhone && <p className="text-xs text-gray-500">{order.customerPhone}</p>}
                </div>
              </div>
            </div>

            {/* Service info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Thông tin dịch vụ</h4>
              <div className="flex items-start gap-3 p-3 bg-[#f8f5ee] rounded">
                {order.serviceImage && (
                  <img src={order.serviceImage} alt={order.serviceName}
                    className="w-16 h-16 rounded object-cover shrink-0" />
                )}
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SERVICE_CFG[order.serviceType]?.cls}`}>
                    {SERVICE_CFG[order.serviceType]?.label}
                  </span>
                  <p className="font-semibold text-gray-900 text-sm mt-1">{order.serviceName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ngày sử dụng: {dayjs(order.useDate).format('DD/MM/YYYY')}
                  </p>
                </div>
              </div>
            </div>

            {/* Cost breakdown */}
            {order.breakdown && order.breakdown.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Chi phí</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {order.breakdown.map((b, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-2.5 text-gray-600">{b.label}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">{fmtVND(b.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#f8f5ee]">
                        <td className="px-4 py-2.5 font-bold text-gray-900">Tổng cộng</td>
                        <td className="px-4 py-2.5 text-right font-black text-base text-accent">
                          {fmtVND(total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Tour package — hotel & restaurant info */}
            {order.serviceType === 'TOUR' && (order.hotelName || (order.restaurants?.length ?? 0) > 0) && (
              <div className="space-y-3">
                {order.hotelName && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">🏨 Khách sạn đi kèm</h4>
                    <div className="bg-blue-50 border border-blue-100 rounded p-3 text-sm space-y-1">
                      <p className="font-semibold text-gray-900">{order.hotelName}</p>
                      {order.roomType && <p className="text-gray-500">Loại phòng: {order.roomType}</p>}
                      {order.checkInDate && order.checkOutDate && (
                        <p className="text-gray-500">Check-in: {order.checkInDate} → {order.checkOutDate}</p>
                      )}
                      {order.packageHotelPrice != null && order.packageHotelPrice > 0 && (
                        <p className="text-blue-700 font-medium">{fmtVND(order.packageHotelPrice)}</p>
                      )}
                    </div>
                  </div>
                )}
                {(order.restaurants?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                      🍽️ Nhà hàng đi kèm ({order.restaurants!.length} bữa)
                    </h4>
                    <div className="bg-orange-50 border border-orange-100 rounded p-3 text-sm space-y-2">
                      {order.restaurants!.map((r, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="font-semibold text-gray-900">
                            {r.restaurantName}
                            {r.mealSlotLabel && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-medium">
                                {r.mealSlotLabel}
                              </span>
                            )}
                          </p>
                          {r.bookingDate && (
                            <p className="text-gray-500">
                              Đặt bàn: {r.bookingDate}{r.bookingTime ? ` lúc ${r.bookingTime}` : ''}
                              {r.guestCount ? ` · ${r.guestCount} khách` : ''}
                            </p>
                          )}
                        </div>
                      ))}
                      {order.packageRestaurantPrice != null && order.packageRestaurantPrice > 0 && (
                        <p className="text-orange-700 font-medium pt-1">{fmtVND(order.packageRestaurantPrice)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Change status */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Cập nhật trạng thái</h4>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CFG)
                    .filter(([k]) => (STATUS_BY_TYPE[order?.serviceType ?? ''] ?? Object.keys(STATUS_CFG)).includes(k))
                    .map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Ghi chú / Lý do {newStatus === 'CANCELLED' && <span className="text-red-500">*</span>}
                </Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do..." className="h-24 text-sm resize-none" />
              </div>
              <Button onClick={submit} disabled={busy || newStatus === order.status} className="w-full bg-primary text-white">
                {busy && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage({ defaultServiceType }: { defaultServiceType?: string }) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [serviceType, setServiceType] = useState(defaultServiceType ?? 'all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput); setPage(0) }, 400)
    return () => clearTimeout(id)
  }, [searchInput])

  useEffect(() => { setPage(0) }, [activeTab, serviceType, fromDate, toDate])

  const { data: counts } = useQuery<OrderCounts>({
    queryKey: ['admin', 'orders-counts', defaultServiceType],
    queryFn: async () => {
      try {
        const qs = defaultServiceType ? `?serviceType=${defaultServiceType}` : ''
        return (await api.get(`/admin/orders/counts${qs}`)).data
      } catch { return { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, total: 0 } }
    },
    refetchInterval: 30_000,
  })

  const params = new URLSearchParams({
    page: String(page), size: '10',
    ...(activeTab !== 'all' ? { status: activeTab } : {}),
    ...(search ? { search } : {}),
    ...(serviceType !== 'all' ? { serviceType } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  }).toString()

  const { data: paged, isLoading, isError, refetch } = useQuery<PagedOrders>({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => (await api.get(`/admin/orders?${params}`)).data,
    placeholderData: prev => prev,
    retry: false,
  })

  const orders = paged?.content ?? []
  const totalPages = paged?.totalPages ?? 1
  const totalElements = paged?.totalElements ?? 0

  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
    qc.invalidateQueries({ queryKey: ['admin', 'orders-counts'] })
  }

  const countFor = (tab: string): number => {
    if (!counts) return 0
    if (tab === 'all') return counts.total
    return counts[tab as keyof OrderCounts] as number ?? 0
  }

  return (
    <div className="p-6 space-y-5" >
      <div>
        <h1 className="text-2xl font-black text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-sm text-gray-400 mt-0.5">Theo dõi và xử lý tất cả đơn hàng</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v)}>
        <TabsList className="h-auto p-1 flex-wrap gap-1">
          {TABS.map(t => {
            const cnt = countFor(t.value)
            return (
              <TabsTrigger key={t.value} value={t.value} className="flex items-center gap-1.5 text-sm">
                {t.label}
                {cnt > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${activeTab === t.value ? 'bg-white/30 text-inherit' : 'bg-gray-200 text-gray-600'}`}>
                    {cnt}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="bg-white rounded border border-gray-100 shadow-sm">
        <button
          type="button"
          onClick={() => setFilterOpen(p => !p)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-[#f8f5ee] transition-colors rounded"
        >
          <span>Bộ lọc nâng cao</span>
          {filterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {filterOpen && (
          <div className="px-5 pb-4 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Tìm kiếm</Label>
              <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Tên KH hoặc mã đơn..." className="text-sm" />
            </div>
            {!defaultServiceType && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Loại dịch vụ</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="TOUR">Tour</SelectItem>
                    <SelectItem value="HOTEL">Khách sạn</SelectItem>
                    <SelectItem value="RESTAURANT">Nhà hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Từ ngày</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Đến ngày</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center justify-between px-4 py-3 rounded border border-red-200 bg-red-50">
          <span className="text-sm text-red-700">Không tải được dữ liệu đơn hàng</span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
          >
            <RefreshCw size={13} /> Tải lại
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f8f5ee]/70">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap sticky left-0 z-10 bg-[#f8f5ee]">Mã đơn</th>
                {['Khách hàng', 'Dịch vụ', 'Ngày sử dụng', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart size={40} className="text-gray-200" />
                      <p className="text-sm text-gray-400 font-medium">Chưa có đơn hàng nào</p>
                    </div>
                  </td></tr>
                )
                : orders.map(o => {
                    const sc = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING
                    const svc = SERVICE_CFG[o.serviceType]
                    const initials = o.customerName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
                    return (
                      <tr key={o.id} className="group border-b border-gray-50 hover:bg-[#f8f5ee]/50 transition-colors">
                        <td className="px-4 py-3 sticky left-0 z-10 bg-white group-hover:bg-[#f8f5ee]/50 transition-colors">
                          <span className="font-mono text-xs text-gray-400">
                            #{String(o.id).slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarImage src={o.customerAvatar} />
                              <AvatarFallback className="text-xs font-bold text-white bg-primary">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[120px]">{o.customerName}</p>
                              <p className="text-[11px] text-gray-400 truncate max-w-[120px]">{o.customerEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${svc?.cls}`}>{svc?.label}</span>
                          <p className="text-xs text-gray-700 mt-0.5 truncate max-w-[140px]">{o.serviceName}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                          {dayjs(o.useDate).format('DD/MM/YYYY')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-accent">
                          {fmtVND(o.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors duration-300 ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => { setDetailOrder(o); setSheetOpen(true) }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Chi tiết">
                              <Eye size={14} />
                            </button>
                            <button type="button" onClick={() => { setDetailOrder(o); setSheetOpen(true) }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Đổi trạng thái">
                              <RefreshCw size={14} />
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
            <p className="text-xs text-gray-400">Trang {page + 1}/{totalPages} — {totalElements.toLocaleString('vi-VN')} đơn</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40">← Trước</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      <OrderSheet order={detailOrder} open={sheetOpen} onOpenChange={setSheetOpen} onSuccess={inv} />
    </div>
  )
}
