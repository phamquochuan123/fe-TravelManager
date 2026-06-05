import { useEffect, useRef, useState } from 'react'
import { resolveBase64Image } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import {
  MdSearch, MdLocationOn, MdCalendarToday, MdPeople,
  MdFlight, MdHotel, MdRestaurant,
  MdStar, MdStarBorder, MdArrowForward,
  MdAccessTime, MdVerified, MdClose, MdFlashOn,
  MdSecurity, MdHeadsetMic, MdThumbUp,
} from 'react-icons/md'
import { getAllTours } from '../../api/tourApi'
import { getAllDestinations } from '../../api/destinationApi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiTour {
  id: number
  name: string
  destination?: string
  durationDays?: number
  priceAdult?: number
  images?: string[]
  rating?: number
  availableSlots?: number
}

interface ApiDestination {
  id: number
  name: string
  city?: string
  province?: string
  description?: string
  photo?: string
  isActive?: boolean
}

// ─── Static data ──────────────────────────────────────────────────────────────


const SERVICES = [
  { icon: MdFlight,     label: 'Đặt Tour',       desc: 'Khám phá hàng trăm tour trong và ngoài nước với giá tốt nhất', path: '/tours' },
  { icon: MdHotel,      label: 'Đặt Khách sạn', desc: 'Tìm phòng phù hợp ngân sách từ homestay đến resort 5 sao',    path: '/hotels' },
  { icon: MdRestaurant, label: 'Đặt Nhà hàng',  desc: 'Trải nghiệm ẩm thực địa phương tại những nhà hàng hàng đầu', path: '/restaurants' },
]

const TESTIMONIALS = [
  {
    name: 'Nguyễn Thị Mai', avatar: 'https://picsum.photos/seed/avatar-mai/80/80',
    rating: 5, dest: 'Tour Hạ Long 3N2Đ',
    text: 'Dịch vụ tuyệt vời! Đặt tour nhanh chóng, hướng dẫn viên nhiệt tình. Sẽ tiếp tục sử dụng TravelVN cho những chuyến đi tiếp theo.',
  },
  {
    name: 'Trần Văn Hùng', avatar: 'https://picsum.photos/seed/avatar-hung/80/80',
    rating: 5, dest: 'Tour Đà Nẵng 4N3Đ',
    text: 'Giao diện thân thiện, thông tin rõ ràng. Chuyến đi vượt ngoài kỳ vọng. Cảnh đẹp, đồ ăn ngon, dịch vụ chuyên nghiệp từ đầu đến cuối.',
  },
  {
    name: 'Lê Thị Hương', avatar: 'https://picsum.photos/seed/avatar-huong/80/80',
    rating: 4, dest: 'Tour Phú Quốc 5N4Đ',
    text: 'Giá cả hợp lý, đúng như mô tả. Khách sạn sạch sẽ, bãi biển đẹp. Chắc chắn sẽ giới thiệu cho bạn bè và người thân.',
  },
]

const WHY_US = [
  {
    icon: MdFlashOn,    title: 'Xác nhận tức thì',
    desc: 'Nhận email xác nhận đặt chỗ ngay sau khi thanh toán, không cần chờ đợi.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: MdThumbUp,   title: 'Hủy linh hoạt',
    desc: 'Hoàn tiền 100% nếu hủy trước 48 giờ. Không câu hỏi, không phí ẩn.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: MdSecurity,  title: 'Thanh toán bảo mật',
    desc: 'Tích hợp VNPay với mã hóa SSL 256-bit. Thông tin của bạn luôn được bảo vệ.',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    icon: MdHeadsetMic, title: 'Hỗ trợ 24/7',
    desc: 'Tổng đài miễn phí và chat trực tiếp. Chúng tôi ở đây mọi lúc bạn cần.',
    gradient: 'from-violet-400 to-purple-500',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Stars = ({ n, max = 5 }: { n: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) =>
      i < n
        ? <MdStar key={i} size={14} className="text-[#c9a84c]" />
        : <MdStarBorder key={i} size={14} className="text-gray-600" />
    )}
  </div>
)

