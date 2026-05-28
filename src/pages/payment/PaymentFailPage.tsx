import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { XCircle, RefreshCw, Home, Hash, AlertCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FailState {
  txnRef?: string
  responseCode?: string
  transactionNo?: string
}

// ─── VNPay error map ──────────────────────────────────────────────────────────

const VNP_MESSAGES: Record<string, string> = {
  '07': 'Giao dịch bị nghi ngờ gian lận và đã bị từ chối.',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
  '11': 'Đã hết thời gian chờ thanh toán. Vui lòng thử lại.',
  '12': 'Thẻ/Tài khoản bị khóa tạm thời.',
  '13': 'Sai mật khẩu xác thực OTP. Vui lòng thử lại.',
  '24': 'Bạn đã hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang tạm thời bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần cho phép.',
  '99': 'Giao dịch không thành công. Vui lòng thử lại sau.',
}

function getErrorMessage(code?: string | null): string {
  if (!code) return 'Giao dịch không thành công. Vui lòng thử lại.'
  return VNP_MESSAGES[code] ?? `Giao dịch thất bại (mã lỗi: ${code}).`
}

function isMoneyNotCharged(code?: string | null): boolean {
  // These codes mean the transaction failed before money was debited
  return ['11', '12', '24', '51', '65', '75', '99'].includes(code ?? '')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentFailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const state = location.state as FailState | null

  const responseCode  = state?.responseCode  ?? searchParams.get('vnp_ResponseCode') ?? null
  const txnRef        = state?.txnRef        ?? searchParams.get('vnp_TxnRef')       ?? null
  const transactionNo = state?.transactionNo ?? searchParams.get('vnp_TransactionNo') ?? null

  const errorMessage  = getErrorMessage(responseCode)
  const moneyNotLost  = isMoneyNotCharged(responseCode)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />

      {/* Hero strip */}
      <div className="py-14 px-4 text-center bg-gradient-to-br from-red-600 to-rose-500 text-white">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25">
          <XCircle className="size-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Thanh toán thất bại</h1>
        <p className="mt-2 text-sm text-white/75">Giao dịch của bạn không thể hoàn tất</p>
      </div>

      <main className="max-w-lg mx-auto px-4 -mt-6 pb-16 relative z-10">
        <Card className="shadow-lg">
          <CardContent className="pt-6 space-y-5">

            {/* Error message */}
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-red-700 font-medium ml-1">
                {errorMessage}
              </AlertDescription>
            </Alert>

            {/* Money-safe notice */}
            {moneyNotLost && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold mb-0.5">Tài khoản không bị trừ tiền</p>
                <p className="text-xs text-amber-700">
                  Giao dịch này thất bại trước khi tiền được trừ. Số dư tài khoản của bạn không bị ảnh hưởng.
                </p>
              </div>
            )}

            {/* Transaction info */}
            {(txnRef || transactionNo) && (
              <>
                <Separator />
                <div className="space-y-3 text-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Thông tin giao dịch
                  </p>
                  {txnRef && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash size={14} />
                        <span>Mã đặt chỗ</span>
                      </div>
                      <span className="font-mono font-semibold">{txnRef}</span>
                    </div>
                  )}
                  {transactionNo && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash size={14} />
                        <span>Mã VNPay</span>
                      </div>
                      <span className="font-mono font-semibold">{transactionNo}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Nếu tiền đã bị trừ nhưng giao dịch vẫn thất bại, vui lòng liên hệ
              <br />
              <a
                href="mailto:support@travelvn.com"
                className="text-primary font-semibold hover:underline"
              >
                support@travelvn.com
              </a>{' '}
              kèm mã đặt chỗ để được hỗ trợ.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                className="w-full gap-2"
                onClick={() => navigate('/my-bookings')}
              >
                <RefreshCw size={16} />
                Thử thanh toán lại
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
