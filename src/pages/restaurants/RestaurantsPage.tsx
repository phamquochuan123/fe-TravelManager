import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Clock, Users, Search, UtensilsCrossed, Utensils,
  ChevronLeft, ChevronRight, X, ChevronDown,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, resolveBase64Image, truncate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Restaurant {
  id: number
  name: string
  address?: string
  city?: string
  cuisineType?: string
  priceRange?: string
  openingHours?: string
  capacity?: number
  description?: string
  specialties?: string
  photo?: string
  rating?: number
  reviewCount?: number
  active?: boolean
}

interface ActiveFilter {
  key: string
  label: string
  value: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CUISINES = [
  { value: '',            label: 'Tất cả ẩm thực' },
  { value: 'VIETNAMESE',  label: 'Việt Nam' },
  { value: 'ASIAN',       label: 'Châu Á' },
  { value: 'WESTERN',     label: 'Âu Mỹ' },
  { value: 'SEAFOOD',     label: 'Hải sản' },
  { value: 'BBQ',         label: 'BBQ' },
  { value: 'VEGETARIAN',  label: 'Chay' },
  { value: 'FUSION',      label: 'Fusion' },
  { value: 'OTHER',       label: 'Khác' },
]

const CUISINE_LABEL: Record<string, string> = Object.fromEntries(
  CUISINES.filter(c => c.value).map(c => [c.value, c.label]),
)

const CUISINE_COLOR: Record<string, string> = {
  VIETNAMESE: 'bg-red-100 text-red-700',
  ASIAN:      'bg-orange-100 text-orange-700',
  WESTERN:    'bg-blue-100 text-blue-700',
  SEAFOOD:    'bg-cyan-100 text-cyan-700',
  BBQ:        'bg-amber-100 text-amber-700',
  VEGETARIAN: 'bg-green-100 text-green-700',
  FUSION:     'bg-purple-100 text-purple-700',
  OTHER:      'bg-gray-100 text-gray-700',
}

const TIME_SLOTS = [
  { value: '', label: 'Khung giờ' },
  { value: 'morning',   label: 'Buổi sáng (7–11h)' },
  { value: 'lunch',     label: 'Buổi trưa (11–14h)' },
  { value: 'afternoon', label: 'Buổi chiều (14–17h)' },
  { value: 'evening',   label: 'Buổi tối (17–22h)' },
]

const GUEST_OPTIONS = [
  { value: '',   label: 'Số người' },
  { value: '1',  label: '1 người' },
  { value: '2',  label: '2 người' },
  { value: '4',  label: '2–4 người' },
  { value: '6',  label: '4–6 người' },
  { value: '10', label: '6–10 người' },
  { value: '20', label: '10+ người' },
]

const PER_PAGE = 9
const FALLBACK  = (id: number) => `https://picsum.photos/seed/restaurant${id}/400/250`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getImage(r: Restaurant) {
  return resolveBase64Image(r.photo ?? null, FALLBACK(r.id))
}

function matchesTimeSlot(openingHours: string | undefined, slot: string): boolean {
  if (!slot || !openingHours) return true
  const ranges: Record<string, [number, number]> = {
    morning:   [7,  11],
    lunch:     [11, 14],
    afternoon: [14, 17],
    evening:   [17, 22],
  }
  const [open, close] = ranges[slot] ?? [0, 24]
  const match = openingHours.match(/(\d{1,2}):\d{2}\s*[-–]\s*(\d{1,2}):\d{2}/)
  if (!match) return true
  const opH = Number(match[1])
  const clH = Number(match[2])
  return !(clH <= open || opH >= close)
}

// ─── ChipSelect ───────────────────────────────────────────────────────────────

function ChipSelect({
  icon, options, value, onChange, placeholder,
}: {
  icon: React.ReactNode
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
          value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-white border-border text-foreground hover:bg-muted',
        )}
      >
        {icon}
        {selected?.value ? selected.label : placeholder}
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-border rounded-xl shadow-lg py-1 min-w-40 animate-in fade-in slide-in-from-top-2 duration-150">
            {options.map(o => (
              <button
                key={o.value}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  o.value === value
                    ? 'bg-primary/5 text-primary font-semibold'
                    : 'hover:bg-muted text-foreground',
                )}
                onClick={() => { onChange(o.value); setOpen(false) }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── RestaurantCard ───────────────────────────────────────────────────────────

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const navigate = useNavigate()
  const tags = restaurant.specialties?.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3) ?? []

  return (
    <Card
      className="overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border"
      onClick={() => navigate(`/restaurants/${restaurant.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <img
          src={getImage(restaurant)}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK(restaurant.id) }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Cuisine badge */}
        {restaurant.cuisineType && (
          <Badge className={cn(
            'absolute top-3 left-3 text-xs font-semibold',
            CUISINE_COLOR[restaurant.cuisineType] ?? 'bg-gray-100 text-gray-700',
          )}>
            {CUISINE_LABEL[restaurant.cuisineType] ?? restaurant.cuisineType}
          </Badge>
        )}

        {restaurant.active === false && (
          <Badge variant="destructive" className="absolute top-3 right-3 text-xs">Tạm đóng</Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-base leading-snug line-clamp-1 mb-1">{restaurant.name}</h3>

        {(restaurant.address || restaurant.city) && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground mb-1 truncate">
            <MapPin size={12} className="shrink-0 text-accent" />
            {truncate([restaurant.address, restaurant.city].filter(Boolean).join(', '), 45)}
          </p>
        )}

        {restaurant.openingHours && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Clock size={12} className="shrink-0" />
            {restaurant.openingHours}
          </p>
        )}

        {(restaurant.rating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i < Math.round(restaurant.rating!) ? 'text-amber-400' : 'text-gray-300'}>★</span>
            ))}
            <span className="text-sm font-bold text-amber-500 ml-1">{restaurant.rating?.toFixed(1)}</span>
            {restaurant.reviewCount ? (
              <span className="text-xs text-muted-foreground">({restaurant.reviewCount})</span>
            ) : null}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((t, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">{t}</Badge>
            ))}
          </div>
        )}

        <Separator className="mb-3" />

        <Button
          className="w-full bg-accent hover:bg-accent/90 text-white active:scale-[0.98] font-semibold"
        >
          Đặt bàn ngay
        </Button>
      </CardContent>
    </Card>
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
            key={p} size="icon" variant={page === p ? 'default' : 'outline'}
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

export default function RestaurantsPage() {
  const navigate = useNavigate()

  const [search,    setSearch]    = useState('')
  const [city,      setCity]      = useState('')
  const [cuisine,   setCuisine]   = useState('')
  const [timeSlot,  setTimeSlot]  = useState('')
  const [guests,    setGuests]    = useState('')

  // Applied filters (separate from drafts for chip filters — apply on Search click)
  const [applied, setApplied] = useState({ search: '', city: '', cuisine: '', timeSlot: '', guests: '' })
  const [page, setPage] = useState(1)

  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({
    queryKey: ['restaurants'],
    queryFn: () => api.get('/restaurants').then(r => r.data),
    staleTime: 60_000,
  })

  const filtered = useMemo(() => {
    let list = [...restaurants]
    if (applied.search) {
      const q = applied.search.toLowerCase()
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q))
    }
    if (applied.city) {
      const q = applied.city.toLowerCase()
      list = list.filter(r => r.city?.toLowerCase().includes(q))
    }
    if (applied.cuisine) {
      list = list.filter(r => r.cuisineType === applied.cuisine)
    }
    if (applied.timeSlot) {
      list = list.filter(r => matchesTimeSlot(r.openingHours, applied.timeSlot))
    }
    if (applied.guests) {
      const minGuests = Number(applied.guests)
      list = list.filter(r => (r.capacity ?? 999) >= minGuests)
    }
    return list
  }, [restaurants, applied])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSearch = () => {
    setApplied({ search, city, cuisine, timeSlot, guests })
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  // Active filter chips (for display + removal)
  const activeFilters: ActiveFilter[] = [
    applied.city      && { key: 'city',     label: `📍 ${applied.city}`,      value: applied.city },
    applied.cuisine   && { key: 'cuisine',  label: CUISINE_LABEL[applied.cuisine] ?? applied.cuisine, value: applied.cuisine },
    applied.timeSlot  && { key: 'timeSlot', label: TIME_SLOTS.find(t => t.value === applied.timeSlot)?.label ?? applied.timeSlot, value: applied.timeSlot },
    applied.guests    && { key: 'guests',   label: GUEST_OPTIONS.find(g => g.value === applied.guests)?.label ?? applied.guests, value: applied.guests },
  ].filter(Boolean) as ActiveFilter[]

  const removeFilter = (key: string) => {
    const next = { ...applied, [key]: '' }
    setApplied(next)
    if (key === 'city')     setCity('')
    if (key === 'cuisine')  setCuisine('')
    if (key === 'timeSlot') setTimeSlot('')
    if (key === 'guests')   setGuests('')
    setPage(1)
  }

  const resetAll = () => {
    setSearch(''); setCity(''); setCuisine(''); setTimeSlot(''); setGuests('')
    setApplied({ search: '', city: '', cuisine: '', timeSlot: '', guests: '' })
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Hero banner ── */}
      <section
        className="relative flex flex-col items-center justify-center h-64 sm:h-80 overflow-hidden"
        style={{
          backgroundImage: 'url(https://picsum.photos/seed/restaurant-hero/1920/600)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent/80 via-orange-700/60 to-black/70" />
        <div className="relative z-10 text-center text-white px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <nav className="text-sm text-white/60 mb-3 flex items-center justify-center gap-2">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Trang chủ</button>
            <span>/</span>
            <span className="text-white font-medium">Nhà hàng</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-2">Nhà hàng</h1>
          <p className="text-white/75 text-sm sm:text-base max-w-md mx-auto">
            Khám phá {restaurants.length}+ nhà hàng đặc sắc trên khắp Việt Nam
          </p>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-border shadow-sm sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          {/* Search row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên nhà hàng, địa điểm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 text-sm"
              />
            </div>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shrink-0"
              onClick={handleSearch}
            >
              <Search size={15} className="mr-1.5" /> Tìm kiếm
            </Button>
          </div>

          {/* Chip filters row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <div className="flex items-center">
                <MapPin size={13} className="absolute left-3 text-muted-foreground pointer-events-none z-10" />
                <Input
                  placeholder="Thành phố..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-8 h-8 text-xs w-36 rounded-full border-border"
                />
              </div>
            </div>

            <ChipSelect
              icon={<Utensils size={13} />}
              options={CUISINES}
              value={cuisine}
              onChange={setCuisine}
              placeholder="Ẩm thực"
            />

            <ChipSelect
              icon={<Clock size={13} />}
              options={TIME_SLOTS}
              value={timeSlot}
              onChange={setTimeSlot}
              placeholder="Khung giờ"
            />

            <ChipSelect
              icon={<Users size={13} />}
              options={GUEST_OPTIONS}
              value={guests}
              onChange={setGuests}
              placeholder="Số người"
            />
          </div>

          {/* Active filter badges */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Đang lọc:</span>
              {activeFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => removeFilter(f.key)}
                  className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {f.label}
                  <X size={11} />
                </button>
              ))}
              <button
                onClick={resetAll}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors ml-1"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            Tìm thấy <span className="font-semibold text-foreground">{filtered.length}</span> nhà hàng
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border bg-white">
                <Skeleton className="w-full" style={{ aspectRatio: '16/9' }} />
                <div className="p-4 space-y-2.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-24">
            <UtensilsCrossed size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-base mb-4">Không tìm thấy nhà hàng phù hợp</p>
            <Button variant="outline" onClick={resetAll}>Xóa bộ lọc</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {paged.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            page={page} total={totalPages}
            onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          />
        )}
      </div>

      <Footer />
    </div>
  )
}
