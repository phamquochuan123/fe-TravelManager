import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  Calendar, Users, MapPin, Star, X, ChevronRight,
  Building2, Map, UtensilsCrossed, Clock, BadgeCheck,
  AlertCircle, CheckCircle2, CircleDashed, XCircle, Loader2,
  FileText, RotateCcw, Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/axiosInstance'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatCurrency, resolveBase64Image } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderType  = 'TOUR' | 'HOTEL' | 'RESTAURANT'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAID'

interface NormalizedOrder {
  id:              number
  type:            OrderType
  serviceName:     string
  serviceImage?:   string
  serviceLocation?: string
  status:          OrderStatus
  dateStart?:      string
  dateEnd?:        string
  time?:           string
  guests?:         number
  totalPrice?:     number
  bookingCode?:    string
  serviceId?:      number
  canCancel:       boolean
  canReview:       boolean
  raw:             any
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<OrderStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700 border-amber-200',   icon: <CircleDashed size={13} /> },
  CONFIRMED:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700 border-blue-200',      icon: <BadgeCheck size={13} /> },
  IN_PROGRESS: { label: 'Đang diễn ra', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Loader2 size={13} className="animate-spin" /> },
  COMPLETED:   { label: 'Hoàn thành',   cls: 'bg-teal-100 text-teal-700 border-teal-200',      icon: <CheckCircle2 size={13} /> },
  CANCELLED:   { label: 'Đã hủy',       cls: 'bg-red-100 text-red-600 border-red-200',         icon: <XCircle size={13} /> },
  PAID:        { label: 'Đã thanh toán', cls: 'bg-teal-100 text-teal-700 border-teal-200',     icon: <CheckCircle2 size={13} /> },
}

const TYPE_CFG: Record<OrderType, { label: string; cls: string; icon: React.ReactNode }> = {
  TOUR:       { label: 'Tour',      cls: 'bg-violet-100 text-violet-700', icon: <Map size={12} /> },
  HOTEL:      { label: 'Khách sạn', cls: 'bg-sky-100 text-sky-700',      icon: <Building2 size={12} /> },
  RESTAURANT: { label: 'Nhà hàng',  cls: 'bg-orange-100 text-orange-700',icon: <UtensilsCrossed size={12} /> },
}

const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'PENDING',     label: 'Đặt đơn' },
  { status: 'CONFIRMED',   label: 'Xác nhận' },
  { status: 'IN_PROGRESS', label: 'Đang diễn ra' },
  { status: 'COMPLETED',   label: 'Hoàn thành' },
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0, CONFIRMED: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: -1, PAID: 2,
}

const FALLBACK_IMG = `https://picsum.photos/seed/order/120/120`

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeHotel(b: any): NormalizedOrder {
  const status = (b.status ?? 'PENDING') as OrderStatus
  return {
    id: b.id,
    type: 'HOTEL',
    serviceName:     b.hotelName ?? 'Khách sạn',
    serviceImage:    undefined,
    serviceLocation: undefined,
    status,
    dateStart: b.checkInDate,
    dateEnd:   b.checkOutDate,
    guests:    b.totalNumOfGuests,
    totalPrice: undefined,
    bookingCode: b.bookingConfirmationCode,
    serviceId:   b.hotelId,
    canCancel:   status === 'PENDING',
    canReview:   status === 'COMPLETED',
    raw: b,
  }
}

function normalizeTour(b: any): NormalizedOrder {
  const status = (b.status ?? 'PENDING') as OrderStatus
  return {
    id: b.id,
    type: 'TOUR',
    serviceName:     b.tourName ?? 'Tour',
    serviceImage:    undefined,
    serviceLocation: b.tourDestination,
    status,
    dateStart: b.departureDate ?? b.createdAt,
    dateEnd:   undefined,
    guests:    (b.numAdults ?? 0) + (b.numChildren ?? 0),
    totalPrice: b.finalPrice ?? (b.originalPrice ?? 0) + (b.packageHotelPrice ?? 0) - (b.discountAmount ?? 0),
    bookingCode: String(b.id),
    serviceId:   b.tourId,
    canCancel:   status === 'PENDING',
    canReview:   status === 'COMPLETED',
    raw: b,
  }
}

