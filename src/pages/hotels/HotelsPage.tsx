import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Star, Wifi, Waves, Car, Utensils, Dumbbell, Coffee,
  ChevronLeft, ChevronRight, SlidersHorizontal, X, ArrowUpDown, Hotel,
} from 'lucide-react'
import api from '@/api/axiosInstance'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, resolveBase64Image } from '@/lib/utils'

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

// Pool ảnh khách sạn thật từ Unsplash — theo thành phố
const CITY_PHOTOS: Record<string, string[]> = {
  'hồ chí minh': [
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c242b0e0?w=600&q=80',
  ],
  'saigon': [
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  ],
  'hà nội': [
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
  ],
  'đà nẵng': [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338537-71beef4c41ba?w=600&q=80',
    'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=600&q=80',
  ],
  'đà lạt': [
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  ],
  'nha trang': [
    'https://images.unsplash.com/photo-1540541338537-71beef4c41ba?w=600&q=80',
    'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c242b0e0?w=600&q=80',
  ],
  'phú quốc': [
    'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=600&q=80',
    'https://images.unsplash.com/photo-1540541338537-71beef4c41ba?w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  ],
  'hội an': [
    'https://images.unsplash.com/photo-1592595896616-c37162298647?w=600&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
  ],
  'vũng tàu': [
    'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  ],
  'sapa': [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80',
  ],
}

// Pool mặc định nếu không khớp thành phố
const DEFAULT_HOTEL_PHOTOS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c242b0e0?w=600&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
  'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=600&q=80',
]

function fallbackImg(hotel: Hotel): string {
  const cityKey = (hotel.city ?? '').toLowerCase().trim()
  const pool =
    Object.entries(CITY_PHOTOS).find(([key]) => cityKey.includes(key))?.[1]
    ?? DEFAULT_HOTEL_PHOTOS
  return pool[hotel.id % pool.length]
}

function getImage(h: Hotel) {
  if (h.images?.length) return resolveBase64Image(h.images[0].photo, fallbackImg(h))
  if (h.photo)    return resolveBase64Image(h.photo, fallbackImg(h))
  if (h.imageUrl) return h.imageUrl
  return fallbackImg(h)
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

  const thumbCls = `absolute w-full h-0 appearance-none pointer-events-none
    [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md
    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white`

  return (
    <div className="pt-1">
      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-gray-200" />
        <div
          className="absolute h-1.5 rounded-full"
          style={{ left: `${loP}%`, right: `${100 - hiP}%`, background: 'linear-gradient(90deg, #1a3a5c, #c9a84c)' }}
        />
        <input type="range" min={min} max={max} step={200_000} value={lo}
          className={`${thumbCls} [&::-webkit-slider-thumb]:bg-[#1a3a5c]`}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - 200_000), hi])}
        />
        <input type="range" min={min} max={max} step={200_000} value={hi}
          className={`${thumbCls} [&::-webkit-slider-thumb]:bg-[#c9a84c]`}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + 200_000)])}
        />
      </div>
      <div className="flex justify-between text-xs font-bold mt-3" style={{ color: '#1a3a5c', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
        <span>{formatCurrency(lo)}</span>
        <span>{formatCurrency(hi)}</span>
      </div>
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
    <article
      className="group cursor-pointer overflow-hidden flex flex-col"
      style={{
        background: '#fff',
        borderRadius: 0,
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.4s ease, transform 0.4s ease',
      }}
      onClick={() => navigate(`/hotels/${hotel.id}`)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.18)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)'
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 240 }}>
        <img
          src={getImage(hotel)}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={e => { (e.target as HTMLImageElement).src = fallbackImg(hotel) }}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.25) 55%, transparent 100%)' }} />

        {/* Gold divider line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />

        {/* Stars top left */}
        {stars > 0 && (
          <div className="absolute top-4 left-4 flex items-center gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}

        {/* Availability badge */}
        <span
          className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 tracking-wider uppercase"
          style={hotel.active === false
            ? { background: 'rgba(180,50,50,0.85)', color: '#fff', backdropFilter: 'blur(4px)', letterSpacing: '0.08em' }
            : { background: 'rgba(10,22,40,0.7)', color: '#c9a84c', backdropFilter: 'blur(4px)', border: '1px solid rgba(201,168,76,0.5)', letterSpacing: '0.08em' }
          }
        >
          {hotel.active === false ? 'Hết phòng' : 'Còn phòng'}
        </span>

        {/* Hotel name on image */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h3
            className="text-white leading-tight mb-1 line-clamp-1"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.15rem', letterSpacing: '0.01em' }}
          >
            {hotel.name}
          </h3>
          <p className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase"
            style={{ color: 'rgba(201,168,76,0.9)', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.1em' }}>
            <MapPin size={10} className="shrink-0" />
            {[hotel.address, hotel.city].filter(Boolean).join(', ') || 'Việt Nam'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1" style={{ background: '#fff' }}>

        {/* Rating row */}
        {(hotel.rating ?? 0) > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-2.5 py-1" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold" style={{ color: '#c9a84c', fontFamily: 'Be Vietnam Pro, sans-serif' }}>{hotel.rating?.toFixed(1)}</span>
            </div>
            {hotel.reviewCount ? (
              <span className="text-xs text-gray-400" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>{hotel.reviewCount} đánh giá</span>
            ) : null}
          </div>
        )}

        {/* Amenity chips */}
        {amenities.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 mb-4">
            {amenities.map((a, i) => (
              <span key={i}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase"
                style={{ background: 'rgba(26,58,92,0.05)', color: '#1a3a5c', border: '1px solid rgba(26,58,92,0.1)', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.07em' }}>
                {a.icon} {a.label}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#999', fontFamily: 'Be Vietnam Pro, sans-serif' }}>Từ</p>
            <p className="font-bold text-xl leading-none" style={{ color: '#c9a84c', fontFamily: '"Playfair Display", serif' }}>
              {price > 0 ? formatCurrency(price) : '—'}
            </p>
            <p className="text-[10px] mt-1 uppercase tracking-wider" style={{ color: '#aaa', fontFamily: 'Be Vietnam Pro, sans-serif' }}>/đêm</p>
          </div>
          <button
            className="text-[11px] font-bold px-6 py-3 text-white transition-all hover:opacity-90 active:scale-95 tracking-widest uppercase"
            style={{ background: '#0a1628', letterSpacing: '0.12em', fontFamily: 'Be Vietnam Pro, sans-serif' }}
            onClick={e => { e.stopPropagation(); navigate(`/hotels/${hotel.id}`) }}
          >
            Đặt Phòng
          </button>
        </div>
      </div>
    </article>
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
  const [open, setOpen] = useState({ dest: true, date: true, stars: true, price: true })
  const toggle = (k: keyof typeof open) => setOpen(s => ({ ...s, [k]: !s[k] }))

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

  const labelCls = 'w-full flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 cursor-pointer hover:text-[#1a3a5c] transition-colors'
  const inputCls = 'w-full px-4 py-3 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 transition-all bg-[#f8f5ee] focus:bg-white'

  return (
    <div className="bg-white border border-gray-100 p-6 space-y-6"
      style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.07)' }}>

      {/* Header */}
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#0a1628' }}>
            <SlidersHorizontal size={14} className="text-white" />
          </div>
          <h2 className="font-bold text-gray-900 tracking-widest uppercase text-sm"
            style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '0.15em' }}>Bộ Lọc</h2>
        </div>
        <button onClick={onReset}
          className="text-[10px] font-bold transition-colors hover:text-[#c9a84c] tracking-widest uppercase"
          style={{ color: '#1a3a5c', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
          Xóa tất cả
        </button>
      </div>

      {/* Destination */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('dest')}>
          Điểm đến <span>{open.dest ? '−' : '+'}</span>
        </button>
        {open.dest && (
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Thành phố, địa điểm..."
              value={draft.destination}
              onChange={e => setDraft(f => ({ ...f, destination: e.target.value }))}
              className={`${inputCls} pl-10`}
              style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
            />
          </div>
        )}
      </div>

      {/* Date range */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('date')}>
          Ngày nhận — Trả phòng <span>{open.date ? '−' : '+'}</span>
        </button>
        {open.date && (
          <>
            <DatePicker
              selectsRange
              startDate={draft.checkIn ?? undefined}
              endDate={draft.checkOut ?? undefined}
              onChange={([s, e]) => setDraft(f => ({ ...f, checkIn: s ?? null, checkOut: e ?? null }))}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn khoảng ngày..."
              className={inputCls}
            />
            {draft.checkIn && draft.checkOut && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5"
                style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                <span className="inline-block w-1.5 h-1.5" style={{ background: '#c9a84c' }} />
                {dayjs(draft.checkOut).diff(dayjs(draft.checkIn), 'day')} đêm
              </p>
            )}
          </>
        )}
      </div>

      {/* Stars */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('stars')}>
          Hạng sao <span>{open.stars ? '−' : '+'}</span>
        </button>
        {open.stars && (
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map(s => (
              <label key={s} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    checked={draft.stars.includes(s)}
                    onCheckedChange={() => toggleStar(s)}
                  />
                  <div className="flex gap-0.5">
                    {Array.from({ length: s }, (_, i) => (
                      <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors"
                    style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>{s} sao</span>
                </div>
                <span className="text-xs text-gray-400" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                  {starCounts[s] !== undefined ? `(${starCounts[s]})` : ''}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price range */}
      <div className="border-t border-gray-100 pt-5">
        <button className={labelCls} onClick={() => toggle('price')}>
          Giá / đêm <span>{open.price ? '−' : '+'}</span>
        </button>
        {open.price && (
          <DualRangeSlider
            value={draft.priceRange}
            onChange={v => setDraft(f => ({ ...f, priceRange: v }))}
          />
        )}
      </div>

      {/* Apply */}
      <button
        className="w-full py-3.5 text-white text-[11px] font-bold transition-all hover:opacity-90 active:scale-95 tracking-widest uppercase"
        style={{ background: '#0a1628', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.15em' }}
        onClick={onApply}
      >
        Áp Dụng Bộ Lọc
      </button>
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
        className="w-10 h-10 flex items-center justify-center border text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        style={{ borderColor: '#d1d5db' }}>
        <ChevronLeft size={16} />
      </button>
      {items.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button key={p}
            className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-all ${
              page === p
                ? 'text-white'
                : 'border border-gray-200 text-gray-700 hover:border-[#c9a84c] hover:text-[#c9a84c]'
            }`}
            style={page === p ? { background: '#0a1628' } : {}}
            onClick={() => onChange(p as number)}>
            {p}
          </button>
        )
      )}
      <button disabled={page === total} onClick={() => onChange(page + 1)}
        className="w-10 h-10 flex items-center justify-center border text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        style={{ borderColor: '#d1d5db' }}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HotelsPage() {
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
  const goPage = (p: number) => { setPage(p) }

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f0', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
      <Navbar />

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden -mt-16"
        style={{ minHeight: 580 }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=85)',
          }}
        />
        {/* Dark blue overlay — matching Mona Hotel deep night feel */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(5,14,32,0.72) 0%, rgba(10,22,48,0.65) 50%, rgba(5,10,25,0.78) 100%)',
          }}
        />
        {/* Subtle warm glow at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(201,168,76,0.08), transparent)' }}
        />

        {/* Gold bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.6) 30%, rgba(201,168,76,0.9) 50%, rgba(201,168,76,0.6) 70%, transparent 100%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center"
          style={{ paddingTop: 160, paddingBottom: 90 }}>

          {/* Eyebrow label */}
          <p
            className="uppercase tracking-widest text-xs mb-5"
            style={{ color: 'rgba(201,168,76,0.85)', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.3em' }}
          >
            Khách Sạn &amp; Resort Cao Cấp
          </p>

          {/* Gold decorative line */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#c9a84c' }} />
            <div className="h-px w-12" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>

          {/* Main title — script font like Mona Hotel */}
          <h1
            className="text-white leading-none mb-3"
            style={{
              fontFamily: '"Great Vibes", cursive',
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              textShadow: '0 4px 30px rgba(0,0,0,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Khách Sạn Việt Nam
          </h1>

          {/* Sub title — Playfair Display */}
          <h2
            className="text-white/90 mb-4"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 400,
              fontSize: 'clamp(1rem, 2vw, 1.35rem)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Khám Phá Những Điểm Lưu Trú Đẳng Cấp
          </h2>

          <p className="text-white/45 text-sm max-w-md mx-auto mb-10"
            style={{ fontFamily: 'Be Vietnam Pro, sans-serif', lineHeight: 1.8 }}>
            Hơn <span className="text-white/80 font-semibold">{hotels.length}+</span> khách sạn, resort &amp; homestay
            được tuyển chọn kỹ lưỡng trên khắp Việt Nam
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-0">
            {[
              { v: `${hotels.length}+`, l: 'Khách Sạn' },
              { v: '15+',    l: 'Thành Phố' },
              { v: '4.8★',  l: 'Đánh Giá TB' },
            ].map((s, i) => (
              <div key={s.l} className="flex items-center">
                {i > 0 && <div className="w-px h-10 mx-8" style={{ background: 'rgba(201,168,76,0.35)' }} />}
                <div className="text-center">
                  <p className="text-2xl font-bold text-white leading-none"
                    style={{ fontFamily: '"Playfair Display", serif' }}>{s.v}</p>
                  <p className="uppercase tracking-widest mt-1.5"
                    style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.6rem', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.2em' }}>{s.l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section heading ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-2 text-center">
        <p className="uppercase tracking-widest text-[10px] mb-3"
          style={{ color: '#c9a84c', fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.3em' }}>
          Danh Sách
        </p>
        <h2 className="text-gray-900"
          style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', fontWeight: 600, letterSpacing: '0.02em' }}>
          Tìm Kiếm Khách Sạn
        </h2>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="h-px w-12" style={{ background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: '#c9a84c' }} />
          <div className="h-px w-12" style={{ background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSidebar draft={draft} setDraft={setDraft}
                onApply={apply} onReset={reset} hotels={hotels} />
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-4"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              <div className="flex items-center gap-2.5">
                <button onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-all hover:scale-105"
                  style={{
                    background: 'rgba(26,58,92,0.06)',
                    color: '#1a3a5c',
                    border: '1px solid rgba(26,58,92,0.2)',
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    letterSpacing: '0.05em',
                  }}>
                  <SlidersHorizontal size={14} /> Bộ lọc
                </button>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border"
                  style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <ArrowUpDown size={13} className="text-gray-400" />
                  <select
                    value={sort}
                    onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
                    className="text-sm font-semibold text-gray-700 focus:outline-none appearance-none bg-transparent cursor-pointer"
                    style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
                  >
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="newest">Mới nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="overflow-hidden bg-white animate-pulse"
                    style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
                    {/* Image with overlay shimmer — matches HotelCard 240px */}
                    <div className="relative bg-gray-200" style={{ height: 240 }}>
                      <div className="absolute top-4 left-4 flex gap-0.5">
                        {[1,2,3,4,5].map(s => <div key={s} className="w-3 h-3 rounded-sm bg-gray-300" />)}
                      </div>
                      <div className="absolute top-4 right-4 h-5 w-16 bg-gray-300 rounded-sm" />
                      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 space-y-1.5">
                        <div className="h-5 bg-gray-300/70 rounded w-3/4" />
                        <div className="h-3 bg-gray-300/50 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="px-5 pt-4 pb-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-12 bg-gray-200 rounded" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                      </div>
                      <div className="flex gap-1.5">
                        {[1,2,3].map(j => <div key={j} className="h-6 w-16 bg-gray-200 rounded" />)}
                      </div>
                      <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                        <div className="space-y-1">
                          <div className="h-3 w-8 bg-gray-200 rounded" />
                          <div className="h-6 w-24 bg-gray-200 rounded" />
                          <div className="h-3 w-10 bg-gray-200 rounded" />
                        </div>
                        <div className="h-10 w-28 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 flex items-center justify-center mb-5"
                  style={{ background: 'rgba(26,58,92,0.05)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <span className="text-4xl">🏨</span>
                </div>
                <h3 className="text-xl mb-2" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: '#0a1628' }}>
                  Không tìm thấy khách sạn
                </h3>
                <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                  Hãy thử thay đổi bộ lọc tìm kiếm
                </p>
                <button onClick={reset}
                  className="px-8 py-3 text-white text-[11px] font-bold transition-all hover:opacity-90 tracking-widest uppercase"
                  style={{ background: '#0a1628', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                  Xóa Bộ Lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paged.map(h => <HotelCard key={h.id} hotel={h} />)}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination page={page} total={totalPages} onChange={goPage} />
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom sheet ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-white overflow-y-auto"
            style={{ boxShadow: '0 -10px 60px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between px-6 py-5 sticky top-0 bg-white z-10"
              style={{ borderBottom: '1px solid rgba(201,168,76,0.25)' }}>
              <span className="font-bold tracking-widest uppercase text-sm"
                style={{ fontFamily: '"Playfair Display", serif', color: '#0a1628' }}>Bộ Lọc</span>
              <button onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <FilterSidebar draft={draft} setDraft={setDraft}
                onApply={apply} onReset={reset} hotels={hotels} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
