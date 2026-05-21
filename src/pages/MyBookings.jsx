import { useEffect, useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { getBookingsByEmail, cancelBooking } from "../api/bookingApi"
import { getMyTourBookings, cancelTourBooking } from "../api/tourApi"
import { getMyRestaurantBookings, cancelRestaurantBooking } from "../api/restaurantApi"
import { AppContext } from "../context/AppContext"
import MenuBar from "../components/Menubar"
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

const TABS = [
    { key: "hotel", label: "Khách sạn", icon: "bi-building-fill", activeColor: "border-sky-500 text-sky-600" },
    { key: "tour", label: "Tour", icon: "bi-map-fill", activeColor: "border-emerald-500 text-emerald-600" },
    { key: "restaurant", label: "Nhà hàng", icon: "bi-cup-hot-fill", activeColor: "border-orange-500 text-orange-600" },
]

const MyBookings = () => {
    const navigate = useNavigate()
    const { userData } = useContext(AppContext)
    const [activeTab, setActiveTab] = useState("hotel")
    const [hotelBookings, setHotelBookings] = useState([])
    const [tourBookings, setTourBookings] = useState([])
    const [restaurantBookings, setRestaurantBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [cancelConfirm, setCancelConfirm] = useState(null)

    const userEmail = userData?.email || ""

    useEffect(() => {
        setLoading(true)
        Promise.allSettled([
            userEmail ? getBookingsByEmail(userEmail) : Promise.resolve([]),
            getMyTourBookings(),
            getMyRestaurantBookings(),
        ]).then(([hotelRes, tourRes, restRes]) => {
            if (hotelRes.status === "fulfilled") setHotelBookings(hotelRes.value || [])
            if (tourRes.status === "fulfilled") setTourBookings(tourRes.value || [])
            if (restRes.status === "fulfilled") setRestaurantBookings(restRes.value || [])
        }).finally(() => setLoading(false))
    }, [userEmail])

    const handleCancelHotel = async (id) => {
        const prev = hotelBookings
        setHotelBookings(b => b.filter(x => x.id !== id))
        setCancelConfirm(null)
        try {
            await cancelBooking(id)
            toast.success("Đã hủy đặt phòng")
        } catch {
            setHotelBookings(prev)
            toast.error("Không thể hủy đặt phòng")
        }
    }

    const handleCancelTour = async (id) => {
        try {
            await cancelTourBooking(id)
            setTourBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b))
            toast.success("Đã hủy đặt tour")
        } catch (err) { toast.error(err.message) }
        setCancelConfirm(null)
    }

    const handleCancelRestaurant = async (id) => {
        try {
            await cancelRestaurantBooking(id)
            setRestaurantBookings(prev => prev.map(b => b.id === id ? { ...b, status: "CANCELLED" } : b))
            toast.success("Đã hủy đặt bàn")
        } catch { toast.error("Không thể hủy đặt bàn") }
        setCancelConfirm(null)
    }

    const allBookings = [...hotelBookings, ...tourBookings, ...restaurantBookings]
    const totalBookings = allBookings.length
    const activeBookings = allBookings.filter(b => b.status === "PENDING" || b.status === "CONFIRMED").length
    const completedBookings = allBookings.filter(b => b.status === "COMPLETED").length
    const cancelledBookings = allBookings.filter(b => b.status === "CANCELLED").length
    const tabCounts = { hotel: hotelBookings.length, tour: tourBookings.length, restaurant: restaurantBookings.length }

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

            {/* Hero */}
            <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-600 pt-24 pb-12 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="max-w-5xl mx-auto relative z-10">
                    <h1 className="text-3xl font-black text-white tracking-tight">Lịch sử đặt dịch vụ</h1>
                    <p className="text-sky-200 mt-1">Quản lý tất cả booking của <span className="font-semibold text-white">{userData?.name}</span></p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-1 pb-12">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 -mt-6 relative z-10">
                    {[
                        { label: "Tổng booking", value: totalBookings, icon: "bi-calendar-check-fill", bg: "from-sky-500 to-blue-600" },
                        { label: "Đang hoạt động", value: activeBookings, icon: "bi-play-circle-fill", bg: "from-cyan-500 to-sky-600" },
                        { label: "Hoàn thành", value: completedBookings, icon: "bi-trophy-fill", bg: "from-emerald-500 to-teal-600" },
                        { label: "Đã hủy", value: cancelledBookings, icon: "bi-x-circle-fill", bg: "from-red-400 to-rose-600" },
                    ].map((s, i) => (
                        <div key={i} className={`bg-gradient-to-br ${s.bg} rounded-2xl p-4 shadow-xl flex items-center gap-3`}>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <i className={`bi ${s.icon} text-white text-lg`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{s.value}</p>
                                <p className="text-white/70 text-xs">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tab content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeTab === tab.key ? tab.activeColor : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                <i className={`bi ${tab.icon}`} /> {tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key ? "bg-sky-100 text-sky-600" : "bg-gray-100 text-gray-500"}`}>
                                    {tabCounts[tab.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {activeTab === "hotel" && (
                            hotelBookings.length === 0 ? (
                                <EmptyState icon="bi-building" label="Chưa có đặt phòng khách sạn" onClick={() => navigate("/hotels")} btnLabel="Tìm khách sạn" />
                            ) : (
                                <div className="space-y-3">
                                    {hotelBookings.map(b => (
                                        <div key={b.id} className="border border-gray-100 rounded-2xl p-5 hover:border-sky-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <i className="bi bi-building-fill text-sky-500 text-xl" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{b.hotelName || "Khách sạn"}</p>
                                                        <p className="text-sm text-gray-500">Phòng: {b.roomType || "—"}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 font-mono">Mã: {b.bookingConfirmationCode}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"} shrink-0 flex items-center gap-1.5`}>
                                                    <i className={`bi ${STATUS_ICON[b.status] || "bi-circle"} text-xs`} />
                                                    {STATUS_LABEL[b.status] || b.status}
                                                </span>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-calendar-plus text-sky-400" /> {b.checkInDate}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-calendar-minus text-orange-400" /> {b.checkOutDate}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-people text-blue-400" /> {b.totalNumOfGuests} khách
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-person text-gray-400" /> {b.guestFullName}
                                                </span>
                                            </div>
                                            {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                <div className="mt-3 flex justify-end">
                                                    <button onClick={() => setCancelConfirm({ type: "hotel", id: b.id })}
                                                        className="px-4 py-1.5 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-bold flex items-center gap-1.5">
                                                        <i className="bi bi-x-circle" /> Hủy đặt phòng
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === "tour" && (
                            tourBookings.length === 0 ? (
                                <EmptyState icon="bi-map" label="Chưa có đặt tour" onClick={() => navigate("/tours")} btnLabel="Khám phá tour" />
                            ) : (
                                <div className="space-y-3">
                                    {tourBookings.map(b => (
                                        <div key={b.id} className="border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <i className="bi bi-map-fill text-emerald-500 text-xl" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{b.tourName}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <i className="bi bi-geo-alt text-emerald-400 text-xs" /> {b.tourDestination}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">Khởi hành: {new Date(b.departureDate).toLocaleDateString("vi-VN")}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"} shrink-0 flex items-center gap-1.5`}>
                                                    <i className={`bi ${STATUS_ICON[b.status] || "bi-circle"} text-xs`} />
                                                    {STATUS_LABEL[b.status] || b.status}
                                                </span>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-people text-emerald-400" /> {b.numAdults} NL{b.numChildren > 0 ? `, ${b.numChildren} TE` : ""}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-person text-gray-400" /> {b.contactName}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg col-span-2">
                                                    <i className="bi bi-currency-exchange text-amber-400" /> {Number(b.finalPrice).toLocaleString("vi-VN")} ₫
                                                </span>
                                            </div>
                                            {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                <div className="mt-3 flex justify-end">
                                                    <button onClick={() => setCancelConfirm({ type: "tour", id: b.id })}
                                                        className="px-4 py-1.5 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-bold flex items-center gap-1.5">
                                                        <i className="bi bi-x-circle" /> Hủy tour
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === "restaurant" && (
                            restaurantBookings.length === 0 ? (
                                <EmptyState icon="bi-cup-hot" label="Chưa có đặt bàn" onClick={() => navigate("/restaurants")} btnLabel="Tìm nhà hàng" />
                            ) : (
                                <div className="space-y-3">
                                    {restaurantBookings.map(b => (
                                        <div key={b.id} className="border border-gray-100 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <i className="bi bi-cup-hot-fill text-orange-500 text-xl" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{b.restaurantName}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <i className="bi bi-geo-alt text-orange-400 text-xs" /> {b.restaurantCity}
                                                        </p>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">Mã: {b.confirmationCode}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"} shrink-0 flex items-center gap-1.5`}>
                                                    <i className={`bi ${STATUS_ICON[b.status] || "bi-circle"} text-xs`} />
                                                    {STATUS_LABEL[b.status] || b.status}
                                                </span>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-calendar text-orange-400" /> {new Date(b.bookingDate).toLocaleDateString("vi-VN")}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-clock text-blue-400" /> {b.bookingTime}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-people text-purple-400" /> {b.guestCount} khách
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                    <i className="bi bi-person text-gray-400" /> {b.contactName}
                                                </span>
                                            </div>
                                            {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                <div className="mt-3 flex justify-end">
                                                    <button onClick={() => setCancelConfirm({ type: "restaurant", id: b.id })}
                                                        className="px-4 py-1.5 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-bold flex items-center gap-1.5">
                                                        <i className="bi bi-x-circle" /> Hủy đặt bàn
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel modal */}
            {cancelConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="bi bi-exclamation-triangle text-2xl text-red-500" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 text-center mb-2">Xác nhận hủy?</h3>
                        <p className="text-gray-500 text-center text-sm mb-6">Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setCancelConfirm(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition-colors">
                                Không
                            </button>
                            <button
                                onClick={() => {
                                    if (cancelConfirm.type === "hotel") handleCancelHotel(cancelConfirm.id)
                                    else if (cancelConfirm.type === "tour") handleCancelTour(cancelConfirm.id)
                                    else handleCancelRestaurant(cancelConfirm.id)
                                }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition-colors">
                                Hủy booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const EmptyState = ({ icon, label, onClick, btnLabel }) => (
    <div className="text-center py-16">
        <i className={`bi ${icon} text-5xl text-gray-300 block mb-3`} />
        <p className="text-gray-500 font-medium mb-4">{label}</p>
        <button onClick={onClick} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-200">
            {btnLabel}
        </button>
    </div>
)

export default MyBookings
