import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Clock, Users, Search, UtensilsCrossed,
  ChevronLeft, ChevronRight, X, ChevronDown, Star,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { resolveBase64Image, truncate } from '@/lib/utils'

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

interface ActiveFilter { key: string; label: string; value: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const CUISINES = [
  { value: '',            label: 'Tất cả ẩm thực' },
  { value: 'VIETNAMESE',  label: '🍜 Việt Nam' },
  { value: 'ASIAN',       label: '🥢 Châu Á' },
  { value: 'WESTERN',     label: '🥩 Âu Mỹ' },
  { value: 'SEAFOOD',     label: '🦐 Hải sản' },
  { value: 'BBQ',         label: '🔥 BBQ' },
  { value: 'VEGETARIAN',  label: '🥗 Chay' },
  { value: 'FUSION',      label: '✨ Fusion' },
  { value: 'OTHER',       label: 'Khác' },
]

const CUISINE_LABEL: Record<string, string> = Object.fromEntries(
  CUISINES.filter(c => c.value).map(c => [c.value, c.label]),
)

// Warm gradient per cuisine
const CUISINE_GRADIENT: Record<string, string> = {
  VIETNAMESE: 'from-red-500 to-orange-500',
  ASIAN:      'from-orange-500 to-amber-500',
  WESTERN:    'from-blue-600 to-indigo-600',
  SEAFOOD:    'from-cyan-500 to-blue-500',
  BBQ:        'from-orange-600 to-red-600',
  VEGETARIAN: 'from-green-500 to-emerald-500',
  FUSION:     'from-purple-500 to-pink-500',
  OTHER:      'from-gray-500 to-gray-600',
}

const TIME_SLOTS = [
  { value: '',          label: 'Khung giờ' },
  { value: 'morning',   label: 'Sáng (7–11h)' },
  { value: 'lunch',     label: 'Trưa (11–14h)' },
  { value: 'afternoon', label: 'Chiều (14–17h)' },
  { value: 'evening',   label: 'Tối (17–22h)' },
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

const RV = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80`

// 3 ảnh mỗi loại ẩm thực — chọn theo restaurant.id % 3, không bao giờ trùng nhau
const CUISINE_PHOTO_POOL: Record<string, string[]> = {
  VIETNAMESE: [
    RV('photo-1583394293214-de4ac99970b8'), // phở bò Hà Nội
    RV('photo-1455619452474-d2be8b1e70cd'), // bún bò / cơm tấm
    RV('photo-1546069901-ba9599a7e63c'),    // món Việt đặc trưng
  ],
  ASIAN: [
    RV('photo-1541614101331-1a5a3a194e92'), // mì xào châu Á
    RV('photo-1540189549336-e6e99eff19e1'), // sushi Nhật Bản
    RV('photo-1603360946369-dc9bb6258143'), // ramen nóng hổi
  ],
  WESTERN: [
    RV('photo-1544025162-d76694265947'),    // bít tết Âu Mỹ
    RV('photo-1547592180-85f173990554'),    // burger thủ công
    RV('photo-1565299624946-b28f40a0ae38'), // pizza lò củi
  ],
  SEAFOOD: [
    RV('photo-1565557623262-b51531de0193'), // hải sản tươi sống
    RV('photo-1519708227418-c8fd9a32b7a2'), // tôm hùm nướng
    RV('photo-1504674900247-0877df9cc836'), // mâm hải sản
  ],
  BBQ: [
    RV('photo-1529193591184-b1d58069ecdd'), // BBQ than hoa
    RV('photo-1558030006-450675393462'),    // sườn nướng BBQ
    RV('photo-1476224203421-9ac39bcb3b28'), // thịt nướng đặc sản
  ],
  VEGETARIAN: [
    RV('photo-1512621776951-a57141f2eefd'), // salad rau củ
    RV('photo-1490645935967-10de6ba17061'), // healthy bowl
    RV('photo-1482049016688-2d3e1b311543'), // brunch chay
  ],
  FUSION: [
    RV('photo-1414235077428-338989a2e8c0'), // fine dining fusion
    RV('photo-1495521821757-a1efb6729352'), // dessert hiện đại
    RV('photo-1466978913421-dad2ebd01d17'), // bàn ăn sang trọng
  ],
  OTHER: [
    RV('photo-1517248135467-4c7edcad34c4'), // không gian nhà hàng
    RV('photo-1555396273-367ea4eb4db5'),    // dining area ấm cúng
    RV('photo-1550966871-3ed3cdb5ed0c'),    // nhà hàng hiện đại
  ],
}

// 8 ảnh mặc định — không được trùng với bất kỳ ID nào trong CUISINE_PHOTO_POOL
const DEFAULT_RESTAURANT_PHOTOS = [
  RV('photo-1424847651672-bf20a4b0982b'), // café ngoài trời
  RV('photo-1563245372-f21724e3856d'),    // món ăn tinh tế
  RV('photo-1567620905732-2d1ec7ab7445'), // pancake/brunch đẹp
  RV('photo-1566073771259-6a8506099945'), // không gian ăn uống sang trọng
  RV('photo-1582719478250-c89cae4dc85b'), // bàn tiệc đẹp mắt
  RV('photo-1564501049412-61c2a3083791'), // nhà hàng nội thất ấm áp
  RV('photo-1551882547-ff40c242b0e0'),    // không gian resort/dining
  RV('photo-1611892440504-42a792e24d32'), // dining hiện đại
]

// Ultimate fallback khi tất cả ảnh lỗi
const FALLBACK = (id: number) =>
  `https://picsum.photos/seed/restaurant-${id}/600/400`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getImage(r: Restaurant) {
  if (r.photo) {
    const resolved = resolveBase64Image(r.photo, '')
    if (resolved) return resolved
  }
  // Chọn từ pool 3 ảnh theo cuisine, dùng id để chia đều → không trùng
  const pool = CUISINE_PHOTO_POOL[r.cuisineType ?? '']
  if (pool?.length) return pool[r.id % pool.length]
  return DEFAULT_RESTAURANT_PHOTOS[r.id % DEFAULT_RESTAURANT_PHOTOS.length]
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
  return !(Number(match[2]) <= open || Number(match[1]) >= close)
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({
  icon, options, value, onChange, placeholder,
}: {
  icon: React.ReactNode
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)
  const isActive = !!value

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border-2"
        style={isActive
          ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', color: '#fff', borderColor: 'transparent' }
          : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }
        }
      >
        <span className={isActive ? 'text-white/80' : 'text-gray-400'}>{icon}</span>
        {selected?.value ? selected.label : placeholder}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded shadow-2xl border border-gray-100 py-2 min-w-44 overflow-hidden">
          {options.map(o => (
            <button
              key={o.value}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                o.value === value
                  ? 'font-bold text-[#0a1628] bg-blue-50'
                  : 'text-gray-700 hover:bg-[#f8f5ee]'
              }`}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── RestaurantCard ───────────────────────────────────────────────────────────

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const navigate = useNavigate()
  const tags = restaurant.specialties?.split(',').map(s => s.trim()).filter(Boolean).slice(0, 2) ?? []
  const gradient = CUISINE_GRADIENT[restaurant.cuisineType ?? ''] ?? 'from-gray-600 to-gray-700'

  return (
    <article
      className="group cursor-pointer overflow-hidden rounded-sm bg-white flex flex-col"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.09)', transition: 'box-shadow 0.3s, transform 0.3s' }}
      onClick={() => navigate(`/restaurants/${restaurant.id}`)}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.16)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.09)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 230 }}>
        <img
          src={getImage(restaurant)}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK(restaurant.id) }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />

        {/* Cuisine tag top-left */}
        {restaurant.cuisineType && (
          <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full text-white bg-gradient-to-r ${gradient}`}>
            {CUISINE_LABEL[restaurant.cuisineType] ?? restaurant.cuisineType}
          </div>
        )}

