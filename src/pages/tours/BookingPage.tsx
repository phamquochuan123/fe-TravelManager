import { useState } from 'react'
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Check, ChevronRight, MapPin, Calendar, Users,
  CreditCard, Phone, Mail, User, ArrowLeft, Loader2,
  Clock, MessageSquare,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import { useAuthStore } from '@/stores/authStore'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

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
  price: number
  duration: string
  destination: string
  startDate: string
  images?: Array<{ id: number; photo: string }>
  imageUrl?: string
}

interface BookingResult {
  id: number
  bookingCode: string
  totalPrice: number
  status: string
}

// ─── Validation schema ────────────────────────────────────────────────────────

const contactSchema = z.object({
  contactName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(50, 'Tối đa 50 ký tự'),
  email:       z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  phone:       z.string().regex(/^0[35789]\d{8}$/, 'Số điện thoại không hợp lệ (10 số, đầu 03/05/07/08/09)'),
  note:        z.string().max(500, 'Ghi chú tối đa 500 ký tự'),
})

type ContactFormData = z.infer<typeof contactSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

const CHILD_DISCOUNT = 0.7

const STEPS = [
  { id: 1, label: 'Thông tin' },
  { id: 2, label: 'Xác nhận' },
  { id: 3, label: 'Thanh toán' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTourImage(tour: TourDetail): string {
  const raw = tour.images?.[0]?.photo ?? tour.imageUrl
  if (!raw) return `https://picsum.photos/seed/tour-${tour.id}/800/450`
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  try { return `data:image/jpeg;base64,${btoa(unescape(encodeURIComponent(raw)))}` }
  catch { return `https://picsum.photos/seed/tour-${tour.id}/800/450` }
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start justify-center mb-10 select-none">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-start">
          <div className="flex flex-col items-center">
            <div className={cn(
              'flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300',
              current > step.id
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : current === step.id
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-background text-muted-foreground',
            )}>
              {current > step.id ? <Check size={15} strokeWidth={3} /> : step.id}
            </div>
            <span className={cn(
              'mt-2 text-xs font-semibold whitespace-nowrap',
              current >= step.id ? 'text-foreground' : 'text-muted-foreground',
            )}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'mx-3 mt-[18px] h-0.5 w-16 sm:w-28 shrink-0 transition-colors duration-300',
              current > step.id ? 'bg-emerald-500' : current === step.id ? 'bg-primary/30' : 'bg-border',
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── TourSummaryCard ──────────────────────────────────────────────────────────

function TourSummaryCard({
  tour, adults, children, departureDate, adultPrice, childPrice, totalPrice,
}: {
  tour: TourDetail
  adults: number
  children: number
  departureDate?: string
  adultPrice: number
  childPrice: number
  totalPrice: number
}) {
  return (
    <Card className="sticky top-24">
      <CardContent className="pt-5">
        <img
          src={resolveTourImage(tour)}
          alt={tour.name}
          className="w-full h-36 object-cover rounded-lg mb-4"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/tour-${tour.id}/400/225` }}
        />
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-3">{tour.name}</h3>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-primary shrink-0" />
            <span className="truncate">{tour.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-primary shrink-0" />
            <span>{formatDate(departureDate ?? tour.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-primary shrink-0" />
            <span>{tour.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={13} className="text-primary shrink-0" />
            <span>{adults} người lớn{children > 0 && `, ${children} trẻ em`}</span>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Người lớn × {adults}</span>
            <span>{formatCurrency(adultPrice * adults)}</span>
          </div>
          {children > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trẻ em × {children}</span>
              <span>{formatCurrency(childPrice * children)}</span>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        <div className="flex justify-between items-baseline font-semibold">
          <span className="text-sm">Tổng cộng</span>
          <span className="text-lg text-accent">{formatCurrency(totalPrice)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [contactData, setContactData] = useState<ContactFormData | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  const state = location.state as BookingRouteState | null
  const { departureId, adults = 1, children = 0, departureDate } = state ?? {}

  // ── Fetch tour detail ──────────────────────────────────────────────────────
  const { data: tour, isLoading } = useQuery<TourDetail>({
    queryKey: ['tour-detail', tourId],
    queryFn: async () => {
      const res = await api.get(`/tours/${tourId}`)
      return res.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!tourId,
  })

  // Price calculations
  const adultPrice     = tour?.price ?? 0
  const childPrice     = Math.round(adultPrice * CHILD_DISCOUNT)
  const totalPrice     = adultPrice * adults + childPrice * children

  // ── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactName: user?.name  ?? '',
      email:       user?.email ?? '',
      phone:       user?.phone ?? '',
      note:        '',
    },
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const bookingMutation = useMutation({
    mutationFn: (contact: ContactFormData) =>
      api.post('/bookings', {
        tourId:       Number(tourId),
        departureId,
        adults,
        children,
        contactName:  contact.contactName,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        note:         contact.note,
      }).then(r => r.data as BookingResult),
    onSuccess: (data) => {
      setBookingResult(data)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: () => toast.error('Đặt tour thất bại. Vui lòng thử lại.'),
  })

  const paymentMutation = useMutation({
    mutationFn: (bookingId: number) =>
      api.post('/payment/create', {
        bookingType: 'TOUR',
        bookingId,
        amount:      bookingResult?.totalPrice ?? totalPrice,
        orderInfo:   `Tour booking #${bookingId}`,
      }).then(r => r.data as { txnRef: string; payUrl: string }),
    onSuccess: ({ payUrl }) => {
      window.location.href = payUrl
    },
    onError: () => toast.error('Không thể kết nối VNPay. Vui lòng thử lại.'),
  })

  // ── Guard: must come from tour page ───────────────────────────────────────
  if (!state?.departureId) return <Navigate to={`/tours/${tourId}`} replace />

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading || !tour) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-16" />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Skeleton className="h-10 w-72 mx-auto mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-5 w-4/5" />
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-2/3" />)}
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-8 w-48" />
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-center mb-2">Đặt tour</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">{tour.name}</p>

        <Stepper current={step} />

        {/* ── Step 1: Thông tin liên hệ ─────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Tour summary */}
            <div className="lg:col-span-2">
              <TourSummaryCard
                tour={tour}
                adults={adults}
                children={children}
                departureDate={departureDate}
                adultPrice={adultPrice}
                childPrice={childPrice}
                totalPrice={totalPrice}
              />
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin liên hệ</CardTitle>
                  <CardDescription>
                    Chúng tôi sẽ gửi xác nhận đặt tour qua email này
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => { setContactData(d); setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) })} className="space-y-4">

                      <FormField control={form.control} name="contactName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <Input className="pl-9" placeholder="Nguyễn Văn A" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email xác nhận *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <Input className="pl-9" type="email" placeholder="example@email.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                              <Input className="pl-9" type="tel" placeholder="0912 345 678" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="note" render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Ghi chú{' '}
                            <span className="font-normal text-muted-foreground">(tuỳ chọn)</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MessageSquare size={15} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                              <Textarea
                                className="pl-9 min-h-[96px] resize-none"
                                placeholder="Yêu cầu đặc biệt, lưu ý dị ứng thực phẩm..."
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <Button type="submit" className="w-full" size="lg">
                        Tiếp tục <ChevronRight size={16} />
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Step 2: Xác nhận ──────────────────────────────────────────── */}
        {step === 2 && contactData && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Xác nhận đặt tour</CardTitle>
                <CardDescription>Kiểm tra kỹ thông tin trước khi hoàn tất đặt chỗ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Tour info */}
                <section>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Thông tin tour
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Tên tour</dt>
                    <dd className="font-medium">{tour.name}</dd>
                    <dt className="text-muted-foreground">Điểm đến</dt>
                    <dd className="font-medium">{tour.destination}</dd>
                    <dt className="text-muted-foreground">Khởi hành</dt>
                    <dd className="font-medium">{formatDate(departureDate ?? tour.startDate)}</dd>
                    <dt className="text-muted-foreground">Thời gian</dt>
                    <dd className="font-medium">{tour.duration}</dd>
                    <dt className="text-muted-foreground">Số khách</dt>
                    <dd className="font-medium">
                      {adults} người lớn{children > 0 && `, ${children} trẻ em`}
                    </dd>
                  </dl>
                </section>

                <Separator />

                {/* Contact info */}
                <section>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Thông tin liên hệ
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Họ và tên</dt>
                    <dd className="font-medium">{contactData.contactName}</dd>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium break-all">{contactData.email}</dd>
                    <dt className="text-muted-foreground">Điện thoại</dt>
                    <dd className="font-medium">{contactData.phone}</dd>
                    {contactData.note && (
                      <>
                        <dt className="text-muted-foreground">Ghi chú</dt>
                        <dd className="font-medium">{contactData.note}</dd>
                      </>
                    )}
                  </dl>
                </section>

                <Separator />

                {/* Price breakdown */}
                <section>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Chi tiết giá
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Người lớn ({formatCurrency(adultPrice)} × {adults})
                      </span>
                      <span>{formatCurrency(adultPrice * adults)}</span>
                    </div>
                    {children > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Trẻ em ({formatCurrency(childPrice)} × {children})
                        </span>
                        <span>{formatCurrency(childPrice * children)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Tổng cộng</span>
                      <span className="text-accent">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft size={15} /> Quay lại
                  </Button>
                  <Button
                    onClick={() => bookingMutation.mutate(contactData)}
                    disabled={bookingMutation.isPending}
                    className="flex-1"
                  >
                    {bookingMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                    Xác nhận đặt tour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 3: Thanh toán ────────────────────────────────────────── */}
        {step === 3 && bookingResult && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
                  <Check className="size-8 text-emerald-500" strokeWidth={2.5} />
                </div>
                <CardTitle className="text-xl">Đặt tour thành công!</CardTitle>
                <CardDescription>
                  Vui lòng hoàn tất thanh toán để giữ chỗ của bạn
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Booking code */}
                <div className="rounded-lg bg-muted px-5 py-4">
                  <p className="text-xs text-muted-foreground mb-1">Mã đặt chỗ</p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                    {bookingResult.bookingCode}
                  </p>
                </div>

                {/* Summary */}
                <div className="rounded-lg border px-4 py-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Tour</span>
                    <span className="font-medium text-right leading-snug line-clamp-2 max-w-[60%]">
                      {tour.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khách</span>
                    <span>{adults} người lớn{children > 0 && ` + ${children} trẻ em`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Tổng thanh toán</span>
                    <span className="text-accent">{formatCurrency(bookingResult.totalPrice)}</span>
                  </div>
                </div>

                {/* VNPay button */}
                <Button
                  className="w-full h-12 text-[15px] font-bold gap-2"
                  onClick={() => paymentMutation.mutate(bookingResult.id)}
                  disabled={paymentMutation.isPending}
                  style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)' }}
                >
                  {paymentMutation.isPending
                    ? <Loader2 size={18} className="animate-spin" />
                    : <CreditCard size={18} />
                  }
                  Thanh toán qua VNPay
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn.
                  <br />Chỗ đặt sẽ được giữ trong <strong>15 phút</strong>.
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => navigate('/my-bookings')}
                >
                  Thanh toán sau — xem đơn hàng
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
