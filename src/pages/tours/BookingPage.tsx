import { useState } from 'react'
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueries } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  Check, MapPin, Calendar, Users,
  CreditCard, Phone, Mail, User, ArrowLeft, Loader2,
  Clock, MessageSquare, ChevronRight, Tag, X,
  Hotel, Utensils, Star, ChevronDown, ChevronUp,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import { useAuthStore } from '@/stores/authStore'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency, formatDate, resolveBase64Image } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRouteState {
  departureId: number
  adults: number
  children: number
  departureDate?: string
}
interface TourDetail {
  id: number
  name: string
  priceAdult: number
  durationDays: number
  durationNights?: number
  destination: string
  packageDiscountPercent?: number
  startDate?: string
  images?: Array<{ id: number; photo: string }>
  imageUrl?: string
  departures?: Array<{ id: number; departureDate: string; availableSlots: number }>
  linkedHotels?: number[]
  linkedRestaurants?: number[]
}
interface BookingResult { id: number; finalPrice: number; status: string }
interface CouponResult {
  valid: boolean; message?: string; code?: string
  couponType?: string; discountValue?: number; discountAmount?: number; finalPrice?: number
}
interface LinkedHotel {
  id: number; name: string; starRating?: number; address?: string
  city?: string; description?: string; photo?: number[]
}
interface Room {
  id: number; roomType: string; roomPrice: number
  maxGuests: number; numBeds: number; area?: number
  isBooked: boolean; status: string; photo?: number[]
}
interface LinkedRestaurant {
  id: number; name: string; cuisineType?: string
  openingHours?: string; capacity?: number; address?: string; photo?: number[]
}
interface SelectedHotelAddon {
  hotelId: number; hotelName: string; roomId: number
  roomType: string; pricePerNight: number; nights: number
}
interface SelectedRestaurantAddon {
  restaurantId: number; restaurantName: string
  bookingDate: string; bookingTime: string; guestCount: number
}

// ─── Validation ───────────────────────────────────────────────────────────────

const contactSchema = z.object({
  contactName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(50, 'Tối đa 50 ký tự'),
  email:       z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  phone:       z.string().regex(/^0[35789]\d{8}$/, 'Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09)'),
  note:        z.string().max(500, 'Ghi chú tối đa 500 ký tự'),
})
type ContactFormData = z.infer<typeof contactSchema>

