import { useState, useContext, useRef, useEffect, Suspense } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, Map, CalendarRange, Building2, Utensils,
  ShoppingCart, BedDouble, UtensilsCrossed, Users, UserCog,
  Star, BarChart3, Bell, Search, ChevronRight, LogOut,
  Settings, User, PanelLeftClose, PanelLeftOpen,
  ShieldCheck, Tag, AlertTriangle, KeyRound, MapPin, CreditCard,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { ScrollArea } from '../ui/scroll-area'
import { AppContext } from '../../context/AppContext'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IAppContext { setIsLoggedIn: (v: boolean) => void }

interface OverviewStats {
  tourBookingsByStatus?: Record<string, number>
  restaurantBookingsByStatus?: Record<string, number>
  openIncidentsCount?: number
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  end?: boolean
  badgeKey?: keyof BadgeCounts
}

interface BadgeCounts {
  tourPending: number
  roomPending: number
  restPending: number
  incidentPending: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_FULL      = 260
const SIDEBAR_COLLAPSED = 68

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'TỔNG QUAN',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'DỊCH VỤ',
    items: [
      { to: '/admin/tours',       icon: Map,           label: 'Quản lý Tour' },
      { to: '/admin/departures',  icon: CalendarRange, label: 'Lịch khởi hành' },
      { to: '/admin/hotels',      icon: Building2,     label: 'Khách sạn' },
      { to: '/admin/restaurants',  icon: Utensils,  label: 'Nhà hàng' },
      { to: '/admin/destinations', icon: MapPin,    label: 'Địa điểm' },
    ],
  },
  {
    label: 'ĐƠN HÀNG',
    items: [
      { to: '/admin/orders/tours',       icon: ShoppingCart,    label: 'Đơn Tour',   badgeKey: 'tourPending' },
      { to: '/admin/orders/rooms',       icon: BedDouble,       label: 'Đặt phòng',  badgeKey: 'roomPending' },
      { to: '/admin/orders/restaurants', icon: UtensilsCrossed, label: 'Đặt bàn',    badgeKey: 'restPending' },
    ],
  },
  {
    label: 'NGƯỜI DÙNG',
    items: [
      { to: '/admin/customers', icon: Users,   label: 'Khách hàng' },
      { to: '/admin/staff',     icon: UserCog, label: 'Staff' },
    ],
  },
  {
    label: 'NỘI DUNG',
    items: [
      { to: '/admin/reviews',   icon: Star,          label: 'Đánh giá' },
      { to: '/admin/coupons',   icon: Tag,           label: 'Mã giảm giá' },
      { to: '/admin/incidents', icon: AlertTriangle, label: 'Sự cố', badgeKey: 'incidentPending' as keyof BadgeCounts },
      { to: '/admin/analytics', icon: BarChart3,     label: 'Thống kê & Báo cáo' },
    ],
  },
  {
    label: 'HỆ THỐNG',
    items: [
      { to: '/admin/payments',    icon: CreditCard,  label: 'Thanh toán' },
      { to: '/admin/roles',       icon: ShieldCheck, label: 'Vai trò' },
      { to: '/admin/permissions', icon: KeyRound,    label: 'Quyền hạn' },
    ],
  },
]

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin':                        'Dashboard',
  '/admin/tours':                  'Quản lý Tour',
  '/admin/departures':             'Lịch khởi hành',
  '/admin/hotels':                 'Khách sạn',
  '/admin/restaurants':            'Nhà hàng',
  '/admin/orders/tours':           'Đơn Tour',
  '/admin/orders/rooms':           'Đặt phòng',
  '/admin/orders/restaurants':     'Đặt bàn',
  '/admin/customers':              'Khách hàng',
  '/admin/staff':                  'Staff',
  '/admin/reviews':                'Đánh giá',
  '/admin/coupons':                'Mã giảm giá',
  '/admin/incidents':              'Báo cáo sự cố',
  '/admin/analytics':              'Thống kê & Báo cáo',
  '/admin/destinations':           'Địa điểm',
  '/admin/payments':               'Thanh toán',
  '/admin/roles':                  'Vai trò',
  '/admin/permissions':            'Quyền hạn',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <span className="w-8 h-8 border-2 border-primary/15 border-t-primary rounded-full animate-spin" />
  </div>
)