function normalizeRestaurant(b: any): NormalizedOrder {
  const status = (b.status ?? 'PENDING') as OrderStatus
  return {
    id: b.id,
    type: 'RESTAURANT',
    serviceName:     b.restaurantName ?? 'Nhà hàng',
    serviceImage:    undefined,
    serviceLocation: b.restaurantCity,
    status,
    dateStart: b.bookingDate,
    time:      b.bookingTime,
    guests:    b.guestCount,
    totalPrice: undefined,
    bookingCode: b.confirmationCode,
    serviceId:   b.restaurantId,
    canCancel:   status === 'PENDING',
    canReview:   status === 'COMPLETED',
    raw: b,
  }
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={s <= (hover || value)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/40'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── ReviewModal ──────────────────────────────────────────────────────────────

function ReviewModal({ order, open, onClose, onReviewed }: {
  order: NormalizedOrder; open: boolean; onClose: () => void
  onReviewed: (o: NormalizedOrder) => void
}) {
  const [rating,  setRating]  = useState(5)
  const [comment, setComment] = useState('')
  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = order.type === 'TOUR'
        ? `/tours/${order.serviceId}/reviews`
        : order.type === 'HOTEL'
          ? `/hotels/${order.serviceId}/reviews`
          : `/restaurants/${order.serviceId}/reviews`

      const body = order.type === 'HOTEL'
        ? { rating, comment, confirmationCode: order.raw.bookingConfirmationCode }
        : order.type === 'RESTAURANT'
          ? { rating, comment, confirmationCode: order.raw.confirmationCode }
          : { rating, comment, bookingId: order.id }

      return api.post(endpoint, body).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Gửi đánh giá thành công! Cảm ơn bạn đã chia sẻ.')
      onReviewed(order)
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Không thể gửi đánh giá')
    },
  })

  const STAR_LABELS = ['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời']

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đánh giá dịch vụ</DialogTitle>
        </DialogHeader>

        {/* Service info */}
        <div className="flex items-center gap-3 bg-muted/50 rounded p-3">
          <div className="size-14 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img
              src={resolveBase64Image(order.serviceImage ?? null, FALLBACK_IMG)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <Badge className={cn('text-xs mb-1', TYPE_CFG[order.type].cls)}>
              {TYPE_CFG[order.type].label}
            </Badge>
            <p className="font-semibold text-sm">{order.serviceName}</p>
          </div>
        </div>

        {/* Rating stars */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Bạn đánh giá thế nào?</p>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-sm font-semibold text-amber-500 mt-2">{STAR_LABELS[rating]}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium">Nhận xét của bạn</label>
            <span className="text-xs text-muted-foreground">{comment.length}/500</span>
          </div>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            className="resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground active:scale-[0.98]"
            disabled={mutation.isPending || rating === 0}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ order, open, onClose }: {
  order: NormalizedOrder; open: boolean; onClose: () => void
}) {
  const statusIdx = STATUS_ORDER[order.status] ?? 0
  const isCancelled = order.status === 'CANCELLED'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            Chi tiết đơn hàng
          </DialogTitle>
        </DialogHeader>

        {/* Timeline */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Trạng thái đơn hàng
          </p>
          {isCancelled ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded p-4">
              <XCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="font-semibold text-red-700 text-sm">Đơn hàng đã bị hủy</p>
                <p className="text-xs text-red-500">Nếu đã thanh toán, tiền hoàn trả trong 3–5 ngày làm việc</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {TIMELINE_STEPS.map((step, i) => {
                const done    = i <= statusIdx
                const current = i === statusIdx
                const isLast  = i === TIMELINE_STEPS.length - 1
                return (
                  <div key={step.status} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'size-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors',
                        current
                          ? 'bg-primary text-primary-foreground border-primary'
                          : done
                            ? 'bg-primary/20 text-primary border-primary/40'
                            : 'bg-muted text-muted-foreground border-border',
                      )}>
                        {done ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      <span className={cn(
                        'text-[10px] mt-1 text-center leading-tight',
                        done ? 'text-primary font-semibold' : 'text-muted-foreground',
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={cn(
                        'flex-1 h-0.5 mb-4 mx-1 transition-colors',
                        i < statusIdx ? 'bg-primary/40' : 'bg-muted',
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Service info */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Thông tin dịch vụ
          </p>
          <div className="flex gap-3">
            <div className="size-16 rounded-lg overflow-hidden shrink-0 bg-muted">
              <img
                src={resolveBase64Image(order.serviceImage ?? null, FALLBACK_IMG)}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1 text-sm">
              <Badge className={cn('text-xs', TYPE_CFG[order.type].cls)}>
                {TYPE_CFG[order.type].label}
              </Badge>
              <p className="font-semibold">{order.serviceName}</p>
              {order.serviceLocation && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} />{order.serviceLocation}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Booking details */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Chi tiết đặt chỗ
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {order.bookingCode && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Mã đặt chỗ</p>
                <p className="font-mono font-bold text-base tracking-widest text-primary">{order.bookingCode}</p>
              </div>
            )}
            {order.dateStart && (
              <div>
                <p className="text-xs text-muted-foreground">Ngày {order.type === 'HOTEL' ? 'nhận phòng' : order.type === 'RESTAURANT' ? 'đặt bàn' : 'khởi hành'}</p>
                <p className="font-medium">{dayjs(order.dateStart).format('DD/MM/YYYY')}</p>
              </div>
            )}
            {order.dateEnd && (
              <div>
                <p className="text-xs text-muted-foreground">Ngày {order.type === 'HOTEL' ? 'trả phòng' : 'kết thúc'}</p>
                <p className="font-medium">{dayjs(order.dateEnd).format('DD/MM/YYYY')}</p>
              </div>
            )}
            {order.time && (
              <div>
                <p className="text-xs text-muted-foreground">Giờ</p>
                <p className="font-medium">{order.time}</p>
              </div>
            )}
            {order.guests && (
              <div>
                <p className="text-xs text-muted-foreground">Số người</p>
                <p className="font-medium">{order.guests} người</p>
              </div>
            )}
          </div>
        </div>

        {/* Tour package — Hotel & Restaurant addon */}
        {order.type === 'TOUR' && (order.raw.hotelName || order.raw.restaurantName) && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dịch vụ đi kèm
              </p>
              {order.raw.hotelName && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">🏨 Khách sạn</p>
                  <p className="font-semibold text-gray-900">{order.raw.hotelName}</p>
                  {order.raw.roomType && <p className="text-gray-500">Loại phòng: {order.raw.roomType}</p>}
                  {order.raw.checkInDate && order.raw.checkOutDate && (
                    <p className="text-gray-500">
                      {dayjs(order.raw.checkInDate).format('DD/MM/YYYY')} → {dayjs(order.raw.checkOutDate).format('DD/MM/YYYY')}
                    </p>
                  )}
                  {order.raw.packageHotelPrice > 0 && (
                    <p className="text-blue-700 font-semibold">{formatCurrency(order.raw.packageHotelPrice)}</p>
                  )}
                </div>
              )}
              {order.raw.restaurantName && (
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">🍽️ Nhà hàng</p>
                  <p className="font-semibold text-gray-900">{order.raw.restaurantName}</p>
                  {order.raw.restaurantBookingDate && (
                    <p className="text-gray-500">Ngày đặt bàn: {dayjs(order.raw.restaurantBookingDate).format('DD/MM/YYYY')}</p>
                  )}
                  {order.raw.packageRestaurantPrice > 0 && (
                    <p className="text-orange-700 font-semibold">{formatCurrency(order.raw.packageRestaurantPrice)}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Cost */}
        {order.totalPrice != null && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Chi phí
              </p>
              <div className="bg-muted/50 rounded p-4 space-y-2 text-sm">
                {order.type === 'TOUR' && order.raw.originalPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá tour</span>
                    <span>{formatCurrency(order.raw.originalPrice)}</span>
                  </div>
                )}
                {order.type === 'TOUR' && order.raw.packageHotelPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khách sạn</span>
                    <span>{formatCurrency(order.raw.packageHotelPrice)}</span>
                  </div>
                )}
                {order.type === 'TOUR' && order.raw.packageRestaurantPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nhà hàng</span>
                    <span className="text-xs text-amber-600">Thanh toán tại chỗ</span>
                  </div>
                )}
                {order.type === 'TOUR' && order.raw.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(order.raw.discountAmount)}</span>
                  </div>
                )}
                {order.type !== 'TOUR' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giá dịch vụ</span>
                    <span>{formatCurrency(order.totalPrice)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-accent">{formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* QR placeholder */}
        {order.bookingCode && (
          <>
            <Separator />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">Mã QR đặt chỗ</p>
              <div className="inline-block border-2 border-dashed border-border rounded p-4">
                <div className="size-24 bg-muted flex items-center justify-center rounded-lg mx-auto mb-2">
                  <span className="font-mono text-xs font-bold text-center break-all leading-tight text-primary p-1">
                    {order.bookingCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Xuất trình khi check-in</p>
              </div>
            </div>
          </>
        )}

        <Button variant="outline" onClick={onClose} className="w-full">Đóng</Button>
      </DialogContent>
    </Dialog>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({
  order, onCancel, cancelling, isReviewed, onReviewed,
}: {
  order: NormalizedOrder
  onCancel: (o: NormalizedOrder) => void
  cancelling: boolean
  isReviewed: boolean
  onReviewed: (o: NormalizedOrder) => void
}) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const typeCfg   = TYPE_CFG[order.type]
  const statusCfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING
  const imgSrc    = resolveBase64Image(order.serviceImage ?? null, FALLBACK_IMG)

  return (
    <>
      <div className={cn(
        'bg-white rounded border border-border shadow-sm p-4 flex gap-4 transition-shadow hover:shadow-md',
        order.status === 'CANCELLED' && 'opacity-70',
      )}>
        {/* Image */}
        <div className="shrink-0 size-28 rounded-lg overflow-hidden bg-muted">
          <img
            src={imgSrc}
            alt={order.serviceName}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1 flex-wrap">
            <Badge className={cn('text-xs gap-1', typeCfg.cls)}>
              {typeCfg.icon} {typeCfg.label}
            </Badge>
          </div>
          <h3 className={cn('font-semibold text-base leading-snug line-clamp-1', order.status === 'CANCELLED' && 'line-through text-muted-foreground')}>
            {order.serviceName}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            {order.dateStart && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {dayjs(order.dateStart).format('DD/MM/YYYY')}
                {order.time && ` lúc ${order.time}`}
                {order.dateEnd && ` → ${dayjs(order.dateEnd).format('DD/MM/YYYY')}`}
              </span>
            )}
            {order.guests && (
              <span className="flex items-center gap-1"><Users size={11} />{order.guests} người</span>
            )}
            {order.serviceLocation && (
              <span className="flex items-center gap-1 truncate max-w-48">
                <MapPin size={11} className="shrink-0" />
                {order.serviceLocation}
              </span>
            )}
          </div>
        </div>

        {/* Right: status + price + buttons */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <Badge className={cn('text-xs gap-1 border', statusCfg.cls)}>
            {statusCfg.icon} {statusCfg.label}
          </Badge>

          {order.totalPrice != null && (
            <p className={cn('font-bold text-xl text-accent', order.status === 'CANCELLED' && 'line-through text-muted-foreground text-base')}>
              {formatCurrency(order.totalPrice)}
            </p>
          )}

          <div className="flex flex-col gap-1.5 items-end">
            <Button
              size="sm" variant="outline"
              className="text-xs h-7 gap-1"
              onClick={() => setDetailOpen(true)}
            >
              <FileText size={12} /> Xem chi tiết
            </Button>

            {order.canCancel && (
              <Button
                size="sm" variant="ghost"
                className="text-xs h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={cancelling}
                onClick={() => onCancel(order)}
              >
                <X size={12} className="mr-1" />
                {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
              </Button>
            )}

            {order.status === 'CONFIRMED' && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Phone size={11} />
                Liên hệ <strong className="text-gray-600">1900 1234</strong> để hủy
              </span>
            )}

            {order.canReview && (
              isReviewed ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                  <BadgeCheck size={12} /> Đã đánh giá
                </span>
              ) : (
                <Button
                  size="sm"
                  className="text-xs h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setReviewOpen(true)}
                >
                  <Star size={12} className="mr-1" /> Đánh giá
                </Button>
              )
            )}

            {order.status === 'PENDING' && order.type === 'TOUR' && (
              <Button
                size="sm"
                className="text-xs h-7 bg-accent hover:bg-accent/90 text-white"
                onClick={() => toast.info('Chức năng đang phát triển')}
              >
                <RotateCcw size={12} className="mr-1" /> Thanh toán lại
              </Button>
            )}
          </div>
        </div>
      </div>

      <DetailModal order={order} open={detailOpen} onClose={() => setDetailOpen(false)} />
      <ReviewModal order={order} open={reviewOpen} onClose={() => setReviewOpen(false)} onReviewed={onReviewed} />
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const REVIEWED_KEY = 'reviewed_orders'
function loadReviewed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]')) }
  catch { return new Set() }
}

export default function MyOrdersPage() {
  const user       = useAuthStore(s => s.user)
  const qc         = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [reviewedIds,  setReviewedIds]  = useState<Set<string>>(loadReviewed)

  const markReviewed = (order: NormalizedOrder) => {
    const key = `${order.type}-${order.id}`
    setReviewedIds(prev => {
      const next = new Set(prev)
      next.add(key)
      localStorage.setItem(REVIEWED_KEY, JSON.stringify([...next]))
      return next
    })
  }

  // ── Fetch ──
  const { data: hotelBookings = [], isLoading: lh } = useQuery<any[]>({
    queryKey:  ['hotel-bookings-my', user?.email],
    queryFn:   () => api.get(`/bookings/guest/${user!.email}`).then(r => r.data),
    enabled:   !!user?.email,
    staleTime: 30_000,
  })

  const { data: tourBookings = [], isLoading: lt } = useQuery<any[]>({
    queryKey:  ['tour-bookings-my'],
    queryFn:   () => api.get('/tour-bookings/my').then(r => r.data),
    enabled:   !!user,
    staleTime: 30_000,
  })

  const { data: restBookings = [], isLoading: lr } = useQuery<any[]>({
    queryKey:  ['rest-bookings-my'],
    queryFn:   () => api.get('/restaurants/bookings/my').then(r => r.data),
    enabled:   !!user,
    staleTime: 30_000,
  })

  const isLoading = lh || lt || lr

  // ── Normalize ──
  const all: NormalizedOrder[] = useMemo(() => [
    ...hotelBookings.map(normalizeHotel),
    ...tourBookings.map(normalizeTour),
    ...restBookings.map(normalizeRestaurant),
  ].sort((a, b) => b.id - a.id), [hotelBookings, tourBookings, restBookings])

  // ── Cancel mutations ──
  const cancelMutation = useMutation({
    mutationFn: (order: NormalizedOrder) => {
      if (order.type === 'HOTEL')      return api.delete(`/bookings/${order.id}`)
      if (order.type === 'TOUR')       return api.patch(`/tour-bookings/${order.id}/cancel`)
      if (order.type === 'RESTAURANT') return api.patch(`/restaurants/bookings/${order.id}/cancel`)
      return Promise.reject(new Error('Unknown type'))
    },
    onSuccess: (_, order) => {
      toast.success(`Đã hủy đơn hàng #${order.bookingCode ?? order.id}`)
      qc.invalidateQueries({ queryKey: ['hotel-bookings-my'] })
      qc.invalidateQueries({ queryKey: ['tour-bookings-my'] })
      qc.invalidateQueries({ queryKey: ['rest-bookings-my'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Không thể hủy đơn hàng')
    },
    onSettled: () => setCancellingId(null),
  })

  const handleCancel = (order: NormalizedOrder) => {
    if (!confirm(`Xác nhận hủy đơn "${order.serviceName}"?`)) return
    setCancellingId(order.id)
    cancelMutation.mutate(order)
  }

  // ── Filter helpers ──
  const hotels = all.filter(o => o.type === 'HOTEL')
  const tours  = all.filter(o => o.type === 'TOUR')
  const rests  = all.filter(o => o.type === 'RESTAURANT')

  const countByStatus = (list: NormalizedOrder[], s: OrderStatus | 'ALL') =>
    s === 'ALL' ? list.length : list.filter(o => o.status === s).length

  const filterByStatus = (list: NormalizedOrder[]) =>
    statusFilter === 'ALL' ? list : list.filter(o => o.status === statusFilter)

  // ── Status chips ──
  const STATUS_CHIPS: Array<{ key: OrderStatus | 'ALL'; label: string }> = [
    { key: 'ALL',         label: 'Tất cả' },
    { key: 'PENDING',     label: 'Chờ xác nhận' },
    { key: 'CONFIRMED',   label: 'Đã xác nhận' },
    { key: 'IN_PROGRESS', label: 'Đang diễn ra' },
    { key: 'COMPLETED',   label: 'Hoàn thành' },
    { key: 'CANCELLED',   label: 'Đã hủy' },
  ]

  const renderList = (list: NormalizedOrder[]) => {
    const visible = filterByStatus(list)
    if (isLoading) return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded border border-border p-4 flex gap-4">
            <Skeleton className="size-28 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="w-28 h-20 rounded-lg" />
          </div>
        ))}
      </div>
    )
    if (visible.length === 0) return (
      <div className="text-center py-16 text-muted-foreground">
        <AlertCircle size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Không có đơn hàng nào</p>
      </div>
    )
    return (
      <div className="space-y-3">
        {visible.map(o => (
          <OrderCard
            key={`${o.type}-${o.id}`}
            order={o}
            onCancel={handleCancel}
            cancelling={cancellingId === o.id}
            isReviewed={reviewedIds.has(`${o.type}-${o.id}`)}
            onReviewed={markReviewed}
          />
        ))}
      </div>
    )
  }

  const TYPE_TABS = [
    { key: 'all',         label: 'Tất Cả',    count: all.length    },
    { key: 'tours',       label: 'Tour',       count: tours.length  },
    { key: 'hotels',      label: 'Khách Sạn',  count: hotels.length },
    { key: 'restaurants', label: 'Nhà Hàng',   count: rests.length  },
  ]

  const listMap: Record<string, NormalizedOrder[]> = {
    all, tours, hotels, restaurants: rests,
  }

  return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">

        {/* ── Page header ── */}
        <div className="mb-8">
          <p className="uppercase tracking-widest text-[10px] font-bold mb-2" style={{ color: '#c9a84c', letterSpacing: '0.28em' }}>
            Tài Khoản
          </p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, fontSize: '2rem', color: '#0a1628', letterSpacing: '0.02em' }}>
            Đơn Hàng Của Tôi
          </h1>
          <div className="h-px mt-3 mb-1 w-12" style={{ background: '#c9a84c' }} />
          <p className="text-sm text-gray-400 mt-2">
            Tổng cộng <span className="font-semibold" style={{ color: '#0a1628' }}>{all.length}</span> đơn hàng
          </p>
        </div>

        {/* ── Unified filter bar: type tabs left + status dropdown right ── */}
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.25)', paddingBottom: 0 }}>

            {/* Type tabs */}
            <TabsList className="h-auto bg-transparent border-0 p-0 gap-0 flex-wrap">
              {TYPE_TABS.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className={cn(
                    'text-[11px] font-semibold tracking-widest uppercase px-5 py-3.5 border-0 rounded-none bg-transparent transition-all gap-1.5',
                    'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                    'data-[state=active]:text-[#0a1628] data-[state=active]:border-b-[#c9a84c]',
                    'data-[state=inactive]:text-gray-400 hover:data-[state=inactive]:text-gray-700',
                  )}
                  style={{ borderBottom: '2px solid transparent' }}
                >
                  {tab.label}
                  <span className="text-[10px] font-normal" style={{ color: '#bbb' }}>
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Status dropdown */}
            <div className="flex items-center gap-2 pb-1">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#bbb' }}>Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                className="text-[11px] font-semibold tracking-wide focus:outline-none appearance-none cursor-pointer bg-transparent pr-1"
                style={{ color: '#0a1628', border: 'none' }}
              >
                {STATUS_CHIPS.map(c => (
                  <option key={c.key} value={c.key}>
                    {c.label} ({countByStatus(all, c.key)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {TYPE_TABS.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              {renderList(listMap[tab.key])}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
