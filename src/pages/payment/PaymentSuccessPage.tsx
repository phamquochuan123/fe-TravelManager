import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Calendar, Hash, Building2, Receipt, Home, ClipboardList } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
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

  const state = location.state as PaymentState | null

  const txnRef        = state?.txnRef        ?? searchParams.get('vnp_TxnRef')        ?? '–'
  const amount        = state?.amount        ?? (Number(searchParams.get('vnp_Amount') ?? '0') / 100)
  const transactionNo = state?.transactionNo ?? searchParams.get('vnp_TransactionNo') ?? null
  const bankCode      = state?.bankCode      ?? searchParams.get('vnp_BankCode')      ?? null
  const payDate       = state?.payDate       ?? searchParams.get('vnp_PayDate')       ?? null
  const bookingType   = state?.bookingType   ?? null

  const rows = [
    { icon: Hash,      label: 'Mã đặt chỗ',           value: txnRef,                       mono: true  },
    { icon: Receipt,   label: 'Mã giao dịch VNPay',    value: transactionNo,                mono: true  },
    { icon: Building2, label: 'Ngân hàng',              value: bankCode,                     mono: false },
    { icon: Calendar,  label: 'Thời gian thanh toán',   value: parseVNPayDate(payDate ?? undefined), mono: false },
  ].filter(r => r.value && r.value !== '–')

  return (
    <div className="min-h-screen bg-[#f8f5ee]" style={{ fontFamily: 'var(--font-sans)' }}>
      <Navbar />

      {/* Hero */}
      <div
        className="relative overflow-hidden pt-28 pb-20 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #0a1929 0%, #059669 60%, #0a1929 100%)' }}
      >
        <div className="absolute -bottom-1 left-0 right-0 h-14 bg-[#f8f5ee]"
          style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />

        {/* Animated success ring */}
        <div className="mx-auto mb-6 relative w-24 h-24">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
            <CheckCircle2 size={44} className="text-white" strokeWidth={2} />
          </div>
        </div>

        <h1 className="font-black text-white text-3xl tracking-tight mb-2">Thanh toán thành công!</h1>
        <p className="text-white/60 text-sm">Cảm ơn bạn đã đặt dịch vụ tại TravelVN</p>
      </div>

      <main className="max-w-lg mx-auto px-6 pb-16 -mt-4 relative z-10">
        <div className="rounded-sm bg-white border border-gray-100"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

          {/* Amount */}
          <div className="px-7 pt-7 pb-6 border-b border-gray-100 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Số tiền đã thanh toán</p>
            <p className="font-black leading-none mb-3" style={{ fontSize: '2.5rem', color: '#059669' }}>
              {amount ? formatCurrency(amount) : '–'}
            </p>
            {bookingType && (
              <span className="inline-block text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
                {BOOKING_TYPE_LABEL[bookingType] ?? bookingType}
              </span>
            )}
          </div>

          {/* Transaction details */}
          {rows.length > 0 && (
            <div className="px-7 py-5 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Chi tiết giao dịch
              </p>
              <div className="space-y-3">
                {rows.map(({ icon: Icon, label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400 shrink-0">
                      <Icon size={13} style={{ color: '#0a1628' }} />
                      <span>{label}</span>
                    </div>
                    <span className={`text-right ${mono ? 'font-mono font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="px-7 py-5 border-b border-gray-100">
            <p className="text-xs text-center text-gray-400 leading-relaxed">
              Booking của bạn đã được xác nhận.<br />
              Kiểm tra mục <strong className="text-gray-700">Đơn hàng của tôi</strong> để xem chi tiết.
            </p>
          </div>

          {/* Actions */}
          <div className="px-7 py-6 flex flex-col gap-3">
            <button
              className="w-full flex items-center justify-center gap-2 py-4 rounded text-white font-black transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => navigate('/my-bookings')}
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}>
              <ClipboardList size={16} /> Xem đơn hàng của tôi
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition-all"
              onClick={() => navigate('/')}>
              <Home size={15} /> Về trang chủ
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
