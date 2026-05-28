import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRooms, deleteRoom } from '../../api/roomApi'
import { toast } from 'react-toastify'
import ConfirmDialog from '../admin/ConfirmDialog'

const ROOMS_PER_PAGE = 8

const ExistingRoom = () => {
    const navigate = useNavigate()
    const [rooms, setRooms] = useState([])
    const [filtered, setFiltered] = useState([])
    const [typeFilter, setTypeFilter] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", description: "", variant: "danger", onConfirm: () => {} })

    useEffect(() => { fetchRooms() }, [])

    useEffect(() => {
        setFiltered(typeFilter ? rooms.filter(r => r.roomType === typeFilter) : rooms)
        setCurrentPage(1)
    }, [rooms, typeFilter])

    const fetchRooms = async () => {
        setLoading(true)
        try {
            setRooms(await getAllRooms())
        } catch (e) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (roomId) => {
        setConfirmDialog({
            open: true,
            title: `Xoá phòng #${roomId}?`,
            description: "Hành động này không thể hoàn tác.",
            variant: "danger",
            onConfirm: async () => {
                setConfirmDialog(s => ({ ...s, open: false }))
                setDeletingId(roomId)
                try {
                    await deleteRoom(roomId)
                    toast.success(`Đã xoá phòng #${roomId}`)
                    fetchRooms()
                } catch (e) {
                    toast.error(e.message)
                } finally {
                    setDeletingId(null)
                }
            }
        })
    }

    const totalPages = Math.ceil(filtered.length / ROOMS_PER_PAGE)
    const paginatedRooms = filtered.slice(
        (currentPage - 1) * ROOMS_PER_PAGE,
        currentPage * ROOMS_PER_PAGE
    )
    const roomTypes = [...new Set(rooms.map(r => r.roomType).filter(Boolean))]

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
                >
                    <option value="">Tất cả loại phòng</option>
                    {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {typeFilter && (
                    <button
                        onClick={() => setTypeFilter("")}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-xl transition-colors"
                    >
                        Xoá lọc
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <span className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <i className="bi bi-door-closed text-4xl block mb-2" />
                    <p className="text-sm">Không có phòng nào</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 text-left">ID</th>
                                        <th className="px-5 py-3 text-left">Số phòng</th>
                                        <th className="px-5 py-3 text-left">Loại phòng</th>
                                        <th className="px-5 py-3 text-left">Giá (₫/đêm)</th>
                                        <th className="px-5 py-3 text-left">Trạng thái</th>
                                        <th className="px-5 py-3 text-left">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedRooms.map(room => (
                                        <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 text-sm text-gray-400">#{room.id}</td>
                                            <td className="px-5 py-4 text-sm font-medium text-gray-800">{room.roomNumber || '-'}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{room.roomType}</td>
                                            <td className="px-5 py-4 text-sm font-semibold text-indigo-600">
                                                {Number(room.roomPrice).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    room.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                                                    room.status === 'BOOKED'    ? 'bg-red-100 text-red-600' :
                                                                                  'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {room.status === 'AVAILABLE' ? 'Còn trống' :
                                                     room.status === 'BOOKED'    ? 'Đã đặt' : 'Bảo trì'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/edit-room/${room.id}`)}
                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(room.id)}
                                                        disabled={deletingId === room.id}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Xoá"
                                                    >
                                                        {deletingId === room.id
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between text-sm">
                            <p className="text-gray-500">
                                Trang {currentPage}/{totalPages} · {filtered.length} phòng
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <i className="bi bi-chevron-left" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`px-3 py-1.5 rounded-lg border transition-colors ${currentPage === p ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                >
                                    <i className="bi bi-chevron-right" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
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

export default ExistingRoom
