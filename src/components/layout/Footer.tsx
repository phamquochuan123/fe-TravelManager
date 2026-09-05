import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { MdFlight, MdLocationOn, MdPhone, MdEmail, MdArrowForward } from 'react-icons/md';

const POPULAR_TOURS = [
  { label: 'Tour Hà Nội – Hạ Long', path: '/tours' },
  { label: 'Tour Đà Nẵng – Hội An',  path: '/tours' },
  { label: 'Tour TP.HCM – Mũi Né',   path: '/tours' },
  { label: 'Tour Sapa – Lào Cai',     path: '/tours' },
];

const SERVICES = [
  { label: 'Đặt phòng khách sạn', path: '/hotels' },
  { label: 'Đặt tour du lịch',    path: '/tours' },
  { label: 'Đặt bàn nhà hàng',   path: '/restaurants' },
];

const SOCIAL = [
  { icon: FaFacebook,  href: 'https://facebook.com',  label: 'Facebook'  },
  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: FaYoutube,   href: 'https://youtube.com',   label: 'YouTube'   },
];

const CONTACT = [
  { icon: MdLocationOn, text: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
  { icon: MdPhone,      text: '1900 1234' },
  { icon: MdEmail,      text: 'contact@travelvn.vn' },
];

const GoldLine = () => (
  <div className="h-px w-full"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.45), transparent)' }} />
);

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── CTA Banner ── */}
      <div className="relative overflow-hidden py-20 px-6" style={{ background: '#0a1628' }}>
        <div className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-[0.07]"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=50)' }} />
        <div className="absolute top-0 left-0 right-0"><GoldLine /></div>
        <div className="absolute bottom-0 left-0 right-0"><GoldLine /></div>

        <div className="relative max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-10 text-center sm:text-left">
          <div>
            <p className="mb-4 uppercase tracking-widest text-[10px] font-bold" style={{ color: '#c9a84c', letterSpacing: '0.04em' }}>
              Bắt Đầu Hành Trình
            </p>
            <h2 className="text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '0.02em' }}>
              Sẵn sàng khám phá<br />
              <em style={{ color: '#c9a84c' }}>Việt Nam cùng chúng tôi?</em>
            </h2>
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="h-px w-8" style={{ background: '#c9a84c' }} />
              <span className="text-white/30 tracking-widest uppercase" style={{ fontSize: 10 }}>TravelVN</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/tours')}
            className="flex items-center gap-3 px-10 py-4 text-white text-[10.5px] font-bold tracking-widest uppercase shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{ border: '1px solid rgba(201,168,76,0.45)', background: 'rgba(201,168,76,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.cssText += ';background:#c9a84c;border-color:#c9a84c;color:#0a1628;'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.cssText += ';background:rgba(201,168,76,0.07);border-color:rgba(201,168,76,0.45);color:#fff;'; }}
          >
            Đặt Tour Ngay <MdArrowForward size={15} />
          </button>
        </div>
      </div>

      {/* ── Main footer ── */}
      <div style={{ background: '#06101e' }}>
        <GoldLine />
        <div className="px-6 md:px-12 pt-16 pb-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-14">

              {/* Brand */}
              <div>
                <button onClick={() => navigate('/')} className="flex items-center gap-3 mb-6 group">
                  <div className="w-9 h-9 flex items-center justify-center transition-all group-hover:scale-105"
                    style={{ border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.05)' }}>
                    <MdFlight size={17} style={{ color: '#c9a84c' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.2rem', color: '#fff', letterSpacing: '0.04em' }}>
                    Travel<span style={{ color: '#c9a84c' }}>VN</span>
                  </span>
                </button>
                <p className="leading-relaxed mb-7" style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13 }}>
                  Khám phá vẻ đẹp Việt Nam — tour du lịch, khách sạn, nhà hàng và điểm đến hàng đầu.
                </p>
                <div className="flex gap-2.5">
                  {SOCIAL.map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                      className="w-9 h-9 flex items-center justify-center transition-all duration-200"
                      style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#c9a84c'; el.style.borderColor = '#c9a84c'; el.style.color = '#0a1628'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.28)'; }}>
                      <Icon size={13} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Popular tours */}
              <div>
                <h4 className="mb-6 uppercase tracking-widest font-bold" style={{ color: '#c9a84c', fontSize: 10, letterSpacing: '0.04em' }}>
                  Tour Phổ Biến
                </h4>
                <ul className="space-y-4">
                  {POPULAR_TOURS.map(t => (
                    <li key={t.label}>
                      <button onClick={() => navigate(t.path)}
                        className="group flex items-center gap-2.5 text-left transition-colors hover:text-white"
                        style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13 }}>
                        <span className="shrink-0 transition-all duration-300 group-hover:w-4"
                          style={{ display: 'block', width: 6, height: 1, background: '#c9a84c', opacity: 0.55 }} />
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="mb-6 uppercase tracking-widest font-bold" style={{ color: '#c9a84c', fontSize: 10, letterSpacing: '0.04em' }}>
                  Dịch Vụ
                </h4>
                <ul className="space-y-4">
                  {SERVICES.map(s => (
                    <li key={s.label}>
                      <button onClick={() => navigate(s.path)}
                        className="group flex items-center gap-2.5 text-left transition-colors hover:text-white"
                        style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13 }}>
                        <span className="shrink-0 transition-all duration-300 group-hover:w-4"
                          style={{ display: 'block', width: 6, height: 1, background: '#c9a84c', opacity: 0.55 }} />
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="mb-6 uppercase tracking-widest font-bold" style={{ color: '#c9a84c', fontSize: 10, letterSpacing: '0.04em' }}>
                  Liên Hệ
                </h4>
                <ul className="space-y-5">
                  {CONTACT.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"
                        style={{ border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.05)' }}>
                        <Icon size={12} style={{ color: '#c9a84c' }} />
                      </div>
                      <span className="leading-snug" style={{ color: 'rgba(255,255,255,0.32)', fontSize: 13 }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <GoldLine />

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p style={{ color: 'rgba(255,255,255,0.16)', fontSize: 11, letterSpacing: '0.06em' }}>
                © {year} TravelVN. All rights reserved.
              </p>
              <div className="flex gap-6">
                {['Chính sách bảo mật', 'Điều khoản dịch vụ'].map(label => (
                  <button key={label}
                    className="transition-colors hover:text-white/50"
                    style={{ color: 'rgba(255,255,255,0.16)', fontSize: 11, letterSpacing: '0.08em' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
