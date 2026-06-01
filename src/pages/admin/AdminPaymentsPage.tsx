import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  CheckCircle, Clock, XCircle, RotateCcw,
  CreditCard, RefreshCw, Search, X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import api from '../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
type OrderType     = 'TOUR_BOOKING' | 'HOTEL_BOOKING' | 'RESTAURANT_BOOKING'

interface Payment {
  id: number
  transactionCode: string
  amount: number
  status: PaymentStatus
  method: string
  createdAt: string
  orderType: OrderType
  orderId: number
  orderDesc?: string
  customerName?: string
  customerEmail?: string
}

interface PaymentPage {
  content: Payment[]
  totalPages: number
  totalElements: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PaymentStatus, { label: string; cls: string; icon: React.ElementType }> = {
  SUCCESS:  { label: 'Thành công', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  PENDING:  { label: 'Đang xử lý', cls: 'bg-amber-100  text-amber-700',   icon: Clock       },
  FAILED:   { label: 'Thất bại',   cls: 'bg-red-100    text-red-600',     icon: XCircle     },
  REFUNDED: { label: 'Hoàn tiền',  cls: 'bg-gray-100   text-gray-600',    icon: RotateCcw   },
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  TOUR_BOOKING:       'Tour',
  HOTEL_BOOKING:      'Khách sạn',
  RESTAURANT_BOOKING: 'Nhà hàng',
}

const ORDER_TYPE_CLS: Record<string, string> = {
  TOUR_BOOKING:       'bg-blue-100 text-blue-700',
  HOTEL_BOOKING:      'bg-purple-100 text-purple-700',
  RESTAURANT_BOOKING: 'bg-orange-100 text-orange-700',
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const PAGE_SIZE = 15

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [page,           setPage]           = useState(0)
  const [searchInput,    setSearchInput]    = useState('')
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState<PaymentStatus | ''>('')
  const [orderTypeFilter,setOrderTypeFilter]= useState<OrderType | ''>('')

  const params = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
    ...(search       ? { search }             : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(orderTypeFilter ? { orderType: orderTypeFilter } : {}),
  }).toString()

  const { data, isLoading, refetch, isFetching } = useQuery<PaymentPage>({
    queryKey: ['admin', 'payments', params],
    queryFn: () => api.get(`/payment/admin/payments?${params}`).then(r => r.data),
    placeholderData: prev => prev,
  })

  const payments     = data?.content ?? []
  const totalPages   = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(0)
  }

  const clearFilters = () => {
    setSearch(''); setSearchInput('')
    setStatusFilter(''); setOrderTypeFilter('')
    setPage(0)
  }

  const hasFilters = !!search || !!statusFilter || !!orderTypeFilter

  // KPI tính từ dữ liệu hiện tại (trang này)
  const successCount = payments.filter(p => p.status === 'SUCCESS').length
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const failedCount  = payments.filter(p => p.status === 'FAILED').length
  const totalRevenue = payments.filter(p => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 space-y-5" >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý thanh toán</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalElements.toLocaleString('vi-VN')} giao dịch</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Tải lại
        </Button>
      </div>

      {/* KPI summary (trang hiện tại) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Thành công',   value: successCount, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Đang xử lý',  value: pendingCount, color: '#ca8a04', bg: '#fef9c3' },
          { label: 'Thất bại',    value: failedCount,  color: '#dc2626', bg: '#fee2e2' },
          { label: 'Doanh thu (trang)', value: fmtVND(totalRevenue), color: '#0a1628', bg: '#eaf4fb' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded border p-4">
            <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Mã GD, email KH..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="text-sm"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search size={14} />
          </Button>
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as PaymentStatus | ''); setPage(0) }}
          className="border border-gray-200 rounded px-3 py-2 text-xs font-medium focus:outline-none bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STATUS_CONFIG) as PaymentStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        <select
          value={orderTypeFilter}
          onChange={e => { setOrderTypeFilter(e.target.value as OrderType | ''); setPage(0) }}
          className="border border-gray-200 rounded px-3 py-2 text-xs font-medium focus:outline-none bg-white"
        >
          <option value="">Tất cả dịch vụ</option>
          {(Object.keys(ORDER_TYPE_LABEL) as OrderType[]).map(t => (
            <option key={t} value={t}>{ORDER_TYPE_LABEL[t]}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-3 py-2 transition-colors"
          >
            <X size={12} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 rounded-full animate-spin border-primary/15 border-t-primary" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CreditCard size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-sm">Không có giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f5ee] border-b border-gray-100">
                  {['Mã GD', 'Khách hàng', 'Dịch vụ', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => {
                  const sc  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING
                  const Icon = sc.icon
                  const otCls = ORDER_TYPE_CLS[p.orderType] ?? 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={p.id} className="hover:bg-[#f8f5ee] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                        {p.transactionCode || `#${p.id}`}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-xs">{p.customerName || '—'}</p>
                        <p className="text-gray-400 text-xs">{p.customerEmail || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${otCls}`}>
                          {ORDER_TYPE_LABEL[p.orderType] ?? p.orderType}
                        </span>
                        {p.orderDesc && (
                          <p className="text-xs text-gray-500 mt-0.5 max-w-[160px] truncate">{p.orderDesc}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-accent">
                        {fmtVND(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.method || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sc.cls}`}>
                          <Icon size={11} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {p.createdAt ? dayjs(p.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Trang {page + 1}/{totalPages} — {totalElements.toLocaleString('vi-VN')} giao dịch
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40"
              >
                ← Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const offset = Math.max(0, Math.min(page - 2, totalPages - 5))
                const pg = offset + i
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      pg === page
                        ? 'text-white border-transparent'
                        : 'border-gray-200 hover:bg-[#f8f5ee]'
                    }`}
                    style={pg === page ? { backgroundColor: '#0a1628' } : undefined}
                  >
                    {pg + 1}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-[#f8f5ee] disabled:opacity-40"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
