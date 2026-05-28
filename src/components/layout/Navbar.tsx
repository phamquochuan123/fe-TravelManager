import { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
  { path: '/tours', label: 'Tour' },
  { path: '/hotels', label: 'Khach san' },
  { path: '/restaurants', label: 'Nha hang' },
] as const;

const RoleBadge = ({ role }: { role: User['roleName'] }) => {
  const map: Record<string, string> = {
    ADMIN: 'bg-accent/20 text-accent',
    STAFF: 'bg-primary/20 text-primary',
    USER: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${map[role] ?? 'bg-muted text-muted-foreground'}`}
    >
      {role}
    </span>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const isAdmin = useAuthStore(selectIsAdmin);
  const isStaff = useAuthStore(selectIsStaff);
  const { logout } = useAuthStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      toast.error(err instanceof Error ? err.message : 'Dang xuat that bai');
    }
  };

  const handleSendOTP = async () => {
    try {
      await api.post('/send-otp');
      navigate('/verify-email');
      toast.success('OTP da duoc gui toi email cua ban.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Loi khi gui OTP');
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-card/95 backdrop-blur-xl shadow-lg shadow-primary/5 border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-20">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group"
          >
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Travel<span className="text-primary">VN</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `relative text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
                  `relative text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`
                }
              >
                Dat cho
              </NavLink>
            )}

            {isStaff && (
              <button
                onClick={() => navigate('/staff')}
                className="text-sm font-medium text-primary px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300"
              >
                Staff
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-sm font-medium text-accent px-4 py-2 rounded-full bg-accent/10 hover:bg-accent/20 transition-all duration-300"
              >
                Admin
              </button>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((p) => !p)}
                  className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-secondary hover:bg-secondary/80 border border-border transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm bg-primary text-primary-foreground">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <HiChevronDown
                    size={14}
                    className={`text-muted-foreground transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full right-0 mt-3 w-64 bg-card rounded-2xl shadow-2xl shadow-primary/10 border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-4 border-b border-border bg-secondary/50">
                      <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                        Dang nhap voi
                      </p>
                      <p className="text-sm font-semibold text-foreground truncate mt-1">
                        {user.name}
                      </p>
                      <RoleBadge role={user.roleName} />
                    </div>

                    <div className="p-2">
                      <DropItem
                        icon={<HiOutlineUser size={16} />}
                        label="Ho so ca nhan"
                        onClick={() => {
                          navigate('/profile');
                          setDropdownOpen(false);
                        }}
                      />
                      <DropItem
                        icon={<HiOutlineCalendar size={16} />}
                        label="Lich su dat cho"
                        onClick={() => {
                          navigate('/my-bookings');
                          setDropdownOpen(false);
                        }}
                      />

                      <div className="lg:hidden border-t border-border my-2 pt-2">
                        {NAV_LINKS.map(({ path, label }) => (
                          <DropItem
                            key={path}
                            label={label}
                            onClick={() => {
                              navigate(path);
                              setDropdownOpen(false);
                            }}
                          />
                        ))}
                      </div>

                      {isStaff && (
                        <DropItem
                          icon={<HiOutlineBadgeCheck size={16} className="text-primary" />}
                          label="Staff Dashboard"
                          className="text-primary"
                          onClick={() => {
                            navigate('/staff');
                            setDropdownOpen(false);
                          }}
                        />
                      )}
                      {isAdmin && (
                        <DropItem
                          icon={<HiOutlineShieldCheck size={16} className="text-accent" />}
                          label="Admin Dashboard"
                          className="text-accent"
                          onClick={() => {
                            navigate('/admin');
                            setDropdownOpen(false);
                          }}
                        />
                      )}
                      {!user.isAccountVerified && (
                        <DropItem
                          label="Xac thuc Email"
                          className="text-amber-600"
                          onClick={() => {
                            handleSendOTP();
                            setDropdownOpen(false);
                          }}
                        />
                      )}

                      <div className="border-t border-border mt-2 pt-2">
                        <DropItem
                          icon={<HiOutlineLogout size={16} />}
                          label="Dang xuat"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={handleLogout}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-full transition-all duration-300"
                >
                  Dang nhap
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                >
                  Bat dau
                </button>
              </div>
            )}

            <button
              className="lg:hidden p-2.5 rounded-full text-foreground hover:bg-secondary transition-all duration-300"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <HiX size={22} /> : <HiOutlineMenuAlt3 size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-card border-t border-border px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ path, label }) => (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setMobileOpen(false);
                }}
                className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary px-4 py-3 rounded-xl transition-all duration-300"
              >
                {label}
              </button>
            ))}
            {!user && (
              <div className="flex gap-3 pt-4 border-t border-border mt-4">
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileOpen(false);
                  }}
                  className="flex-1 text-sm font-medium text-foreground border border-border py-3 rounded-xl hover:bg-secondary transition-all duration-300"
                >
                  Dang nhap
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setMobileOpen(false);
                  }}
                  className="flex-1 text-sm font-medium text-primary-foreground bg-primary py-3 rounded-xl hover:bg-primary/90 transition-all duration-300"
                >
                  Dang ky
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="h-20" />
    </>
  );
};

interface DropItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const DropItem = ({ label, icon, onClick, className = '' }: DropItemProps) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-foreground hover:bg-secondary ${className}`}
  >
    {icon && <span className="text-muted-foreground">{icon}</span>}
    {label}
  </button>
);

export default Navbar;
