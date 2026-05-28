import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import 'react-datepicker/dist/react-datepicker.css'
import {
  ArrowLeft, Star, MapPin, Wifi, Waves, Car, Utensils, Dumbbell,
  Bath, Tv, Wind, Coffee, Users, Bed, Square, Heart,
  ChevronLeft, ChevronRight, X, ImageIcon, Phone, Clock,
} from 'lucide-react'
import api from '@/api/axiosInstance'
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
import { cn, formatCurrency, resolveBase64Image } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotelDetail {
  id: number
  name: string
  address?: string
  city?: string
  hotelType?: string
  starRating?: number
  description?: string
  amenities?: string
  photo?: string
  images?: Array<{ id: number; photo: string }>
  rating?: number
  reviewCount?: number
  active?: boolean
  phone?: string
}

interface Room {
  id: number
  roomType: string
  roomPrice: number
  maxGuests?: number
  numBeds?: number
  area?: number
  description?: string
  photo?: string
  status?: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE'
}

interface Review {
  id: number
  userName: string
  rating: number
  comment?: string
  adminReply?: string
  createdAt?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOTEL_TYPE: Record<string, string> = {
  HOTEL: 'Khách sạn', RESORT: 'Resort', HOMESTAY: 'Homestay',
}

const ROOM_STATUS: Record<string, { label: string; cls: string }> = {
  AVAILABLE:   { label: 'Còn trống',   cls: 'bg-emerald-100 text-emerald-700' },
  BOOKED:      { label: 'Đã đặt',      cls: 'bg-red-100 text-red-600' },
  MAINTENANCE: { label: 'Đang bảo trì',cls: 'bg-amber-100 text-amber-700' },
}

const AMENITY_MAP: Array<{ keys: string[]; icon: React.ReactNode; label: string }> = [
  { keys: ['wifi'],        icon: <Wifi size={18} />,      label: 'Wifi miễn phí' },
  { keys: ['hồ bơi', 'bể bơi', 'pool'], icon: <Waves size={18} />,    label: 'Hồ bơi' },
  { keys: ['gym', 'fitness'],            icon: <Dumbbell size={18} />, label: 'Phòng gym' },
  { keys: ['spa'],                       icon: <Bath size={18} />,     label: 'Spa & Wellness' },
  { keys: ['nhà hàng', 'restaurant'],   icon: <Utensils size={18} />, label: 'Nhà hàng' },
  { keys: ['bar'],                       icon: <Coffee size={18} />,   label: 'Bar & Cafe' },
  { keys: ['đỗ xe', 'parking'],          icon: <Car size={18} />,      label: 'Bãi đỗ xe' },
  { keys: ['điều hòa', 'ac'],            icon: <Wind size={18} />,     label: 'Điều hòa' },
  { keys: ['tv'],                        icon: <Tv size={18} />,       label: 'Smart TV' },
  { keys: ['lễ tân 24', 'reception'],   icon: <Clock size={18} />,    label: 'Lễ tân 24h' },
]

const FALLBACK_HOTEL = (id: number) => `https://picsum.photos/seed/hotel${id}/800/500`
const FALLBACK_ROOM  = (id: number) => `https://picsum.photos/seed/room${id}/400/250`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGallery(hotel: HotelDetail): string[] {
  if (hotel.images?.length) {
    return hotel.images.map(img => resolveBase64Image(img.photo, FALLBACK_HOTEL(hotel.id)))
  }
  if (hotel.photo) return [resolveBase64Image(hotel.photo, FALLBACK_HOTEL(hotel.id))]
  return [FALLBACK_HOTEL(hotel.id)]
}

function parseAmenities(raw: string | undefined): Array<{ icon: React.ReactNode; label: string }> {
  if (!raw) return []
  const items = raw.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)
  const result: Array<{ icon: React.ReactNode; label: string }> = []
  for (const item of items) {
    const match = AMENITY_MAP.find(m => m.keys.some(k => item.includes(k)))
    if (match && !result.find(r => r.label === match.label)) {
      result.push({ icon: match.icon, label: match.label })
    } else if (!match) {
      result.push({ icon: null, label: item.charAt(0).toUpperCase() + item.slice(1) })
    }
  }
  return result
}

// ─── Image Gallery ────────────────────────────────────────────────────────────

