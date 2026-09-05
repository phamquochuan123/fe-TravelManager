import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Home, ShoppingBag, Loader2 } from 'lucide-react'
import api from '@/api/axiosInstance'
import { formatCurrency } from '@/lib/utils'

interface PaymentResultData {
  success: boolean
  message: string
  amount: number
  transactionCode: string
}

export default function PaymentResultPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const [result,  setResult]  = useState<PaymentResultData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/payment/result${location.search}`)
      .then(r => setResult(r.data))
      .catch(() => setResult({
        success: false,
        message: 'Không thể xác nhận giao dịch. Vui lòng liên hệ hỗ trợ.',
        amount: 0,
        transactionCode: '',
      }))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#f8f5ee]"
        style={{ fontFamily: 'var(--font-sans)' }}>
        <div className="w-14 h-14 flex items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}>
          <Loader2 size={28} className="text-white animate-spin" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Đang xác nhận thanh toán...</p>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-6"
        style={{ fontFamily: 'var(--font-sans)' }}>
        <div className="bg-white rounded-sm max-w-md w-full p-10 text-center"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(16,185,129,0.15)' }}>

          {/* Animated success icon */}
          <div className="mx-auto mb-7 flex w-24 h-24 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 10px 30px rgba(16,185,129,0.4)' }}>
            <CheckCircle size={48} className="text-white" strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2">Thanh toán thành công!</h1>
          <p className="text-gray-400 text-sm mb-7">Giao dịch của bạn đã được xác nhận</p>

          {(result.amount > 0 || result.transactionCode) && (
            <div className="rounded px-5 py-4 mb-7 text-left space-y-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              {result.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Số tiền</span>
                  <span className="font-black text-emerald-600">{formatCurrency(result.amount)}</span>
                </div>
              )}
              {result.transactionCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Mã giao dịch</span>
                  <span className="font-mono font-bold text-gray-900">{result.transactionCode}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-[#0a1628] hover:text-[#0a1628] transition-all">
              <Home size={15} /> Về trang chủ
            </button>
            <button
              onClick={() => navigate('/my-orders')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}>
              <ShoppingBag size={15} /> Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-6"
      style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="bg-white rounded-sm max-w-md w-full p-10 text-center"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid rgba(239,68,68,0.15)' }}>

        <div className="mx-auto mb-7 flex w-24 h-24 items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 10px 30px rgba(239,68,68,0.35)' }}>
          <XCircle size={48} className="text-white" strokeWidth={2} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-400 text-sm mb-7 leading-relaxed">
          {result?.message || 'Giao dịch không thành công. Vui lòng thử lại.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 rounded border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-red-400 hover:text-red-500 transition-all">
            Thử lại
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}>
            <Home size={15} /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}
