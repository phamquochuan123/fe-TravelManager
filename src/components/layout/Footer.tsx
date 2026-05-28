import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import {
  MdFlight,
  MdLocationOn,
  MdPhone,
  MdEmail,
} from 'react-icons/md';

const POPULAR_TOURS = [
  { label: 'Tour Hà Nội – Hạ Long', path: '/tours' },
  { label: 'Tour Đà Nẵng – Hội An', path: '/tours' },
  { label: 'Tour TP.HCM – Mũi Né', path: '/tours' },
  { label: 'Tour Sapa – Lào Cai', path: '/tours' },
];

const SERVICES = [
  { label: 'Đặt phòng khách sạn', path: '/hotels' },
  { label: 'Đặt tour du lịch', path: '/tours' },
  { label: 'Đặt bàn nhà hàng', path: '/restaurants' },
];

const SOCIAL = [
  { icon: FaFacebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
];

const CONTACT = [
  { icon: MdLocationOn, text: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
  { icon: MdPhone,     text: '1900 1234' },
  { icon: MdEmail,     text: 'contact@travelvn.vn' },
];

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: '#1a5276', fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand ── */}
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 mb-5 group"
            >
              <div
                className="p-2 rounded-xl transition-transform group-hover:rotate-12"
                style={{ backgroundColor: 'rgba(230,126,34,0.2)' }}
              >
                <MdFlight style={{ color: '#e67e22', fontSize: 20 }} />
              </div>
              <span className="font-black text-xl tracking-tight text-white">
                Travel<span style={{ color: '#e67e22' }}>VN</span>
              </span>
            </button>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Khám phá vẻ đẹp Việt Nam cùng TravelVN — tour du lịch, khách sạn,
              nhà hàng và điểm đến hàng đầu.
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#e67e22')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
                  }
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Popular tours ── */}
          <div>
            <h4
              className="font-bold text-xs uppercase tracking-widest mb-5"
              style={{ color: '#e67e22' }}
            >
              Tour phổ biến
            </h4>
            <ul className="space-y-3">
              {POPULAR_TOURS.map((t) => (
                <li key={t.label}>
                  <button
                    onClick={() => navigate(t.path)}
                    className="text-sm text-left transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Services ── */}
          <div>
            <h4
              className="font-bold text-xs uppercase tracking-widest mb-5"
              style={{ color: '#e67e22' }}
            >
              Dịch vụ
            </h4>
            <ul className="space-y-3">
              {SERVICES.map((s) => (
                <li key={s.label}>
                  <button
                    onClick={() => navigate(s.path)}
                    className="text-sm text-left transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact ── */}
          <div>
            <h4
              className="font-bold text-xs uppercase tracking-widest mb-5"
              style={{ color: '#e67e22' }}
            >
              Liên hệ
            </h4>
            <ul className="space-y-3.5">
              {CONTACT.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: '#e67e22' }}
                  />
                  <span
                    className="text-sm leading-snug"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © {year} TravelVN. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Chính sách bảo mật', 'Điều khoản dịch vụ'].map((label) => (
              <button
                key={label}
                className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