function HotelGallery({ images, name }: { images: string[]; name: string }) {
  const [main,      setMain]      = useState(0)
  const [lightbox,  setLightbox]  = useState(false)
  const [lbIndex,   setLbIndex]   = useState(0)

  const shown = images.length > 0 ? images : [FALLBACK_HOTEL(0)]
  const thumbs = shown.slice(1, 5)

  const lbPrev = () => setLbIndex(i => (i - 1 + shown.length) % shown.length)
  const lbNext = () => setLbIndex(i => (i + 1) % shown.length)

  return (
    <>
      <div className="grid grid-cols-3 gap-2 h-72 sm:h-96 rounded-xl overflow-hidden mb-6">
        {/* Main image — 2/3 width */}
        <div className="col-span-2 relative overflow-hidden group">
          <img
            src={shown[main]}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HOTEL(0) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

          {/* Prev / Next on main */}
          {shown.length > 1 && (
            <>
              <button
                onClick={() => setMain(i => (i - 1 + shown.length) % shown.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setMain(i => (i + 1) % shown.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* "Xem tất cả" */}
          <button
            onClick={() => { setLbIndex(main); setLightbox(true) }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
          >
            <ImageIcon size={13} />
            Xem tất cả {shown.length} ảnh
          </button>

          {/* Counter */}
          <span className="absolute bottom-3 left-3 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
            {main + 1} / {shown.length}
          </span>
        </div>

        {/* Thumbnails — 1/3 width, up to 4 */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => {
            const src = thumbs[i]
            const idx = i + 1
            return src ? (
              <button
                key={i}
                className={cn(
                  'relative flex-1 overflow-hidden rounded-sm transition-all',
                  main === idx ? 'ring-2 ring-primary ring-offset-1' : 'hover:brightness-90',
                )}
                onClick={() => setMain(idx)}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HOTEL(i) }}
                />
                {i === 3 && shown.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-bold">
                    +{shown.length - 5}
                  </div>
                )}
              </button>
            ) : (
              <div key={i} className="flex-1 rounded-sm bg-muted" />
            )
          })}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-5xl p-0 bg-black border-none">
          <div className="relative h-[80vh] flex items-center justify-center">
            <img
              src={shown[lbIndex]}
              alt={name}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 size-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            {shown.length > 1 && (
              <>
                <button
                  onClick={lbPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={lbNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lbIndex + 1} / {shown.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── RoomCard ─────────────────────────────────────────────────────────────────

function RoomCard({ room, hotelId, checkIn, checkOut }: {
  room: Room; hotelId: string; checkIn?: Date | null; checkOut?: Date | null
}) {
  const navigate = useNavigate()
  const status = ROOM_STATUS[room.status ?? 'AVAILABLE'] ?? ROOM_STATUS.AVAILABLE
  const available = !room.status || room.status === 'AVAILABLE'
  const nights = checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), 'day') : 1

  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all duration-200',
      available
        ? 'border-border hover:border-primary hover:shadow-sm cursor-default'
        : 'border-border opacity-70',
    )}>
      <div className="sm:w-44 shrink-0 rounded-lg overflow-hidden aspect-[4/3] sm:aspect-auto sm:h-32 bg-muted">
        <img
          src={resolveBase64Image(room.photo ?? null, FALLBACK_ROOM(room.id))}
          alt={room.roomType}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ROOM(room.id) }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-base">{room.roomType}</h3>
          <Badge className={cn('text-xs shrink-0', status.cls)}>{status.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
          {room.maxGuests && <span className="flex items-center gap-1"><Users size={13} />{room.maxGuests} khách</span>}
          {room.numBeds   && <span className="flex items-center gap-1"><Bed size={13} />{room.numBeds} giường</span>}
          {room.area      && <span className="flex items-center gap-1"><Square size={13} />{room.area} m²</span>}
        </div>
        {room.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{room.description}</p>}
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xl font-bold text-accent">{formatCurrency(room.roomPrice)}<span className="text-xs font-normal text-muted-foreground">/đêm</span></p>
            {nights > 1 && (
              <p className="text-xs text-muted-foreground">{nights} đêm = {formatCurrency(room.roomPrice * nights)}</p>
            )}
          </div>
          <Button
            disabled={!available}
            className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
            onClick={() => navigate(`/hotels/${hotelId}/book/${room.id}`, { state: { checkIn, checkOut, room } })}
          >
            {available ? 'Đặt phòng' : 'Không khả dụng'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── ReviewSection ────────────────────────────────────────────────────────────

function ReviewSection({ reviews }: { reviews: Review[] }) {
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count:   reviews.filter(r => r.rating === star).length,
    percent: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  return (
    <div className="space-y-6">
      {reviews.length > 0 && (
        <div className="bg-muted/40 rounded-xl p-5">
          <div className="flex items-start gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-5xl font-bold text-foreground">{avg.toFixed(1)}</p>
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
                  <Progress value={d.percent} className="h-1.5 flex-1" />
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
            <div key={rv.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
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
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={12} className={i < rv.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'} />
                  ))}
                </div>
              </div>
              {rv.comment && <p className="text-sm text-foreground/80">{rv.comment}</p>}
              {rv.adminReply && (
                <div className="mt-3 bg-primary/5 border border-primary/10 rounded-lg px-4 py-3">
                  <p className="text-xs font-bold text-primary mb-1">Phản hồi từ khách sạn</p>
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

// ─── Booking Sidebar ──────────────────────────────────────────────────────────

function BookingSidebar({ hotel, rooms, hotelId }: {
  hotel: HotelDetail; rooms: Room[]; hotelId: string
}) {
  const navigate  = useNavigate()
  const [checkIn,  setCheckIn]  = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [roomId,   setRoomId]   = useState<string>('')
  const [adults,   setAdults]   = useState(1)
  const [children, setChildren] = useState(0)
  const [liked,    setLiked]    = useState(false)

  const availableRooms = rooms.filter(r => !r.status || r.status === 'AVAILABLE')
  const selectedRoom   = rooms.find(r => r.id === Number(roomId))
  const nights = checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), 'day') : 0
  const total  = (selectedRoom?.roomPrice ?? 0) * Math.max(nights, 1)
  const basePrice = availableRooms.length > 0 ? Math.min(...availableRooms.map(r => r.roomPrice)) : 0

  const handleBook = () => {
    if (!roomId) return
    navigate(`/hotels/${hotelId}/book/${roomId}`, { state: { checkIn, checkOut, adults, children } })
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-border p-6 sticky top-24 space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Giá từ</p>
        <p className="text-3xl font-bold text-accent">
          {basePrice > 0 ? formatCurrency(basePrice) : '—'}
          <span className="text-sm font-normal text-muted-foreground">/đêm</span>
        </p>
      </div>

      <Separator />

      {/* Date range */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Ngày nhận — Trả phòng
        </label>
        <DatePicker
          selectsRange
          startDate={checkIn ?? undefined}
          endDate={checkOut ?? undefined}
          onChange={([s, e]) => { setCheckIn(s ?? null); setCheckOut(e ?? null) }}
          minDate={new Date()}
          dateFormat="dd/MM/yy"
          placeholderText="Chọn ngày..."
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
        />
        {nights > 0 && (
          <p className="text-xs text-muted-foreground mt-1">{nights} đêm</p>
        )}
      </div>

      {/* Room select */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Loại phòng
        </label>
        <Select value={roomId} onValueChange={setRoomId}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Chọn loại phòng..." />
          </SelectTrigger>
          <SelectContent>
            {availableRooms.map(r => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.roomType} — {formatCurrency(r.roomPrice)}/đêm
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guests */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Người lớn
          </label>
          <Select value={String(adults)} onValueChange={v => setAdults(Number(v))}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Trẻ em
          </label>
          <Select value={String(children)} onValueChange={v => setChildren(Number(v))}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => i).map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total */}
      {selectedRoom && nights > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex justify-between text-muted-foreground mb-1">
            <span>{formatCurrency(selectedRoom.roomPrice)} × {nights} đêm</span>
            <span>{formatCurrency(selectedRoom.roomPrice * nights)}</span>
          </div>
          <Separator className="my-1.5" />
          <div className="flex justify-between font-bold text-foreground">
            <span>Tổng cộng</span>
            <span className="text-accent">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-accent hover:bg-accent/90 text-white font-semibold active:scale-[0.98]"
        disabled={!roomId || hotel.active === false}
        onClick={handleBook}
      >
        Đặt phòng ngay
      </Button>

      <Button
        variant="outline"
        className={cn('w-full gap-2', liked && 'border-red-400 text-red-500')}
        onClick={() => setLiked(l => !l)}
      >
        <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : ''} />
        {liked ? 'Đã yêu thích' : 'Yêu thích'}
      </Button>

      {hotel.phone && (
        <a
          href={`tel:${hotel.phone}`}
          className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
        >
          <Phone size={14} /> {hotel.phone}
        </a>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HotelDetailPage() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const navigate    = useNavigate()
  const location    = useLocation()
  const { checkIn: initCheckIn, checkOut: initCheckOut } =
    (location.state ?? {}) as { checkIn?: Date; checkOut?: Date }

  const { data: hotel, isLoading: loadingHotel } = useQuery<HotelDetail>({
    queryKey: ['hotel', hotelId],
    queryFn:  () => api.get(`/hotels/${hotelId}`).then(r => r.data),
    enabled:  !!hotelId,
  })

  const { data: rooms = [], isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ['hotel-rooms', hotelId],
    queryFn:  () => api.get(`/hotels/${hotelId}/rooms`).then(r => r.data),
    enabled:  !!hotelId,
  })

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['hotel-reviews', hotelId],
    queryFn:  () => api.get(`/hotels/${hotelId}/reviews`).then(r => r.data),
    enabled:  !!hotelId,
  })

  const [roomFilter, setRoomFilter] = useState<'ALL' | 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE'>('ALL')

  if (loadingHotel) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
      <Footer />
    </div>
  )

  if (!hotel) return null

  const gallery   = buildGallery(hotel)
  const amenities = parseAmenities(hotel.amenities)
  const avg       = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  const filteredRooms = roomFilter === 'ALL' ? rooms : rooms.filter(r => r.status === roomFilter)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-400">

        {/* Back */}
        <button
          onClick={() => navigate('/hotels')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft size={15} /> Danh sách khách sạn
        </button>

        {/* Gallery */}
        <HotelGallery images={gallery} name={hotel.name} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {hotel.hotelType && <Badge variant="secondary">{HOTEL_TYPE[hotel.hotelType] ?? hotel.hotelType}</Badge>}
            {(hotel.starRating ?? 0) > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                {Array.from({ length: hotel.starRating! }, (_, i) => (
                  <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
            {hotel.active === false && <Badge variant="destructive">Tạm đóng</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{hotel.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {(hotel.address || hotel.city) && (
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-accent" />
                {[hotel.address, hotel.city].filter(Boolean).join(', ')}
              </span>
            )}
            {avg > 0 && (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-semibold text-amber-600">{avg.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviews.length} đánh giá)</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Content ── */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="mb-6 w-full sm:w-auto">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="rooms">
                  Loại phòng
                  <span className="ml-1.5 text-xs opacity-60">({rooms.length})</span>
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  Đánh giá
                  <span className="ml-1.5 text-xs opacity-60">({reviews.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Tổng quan */}
              <TabsContent value="overview" className="space-y-6">
                {hotel.description && (
                  <section className="bg-white rounded-xl border border-border p-6">
                    <h2 className="font-semibold text-base mb-3">Giới thiệu</h2>
                    <div
                      className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: hotel.description }}
                    />
                  </section>
                )}

                {amenities.length > 0 && (
                  <section className="bg-white rounded-xl border border-border p-6">
                    <h2 className="font-semibold text-base mb-4">Tiện ích</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {amenities.map((a, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg text-center">
                          <span className="text-primary">{a.icon ?? <Utensils size={18} />}</span>
                          <span className="text-xs font-medium text-foreground/80">{a.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Map placeholder */}
                <section className="bg-white rounded-xl border border-border p-6">
                  <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-accent" /> Vị trí
                  </h2>
                  <div className="rounded-lg overflow-hidden h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                      <p>{[hotel.address, hotel.city].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Tab: Loại phòng */}
              <TabsContent value="rooms" className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['ALL', 'AVAILABLE', 'BOOKED', 'MAINTENANCE'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setRoomFilter(f)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                        roomFilter === f
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {f === 'ALL' ? 'Tất cả' : ROOM_STATUS[f]?.label}
                      <span className="ml-1 opacity-60">
                        ({f === 'ALL' ? rooms.length : rooms.filter(r => r.status === f).length})
                      </span>
                    </button>
                  ))}
                </div>

                {loadingRooms ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Không có phòng nào trong danh mục này
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRooms.map(r => (
                      <RoomCard
                        key={r.id}
                        room={r}
                        hotelId={hotelId!}
                        checkIn={initCheckIn}
                        checkOut={initCheckOut}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Đánh giá */}
              <TabsContent value="reviews">
                <ReviewSection reviews={reviews} />
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Sidebar ── */}
          <div>
            <BookingSidebar hotel={hotel} rooms={rooms} hotelId={hotelId!} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
