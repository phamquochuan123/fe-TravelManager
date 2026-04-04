import { useEffect, useState, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getRoomById } from "../../api/roomApi"
import { bookRoom } from "../../api/bookingApi"
import { AppContext } from "../../context/AppContext"
import MenuBar from "../../components/Menubar"
import { toast } from "react-toastify"

const toDateStr = (d) => d.toISOString().split("T")[0]

// Check-in lúc 14:00 — deadline đặt phòng = 14:00 - 12h = 02:00 cùng ngày.
// Nếu đã qua 02:00 hôm nay → ngày sớm nhất có thể đặt là ngày mai.
const getMinCheckInDate = () => {
    const now = new Date()
    // Deadline của ngày hôm nay là 02:00 sáng hôm nay
    const todayDeadline = new Date()
    todayDeadline.setHours(2, 0, 0, 0)
    // Nếu đã qua 02:00 → ngày hôm nay không đặt được → min là ngày mai
    if (now >= todayDeadline) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return toDateStr(tomorrow)
    }
    return toDateStr(now)
}

const getDefaultCheckOut = (checkIn) => {
    const d = new Date(checkIn)
    d.setDate(d.getDate() + 1)
    return toDateStr(d)
}

const calcNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0
    const diff = new Date(checkOut) - new Date(checkIn)
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

