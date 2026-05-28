import { useEffect, useState } from "react"
import { getAllHotelsAdmin, deleteHotel } from "../../api/hotelApi"
import { getRoomsByHotelId, addRoomToHotel, deleteRoomFromHotel } from "../../api/roomApi"
import HotelForm from "./HotelForm"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import ConfirmDialog from "../admin/ConfirmDialog"

const HOTEL_TYPE_LABEL = { HOTEL: "Khách sạn", RESORT: "Resort", HOMESTAY: "Homestay" }
const HOTEL_TYPE_COLOR = {
    HOTEL: "bg-blue-100 text-blue-700",
    RESORT: "bg-emerald-100 text-emerald-700",
    HOMESTAY: "bg-amber-100 text-amber-700",
}
const ROOM_TYPES = ["Phòng đơn", "Phòng đôi", "Phòng Twin", "Suite", "Deluxe", "Phòng gia đình"]

const EMPTY_ROOM_FORM = { roomType: "", roomPrice: "", roomNumber: "", maxGuests: 2, numBeds: 1, area: "", description: "", photo: null }

const HotelManagement = () => {
    const navigate = useNavigate()
    const [hotels, setHotels] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [view, setView] = useState("list") // "list" | "add" | "edit" | "manage-rooms"
    const [editingHotel, setEditingHotel] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    // Room management state
    const [managingHotel, setManagingHotel] = useState(null)
    const [hotelRooms, setHotelRooms] = useState([])
    const [roomsLoading, setRoomsLoading] = useState(false)
    const [roomForm, setRoomForm] = useState(EMPTY_ROOM_FORM)
    const [roomPhotoPreview, setRoomPhotoPreview] = useState(null)
    const [addingRoom, setAddingRoom] = useState(false)
    const [deletingRoomId, setDeletingRoomId] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", variant: "danger", onConfirm: () => {} })

    const fetchHotels = () => {
        setLoading(true)
        getAllHotelsAdmin()
            .then(setHotels)
            .catch(e => toast.error(e.message))
            .finally(() => setLoading(false))
    }

    const fetchHotelRooms = (hotelId) => {
        setRoomsLoading(true)
        getRoomsByHotelId(hotelId)
            .then(setHotelRooms)
            .catch(() => setHotelRooms([]))
            .finally(() => setRoomsLoading(false))
    }

    useEffect(() => { fetchHotels() }, [])

    const handleDelete = (hotel) => {
        setConfirmDialog({
            open: true,
            title: `Xoá khách sạn "${hotel.name}"?`,
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingId(hotel.id)
                try {
                    await deleteHotel(hotel.id)
                    toast.success("Đã xoá khách sạn")
                    fetchHotels()
                } catch (e) {
                    toast.error(e.message)
                } finally {
                    setDeletingId(null)
                }
            }
        })
    }

    const handleManageRooms = (hotel) => {
        setManagingHotel(hotel)
        fetchHotelRooms(hotel.id)
        setView("manage-rooms")
    }

    // After create: go to room management for the new hotel
    const handleCreateSuccess = (hotel) => {
        fetchHotels()
        if (hotel?.id) {
            handleManageRooms(hotel)
        } else {
            setView("list")
        }
    }

    // After edit: go back to list
    const handleEditSuccess = () => {
        setView("list")
        setEditingHotel(null)
        fetchHotels()
    }

    const handleAddRoom = async (e) => {
        e.preventDefault()
        if (!roomForm.roomType.trim() || !roomForm.roomPrice) {
            toast.error("Vui lòng nhập loại phòng và giá")
            return
        }
        setAddingRoom(true)
        try {
            await addRoomToHotel(managingHotel.id, {
                roomType: roomForm.roomType,
                roomPrice: Number(roomForm.roomPrice),
                roomNumber: roomForm.roomNumber || null,
                maxGuests: Number(roomForm.maxGuests) || 2,
                numBeds: Number(roomForm.numBeds) || 1,
                area: roomForm.area ? Number(roomForm.area) : null,
                description: roomForm.description || null,
                photo: roomForm.photo || null,
            })
            toast.success("Thêm phòng thành công!")
            setRoomForm(EMPTY_ROOM_FORM)
            setRoomPhotoPreview(null)
            fetchHotelRooms(managingHotel.id)
            fetchHotels()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setAddingRoom(false)
        }
    }

    const handleDeleteRoom = (roomId) => {
        setConfirmDialog({
            open: true,
            title: "Xoá phòng này?",
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingRoomId(roomId)
                try {
                    await deleteRoomFromHotel(managingHotel.id, roomId)
                    toast.success("Đã xoá phòng")
                    fetchHotelRooms(managingHotel.id)
                    fetchHotels()
                } catch (e) {
                    toast.error(e.message)
                } finally {
                    setDeletingRoomId(null)
                }
            }
        })
    }

    const filtered = hotels.filter(h => {
        const q = search.toLowerCase()
        return !q || h.name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q)
    })

    // ── Add / Edit hotel ──────────────────────────────────────────
    if (view === "add" || view === "edit") {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { setView("list"); setEditingHotel(null) }}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                        <i className="bi bi-arrow-left" /> Quay lại
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">
                        {view === "add" ? "Thêm khách sạn mới" : `Chỉnh sửa: ${editingHotel?.name}`}
                    </h2>
                </div>
                <HotelForm
                    hotel={editingHotel}
                    onSuccess={view === "add" ? handleCreateSuccess : handleEditSuccess}
                    onCancel={() => { setView("list"); setEditingHotel(null) }}
                />
            </div>
        )
    }

    // ── Manage rooms for a hotel ─────────────────────────────────
    if (view === "manage-rooms" && managingHotel) {
        return (
            <div>
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { setView("list"); setManagingHotel(null); setHotelRooms([]) }}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                        <i className="bi bi-arrow-left" /> Quay lại danh sách
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Quản lý phòng</h2>
                        <p className="text-sm text-sky-600 font-medium">{managingHotel.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Room list */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">
                                    Danh sách phòng
                                    <span className="ml-2 text-sm font-normal text-gray-400">({hotelRooms.length} phòng)</span>
                                </h3>
                                <button
                                    onClick={() => navigate(`/hotels/${managingHotel.id}`)}
                                    className="text-xs text-sky-600 hover:underline flex items-center gap-1"
                                >
                                    <i className="bi bi-eye" /> Xem trang khách sạn
                                </button>
                            </div>
                            {roomsLoading ? (
                                <div className="flex justify-center py-12">
                                    <span className="w-7 h-7 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin" />
                                </div>
                            ) : hotelRooms.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="bi bi-door-closed text-4xl block mb-2" />
                                    <p className="text-sm">Chưa có phòng nào. Hãy thêm phòng đầu tiên!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {hotelRooms.map(room => (
                                        <div key={room.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-gray-900 text-sm">{room.roomType}</span>
                                                    {room.roomNumber && <span className="text-xs text-gray-400">#{room.roomNumber}</span>}
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        room.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" :
                                                        room.status === "BOOKED" ? "bg-red-100 text-red-600" :
                                                        "bg-amber-100 text-amber-700"
                                                    }`}>
                                                        {room.status === "AVAILABLE" ? "Trống" : room.status === "BOOKED" ? "Đã đặt" : "Bảo trì"}
                                                    </span>
                                                </div>
                                                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                                    <span>{Number(room.roomPrice).toLocaleString("vi-VN")} ₫/đêm</span>
                                                    {room.maxGuests > 0 && <span>{room.maxGuests} khách</span>}
                                                    {room.numBeds > 0 && <span>{room.numBeds} giường</span>}
                                                    {room.area > 0 && <span>{room.area} m²</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRoom(room.id)}
                                                disabled={deletingRoomId === room.id}
                                                className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 p-1.5 rounded-lg hover:bg-red-50"
                                            >
                                                {deletingRoomId === room.id
                                                    ? <span className="w-4 h-4 border border-red-400/30 border-t-red-500 rounded-full animate-spin inline-block" />
                                                    : <i className="bi bi-trash3" />
                                                }
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add room form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="bi bi-plus-circle text-sky-500" /> Thêm phòng mới
                            </h3>
                            <form onSubmit={handleAddRoom} className="space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Loại phòng *</label>
                                    <input
                                        list="room-type-list"
                                        value={roomForm.roomType}
                                        onChange={e => setRoomForm(f => ({ ...f, roomType: e.target.value }))}
                                        placeholder="Phòng đôi, Suite..."
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                    <datalist id="room-type-list">
                                        {ROOM_TYPES.map(t => <option key={t} value={t} />)}
                                    </datalist>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Số phòng</label>
                                        <input
                                            value={roomForm.roomNumber}
                                            onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))}
                                            placeholder="101, A01..."
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Giá/đêm (₫) *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={roomForm.roomPrice}
                                            onChange={e => setRoomForm(f => ({ ...f, roomPrice: e.target.value }))}
                                            placeholder="500000"
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Sức chứa</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={roomForm.maxGuests}
                                            onChange={e => setRoomForm(f => ({ ...f, maxGuests: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Giường</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={roomForm.numBeds}
                                            onChange={e => setRoomForm(f => ({ ...f, numBeds: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Diện tích (m²)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={roomForm.area}
                                            onChange={e => setRoomForm(f => ({ ...f, area: e.target.value }))}
                                            placeholder="25"
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả</label>
                                    <textarea
                                        value={roomForm.description}
                                        onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))}
                                        rows={2}
                                        placeholder="Phòng view biển, có ban công..."
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Ảnh phòng</label>
                                    <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-sky-400 hover:bg-sky-50/20 transition-all">
                                        {roomPhotoPreview ? (
                                            <img src={roomPhotoPreview} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                                        ) : (
                                            <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                <i className="bi bi-image text-gray-400 text-lg" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-600 truncate">
                                                {roomForm.photo ? roomForm.photo.name : "Chọn ảnh phòng"}
                                            </p>
                                            <p className="text-xs text-gray-400">PNG, JPG (không bắt buộc)</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files[0]
                                                if (!file) return
                                                setRoomForm(f => ({ ...f, photo: file }))
                                                setRoomPhotoPreview(URL.createObjectURL(file))
                                            }}
                                        />
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    disabled={addingRoom}
                                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    {addingRoom
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang thêm...</>
                                        : <><i className="bi bi-plus-lg" /> Thêm phòng</>
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={v => setConfirmDialog(s => ({ ...s, open: v }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
            />
            </div>
        )
    }

    // ── Hotel list ────────────────────────────────────────────────
    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm khách sạn..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                <button
                    onClick={() => setView("add")}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shrink-0"
                >
                    <i className="bi bi-plus-circle" /> Thêm khách sạn
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Tổng", value: hotels.length, icon: "bi-building", color: "text-sky-600 bg-sky-50" },
                    { label: "Hoạt động", value: hotels.filter(h => h.active !== false).length, icon: "bi-check-circle", color: "text-emerald-600 bg-emerald-50" },
                    { label: "Tạm đóng", value: hotels.filter(h => h.active === false).length, icon: "bi-pause-circle", color: "text-amber-600 bg-amber-50" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                            <i className={`bi ${s.icon}`} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="w-8 h-8 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <i className="bi bi-building-x text-4xl text-gray-300 block mb-2" />
                    <p className="text-gray-500">Không tìm thấy khách sạn</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">Khách sạn</th>
                                    <th className="px-5 py-3 text-left">Loại / Sao</th>
                                    <th className="px-5 py-3 text-left">Thành phố</th>
                                    <th className="px-5 py-3 text-left">Phòng</th>
                                    <th className="px-5 py-3 text-left">Trạng thái</th>
                                    <th className="px-5 py-3 text-left">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(hotel => (
                                    <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900 text-sm">{hotel.name}</p>
                                            {hotel.address && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{hotel.address}</p>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${HOTEL_TYPE_COLOR[hotel.hotelType] || "bg-gray-100 text-gray-600"}`}>
                                                {HOTEL_TYPE_LABEL[hotel.hotelType] || hotel.hotelType}
                                            </span>
                                            <div className="flex mt-1.5 gap-0.5">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <i key={i} className={`bi bi-star${i < hotel.starRating ? "-fill text-amber-400" : " text-gray-200"} text-xs`} />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{hotel.city}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{hotel.totalRooms}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${hotel.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                {hotel.active !== false ? "Hoạt động" : "Tạm đóng"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/hotels/${hotel.id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                                    title="Xem"
                                                >
                                                    <i className="bi bi-eye" />
                                                </button>
                                                <button
                                                    onClick={() => handleManageRooms(hotel)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Quản lý phòng"
                                                >
                                                    <i className="bi bi-door-open" />
                                                </button>
                                                <button
                                                    onClick={() => { setEditingHotel(hotel); setView("edit") }}
                                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <i className="bi bi-pencil" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(hotel)}
                                                    disabled={deletingId === hotel.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Xoá"
                                                >
                                                    {deletingId === hotel.id
                                                        ? <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-500 rounded-full animate-spin inline-block" />
                                                        : <i className="bi bi-trash3" />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={v => setConfirmDialog(s => ({ ...s, open: v }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                onConfirm={confirmDialog.onConfirm}
            />
        </div>
    )
}

export default HotelManagement