// ─── Layout ───────────────────────────────────────────────────────────────────

const AdminLayout = () => {
  const [collapsed,         setCollapsed]         = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isDesktop,         setIsDesktop]         = useState(() => window.innerWidth >= 1024)
  const [searchFocused,     setSearchFocused]     = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { setIsLoggedIn } = useContext(AppContext) as IAppContext
  const user = useAuthStore(s => s.user)

  // Track desktop breakpoint
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Fetch badge counts
  const { data: stats } = useQuery<OverviewStats>({
    queryKey: ['admin', 'stats-overview'],
    queryFn: async () => {
      const res = await api.get('/admin/statistics/overview')
      return res.data
    },
    refetchInterval: 60_000,
    retry: false,
  })

  const badges: BadgeCounts = {
    tourPending:     stats?.tourBookingsByStatus?.PENDING ?? 0,
    roomPending:     0,
    restPending:     stats?.restaurantBookingsByStatus?.PENDING ?? 0,
    incidentPending: stats?.openIncidentsCount ?? 0,
  }
  const totalPending = badges.tourPending + badges.roomPending + badges.restPending
  const openIncidents = stats?.openIncidentsCount ?? 0

  const handleLogout = async () => {
    try { await api.post('/logout') } catch {}
    setIsLoggedIn(false)
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'A'

  const breadcrumbLabel = BREADCRUMB_MAP[location.pathname]
    ?? location.pathname.split('/').filter(Boolean).pop()
    ?? 'Admin'

  const sidebarWidth = (isDesktop && collapsed) ? SIDEBAR_COLLAPSED : SIDEBAR_FULL
  const mainMargin   = isDesktop ? sidebarWidth : 0

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-screen bg-[#f8f5ee] overflow-hidden">

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex flex-col text-white overflow-hidden bg-primary
            transition-all duration-300
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
          style={{ width: sidebarWidth }}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 shrink-0 border-b border-white/12">
            <Link to="/" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-white font-black text-sm shrink-0 select-none">
                VN
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="font-black text-base block leading-tight truncate text-white">TravelVN</span>
                  <span className="text-white/45 text-[11px] block">Admin Portal</span>
                </div>
              )}
            </Link>
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1 py-3">
            <nav className="px-2 space-y-3">
              {NAV_GROUPS.map(group => (
                <div key={group.label}>
                  {/* Section label */}
                  {!collapsed ? (
                    <p className="text-white/35 text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                      {group.label}
                    </p>
                  ) : (
                    <div className="my-1.5 mx-3 border-t border-white/12" />
                  )}

                  <div className="space-y-0.5">
                    {group.items.map(({ to, icon: Icon, label, end, badgeKey }) => {
                      const badge = badgeKey ? badges[badgeKey] : 0

                      const linkEl = (
                        <NavLink
                          to={to}
                          end={end}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={({ isActive }) => `
                            relative flex items-center rounded transition-all duration-200 text-sm font-medium
                            ${collapsed
                              ? 'justify-center w-10 h-10 mx-auto'
                              : 'gap-3 px-3 py-2.5 w-full border-l-2'
                            }
                            ${isActive
                              ? 'bg-white/20 text-white font-semibold border-l-white/80'
                              : 'text-white/65 hover:bg-white/10 hover:text-white border-l-transparent hover:border-l-white/40'
                            }
                          `}
                        >
                          <Icon size={18} className="shrink-0" />

                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{label}</span>
                              {!!badge && (
                                <span className="bg-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
                                  {badge > 99 ? '99+' : badge}
                                </span>
                              )}
                            </>
                          )}

                          {collapsed && !!badge && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-400 rounded-full border border-[#0a1628] text-[8px] text-white font-bold flex items-center justify-center">
                              {badge > 9 ? '9+' : badge}
                            </span>
                          )}
                        </NavLink>
                      )

                      return collapsed ? (
                        <div key={to} className="flex justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="bg-gray-900 text-white border-gray-800 text-xs"
                            >
                              {label}
                              {!!badge && ` (${badge})`}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <div key={to}>{linkEl}</div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Bottom: user + logout */}
          <div className="shrink-0 p-3 border-t border-white/12">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 mx-auto flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-white text-xs font-bold bg-white/20">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800 text-xs">
                  {user?.name} — Đăng xuất
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/10 transition-colors">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-white text-xs font-bold bg-white/20">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate leading-tight">{user?.name ?? 'Admin'}</p>
                  <p className="text-white/40 text-xs">Quản trị viên</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="text-white/40 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────── */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{ marginLeft: mainMargin, transition: 'margin-left 300ms ease' }}
        >
          {/* ── Header ──────────────────────────────────── */}
          <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center gap-3 px-4 sm:px-5 shrink-0">

            {/* Collapse / hamburger toggle */}
            <button
              onClick={() => isDesktop ? setCollapsed(p => !p) : setMobileSidebarOpen(p => !p)}
              className="w-9 h-9 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
              title={isDesktop ? (collapsed ? 'Mở sidebar' : 'Thu sidebar') : (mobileSidebarOpen ? 'Đóng menu' : 'Mở menu')}
            >
              {isDesktop
                ? (collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />)
                : (mobileSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />)
              }
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
              <Link
                to="/admin"
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 font-medium"
              >
                Admin
              </Link>
              {location.pathname !== '/admin' && (
                <>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                  <span className="font-semibold text-gray-800 truncate">{breadcrumbLabel}</span>
                </>
              )}
            </div>

            {/* Global search */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded border bg-[#f8f5ee] transition-all
                ${searchFocused
                  ? 'border-[#0a1628] ring-2 ring-[#0a1628]/10 w-60'
                  : 'border-gray-200 hover:border-gray-300 w-48'
                }`}
            >
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Tìm kiếm..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 flex-1 min-w-0 focus:outline-none"
              />
              <span className="hidden lg:flex text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                ⌃K
              </span>
            </div>

            {/* Bell + Avatar */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Bell popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative w-9 h-9 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors">
                    <Bell size={18} />
                    {(totalPending + openIncidents) > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                        {totalPending + openIncidents > 9 ? '9+' : totalPending + openIncidents}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3">
                  <p className="font-bold text-gray-900 text-sm mb-3 px-1">Thông báo</p>
                  {totalPending + openIncidents === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">Không có thông báo mới</p>
                  ) : (
                    <div className="space-y-2">
                      {badges.tourPending > 0 && (
                        <button
                          onClick={() => navigate('/admin/orders/tours')}
                          className="w-full flex items-center gap-3 p-2.5 rounded text-left bg-orange-50 hover:bg-orange-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center shrink-0">
                            <ShoppingCart size={14} className="text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{badges.tourPending} đơn tour chờ duyệt</p>
                            <p className="text-xs text-gray-400">Nhấn để xem</p>
                          </div>
                        </button>
                      )}
                      {badges.restPending > 0 && (
                        <button
                          onClick={() => navigate('/admin/orders/restaurants')}
                          className="w-full flex items-center gap-3 p-2.5 rounded text-left bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                            <UtensilsCrossed size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{badges.restPending} đặt bàn chờ duyệt</p>
                            <p className="text-xs text-gray-400">Nhấn để xem</p>
                          </div>
                        </button>
                      )}
                      {openIncidents > 0 && (
                        <button
                          onClick={() => navigate('/admin/incidents')}
                          className="w-full flex items-center gap-3 p-2.5 rounded text-left bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                            <Bell size={14} className="text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{openIncidents} sự cố chưa xử lý</p>
                            <p className="text-xs text-gray-400">Nhấn để xem</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Avatar dropdown */}
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
                    <User size={14} className="mr-2" /> Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Settings size={14} className="mr-2" /> Cài đặt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 focus:text-red-500"
                  >
                    <LogOut size={14} className="mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page */}
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
              <div key={location.pathname} className="animate-fade-in-up">
                <Outlet />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default AdminLayout
