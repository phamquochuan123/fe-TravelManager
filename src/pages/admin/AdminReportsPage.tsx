import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  TrendingUp, Users, ShoppingCart, DollarSign,
  Download, RefreshCw, FileSpreadsheet, FileText, ChevronDown, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import axiosInstance from '@/api/axiosInstance'

// ─── Types ───────────────────────────────────────────────────────────────────
interface KpiData {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  avgOrderValue: number
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
  avgOrderGrowth: number
}

interface RevenuePoint { date: string; tours: number; hotels: number; restaurants: number }
interface ServiceBarPoint { name: string; tours: number; hotels: number; restaurants: number }
interface PiePoint { name: string; value: number }
interface TopTour { id: number; name: string; bookings: number; revenue: number }
interface TopCustomer { id: number; name: string; bookings: number; totalSpent: number }

interface ReportData {
  kpi: KpiData
  revenueTimeline: RevenuePoint[]
  serviceBreakdown: ServiceBarPoint[]
  servicePie: PiePoint[]
  topTours: TopTour[]
  topCustomers: TopCustomer[]
}

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  tours: '#1a5276',
  hotels: '#8e44ad',
  restaurants: '#e67e22',
  pie: ['#1a5276', '#e67e22', '#8e44ad', '#27ae60', '#e74c3c']
}

// ─── Date presets ─────────────────────────────────────────────────────────────
const PRESETS = [
  { label: '7 ngày qua', value: '7d' },
  { label: '30 ngày qua', value: '30d' },
  { label: 'Quý này', value: 'quarter' },
  { label: 'Năm nay', value: 'year' },
  { label: 'Tùy chỉnh', value: 'custom' }
]

