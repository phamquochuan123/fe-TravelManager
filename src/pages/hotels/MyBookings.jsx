import { useEffect, useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { getBookingsByEmail, cancelBooking } from "../../api/bookingApi"
import { AppContext } from "../../context/AppContext"
import MenuBar from "../../components/Menubar"
import { toast } from "react-toastify"

const calcNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0
    return Math.max(0, Math.floor((new Date(checkOut) - new Date(checkIn)) / 86400000))
}

const formatDate = (dateStr) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const MyBookings = () => {
    const navigate = useNavigate()
    const { userData } = useContext(AppContext)
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchCode, setSearchCode] = useState("")
    const [cancelling, setCancelling] = useState(null)

    useEffect(() => {
        if (!userData?.email) return
        getBookingsByEmail(userData.email)
            .then(data => setBookings(data))
            .catch(e => toast.error(e.message))
            .finally(() => setLoading(false))
    }, [userData])

    const handleCancel = async (bookingId) => {
        if (!window.confirm("Bạn có chắc muốn huỷ đặt phòng này?")) return
        setCancelling(bookingId)
        try {
            await cancelBooking(bookingId)
            setBookings(prev => prev.filter(b => b.id !== bookingId))
            toast.success("Huỷ đặt phòng thành công")
        } catch (e) {
            toast.error(e.message)
        } finally {
            setCancelling(null)
        }
    }

    const filtered = searchCode.trim()
        ? bookings.filter(b => b.bookingConfirmationCode?.toLowerCase().includes(searchCode.toLowerCase()))
        : bookings

    const isPast = (checkOut) => checkOut && new Date(checkOut) < new Date()

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />

            <div className="pt-28 pb-12 px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Lịch sử đặt phòng</h1>
                    <p className="text-gray-500 mt-1">Quản lý tất cả đặt phòng của bạn</p>
                </div>

                {/* Search by code */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex gap-3">
                    <div className="relative flex-1">
                        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã xác nhận..."
                            value={searchCode}
                            onChange={e => setSearchCode(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    {searchCode && (
                        <button onClick={() => setSearchCode("")} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors">
                            Xoá
                        </button>
                    )}
                </div>

                {/* Stats */}
                {bookings.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: "Tổng đặt phòng", value: bookings.length, icon: "bi-calendar-check", color: "text-indigo-600 bg-indigo-50" },
                            { label: "Đã hoàn thành", value: bookings.filter(b => isPast(b.checkOutDate)).length, icon: "bi-check-circle", color: "text-emerald-600 bg-emerald-50" },
                            { label: "Sắp tới", value: bookings.filter(b => !isPast(b.checkOutDate)).length, icon: "bi-clock", color: "text-amber-600 bg-amber-50" },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                                    <i className={`bi ${s.icon}`} />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-gray-900">{s.value}</p>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="w-10 h-10 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                        <i className="bi bi-calendar-x text-5xl text-gray-300 block mb-3" />
                        <p className="text-gray-500 font-medium">
                            {searchCode ? "Không tìm thấy booking với mã này" : "Bạn chưa có đặt phòng nào"}
                        </p>
                        {!searchCode && (
                            <button
                                onClick={() => navigate("/hotels")}
                                className="mt-4 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                            >
                                Tìm khách sạn ngay
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(booking => {
                            const nights = calcNights(booking.checkInDate, booking.checkOutDate)
                            const past = isPast(booking.checkOutDate)
                            return (
                                <div key={booking.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${past ? "border-gray-100 opacity-75" : "border-gray-100 hover:border-indigo-200 hover:shadow-md"}`}>
                                    <div className="p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            {/* Left info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${past ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-indigo-700"}`}>
                                                        {past ? "Đã hoàn thành" : "Sắp tới"}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-lg">
                                                        #{booking.bookingConfirmationCode}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-gray-900 mb-3">
                                                    {booking.guestFullName}
                                                    <span className="text-gray-400 font-normal text-sm ml-2">· {booking.guestEmail}</span>
                                                </h3>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <p className="text-xs text-gray-400 mb-0.5">Nhận phòng</p>
                                                        <p className="font-semibold text-gray-800">{formatDate(booking.checkInDate)}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <p className="text-xs text-gray-400 mb-0.5">Trả phòng</p>
                                                        <p className="font-semibold text-gray-800">{formatDate(booking.checkOutDate)}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <p className="text-xs text-gray-400 mb-0.5">Số đêm</p>
                                                        <p className="font-semibold text-gray-800">{nights} đêm</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-3">
                                                        <p className="text-xs text-gray-400 mb-0.5">Khách</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {booking.numOfGuests} NL
                                                            {booking.numOfChildren > 0 ? ` + ${booking.numOfChildren} TE` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {!past && (
                                                <div className="shrink-0">
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        disabled={cancelling === booking.bookingId}
                                                        className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        {cancelling === booking.bookingId ? (
                                                            <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-500 rounded-full animate-spin" />
                                                        ) : (
                                                            <i className="bi bi-x-circle" />
                                                        )}
                                                        Huỷ đặt phòng
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyBookings
