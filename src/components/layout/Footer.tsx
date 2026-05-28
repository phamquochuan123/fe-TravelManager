import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail, HiArrowRight } from 'react-icons/hi';

const EXPLORE = [
  { label: 'Tour du lich', path: '/tours' },
  { label: 'Khach san', path: '/hotels' },
  { label: 'Nha hang', path: '/restaurants' },
  { label: 'Dat cho cua toi', path: '/my-bookings' },
];

const COMPANY = [
  { label: 'Ve chung toi', path: '/about' },
  { label: 'Lien he', path: '/contact' },
  { label: 'Chinh sach bao mat', path: '/privacy' },
  { label: 'Dieu khoan dich vu', path: '/terms' },
];

const SOCIAL = [
  { icon: FaFacebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
];

const CONTACT = [
  { icon: HiOutlineLocationMarker, text: '123 Nguyen Hue, Quan 1, TP.HCM' },
  { icon: HiOutlinePhone, text: '1900 1234' },
  { icon: HiOutlineMail, text: 'contact@travelvn.vn' },
];

const Footer = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-md">
              <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-3">
                Nhan thong tin uu dai
              </h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">
                Dang ky nhan ban tin de cap nhat cac uu dai doc quyen va diem den hap dan.
              </p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <input
                type="email"
                placeholder="Email cua ban"
                className="flex-1 lg:w-72 px-5 py-3.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 text-sm focus:outline-none focus:border-accent transition-colors"
              />
              <button className="px-6 py-3.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 flex items-center gap-2 group">
                Dang ky
                <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 mb-6 group"
            >
              <span className="font-serif text-2xl font-bold tracking-tight">
                Travel<span className="text-accent">VN</span>
              </span>
            </button>

            <p className="text-sm leading-relaxed text-primary-foreground/60 mb-8">
              Kham pha ve dep Viet Nam cung TravelVN. Tour du lich, khach san va nha hang hang dau.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-foreground/10 text-primary-foreground/60 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-accent mb-6">
              Kham pha
            </h4>
            <ul className="space-y-4">
              {EXPLORE.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-accent group-hover:w-4 transition-all duration-300" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-accent mb-6">
              Cong ty
            </h4>
            <ul className="space-y-4">
              {COMPANY.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-accent group-hover:w-4 transition-all duration-300" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase font-semibold tracking-wider text-accent mb-6">
              Lien he
            </h4>
            <ul className="space-y-4">
              {CONTACT.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 shrink-0 text-accent" />
                  <span className="text-sm text-primary-foreground/60">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-foreground/40">
              {year} TravelVN. All rights reserved.
            </p>
            <p className="text-sm text-primary-foreground/40">
              Thiet ke voi tinh yeu tai Viet Nam
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
