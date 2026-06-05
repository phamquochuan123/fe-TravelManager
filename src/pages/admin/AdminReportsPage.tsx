import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import {
  TrendingUp, Users, ShoppingCart, DollarSign,
  Download, RefreshCw, FileSpreadsheet, FileText, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  tours: '#0a1628',
  hotels: '#8e44ad',
  restaurants: '#c9a84c',
  pie: ['#0a1628', '#c9a84c', '#8e44ad', '#27ae60', '#e74c3c']
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
      return { from: now.startOf('quarter' as dayjs.OpUnitType).format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    case 'year':
      return { from: now.startOf('year' as dayjs.OpUnitType).format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
    default:
      return { from: now.subtract(29, 'day').format('YYYY-MM-DD'), to: now.format('YYYY-MM-DD') }
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, growth, icon: Icon, format = 'number', color, index = 0
}: {
  title: string
  value: number
  growth: number
  icon: React.ElementType
  format?: 'number' | 'currency' | 'count'
  color: string
  index?: number
}) {
  const formatted = format === 'currency'
    ? new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value) + ' ₫'
    : format === 'count'
    ? value.toLocaleString('vi-VN')
    : new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

  const isPositive = growth >= 0

  return (
    <div
      className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{formatted}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded" style={{ background: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <Badge className={`rounded-full px-2 py-1 text-xs font-semibold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {isPositive ? 'Tăng' : 'Giảm'} {Math.abs(growth).toFixed(1)}%
        </Badge>
        <span className="text-slate-500">so với kỳ trước</span>
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
    if (!data) return
    setExportingPdf(true)
    try {
      const jsPDFMod = await import('jspdf')
      const jsPDF = jsPDFMod.default ?? (jsPDFMod as any).jsPDF
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210; const M = 14; const CW = W - M * 2
      let y = 0

      const fmtMoney = (n: number) =>
        n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} Tr đ` : `${n.toLocaleString('vi-VN')} đ`

      // ── Header ──────────────────────────────────────────────────────
      pdf.setFillColor(10, 22, 40)
      pdf.rect(0, 0, W, 28, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(16); pdf.setFont('helvetica', 'bold')
      pdf.text('BAO CAO HIEU SUAT KINH DOANH', M, 12)
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      pdf.text(`Tu ${from}  den  ${to}`, M, 20)
      pdf.text(`Xuat luc: ${dayjs().format('DD/MM/YYYY HH:mm')}`, W - M, 20, { align: 'right' })
      y = 36

      // ── KPI cards ───────────────────────────────────────────────────
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(10, 22, 40)
      pdf.text('TONG QUAN', M, y); y += 5

      const kpis = [
        { label: 'Tong doanh thu', value: fmtMoney(data.kpi.totalRevenue) },
        { label: 'Tong don dat',   value: String(data.kpi.totalOrders) },
        { label: 'Khach hang moi', value: String(data.kpi.totalCustomers) },
        { label: 'Gia tri TB/don', value: fmtMoney(data.kpi.avgOrderValue) },
      ]
      const cardW = CW / 2 - 3
      kpis.forEach((k, i) => {
        const x = M + (i % 2) * (cardW + 6)
        const ky = y + Math.floor(i / 2) * 22
        pdf.setFillColor(245, 247, 250)
        pdf.roundedRect(x, ky, cardW, 18, 2, 2, 'F')
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 100, 100)
        pdf.text(k.label, x + 4, ky + 6)
        pdf.setFontSize(13); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(10, 22, 40)
        pdf.text(k.value, x + 4, ky + 14)
      })
      y += 48

      // ── Top Tours ───────────────────────────────────────────────────
      if (data.topTours?.length) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(10, 22, 40)
        pdf.text('TOP TOUR NOI BAT', M, y); y += 6
        pdf.setFillColor(10, 22, 40)
        pdf.rect(M, y, CW, 7, 'F')
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
        pdf.text('Ten tour', M + 3, y + 5)
        pdf.text('Don dat', M + 110, y + 5)
        pdf.text('Doanh thu', M + 135, y + 5)
        y += 7
        data.topTours.slice(0, 8).forEach((t, i) => {
          pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248)
          pdf.rect(M, y, CW, 7, 'F')
          pdf.setTextColor(40, 40, 40); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8)
          const name = t.name.length > 45 ? t.name.slice(0, 44) + '…' : t.name
          pdf.text(name, M + 3, y + 5)
          pdf.text(String(t.bookings), M + 113, y + 5)
          pdf.text(fmtMoney(t.revenue), M + 138, y + 5)
          y += 7
        })
        y += 6
      }

      // ── Top Customers ───────────────────────────────────────────────
      if (data.topCustomers?.length) {
        if (y > 230) { pdf.addPage(); y = 20 }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(10, 22, 40)
        pdf.text('TOP KHACH HANG', M, y); y += 6
        pdf.setFillColor(10, 22, 40)
        pdf.rect(M, y, CW, 7, 'F')
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
        pdf.text('Ten khach hang', M + 3, y + 5)
        pdf.text('So don', M + 110, y + 5)
        pdf.text('Tong chi tieu', M + 135, y + 5)
        y += 7
        data.topCustomers.slice(0, 8).forEach((c, i) => {
          pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248)
          pdf.rect(M, y, CW, 7, 'F')
          pdf.setTextColor(40, 40, 40); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8)
          pdf.text(c.name ?? '', M + 3, y + 5)
          pdf.text(String(c.bookings), M + 113, y + 5)
          pdf.text(fmtMoney(c.totalSpent), M + 138, y + 5)
          y += 7
        })
        y += 6
      }

      // ── Revenue timeline summary ─────────────────────────────────────
      if (data.revenueTimeline?.length && y < 240) {
        if (y > 220) { pdf.addPage(); y = 20 }
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(10, 22, 40)
        pdf.text('DOANH THU THEO NGAY (5 NGAY GAN NHAT)', M, y); y += 6
        const recent = data.revenueTimeline.slice(-5)
        pdf.setFillColor(10, 22, 40)
        pdf.rect(M, y, CW, 7, 'F')
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold')
        pdf.text('Ngay', M + 3, y + 5); pdf.text('Tour', M + 55, y + 5)
        pdf.text('Khach san', M + 95, y + 5); pdf.text('Nha hang', M + 135, y + 5)
        y += 7
        recent.forEach((r, i) => {
          pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 248)
          pdf.rect(M, y, CW, 7, 'F')
          pdf.setTextColor(40, 40, 40); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8)
          pdf.text(r.date, M + 3, y + 5)
          pdf.text(fmtMoney(r.tours), M + 55, y + 5)
          pdf.text(fmtMoney(r.hotels), M + 95, y + 5)
          pdf.text(fmtMoney(r.restaurants), M + 135, y + 5)
          y += 7
        })
      }

      // ── Footer ──────────────────────────────────────────────────────
      const totalPages = (pdf as any).internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(7); pdf.setTextColor(150, 150, 150); pdf.setFont('helvetica', 'normal')
        pdf.text(`TravelVN - Bao cao tu dong  |  Trang ${i}/${totalPages}`, W / 2, 292, { align: 'center' })
      }

      pdf.save(`bao-cao-${from}-${to}.pdf`)
      toast.success('Đã xuất PDF')
    } catch (e) {
      console.error('[PDF Export]', e)
      toast.error('Xuất PDF thất bại')
    } finally {
      setExportingPdf(false)
    }
  }, [data, from, to])

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
      <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        <section className="rounded-[32px] bg-slate-950/95 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Báo cáo & thống kê</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white">Hiệu suất kênh kinh doanh</h1>
              <p className="max-w-2xl text-sm text-slate-300">Xem doanh thu, đơn đặt và khách hàng trong kỳ bạn cần.</p>
            </div>

            <div className="grid gap-3 sm:auto-cols-min sm:grid-flow-col">
              <div className="rounded-sm bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Khoảng thời gian</p>
                <p className="mt-2 text-xl font-semibold text-white">{from} → {to}</p>
              </div>
              <div className="rounded-sm bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Trạng thái dữ liệu</p>
                <p className="mt-2 text-xl font-semibold text-white">{isFetching ? 'Đang tải...' : 'Cập nhật gần nhất'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-[28px] bg-slate-900/70 animate-pulse" />
              ))
            ) : kpi ? (
              <>
                <KpiCard title="Tổng doanh thu" value={kpi.totalRevenue} growth={kpi.revenueGrowth}
                  icon={DollarSign} format="currency" color="#0a1628" index={0} />
                <KpiCard title="Tổng đơn đặt" value={kpi.totalOrders} growth={kpi.ordersGrowth}
                  icon={ShoppingCart} format="count" color="#c9a84c" index={1} />
                <KpiCard title="Khách hàng mới" value={kpi.totalCustomers} growth={kpi.customersGrowth}
                  icon={Users} format="count" color="#27ae60" index={2} />
                <KpiCard title="Giá trị TB/đơn" value={kpi.avgOrderValue} growth={kpi.avgOrderGrowth}
                  icon={TrendingUp} format="currency" color="#8e44ad" index={3} />
              </>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[32px] border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Bộ lọc</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Chọn thời gian</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {preset === 'custom' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm text-slate-600">
                    Từ ngày
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                    />
                  </label>
                  <label className="block space-y-1 text-sm text-slate-600">
                    Đến ngày
                    <input
                      type="date"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Hành động</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">Xuất dữ liệu</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Button variant="outline" onClick={handleExportXlsx} disabled={exportingXlsx || !data} className="gap-2 w-full justify-center">
                {exportingXlsx ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Xuất Excel chung
              </Button>
              <Button variant="outline" onClick={handleExportPdf} disabled={exportingPdf || !data} className="gap-2 w-full justify-center">
                {exportingPdf ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                Xuất PDF chung
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-2 w-full justify-center" disabled={isExporting}>
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Xuất theo loại
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
            </div>
          </div>
        </aside>
      </div>

      {/* Report body - captured for PDF */}
      <div ref={reportRef} className="space-y-6">
        <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Doanh thu theo thời gian</h2>
              <p className="text-sm text-slate-500">Theo dõi xu hướng doanh thu từng ngày trong khoảng đã chọn.</p>
            </div>
            <div className="inline-flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700">Tour</Badge>
              <Badge className="bg-slate-100 text-slate-700">Khách sạn</Badge>
              <Badge className="bg-slate-100 text-slate-700">Nhà hàng</Badge>
            </div>
          </div>
          {isLoading ? (
            <div className="mt-6 h-[280px] rounded-sm bg-slate-100 animate-pulse" />
          ) : (
            <div className="mt-6 h-[280px]"><ResponsiveContainer width="100%" height="100%">
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
            </ResponsiveContainer></div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">So sánh theo dịch vụ</h2>
                <p className="text-sm text-slate-500">So sánh doanh thu giữa tour, khách sạn và nhà hàng.</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700">Tổng quan</Badge>
            </div>
            {isLoading ? (
              <div className="mt-6 h-[240px] rounded-sm bg-slate-100 animate-pulse" />
            ) : (
              <div className="mt-6 h-[240px]"><ResponsiveContainer width="100%" height="100%">
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
              </ResponsiveContainer></div>
            )}
          </div>

          <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Cơ cấu doanh thu</h2>
            <p className="text-sm text-slate-500">Tỷ lệ doanh thu từng dịch vụ trong tổng doanh thu.</p>
            {isLoading ? (
              <div className="mt-6 h-[240px] rounded-sm bg-slate-100 animate-pulse" />
            ) : (
              <div className="mt-6 h-[240px]"><ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.servicePie ?? []}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(data?.servicePie ?? []).map((_: PiePoint, index: number) => (
                      <Cell key={index} fill={COLORS.pie[index % COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [fmt(Number(value ?? 0)) + '₫', '']} />
                </PieChart>
              </ResponsiveContainer></div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Tour hàng đầu</h2>
                <p className="text-sm text-slate-500">Các tour có doanh thu và lượt đặt tốt nhất.</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700">Top {data?.topTours.length ?? 0}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-sm bg-slate-100 animate-pulse" />
                ))
              ) : (data?.topTours ?? []).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
              ) : (data?.topTours ?? []).map((t: TopTour, i: number) => (
                <div key={t.id} className="flex items-center gap-4 rounded-sm bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: i === 0 ? '#f59e0b20' : i === 1 ? '#9ca3af20' : i === 2 ? '#cd7c2e20' : '#0a162820' }}>
                    <span className="text-sm font-semibold" style={{ color: i === 0 ? '#b45309' : i === 1 ? '#475569' : i === 2 ? '#7c2d12' : '#0a1628' }}>{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.bookings} lượt đặt</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{fmt(t.revenue)}₫</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/70">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Khách hàng VIP</h2>
                <p className="text-sm text-slate-500">Các khách hàng chi tiêu cao nhất.</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700">Top {data?.topCustomers.length ?? 0}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-sm bg-slate-100 animate-pulse" />
                ))
              ) : (data?.topCustomers ?? []).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>
              ) : (data?.topCustomers ?? []).map((c: TopCustomer, i: number) => (
                <div key={c.id} className="flex items-center gap-4 rounded-sm bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: i === 0 ? '#f59e0b20' : i === 1 ? '#9ca3af20' : i === 2 ? '#cd7c2e20' : '#0a162820' }}>
                    <span className="text-sm font-semibold" style={{ color: i === 0 ? '#b45309' : i === 1 ? '#475569' : i === 2 ? '#7c2d12' : '#0a1628' }}>{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.bookings} đơn đặt</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{fmt(c.totalSpent)}₫</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
