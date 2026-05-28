import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import {
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiArrowRight,
  HiOutlineStar,
  HiStar,
  HiOutlineClock,
  HiOutlineBadgeCheck,
  HiOutlineGlobeAlt,
  HiOutlineHome,
  HiOutlineSparkles,
} from 'react-icons/hi'
import { getAllTours } from '../../api/tourApi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'

interface ApiTourImage {
  id: number
  photo: number[]
}
interface ApiTour {
  id: number
  name: string
  destination?: string
  durationDays?: number
  priceAdult?: number
  images?: ApiTourImage[]
  rating?: number
  availableSlots?: number
}

const DESTINATIONS = [
  { name: 'Ha Noi', seed: 'hanoi-city', path: 'Ha Noi', desc: 'Thu do nghin nam van hien' },
  { name: 'Da Nang', seed: 'danang-beach', path: 'Da Nang', desc: 'Thanh pho dang song nhat' },
  { name: 'Hoi An', seed: 'hoian-lanterns', path: 'Hoi An', desc: 'Pho co huyen bi lung linh' },
  { name: 'Phu Quoc', seed: 'phuquoc-island', path: 'Phu Quoc', desc: 'Dao ngoc thien duong' },
]

const SERVICES = [
  {
    icon: HiOutlineGlobeAlt,
    label: 'Dat Tour',
    desc: 'Kham pha hang tram tour trong va ngoai nuoc voi gia tot nhat',
    path: '/tours',
    stat: '200+',
    statLabel: 'Tour',
  },
  {
    icon: HiOutlineHome,
    label: 'Dat Khach san',
    desc: 'Tim phong phu hop ngan sach tu homestay den resort 5 sao',
    path: '/hotels',
    stat: '500+',
    statLabel: 'Khach san',
  },
  {
    icon: HiOutlineSparkles,
    label: 'Dat Nha hang',
    desc: 'Trai nghiem am thuc dia phuong tai nhung nha hang hang dau',
    path: '/restaurants',
    stat: '100+',
    statLabel: 'Nha hang',
  },
]

const TESTIMONIALS = [
  {
    name: 'Nguyen Thi Mai',
    avatar: 'https://picsum.photos/seed/avatar-mai/80/80',
    rating: 5,
    dest: 'Tour Ha Long 3N2D',
    text: 'Dich vu tuyet voi! Dat tour nhanh chong, huong dan vien nhiet tinh. Se tiep tuc su dung TravelVN cho nhung chuyen di tiep theo.',
  },
  {
    name: 'Tran Van Hung',
    avatar: 'https://picsum.photos/seed/avatar-hung/80/80',
    rating: 5,
    dest: 'Tour Da Nang 4N3D',
    text: 'Giao dien than thien, thong tin ro rang. Chuyen di vuot ngoai ky vong. Canh dep, do an ngon, dich vu chuyen nghiep tu dau den cuoi.',
  },
  {
    name: 'Le Thi Huong',
    avatar: 'https://picsum.photos/seed/avatar-huong/80/80',
    rating: 5,
    dest: 'Tour Phu Quoc 5N4D',
    text: 'Gia ca hop ly, dung nhu mo ta. Khach san sach se, bai bien dep. Chac chan se gioi thieu cho ban be va nguoi than.',
  },
]

const Stars = ({ n, max = 5 }: { n: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) =>
      i < n ? (
        <HiStar key={i} size={14} className="text-accent" />
      ) : (
        <HiOutlineStar key={i} size={14} className="text-border" />
      )
    )}
  </div>
)

const tourImageSrc = (tour: ApiTour): string | null => {
  if (!tour.images?.length) return null
  try {
    const bytes = new Uint8Array(tour.images[0].photo)
    let bin = ''
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i])
    return `data:image/jpeg;base64,${btoa(bin)}`
  } catch {
    return null
  }
}

