import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import 'react-datepicker/dist/react-datepicker.css'
import {
  ArrowLeft, MapPin, Clock, Users, Star, Heart,
  ChevronLeft, ChevronRight, X, ImageIcon, Phone,
  CalendarDays, MessageSquare, UtensilsCrossed, Flame, Sparkles,
  Loader2, CheckCircle2, CalendarX,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/axiosInstance'
import { toggleRestaurantFavorite, isRestaurantFavorited } from '@/api/restaurantApi'
import LocationMap from '@/components/common/LocationMap'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn, resolveBase64Image } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: number
  name: string
  description?: string
  price?: number
  category?: 'APPETIZER' | 'MAIN' | 'DESSERT' | 'DRINK'
  photo?: string
  isBestSeller?: boolean
  isNew?: boolean
}

interface Review {
  id: number
  userName: string
  rating: number
  comment?: string
  adminReply?: string
  createdAt?: string
}

interface Restaurant {
  id: number
  name: string
  address?: string
  city?: string
  cuisineType?: string
  priceRange?: string
  openingHours?: string
  capacity?: number
  description?: string
  amenities?: string
  photo?: string
  images?: Array<{ id: number; photo: string }>
  menuItems?: MenuItem[]
  active?: boolean
  phone?: string
  latitude?: number | null
  longitude?: number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CUISINE_LABEL: Record<string, string> = {
  VIETNAMESE: 'Việt Nam', ASIAN: 'Châu Á', WESTERN: 'Âu Mỹ',
  SEAFOOD: 'Hải sản', BBQ: 'BBQ', VEGETARIAN: 'Chay', FUSION: 'Fusion', OTHER: 'Khác',
}

const PRICE_LABEL: Record<string, string> = {
  BUDGET: 'Bình dân ($)', STANDARD: 'Vừa phải ($$)', PREMIUM: 'Cao cấp ($$$)', LUXURY: 'Sang trọng ($$$$)',
}

const PRICE_COLOR: Record<string, string> = {
  BUDGET: 'bg-green-100 text-green-700', STANDARD: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-purple-100 text-purple-700', LUXURY: 'bg-amber-100 text-amber-700',
}

const MENU_TABS = [
  { key: 'APPETIZER', label: 'Khai vị' },
  { key: 'MAIN',      label: 'Món chính' },
  { key: 'DESSERT',   label: 'Tráng miệng' },
  { key: 'DRINK',     label: 'Đồ uống' },
]

const ALL_TIME_SLOTS = ['11:00','12:00','13:00','18:00','19:00','20:00','21:00']

const FALLBACK_REST = (id: number) => `https://picsum.photos/seed/restaurant${id}/800/500`
const FALLBACK_MENU = (id: number) => `https://picsum.photos/seed/menu${id}/120/120`

const toDateStr = (d: Date) => d.toISOString().split('T')[0]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvailableSlots(dateStr: string) {
  const today = toDateStr(new Date())
  if (dateStr !== today) return ALL_TIME_SLOTS
  const now = new Date()
  return ALL_TIME_SLOTS.filter(t => {
    const [h, m] = t.split(':').map(Number)
    const slot = new Date(); slot.setHours(h, m, 0, 0)
    return slot.getTime() > now.getTime() + 60 * 60 * 1000
  })
}

function buildGallery(restaurant: Restaurant): string[] {
  if (restaurant.images?.length)
    return restaurant.images.map(img => resolveBase64Image(img.photo, FALLBACK_REST(restaurant.id)))
  if (restaurant.photo)
    return [resolveBase64Image(restaurant.photo, FALLBACK_REST(restaurant.id))]
  return [FALLBACK_REST(restaurant.id)]
}

// ─── Image Gallery ────────────────────────────────────────────────────────────

function RestaurantGallery({ images, name }: { images: string[]; name: string }) {
  const [main,     setMain]    = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lbIdx,    setLbIdx]   = useState(0)

  const thumbs = images.slice(1, 5)