const CHILD_DISCOUNT = 0.7
const STEPS = [{ id: 1, label: 'Thông tin' }, { id: 2, label: 'Xác nhận' }, { id: 3, label: 'Thanh toán' }]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeFormatDate(date: string | Date | undefined | null): string {
  if (!date) return 'Chưa xác định'
  try { return formatDate(date) } catch { return String(date) }
}
function resolveTourImage(tour: TourDetail): string {
  const raw = tour.images?.[0]?.photo ?? tour.imageUrl
  return resolveBase64Image(raw, `https://picsum.photos/seed/tour-${tour.id}/800/450`)
}
function resolveItemPhoto(photo: number[] | undefined, fallback: string): string {
  if (!photo?.length) return fallback
  const b64 = btoa(String.fromCharCode(...new Uint8Array(photo)))
  return `data:image/jpeg;base64,${b64}`
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center mb-12 select-none">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-start">
          <div className="flex flex-col items-center">
            <div className="flex w-10 h-10 items-center justify-center rounded-full text-sm font-black transition-all duration-300"
              style={
                current > step.id
                  ? { background: 'linear-gradient(135deg,#10b981,#059669)', color:'#fff', boxShadow:'0 4px 12px rgba(16,185,129,0.4)' }
                  : current === step.id
                  ? { background: 'linear-gradient(135deg,#0a1628,#1a3a5c)', color:'#fff', boxShadow:'0 4px 12px rgba(10,22,40,0.4)' }
                  : { background:'#f3f4f6', color:'#9ca3af', border:'2px solid #e5e7eb' }
              }>
              {current > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
            </div>
            <span className={`mt-2 text-xs font-bold whitespace-nowrap ${current >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="mx-4 mt-5 h-0.5 w-16 sm:w-28 shrink-0 rounded-full transition-all duration-500"
              style={{ background: current > step.id ? 'linear-gradient(90deg,#10b981,#059669)' : current === step.id ? 'linear-gradient(90deg,#0a1628,#e5e7eb)' : '#e5e7eb' }} />
          )}
        </div>
      ))}
    </div>
  )
}

const inputCls = 'w-full pl-10 pr-4 py-3 bg-[#f8f5ee] border-2 border-transparent rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all'

// ─── TourSummaryCard ──────────────────────────────────────────────────────────

function TourSummaryCard({ tour, adults, children, departureDate, adultPrice, childPrice, totalPrice,
  couponCode, onCouponCodeChange, onApplyCoupon, onRemoveCoupon, couponResult, couponLoading,
  selectedHotel, selectedRestaurant, packageDiscountAmt }: {
  tour: TourDetail; adults: number; children: number; departureDate?: string
  adultPrice: number; childPrice: number; totalPrice: number
  couponCode: string; onCouponCodeChange: (v: string) => void
  onApplyCoupon: () => void; onRemoveCoupon: () => void
  couponResult: CouponResult | null; couponLoading: boolean
  selectedHotel: SelectedHotelAddon | null
  selectedRestaurant: SelectedRestaurantAddon | null
  packageDiscountAmt: number
}) {
  const couponDiscountAmt = couponResult?.valid ? (couponResult.discountAmount ?? 0) : 0
  const hotelTotal = selectedHotel ? selectedHotel.pricePerNight * selectedHotel.nights : 0
  const grandTotal = totalPrice + hotelTotal - couponDiscountAmt - packageDiscountAmt

  return (
    <div className="sticky top-24 rounded-sm bg-white border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
      <div className="relative h-40 overflow-hidden">
        <img src={resolveTourImage(tour)} alt={tour.name} className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/tour-${tour.id}/400/225` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 60%)' }} />
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-4">{tour.name}</h3>
        <div className="space-y-2 text-sm text-gray-500 mb-4">
          {[
            { icon: <MapPin size={13} />, text: tour.destination },
            { icon: <Calendar size={13} />, text: safeFormatDate(departureDate) },
            { icon: <Clock size={13} />, text: `${tour.durationDays} ngày` },
            { icon: <Users size={13} />, text: `${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ''}` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <span style={{ color: '#0a1628' }}>{icon}</span>
              <span className="truncate">{text}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Người lớn × {adults}</span>
            <span>{formatCurrency(adultPrice * adults)}</span>
          </div>
          {children > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Trẻ em × {children}</span>
              <span>{formatCurrency(childPrice * children)}</span>
            </div>
          )}
          {couponResult?.valid && (
            <div className="flex justify-between text-green-600 text-sm">
              <span className="flex items-center gap-1"><Tag size={12} /> {couponResult.code}</span>
              <span>-{formatCurrency(couponResult.discountAmount ?? 0)}</span>
            </div>
          )}

          {/* Add-ons */}
          {selectedHotel && (
            <div className="flex justify-between text-purple-600 text-sm">
              <span className="flex items-center gap-1"><Hotel size={12} /> {selectedHotel.roomType}</span>
              <span>{formatCurrency(hotelTotal)}</span>
            </div>
          )}
          {selectedRestaurant && (
            <div className="flex justify-between text-orange-500 text-sm">
              <span className="flex items-center gap-1"><Utensils size={12} /> {selectedRestaurant.restaurantName}</span>
              <span className="text-xs text-gray-400">Thanh toán tại chỗ</span>
            </div>
          )}
          {packageDiscountAmt > 0 && (
            <div className="flex justify-between text-blue-600 text-sm">
              <span className="flex items-center gap-1"><Tag size={12} /> Giảm giá gói ({tour.packageDiscountPercent}%)</span>
              <span>-{formatCurrency(packageDiscountAmt)}</span>
            </div>
          )}

          <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
            <span className="text-gray-900">Tổng cộng</span>
            <span style={{ color: '#c9a84c' }}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Coupon */}
        <div className="border-t border-gray-100 pt-4 mt-2">
          {couponResult?.valid ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
              <div className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                <Check size={14} />
                <span>{couponResult.code}</span>
                <span className="text-xs font-normal text-green-600">
                  ({couponResult.couponType === 'PERCENT' ? `${couponResult.discountValue}%` : formatCurrency(couponResult.discountValue ?? 0)})
                </span>
              </div>
              <button type="button" onClick={onRemoveCoupon} className="text-green-500 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mã giảm giá</p>
              <div className="flex gap-2">
                <input value={couponCode} onChange={e => onCouponCodeChange(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && onApplyCoupon()}
                  placeholder="Nhập mã..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded bg-[#f8f5ee] focus:outline-none focus:border-[#0a1628] focus:bg-white transition-all uppercase placeholder:normal-case" />
                <button type="button" onClick={onApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                  className="px-3 py-2 text-sm font-bold text-white rounded transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
                  style={{ background: '#0a1628' }}>
                  {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Áp dụng'}
                </button>
              </div>
              {couponResult?.valid === false && <p className="text-xs text-red-500">{couponResult.message}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── HotelAddOnSection ────────────────────────────────────────────────────────

function HotelAddOnSection({ hotels, allRooms, nights, selected, onSelect }: {
  hotels: LinkedHotel[]
  allRooms: Room[][]
  nights: number
  selected: SelectedHotelAddon | null
  onSelect: (h: SelectedHotelAddon | null) => void
}) {
  const [expandedHotel, setExpandedHotel] = useState<number | null>(null)

  if (!hotels.length) return null

  return (
    <div className="rounded-sm bg-white border border-gray-100 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0a1628,#1a3a5c)' }}>
          <Hotel size={15} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Khách sạn đi kèm</h3>
          <p className="text-xs text-gray-400">Tuỳ chọn — tự động liên kết với tour</p>
        </div>
        {selected && (
          <button onClick={() => { onSelect(null); setExpandedHotel(null) }}
            className="ml-auto text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5">
            <X size={12} /> Bỏ chọn
          </button>
        )}
      </div>

      {selected && (
        <div className="mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded bg-purple-50 border border-purple-200 text-sm">
          <Check size={13} className="text-purple-600 shrink-0" />
          <span className="text-purple-700 font-semibold">{selected.hotelName}</span>
          <span className="text-purple-500">— {selected.roomType}</span>
          <span className="ml-auto font-bold text-purple-700">{formatCurrency(selected.pricePerNight * selected.nights)}</span>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {hotels.map((hotel, idx) => {
          const rooms = (allRooms[idx] ?? []).filter(r => !r.isBooked && r.status !== 'BOOKED')
          const isExpanded = expandedHotel === hotel.id
          const isSelected = selected?.hotelId === hotel.id

          return (
            <div key={hotel.id} className={`border rounded-lg overflow-hidden transition-all ${isSelected ? 'border-purple-300' : 'border-gray-200'}`}>
              {/* Hotel header */}
              <button type="button" className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedHotel(isExpanded ? null : hotel.id)}>
                <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-gray-100">
                  <img src={resolveItemPhoto(hotel.photo, `https://picsum.photos/seed/hotel-${hotel.id}/48/48`)}
                    alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{hotel.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(hotel.starRating ?? 0) > 0 && (
                      <span className="flex gap-0.5">
                        {Array.from({ length: hotel.starRating! }).map((_, i) =>
                          <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                        )}
                      </span>
                    )}
                    {hotel.city && <span className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin size={10} />{hotel.city}</span>}
                  </div>
                </div>
                <span className="text-gray-400 shrink-0">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </button>

              {/* Rooms list */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
                  {rooms.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">Không có phòng trống</p>
                  ) : rooms.map(room => {
                    const isRoomSelected = selected?.hotelId === hotel.id && selected?.roomId === room.id
                    return (
                      <button key={room.id} type="button"
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 text-sm transition-all ${
                          isRoomSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                        onClick={() => onSelect(isRoomSelected ? null : {
                          hotelId: hotel.id, hotelName: hotel.name,
                          roomId: room.id, roomType: room.roomType,
                          pricePerNight: room.roomPrice, nights,
                        })}>
                        <div className="text-left">
                          <p className={`font-semibold ${isRoomSelected ? 'text-purple-700' : 'text-gray-800'}`}>{room.roomType}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{room.numBeds} giường · {room.maxGuests} khách{room.area ? ` · ${room.area}m²` : ''}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`font-bold ${isRoomSelected ? 'text-purple-700' : 'text-gray-700'}`}>{formatCurrency(room.roomPrice)}</p>
                          <p className="text-xs text-gray-400">/đêm × {nights} đêm</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── RestaurantAddOnSection ───────────────────────────────────────────────────

function RestaurantAddOnSection({ restaurants, defaultDate, defaultGuests, selected, onSelect }: {
  restaurants: LinkedRestaurant[]
  defaultDate: string
  defaultGuests: number
  selected: SelectedRestaurantAddon | null
  onSelect: (r: SelectedRestaurantAddon | null) => void
}) {
  const [expandedRest, setExpandedRest] = useState<number | null>(null)
  const [localDate, setLocalDate] = useState(defaultDate)
  const [localTime, setLocalTime] = useState('12:00')

  if (!restaurants.length) return null

  return (
    <div className="rounded-sm bg-white border border-gray-100 p-6" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#c9a84c,#b8960e)' }}>
          <Utensils size={15} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Nhà hàng đi kèm</h3>
          <p className="text-xs text-gray-400">Tuỳ chọn — đặt bàn trong thời gian tour</p>
        </div>
        {selected && (
          <button onClick={() => { onSelect(null); setExpandedRest(null) }}
            className="ml-auto text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5">
            <X size={12} /> Bỏ chọn
          </button>
        )}
      </div>

      {selected && (
        <div className="mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded bg-amber-50 border border-amber-200 text-sm">
          <Check size={13} className="text-amber-600 shrink-0" />
          <span className="text-amber-700 font-semibold">{selected.restaurantName}</span>
          <span className="text-amber-500 text-xs">— {selected.bookingDate} lúc {selected.bookingTime} · {selected.guestCount} khách</span>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {restaurants.map(rest => {
          const isExpanded = expandedRest === rest.id
          const isSelected = selected?.restaurantId === rest.id

          return (
            <div key={rest.id} className={`border rounded-lg overflow-hidden transition-all ${isSelected ? 'border-amber-300' : 'border-gray-200'}`}>
              <button type="button" className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedRest(isExpanded ? null : rest.id)}>
                <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-gray-100">
                  <img src={resolveItemPhoto(rest.photo, `https://picsum.photos/seed/rest-${rest.id}/48/48`)}
                    alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{rest.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {rest.cuisineType && <span className="text-xs text-gray-400">{rest.cuisineType}</span>}
                    {rest.openingHours && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock size={10} />{rest.openingHours}</span>}
                  </div>
                </div>
                <span className="text-gray-400 shrink-0">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Ngày</label>
                      <input type="date" value={localDate} onChange={e => setLocalDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Giờ</label>
                      <input type="time" value={localTime} onChange={e => setLocalTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-amber-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-600">Số khách</label>
                      <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700">
                        {defaultGuests} người
                      </div>
                    </div>
                  </div>
                  <button type="button"
                    className={`w-full py-2 rounded text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                        : 'text-white hover:opacity-90'
                    }`}
                    style={isSelected ? {} : { background: 'linear-gradient(135deg,#c9a84c,#b8960e)' }}
                    onClick={() => {
                      if (isSelected) { onSelect(null); setExpandedRest(null) }
                      else onSelect({ restaurantId: rest.id, restaurantName: rest.name, bookingDate: localDate, bookingTime: localTime, guestCount: defaultGuests })
                    }}>
                    {isSelected ? 'Bỏ đặt bàn' : 'Thêm vào đơn'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const [step, setStep]                   = useState<1 | 2 | 3>(1)
  const [contactData, setContactData]     = useState<ContactFormData | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [couponCode, setCouponCode]       = useState('')
  const [couponResult, setCouponResult]   = useState<CouponResult | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [selectedHotel, setSelectedHotel]           = useState<SelectedHotelAddon | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<SelectedRestaurantAddon | null>(null)

  const state = location.state as BookingRouteState | null
  const { departureId, adults = 1, children = 0, departureDate } = state ?? {}

  const { data: tour, isLoading } = useQuery<TourDetail>({
    queryKey: ['tour-detail', tourId],
    queryFn:  async () => (await api.get(`/tours/${tourId}`)).data,
    staleTime: 5 * 60 * 1000,
    enabled:  !!tourId,
  })

  // Date calculations
  const checkOutDate = departureDate && tour?.durationDays
    ? dayjs(departureDate).add(tour.durationDays, 'day').format('YYYY-MM-DD')
    : undefined
  const nights = tour?.durationNights ?? tour?.durationDays ?? 0

  // Fetch hotels/restaurants by destination (not stored IDs)
  const destination = tour?.destination ?? ''

  const { data: linkedHotels = [] } = useQuery({
    queryKey: ['booking-hotels-by-dest', destination],
    queryFn:  () => api.get('/hotels', { params: { destination } }).then(r => r.data as LinkedHotel[]),
    enabled:  !!destination,
    staleTime: 5 * 60_000,
  })
  const hotelRoomQueries = useQueries({
    queries: linkedHotels.map(h => ({
      queryKey: ['booking-hotel-rooms', h.id],
      queryFn:  () => api.get(`/hotels/${h.id}/rooms`).then(r => r.data as Room[]),
      staleTime: 5 * 60_000,
    })),
  })
  const { data: linkedRestaurants = [] } = useQuery({
    queryKey: ['booking-restaurants-by-dest', destination],
    queryFn:  () => api.get('/restaurants', { params: { destination } }).then(r => r.data as LinkedRestaurant[]),
    enabled:  !!destination,
    staleTime: 5 * 60_000,
  })

  const linkedHotelRooms = hotelRoomQueries.map(q => q.data ?? []) as Room[][]

  // Pricing
  const adultPrice       = tour?.priceAdult ?? 0
  const childPrice       = Math.round(adultPrice * CHILD_DISCOUNT)
  const totalPrice       = adultPrice * adults + childPrice * children
  const discountAmount   = couponResult?.valid ? (couponResult.discountAmount ?? 0) : 0
  const hotelAddonTotal  = selectedHotel ? selectedHotel.pricePerNight * selectedHotel.nights : 0
  const rawSubtotal      = totalPrice + hotelAddonTotal
  const packageDiscountAmt = (tour?.packageDiscountPercent && tour.packageDiscountPercent > 0
    && (selectedHotel !== null || selectedRestaurant !== null))
    ? Math.round(rawSubtotal * tour.packageDiscountPercent / 100)
    : 0
  const grandTotal       = rawSubtotal - discountAmount - packageDiscountAmt

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await api.post('/tour-coupons/validate', { code: couponCode, orderValue: totalPrice })
      setCouponResult(res.data)
      if (!res.data.valid) toast.error(res.data.message ?? 'Mã không hợp lệ')
      else toast.success('Áp dụng mã giảm giá thành công!')
    } catch { setCouponResult({ valid: false, message: 'Không thể kiểm tra mã' }) }
    finally { setCouponLoading(false) }
  }
  const handleRemoveCoupon = () => { setCouponCode(''); setCouponResult(null) }

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contactName: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', note: '' },
  })

  const bookingMutation = useMutation({
    mutationFn: async (contact: ContactFormData) => {
      const res = await api.post(`/tour-bookings/tours/${tourId}`, {
        departureId,
        numAdults: adults,
        numChildren: children,
        contactName: contact.contactName,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        note: contact.note,
        couponCode: couponResult?.valid ? couponResult.code : undefined,
        roomId: selectedHotel?.roomId ?? null,
        restaurantId: selectedRestaurant?.restaurantId ?? null,
        restaurantBookingTime: selectedRestaurant?.bookingTime ?? null,
      })
      return res.data as BookingResult
    },
    onSuccess: data => { setBookingResult(data); setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }) },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? 'Đặt tour thất bại. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (bookingId: number) =>
      api.post('/payment/create', {
        bookingType: 'TOUR', bookingId,
        amount: bookingResult?.finalPrice ?? grandTotal,
        orderInfo: `Tour booking #${bookingId}`,
      }).then(r => r.data as { txnRef: string; payUrl: string }),
    onSuccess: ({ payUrl }) => { window.location.href = payUrl },
    onError: () => toast.error('Không thể kết nối VNPay. Vui lòng thử lại.'),
  })

  if (!state?.departureId) return <Navigate to={`/tours/${tourId}`} replace />

  if (isLoading || !tour) {
    return (
      <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <Navbar />

      <div className="relative overflow-hidden pt-24 pb-12 px-6"
        style={{ background: 'linear-gradient(135deg,#0a1929 0%,#0a1628 60%,#0a1929 100%)' }}>
        <div className="absolute -bottom-1 left-0 right-0 h-10 bg-[#f8f5ee]"
          style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="font-black text-white text-3xl sm:text-4xl tracking-tight mb-1">Đặt tour</h1>
          <p className="text-white/50 text-sm line-clamp-1 max-w-lg mx-auto">{tour.name}</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Stepper current={step} />

        {/* ── Step 1 ─────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
            {/* Left — summary */}
            <div className="lg:col-span-2">
              <TourSummaryCard tour={tour} adults={adults} children={children}
                departureDate={departureDate} adultPrice={adultPrice}
                childPrice={childPrice} totalPrice={totalPrice}
                couponCode={couponCode} onCouponCodeChange={setCouponCode}
                onApplyCoupon={handleApplyCoupon} onRemoveCoupon={handleRemoveCoupon}
                couponResult={couponResult} couponLoading={couponLoading}
                selectedHotel={selectedHotel} selectedRestaurant={selectedRestaurant}
                packageDiscountAmt={packageDiscountAmt} />
            </div>

            {/* Right — contact + add-ons */}
            <div className="lg:col-span-3 space-y-5">
              {/* Contact form */}
              <div className="rounded-sm bg-white border border-gray-100 p-7"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <h2 className="font-black text-gray-900 text-xl mb-1">Thông tin liên hệ</h2>
                <p className="text-gray-400 text-sm mb-6">Chúng tôi sẽ gửi xác nhận đặt tour qua email này</p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(d => { setContactData(d); setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) })} className="space-y-5">
                    <FormField control={form.control} name="contactName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Họ và tên *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input className={inputCls} placeholder="Nguyễn Văn A"
                              onFocus={e => { e.target.style.borderColor='#0a1628'; e.target.style.background='#fff' }}
                              onBlur={e => { e.target.style.borderColor='transparent'; e.target.style.background='#f9fafb' }}
                              {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Email xác nhận *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="email" className={inputCls} placeholder="example@email.com"
                              onFocus={e => { e.target.style.borderColor='#0a1628'; e.target.style.background='#fff' }}
                              onBlur={e => { e.target.style.borderColor='transparent'; e.target.style.background='#f9fafb' }}
                              {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Số điện thoại *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="tel" className={inputCls} placeholder="0912 345 678"
                              onFocus={e => { e.target.style.borderColor='#0a1628'; e.target.style.background='#fff' }}
                              onBlur={e => { e.target.style.borderColor='transparent'; e.target.style.background='#f9fafb' }}
                              {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="note" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">
                          Ghi chú <span className="font-normal text-gray-400">(tuỳ chọn)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MessageSquare size={14} className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                            <textarea className={`${inputCls} pl-10 pt-3 min-h-[96px] resize-none`}
                              placeholder="Yêu cầu đặc biệt, lưu ý dị ứng thực phẩm..."
                              onFocus={e => { e.target.style.borderColor='#0a1628'; e.target.style.background='#fff' }}
                              onBlur={e => { e.target.style.borderColor='transparent'; e.target.style.background='#f9fafb' }}
                              {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-4 rounded text-white font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background:'linear-gradient(135deg,#0a1628,#1a3a5c)', boxShadow:'0 6px 20px rgba(10,22,40,0.35)' }}>
                      Tiếp tục <ChevronRight size={18} />
                    </button>
                  </form>
                </Form>
              </div>

              {/* Hotel add-on */}
              <HotelAddOnSection
                hotels={linkedHotels}
                allRooms={linkedHotelRooms}
                nights={nights}
                selected={selectedHotel}
                onSelect={setSelectedHotel}
              />

              {/* Restaurant add-on */}
              <RestaurantAddOnSection
                restaurants={linkedRestaurants}
                defaultDate={departureDate ?? dayjs().format('YYYY-MM-DD')}
                defaultGuests={adults + children}
                selected={selectedRestaurant}
                onSelect={setSelectedRestaurant}
              />
            </div>
          </div>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────────────────── */}
        {step === 2 && contactData && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-sm bg-white border border-gray-100 p-7"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="font-black text-gray-900 text-xl mb-1">Xác nhận đặt tour</h2>
              <p className="text-gray-400 text-sm mb-6">Kiểm tra kỹ thông tin trước khi hoàn tất đặt chỗ</p>

              {/* Tour info */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Thông tin tour</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
                  {[
                    { dt: 'Tên tour',  dd: tour.name },
                    { dt: 'Điểm đến',  dd: tour.destination },
                    { dt: 'Khởi hành', dd: safeFormatDate(departureDate) },
                    { dt: 'Thời gian', dd: `${tour.durationDays} ngày` },
                    { dt: 'Số khách',  dd: `${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ''}` },
                  ].map(({ dt, dd }) => (
                    <>
                      <dt key={`dt-${dt}`} className="text-gray-400">{dt}</dt>
                      <dd key={`dd-${dt}`} className="font-semibold text-gray-900">{dd}</dd>
                    </>
                  ))}
                </dl>
              </div>

              {/* Hotel add-on confirmation */}
              {selectedHotel && (
                <>
                  <div className="border-t border-gray-100 my-4" />
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
                      <Hotel size={12} /> Khách sạn đi kèm
                    </p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                      <dt className="text-gray-400">Khách sạn</dt><dd className="font-semibold text-gray-900">{selectedHotel.hotelName}</dd>
                      <dt className="text-gray-400">Loại phòng</dt><dd className="font-semibold text-gray-900">{selectedHotel.roomType}</dd>
                      <dt className="text-gray-400">Check-in</dt><dd className="font-semibold text-gray-900">{safeFormatDate(departureDate)}</dd>
                      <dt className="text-gray-400">Check-out</dt><dd className="font-semibold text-gray-900">{safeFormatDate(checkOutDate)}</dd>
                      <dt className="text-gray-400">Tiền phòng</dt><dd className="font-semibold text-purple-700">{formatCurrency(hotelAddonTotal)}</dd>
                    </dl>
                  </div>
                </>
              )}

              {/* Restaurant add-on confirmation */}
              {selectedRestaurant && (
                <>
                  <div className="border-t border-gray-100 my-4" />
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
                      <Utensils size={12} /> Nhà hàng đi kèm
                    </p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                      <dt className="text-gray-400">Nhà hàng</dt><dd className="font-semibold text-gray-900">{selectedRestaurant.restaurantName}</dd>
                      <dt className="text-gray-400">Ngày đặt</dt><dd className="font-semibold text-gray-900">{safeFormatDate(selectedRestaurant.bookingDate)} lúc {selectedRestaurant.bookingTime}</dd>
                      <dt className="text-gray-400">Số khách</dt><dd className="font-semibold text-gray-900">{selectedRestaurant.guestCount} người</dd>
                      <dt className="text-gray-400">Thanh toán</dt><dd className="font-semibold text-amber-600">Tại nhà hàng</dd>
                    </dl>
                  </div>
                </>
              )}

              <div className="border-t border-gray-100 my-5" />

              {/* Contact info */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Thông tin liên hệ</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
                  {[
                    { dt: 'Họ và tên',  dd: contactData.contactName },
                    { dt: 'Email',      dd: contactData.email },
                    { dt: 'Điện thoại', dd: contactData.phone },
                    ...(contactData.note ? [{ dt: 'Ghi chú', dd: contactData.note }] : []),
                  ].map(({ dt, dd }) => (
                    <>
                      <dt key={`dt-${dt}`} className="text-gray-400">{dt}</dt>
                      <dd key={`dd-${dt}`} className="font-semibold text-gray-900 break-all">{dd}</dd>
                    </>
                  ))}
                </dl>
              </div>

              <div className="border-t border-gray-100 my-5" />

              {/* Price breakdown */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Chi tiết giá</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Người lớn ({formatCurrency(adultPrice)} × {adults})</span>
                    <span>{formatCurrency(adultPrice * adults)}</span>
                  </div>
                  {children > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Trẻ em ({formatCurrency(childPrice)} × {children})</span>
                      <span>{formatCurrency(childPrice * children)}</span>
                    </div>
                  )}
                  {couponResult?.valid && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1"><Tag size={12} /> Mã {couponResult.code}</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {selectedHotel && (
                    <div className="flex justify-between text-purple-600">
                      <span className="flex items-center gap-1"><Hotel size={12} /> {selectedHotel.hotelName} · {selectedHotel.roomType}</span>
                      <span>{formatCurrency(hotelAddonTotal)}</span>
                    </div>
                  )}
                  {selectedRestaurant && (
                    <div className="flex justify-between text-amber-600">
                      <span className="flex items-center gap-1"><Utensils size={12} /> {selectedRestaurant.restaurantName}</span>
                      <span className="text-xs text-gray-400">Thanh toán tại chỗ</span>
                    </div>
                  )}
                  {packageDiscountAmt > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span className="flex items-center gap-1"><Tag size={12} /> Giảm giá gói ({tour.packageDiscountPercent}%)</span>
                      <span>-{formatCurrency(packageDiscountAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                    <span className="text-gray-900">Tổng thanh toán</span>
                    <span style={{ color: '#c9a84c' }}>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition-all">
                  <ArrowLeft size={15} /> Quay lại
                </button>
                <button onClick={() => bookingMutation.mutate(contactData)}
                  disabled={bookingMutation.isPending}
                  className="flex-2 flex items-center justify-center gap-2 py-3.5 px-8 rounded text-white font-black text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background:'linear-gradient(135deg,#0a1628,#1a3a5c)', boxShadow:'0 4px 16px rgba(10,22,40,0.35)' }}>
                  {bookingMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                  Xác nhận đặt tour
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 ─────────────────────────────────────────────────────────── */}
        {step === 3 && bookingResult && (
          <div className="max-w-md mx-auto">
            <div className="rounded-sm bg-white border border-gray-100 p-8 text-center"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
              <div className="mx-auto mb-6 flex w-20 h-20 items-center justify-center rounded-full"
                style={{ background:'linear-gradient(135deg,#10b981,#059669)', boxShadow:'0 8px 24px rgba(16,185,129,0.4)' }}>
                <Check size={36} className="text-white" strokeWidth={3} />
              </div>
              <h2 className="font-black text-gray-900 text-2xl mb-2">Đặt tour thành công!</h2>
              <p className="text-gray-400 text-sm mb-7">
                {selectedHotel || selectedRestaurant
                  ? 'Tour, khách sạn và nhà hàng đã được đặt. Vui lòng hoàn tất thanh toán.'
                  : 'Vui lòng hoàn tất thanh toán để giữ chỗ của bạn'}
              </p>

              <div className="rounded px-5 py-4 mb-5" style={{ background: 'rgba(10,22,40,0.06)' }}>
                <p className="text-xs text-gray-400 mb-1.5">Mã đặt chỗ</p>
                <p className="font-mono text-3xl font-black tracking-widest" style={{ color: '#0a1628' }}>#{bookingResult.id}</p>
              </div>

              <div className="rounded border border-gray-100 px-5 py-4 space-y-3 text-sm mb-6">
                <div className="flex justify-between gap-3 text-left">
                  <span className="text-gray-400 shrink-0">Tour</span>
                  <span className="font-semibold text-gray-900 text-right line-clamp-2">{tour.name}</span>
                </div>
                {selectedHotel && (
                  <div className="flex justify-between gap-3 text-left">
                    <span className="text-gray-400 shrink-0 flex items-center gap-1"><Hotel size={12} /> Phòng</span>
                    <span className="font-semibold text-purple-700 text-right">{selectedHotel.hotelName} · {selectedHotel.roomType}</span>
                  </div>
                )}
                {selectedRestaurant && (
                  <div className="flex justify-between gap-3 text-left">
                    <span className="text-gray-400 shrink-0 flex items-center gap-1"><Utensils size={12} /> Bàn</span>
                    <span className="font-semibold text-amber-600 text-right">{selectedRestaurant.restaurantName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Khách</span>
                  <span className="font-semibold">{adults} người lớn{children > 0 && ` + ${children} trẻ em`}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                  <span className="text-gray-900">Tổng thanh toán</span>
                  <span style={{ color: '#c9a84c' }}>{formatCurrency(bookingResult.finalPrice)}</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2.5 py-4 rounded text-white font-black text-base mb-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                onClick={() => paymentMutation.mutate(bookingResult.id)}
                disabled={paymentMutation.isPending}
                style={{ background:'linear-gradient(135deg,#c9a84c,#b8960e)', boxShadow:'0 6px 20px rgba(201,168,76,0.4)' }}>
                {paymentMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Thanh toán qua VNPay
              </button>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn.<br />
                Chỗ đặt sẽ được giữ trong <strong>15 phút</strong>.
              </p>
              <button className="w-full text-sm text-gray-400 hover:text-gray-700 font-medium py-2 transition-colors"
                onClick={() => navigate('/my-bookings')}>
                Thanh toán sau — xem đơn hàng
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
