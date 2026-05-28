import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Star, Wifi, Waves, Car, Utensils, Dumbbell, Coffee,
  ChevronLeft, ChevronRight, SlidersHorizontal, X, ArrowUpDown,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency, resolveBase64Image } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hotel {
  id: number
  name: string
  address?: string
  city?: string
  starRating?: number
  pricePerNight?: number
  roomPrice?: number
  rating?: number
  reviewCount?: number
  photo?: string
  imageUrl?: string
  images?: Array<{ id: number; photo: string }>
  amenities?: string
  active?: boolean
}

interface Filters {
  destination: string
  checkIn:  Date | null
  checkOut: Date | null
  stars:    number[]
  priceRange: [number, number]
}

type SortKey = 'price_asc' | 'price_desc' | 'rating' | 'newest'

// ─── Constants ────────────────────────────────────────────────────────────────

const INIT_FILTERS: Filters = {
  destination: '',
  checkIn: null,
  checkOut: null,
  stars: [],
  priceRange: [0, 10_000_000],
}

const MAX_PRICE = 10_000_000
const PER_PAGE  = 9

const AMENITY_ICONS = [
  { key: 'wifi',       icon: <Wifi size={13} />,      label: 'Wifi' },
  { key: 'hồ bơi',    icon: <Waves size={13} />,     label: 'Hồ bơi' },
  { key: 'bể bơi',    icon: <Waves size={13} />,     label: 'Bể bơi' },
  { key: 'đỗ xe',     icon: <Car size={13} />,       label: 'Đỗ xe' },
  { key: 'parking',   icon: <Car size={13} />,       label: 'Đỗ xe' },
  { key: 'nhà hàng',  icon: <Utensils size={13} />,  label: 'Nhà hàng' },
  { key: 'restaurant',icon: <Utensils size={13} />,  label: 'Nhà hàng' },
  { key: 'gym',       icon: <Dumbbell size={13} />,  label: 'Gym' },
  { key: 'cafe',      icon: <Coffee size={13} />,    label: 'Cafe' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fallbackImg = (id: number) => `https://picsum.photos/seed/hotel${id}/400/300`

function getImage(h: Hotel) {
  if (h.images?.length) return resolveBase64Image(h.images[0].photo, fallbackImg(h.id))
  if (h.photo)    return resolveBase64Image(h.photo, fallbackImg(h.id))
  if (h.imageUrl) return h.imageUrl
  return fallbackImg(h.id)
}

const getPrice = (h: Hotel) => h.pricePerNight ?? h.roomPrice ?? 0
const getStars = (h: Hotel) => h.starRating ?? 0

// ─── DualRangeSlider ──────────────────────────────────────────────────────────

function DualRangeSlider({
  value, onChange, min = 0, max = MAX_PRICE,
}: {
  value: [number, number]
  onChange: (v: [number, number]) => void
  min?: number
  max?: number
}) {
  const [lo, hi] = value
  const loP = ((lo - min) / (max - min)) * 100
  const hiP = ((hi - min) / (max - min)) * 100

  return (
    <div className="pt-1">
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-muted" />
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${loP}%`, right: `${100 - hiP}%` }}
        />
        <input
          type="range" min={min} max={max} step={200_000} value={lo}
          className="dual-thumb"
          onChange={e => onChange([Math.min(Number(e.target.value), hi - 200_000), hi])}
        />
        <input
          type="range" min={min} max={max} step={200_000} value={hi}
          className="dual-thumb"
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + 200_000)])}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-3">
        <span className="font-medium">{formatCurrency(lo)}</span>
        <span className="font-medium">{formatCurrency(hi)}</span>
      </div>
    </div>
  )
}

// ─── StarRow ──────────────────────────────────────────────────────────────────

function StarRow({ count, size = 13 }: { count: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size}
          className={i < count ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'} />
      ))}
    </div>
  )
}

// ─── HotelCard ────────────────────────────────────────────────────────────────

function HotelCard({ hotel }: { hotel: Hotel }) {
  const navigate = useNavigate()
  const price = getPrice(hotel)
  const stars = getStars(hotel)
  const amenities = AMENITY_ICONS
    .filter(a => hotel.amenities?.toLowerCase().includes(a.key))
    .reduce<typeof AMENITY_ICONS>((acc, a) => {
      if (!acc.find(x => x.label === a.label)) acc.push(a)
      return acc
    }, [])
    .slice(0, 4)

  return (
    <Card
      className="overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border"
      onClick={() => navigate(`/hotels/${hotel.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={getImage(hotel)}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg(hotel.id) }}
        />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Star badge — top left */}
        {stars > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow text-xs font-bold text-gray-800">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {stars} sao
          </div>
        )}

        {/* Availability — top right */}
        <span className={cn(
          'absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full',
          hotel.active === false
            ? 'bg-red-500 text-white'
            : 'bg-emerald-500 text-white',
        )}>
          {hotel.active === false ? 'Hết phòng' : 'Còn phòng'}
        </span>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-base leading-snug line-clamp-1 mb-1">{hotel.name}</h3>

        <p className="flex items-center gap-1 text-sm text-muted-foreground mb-2 truncate">
          <MapPin size={12} className="shrink-0 text-accent" />
          {[hotel.address, hotel.city].filter(Boolean).join(', ') || 'Việt Nam'}
        </p>

        {(hotel.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <StarRow count={Math.round(hotel.rating!)} />
            <span className="text-sm font-bold text-amber-500">{hotel.rating?.toFixed(1)}</span>
            {hotel.reviewCount ? (
              <span className="text-xs text-muted-foreground">({hotel.reviewCount})</span>
            ) : null}
          </div>
        )}

        {amenities.length > 0 && (
          <div className="flex items-center gap-3 mb-3 text-muted-foreground">
            {amenities.map((a, i) => (
              <div key={i} className="flex items-center gap-1" title={a.label}>
                {a.icon}
                <span className="text-xs hidden sm:inline">{a.label}</span>
              </div>
            ))}
          </div>
        )}

        <Separator className="mb-3" />

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Từ</p>
            <p className="text-accent font-bold text-xl leading-tight">
              {price > 0 ? formatCurrency(price) : '—'}
              <span className="text-xs font-normal text-muted-foreground">/đêm</span>
            </p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 active:scale-[0.97]"
          >
            Xem chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── FilterSidebar ────────────────────────────────────────────────────────────

function FilterSidebar({
  draft, setDraft, onApply, onReset, hotels,
}: {
  draft: Filters
  setDraft: React.Dispatch<React.SetStateAction<Filters>>
  onApply: () => void
  onReset: () => void
  hotels: Hotel[]
}) {
  const starCounts = useMemo(() => {
    const map: Record<number, number> = {}
    hotels.forEach(h => {
      const s = getStars(h)
      if (s > 0) map[s] = (map[s] ?? 0) + 1
    })
    return map
  }, [hotels])

  const toggleStar = (s: number) =>
    setDraft(f => ({
      ...f,
      stars: f.stars.includes(s) ? f.stars.filter(x => x !== s) : [...f.stars, s],
    }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <SlidersHorizontal size={15} /> Bộ lọc
        </h2>
        <button
          onClick={onReset}
          className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          Xóa tất cả
        </button>
      </div>

      <Separator />

      {/* Destination */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Điểm đến
        </Label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Thành phố, địa điểm..."
            value={draft.destination}
            onChange={e => setDraft(f => ({ ...f, destination: e.target.value }))}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* Date range */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Ngày nhận — Trả phòng
        </Label>
        <DatePicker
          selectsRange
          startDate={draft.checkIn ?? undefined}
          endDate={draft.checkOut ?? undefined}
          onChange={([s, e]) => setDraft(f => ({ ...f, checkIn: s ?? null, checkOut: e ?? null }))}
          minDate={new Date()}
          dateFormat="dd/MM/yyyy"
          placeholderText="Chọn khoảng ngày..."
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
        />
        {draft.checkIn && draft.checkOut && (
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            {dayjs(draft.checkOut).diff(dayjs(draft.checkIn), 'day')} đêm
          </p>
        )}
      </div>

      <Separator />

      {/* Stars */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
          Hạng sao
        </Label>
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map(s => (
            <label
              key={s}
              className="flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={draft.stars.includes(s)}
                  onCheckedChange={() => toggleStar(s)}
                />
                <div className="flex gap-0.5">
                  {Array.from({ length: s }, (_, i) => (
                    <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {s} sao
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {starCounts[s] !== undefined ? `(${starCounts[s]})` : ''}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price range */}
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
          Khoảng giá / đêm
        </Label>
        <DualRangeSlider
          value={draft.priceRange}
          onChange={v => setDraft(f => ({ ...f, priceRange: v }))}
        />
      </div>

      <Separator />

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
        onClick={onApply}
      >
        Áp dụng bộ lọc
      </Button>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const items = Array.from({ length: total }, (_, i) => i + 1)
    .filter(p => p === 1 || p === total || Math.abs(p - page) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <Button variant="outline" size="icon" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </Button>
      {items.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            size="icon"
            variant={page === p ? 'default' : 'outline'}
            className="size-9 text-sm"
            onClick={() => onChange(p as number)}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="outline" size="icon" disabled={page === total} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HotelsPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draft,  setDraft]  = useState<Filters>(INIT_FILTERS)
  const [active, setActive] = useState<Filters>(INIT_FILTERS)
  const [sort, setSort]     = useState<SortKey>('price_asc')
  const [page, setPage]     = useState(1)

  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({
    queryKey: ['hotels'],
    queryFn: () => api.get('/hotels').then(r => r.data),
    staleTime: 60_000,
  })

  const filtered = useMemo(() => {
    let list = [...hotels]

    if (active.destination) {
      const q = active.destination.toLowerCase()
      list = list.filter(h => h.city?.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q))
    }
    if (active.stars.length) {
      list = list.filter(h => active.stars.includes(getStars(h)))
    }
    const [lo, hi] = active.priceRange
    if (lo > 0 || hi < MAX_PRICE) {
      list = list.filter(h => { const p = getPrice(h); return p >= lo && (hi >= MAX_PRICE || p <= hi) })
    }

    switch (sort) {
      case 'price_asc':  list.sort((a, b) => getPrice(a) - getPrice(b)); break
      case 'price_desc': list.sort((a, b) => getPrice(b) - getPrice(a)); break
      case 'rating':     list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break
      case 'newest':     list.sort((a, b) => b.id - a.id); break
    }
    return list
  }, [hotels, active, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const apply = () => { setActive(draft); setPage(1); setSidebarOpen(false) }
  const reset = () => { setDraft(INIT_FILTERS); setActive(INIT_FILTERS); setPage(1) }

  const goPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-primary">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-4">
            <button onClick={() => navigate('/')} className="hover:text-primary-foreground transition-colors">Trang chu</button>
            <span>/</span>
            <span className="text-primary-foreground font-medium">Khach san</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-primary-foreground mb-3">
            Khach san
          </h1>
          <p className="text-primary-foreground/70 text-lg">
            Kham pha <span className="text-primary-foreground font-semibold">{hotels.length}+</span> khach san, resort & homestay tren khap Viet Nam
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-7">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-card rounded-xl border border-border p-5 sticky top-24">
              <FilterSidebar
                draft={draft} setDraft={setDraft}
                onApply={apply} onReset={reset}
                hotels={hotels}
              />
            </div>
          </aside>

          {/* ── Main area ── */}
          <main className="flex-1 min-w-0 animate-in fade-in duration-300">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <p className="text-sm text-muted-foreground">
                Tìm thấy{' '}
                <span className="font-semibold text-foreground">{filtered.length}</span> khách sạn
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <SlidersHorizontal size={14} className="mr-1.5" /> Bộ lọc
                </Button>
                <Select value={sort} onValueChange={v => { setSort(v as SortKey); setPage(1) }}>
                  <SelectTrigger className="w-44 text-sm">
                    <ArrowUpDown size={13} className="mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem value="rating">Đánh giá cao</SelectItem>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-border bg-card">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="p-4 space-y-2.5">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-8 w-full mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-5xl mb-4">🏨</p>
                <p className="text-muted-foreground text-base mb-4">Không tìm thấy khách sạn phù hợp</p>
                <Button variant="outline" onClick={reset}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {paged.map(h => <HotelCard key={h.id} hotel={h} />)}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination page={page} total={totalPages} onChange={goPage} />
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-full bg-card border-r border-border overflow-y-auto p-5 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Bộ lọc</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <FilterSidebar
              draft={draft} setDraft={setDraft}
              onApply={apply} onReset={reset}
              hotels={hotels}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