  return (
    <>
      <div className="grid grid-cols-3 gap-2 h-64 sm:h-80 rounded overflow-hidden mb-6">
        <div className="col-span-2 relative overflow-hidden group">
          <img
            src={images[main]}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_REST(0) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setMain(i => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setMain(i => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          <button
            onClick={() => { setLbIdx(main); setLightbox(true) }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            <ImageIcon size={12} />
            Xem tất cả {images.length} ảnh
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => {
            const src = thumbs[i]
            return src ? (
              <button
                key={i}
                className={cn(
                  'flex-1 overflow-hidden rounded-sm transition-all',
                  main === i + 1 ? 'ring-2 ring-accent ring-offset-1' : 'hover:brightness-90',
                )}
                onClick={() => setMain(i + 1)}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <div key={i} className="flex-1 rounded-sm bg-muted" />
            )
          })}
        </div>
      </div>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none">
          <div className="relative h-[80vh] flex items-center justify-center">
            <img src={images[lbIdx]} alt={name} className="max-h-full max-w-full object-contain" />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 size-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center"
            >
              <X size={18} />
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setLbIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setLbIdx(i => (i + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lbIdx + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── MenuItem card ────────────────────────────────────────────────────────────

function MenuItemCard({ item }: { item: MenuItem }) {
  const imgSrc = resolveBase64Image(item.photo ?? null, FALLBACK_MENU(item.id))

  return (
    <div className="flex items-start gap-3 p-3 rounded hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-default">
      {item.photo && (
        <div className="shrink-0 size-24 rounded-lg overflow-hidden bg-muted">
          <img
            src={imgSrc}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_MENU(item.id) }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm">{item.name}</p>
            {item.isBestSeller && (
              <Badge className="text-[10px] bg-red-100 text-red-600 gap-0.5 py-0">
                <Flame size={10} /> Bán chạy
              </Badge>
            )}
            {item.isNew && (
              <Badge className="text-[10px] bg-emerald-100 text-emerald-700 gap-0.5 py-0">
                <Sparkles size={10} /> Mới
              </Badge>
            )}
          </div>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        {item.price != null && (
          <p className="mt-1.5 text-accent font-bold text-sm">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(item.price)}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Review section ───────────────────────────────────────────────────────────

function ReviewSection({ reviews }: { reviews: Review[] }) {
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct:   reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  return (
    <div className="space-y-6">
      {reviews.length > 0 && (
        <div className="bg-muted/40 rounded p-5">
          <div className="flex items-start gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-5xl font-bold">{avg.toFixed(1)}</p>
              <div className="flex gap-0.5 justify-center my-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} className={i < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{reviews.length} đánh giá</p>
            </div>
            <div className="flex-1 min-w-48 space-y-1.5">
              {dist.map(d => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-8 text-right">{d.star}★</span>
                  <Progress value={d.pct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-6">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Chưa có đánh giá nào</div>
      ) : (
        <div className="space-y-4">
          {reviews.map(rv => (
            <div key={rv.id} className="rounded border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-full bg-gradient-to-tr from-accent to-orange-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {rv.userName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{rv.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {rv.createdAt ? dayjs(rv.createdAt).format('DD/MM/YYYY') : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} className={s <= rv.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'} />
                  ))}
                </div>
              </div>
              {rv.comment && <p className="text-sm text-foreground/80">{rv.comment}</p>}
              {rv.adminReply && (
                <div className="mt-3 bg-accent/5 border border-accent/10 rounded-lg px-4 py-3">
                  <p className="text-xs font-bold text-accent mb-1">Phản hồi từ nhà hàng</p>
                  <p className="text-sm text-foreground/80">{rv.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Booking schema ───────────────────────────────────────────────────────────

const bookingSchema = z.object({
  bookingDate:     z.string().min(1),
  bookingTime:     z.string().min(1, 'Vui lòng chọn khung giờ'),
  guestCount:      z.number().int().min(1).max(100),
  specialRequests: z.string().optional(),
  contactName:     z.string().min(1, 'Vui lòng nhập họ tên'),
  contactPhone:    z.string().min(9, 'Số điện thoại không hợp lệ'),
  contactEmail:    z.string().email('Email không hợp lệ'),
})

type BookingForm = z.infer<typeof bookingSchema>

// ─── Booking Sidebar ──────────────────────────────────────────────────────────

function BookingSidebar({ restaurant }: { restaurant: Restaurant }) {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [liked,   setLiked]   = useState(false)
  const favLoadingRef         = useRef(false)

  useEffect(() => {
    if (!user || !restaurant?.id) return
    isRestaurantFavorited(restaurant.id).then((res: { favorited: boolean }) => setLiked(res.favorited)).catch(() => {})
  }, [user, restaurant?.id])

  const toggleLiked = useCallback(async () => {
    if (!user) { toast.error('Vui lòng đăng nhập để lưu yêu thích'); return }
    if (favLoadingRef.current) return
    favLoadingRef.current = true
    try {
      const res: { favorited: boolean } = await toggleRestaurantFavorite(restaurant.id)
      setLiked(res.favorited)
      toast.success(res.favorited ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích')
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      favLoadingRef.current = false
    }
  }, [user, restaurant.id])

  const [pickedDate, setPickedDate] = useState<Date | null>(new Date())
  const today = toDateStr(new Date())

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      bookingDate:     today,
      bookingTime:     '',
      guestCount:      2,
      specialRequests: '',
      contactName:     user?.name ?? '',
      contactPhone:    user?.phone ?? '',
      contactEmail:    user?.email ?? '',
    },
  })

  const watchDate = form.watch('bookingDate')
  const watchTime = form.watch('bookingTime')
  const watchGuests = form.watch('guestCount')
  const availableSlots = getAvailableSlots(watchDate)

  const [submitError, setSubmitError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: BookingForm) =>
      api.post(`/restaurants/${restaurant.id}/bookings`, data).then(r => r.data),
    onSuccess: () => {
      setSubmitError('')
      setShowSuccess(true)
      toast.success('Đặt bàn thành công! Kiểm tra email xác nhận.', {
        description: `${restaurant.name} — ${dayjs(watchDate).format('DD/MM/YYYY')} lúc ${watchTime}`,
      })
      setTimeout(() => {
        setShowSuccess(false)
        form.reset({
          bookingDate: today, bookingTime: '', guestCount: 2, specialRequests: '',
          contactName: user?.name ?? '', contactPhone: user?.phone ?? '', contactEmail: user?.email ?? '',
        })
        setPickedDate(new Date())
      }, 2500)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Không thể đặt bàn. Vui lòng thử lại.'
      setSubmitError(msg)
      toast.error(msg)
    },
  })

  if (!user) {
    return (
      <div className="bg-white rounded shadow-md border border-border p-6 sticky top-24 space-y-4">
        <h3 className="font-bold text-xl">Đặt bàn</h3>
        <Separator />
        <p className="text-sm text-muted-foreground text-center py-4">
          Đăng nhập để đặt bàn tại {restaurant.name}
        </p>
        <Button className="w-full bg-accent hover:bg-accent/90 text-white" onClick={() => navigate('/login')}>
          Đăng nhập
        </Button>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="bg-white rounded shadow-md border border-border p-6 sticky top-24">
        <div className="flex flex-col items-center py-8 gap-3 animate-in fade-in zoom-in-90 duration-300">
          <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <p className="font-bold text-lg text-foreground">Đặt bàn thành công!</p>
          <p className="text-sm text-muted-foreground text-center">Kiểm tra email để nhận xác nhận đặt bàn.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded shadow-md border border-border p-6 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-xl">Đặt bàn</h3>
        <button
          onClick={toggleLiked}
          disabled={false}
          title={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
          className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
            liked ? 'border-red-400 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
          }`}>
          <Heart size={16} className={liked ? 'fill-red-500' : ''} />
        </button>
      </div>
      <Separator className="mb-4" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(d => { setSubmitError(''); mutation.mutate(d) })} className="space-y-4">

          {/* Date */}
          <FormField control={form.control} name="bookingDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ngày đặt bàn
              </FormLabel>
              <FormControl>
                <DatePicker
                  selected={pickedDate}
                  onChange={(d: Date | null) => {
                    setPickedDate(d)
                    field.onChange(d ? toDateStr(d) : '')
                    form.setValue('bookingTime', '')
                  }}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                  placeholderText="Chọn ngày"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Time slot */}
          <FormField control={form.control} name="bookingTime" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Khung giờ
              </FormLabel>
              {availableSlots.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                  <CalendarX size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">Không còn khung giờ hôm nay</p>
                    <p className="text-xs text-amber-600 mt-0.5">Vui lòng chọn ngày khác để đặt bàn.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_TIME_SLOTS.map(slot => {
                    const disabled = !availableSlots.includes(slot)
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && field.onChange(slot)}
                        className={cn(
                          'py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150',
                          disabled
                            ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed bg-muted/30'
                            : field.value === slot
                              ? 'bg-accent text-white border-accent font-semibold'
                              : 'border-border hover:border-accent hover:text-accent',
                        )}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )} />

          {/* Guests */}
          <FormField control={form.control} name="guestCount" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Số người
              </FormLabel>
              <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                <FormControl>
                  <SelectTrigger className="text-sm">
                    <Users size={14} className="mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>{n} người</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* Contact info */}
          <FormField control={form.control} name="contactName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Họ tên</FormLabel>
              <FormControl><Input {...field} className="text-sm" placeholder="Nguyễn Văn A" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField control={form.control} name="contactPhone" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SĐT</FormLabel>
                <FormControl><Input {...field} className="text-sm transition-colors duration-150" placeholder="0912..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contactEmail" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</FormLabel>
                <FormControl><Input {...field} type="email" className="text-sm transition-colors duration-150" placeholder="you@..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Notes */}
          <FormField control={form.control} name="specialRequests" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={2}
                  className="text-sm resize-none"
                  placeholder="Yêu cầu đặc biệt, dị ứng thức ăn, dịp kỷ niệm..."
                />
              </FormControl>
            </FormItem>
          )} />

          {/* Summary */}
          {watchTime && (
            <div className="bg-muted/50 rounded p-3 text-sm space-y-1.5">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2">Tóm tắt đặt bàn</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays size={13} />
                <span>{dayjs(watchDate).format('dddd, DD/MM/YYYY')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={13} />
                <span>{watchTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users size={13} />
                <span>{watchGuests} người</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={mutation.isPending || restaurant.active === false}
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold active:scale-[0.98] transition-all"
          >
            {mutation.isPending
              ? <><Loader2 size={15} className="animate-spin mr-1.5" />Đang gửi...</>
              : 'Xác nhận đặt bàn'
            }
          </Button>

          {submitError && (
            <p className="text-xs text-destructive text-center -mt-1 animate-in fade-in duration-200">
              {submitError}
            </p>
          )}

          {restaurant.active === false && (
            <p className="text-xs text-destructive text-center">Nhà hàng tạm đóng cửa</p>
          )}
        </form>
      </Form>

      {restaurant.phone && (
        <a href={`tel:${restaurant.phone}`} className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mt-3">
          <Phone size={14} /> {restaurant.phone}
        </a>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantDetailPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>()
  const navigate = useNavigate()

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ['restaurant', restaurantId],
    queryFn:  () => api.get(`/restaurants/${restaurantId}`).then(r => r.data),
    enabled:  !!restaurantId,
  })

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['restaurant-reviews', restaurantId],
    queryFn:  () => api.get(`/restaurants/${restaurantId}/reviews`).then(r => r.data),
    enabled:  !!restaurantId,
  })

  if (isLoading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <Skeleton className="h-80 w-full rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-40 w-full rounded" />
          </div>
          <Skeleton className="h-96 w-full rounded" />
        </div>
      </div>
      <Footer />
    </div>
  )

  if (!restaurant) return null

  const gallery   = buildGallery(restaurant)
  const amenities = restaurant.amenities?.split(',').map(a => a.trim()).filter(Boolean) ?? []
  const menuItems: MenuItem[] = restaurant.menuItems ?? []
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const itemsByTab = MENU_TABS.reduce<Record<string, MenuItem[]>>((acc, tab) => {
    acc[tab.key] = menuItems.filter(m => m.category === tab.key)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#f8f5ee]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-400">

        {/* Back */}
        <button
          onClick={() => navigate('/restaurants')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft size={15} /> Danh sách nhà hàng
        </button>

        {/* Gallery */}
        <RestaurantGallery images={gallery} name={restaurant.name} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {restaurant.cuisineType && (
              <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">
                {CUISINE_LABEL[restaurant.cuisineType] ?? restaurant.cuisineType}
              </Badge>
            )}
            {restaurant.priceRange && (
              <Badge className={cn('text-xs', PRICE_COLOR[restaurant.priceRange] ?? 'bg-muted text-muted-foreground')}>
                {PRICE_LABEL[restaurant.priceRange] ?? restaurant.priceRange}
              </Badge>
            )}
            {restaurant.active === false && <Badge variant="destructive">Tạm đóng</Badge>}
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">{restaurant.name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {(restaurant.address || restaurant.city) && (
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-accent" />
                {[restaurant.address, restaurant.city].filter(Boolean).join(', ')}
              </span>
            )}
            {restaurant.openingHours && (
              <span className="flex items-center gap-1"><Clock size={14} />{restaurant.openingHours}</span>
            )}
            {restaurant.capacity && (
              <span className="flex items-center gap-1"><Users size={14} />{restaurant.capacity} chỗ ngồi</span>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-primary">
                <Phone size={14} />{restaurant.phone}
              </a>
            )}
            {avg > 0 && (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold text-amber-600">{avg.toFixed(1)}</span>
                <span>({reviews.length} đánh giá)</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Content ── */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="menu">
              <TabsList className="mb-6 w-full sm:w-auto">
                <TabsTrigger value="menu" className="flex items-center gap-1.5">
                  <UtensilsCrossed size={14} /> Thực đơn
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-1.5">
                  <MessageSquare size={14} /> Đánh giá
                  <span className="ml-0.5 text-xs opacity-60">({reviews.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Thực đơn */}
              <TabsContent value="menu" className="space-y-4">

                {/* Description + Amenities */}
                {restaurant.description && (
                  <section className="bg-white rounded border border-border p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{restaurant.description}</p>
                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                        {amenities.map((a, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">{a}</Badge>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                <LocationMap
                  name={restaurant.name}
                  address={restaurant.address}
                  city={restaurant.city}
                  latitude={restaurant.latitude}
                  longitude={restaurant.longitude}
                />

                {/* Menu sub-tabs */}
                <div className="bg-white rounded border border-border overflow-hidden">
                  <Tabs defaultValue={MENU_TABS[0].key}>
                    <div className="border-b border-border px-4 pt-4">
                      <TabsList className="h-auto gap-1 bg-transparent p-0">
                        {MENU_TABS.map(tab => (
                          <TabsTrigger
                            key={tab.key}
                            value={tab.key}
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent text-sm px-4 py-2 font-medium"
                          >
                            {tab.label}
                            {itemsByTab[tab.key].length > 0 && (
                              <span className="ml-1.5 text-xs opacity-50">({itemsByTab[tab.key].length})</span>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {MENU_TABS.map(tab => (
                      <TabsContent key={tab.key} value={tab.key} className="p-4">
                        {itemsByTab[tab.key].length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            Chưa có món trong danh mục này
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {itemsByTab[tab.key].map(item => (
                              <MenuItemCard key={item.id} item={item} />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </TabsContent>

              {/* Tab: Đánh giá */}
              <TabsContent value="reviews">
                <div className="bg-white rounded border border-border p-6">
                  <ReviewSection reviews={reviews} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Sidebar ── */}
          <div>
            <BookingSidebar restaurant={restaurant} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
