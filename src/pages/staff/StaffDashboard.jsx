import { useEffect, useState, useContext } from "react"
import { AppContext } from "../../context/AppContext"
import { getAllTourBookings, updateTourBookingStatus } from "../../api/tourApi"
import { getAllRestaurantBookings, updateRestaurantBookingStatus } from "../../api/restaurantApi"
import axiosInstance from "../../api/axiosInstance"
import MenuBar from "../../components/Menubar"
import { toast } from "react-toastify"

const STATUS_COLOR = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    IN_PROGRESS: "bg-purple-100 text-purple-700 border-purple-200",
}
const STATUS_LABEL = {
    PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành", IN_PROGRESS: "Đang diễn ra"
}
const STATUS_ICON = {
    PENDING: "bi-hourglass-split", CONFIRMED: "bi-check-circle-fill",
    CANCELLED: "bi-x-circle-fill", COMPLETED: "bi-trophy-fill", IN_PROGRESS: "bi-play-circle-fill"
}
const TOUR_NEXT_STATUS = { PENDING: "CONFIRMED", CONFIRMED: "IN_PROGRESS", IN_PROGRESS: "COMPLETED" }
const TOUR_NEXT_LABEL = { PENDING: "Xác nhận", CONFIRMED: "Bắt đầu tour", IN_PROGRESS: "Hoàn thành" }

