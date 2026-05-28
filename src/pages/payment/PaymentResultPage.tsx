import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Home, ShoppingBag } from 'lucide-react'
import api from '@/api/axiosInstance'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <span
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(26,82,118,0.2)', borderTopColor: '#1a5276' }}
        />
        <p className="text-sm font-medium">Đang xác nhận thanh toán...</p>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-center mb-5">
            <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="text-emerald-500" size={44} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Thanh toán thành công!</h1>
          <p className="text-muted-foreground text-sm mb-6">Giao dịch của bạn đã được xác nhận</p>

          {(result.amount > 0 || result.transactionCode) && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left space-y-2.5">
              {result.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-foreground">{formatCurrency(result.amount)}</span>
                </div>
              )}
              {result.transactionCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã giao dịch</span>
                  <span className="font-mono font-medium text-foreground">{result.transactionCode}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
              <Home size={15} />
              Về trang chủ
            </Button>
            <Button
              onClick={() => navigate('/my-orders')}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingBag size={15} />
              Xem đơn hàng
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-5">
          <div className="size-20 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="text-red-500" size={44} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Thanh toán thất bại</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {result?.message || 'Giao dịch không thành công. Vui lòng thử lại.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
            Thử lại
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home size={15} />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}