const fmtPrice = (p: number): string => `${p.toLocaleString('vi-VN')}₫`

const tourImageSrc = (tour: ApiTour): string | null => {
  if (!tour.images?.length || !tour.images[0]) return null
  return resolveBase64Image(tour.images[0], '')
}

const destImageSrc = (dest: ApiDestination): string | null => {
  if (!dest.photo) return null
  return resolveBase64Image(dest.photo, '')
}

// ─── ScrollReveal hook ────────────────────────────────────────────────────────

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// ─── 1. HeroSection ──────────────────────────────────────────────────────────

type SearchTab = 'tour' | 'hotel' | 'restaurant'

const TABS: { key: SearchTab; icon: typeof MdFlight; label: string }[] = [
  { key: 'tour',       icon: MdFlight,     label: 'Tour du lịch' },
  { key: 'hotel',      icon: MdHotel,      label: 'Khách sạn'   },
  { key: 'restaurant', icon: MdRestaurant, label: 'Nhà hàng'    },
]

const HeroSection = () => {
  const navigate = useNavigate()
  const [tab, setTab]               = useState<SearchTab>('tour')
  const [bannerOpen, setBannerOpen] = useState(true)

  const [dest, setDest]         = useState('')
  const [date, setDate]         = useState<Date | null>(null)
  const [persons, setPersons]   = useState(2)

  const [hotelLoc, setHotelLoc]   = useState('')
  const [checkIn, setCheckIn]     = useState<Date | null>(null)
  const [checkOut, setCheckOut]   = useState<Date | null>(null)
  const [rooms, setRooms]         = useState(1)

  const [restLoc, setRestLoc]       = useState('')
  const [restDate, setRestDate]     = useState<Date | null>(null)
  const [restGuests, setRestGuests] = useState(2)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (tab === 'tour') {
      if (dest.trim())   p.set('destination', dest.trim())
      if (date)          p.set('date', dayjs(date).format('YYYY-MM-DD'))
      if (persons !== 1) p.set('persons', String(persons))
      navigate(`/tours${p.toString() ? `?${p}` : ''}`)
    } else if (tab === 'hotel') {
      if (hotelLoc.trim()) p.set('destination', hotelLoc.trim())
      if (checkIn)         p.set('checkIn',  dayjs(checkIn).format('YYYY-MM-DD'))
      if (checkOut)        p.set('checkOut', dayjs(checkOut).format('YYYY-MM-DD'))
      if (rooms !== 1)     p.set('rooms', String(rooms))
      navigate(`/hotels${p.toString() ? `?${p}` : ''}`)
    } else {
      if (restLoc.trim()) p.set('name', restLoc.trim())
      if (restDate)       p.set('date', dayjs(restDate).format('YYYY-MM-DD'))
      navigate(`/restaurants${p.toString() ? `?${p}` : ''}`)
    }
  }

  const inputCls = 'w-full py-3.5 border-0 rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a1628]/30 transition-all bg-[#f8f5ee]'

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden -mt-16 pt-16">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: 'url(https://picsum.photos/seed/vietnam-landscape/1920/1080)' }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(10,25,47,0.92) 0%, rgba(10,22,40,0.80) 50%, rgba(10,25,47,0.70) 100%)' }}
      />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Announcement bar */}
      {bannerOpen && (
        <div className="relative z-10 py-2.5 px-4" style={{ background: 'rgba(201,168,76,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center justify-center gap-3 max-w-5xl mx-auto">
            <MdFlashOn size={16} className="text-white shrink-0" />
            <p className="text-white text-sm font-semibold text-center leading-tight">
              Ưu đãi hè 2025 — Giảm đến 30% tour Phú Quốc, Đà Nẵng &amp; Hội An.{' '}
              <button onClick={() => navigate('/tours')} className="underline underline-offset-2 font-bold hover:no-underline">
                Xem ngay
              </button>
            </p>
            <button
              onClick={() => setBannerOpen(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              aria-label="Đóng thông báo"
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-20">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
          <span className="text-white/85 text-sm font-medium tracking-wide">Du lịch Việt Nam cùng TravelVN</span>
        </div>

        {/* Headline */}
        <h1 className="text-center leading-[1.05] tracking-tight mb-6 max-w-4xl mx-auto">
          <span className="block font-black text-white" style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}>
            Khám phá Việt Nam
          </span>
          <span className="block font-light mt-1" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#c9a84c' }}>
            theo cách của bạn
          </span>
        </h1>
        <p className="text-white/50 text-base sm:text-lg mb-12 max-w-lg mx-auto text-center leading-relaxed">
          Tour, khách sạn và nhà hàng hàng đầu —{' '}
          <span className="text-white/80 font-semibold">đặt tất cả trong một nơi.</span>
        </p>

        {/* Search card */}
        <div
          className="w-full max-w-4xl rounded-sm overflow-hidden shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-[#f8f5ee]/50">
            {TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold flex-1 transition-all duration-200 ${
                  tab === key
                    ? 'text-[#0a1628] border-b-2 border-[#c9a84c] bg-white'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-white/60'
                }`}
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="p-5 sm:p-6">
            {tab === 'tour' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MdLocationOn size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0a1628] pointer-events-none" />
                  <input type="text" placeholder="Điểm đến (Hà Nội, Đà Nẵng...)"
                    value={dest} onChange={e => setDest(e.target.value)}
                    className={`${inputCls} pl-10 pr-4`} />
                </div>
                <div className="sm:w-44 relative">
                  <MdCalendarToday size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-[#0a1628] pointer-events-none" />
                  <DatePicker selected={date} onChange={(d: Date | null) => setDate(d)}
                    placeholderText="Ngày đi" minDate={new Date()} dateFormat="dd/MM/yyyy"
                    wrapperClassName="w-full"
                    className={`${inputCls} pl-10 pr-4 cursor-pointer`} />
                </div>
                <div className="sm:w-36 relative">
                  <MdPeople size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-[#0a1628] pointer-events-none" />
                  <select value={persons} onChange={e => setPersons(Number(e.target.value))}
                    className={`${inputCls} pl-10 pr-4 appearance-none cursor-pointer`}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} người</option>
                    ))}
                  </select>
                </div>
                <button type="submit"
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)', boxShadow: '0 4px 15px rgba(201,168,76,0.4)' }}>
                  <MdSearch size={18} /> Tìm Tour
                </button>
              </div>
            )}

            {tab === 'hotel' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MdLocationOn size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0a1628] pointer-events-none" />
                  <input type="text" placeholder="Thành phố hoặc khách sạn..."
                    value={hotelLoc} onChange={e => setHotelLoc(e.target.value)}
                    className={`${inputCls} pl-10 pr-4`} />
                </div>
                <div className="sm:w-40 relative">
                  <MdCalendarToday size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-[#0a1628] pointer-events-none" />
                  <DatePicker selected={checkIn} onChange={(d: Date | null) => setCheckIn(d)}
                    placeholderText="Nhận phòng" minDate={new Date()} dateFormat="dd/MM/yyyy"
                    wrapperClassName="w-full"
                    className={`${inputCls} pl-10 pr-4 cursor-pointer`} />
                </div>
                <div className="sm:w-40 relative">
                  <MdCalendarToday size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-[#0a1628] pointer-events-none" />
                  <DatePicker selected={checkOut} onChange={(d: Date | null) => setCheckOut(d)}
                    placeholderText="Trả phòng" minDate={checkIn ?? new Date()} dateFormat="dd/MM/yyyy"
                    wrapperClassName="w-full"
                    className={`${inputCls} pl-10 pr-4 cursor-pointer`} />
                </div>
                <div className="sm:w-28">
                  <select value={rooms} onChange={e => setRooms(Number(e.target.value))}
                    className={`${inputCls} px-4 appearance-none cursor-pointer`}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} phòng</option>
                    ))}
                  </select>
                </div>
                <button type="submit"
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)', boxShadow: '0 4px 15px rgba(201,168,76,0.4)' }}>
                  <MdSearch size={18} /> Tìm Phòng
                </button>
              </div>
            )}

            {tab === 'restaurant' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MdLocationOn size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0a1628] pointer-events-none" />
                  <input type="text" placeholder="Tên nhà hàng hoặc địa điểm..."
                    value={restLoc} onChange={e => setRestLoc(e.target.value)}
                    className={`${inputCls} pl-10 pr-4`} />
                </div>
                <div className="sm:w-44 relative">
                  <MdCalendarToday size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-[#0a1628] pointer-events-none" />
                  <DatePicker selected={restDate} onChange={(d: Date | null) => setRestDate(d)}
                    placeholderText="Ngày đặt bàn" minDate={new Date()} dateFormat="dd/MM/yyyy"
                    wrapperClassName="w-full"
                    className={`${inputCls} pl-10 pr-4 cursor-pointer`} />
                </div>
                <div className="sm:w-36 relative">
                  <MdPeople size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-[#0a1628] pointer-events-none" />
                  <select value={restGuests} onChange={e => setRestGuests(Number(e.target.value))}
                    className={`${inputCls} pl-10 pr-4 appearance-none cursor-pointer`}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} người</option>
                    ))}
                  </select>
                </div>
                <button type="submit"
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)', boxShadow: '0 4px 15px rgba(201,168,76,0.4)' }}>
                  <MdSearch size={18} /> Tìm Nhà hàng
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 sm:gap-16 mt-14">
          {[
            { v: '200+', l: 'Tour hấp dẫn' },
            { v: '500+', l: 'Khách sạn' },
            { v: '50K+', l: 'Khách hài lòng' },
          ].map((s, i) => (
            <>
              {i > 0 && <div key={`div-${i}`} className="h-10 w-px bg-white/15" />}
              <div key={s.l} className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">{s.v}</p>
                <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">{s.l}</p>
              </div>
            </>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-30 pointer-events-none">
        <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-2.5 bg-white rounded-full" />
        </div>
      </div>
    </section>
  )
}

// ─── 2. TourCard ──────────────────────────────────────────────────────────────

const TourCard = ({ tour, tall = false }: { tour: ApiTour; tall?: boolean }) => {
  const navigate = useNavigate()
  const img = tourImageSrc(tour)
  const [hovered, setHovered] = useState(false)

  return (
    <article
      className={`relative overflow-hidden rounded cursor-pointer group ${tall ? 'row-span-2' : ''}`}
      style={{ minHeight: tall ? 480 : 280, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
      onClick={() => navigate(`/tours/${tour.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <img
        src={img ?? `https://picsum.photos/seed/tour-${tour.id}/480/640`}
        alt={tour.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Gradient */}
      <div className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

      {/* Top badges */}
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#c9a84c,#b8960e)' }}>
          <MdVerified size={10} /> Nổi bật
        </span>
      </div>
      {tour.durationDays && (
        <div className="absolute top-4 right-4">
          <span className="flex items-center gap-1 text-white text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <MdAccessTime size={11} /> {tour.durationDays} ngày
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {tour.destination && (
          <div className="flex items-center gap-1 mb-2">
            <MdLocationOn size={12} className="text-white/70" />
            <span className="text-white/70 text-xs font-medium">{tour.destination}</span>
          </div>
        )}
        <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 mb-3 leading-snug">
          {tour.name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Giá từ</p>
            <p className="text-2xl font-black text-[#c9a84c] leading-none">
              {tour.priceAdult ? fmtPrice(tour.priceAdult) : 'Liên hệ'}
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded transition-all duration-300 ${
              hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}
          >
            Xem chi tiết <MdArrowForward size={14} />
          </div>
        </div>
        {tour.availableSlots != null && tour.availableSlots < 10 && (
          <p className="text-xs font-bold text-red-400 mt-2">
            Còn {tour.availableSlots} chỗ
          </p>
        )}
      </div>
    </article>
  )
}

const TourCardSkeleton = ({ tall = false }: { tall?: boolean }) => (
  <div className={`rounded overflow-hidden animate-pulse bg-gray-200 ${tall ? 'row-span-2' : ''}`}
    style={{ minHeight: tall ? 480 : 280 }} />
)

// ─── 3. FeaturedToursSection ──────────────────────────────────────────────────

const FeaturedToursSection = () => {
  const navigate = useNavigate()
  const { ref, visible } = useReveal()
  const { data: tours, isLoading } = useQuery<ApiTour[]>({
    queryKey: ['tours', 'featured'],
    queryFn: () => getAllTours() as Promise<ApiTour[]>,
    select: data => data.slice(0, 5),
  })

  return (
    <section className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-4 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              ✦ Nổi bật
            </span>
            <h2 className="font-semibold text-gray-900 leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Tour du lịch{' '}
              <span style={{ color: '#0a1628' }}>hấp dẫn nhất</span>
            </h2>
            <p className="text-gray-500 mt-2 text-base">Những hành trình đáng nhớ đang chờ bạn khám phá</p>
          </div>
          <button
            onClick={() => navigate('/tours')}
            className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded border-2 transition-all hover:text-white hover:scale-105 active:scale-95 shrink-0"
            style={{ borderColor: '#0a1628', color: '#0a1628' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0a1628' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Xem tất cả <MdArrowForward size={16} />
          </button>
        </div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-[280px]">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <TourCardSkeleton key={i} tall={i === 0} />)
            : tours?.map((t, i) => <TourCard key={t.id} tour={t} tall={i === 0} />)
          }
        </div>

        {!isLoading && (!tours || tours.length === 0) && (
          <div className="text-center py-20">
            <MdFlight size={52} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400 font-medium">Chưa có tour nào. Vui lòng thử lại sau.</p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 4. PopularDestinationsSection ───────────────────────────────────────────

const DestCardSkeleton = ({ tall = false }: { tall?: boolean }) => (
  <div className={`rounded overflow-hidden animate-pulse bg-gray-700 ${tall ? 'sm:row-span-3' : ''}`}
    style={{ minHeight: tall ? 520 : 160 }} />
)

const PopularDestinationsSection = () => {
  const navigate = useNavigate()
  const { ref, visible } = useReveal()
  const { data: destinations, isLoading } = useQuery<ApiDestination[]>({
    queryKey: ['destinations', 'popular'],
    queryFn: () => getAllDestinations() as Promise<ApiDestination[]>,
    select: data => data.filter(d => d.isActive !== false).slice(0, 4),
  })

  const first = destinations?.[0]
  const rest  = destinations?.slice(1) ?? []

  return (
    <section className="py-24 px-6 bg-[#06101e]" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span
            className="inline-block px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider mb-4"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            Điểm đến
          </span>
          <h2 className="font-semibold text-white leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            Điểm đến phổ biến
          </h2>
          <p className="text-white/40 mt-2 max-w-md mx-auto">
            Những địa danh nổi tiếng nhất Việt Nam đang chờ bạn khám phá
          </p>
        </div>

        {/* Bento grid: 1 tall left + 3 stacked right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <DestCardSkeleton tall />
              <DestCardSkeleton />
              <DestCardSkeleton />
              <DestCardSkeleton />
            </>
          ) : (
            <>
              {/* Large card */}
              {first && (
                <button
                  onClick={() => navigate(`/destinations/${first.id}`)}
                  className="relative overflow-hidden rounded cursor-pointer group text-left sm:row-span-3"
                  style={{ minHeight: 520 }}
                >
                  <img
                    src={destImageSrc(first) ?? `https://picsum.photos/seed/dest-${first.id}/800/900`}
                    alt={first.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="text-white font-black mb-2 transition-all duration-300" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
                      {first.name}
                    </h3>
                    <p className="text-white/60 text-sm mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {first.description || (first.city ?? first.province)}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ background: 'linear-gradient(135deg, #c9a84c, #b8960e)' }}>
                      Khám phá ngay <MdArrowForward size={12} />
                    </span>
                  </div>
                </button>
              )}

              {/* 3 smaller cards */}
              {rest.map(d => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/destinations/${d.id}`)}
                  className="relative overflow-hidden rounded cursor-pointer group text-left"
                  style={{ minHeight: 160 }}
                >
                  <img
                    src={destImageSrc(d) ?? `https://picsum.photos/seed/dest-${d.id}/600/300`}
                    alt={d.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 transition-all duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-black text-xl">{d.name}</h3>
                      <p className="text-white/50 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {d.description || (d.city ?? d.province)}
                      </p>
                    </div>
                    <span className="text-white/0 group-hover:text-white transition-all duration-300">
                      <MdArrowForward size={20} />
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── 5. WhyUsSection ─────────────────────────────────────────────────────────

const WhyUsSection = () => {
  const { ref, visible } = useReveal()

  return (
    <section className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left editorial text */}
          <div
            className={`lg:w-2/5 shrink-0 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <span
              className="inline-block px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider mb-5"
              style={{ background: 'rgba(10,22,40,0.1)', color: '#0a1628' }}
            >
              Cam kết
            </span>
            <h2 className="font-semibold text-gray-900 leading-tight mb-5" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Tại sao chọn<br />
              <span style={{ color: '#0a1628' }}>TravelVN?</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Chúng tôi đặt sự hài lòng của bạn lên hàng đầu, từng chi tiết nhỏ — từ lúc đặt tour đến khi về nhà.
            </p>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', boxShadow: '0 4px 15px rgba(10,22,40,0.3)' }}
            >
              Khám phá ngay <MdArrowForward size={15} />
            </button>
          </div>

          {/* Right 2x2 grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_US.map(({ icon: Icon, title, desc, gradient }, i) => (
              <div
                key={title}
                className={`p-6 rounded border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${200 + i * 80}ms` }}
              >
                <div className={`w-11 h-11 rounded flex items-center justify-center mb-4 bg-gradient-to-br ${gradient}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── 6. ServicesSection ──────────────────────────────────────────────────────

const ServicesSection = () => {
  const navigate = useNavigate()
  const { ref, visible } = useReveal()

  return (
    <section className="py-24 px-6 bg-[#f8f5ee]" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span
            className="inline-block px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider mb-4"
            style={{ background: 'rgba(10,22,40,0.1)', color: '#0a1628' }}
          >
            Dịch vụ
          </span>
          <h2 className="font-semibold text-gray-900 leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            Một nơi. <span style={{ color: '#c9a84c' }}>Mọi dịch vụ du lịch.</span>
          </h2>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">
            Từ tour khám phá đến phòng nghỉ và bàn ăn — đặt tất cả trong một lần.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, label, desc, path }, i) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`group text-left p-8 rounded border border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div
                className="w-14 h-14 rounded flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)' }}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#0a1628] transition-colors">{label}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{desc}</p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#0a1628] group-hover:gap-3 transition-all">
                Khám phá <MdArrowForward size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 7. TestimonialsSection ───────────────────────────────────────────────────

const TestimonialsSection = () => {
  const { ref, visible } = useReveal()

  return (
    <section className="py-24 px-6 bg-[#06101e]" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div
          className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span
            className="inline-block px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider mb-4"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            Đánh giá
          </span>
          <h2 className="font-semibold text-white leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
            Khách hàng nói gì<br />
            <span className="text-white/50 font-light">về chúng tôi</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={t.name}
              className={`p-7 rounded flex flex-col gap-5 transition-all duration-700 hover:-translate-y-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                transitionDelay: `${i * 100}ms`,
              }}
            >
              {/* Giant quote mark */}
              <div className="text-8xl font-serif leading-none -mb-4" style={{ color: 'rgba(201,168,76,0.2)' }}>"</div>

              <div className="flex items-center justify-between">
                <Stars n={t.rating} />
                <MdVerified size={16} className="text-[#c9a84c]" />
              </div>
              <p className="text-sm leading-relaxed flex-1 text-white/60">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                <img src={t.avatar} alt={t.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#c9a84c]" />
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-[#c9a84c]">{t.dest}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage = () => (
  <div>
    <Navbar />
    <HeroSection />
    <FeaturedToursSection />
    <PopularDestinationsSection />
    <WhyUsSection />
    <ServicesSection />
    <TestimonialsSection />
    <Footer />
  </div>
)

export default HomePage