        {/* Status top-right */}
        {restaurant.active === false && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/90 text-white">
            Tạm đóng
          </span>
        )}

        {/* Bottom: name + location on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-black text-white text-lg leading-snug line-clamp-1 mb-1">
            {restaurant.name}
          </h3>
          {(restaurant.address || restaurant.city) && (
            <p className="flex items-center gap-1 text-white/65 text-xs truncate">
              <MapPin size={11} className="shrink-0 text-[#c9a84c]" />
              {truncate([restaurant.address, restaurant.city].filter(Boolean).join(', '), 45)}
            </p>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-4 pb-4 flex flex-col flex-1">
        {/* Rating + hours row */}
        <div className="flex items-center justify-between mb-3">
          {(restaurant.rating ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Star size={12} className="fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-amber-600">{restaurant.rating?.toFixed(1)}</span>
              </div>
              {restaurant.reviewCount ? (
                <span className="text-xs text-gray-400">{restaurant.reviewCount} đánh giá</span>
              ) : null}
            </div>
          ) : <div />}

          {restaurant.openingHours && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} /> {restaurant.openingHours}
            </span>
          )}
        </div>

        {/* Specialties tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((t, i) => (
              <span key={i}
                className="text-xs font-medium px-2.5 py-1 rounded-full text-gray-600"
                style={{ background: 'rgba(10,22,40,0.07)' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {restaurant.capacity && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={11} /> {restaurant.capacity} chỗ
            </span>
          )}
          <button
            className="ml-auto text-sm font-bold px-5 py-2.5 rounded text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)', boxShadow: '0 4px 12px rgba(201,168,76,0.35)' }}
            onClick={e => { e.stopPropagation(); navigate(`/restaurants/${restaurant.id}`) }}
          >
            Đặt bàn
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function RestaurantCardSkeleton() {
  return (
    <div className="rounded-sm overflow-hidden bg-white animate-pulse"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      {/* Image block — same height as RestaurantCard */}
      <div className="relative bg-gray-200" style={{ height: 230 }}>
        {/* Cuisine tag top-left */}
        <div className="absolute top-3 left-3 h-6 w-20 bg-gray-300 rounded-full" />
        {/* Name + location overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1.5">
          <div className="h-5 bg-gray-300/70 rounded w-3/4" />
          <div className="h-3 bg-gray-300/50 rounded w-1/2" />
        </div>
      </div>
      {/* Card body */}
      <div className="px-4 pt-4 pb-4 space-y-3">
        {/* Rating + opening hours row */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 bg-gray-200 rounded-lg" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        {/* Specialties tags */}
        <div className="flex gap-1.5">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
        {/* CTA */}
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <div className="h-9 w-24 bg-gray-200 rounded" />
        </div>
      </div>
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
    <div className="flex items-center justify-center gap-1.5 mt-14">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-[#0a1628] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronLeft size={16} />
      </button>
      {items.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button key={p}
            className={`w-10 h-10 flex items-center justify-center rounded text-sm font-bold transition-all ${
              page === p ? 'text-white' : 'border border-gray-200 text-gray-700 hover:border-[#0a1628] hover:text-[#0a1628]'
            }`}
            style={page === p ? { background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' } : {}}
            onClick={() => onChange(p as number)}>
            {p}
          </button>
        )
      )}
      <button disabled={page === total} onClick={() => onChange(page + 1)}
        className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:border-[#0a1628] hover:text-[#0a1628] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [search,   setSearch]   = useState('')
  const [city,     setCity]     = useState('')
  const [cuisine,  setCuisine]  = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [guests,   setGuests]   = useState('')

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
    if (applied.cuisine)  list = list.filter(r => r.cuisineType === applied.cuisine)
    if (applied.timeSlot) list = list.filter(r => matchesTimeSlot(r.openingHours, applied.timeSlot))
    if (applied.guests)   list = list.filter(r => (r.capacity ?? 999) >= Number(applied.guests))
    return list
  }, [restaurants, applied])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSearch = () => { setApplied({ search, city, cuisine, timeSlot, guests }); setPage(1) }
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch() }

  const activeFilters: ActiveFilter[] = [
    applied.city     && { key: 'city',     label: `📍 ${applied.city}`,      value: applied.city },
    applied.cuisine  && { key: 'cuisine',  label: CUISINE_LABEL[applied.cuisine] ?? applied.cuisine, value: applied.cuisine },
    applied.timeSlot && { key: 'timeSlot', label: TIME_SLOTS.find(t => t.value === applied.timeSlot)?.label ?? applied.timeSlot, value: applied.timeSlot },
    applied.guests   && { key: 'guests',   label: GUEST_OPTIONS.find(g => g.value === applied.guests)?.label ?? applied.guests, value: applied.guests },
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
    <div className="min-h-screen" style={{ fontFamily: 'Be Vietnam Pro, sans-serif', background: '#fafaf8' }}>
      <Navbar />

      {/* ── Full-viewport hero ── */}
      <section
        className="relative overflow-hidden -mt-16"
        style={{ minHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: 'url(https://picsum.photos/seed/restaurant-food/1920/1080)' }}
        />
        {/* Warm dark overlay — inspired by Folia */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(8,8,8,0.72) 0%, rgba(26,20,10,0.60) 50%, rgba(10,20,35,0.75) 100%)' }} />
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-28 text-center">

          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-white/80 text-sm font-medium tracking-wide">Ẩm thực Việt Nam</span>
          </div>

          {/* Main headline — editorial style */}
          <h1 className="text-white font-black tracking-tight leading-[0.95] mb-6 max-w-3xl mx-auto"
            style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}>
            Nơi nghệ thuật<br />
            <em className="not-italic font-light" style={{ color: '#c9a84c' }}>ẩm thực</em> thăng hoa
          </h1>

          <p className="text-white/50 text-lg max-w-md mx-auto leading-relaxed mb-10">
            Khám phá <span className="text-white/80 font-semibold">{restaurants.length}+</span> nhà hàng được tuyển chọn — từ bình dân đến cao cấp, từ truyền thống đến fusion.
          </p>

          {/* Scroll CTA */}
          <a
            href="#restaurants"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors"
          >
            Khám phá ngay
            <span className="inline-block animate-bounce">↓</span>
          </a>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #fafaf8)' }} />
      </section>

      {/* ── Search + filter bar (sticky) ── */}
      <div
        id="restaurants"
        className="sticky top-[64px] z-40"
        style={{ background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">

          {/* Main search row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                placeholder="Tìm tên nhà hàng, địa điểm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-11 pr-4 py-3 rounded border-2 border-gray-100 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0a1628] focus:ring-4 focus:ring-[#0a1628]/10 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-7 py-3 rounded text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 16px rgba(10,22,40,0.35)' }}
            >
              <Search size={15} /> Tìm kiếm
            </button>
          </div>

          {/* Filters row — scrollable */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 scrollbar-none">
            {/* City inline input */}
            <div className="relative shrink-0">
              <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
              <input
                placeholder="Thành phố..."
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-4 py-2 rounded-full border-2 border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#0a1628] transition-all w-36"
              />
            </div>

            <FilterPill icon={<span className="text-xs">🍜</span>} options={CUISINES} value={cuisine} onChange={setCuisine} placeholder="Ẩm thực" />
            <FilterPill icon={<Clock size={13} />} options={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} placeholder="Khung giờ" />
            <FilterPill icon={<Users size={13} />} options={GUEST_OPTIONS} value={guests} onChange={setGuests} placeholder="Số người" />

            {/* Reset */}
            {(cuisine || timeSlot || guests || city) && (
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-red-500 border-2 border-red-200 hover:bg-red-50 transition-all whitespace-nowrap shrink-0"
              >
                <X size={12} /> Xóa lọc
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Đang lọc:</span>
              {activeFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => removeFilter(f.key)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all hover:opacity-80"
                  style={{ background: 'rgba(201,168,76,0.08)', color: '#c9a84c', borderColor: 'rgba(201,168,76,0.25)' }}
                >
                  {f.label} <X size={11} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c' }}
            >
              ✦ Nhà hàng
            </span>
            <h2 className="font-black text-gray-900 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
              Khám phá nhà hàng
            </h2>
          </div>
          {restaurants.length > 0 && !isLoading && (
            <p className="text-sm text-gray-400 hidden sm:block">
              Trang {page} / {totalPages}
            </p>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded flex items-center justify-center mb-6"
              style={{ background: 'rgba(10,22,40,0.07)' }}>
              <UtensilsCrossed size={36} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Không tìm thấy nhà hàng phù hợp</h3>
            <p className="text-gray-400 text-sm mb-7">Thử thay đổi điều kiện tìm kiếm để xem thêm kết quả</p>
            <button
              onClick={resetAll}
              className="px-8 py-3 rounded text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page} total={totalPages}
                onChange={p => { setPage(p) }}
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
