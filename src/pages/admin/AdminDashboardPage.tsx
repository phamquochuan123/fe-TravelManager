import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import {
  TrendingUp, TrendingDown,
  AlertTriangle, ArrowRight, ChevronDown,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Skeleton } from '../../components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverviewStats {
  totalUsers?: number
  totalTours?: number
  totalHotels?: number
  totalRestaurants?: number
  monthlyRevenue?: number
  previousMonthRevenue?: number
  todayOrders?: number
  todayTourOrders?: number
  todayHotelOrders?: number
  todayRestaurantOrders?: number
  newUsersThisMonth?: number
  previousMonthUsers?: number
  activeTours?: number
  totalDepartures?: number
  tourBookingsByStatus?: Record<string, number>
  restaurantBookingsByStatus?: Record<string, number>
  totalHotelBookings?: number
  openIncidentsCount?: number
}

interface MonthlyPoint { month: string; revenue: number; orders: number }
interface TopTour { id: number; name: string; bookings: number; revenue: number }
interface RecentOrder {
  id: string | number
  customerName: string
  serviceType: string
  serviceName: string
  amount: number
  status: string
  createdAt: string
}

interface MetricItem {
  label: string
  display: string
  trend?: number | null
  sub?: string
  accent?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_MONTHLY: MonthlyPoint[] = [
  { month: 'T1',  revenue: 42_000_000,  orders: 18 },
  { month: 'T2',  revenue: 38_500_000,  orders: 15 },
  { month: 'T3',  revenue: 55_200_000,  orders: 24 },
  { month: 'T4',  revenue: 67_800_000,  orders: 29 },
  { month: 'T5',  revenue: 78_100_000,  orders: 35 },
  { month: 'T6',  revenue: 92_300_000,  orders: 42 },
  { month: 'T7',  revenue: 105_000_000, orders: 48 },
  { month: 'T8',  revenue: 98_500_000,  orders: 44 },
  { month: 'T9',  revenue: 85_200_000,  orders: 38 },
  { month: 'T10', revenue: 72_400_000,  orders: 32 },
  { month: 'T11', revenue: 68_900_000,  orders: 30 },
  { month: 'T12', revenue: 89_600_000,  orders: 40 },
]

const DEMO_TOP_TOURS: TopTour[] = [
  { id: 1, name: 'Tour Đà Nẵng – Hội An 3N2Đ', bookings: 48, revenue: 96_000_000 },
  { id: 2, name: 'Tour Phú Quốc 4N3Đ',          bookings: 35, revenue: 87_500_000 },
  { id: 3, name: 'Tour Hạ Long Bay 2N1Đ',        bookings: 30, revenue: 54_000_000 },
  { id: 4, name: 'Tour Sapa Trekking 3N2Đ',      bookings: 25, revenue: 47_500_000 },
  { id: 5, name: 'Tour Mũi Né – Phan Thiết',     bookings: 22, revenue: 39_600_000 },
]

const ORDER_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Chờ duyệt',    cls: 'bg-amber-100 text-amber-700'   },
  CONFIRMED:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-blue-700'     },
  IN_PROGRESS: { label: 'Đang diễn ra', cls: 'bg-purple-100 text-purple-700' },
  COMPLETED:   { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700'   },
  CANCELLED:   { label: 'Đã hủy',       cls: 'bg-red-100 text-red-600'       },
  PAID:        { label: 'Đã thanh toán',cls: 'bg-teal-100 text-teal-700'     },
}

const PIE_COLORS = ['#1a5276', '#e67e22', '#16a085']
const RANK_COLORS = ['#e67e22', '#94a3b8', '#b45309', '#1a5276', '#64748b']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M₫`
    : `${n.toLocaleString('vi-VN')}₫`

const fmtRevenueFull = (n: number) =>
  n.toLocaleString('vi-VN') + '₫'

const trendPct = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null

const spinner = (
  <span
    className="w-7 h-7 border-2 rounded-full animate-spin"
    style={{ borderColor: 'oklch(0.355 0.093 233 / 15%)', borderTopColor: 'oklch(0.355 0.093 233)' }}
  />
)

// ─── MetricStrip ──────────────────────────────────────────────────────────────

interface MetricStripProps {
  monthlyRevenue: number
  todayOrders: number
  newUsers: number
  activeTours: number
  revenueTrend: number | null
  userTrend: number | null
  todaySub?: string
  totalDepartures?: number
  loading: boolean
}

const MetricStrip = ({
  monthlyRevenue, todayOrders, newUsers, activeTours,
  revenueTrend, userTrend, todaySub, totalDepartures, loading,
}: MetricStripProps) => {
  const items: MetricItem[] = [
    {
      label: 'Doanh thu tháng này',
      display: fmtVND(monthlyRevenue),
      trend: revenueTrend,
      sub: revenueTrend != null ? 'so với tháng trước' : undefined,
      accent: true,
    },
    {
      label: 'Đơn hàng hôm nay',
      display: todayOrders.toLocaleString('vi-VN'),
      sub: todaySub,
    },
    {
      label: 'Khách hàng mới tháng này',
      display: newUsers.toLocaleString('vi-VN'),
      trend: userTrend,
      sub: userTrend != null ? 'so với tháng trước' : undefined,
    },
    {
      label: 'Tour đang hoạt động',
      display: activeTours.toLocaleString('vi-VN'),
      sub: totalDepartures ? `${totalDepartures} lịch khởi hành` : undefined,
    },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl">
      <div className="overflow-x-auto">
        <div className="flex items-stretch min-w-[560px] divide-x divide-border px-8 py-6">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`flex-1 min-w-0 ${i > 0 ? 'pl-8' : ''} ${i < items.length - 1 ? 'pr-8' : ''}`}
            >
              {loading ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className={`text-[32px] font-black leading-none tabular-nums tracking-tight ${
                      item.accent ? 'text-primary' : 'text-foreground'
                    }`}>
                      {item.display}
                    </p>
                    {item.trend != null && (
                      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        item.trend >= 0
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {item.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(item.trend)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-snug">{item.label}</p>
                  {item.sub && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">{item.sub}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

const RevenueChart = ({ data, loading }: { data: MonthlyPoint[]; loading: boolean }) => {
  const [year, setYear] = useState(new Date().getFullYear())
  const years = [year - 1, year, year + 1].filter(y => y <= new Date().getFullYear())

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs min-w-[160px]">
        <p className="font-bold text-foreground mb-2">Tháng {label?.replace('T', '')}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
            <span className="font-bold text-foreground">
              {p.dataKey === 'revenue' ? fmtVND(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-foreground text-sm">Doanh thu theo tháng</h3>
          <p className="text-muted-foreground text-xs mt-0.5">Tổng doanh thu & số đơn hàng</p>
        </div>
        <div className="relative">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="appearance-none border border-border rounded-xl text-sm px-3 py-1.5 pr-7 font-medium focus:outline-none bg-card text-foreground"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="h-60 flex items-center justify-center">{spinner}</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1a5276" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1a5276" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e67e22" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#e67e22" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="revenue" orientation="left"
              tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`}
              tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={38} />
            <YAxis yAxisId="orders" orientation="right"
              tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Doanh thu"
              stroke="#1a5276" strokeWidth={2.5} fill="url(#revenueGrad)"
              dot={false} activeDot={{ r: 4, fill: '#1a5276' }} />
            <Area yAxisId="orders" type="monotone" dataKey="orders" name="Số đơn"
              stroke="#e67e22" strokeWidth={2} fill="url(#ordersGrad)"
              dot={false} activeDot={{ r: 4, fill: '#e67e22' }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────

interface PieSegment { name: string; value: number; pct: number; color: string }

const OrderPieChart = ({ data, loading }: { data: PieSegment[]; loading: boolean }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-xl shadow-xl p-3 text-xs">
        <p className="font-bold text-foreground">{d.name}</p>
        <p className="text-muted-foreground mt-0.5">{d.value.toLocaleString('vi-VN')} đơn</p>
        <p className="font-bold mt-0.5" style={{ color: d.color }}>{d.pct}%</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 h-full">
      <div className="mb-4">
        <h3 className="font-bold text-foreground text-sm">Phân loại đơn hàng</h3>
        <p className="text-muted-foreground text-xs mt-0.5">Tỉ lệ theo dịch vụ</p>
      </div>

      {loading || data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-3">
          {loading ? spinner : <p className="text-muted-foreground text-sm">Chưa có dữ liệu</p>}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                paddingAngle={3} dataKey="value" isAnimationActive
                animationBegin={200} animationDuration={900}>
                {data.map((d, i) => (
                  <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-2 mt-3">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{d.value.toLocaleString()}</span>
                  <span className="font-bold text-foreground w-10 text-right">{d.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Latest Orders Table ──────────────────────────────────────────────────────

const LatestOrdersTable = ({ orders, loading }: { orders: RecentOrder[]; loading: boolean }) => {
  const navigate = useNavigate()

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-bold text-foreground text-sm">Đơn hàng mới nhất</h3>
        <button
          onClick={() => navigate('/admin/orders/tours')}
          className="flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-70"
        >
          Xem tất cả <ArrowRight size={13} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Dịch vụ</TableHead>
              <TableHead className="text-right">Tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 rounded w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : orders.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10 text-sm">
                    Chưa có đơn hàng
                  </TableCell>
                </TableRow>
              )
              : orders.map(order => {
                  const cfg = ORDER_STATUS_CONFIG[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-500' }
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50 transition-colors cursor-default">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(order.id).slice(-6).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground text-sm max-w-[120px] truncate">
                        {order.customerName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium text-foreground truncate max-w-[140px]">{order.serviceName}</p>
                          <p className="text-[10px] text-muted-foreground">{order.serviceType}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-primary">
                        {fmtRevenueFull(order.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {dayjs(order.createdAt).format('HH:mm DD/MM')}
                      </TableCell>
                    </TableRow>
                  )
                })
            }
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Top Tours ────────────────────────────────────────────────────────────────

const TopToursList = ({ tours, loading }: { tours: TopTour[]; loading: boolean }) => {
  const maxBookings = tours[0]?.bookings ?? 1

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-bold text-foreground text-sm">Top tour bán chạy</h3>
        <p className="text-muted-foreground text-xs mt-0.5">Dựa theo số lượng đặt chỗ</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 rounded w-3/4" />
                <Skeleton className="h-2 rounded w-full" />
              </div>
              <Skeleton className="w-14 h-3 rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {tours.map((tour, i) => {
            const pct = Math.round((tour.bookings / maxBookings) * 100)
            return (
              <div key={tour.id} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ backgroundColor: RANK_COLORS[i] ?? '#64748b' }}
                >
                  {i + 1}
                </span>
                <img
                  src={`https://picsum.photos/seed/tour-${tour.id}/64/64`}
                  alt={tour.name}
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{tour.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: RANK_COLORS[i] ?? '#64748b' }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{tour.bookings} đặt</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground shrink-0 text-right">
                  {fmtVND(tour.revenue)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Incident Alert ───────────────────────────────────────────────────────────

const IncidentAlert = ({ count }: { count: number }) => {
  const navigate = useNavigate()
  if (!count) return null
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 mb-6">
      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
        <AlertTriangle size={18} className="text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-red-800 text-sm">{count} sự cố chưa được xử lý</p>
        <p className="text-red-500 text-xs mt-0.5">
          Vui lòng kiểm tra và xử lý sớm để đảm bảo chất lượng dịch vụ
        </p>
      </div>
      <button
        onClick={() => navigate('/admin/analytics')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0"
      >
        Xem chi tiết <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminDashboardPage = () => {
  const user = useAuthStore(s => s.user)

  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const dateStr  = dayjs().locale('vi').format('dddd, DD/MM/YYYY')

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: stats, isLoading: statsLoading } = useQuery<OverviewStats>({
    queryKey: ['admin', 'stats-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/statistics/overview')
      return res.data
    },
    retry: false,
  })

  const currentYear = new Date().getFullYear()

  const { data: rawMonthly, isLoading: chartLoading } = useQuery<MonthlyPoint[]>({
    queryKey: ['admin', 'revenue', currentYear],
    queryFn: async () => {
      try {
        const res = await api.get(`/admin/statistics/revenue?year=${currentYear}`)
        return res.data
      } catch {
        return DEMO_MONTHLY
      }
    },
  })
  const monthlyData = rawMonthly ?? DEMO_MONTHLY

  const { data: rawTopTours, isLoading: topLoading } = useQuery<TopTour[]>({
    queryKey: ['admin', 'top-tours'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/statistics/top-tours')
        return res.data
      } catch {
        return DEMO_TOP_TOURS
      }
    },
  })
  const topTours = rawTopTours ?? DEMO_TOP_TOURS

  const { data: rawOrders, isLoading: ordersLoading } = useQuery<RecentOrder[]>({
    queryKey: ['admin', 'recent-orders'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/recent-orders')
        return res.data
      } catch {
        return []
      }
    },
  })
  const recentOrders = rawOrders ?? []

  // ── Derived values ────────────────────────────────────────────────────────

  const pieData = useMemo<PieSegment[]>(() => {
    if (!stats) return []
    const tourTotal  = Object.values(stats.tourBookingsByStatus  ?? {}).reduce((a, b) => a + b, 0)
    const hotelTotal = stats.totalHotelBookings ?? 0
    const restTotal  = Object.values(stats.restaurantBookingsByStatus ?? {}).reduce((a, b) => a + b, 0)
    const total      = tourTotal + hotelTotal + restTotal
    if (!total) return []
    return [
      { name: 'Tour',  value: tourTotal,  pct: Math.round((tourTotal  / total) * 100), color: PIE_COLORS[0] },
      { name: 'Phòng', value: hotelTotal, pct: Math.round((hotelTotal / total) * 100), color: PIE_COLORS[1] },
      { name: 'Bàn',   value: restTotal,  pct: Math.round((restTotal  / total) * 100), color: PIE_COLORS[2] },
    ]
  }, [stats])

  const openIncidents   = stats?.openIncidentsCount ?? 0
  const monthlyRevenue  = stats?.monthlyRevenue ?? monthlyData[dayjs().month()]?.revenue ?? 0
  const prevMonthRev    = stats?.previousMonthRevenue ?? monthlyData[Math.max(0, dayjs().month() - 1)]?.revenue ?? 0
  const revenueTrend    = trendPct(monthlyRevenue, prevMonthRev)
  const todayOrders     = stats?.todayOrders ?? 0
  const newUsers        = stats?.newUsersThisMonth ?? 0
  const userTrend       = trendPct(newUsers, stats?.previousMonthUsers ?? 0)
  const activeTours     = stats?.activeTours ?? stats?.totalTours ?? 0
  const totalDepartures = stats?.totalDepartures ?? 0

  const todaySub = stats?.todayTourOrders != null
    ? `${stats.todayTourOrders} tour · ${stats.todayHotelOrders ?? 0} phòng · ${stats.todayRestaurantOrders ?? 0} bàn`
    : undefined

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* ── Incident Alert ────────────────────────────────── */}
      <IncidentAlert count={openIncidents} />

      {/* ── Greeting ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-foreground">
          {greeting}, {user?.name?.split(' ').pop() ?? 'Admin'}!
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5 capitalize">{dateStr}</p>
      </div>

      {/* ── Metric strip ──────────────────────────────────── */}
      <MetricStrip
        monthlyRevenue={monthlyRevenue}
        todayOrders={todayOrders}
        newUsers={newUsers}
        activeTours={activeTours}
        revenueTrend={revenueTrend}
        userTrend={userTrend}
        todaySub={todaySub}
        totalDepartures={totalDepartures}
        loading={statsLoading}
      />

      {/* ── Charts row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        <RevenueChart data={monthlyData} loading={chartLoading} />
        <OrderPieChart data={pieData} loading={statsLoading} />
      </div>

      {/* ── Bottom row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        <LatestOrdersTable orders={recentOrders} loading={ordersLoading} />
        <TopToursList tours={topTours} loading={topLoading} />
      </div>
    </div>
  )
}

export default AdminDashboardPage