const BookRoom = () => {
    const { hotelId, roomId } = useParams()
    const navigate = useNavigate()
    const { userData } = useContext(AppContext)

    const [room, setRoom] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [confirmCode, setConfirmCode] = useState("")

    const minCheckIn = getMinCheckInDate()

    const [form, setForm] = useState({
        guestFullName: userData?.name || "",
        guestEmail: userData?.email || "",
        checkInDate: minCheckIn,
        checkOutDate: getDefaultCheckOut(minCheckIn),
        numOfAdults: 1,
        numOfChildren: 0,
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        getRoomById(roomId)
            .then(data => setRoom(data))
            .catch(() => navigate(`/hotels/${hotelId}`))
            .finally(() => setLoading(false))
    }, [roomId])

    // Pre-fill user info when userData loads
    useEffect(() => {
        if (userData) {
            setForm(f => ({ ...f, guestFullName: userData.name || f.guestFullName, guestEmail: userData.email || f.guestEmail }))
        }
    }, [userData])

    const nights = calcNights(form.checkInDate, form.checkOutDate)
    const total = room ? Number(room.roomPrice) * nights : 0

    const validate = () => {
        const e = {}
        if (!form.guestFullName.trim()) e.guestFullName = "Vui lòng nhập họ tên"
        if (!form.guestEmail.trim() || !/\S+@\S+\.\S+/.test(form.guestEmail)) e.guestEmail = "Email không hợp lệ"
        if (!form.checkInDate) e.checkInDate = "Chọn ngày nhận phòng"
        if (!form.checkOutDate) e.checkOutDate = "Chọn ngày trả phòng"
        if (nights <= 0) e.checkOutDate = "Ngày trả phòng phải sau ngày nhận phòng"
        if (form.numOfAdults < 1) e.numOfAdults = "Ít nhất 1 người lớn"
        // Kiểm tra rule 12 tiếng: deadline = 02:00 cùng ngày check-in (= 14:00 - 12h)
        if (form.checkInDate) {
            const deadline = new Date(form.checkInDate)
            deadline.setHours(2, 0, 0, 0)
            if (new Date() >= deadline) {
                e.checkInDate = `Hạn đặt phòng cho ngày ${form.checkInDate} đã kết thúc lúc 02:00. Vui lòng chọn ngày khác.`
            }
        }
        return e
    }

    const handleChange = e => {
        const { name, value } = e.target
        if (name === "checkInDate") {
            // Khi đổi ngày check-in, tự cập nhật check-out về ngày kế tiếp
            setForm(f => ({ ...f, checkInDate: value, checkOutDate: getDefaultCheckOut(value) }))
        } else {
            setForm(f => ({ ...f, [name]: name.includes("num") ? Number(value) : value }))
        }
        setErrors(errs => ({ ...errs, [name]: "" }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length) { setErrors(errs); return }
        setSubmitting(true)
        try {
            const code = await bookRoom(hotelId, roomId, form)
            setConfirmCode(code)
            toast.success("Đặt phòng thành công!")
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit'] flex items-center justify-center">
            <MenuBar />
            <span className="w-10 h-10 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    )

    // Success screen
    if (confirmCode) return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="flex items-center justify-center min-h-screen px-6 pt-20">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <i className="bi bi-check-circle-fill text-4xl text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Đặt phòng thành công!</h2>
                    <p className="text-gray-500 mb-6">Mã xác nhận của bạn</p>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-6 py-4 mb-6">
                        <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Mã xác nhận</p>
                        <p className="text-2xl font-black text-indigo-700 tracking-widest">{confirmCode}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-left text-sm text-gray-600 mb-6 space-y-1">
                        <p><span className="font-semibold">Khách:</span> {form.guestFullName}</p>
                        <p><span className="font-semibold">Email:</span> {form.guestEmail}</p>
                        <p><span className="font-semibold">Nhận phòng:</span> {form.checkInDate} <span className="text-blue-600 font-medium">từ 14:00</span></p>
                        <p><span className="font-semibold">Trả phòng:</span> {form.checkOutDate} <span className="text-orange-500 font-medium">trước 12:00</span></p>
                        <p><span className="font-semibold">Số đêm:</span> {nights} đêm</p>
                        <p><span className="font-semibold">Tổng tiền:</span> {total.toLocaleString("vi-VN")} ₫</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/my-bookings")}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Xem lịch sử đặt phòng
                        </button>
                        <button
                            onClick={() => navigate("/hotels")}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 font-['Outfit']">
            <MenuBar />
            <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(`/hotels/${hotelId}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 text-sm font-medium mb-6 transition-colors"
                >
                    <i className="bi bi-arrow-left" /> Quay lại khách sạn
                </button>

                <h1 className="text-3xl font-black text-gray-900 mb-8">Đặt phòng</h1>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
                        {/* Guest info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-person-circle text-indigo-500" /> Thông tin khách
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="guestFullName"
                                        value={form.guestFullName}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn A"
                                        className={`w-full border ${errors.guestFullName ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                    {errors.guestFullName && <p className="text-red-500 text-xs mt-1">{errors.guestFullName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="guestEmail"
                                        type="email"
                                        value={form.guestEmail}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                        className={`w-full border ${errors.guestEmail ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                    {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-calendar3 text-indigo-500" /> Ngày lưu trú
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Nhận phòng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="checkInDate"
                                        type="date"
                                        value={form.checkInDate}
                                        min={minCheckIn}
                                        onChange={handleChange}
                                        className={`w-full border ${errors.checkInDate ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                    {errors.checkInDate && <p className="text-red-500 text-xs mt-1">{errors.checkInDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Trả phòng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="checkOutDate"
                                        type="date"
                                        value={form.checkOutDate}
                                        min={form.checkInDate || today()}
                                        onChange={handleChange}
                                        className={`w-full border ${errors.checkOutDate ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                    {errors.checkOutDate && <p className="text-red-500 text-xs mt-1">{errors.checkOutDate}</p>}
                                </div>
                            </div>
                            {nights > 0 && (
                                <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                    <i className="bi bi-moon-stars text-indigo-500" />
                                    <span className="text-sm text-indigo-700 font-semibold">{nights} đêm lưu trú</span>
                                </div>
                            )}
                        </div>

                        {/* Guests */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-people text-indigo-500" /> Số lượng khách
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Người lớn <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="numOfAdults"
                                        value={form.numOfAdults}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    {errors.numOfAdults && <p className="text-red-500 text-xs mt-1">{errors.numOfAdults}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trẻ em</label>
                                    <select
                                        name="numOfChildren"
                                        value={form.numOfChildren}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>
                            {room?.maxGuests > 0 && (form.numOfAdults + form.numOfChildren) > room.maxGuests && (
                                <p className="text-amber-600 text-xs mt-3 flex items-center gap-1">
                                    <i className="bi bi-exclamation-triangle" />
                                    Phòng chỉ tối đa {room.maxGuests} khách
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base"
                        >
                            {submitting ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                            ) : (
                                <><i className="bi bi-calendar-check" /> Xác nhận đặt phòng</>
                            )}
                        </button>
                    </form>

                    {/* Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h2 className="font-bold text-gray-900 mb-5">Tóm tắt đặt phòng</h2>

                            {room && (
                                <>
                                    {/* Room preview */}
                                    <div className="bg-indigo-50 rounded-xl p-4 mb-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                                {room.photo ? (
                                                    <img src={`data:image/jpeg;base64,${room.photo}`} alt="" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <i className="bi bi-door-open text-indigo-500 text-lg" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{room.roomType}</p>
                                                {room.roomNumber && <p className="text-xs text-gray-500">Phòng #{room.roomNumber}</p>}
                                                {room.hotelName && <p className="text-xs text-indigo-600">{room.hotelName}</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                            {room.numBeds > 0 && <span className="bg-white rounded-lg px-2 py-1"><i className="bi bi-lamp mr-1" />{room.numBeds} giường</span>}
                                            {room.maxGuests > 0 && <span className="bg-white rounded-lg px-2 py-1"><i className="bi bi-people mr-1" />tối đa {room.maxGuests}</span>}
                                            {room.area > 0 && <span className="bg-white rounded-lg px-2 py-1"><i className="bi bi-aspect-ratio mr-1" />{room.area} m²</span>}
                                        </div>
                                    </div>

                                    {/* Price breakdown */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>{Number(room.roomPrice).toLocaleString("vi-VN")} ₫ × {nights} đêm</span>
                                            <span>{(Number(room.roomPrice) * nights).toLocaleString("vi-VN")} ₫</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Phí dịch vụ</span>
                                            <span className="text-emerald-600">Miễn phí</span>
                                        </div>
                                        <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-base">
                                            <span>Tổng cộng</span>
                                            <span className="text-indigo-600">{total.toLocaleString("vi-VN")} ₫</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
                                            <i className="bi bi-box-arrow-in-right text-blue-500 text-sm shrink-0" />
                                            <div>
                                                <p className="text-xs text-blue-400">Nhận phòng</p>
                                                <p className="text-sm font-bold text-blue-700">Từ 14:00</p>
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2">
                                            <i className="bi bi-box-arrow-right text-orange-500 text-sm shrink-0" />
                                            <div>
                                                <p className="text-xs text-orange-400">Trả phòng</p>
                                                <p className="text-sm font-bold text-orange-600">Trước 12:00</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-xs text-amber-700 flex items-start gap-1.5">
                                            <i className="bi bi-info-circle shrink-0 mt-0.5" />
                                            Thanh toán tại quầy lễ tân khi nhận phòng. Huỷ miễn phí trước ngày nhận phòng.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookRoom
