import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle, Clock, XCircle, RotateCcw, CreditCard, Receipt,
} from 'lucide-react'
import dayjs from 'dayjs'
import api from '@/api/axiosInstance'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

interface Payment {
  id: number
  transactionCode: string
  amount: number
  status: PaymentStatus
  method: string
  createdAt: string
  orderType: string
  orderId: number
  orderDesc: string
}

interface PaymentPage {
  content: Payment[]
  totalPages: number
  totalElements: number
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  SUCCESS:  { label: 'Thành công', icon: CheckCircle, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  PENDING:  { label: 'Đang xử lý', icon: Clock,       cls: 'text-amber-600  bg-amber-50  border-amber-200'   },
  FAILED:   { label: 'Thất bại',   icon: XCircle,     cls: 'text-red-600    bg-red-50    border-red-200'     },
  REFUNDED: { label: 'Hoàn tiền',  icon: RotateCcw,   cls: 'text-gray-600   bg-gray-50   border-gray-200'   },
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.cls)}>
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

function orderTypeLabel(type: string): string {
  const map: Record<string, string> = {
    TOUR_BOOKING:       'Đặt tour',
    HOTEL_BOOKING:      'Đặt phòng',
    RESTAURANT_BOOKING: 'Đặt nhà hàng',
  }
  return map[type] ?? type ?? '—'
}

const PAGE_SIZE = 10

export default function PaymentHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page') ?? '0'))

  const { data, isLoading } = useQuery<PaymentPage>({
    queryKey: ['payment-history', page],
    queryFn: () =>
      api.get('/payment/my', { params: { page, size: PAGE_SIZE } }).then(r => r.data),
    staleTime: 30_000,
  })

  const payments = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  const goTo = (pg: number) => setSearchParams({ page: String(pg) })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="text-primary" size={22} />
            Lịch sử thanh toán
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh sách các giao dịch thanh toán của bạn
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Receipt size={48} className="mb-4 opacity-30" />
              <p className="font-medium">Chưa có giao dịch nào</p>
              <p className="text-sm mt-1">Các giao dịch thanh toán sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Mã GD</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Mô tả</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Số tiền</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Phương thức</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Trạng thái</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {p.transactionCode ?? '—'}
                        </td>
                        <td className="px-5 py-4 text-foreground max-w-xs">
                          <span className="line-clamp-2">
                            {p.orderDesc || orderTypeLabel(p.orderType)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {p.method ?? '—'}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-xs">
                          {p.createdAt ? dayjs(p.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Trang {page + 1} / {totalPages}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      disabled={page === 0}
                      onClick={() => goTo(page - 1)}
                      className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Trước
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const offset = Math.max(0, Math.min(page - 2, totalPages - 5))
                      const pg = offset + i
                      return (
                        <button
                          key={pg}
                          onClick={() => goTo(pg)}
                          className={cn(
                            'px-3 py-1.5 text-sm rounded-md border transition-colors',
                            pg === page
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:bg-muted',
                          )}
                        >
                          {pg + 1}
                        </button>
                      )
                    })}
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => goTo(page + 1)}
                      className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
