import { Link } from 'react-router-dom'
import { HiOutlineGlobeAlt, HiOutlineHome, HiOutlineSparkles, HiOutlineSupport } from 'react-icons/hi'

const PERKS = [
  { icon: HiOutlineHome, text: '500+ Khach san & Resort hang dau' },
  { icon: HiOutlineGlobeAlt, text: '200+ Tour kham pha khap Viet Nam' },
  { icon: HiOutlineSparkles, text: '300+ Nha hang am thuc dac sac' },
  { icon: HiOutlineSupport, text: 'Ho tro 24/7 tan tam, chu dao' },
]

interface Props {
  imageSeed: string
  quote?: string
  children: React.ReactNode
}

const AuthLayout = ({ imageSeed, quote, children }: Props) => (
  <div className="min-h-screen flex bg-background">
    {/* Left: image panel (desktop only) */}
    <div className="hidden lg:block lg:w-5/12 xl:w-1/2 relative overflow-hidden">
      <img
        src={`https://picsum.photos/seed/${imageSeed}/900/1200`}
        alt="TravelVN background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-primary/90" />

      <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-14 z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group w-fit">
          <span className="font-serif text-2xl font-bold text-primary-foreground tracking-tight">
            Travel<span className="text-accent">VN</span>
          </span>
        </Link>

        {/* Quote + perks */}
        <div>
          {quote && (
            <blockquote className="text-primary-foreground/70 text-lg font-serif italic mb-10 leading-relaxed max-w-sm">
              {`"${quote}"`}
            </blockquote>
          )}
          <div className="space-y-4">
            {PERKS.map((p) => (
              <div key={p.text} className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-accent/20 border border-accent/30">
                  <p.icon size={20} className="text-accent" />
                </div>
                <span className="text-primary-foreground/80 text-sm">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-foreground/30 text-xs">
          {new Date().getFullYear()} TravelVN. All rights reserved.
        </p>
      </div>
    </div>

    {/* Right: form area */}
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-secondary/30 overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-8 lg:hidden w-fit">
          <span className="font-serif text-xl font-bold text-foreground">
            Travel<span className="text-primary">VN</span>
          </span>
        </Link>

        {children}
      </div>
    </div>
  </div>
)

export default AuthLayout
