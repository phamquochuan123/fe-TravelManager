import { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { MdFlight } from 'react-icons/md';
import {
  HiOutlineMenuAlt3,
  HiX,
  HiChevronDown,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { useAuthStore, selectUser, selectIsAdmin, selectIsStaff } from '../../stores/authStore';
import api from '../../api/axiosInstance';
import type { User } from '../../types';

const NAV_LINKS = [
  { path: '/tours',        label: 'Tour',       icon: 'bi-map' },
  { path: '/hotels',       label: 'Khách sạn',  icon: 'bi-building' },
  { path: '/restaurants',  label: 'Nhà hàng',   icon: 'bi-cup-hot' },
] as const;

const RoleBadge = ({ role }: { role: User['roleName'] }) => {
  const map: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-600',
    STAFF: 'bg-blue-100 text-blue-600',
    USER:  'bg-emerald-100 text-emerald-600',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${map[role] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {role}
    </span>
  );
};

const Navbar = () => {
  const navigate  = useNavigate();
  const user      = useAuthStore(selectUser);
  const isAdmin   = useAuthStore(selectIsAdmin);
  const isStaff   = useAuthStore(selectIsStaff);
  const { logout } = useAuthStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      logout();
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đăng xuất thất bại');
    }
  };

  const handleSendOTP = async () => {
    try {
      await api.post('/send-otp');
      navigate('/verify-email');
      toast.success('OTP đã được gửi tới email của bạn.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi gửi OTP');
    }
  };

  const navbarCls = `fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
    scrolled
      ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-sky-100/20 border-b border-gray-100'
      : 'bg-white/80 backdrop-blur-lg border-b border-white/20'
  }`;

  return (
    <>
      <nav className={navbarCls} style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="flex items-center justify-between px-6 md:px-12 h-16">

          {/* ── Logo ── */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group"
          >
            <div
              className="p-2 rounded-xl transition-transform duration-300 group-hover:rotate-12 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)', boxShadow: '0 4px 12px rgba(26,82,118,0.3)' }}
            >
              <MdFlight className="text-white" size={18} />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900">
              Travel<span style={{ color: '#1a5276' }}>VN</span>
            </span>
          </button>

          {/* ── Desktop nav links ── */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                    isActive
                      ? 'text-[#1a5276] bg-blue-50'
                      : 'text-gray-600 hover:text-[#1a5276] hover:bg-blue-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {user && (
              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                    isActive ? 'text-[#1a5276] bg-blue-50' : 'text-gray-600 hover:text-[#1a5276] hover:bg-blue-50'
                  }`
                }
              >
                Đặt chỗ
              </NavLink>
            )}

            {isStaff && (
              <button
                onClick={() => navigate('/staff')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-xl bg-blue-50 transition-colors"
              >
                Staff
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-sm font-semibold text-red-500 hover:text-red-600 px-3 py-2 rounded-xl bg-red-50 transition-colors"
              >
                Admin
              </button>
            )}
          </div>

          {/* ── Right section ── */}
          <div className="flex items-center gap-3">

            {user ? (
              /* Avatar dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm text-white shadow"
                    style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)' }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <HiChevronDown
                    size={12}
                    className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3.5 border-b border-gray-100" style={{ background: 'linear-gradient(to right, #eaf4fb, #d6eaf8)' }}>
                      <p className="text-xs uppercase font-bold tracking-widest text-gray-400">Đăng nhập với</p>
                      <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{user.name}</p>
                      <RoleBadge role={user.roleName} />
                    </div>

                    <div className="p-2">
                      <DropItem icon={<HiOutlineUser size={15} />} label="Hồ sơ cá nhân"
                        onClick={() => { navigate('/profile'); setDropdownOpen(false); }} />
                      <DropItem icon={<HiOutlineCalendar size={15} />} label="Lịch sử đặt chỗ"
                        onClick={() => { navigate('/my-bookings'); setDropdownOpen(false); }} />

                      {/* Mobile nav links */}
                      <div className="lg:hidden border-t border-gray-100 my-1 pt-1">
                        {NAV_LINKS.map(({ path, label }) => (
                          <DropItem key={path} label={label}
                            onClick={() => { navigate(path); setDropdownOpen(false); }} />
                        ))}
                      </div>

                      {isStaff && (
                        <DropItem icon={<HiOutlineBadgeCheck size={15} className="text-blue-500" />} label="Staff Dashboard"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => { navigate('/staff'); setDropdownOpen(false); }} />
                      )}
                      {isAdmin && (
                        <DropItem icon={<HiOutlineShieldCheck size={15} className="text-red-400" />} label="Admin Dashboard"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => { navigate('/admin'); setDropdownOpen(false); }} />
                      )}
                      {!user.isAccountVerified && (
                        <DropItem label="Xác thực Email" className="text-amber-600 hover:bg-amber-50"
                          onClick={() => { handleSendOTP(); setDropdownOpen(false); }} />
                      )}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <DropItem icon={<HiOutlineLogout size={15} />} label="Đăng xuất"
                          className="text-red-500 hover:bg-red-50"
                          onClick={handleLogout} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Auth buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-[#1a5276] px-4 py-2 rounded-xl transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)', boxShadow: '0 6px 20px rgba(26,82,118,0.35)' }}
                >
                  Bắt đầu
                </button>
              </div>
            )}

            {/* Hamburger (mobile) */}
            <button
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <HiX size={20} /> : <HiOutlineMenuAlt3 size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1 shadow-lg">
            {NAV_LINKS.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setMobileOpen(false); }}
                className="w-full text-left text-sm font-semibold text-gray-600 hover:text-[#1a5276] hover:bg-blue-50 px-3 py-2.5 rounded-xl transition-colors"
              >
                {label}
              </button>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                  className="flex-1 text-sm font-semibold text-gray-700 border border-gray-200 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  Đăng nhập
                </button>
                <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                  className="flex-1 text-sm font-semibold text-white py-2 rounded-xl transition-colors"
                  style={{ backgroundColor: '#1a5276' }}>
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Spacer so content isn't hidden under the fixed nav */}
      <div className="h-16" />
    </>
  );
};

// ── Helper ──────────────────────────────────────────────────────────────────

interface DropItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
}
const DropItem = ({ label, icon, onClick, className = '' }: DropItemProps) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-gray-700 hover:bg-gray-50 ${className}`}
  >
    {icon && <span className="text-gray-400">{icon}</span>}
    {label}
  </button>
);

export default Navbar;
