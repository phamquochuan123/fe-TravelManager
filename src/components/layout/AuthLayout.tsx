import { Link } from 'react-router-dom'
import { MdFlight, MdFlashOn, MdSecurity, MdHeadsetMic, MdThumbUp } from 'react-icons/md'

const PERKS = [
  { icon: MdFlashOn,    text: '200+ Tour khám phá khắp Việt Nam' },
  { icon: MdSecurity,   text: 'Thanh toán bảo mật với SSL 256-bit' },
  { icon: MdThumbUp,    text: 'Hủy linh hoạt, hoàn tiền 100%' },
  { icon: MdHeadsetMic, text: 'Hỗ trợ 24/7 tận tâm, chu đáo' },
]

const QUOTES = [
  'Mỗi hành trình bắt đầu bằng một bước đầu tiên nhỏ bé.',
  'Khám phá thế giới — một điểm đến mỗi lần.',
  'Đi để trải nghiệm, về để nhớ mãi.',
]

interface Props {
  imageSeed: string
  quote?: string
  children: React.ReactNode
}

const AuthLayout = ({ imageSeed, quote, children }: Props) => (
  <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-sans)' }}>

    {/* Left panel */}
    <div className="hidden lg:flex lg:w-5/12 xl:w-[45%] relative overflow-hidden flex-col">
      <img
        src={`https://picsum.photos/seed/${imageSeed}/900/1200`}
        alt="TravelVN"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(6,16,30,0.97) 0%, rgba(10,22,40,0.92) 50%, rgba(6,16,30,0.88) 100%)' }} />

      {/* Gold top line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />

      {/* Subtle gold glow */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(201,168,76,0.06), transparent)' }} />

      <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group w-fit">
          <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{ border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)' }}>
            <MdFlight style={{ color: '#c9a84c' }} size={20} />
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.4rem', color: '#fff', letterSpacing: '0.04em' }}>
            Travel<span style={{ color: '#c9a84c' }}>VN</span>
          </span>
        </Link>

        {/* Center content */}
        <div>
          {/* Quote */}
          <div className="mb-10">
            <div className="mb-4 leading-none" style={{ fontFamily: 'var(--font-sans)', fontSize: '5rem', color: 'rgba(201,168,76,0.25)', lineHeight: 1 }}>"</div>
            <blockquote style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, fontStyle: 'italic', lineHeight: 1.8, maxWidth: 300 }}>
              {quote ?? QUOTES[0]}
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8" style={{ background: '#c9a84c' }} />
              <span className="uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)', fontSize: 9 }}>TravelVN</span>
            </div>
          </div>

          {/* Perks */}
          <div className="space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-9 h-9 flex items-center justify-center shrink-0"
                  style={{ border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.06)' }}>
                  <Icon size={16} style={{ color: '#c9a84c' }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.08em' }}>
          © {new Date().getFullYear()} TravelVN. All rights reserved.
        </p>
      </div>
    </div>

    {/* Right: form area */}
    <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto"
      style={{ background: '#f8f5ee' }}>
      <div className="w-full max-w-md">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden w-fit">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#0a1628' }}>
            <MdFlight style={{ color: '#c9a84c' }} size={16} />
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.2rem', color: '#0a1628', letterSpacing: '0.04em' }}>
            Travel<span style={{ color: '#c9a84c' }}>VN</span>
          </span>
        </Link>

        {children}
      </div>
    </div>
  </div>
)

export default AuthLayout
