import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { MdFlight, MdPhone } from 'react-icons/md';
import {
  HiOutlineMenuAlt3, HiX, HiChevronDown,
  HiOutlineUser, HiOutlineCalendar, HiOutlineLogout,
  HiOutlineShieldCheck, HiOutlineBadgeCheck,
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { useAuthStore, selectUser, selectIsAdmin, selectIsStaff } from '../../stores/authStore';
import { AppContext } from '../../context/appContextObject';
import api from '../../api/axiosInstance';
import type { User } from '../../types';

interface IAppContext { logout: () => void }

const NAV_LINKS = [
  { path: '/tours',       label: 'Tour'      },
  { path: '/hotels',      label: 'Khách Sạn' },
  { path: '/restaurants', label: 'Nhà Hàng'  },
] as const;

const RoleBadge = ({ role }: { role: User['roleName'] }) => {
  const map: Record<string, string> = {
    ADMIN: 'bg-red-500/20 text-red-400 border border-red-500/30',
    STAFF: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    USER:  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full tracking-widest uppercase ${map[role] ?? 'bg-gray-500/20 text-gray-400'}`}>
      {role}
    </span>
  );
};

const DropItem = ({ label, icon, onClick, className = '' }: {
  label: string; icon?: React.ReactNode; onClick: () => void; className?: string
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors text-gray-700 hover:bg-[#f8f5ee] ${className}`}
  >
    {icon && <span className="text-gray-400">{icon}</span>}
    {label}
  </button>
);

const Navbar = () => {
  const navigate   = useNavigate();
  const user       = useAuthStore(selectUser);
  const isAdmin    = useAuthStore(selectIsAdmin);
  const isStaff    = useAuthStore(selectIsStaff);
  const { logout } = useContext(AppContext) as IAppContext;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [navigate]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try { await api.post('/logout'); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Đăng xuất thất bại'); }
    finally { logout(); window.location.href = '/login'; }
  };

  const handleSendOTP = async () => {
    try { await api.post('/send-otp'); navigate('/verify-email'); toast.success('OTP đã gửi tới email.'); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi khi gửi OTP'); }
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
        style={{
          fontFamily: 'var(--font-sans)',
          background: scrolled ? 'rgba(248,245,238,0.97)' : 'rgba(248,245,238,0.82)',
          backdropFilter: 'blur(12px)',
          borderBottom: scrolled ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(201,168,76,0.12)',
          boxShadow: scrolled ? '0 4px 30px rgba(10,22,40,0.06)' : 'none',
        }}
      >
        {/* Gold top line when scrolled */}
        {scrolled && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a84c 30%, #c9a84c 70%, transparent)' }} />
        )}

        <div className="flex items-center justify-between px-6 md:px-12 h-16">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{ background: '#0a1628' }}
            >
              <MdFlight size={17} style={{ color: '#c9a84c' }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '1.2rem',
              letterSpacing: '0.04em',
              color: '#0a1628',
            }}>
              Travel<span style={{ color: '#c9a84c' }}>VN</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center">
            {NAV_LINKS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `text-[10.5px] font-semibold px-5 py-5 tracking-widest uppercase transition-colors ${
                    isActive ? 'text-[#0a1628]' : 'text-gray-400 hover:text-[#0a1628]'
                  }`
                }
                style={({ isActive }) => isActive
                  ? { borderBottom: '1.5px solid #c9a84c', paddingBottom: '18px' }
                  : {}
                }
              >
                {label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `text-[10.5px] font-semibold px-5 py-5 tracking-widest uppercase transition-colors ${
                    isActive ? 'text-[#0a1628]' : 'text-gray-400 hover:text-[#0a1628]'
                  }`
                }
                style={({ isActive }) => isActive
                  ? { borderBottom: '1.5px solid #c9a84c', paddingBottom: '18px' }
                  : {}
                }
              >
                Đặt Chỗ
              </NavLink>
            )}
            {isStaff && (
              <button onClick={() => navigate('/staff')}
                className="text-[10.5px] font-semibold px-4 py-2 tracking-widest uppercase text-blue-600 hover:text-blue-700 transition-colors">
                Staff
              </button>
            )}
            {isAdmin && (
              <button onClick={() => navigate('/admin')}
                className="text-[10.5px] font-semibold px-4 py-2 tracking-widest uppercase text-red-500 hover:text-red-600 transition-colors">
                Admin
              </button>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <a href="tel:19001234"
              className="hidden xl:flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider uppercase text-gray-400 hover:text-[#0a1628] transition-colors">
              <MdPhone size={13} style={{ color: '#c9a84c' }} />
              1900 1234
            </a>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 transition-all duration-200 hover:border-[#c9a84c]"
                  style={{ border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(248,245,238,0.6)' }}
                >
                  <div className="w-6 h-6 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#0a1628' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10.5px] font-semibold hidden sm:block max-w-[90px] truncate tracking-wider text-gray-700">
                    {user.name}
                  </span>
                  <HiChevronDown size={11} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-white overflow-hidden z-50"
                    style={{ boxShadow: '0 20px 60px rgba(10,22,40,0.18)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <div className="px-4 py-4" style={{ background: 'linear-gradient(135deg, #0a1628, #1a3a5c)', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-white/35 mb-1">Tài khoản</p>
                      <p className="font-semibold text-white truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem' }}>{user.name}</p>
                      <div className="mt-1.5"><RoleBadge role={user.roleName} /></div>
                    </div>
                    <div className="p-1.5">
                      <DropItem icon={<HiOutlineUser size={14} />} label="Hồ sơ cá nhân"
                        onClick={() => { navigate('/profile'); setDropdownOpen(false); }} />
                      <DropItem icon={<HiOutlineCalendar size={14} />} label="Lịch sử đặt chỗ"
                        onClick={() => { navigate('/my-bookings'); setDropdownOpen(false); }} />
                      <div className="lg:hidden border-t border-gray-100 my-1 pt-1">
                        {NAV_LINKS.map(({ path, label }) => (
                          <DropItem key={path} label={label}
                            onClick={() => { navigate(path); setDropdownOpen(false); }} />
                        ))}
                      </div>
                      {isStaff && (
                        <DropItem icon={<HiOutlineBadgeCheck size={14} className="text-blue-500" />} label="Staff Dashboard"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => { navigate('/staff'); setDropdownOpen(false); }} />
                      )}
                      {isAdmin && (
                        <DropItem icon={<HiOutlineShieldCheck size={14} className="text-red-400" />} label="Admin Dashboard"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => { navigate('/admin'); setDropdownOpen(false); }} />
                      )}
                      {!user.isAccountVerified && (
                        <DropItem label="Xác thực Email" className="text-amber-600 hover:bg-amber-50"
                          onClick={() => { handleSendOTP(); setDropdownOpen(false); }} />
                      )}
                      <div className="mt-1 pt-1" style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                        <DropItem icon={<HiOutlineLogout size={14} />} label="Đăng xuất"
                          className="text-red-500 hover:bg-red-50"
                          onClick={handleLogout} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => navigate('/login')}
                  className="hidden sm:block text-[10.5px] font-semibold tracking-widest uppercase px-4 py-2 text-gray-500 hover:text-[#0a1628] transition-colors">
                  Đăng Nhập
                </button>
                <button onClick={() => navigate('/register')}
                  className="text-[10.5px] font-bold px-5 py-2.5 text-white tracking-widest uppercase transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#0a1628', border: '1px solid rgba(201,168,76,0.35)' }}>
                  Bắt Đầu
                </button>
              </div>
            )}

            <button
              className="lg:hidden p-2 text-[#0a1628] hover:text-[#c9a84c] transition-colors"
              onClick={() => setMobileOpen(p => !p)} aria-label="Toggle menu"
            >
              {mobileOpen ? <HiX size={20} /> : <HiOutlineMenuAlt3 size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a1628]/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[290px] z-50 lg:hidden flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: '#f8f5ee', fontFamily: 'var(--font-sans)', boxShadow: '-10px 0 60px rgba(10,22,40,0.25)' }}
      >
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.3)' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '1.2rem', color: '#0a1628', letterSpacing: '0.04em' }}>
            Travel<span style={{ color: '#c9a84c' }}>VN</span>
          </span>
          <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-400 hover:text-[#0a1628] transition-colors">
            <HiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
          {NAV_LINKS.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block text-[10.5px] font-semibold px-4 py-3 tracking-widest uppercase transition-all ${
                  isActive
                    ? 'text-[#0a1628] bg-[#c9a84c]/15 border-l-2 border-[#c9a84c] pl-[14px]'
                    : 'text-gray-500 hover:text-[#0a1628] hover:bg-[#c9a84c]/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {user && (
            <>
              <NavLink
                to="/my-bookings"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block text-[10.5px] font-semibold px-4 py-3 tracking-widest uppercase transition-all ${
                    isActive
                      ? 'text-[#0a1628] bg-[#c9a84c]/15 border-l-2 border-[#c9a84c] pl-[14px]'
                      : 'text-gray-500 hover:text-[#0a1628] hover:bg-[#c9a84c]/10'
                  }`
                }
              >
                Đặt Chỗ
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block text-[10.5px] font-semibold px-4 py-3 tracking-widest uppercase transition-all ${
                    isActive
                      ? 'text-[#0a1628] bg-[#c9a84c]/15 border-l-2 border-[#c9a84c] pl-[14px]'
                      : 'text-gray-500 hover:text-[#0a1628] hover:bg-[#c9a84c]/10'
                  }`
                }
              >
                Hồ Sơ
              </NavLink>
            </>
          )}
          {isStaff && (
            <NavLink
              to="/staff"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block text-[10.5px] font-semibold px-4 py-3 tracking-widest uppercase transition-all ${
                  isActive ? 'text-blue-700 bg-blue-100' : 'text-blue-600 bg-blue-50/60 hover:bg-blue-100'
                }`
              }
            >
              Staff
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block text-[10.5px] font-semibold px-4 py-3 tracking-widest uppercase transition-all ${
                  isActive ? 'text-red-600 bg-red-100' : 'text-red-500 bg-red-50/60 hover:bg-red-100'
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </div>

        <div className="px-4 py-5" style={{ borderTop: '1px solid rgba(201,168,76,0.3)' }}>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-9 h-9 flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: '#0a1628' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate" style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem' }}>{user.name}</p>
                  <RoleBadge role={user.roleName} />
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 text-[10.5px] font-semibold text-red-500 hover:bg-red-50 px-4 py-3 tracking-widest uppercase transition-colors">
                <HiOutlineLogout size={15} /> Đăng Xuất
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { navigate('/login'); setMobileOpen(false); }}
                className="flex-1 text-[10.5px] font-semibold text-gray-600 border border-gray-300 py-3 tracking-widest uppercase hover:bg-gray-50 transition-colors">
                Đăng Nhập
              </button>
              <button onClick={() => { navigate('/register'); setMobileOpen(false); }}
                className="flex-1 text-[10.5px] font-bold text-white py-3 tracking-widest uppercase"
                style={{ background: '#0a1628' }}>
                Đăng Ký
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-16" />
    </>
  );
};

export default Navbar;