function getDateRange(preset: string): { from: string; to: string } {
  const now = dayjs()
  switch (preset) {
    case '7d':
      return { from: now.subtract(6, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    case '30d':
      return { from: now.subtract(29, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    case 'quarter':
      return { from: now.startOf('quarter').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    case 'year':
      return { from: now.startOf('year').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    default:
      return { from: now.subtract(29, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, growth, icon: Icon, format = 'number', color
}: {
  title: string
  value: number
  growth: number
  icon: React.ElementType
  format?: 'number' | 'currency' | 'count'
  color: string
}) {
  const formatted = format === 'currency'
    ? new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value) + ' ₫'
    : format === 'count'
    ? value.toLocaleString('vi-VN')
    : new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

  const isPositive = growth >= 0

  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{formatted}</p>
      <div className="flex items-center gap-1">
        <Badge
          className={`text-xs border-0 ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
        </Badge>
        <span className="text-xs text-gray-400">so với kỳ trước</span>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(p.value)}₫
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [preset, setPreset] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingXlsx, setExportingXlsx] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const downloadExport = useCallback(async (path: string, filename: string) => {
    setIsExporting(true)
    try {
      const res = await axiosInstance.get(path, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      Object.assign(document.createElement('a'), { href: url, download: filename }).click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Xuất báo cáo thất bại')
    } finally {
      setIsExporting(false)
    }
  }, [])

  const { from, to } = preset === 'custom'
    ? { from: customFrom || getDateRange('30d').from, to: customTo || getDateRange('30d').to }
    : getDateRange(preset)

  const { data, isLoading, refetch, isFetching } = useQuery<ReportData>({
    queryKey: ['admin-reports', from, to],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/reports', { params: { from, to } })
      return res.data
    },
    enabled: !!from && !!to
  })

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])
      if (!reportRef.current) return
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const ratio = canvas.width / canvas.height
      const imgW = pageW - 20
      const imgH = imgW / ratio
      let y = 10
      let heightLeft = imgH
      pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH)
      heightLeft -= pageH - 20
      while (heightLeft > 0) {
        y = heightLeft - imgH + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH)
        heightLeft -= pageH - 20
      }
      pdf.save(`bao-cao-${from}-${to}.pdf`)
      toast.success('Đã xuất PDF')
    } catch {
      toast.error('Xuất PDF thất bại')
    } finally {
      setExportingPdf(false)
    }
  }, [from, to])

  const handleExportXlsx = useCallback(async () => {
    if (!data) return
    setExportingXlsx(true)
    try {
      const { utils, writeFile } = await import('xlsx')
      const wb = utils.book_new()

      // KPI sheet
      const kpiRows = [
        ['Chỉ số', 'Giá trị'],
        ['Doanh thu', data.kpi.totalRevenue],
        ['Đơn đặt', data.kpi.totalOrders],
        ['Khách hàng', data.kpi.totalCustomers],
        ['Trung bình đơn', data.kpi.avgOrderValue]
      ]
      utils.book_append_sheet(wb, utils.aoa_to_sheet(kpiRows), 'KPI')

      // Revenue timeline
      if (data.revenueTimeline.length) {
        const rows = [['Ngày', 'Tours', 'Khách sạn', 'Nhà hàng'],
          ...data.revenueTimeline.map(r => [r.date, r.tours, r.hotels, r.restaurants])]
        utils.book_append_sheet(wb, utils.aoa_to_sheet(rows), 'Doanh thu theo ngày')
      }

      // Top tours
      if (data.topTours.length) {
        const rows = [['Tên tour', 'Lượt đặt', 'Doanh thu'],
          ...data.topTours.map(t => [t.name, t.bookings, t.revenue])]
        utils.book_append_sheet(wb, utils.aoa_to_sheet(rows), 'Tour hàng đầu')
      }

      // Top customers
      if (data.topCustomers.length) {
        const rows = [['Khách hàng', 'Đơn đặt', 'Chi tiêu'],
          ...data.topCustomers.map(c => [c.name, c.bookings, c.totalSpent])]
        utils.book_append_sheet(wb, utils.aoa_to_sheet(rows), 'Khách hàng VIP')
      }

      writeFile(wb, `bao-cao-${from}-${to}.xlsx`)
      toast.success('Đã xuất Excel')
    } catch {
      toast.error('Xuất Excel thất bại')
    } finally {
      setExportingXlsx(false)
    }
  }, [data, from, to])

  const kpi = data?.kpi
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a5276' }}>Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {from} → {to}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Preset selector */}
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {preset === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="border rounded-md px-2 py-1.5 text-sm"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="border rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting} className="gap-2">
                {isExporting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4" />
                }
                Xuất báo cáo
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadExport('/admin/export/excel/tour-bookings', 'bookings_tour.xlsx')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Đặt tour → Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExport('/admin/export/excel/restaurant-bookings', 'bookings_restaurant.xlsx')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Nhà hàng → Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadExport('/admin/export/pdf/tour-bookings', 'bookings_tour.pdf')}>
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Đặt tour → PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExport('/admin/export/pdf/restaurant-bookings', 'bookings_restaurant.pdf')}>
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Nhà hàng → PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={handleExportXlsx}
            disabled={exportingXlsx || !data}
            className="gap-2"
          >
            {exportingXlsx
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <FileSpreadsheet className="w-4 h-4" />
            }
            Excel
          </Button>

          <Button
            onClick={handleExportPdf}
            disabled={exportingPdf || !data}
            className="gap-2 text-white"
            style={{ background: '#1a5276' }}
          >
            {exportingPdf
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <FileText className="w-4 h-4" />
            }
            PDF
          </Button>
        </div>
      </div>

      {/* Report body - captured for PDF */}
      <div ref={reportRef} className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
              </div>
            ))
          ) : kpi ? (
            <>
              <KpiCard title="Tổng doanh thu" value={kpi.totalRevenue} growth={kpi.revenueGrowth}
                icon={DollarSign} format="currency" color="#1a5276" />
              <KpiCard title="Tổng đơn đặt" value={kpi.totalOrders} growth={kpi.ordersGrowth}
                icon={ShoppingCart} format="count" color="#e67e22" />
              <KpiCard title="Khách hàng mới" value={kpi.totalCustomers} growth={kpi.customersGrowth}
                icon={Users} format="count" color="#27ae60" />
              <KpiCard title="Giá trị TB/đơn" value={kpi.avgOrderValue} growth={kpi.avgOrderGrowth}
                icon={TrendingUp} format="currency" color="#8e44ad" />
            </>
          ) : null}
        </div>

        {/* Revenue Area Chart */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Doanh thu theo thời gian</h2>
          {isLoading ? (
            <div className="h-64 bg-gray-50 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.revenueTimeline ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradTours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.tours} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.tours} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradHotels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.hotels} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.hotels} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRestaurants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.restaurants} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.restaurants} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => dayjs(d).format('DD/MM')} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend formatter={(v: string) => ({ tours: 'Tour', hotels: 'Khách sạn', restaurants: 'Nhà hàng' }[v] ?? v)} />
                <Area type="monotone" dataKey="tours" name="tours" stroke={COLORS.tours} fill="url(#gradTours)" strokeWidth={2} />
                <Area type="monotone" dataKey="hotels" name="hotels" stroke={COLORS.hotels} fill="url(#gradHotels)" strokeWidth={2} />
                <Area type="monotone" dataKey="restaurants" name="restaurants" stroke={COLORS.restaurants} fill="url(#gradRestaurants)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart + Pie chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart - 2/3 */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">So sánh theo dịch vụ</h2>
            {isLoading ? (
              <div className="h-56 bg-gray-50 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.serviceBreakdown ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend formatter={(v: string) => ({ tours: 'Tour', hotels: 'Khách sạn', restaurants: 'Nhà hàng' }[v] ?? v)} />
                  <Bar dataKey="tours" name="tours" fill={COLORS.tours} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hotels" name="hotels" fill={COLORS.hotels} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="restaurants" name="restaurants" fill={COLORS.restaurants} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart - 1/3 */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Cơ cấu doanh thu</h2>
            {isLoading ? (
              <div className="h-56 bg-gray-50 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data?.servicePie ?? []}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(data?.servicePie ?? []).map((_: PiePoint, index: number) => (
                      <Cell key={index} fill={COLORS.pie[index % COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmt(v) + '₫', '']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top tours + Top customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top tours */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Tour hàng đầu</h2>
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
                ))
              ) : (data?.topTours ?? []).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
              ) : (data?.topTours ?? []).map((t: TopTour, i: number) => (
                <div key={t.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2e' : '#1a5276' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.bookings} lượt đặt</p>
                  </div>
                  <span className="font-semibold text-sm shrink-0" style={{ color: '#e67e22' }}>
                    {fmt(t.revenue)}₫
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top customers */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Khách hàng VIP</h2>
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
                ))
              ) : (data?.topCustomers ?? []).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
              ) : (data?.topCustomers ?? []).map((c: TopCustomer, i: number) => (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2e' : '#1a5276' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.bookings} đơn đặt</p>
                  </div>
                  <span className="font-semibold text-sm shrink-0" style={{ color: '#1a5276' }}>
                    {fmt(c.totalSpent)}₫
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
