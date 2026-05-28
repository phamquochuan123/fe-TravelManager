import { Link } from 'react-router-dom'
import { MdFlight } from 'react-icons/md'

const PERKS = [
  { icon: 'bi-building',   text: '500+ Khách sạn & Resort hàng đầu' },
  { icon: 'bi-map',        text: '200+ Tour khám phá khắp Việt Nam' },
  { icon: 'bi-cup-hot',    text: '300+ Nhà hàng ẩm thực đặc sắc' },
  { icon: 'bi-headset',    text: 'Hỗ trợ 24/7 tận tâm, chu đáo' },
]

interface Props {
  imageSeed: string
  quote?: string
  children: React.ReactNode
}

const AuthLayout = ({ imageSeed, quote, children }: Props) => (
  <div className="min-h-screen flex" style={{ fontFamily: 'Poppins, sans-serif' }}>

    {/* ── Left: image panel (desktop only) ─────────────────────────────── */}
    <div className="hidden lg:block lg:w-5/12 xl:w-1/2 relative overflow-hidden">
      <img
        src={`https://picsum.photos/seed/${imageSeed}/900/1200`}
        alt="TravelVN background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(26,82,118,0.90) 0%, rgba(26,82,118,0.70) 100%)' }}
      />

      <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-14 z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group w-fit">
          <div
            className="p-2.5 rounded-2xl backdrop-blur transition-transform group-hover:rotate-12"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <MdFlight className="text-white" size={22} />
          </div>
          <span className="font-black text-2xl text-white tracking-tight">
            Travel<span style={{ color: '#e67e22' }}>VN</span>
          </span>
        </Link>

        {/* Quote + perks */}
        <div>
          {quote && (
            <blockquote className="text-white/75 text-base italic mb-8 leading-relaxed max-w-xs">
              "{quote}"
            </blockquote>
          )}
          <div className="space-y-4">
            {PERKS.map(p => (
              <div key={p.text} className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(230,126,34,0.22)', border: '1px solid rgba(230,126,34,0.3)' }}
                >
                  <i className={`bi ${p.icon} text-[#e67e22] text-sm`} />
                </div>
                <span className="text-white/75 text-sm">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-xs">© {new Date().getFullYear()} TravelVN. All rights reserved.</p>
      </div>
    </div>

    {/* ── Right: form area ──────────────────────────────────────────────── */}
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden w-fit">
          <div
            className="p-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)' }}
          >
            <MdFlight className="text-white" size={18} />
          </div>
          <span className="font-black text-xl text-gray-900">
            Travel<span style={{ color: '#1a5276' }}>VN</span>
          </span>
        </Link>

        {children}
      </div>
    </div>
  </div>
)

export default AuthLayout
