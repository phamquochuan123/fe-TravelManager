import { useState } from 'react'
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Check, MapPin, Calendar, Users, CreditCard,
  Phone, Mail, User, ArrowLeft, Loader2, Bed, ChevronRight,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import { useAuthStore } from '@/stores/authStore'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { formatCurrency, formatDate, resolveBase64Image } from '@/lib/utils'
import dayjs from 'dayjs'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRouteState {
  checkIn?: Date | null
  checkOut?: Date | null
  adults?: number
  children?: number
  room?: RoomInfo
}

interface RoomInfo {
  id: number
  roomType: string
  roomPrice: number
  maxGuests?: number
  numBeds?: number
  area?: number
  description?: string
  photo?: string
}

interface HotelDetail {
  id: number
  name: string
  address?: string
  city?: string
  starRating?: number
  photo?: string
  images?: Array<{ id: number; photo: string }>
}

// ─── Validation ───────────────────────────────────────────────────────────────

const contactSchema = z.object({
  guestFullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(50, 'Tối đa 50 ký tự'),
  guestEmail:   z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  guestPhone:   z.string().regex(/^0[35789]\d{8}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
})
type ContactFormData = z.infer<typeof contactSchema>

const STEPS = [
  { id: 1, label: 'Thông tin' },
  { id: 2, label: 'Xác nhận' },
  { id: 3, label: 'Hoàn tất' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeFormatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Chưa chọn'
  try { return formatDate(date) } catch { return String(date) }
}

function resolveHotelImage(hotel: HotelDetail): string {
  const img = hotel.images?.[0]?.photo
  if (img) return resolveBase64Image(img, '')
  if (hotel.photo) return resolveBase64Image(hotel.photo, '')
  return `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80`
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center mb-12 select-none">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-start">
          <div className="flex flex-col items-center">
            <div
              className="flex w-10 h-10 items-center justify-center rounded-full text-sm font-black transition-all duration-300"
              style={
                current > step.id
                  ? { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }
                  : current === step.id
                  ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', color: '#fff', boxShadow: '0 4px 12px rgba(10,22,40,0.4)' }
                  : { background: '#f3f4f6', color: '#9ca3af', border: '2px solid #e5e7eb' }
              }
            >
              {current > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
            </div>
            <span className={`mt-2 text-xs font-bold whitespace-nowrap ${current >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="mx-4 mt-5 h-0.5 w-16 sm:w-28 shrink-0 rounded-full transition-all duration-500"
              style={{
                background: current > step.id
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : current === step.id
                  ? 'linear-gradient(90deg, #0a1628, #e5e7eb)'
                  : '#e5e7eb',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

const inputCls = 'w-full pl-10 pr-4 py-3 bg-[#f8f5ee] border-2 border-transparent rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all'

// ─── Summary Card ─────────────────────────────────────────────────────────────

function BookingSummaryCard({ hotel, room, checkIn, checkOut, adults, children, nights, totalPrice }: {
  hotel: HotelDetail; room: RoomInfo
  checkIn?: Date | null; checkOut?: Date | null
  adults: number; children: number; nights: number; totalPrice: number
}) {
  return (
    <div className="sticky top-24 rounded-sm bg-white border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>

      <div className="relative h-40 overflow-hidden">
        <img
          src={resolveHotelImage(hotel)}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-4">{hotel.name}</h3>

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          {hotel.address && (
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color: '#0a1628' }} />
              <span className="truncate">{hotel.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Bed size={13} style={{ color: '#0a1628' }} />
            <span>{room.roomType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={13} style={{ color: '#0a1628' }} />
            <span>{safeFormatDate(checkIn)} → {safeFormatDate(checkOut)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={13} style={{ color: '#0a1628' }} />
            <span>{adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>{formatCurrency(room.roomPrice)} × {nights} đêm</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
            <span className="text-gray-900">Tổng cộng</span>
            <span style={{ color: '#c9a84c' }}>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookHotelPage() {
  const { hotelId, roomId } = useParams<{ hotelId: string; roomId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)

  const [step, setStep]               = useState<1 | 2 | 3>(1)
  const [contactData, setContactData] = useState<ContactFormData | null>(null)
  const [confirmCode, setConfirmCode] = useState<string | null>(null)
  const [bookingId,   setBookingId]   = useState<number | null>(null)

  const state = location.state as BookingRouteState | null
  const { checkIn, checkOut, adults = 1, children = 0, room: stateRoom } = state ?? {}

  const nights = checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), 'day') : 0

  const { data: hotel, isLoading: hotelLoading } = useQuery<HotelDetail>({
    queryKey: ['hotel-detail-book', hotelId],
    queryFn: async () => (await api.get(`/hotels/${hotelId}`)).data,
    staleTime: 5 * 60 * 1000,
    enabled: !!hotelId,
  })

  const { data: roomData, isLoading: roomLoading } = useQuery<RoomInfo>({
    queryKey: ['room-detail', roomId],
    queryFn: async () => (await api.get(`/rooms/${roomId}`)).data,
    staleTime: 5 * 60 * 1000,
    enabled: !!roomId && !stateRoom,
  })

  const room = stateRoom ?? roomData
  const totalPrice = room ? room.roomPrice * Math.max(nights, 1) : 0

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      guestFullName: user?.name  ?? '',
      guestEmail:    user?.email ?? '',
      guestPhone:    user?.phone ?? '',
    },
  })

  const bookingMutation = useMutation({
    mutationFn: (contact: ContactFormData) =>
      api.post(`/hotels/${hotelId}/rooms/${roomId}/bookings`, {
        checkInDate:  checkIn  ? dayjs(checkIn).format('YYYY-MM-DD')  : null,
        checkOutDate: checkOut ? dayjs(checkOut).format('YYYY-MM-DD') : null,
        guestFullName: contact.guestFullName,
        guestEmail:    contact.guestEmail,
        numOfAdults:   adults,
        numOfChildren: children,
      }).then(r => r.data as { id: number; bookingConfirmationCode: string }),
    onSuccess: res => {
      setBookingId(res.id)
      setConfirmCode(res.bookingConfirmationCode)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (err: Error) => toast.error(err.message || 'Đặt phòng thất bại. Vui lòng thử lại.'),
  })

  const paymentMutation = useMutation({
    mutationFn: () =>
      api.post('/payment/create', {
        bookingType: 'HOTEL',
        bookingId,
        amount: totalPrice,
        orderInfo: `Đặt phòng ${hotel?.name ?? ''} - ${confirmCode}`,
      }).then(r => r.data as { txnRef: string; payUrl: string }),
    onSuccess: ({ payUrl }) => { window.location.href = payUrl },
    onError: () => toast.error('Không thể kết nối VNPay. Vui lòng thử lại.'),
  })

  if (!state || !checkIn || !checkOut) return <Navigate to={`/hotels/${hotelId}`} replace />

  if (hotelLoading || roomLoading || !hotel || !room) {
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

      {/* Hero */}
      <div className="relative overflow-hidden pt-24 pb-12 px-6"
        style={{ background: 'linear-gradient(135deg, #0a1929 0%, #0a1628 60%, #0a1929 100%)' }}>
        <div className="absolute -bottom-1 left-0 right-0 h-10 bg-[#f8f5ee]"
          style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="font-black text-white text-3xl sm:text-4xl tracking-tight mb-1">Đặt phòng</h1>
          <p className="text-white/50 text-sm line-clamp-1 max-w-lg mx-auto">{hotel.name}</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Stepper current={step} />

        {/* Step 1: Contact info */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
            <div className="lg:col-span-2">
              <BookingSummaryCard
                hotel={hotel} room={room}
                checkIn={checkIn} checkOut={checkOut}
                adults={adults} children={children}
                nights={nights} totalPrice={totalPrice}
              />
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-sm bg-white border border-gray-100 p-7"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <h2 className="font-black text-gray-900 text-xl mb-1">Thông tin khách</h2>
                <p className="text-gray-400 text-sm mb-6">Chúng tôi sẽ gửi xác nhận đặt phòng qua email này</p>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(d => { setContactData(d); setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) })} className="space-y-5">

                    <FormField control={form.control} name="guestFullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Họ và tên *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input className={inputCls} placeholder="Nguyễn Văn A"
                              onFocus={e => { e.target.style.borderColor = '#0a1628'; e.target.style.background = '#fff' }}
                              {...field}
                              onBlur={e => { field.onBlur(); e.target.style.borderColor = 'transparent'; e.target.style.background = '#f9fafb' }} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="guestEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">Email xác nhận *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="email" className={inputCls} placeholder="example@email.com"
                              onFocus={e => { e.target.style.borderColor = '#0a1628'; e.target.style.background = '#fff' }}
                              {...field}
                              onBlur={e => { field.onBlur(); e.target.style.borderColor = 'transparent'; e.target.style.background = '#f9fafb' }} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="guestPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold text-gray-700">
                          Số điện thoại <span className="font-normal text-gray-400">(tuỳ chọn)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="tel" className={inputCls} placeholder="0912 345 678"
                              onFocus={e => { e.target.style.borderColor = '#0a1628'; e.target.style.background = '#fff' }}
                              {...field}
                              onBlur={e => { field.onBlur(); e.target.style.borderColor = 'transparent'; e.target.style.background = '#f9fafb' }} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 py-4 rounded text-white font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 6px 20px rgba(10,22,40,0.35)' }}>
                      Tiếp tục <ChevronRight size={18} />
                    </button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && contactData && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-sm bg-white border border-gray-100 p-7"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <h2 className="font-black text-gray-900 text-xl mb-1">Xác nhận đặt phòng</h2>
              <p className="text-gray-400 text-sm mb-6">Kiểm tra kỹ thông tin trước khi hoàn tất đặt chỗ</p>

              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Thông tin phòng</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
                  {[
                    { dt: 'Khách sạn',   dd: hotel.name },
                    { dt: 'Loại phòng',  dd: room.roomType },
                    { dt: 'Nhận phòng',  dd: safeFormatDate(checkIn) },
                    { dt: 'Trả phòng',   dd: safeFormatDate(checkOut) },
                    { dt: 'Số đêm',      dd: `${nights} đêm` },
                    { dt: 'Số khách',    dd: `${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ''}` },
                  ].map(({ dt, dd }) => (
                    <>
                      <dt key={`dt-${dt}`} className="text-gray-400">{dt}</dt>
                      <dd key={`dd-${dt}`} className="font-semibold text-gray-900">{dd}</dd>
                    </>
                  ))}
                </dl>
              </div>

              <div className="border-t border-gray-100 my-5" />

              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Thông tin khách</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
                  {[
                    { dt: 'Họ và tên', dd: contactData.guestFullName },
                    { dt: 'Email',     dd: contactData.guestEmail },
                    ...(contactData.guestPhone ? [{ dt: 'Điện thoại', dd: contactData.guestPhone }] : []),
                  ].map(({ dt, dd }) => (
                    <>
                      <dt key={`dt-${dt}`} className="text-gray-400">{dt}</dt>
                      <dd key={`dd-${dt}`} className="font-semibold text-gray-900 break-all">{dd}</dd>
                    </>
                  ))}
                </dl>
              </div>

              <div className="border-t border-gray-100 my-5" />

              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Chi tiết giá</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>{formatCurrency(room.roomPrice)} × {nights} đêm</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                    <span className="text-gray-900">Tổng cộng</span>
                    <span style={{ color: '#c9a84c' }}>{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition-all">
                  <ArrowLeft size={15} /> Quay lại
                </button>
                <button
                  onClick={() => bookingMutation.mutate(contactData)}
                  disabled={bookingMutation.isPending}
                  className="flex-2 flex items-center justify-center gap-2 py-3.5 px-8 rounded text-white font-black text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}>
                  {bookingMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                  Xác nhận đặt phòng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && confirmCode && (
          <div className="max-w-md mx-auto">
            <div className="rounded-sm bg-white border border-gray-100 p-8 text-center"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

              <div className="mx-auto mb-6 flex w-20 h-20 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
                <Check size={36} className="text-white" strokeWidth={3} />
              </div>

              <h2 className="font-black text-gray-900 text-2xl mb-2">Đặt phòng thành công!</h2>
              <p className="text-gray-400 text-sm mb-7">Mã xác nhận đã được gửi đến email của bạn</p>

              <div className="rounded px-5 py-4 mb-5"
                style={{ background: 'rgba(10,22,40,0.06)' }}>
                <p className="text-xs text-gray-400 mb-1.5">Mã xác nhận</p>
                <p className="font-mono text-xl font-black tracking-widest break-all" style={{ color: '#0a1628' }}>
                  {confirmCode}
                </p>
              </div>

              <div className="rounded border border-gray-100 px-5 py-4 space-y-3 text-sm mb-6">
                <div className="flex justify-between gap-3 text-left">
                  <span className="text-gray-400 shrink-0">Khách sạn</span>
                  <span className="font-semibold text-gray-900 text-right line-clamp-2">{hotel.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phòng</span>
                  <span className="font-semibold">{room.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nhận phòng</span>
                  <span className="font-semibold">{safeFormatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trả phòng</span>
                  <span className="font-semibold">{safeFormatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                  <span className="text-gray-900">Tổng thanh toán</span>
                  <span style={{ color: '#c9a84c' }}>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded text-white font-black text-base mb-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                onClick={() => paymentMutation.mutate()}
                disabled={paymentMutation.isPending}
                style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)', boxShadow: '0 6px 20px rgba(201,168,76,0.4)' }}>
                {paymentMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Thanh toán qua VNPay
              </button>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn.
              </p>

              <button
                className="w-full text-sm text-gray-400 hover:text-gray-700 font-medium py-2 transition-colors"
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