const HeroSection = () => {
  const navigate = useNavigate()
  const [dest, setDest] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [persons, setPersons] = useState(2)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (dest.trim()) p.set('destination', dest.trim())
    if (date) p.set('date', dayjs(date).format('YYYY-MM-DD'))
    if (persons !== 1) p.set('persons', String(persons))
    navigate(`/tours${p.toString() ? `?${p}` : ''}`)
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://picsum.photos/seed/vietnam-landscape/1920/1080)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-20 pb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground text-sm font-medium">
              Du lich Viet Nam cung TravelVN
            </span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-foreground leading-[1.1] mb-6">
            Kham pha
            <br />
            <span className="text-primary">Viet Nam</span> tuyet dep
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl mb-10 max-w-xl leading-relaxed">
            Tour du lich, khach san va nha hang hang dau. Tat ca trong mot nen tang duy nhat.
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-card border border-border rounded-2xl p-2 flex flex-col lg:flex-row gap-2 shadow-xl shadow-primary/5"
          >
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors">
              <HiOutlineLocationMarker className="text-primary shrink-0" size={20} />
              <input
                type="text"
                placeholder="Diem den..."
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none"
              />
            </div>

            <div className="h-px lg:h-auto lg:w-px bg-border" />

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors lg:w-44">
              <HiOutlineCalendar className="text-primary shrink-0" size={20} />
              <DatePicker
                selected={date}
                onChange={(d) => setDate(d)}
                placeholderText="Ngay di"
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                wrapperClassName="w-full"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <div className="h-px lg:h-auto lg:w-px bg-border" />

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 transition-colors lg:w-36">
              <HiOutlineUserGroup className="text-primary shrink-0" size={20} />
              <select
                value={persons}
                onChange={(e) => setPersons(Number(e.target.value))}
                className="w-full bg-transparent text-foreground text-sm font-medium focus:outline-none appearance-none cursor-pointer"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} nguoi
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-accent-foreground text-sm bg-accent hover:bg-accent/90 transition-all duration-300 hover:shadow-lg hover:shadow-accent/25"
            >
              <HiOutlineSearch size={18} />
              Tim kiem
            </button>
          </form>

          <div className="flex flex-wrap gap-8 mt-12">
            {[
              { v: '200+', l: 'Tour hap dan' },
              { v: '500+', l: 'Khach san' },
              { v: '50K+', l: 'Khach hai long' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-3xl font-serif font-semibold text-foreground">{s.v}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const TourCard = ({ tour }: { tour: ApiTour }) => {
  const navigate = useNavigate()
  const img = tourImageSrc(tour)

  return (
    <article className="bg-card rounded-2xl overflow-hidden border border-border group flex flex-col hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={img || `https://picsum.photos/seed/tour-${tour.id}/480/360`}
          alt={tour.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {tour.durationDays && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              <HiOutlineClock size={14} /> {tour.durationDays} ngay
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Stars n={tour.rating ?? 5} />
          <span className="text-xs text-muted-foreground">({tour.rating ?? 5}.0)</span>
        </div>

        <h3 className="font-semibold text-foreground text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {tour.name}
        </h3>

        {tour.destination && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <HiOutlineLocationMarker size={14} className="text-primary" />
            {tour.destination}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Gia tu</p>
            <p className="text-lg font-semibold text-accent">
              {tour.priceAdult ? `${tour.priceAdult.toLocaleString('vi-VN')}d` : 'Lien he'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/tours/${tour.id}`)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Chi tiet
            <HiArrowRight size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}

const TourCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-8 bg-muted rounded w-28 mt-4" />
    </div>
  </div>
)

const FeaturedToursSection = () => {
  const navigate = useNavigate()
  const { data: tours, isLoading } = useQuery<ApiTour[]>({
    queryKey: ['tours', 'featured'],
    queryFn: () => getAllTours() as Promise<ApiTour[]>,
    select: (data) => data.slice(0, 6),
  })

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-6">
          <div>
            <p className="text-accent font-medium text-sm uppercase tracking-wider mb-3">
              Noi bat
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              Tour du lich hap dan
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              Nhung hanh trinh dang nho dang cho ban kham pha
            </p>
          </div>
          <button
            onClick={() => navigate('/tours')}
            className="flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-full border border-border text-foreground hover:bg-secondary transition-all duration-300"
          >
            Xem tat ca
            <HiArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <TourCardSkeleton key={i} />)
            : tours?.map((t) => <TourCard key={t.id} tour={t} />)}
        </div>

        {!isLoading && (!tours || tours.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            <HiOutlineGlobeAlt size={48} className="mx-auto mb-4 opacity-30" />
            <p>Chua co tour nao. Vui long thu lai sau.</p>
          </div>
        )}
      </div>
    </section>
  )
}

const PopularDestinationsSection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-accent font-medium text-sm uppercase tracking-wider mb-3">
            Diem den
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
            Diem den pho bien
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Nhung dia danh noi tieng nhat Viet Nam dang cho ban kham pha
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DESTINATIONS.map((d, i) => (
            <button
              key={d.name}
              onClick={() => navigate(`/tours?destination=${encodeURIComponent(d.path)}`)}
              className={`relative overflow-hidden rounded-2xl cursor-pointer group text-left ${
                i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
              style={{ minHeight: i === 0 ? 400 : 200 }}
            >
              <img
                src={`https://picsum.photos/seed/${d.seed}/800/600`}
                alt={d.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-card font-serif font-semibold text-xl lg:text-2xl mb-1">
                  {d.name}
                </h3>
                <p className="text-card/70 text-sm">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

const ServicesSection = () => {
  const navigate = useNavigate()

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-accent font-medium text-sm uppercase tracking-wider mb-3">
            Dich vu
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
            Mot noi, moi dich vu
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Tu tour kham pha den phong nghi va ban an, dat tat ca trong mot lan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, label, desc, path, stat, statLabel }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="group p-8 rounded-2xl bg-card border border-border text-left hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <Icon
                  size={24}
                  className="text-primary group-hover:text-primary-foreground transition-colors"
                />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{desc}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-2xl font-serif font-semibold text-foreground">{stat}</p>
                  <p className="text-xs text-muted-foreground">{statLabel}</p>
                </div>
                <HiArrowRight
                  size={20}
                  className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

const TestimonialsSection = () => (
  <section className="py-24 px-6 bg-primary">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-accent font-medium text-sm uppercase tracking-wider mb-3">
          Danh gia
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-primary-foreground">
          Khach hang noi gi ve chung toi
        </h2>
        <p className="mt-3 text-primary-foreground/60 max-w-md mx-auto">
          Hang nghin du khach da tin tuong va hai long voi TravelVN
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.name}
            className="p-6 rounded-2xl flex flex-col gap-5 bg-primary-foreground/5 border border-primary-foreground/10"
          >
            <div className="flex items-center justify-between">
              <Stars n={t.rating} />
              <HiOutlineBadgeCheck size={18} className="text-accent" />
            </div>

            <p className="text-sm leading-relaxed flex-1 text-primary-foreground/80">
              {`"${t.text}"`}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-primary-foreground/10">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-accent"
              />
              <div>
                <p className="text-primary-foreground font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-accent">{t.dest}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)

const HomePage = () => (
  <div className="bg-background">
    <Navbar />
    <HeroSection />
    <FeaturedToursSection />
    <PopularDestinationsSection />
    <ServicesSection />
    <TestimonialsSection />
    <Footer />
  </div>
)

export default HomePage
