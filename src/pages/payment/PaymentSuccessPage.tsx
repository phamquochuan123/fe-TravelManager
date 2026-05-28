import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Calendar, Hash, Building2, Receipt, Home, ClipboardList } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentState {
  txnRef?: string
  amount?: number
  transactionNo?: string
  bankCode?: string
  payDate?: string
  bookingType?: string
  responseCode?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVNPayDate(raw?: string): string {
  // Format from VNPay: YYYYMMDDHHmmss
  if (!raw || raw.length < 14) return '–'
  const y = raw.slice(0, 4), mo = raw.slice(4, 6), d = raw.slice(6, 8)
  const h = raw.slice(8, 10), mi = raw.slice(10, 12)
  return `${h}:${mi} – ${d}/${mo}/${y}`
}

const BOOKING_TYPE_LABEL: Record<string, string> = {
  TOUR:       'Tour du lịch',
  HOTEL:      'Đặt phòng',
  RESTAURANT: 'Đặt bàn nhà hàng',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Data can come from route state (after redirect from PaymentResult)
  // or fallback to URL params if user refreshes
  const state = location.state as PaymentState | null

  const txnRef       = state?.txnRef       ?? searchParams.get('vnp_TxnRef')       ?? '–'
  const amount       = state?.amount       ?? (Number(searchParams.get('vnp_Amount') ?? '0') / 100)
  const transactionNo = state?.transactionNo ?? searchParams.get('vnp_TransactionNo') ?? null
  const bankCode     = state?.bankCode     ?? searchParams.get('vnp_BankCode')     ?? null
  const payDate      = state?.payDate      ?? searchParams.get('vnp_PayDate')      ?? null
  const bookingType  = state?.bookingType  ?? null

  const rows = [
    { icon: Hash,         label: 'Mã đặt chỗ',       value: txnRef,                  mono: true  },
    { icon: Receipt,      label: 'Mã giao dịch VNPay', value: transactionNo,          mono: true  },
    { icon: Building2,    label: 'Ngân hàng',          value: bankCode,               mono: false },
    { icon: Calendar,     label: 'Thời gian thanh toán', value: parseVNPayDate(payDate ?? undefined), mono: false },
  ].filter(r => r.value && r.value !== '–')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />

      {/* Hero strip */}
      <div
        className="py-14 px-4 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)' }}
      >
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25">
          <CheckCircle2 className="size-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Thanh toán thành công!</h1>
        <p className="mt-2 text-sm text-white/75">Cảm ơn bạn đã đặt dịch vụ tại TravelVN</p>
      </div>

      <main className="max-w-lg mx-auto px-4 -mt-6 pb-16 relative z-10">
        <Card className="shadow-lg">
          <CardContent className="pt-6 space-y-5">

            {/* Amount – prominent */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Số tiền đã thanh toán</p>
              <p className="text-3xl font-black text-emerald-600">
                {amount ? formatCurrency(amount) : '–'}
              </p>
              {bookingType && (
                <Badge variant="success" className="mt-2">
                  {BOOKING_TYPE_LABEL[bookingType] ?? bookingType}
                </Badge>
              )}
            </div>

            {/* Transaction details */}
            {rows.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Chi tiết giao dịch
                  </p>
                  {rows.map(({ icon: Icon, label, value, mono }) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                        <Icon size={14} />
                        <span>{label}</span>
                      </div>
                      <span className={mono ? 'font-mono font-semibold text-foreground' : 'font-medium text-foreground text-right'}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Separator />

            {/* Success note */}
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Booking của bạn đã được xác nhận.
              <br />Kiểm tra mục <strong>Đơn hàng của tôi</strong> để xem chi tiết.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                className="w-full gap-2"
                onClick={() => navigate('/my-bookings')}
              >
                <ClipboardList size={16} />
                Xem đơn hàng của tôi
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate('/')}
              >
                <Home size={16} />
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
