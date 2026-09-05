import { useState, useContext, Suspense } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, AlertTriangle, User,
  Bell, Menu, X, LogOut, ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { AppContext } from '../../context/appContextObject'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IAppContext {
  logout: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/staff',           icon: LayoutDashboard, label: 'Dashboard',       end: true  },
  { to: '/staff/schedule',  icon: CalendarDays,    label: 'Lịch dẫn Tour',   end: false },
  { to: '/staff/incidents', icon: AlertTriangle,   label: 'Báo cáo sự cố',   end: false },
  { to: '/profile',         icon: User,            label: 'Hồ sơ cá nhân',   end: true  },
]

const BREADCRUMB_LABELS: Record<string, string> = {
  '/staff':           'Dashboard',
  '/staff/schedule':  'Lịch dẫn Tour',
  '/staff/incidents': 'Báo cáo sự cố',
  '/profile':         'Hồ sơ cá nhân',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <span className="w-8 h-8 border-2 border-primary/15 border-t-primary rounded-full animate-spin" />
  </div>
)

// ─── Layout ───────────────────────────────────────────────────────────────────

const StaffLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useContext(AppContext) as IAppContext
  const user = useAuthStore(s => s.user)

  const handleLogout = async () => {
    try { await api.post('/logout') } catch {}
    logout()
    window.location.href = '/login'
  }

  const breadcrumb = BREADCRUMB_LABELS[location.pathname] ?? 'Staff Portal'

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'S'

  const closeMobile = () => setMobileSidebarOpen(false)

  return (
    <div className="flex h-screen bg-[#f8f5ee] overflow-hidden" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── Mobile backdrop ─────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-100 shadow-sm
          transition-transform duration-300
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ width: 260 }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 shrink-0">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div
            className="w-9 h-9 rounded flex items-center justify-center text-white font-black text-sm shrink-0 select-none bg-primary"
          >
            VN
          </div>
          <div>
            <span className="font-black text-base block leading-tight text-primary">
              TravelVN
            </span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">
              Staff Portal
            </span>
          </div>
          </Link>
        </div>

        <Separator />

        {/* Staff profile */}
        <div className="px-4 py-4 flex items-center gap-3 shrink-0">
          <Avatar className="w-12 h-12 shrink-0 ring-2 ring-blue-50">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-white font-bold text-sm bg-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-sm truncate leading-snug">
              {user?.name ?? 'Nhân viên'}
            </p>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
              {user?.roleName ?? 'STAFF'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all
                 ${isActive
                   ? 'font-semibold'
                   : 'font-medium text-gray-500 hover:text-gray-800 hover:bg-[#f8f5ee]'
                 }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: 'oklch(0.355 0.093 233 / 0.08)', color: 'oklch(0.355 0.093 233)' } : undefined
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* Logout */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:ml-[260px]">

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center gap-3 px-4 sm:px-6 shrink-0">

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileSidebarOpen(p => !p)}
            className="w-9 h-9 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors lg:hidden shrink-0"
          >
            {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <Link
              to="/staff"
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 font-medium"
            >
              Staff
            </Link>
            {location.pathname !== '/staff' && (
              <>
                <ChevronRight size={13} className="text-gray-300 shrink-0" />
                <span className="font-semibold text-gray-800 truncate">{breadcrumb}</span>
              </>
            )}
          </div>

          {/* Bell + avatar dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="relative w-9 h-9 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
              title="Thông báo"
            >
              <Bell size={18} />
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center"
              >
                3
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-primary transition-all">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-white text-xs font-bold bg-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User size={14} className="mr-2" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut size={14} className="mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            <div key={location.pathname} className="animate-fade-in-up">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