const StaffDashboard = () => {
    const { userData } = useContext(AppContext)
    const [activeTab, setActiveTab] = useState("tour")
    const [hotelBookings, setHotelBookings] = useState([])
    const [tourBookings, setTourBookings] = useState([])
    const [restaurantBookings, setRestaurantBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("ALL")

    useEffect(() => {
        setLoading(true)
        Promise.allSettled([
            axiosInstance.get("/bookings/all").then(r => r.data).catch(() => []),
            getAllTourBookings(),
            getAllRestaurantBookings(),
        ]).then(([hotelRes, tourRes, restRes]) => {
            if (hotelRes.status === "fulfilled") setHotelBookings(hotelRes.value || [])
            if (tourRes.status === "fulfilled") setTourBookings(tourRes.value || [])
            if (restRes.status === "fulfilled") setRestaurantBookings(restRes.value || [])
        }).finally(() => setLoading(false))
    }, [])

    const filterByStatus = (list) =>
        statusFilter === "ALL" ? list : list.filter(b => b.status === statusFilter)

    const handleUpdateTour = async (id, status) => {
        try {
            const updated = await updateTourBookingStatus(id, status)
            setTourBookings(prev => prev.map(b => b.id === id ? updated : b))
            toast.success("Cập nhật thành công")
        } catch { toast.error("Không thể cập nhật") }
    }

    const handleUpdateRestaurant = async (id, status) => {
        try {
            const updated = await updateRestaurantBookingStatus(id, status)
            setRestaurantBookings(prev => prev.map(b => b.id === id ? updated : b))
            toast.success("Cập nhật thành công")
        } catch { toast.error("Không thể cập nhật") }
    }

    const pendingCount = [...tourBookings, ...restaurantBookings, ...hotelBookings]
        .filter(b => b.status === "PENDING").length

    const TABS = [
        { key: "tour", label: "Đặt tour", icon: "bi-map-fill", count: tourBookings.length, color: "text-emerald-600", activeColor: "border-emerald-500 text-emerald-600" },
        { key: "restaurant", label: "Đặt bàn", icon: "bi-cup-hot-fill", count: restaurantBookings.length, color: "text-orange-600", activeColor: "border-orange-500 text-orange-600" },
        { key: "hotel", label: "Đặt phòng", icon: "bi-building-fill", count: hotelBookings.length, color: "text-sky-600", activeColor: "border-sky-500 text-sky-600" },
    ]

    const now = new Date()
    const greeting = now.getHours() < 12 ? "Chào buổi sáng" : now.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối"

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen">
                <span className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-20 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                    <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-black text-white border border-white/30">
                                {userData?.name?.charAt(0).toUpperCase() || "S"}
                            </div>
                            <div>
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">STAFF DASHBOARD</p>
                                <h1 className="text-2xl font-black text-white">{greeting}, {userData?.name?.split(" ").pop() || "Nhân viên"}!</h1>
                                <p className="text-white/60 text-sm">{userData?.email}</p>
                            </div>
                        </div>
                        {pendingCount > 0 && (
                            <div className="bg-amber-400 text-amber-900 font-black px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg">
                                <i className="bi bi-bell-fill animate-bounce"></i>
                                {pendingCount} đơn chờ xử lý
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Đặt tour", value: tourBookings.length, icon: "bi-map-fill", color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Đặt bàn", value: restaurantBookings.length, icon: "bi-cup-hot-fill", color: "text-orange-600", bg: "bg-orange-50" },
                        { label: "Đặt phòng", value: hotelBookings.length, icon: "bi-building-fill", color: "text-sky-600", bg: "bg-sky-50" },
                        { label: "Chờ xử lý", value: pendingCount, icon: "bi-hourglass-split", color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((s, i) => (
                        <div key={i} className={`${s.bg} rounded-2xl p-5 flex items-center gap-3 border border-white hover:shadow-md transition-shadow`}>
                            <div className="w-11 h-11 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
                                <i className={`bi ${s.icon} ${s.color} text-xl`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Booking management */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 pt-4 pb-0 gap-3 border-b border-gray-100">
                        <div className="flex gap-0">
                            {TABS.map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === tab.key ? tab.activeColor : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                    <i className={`bi ${tab.icon}`} />
                                    {tab.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key ? "bg-sky-100 text-sky-600" : "bg-gray-100 text-gray-500"}`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="pb-3 sm:pb-0">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50">
                                <option value="ALL">Tất cả trạng thái</option>
                                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === "tour" && (
                            filterByStatus(tourBookings).length === 0
                                ? <EmptyState icon="bi-map" text="Không có đặt tour" />
                                : <div className="space-y-3">
                                    {filterByStatus(tourBookings).map(b => (
                                        <div key={b.id} className="border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <i className="bi bi-map text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{b.tourName}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <i className="bi bi-geo-alt text-emerald-400 text-xs" /> {b.tourDestination}
                                                            <span className="text-gray-300 mx-1">·</span>
                                                            <i className="bi bi-calendar3 text-emerald-400 text-xs" /> {new Date(b.departureDate).toLocaleDateString("vi-VN")}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{b.numAdults} NL{b.numChildren > 0 ? `, ${b.numChildren} TE` : ""} · {b.contactName} · {b.contactPhone}</p>
                                                        <p className="text-xs font-bold text-emerald-600 mt-0.5">{Number(b.finalPrice).toLocaleString("vi-VN")} ₫</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"} flex items-center gap-1.5 shrink-0`}>
                                                    <i className={`bi ${STATUS_ICON[b.status] || "bi-circle"} text-xs`} />
                                                    {STATUS_LABEL[b.status] || b.status}
                                                </span>
                                            </div>
                                            {(b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "IN_PROGRESS") && (
                                                <div className="flex gap-2 mt-2">
                                                    {TOUR_NEXT_STATUS[b.status] && (
                                                        <button onClick={() => handleUpdateTour(b.id, TOUR_NEXT_STATUS[b.status])}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                                                            <i className="bi bi-check2" /> {TOUR_NEXT_LABEL[b.status]}
                                                        </button>
                                                    )}
                                                    {b.status !== "CANCELLED" && (
                                                        <button onClick={() => handleUpdateTour(b.id, "CANCELLED")}
                                                            className="px-4 py-2 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-bold flex items-center gap-1.5">
                                                            <i className="bi bi-x" /> Hủy
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                        )}

                        {activeTab === "restaurant" && (
                            filterByStatus(restaurantBookings).length === 0
                                ? <EmptyState icon="bi-cup-hot" text="Không có đặt bàn" />
                                : <div className="space-y-3">
                                    {filterByStatus(restaurantBookings).map(b => (
                                        <div key={b.id} className="border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <i className="bi bi-cup-hot text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{b.restaurantName}</p>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            {new Date(b.bookingDate).toLocaleDateString("vi-VN")} lúc {b.bookingTime} · {b.guestCount} khách
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{b.contactName} · {b.contactPhone}</p>
                                                        {b.specialRequests && <p className="text-xs text-gray-400">Ghi chú: {b.specialRequests}</p>}
                                                        <p className="text-xs text-gray-400">Mã: <span className="font-mono font-bold text-orange-600">{b.confirmationCode}</span></p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"} flex items-center gap-1.5 shrink-0`}>
                                                    <i className={`bi ${STATUS_ICON[b.status] || "bi-circle"} text-xs`} />
                                                    {STATUS_LABEL[b.status] || b.status}
                                                </span>
                                            </div>
                                            {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                <div className="flex gap-2 mt-2">
                                                    {TOUR_NEXT_STATUS[b.status] && (
                                                        <button onClick={() => handleUpdateRestaurant(b.id, TOUR_NEXT_STATUS[b.status])}
                                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                                                            <i className="bi bi-check2" /> {TOUR_NEXT_LABEL[b.status]}
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleUpdateRestaurant(b.id, "CANCELLED")}
                                                        className="px-4 py-2 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-bold flex items-center gap-1.5">
                                                        <i className="bi bi-x" /> Hủy
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                        )}

                        {activeTab === "hotel" && (
                            filterByStatus(hotelBookings).length === 0
                                ? <EmptyState icon="bi-building" text="Không có đặt phòng" />
                                : <div className="space-y-3">
                                    {filterByStatus(hotelBookings).map(b => (
                                        <div key={b.id} className="border border-gray-100 rounded-2xl p-5 hover:border-sky-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <i className="bi bi-building text-sky-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{b.hotelName || "Khách sạn"} <span className="text-gray-400 font-normal text-sm">— {b.roomType}</span></p>
                                                        <p className="text-sm text-gray-500 mt-0.5">Khách: {b.guestFullName} · {b.guestEmail}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            <i className="bi bi-calendar3 mr-1" />{b.checkInDate} → {b.checkOutDate} · {b.totalNumOfGuests} khách
                                                        </p>
                                                        <p className="text-xs text-gray-400">Mã: <span className="font-mono font-bold text-sky-600">{b.bookingConfirmationCode}</span></p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"} flex items-center gap-1.5 shrink-0`}>
                                                    <i className={`bi ${STATUS_ICON[b.status] || "bi-circle"} text-xs`} />
                                                    {STATUS_LABEL[b.status] || b.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const EmptyState = ({ icon, text }) => (
    <div className="text-center py-16">
        <i className={`bi ${icon} text-5xl text-gray-300 block mb-3`} />
        <p className="text-gray-400 font-medium">{text}</p>
    </div>
)

export default StaffDashboard
